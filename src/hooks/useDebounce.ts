import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce any fast-changing value (e.g. search input).
 * Ensures React Query keys and server requests only update after the user
 * has stopped typing for the specified delay period.
 *
 * @param value The value to debounce
 * @param delay Milliseconds to wait before updating (default: 350ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number = 350): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
