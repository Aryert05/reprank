# RepRank

RepRank is a gamified workout and fitness-tracking web application built as a multi-page
React + Vite frontend with a Node.js + Express backend, MongoDB Atlas persistence, JWT
authentication, Socket.IO real-time chat, Docker containerization, and CI/CD deployment
preparation.

The repository documents the complete college practical sequence from Experiment 1 through
Experiment 10. The frontend is not an SPA: each page is a separate HTML entry point that
mounts its own React application.

> **Deployment status:** Render and Vercel configuration is included, but no Render or
> Vercel deployment is performed by this repository's CI. Deployment requires manual account
> setup and environment configuration as described below.

## Table of contents

- [Overview and goals](#overview-and-goals)
- [Implemented features](#implemented-features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Repository structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Local installation and startup](#local-installation-and-startup)
- [Environment variables](#environment-variables)
- [MongoDB Atlas setup](#mongodb-atlas-setup)
- [Frontend pages](#frontend-pages)
- [REST API](#rest-api)
- [Real-time chat](#real-time-chat)
- [Docker Compose](#docker-compose)
- [GitHub Actions CI](#github-actions-ci)
- [Render and Vercel deployment preparation](#render-and-vercel-deployment-preparation)
- [Experiments 1–10](#experiments-110)
- [Testing and verification](#testing-and-verification)
- [Security notes](#security-notes)
- [Known limitations](#known-limitations)
- [Troubleshooting](#troubleshooting)
- [Experiment documentation](#experiment-documentation)

## Overview and goals

RepRank is designed around a simple loop: **train, track, compete, and rank up**.

- Track exercises, sets, reps, and weight.
- Persist workout records in MongoDB Atlas through a REST API.
- Register and log in with JWT-based authentication.
- Display a dashboard, challenges, leaderboard, profile, and workout experience.
- Earn XP and see progress across pages through shared React context.
- Chat with other connected users in real time using Socket.IO.
- Run the full stack locally or through Docker Compose.
- Validate changes in GitHub Actions and prepare for a split Vercel/Render deployment.

The UI includes some demonstration data where a backend feature does not yet exist. Those
areas are identified in [Implemented features](#implemented-features) and
[Known limitations](#known-limitations).

## Implemented features

| Area | What exists |
| --- | --- |
| Multi-page frontend | Nine Vite HTML entry points: home, login, register, dashboard, workout, challenges, leaderboard, profile, and chat. |
| Authentication | Register, login, JWT issuing, protected profile route, role-based admin API check, bcrypt password hashing. |
| Workout persistence | Mongoose `Workout` model and full REST CRUD at `/api/workouts`. |
| Workout UI | Exercise/set tracking, completion toggles, saved workout list, create/update/delete actions, XP feedback in the interface. |
| Global state | `UserContext` and `WorkoutContext`; workout progress is persisted in `localStorage`. |
| Dashboard and profile | Shared user data, XP display, streak/workout badges, achievements, recent activity, and profile hydration from the JWT session. |
| Challenges | Challenge cards, progress bars, and client-side join state. Challenge data is mock data, not MongoDB data. |
| Leaderboard | Podium and ranked table from mock data. It is not a live backend leaderboard. |
| Real-time chat | Socket.IO chat with presence, history, validation, acknowledgements, reconnects, and per-socket rate limiting. Chat history is kept in memory only. |
| Backend security | Helmet, explicit CORS allow-list, body parsing, validation rules, login/register rate limiting, JWT middleware, role middleware, centralized errors. |
| Health reporting | `GET /api/health` returns `200` only when MongoDB is connected, otherwise `503`. |
| Docker | Separate frontend/backend images, Compose networking, host port mappings, and health checks. |
| CI | GitHub Actions installs dependencies from lockfiles, builds the frontend, and syntax-checks the backend. |
| Deployment preparation | Runtime API/Socket configuration for Vercel and a Render Blueprint. Deployments themselves are manual. |

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18.3, Vite 5.4, Tailwind CSS 3.4, PostCSS, Autoprefixer |
| Frontend real-time | `socket.io-client` 4.8 |
| Backend | Node.js 20 recommended, Express 4.21, Socket.IO 4.8 |
| Database | MongoDB Atlas through Mongoose 8.7 |
| Authentication | `jsonwebtoken`, `bcryptjs` |
| Backend security | `helmet`, `cors`, `express-validator`, `express-rate-limit` |
| Configuration | `dotenv`, environment variables |
| Containers | Docker, Docker Compose v2, `node:20-alpine` |
| CI/CD preparation | GitHub Actions, Render Blueprint, Vercel Vite preset |

## Architecture

### Local development

```text
Browser
  ├── http://localhost:5173/*            -> Vite multi-page frontend
  ├── http://localhost:5173/api/*        -> Vite proxy -> http://localhost:5002
  └── http://localhost:5173/socket.io/*  -> Vite proxy -> http://localhost:5002
                                                   |
                                                   ├── Express REST API
                                                   ├── Socket.IO chat
                                                   └── MongoDB Atlas
```

### Docker Compose

```text
Browser
  ├── http://localhost:8080/*            -> frontend container:5173
  ├── http://localhost:8080/api/*        -> Vite proxy -> backend:5002
  └── http://localhost:8080/socket.io/*  -> Vite proxy -> backend:5002
                                                   |
                                                   ├── Express + Socket.IO
                                                   └── MongoDB Atlas (external)
```

The browser only uses relative `/api` and `/socket.io` paths in Docker; the container-only
hostname `backend` never reaches the browser.

### Prepared production split

```text
Vercel static frontend
  ├── VITE_API_BASE_URL + /api/*          -> Render backend REST API
  └── VITE_SOCKET_URL or API base URL     -> Render Socket.IO endpoint
                                                   |
                                                   ├── Express + Socket.IO
                                                   └── MongoDB Atlas
```

The backend shares one HTTP server for Express and Socket.IO. REST CORS and Socket.IO use
the same exact-origin allow-list from `CLIENT_ORIGINS`; wildcard origins are not used.

## Repository structure

```text
reprank/
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI
├── backend/
│   ├── controllers/
│   │   └── userController.js       # register, login, profile, admin
│   ├── middleware/
│   │   ├── authMiddleware.js       # Bearer JWT verification
│   │   ├── rateLimiter.js          # auth request rate limit
│   │   ├── roleMiddleware.js       # admin role check
│   │   └── validationMiddleware.js # express-validator rules
│   ├── models/
│   │   ├── User.js
│   │   └── Workout.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   └── workoutRoutes.js
│   ├── scripts/
│   │   └── seedAdmin.js
│   ├── socket/
│   │   └── chat.js                 # Socket.IO chat handlers/limits
│   ├── .env.example                # variable names, no real values
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── src/
│   ├── components/
│   ├── context/
│   │   ├── UserContext.jsx
│   │   └── WorkoutContext.jsx
│   ├── data/
│   │   └── mockApi.js              # mock challenge/leaderboard/dashboard data
│   ├── entries/                    # one React mount per HTML page
│   ├── hooks/                      # useFetch, useForm, useToast, useChat, etc.
│   ├── pages/
│   └── services/
│       ├── api.js                  # workout REST client
│       ├── auth.js                 # authentication REST client
│       ├── chatSocket.js           # shared Socket.IO client
│       └── runtimeConfig.js        # optional production API/socket URLs
├── .dockerignore
├── Dockerfile                      # frontend image
├── docker-compose.yml
├── index.html
├── login.html
├── register.html
├── dashboard.html
├── workout.html
├── challenges.html
├── leaderboard.html
├── profile.html
├── chat.html
├── package.json
├── render.yaml
├── vite.config.js
├── DOCKER.md
├── EXP8.md
├── EXP9.md
└── EXP10.md
```

## Prerequisites

- **Node.js 20** recommended, matching the Docker images and CI. The project uses ES modules.
- **npm** with lockfile support.
- **MongoDB Atlas** account/cluster for authentication and workout persistence.
- **Docker Desktop** or Docker Engine with Compose v2 for the container workflow.
- A modern browser for the multi-page frontend and chat testing.

The UI and chat can start without MongoDB, but Mongo-backed routes will fail and
`GET /api/health` will report `503` until the database is reachable.

## Local installation and startup

Clone the repository and install both application dependency sets:

```bash
git clone https://github.com/Aryert05/reprank.git
cd reprank
npm ci

cd backend
npm ci
```

### Scripts

| Location | Command | Purpose |
| --- | --- | --- |
| Root | `npm run dev` | Start the Vite dev server on port 5173. |
| Root | `npm run build` | Build the multi-page production frontend into `dist/`. |
| Root | `npm run preview` | Preview the production build locally. |
| `backend/` | `npm start` | Start the Express/Socket.IO server. |
| `backend/` | `npm run dev` | Start the backend with Nodemon. |
| `backend/` | `npm run seed:admin` | Run the existing admin seeding script. Review its fixed demo values before any real use. |

### Backend

Create the local environment file from the template, then fill in real values locally:

```bash
cd backend
cp .env.example .env
# Edit backend/.env with your own values. Never commit this file.
npm run dev
```

Default backend address: `http://localhost:5002`.

`PORT` defaults to `5002`; `HOST` defaults to `0.0.0.0`. When MongoDB is unavailable, the
server still starts so the pages and chat can run, but database-backed routes fail and the
health endpoint reports a degraded state.

### Frontend

In a second terminal, from the repository root:

```bash
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` and `/socket.io` to
`http://localhost:5002` by default. To use a different local backend target, set
`VITE_API_URL` for the Vite process, for example:

```bash
VITE_API_URL=http://localhost:5003 npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Environment variables

Never commit real values. The backend template is [`backend/.env.example`](backend/.env.example).

### Backend

| Name | Required | Purpose |
| --- | --- | --- |
| `MONGO_URI` | Yes for database features | MongoDB Atlas connection string. Secret. |
| `JWT_SECRET` | Yes | Signs and verifies login tokens. Secret. |
| `ADMIN_CREATION_SECRET` | Yes for admin creation | Checked through the `X-Admin-Secret` request header by the admin registration route. Secret. |
| `PORT` | Optional | Backend listening port; defaults to `5002`. Render supplies its own value. |
| `HOST` | Optional | Bind address; defaults to `0.0.0.0`. Recommended for containers and Render. |
| `CLIENT_ORIGINS` | Production | Comma-separated exact browser origins allowed for REST CORS and Socket.IO. Leave unset locally to use the localhost defaults. |

### Frontend build configuration

| Name | Required | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Split deployment | Public backend origin used by REST requests and, by fallback, Socket.IO. |
| `VITE_SOCKET_URL` | Optional | Public Socket.IO origin if it differs from the REST origin. |
| `VITE_API_URL` | Local/Docker proxy only | Vite dev-server proxy target; not a public browser API URL. Docker Compose sets this to the backend service address. |

`VITE_*` values are embedded in the browser bundle at build time. They must only contain
public values such as backend origins, never database URIs or secrets.

## MongoDB Atlas setup

1. Create a MongoDB Atlas cluster and a database user with only the permissions the project
   needs.
2. In Atlas **Network Access**, allow only the IP addresses that must connect. For local
   development, add your current IP. For Render, allow Render egress according to your
   hosting setup. Avoid broad public access unless you have a specific, reviewed reason.
3. Copy the connection string into `backend/.env` as `MONGO_URI`. Do not place it in the
   frontend, Vercel variables, Dockerfiles, Compose files, or Git.
4. Create a strong `JWT_SECRET` and `ADMIN_CREATION_SECRET`.
5. Start the backend and verify the database state:

```bash
curl -i http://localhost:5002/api/health
```

`200` with `"database":"connected"` means Mongoose is connected. `503` with
`"database":"disconnected"` means the API is running but Atlas is not reachable.

The backend does not currently auto-reconnect after the initial Mongoose connection failure;
restart the backend after fixing Atlas network access or credentials.

## Frontend pages

All pages are separate Vite entry points and are also listed in `vite.config.js`.

| Page | HTML entry | React entry | Purpose |
| --- | --- | --- | --- |
| Home | `index.html` | `src/entries/home.jsx` | Marketing/product landing page. |
| Login | `login.html` | `src/entries/login.jsx` | JWT login form. |
| Register | `register.html` | `src/entries/register.jsx` | Account registration. |
| Dashboard | `dashboard.html` | `src/entries/dashboard.jsx` | Shared user/workout summary and mock activity data. |
| Workout | `workout.html` | `src/entries/workout.jsx` | Workout tracking plus MongoDB CRUD records. |
| Challenges | `challenges.html` | `src/entries/challenges.jsx` | Challenge cards with client-side join state and mock data. |
| Leaderboard | `leaderboard.html` | `src/entries/leaderboard.jsx` | Ranked table and podium from mock data. |
| Profile | `profile.html` | `src/entries/profile.jsx` | Authenticated profile hydration, XP summary, static achievements/activity. |
| Chat | `chat.html` | `src/entries/chat.jsx` | Socket.IO real-time chat. |

## REST API

Base URL locally: `http://localhost:5002`.

### Service endpoints

| Method | Path | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/` | Public | Returns the API running message. |
| `GET` | `/api/health` | Public | Reports API/database health; `200` connected, `503` disconnected. |

### Workout endpoints

Workouts are currently public REST resources. They are not protected by JWT middleware.

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/workouts` | List all workouts, newest first. |
| `GET` | `/api/workouts/:id` | Get one workout by MongoDB ObjectId. |
| `POST` | `/api/workouts` | Create a workout. |
| `PUT` | `/api/workouts/:id` | Update a workout. |
| `DELETE` | `/api/workouts/:id` | Delete a workout. |

A workout contains `name`, `exercise`, `sets`, `reps`, `weight`, `category`, and `completed`.
The Mongoose schema also provides `_id`, `createdAt`, and `updatedAt`.

### User and auth endpoints

| Method | Path | Authentication | Description |
| --- | --- | --- | --- |
| `POST` | `/api/users/register` | Public | Register a normal user. Rate-limited and validated. |
| `POST` | `/api/users/login` | Public | Verify credentials and return a JWT plus user data. Rate-limited and validated. |
| `POST` | `/api/users/register-admin` | `X-Admin-Secret` header | Create an admin user. Intended for controlled setup/testing. |
| `GET` | `/api/users/profile` | `Authorization: Bearer <token>` | Return the authenticated user's profile. |
| `GET` | `/api/users/admin` | Bearer JWT with admin role | Return an admin-only API response. |

Registration fields are `name`, `email`, and `password`. Login fields are `email` and
`password`. Passwords are hashed with bcrypt before storage.

## Real-time chat

Chat uses the same HTTP server and port as the REST API:

- Socket.IO path: `/socket.io/`
- Local browser path: `http://localhost:5173/socket.io/` through the Vite proxy
- Docker browser path: `http://localhost:8080/socket.io/` through the frontend proxy
- Production path: configured `VITE_SOCKET_URL` or `VITE_API_BASE_URL`

### Events

| Event | Direction | Purpose |
| --- | --- | --- |
| `chatJoin` | Client → server | Set/update the display name. Server replies with an acknowledgement. |
| `chatMessage` | Client → server | Send a chat message. Server replies with an acknowledgement. |
| `chatHistory` | Server → client | Recent in-memory messages sent when a client connects. |
| `chatMessage` | Server → client broadcast | Broadcast an accepted message to connected clients. |
| `chatUsers` | Server → client | Current online users/count. |
| `connect`, `disconnect`, `connect_error` | Socket.IO lifecycle | Connection state shown in the UI. |

The server validates usernames (maximum 32 characters) and messages (maximum 500 characters),
rejects empty content, and applies a sliding-window limit of 8 messages per 10 seconds per
socket. The most recent 50 messages are kept in memory. Chat does not use MongoDB and is not
authenticated.

## Docker Compose

MongoDB Atlas remains external; only the frontend and backend are containerized.

### Prepare the backend environment

From the repository root:

```bash
cp backend/.env.example backend/.env
# Fill in real local values in backend/.env. Never commit it.
```

### Build and start

```bash
docker compose config --quiet
docker compose build
docker compose up -d
docker compose ps
```

Expected addresses:

| Service | Container port | Host port | Address |
| --- | --- | --- | --- |
| Frontend | 5173 | 8080 | `http://localhost:8080` |
| Backend | 5002 | 5003 | `http://localhost:5003` |

The backend health check uses `GET /api/health` and is healthy only when MongoDB is connected.
The frontend still serves pages while the backend is unhealthy. The frontend image runs the
Vite dev server, preserving the proxy and hot-reload behavior used in Experiments 7–9.

### Logs and shutdown

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs --tail=50

docker compose stop
docker compose down
docker compose down -v
```

Use `docker compose config --quiet` rather than plain `docker compose config` when you do not
want resolved environment values printed. See [`DOCKER.md`](DOCKER.md) for the full Docker guide.

## GitHub Actions CI

Workflow file: [`.github/workflows/ci.yml`](.github/workflows/ci.yml)

It runs on:

- pushes to `main`
- pushes to `exp10`
- pull requests targeting `main`

It uses Node.js 20 and npm caching for both lockfiles, then performs:

1. `npm ci` in the repository root
2. `npm run build`
3. `npm ci` in `backend/`
4. `node --check server.js` and syntax checks for the remaining backend JavaScript files
5. `npm test --if-present` for frontend and backend

No test scripts currently exist, so the test steps do not invent or run a suite. The workflow
requires no MongoDB or production credentials and does not deploy anywhere.

## Render and Vercel deployment preparation

The repository includes runtime support and a Render Blueprint, but **no deployment has been
completed by this project's CI**. The following steps are configuration instructions only.

### Render backend

[`render.yaml`](render.yaml) defines a Node web service with:

- root directory `backend`
- build command `npm ci --omit=dev`
- start command `npm start`
- health check path `/api/health`

Create a Blueprint or manual web service in Render and provide these variable names:
`MONGO_URI`, `JWT_SECRET`, `ADMIN_CREATION_SECRET`, and `CLIENT_ORIGINS`. Render supplies
`PORT`; the backend already binds to `HOST` when provided and defaults to `0.0.0.0`.
`NODE_ENV` is set to production by the Blueprint.

After Vercel assigns the frontend origin, add the exact origin to `CLIENT_ORIGINS` on Render
and redeploy/restart the service. Multiple origins are comma-separated. Do not use `*`.

Atlas must allow the Render service's network access. Because `/api/health` depends on the
database, the Render health check remains failed until Atlas is reachable.

### Vercel frontend

Import the repository at its root. There is no `frontend/` directory.

Use the Vite preset or these settings:

- install command: `npm ci`
- build command: `npm run build`
- output directory: `dist`

Set `VITE_API_BASE_URL` to the public Render backend origin. Optionally set
`VITE_SOCKET_URL` if Socket.IO is hosted separately; otherwise it falls back to the API base
URL. These values are public and are embedded at build time, so redeploy after changing them.

All nine HTML files are emitted into `dist/` and remain directly addressable. No `vercel.json`
is required, and an SPA rewrite to `index.html` would be incorrect for this multi-page site.

## Experiments 1–10

The repository is a single evolving project. Each experiment is preserved in the history and
in the current application.

| Experiment | Topic | Implementation in this repository |
| --- | --- | --- |
| 1 | Frontend UI | Initial Vite + Tailwind multi-page RepRank interface, shared design system, marketing pages, app pages, and responsive navigation. |
| 2 | React hooks | Converted the pages to React function components and demonstrated `useEffect`, `useContext`, and custom hooks such as `useDocumentTitle`, `useFetch`, `useForm`, and `useToast`. Mock API data supplies loading/error states. |
| 3 | State management | Added `WorkoutContext` with global workout progress, custom `useWorkout()` consumer, and `localStorage` persistence across the separate HTML pages. |
| 4 | MongoDB Atlas CRUD | Added the Express/Mongoose backend, `Workout` model, workout REST routes, Vite `/api` proxy, `src/services/api.js`, and the workout database CRUD UI. |
| 5 | Secure REST APIs | Added the `User` model, bcrypt password hashing, JWT login/register/profile routes, auth and admin middleware, request validation, login rate limiting, Helmet, and CORS. |
| 6 | Authentication integration | Frontend auth persistence, `UserContext` hydration through `GET /api/users/profile`, and stale-token cleanup are present. There is no standalone `EXP6.md` and no separate Exp6 commit; the auth integration was included with the Exp7 commit. |
| 7 | Docker deployment | Added frontend/backend Dockerfiles, `.dockerignore` files, Docker Compose orchestration, runtime environment loading, proxy networking, health checks, and [`DOCKER.md`](DOCKER.md). |
| 8 | Real-time WebSockets | Added Socket.IO on the existing HTTP server, the chat protocol, origin allow-list and handshake guard, validation/rate limits, the chat React hook/page, and [`EXP8.md`](EXP8.md). |
| 9 | Full-stack containerization | Reused and validated the Docker setup with all pages and chat, aligned host ports (`8080`, `5003`), verified health and proxy behavior, and documented the results in [`EXP9.md`](EXP9.md). |
| 10 | CI/CD deployment preparation | Added GitHub Actions CI, Render Blueprint, Vercel/Render runtime URL configuration, multi-page production build support, and deployment documentation in [`EXP10.md`](EXP10.md). |

## Testing and verification

There is currently **no automated test suite** in either package. The CI checks are build,
dependency, and syntax checks, not integration tests.

Run the available frontend verification:

```bash
npm ci
npm run build
npm test --if-present
```

Run the available backend verification:

```bash
cd backend
npm ci
node --check server.js
find . -path ./node_modules -prune -o -name '*.js' -type f -print0 \
  | xargs -0 -n1 node --check
npm test --if-present
```

Validate Docker configuration and builds:

```bash
docker compose config --quiet
docker compose build
docker compose ps
```

Manual runtime checks:

```bash
curl -i http://localhost:5002/
curl -i http://localhost:5002/api/health
curl -i http://localhost:5002/api/workouts
curl -i http://localhost:8080/api/health
```

Check the chat handshake from an allowed local origin:

```bash
curl -i -H 'Origin: http://localhost:5173' \
  'http://localhost:5002/socket.io/?EIO=4&transport=polling'
```

The backend returns `503` from `/api/health` whenever MongoDB is not connected, even though
the HTTP process and chat may still be running.

## Security notes

- Never commit `backend/.env`, database URIs, JWT secrets, admin secrets, tokens, or
  credentials. `backend/.env` is git-ignored; [`backend/.env.example`](backend/.env.example)
  contains names and placeholders only.
- Use long, unique values for `JWT_SECRET` and `ADMIN_CREATION_SECRET`.
- Keep `CLIENT_ORIGINS` as an exact, comma-separated allow-list. REST CORS and Socket.IO
  intentionally do not use wildcard origins.
- Treat all `VITE_*` values as public. They are bundled into browser JavaScript.
- In production, serve the frontend and backend over HTTPS; Socket.IO then uses WSS.
- Restrict MongoDB Atlas network access and use a least-privilege database user.
- Rotate any credential that may have been exposed. Do not copy real values into issues,
  screenshots, logs, or documentation.
- The existing admin seed script contains fixed demo values for local testing. Replace or
  remove that pattern before using the project as a real service.
- Workout REST routes are currently public; add authentication/authorization before treating
  them as protected user data.

## Known limitations

- No automated unit, integration, or end-to-end test suite exists.
- Chat messages and presence are in memory only; restarting the backend clears history.
- Chat usernames are not authenticated.
- Challenge and leaderboard data are mock data. Challenge joining is client-side only.
- Profile achievements and recent activity are static/demo content.
- Gamification values such as level, XP, streak, and season rank have no dedicated backend
  persistence yet; the UI uses fallback/demo values where the API does not provide them.
- Workout CRUD endpoints are public and not scoped to the logged-in user.
- The frontend Docker image runs the Vite dev server rather than a static production web server.
- MongoDB Atlas network access must be configured correctly; otherwise the backend runs but
  database routes and health remain degraded.
- Render and Vercel deployments are prepared but not performed automatically. Render free
  services may cold-start slowly.
- Render's health check depends on MongoDB, so an Atlas outage also makes the service unhealthy.
- CORS uses exact origins; every Vercel preview origin that needs backend access must be added
  explicitly.
- The Exp6 implementation has no standalone experiment document or dedicated commit in this
  repository.

## Troubleshooting

### `npm ci` fails

- Confirm both lockfiles are present: `package-lock.json` and `backend/package-lock.json`.
- Run the command from the correct directory.
- Do not use `npm install` in CI; it can change dependency resolution.

### Backend starts but API/database calls fail

- Check that `backend/.env` exists and contains `MONGO_URI`, `JWT_SECRET`, and any required
  admin secret.
- Verify the Atlas user, password, database name, and network allow-list.
- Check `GET /api/health`: `503` means the database is not connected.
- Restart the backend after fixing Atlas so Mongoose attempts the connection again.

### Port already in use

Default ports are backend `5002`, Vite `5173`, Docker frontend `8080`, and Docker backend host
`5003`. Stop the conflicting process or override the backend host port:

```bash
BACKEND_HOST_PORT=5004 docker compose up -d
```

For local Vite proxying, set `VITE_API_URL` to the backend you are actually running.

### Docker Compose fails because `backend/.env` is missing

Create it from the template:

```bash
cp backend/.env.example backend/.env
```

Fill in real values locally. Do not commit the file.

### Docker backend is `unhealthy`

The Compose health check requires MongoDB to be connected. Check Atlas network access and
credentials, then restart the backend:

```bash
docker compose restart backend
docker compose logs --tail=50 backend
```

The frontend can still serve pages while the backend reports unhealthy.

### `docker compose config` prints secrets

Use `docker compose config --quiet`; the non-quiet form resolves and prints environment values.

### CORS or Socket.IO origin is rejected

Add the exact browser origin to `CLIENT_ORIGINS` on the backend. Include the scheme, do not
include a path or trailing slash, and separate multiple origins with commas. Do not use `*`.
REST requests from disallowed origins receive no CORS allow header; Socket.IO handshakes from
disallowed origins receive `403`.

### Vercel frontend still calls `/api` locally

Set `VITE_API_BASE_URL` in Vercel and redeploy. Vite embeds this value at build time, so an
environment change alone does not update an existing deployment.

### Vercel page returns `404`

Open the generated `.html` path and confirm the file exists in `dist/`. Do not add an SPA
fallback rewrite; this is a multi-page Vite build.

### Render reports the service unhealthy

Check Render logs, the Atlas allow-list, and the Render environment-variable names. The
health path is `/api/health` and only returns `200` when MongoDB is connected.

### Chat reconnects or history disappears

Chat history is intentionally in-memory and capped. Restarting the backend or deploying a new
instance clears it. Socket.IO reconnection is enabled in the client.

## Experiment documentation

- [Experiment 8 — WebSockets](EXP8.md)
- [Experiment 9 — Full-stack Docker containerization](EXP9.md)
- [Experiment 10 — CI/CD deployment preparation](EXP10.md)
- [Docker guide](DOCKER.md)

No standalone experiment documents exist for Experiments 1–7. Their implementation is
preserved in the Git history and the current codebase.
