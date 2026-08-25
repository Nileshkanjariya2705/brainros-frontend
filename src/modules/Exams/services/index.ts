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

export const useGetAvailableExamsAPI = () => {
  const [get, state] = useAxiosGet();
  const getAvailableExamsAPI = (examTargetId: string) =>
    get<Exam[]>(`/exams/available/${examTargetId}`);
  return { getAvailableExamsAPI, ...state };
};

export const useStartAttemptAPI = () => {
  const [post, state] = useAxiosPost();
  const startAttemptAPI = (examId: string, languageId: string) =>
    post<AttemptStatus>('/attempts/start', { examId, languageId });
  return { startAttemptAPI, ...state };
};

export const useGetAttemptQuestionsAPI = () => {
  const [get, state] = useAxiosGet();
  const getAttemptQuestionsAPI = (attemptId: string) =>
    get<ExamQuestion[]>(`/attempts/${attemptId}/questions`);
  return { getAttemptQuestionsAPI, ...state };
};

export const useGetAttemptStatusAPI = () => {
  const [get, state] = useAxiosGet();
  const getAttemptStatusAPI = (attemptId: string) =>
    get<AttemptStatus>(`/attempts/${attemptId}/status`);
  return { getAttemptStatusAPI, ...state };
};

export const useSaveAnswerAPI = () => {
  const [put, state] = useAxiosPut();
  const saveAnswerAPI = (
    attemptId: string,
    payload: {
      examQuestionId: string;
      selectedOptionId?: string | null;
      numericalAnswer?: number | null;
      selectedOptions?: string[] | null;
      isMarkedForReview?: boolean;
    },
  ) => put<{ message: string }>(`/attempts/${attemptId}/answer`, payload);
  return { saveAnswerAPI, ...state };
};

export const useSubmitAttemptAPI = () => {
  const [post, state] = useAxiosPost();
  const submitAttemptAPI = (attemptId: string) =>
    post<AttemptStatus>(`/attempts/${attemptId}/submit`, {});
  return { submitAttemptAPI, ...state };
};

export const useCalculateResultAPI = () => {
  const [post, state] = useAxiosPost();
  const calculateResultAPI = (attemptId: string) =>
    post<ExamResult>(`/results/${attemptId}/calculate`, {});
  return { calculateResultAPI, ...state };
};

export const useGetResultAPI = () => {
  const [get, state] = useAxiosGet();
  const getResultAPI = (attemptId: string) => get<ExamResult>(`/results/${attemptId}`);
  return { getResultAPI, ...state };
};

export const useGetSubjectResultsAPI = () => {
  const [get, state] = useAxiosGet();
  const getSubjectResultsAPI = (attemptId: string) =>
    get<SubjectResult[]>(`/results/${attemptId}/subjects`);
  return { getSubjectResultsAPI, ...state };
};

export const useGetChapterResultsAPI = () => {
  const [get, state] = useAxiosGet();
  const getChapterResultsAPI = (attemptId: string) =>
    get<ChapterResult[]>(`/results/${attemptId}/chapters`);
  return { getChapterResultsAPI, ...state };
};

export const useGetAnswerReviewAPI = () => {
  const [get, state] = useAxiosGet();
  const getAnswerReviewAPI = (attemptId: string) =>
    get<QuestionReviewItem[]>(`/results/${attemptId}/review`);
  return { getAnswerReviewAPI, ...state };
};

export const useGetMyAttemptsAPI = () => {
  const [get, state] = useAxiosGet();
  const getMyAttemptsAPI = () => get<AttemptSummary[]>('/attempts/my-history');
  return { getMyAttemptsAPI, ...state };
};

export const useGetFullAnalysisAPI = () => {
  const [get, state] = useAxiosGet();
  const getFullAnalysisAPI = (attemptId: string) =>
    get<FullAnalysisReport>(`/results/${attemptId}/analysis`);
  return { getFullAnalysisAPI, ...state };
};

export const useGetTimeAnalysisAPI = () => {
  const [get, state] = useAxiosGet();
  const getTimeAnalysisAPI = (attemptId: string) =>
    get<TimeAnalyticsReport>(`/results/${attemptId}/time-analysis`);
  return { getTimeAnalysisAPI, ...state };
};

export const useGetAttemptStrategyAPI = () => {
  const [get, state] = useAxiosGet();
  const getAttemptStrategyAPI = (attemptId: string) =>
    get<DetailedStrategyAnalysis>(`/attempts/${attemptId}/strategy`);
  return { getAttemptStrategyAPI, ...state };
};

export const useRecalculateStrategyAPI = () => {
  const [post, state] = useAxiosPost();
  const recalculateStrategyAPI = (attemptId: string, strategyVersion: number = 1) =>
    post<DetailedStrategyAnalysis>(`/attempts/${attemptId}/strategy/recalculate`, {
      strategyVersion,
    });
  return { recalculateStrategyAPI, ...state };
};

export const useGetStrategyRulesAPI = () => {
  const [get, state] = useAxiosGet();
  const getStrategyRulesAPI = (params?: { category?: string; isActive?: boolean }) =>
    get<StrategyRuleEntity[]>('/analysis/strategy-rules', { params });
  return { getStrategyRulesAPI, ...state };
};

export const useCreateStrategyRuleAPI = () => {
  const [post, state] = useAxiosPost();
  const createStrategyRuleAPI = (payload: Partial<StrategyRuleEntity>) =>
    post<StrategyRuleEntity>('/analysis/strategy-rules', payload);
  return { createStrategyRuleAPI, ...state };
};

export const useUpdateStrategyRuleAPI = () => {
  const [patch, state] = useAxiosPatch();
  const updateStrategyRuleAPI = (id: string, payload: Partial<StrategyRuleEntity>) =>
    patch<StrategyRuleEntity>(`/analysis/strategy-rules/${id}`, payload);
  return { updateStrategyRuleAPI, ...state };
};

export const useDeleteStrategyRuleAPI = () => {
  const [del, state] = useAxiosDelete();
  const deleteStrategyRuleAPI = (id: string) => del<void>(`/analysis/strategy-rules/${id}`);
  return { deleteStrategyRuleAPI, ...state };
};

export const useGetRecommendationsAPI = () => {
  const [get, state] = useAxiosGet();
  const getRecommendationsAPI = (attemptId: string) =>
    get<ActionableRecommendation[]>(`/results/${attemptId}/recommendations`);
  return { getRecommendationsAPI, ...state };
};

export const useStartQuestionTimingAPI = () => {
  const [post, state] = useAxiosPost();
  const startQuestionTimingAPI = (
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
    }>(`/attempts/${attemptId}/questions/${questionId}/time/start`, payload);
  return { startQuestionTimingAPI, ...state };
};

export const useEndQuestionTimingAPI = () => {
  const [post, state] = useAxiosPost();
  const endQuestionTimingAPI = (
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
    }>(`/attempts/${attemptId}/questions/${questionId}/time/end`, payload);
  return { endQuestionTimingAPI, ...state };
};

export const useGetActiveTimingAPI = () => {
  const [get, state] = useAxiosGet();
  const getActiveTimingAPI = (attemptId: string) =>
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
    }>(`/attempts/${attemptId}/time/active`);
  return { getActiveTimingAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// RANK & PERCENTILE ENGINE HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useGetMyRanksAPI = () => {
  const [get, state] = useAxiosGet();
  const getMyRanksAPI = (attemptId: string) => get<MyRanksResponse>(`/attempts/${attemptId}/ranks`);
  return { getMyRanksAPI, ...state };
};

export const useGetRankPredictionAPI = () => {
  const [get, state] = useAxiosGet();
  const getRankPredictionAPI = (attemptId: string) =>
    get<{
      attemptId: string;
      examId: string;
      predictedRank: MyRanksResponse['predictedRank'];
    }>(`/attempts/${attemptId}/rank-prediction`);
  return { getRankPredictionAPI, ...state };
};

export const useGenerateRanksAPI = () => {
  const [post, state] = useAxiosPost();
  const generateRanksAPI = (
    examId: string,
    payload: { snapshotVersion?: number; forceRegenerate?: boolean } = {},
  ) =>
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
    }>(`/exams/${examId}/ranks/generate`, payload);
  return { generateRanksAPI, ...state };
};

export const useGetRankStatusAPI = () => {
  const [get, state] = useAxiosGet();
  const getRankStatusAPI = (examId: string, version?: number) =>
    get<SnapshotStatusResponse>(
      `/exams/${examId}/ranks/status${version ? `?version=${version}` : ''}`,
    );
  return { getRankStatusAPI, ...state };
};

export const useGetAdminLeaderboardAPI = () => {
  const [get, state] = useAxiosGet();
  const getAdminLeaderboardAPI = (
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
  };
  return { getAdminLeaderboardAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// PREDICTED RANK ENGINE HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useGetHistoricalExamsAPI = () => {
  const [get, state] = useAxiosGet();
  const getHistoricalExamsAPI = (examType?: string) =>
    get<HistoricalExamEntity[]>(
      `/prediction/historical-exams${examType ? `?examType=${examType}` : ''}`,
    );
  return { getHistoricalExamsAPI, ...state };
};

export const useCreateHistoricalExamAPI = () => {
  const [post, state] = useAxiosPost();
  const createHistoricalExamAPI = (payload: {
    examName: string;
    examType: string;
    examDate?: string;
    durationMinutes?: number;
    totalMarks: number;
    totalCandidates: number;
    source?: string;
  }) => post<HistoricalExamEntity>('/prediction/historical-exams', payload);
  return { createHistoricalExamAPI, ...state };
};

export const useGetHistoricalExamByIdAPI = () => {
  const [get, state] = useAxiosGet();
  const getHistoricalExamByIdAPI = (id: string) =>
    get<HistoricalExamEntity>(`/prediction/historical-exams/${id}`);
  return { getHistoricalExamByIdAPI, ...state };
};

export const useImportScoreRangesAPI = () => {
  const [post, state] = useAxiosPost();
  const importScoreRangesAPI = (
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
    }>(`/prediction/historical-exams/${id}/dataset`, payload);
  return { importScoreRangesAPI, ...state };
};

export const useValidateDatasetAPI = () => {
  const [post, state] = useAxiosPost();
  const validateDatasetAPI = (id: string) =>
    post<DatasetQualityReport>(`/prediction/historical-exams/${id}/validate`, {});
  return { validateDatasetAPI, ...state };
};

export const useGetModelAccuracySummaryAPI = () => {
  const [get, state] = useAxiosGet();
  const getModelAccuracySummaryAPI = (modelVersion?: string) =>
    get<ModelAccuracySummary>(
      `/prediction/evaluation/summary${modelVersion ? `?modelVersion=${modelVersion}` : ''}`,
    );
  return { getModelAccuracySummaryAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE TREND & MOCK COMPARISON HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useGetPerformanceTrendsAPI = () => {
  const [get, state] = useAxiosGet();
  const getPerformanceTrendsAPI = (
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
  };
  return { getPerformanceTrendsAPI, ...state };
};

export const useCompareMocksAPI = () => {
  const [get, state] = useAxiosGet();
  const compareMocksAPI = (attemptA: string, attemptB: string) =>
    get<DirectComparisonResponse>(
      `/students/me/analytics/compare?attemptA=${attemptA}&attemptB=${attemptB}`,
    );
  return { compareMocksAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// PARENT DASHBOARD HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useGetParentStudentsAPI = () => {
  const [get, state] = useAxiosGet();
  const getParentStudentsAPI = () => get<ParentStudentInfo[]>('/parents/me/students');
  return { getParentStudentsAPI, ...state };
};

export const useGetParentOverviewAPI = () => {
  const [get, state] = useAxiosGet();
  const getParentOverviewAPI = () => get<ParentStudentOverviewItem[]>('/parents/me/dashboard');
  return { getParentOverviewAPI, ...state };
};

export const useGetParentChildDashboardAPI = () => {
  const [get, state] = useAxiosGet();
  const getParentChildDashboardAPI = (studentId: string) =>
    get<ParentDashboardResponse>(`/parents/me/students/${studentId}/dashboard`);
  return { getParentChildDashboardAPI, ...state };
};

export const useGetParentChildTrendsAPI = () => {
  const [get, state] = useAxiosGet();
  const getParentChildTrendsAPI = (
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
  };
  return { getParentChildTrendsAPI, ...state };
};
