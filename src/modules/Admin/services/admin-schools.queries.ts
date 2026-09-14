import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminKeys } from '@/services/queryKeys';
import {
  AdminSchoolsApi,
  type SchoolFilterOptions,
  type CreateSchoolPayload,
} from './admin-schools.service';

export function useAdminSchoolsQuery(params: {
  page: number;
  limit: number;
  search?: string;
  stateId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: adminKeys.schools(params),
    queryFn: async () => {
      const res: any = await AdminSchoolsApi.getSchools({
        page: params.page,
        limit: params.limit,
        search: params.search || undefined,
        stateId: params.stateId || undefined,
        status: params.status || undefined,
      });
      const list = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : [];
      const total =
        res?.meta?.total ?? (Array.isArray(res) ? res.length : list.length);
      const totalPages =
        res?.meta?.pages ?? res?.meta?.totalPages ?? (Math.ceil(total / params.limit) || 1);

      return {
        schools: list,
        total,
        totalPages,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useAdminSchoolFiltersQuery() {
  return useQuery<SchoolFilterOptions>({
    queryKey: adminKeys.schoolFilterOptions(),
    queryFn: async () => {
      return await AdminSchoolsApi.getFilterOptions();
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateSchoolMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSchoolPayload) => AdminSchoolsApi.createSchool(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.schools() });
      qc.invalidateQueries({ queryKey: adminKeys.schoolFilterOptions() });
    },
  });
}

export function useUpdateSchoolMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateSchoolPayload> }) =>
      AdminSchoolsApi.updateSchool(id, payload),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: adminKeys.schools() });
      qc.invalidateQueries({ queryKey: adminKeys.schoolDetail(id) });
    },
  });
}

export function useUpdateSchoolStatusMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: 'ACTIVE' | 'INACTIVE'; reason?: string }) =>
      AdminSchoolsApi.updateSchoolStatus(id, status, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.schools() });
    },
  });
}

export function useUploadBulkSchoolsMutation() {
  return useMutation({
    mutationFn: (file: File) => AdminSchoolsApi.uploadSchools(file),
  });
}

export function useConfirmBulkSchoolsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (uploadId: string) => AdminSchoolsApi.confirmUpload(uploadId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: adminKeys.schools() });
      qc.invalidateQueries({ queryKey: adminKeys.schoolFilterOptions() });
    },
  });
}
