import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Axios } from '@/base-axios';
import { studentKeys, resultKeys, attemptKeys } from '@/services/queryKeys';
import type {
  FullAnalysisReport,
  ResultStatusResponse,
  DetailedStrategyAnalysis,
  MyRanksResponse,
  QuestionReviewItem,
} from '@/types/exam.types';
import type {
  StudentExamItem,
  StudentPaginationMeta,
  StudentMockTestItem,
  MockTestAttemptsResponse,
} from './index';

export interface StudentExamsResult {
  data: StudentExamItem[];
  meta: StudentPaginationMeta;
}

export interface StudentMockTestsResult {
  data: StudentMockTestItem[];
  meta: StudentPaginationMeta;
}

/**
 * Server-side cached query for available exams.
 */
export const useStudentExamsQuery = (params: Record<string, any> = {}) =>
  useQuery<StudentExamsResult>({
    queryKey: studentKeys.exams(params),
    queryFn: async () => {
      const res = await Axios.get<any>('/students/me/exams', { params });
      const raw = res.data;
      const data = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.data?.data)
            ? raw.data.data
            : [];
      const meta = raw?.meta || raw?.data?.meta || {
        page: params.page || 1,
        limit: params.limit || 12,
        total: data.length,
        totalPages: 1,
      };
      return { data, meta };
    },
    staleTime: 60_000,
  });

/**
 * Server-side cached query for student mock tests.
 */
export const useStudentMockTestsQuery = (params: Record<string, any> = {}) =>
  useQuery<StudentMockTestsResult>({
    queryKey: studentKeys.mockTests(params),
    queryFn: async () => {
      const res = await Axios.get<any>('/students/me/mock-tests', { params });
      const raw = res.data;
      const data = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : Array.isArray(raw?.data?.data)
            ? raw.data.data
            : [];
      const meta = raw?.meta || raw?.data?.meta || {
        page: params.page || 1,
        limit: params.limit || 12,
        total: data.length,
        totalPages: 1,
      };
      return { data, meta };
    },
    staleTime: 60_000,
  });

/**
 * Server-side cached query for attempt history of a specific mock test.
 */
export const useMockTestAttemptsQuery = (mockTestId?: string, params: Record<string, any> = {}) =>
  useQuery<MockTestAttemptsResponse>({
    queryKey: studentKeys.mockAttempts(mockTestId || ''),
    queryFn: async () => {
      if (!mockTestId) throw new Error('mockTestId required');
      const res = await Axios.get<MockTestAttemptsResponse>(
        `/students/me/mock-tests/${mockTestId}/attempts`,
        { params },
      );
      return (res.data as any).data || res.data;
    },
    enabled: Boolean(mockTestId),
    staleTime: 30_000,
  });

/**
 * Server-side query for attempt result processing status with intelligent polling termination.
 * Polls every 3s while in PROCESSING state; halts immediately upon reaching terminal state.
 */
export const useResultStatusQuery = (attemptId?: string) =>
  useQuery<ResultStatusResponse>({
    queryKey: resultKeys.status(attemptId || ''),
    queryFn: async () => {
      if (!attemptId) throw new Error('Attempt ID required');
      const res = await Axios.get<ResultStatusResponse | { data: ResultStatusResponse }>(
        `/students/me/results/${attemptId}/status`,
      );
      return (res.data as any).data || res.data;
    },
    enabled: Boolean(attemptId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 3000;
      const isReady =
        data.availability === 'PUBLISHED' ||
        data.availability === 'RESULT_READY' ||
        data.resultStatus === 'PUBLISHED' ||
        data.resultStatus === 'COMPLETED' ||
        data.resultStatus === 'EVALUATED' ||
        (data as any).status === 'EVALUATED' ||
        data.reportAvailable === true ||
        data.resultAvailable === true;
      const isTerminal =
        isReady || data.availability === 'FAILED' || data.processingStatus === 'FAILED';
      return isTerminal ? false : 3000;
    },
    staleTime: 0,
  });

/**
 * Result full diagnostic analysis report (cached permanently once generated).
 */
export const useFullAnalysisQuery = (attemptId?: string, enabled = true) =>
  useQuery<FullAnalysisReport>({
    queryKey: resultKeys.analysis(attemptId || ''),
    queryFn: async () => {
      if (!attemptId) throw new Error('Attempt ID required');
      const res = await Axios.get<FullAnalysisReport | { data: FullAnalysisReport }>(
        `/students/me/results/${attemptId}/analysis`,
      );
      return (res.data as any).data || res.data;
    },
    enabled: Boolean(attemptId && enabled),
    staleTime: Infinity,
    gcTime: 15 * 60 * 1000,
  });

/**
 * Detailed attempt strategy analysis.
 */
export const useAttemptStrategyQuery = (attemptId?: string, enabled = true) =>
  useQuery<DetailedStrategyAnalysis>({
    queryKey: resultKeys.strategy(attemptId || ''),
    queryFn: async () => {
      if (!attemptId) throw new Error('Attempt ID required');
      const res = await Axios.get<DetailedStrategyAnalysis | { data: DetailedStrategyAnalysis }>(
        `/attempts/${attemptId}/strategy`,
      );
      return (res.data as any).data || res.data;
    },
    enabled: Boolean(attemptId && enabled),
    staleTime: 10 * 60 * 1000,
  });

/**
 * Candidate percentile ranks.
 */
export const useMyRanksQuery = (attemptId?: string, enabled = true) =>
  useQuery<MyRanksResponse>({
    queryKey: resultKeys.myRanks(attemptId || ''),
    queryFn: async () => {
      if (!attemptId) throw new Error('Attempt ID required');
      const res = await Axios.get<MyRanksResponse | { data: MyRanksResponse }>(
        `/attempts/${attemptId}/ranks`,
      );
      return (res.data as any).data || res.data;
    },
    enabled: Boolean(attemptId && enabled),
    staleTime: 10 * 60 * 1000,
  });

/**
 * Candidate question-by-question review items.
 */
export const useAnswerReviewQuery = (attemptId?: string, enabled = true) =>
  useQuery<QuestionReviewItem[]>({
    queryKey: resultKeys.review(attemptId || ''),
    queryFn: async () => {
      if (!attemptId) throw new Error('Attempt ID required');
      const res = await Axios.get<QuestionReviewItem[] | { data: QuestionReviewItem[] }>(
        `/results/${attemptId}/review`,
      );
      const data = (res.data as any).data || res.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(attemptId && enabled),
    staleTime: Infinity,
  });

/**
 * Targeted Exam & Mock Test Mutations
 */
export const useStartAttemptMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { examId: string; languageId?: string }) => {
      const res = await Axios.post('/attempts/start', payload);
      return (res.data as any).data || res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentKeys.exams() });
      qc.invalidateQueries({ queryKey: studentKeys.mockTests() });
    },
  });
};

export const useSubmitAttemptMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ attemptId, payload }: { attemptId: string; payload?: any }) => {
      const res = await Axios.post(`/attempts/${attemptId}/submit`, payload || {});
      return (res.data as any).data || res.data;
    },
    onSuccess: (_data, { attemptId }) => {
      qc.invalidateQueries({ queryKey: attemptKeys.status(attemptId) });
      qc.invalidateQueries({ queryKey: resultKeys.status(attemptId) });
      qc.invalidateQueries({ queryKey: studentKeys.exams() });
      qc.invalidateQueries({ queryKey: studentKeys.mockTests() });
    },
  });
};

export const useLeaveAttemptMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ attemptId, payload }: { attemptId: string; payload?: any }) => {
      const res = await Axios.post(`/attempts/${attemptId}/leave`, payload || {});
      return (res.data as any).data || res.data;
    },
    onSuccess: (_data, { attemptId }) => {
      qc.invalidateQueries({ queryKey: attemptKeys.status(attemptId) });
      qc.invalidateQueries({ queryKey: studentKeys.exams() });
      qc.invalidateQueries({ queryKey: studentKeys.mockTests() });
    },
  });
};
