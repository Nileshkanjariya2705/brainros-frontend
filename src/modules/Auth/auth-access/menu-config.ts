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
} from 'lucide-react';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { type FeatureKey } from '@/constants/feature-flag.constant';
import { PERMISSIONS, type PermissionCode } from './permission.constants';
import { ROLES, type RoleType } from './roles.constants';
import {
  hasPermission,
  hasAnyPermission,
  hasAnyRole,
  type UserAuthContext,
} from './access-control';

export interface MenuItemConfig {
  key: string;
  label: string;
  to: string;
  icon: any;
  end?: boolean;
  feature?: FeatureKey;
  permission?: PermissionCode;
  permissions?: PermissionCode[];
  roles?: RoleType[];
  badge?: string;
  badgeColor?: string;
  children?: MenuItemConfig[];
}

export interface MenuGroupConfig {
  categoryKey: string;
  categoryLabel: string;
  roles?: RoleType[];
  permissions?: PermissionCode[];
  items: MenuItemConfig[];
}

/**
 * Master Centralized Navigation Menu Configuration
 * Filtered dynamically at runtime based on the authenticated user's permissions and active roles.
 */
export const MENU_GROUPS: MenuGroupConfig[] = [
  {
    categoryKey: 'DASHBOARD',
    categoryLabel: 'Overview',
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        to: PRIVATE_NAVIGATION.dashboard,
        icon: LayoutDashboard,
        end: true,
      },
      {
        key: 'profile',
        label: 'My Profile',
        to: PRIVATE_NAVIGATION.profile,
        icon: User,
      },
    ],
  },

  {
    categoryKey: 'STUDENT_EXAMS',
    categoryLabel: 'Examination Portal',
    roles: [ROLES.STUDENT],
    items: [
      {
        key: 'available-exams',
        label: 'Available Exams',
        to: PRIVATE_NAVIGATION.availableExams,
        icon: FileText,
        permissions: [PERMISSIONS.EXAM_VIEW, PERMISSIONS.EXAM_ATTEMPT],
      },
      {
        key: 'exam-history',
        label: 'Exam History',
        to: PRIVATE_NAVIGATION.myHistory,
        icon: History,
        permissions: [PERMISSIONS.ATTEMPT_VIEW, PERMISSIONS.RESULT_VIEW],
      },
      {
        key: 'exam-calendar',
        label: 'Academic Calendar',
        to: PRIVATE_NAVIGATION.academicCalendar,
        icon: CalendarDays,
        permissions: [PERMISSIONS.EXAM_VIEW],
      },
    ],
  },

  {
    categoryKey: 'QUESTION_STUDIO',
    categoryLabel: 'Question & Content Studio',
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    items: [
      {
        key: 'question-bank',
        label: 'Question Bank',
        to: PRIVATE_NAVIGATION.questionBank,
        icon: Database,
        permissions: [PERMISSIONS.QUESTION_VIEW],
      },
      {
        key: 'regional-languages',
        label: 'Regional Languages',
        to: PRIVATE_NAVIGATION.languages,
        icon: Globe2,
        permissions: [PERMISSIONS.TRANSLATION_VIEW],
      },
    ],
  },

  {
    categoryKey: 'EXAM_STUDIO',
    categoryLabel: 'Exam Blueprint & Scheduling',
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    items: [
      {
        key: 'exam-blueprints',
        label: 'Exam Generator',
        to: PRIVATE_NAVIGATION.examBlueprints,
        icon: Sliders,
        permissions: [PERMISSIONS.EXAM_CREATE, PERMISSIONS.EXAM_VIEW],
      },
      {
        key: 'exam-scheduling',
        label: 'Exam Scheduling',
        to: PRIVATE_NAVIGATION.examScheduling,
        icon: CalendarClock,
        permissions: [PERMISSIONS.EXAM_SCHEDULE, PERMISSIONS.EXAM_VIEW],
      },
    ],
  },

  {
    categoryKey: 'ANALYTICS_INTELLIGENCE',
    categoryLabel: 'Analytics & Intelligence',
    items: [
      {
        key: 'performance-trends',
        label: 'Performance Trends',
        to: PRIVATE_NAVIGATION.performanceTrends,
        icon: TrendingUp,
        permissions: [PERMISSIONS.ANALYSIS_VIEW, PERMISSIONS.TRENDS_VIEW],
      },
      {
        key: 'strategy-rules',
        label: 'Strategy Rules',
        to: PRIVATE_NAVIGATION.strategyRules,
        icon: Compass,
        permissions: [PERMISSIONS.STRATEGY_VIEW],
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
      {
        key: 'leaderboard',
        label: 'Leaderboard',
        to: PRIVATE_NAVIGATION.leaderboard,
        icon: Trophy,
        permissions: [PERMISSIONS.RANK_VIEW],
      },
      {
        key: 'historical-datasets',
        label: 'Historical Datasets',
        to: PRIVATE_NAVIGATION.historicalDatasets,
        icon: Sparkles,
        permissions: [PERMISSIONS.ANALYSIS_VIEW],
        roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
      },
    ],
  },

  {
    categoryKey: 'INSTITUTION_B2B',
    categoryLabel: 'Institution & B2B Portal',
    roles: [ROLES.INSTITUTION_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.SALES_AGENT],
    items: [
      {
        key: 'institution-dashboard',
        label: 'Institution Overview',
        to: PRIVATE_NAVIGATION.institutionDashboard,
        icon: Building2,
        permissions: [PERMISSIONS.INSTITUTION_VIEW],
      },
      {
        key: 'institution-batches',
        label: 'Batch Management',
        to: PRIVATE_NAVIGATION.institutionBatches,
        icon: Users,
        permissions: [PERMISSIONS.BATCH_MANAGE, PERMISSIONS.INSTITUTION_VIEW],
      },
      {
        key: 'institution-bulk-upload',
        label: 'Student Bulk Upload',
        to: PRIVATE_NAVIGATION.institutionBulkUpload,
        icon: FileCheck,
        permissions: [PERMISSIONS.BULK_UPLOAD, PERMISSIONS.INSTITUTION_MANAGE],
      },
      {
        key: 'institution-reports',
        label: 'Institutional Reports',
        to: PRIVATE_NAVIGATION.institutionReports,
        icon: BarChart3,
        permissions: [PERMISSIONS.REPORT_VIEW],
      },
    ],
  },

  {
    categoryKey: 'PARENT_PORTAL',
    categoryLabel: 'Parent & Ward Portal',
    roles: [ROLES.PARENT, ROLES.ADMIN, ROLES.SUPER_ADMIN],
    items: [
      {
        key: 'parent-dashboard',
        label: 'Parent Dashboard',
        to: PRIVATE_NAVIGATION.parentDashboard,
        icon: ShieldCheck,
        permissions: [PERMISSIONS.PARENT_VIEW, PERMISSIONS.STUDENT_VIEW],
      },
    ],
  },

  {
    categoryKey: 'PLATFORM_GOVERNANCE',
    categoryLabel: 'Administration & Governance',
    roles: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    items: [
      {
        key: 'admin-control-center',
        label: 'Admin Control Center',
        to: PRIVATE_NAVIGATION.adminControlCenter,
        icon: ShieldAlert,
        permissions: [PERMISSIONS.APPROVAL_VIEW, PERMISSIONS.USER_VIEW],
      },
      {
        key: 'admin-approvals',
        label: 'Approval Queue',
        to: PRIVATE_NAVIGATION.adminApprovalQueue,
        icon: CheckCircle2,
        permissions: [PERMISSIONS.APPROVAL_VIEW],
      },
      {
        key: 'admin-audit-logs',
        label: 'Security Audit Logs',
        to: PRIVATE_NAVIGATION.adminAuditLogs,
        icon: ShieldCheck,
        permissions: [PERMISSIONS.AUDIT_VIEW],
      },
      {
        key: 'admin-notifications',
        label: 'Notification Center',
        to: PRIVATE_NAVIGATION.adminNotifications,
        icon: Bell,
        permissions: [PERMISSIONS.NOTIFICATION_VIEW],
      },
    ],
  },
];

/**
 * Filters menu groups and items based on the user's active permissions and roles.
 * Empty groups are automatically excluded.
 */
export const filterAccessibleMenuGroups = (
  userContext: UserAuthContext | null | undefined,
): MenuGroupConfig[] => {
  if (!userContext) return [];

  return MENU_GROUPS.map((group) => {
    // 1. Group level role check
    if (group.roles && group.roles.length > 0 && !hasAnyRole(userContext, group.roles)) {
      return null;
    }

    // 2. Group level permission check
    if (
      group.permissions &&
      group.permissions.length > 0 &&
      !hasAnyPermission(userContext, group.permissions)
    ) {
      return null;
    }

    // 3. Filter group items
    const accessibleItems = group.items.filter((item) => {
      // Check item role constraints
      if (item.roles && item.roles.length > 0 && !hasAnyRole(userContext, item.roles)) {
        return false;
      }

      // Check item permission constraints
      if (item.permission && !hasPermission(userContext, item.permission)) {
        return false;
      }

      if (
        item.permissions &&
        item.permissions.length > 0 &&
        !hasAnyPermission(userContext, item.permissions)
      ) {
        return false;
      }

      return true;
    });

    if (accessibleItems.length === 0) {
      return null;
    }

    return {
      ...group,
      items: accessibleItems,
    };
  }).filter(Boolean) as MenuGroupConfig[];
};
