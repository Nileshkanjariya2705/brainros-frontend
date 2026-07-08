// ** Packages **
import { useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// ** Types **
interface QueryProviderProps {
  children: ReactNode;
}

/**
 * TanStack Query provider — server-state layer (caching, retries, dedupe,
 * background refetch). Sits alongside Redux: Redux holds CLIENT state (auth,
 * UI), React Query holds SERVER state (API data).
 *
 * The client is created once via useState so it survives re-renders but is not
 * shared across requests (important for SSR/tests). Tune the defaults per app.
 */
const QueryProvider = ({ children }: QueryProviderProps) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // 1 min — data is "fresh" before a background refetch
            gcTime: 5 * 60_000, // cache kept 5 min after last use
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools render only in dev; excluded from the prod runtime. */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default QueryProvider;
