# RepRank — Docker Guide (Experiment 7)

Dockerizes the existing RepRank full-stack app: a React + Vite frontend and a
Node.js + Express backend, orchestrated with Docker Compose.

MongoDB is **not** containerized — the backend keeps using the existing
MongoDB Atlas cluster.

---

## Prerequisites

- **Docker Desktop** for macOS (or Docker Engine + Compose v2 on Linux)
  <https://www.docker.com/products/docker-desktop/>
- A running Docker Desktop (menu bar icon → "Docker Desktop is running")
- Node.js 18+ (only needed for local, non-Docker development)
- A valid `backend/.env` (see below)

Check your setup:

```bash
docker --version
docker compose version
docker info >/dev/null && echo "Docker daemon OK"
```

## Required environment variables

The backend needs these variables. They are read at **runtime** from the
git-ignored `backend/.env` file — never baked into an image and never written
into `docker-compose.yml`.

| Variable                 | Purpose                                              |
| ------------------------ | ---------------------------------------------------- |
| `MONGO_URI`              | MongoDB Atlas connection string (incl. credentials)  |
| `JWT_SECRET`             | Secret used to sign/verify JWTs                      |
| `ADMIN_CREATION_SECRET`  | Server-side secret for the dev-only admin registration route |
| `PORT`                   | Backend port (5002)                                  |
| `HOST`                   | Bind address, set to `0.0.0.0` in Compose            |

Create it from the template (do **not** commit it):

```bash
cp backend/.env.example backend/.env
# then fill in the real values
```

`backend/.env` is already listed in `backend/.gitignore`.

---

## Architecture

```
Browser  ──http://localhost:8080──▶  frontend container (Vite dev server, 5173)
                                             │  /api/*  (Vite proxy)
                                             ▼
                                  backend container (Express, 5002)
                                             │  MONGO_URI
                                             ▼
                                    MongoDB Atlas (external)
```

| Service    | Container port | Host port | URL                          |
| ---------- | -------------- | --------- | ---------------------------- |
| `frontend` | 5173           | 8080      | <http://localhost:8080>      |
| `backend`  | 5002           | 5002      | <http://localhost:5002>      |

The browser only ever calls **relative** `/api/...` paths
(`src/services/api.js`). Those are proxied by the Vite dev server inside the
Compose network to `http://backend:5002`. The hostname `backend` is never
resolved by the browser — it only exists inside the Docker network.

## Build and start

```bash
# from the repository root
docker compose build          # build both images
docker compose up -d          # start both containers
docker compose ps             # check status
```

`docker compose ps` should show:

- **frontend** — `Up (healthy)`
- **backend** — `Up (healthy)` once MongoDB Atlas is reachable

The backend is only reported healthy when Atlas is genuinely connected (see
[Backend health endpoint](#3-backend-health-endpoint)). While Atlas is
unreachable the backend is fail-closed and restart-loops, and the frontend
still serves the pages.

Rebuild after code changes:

```bash
docker compose up -d --build
```

### Validate the configuration

```bash
docker compose config --quiet   # exits 0 if the config is valid
```

> **Important:** plain `docker compose config` *resolves and prints* the values
> coming from `backend/.env`. Always use `--quiet` so secrets are not printed
> to your terminal.

## Verification steps

**1. Containers are up and healthy**

```bash
docker compose ps
```

**2. Backend is connected to MongoDB Atlas**

```bash
docker compose logs backend | grep -i "MongoDB Connected"
```

**3. Backend health endpoint**

```bash
curl -i http://localhost:5002/api/health
# HTTP/1.1 200 OK
# {"status":"ok","database":"connected"}
```

The endpoint returns **HTTP 200 only when MongoDB Atlas is actually connected**.
When the database is unreachable it returns **HTTP 503** with
`{"status":"degraded","database":"disconnected"}` — so the same command doubles
as a connectivity check:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:5002/api/health
# 200 = connected, 503 = not connected
```

**4. Frontend loads in the browser**

Open <http://localhost:8080> — the RepRank home page should render. The other
pages (`/login.html`, `/register.html`, `/dashboard.html`, `/workout.html`,
`/challenges.html`, `/leaderboard.html`, `/profile.html`) are reachable from
the navbar.

**5. Frontend → backend proxy works (real API request through Vite)**

```bash
curl -i http://localhost:8080/api/health
curl -i http://localhost:8080/api/workouts
```

`/api/health` must return `200` with `{"status":"ok","database":"connected"}`
and `/api/workouts` must return `200` with real MongoDB Atlas data — this
proves the browser path (frontend proxy → backend container → Atlas) is
working. (When Atlas is unreachable, `/api/health` returns `503` through the
proxy too.)

**6. Authentication still works end-to-end**

```bash
curl -i -X POST http://localhost:8080/api/users/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Docker Demo","email":"docker.demo@example.com","password":"Password123"}'

curl -i -X POST http://localhost:8080/api/users/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"docker.demo@example.com","password":"Password123"}'
```

**7. Existing Workout CRUD still works**

```bash
curl -i -X POST http://localhost:8080/api/workouts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Docker Session","exercise":"Squat","sets":3,"reps":10,"weight":60}'

curl -i http://localhost:8080/api/workouts
```

## Viewing logs

```bash
docker compose logs -f backend        # follow backend logs
docker compose logs -f frontend       # follow Vite logs
docker compose logs --tail=50         # last 50 lines of all services
docker compose logs backend | grep -i "MongoDB Connected"
```

Backend logs contain the Atlas connection status only — secrets are never
logged.

## Stopping the containers

```bash
docker compose stop          # stop, keep containers/images
docker compose down          # stop and remove containers
docker compose down -v       # also remove named volumes
```

To rebuild from scratch:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Local development without Docker (unchanged)

```bash
# terminal 1 — backend (reads backend/.env, connects to Atlas)
cd backend && npm run dev     # http://localhost:5002

# terminal 2 — frontend
npm run dev                   # http://localhost:5173
```

The Vite proxy target comes from `VITE_API_URL` and falls back to
`http://localhost:5002` when unset, so local behaviour is unchanged. In
Compose, `VITE_API_URL` is set to `http://backend:5002` for the container
network only.

---

## Troubleshooting

**`EADDRINUSE: address already in use :::5002`**
Another backend is already running locally. Stop it (`lsof -nP -iTCP:5002
-sTCP:LISTEN`) or change the host-side mapping in `docker-compose.yml` to
`5003:5002` (the container port stays 5002).

**Backend container restarts / `MongoDB Connection Error`**
Atlas rejected the connection. Check that:
- `backend/.env` has a complete `MONGO_URI` (no `<username>` placeholders)
- your current public IP is allowed in Atlas → Security → Network Access
  (add only your own IP, not `0.0.0.0/0`)

The backend is **fail-closed**: it exits with a non-zero status instead of
starting with a fallback database. Because of that, an unreachable Atlas shows
up as a **restart loop** in `docker compose ps` (a rising restart count), and
the backend health state stays `starting`/`unhealthy` because the container
keeps exiting before the healthcheck can accumulate failures.

The **frontend keeps serving the pages** throughout — it only waits for the
backend container to start, not to become healthy.

**`docker compose config` prints secrets**
Use `docker compose config --quiet` instead.

**Frontend loads but API calls fail**
- The browser should call relative `/api/...` — never `http://backend:5002`.
- Check `docker compose logs frontend` for proxy errors.
- Check `docker compose ps` for the backend's health state. The frontend only
  waits for the backend **container to start** (`depends_on:
  condition: service_started`), so the UI is served even while Atlas is down.
  When the backend is unhealthy, API calls through the proxy return `502`/`503`
  and the health endpoint reports `{"status":"degraded"}`.

**`dependency failed to start: container reprank-backend is unhealthy`**
The backend healthcheck calls `GET /api/health` and requires both a `200`
response **and** `"database":"connected"` in the body. It only becomes healthy
after MongoDB Atlas connects, so this usually means the Atlas credentials or
the IP allowlist are wrong — see above.

> **Note:** the frontend does **not** use `condition: service_healthy`, so this
> error does not occur in the current configuration. The backend is fail-closed
> and simply restart-loops (`docker compose ps` shows a rising restart count)
> until Atlas is reachable, while the frontend keeps serving the pages.

**Port 8080 or 5173 already in use**
Run `lsof -nP -iTCP:8080 -sTCP:LISTEN` (or `5173`) to find the process, stop
it, or change the host-side port mapping.

**Frontend hot-reload does not work in the container**
The Vite dev server is configured with `--host 0.0.0.0`; use
<http://localhost:8080> (not the container's internal IP) so the HMR
websocket connects correctly.
