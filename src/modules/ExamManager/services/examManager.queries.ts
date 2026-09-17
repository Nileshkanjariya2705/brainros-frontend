import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Axios } from '@/base-axios';
import { examManagerKeys, questionPaperKeys, examKeys } from '@/services/queryKeys';
import type {
  ExamManagerFilterParams,
  ExamListResponse,
  ExamItem,
  QuestionPaperPreviewResult,
  CreateExamFromUploadPayload,
  ExamImportFilterParams,
} from '../types/examManager.types';

const EXAM_MANAGER_BASE_PATH = '/admin/exam-manager';

export function useExamManagerExamsQuery(params: ExamManagerFilterParams = {}) {
  return useQuery<ExamListResponse>({
    queryKey: examManagerKeys.exams(params),
    queryFn: async () => {
      const queryParts: string[] = [];
      if (params.search && params.search.trim())
        queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
      if (params.type && params.type !== 'ALL') queryParts.push(`type=${params.type}`);
      if (params.status && params.status !== 'ALL') queryParts.push(`status=${params.status}`);
      if (params.page) queryParts.push(`page=${params.page}`);
      if (params.limit) queryParts.push(`limit=${params.limit}`);
      if (params.sortBy) queryParts.push(`sortBy=${params.sortBy}`);
      if (params.sortOrder) queryParts.push(`sortOrder=${params.sortOrder}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const response = await Axios.get(`${EXAM_MANAGER_BASE_PATH}/exams${queryString}`);
      return response?.data?.data !== undefined ? response.data.data : response?.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useExamManagerExamDetailQuery(examId?: string) {
  return useQuery<ExamItem>({
    queryKey: examManagerKeys.examDetail(examId || ''),
    queryFn: async () => {
      if (!examId) throw new Error('Exam ID required');
      const response = await Axios.get(`${EXAM_MANAGER_BASE_PATH}/exams/${examId}`);
      return response?.data?.data !== undefined ? response.data.data : response?.data;
    },
    enabled: Boolean(examId),
    staleTime: 60_000,
  });
}

export function useQuestionPaperDetailQuery(examId?: string, versionId?: string) {
  return useQuery<QuestionPaperPreviewResult>({
    queryKey: questionPaperKeys.detail(examId || '', versionId),
    queryFn: async () => {
      if (!examId) throw new Error('Exam ID required');
      const url = versionId
        ? `${EXAM_MANAGER_BASE_PATH}/exams/${examId}/question-paper?versionId=${versionId}`
        : `${EXAM_MANAGER_BASE_PATH}/exams/${examId}/question-paper`;
      const response = await Axios.get(url);
      return response?.data?.data !== undefined ? response.data.data : response?.data;
    },
    enabled: Boolean(examId),
    staleTime: 60_000,
  });
}

export function useImportHistoryQuery(params: ExamImportFilterParams = {}) {
  return useQuery<{ sessions: any[]; pagination: { total: number; totalPages: number; page: number; limit: number } }>({
    queryKey: examManagerKeys.importHistory(params),
    queryFn: async () => {
      const queryParts: string[] = [];
      if (params.page) queryParts.push(`page=${params.page}`);
      if (params.limit) queryParts.push(`limit=${params.limit}`);
      if (params.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
      if (params.status) queryParts.push(`status=${params.status}`);
      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      const response = await Axios.get(`${EXAM_MANAGER_BASE_PATH}/import-sessions${queryString}`);
      return response?.data?.data !== undefined ? response.data.data : response?.data;
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCreateExamFromUploadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateExamFromUploadPayload) => {
      const response = await Axios.post(`${EXAM_MANAGER_BASE_PATH}/create-from-upload`, payload);
      return response?.data?.data !== undefined ? response.data.data : response?.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examManagerKeys.all });
      qc.invalidateQueries({ queryKey: examKeys.all });
    },
  });
}

export function useUploadQuestionPaperMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { examId: string; file: File; languageId?: string; mode?: string }) => {
      const formData = new FormData();
      formData.append('file', payload.file);
      if (payload.languageId) formData.append('languageId', payload.languageId);
      if (payload.mode) formData.append('mode', payload.mode);

      const response = await Axios.post(
        `${EXAM_MANAGER_BASE_PATH}/question-papers/${payload.examId}/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      return response?.data?.data !== undefined ? response.data.data : response?.data;
    },
    onSuccess: (_data, { examId }) => {
      qc.invalidateQueries({ queryKey: questionPaperKeys.detail(examId) });
      qc.invalidateQueries({ queryKey: examManagerKeys.all });
    },
  });
}

export function useCreateManualQuestionsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { examId: string; questions: any[]; languageId?: string }) => {
      const response = await Axios.post(
        `${EXAM_MANAGER_BASE_PATH}/question-papers/${payload.examId}/manual`,
        payload,
      );
      return response?.data?.data !== undefined ? response.data.data : response?.data;
    },
    onSuccess: (_data, { examId }) => {
      qc.invalidateQueries({ queryKey: questionPaperKeys.detail(examId) });
      qc.invalidateQueries({ queryKey: examManagerKeys.all });
    },
  });
}

export function useSaveDraftQuestionsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { examId: string; draft: any }) => {
      const response = await Axios.post(
        `${EXAM_MANAGER_BASE_PATH}/question-papers/${payload.examId}/draft`,
        payload.draft,
      );
      return response?.data?.data !== undefined ? response.data.data : response?.data;
    },
    onSuccess: (_data, { examId }) => {
      qc.invalidateQueries({ queryKey: questionPaperKeys.detail(examId) });
    },
  });
}
