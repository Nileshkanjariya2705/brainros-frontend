/**
 * Centralized Role Constants
 * Stable system role codes. Never use display labels for authorization logic.
 */
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  GENERAL_MANAGER: 'GENERAL_MANAGER',
  MANAGER: 'MANAGER',
  OPERATOR: 'OPERATOR',
  ACCOUNTANT: 'ACCOUNTANT',
  INSTITUTION_ADMIN: 'INSTITUTION_ADMIN',
  SALES_AGENT: 'SALES_AGENT',
  STUDENT: 'STUDENT',
  PARENT: 'PARENT',
} as const;

export type RoleType = (typeof ROLES)[keyof typeof ROLES] | string;

/**
 * Role hierarchy for deterministic default landing dashboard selection:
 * SUPER_ADMIN > ADMIN > GENERAL_MANAGER > MANAGER > OPERATOR > ACCOUNTANT > INSTITUTION_ADMIN > SALES_AGENT > PARENT > STUDENT
 */
export const ROLE_HIERARCHY: RoleType[] = [
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
  ROLES.GENERAL_MANAGER,
  ROLES.MANAGER,
  ROLES.OPERATOR,
  ROLES.ACCOUNTANT,
  ROLES.INSTITUTION_ADMIN,
  ROLES.SALES_AGENT,
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
  [ROLES.GENERAL_MANAGER]: {
    label: 'General Manager',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    description: 'Executive management and operational oversight',
  },
  [ROLES.MANAGER]: {
    label: 'Manager',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Operational workflows & institution management',
  },
  [ROLES.OPERATOR]: {
    label: 'Operator',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    description: 'Content entry, exams & student operations',
  },
  [ROLES.ACCOUNTANT]: {
    label: 'Accountant',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Financial reporting, institutional billing & invoices',
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
