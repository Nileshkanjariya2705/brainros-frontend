// ** Packages **
import { useQuery } from '@tanstack/react-query';

// ** Base Axios **
import { Axios } from '@/base-axios';

// ** Types **
import type { DashboardStats } from './index';

/**
 * TanStack Query example — the RECOMMENDED way to read server state.
 *
 * It calls the shared `Axios` instance (so the auth interceptor + baseURL still
 * apply) and lets React Query handle caching, retries, dedupe and loading state.
 * This is the modern alternative to the `useGetStatsAPI` (useAxios) hook —
 * prefer this pattern for new GET endpoints.
 *
 *   const { data, isLoading, error } = useDashboardStatsQuery();
 */

// Centralized, typed query keys (cache invalidation targets these).
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export const useDashboardStatsQuery = () =>
  useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      // Backend wraps payloads as { data: { data } } (see useAxios).
      const res = await Axios.get<{ data: DashboardStats }>('/dashboard/stats');
      return res.data.data;
    },
  });
