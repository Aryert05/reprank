import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// RepRank is still a multi-page site (8 separate .html files) — Experiment 2 adds
// React to each page via the official React plugin, keeping the same multi-entry
// build so every page ships as its own small React app instead of one big SPA.
export default defineConfig({
  plugins: [react()],
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
