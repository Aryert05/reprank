// Authentication API helper (Experiment 7 debug/fix)
import { apiUrl } from './runtimeConfig.js';

const AUTH_BASE = apiUrl('/api/users');
const TOKEN_KEY = 'reprank_token';
const USER_KEY = 'reprank_user';

function readItem(key) {
  try {
    return localStorage.getItem(key) || sessionStorage.getItem(key) || '';
  } catch {
    return '';
  }
}

function activeStorage() {
  try {
    if (localStorage.getItem(TOKEN_KEY)) return localStorage;
    if (sessionStorage.getItem(TOKEN_KEY)) return sessionStorage;
  } catch {
    // fall through to localStorage
  }
  return localStorage;
}

function createAuthError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  if (code) error.code = code;
  return error;
}

function responseError(data, status, fallback) {
  const message =
    data?.message ||
    (Array.isArray(data?.errors) && data.errors.map((e) => e.message).join(' ')) ||
    fallback;
  return createAuthError(message, status, data?.code);
}

export function getAuthErrorMessage(error, fallback = 'Authentication failed. Please try again.') {
  const message = String(error?.message || '');

  if (
    error?.code === 'DATABASE_UNAVAILABLE' ||
    error?.status === 503 ||
    /buffering timed out|server selection|before initial connection|mongo(?:db|ose)? (?:is )?(?:not )?connected/i.test(
      message,
    )
  ) {
    return 'Authentication is temporarily unavailable because the database is offline. Please try again shortly.';
  }

  if (error?.status >= 500) {
    return 'The authentication service is temporarily unavailable. Please try again shortly.';
  }

  if (
    error?.status === 0 ||
    error instanceof TypeError ||
    /failed to fetch|networkerror|load failed/i.test(message)
  ) {
    return 'Cannot reach the RepRank API. Check that the backend is running and try again.';
  }

  return message || fallback;
}

// Builds the Authorization header for protected endpoints.
// Returns null when there is no stored session.
export function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export async function loginUser({ email, password }) {
  let response;
  try {
    response = await fetch(`${AUTH_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw createAuthError('Cannot reach the RepRank API.', 0, 'NETWORK_UNAVAILABLE');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw responseError(data, response.status, `Login failed (${response.status})`);
  }

  return data;
}

export async function registerUser({ name, email, password }) {
  let response;
  try {
    response = await fetch(`${AUTH_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password }),
    });
  } catch {
    throw createAuthError('Cannot reach the RepRank API.', 0, 'NETWORK_UNAVAILABLE');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw responseError(data, response.status, `Registration failed (${response.status})`);
  }

  return data;
}

export function getAuthToken() {
  return readItem(TOKEN_KEY);
}

export function getAuthUser() {
  try {
    const raw = readItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession({ token, user, remember }) {
  try {
    const storage =
      remember === undefined ? activeStorage() : remember ? localStorage : sessionStorage;

    if (remember !== undefined) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(USER_KEY);
    }

    if (token) storage.setItem(TOKEN_KEY, token);
    if (user) storage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

// Fetches the authenticated user's profile from GET /api/users/profile.
// The stored JWT is sent as a Bearer token. Throws on a 401 (expired or
// invalid session) so the caller can clear the stale session.
export async function fetchProfile() {
  const headers = authHeaders();
  if (!headers) {
    const err = new Error('No active session');
    err.status = 401;
    throw err;
  }

  let response;
  try {
    response = await fetch(`${AUTH_BASE}/profile`, { headers });
  } catch {
    throw createAuthError('Cannot reach the RepRank API.', 0, 'NETWORK_UNAVAILABLE');
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw responseError(data, response.status, `Failed to load profile (${response.status})`);
  }

  return response.json();
}
