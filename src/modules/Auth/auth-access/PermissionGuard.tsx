import React from 'react';
import { usePermission } from './usePermission';
import { useRole } from './useRole';
import { type PermissionCode } from './permission.constants';
import { type RoleType } from './roles.constants';

export interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: PermissionCode;
  permissions?: PermissionCode[];
  requireAllPermissions?: boolean;
  role?: RoleType;
  roles?: RoleType[];
  requireAllRoles?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Declarative component-level authorization guard.
 * Renders children only when permission or role criteria are satisfied.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  permission,
  permissions,
  requireAllPermissions = false,
  role,
  roles,
  fallback = null,
}) => {
  const { can, canAny, canAll } = usePermission();
  const { isRole, isAnyRole } = useRole();

  let hasAccess = true;

  // 1. Single Permission check
  if (permission && !can(permission)) {
    hasAccess = false;
  }

  // 2. Multiple Permissions check
  if (permissions && permissions.length > 0) {
    if (requireAllPermissions) {
      if (!canAll(permissions)) hasAccess = false;
    } else {
      if (!canAny(permissions)) hasAccess = false;
    }
  }

  // 3. Role check
  if (role && !isRole(role)) {
    hasAccess = false;
  }

  if (roles && roles.length > 0) {
    if (!isAnyRole(roles)) {
      hasAccess = false;
    }
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

/**
 * Concise alias for PermissionGuard.
 * e.g. <Can permission="question:create"><CreateButton /></Can>
 */
export const Can: React.FC<{
  permission?: PermissionCode;
  permissions?: PermissionCode[];
  role?: RoleType;
  roles?: RoleType[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = (props) => <PermissionGuard {...props} />;

export default PermissionGuard;
