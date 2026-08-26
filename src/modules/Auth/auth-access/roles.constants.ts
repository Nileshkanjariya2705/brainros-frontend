/**
 * Centralized Role Constants
 * Stable system role codes. Never use display labels for authorization logic.
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  INSTITUTION_ADMIN: 'INSTITUTION_ADMIN',
  SALES_AGENT: 'SALES_AGENT',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
  ACCOUNTANT: 'ACCOUNTANT',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES] | string;

/**
 * Role hierarchy for deterministic default landing dashboard selection:
 * SUPER_ADMIN > ADMIN > INSTITUTION_ADMIN > SALES_AGENT > PARENT > STUDENT
 */
export const ROLE_HIERARCHY: RoleType[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.INSTITUTION_ADMIN,
  ROLES.SALES_AGENT,
  ROLES.ACCOUNTANT,
  ROLES.PARENT,
  ROLES.STUDENT,
];

export const ROLE_LABELS: Record<
  string,
  { label: string; badgeColor: string; description: string }
> = {
  [ROLES.SUPER_ADMIN]: {
    label: 'Super Admin',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    description: 'Full platform administration & governance',
  },
  [ROLES.ADMIN]: {
    label: 'Admin',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Operational & content management',
  },
  [ROLES.INSTITUTION_ADMIN]: {
    label: 'Institution Admin',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Institution & batch performance management',
  },
  [ROLES.SALES_AGENT]: {
    label: 'Sales Agent',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Institutional onboarding & sales pipeline',
  },
  [ROLES.ACCOUNTANT]: {
    label: 'Accountant',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Financial reporting & revenue analytics',
  },
  [ROLES.PARENT]: {
    label: 'Parent',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    description: 'Linked student performance monitoring',
  },
  [ROLES.STUDENT]: {
    label: 'Student',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Exam attempt portal & analytics',
  },
};
