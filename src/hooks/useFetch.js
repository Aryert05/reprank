import { useCallback, useEffect, useState } from 'react';

// Custom Hook #2 — "fetch data on load" pattern extended for Experiment 4 REST API.
// Wraps useEffect + useState to handle fetcher execution, loading state, error catching,
// and provides a refetch callback to refresh data after REST API CRUD operations.
export function useFetch(fetcher, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const executeFetch = useCallback(() => {
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

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const cleanup = executeFetch();
    return cleanup;
  }, [executeFetch]);

  return { data, loading, error, refetch: executeFetch, setData };
}
