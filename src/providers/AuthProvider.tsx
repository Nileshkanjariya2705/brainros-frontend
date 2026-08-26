import { useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { useAppDispatch } from '@/redux/store';
import { setCredentials, logout, setInitializing } from '@/redux/slices/authSlice';
import { setAuthInterceptorCallbacks } from '@/base-axios';
import { tokenStorage } from '@/utils/token';
import { API_URL } from '@config';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Enterprise AuthProvider:
 * 1. Synchronizes Redux auth state with Axios interceptor callbacks.
 * 2. Performs initial session bootstrap on app startup via HttpOnly refresh cookie + storage fallback.
 * 3. Prevents login page flicker by maintaining `isInitializing: true` until verified.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 1. Wire Redux store synchronization with Axios interceptor
    setAuthInterceptorCallbacks({
      onSyncStore: (payload) => {
        dispatch(setCredentials(payload));
      },
      onLogout: () => {
        dispatch(logout());
      },
    });

    // 2. Initial Session Bootstrap: Call /auth/refresh with HttpOnly cookie & fallback header
    let active = true;
    const storedRefreshToken = tokenStorage.getRefreshToken();

    axios
      .post(
        `${API_URL}/auth/refresh`,
        storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            ...(storedRefreshToken ? { 'x-refresh-token': storedRefreshToken } : {}),
          },
        },
      )
      .then((res) => {
        if (!active) return;
        const payload = res.data?.data || res.data;
        if (payload?.accessToken) {
          dispatch(setCredentials(payload));
        } else {
          dispatch(setInitializing(false));
        }
      })
      .catch(() => {
        if (!active) return;
        dispatch(setInitializing(false));
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthProvider;
