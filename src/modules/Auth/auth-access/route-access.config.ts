import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { PERMISSIONS, type PermissionCode } from './permission.constants';
import { ROLES, type RoleType } from './roles.constants';

export interface RouteAccessRule {
  path: string;
  permissions?: PermissionCode[];
  roles?: RoleType[];
  allowAnyRole?: boolean;
}

/**
 * Centralized Route Access Control Registry
 * Defines exact permissions and roles required for each route.
 */
export const ROUTE_ACCESS_REGISTRY: Record<string, RouteAccessRule> = {
  // Legacy / Dispatcher
  [PRIVATE_NAVIGATION.dashboard]: {
    path: PRIVATE_NAVIGATION.dashboard,
    allowAnyRole: true,
  },
  [PRIVATE_NAVIGATION.profile]: {
    path: PRIVATE_NAVIGATION.profile,
    allowAnyRole: true,
  },

  // Student Role Routes
  [PRIVATE_NAVIGATION.studentDashboard]: {
    path: PRIVATE_NAVIGATION.studentDashboard,
    roles: [ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.studentExams]: {
    path: PRIVATE_NAVIGATION.studentExams,
    permissions: [PERMISSIONS.EXAM_VIEW, PERMISSIONS.EXAM_ATTEMPT],
    roles: [ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.studentHistory]: {
    path: PRIVATE_NAVIGATION.studentHistory,
    permissions: [PERMISSIONS.ATTEMPT_VIEW, PERMISSIONS.RESULT_VIEW],
    roles: [ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.studentCalendar]: {
    path: PRIVATE_NAVIGATION.studentCalendar,
    permissions: [PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.studentTrends]: {
    path: PRIVATE_NAVIGATION.studentTrends,
    permissions: [PERMISSIONS.ANALYSIS_VIEW, PERMISSIONS.TRENDS_VIEW],
    roles: [ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.studentLeaderboard]: {
    path: PRIVATE_NAVIGATION.studentLeaderboard,
    permissions: [PERMISSIONS.RANK_VIEW],
    roles: [ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.studentProfile]: {
    path: PRIVATE_NAVIGATION.studentProfile,
    allowAnyRole: true,
  },

  // Admin Role Routes
  [PRIVATE_NAVIGATION.adminDashboard]: {
    path: PRIVATE_NAVIGATION.adminDashboard,
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminQuestionBank]: {
    path: PRIVATE_NAVIGATION.adminQuestionBank,
    permissions: [PERMISSIONS.QUESTION_VIEW],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminCreateQuestion]: {
    path: PRIVATE_NAVIGATION.adminCreateQuestion,
    permissions: [PERMISSIONS.QUESTION_CREATE],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminEditQuestion]: {
    path: PRIVATE_NAVIGATION.adminEditQuestion,
    permissions: [PERMISSIONS.QUESTION_UPDATE],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminLanguages]: {
    path: PRIVATE_NAVIGATION.adminLanguages,
    permissions: [PERMISSIONS.TRANSLATION_VIEW],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminExamBlueprints]: {
    path: PRIVATE_NAVIGATION.adminExamBlueprints,
    permissions: [PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminExams]: {
    path: PRIVATE_NAVIGATION.adminExams,
    permissions: [PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminExamScheduling]: {
    path: PRIVATE_NAVIGATION.adminExamScheduling,
    permissions: [PERMISSIONS.EXAM_SCHEDULE, PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminStrategyRules]: {
    path: PRIVATE_NAVIGATION.adminStrategyRules,
    permissions: [PERMISSIONS.STRATEGY_VIEW],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminLeaderboard]: {
    path: PRIVATE_NAVIGATION.adminLeaderboard,
    permissions: [PERMISSIONS.RANK_VIEW],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminHistoricalDatasets]: {
    path: PRIVATE_NAVIGATION.adminHistoricalDatasets,
    permissions: [PERMISSIONS.ANALYSIS_VIEW],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminControlCenterPage]: {
    path: PRIVATE_NAVIGATION.adminControlCenterPage,
    permissions: [PERMISSIONS.APPROVAL_VIEW, PERMISSIONS.USER_VIEW],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminApprovalQueuePage]: {
    path: PRIVATE_NAVIGATION.adminApprovalQueuePage,
    permissions: [PERMISSIONS.APPROVAL_VIEW],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminAuditLogsPage]: {
    path: PRIVATE_NAVIGATION.adminAuditLogsPage,
    permissions: [PERMISSIONS.AUDIT_VIEW],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminNotificationsPage]: {
    path: PRIVATE_NAVIGATION.adminNotificationsPage,
    permissions: [PERMISSIONS.NOTIFICATION_VIEW],
    roles: [ROLES.ADMIN],
  },
  [PRIVATE_NAVIGATION.adminProfile]: {
    path: PRIVATE_NAVIGATION.adminProfile,
    roles: [ROLES.ADMIN],
  },

  // Super Admin Role Routes
  [PRIVATE_NAVIGATION.superAdminDashboard]: {
    path: PRIVATE_NAVIGATION.superAdminDashboard,
    roles: [ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.superAdminRegistrations]: {
    path: PRIVATE_NAVIGATION.superAdminRegistrations,
    roles: [ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.superAdminControlCenter]: {
    path: PRIVATE_NAVIGATION.superAdminControlCenter,
    roles: [ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.superAdminApprovalQueue]: {
    path: PRIVATE_NAVIGATION.superAdminApprovalQueue,
    roles: [ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.superAdminAuditLogs]: {
    path: PRIVATE_NAVIGATION.superAdminAuditLogs,
    roles: [ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.superAdminNotifications]: {
    path: PRIVATE_NAVIGATION.superAdminNotifications,
    roles: [ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.superAdminInstitutionDashboard]: {
    path: PRIVATE_NAVIGATION.superAdminInstitutionDashboard,
    roles: [ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.superAdminProfile]: {
    path: PRIVATE_NAVIGATION.superAdminProfile,
    roles: [ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.superAdminExams]: {
    path: PRIVATE_NAVIGATION.superAdminExams,
    roles: [ROLES.SUPER_ADMIN],
  },

  // Parent Role Routes
  [PRIVATE_NAVIGATION.parentDashboardHome]: {
    path: PRIVATE_NAVIGATION.parentDashboardHome,
    roles: [ROLES.PARENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.parentWardProgress]: {
    path: PRIVATE_NAVIGATION.parentWardProgress,
    permissions: [PERMISSIONS.PARENT_VIEW, PERMISSIONS.STUDENT_VIEW],
    roles: [ROLES.PARENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.parentProfile]: {
    path: PRIVATE_NAVIGATION.parentProfile,
    roles: [ROLES.PARENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.availableExams]: {
    path: PRIVATE_NAVIGATION.availableExams,
    permissions: [PERMISSIONS.EXAM_VIEW, PERMISSIONS.EXAM_ATTEMPT],
    roles: [ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.examInterface]: {
    path: PRIVATE_NAVIGATION.examInterface,
    permissions: [PERMISSIONS.EXAM_ATTEMPT],
    roles: [ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.examResult]: {
    path: PRIVATE_NAVIGATION.examResult,
    permissions: [PERMISSIONS.RESULT_VIEW],
  },
  [PRIVATE_NAVIGATION.myHistory]: {
    path: PRIVATE_NAVIGATION.myHistory,
    permissions: [PERMISSIONS.ATTEMPT_VIEW, PERMISSIONS.RESULT_VIEW],
    roles: [ROLES.STUDENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.performanceTrends]: {
    path: PRIVATE_NAVIGATION.performanceTrends,
    permissions: [PERMISSIONS.ANALYSIS_VIEW, PERMISSIONS.TRENDS_VIEW],
  },
  [PRIVATE_NAVIGATION.academicCalendar]: {
    path: PRIVATE_NAVIGATION.academicCalendar,
    permissions: [PERMISSIONS.EXAM_VIEW],
  },

  // Question & Translation Management
  [PRIVATE_NAVIGATION.questionBank]: {
    path: PRIVATE_NAVIGATION.questionBank,
    permissions: [PERMISSIONS.QUESTION_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.createQuestion]: {
    path: PRIVATE_NAVIGATION.createQuestion,
    permissions: [PERMISSIONS.QUESTION_CREATE],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.editQuestion]: {
    path: PRIVATE_NAVIGATION.editQuestion,
    permissions: [PERMISSIONS.QUESTION_UPDATE],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.languages]: {
    path: PRIVATE_NAVIGATION.languages,
    permissions: [PERMISSIONS.TRANSLATION_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },

  // Exam Studio
  [PRIVATE_NAVIGATION.examBlueprints]: {
    path: PRIVATE_NAVIGATION.examBlueprints,
    permissions: [PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.examScheduling]: {
    path: PRIVATE_NAVIGATION.examScheduling,
    permissions: [PERMISSIONS.EXAM_SCHEDULE, PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.strategyRules]: {
    path: PRIVATE_NAVIGATION.strategyRules,
    permissions: [PERMISSIONS.STRATEGY_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.leaderboard]: {
    path: PRIVATE_NAVIGATION.leaderboard,
    permissions: [PERMISSIONS.RANK_VIEW],
  },
  [PRIVATE_NAVIGATION.historicalDatasets]: {
    path: PRIVATE_NAVIGATION.historicalDatasets,
    permissions: [PERMISSIONS.ANALYSIS_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },

  // Institution & B2B
  [PRIVATE_NAVIGATION.institutionDashboard]: {
    path: PRIVATE_NAVIGATION.institutionDashboard,
    permissions: [PERMISSIONS.INSTITUTION_VIEW],
    roles: [ROLES.INSTITUTION_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SALES_AGENT],
  },
  [PRIVATE_NAVIGATION.institutionBatches]: {
    path: PRIVATE_NAVIGATION.institutionBatches,
    permissions: [PERMISSIONS.BATCH_MANAGE, PERMISSIONS.INSTITUTION_VIEW],
    roles: [ROLES.INSTITUTION_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.institutionBulkUpload]: {
    path: PRIVATE_NAVIGATION.institutionBulkUpload,
    permissions: [PERMISSIONS.BULK_UPLOAD, PERMISSIONS.INSTITUTION_MANAGE],
    roles: [ROLES.INSTITUTION_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.institutionReports]: {
    path: PRIVATE_NAVIGATION.institutionReports,
    permissions: [PERMISSIONS.REPORT_VIEW],
    roles: [ROLES.INSTITUTION_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SALES_AGENT],
  },
  [PRIVATE_NAVIGATION.institutionProfile]: {
    path: PRIVATE_NAVIGATION.institutionProfile,
    roles: [ROLES.INSTITUTION_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SALES_AGENT],
  },

  // Parent Portal
  [PRIVATE_NAVIGATION.parentDashboard]: {
    path: PRIVATE_NAVIGATION.parentDashboard,
    permissions: [PERMISSIONS.PARENT_VIEW, PERMISSIONS.STUDENT_VIEW],
    roles: [ROLES.PARENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },

  // Governance & Approvals
  [PRIVATE_NAVIGATION.adminControlCenter]: {
    path: PRIVATE_NAVIGATION.adminControlCenter,
    permissions: [PERMISSIONS.APPROVAL_VIEW, PERMISSIONS.USER_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminApprovalQueue]: {
    path: PRIVATE_NAVIGATION.adminApprovalQueue,
    permissions: [PERMISSIONS.APPROVAL_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminAuditLogs]: {
    path: PRIVATE_NAVIGATION.adminAuditLogs,
    permissions: [PERMISSIONS.AUDIT_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminNotifications]: {
    path: PRIVATE_NAVIGATION.adminNotifications,
    permissions: [PERMISSIONS.NOTIFICATION_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
};
