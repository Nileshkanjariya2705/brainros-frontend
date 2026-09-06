import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Axios } from '@/base-axios';
import { adminKeys } from '@/services/queryKeys';
import type {
  AdminStudentsResponse,
  AdminStudentsQueryParams,
  AdminStudentFilterOptions,
  StudentParentsResponse,
  AddStudentParentPayload,
} from './admin-students.service';

/**
 * Server-side paginated & filtered Admin Students query.
 * Retains previous data while fetching the next page or filter change to prevent table blank flash.
 */
export const useAdminStudentsQuery = (params: AdminStudentsQueryParams = {}) =>
  useQuery<AdminStudentsResponse>({
    queryKey: adminKeys.students(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', String(params.page));
      if (params.pageSize) searchParams.append('pageSize', String(params.pageSize));
      if (params.search && params.search.trim())
        searchParams.append('search', params.search.trim());
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      if (params.status) searchParams.append('status', params.status);
      if (params.classId) searchParams.append('classId', params.classId);
      if (params.examTargetId) searchParams.append('examTargetId', params.examTargetId);
      if (params.stateId) searchParams.append('stateId', params.stateId);
      if (params.districtId) searchParams.append('districtId', params.districtId);
      if (params.institutionId) searchParams.append('institutionId', params.institutionId);
      if (params.createdFrom) searchParams.append('createdFrom', params.createdFrom);
      if (params.createdTo) searchParams.append('createdTo', params.createdTo);

      const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const res = await Axios.get<AdminStudentsResponse | { data: AdminStudentsResponse }>(
        `/admin/students${qs}`,
      );
      return (res.data as any).data || res.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

/**
 * Cached Admin student master filter options (states, districts, classes, exam targets, institutions, statuses).
 * Static master data cached for 30 minutes.
 */
export const useAdminStudentFilterOptionsQuery = () =>
  useQuery<AdminStudentFilterOptions>({
    queryKey: adminKeys.studentFilterOptions(),
    queryFn: async () => {
      const res = await Axios.get<AdminStudentFilterOptions | { data: AdminStudentFilterOptions }>(
        '/admin/students/filter-options',
      );
      return (res.data as any).data || res.data;
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

/**
 * Admin Student's linked parents query.
 */
export const useAdminStudentParentsQuery = (studentId?: string) =>
  useQuery<StudentParentsResponse>({
    queryKey: adminKeys.studentParents(studentId || ''),
    queryFn: async () => {
      if (!studentId) throw new Error('studentId required');
      const res = await Axios.get<StudentParentsResponse | { data: StudentParentsResponse }>(
        `/admin/students/${studentId}/parents`,
      );
      return (res.data as any).data || res.data;
    },
    enabled: Boolean(studentId),
    staleTime: 30_000,
  });

/**
 * Mutations for Student Parent management with targeted invalidation.
 */
export const useAddStudentParentMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      studentId,
      payload,
    }: {
      studentId: string;
      payload: AddStudentParentPayload;
    }) => {
      const res = await Axios.post(`/admin/students/${studentId}/parents`, payload);
      return (res.data as any).data || res.data;
    },
    onSuccess: (_data, { studentId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.studentParents(studentId) });
      qc.invalidateQueries({ queryKey: adminKeys.students() });
    },
  });
};

export const useDeleteStudentParentMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ studentId, linkId }: { studentId: string; linkId: string }) => {
      const res = await Axios.delete(`/admin/students/${studentId}/parents/${linkId}`);
      return (res.data as any).data || res.data;
    },
    onSuccess: (_data, { studentId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.studentParents(studentId) });
      qc.invalidateQueries({ queryKey: adminKeys.students() });
    },
  });
};
