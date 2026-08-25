import { useCallback } from 'react';
import { useAxiosGet, useAxiosPost, useAxiosPatch } from '@/hooks/useAxios';
import type {
  ExamScheduleItem,
  ExamLifecycleHistoryItem,
  ScheduleExamPayload,
  RescheduleExamPayload,
  ActionReasonPayload,
  StudentAccessCheckResult,
} from '../types/examScheduling.types';

// ─── Lifecycle State Actions ───────────────────────────────────

export const useSubmitExamAPI = () => {
  const [postReq, state] = useAxiosPost();

  const submitExamAPI = useCallback(
    async (examId: string, payload?: ActionReasonPayload) => {
      return postReq<any>(`/exams/${examId}/submit`, payload || {});
    },
    [postReq],
  );

  return { submitExamAPI, ...state };
};

export const useApproveExamAPI = () => {
  const [postReq, state] = useAxiosPost();

  const approveExamAPI = useCallback(
    async (examId: string, payload?: ActionReasonPayload) => {
      return postReq<any>(`/exams/${examId}/approve`, payload || {});
    },
    [postReq],
  );

  return { approveExamAPI, ...state };
};

export const useCancelExamAPI = () => {
  const [postReq, state] = useAxiosPost();

  const cancelExamAPI = useCallback(
    async (examId: string, reason?: string) => {
      return postReq<any>(`/exams/${examId}/cancel`, { reason });
    },
    [postReq],
  );

  return { cancelExamAPI, ...state };
};

// ─── Scheduling & Activation ───────────────────────────────────

export const useScheduleExamAPI = () => {
  const [postReq, state] = useAxiosPost();

  const scheduleExamAPI = useCallback(
    async (examId: string, payload: ScheduleExamPayload) => {
      return postReq<ExamScheduleItem>(`/exams/${examId}/schedule`, payload);
    },
    [postReq],
  );

  return { scheduleExamAPI, ...state };
};

export const useRescheduleExamAPI = () => {
  const [patchReq, state] = useAxiosPatch();

  const rescheduleExamAPI = useCallback(
    async (scheduleId: string, payload: RescheduleExamPayload) => {
      return patchReq<ExamScheduleItem>(`/exam-schedules/${scheduleId}`, payload);
    },
    [patchReq],
  );

  return { rescheduleExamAPI, ...state };
};

export const useActivateExamAPI = () => {
  const [postReq, state] = useAxiosPost();

  const activateExamAPI = useCallback(
    async (scheduleId: string) => {
      return postReq<ExamScheduleItem>(`/exam-schedules/${scheduleId}/activate`, {});
    },
    [postReq],
  );

  return { activateExamAPI, ...state };
};

// ─── Audit & Queries ───────────────────────────────────────────

export const useGetExamLifecycleAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getExamLifecycleAPI = useCallback(
    async (examId: string) => {
      return getReq<ExamLifecycleHistoryItem[]>(`/exams/${examId}/lifecycle`);
    },
    [getReq],
  );

  return { getExamLifecycleAPI, ...state };
};

export const useGetExamScheduleAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getExamScheduleAPI = useCallback(
    async (examId: string) => {
      return getReq<ExamScheduleItem>(`/exams/${examId}/schedule`);
    },
    [getReq],
  );

  return { getExamScheduleAPI, ...state };
};

export const useCheckExamAccessAPI = () => {
  const [getReq, state] = useAxiosGet();

  const checkExamAccessAPI = useCallback(
    async (examId: string) => {
      return getReq<StudentAccessCheckResult>(`/exams/${examId}/access-check`);
    },
    [getReq],
  );

  return { checkExamAccessAPI, ...state };
};
