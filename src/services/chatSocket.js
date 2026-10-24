// Experiment 8: Socket.IO client service.
//
// A SINGLE Socket.IO connection is shared by the whole app. The instance is
// created lazily on first use and kept in a module-level variable, so React
// re-renders never create a new socket.
//
// The client connects to the SAME ORIGIN as the page (`io()` with no URL),
// which means the browser requests `/socket.io/` on the address it already
// loaded the page from. That request is proxied by Vite to the Express
// backend — so the browser never needs to know the backend's address and
// never needs the Docker-only hostname `backend`.
//
// Local dev : browser -> localhost:5173/socket.io -> Vite proxy -> localhost:5002
// Docker    : browser -> localhost:8080/socket.io -> Vite proxy -> backend:5002
import { io } from 'socket.io-client';

// The one and only socket instance for the page.
let socket = null;

// Returns the shared socket, creating it on first call.
export function getChatSocket() {
  if (socket) return socket;

  socket = io({
    // Same-origin: connect to whatever origin served this page.
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
