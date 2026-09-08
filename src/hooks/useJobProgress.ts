import { useEffect, useState, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import Axios from '@/base-axios';
import { API_URL } from '@config';

export type JobStatus =
  | 'IDLE'
  | 'QUEUED'
  | 'PROCESSING'
  | 'RETRYING'
  | 'COMPLETED'
  | 'FAILED'
  | 'PAUSED';

export interface JobProgressEvent {
  event: string;
  job: {
    queue: string;
    jobId: string;
    type?: string;
    status: JobStatus;
    stage?: string;
    userId?: string;
    attemptId?: string;
    examId?: string;
    resourceId?: string;
  };
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  stageIndex?: number;
  totalStages?: number;
  message?: string;
  errorCode?: string;
  resultSummary?: Record<string, any>;
  timestamp: string;
}

export interface UseJobProgressOptions {
  queue: string;
  jobId?: string | null;
  enabled?: boolean;
  queryKeyToInvalidate?: any[];
  onComplete?: (event: JobProgressEvent) => void;
  onFailed?: (event: JobProgressEvent) => void;
  pollingIntervalMs?: number;
}

export interface UseJobProgressReturn {
  status: JobStatus;
  current: number;
  total: number;
  percentage: number;
  stage?: string;
  message?: string;
  errorCode?: string;
  resultSummary?: Record<string, any>;
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isRetrying: boolean;
  isConnected: boolean;
  lastUpdated?: string;
  refetchStatus: () => Promise<void>;
}

export const useJobProgress = ({
  queue,
  jobId,
  enabled = true,
  queryKeyToInvalidate,
  onComplete,
  onFailed,
  pollingIntervalMs = 3000,
}: UseJobProgressOptions): UseJobProgressReturn => {
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<JobStatus>('IDLE');
  const [current, setCurrent] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [percentage, setPercentage] = useState<number>(0);
  const [stage, setStage] = useState<string | undefined>();
  const [message, setMessage] = useState<string | undefined>();
  const [errorCode, setErrorCode] = useState<string | undefined>();
  const [resultSummary, setResultSummary] = useState<Record<string, any> | undefined>();
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | undefined>();

  const socketRef = useRef<Socket | null>(null);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInvalidatedRef = useRef<boolean>(false);

  // Derive target origin for WebSocket namespace
  const getSocketBaseUrl = useCallback(() => {
    try {
      const url = new URL(API_URL);
      return url.origin;
    } catch {
      return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    }
  }, []);

  // Update progress state with monotonic guarantee
  const applyJobEvent = useCallback(
    (event: JobProgressEvent) => {
      if (!event || !event.job) return;

      const eventStatus = event.job.status || 'PROCESSING';
      setStatus(eventStatus);

      if (event.stageIndex !== undefined && event.totalStages) {
        setStage(event.job.stage ? `${event.job.stage} (${event.stageIndex}/${event.totalStages})` : undefined);
      } else {
        setStage(event.job.stage);
      }

      setMessage(event.message);
      setErrorCode(event.errorCode);
      setResultSummary(event.resultSummary);
      setLastUpdated(event.timestamp || new Date().toISOString());

      if (event.progress) {
        const nextCurrent = Math.max(0, event.progress.current || 0);
        const nextTotal = Math.max(0, event.progress.total || 0);
        const nextPct = Math.min(100, Math.max(0, event.progress.percentage || 0));

        setCurrent(nextCurrent);
        setTotal(nextTotal);

        // Monotonic check: percentage only increases or stays same during processing
        setPercentage((prev) => {
          if (eventStatus === 'COMPLETED') return 100;
          if (eventStatus === 'FAILED') return prev;
          return Math.max(prev, nextPct);
        });
      }

      // If job completed, trigger query invalidation once
      if (eventStatus === 'COMPLETED' && !hasInvalidatedRef.current) {
        hasInvalidatedRef.current = true;
        if (queryKeyToInvalidate && queryKeyToInvalidate.length > 0) {
          queryClient.invalidateQueries({ queryKey: queryKeyToInvalidate });
        }
        if (onComplete) {
          onComplete(event);
        }
      }

      if (eventStatus === 'FAILED' && onFailed) {
        onFailed(event);
      }
    },
    [queryClient, queryKeyToInvalidate, onComplete, onFailed],
  );

  // Authoritative HTTP state fetch
  const fetchStatusFromApi = useCallback(async () => {
    if (!queue || !jobId) return;
    try {
      const res = await Axios.get(`/jobs/${encodeURIComponent(queue)}/${encodeURIComponent(jobId)}/status`, {
        _skipAuthRefresh: true,
      });

      const payload = res.data?.data || res.data;
      if (payload && payload.job) {
        applyJobEvent(payload as JobProgressEvent);
      }
    } catch {
      // Ignore initial or transient 404/fetching errors
    }
  }, [queue, jobId, applyJobEvent]);

  // Handle Socket.IO connection and subscription
  useEffect(() => {
    if (!enabled || !queue || !jobId) {
      setStatus('IDLE');
      setCurrent(0);
      setTotal(0);
      setPercentage(0);
      setIsConnected(false);
      return;
    }

    hasInvalidatedRef.current = false;

    // 1. Initial REST fetch for immediate baseline
    fetchStatusFromApi();

    // 2. Setup Socket.IO connection
    const baseUrl = getSocketBaseUrl();
    const socket = io(`${baseUrl}/ws/jobs`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      // Subscribe to target job room
      socket.emit('subscribe_job', { queue, jobId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('job.event', (event: JobProgressEvent) => {
      if (event?.job?.queue === queue && String(event?.job?.jobId) === String(jobId)) {
        applyJobEvent(event);
      }
    });

    // Cleanup on unmount or options change
    return () => {
      if (socket) {
        socket.emit('unsubscribe_job', { queue, jobId });
        socket.disconnect();
      }
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [enabled, queue, jobId, getSocketBaseUrl, applyJobEvent, fetchStatusFromApi]);

  // Polling fallback when socket is disconnected or job is actively processing
  useEffect(() => {
    if (!enabled || !queue || !jobId) return;

    const isTerminal = status === 'COMPLETED' || status === 'FAILED';
    if (isTerminal) {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
      return;
    }

    // If socket is disconnected OR status is still QUEUED/PROCESSING, poll at controlled intervals
    if (!isConnected || status === 'QUEUED' || status === 'PROCESSING') {
      pollingTimerRef.current = setInterval(() => {
        fetchStatusFromApi();
      }, pollingIntervalMs);
    }

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
      }
    };
  }, [enabled, queue, jobId, isConnected, status, fetchStatusFromApi, pollingIntervalMs]);

  const isProcessing = status === 'QUEUED' || status === 'PROCESSING';
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED';
  const isRetrying = status === 'RETRYING';

  return {
    status,
    current,
    total,
    percentage,
    stage,
    message,
    errorCode,
    resultSummary,
    isProcessing,
    isCompleted,
    isFailed,
    isRetrying,
    isConnected,
    lastUpdated,
    refetchStatus: fetchStatusFromApi,
  };
};

export default useJobProgress;
