// ** Packages **
import { Navigate, Outlet, useLocation } from 'react-router-dom';

// ** Hooks **
import { useAuth } from '@/hooks/useAuth';

// ** Constants **
import { PUBLIC_NAVIGATION } from '@/constants/navigation.constant';

/**
 * Guard for AUTHENTICATED routes. If NOT logged in → redirect to /login,
 * remembering where the user was headed (location state) for post-login return.
 */
const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={PUBLIC_NAVIGATION.login} replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
