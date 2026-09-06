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
  mockTests: (filters: Record<string, any> = {}) =>
    [...studentKeys.all, 'mock-tests', filters] as const,
  mockAttempts: (mockTestId: string) =>
    [...studentKeys.all, 'mock-tests', mockTestId, 'attempts'] as const,
  mockHistory: (params: Record<string, any> = {}) =>
    [...studentKeys.all, 'mock-history', params] as const,
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
  students: (filters: Record<string, any> = {}) => [...adminKeys.all, 'students', filters] as const,
  studentFilterOptions: () => [...adminKeys.all, 'students', 'filter-options'] as const,
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
  approvals: (params: Record<string, any> = {}) =>
    [...adminKeys.all, 'approvals', params] as const,
  auditLogs: (params: Record<string, any> = {}) =>
    [...adminKeys.all, 'audit-logs', params] as const,
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
};

export const masterKeys = {
  all: ['master'] as const,
  options: () => [...masterKeys.all, 'options'] as const,
  featureFlags: () => [...masterKeys.all, 'feature-flags'] as const,
  states: () => [...masterKeys.all, 'states'] as const,
  districts: (stateId: string) => [...masterKeys.all, 'districts', stateId] as const,
};
