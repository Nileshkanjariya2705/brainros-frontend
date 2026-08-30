// ** Packages **
import { useCallback } from 'react';

// ** Hooks **
import {
  useAxiosGet,
  useAxiosPost,
  useAxiosPut,
  useAxiosPatch,
  useAxiosDelete,
} from '@/hooks/useAxios';

// ** Types **
import type {
  Exam,
  ExamQuestion,
  AttemptStatus,
  AttemptSummary,
  ExamResult,
  SubjectResult,
  ChapterResult,
  QuestionReviewItem,
  FullAnalysisReport,
  TimeAnalyticsReport,
  ActionableRecommendation,
  DetailedStrategyAnalysis,
  StrategyRuleEntity,
  MyRanksResponse,
  AdminLeaderboardResponse,
  SnapshotStatusResponse,
  HistoricalExamEntity,
  DatasetQualityReport,
  ModelAccuracySummary,
  PerformanceTrendsResponse,
  DirectComparisonResponse,
  ParentDashboardResponse,
  ParentStudentOverviewItem,
  ParentStudentInfo,
} from '@/types/exam.types';

export const useGetPublicExamsAPI = () => {
  const [get, state] = useAxiosGet();
  const getPublicExamsAPI = useCallback(
    (params?: { search?: string; examTargetId?: string; page?: number; limit?: number }) =>
      get<{
        data: Exam[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>('/public/exams', { params }),
    [get],
  );
  return { getPublicExamsAPI, ...state };
};

export const useGetAvailableExamsAPI = () => {
  const [get, state] = useAxiosGet();
  const getAvailableExamsAPI = useCallback(
    (examTargetId: string) => get<Exam[]>(`/exams/available/${examTargetId}`),
    [get],
  );
  return { getAvailableExamsAPI, ...state };
};

export const useGetExamDetailsAPI = () => {
  const [get, state] = useAxiosGet();
  const getExamDetailsAPI = useCallback(
    (examId: string) =>
      get<{
        exam: Exam & {
          languages?: Array<{ id: string; name: string; code?: string; nativeName?: string }>;
          schedule?: {
            id: string;
            startTime: string;
            endTime: string;
            timezone: string;
            status: string;
          } | null;
        };
        accessDetails: {
          accessStatus:
            | 'AVAILABLE'
            | 'NOT_YET_STARTED'
            | 'ENDED'
            | 'ALREADY_ATTEMPTED'
            | 'IN_PROGRESS'
            | 'CANCELLED';
          canStart: boolean;
          message: string;
          serverTime: string;
          startTime: string | null;
          endTime: string | null;
          waitSeconds: number;
          existingAttempt?: {
            id: string;
            status: string;
            createdAt: string;
            submittedAt: string | null;
            resultId: string | null;
          } | null;
        };
      }>(`/exams/${examId}/details`),
    [get],
  );
  return { getExamDetailsAPI, ...state };
};

export const useStartAttemptAPI = () => {
  const [post, state] = useAxiosPost();
  const startAttemptAPI = useCallback(
    (examId: string, languageId: string) =>
      post<AttemptStatus>('/attempts/start', { examId, languageId }),
    [post],
  );
  return { startAttemptAPI, ...state };
};

export const useGetAttemptQuestionsAPI = () => {
  const [get, state] = useAxiosGet();
  const getAttemptQuestionsAPI = useCallback(
    (attemptId: string) => get<ExamQuestion[]>(`/attempts/${attemptId}/questions`),
    [get],
  );
  return { getAttemptQuestionsAPI, ...state };
};

export const useGetAttemptStatusAPI = () => {
  const [get, state] = useAxiosGet();
  const getAttemptStatusAPI = useCallback(
    (attemptId: string) => get<AttemptStatus>(`/attempts/${attemptId}/status`),
    [get],
  );
  return { getAttemptStatusAPI, ...state };
};

export const useSaveAnswerAPI = () => {
  const [put, state] = useAxiosPut();
  const saveAnswerAPI = useCallback(
    (
      attemptId: string,
      payload: {
        examQuestionId: string;
        selectedOptionId?: string | null;
        numericalAnswer?: number | null;
        selectedOptions?: string[] | null;
        isMarkedForReview?: boolean;
      },
    ) => put<{ message: string }>(`/attempts/${attemptId}/answer`, payload),
    [put],
  );
  return { saveAnswerAPI, ...state };
};

export const useSubmitAttemptAPI = () => {
  const [post, state] = useAxiosPost();
  const submitAttemptAPI = useCallback(
    (attemptId: string) => post<AttemptStatus>(`/attempts/${attemptId}/submit`, {}),
    [post],
  );
  return { submitAttemptAPI, ...state };
};

export const useCalculateResultAPI = () => {
  const [post, state] = useAxiosPost();
  const calculateResultAPI = useCallback(
    (attemptId: string) => post<ExamResult>(`/results/${attemptId}/calculate`, {}),
    [post],
  );
  return { calculateResultAPI, ...state };
};

export const useGetResultAPI = () => {
  const [get, state] = useAxiosGet();
  const getResultAPI = useCallback(
    (attemptId: string) => get<ExamResult>(`/results/${attemptId}`),
    [get],
  );
  return { getResultAPI, ...state };
};

export const useGetSubjectResultsAPI = () => {
  const [get, state] = useAxiosGet();
  const getSubjectResultsAPI = useCallback(
    (attemptId: string) => get<SubjectResult[]>(`/results/${attemptId}/subjects`),
    [get],
  );
  return { getSubjectResultsAPI, ...state };
};

export const useGetChapterResultsAPI = () => {
  const [get, state] = useAxiosGet();
  const getChapterResultsAPI = useCallback(
    (attemptId: string) => get<ChapterResult[]>(`/results/${attemptId}/chapters`),
    [get],
  );
  return { getChapterResultsAPI, ...state };
};

export const useGetAnswerReviewAPI = () => {
  const [get, state] = useAxiosGet();
  const getAnswerReviewAPI = useCallback(
    (attemptId: string) => get<QuestionReviewItem[]>(`/results/${attemptId}/review`),
    [get],
  );
  return { getAnswerReviewAPI, ...state };
};

export const useGetMyAttemptsAPI = () => {
  const [get, state] = useAxiosGet();
  const getMyAttemptsAPI = useCallback(() => get<AttemptSummary[]>('/attempts/my-history'), [get]);
  return { getMyAttemptsAPI, ...state };
};

export const useGetFullAnalysisAPI = () => {
  const [get, state] = useAxiosGet();
  const getFullAnalysisAPI = useCallback(
    (attemptId: string) => get<FullAnalysisReport>(`/results/${attemptId}/analysis`),
    [get],
  );
  return { getFullAnalysisAPI, ...state };
};

export const useGetTimeAnalysisAPI = () => {
  const [get, state] = useAxiosGet();
  const getTimeAnalysisAPI = useCallback(
    (attemptId: string) => get<TimeAnalyticsReport>(`/results/${attemptId}/time-analysis`),
    [get],
  );
  return { getTimeAnalysisAPI, ...state };
};

export const useGetAttemptStrategyAPI = () => {
  const [get, state] = useAxiosGet();
  const getAttemptStrategyAPI = useCallback(
    (attemptId: string) => get<DetailedStrategyAnalysis>(`/attempts/${attemptId}/strategy`),
    [get],
  );
  return { getAttemptStrategyAPI, ...state };
};

export const useRecalculateStrategyAPI = () => {
  const [post, state] = useAxiosPost();
  const recalculateStrategyAPI = useCallback(
    (attemptId: string, strategyVersion: number = 1) =>
      post<DetailedStrategyAnalysis>(`/attempts/${attemptId}/strategy/recalculate`, {
        strategyVersion,
      }),
    [post],
  );
  return { recalculateStrategyAPI, ...state };
};

export const useGetStrategyRulesAPI = () => {
  const [get, state] = useAxiosGet();
  const getStrategyRulesAPI = useCallback(
    (params?: { category?: string; isActive?: boolean }) =>
      get<StrategyRuleEntity[]>('/analysis/strategy-rules', { params }),
    [get],
  );
  return { getStrategyRulesAPI, ...state };
};

export const useCreateStrategyRuleAPI = () => {
  const [post, state] = useAxiosPost();
  const createStrategyRuleAPI = useCallback(
    (payload: Partial<StrategyRuleEntity>) =>
      post<StrategyRuleEntity>('/analysis/strategy-rules', payload),
    [post],
  );
  return { createStrategyRuleAPI, ...state };
};

export const useUpdateStrategyRuleAPI = () => {
  const [patch, state] = useAxiosPatch();
  const updateStrategyRuleAPI = useCallback(
    (id: string, payload: Partial<StrategyRuleEntity>) =>
      patch<StrategyRuleEntity>(`/analysis/strategy-rules/${id}`, payload),
    [patch],
  );
  return { updateStrategyRuleAPI, ...state };
};

export const useDeleteStrategyRuleAPI = () => {
  const [del, state] = useAxiosDelete();
  const deleteStrategyRuleAPI = useCallback(
    (id: string) => del<void>(`/analysis/strategy-rules/${id}`),
    [del],
  );
  return { deleteStrategyRuleAPI, ...state };
};

export const useGetRecommendationsAPI = () => {
  const [get, state] = useAxiosGet();
  const getRecommendationsAPI = useCallback(
    (attemptId: string) => get<ActionableRecommendation[]>(`/results/${attemptId}/recommendations`),
    [get],
  );
  return { getRecommendationsAPI, ...state };
};

export const useStartQuestionTimingAPI = () => {
  const [post, state] = useAxiosPost();
  const startQuestionTimingAPI = useCallback(
    (
      attemptId: string,
      questionId: string,
      payload: { eventId?: string; clientTimestamp?: string; clientSequence?: number } = {},
    ) =>
      post<{
        attemptId: string;
        examQuestionId: string;
        visitNumber: number;
        serverTime: string;
        serverStartTime: string;
        serverEndTime: string | null;
        timeRemainingSeconds: number;
        isExpired: boolean;
      }>(`/attempts/${attemptId}/questions/${questionId}/time/start`, payload),
    [post],
  );
  return { startQuestionTimingAPI, ...state };
};

export const useEndQuestionTimingAPI = () => {
  const [post, state] = useAxiosPost();
  const endQuestionTimingAPI = useCallback(
    (
      attemptId: string,
      questionId: string,
      payload: { eventId?: string; clientTimestamp?: string; clientSequence?: number } = {},
    ) =>
      post<{
        attemptId: string;
        examQuestionId: string;
        visitNumber: number;
        timeSpentSeconds: number;
        serverEndTime: string;
        source: string;
      }>(`/attempts/${attemptId}/questions/${questionId}/time/end`, payload),
    [post],
  );
  return { endQuestionTimingAPI, ...state };
};

export const useGetActiveTimingAPI = () => {
  const [get, state] = useAxiosGet();
  const getActiveTimingAPI = useCallback(
    (attemptId: string) =>
      get<{
        attemptId: string;
        examQuestionId: string;
        visitNumber: number;
        serverTime: string;
        serverStartTime: string;
        serverEndTime: string | null;
        timeRemainingSeconds: number;
        isExpired: boolean;
        activeQuestionId: string;
      }>(`/attempts/${attemptId}/time/active`),
    [get],
  );
  return { getActiveTimingAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// RANK & PERCENTILE ENGINE HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useGetMyRanksAPI = () => {
  const [get, state] = useAxiosGet();
  const getMyRanksAPI = useCallback(
    (attemptId: string) => get<MyRanksResponse>(`/attempts/${attemptId}/ranks`),
    [get],
  );
  return { getMyRanksAPI, ...state };
};

export const useGetRankPredictionAPI = () => {
  const [get, state] = useAxiosGet();
  const getRankPredictionAPI = useCallback(
    (attemptId: string) =>
      get<{
        attemptId: string;
        examId: string;
        predictedRank: MyRanksResponse['predictedRank'];
      }>(`/attempts/${attemptId}/rank-prediction`),
    [get],
  );
  return { getRankPredictionAPI, ...state };
};

export const useGenerateRanksAPI = () => {
  const [post, state] = useAxiosPost();
  const generateRanksAPI = useCallback(
    (examId: string, payload: { snapshotVersion?: number; forceRegenerate?: boolean } = {}) =>
      post<{
        snapshotId: string;
        status: string;
        totalCandidates: number;
        totalRankEntries?: number;
        highestScore?: number;
        lowestScore?: number;
        averageScore?: number;
        medianScore?: number;
        message?: string;
      }>(`/exams/${examId}/ranks/generate`, payload),
    [post],
  );
  return { generateRanksAPI, ...state };
};

export const useGetRankStatusAPI = () => {
  const [get, state] = useAxiosGet();
  const getRankStatusAPI = useCallback(
    (examId: string, version?: number) =>
      get<SnapshotStatusResponse>(
        `/exams/${examId}/ranks/status${version ? `?version=${version}` : ''}`,
      ),
    [get],
  );
  return { getRankStatusAPI, ...state };
};

export const useGetAdminLeaderboardAPI = () => {
  const [get, state] = useAxiosGet();
  const getAdminLeaderboardAPI = useCallback(
    (
      examId: string,
      params: {
        rankType?: string;
        scopeId?: string;
        categoryId?: string;
        page?: number;
        limit?: number;
        search?: string;
      } = {},
    ) => {
      const searchParams = new URLSearchParams();
      if (params.rankType) searchParams.append('rankType', params.rankType);
      if (params.scopeId) searchParams.append('scopeId', params.scopeId);
      if (params.categoryId) searchParams.append('categoryId', params.categoryId);
      if (params.page) searchParams.append('page', String(params.page));
      if (params.limit) searchParams.append('limit', String(params.limit));
      if (params.search) searchParams.append('search', params.search);

      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return get<AdminLeaderboardResponse>(`/exams/${examId}/ranks/leaderboard${queryStr}`);
    },
    [get],
  );
  return { getAdminLeaderboardAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// PREDICTED RANK ENGINE HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useGetHistoricalExamsAPI = () => {
  const [get, state] = useAxiosGet();
  const getHistoricalExamsAPI = useCallback(
    (examType?: string) =>
      get<HistoricalExamEntity[]>(
        `/prediction/historical-exams${examType ? `?examType=${examType}` : ''}`,
      ),
    [get],
  );
  return { getHistoricalExamsAPI, ...state };
};

export const useCreateHistoricalExamAPI = () => {
  const [post, state] = useAxiosPost();
  const createHistoricalExamAPI = useCallback(
    (payload: {
      examName: string;
      examType: string;
      examDate?: string;
      durationMinutes?: number;
      totalMarks: number;
      totalCandidates: number;
      source?: string;
    }) => post<HistoricalExamEntity>('/prediction/historical-exams', payload),
    [post],
  );
  return { createHistoricalExamAPI, ...state };
};

export const useGetHistoricalExamByIdAPI = () => {
  const [get, state] = useAxiosGet();
  const getHistoricalExamByIdAPI = useCallback(
    (id: string) => get<HistoricalExamEntity>(`/prediction/historical-exams/${id}`),
    [get],
  );
  return { getHistoricalExamByIdAPI, ...state };
};

export const useImportScoreRangesAPI = () => {
  const [post, state] = useAxiosPost();
  const importScoreRangesAPI = useCallback(
    (
      id: string,
      payload: {
        scoreRanges: {
          minScore: number;
          maxScore: number;
          representativeScore?: number;
          minRank: number;
          maxRank: number;
          candidateCount: number;
          percentileMin?: number;
          percentileMax?: number;
        }[];
      },
    ) =>
      post<{
        message: string;
        historicalExamId: string;
        dataQualityStatus: string;
        qualityScore: number;
        isMonotonic: boolean;
      }>(`/prediction/historical-exams/${id}/dataset`, payload),
    [post],
  );
  return { importScoreRangesAPI, ...state };
};

export const useValidateDatasetAPI = () => {
  const [post, state] = useAxiosPost();
  const validateDatasetAPI = useCallback(
    (id: string) => post<DatasetQualityReport>(`/prediction/historical-exams/${id}/validate`, {}),
    [post],
  );
  return { validateDatasetAPI, ...state };
};

export const useGetModelAccuracySummaryAPI = () => {
  const [get, state] = useAxiosGet();
  const getModelAccuracySummaryAPI = useCallback(
    (modelVersion?: string) =>
      get<ModelAccuracySummary>(
        `/prediction/evaluation/summary${modelVersion ? `?modelVersion=${modelVersion}` : ''}`,
      ),
    [get],
  );
  return { getModelAccuracySummaryAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE TREND & MOCK COMPARISON HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useGetPerformanceTrendsAPI = () => {
  const [get, state] = useAxiosGet();
  const getPerformanceTrendsAPI = useCallback(
    (
      params: {
        examType?: string;
        examId?: string;
        subjectId?: string;
        from?: string;
        to?: string;
        limit?: number;
      } = {},
    ) => {
      const searchParams = new URLSearchParams();
      if (params.examType) searchParams.append('examType', params.examType);
      if (params.examId) searchParams.append('examId', params.examId);
      if (params.subjectId) searchParams.append('subjectId', params.subjectId);
      if (params.from) searchParams.append('from', params.from);
      if (params.to) searchParams.append('to', params.to);
      if (params.limit) searchParams.append('limit', String(params.limit));

      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return get<PerformanceTrendsResponse>(`/students/me/analytics/trends${queryStr}`);
    },
    [get],
  );
  return { getPerformanceTrendsAPI, ...state };
};

export const useCompareMocksAPI = () => {
  const [get, state] = useAxiosGet();
  const compareMocksAPI = useCallback(
    (attemptA: string, attemptB: string) =>
      get<DirectComparisonResponse>(
        `/students/me/analytics/compare?attemptA=${attemptA}&attemptB=${attemptB}`,
      ),
    [get],
  );
  return { compareMocksAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// PARENT DASHBOARD HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useGetParentStudentsAPI = () => {
  const [get, state] = useAxiosGet();
  const getParentStudentsAPI = useCallback(
    () => get<ParentStudentInfo[]>('/parents/me/students'),
    [get],
  );
  return { getParentStudentsAPI, ...state };
};

export const useGetParentOverviewAPI = () => {
  const [get, state] = useAxiosGet();
  const getParentOverviewAPI = useCallback(
    () => get<ParentStudentOverviewItem[]>('/parents/me/dashboard'),
    [get],
  );
  return { getParentOverviewAPI, ...state };
};

export const useGetParentChildDashboardAPI = () => {
  const [get, state] = useAxiosGet();
  const getParentChildDashboardAPI = useCallback(
    (studentId: string) =>
      get<ParentDashboardResponse>(`/parents/me/students/${studentId}/dashboard`),
    [get],
  );
  return { getParentChildDashboardAPI, ...state };
};

export const useGetParentChildTrendsAPI = () => {
  const [get, state] = useAxiosGet();
  const getParentChildTrendsAPI = useCallback(
    (
      studentId: string,
      params: {
        examType?: string;
        limit?: number;
      } = {},
    ) => {
      const searchParams = new URLSearchParams();
      if (params.examType) searchParams.append('examType', params.examType);
      if (params.limit) searchParams.append('limit', String(params.limit));

      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return get<PerformanceTrendsResponse>(`/parents/me/students/${studentId}/trends${queryStr}`);
    },
    [get],
  );
  return { getParentChildTrendsAPI, ...state };
};
