import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminKeys } from '@/services/queryKeys';
import {
  fetchPublicRegistrationsAPI,
  fetchPublicRegistrationStatsAPI,
  fetchPublicRegistrationFilterOptionsAPI,
  fetchPublicStudentByIdAPI,
  deactivatePublicStudentAPI,
  activatePublicStudentAPI,
  type PublicRegistrationsQueryParams,
  type PublicRegistrationsResponse,
  type PublicRegistrationStats,
} from './public-registrations.service';

/**
 * 1. Server-side paginated & filtered Public Registrations Query
 */
export const usePublicRegistrationsQuery = (params: PublicRegistrationsQueryParams = {}) =>
  useQuery<PublicRegistrationsResponse>({
    queryKey: adminKeys.publicRegistrations(params),
    queryFn: () => fetchPublicRegistrationsAPI(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });

/**
 * 2. Public Registration KPI Metrics Query
 */
export const usePublicRegistrationStatsQuery = () =>
  useQuery<PublicRegistrationStats>({
    queryKey: adminKeys.publicRegistrationStats(),
    queryFn: () => fetchPublicRegistrationStatsAPI(),
    staleTime: 30_000,
  });

/**
 * 3. Dynamic Filter Options Query
 */
export const usePublicRegistrationFilterOptionsQuery = (stateId?: string) =>
  useQuery({
    queryKey: adminKeys.publicRegistrationFilterOptions(stateId),
    queryFn: () => fetchPublicRegistrationFilterOptionsAPI(stateId),
    staleTime: 5 * 60 * 1000,
  });

/**
 * 4. Single Public Student Profile Query
 */
export const usePublicStudentDetailQuery = (studentId: string | null) =>
  useQuery({
    queryKey: adminKeys.publicStudentDetail(studentId || ''),
    queryFn: () => fetchPublicStudentByIdAPI(studentId!),
    enabled: Boolean(studentId),
    staleTime: 60_000,
  });

/**
 * 5. Deactivate Public Student Mutation
 */
export const useDeactivatePublicStudentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, reason }: { studentId: string; reason?: string }) =>
      deactivatePublicStudentAPI(studentId, reason),
    onSuccess: () => {
      // Invalidate public registrations queries
      queryClient.invalidateQueries({
        queryKey: ['public-registrations'],
      });
    },
  });
};

/**
 * 6. Reactivate Public Student Mutation
 */
export const useActivatePublicStudentMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (studentId: string) => activatePublicStudentAPI(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['public-registrations'],
      });
    },
  });
};
