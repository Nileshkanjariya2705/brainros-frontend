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

export interface ScheduleAdminExamPayload {
  examType: 'SPECIFIC_SUBJECT' | 'SPECIFIC_CHAPTER' | 'FULL_EXAM' | string;
  examTargetName?: string;
  examTargetId?: string;
  examName?: string;
  title?: string;
  configurationMode?: 'MANUAL' | 'BLUEPRINT';
  subjectId?: string;
  chapterId?: string;
  blueprintId?: string;
  questionCount?: number;
  totalQuestions?: number;
  duration?: number;
  durationMinutes?: number;
  marksPerQuestion?: number;
  negativeMarks?: number;
  languageId?: string;
  startTime: string;
  timezone?: string;
}

export interface CheckQuestionAvailabilityParams {
  examType: string;
  examTargetId?: string;
  examTargetName?: string;
  subjectId?: string;
  chapterId?: string;
  blueprintId?: string;
  questionCount: number;
}

export interface QuestionAvailabilityResult {
  availableCount: number;
  requiredCount: number;
  isAvailable: boolean;
  message: string;
}

export const useCheckQuestionAvailabilityAPI = () => {
  const [getReq, state] = useAxiosGet();

  const checkQuestionAvailabilityAPI = useCallback(
    async (params: CheckQuestionAvailabilityParams) => {
      const query = new URLSearchParams({
        examType: params.examType,
        questionCount: String(params.questionCount),
        ...(params.examTargetId ? { examTargetId: params.examTargetId } : {}),
        ...(params.examTargetName ? { examTargetName: params.examTargetName } : {}),
        ...(params.subjectId ? { subjectId: params.subjectId } : {}),
        ...(params.chapterId ? { chapterId: params.chapterId } : {}),
        ...(params.blueprintId ? { blueprintId: params.blueprintId } : {}),
      }).toString();
      return getReq<QuestionAvailabilityResult>(`/admin/exams/check-availability?${query}`);
    },
    [getReq],
  );

  return { checkQuestionAvailabilityAPI, ...state };
};

export const useScheduleAdminExamAPI = () => {
  const [postReq, state] = useAxiosPost();

  const scheduleAdminExamAPI = useCallback(
    async (payload: ScheduleAdminExamPayload) => {
      return postReq<ExamScheduleItem>(`/admin/exams/schedule`, payload);
    },
    [postReq],
  );

  return { scheduleAdminExamAPI, ...state };
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

export const useGetSchedulingCandidatesAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getSchedulingCandidatesAPI = useCallback(async () => {
    return getReq<any[]>(`/super-admin/exams/scheduling-candidates`);
  }, [getReq]);

  return { getSchedulingCandidatesAPI, ...state };
};

export const useActivateExamDirectlyAPI = () => {
  const [postReq, state] = useAxiosPost();

  const activateExamDirectlyAPI = useCallback(
    async (examId: string) => {
      return postReq<any>(`/super-admin/exams/${examId}/activate`, {});
    },
    [postReq],
  );

  return { activateExamDirectlyAPI, ...state };
};
