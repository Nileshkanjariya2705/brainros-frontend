import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Axios } from '@/base-axios';
import { scheduleKeys, examKeys, academicCalendarKeys } from '@/services/queryKeys';
import type {
  ExamScheduleItem,
  ExamLifecycleHistoryItem,
  ScheduleExamPayload,
  RescheduleExamPayload,
  ActionReasonPayload,
  StudentAccessCheckResult,
} from '../types/examScheduling.types';
import type {
  ScheduleAdminExamPayload,
  CheckQuestionAvailabilityParams,
  QuestionAvailabilityResult,
} from './examScheduling.service';

export function useCheckQuestionAvailabilityQuery(params: CheckQuestionAvailabilityParams | null) {
  return useQuery<QuestionAvailabilityResult>({
    queryKey: ['exam-scheduling', 'check-availability', params],
    queryFn: async () => {
      if (!params) throw new Error('Params required');
      const query = new URLSearchParams({
        examType: params.examType,
        questionCount: String(params.questionCount),
        ...(params.examTargetId ? { examTargetId: params.examTargetId } : {}),
        ...(params.examTargetName ? { examTargetName: params.examTargetName } : {}),
        ...(params.subjectId ? { subjectId: params.subjectId } : {}),
        ...(params.chapterId ? { chapterId: params.chapterId } : {}),
        ...(params.blueprintId ? { blueprintId: params.blueprintId } : {}),
      }).toString();
      const res = await Axios.get<any>(`/admin/exams/check-availability?${query}`);
      return res.data?.data ?? res.data;
    },
    enabled: Boolean(params && params.examType && params.questionCount > 0),
    staleTime: 30_000,
  });
}

export function useSchedulingCandidatesQuery() {
  return useQuery<any[]>({
    queryKey: scheduleKeys.candidates(),
    queryFn: async () => {
      const res = await Axios.get<any>('/super-admin/exams/scheduling-candidates');
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 30_000,
  });
}

export function useExamScheduleQuery(examId?: string) {
  return useQuery<ExamScheduleItem>({
    queryKey: scheduleKeys.detail(examId || ''),
    queryFn: async () => {
      if (!examId) throw new Error('Exam ID required');
      const res = await Axios.get<any>(`/exams/${examId}/schedule`);
      return res.data?.data ?? res.data;
    },
    enabled: Boolean(examId),
    staleTime: 30_000,
  });
}

export function useExamLifecycleQuery(examId?: string) {
  return useQuery<ExamLifecycleHistoryItem[]>({
    queryKey: ['exams', examId, 'lifecycle'],
    queryFn: async () => {
      if (!examId) throw new Error('Exam ID required');
      const res = await Axios.get<any>(`/exams/${examId}/lifecycle`);
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(examId),
    staleTime: 30_000,
  });
}

export function useCheckExamAccessQuery(examId?: string) {
  return useQuery<StudentAccessCheckResult>({
    queryKey: ['exams', examId, 'access-check'],
    queryFn: async () => {
      if (!examId) throw new Error('Exam ID required');
      const res = await Axios.get<any>(`/exams/${examId}/access-check`);
      return res.data?.data ?? res.data;
    },
    enabled: Boolean(examId),
    staleTime: 10_000,
  });
}

export function useScheduleAdminExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ScheduleAdminExamPayload) => {
      const res = await Axios.post<any>('/admin/exams/schedule', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exam-manager', 'exams'] });
      qc.invalidateQueries({ queryKey: examKeys.all });
      qc.invalidateQueries({ queryKey: academicCalendarKeys.all });
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
    },
  });
}

export function useScheduleExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ examId, payload }: { examId: string; payload: ScheduleExamPayload }) => {
      const res = await Axios.post<any>(`/exams/${examId}/schedule`, payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, { examId }) => {
      qc.invalidateQueries({ queryKey: scheduleKeys.detail(examId) });
      qc.invalidateQueries({ queryKey: examKeys.all });
      qc.invalidateQueries({ queryKey: academicCalendarKeys.all });
    },
  });
}

export function useRescheduleExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ scheduleId, payload }: { scheduleId: string; payload: RescheduleExamPayload }) => {
      const res = await Axios.patch<any>(`/exam-schedules/${scheduleId}`, payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
      qc.invalidateQueries({ queryKey: examKeys.all });
      qc.invalidateQueries({ queryKey: academicCalendarKeys.all });
    },
  });
}

export function useActivateExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (scheduleId: string) => {
      const res = await Axios.post<any>(`/exam-schedules/${scheduleId}/activate`, {});
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
      qc.invalidateQueries({ queryKey: examKeys.all });
    },
  });
}

export function useActivateExamDirectlyMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (examId: string) => {
      const res = await Axios.post(`/super-admin/exams/${examId}/activate`, {});
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.all });
      qc.invalidateQueries({ queryKey: examKeys.all });
    },
  });
}

export function useSubmitExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ examId, payload }: { examId: string; payload?: ActionReasonPayload }) => {
      const res = await Axios.post(`/exams/${examId}/submit`, payload || {});
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, { examId }) => {
      qc.invalidateQueries({ queryKey: ['exams', examId] });
      qc.invalidateQueries({ queryKey: examKeys.all });
    },
  });
}

export function useApproveExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ examId, payload }: { examId: string; payload?: ActionReasonPayload }) => {
      const res = await Axios.post(`/exams/${examId}/approve`, payload || {});
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, { examId }) => {
      qc.invalidateQueries({ queryKey: ['exams', examId] });
      qc.invalidateQueries({ queryKey: examKeys.all });
    },
  });
}

export function useCancelExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ examId, reason }: { examId: string; reason?: string }) => {
      const res = await Axios.post(`/exams/${examId}/cancel`, { reason });
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, { examId }) => {
      qc.invalidateQueries({ queryKey: ['exams', examId] });
      qc.invalidateQueries({ queryKey: examKeys.all });
      qc.invalidateQueries({ queryKey: academicCalendarKeys.all });
    },
  });
}
