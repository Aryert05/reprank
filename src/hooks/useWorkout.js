import { useContext } from 'react';
import { WorkoutContext } from '../context/WorkoutContext.jsx';

// Experiment 3: Custom hook that wraps useContext for WorkoutContext.
// Follows the same pattern as useUser() from Experiment 2,
// providing a clean API and a helpful error if the Provider is missing.

export function useWorkout() {
  const context = useContext(WorkoutContext);

  if (!context) {
    throw new Error('useWorkout must be used inside a WorkoutProvider');
  }

  return context;
}
