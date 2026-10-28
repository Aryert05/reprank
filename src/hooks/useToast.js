import { useCallback, useRef, useState } from 'react';

// Custom Hook #4 — "display a notification" logic, reused by Login, Register,
// Workout, Challenges and Profile so every "demo only, no backend yet" action
// gives the same visual confirmation without duplicating the timer/state logic.
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const showToast = useCallback((message) => {
    const id = ++idRef.current;
    setToasts((current) => [...current, { id, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 2200);
  }, []);

  return { toasts, showToast };
}
