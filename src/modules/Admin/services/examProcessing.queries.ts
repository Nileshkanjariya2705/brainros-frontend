import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Axios from '@/base-axios';
import { examProcessingKeys } from '@/services/queryKeys';

export interface StageStat {
  total: number;
  completed: number;
  processing: number;
  failed: number;
  percentage: number;
}

export interface ReconciliationStat {
  total: number;
  completed: number;
  percentage: number;
  status: string;
}

export interface ExamProcessingSummaryResponse {
  examId: string;
  examTitle: string;
  examType: 'LIVE' | 'MOCK';
  examStatus?: string;
  publicationStatus: string;
  status: 'EMPTY' | 'QUEUED' | 'PROCESSING' | 'READY_TO_PUBLISH' | 'PUBLISHED' | 'FAILED';
  overallPercentage: number;
  totalJobs: number;
  completedJobs: number;
  processingJobs: number;
  pendingJobs: number;
  failedJobs: number;
  stages: {
    evaluation: StageStat;
    analytics: StageStat;
    ranking: StageStat;
    reconciliation: ReconciliationStat;
  };
  isReadyToPublish: boolean;
  canPublish: boolean;
  notReadyReason: string | null;
  redisActive: boolean;
  lastUpdated: string;
}

export interface ExamProcessingJobItem {
  jobId: string;
  attemptId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  progress: number;
  stage: 'WAITING' | 'EVALUATION' | 'ANALYTICS' | 'RANKING' | 'RECONCILIATION' | 'COMPLETED' | 'FAILED';
  message: string;
  errorMessage?: string | null;
  retryCount: number;
  submittedAt: string | null;
  updatedAt: string;
}

export interface ExamProcessingJobsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExamProcessingJobsResponse {
  items: ExamProcessingJobItem[];
  pagination: ExamProcessingJobsPagination;
}

export interface ExamProcessingJobsParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface JobDetailResponse {
  jobId: string;
  attemptId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  stage: string;
  stages: {
    evaluation: string;
    analytics: string;
    ranking: string;
  };
  score: number | null;
  rank: number | null;
  percentile: number | null;
  retryCount: number;
  errorMessage: string | null;
  createdAt: string;
  submittedAt: string | null;
  updatedAt: string;
}

/**
 * 1. Fetch Authoritative Processing Summary for an Exam
 */
export const useExamProcessingSummaryQuery = (examId?: string | null) => {
  return useQuery<ExamProcessingSummaryResponse>({
    queryKey: examProcessingKeys.summary(examId || ''),
    queryFn: async () => {
      if (!examId) throw new Error('examId is required');
      const res = await Axios.get<{ statusCode: number; message: string; data: ExamProcessingSummaryResponse }>(
        `/super-admin/exams/${encodeURIComponent(examId)}/results/processing-summary`,
      );
      return (res.data as any)?.data !== undefined ? (res.data as any).data : res.data;
    },
    enabled: Boolean(examId),
    staleTime: 5000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
  });
};

/**
 * 2. Fetch Server-Side Paginated Jobs Table
 */
export const useExamProcessingJobsQuery = (
  examId?: string | null,
  params: ExamProcessingJobsParams = {},
) => {
  return useQuery<ExamProcessingJobsResponse>({
    queryKey: examProcessingKeys.jobs(examId || '', params),
    queryFn: async () => {
      if (!examId) throw new Error('examId is required');
      const res = await Axios.get<{ statusCode: number; message: string; data: ExamProcessingJobsResponse }>(
        `/super-admin/exams/${encodeURIComponent(examId)}/results/processing-jobs`,
        { params },
      );
      return (res.data as any)?.data !== undefined ? (res.data as any).data : res.data;
    },
    enabled: Boolean(examId),
    staleTime: 5000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
  });
};

/**
 * 3. Fetch Single Job Detail for Modal
 */
export const useExamJobDetailQuery = (
  examId?: string | null,
  jobId?: string | null,
) => {
  return useQuery<JobDetailResponse>({
    queryKey: examProcessingKeys.jobDetail(examId || '', jobId || ''),
    queryFn: async () => {
      if (!examId || !jobId) throw new Error('examId and jobId are required');
      const res = await Axios.get<{ statusCode: number; message: string; data: JobDetailResponse }>(
        `/super-admin/exams/${encodeURIComponent(examId)}/results/processing-jobs/${encodeURIComponent(jobId)}`,
      );
      return (res.data as any)?.data !== undefined ? (res.data as any).data : res.data;
    },
    enabled: Boolean(examId && jobId),
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      const status = error?.response?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
  });
};

/**
 * 4. Batch Retry Mutation
 */
export const useRetryFailedJobsMutation = (examId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!examId) throw new Error('examId is required');
      const res = await Axios.post<{ statusCode: number; message: string; data: any }>(
        `/super-admin/exams/${encodeURIComponent(examId)}/results/processing-jobs/retry-failed`,
        {},
      );
      return res.data.data;
    },
    onSuccess: () => {
      if (examId) {
        queryClient.invalidateQueries({ queryKey: examProcessingKeys.summary(examId) });
        queryClient.invalidateQueries({ queryKey: ['exam-processing', 'jobs', examId] });
      }
    },
  });
};

/**
 * 5. Single Job Retry Mutation
 */
export const useRetrySingleJobMutation = (examId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      if (!examId) throw new Error('examId is required');
      const res = await Axios.post<{ statusCode: number; message: string; data: any }>(
        `/super-admin/exams/${encodeURIComponent(examId)}/results/processing-jobs/${encodeURIComponent(jobId)}/retry`,
        {},
      );
      return res.data.data;
    },
    onSuccess: () => {
      if (examId) {
        queryClient.invalidateQueries({ queryKey: examProcessingKeys.summary(examId) });
        queryClient.invalidateQueries({ queryKey: ['exam-processing', 'jobs', examId] });
      }
    },
  });
};

/**
 * 6. Publish Exam Results Mutation (Calls Existing Publication Endpoint)
 */
export const usePublishResultsMutation = (examId?: string | null) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!examId) throw new Error('examId is required');
      const res = await Axios.post<{ statusCode: number; message: string; data: any }>(
        `/super-admin/exams/${encodeURIComponent(examId)}/results/publish`,
        {},
      );
      return res.data.data;
    },
    onSuccess: () => {
      if (examId) {
        queryClient.invalidateQueries({ queryKey: examProcessingKeys.summary(examId) });
        queryClient.invalidateQueries({ queryKey: ['exam-processing', 'jobs', examId] });
      }
    },
  });
};
