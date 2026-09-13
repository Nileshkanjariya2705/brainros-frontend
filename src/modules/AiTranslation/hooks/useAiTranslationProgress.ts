import { useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useJobProgress } from '@/hooks/useJobProgress';
import { aiTranslationApi } from '../services/ai-translation.service';
import type { AiTranslationJobDetails } from '../types/ai-translation.types';

export const AI_TRANSLATION_JOB_QUERY_KEY = (jobId: string) => ['ai-translation-job', jobId];
export const SCHEDULED_EXAMS_QUERY_KEY = ['ai-translation-scheduled-exams'];

export interface UseAiTranslationProgressOptions {
  jobId: string | null;
  enabled?: boolean;
  onComplete?: () => void;
  onFailed?: () => void;
}

export function useAiTranslationProgress({
  jobId,
  enabled = true,
  onComplete,
  onFailed,
}: UseAiTranslationProgressOptions) {
  const queryClient = useQueryClient();

  // 1. React Query for job details with polling fallback if active
  const {
    data: jobDetails,
    isLoading: isJobLoading,
    error: jobError,
    refetch,
  } = useQuery({
    queryKey: AI_TRANSLATION_JOB_QUERY_KEY(jobId || ''),
    queryFn: () => (jobId ? aiTranslationApi.getJobStatus(jobId) : null),
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data as AiTranslationJobDetails | null;
      if (!data) return false;
      if (data.status === 'QUEUED' || data.status === 'PROCESSING') {
        return 3000;
      }
      return false;
    },
    staleTime: 2000,
  });

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const onFailedRef = useRef(onFailed);
  onFailedRef.current = onFailed;

  // 2. WebSocket Real-time Job Progress
  const handleJobComplete = useCallback(() => {
    if (jobId) {
      refetch();
      queryClient.invalidateQueries({ queryKey: SCHEDULED_EXAMS_QUERY_KEY });
    }
    onCompleteRef.current?.();
  }, [jobId, queryClient, refetch]);

  const handleJobFailed = useCallback(() => {
    if (jobId) {
      refetch();
    }
    onFailedRef.current?.();
  }, [jobId, refetch]);

  const isJobActive =
    !jobDetails ||
    jobDetails.status === 'QUEUED' ||
    jobDetails.status === 'PROCESSING';

  const wsProgress = useJobProgress({
    queue: 'ai-translation',
    jobId: jobId || undefined,
    enabled: !!jobId && enabled && isJobActive,
    onComplete: handleJobComplete,
    onFailed: handleJobFailed,
  });

  // Synchronize WebSocket progress with local React Query cache
  useEffect(() => {
    if (jobId && wsProgress.percentage > 0) {
      queryClient.setQueryData<AiTranslationJobDetails | null>(
        AI_TRANSLATION_JOB_QUERY_KEY(jobId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            overallProgress: wsProgress.percentage,
            status: wsProgress.status as any,
          };
        },
      );
    }
  }, [jobId, wsProgress.percentage, wsProgress.status, queryClient]);

  const isTerminal =
    jobDetails?.status === 'COMPLETED' ||
    jobDetails?.status === 'PARTIALLY_COMPLETED' ||
    jobDetails?.status === 'FAILED' ||
    jobDetails?.status === 'CANCELLED';

  return {
    jobDetails,
    isJobLoading,
    jobError: jobError ? (jobError as any)?.message || 'Failed to load job details' : null,
    progressPercentage: jobDetails?.overallProgress ?? wsProgress.percentage ?? 0,
    currentStage: wsProgress.stage || wsProgress.message || 'Processing translations...',
    status: jobDetails?.status || wsProgress.status || 'IDLE',
    isTerminal,
    refetchJob: refetch,
    wsConnected: wsProgress.isConnected,
  };
}
