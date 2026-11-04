import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import workoutRoutes from './routes/workoutRoutes.js';
import userRoutes from './routes/userRoutes.js';
import {
  DATABASE_UNAVAILABLE_CODE,
  DATABASE_UNAVAILABLE_MESSAGE,
  isDatabaseUnavailableError,
} from './middleware/databaseMiddleware.js';
import { configureChat, createOriginGuard, resolveAllowedOrigins } from './socket/chat.js';

// Resolve backend/.env relative to this module, not the shell's working
// directory. `npm start` from backend/ and `node backend/server.js` from the
// repository root then load the same configuration.
dotenv.config({ path: fileURLToPath(new URL('./.env', import.meta.url)) });

// Never let a model query sit in Mongoose's buffer while the database is down.
// Routes check the connection first, and this makes any race fail immediately.
mongoose.set('bufferCommands', false);

const app = express();
const PORT = process.env.PORT || 5002;
// Bind to all interfaces so the app is reachable from outside a container
const HOST = process.env.HOST || '0.0.0.0';

if (!process.env.JWT_SECRET) {
  console.warn('Warning: JWT_SECRET is not set. Authentication tokens cannot be verified/signed securely.');
}
if (!process.env.ADMIN_CREATION_SECRET) {
  console.warn('Warning: ADMIN_CREATION_SECRET is not set. Admin registration route will reject all requests.');
}

const parsedMongoTimeout = Number.parseInt(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS, 10);
const MONGO_SERVER_SELECTION_TIMEOUT_MS =
  Number.isFinite(parsedMongoTimeout) && parsedMongoTimeout > 0 ? parsedMongoTimeout : 8000;

// ── Security & parsing middleware ────────────────────────────────────────────
// One origin allow-list shared by the REST API and Socket.IO. Resolved from
// CLIENT_ORIGINS with local development / Docker defaults; never "*".
const allowedOrigins = resolveAllowedOrigins();

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
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
  // Log only safe metadata. Request data and raw driver messages can contain
  // credentials or user content, so they are never written to the console.
  const statusCode = err.statusCode || 500;
  console.error(
    `Server error (${statusCode}): ${err?.name || 'Error'}${err?.code ? ` [${err.code}]` : ''}`,
  );

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ message: 'Invalid JSON payload format' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'User with this email already exists' });
  }
  if (isDatabaseUnavailableError(err)) {
    return res.status(503).json({
      message: DATABASE_UNAVAILABLE_MESSAGE,
      code: DATABASE_UNAVAILABLE_CODE,
    });
  }
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((v) => v.message);
    return res.status(400).json({ message: 'Validation failed', errors: messages });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  if (statusCode >= 500) {
    return res.status(statusCode).json({ message: 'Internal server error' });
  }

  return res.status(statusCode).json({ message: err.message || 'Request failed' });
});

// ── Database → Server startup ────────────────────────────────────────────────
// Chat and the static frontend can remain available during a database outage,
// but every database-backed API route is guarded by requireDatabase() and
// returns 503 immediately instead of waiting for Mongoose buffering to expire.
const listen = () => {
  httpServer.listen(PORT, HOST, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

const logMongoFailure = (error) => {
  const details = [error?.name, error?.code, error?.reason?.type]
    .filter(Boolean)
    .join(' / ');
  console.error(`MongoDB connection failed${details ? ` (${details})` : ''}.`);
  console.error(
    'Check MONGO_URI, the Atlas database user credentials, the cluster state, and the Atlas Network Access IP allow-list.',
  );
};

const startServer = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.includes('<username>')) {
    console.error('MongoDB configuration error: MONGO_URI is missing or still contains placeholders.');
    console.warn('Starting HTTP server without MongoDB. Auth and data routes will return 503.');
    listen();
    return;
  }

  console.log(
    `Connecting to MongoDB (server selection timeout ${MONGO_SERVER_SELECTION_TIMEOUT_MS}ms)...`,
  );

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: MONGO_SERVER_SELECTION_TIMEOUT_MS,
    });
    console.log('MongoDB connected.');
    listen();
  } catch (error) {
    logMongoFailure(error);
    console.warn('Starting HTTP server in degraded mode. Auth and data routes will return 503.');
    listen();
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Database-backed API routes will return 503.');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected.');
});

startServer();
