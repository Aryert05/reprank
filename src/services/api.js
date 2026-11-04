// Experiment 4: Frontend API client service for RepRank REST API backend.
// Supports full CRUD operations (GET, POST, PUT, DELETE) against /api/workouts.

import { apiUrl } from './runtimeConfig.js';
import { authHeaders } from './auth.js';

const API_BASE = apiUrl('/api/workouts');

function buildHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const auth = authHeaders();
  if (auth?.Authorization) {
    headers.Authorization = auth.Authorization;
  }
  return headers;
}

async function handleResponse(response, fallback) {
  if (response.ok) {
    return response.json().catch(() => ({}));
  }
  const errData = await response.json().catch(() => ({}));
  const error = new Error(errData.message || fallback || `Request failed: ${response.statusText}`);
  error.status = response.status;
  error.code = errData.code;
  throw error;
}

export async function fetchWorkouts() {
  const response = await fetch(API_BASE, {
    headers: buildHeaders(),
  });
  return handleResponse(response, 'Failed to fetch workouts');
}

export async function fetchWorkoutById(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: buildHeaders(),
  });
  return handleResponse(response, `Failed to fetch workout #${id}`);
}

export async function createWorkout(workoutData) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(workoutData),
  });

  return handleResponse(response, 'Failed to create workout');
}

export async function updateWorkout(id, workoutData) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(workoutData),
  });

  return handleResponse(response, 'Failed to update workout');
}

export async function deleteWorkout(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });

  return handleResponse(response, 'Failed to delete workout');
}
