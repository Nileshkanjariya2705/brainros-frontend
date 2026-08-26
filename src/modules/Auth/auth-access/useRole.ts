import { useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAppDispatch } from '@/redux/store';
import { setActiveRole } from '@/redux/slices/authSlice';
import { ROLES, ROLE_LABELS, type RoleType } from './roles.constants';
import {
  hasRole as checkRole,
  hasAnyRole as checkAnyRole,
  getHighestPriorityRole,
  type UserAuthContext,
} from './access-control';

export const useRole = () => {
  const { user } = useAuth();
  const dispatch = useAppDispatch();

  const userRoles = user?.roles || [];
  const activeRole = (user as any)?.activeRole || getHighestPriorityRole(userRoles);

  const userContext: UserAuthContext | null = user
    ? {
        id: user.id,
        roles: userRoles,
        permissions: (user as any).permissions || [],
        activeRole,
        studentProfile: user.studentProfile,
      }
    : null;

  const isRole = useCallback(
    (role: RoleType): boolean => {
      return checkRole(userContext, role);
    },
    [userContext],
  );

  const isAnyRole = useCallback(
    (roles: RoleType[]): boolean => {
      return checkAnyRole(userContext, roles);
    },
    [userContext],
  );

  const switchActiveRole = useCallback(
    (newRole: string) => {
      if (userRoles.includes(newRole)) {
        dispatch(setActiveRole(newRole));
      }
    },
    [userRoles, dispatch],
  );

  const isSuperAdmin = userRoles.includes(ROLES.SUPER_ADMIN);
  const isAdmin = userRoles.includes(ROLES.ADMIN) || isSuperAdmin;
  const isInstitutionAdmin = userRoles.includes(ROLES.INSTITUTION_ADMIN);
  const isSalesAgent = userRoles.includes(ROLES.SALES_AGENT);
  const isParent = userRoles.includes(ROLES.PARENT);
  const isStudent = userRoles.includes(ROLES.STUDENT);

  const activeRoleMeta = ROLE_LABELS[activeRole] || {
    label: activeRole,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
    description: 'User Role',
  };

  return {
    roles: userRoles,
    activeRole,
    activeRoleMeta,
    isRole,
    isAnyRole,
    isSuperAdmin,
    isAdmin,
    isInstitutionAdmin,
    isSalesAgent,
    isParent,
    isStudent,
    hasMultipleRoles: userRoles.length > 1,
    switchActiveRole,
  };
};
