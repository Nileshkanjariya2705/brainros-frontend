import { type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/queryClient';

// ** Types **
interface QueryProviderProps {
  children: ReactNode;
}

/**
 * TanStack Query provider — server-state layer (caching, retries, dedupe,
 * background refetch). Sits alongside Redux: Redux holds CLIENT state (auth,
 * UI), React Query holds SERVER state (API data).
 *
 * Uses the shared queryClient singleton from `@/queryClient`.
 */
const QueryProvider = ({ children }: QueryProviderProps) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools render only in dev; excluded from the prod runtime. */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
};

export default QueryProvider;
