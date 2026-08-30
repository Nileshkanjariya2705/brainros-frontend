import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole, getDefaultLandingRoute } from '@/modules/Auth/auth-access';
import PageLoader from '@/components/feedback/PageLoader';

/**
 * Universal Dashboard Dispatcher
 *
 * When navigating to legacy `/dashboard`, dynamically resolves the user's
 * active role and seamlessly redirects them to their dedicated role-specific dashboard:
 * - STUDENT       -> /student/dashboard
 * - ADMIN         -> /admin/dashboard
 * - SUPER_ADMIN   -> /super-admin/dashboard
 * - PARENT        -> /parent/dashboard
 */
export const DashboardPage = () => {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const { activeRole } = useRole();
  const navigate = useNavigate();

  useEffect(() => {
    if (isInitializing) return;

    if (!isAuthenticated || !user) {
      navigate('/login', { replace: true });
      return;
    }

    const targetRoute = getDefaultLandingRoute({
      id: user.id,
      roles: user.roles,
      permissions: (user as any).permissions,
      activeRole,
    });

    navigate(targetRoute, { replace: true });
  }, [user, activeRole, isAuthenticated, isInitializing, navigate]);

  return <PageLoader label="Routing to your dashboard..." />;
};

export default DashboardPage;
