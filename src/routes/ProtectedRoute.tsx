import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  usePermission,
  useRole,
  useFeature,
  type PermissionCode,
  type RoleType,
} from '@/modules/Auth/auth-access';
import { ForbiddenPage } from '@/components/feedback/ForbiddenPage';
import { FeatureUnavailablePage } from '@/components/feedback/FeatureUnavailablePage';
import PageLoader from '@/components/feedback/PageLoader';
import { PUBLIC_NAVIGATION } from '@/constants/navigation.constant';
import type { FeatureKey } from '@/constants/feature-flag.constant';

interface ProtectedRouteProps {
  feature?: FeatureKey;
  permissions?: PermissionCode[];
  roles?: RoleType[];
  requireAllPermissions?: boolean;
  children?: React.ReactNode;
}

/**
 * Enterprise Route Guard for Authenticated & Authorized Pages.
 * 1. Initializing -> Render PageLoader to prevent login flicker.
 * 2. Unauthenticated (no valid session) -> Redirect to /login (remembering path).
 * 3. Feature Check (if specified) -> Render FeatureUnavailablePage if feature is disabled in environment.
 * 4. Role Check (if specified) -> Render 403 Forbidden.
 * 5. Permission Check (if specified) -> Render 403 Forbidden.
 * 6. Authorized -> Render requested route component.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  feature,
  permissions = [],
  roles = [],
  requireAllPermissions = false,
  children,
}) => {
  const { isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();
  const { canAny, canAll } = usePermission();
  const { isAnyRole } = useRole();
  const isFeatureActive = useFeature(feature as FeatureKey);

  // 1. Initializing session bootstrap
  if (isInitializing) {
    return <PageLoader label="Verifying secure session..." />;
  }

  // 2. Unauthenticated -> Login
  if (!isAuthenticated) {
    return <Navigate to={PUBLIC_NAVIGATION.login} replace state={{ from: location }} />;
  }

  // 3. Feature Flag Check (if specified)
  if (feature && !isFeatureActive) {
    return <FeatureUnavailablePage featureName={feature} />;
  }

  // 4. Role Check (if specified)
  if (roles.length > 0 && !isAnyRole(roles)) {
    return <ForbiddenPage allowedRoles={roles} requiredPermissions={permissions} />;
  }

  // 5. Permission Check (if specified)
  if (permissions.length > 0) {
    const hasPermAccess = requireAllPermissions ? canAll(permissions) : canAny(permissions);
    if (!hasPermAccess) {
      return <ForbiddenPage requiredPermissions={permissions} allowedRoles={roles} />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
