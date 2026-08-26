// ** Redux **
import { useAppDispatch } from '@/redux/store';
import { useAppSelector } from '@/redux/hooks';
import {
  getCurrentUser,
  getIsAuthenticated,
  getIsInitializing,
  getToken,
  getUserRoles,
  getUserPermissions,
  getActiveRole,
  logout as logoutAction,
} from '@/redux/slices/authSlice';

/**
 * Global auth hook — read user/auth state and log out from anywhere.
 * Route guards and the app layout consume this.
 */
export const useAuth = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(getCurrentUser);
  const isAuthenticated = useAppSelector(getIsAuthenticated);
  const isInitializing = useAppSelector(getIsInitializing);
  const token = useAppSelector(getToken);
  const roles = useAppSelector(getUserRoles);
  const permissions = useAppSelector(getUserPermissions);
  const activeRole = useAppSelector(getActiveRole);

  const logout = () => dispatch(logoutAction());

  return {
    user,
    isAuthenticated,
    isInitializing,
    token,
    roles,
    permissions,
    activeRole,
    logout,
  };
};

export default useAuth;
