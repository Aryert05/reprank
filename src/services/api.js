// Experiment 4: Frontend API client service for RepRank REST API backend.
// Supports full CRUD operations (GET, POST, PUT, DELETE) against /api/workouts.

const API_BASE = '/api/workouts';

export async function fetchWorkouts() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error(`Failed to fetch workouts: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchWorkoutById(id) {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch workout #${id}: ${response.statusText}`);
  }
  return response.json();
}

export async function createWorkout(workoutData) {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workoutData),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to create workout: ${response.statusText}`);
  }

  return response.json();
}

export async function updateWorkout(id, workoutData) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(workoutData),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to update workout: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteWorkout(id) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `Failed to delete workout: ${response.statusText}`);
  }

  return response.json();
}
