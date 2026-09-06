import { useQuery } from '@tanstack/react-query';
import { Axios } from '@/base-axios';
import { parentKeys } from '@/services/queryKeys';
import type {
  ParentStudentOverviewItem,
  ParentStudentInfo,
  ParentDashboardResponse,
  PerformanceTrendsResponse,
} from '@/types/exam.types';

/**
 * Cached TanStack Query hook for Parent Dashboard Overview (linked students summary).
 */
export const useParentOverviewQuery = () =>
  useQuery<ParentStudentOverviewItem[]>({
    queryKey: parentKeys.overview(),
    queryFn: async () => {
      const res = await Axios.get<ParentStudentOverviewItem[] | { data: ParentStudentOverviewItem[] }>(
        '/parents/me/dashboard',
      );
      const data = (res.data as any).data || res.data;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

/**
 * Cached TanStack Query hook for Parent Linked Students list.
 */
export const useParentStudentsQuery = () =>
  useQuery<ParentStudentInfo[]>({
    queryKey: parentKeys.dashboard(),
    queryFn: async () => {
      const res = await Axios.get<ParentStudentInfo[] | { data: ParentStudentInfo[] }>(
        '/parents/me/students',
      );
      const data = (res.data as any).data || res.data;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

/**
 * Child-specific Parent Dashboard query.
 * Query key strictly scoped to studentId to prevent cross-child data bleeding.
 */
export const useParentChildDashboardQuery = (studentId?: string) =>
  useQuery<ParentDashboardResponse>({
    queryKey: parentKeys.studentDashboard(studentId || ''),
    queryFn: async () => {
      if (!studentId) throw new Error('studentId required');
      const res = await Axios.get<ParentDashboardResponse | { data: ParentDashboardResponse }>(
        `/parents/me/students/${studentId}/dashboard`,
      );
      return (res.data as any).data || res.data;
    },
    enabled: Boolean(studentId),
    staleTime: 60_000,
  });

/**
 * Child-specific Parent Trends query.
 */
export const useParentChildTrendsQuery = (
  studentId?: string,
  params: { examType?: string; limit?: number } = {},
) =>
  useQuery<PerformanceTrendsResponse>({
    queryKey: [...parentKeys.wardSummary(studentId || ''), params],
    queryFn: async () => {
      if (!studentId) throw new Error('studentId required');
      const searchParams = new URLSearchParams();
      if (params.examType) searchParams.append('examType', params.examType);
      if (params.limit) searchParams.append('limit', String(params.limit));
      const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';

      const res = await Axios.get<PerformanceTrendsResponse | { data: PerformanceTrendsResponse }>(
        `/parents/me/students/${studentId}/trends${qs}`,
      );
      return (res.data as any).data || res.data;
    },
    enabled: Boolean(studentId),
    staleTime: 60_000,
  });
