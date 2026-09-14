/**
 * Centralized TanStack Query Key Factory
 *
 * Ensures all query keys are strongly typed, hierarchical, and scoped
 * to prevent collisions across roles (Student, Admin, Super Admin, Parent).
 */

export const studentKeys = {
  all: ['student'] as const,
  dashboard: () => [...studentKeys.all, 'dashboard'] as const,
  exams: (filters: Record<string, any> = {}) => [...studentKeys.all, 'exams', filters] as const,
  examHistory: (params: Record<string, any> = {}) =>
    ['exam-history', params] as const,
  profile: () => [...studentKeys.all, 'profile'] as const,
  trends: (params: Record<string, any> = {}) => [...studentKeys.all, 'trends', params] as const,
  comparison: (params: Record<string, any> = {}) =>
    [...studentKeys.all, 'comparison', params] as const,
};

export const examKeys = {
  all: ['exams'] as const,
  public: (params: Record<string, any> = {}) => [...examKeys.all, 'public', params] as const,
  available: (examTargetId: string) => [...examKeys.all, 'available', examTargetId] as const,
  detail: (examId: string) => [...examKeys.all, 'detail', examId] as const,
  languages: (examId: string) => [...examKeys.all, 'languages', examId] as const,
};

export const attemptKeys = {
  all: ['attempts'] as const,
  questions: (attemptId: string) => [...attemptKeys.all, attemptId, 'questions'] as const,
  status: (attemptId: string) => [...attemptKeys.all, attemptId, 'status'] as const,
  activeTiming: (attemptId: string) => [...attemptKeys.all, attemptId, 'active-timing'] as const,
};

export const resultKeys = {
  all: ['results'] as const,
  status: (attemptId: string) => [...resultKeys.all, attemptId, 'status'] as const,
  detail: (attemptId: string) => [...resultKeys.all, attemptId, 'detail'] as const,
  analysis: (attemptId: string) => [...resultKeys.all, attemptId, 'analysis'] as const,
  strategy: (attemptId: string) => [...resultKeys.all, attemptId, 'strategy'] as const,
  myRanks: (attemptId: string) => [...resultKeys.all, attemptId, 'my-ranks'] as const,
  review: (attemptId: string) => [...resultKeys.all, attemptId, 'review'] as const,
};

export const adminKeys = {
  all: ['admin'] as const,
  schools: (params: Record<string, any> = {}) => [...adminKeys.all, 'schools', params] as const,
  schoolDetail: (schoolId: string) => [...adminKeys.all, 'schools', 'detail', schoolId] as const,
  schoolFilterOptions: () => [...adminKeys.all, 'schools', 'filter-options'] as const,
  students: (filters: Record<string, any> = {}) => [...adminKeys.all, 'students', filters] as const,
  studentFilterOptions: () => [...adminKeys.all, 'students', 'filter-options'] as const,
  publicRegistrations: (filters: Record<string, any> = {}) =>
    ['public-registrations', filters] as const,
  publicRegistrationStats: () => ['public-registrations', 'stats'] as const,
  publicRegistrationFilterOptions: (stateId?: string) =>
    ['public-registrations', 'filter-options', stateId || 'all'] as const,
  publicStudentDetail: (studentId: string) =>
    ['public-registrations', 'student', studentId] as const,
  studentParents: (studentId: string) =>
    [...adminKeys.all, 'students', studentId, 'parents'] as const,
  completedExams: (filters: Record<string, any> = {}) =>
    [...adminKeys.all, 'completed-exams', filters] as const,
  completedExamSummary: (examId: string) =>
    [...adminKeys.all, 'completed-exams', examId, 'summary'] as const,
  completedExamAttendees: (examId: string, filters: Record<string, any> = {}) =>
    [...adminKeys.all, 'completed-exams', examId, 'attendees', filters] as const,
  completedExamEmailStatus: (attemptId: string) =>
    [...adminKeys.all, 'completed-exams', 'email-status', attemptId] as const,
  scheduledExams: (filters: Record<string, any> = {}) =>
    [...adminKeys.all, 'scheduled-exams', filters] as const,
  approvals: (params: Record<string, any> = {}) =>
    [...adminKeys.all, 'approvals', params] as const,
  auditLogs: (params: Record<string, any> = {}) =>
    [...adminKeys.all, 'audit-logs', params] as const,
};

export const academicKeys = {
  all: ['academic'] as const,
  subjects: (examTargetId?: string) => [...academicKeys.all, 'subjects', examTargetId || 'all'] as const,
  examTargets: () => [...academicKeys.all, 'exam-targets'] as const,
  chapters: (subjectId?: string) => [...academicKeys.all, 'chapters', subjectId || 'all'] as const,
  allChapters: (params: Record<string, any> = {}) => [...academicKeys.all, 'all-chapters', params] as const,
};

export const languageKeys = {
  all: ['languages'] as const,
  list: (includeInactive = false) => [...languageKeys.all, 'list', { includeInactive }] as const,
  detail: (languageId: string) => [...languageKeys.all, 'detail', languageId] as const,
  completeness: (questionId: string) => [...languageKeys.all, 'completeness', questionId] as const,
  questionTranslations: (questionId: string) => [...languageKeys.all, 'question', questionId] as const,
  examLanguages: (examId: string) => [...languageKeys.all, 'exam', examId] as const,
};

export const aiTranslationKeys = {
  all: ['ai-translation'] as const,
  scheduledExams: () => [...aiTranslationKeys.all, 'scheduled-exams'] as const,
  job: (jobId: string) => [...aiTranslationKeys.all, 'job', jobId] as const,
  jobQuestions: (jobId: string) => [...aiTranslationKeys.all, 'job', jobId, 'questions'] as const,
};

export const examManagerKeys = {
  all: ['exam-manager'] as const,
  exams: (params: Record<string, any> = {}) => [...examManagerKeys.all, 'exams', params] as const,
  examDetail: (examId: string) => [...examManagerKeys.all, 'exams', 'detail', examId] as const,
  questionPaper: (examId: string, versionId?: string) =>
    [...examManagerKeys.all, 'question-papers', examId, versionId || 'latest'] as const,
  importHistory: (params: Record<string, any> = {}) =>
    [...examManagerKeys.all, 'import-history', params] as const,
};

export const parentKeys = {
  all: ['parent'] as const,
  overview: () => [...parentKeys.all, 'overview'] as const,
  dashboard: () => [...parentKeys.all, 'dashboard'] as const,
  studentDashboard: (studentId: string) =>
    [...parentKeys.all, 'student', studentId, 'dashboard'] as const,
  wardSummary: (studentId: string) =>
    [...parentKeys.all, 'student', studentId, 'summary'] as const,
  wardResults: (studentId: string) =>
    [...parentKeys.all, 'student', studentId, 'results'] as const,
  wardRecommendations: (studentId: string) =>
    [...parentKeys.all, 'student', studentId, 'recommendations'] as const,
};

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (params: Record<string, any> = {}) =>
    [...notificationKeys.all, 'list', params] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  recentUnread: () => ['notifications', 'recent-unread'] as const,
};

export const masterKeys = {
  all: ['master'] as const,
  options: () => [...masterKeys.all, 'options'] as const,
  featureFlags: () => [...masterKeys.all, 'feature-flags'] as const,
  states: () => [...masterKeys.all, 'states'] as const,
  districts: (stateId: string) => [...masterKeys.all, 'districts', stateId] as const,
};

export const examProcessingKeys = {
  all: ['exam-processing'] as const,
  summary: (examId: string) => [...examProcessingKeys.all, 'summary', examId] as const,
  jobs: (examId: string, filters: Record<string, any> = {}) =>
    [...examProcessingKeys.all, 'jobs', examId, filters] as const,
  jobDetail: (examId: string, jobId: string) =>
    [...examProcessingKeys.all, 'job-detail', examId, jobId] as const,
};

export const institutionKeys = {
  all: ['institution'] as const,
  dashboard: (filters?: Record<string, any>) =>
    [...institutionKeys.all, 'dashboard', filters || {}] as const,
  students: (filters?: Record<string, any>) =>
    [...institutionKeys.all, 'students', filters || {}] as const,
  admissionYears: () => [...institutionKeys.all, 'admission-years'] as const,
  batches: () => [...institutionKeys.all, 'batches'] as const,
  batchStudents: (batchId: string) =>
    [...institutionKeys.all, 'batches', batchId, 'students'] as const,
  rankExams: () => [...institutionKeys.all, 'rank-exams'] as const,
  rankings: (filters?: Record<string, any>) =>
    [...institutionKeys.all, 'rankings', filters || {}] as const,
  reports: (filters?: Record<string, any>) =>
    [...institutionKeys.all, 'reports', filters || {}] as const,
  bulkUploads: () => [...institutionKeys.all, 'bulk-uploads'] as const,
  bulkUploadPreview: (uploadId: string) =>
    [...institutionKeys.all, 'bulk-uploads', uploadId, 'preview'] as const,
};

export const billingKeys = {
  all: ['billing'] as const,
  invoices: (params: Record<string, any> = {}) =>
    [...billingKeys.all, 'invoices', params] as const,
  invoiceDetail: (invoiceId: string) =>
    [...billingKeys.all, 'invoices', 'detail', invoiceId] as const,
  invoicePreview: (schoolId: string, month: number, year: number, pricePerStudent?: number) =>
    [...billingKeys.all, 'preview', schoolId, month, year, pricePerStudent] as const,
  stats: (params: Record<string, any> = {}) =>
    [...billingKeys.all, 'stats', params] as const,
  filterOptions: () => [...billingKeys.all, 'filter-options'] as const,
  taxConfig: () => [...billingKeys.all, 'tax-configuration'] as const,
  schools: () => [...billingKeys.all, 'schools'] as const,
  schoolPricings: () => [...billingKeys.all, 'schools', 'pricing'] as const,
  schoolPricing: (schoolId: string) => [...billingKeys.all, 'schools', 'pricing', schoolId] as const,
};

export const academicCalendarKeys = {
  all: ['academic-calendar'] as const,
  list: (params: Record<string, any> = {}) =>
    [...academicCalendarKeys.all, 'list', params] as const,
};

export const staffKeys = {
  all: ['staff'] as const,
  list: (params: Record<string, any> = {}) =>
    [...staffKeys.all, 'list', params] as const,
  detail: (staffId: string) =>
    [...staffKeys.all, 'detail', staffId] as const,
};

export const approvalQueueKeys = {
  all: ['approval-queue'] as const,
  list: (params: Record<string, any> = {}) =>
    [...approvalQueueKeys.all, 'list', params] as const,
  types: () => [...approvalQueueKeys.all, 'types'] as const,
};

export const superAdminRegistrationKeys = {
  all: ['super-admin-registrations'] as const,
  list: (params: Record<string, any> = {}) =>
    [...superAdminRegistrationKeys.all, 'list', params] as const,
  stats: (params: Record<string, any> = {}) =>
    [...superAdminRegistrationKeys.all, 'stats', params] as const,
  filters: (stateId?: string) =>
    [...superAdminRegistrationKeys.all, 'filters', stateId || 'all'] as const,
};

export const questionPaperKeys = {
  all: ['question-paper'] as const,
  detail: (examId: string, versionId?: string) =>
    [...questionPaperKeys.all, 'detail', examId, versionId || 'latest'] as const,
  uploadStatus: (jobId: string) =>
    [...questionPaperKeys.all, 'upload-status', jobId] as const,
  scheduleDetail: (examId: string) =>
    [...questionPaperKeys.all, 'schedule-detail', examId] as const,
};

export const scheduleKeys = {
  all: ['exam-schedule'] as const,
  candidates: () => [...scheduleKeys.all, 'candidates'] as const,
  detail: (examId: string) => [...scheduleKeys.all, 'detail', examId] as const,
  subjects: () => [...scheduleKeys.all, 'subjects'] as const,
  chapters: (subjectId: string) => [...scheduleKeys.all, 'chapters', subjectId] as const,
};
