import { createContext, useContext, useState } from 'react';

// ---- Context ----
// UserContext.Provider makes the signed-in user's info available to every
// component underneath it, so Navbar, Dashboard and Profile can all read it
// directly with useContext() instead of it being passed down as props through
// Layout -> Page -> ... (that's the "prop drilling" useContext avoids).
export const UserContext = createContext(null);

// Experiment 2 still has no backend/auth, so this is a fixed demo user.
// A later experiment will replace this useState with a real user fetched after login.
const DEMO_USER = {
  name: 'Aditi Sharma',
  username: 'aditi.lifts',
  role: 'Member',
  level: 12,
  xp: 820,
  xpToNext: 1000,
  streak: 14,
  workouts: 32,
  seasonRank: 8,
};

export function UserProvider({ children }) {
  const [user] = useState(DEMO_USER);
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

// Small convenience wrapper so most components call useUser() instead of
// useContext(UserContext) directly, and get a clear error if a Provider is missing.
// (Dashboard.jsx uses useContext(UserContext) directly, matching the practical's example.)
export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error('useUser() must be used inside a <UserProvider>');
  }
  return ctx;
}
