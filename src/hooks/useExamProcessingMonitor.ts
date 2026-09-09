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
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Subscribe to all jobs for this exam
      socket.emit('subscribe_exam_jobs', { examId });
      // Invalidate queries to recover any missed events during disconnect
      queryClient.invalidateQueries({ queryKey: examProcessingKeys.summary(examId) });
      queryClient.invalidateQueries({ queryKey: ['exam-processing', 'jobs', examId] });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    // Handle generic and explicit job events
    socket.on('job.event', handleJobEvent);
    socket.on('job.started', handleJobEvent);
    socket.on('job.progress', handleJobEvent);
    socket.on('job.completed', handleJobEvent);
    socket.on('job.failed', handleJobEvent);
    socket.on('job.retrying', handleJobEvent);

    // Handle exam-level completion event
    socket.on('exam.result.processing.completed', (payload: any) => {
      if (!payload || (payload.examId && payload.examId === examId)) {
        queryClient.invalidateQueries({ queryKey: examProcessingKeys.summary(examId) });
        queryClient.invalidateQueries({ queryKey: ['exam-processing', 'jobs', examId] });
        if (onExamCompleted) {
          onExamCompleted(payload);
        }
      }
    });

    return () => {
      socket.emit('unsubscribe_exam_jobs', { examId });
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, examId, getSocketBaseUrl, handleJobEvent, onExamCompleted, queryClient]);

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
