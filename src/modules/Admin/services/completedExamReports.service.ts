import { Axios } from '@/base-axios';

export interface CompletedLiveExamItem {
  id: string;
  title: string;
  description?: string;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  examTarget?: {
    id: string;
    name: string;
  };
  status?: string;
  publicationStatus: string;
  totalAttempts: number;
}

export interface LiveExamSummaryMetrics {
  examId: string;
  examTitle: string;
  examDate?: string;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  metrics: {
    registered: number;
    attended: number;
    submitted: number;
    autoSubmitted: number;
    evaluated: number;
    failed: number;
    averageScore: string;
    averageAccuracy: string;
    averagePercentage: string;
    highestScore: number;
    lowestScore: number;
  };
  publication: {
    status: string;
    publishedAt: string | null;
    evaluatedAttempts: number;
    totalEligibleAttempts: number;
  };
}

export interface AttendeeItem {
  attemptId: string;
  examId: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  email: string;
  phone?: string;
  attemptStatus: string;
  startedAt?: string;
  submittedAt?: string;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  accuracy: number | null;
  rank: number | null;
  percentile: number | null;
  totalCandidates: number | null;
  resultStatus: string;
  emailStatus: 'NONE' | 'QUEUED' | 'PROCESSING' | 'SENT' | 'FAILED';
  lastEmailSentAt: string | null;
}

export interface AttendeesResponse {
  items: AttendeeItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QuestionReviewItem {
  displayOrder: number;
  sectionName: string;
  questionType: { name: string; code: string };
  questionText: string;
  explanation?: string;
  options: Array<{
    id: string;
    optionLabel: string;
    optionKey: string;
    optionText: string;
    isCorrect: boolean;
  }>;
  studentAnswer: {
    selectedOptionId?: string;
    numericalAnswer?: number;
    selectedOptions?: string[];
    isMarkedForReview?: boolean;
  } | null;
  isCorrect: boolean;
  isAttempted: boolean;
}

export interface StudentAttemptAnalysisResponse {
  attemptId: string;
  examId: string;
  examTitle: string;
  student: {
    id: string;
    name: string;
    studentCode: string;
    email: string;
    phone?: string;
  };
  submittedAt?: string;
  rank: {
    rank?: number;
    percentile?: number;
    totalCandidates?: number;
  } | null;
  analysis: any;
  questionsReview: QuestionReviewItem[];
  emailStatus: {
    status: string;
    sentAt: string | null;
    messageId: string | null;
    error: string | null;
  };
}

export interface QueueEmailResult {
  success: boolean;
  message: string;
  status: string;
  jobId: string;
  recipientEmail: string;
}

export const completedExamReportsService = {
  /**
   * Fetch all completed live exams (latest first, excluding mock tests)
   */
  async getCompletedLiveExams(): Promise<CompletedLiveExamItem[]> {
    const response = await Axios.get('/admin/completed-exams');
    return response.data?.data || response.data || [];
  },

  /**
   * Fetch latest completed live exam
   */
  async getLatestCompletedLiveExam(): Promise<CompletedLiveExamItem | null> {
    const response = await Axios.get('/admin/completed-exams/latest');
    return response.data?.data || response.data || null;
  },

  /**
   * Fetch KPI summary for a specific live exam
   */
  async getLiveExamSummary(examId: string): Promise<LiveExamSummaryMetrics> {
    const response = await Axios.get(`/admin/completed-exams/${examId}/summary`);
    return response.data?.data || response.data;
  },

  /**
   * Fetch filtered & paginated attendees for a specific live exam
   */
  async getLiveExamAttendees(
    examId: string,
    params?: {
      search?: string;
      status?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    },
  ): Promise<AttendeesResponse> {
    const response = await Axios.get(`/admin/completed-exams/${examId}/attendees`, {
      params,
    });
    return response.data?.data || response.data;
  },

  /**
   * Fetch deep persisted analysis & question review for a specific attempt (pure read-only)
   */
  async getStudentAttemptAnalysis(
    examId: string,
    attemptId: string,
  ): Promise<StudentAttemptAnalysisResponse> {
    const response = await Axios.get(
      `/admin/completed-exams/${examId}/attendees/${attemptId}/analysis`,
    );
    return response.data?.data || response.data;
  },

  /**
   * Queue PDF report generation and email delivery via BullMQ
   */
  async sendStudentReportEmail(
    examId: string,
    attemptId: string,
  ): Promise<QueueEmailResult> {
    const response = await Axios.post(
      `/admin/completed-exams/${examId}/attempts/${attemptId}/send-report`,
    );
    return response.data?.data || response.data;
  },

  /**
   * Fetch real-time email delivery status
   */
  async getReportEmailStatus(
    examId: string,
    attemptId: string,
  ): Promise<{
    status: string;
    sentAt: string | null;
    messageId: string | null;
    error: string | null;
    recipient?: string;
  }> {
    const response = await Axios.get(
      `/admin/completed-exams/${examId}/attempts/${attemptId}/email-status`,
    );
    return response.data?.data || response.data;
  },
};
