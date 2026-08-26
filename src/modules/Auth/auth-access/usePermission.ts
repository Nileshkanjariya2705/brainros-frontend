import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { type PermissionCode } from './permission.constants';
import {
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  type UserAuthContext,
} from './access-control';

export const usePermission = () => {
  const { user } = useAuth();

  const userContext: UserAuthContext | null = user
    ? {
        id: user.id,
        roles: user.roles || [],
        permissions: (user as any).permissions || [],
        activeRole: (user as any).activeRole || null,
        studentProfile: user.studentProfile,
      }
    : null;

  const can = useCallback(
    (permission: PermissionCode): boolean => {
      return checkPermission(userContext, permission);
    },
    [userContext],
  );

  const canAny = useCallback(
    (permissions: PermissionCode[]): boolean => {
      return checkAnyPermission(userContext, permissions);
    },
    [userContext],
  );

  const canAll = useCallback(
    (permissions: PermissionCode[]): boolean => {
      return checkAllPermissions(userContext, permissions);
    },
    [userContext],
  );

  return {
    can,
    canAny,
    canAll,
    userContext,
  };
};
