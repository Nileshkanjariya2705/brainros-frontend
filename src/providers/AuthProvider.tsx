import { useEffect, type ReactNode } from 'react';
import { useAppDispatch } from '@/redux/store';
import { setCredentials, logout, setInitializing } from '@/redux/slices/authSlice';
import { setAuthInterceptorCallbacks, Axios } from '@/base-axios';
import { fetchAndSyncFeatureFlags } from '@/services/featureFlag.service';
import { hasTabSession } from '@/utils/tabSession';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Enterprise AuthProvider:
 * 1. Synchronizes Redux auth state with Axios interceptor callbacks.
 * 2. Bootstraps environment feature flags via GET /config/features.
 * 3. Per-Tab Session Validation:
 *    - If current tab has NO sessionStorage marker (e.g. new browser tab):
 *      clears any lingering HttpOnly auth cookies via POST /auth/logout and marks as unauthenticated.
 *    - If current tab HAS sessionStorage marker (e.g. page refresh in existing tab):
 *      validates active session via GET /auth/me.
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

    let active = true;

    // 3. Per-Tab Session Check
    if (!hasTabSession()) {
      // New tab without tab session marker -> clear any lingering backend cookies and require fresh login
      Axios.post('/auth/logout', {}, { _skipAuthRefresh: true, _silent: true })
        .catch(() => {})
        .finally(() => {
          if (!active) return;
          dispatch(logout());
          dispatch(setInitializing(false));
        });
      return () => {
        active = false;
      };
    }

    // 4. Existing Tab Session: Validate via GET /auth/me with HttpOnly session cookies
    Axios.get('/auth/me', { _silent: true })
      .then((res) => {
        if (!active) return;
        const payload = res.data?.data || res.data;
        if (payload) {
          dispatch(setCredentials({ user: payload }));
        } else {
          dispatch(logout());
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
