import { useEffect, type ReactNode } from 'react';
import { useAppDispatch } from '@/redux/store';
import { setCredentials, logout, setInitializing } from '@/redux/slices/authSlice';
import { setAuthInterceptorCallbacks, Axios } from '@/base-axios';
import { fetchAndSyncFeatureFlags } from '@/services/featureFlag.service';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Enterprise AuthProvider:
 * 1. Synchronizes Redux auth state with Axios interceptor callbacks.
 * 2. Bootstraps environment feature flags via GET /config/features.
 * 3. Performs initial session bootstrap on app startup via GET /auth/me (auto-refreshed via HttpOnly cookie if needed).
 * 4. Prevents login page flicker by maintaining `isInitializing: true` until verified.
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // 1. Fetch & sync environment feature flags
    fetchAndSyncFeatureFlags();

    // 2. Wire Redux store synchronization with Axios interceptor
    setAuthInterceptorCallbacks({
      onSyncStore: (payload) => {
        if (payload?.user) {
          dispatch(setCredentials({ user: payload.user }));
        }
      },
      onLogout: () => {
        dispatch(logout());
      },
    });

    // 3. Initial Session Bootstrap: Call GET /auth/me with HttpOnly cookies
    let active = true;

    Axios.get('/auth/me')
      .then((res) => {
        if (!active) return;
        const payload = res.data?.data || res.data;
        if (payload) {
          dispatch(setCredentials({ user: payload }));
        } else {
          dispatch(setInitializing(false));
        }
      })
      .catch(() => {
        if (!active) return;
        dispatch(logout());
        dispatch(setInitializing(false));
      });

    return () => {
      active = false;
    };
  }, [dispatch]);

  return <>{children}</>;
};

export default AuthProvider;
