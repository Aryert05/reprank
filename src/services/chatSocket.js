// Experiment 8: Socket.IO client service.
//
// A SINGLE Socket.IO connection is shared by the whole app. The instance is
// created lazily on first use and kept in a module-level variable, so React
// re-renders never create a new socket.
//
// With no configured Socket.IO URL the client connects to the SAME ORIGIN as
// the page, which means the browser requests `/socket.io/` on the address it
// already loaded the page from. That request is proxied by Vite to the Express
// backend — so local development and Docker never need the Docker-only
// hostname `backend` in browser code.
//
// Local dev : browser -> localhost:5173/socket.io -> Vite proxy -> localhost:5002
// Docker    : browser -> localhost:8080/socket.io -> Vite proxy -> backend:5002
// Production: browser -> VITE_SOCKET_URL (or VITE_API_BASE_URL) -> Render
import { io } from 'socket.io-client';
import { SOCKET_URL } from './runtimeConfig.js';

// The one and only socket instance for the page.
let socket = null;

// Returns the shared socket, creating it on first call.
export function getChatSocket() {
  if (socket) return socket;

  socket = io(SOCKET_URL || undefined, {
    // Same-origin when SOCKET_URL is empty; absolute backend URL otherwise.
    path: '/socket.io',
    // Prefer a real WebSocket, but fall back to HTTP long-polling if the
    // upgrade cannot be negotiated (some proxies block WebSockets).
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
    timeout: 10000,
  });

  return socket;
}

// Closes the shared socket and forgets it, so the next caller gets a fresh
// connection. Called when the Chat page unmounts.
export function closeChatSocket() {
  if (!socket) return;

  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
