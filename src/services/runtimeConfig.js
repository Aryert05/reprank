// Runtime endpoints for split deployments (Vercel frontend + Render backend).
//
// When the VITE_* variables are unset, every URL stays relative. Local Vite
// development and Docker therefore keep using the existing same-origin proxy.
// When they are set at build time, the static frontend can call the backend
// directly without changing the application code.

const withoutTrailingSlashes = (value) => value.replace(/\/+$/, '');

const configuredApiBaseUrl = withoutTrailingSlashes(
  (import.meta.env.VITE_API_BASE_URL || '').trim(),
);

const configuredSocketUrl = withoutTrailingSlashes(
  (import.meta.env.VITE_SOCKET_URL || '').trim(),
);

export const API_BASE_URL = configuredApiBaseUrl;

// A separate Socket.IO host is optional: most deployments use the same backend.
export const SOCKET_URL = configuredSocketUrl || configuredApiBaseUrl;

export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}
