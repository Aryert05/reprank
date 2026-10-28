import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// RepRank is a multi-page app with 9 HTML entries.
// Experiment 4 adds a Vite development proxy for /api pointing to the Express backend.
// Experiment 8 adds a /socket.io proxy (with WebSocket upgrade) so the browser can
// open a same-origin Socket.IO connection without ever knowing the backend address.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
      },
      // Socket.IO handshake + WebSocket upgrade.
      // `ws: true` is required for the HTTP -> WebSocket upgrade; without it the
      // connection silently stays on long-polling. The prefix already matches the
      // backend path (/socket.io), so no rewrite is needed.
      '/socket.io': {
        target: process.env.VITE_API_URL || 'http://localhost:5002',
        changeOrigin: true,
        secure: false,
        ws: true,
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
        chat: resolve(__dirname, 'chat.html'),
      },
    },
  },
});
