import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // If user roles aren't populated yet, allow rendering or wait
  const userRoles = user?.roles || [];
  if (userRoles.length > 0 && !allowedRoles.some((r) => userRoles.includes(r))) {
    // User does not have required role, redirect to safe dashboard
    return <Navigate to={PRIVATE_NAVIGATION.dashboard} replace />;
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
