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
  [PRIVATE_NAVIGATION.dashboard]: {
    path: PRIVATE_NAVIGATION.dashboard,
    allowAnyRole: true,
  },
  [PRIVATE_NAVIGATION.profile]: {
    path: PRIVATE_NAVIGATION.profile,
    allowAnyRole: true,
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
