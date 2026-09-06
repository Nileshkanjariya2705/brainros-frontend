import { QueryClient } from '@tanstack/react-query';

/**
 * Global TanStack QueryClient singleton.
 * Configured with enterprise defaults:
 * - 60-second default staleTime (prevents refetching when switching pages)
 * - 5-minute garbage collection time
 * - 4xx errors are never retried; transient 5xx errors retried once
 * - refetchOnWindowFocus disabled by default to prevent burst requests on tab switches
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error: any) => {
        const status = error?.response?.status || error?.status;
        if (status && status >= 400 && status < 500) {
          return false;
        }
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false, // Never automatically retry mutations to prevent duplicate side effects
    },
  },
});

/**
 * Clears all user-scoped cached server state upon logout or account switch.
 * Ensures a candidate's or parent's private data never leaks to subsequent sessions.
 */
export const clearUserSessionCache = () => {
  queryClient.clear();
};
