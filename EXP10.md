# Experiment 10: CI/CD Deployment with GitHub Actions + Render/Vercel

## 1. Aim

To add an automated CI/CD workflow for the RepRank full-stack application and prepare
a split production deployment:

- **Frontend:** React + Vite multi-page app deployed as a static site on Vercel.
- **Backend:** Node.js + Express + Socket.IO API deployed as a web service on Render.
- **Database:** the existing MongoDB Atlas cluster.
- **CI:** GitHub Actions builds the frontend and validates the backend on every push to
  `main` or `exp10` and on pull requests targeting `main`.

The Experiment 8 chat, Experiment 9 Docker/Compose setup, JWT authentication, REST API,
MongoDB persistence, and existing multi-page routes must continue to work.

## 2. Theory

### 2.1 Continuous Integration and Continuous Deployment

**Continuous Integration (CI)** automatically installs dependencies, builds the
application, and runs checks whenever code is pushed or a pull request is opened. This
catches syntax errors, broken lockfiles, and build regressions before they reach `main`.

**Continuous Deployment (CD)** takes a successful build from the repository and deploys it
to hosting platforms. In this experiment:

- Vercel builds the frontend from the repository root and serves the generated `dist/`.
- Render builds the backend from the `backend/` directory and runs `npm start`.
- GitHub Actions validates the same repository structure but does not deploy or require
  production credentials.

### 2.2 Split-origin deployment

Local development uses the Vite dev server as a same-origin proxy:

```text
Browser -> http://localhost:5173/api/*       -> Vite proxy -> http://localhost:5002
Browser -> http://localhost:5173/socket.io/* -> Vite proxy -> http://localhost:5002
```

Docker Compose keeps the same pattern, with the proxy target changed to the Compose
service name `backend`:

```text
Browser -> http://localhost:8080/api/*       -> Vite proxy -> http://backend:5002
Browser -> http://localhost:8080/socket.io/* -> Vite proxy -> http://backend:5002
```

Vercel serves only static files, so the deployed frontend must call the Render backend
directly:

```text
Browser -> Vercel static frontend
        -> https://<render-backend>/api/*       (REST)
        -> https://<render-backend>/socket.io/* (Socket.IO, WebSocket + polling)
```

Because the frontend and backend are on different origins, the backend must explicitly
allow the Vercel origin for both REST CORS and Socket.IO. The existing allow-list never
uses `*` and is configured through `CLIENT_ORIGINS`.

### 2.3 Build-time frontend environment variables

Vite exposes variables prefixed with `VITE_` to browser code at **build time**. They are
public values embedded in the generated JavaScript and must never contain secrets.

- `VITE_API_BASE_URL` points the REST client at the Render backend.
- `VITE_SOCKET_URL` optionally points Socket.IO at a different host. If it is unset, the
  frontend reuses `VITE_API_BASE_URL`.
- When both are unset, requests remain relative and continue to use the Vite proxy, so
  local development and Docker are unchanged.

The existing Docker variable `VITE_API_URL` is a **Vite dev-server proxy target**, not a
public browser API URL. It is intentionally separate from `VITE_API_BASE_URL`.

## 3. Architecture

```text
                         GitHub repository (branch: exp10)
                         |                         |
                  push / pull request        Vercel Git integration
                         |                         |
                         v                         v
                 GitHub Actions             Frontend build (dist/)
                 - npm ci (root)                   |
                 - npm run build                   v
                 - npm ci (backend)          Vercel static site
                 - node --check                    |
                 - tests if present                | REST + Socket.IO
                         |                         v
                         |                  Render web service
                         |                  - backend/ root directory
                         |                  - npm ci --omit=dev
                         |                  - npm start
                         |                         |
                         v                         v
                 workflow status            MongoDB Atlas
```

## 4. Implementation

| File | Change | Purpose |
| --- | --- | --- |
| `.github/workflows/ci.yml` | Added | Runs CI on pushes to `main`/`exp10` and pull requests to `main`. |
| `src/services/runtimeConfig.js` | Added | Resolves optional `VITE_API_BASE_URL` and `VITE_SOCKET_URL` without hardcoding production URLs. |
| `src/services/api.js` | Modified | Builds the workouts REST base URL through the runtime config. |
| `src/services/auth.js` | Modified | Builds the authentication REST base URL through the runtime config. |
| `src/services/chatSocket.js` | Modified | Connects Socket.IO to the configured backend when present, otherwise same-origin. |
| `backend/server.js` | Preserved from prior fix | One shared CORS allow-list for Express and Socket.IO using `resolveAllowedOrigins()`. |
| `backend/.env.example` | Modified | Documents `HOST` and `CLIENT_ORIGINS` variable names without real values. |
| `render.yaml` | Added | Reproducible Render Blueprint for the backend, including required environment-variable names. |
| `EXP10.md` | Added | Experiment documentation, deployment steps, verification, and troubleshooting. |

### 4.1 CI workflow

The workflow uses Node.js 20, matching the Node 20 images used by the Dockerfiles.

It performs:

1. `actions/checkout`
2. `actions/setup-node` with npm caching for both lockfiles
3. `npm ci` in the repository root
4. `npm run build` for the multi-page Vite frontend
5. `npm ci` in `backend/`
6. `node --check server.js` plus syntax checks for the remaining backend `.js` files
7. `npm test --if-present` for frontend and backend

No test scripts currently exist, so `--if-present` is used instead of inventing tests.
The workflow does not connect to MongoDB, does not use JWT secrets, and does not deploy.

### 4.2 Frontend deployment preparation

The runtime configuration preserves all nine Vite HTML entry points:

- `index.html`
- `login.html`
- `register.html`
- `dashboard.html`
- `workout.html`
- `challenges.html`
- `leaderboard.html`
- `profile.html`
- `chat.html`

No `vercel.json` is required. Vercel's Vite preset runs `npm run build` and serves
`dist/`; the generated `.html` files are static routes. Adding an SPA fallback rewrite
would be wrong for this multi-page application.

### 4.3 Backend deployment preparation

The backend already:

- reads `process.env.PORT`
- binds to `process.env.HOST || '0.0.0.0'`
- shares one HTTP server between Express and Socket.IO
- exposes `GET /api/health`
- restricts REST CORS and Socket.IO to exact origins
- serves the JWT-protected user routes and workout REST routes unchanged

Render supplies `PORT` at runtime. No port or host code change is needed.

`render.yaml` sets the service root to `backend`, runs `npm ci --omit=dev`, starts with
`npm start`, and uses `/api/health` as the health check. The health endpoint returns `503`
until MongoDB is actually connected, so a database problem is reported honestly instead
of marking the service healthy while its API is unusable.

## 5. Required environment variables

Never commit real values to the repository. Configure them in the Render and Vercel
dashboards.

### 5.1 Render backend

| Variable name | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB Atlas connection string. Secret. |
| `JWT_SECRET` | Yes | Secret used to sign and verify login tokens. |
| `ADMIN_CREATION_SECRET` | Yes for admin creation | Server-side secret checked by the admin registration endpoint. |
| `CLIENT_ORIGINS` | Yes for production frontend | Comma-separated exact frontend origins allowed for REST CORS and Socket.IO. |
| `NODE_ENV` | Yes | Set to the production mode by `render.yaml`. |
| `PORT` | Supplied by Render | Render injects the listening port automatically. |
| `HOST` | Optional | Defaults to `0.0.0.0`; keep the default for Render. |

`CLIENT_ORIGINS` examples must be exact origins: scheme plus host, no path and no trailing
slash. Do not use `*`. If both a production Vercel domain and a preview domain are needed,
list both as comma-separated values. `render.yaml` marks secret values as `sync: false`, so
Render prompts for them instead of storing values in Git.

### 5.2 Vercel frontend

| Variable name | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes for split deployment | Public Render backend origin used for REST requests. |
| `VITE_SOCKET_URL` | Optional | Public Socket.IO origin when it differs from the REST origin. |

These values are public build-time configuration and must not contain secrets. They are
embedded in the static bundle; changing them requires a new Vercel deployment.

### 5.3 Local development and Docker

No new variable is required:

- Local dev leaves `VITE_API_BASE_URL` and `VITE_SOCKET_URL` unset and uses the Vite
  proxy at `http://localhost:5002`.
- Docker Compose continues to set `VITE_API_URL=http://backend:5002` for the Vite dev
  proxy. Browser code stays same-origin and never receives the Docker hostname `backend`.

## 6. Local verification

Run from the repository root unless noted.

```bash
npm ci
npm run build
node --check backend/server.js

cd backend
npm ci
node --check server.js
```

Useful runtime checks without MongoDB or production credentials:

```bash
# Start the API without Atlas for route/CORS/Socket.IO checks.
# Do not print or commit the contents of backend/.env.
cd backend
MONGO_URI= PORT=5199 HOST=127.0.0.1 node server.js
```

Then, from another terminal:

```bash
curl -i -H 'Origin: http://localhost:5173' http://127.0.0.1:5199/
curl -i -X OPTIONS \
  -H 'Origin: http://localhost:5173' \
  -H 'Access-Control-Request-Method: GET' \
  http://127.0.0.1:5199/api/workouts
curl -i http://127.0.0.1:5199/api/health
```

Expected behavior:

- Allowed local origins return `Access-Control-Allow-Origin` for REST.
- Socket.IO handshakes with an allowed origin succeed.
- Socket.IO handshakes with an unknown origin return `403`.
- `/api/health` returns `503` when MongoDB is intentionally unavailable and `200` only
  when the database is connected.
- `node --check` and `git diff --check` exit successfully.

## 7. GitHub Actions setup

The workflow file is committed with the repository. No repository secrets are needed for
CI.

1. Push the `exp10` branch to GitHub.
2. Open the repository's **Actions** tab.
3. Confirm the **CI** workflow runs for the push.
4. Open the run and verify the frontend build and backend syntax checks are green.
5. Open a pull request targeting `main` and confirm the same workflow runs for the PR.

The workflow intentionally does not deploy. Render and Vercel deploy from their own Git
integrations.

## 8. Render backend deployment

### 8.1 Prerequisites

- A Render account.
- A MongoDB Atlas cluster.
- The Atlas cluster's network access configured to allow Render connections. Do not
  disable Atlas authentication or use a public database.
- A verified backend source branch selected in Render.

### 8.2 Blueprint deployment

1. Push the repository, including `render.yaml`, to GitHub.
2. In Render, choose **New > Blueprint** and connect the repository.
3. Select the `exp10` branch if deploying the lab branch before merging.
4. Review the service created from `render.yaml`.
5. Enter values for the environment variables marked as requiring manual input:
   `MONGO_URI`, `JWT_SECRET`, `ADMIN_CREATION_SECRET`, and `CLIENT_ORIGINS`.
6. Deploy the service.
7. Copy the public Render backend origin for the Vercel configuration.

### 8.3 Manual web-service setup instead of a Blueprint

Use these settings if creating the service manually:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root directory | `backend` |
| Build command | `npm ci --omit=dev` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Add the environment-variable names from section 5.1. Do not add a hard-coded `PORT`.

### 8.4 Render verification

- `GET /` returns the API running message.
- `GET /api/health` returns `200` with a connected database, or `503` while Atlas is
  unreachable.
- A REST preflight request from the exact Vercel origin includes
  `Access-Control-Allow-Origin`.
- A Socket.IO handshake from the exact Vercel origin succeeds; an unknown origin gets
  `403`.
- Login, workout CRUD, profile loading, and chat still work from the deployed frontend.

## 9. Vercel frontend deployment

### 9.1 Project settings

1. In Vercel, import the same GitHub repository.
2. Set the project root to the repository root. There is no `frontend/` directory.
3. Use the Vite framework preset or these explicit settings:
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add the environment-variable names from section 5.2 for the Production environment.
   Add them to Preview as well only if preview deployments need to call the backend.
5. Deploy the `exp10` branch or the merged `main` branch.

Do not add backend secrets to Vercel. The frontend only receives public URLs.

### 9.2 Vercel verification

Open every generated page directly, not only by clicking through the site:

```text
/
/index.html
/login.html
/register.html
/dashboard.html
/workout.html
/challenges.html
/leaderboard.html
/profile.html
/chat.html
```

Check the browser Network panel to confirm REST requests go to the Render origin and
Socket.IO connects to the Render origin over HTTPS/WSS. Confirm login, workout CRUD, and
two-client chat still work.

## 10. End-to-end deployment order

1. Deploy the backend on Render and configure its environment-variable names.
2. Verify the Render health endpoint and CORS using the eventual Vercel origin.
3. Set `CLIENT_ORIGINS` on Render to the exact Vercel production origin.
4. Deploy the frontend on Vercel with `VITE_API_BASE_URL` and, if needed,
   `VITE_SOCKET_URL`.
5. Re-deploy the frontend after any environment-variable change because Vite embeds them
   at build time.
6. Run the verification checklist from sections 6, 8.4, and 9.2.

If the Vercel origin is not known until after the first deployment, deploy once, copy the
production origin, add it to `CLIENT_ORIGINS`, and restart/redeploy the Render service.

## 11. Troubleshooting

### GitHub Actions fails during `npm ci`

- Confirm both `package-lock.json` and `backend/package-lock.json` are committed.
- Do not use `npm install` in CI; it can silently rewrite dependency resolution.
- Ensure the lockfiles were generated with a compatible npm version.

### GitHub Actions fails during the frontend build

- Run `npm run build` locally and fix the reported source error.
- Confirm every HTML entry listed in `vite.config.js` still exists.
- Do not add production secrets to CI just to make a build pass.

### Backend fails to start in CI

- Run `node --check backend/server.js` and fix the reported file/line.
- Check for duplicate declarations or malformed imports.

### Browser shows a CORS error against Render

- Add the exact frontend origin to `CLIENT_ORIGINS`.
- Include the scheme, use no path, and use no trailing slash.
- For multiple origins, use a comma-separated list.
- Vercel preview deployments use different origins; add the specific preview origin or
  disable preview-to-backend access.
- Do not solve this by allowing `*`.

### Socket.IO returns `403` during the handshake

- The Socket.IO origin guard is working. Add the exact browser origin to
  `CLIENT_ORIGINS`.
- Confirm `VITE_SOCKET_URL` (or the fallback `VITE_API_BASE_URL`) points at Render, not
  at the Vercel static host.

### Frontend still calls `/api` on Vercel

- `VITE_API_BASE_URL` was missing during the Vercel build, or the project was not
  redeployed after adding it.
- Trigger a new deployment after changing any `VITE_*` variable.

### `/api/health` returns `503` on Render

- MongoDB Atlas is unreachable or `MONGO_URI` is missing/invalid.
- Check Atlas network access and credentials without printing the connection string.
- The health endpoint intentionally reports `503` until the database is connected.

### Render deployment is marked unhealthy

- The health check uses `/api/health`, which depends on MongoDB.
- Fix the Atlas connection first. A running Node process alone is not considered healthy.

### Docker no longer works

- Docker Compose must keep setting `VITE_API_URL` for the Vite proxy target.
- Do not replace `VITE_API_URL` with `VITE_API_BASE_URL` in Compose; the latter would
  expose the container-only hostname to the browser.
- Re-run `docker compose config --quiet` and start the services as documented in
  `DOCKER.md`.

### Vercel page returns `404`

- Confirm the file exists in `dist/` after `npm run build`.
- Open the `.html` path directly.
- Do not add an SPA fallback that rewrites every route to `index.html`; this is a
  multi-page site.

### Render free instance is slow on first request

- Free web services may spin down after inactivity. The first request after idling can be
  slow while the service starts. This is a hosting limitation, not an application bug.

## 12. Limitations

- Deployment is not performed by this repository change; Render and Vercel account setup,
  environment variables, and deployment clicks remain manual.
- CI does not run integration tests against MongoDB, Socket.IO, or a real browser because
  no such test suite exists and CI must not require production credentials.
- CORS and Socket.IO use exact origins only. Wildcards are deliberately not supported.
- Vercel preview deployments need their own exact origins added to `CLIENT_ORIGINS` if
  they must reach the backend.
- Chat history remains in memory. Multiple Render instances would require shared state
  and Socket.IO adapter/sticky-session configuration; this lab uses one instance.
- The Render health check intentionally depends on MongoDB, so an Atlas outage prevents
  the service from being marked healthy.
- No `vercel.json` is used because Vercel's Vite preset and static multi-page output
  already provide the required behavior.

## 13. Screenshot checklist for submission

1. GitHub **Actions** tab showing the CI workflow triggered by the `exp10` push.
2. Green CI run showing frontend install/build and backend install/syntax-check steps.
3. GitHub pull request targeting `main` with the CI check attached.
4. Render service dashboard showing the deployed service and a live status.
5. Render environment-variable **names** with values hidden or redacted.
6. Render logs showing the server starting and listening on the Render-provided port.
7. Render health endpoint response (`/api/health`) with the database state visible.
8. Vercel deployment success screen and build log for `npm run build`.
9. Vercel environment-variable **names** with values hidden or redacted.
10. Vercel site loaded at the production URL, plus at least three distinct `.html` pages.
11. Browser Network panel showing a REST request to the Render origin with a successful
    CORS response.
12. Chat page connected to Render with two browser sessions exchanging messages.
13. Login and workout CRUD working against the deployed backend.
14. Optional Docker regression screenshot showing the Exp9 Compose stack still running.
