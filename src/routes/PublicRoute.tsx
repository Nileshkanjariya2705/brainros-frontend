// ** Packages **
import { Navigate, Outlet } from 'react-router-dom';

// ** Hooks **
import { useAuth } from '@/hooks/useAuth';

// ** Constants **
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

/**
 * Guard for UNAUTHENTICATED-only routes (login, register).
 * If already logged in → bounce to the dashboard.
 */
const PublicRoute = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={PRIVATE_NAVIGATION.dashboard} replace />;
  }

  return <Outlet />;
};

export default PublicRoute;
