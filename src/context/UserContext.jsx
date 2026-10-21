import { createContext, useContext, useEffect, useState } from 'react';
import {
  clearAuthSession,
  fetchProfile,
  getAuthToken,
  getAuthUser,
  saveAuthSession,
} from '../services/auth.js';

// ---- Context ----
// UserContext.Provider makes the signed-in user's info available to every
// component underneath it, so Navbar, Dashboard and Profile can all read it
// directly with useContext() instead of it being passed down as props through
// Layout -> Page -> ... (that's the "prop drilling" useContext avoids).
export const UserContext = createContext(null);

// Fallback demo user if no authenticated session exists
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

function normalizeUser(user) {
  if (!user) return DEMO_USER;
  return {
    name: user.name || DEMO_USER.name,
    username: user.email ? user.email.split('@')[0] : user.username || DEMO_USER.username,
    email: user.email,
    role: user.role || DEMO_USER.role,
    id: user.id || user._id,
    // Gamification stats have no backend source yet, so they keep their
    // existing values unless the server ever provides them.
    level: user.level ?? DEMO_USER.level,
    xp: user.xp ?? DEMO_USER.xp,
    xpToNext: user.xpToNext ?? DEMO_USER.xpToNext,
    streak: user.streak ?? DEMO_USER.streak,
    workouts: user.workouts ?? DEMO_USER.workouts,
    seasonRank: user.seasonRank ?? DEMO_USER.seasonRank,
  };
}

export function UserProvider({ children }) {
  const [user, setUserState] = useState(() => normalizeUser(getAuthUser()));
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAuthToken());

  // Keep in sync if auth changes in another tab/page
  useEffect(() => {
    const handleStorage = () => {
      setUserState(normalizeUser(getAuthUser()));
      setIsAuthenticated(!!getAuthToken());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Experiment 6: hydrate the real profile from GET /api/users/profile.
  // The stored JWT is sent as a Bearer token. A 401 means the session is no
  // longer valid, so the stale session is cleared and the demo fallback shows.
  useEffect(() => {
    let cancelled = false;

    if (!getAuthToken()) {
      setIsAuthenticated(false);
      return;
    }

    fetchProfile()
      .then((profile) => {
        if (cancelled) return;
        setUserState(normalizeUser(profile));
        setIsAuthenticated(true);
        saveAuthSession({ user: profile });
      })
      .catch((err) => {
        if (cancelled) return;
        // A 401 means the stored token is invalid or expired — drop the stale
        // session so the app falls back to the signed-out state.
        if (err?.status === 401) {
          clearAuthSession();
          setUserState(normalizeUser(null));
          setIsAuthenticated(false);
        }
        // A network failure keeps the locally cached user so the UI still renders.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setUser = (nextUser) => {
    const normalized = normalizeUser(nextUser);
    setUserState(normalized);
    // Persist back so it survives navigation/reload
    if (nextUser && (nextUser.id || nextUser._id || nextUser.email)) {
      saveAuthSession({ user: nextUser });
      setIsAuthenticated(true);
    }
    return normalized;
  };

  const value = {
    ...user,
    user,
    setUser,
    isAuthenticated,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
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
