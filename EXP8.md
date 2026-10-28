# Experiment 8: Real-Time Communication using WebSockets

## 1. Aim

To implement real-time, bidirectional communication between clients and a server using **WebSockets** with **React, Node.js, Express and Socket.IO**. The goal is to build a working real-time chat feature inside the existing RepRank application such that messages sent by one connected browser session appear instantly in all other connected browser sessions without refreshing the page.

## 2. Software Requirements

| Software | Version | Purpose |
| --- | --- | --- |
| [Node.js](https://nodejs.org/) | 18+ (tested with v25.5.0) | Runtime for frontend and backend |
| [npm](https://www.npmjs.com/) | 11+ | Package management |
| [React](https://react.dev/) | 18.3.1 | UI framework (existing) |
| [Vite](https://vitejs.dev/) | 5.4.8 / 5.4.21 | Dev server, bundler and multi-page build (existing) |
| [Express](https://expressjs.com/) | 4.21.0 | HTTP server (existing, reused) |
| [Socket.IO](https://socket.io/) | 4.8.4 | WebSocket abstraction with fallback transports |
| [socket.io-client](https://socket.io/docs/v4/client-api/) | 4.8.4 | Browser client |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4.13 | Styling (existing design system) |
| [Docker](https://www.docker.com/) / [Docker Compose](https://docs.docker.com/compose/) | Compose v2 | Containerised deployment (existing setup preserved) |
| [MongoDB Atlas](https://www.mongodb.com/atlas) / [MongoDB](https://www.mongodb.com/) | Existing | REST API database (unchanged) |

## 3. Theory

### 3.1 WebSockets
The **WebSocket** protocol provides full-duplex, persistent communication over a single TCP connection. Unlike HTTP (request-response), the server can push data to the client at any time after the initial handshake. The handshake is an HTTP `Upgrade` request; if accepted, the connection switches to the `ws://`/`wss://` protocol and frames can be exchanged bidirectionally with very low overhead.

### 3.2 Socket.IO
[Socket.IO](https://socket.io/) is a library that builds on top of WebSockets and adds practical features:
- **Automatic fallback** to HTTP long-polling if WebSockets are blocked by a proxy/firewall
- **Rooms and namespaces** (used here implicitly via `io.emit`)
- **Event-based API** (`emit`/`on`) instead of raw frame parsing
- **Acknowledgements** so the client knows whether the server accepted a message
- **Automatic reconnection** with backoff
- **Broadcasting** to all connected clients

## 4. Architecture & Event Flow

### 4.1 High-Level Architecture
```
Browser (Chrome / two sessions)
        │
        │  http://localhost:5173  (dev)  OR  http://localhost:8080  (Docker)
        │
        ▼
┌─ Vite Dev Server / Vite Proxy ──────────────────────────────────────────┐
│  /api/*        ──proxy──▶  http://localhost:5002  (or backend:5002)    │
│  /socket.io/*  ──proxy──▶  http://localhost:5002  (ws: true upgrade)   │
└────────────────────────────────────────────────────────────────────────┘
        │  same port, HTTP + WebSocket upgrade
        ▼
┌─ Express HTTP Server (backend/server.js) ────────────────────────────────┐
│  Existing REST:  /, /api/health, /api/workouts, /api/users/*            │
│  Socket.IO:      attached to same http.Server on /socket.io/            │
│  CORS allow-list + server-side Origin guard (never "*")                 │
└────────────────────────────────────────────────────────────────────────┘
        │
        ▼
   MongoDB Atlas / local Mongo  (REST only — chat is in-memory)
```

### 4.2 Key Design Decisions
- **Single HTTP server** — `http.createServer(app)` is passed to `new Server(io)`. REST routes and WebSocket traffic share port `5002`. Nothing starts on a second port.
- **Same-origin connection** — the client calls `io()` with no URL and `path: '/socket.io'`, so it connects to the origin that served the page. The browser never hardcodes a backend hostname.
- **Proxy with WS upgrade** — `vite.config.js` proxies `/socket.io` with `ws: true`. Docker uses the same Vite dev server inside the container; the proxy forwards to `backend:5002` on the Compose network.
- **Origin allow-list** — Socket.IO `cors` restricts allowed origins, and `allowRequest` rejects WebSocket handshakes whose `Origin` header is not on the list (browsers don't enforce CORS for WS upgrades, so a server-side check is required). Missing `Origin` (non-browser clients) is allowed. Configurable via `CLIENT_ORIGINS`.
- **In-memory only** — messages are stored in a ring buffer (`HISTORY_LIMIT = 50`). No MongoDB collections were added. Documented as a limitation.
- **Single shared socket** — `getChatSocket()` creates one `io()` instance and caches it at module scope; `closeChatSocket()` cleans up on unmount.
- **Acknowledge-don't-assume** — every `emit` uses a callback acknowledgement. Messages only appear in the UI when the server actually broadcasts them.

### 4.3 Event Flow
| Event | Direction | Purpose |
| --- | --- | --- |
| `chatJoin` | client → server | Register/update the display name (validated, trimmed, max 32 chars). Server responds via ack. |
| `chatMessage` | client → server | Send a message (validated, trimmed, max 500 chars). Subject to per-socket sliding-window rate limiting. Server responds via ack. |
| `chatHistory` | server → client | Recent in-memory messages sent on connect (merged into UI to survive reconnects). |
| `chatMessage` | server → client (broadcast) | The real message broadcast to **all** connected clients via `io.emit`. |
| `chatUsers` | server → client (broadcast) | Online count and list, updated on connect/disconnect/join. |
| `connect` / `disconnect` / `connect_error` | Socket.IO | Connection state reflected in the UI. |

### 4.4 Server-Side Protections
- **Validation** — username 1–32 chars, message 1–500 chars, both trimmed. Empty after trim rejected.
- **Rate limiting** — 8 messages per 10-second sliding window per socket.
- **Per-socket state** — `clients` map tracks username and send timestamps; cleaned up on disconnect.
- **Safe errors** — never logs secrets or full payloads; socket `error` handler logs only `err.message`.
- **Ring buffer** — history capped at 50 messages to bound memory.

## 5. Implementation Details

### 5.1 Backend (reused Express server)
| File | Action | Description |
| --- | --- | --- |
| `backend/package.json` | Modified | Added `socket.io@^4.8.4` |
| `backend/server.js` | Modified | Creates `http.Server` from `app`, attaches Socket.IO on same port, registers CORS + `allowRequest` origin guard, calls `configureChat(io)`. All existing routes/middleware/health unchanged. |
| `backend/socket/chat.js` | **Created** | Chat logic: origin allow-list (`localhost:5173`, `localhost:8080`, overridable via `CLIENT_ORIGINS`), origin guard, payload sanitisation, sliding-window rate limiting, ring-buffer history, `chatJoin`/`chatMessage` handlers, broadcast to all clients. |

### 5.2 Frontend (React/Vite, multi-page preserved)
| File | Action | Description |
| --- | --- | --- |
| `package.json` | Modified | Added `socket.io-client@^4.8.4` |
| `vite.config.js` | Modified | Added `/socket.io` proxy with `ws: true`, `changeOrigin: true`; added `chat` to Rollup input (9 entries). |
| `src/services/chatSocket.js` | **Created** | Single shared Socket.IO instance (`io()` same-origin, `path: '/socket.io'`, transports `['websocket','polling']`), `getChatSocket()`, `closeChatSocket()`. |
| `src/hooks/useChat.js` | **Created** | Custom hook (follows project style). Owns status/messages/users/error; `join()` and `sendMessage()` use acknowledgements; `chatHistory` merged (not replaced) to avoid wiping on reconnect; auto-cleanup + socket close on unmount. |
| `src/pages/Chat.jsx` | **Created** | Page with title **"Real-Time Chat Application"**, username input, message input + Send button, **Connected/Connecting/Disconnected** status, live message list (username, message, readable time), online users, Enter-to-send / Shift+Enter newline, empty-message prevention, error feedback, auto-scroll, clean unmount. |
| `src/entries/chat.jsx` | **Created** | Entry point mounting `Chat` inside `UserProvider` + `WorkoutProvider`. |
| `chat.html` | **Created** | Root HTML following the existing pattern. |
| `src/components/NavbarApp.jsx` | Modified | Added **Chat** link to `LINKS` (`/chat.html`, active `chat`). |

### 5.3 Docker & Networking
- **No changes required** to `Dockerfile` or `backend/Dockerfile` — Vite already proxies `/api`; we added `/socket.io` to the same `vite.config.js`.
- **No changes required** to `docker-compose.yml` — the frontend container still serves on port 5173, mapped to `8080:5173`. The backend still listens on `5002`. Socket.IO goes through the existing Vite proxy (`http://backend:5002`).
- **Browser never uses `backend` hostname** — it connects to `ws://localhost:8080/socket.io/...` which the Vite dev server proxies with `ws: true` to the backend container.
- **Polling fallback enabled** — `transports: ['websocket', 'polling']` ensures connectivity even if some intermediate proxy blocks upgrades.
- **Docker validation passed** — `docker compose config --quiet` exits 0.

## 6. Installation & Run Commands

### 6.1 Local Development (two terminals)

**Terminal 1 — Backend**
```bash
cd backend
npm install        # socket.io already added
# Ensure backend/.env has MONGO_URI, JWT_SECRET, etc.
npm run dev        # or: npm start
# Expected: "MongoDB Connected" and "Server running on port 5002"
# If MongoDB/Atlas is unreachable, the server still starts for chat:
#   "MongoDB Connection Error: ..." then "Server running on port 5002"
#   /api/health reports 503 {"status":"degraded","database":"disconnected"}
```

**Terminal 2 — Frontend**
```bash
npm install        # socket.io-client already added
npm run dev
# Expected: Vite ready at http://localhost:5173/
```

**Open the Chat page:** `http://localhost:5173/chat.html`

### 6.2 Docker Deployment (existing workflow)
```bash
# From repo root
docker compose config --quiet   # validate (secrets not printed)
docker compose up -d --build    # build and start both containers
docker compose ps               # check status
```

**Open the Chat page:** `http://localhost:8080/chat.html`  
Socket.IO is proxied through the frontend container's Vite dev server to the backend container over the Compose network.

### 6.3 Production Build
```bash
npm run build       # outputs to dist/ including dist/chat.html and dist/assets/chat-*.js
```

## 7. How to Test With Two Browser Sessions

1. Start the backend and frontend (sections 6.1 or 6.2).
2. Open `http://localhost:5173/chat.html` (or `:8080/chat.html`) in **Browser Window A**.
3. Open the **same URL** in **Browser Window B** (a different window, incognito window, or a different browser).
4. Wait until both show **Connected** in the status badge and the online count increases.
5. In Window A: enter a username (e.g., `Aditi`) and click **Update name**.
6. In Window B: enter a different username (e.g., `Rohan`) and click **Update name** — both windows should list each other online.
7. In Window A: type a message and click **Send** (or press **Enter**). It should appear instantly in Window B with the username and a readable time — **no page refresh**.
8. In Window B: reply — it should appear instantly in Window A.
9. Test validation: send an empty/whitespace-only message (rejected, error shown, count unchanged). Send a message > 500 characters (rejected by server with an error).
10. Test reconnect: stop the backend, watch both show **Disconnected**, restart the backend and watch them return to **Connected** (Socket.IO auto-reconnects).

## 8. Expected Results

| Check | Expected |
| --- | --- |
| Chat page loads | Title is **Real-Time Chat Application**; all UI elements render |
| Connection | Status shows **Connected**; a WebSocket is opened through the same-origin proxy (`ws://localhost:5173/socket.io/...` or via `:8080`) with polling fallback available |
| Presence | Online count and user list update on join/leave |
| Real-time delivery | A message in session A appears in session B and vice versa with no refresh; sender sees its own message (server echo) |
| Timestamps | Each message shows a readable local time |
| Auto-scroll | The message list scrolls to the newest message |
| Enter to send | `Enter` sends; `Shift+Enter` adds a newline |
| Empty rejection | Whitespace-only messages are not broadcast; a helpful error is shown |
| Length rejection | Messages > 500 characters rejected by the server with a specific error; not broadcast |
| Rate limiting | Excessive messages (> 8 in 10 s) are rejected by the server |
| Reconnect | Dropping and restoring the server updates status to Disconnected/Connected via Socket.IO auto-reconnect; recent history is available |
| Clean unmount | Navigating away closes the socket (no dangling connections) |
| Existing features intact | All Exp 1–7 pages render; `/api/health` still reports correct DB status; existing REST endpoints still work on the same port |
| Build/Docker | `npm run build` succeeds; `docker compose config --quiet` valid; WebSocket handshake works through `http://localhost:8080/socket.io/` |

## 9. Limitations (as requested)

- **Messages are not permanently stored** — they live only in an in-memory ring buffer on the server. Restarting the backend clears history.
- **Usernames are not authenticated** — anyone can pick any display name. No JWT/login is required for chat in this experiment.
- **Production readiness required** — for a real deployment you must add proper authentication/authorisation, stricter validation, per-user/IP rate limiting (beyond per-socket), persistence (e.g., MongoDB/Redis), **HTTPS/WSS**, appropriate origin restrictions via `CLIENT_ORIGINS`, and consider moderation/spam protection.
- **Atlas connectivity** — the server no longer exits when MongoDB/Atlas is unreachable: it starts the HTTP server and Socket.IO anyway so chat is usable during a temporary DB outage. `/api/health` still honestly reports `503` / `{"status":"degraded"}` and Mongo-backed REST calls (auth/workouts) keep failing until the database is reachable; restart the backend (`docker compose restart backend` / restart `npm run dev`) after fixing Atlas so Mongoose reconnects.

## 10. Screenshot Checklist (for practical submission)

Capture the following:
1. **Architecture** — terminal showing backend logs with `MongoDB Connected` and `Server running on port 5002`
2. **Chat page UI** — full page showing title "Real-Time Chat Application", status, username input, message area, online list
3. **Two browser sessions** — side-by-side showing both windows open to `chat.html` with **Connected** status
4. **Real-time message** — message sent from session A appearing in session B (and echo in A), with username and timestamp visible
5. **Bi-directional chat** — reply from session B appearing in session A
6. **Online users** — showing both usernames in the online list
7. **Validation** — empty-message rejection with error message
8. **WebSocket connection** — browser DevTools → Network tab filtered by `WS` showing `socket.io` connection to `localhost:5173` (or `localhost:8080`)
9. **Docker** — `docker compose ps` output and/or `http://localhost:8080/chat.html` with WebSocket working
10. **Build success** — `npm run build` output showing `dist/chat.html` and `dist/assets/chat-*.js`
