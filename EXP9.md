# Experiment 9 — Containerizing a Full-Stack Application with Docker

## 1. Aim

To containerize the existing RepRank full-stack application — a React + Vite
multi-page frontend and a Node.js + Express + Socket.IO backend — using
Dockerfiles and Docker Compose, and to verify that both containers build, run,
communicate over the Compose network, stop, and restart correctly.

The experiment reuses and validates the Docker setup introduced in Experiment 7
rather than duplicating it, and preserves everything from Experiments 1–8,
including the Socket.IO real-time chat from Experiment 8.

## 2. Software requirements

| Software        | Version used / required                          |
| --------------- | ------------------------------------------------ |
| Docker Engine   | `29.4.1` (Docker Desktop on macOS)               |
| Docker Compose  | `v5.1.3` (Compose v2 CLI plugin, `docker compose`) |
| Node.js         | 20 (pinned by `node:20-alpine` in both images)   |
| npm             | bundled with Node 20                             |
| MongoDB Atlas   | Existing external cluster (not containerized)    |

> Docker Desktop must be running. Confirm with `docker info`; if the CLI cannot
> reach the daemon, start Docker Desktop before continuing.

## 3. Theory

**Docker** packages an application and its dependencies into an isolated,
reproducible unit that runs the same way on any machine that has the Docker
Engine.

- **Image** — a read-only, layered template built from a Dockerfile. Layers are
  cached: changing application source invalidates only the layers after the
  dependency install.
- **Container** — a running (or stopped) instance of an image, with its own
  filesystem, process namespace, and network interface.
- **Dockerfile** — the build recipe. Key instructions used here: `FROM` (base
  image), `WORKDIR`, `COPY`, `RUN` (build-time), `ENV`, `EXPOSE` (documentation
  only), and `CMD` (default process).
- **Build context** — the directory sent to the daemon (`context:` in Compose).
  `.dockerignore` trims it and, importantly, prevents secrets and local
  artifacts such as `.env`, `node_modules`, and `dist` from entering the image.
- **Docker Compose** — declaratively defines multiple services, their build
  contexts, images, ports, environment, health checks, and startup order. It
  creates a dedicated user-defined bridge network so containers can reach each
  other by **service name** (e.g. `backend`) instead of IP address.
- **Port mapping** — `HOST:CONTAINER` publishes a container port on the host.
  Container-to-container traffic uses the *container* port and service name, not
  the host mapping.
- **Health checks** — a command Compose runs inside the container to report
  `healthy`/`unhealthy`, separate from whether the process is running.

For RepRank, MongoDB Atlas is an **external managed database**. Only the
frontend and backend are containerized; the database architecture is unchanged.

## 4. Existing configuration audited

The following files already existed from Experiment 7 and were inspected before
any change. They were found correct and were **not** duplicated.

| File                    | Role                                                        | Audit result |
| ----------------------- | ----------------------------------------------------------- | ------------ |
| `Dockerfile`            | Frontend image (`node:20-alpine`, `npm ci`, Vite dev server) | Correct — deps from lockfile, `COPY . .` filtered by `.dockerignore`, `--host 0.0.0.0 --port 5173 --strictPort` |
| `backend/Dockerfile`    | Backend image (`node:20-alpine`, `npm ci --omit=dev`, `npm start`) | Correct — start script runs the real `server.js`; `server.js` is `main` |
| `docker-compose.yml`    | Two services, network, ports, env, health checks, `depends_on` | Correct — validated; host-port default aligned (see §5) |
| `.dockerignore` (root)  | Excludes `node_modules`, `dist`, `backend/`, `.git`, `**/.env*` | Correct |
| `backend/.dockerignore` | Excludes `**/.env*`, `node_modules`, logs, `.git`          | Correct |

`backend/package.json` start script verified:

```json
"scripts": { "start": "node server.js", "dev": "nodemon server.js" }
```

`backend/server.js` reads `PORT` (default 5002) and `HOST` (default `0.0.0.0`)
from the environment, so the backend listens on all interfaces inside the
container.

Secrets: `backend/.env` is loaded at **runtime** via Compose `env_file`, is
git-ignored, and is excluded from the image by `backend/.dockerignore`. No
credential, URI, or JWT value is written into any Dockerfile, Compose file, or
image.

## 5. Changes made in Experiment 9

Only the minimum necessary changes were made:

| File                 | Change | Reason |
| -------------------- | ------ | ------ |
| `docker-compose.yml` | Backend host port default `${BACKEND_HOST_PORT:-5002}` → `:-5003` | Host 5002 is used by the local dev backend; 5003 matches the documented "normally host 5003" baseline and avoids a port conflict. Container port remains 5002. |
| `docker-compose.yml` | Image tags `:exp7` → `:exp9` | Labels the Experiment 9 builds accurately and preserves the previous images instead of overwriting them. |
| `docker-compose.yml` | Header comment updated to Experiment 9 | Documentation accuracy. |
| `DOCKER.md`          | Host-port table and host-access `curl` examples updated to 5003; `chat.html` added to the page list; port-conflict troubleshooting updated | Keep docs consistent with the port change. |
| `EXP9.md`            | New | Experiment 9 practical documentation. |

No Dockerfile, `package.json`, source file, or database configuration was
changed. Experiment 8's Socket.IO proxy (`/socket.io` with `ws: true`) and the
graceful "start HTTP server even if MongoDB is unreachable" behavior are
retained.

## 6. Configuration summary

### 6.1 Services

| Service    | Build context | Image                   | Container port | Host port | URL |
| ---------- | ------------- | ----------------------- | -------------- | --------- | --- |
| `frontend` | `.` (root)    | `reprank-frontend:exp9` | 5173           | 8080      | <http://localhost:8080> |
| `backend`  | `./backend`   | `reprank-backend:exp9`  | 5002           | 5003      | <http://localhost:5003> |

### 6.2 Networking and proxy

```
Browser ──http://localhost:8080──▶ frontend container (Vite dev server :5173)
                                        │  relative /api  and /socket.io (ws)
                                        ▼
                              backend container (Express + Socket.IO :5002)
                                        │
                                        ▼
                                  MongoDB Atlas (external)
```

- The browser only calls relative paths (`/api/...`, `/socket.io/...`).
- Vite proxies `/api` and `/socket.io` to `VITE_API_URL`
  (`http://backend:5002`) inside the Compose network.
- `ws: true` on the `/socket.io` proxy preserves the WebSocket upgrade.
- A user-defined Compose bridge network (`reprank_default`) provides DNS so the
  frontend reaches `backend` by service name.

### 6.3 Environment and startup

- `backend/.env` is injected at runtime through `env_file` (never baked in).
- `environment:` pins `PORT=5002` and `HOST=0.0.0.0` inside the container
  (so the backend listens on all interfaces).
- `frontend` waits for `backend` with `condition: service_started` (not
  `service_healthy`) so the UI still boots when Atlas is unreachable.
- Health checks: frontend `GET :5173/`; backend `GET :5002/api/health` and
  requires `database === "connected"`, so it turns healthy only with a real
  database connection.

## 7. Commands used and actual results

All commands were run from the repository root.

### 7.1 Prerequisites

```bash
docker --version          # Docker version 29.4.1, build 055a478
docker compose version    # Docker Compose version v5.1.3
docker info               # ServerVersion=29.4.1 OS=Docker Desktop Containers=7 Running=2
```

Result: Docker daemon reachable.

### 7.2 Validate Compose

```bash
docker compose config --quiet
```

Result: exit `0` (valid). The resolved configuration was **not** printed because
it can contain secrets.

### 7.3 Build

```bash
docker compose build
```

Result: exit `0` — both images built:

```
Image reprank-backend:exp9 Built
Image reprank-frontend:exp9 Built
```

### 7.4 Start

```bash
docker compose up -d
docker compose ps
```

Actual `docker compose ps` after startup (Atlas unreachable):

```
reprank-backend   reprank-backend:exp9    Up (health: starting)   0.0.0.0:5003->5002/tcp
reprank-frontend  reprank-frontend:exp9   Up (healthy)            0.0.0.0:8080->5173/tcp
```

Backend logs (filtered, no secret values printed):

```
MongoDB Connection Error: Could not connect to any servers in your MongoDB Atlas cluster ...
[server] Starting HTTP server without MongoDB (chat will run; API health will report degraded)
Server running on port 5002
```

Frontend logs:

```
VITE v5.4.21  ready in 214 ms
➜  Local:   http://localhost:5173/
➜  Network: http://172.18.0.3:5173/
```

### 7.5 HTTP verification

| Check | Command | Actual result |
| ----- | ------- | ------------- |
| Home page | `curl -o /dev/null -w '%{http_code}' http://localhost:8080/` | `200` |
| All 9 pages (incl. `chat.html`) | loop over `/`, `index`, `login`, `register`, `dashboard`, `workout`, `challenges`, `leaderboard`, `profile`, `chat` | all `200` |
| Health through proxy | `curl -w '%{http_code}' http://localhost:8080/api/health` | `503` `{"status":"degraded","database":"disconnected"}` |
| Health direct | `curl -w '%{http_code}' http://localhost:5003/api/health` | `503` `{"status":"degraded","database":"disconnected"}` |
| Socket.IO handshake through proxy | `curl -H 'Origin: http://localhost:8080' 'http://localhost:8080/socket.io/?EIO=4&transport=polling'` | `200`, `upgrades:["websocket"]`, `access-control-allow-origin: http://localhost:8080` |

The `503` is **correct and expected**: the health endpoint reports the real
database state, and Atlas currently rejects this machine's IP.

### 7.6 Socket.IO WebSocket + message exchange through Docker

A two-client Node test connected through the frontend proxy on `:8080` using
`transports: ['websocket']` (forcing the upgrade path):

```
PASS  A connected over websocket -> websocket
PASS  B connected over websocket -> websocket
PASS  A join acknowledged -> {"ok":true}
PASS  B join acknowledged -> {"ok":true}
PASS  B received A message instantly -> {"username":"DockerA","message":"hi through docker",...}
RESULT: 5 passed, 0 failed
```

A full two-browser (Chrome via CDP) test against `http://localhost:8080` also
passed **12/12**: both sessions `Connected`, real
`ws://localhost:8080/socket.io/?EIO=4&transport=websocket`, `2 ONLINE`, presence,
A→B and B→A instant delivery, blank-message rejection, and zero console
errors/exceptions.

### 7.7 Stop and restart

```bash
docker compose down
docker ps -a | grep reprank     # no reprank containers remain
docker compose up -d
docker compose ps
```

Result: `down` stopped and removed both containers and the `reprank_default`
network (exit `0`); no volumes were declared, so none were removed and no
unrelated containers were touched. `up -d` recreated and started both services;
home page, `chat.html`, and the proxy health endpoint were reachable again after
startup.

> **Startup note:** when Atlas is unreachable, Mongoose waits for its
> server-selection timeout (~30 s) before the HTTP server starts listening. For
> that brief window the proxy returns `500`; after it elapses the backend listens
> and `/api/health` returns `503`. With a reachable database the server starts
> promptly.

## 8. Image audit

| Check | Result |
| ----- | ------ |
| Backend image contains `.env` | No |
| Backend image contains `.git` | No |
| Backend image dependency install | `npm ci --omit=dev` (production deps, incl. `socket.io`) |
| Frontend image contains `.env` | No |
| Frontend image contains `backend/` | No (excluded from build context) |
| Frontend image contains `dist/` (local build artifact) | No |
| Image sizes | `reprank-frontend:exp9` ≈ 311 MB, `reprank-backend:exp9` ≈ 245 MB |

## 9. Verification checklist (expected vs performed)

| # | Step | Status |
| - | ---- | ------ |
| 1 | Docker daemon reachable | **Performed** — verified |
| 2 | `docker compose config --quiet` valid | **Performed** — exit 0 |
| 3 | Both images build | **Performed** — exit 0 |
| 4 | Both containers start | **Performed** — frontend healthy, backend running |
| 5 | Frontend serves at `:8080` | **Performed** — 200 |
| 6 | All pages incl. `chat.html` served | **Performed** — all 200 |
| 7 | `/api/health` through proxy reflects DB | **Performed** — 503 degraded (Atlas blocked) |
| 8 | Socket.IO handshake + WS upgrade through proxy | **Performed** — 200, websocket |
| 9 | Two clients exchange messages through Docker | **Performed** — 12/12 browser, 5/5 node |
| 10 | Secrets absent from images | **Performed** — no `.env`/`.git` |
| 11 | `docker compose down` / `up -d` | **Performed** — both exit 0 |
| 12 | `/api/health` returns `200 connected` | **Not verified** — requires Atlas IP allow-list; endpoint logic unchanged and previously verified on the host |

## 10. Remaining limitations

- **MongoDB Atlas IP allow-list.** The Docker backend cannot connect because the
  current public IP is not allowed. This was **not** weakened (no `0.0.0.0/0`).
  To complete the database-backed checks, add only this machine's current IP in
  Atlas → Network Access, then `docker compose restart backend`. The health
  endpoint will then report `200 {"status":"ok","database":"connected"}` and the
  backend healthcheck will turn `healthy`.
- **Frontend image runs the Vite dev server**, matching Experiment 7. It is not a
  multi-stage static production build behind a web server; the `/api` and
  `/socket.io` proxies live in the Vite config. This is intentional for this
  experiment and preserves hot reload.
- **~30 s startup delay when Atlas is unreachable** (Mongoose server-selection
  timeout) before the backend begins listening. Chat and pages work after that.

## 11. Conclusion

The existing Experiment 7 Docker configuration was audited, validated, and
reused without duplication. Both images build from their package lockfiles with
Node 20; secrets, local `node_modules`, `dist`, and `.git` are excluded; the
backend listens on `0.0.0.0:5002` and is reached by the frontend through the
Compose network and the Vite proxy. Both containers start, serve all pages
(including the Experiment 8 chat), and expose a working Socket.IO WebSocket path;
`docker compose down` and `up -d` cycle cleanly. The only unverified item — the
`200 connected` health state — is due to the external Atlas IP allow-list, not to
the containerization. With that IP allowed, the same configuration becomes fully
healthy without code changes.
