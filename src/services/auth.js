// Authentication API helper (Experiment 7 debug/fix)
const AUTH_BASE = '/api/users';

// Builds the Authorization header for protected endpoints.
// Returns null when there is no stored session.
export function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : null;
}

export async function loginUser({ email, password }) {
  const response = await fetch(`${AUTH_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.message ||
      (Array.isArray(data?.errors) && data.errors.map((e) => e.message).join(' ')) ||
      `Login failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export async function registerUser({ name, email, password }) {
  const response = await fetch(`${AUTH_BASE}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.message ||
      (Array.isArray(data?.errors) && data.errors.map((e) => e.message).join(' ')) ||
      `Registration failed (${response.status})`;
    throw new Error(message);
  }

  return data;
}

export function getAuthToken() {
  try {
    return localStorage.getItem('reprank_token') || '';
  } catch {
    return '';
  }
}

export function getAuthUser() {
  try {
    const raw = localStorage.getItem('reprank_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession({ token, user }) {
  try {
    if (token) localStorage.setItem('reprank_token', token);
    if (user) localStorage.setItem('reprank_user', JSON.stringify(user));
  } catch {
    // ignore storage errors
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem('reprank_token');
    localStorage.removeItem('reprank_user');
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

  const response = await fetch(`${AUTH_BASE}/profile`, { headers });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const err = new Error(data.message || `Failed to load profile (${response.status})`);
    err.status = response.status;
    throw err;
  }

  return response.json();
}
