import { createContext, useContext, useEffect, useState } from 'react';

// Experiment 3: Global workout state using Context API
// This context tracks the user's workout progress across all RepRank pages.
// localStorage is used to persist state across the multi-page HTML entry points.

export const WorkoutContext = createContext();

const STORAGE_KEY = 'reprank_workout_state';

const DEFAULT_STATE = {
  completedSets: 0,
  completedWorkouts: 0,
  totalExercises: 0,
  totalVolume: 0,
};

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load workout state from localStorage:', e);
  }
  return DEFAULT_STATE;
}

export function WorkoutProvider({ children }) {
  const [workoutState, setWorkoutState] = useState(loadState);

  // Persist to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workoutState));
    } catch (e) {
      console.warn('Failed to save workout state to localStorage:', e);
    }
  }, [workoutState]);

  // Action: increment completed sets when user completes a set in Workout page
  const addCompletedSet = () => {
    setWorkoutState((prev) => ({
      ...prev,
      completedSets: prev.completedSets + 1,
    }));
  };

  // Action: mark a workout as completed when user finishes the workout session
  const completeWorkout = () => {
    setWorkoutState((prev) => ({
      ...prev,
      completedWorkouts: prev.completedWorkouts + 1,
    }));
  };

  // Optional action: reset workout progress
  const resetWorkout = () => {
    setWorkoutState(DEFAULT_STATE);
  };

  return (
    <WorkoutContext.Provider
      value={{
        workoutState,
        addCompletedSet,
        completeWorkout,
        resetWorkout,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
}

// Custom hook for consuming WorkoutContext (extends Experiment 2's hook pattern)
export function useWorkout() {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used inside a WorkoutProvider');
  }
  return context;
}
