// Experiment 8 — Socket.IO chat server logic.
//
// This module is attached to the *existing* Express HTTP server (see server.js).
// It does not start a second server or listen on a second port — Socket.IO
// shares the same port as the REST API, which is what allows the frontend to
// use a single same-origin `/socket.io/` connection through the Vite proxy.
//
// Messages are kept in memory only (a small ring buffer) so a client that
// joins later can see the recent conversation. Nothing is persisted to
// MongoDB — that is out of scope for this experiment.

// ── Limits ────────────────────────────────────────────────────────────────────
const MAX_USERNAME_LENGTH = 32;
const MAX_MESSAGE_LENGTH = 500;
const RATE_LIMIT_WINDOW_MS = 10_000; // sliding window
const RATE_LIMIT_MAX_MESSAGES = 8; // messages allowed per window per socket
const HISTORY_LIMIT = 50; // how many recent messages are kept in memory

// Browser origins that are allowed to open a Socket.IO connection.
//
// These are the addresses the frontend is actually served from:
//   http://localhost:5173  -> local `npm run dev` (Vite dev server)
//   http://localhost:8080  -> Docker Compose (host 8080 -> container 5173)
//
// The list is deliberately NOT "*" — a wildcard origin would let any website
// open a socket against this API. For a real deployment, set the
// CLIENT_ORIGINS environment variable to the exact public frontend URL(s),
// e.g. CLIENT_ORIGINS="https://reprank.example.com".
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
];

// Reads the allowed origins from the environment, falling back to the local
// development / Docker origins above. Never returns "*".
export function resolveAllowedOrigins() {
  const configured = process.env.CLIENT_ORIGINS;

  if (!configured || !configured.trim()) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

// Builds the Socket.IO `allowRequest` guard.
//
// This matters because the browser does NOT enforce CORS on a WebSocket
// upgrade: the `cors` option only controls the `Access-Control-Allow-Origin`
// header on the HTTP long-polling handshake. A malicious page could still
// open a raw WebSocket to this server, so the Origin header is validated
// here and the handshake is rejected with HTTP 403 when it does not match.
//
// Requests without an Origin header (non-browser clients such as the
// Socket.IO CLI, server-to-server calls or a curl health check) are allowed
// through, because they cannot originate from a browser page.
export function createOriginGuard(allowedOrigins) {
  const allowList = new Set(allowedOrigins);

  return (req, callback) => {
    const origin = req?.headers?.origin;

    if (!origin) return callback(null, true);

    callback(null, allowList.has(origin));
  };
}

// ── Payload validation ───────────────────────────────────────────────────────
// Returns a trimmed, valid string or null. The type check matters because a
// client can send literally anything over the wire.
function sanitizeUsername(raw) {
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_USERNAME_LENGTH) return null;

  return trimmed;
}

function sanitizeMessage(raw) {
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > MAX_MESSAGE_LENGTH) return null;

  return trimmed;
}

// Sends an acknowledgement back to the sender. The acknowledgement tells the
// client whether its message was actually accepted, so the UI never has to
// pretend a message was delivered when it was rejected.
function respond(ack, ok, error) {
  if (typeof ack === 'function') {
    ack(ok ? { ok: true } : { ok: false, error });
  }
}

// ── Chat wiring ──────────────────────────────────────────────────────────────
export function configureChat(io) {
  // Ring buffer of the most recent real messages (in memory only).
  const history = [];

  // socket.id -> { id, username, sentAt: [] }
  const clients = new Map();

  function onlineUsers() {
    return [...clients.values()].map((client) => ({
      id: client.id,
      username: client.username || 'Guest',
    }));
  }

  function broadcastUsers() {
    io.emit('chatUsers', { count: clients.size, users: onlineUsers() });
  }

  io.on('connection', (socket) => {
    clients.set(socket.id, { id: socket.id, username: '', sentAt: [] });

    // A newly connected client receives the recent messages that were really
    // sent, plus the current list of people online.
    socket.emit('chatHistory', history.slice());
    broadcastUsers();
    console.log(`[chat] client connected (${clients.size} online)`);

    // The client announces the display name it wants to use.
    socket.on('chatJoin', (payload, ack) => {
      const username = sanitizeUsername(payload?.username);

      if (!username) {
        respond(ack, false, `Username must be between 1 and ${MAX_USERNAME_LENGTH} characters.`);
        return;
      }

      const client = clients.get(socket.id);
      if (client) client.username = username;

      broadcastUsers();
      respond(ack, true);
    });

    // The main event: a client sends a message, the server validates it and
    // broadcasts it to every connected client (including the sender).
    socket.on('chatMessage', (payload, ack) => {
      const client = clients.get(socket.id);

      if (!client) {
        respond(ack, false, 'Your session expired. Please reconnect and try again.');
        return;
      }

      // Per-socket rate limiting (sliding window).
      const now = Date.now();
      client.sentAt = client.sentAt.filter((time) => now - time < RATE_LIMIT_WINDOW_MS);

      if (client.sentAt.length >= RATE_LIMIT_MAX_MESSAGES) {
        respond(ack, false, 'You are sending messages too quickly. Please slow down.');
        return;
      }

      const username = sanitizeUsername(payload?.username);
      const message = sanitizeMessage(payload?.message);

      if (!username) {
        respond(ack, false, `Username must be between 1 and ${MAX_USERNAME_LENGTH} characters.`);
        return;
      }

      if (!message) {
        respond(ack, false, `Message must be between 1 and ${MAX_MESSAGE_LENGTH} characters.`);
        return;
      }

      client.sentAt.push(now);
      if (!client.username) client.username = username;

      const chatMessage = {
        username,
        message,
        timestamp: new Date().toISOString(),
      };

      history.push(chatMessage);
      if (history.length > HISTORY_LIMIT) history.shift();

      io.emit('chatMessage', chatMessage);
      respond(ack, true);
    });

    socket.on('disconnect', () => {
      clients.delete(socket.id);
      broadcastUsers();
      console.log(`[chat] client disconnected (${clients.size} online)`);
    });

    // Never let a single broken socket take the whole server down.
    socket.on('error', (err) => {
      console.warn('[chat] socket error:', err?.message || 'unknown error');
    });
  });

  return { history, clients };
}
