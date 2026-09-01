import { useCallback } from 'react';
import { useAxiosGet, useAxiosPost } from '@/hooks/useAxios';

export interface SecurityProfile {
  id: string;
  name: string;
  code: string;
  level: 'STANDARD' | 'STRICT' | 'HIGH_STAKES' | 'LOCKDOWN';
  version: number;
  fullscreenRequired: boolean;
  preventCopyPaste: boolean;
  preventContextMenu: boolean;
  preventTextSelection: boolean;
  detectTabSwitch: boolean;
  detectWindowBlur: boolean;
  detectFullscreenExit: boolean;
  detectMultipleSessions: boolean;
  allowNetworkOffline: boolean;
  heartbeatIntervalSeconds: number;
}

export interface SecurityPreflightResponse {
  examId: string;
  profile: SecurityProfile;
  instructions: string[];
}

export interface SecurityEventPayload {
  eventId: string;
  eventType: string;
  sequenceNumber?: number;
  clientTimestamp?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SecurityHeartbeatResponse {
  attemptId: string;
  serverTime: string;
  isExpired: boolean;
  attemptStatus: string;
  isFlagged: boolean;
  disqualifiedAt: string | null;
  multipleSessionDetected: boolean;
  heartbeatIntervalSeconds: number;
}

export const useGetSecurityPreflightAPI = () => {
  const [get, state] = useAxiosGet();
  const getSecurityPreflightAPI = useCallback(
    (examId: string) => get<SecurityPreflightResponse>(`/exams/${examId}/security-preflight`),
    [get],
  );
  return { getSecurityPreflightAPI, ...state };
};

export const useAcceptSecurityPolicyAPI = () => {
  const [post, state] = useAxiosPost();
  const acceptSecurityPolicyAPI = useCallback(
    (attemptId: string, securityProfileId: string, policyVersion: number = 1) =>
      post(`/attempts/${attemptId}/accept-policy`, { securityProfileId, policyVersion }),
    [post],
  );
  return { acceptSecurityPolicyAPI, ...state };
};

export const useCreateExamSessionAPI = () => {
  const [post, state] = useAxiosPost();
  const createExamSessionAPI = useCallback(
    (attemptId: string, deviceMetadata?: Record<string, any>) =>
      post<{ id: string; status: string }>(`/attempts/${attemptId}/session`, { deviceMetadata }),
    [post],
  );
  return { createExamSessionAPI, ...state };
};

export const useSendHeartbeatAPI = () => {
  const [post, state] = useAxiosPost();
  const sendHeartbeatAPI = useCallback(
    (attemptId: string, payload: { sessionId?: string; isFullscreen?: boolean; isOnline?: boolean; deviceMetadata?: any }) =>
      post<SecurityHeartbeatResponse>(`/attempts/${attemptId}/heartbeat`, {
        ...payload,
        clientTimestamp: new Date().toISOString(),
      }),
    [post],
  );
  return { sendHeartbeatAPI, ...state };
};

export const useIngestSecurityEventsAPI = () => {
  const [post, state] = useAxiosPost();
  const ingestSecurityEventsAPI = useCallback(
    (attemptId: string, events: SecurityEventPayload[], sessionId?: string) =>
      post<{ success: boolean; ingestedCount: number; evaluation: any }>(
        `/attempts/${attemptId}/security-events`,
        { events, sessionId },
      ),
    [post],
  );
  return { ingestSecurityEventsAPI, ...state };
};

export const useGetExamSecuritySummaryAPI = () => {
  const [get, state] = useAxiosGet();
  const getExamSecuritySummaryAPI = useCallback(
    (examId: string) => get<any>(`/admin/exams/${examId}/security-summary`),
    [get],
  );
  return { getExamSecuritySummaryAPI, ...state };
};

export const useGetAttemptSecurityDetailsAPI = () => {
  const [get, state] = useAxiosGet();
  const getAttemptSecurityDetailsAPI = useCallback(
    (attemptId: string) => get<any>(`/admin/attempts/${attemptId}/security`),
    [get],
  );
  return { getAttemptSecurityDetailsAPI, ...state };
};

export const useReviewSecurityAttemptAPI = () => {
  const [post, state] = useAxiosPost();
  const reviewSecurityAttemptAPI = useCallback(
    (attemptId: string, payload: { status: string; reason?: string; notes?: string }) =>
      post(`/admin/attempts/${attemptId}/security-review`, payload),
    [post],
  );
  return { reviewSecurityAttemptAPI, ...state };
};

export const useTerminateAttemptAPI = () => {
  const [post, state] = useAxiosPost();
  const terminateAttemptAPI = useCallback(
    (attemptId: string, reason: string) =>
      post(`/admin/attempts/${attemptId}/terminate`, { reason }),
    [post],
  );
  return { terminateAttemptAPI, ...state };
};
