import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Axios } from '@/base-axios';
import { academicKeys } from '@/services/queryKeys';
import type { NamedEntity, ChapterItem, CreateChapterPayload, UpdateChapterPayload } from '../types/academic.types';

const ACADEMIC_BASE_PATH = '/academic';

export function useAcademicSubjectsQuery(examTargetId?: string) {
  return useQuery<NamedEntity[]>({
    queryKey: academicKeys.subjects(examTargetId),
    queryFn: async () => {
      const res = await Axios.get(`${ACADEMIC_BASE_PATH}/subjects`, {
        params: examTargetId ? { examTargetId } : {},
      });
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 10 * 60_000,
  });
}

export function useAcademicExamTargetsQuery() {
  return useQuery<NamedEntity[]>({
    queryKey: academicKeys.examTargets(),
    queryFn: async () => {
      const res = await Axios.get(`${ACADEMIC_BASE_PATH}/exam-targets`);
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 10 * 60_000,
  });
}

export function useAcademicChaptersQuery(subjectId?: string) {
  return useQuery<ChapterItem[]>({
    queryKey: academicKeys.chapters(subjectId),
    queryFn: async () => {
      const res = await Axios.get(`${ACADEMIC_BASE_PATH}/chapters`, {
        params: subjectId ? { subjectId } : {},
      });
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: subjectId !== undefined,
    staleTime: 5 * 60_000,
  });
}

export function useAllAcademicChaptersQuery(params: {
  page?: number;
  limit?: number;
  search?: string;
  subjectId?: string;
  status?: string;
} = {}) {
  return useQuery<{
    chapters: ChapterItem[];
    total: number;
    totalPages: number;
  }>({
    queryKey: academicKeys.allChapters(params),
    queryFn: async () => {
      const res = await Axios.get(`${ACADEMIC_BASE_PATH}/chapters/all`, { params });
      const raw = res.data;
      const list: ChapterItem[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.data?.data)
            ? raw.data.data
            : [];
      const total = raw?.meta?.total ?? list.length;
      const totalPages = raw?.meta?.pages ?? raw?.meta?.totalPages ?? (Math.ceil(total / (params.limit || 10)) || 1);

      return {
        chapters: list,
        total,
        totalPages,
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useCreateChapterMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateChapterPayload) => {
      const res = await Axios.post(`${ACADEMIC_BASE_PATH}/chapters`, payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academicKeys.all });
    },
  });
}

export function useUpdateChapterMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateChapterPayload }) => {
      const res = await Axios.patch(`${ACADEMIC_BASE_PATH}/chapters/${id}`, payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academicKeys.all });
    },
  });
}

export function useDeleteChapterMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await Axios.delete(`${ACADEMIC_BASE_PATH}/chapters/${id}`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academicKeys.all });
    },
  });
}

export function useReorderChaptersMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orders: { id: string; displayOrder: number }[]) => {
      const res = await Axios.patch(`${ACADEMIC_BASE_PATH}/chapters/reorder`, { orders });
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academicKeys.all });
    },
  });
}
