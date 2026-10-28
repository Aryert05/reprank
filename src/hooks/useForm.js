import { useState } from 'react';

// Custom Hook #3 — "form handling" logic.
// Holds one object of field values and a single handleChange that works for any
// input by reading its `name` attribute. Reused by both Login and Register so
// neither page writes its own useState-per-field boilerplate.
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function reset() {
    setValues(initialValues);
  }

  return { values, handleChange, reset };
}
