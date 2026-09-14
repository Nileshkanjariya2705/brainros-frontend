import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { adminKeys, resultKeys } from '@/services/queryKeys';
import {
  completedExamReportsService,
  type CompletedLiveExamItem,
  type LiveExamSummaryMetrics,
  type AttendeesResponse,
  type StudentAttemptAnalysisResponse,
} from './completedExamReports.service';

export function useCompletedExamsQuery() {
  return useQuery<CompletedLiveExamItem[]>({
    queryKey: adminKeys.completedExams(),
    queryFn: async () => {
      return await completedExamReportsService.getCompletedLiveExams();
    },
    staleTime: 60_000,
  });
}

export function useCompletedExamSummaryQuery(examId?: string) {
  return useQuery<LiveExamSummaryMetrics>({
    queryKey: adminKeys.completedExamSummary(examId || ''),
    queryFn: async () => {
      if (!examId) throw new Error('Exam ID required');
      return await completedExamReportsService.getLiveExamSummary(examId);
    },
    enabled: Boolean(examId),
    staleTime: 30_000,
  });
}

export function useCompletedExamAttendeesQuery(
  examId?: string,
  params: {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = { page: 1, limit: 10 },
) {
  return useQuery<AttendeesResponse>({
    queryKey: adminKeys.completedExamAttendees(examId || '', params),
    queryFn: async () => {
      if (!examId) throw new Error('Exam ID required');
      return await completedExamReportsService.getLiveExamAttendees(examId, params);
    },
    enabled: Boolean(examId),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useStudentAttemptAnalysisQuery(examId?: string, attemptId?: string | null) {
  return useQuery<StudentAttemptAnalysisResponse>({
    queryKey: resultKeys.analysis(attemptId || ''),
    queryFn: async () => {
      if (!examId || !attemptId) throw new Error('Exam ID and Attempt ID required');
      return await completedExamReportsService.getStudentAttemptAnalysis(examId, attemptId);
    },
    enabled: Boolean(examId && attemptId),
    staleTime: Infinity,
  });
}

export function useSendAllReportEmailsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) => completedExamReportsService.sendAllReportEmails(examId),
    onSuccess: (_data, examId) => {
      qc.invalidateQueries({ queryKey: adminKeys.completedExams() });
      qc.invalidateQueries({ queryKey: adminKeys.completedExamSummary(examId) });
      qc.invalidateQueries({ queryKey: adminKeys.completedExamAttendees(examId) });
    },
  });
}

export function useSendStudentReportEmailMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, attemptId }: { examId: string; attemptId: string }) =>
      completedExamReportsService.sendStudentReportEmail(examId, attemptId),
    onSuccess: (_data, { examId, attemptId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.completedExamAttendees(examId) });
      qc.invalidateQueries({ queryKey: adminKeys.completedExamEmailStatus(attemptId) });
    },
  });
}

export function useApproveReportMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, attemptId }: { examId: string; attemptId: string }) =>
      completedExamReportsService.approveReport(examId, attemptId),
    onSuccess: (_data, { examId }) => {
      qc.invalidateQueries({ queryKey: adminKeys.completedExamSummary(examId) });
      qc.invalidateQueries({ queryKey: adminKeys.completedExamAttendees(examId) });
    },
  });
}
