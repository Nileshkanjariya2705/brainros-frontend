// ** Redux **
import { useAppDispatch } from '@/redux/store';
import { useAppSelector } from '@/redux/hooks';
import {
  getCurrentUser,
  getIsAuthenticated,
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

  const logout = () => dispatch(logoutAction());

  return { user, isAuthenticated, logout };
};
