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
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminQuestionBank]: {
    path: PRIVATE_NAVIGATION.adminQuestionBank,
    permissions: [PERMISSIONS.QUESTION_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminCreateQuestion]: {
    path: PRIVATE_NAVIGATION.adminCreateQuestion,
    permissions: [PERMISSIONS.QUESTION_CREATE],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminEditQuestion]: {
    path: PRIVATE_NAVIGATION.adminEditQuestion,
    permissions: [PERMISSIONS.QUESTION_UPDATE],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminLanguages]: {
    path: PRIVATE_NAVIGATION.adminLanguages,
    permissions: [PERMISSIONS.TRANSLATION_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminExamBlueprints]: {
    path: PRIVATE_NAVIGATION.adminExamBlueprints,
    permissions: [PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminExams]: {
    path: PRIVATE_NAVIGATION.adminExams,
    permissions: [PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminExamScheduling]: {
    path: PRIVATE_NAVIGATION.adminExamScheduling,
    permissions: [PERMISSIONS.EXAM_SCHEDULE, PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminStrategyRules]: {
    path: PRIVATE_NAVIGATION.adminStrategyRules,
    permissions: [PERMISSIONS.STRATEGY_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminLeaderboard]: {
    path: PRIVATE_NAVIGATION.adminLeaderboard,
    permissions: [PERMISSIONS.RANK_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminHistoricalDatasets]: {
    path: PRIVATE_NAVIGATION.adminHistoricalDatasets,
    permissions: [PERMISSIONS.ANALYSIS_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminControlCenterPage]: {
    path: PRIVATE_NAVIGATION.adminControlCenterPage,
    permissions: [PERMISSIONS.USER_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminApprovalQueuePage]: {
    path: PRIVATE_NAVIGATION.adminApprovalQueuePage,
    permissions: [PERMISSIONS.APPROVAL_VIEW],
    roles: [ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER],
  },
  [PRIVATE_NAVIGATION.adminAuditLogsPage]: {
    path: PRIVATE_NAVIGATION.adminAuditLogsPage,
    permissions: [PERMISSIONS.AUDIT_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminNotificationsPage]: {
    path: PRIVATE_NAVIGATION.adminNotificationsPage,
    permissions: [PERMISSIONS.NOTIFICATION_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminProfile]: {
    path: PRIVATE_NAVIGATION.adminProfile,
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
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
  [PRIVATE_NAVIGATION.staffProfile]: {
    path: PRIVATE_NAVIGATION.staffProfile,
    allowAnyRole: true,
  },
  [PRIVATE_NAVIGATION.superAdminExams]: {
    path: PRIVATE_NAVIGATION.superAdminExams,
    roles: [ROLES.SUPER_ADMIN],
  },

  // General Manager Routes
  [PRIVATE_NAVIGATION.generalManagerDashboard]: {
    path: PRIVATE_NAVIGATION.generalManagerDashboard,
    roles: [ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.generalManagerStudents]: {
    path: PRIVATE_NAVIGATION.generalManagerStudents,
    permissions: [PERMISSIONS.STUDENT_VIEW],
    roles: [ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.generalManagerSchools]: {
    path: PRIVATE_NAVIGATION.generalManagerSchools,
    permissions: [PERMISSIONS.INSTITUTION_VIEW],
    roles: [ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.generalManagerQuestionBank]: {
    path: PRIVATE_NAVIGATION.generalManagerQuestionBank,
    permissions: [PERMISSIONS.QUESTION_VIEW],
    roles: [ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.generalManagerTranslations]: {
    path: PRIVATE_NAVIGATION.generalManagerTranslations,
    permissions: [PERMISSIONS.TRANSLATION_VIEW],
    roles: [ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.generalManagerExams]: {
    path: PRIVATE_NAVIGATION.generalManagerExams,
    permissions: [PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.generalManagerReports]: {
    path: PRIVATE_NAVIGATION.generalManagerReports,
    permissions: [PERMISSIONS.REPORT_VIEW],
    roles: [ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.generalManagerApprovalQueue]: {
    path: PRIVATE_NAVIGATION.generalManagerApprovalQueue,
    permissions: [PERMISSIONS.APPROVAL_VIEW],
    roles: [ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.generalManagerBilling]: {
    path: PRIVATE_NAVIGATION.generalManagerBilling,
    permissions: [PERMISSIONS.BILL_VIEW],
    roles: [ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.generalManagerNotifications]: {
    path: PRIVATE_NAVIGATION.generalManagerNotifications,
    permissions: [PERMISSIONS.NOTIFICATION_VIEW],
    roles: [ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.generalManagerProfile]: {
    path: PRIVATE_NAVIGATION.generalManagerProfile,
    allowAnyRole: true,
  },

  // Manager Routes
  [PRIVATE_NAVIGATION.managerDashboard]: {
    path: PRIVATE_NAVIGATION.managerDashboard,
    roles: [ROLES.MANAGER, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.managerStudents]: {
    path: PRIVATE_NAVIGATION.managerStudents,
    permissions: [PERMISSIONS.STUDENT_VIEW],
    roles: [ROLES.MANAGER, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.managerQuestionBank]: {
    path: PRIVATE_NAVIGATION.managerQuestionBank,
    permissions: [PERMISSIONS.QUESTION_VIEW],
    roles: [ROLES.MANAGER, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.managerExams]: {
    path: PRIVATE_NAVIGATION.managerExams,
    permissions: [PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.MANAGER, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.managerProfile]: {
    path: PRIVATE_NAVIGATION.managerProfile,
    allowAnyRole: true,
  },

  // Operator Routes
  [PRIVATE_NAVIGATION.operatorDashboard]: {
    path: PRIVATE_NAVIGATION.operatorDashboard,
    roles: [ROLES.OPERATOR, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.operatorStudents]: {
    path: PRIVATE_NAVIGATION.operatorStudents,
    permissions: [PERMISSIONS.STUDENT_VIEW],
    roles: [ROLES.OPERATOR, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.operatorBulkStudents]: {
    path: PRIVATE_NAVIGATION.operatorBulkStudents,
    permissions: [PERMISSIONS.STUDENT_VIEW, PERMISSIONS.BULK_UPLOAD],
    roles: [ROLES.OPERATOR, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.operatorSchools]: {
    path: PRIVATE_NAVIGATION.operatorSchools,
    permissions: [PERMISSIONS.INSTITUTION_VIEW, PERMISSIONS.BULK_UPLOAD],
    roles: [ROLES.OPERATOR, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.operatorScheduledExams]: {
    path: PRIVATE_NAVIGATION.operatorScheduledExams,
    permissions: [PERMISSIONS.BULK_UPLOAD, PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.OPERATOR, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.operatorUploadPaper]: {
    path: PRIVATE_NAVIGATION.operatorUploadPaper,
    permissions: [PERMISSIONS.EXAM_CREATE, PERMISSIONS.BULK_UPLOAD],
    roles: [ROLES.OPERATOR, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.operatorAnswerKey]: {
    path: PRIVATE_NAVIGATION.operatorAnswerKey,
    permissions: [PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.OPERATOR, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.operatorExamImportHistory]: {
    path: PRIVATE_NAVIGATION.operatorExamImportHistory,
    permissions: [PERMISSIONS.EXAM_VIEW],
    roles: [ROLES.OPERATOR, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.operatorReports]: {
    path: PRIVATE_NAVIGATION.operatorReports,
    permissions: [PERMISSIONS.REPORT_VIEW],
    roles: [ROLES.OPERATOR, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.operatorNotifications]: {
    path: PRIVATE_NAVIGATION.operatorNotifications,
    permissions: [PERMISSIONS.NOTIFICATION_VIEW],
    roles: [ROLES.OPERATOR, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.operatorProfile]: {
    path: PRIVATE_NAVIGATION.operatorProfile,
    allowAnyRole: true,
  },

  // Accountant Routes
  [PRIVATE_NAVIGATION.accountantDashboard]: {
    path: PRIVATE_NAVIGATION.accountantDashboard,
    roles: [ROLES.ACCOUNTANT, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.accountantBilling]: {
    path: PRIVATE_NAVIGATION.accountantBilling,
    permissions: [PERMISSIONS.BILL_VIEW],
    roles: [ROLES.ACCOUNTANT, ROLES.GENERAL_MANAGER, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.accountantProfile]: {
    path: PRIVATE_NAVIGATION.accountantProfile,
    allowAnyRole: true,
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
  [PRIVATE_NAVIGATION.institutionStudents]: {
    path: PRIVATE_NAVIGATION.institutionStudents,
    permissions: [PERMISSIONS.INSTITUTION_VIEW],
    roles: [ROLES.INSTITUTION_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SALES_AGENT],
  },
  [PRIVATE_NAVIGATION.institutionRankList]: {
    path: PRIVATE_NAVIGATION.institutionRankList,
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
    permissions: [PERMISSIONS.USER_VIEW],
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
  },
  [PRIVATE_NAVIGATION.adminApprovalQueue]: {
    path: PRIVATE_NAVIGATION.adminApprovalQueue,
    permissions: [PERMISSIONS.APPROVAL_VIEW],
    roles: [ROLES.SUPER_ADMIN, ROLES.GENERAL_MANAGER],
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
