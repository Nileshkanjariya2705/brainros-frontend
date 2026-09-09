import { useEffect, useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@config';
import { examProcessingKeys } from '@/services/queryKeys';
import type { ExamProcessingJobItem } from '@/modules/Admin/services/examProcessing.queries';

export interface LiveJobUpdate {
  jobId: string;
  attemptId?: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING';
  progress: number;
  stage?: string;
  message?: string;
  updatedAt: string;
}

export interface UseExamProcessingMonitorOptions {
  examId?: string | null;
  enabled?: boolean;
  onExamCompleted?: (payload: any) => void;
}

export const useExamProcessingMonitor = ({
  examId,
  enabled = true,
  onExamCompleted,
}: UseExamProcessingMonitorOptions) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [liveJobUpdates, setLiveJobUpdates] = useState<Record<string, LiveJobUpdate>>({});

  const socketRef = useRef<Socket | null>(null);
  const liveUpdatesRef = useRef<Record<string, LiveJobUpdate>>({});
  liveUpdatesRef.current = liveJobUpdates;

  // Base socket origin
  const getSocketBaseUrl = useCallback(() => {
    try {
      const url = new URL(API_URL);
      return url.origin;
    } catch {
      return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    }
  }, []);

  // Update a single job in the local live dictionary
  const handleJobEvent = useCallback(
    (event: any) => {
      if (!event || !event.job) return;
      if (examId && event.job.examId && String(event.job.examId) !== String(examId)) {
        return;
      }

      const jobId = String(event.job.jobId || '');
      const attemptId = event.job.attemptId ? String(event.job.attemptId) : undefined;
      const eventStatus = event.job.status || 'PROCESSING';
      const eventStage = event.job.stage;
      const rawPct = event.progress?.percentage ?? 0;

      setLiveJobUpdates((prev) => {
        const existing = prev[jobId] || (attemptId ? prev[attemptId] : undefined);
        const prevPct = existing?.progress || 0;

        let nextPct = Math.min(100, Math.max(0, rawPct));
        if (eventStatus === 'COMPLETED') {
          nextPct = 100;
        } else if (eventStatus === 'FAILED') {
          nextPct = prevPct;
        } else {
          // Monotonic clamp: percentage only stays same or advances for same job
          nextPct = Math.max(prevPct, nextPct);
        }

        const update: LiveJobUpdate = {
          jobId,
          attemptId,
          status: eventStatus,
          progress: nextPct,
          stage: eventStage || existing?.stage,
          message: event.message || existing?.message,
          updatedAt: event.timestamp || new Date().toISOString(),
        };

        const nextState = { ...prev, [jobId]: update };
        if (attemptId) {
          nextState[attemptId] = update;
        }
        return nextState;
      });

      // If a job completes or fails, selectively refresh authoritative summary stats
      if (eventStatus === 'COMPLETED' || eventStatus === 'FAILED') {
        if (examId) {
          queryClient.invalidateQueries({ queryKey: examProcessingKeys.summary(examId) });
        }
      }
    },
    [examId, queryClient],
  );

  const onExamCompletedRef = useRef(onExamCompleted);
  useEffect(() => {
    onExamCompletedRef.current = onExamCompleted;
  });

  const queryClientRef = useRef(queryClient);
  useEffect(() => {
    queryClientRef.current = queryClient;
  });

  const handleJobEventRef = useRef<(event: any) => void>(() => {});
  handleJobEventRef.current = handleJobEvent;

  useEffect(() => {
    if (!enabled || !examId) {
      setIsConnected(false);
      return;
    }

    const baseUrl = getSocketBaseUrl();
    const socket = io(`${baseUrl}/ws/jobs`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 15000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Subscribe to all jobs for this exam
      socket.emit('subscribe_exam_jobs', { examId }, (ack: any) => {
        if (ack?.status === 'error') {
          console.warn('[WebSocket] Exam room subscription notice:', ack.message);
        }
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle generic and explicit job events via stable ref
    const onEvent = (event: any) => handleJobEventRef.current(event);
    socket.on('job.event', onEvent);
    socket.on('job.started', onEvent);
    socket.on('job.progress', onEvent);
    socket.on('job.completed', onEvent);
    socket.on('job.failed', onEvent);
    socket.on('job.retrying', onEvent);

    // Handle exam-level completion event
    socket.on('exam.result.processing.completed', (payload: any) => {
      if (!payload || (payload.examId && String(payload.examId) === String(examId))) {
        queryClientRef.current.invalidateQueries({ queryKey: examProcessingKeys.summary(examId) });
        queryClientRef.current.invalidateQueries({ queryKey: ['exam-processing', 'jobs', examId] });
        if (onExamCompletedRef.current) {
          onExamCompletedRef.current(payload);
        }
      }
    });

    return () => {
      socket.emit('unsubscribe_exam_jobs', { examId });
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, examId, getSocketBaseUrl]);

  /**
   * Helper that merges live WebSocket updates with a database row item.
   */
  const mergeLiveWithItem = useCallback(
    (item: ExamProcessingJobItem): ExamProcessingJobItem => {
      const live =
        liveJobUpdates[item.jobId] ||
        (item.attemptId ? liveJobUpdates[item.attemptId] : undefined);

      if (!live) return item;

      return {
        ...item,
        status: live.status as any,
        progress: Math.max(item.progress, live.progress),
        stage: (live.stage as any) || item.stage,
        message: live.message || item.message,
        updatedAt: live.updatedAt || item.updatedAt,
      };
    },
    [liveJobUpdates],
  );

  return {
    isConnected,
    liveJobUpdates,
    mergeLiveWithItem,
  };
};
