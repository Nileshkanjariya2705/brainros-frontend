/**
 * Role-Specific Menu Configuration
 *
 * Instead of one master MENU_GROUPS that gets filtered dynamically,
 * each role has its own curated menu group set with correct role-prefixed paths.
 */
import {
  LayoutDashboard,
  FileText,
  History,
  TrendingUp,
  CalendarDays,
  Database,
  Sliders,
  CalendarClock,
  Trophy,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  Bell,
  BarChart3,
  User,
  Plus,
  FileSpreadsheet,
  UploadCloud,
  Languages,
  BookOpen,
  Award,
  Globe,
  UserPlus,
  UserCheck,
  Activity,
  Receipt,
  UserCog,
  KeyRound,
} from 'lucide-react';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { FEATURES } from '@/constants/feature-flag.constant';
import { PERMISSIONS } from './permission.constants';
import type { MenuGroupConfig } from './menu-config';

// ─── STUDENT Menu Groups ───────────────────────────────────────────────────
export const STUDENT_MENU_GROUPS: MenuGroupConfig[] = [
  {
    categoryKey: 'OVERVIEW',
    categoryLabel: 'Overview',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        to: PRIVATE_NAVIGATION.studentDashboard,
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: 'profile',
        label: 'My Profile',
        to: PRIVATE_NAVIGATION.studentProfile,
        icon: User,
      },
    ],
  },
  {
    categoryKey: 'EXAMS',
    categoryLabel: 'Exams',
    items: [
      {
        key: 'all-exams',
        label: 'All Exams',
        to: PRIVATE_NAVIGATION.studentExams,
        icon: FileText,
      },
      {
        key: 'exam-history',
        label: 'Exam History',
        to: PRIVATE_NAVIGATION.studentHistory,
        icon: History,
      },
      {
        key: 'exam-calendar',
        label: 'Academic Calendar',
        to: PRIVATE_NAVIGATION.studentCalendar,
        icon: CalendarDays,
      },
    ],
  },
  {
    categoryKey: 'MOCK_TESTS',
    categoryLabel: 'Mock Tests',
    items: [
      {
        key: 'all-mock-tests',
        label: 'All Mock Tests',
        to: PRIVATE_NAVIGATION.studentMockTests,
        icon: Award,
      },
      {
        key: 'mock-history',
        label: 'Mock Test History',
        to: PRIVATE_NAVIGATION.studentMockHistory,
        icon: History,
      },
    ],
  },
  {
    categoryKey: 'ANALYTICS',
    categoryLabel: 'Analytics & Intelligence',
    items: [
      {
        key: 'performance-trends',
        label: 'Performance Trends',
        to: PRIVATE_NAVIGATION.studentTrends,
        icon: TrendingUp,
      },
      {
        key: 'mock-comparison',
        label: 'Mock Comparison',
        to: PRIVATE_NAVIGATION.studentComparison,
        icon: BarChart3,
      },
      {
        key: 'leaderboard',
        label: 'Leaderboard',
        to: PRIVATE_NAVIGATION.studentLeaderboard,
        icon: Trophy,
      },
    ],
  },
];

// ─── ADMIN Menu Groups ─────────────────────────────────────────────────────
export const ADMIN_MENU_GROUPS: MenuGroupConfig[] = [
  {
    categoryKey: 'OVERVIEW',
    categoryLabel: 'Overview',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        to: PRIVATE_NAVIGATION.adminDashboard,
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: 'profile',
        label: 'My Profile',
        to: PRIVATE_NAVIGATION.adminProfile,
        icon: User,
      },
    ],
  },
  {
    categoryKey: 'STUDENTS',
    categoryLabel: 'Student Directory',
    items: [
      {
        key: 'all-students',
        label: 'All Students',
        to: PRIVATE_NAVIGATION.adminStudents,
        icon: Users,
      },
       {
        key: 'schools-management',
        label: 'Schools / Colleges',
        to: PRIVATE_NAVIGATION.adminSchools,
        icon: Building2,
      },
      {
        key: 'bulk-register-students',
        label: 'Bulk Register Students',
        to: PRIVATE_NAVIGATION.adminBulkStudents,
        icon: UserPlus,
      },
    ],
  },
  {
    categoryKey: 'QUESTION_STUDIO',
    categoryLabel: 'Question & Content Studio',
    items: [
      {
        key: 'question-bank',
        label: 'Question Bank',
        to: PRIVATE_NAVIGATION.adminQuestionBank,
        icon: Database,
        feature: FEATURES.QUESTION_BANK,
      },
     
      {
        key: 'create-question',
        label: 'Add New Question',
        to: PRIVATE_NAVIGATION.adminCreateQuestion,
        icon: Plus,
        feature: FEATURES.ADD_QUESTION,
      },
      {
        key: 'import-questions',
        label: 'Bulk Import Questions',
        to: PRIVATE_NAVIGATION.adminImportQuestions,
        icon: UploadCloud,
        feature: FEATURES.BULK_IMPORT_QUESTION,
      },
      {
        key: 'import-translations',
        label: 'Bulk Import Translations',
        to: PRIVATE_NAVIGATION.adminImportTranslations,
        icon: Languages,
        feature: FEATURES.BULK_IMPORT_TRANSLATION,
      },
    ],
  },
  {
    categoryKey: 'EXAM_MANAGEMENT',
    categoryLabel: 'Exam Manager (Question Papers)',
    items: [
      {
        key: 'exam-scheduling',
        label: 'Exam Scheduling',
        to: PRIVATE_NAVIGATION.adminExamScheduling,
        icon: CalendarClock,
      },
      {
        key: 'upload-question-paper',
        label: 'Upload Question Paper',
        to: PRIVATE_NAVIGATION.adminUploadPaper,
        icon: UploadCloud,
      },
      {
        key: 'translation-management',
        label: 'Translation Management',
        to: PRIVATE_NAVIGATION.adminTranslations,
        icon: Globe,
      },
      {
        key: 'upload-answer-key',
        label: 'Upload Answer Key',
        to: PRIVATE_NAVIGATION.adminAnswerKey,
        icon: UploadCloud,
      },
      {
        key: 'exam-import-history',
        label: 'Import History',
        to: PRIVATE_NAVIGATION.adminExamImportHistory,
        icon: History,
      },
    ],
  },
  {
    categoryKey: 'EXAM_STUDIO',
    categoryLabel: 'Mock Test Studio',
    items: [
      {
        key: 'exam-blueprints',
        label: 'Blueprint Generator',
        to: PRIVATE_NAVIGATION.adminExamBlueprints,
        icon: Sliders,
      },
      {
        key: 'mock-tests',
        label: 'Mock Test Manager',
        to: PRIVATE_NAVIGATION.adminMockTests,
        icon: FileSpreadsheet,
      },
      {
        key: 'exam-results-publication',
        label: 'Result Publication Center',
        to: PRIVATE_NAVIGATION.adminExamResults,
        icon: Award,
      },
      {
        key: 'completed-live-exams',
        label: 'Completed Live Exam Reports',
        to: PRIVATE_NAVIGATION.adminCompletedExams,
        icon: FileText,
      },
    ],
  },
  
  {
    categoryKey: 'ANALYTICS',
    categoryLabel: 'Analytics & Intelligence',
    items: [
      /*
      {
        key: 'strategy-rules',
        label: 'Strategy Rules',
        to: PRIVATE_NAVIGATION.adminStrategyRules,
        icon: Compass,
      },
      */
     
      /*
      {
        key: 'historical-datasets',
        label: 'Historical Datasets',
        to: PRIVATE_NAVIGATION.adminHistoricalDatasets,
        icon: Sparkles,
      },
      */
    ],
  },
  {
    categoryKey: 'LOCALIZATION',
    categoryLabel: 'Regional Languages & Translations',
    items: [
       {
        key: 'leaderboard',
        label: 'Leaderboard',
        to: PRIVATE_NAVIGATION.adminLeaderboard,
        icon: Trophy,
      },
       {
        key: 'chapter-master',
        label: 'Chapter Master',
        to: PRIVATE_NAVIGATION.adminChapters,
        icon: BookOpen,
      },
      {
        key: 'languages',
        label: 'Language Master',
        to: PRIVATE_NAVIGATION.adminLanguages,
        icon: Languages,
      },
      
      {
        key: 'import-translations',
        label: 'Question Bank Translations',
        to: PRIVATE_NAVIGATION.adminImportTranslations,
        icon: UploadCloud,
        feature: FEATURES.BULK_IMPORT_TRANSLATION,
      },
    ],
  },
];

// ─── SUPER ADMIN Menu Groups ───────────────────────────────────────────────
export const SUPER_ADMIN_MENU_GROUPS: MenuGroupConfig[] = [
  {
    categoryKey: 'CORE_OPERATIONS',
    categoryLabel: 'Core Operations',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        to: PRIVATE_NAVIGATION.superAdminDashboard,
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: 'academic-calendar',
        label: 'Academic Calendar',
        to: PRIVATE_NAVIGATION.superAdminAcademicCalendar,
        icon: CalendarDays,
      },
      {
        key: 'upload-question-paper',
        label: 'Upload Question Paper',
        to: PRIVATE_NAVIGATION.superAdminUploadPaper,
        icon: UploadCloud,
      },
      {
        key: 'upload-answer-key',
        label: 'Upload Answer Key',
        to: PRIVATE_NAVIGATION.superAdminAnswerKey,
        icon: KeyRound,
      },
      {
        key: 'translation-management',
        label: 'Translation Management',
        to: PRIVATE_NAVIGATION.superAdminTranslations,
        icon: Globe,
      },
    ],
  },
  {
    categoryKey: 'REGISTRATIONS_SCHOOLS',
    categoryLabel: 'Registrations & Schools',
    items: [
      {
        key: 'registrations',
        label: 'Registration',
        to: PRIVATE_NAVIGATION.superAdminRegistrations,
        icon: UserCheck,
      },
      {
        key: 'super-admin-schools',
        label: 'Schools / Colleges',
        to: PRIVATE_NAVIGATION.superAdminSchools,
        icon: Building2,
      },
      {
        key: 'bulk-register-students',
        label: 'Bulk Student Registration',
        to: PRIVATE_NAVIGATION.superAdminBulkStudents,
        icon: UserPlus,
      },
    ],
  },
  {
    categoryKey: 'ADMINISTRATION_MASTERS',
    categoryLabel: 'Administration & Masters',
    items: [
      {
        key: 'staff-management',
        label: 'Staff Management',
        to: PRIVATE_NAVIGATION.superAdminStaff,
        icon: UserCog,
      },
      {
        key: 'billing-management',
        label: 'Billing & Approvals',
        to: PRIVATE_NAVIGATION.superAdminBilling,
        icon: Receipt,
      },
      {
        key: 'chapter-master',
        label: 'Chapter Master',
        to: PRIVATE_NAVIGATION.superAdminChapters,
        icon: BookOpen,
      },
      {
        key: 'languages',
        label: 'Language Master',
        to: PRIVATE_NAVIGATION.superAdminLanguages,
        icon: Languages,
      },
    ],
  },
  {
    categoryKey: 'STUDENTS',
    categoryLabel: 'Student Directory',
    items: [
      {
        key: 'all-students',
        label: 'All Students',
        to: PRIVATE_NAVIGATION.superAdminStudents,
        icon: Users,
      },
    ],
  },
  {
    categoryKey: 'QUESTION_STUDIO',
    categoryLabel: 'Question & Content Studio',
    items: [
      {
        key: 'question-bank',
        label: 'Question Bank',
        to: PRIVATE_NAVIGATION.superAdminQuestionBank,
        icon: Database,
        feature: FEATURES.QUESTION_BANK,
      },
      {
        key: 'create-question',
        label: 'Add New Question',
        to: PRIVATE_NAVIGATION.superAdminCreateQuestion,
        icon: Plus,
        feature: FEATURES.ADD_QUESTION,
      },
      {
        key: 'import-questions',
        label: 'Bulk Import Questions',
        to: PRIVATE_NAVIGATION.superAdminImportQuestions,
        icon: UploadCloud,
        feature: FEATURES.BULK_IMPORT_QUESTION,
      },
      {
        key: 'import-translations',
        label: 'Bulk Import Translations',
        to: PRIVATE_NAVIGATION.superAdminImportTranslations,
        icon: Languages,
        feature: FEATURES.BULK_IMPORT_TRANSLATION,
      },
    ],
  },
  {
    categoryKey: 'EXAM_STUDIO',
    categoryLabel: 'Mock Test Studio',
    items: [
      {
        key: 'schedule-exam',
        label: 'Schedule Exam',
        to: PRIVATE_NAVIGATION.superAdminExamScheduling,
        icon: CalendarClock,
      },
      {
        key: 'exam-blueprints',
        label: 'Blueprint Generator',
        to: PRIVATE_NAVIGATION.superAdminExamBlueprints,
        icon: Sliders,
      },
      {
        key: 'mock-tests',
        label: 'Mock Test Manager',
        to: PRIVATE_NAVIGATION.superAdminMockTests,
        icon: FileSpreadsheet,
      },
      {
        key: 'super-admin-exam-results',
        label: 'Result Publication Center',
        to: PRIVATE_NAVIGATION.superAdminExamResults,
        icon: Award,
      },
      {
        key: 'super-admin-result-processing',
        label: 'Exam Result Processing',
        to: PRIVATE_NAVIGATION.superAdminExamResultProcessing,
        icon: Activity,
      },
      {
        key: 'super-admin-completed-live-exams',
        label: 'Completed Live Exam Reports',
        to: PRIVATE_NAVIGATION.superAdminCompletedExams,
        icon: FileText,
      },
    ],
  },
  {
    categoryKey: 'ANALYTICS',
    categoryLabel: 'Analytics & Intelligence',
    items: [
      /*
      {
        key: 'strategy-rules',
        label: 'Strategy Rules',
        to: PRIVATE_NAVIGATION.superAdminStrategyRules,
        icon: Compass,
      },
      */
      {
        key: 'leaderboard',
        label: 'Leaderboard',
        to: PRIVATE_NAVIGATION.superAdminLeaderboard,
        icon: Trophy,
      },
      /*
      {
        key: 'historical-datasets',
        label: 'Historical Datasets',
        to: PRIVATE_NAVIGATION.superAdminHistoricalDatasets,
        icon: Sparkles,
      },
      */
    ],
  },
  {
    categoryKey: 'GOVERNANCE',
    categoryLabel: 'Platform Governance',
    items: [
      {
        key: 'control-center',
        label: 'Admin Control Center',
        to: PRIVATE_NAVIGATION.superAdminControlCenter,
        icon: ShieldAlert,
      },
      {
        key: 'approvals',
        label: 'Approval Queue',
        to: PRIVATE_NAVIGATION.superAdminApprovalQueue,
        icon: CheckCircle2,
      },
      {
        key: 'audit-logs',
        label: 'Security Audit Logs',
        to: PRIVATE_NAVIGATION.superAdminAuditLogs,
        icon: ShieldCheck,
      },
      {
        key: 'notifications',
        label: 'Notification Center',
        to: PRIVATE_NAVIGATION.superAdminNotifications,
        icon: Bell,
      },
    ],
  },
  {
    categoryKey: 'ACCOUNT',
    categoryLabel: 'Account',
    items: [
      {
        key: 'profile',
        label: 'My Profile',
        to: PRIVATE_NAVIGATION.superAdminProfile,
        icon: User,
      },
    ],
  },
];

// ─── GENERAL MANAGER Menu Groups ───────────────────────────────────────────
export const GENERAL_MANAGER_MENU_GROUPS: MenuGroupConfig[] = [
  {
    categoryKey: 'OVERVIEW',
    categoryLabel: 'Overview',
    items: [
      {
        key: 'gm-dashboard',
        label: 'Dashboard',
        to: PRIVATE_NAVIGATION.generalManagerDashboard,
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: 'gm-profile',
        label: 'My Profile',
        to: PRIVATE_NAVIGATION.generalManagerProfile,
        icon: User,
      },
    ],
  },
  {
    categoryKey: 'GOVERNANCE_OPERATIONS',
    categoryLabel: 'Operations & Approvals',
    items: [
      {
        key: 'gm-approvals',
        label: 'Approval Queue',
        to: PRIVATE_NAVIGATION.generalManagerApprovalQueue,
        icon: ShieldCheck,
        permission: PERMISSIONS.APPROVAL_VIEW,
      },
    ],
  },
  {
    categoryKey: 'CONTENT_STUDIO',
    categoryLabel: 'Question & Content Studio',
    items: [
      {
        key: 'gm-exam-scheduling',
        label: 'Exam Scheduling',
        to: PRIVATE_NAVIGATION.generalManagerExamScheduling,
        icon: CalendarClock,
        permission: PERMISSIONS.EXAM_VIEW,
      },
      {
        key: 'gm-upload-paper',
        label: 'Upload Question Paper',
        to: PRIVATE_NAVIGATION.generalManagerUploadPaper,
        icon: UploadCloud,
        permission: PERMISSIONS.EXAM_VIEW,
      },
      {
        key: 'gm-answer-key',
        label: 'Upload Answer Key',
        to: PRIVATE_NAVIGATION.generalManagerAnswerKey,
        icon: KeyRound,
        permission: PERMISSIONS.EXAM_VIEW,
      },
     
      {
        key: 'gm-translations',
        label: 'Translations',
        to: PRIVATE_NAVIGATION.generalManagerTranslations,
        icon: Globe,
        permission: PERMISSIONS.TRANSLATION_VIEW,
      },
      {
        key: 'gm-blueprints',
        label: 'Blueprint Generator',
        to: PRIVATE_NAVIGATION.generalManagerExamBlueprints,
        icon: Sliders,
        permission: PERMISSIONS.EXAM_VIEW,
      },
      {
        key: 'gm-exams',
        label: 'Mock Tests & Exams',
        to: PRIVATE_NAVIGATION.generalManagerExams,
        icon: FileSpreadsheet,
        permission: PERMISSIONS.EXAM_VIEW,
      },
      
      {
        key: 'gm-reports',
        label: 'Exam Reports',
        to: PRIVATE_NAVIGATION.generalManagerCompletedExams,
        icon: FileText,
        permission: PERMISSIONS.REPORT_VIEW,
      },
    ],
  },
  {
    categoryKey: 'DIRECTORY',
    categoryLabel: 'Directory & Centers',
    items: [
      {
        key: 'gm-students',
        label: 'Student Directory',
        to: PRIVATE_NAVIGATION.generalManagerStudents,
        icon: Users,
        permission: PERMISSIONS.STUDENT_VIEW,
      },
      {
        key: 'gm-schools',
        label: 'Schools & Centers',
        to: PRIVATE_NAVIGATION.generalManagerSchools,
        icon: Building2,
        permission: PERMISSIONS.INSTITUTION_VIEW,
      },
      {
        key: 'gm-billing',
        label: 'Bills & Invoices',
        to: PRIVATE_NAVIGATION.generalManagerBilling,
        icon: Receipt,
        permission: PERMISSIONS.BILL_VIEW,
      },
    ],
  },
  {
    categoryKey: 'ANALYTICS',
    categoryLabel: 'Analytics & Intelligence',
    items: [
      {
        key: 'gm-leaderboard',
        label: 'Leaderboard',
        to: PRIVATE_NAVIGATION.generalManagerLeaderboard,
        icon: Trophy,
        permission: PERMISSIONS.RANK_VIEW,
      },
    ],
  },
];

// ─── MANAGER Menu Groups (Mapped to Admin) ──────────────────────────────────
export const MANAGER_MENU_GROUPS: MenuGroupConfig[] = ADMIN_MENU_GROUPS;

// ─── OPERATOR Menu Groups ───────────────────────────────────────────────────
export const OPERATOR_MENU_GROUPS: MenuGroupConfig[] = [
  {
    categoryKey: 'OVERVIEW',
    categoryLabel: 'Overview',
    items: [
      {
        key: 'operator-dashboard',
        label: 'Dashboard',
        to: PRIVATE_NAVIGATION.operatorDashboard,
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: 'operator-profile',
        label: 'My Profile',
        to: PRIVATE_NAVIGATION.operatorProfile,
        icon: User,
      },
    ],
  },
  {
    categoryKey: 'GOVERNANCE_OPERATIONS',
    categoryLabel: 'Operations & Approvals',
    items: [
      {
        key: 'operator-approvals',
        label: 'Approval Queue',
        to: PRIVATE_NAVIGATION.operatorApprovalQueue,
        icon: ShieldCheck,
        permission: PERMISSIONS.APPROVAL_VIEW,
      },
    ],
  },
  {
    categoryKey: 'CONTENT_STUDIO',
    categoryLabel: 'Question & Content Studio',
    items: [
      {
        key: 'operator-exam-scheduling',
        label: 'Exam Scheduling',
        to: PRIVATE_NAVIGATION.operatorExamScheduling,
        icon: CalendarClock,
        permission: PERMISSIONS.EXAM_VIEW,
      },
      {
        key: 'operator-upload-paper',
        label: 'Upload Question Paper',
        to: PRIVATE_NAVIGATION.operatorUploadPaper,
        icon: UploadCloud,
        permission: PERMISSIONS.EXAM_VIEW,
      },
      {
        key: 'operator-answer-key',
        label: 'Upload Answer Key',
        to: PRIVATE_NAVIGATION.operatorAnswerKey,
        icon: KeyRound,
        permission: PERMISSIONS.EXAM_VIEW,
      },
      {
        key: 'operator-translations',
        label: 'Translations',
        to: PRIVATE_NAVIGATION.operatorTranslations,
        icon: Globe,
        permission: PERMISSIONS.TRANSLATION_VIEW,
      },
      {
        key: 'operator-blueprints',
        label: 'Blueprint Generator',
        to: PRIVATE_NAVIGATION.operatorExamBlueprints,
        icon: Sliders,
        permission: PERMISSIONS.EXAM_VIEW,
      },
      {
        key: 'operator-exams',
        label: 'Mock Tests & Exams',
        to: PRIVATE_NAVIGATION.operatorExams,
        icon: FileSpreadsheet,
        permission: PERMISSIONS.EXAM_VIEW,
      },
      {
        key: 'operator-reports',
        label: 'Exam Reports',
        to: PRIVATE_NAVIGATION.operatorCompletedExams,
        icon: FileText,
        permission: PERMISSIONS.REPORT_VIEW,
      },
    ],
  },
  {
    categoryKey: 'DIRECTORY',
    categoryLabel: 'Directory & Centers',
    items: [
      {
        key: 'operator-students',
        label: 'Student Directory',
        to: PRIVATE_NAVIGATION.operatorStudents,
        icon: Users,
        permission: PERMISSIONS.STUDENT_VIEW,
      },
      {
        key: 'operator-schools',
        label: 'Schools & Centers',
        to: PRIVATE_NAVIGATION.operatorSchools,
        icon: Building2,
        permission: PERMISSIONS.INSTITUTION_VIEW,
      },
      {
        key: 'operator-billing',
        label: 'Bills & Invoices',
        to: PRIVATE_NAVIGATION.operatorBilling,
        icon: Receipt,
        permission: PERMISSIONS.BILL_VIEW,
      },
    ],
  },
  {
    categoryKey: 'ANALYTICS',
    categoryLabel: 'Analytics & Intelligence',
    items: [
      {
        key: 'operator-leaderboard',
        label: 'Leaderboard',
        to: PRIVATE_NAVIGATION.operatorLeaderboard,
        icon: Trophy,
        permission: PERMISSIONS.RANK_VIEW,
      },
    ],
  },
];

// ─── ACCOUNTANT Menu Groups ────────────────────────────────────────────────
export const ACCOUNTANT_MENU_GROUPS: MenuGroupConfig[] = [
  {
    categoryKey: 'OVERVIEW',
    categoryLabel: 'Overview',
    items: [
      {
        key: 'accountant-dashboard',
        label: 'Dashboard',
        to: PRIVATE_NAVIGATION.accountantDashboard,
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: 'accountant-profile',
        label: 'My Profile',
        to: PRIVATE_NAVIGATION.accountantProfile,
        icon: User,
      },
    ],
  },
  {
    categoryKey: 'FINANCE',
    categoryLabel: 'Financial Operations',
    items: [
      {
        key: 'accountant-billing',
        label: 'Bills & Invoices',
        to: PRIVATE_NAVIGATION.accountantBilling,
        icon: Receipt,
        permission: PERMISSIONS.BILL_VIEW,
      },
      {
        key: 'accountant-reports',
        label: 'Financial Reports',
        to: PRIVATE_NAVIGATION.accountantReports,
        icon: FileText,
        permission: PERMISSIONS.REPORT_VIEW,
      },
      {
        key: 'accountant-notifications',
        label: 'Notification Center',
        to: PRIVATE_NAVIGATION.accountantNotifications,
        icon: Bell,
        permission: PERMISSIONS.NOTIFICATION_VIEW,
      },
    ],
  },
];

// ─── SALES AGENT Menu Groups ───────────────────────────────────────────────
export const SALES_AGENT_MENU_GROUPS: MenuGroupConfig[] = [
  {
    categoryKey: 'OVERVIEW',
    categoryLabel: 'Overview',
    items: [
      {
        key: 'sales-dashboard',
        label: 'Dashboard',
        to: PRIVATE_NAVIGATION.salesAgentDashboard,
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: 'sales-profile',
        label: 'My Profile',
        to: PRIVATE_NAVIGATION.salesAgentProfile,
        icon: User,
      },
    ],
  },
  {
    categoryKey: 'INSTITUTION_SALES',
    categoryLabel: 'Institutional Sales',
    items: [
      {
        key: 'sales-schools',
        label: 'Schools & Colleges',
        to: PRIVATE_NAVIGATION.salesAgentSchools,
        icon: Building2,
        permission: PERMISSIONS.INSTITUTION_VIEW,
      },
      {
        key: 'sales-reports',
        label: 'Sales Reports',
        to: PRIVATE_NAVIGATION.salesAgentReports,
        icon: BarChart3,
        permission: PERMISSIONS.REPORT_VIEW,
      },
      {
        key: 'sales-notifications',
        label: 'Notification Center',
        to: PRIVATE_NAVIGATION.salesAgentNotifications,
        icon: Bell,
        permission: PERMISSIONS.NOTIFICATION_VIEW,
      },
    ],
  },
];

// ─── STAFF Menu Groups ─────────────────────────────────────────────────────
export const STAFF_MENU_GROUPS: MenuGroupConfig[] = [
  {
    categoryKey: 'OVERVIEW',
    categoryLabel: 'Overview',
    items: [
      {
        key: 'staff-dashboard',
        label: 'Staff Dashboard',
        to: PRIVATE_NAVIGATION.staffDashboard,
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: 'staff-profile',
        label: 'My Profile',
        to: PRIVATE_NAVIGATION.staffProfile,
        icon: User,
      },
    ],
  },
  {
    categoryKey: 'FINANCE',
    categoryLabel: 'Billing & Accounting',
    items: [
      {
        key: 'staff-billing',
        label: 'Bills & Invoices',
        to: PRIVATE_NAVIGATION.staffBilling,
        icon: Receipt,
        permission: PERMISSIONS.BILL_VIEW,
      },
    ],
  },
  {
    categoryKey: 'BULK_OPERATIONS',
    categoryLabel: 'Bulk Operations',
    items: [
      {
        key: 'staff-schools-bulk',
        label: 'Schools & Centers Upload',
        to: PRIVATE_NAVIGATION.staffSchools,
        icon: Building2,
        permission: PERMISSIONS.BULK_UPLOAD,
      },
      {
        key: 'staff-bulk-students',
        label: 'Bulk Student Registration',
        to: PRIVATE_NAVIGATION.staffBulkStudents,
        icon: UserPlus,
        permission: PERMISSIONS.BULK_UPLOAD,
      },
      {
        key: 'staff-pending-paper',
        label: 'Upload Exam Papers',
        to: PRIVATE_NAVIGATION.staffScheduledExams,
        icon: FileSpreadsheet,
        permission: PERMISSIONS.BULK_UPLOAD,
      },
      {
        key: 'staff-answer-key',
        label: 'Answer Key Upload',
        to: PRIVATE_NAVIGATION.staffAnswerKey,
        icon: KeyRound,
        permission: PERMISSIONS.BULK_UPLOAD,
      },
    ],
  },
  {
    categoryKey: 'OPERATIONS',
    categoryLabel: 'Operations Management',
    items: [
      {
        key: 'staff-approvals',
        label: 'Approval Queue',
        to: PRIVATE_NAVIGATION.staffApprovalQueue,
        icon: ShieldCheck,
        permission: PERMISSIONS.APPROVAL_VIEW,
      },
      {
        key: 'staff-schools',
        label: 'Schools & Centers',
        to: PRIVATE_NAVIGATION.staffSchools,
        icon: Building2,
        permission: PERMISSIONS.INSTITUTION_VIEW,
      },
      {
        key: 'staff-students',
        label: 'Student Directory',
        to: PRIVATE_NAVIGATION.staffStudents,
        icon: Users,
        permission: PERMISSIONS.STUDENT_VIEW,
      },
      {
        key: 'staff-questions',
        label: 'Question Bank',
        to: PRIVATE_NAVIGATION.staffQuestionBank,
        icon: Database,
        permission: PERMISSIONS.QUESTION_VIEW,
      },
      {
        key: 'staff-translations',
        label: 'Translations',
        to: PRIVATE_NAVIGATION.staffTranslations,
        icon: Globe,
        permission: PERMISSIONS.TRANSLATION_VIEW,
      },
      {
        key: 'staff-exams',
        label: 'Mock Tests & Exams',
        to: PRIVATE_NAVIGATION.staffExams,
        icon: FileSpreadsheet,
        permission: PERMISSIONS.EXAM_VIEW,
      },
      {
        key: 'staff-reports',
        label: 'Exam Reports',
        to: PRIVATE_NAVIGATION.staffReports,
        icon: FileText,
        permission: PERMISSIONS.REPORT_VIEW,
      },
      {
        key: 'staff-notifications',
        label: 'Notification Center',
        to: PRIVATE_NAVIGATION.staffNotifications,
        icon: Bell,
        permission: PERMISSIONS.NOTIFICATION_VIEW,
      },
    ],
  },
];

// ─── PARENT Menu Groups ────────────────────────────────────────────────────
export const PARENT_MENU_GROUPS: MenuGroupConfig[] = [
  {
    categoryKey: 'OVERVIEW',
    categoryLabel: 'Ward Overview',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        to: PRIVATE_NAVIGATION.parentDashboardHome,
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: 'ward-progress',
        label: 'Ward Progress',
        to: PRIVATE_NAVIGATION.parentWardProgress,
        icon: TrendingUp,
      },
      {
        key: 'profile',
        label: 'My Profile',
        to: PRIVATE_NAVIGATION.parentProfile,
        icon: User,
      },
    ],
  },
];

// ─── INSTITUTION & B2B PORTAL Menu Groups ──────────────────────────────────
export const INSTITUTION_MENU_GROUPS: MenuGroupConfig[] = [
  {
    categoryKey: 'OVERVIEW',
    categoryLabel: 'Overview',
    items: [
      {
        key: 'dashboard',
        label: 'Institution Dashboard',
        to: PRIVATE_NAVIGATION.institutionDashboard,
        icon: Building2,
        end: true,
      },
      {
        key: 'profile',
        label: 'Institution Profile',
        to: PRIVATE_NAVIGATION.institutionProfile,
        icon: User,
      },
    ],
  },
  {
    categoryKey: 'BATCH_STUDENT_MGMT',
    categoryLabel: 'Batches & Candidate Management',
    items: [
      {
        key: 'batches',
        label: 'Batch Management',
        to: PRIVATE_NAVIGATION.institutionBatches,
        icon: Users,
      },
      {
        key: 'students',
        label: 'Student Directory',
        to: PRIVATE_NAVIGATION.institutionStudents,
        icon: UserCheck,
      },
      {
        key: 'rankList',
        label: 'Institute Rank List',
        to: PRIVATE_NAVIGATION.institutionRankList,
        icon: Trophy,
      },
    ],
  },
  {
    categoryKey: 'ANALYTICS_REPORTS',
    categoryLabel: 'Analytics & Reporting',
    items: [
      
      // {
      //   key: 'reports',
      //   label: 'Institutional Reports',
      //   to: PRIVATE_NAVIGATION.institutionReports,
      //   icon: BarChart3,
      // },
    ],
  },
];

