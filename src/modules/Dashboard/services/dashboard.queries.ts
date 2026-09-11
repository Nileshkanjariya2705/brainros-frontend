// ** Packages **
import { useQuery } from '@tanstack/react-query';

// ** Base Axios **
import { Axios } from '@/base-axios';
import { studentKeys } from '@/services/queryKeys';

// ** Types **
import type { DashboardStats } from './index';
import type { StudentDashboardResponse, DetailedComparisonResponse } from '@/types/exam.types';

// Centralized, typed query keys (cache invalidation targets these).
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export const useDashboardStatsQuery = () =>
  useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const res = await Axios.get<{ data: DashboardStats }>('/dashboard/stats');
      return res.data.data;
    },
    staleTime: 60_000,
  });

/**
 * Cached TanStack Query hook for Student Personalized Dashboard.
 * Prevents re-fetching the entire dashboard payload on sub-component renders.
 */
export const useStudentDashboardQuery = () =>
  useQuery<StudentDashboardResponse>({
    queryKey: studentKeys.dashboard(),
    queryFn: async () => {
      const res = await Axios.get<StudentDashboardResponse | { data: StudentDashboardResponse }>(
        '/students/me/dashboard',
      );
      return (res.data as any).data || res.data;
    },
    staleTime: 15_000,
  });

/**
 * Cached TanStack Query hook for Student Performance Comparison.
 */
export const useStudentComparisonQuery = (params?: {
  examType?: string;
  examSeriesId?: string;
  from?: string;
  to?: string;
  limit?: number;
  attemptIds?: string;
}) =>
  useQuery<DetailedComparisonResponse>({
    queryKey: studentKeys.comparison(params || {}),
    queryFn: async () => {
      const res = await Axios.get<
        DetailedComparisonResponse | { data: DetailedComparisonResponse }
      >('/students/me/analytics/comparison', { params });
      return (res.data as any).data || res.data;
    },
    staleTime: 60_000,
  });
