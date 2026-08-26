import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  usePermission,
  useRole,
  type PermissionCode,
  type RoleType,
} from '@/modules/Auth/auth-access';
import { ForbiddenPage } from '@/components/feedback/ForbiddenPage';
import PageLoader from '@/components/feedback/PageLoader';
import { PUBLIC_NAVIGATION } from '@/constants/navigation.constant';

interface ProtectedRouteProps {
  permissions?: PermissionCode[];
  roles?: RoleType[];
  requireAllPermissions?: boolean;
  children?: React.ReactNode;
}

/**
 * Enterprise Route Guard for Authenticated & Authorized Pages.
 * 1. Initializing -> Render PageLoader to prevent login flicker.
 * 2. Unauthenticated (no valid session) -> Redirect to /login (remembering path).
 * 3. Authenticated but Unauthorized (lacks permissions/roles) -> Render 403 Forbidden.
 * 4. Authorized -> Render requested route component.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  permissions = [],
  roles = [],
  requireAllPermissions = false,
  children,
}) => {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  const { canAny, canAll } = usePermission();
  const { isAnyRole } = useRole();

  // 1. Initializing session bootstrap
  if (isInitializing) {
    return <PageLoader label="Verifying secure session..." />;
  }

  // 2. Unauthenticated -> Login
  if (!isAuthenticated) {
    return <Navigate to={PUBLIC_NAVIGATION.login} replace state={{ from: location }} />;
  }

  // 3. Role Check (if specified)
  if (roles.length > 0 && !isAnyRole(roles)) {
    return <ForbiddenPage allowedRoles={roles} requiredPermissions={permissions} />;
  }

  // 4. Permission Check (if specified)
  if (permissions.length > 0) {
    const hasPermAccess = requireAllPermissions ? canAll(permissions) : canAny(permissions);
    if (!hasPermAccess) {
      return <ForbiddenPage requiredPermissions={permissions} allowedRoles={roles} />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
