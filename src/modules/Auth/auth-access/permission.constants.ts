/**
 * Centralized Module & Permission Registries
 * Frontend visibility is a UX layer — Backend authorization is the final source of truth.
 */

export const MODULES = {
  DASHBOARD: 'dashboard',
  USERS: 'users',
  STUDENTS: 'students',
  PARENTS: 'parents',

  QUESTION_BANK: 'question-bank',
  QUESTIONS: 'questions',
  TRANSLATIONS: 'translations',

  EXAMS: 'exams',
  EXAM_CONFIGURATION: 'exam-configuration',
  EXAM_GENERATOR: 'exam-generator',
  EXAM_SCHEDULING: 'exam-scheduling',
  EXAM_CALENDAR: 'exam-calendar',
  EXAM_ACTIVATION: 'exam-activation',

  ATTEMPTS: 'attempts',
  EVALUATION: 'evaluation',

  ANALYSIS: 'analysis',
  TIME_ANALYSIS: 'time-analysis',
  ATTEMPT_STRATEGY: 'attempt-strategy',

  RANK: 'rank',
  PREDICTED_RANK: 'predicted-rank',
  MOCK_TRENDS: 'mock-trends',

  INSTITUTIONS: 'institutions',
  BATCHES: 'batches',
  BULK_UPLOADS: 'bulk-uploads',

  SALES: 'sales',
  REVENUE: 'revenue',
  SALES_AGENTS: 'sales-agents',

  REPORTS: 'reports',
  NOTIFICATIONS: 'notifications',
  APPROVALS: 'approvals',
  AUDIT_LOGS: 'audit-logs',

  PROFILE: 'profile',
  SETTINGS: 'settings',
} as const;

export const PERMISSIONS = {
  // User Management
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_ROLE_MANAGE: 'user-role:manage',
  PERMISSION_MANAGE: 'permission:manage',

  // Students & Parents
  STUDENT_VIEW: 'student:view',
  STUDENT_UPDATE: 'student:update',
  PARENT_VIEW: 'parent:view',
  PARENT_LINK_MANAGE: 'parent-link:manage',

  // Questions & Translations
  QUESTION_VIEW: 'question:view',
  QUESTION_CREATE: 'question:create',
  QUESTION_UPDATE: 'question:update',
  QUESTION_DELETE: 'question:delete',
  QUESTION_SUBMIT: 'question:submit',
  QUESTION_APPROVE: 'question:approve',

  TRANSLATION_VIEW: 'translation:view',
  TRANSLATION_CREATE: 'translation:create',
  TRANSLATION_UPDATE: 'translation:update',
  TRANSLATION_APPROVE: 'translation:approve',

  // Exams & Generator
  EXAM_VIEW: 'exam:view',
  EXAM_CREATE: 'exam:create',
  EXAM_UPDATE: 'exam:update',
  EXAM_DELETE: 'exam:delete',
  EXAM_APPROVE: 'exam:approve',
  EXAM_SCHEDULE: 'exam:schedule',
  EXAM_ACTIVATE: 'exam:activate',
  EXAM_DEACTIVATE: 'exam:deactivate',
  EXAM_ATTEMPT: 'exam:attempt',

  // Attempts & Evaluation
  ATTEMPT_VIEW: 'attempt:view',
  RESULT_VIEW: 'result:view',
  RESULT_REVIEW: 'result:review',
  EVALUATION_MANAGE: 'evaluation:manage',

  // Analysis & Intelligence
  ANALYSIS_VIEW: 'analysis:view',
  TIME_ANALYSIS_VIEW: 'time-analysis:view',
  STRATEGY_VIEW: 'strategy:view',
  RANK_VIEW: 'rank:view',
  PREDICTED_RANK_VIEW: 'predicted-rank:view',
  TRENDS_VIEW: 'trends:view',

  // Institutions & Batches
  INSTITUTION_VIEW: 'institution:view',
  INSTITUTION_CREATE: 'institution:create',
  INSTITUTION_MANAGE: 'institution:manage',
  INSTITUTION_APPROVE: 'institution:approve',
  BATCH_MANAGE: 'batch:manage',
  BULK_UPLOAD: 'bulk:upload',

  // Reports
  REPORT_VIEW: 'report:view',
  REPORT_GENERATE: 'report:generate',
  REPORT_EXPORT: 'report:export',

  // Notifications
  NOTIFICATION_VIEW: 'notification:view',
  NOTIFICATION_MANAGE: 'notification:manage',
  TEMPLATE_MANAGE: 'notification-template:manage',

  // Governance & Approvals
  APPROVAL_VIEW: 'approval:view',
  APPROVAL_APPROVE: 'approval:approve',
  APPROVAL_REJECT: 'approval:reject',
  AUDIT_VIEW: 'audit:view',
  SETTINGS_MANAGE: 'settings:manage',

  // Commercial & Sales
  SALES_VIEW: 'sales:view',
  SALES_MANAGE: 'sales:manage',
  REVENUE_VIEW: 'revenue:view',
} as const;

export type PermissionCode = (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | string;
