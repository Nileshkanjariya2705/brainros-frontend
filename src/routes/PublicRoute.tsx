// ** Packages **
import { Navigate, Outlet } from 'react-router-dom';

// ** Hooks **
import { useAuth } from '@/hooks/useAuth';
import PageLoader from '@/components/feedback/PageLoader';

import { getDefaultLandingRoute } from '@/modules/Auth/auth-access';

/**
 * Guard for UNAUTHENTICATED-only routes (login, register).
 * If initializing session → show loader to prevent page flicker.
 * If already logged in → bounce to the appropriate role dashboard.
 */
const PublicRoute = () => {
  const { user, isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <PageLoader label="Checking existing session..." />;
  }

  if (isAuthenticated && user) {
    const targetRoute = getDefaultLandingRoute({
      id: user.id,
      roles: user.roles,
      permissions: (user as any).permissions,
      activeRole: (user as any).activeRole,
    });
    return <Navigate to={targetRoute} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
