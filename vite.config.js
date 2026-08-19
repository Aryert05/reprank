import { defineConfig } from 'vite';
import { resolve } from 'path';

// RepRank is a multi-page vanilla JS site (no React yet — that's Experiment 2).
// Vite needs every HTML page listed here so `npm run build` bundles all of them.
export default defineConfig({
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
