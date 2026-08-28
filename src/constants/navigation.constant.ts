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
  academicCalendar: '/exam-calendar',
  profile: '/profile',
});

// ** Misc **
export const NOT_FOUND_PATH = '*';
