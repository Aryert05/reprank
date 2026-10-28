import { useEffect } from 'react';

// Custom Hook #1 — wraps useEffect to do one small side effect: set the tab title
// when a page loads, and restore the previous title when it unmounts.
// Reused on every page so the useEffect logic is written once, not eight times.
export function useDocumentTitle(title) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
