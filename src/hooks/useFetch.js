import { useEffect, useState } from 'react';

// Custom Hook #2 — the classic "fetch data on load" pattern:
// component loads -> useEffect -> call an async function -> store loading/data/error.
// Reused by Dashboard, Leaderboard and Challenges instead of copy-pasting the same
// three useState calls and useEffect block into each page.
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // Avoids setting state after the component has already unmounted
    // (e.g. if the user navigates away while the "request" is still in flight).
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
