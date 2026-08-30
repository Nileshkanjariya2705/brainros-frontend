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
  Globe2,
  Compass,
  Trophy,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle2,
  Bell,
  BarChart3,
  User,
  FileCheck,
  Plus,
  FileSpreadsheet,
} from 'lucide-react';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
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
    categoryKey: 'EXAM_PORTAL',
    categoryLabel: 'Examination Portal',
    items: [
      {
        key: 'available-exams',
        label: 'Available Exams',
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
    categoryKey: 'QUESTION_STUDIO',
    categoryLabel: 'Question & Content Studio',
    items: [
      {
        key: 'question-bank',
        label: 'Question Bank',
        to: PRIVATE_NAVIGATION.adminQuestionBank,
        icon: Database,
      },
      {
        key: 'create-question',
        label: 'Add New Question',
        to: PRIVATE_NAVIGATION.adminCreateQuestion,
        icon: Plus,
      },
      {
        key: 'regional-languages',
        label: 'Regional Languages',
        to: PRIVATE_NAVIGATION.adminLanguages,
        icon: Globe2,
      },
    ],
  },
  {
    categoryKey: 'EXAM_STUDIO',
    categoryLabel: 'Exam Blueprint & Scheduling',
    items: [
      {
        key: 'exam-blueprints',
        label: 'Blueprint Generator',
        to: PRIVATE_NAVIGATION.adminExamBlueprints,
        icon: Sliders,
      },
      {
        key: 'exams',
        label: 'Exam Manager',
        to: PRIVATE_NAVIGATION.adminExams,
        icon: FileSpreadsheet,
      },
      {
        key: 'exam-scheduling',
        label: 'Exam Scheduling',
        to: PRIVATE_NAVIGATION.adminExamScheduling,
        icon: CalendarClock,
      },
    ],
  },
  {
    categoryKey: 'ANALYTICS',
    categoryLabel: 'Analytics & Intelligence',
    items: [
      {
        key: 'strategy-rules',
        label: 'Strategy Rules',
        to: PRIVATE_NAVIGATION.adminStrategyRules,
        icon: Compass,
      },
      {
        key: 'leaderboard',
        label: 'Leaderboard',
        to: PRIVATE_NAVIGATION.adminLeaderboard,
        icon: Trophy,
      },
      {
        key: 'historical-datasets',
        label: 'Historical Datasets',
        to: PRIVATE_NAVIGATION.adminHistoricalDatasets,
        icon: Sparkles,
      },
    ],
  },
  {
    categoryKey: 'GOVERNANCE',
    categoryLabel: 'Administration & Governance',
    items: [
      {
        key: 'control-center',
        label: 'Admin Control Center',
        to: PRIVATE_NAVIGATION.adminControlCenterPage,
        icon: ShieldAlert,
      },
      {
        key: 'approvals',
        label: 'Approval Queue',
        to: PRIVATE_NAVIGATION.adminApprovalQueuePage,
        icon: CheckCircle2,
      },
      {
        key: 'audit-logs',
        label: 'Security Audit Logs',
        to: PRIVATE_NAVIGATION.adminAuditLogsPage,
        icon: ShieldCheck,
      },
      {
        key: 'notifications',
        label: 'Notification Center',
        to: PRIVATE_NAVIGATION.adminNotificationsPage,
        icon: Bell,
      },
    ],
  },
];

// ─── SUPER ADMIN Menu Groups ───────────────────────────────────────────────
export const SUPER_ADMIN_MENU_GROUPS: MenuGroupConfig[] = [
  {
    categoryKey: 'OVERVIEW',
    categoryLabel: 'Executive Overview',
    items: [
      {
        key: 'dashboard',
        label: 'Command Center',
        to: PRIVATE_NAVIGATION.superAdminDashboard,
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: 'profile',
        label: 'My Profile',
        to: PRIVATE_NAVIGATION.superAdminProfile,
        icon: User,
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
      },
      {
        key: 'create-question',
        label: 'Add New Question',
        to: PRIVATE_NAVIGATION.superAdminCreateQuestion,
        icon: Plus,
      },
      {
        key: 'regional-languages',
        label: 'Regional Languages',
        to: PRIVATE_NAVIGATION.superAdminLanguages,
        icon: Globe2,
      },
    ],
  },
  {
    categoryKey: 'EXAM_STUDIO',
    categoryLabel: 'Exam Blueprint & Scheduling',
    items: [
      {
        key: 'exam-blueprints',
        label: 'Blueprint Generator',
        to: PRIVATE_NAVIGATION.superAdminExamBlueprints,
        icon: Sliders,
      },
      {
        key: 'exams',
        label: 'Exam Manager',
        to: PRIVATE_NAVIGATION.superAdminExams,
        icon: FileSpreadsheet,
      },
      {
        key: 'exam-scheduling',
        label: 'Exam Scheduling',
        to: PRIVATE_NAVIGATION.superAdminExamScheduling,
        icon: CalendarClock,
      },
    ],
  },
  {
    categoryKey: 'ANALYTICS',
    categoryLabel: 'Analytics & Intelligence',
    items: [
      {
        key: 'strategy-rules',
        label: 'Strategy Rules',
        to: PRIVATE_NAVIGATION.superAdminStrategyRules,
        icon: Compass,
      },
      {
        key: 'leaderboard',
        label: 'Leaderboard',
        to: PRIVATE_NAVIGATION.superAdminLeaderboard,
        icon: Trophy,
      },
      {
        key: 'historical-datasets',
        label: 'Historical Datasets',
        to: PRIVATE_NAVIGATION.superAdminHistoricalDatasets,
        icon: Sparkles,
      },
    ],
  },
  {
    categoryKey: 'INSTITUTION_B2B',
    categoryLabel: 'Institution & B2B Portal',
    items: [
      {
        key: 'institution-dashboard',
        label: 'Institution Overview',
        to: PRIVATE_NAVIGATION.superAdminInstitutionDashboard,
        icon: Building2,
      },
      {
        key: 'institution-batches',
        label: 'Batch Management',
        to: PRIVATE_NAVIGATION.superAdminInstitutionBatches,
        icon: Users,
      },
      {
        key: 'institution-bulk-upload',
        label: 'Student Bulk Upload',
        to: PRIVATE_NAVIGATION.superAdminInstitutionBulkUpload,
        icon: FileCheck,
      },
      {
        key: 'institution-reports',
        label: 'Institutional Reports',
        to: PRIVATE_NAVIGATION.superAdminInstitutionReports,
        icon: BarChart3,
      },
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
