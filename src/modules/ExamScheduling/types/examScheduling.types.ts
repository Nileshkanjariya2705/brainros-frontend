export type ExamScheduleStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED' | 'RESCHEDULED';

export type ExamLifecycleAction =
  | 'SUBMIT'
  | 'APPROVE'
  | 'SCHEDULE'
  | 'RESCHEDULE'
  | 'ACTIVATE'
  | 'END'
  | 'START_EVALUATION'
  | 'COMPLETE'
  | 'CANCEL';

export interface ExamScheduleItem {
  id: string;
  examId: string;
  examVersionId: string;
  startTime: string;
  endTime: string;
  timezone: string;
  status: ExamScheduleStatus;
  scheduledById: string;
  scheduledAt: string;
  activatedById?: string | null;
  activatedAt?: string | null;
  cancelledById?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
  exam?: {
    id: string;
    title: string;
    status?: { name: string };
  };
  examVersion?: {
    id: string;
    versionNumber: number;
    status?: string;
    totalQuestions?: number;
  };
  scheduledBy?: { id: string; email: string };
  activatedBy?: { id: string; email: string };
}

export interface ExamLifecycleHistoryItem {
  id: string;
  examId: string;
  examVersionId?: string | null;
  scheduleId?: string | null;
  action: ExamLifecycleAction;
  fromStatus: string;
  toStatus: string;
  performedById: string;
  comment?: string | null;
  metadata?: any;
  createdAt: string;
  performedBy?: { id: string; email: string };
  examVersion?: { id: string; versionNumber: number };
  schedule?: ExamScheduleItem;
}

export interface ScheduleExamPayload {
  examVersionId: string;
  startTime: string;
  endTime: string;
  timezone?: string;
}

export interface RescheduleExamPayload {
  startTime: string;
  endTime: string;
  timezone?: string;
  reason?: string;
}

export interface ActionReasonPayload {
  reason?: string;
  comment?: string;
}

export interface StudentAccessCheckResult {
  isAllowed: boolean;
  examId: string;
  examVersionId: string;
  scheduleId: string;
  serverTime: string;
  startTime: string;
  endTime: string;
  timeRemainingSeconds: number;
}
