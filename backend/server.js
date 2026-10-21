import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import workoutRoutes from './routes/workoutRoutes.js';
import userRoutes from './routes/userRoutes.js';

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

// ── Database → Server startup (strict Atlas mode — no in-memory fallback) ────
const startServer = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri || mongoUri.includes('<username>')) {
    console.error('MongoDB Connection Error: MONGO_URI is missing or unconfigured in backend/.env');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');
    app.listen(PORT, HOST, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

startServer();
