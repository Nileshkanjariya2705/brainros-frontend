import { ROLES, ROLE_HIERARCHY, type RoleType } from './roles.constants';
import { type PermissionCode } from './permission.constants';
import { computeEffectivePermissions } from './role-permission.config';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

export interface UserAuthContext {
  id?: string;
  roles?: string[];
  permissions?: string[];
  activeRole?: string | null;
  studentProfile?: any;
  institution?: any;
}

/**
 * Returns true if the user context contains the specified permission.
 * Evaluates both explicit permissions and implicit permissions granted by roles.
 */
export const hasPermission = (
  userContext: UserAuthContext | null | undefined,
  permission: PermissionCode,
): boolean => {
  if (!userContext) return false;

  const roles = userContext.roles || [];
  // Super Admin possesses all permissions by definition
  if (roles.includes(ROLES.SUPER_ADMIN)) return true;

  const effectivePermissions = computeEffectivePermissions(roles, userContext.permissions || []);

  return effectivePermissions.includes(permission);
};

/**
 * Returns true if the user context contains ANY of the specified permissions.
 */
export const hasAnyPermission = (
  userContext: UserAuthContext | null | undefined,
  permissions: PermissionCode[],
): boolean => {
  if (!permissions || permissions.length === 0) return true;
  if (!userContext) return false;
  return permissions.some((perm) => hasPermission(userContext, perm));
};

/**
 * Returns true if the user context contains ALL of the specified permissions.
 */
export const hasAllPermissions = (
  userContext: UserAuthContext | null | undefined,
  permissions: PermissionCode[],
): boolean => {
  if (!permissions || permissions.length === 0) return true;
  if (!userContext) return false;
  return permissions.every((perm) => hasPermission(userContext, perm));
};

/**
 * Returns true if the user has the specified role.
 */
export const hasRole = (
  userContext: UserAuthContext | null | undefined,
  role: RoleType,
): boolean => {
  if (!userContext || !userContext.roles) return false;
  return userContext.roles.includes(role);
};

/**
 * Returns true if the user has ANY of the specified roles.
 */
export const hasAnyRole = (
  userContext: UserAuthContext | null | undefined,
  roles: RoleType[],
): boolean => {
  if (!roles || roles.length === 0) return true;
  if (!userContext || !userContext.roles) return false;
  return roles.some((r) => userContext.roles!.includes(r));
};

/**
 * Determines the highest priority role from a user's role list.
 */
export const getHighestPriorityRole = (roles: string[] = []): string => {
  if (!roles || roles.length === 0) return ROLES.STUDENT;
  for (const prioritizedRole of ROLE_HIERARCHY) {
    if (roles.includes(prioritizedRole)) {
      return prioritizedRole;
    }
  }
  return roles[0] || ROLES.STUDENT;
};

/**
 * Computes the default landing route based on user roles and permissions.
 */
export const getDefaultLandingRoute = (userContext: UserAuthContext | null | undefined): string => {
  if (!userContext) return '/login';

  const activeRole = userContext.activeRole || getHighestPriorityRole(userContext.roles);

  switch (activeRole) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      return PRIVATE_NAVIGATION.dashboard;
    case ROLES.INSTITUTION_ADMIN:
      return PRIVATE_NAVIGATION.institutionDashboard || PRIVATE_NAVIGATION.dashboard;
    case ROLES.SALES_AGENT:
      return PRIVATE_NAVIGATION.dashboard;
    case ROLES.PARENT:
      return PRIVATE_NAVIGATION.parentDashboard || PRIVATE_NAVIGATION.dashboard;
    case ROLES.STUDENT:
    default:
      return PRIVATE_NAVIGATION.dashboard;
  }
};
