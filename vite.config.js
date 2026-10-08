import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// RepRank is a multi-page app with 8 HTML entries.
// Experiment 4 adds a Vite development proxy for /api pointing to the Express backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        dashboard: resolve(__dirname, 'dashboard.html'),
        workout: resolve(__dirname, 'workout.html'),
        challenges: resolve(__dirname, 'challenges.html'),
        leaderboard: resolve(__dirname, 'leaderboard.html'),
        profile: resolve(__dirname, 'profile.html'),
      },
    },
  },
});
