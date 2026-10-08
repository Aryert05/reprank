import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import workoutRoutes from './routes/workoutRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const INITIAL_PORT = process.env.PORT || 5000;

// Enable CORS and JSON body parsing
app.use(cors());
app.use(express.json());

// Root health-check route
app.get('/', (req, res) => {
  res.send('RepRank API is Running');
});

// REST API routes
app.use('/api/workouts', workoutRoutes);

// Helper to start HTTP server on specified port with fallback for port conflicts
const listenWithFallback = (port) => {
  const server = app
    .listen(port, () => {
      console.log(`Server running on port ${port}`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        const nextPort = Number(port) + 1;
        console.warn(`Port ${port} in use (e.g. macOS AirPlay). Attempting port ${nextPort}...`);
        listenWithFallback(nextPort);
      } else {
        console.error('Server error:', err.message);
        process.exit(1);
      }
    });
};

// Database Connection & Server Initialization (Strict MongoDB Atlas / Configured URI mode)
const startServer = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri || mongoUri.includes('your_mongodb_atlas_connection_string')) {
      console.error('MongoDB Connection Error: MONGO_URI is missing or unconfigured in backend/.env');
      process.exit(1);
    }

    // Connect strictly to the configured MongoDB URI
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected');

    listenWithFallback(INITIAL_PORT);
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

startServer();
