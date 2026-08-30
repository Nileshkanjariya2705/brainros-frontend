/**
 * Route path registry (repo convention: PUBLIC_NAVIGATION / PRIVATE_NAVIGATION
 * objects, never inline path strings).
 */

// ** Unauthenticated paths **
export const PUBLIC_NAVIGATION = Object.freeze({
  home: '/',
  login: '/login',
  register: '/register',
});

// ** Authenticated paths **
export const PRIVATE_NAVIGATION = Object.freeze({
  // ── Legacy flat paths (kept for backward compatibility / redirects) ──
  dashboard: '/dashboard',
  availableExams: '/exams',
  examInterface: '/exam/:examId/attempt/:attemptId',
  examResult: '/exam/result/:attemptId',
  myHistory: '/history',
  questionBank: '/question-bank',
  createQuestion: '/question-bank/create',
  editQuestion: '/question-bank/:id/edit',
  languages: '/languages',
  examBlueprints: '/exam-blueprints',
  examScheduling: '/exam-scheduling',
  strategyRules: '/strategy-rules',
  leaderboard: '/leaderboard',
  historicalDatasets: '/historical-datasets',
  performanceTrends: '/performance-trends',
  parentDashboard: '/parent-dashboard',
  institutionDashboard: '/institution',
  institutionBatches: '/institution/batches',
  institutionBulkUpload: '/institution/bulk-upload',
  institutionReports: '/institution/reports',
  adminControlCenter: '/admin',
  adminApprovalQueue: '/admin/approvals',
  adminAuditLogs: '/admin/audit-logs',
  adminNotifications: '/admin/notifications',
  notifications: '/notifications',
  examDetails: '/exams/:examId',
  academicCalendar: '/exam-calendar',
  profile: '/profile',

  // ── Student role-prefixed routes ──
  studentDashboard: '/student/dashboard',
  studentExams: '/student/exams',
  studentExamDetails: '/student/exams/:examId',
  studentNotifications: '/student/notifications',
  studentHistory: '/student/history',
  studentCalendar: '/student/exam-calendar',
  studentTrends: '/student/performance-trends',
  studentComparison: '/student/comparison',
  studentMockComparison: '/student/mock-comparison',
  studentLeaderboard: '/student/leaderboard',
  studentProfile: '/student/profile',

  // ── Admin role-prefixed routes ──
  adminDashboard: '/admin/dashboard',
  adminQuestionBank: '/admin/question-bank',
  adminCreateQuestion: '/admin/question-bank/create',
  adminEditQuestion: '/admin/question-bank/:id/edit',
  adminLanguages: '/admin/languages',
  adminExamBlueprints: '/admin/exam-blueprints',
  adminExams: '/admin/exams',
  adminExamScheduling: '/admin/exam-scheduling',
  adminStrategyRules: '/admin/strategy-rules',
  adminLeaderboard: '/admin/leaderboard',
  adminHistoricalDatasets: '/admin/historical-datasets',
  adminControlCenterPage: '/admin/control-center',
  adminApprovalQueuePage: '/admin/approval-queue',
  adminAuditLogsPage: '/admin/audit-logs-page',
  adminNotificationsPage: '/admin/notifications-page',
  adminProfile: '/admin/profile',

  // ── Super Admin role-prefixed routes ──
  superAdminDashboard: '/super-admin/dashboard',
  superAdminQuestionBank: '/super-admin/question-bank',
  superAdminCreateQuestion: '/super-admin/question-bank/create',
  superAdminEditQuestion: '/super-admin/question-bank/:id/edit',
  superAdminLanguages: '/super-admin/languages',
  superAdminExamBlueprints: '/super-admin/exam-blueprints',
  superAdminExams: '/super-admin/exams',
  superAdminExamScheduling: '/super-admin/exam-scheduling',
  superAdminStrategyRules: '/super-admin/strategy-rules',
  superAdminLeaderboard: '/super-admin/leaderboard',
  superAdminHistoricalDatasets: '/super-admin/historical-datasets',
  superAdminControlCenter: '/super-admin/control-center',
  superAdminApprovalQueue: '/super-admin/approval-queue',
  superAdminAuditLogs: '/super-admin/audit-logs',
  superAdminNotifications: '/super-admin/notifications',
  superAdminInstitutionDashboard: '/super-admin/institution',
  superAdminInstitutionBatches: '/super-admin/institution/batches',
  superAdminInstitutionBulkUpload: '/super-admin/institution/bulk-upload',
  superAdminInstitutionReports: '/super-admin/institution/reports',
  superAdminProfile: '/super-admin/profile',

  // ── Parent role-prefixed routes ──
  parentDashboardHome: '/parent/dashboard',
  parentWardProgress: '/parent/ward-progress',
  parentProfile: '/parent/profile',
});

// ** Misc **
export const NOT_FOUND_PATH = '*';
