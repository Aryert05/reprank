import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'node:http';
import { Server } from 'socket.io';
import workoutRoutes from './routes/workoutRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { configureChat, createOriginGuard, resolveAllowedOrigins } from './socket/chat.js';

// Load environment variables from backend/.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;
// Bind to all interfaces so the app is reachable from outside a container
const HOST = process.env.HOST || '0.0.0.0';

// ── Security & parsing middleware ────────────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.send('RepRank API is Running'));

// ── Health endpoint (used by the Docker Compose healthcheck) ─────────────────
// The backend is only considered healthy when MongoDB is actually connected.
// When the Atlas connection is down the endpoint returns HTTP 503 so the
// Docker healthcheck fails and the container is reported as unhealthy.
app.get('/api/health', (req, res) => {
  const database = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const healthy = database === 'connected';

  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    database,
  });
});

app.use('/api/workouts', workoutRoutes);
app.use('/api/users', userRoutes);

// ── Socket.IO (Experiment 8 — real-time chat) ────────────────────────────────
// Socket.IO is attached to the SAME HTTP server as Express, so the REST API
// and the WebSocket endpoint share a single port (5002). The browser reaches
// it through the same-origin `/socket.io/` proxy that Vite already provides
// for `/api`, so no extra CORS wildcard or second port is needed.
const httpServer = http.createServer(app);

// The exact browser origins allowed to open a chat connection.
const allowedOrigins = resolveAllowedOrigins();

const io = new Server(httpServer, {
  path: '/socket.io/',
  // Explicit allow-list — never "*". Override with CLIENT_ORIGINS for a
  // real deployment (comma-separated list of exact frontend origins).
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: false,
  },
  // WebSocket upgrades bypass browser CORS enforcement, so the Origin header
  // is checked server-side here and a mismatched handshake gets HTTP 403.
  allowRequest: createOriginGuard(allowedOrigins),
  // The frontend bundles its own client, so the server never serves one.
  serveClient: false,
  pingInterval: 25000,
  pingTimeout: 20000,
});

configureChat(io);

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// ── Centralized error handler ─────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Log full error server-side only
  console.error('Server Error:', err.message);

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload format' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'User with this email already exists' });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((v) => v.message);
    return res.status(400).json({ message: 'Validation failed', errors: messages });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  res.status(err.statusCode || 500).json({ message: err.message || 'Internal server error' });
});

// ── Database → Server startup ────────────────────────────────────────────────
// For local development, start the HTTP server and Socket.IO even if MongoDB
// is temporarily unreachable. The /api/health endpoint already reports the
// actual connection state (200 connected / 503 disconnected), so existing
// health reporting is preserved without blocking real-time chat.
const startServer = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.includes('<username>')) {
    console.error('MongoDB Connection Error: MONGO_URI is missing or unconfigured in backend/.env');
    console.warn('[server] Starting HTTP server without MongoDB (chat will run; API health will report degraded)');
    httpServer.listen(PORT, HOST, () => {
      console.log(`Server running on port ${PORT}`);
    });
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');
    // Listen on the shared HTTP server so Socket.IO and Express are served
    // by the same port (the REST routes are untouched).
    httpServer.listen(PORT, HOST, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    console.warn('[server] Starting HTTP server without MongoDB (chat will run; API health will report degraded)');
    // Don't exit — allow Socket.IO/chat to work for local testing
    httpServer.listen(PORT, HOST, () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
};

startServer();
