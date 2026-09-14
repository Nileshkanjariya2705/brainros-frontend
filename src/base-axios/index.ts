// ** Packages **
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

// ** Config / Utils **
import { API_URL, API_TIMEOUT } from '@config';
import { toast } from '@/utils/toast';
import { clearUserSessionCache } from '@/queryClient';
import { hasTabSession } from '@/utils/tabSession';

// ** Types **
import type { ApiErrorResponse } from './types';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
    _silent?: boolean; // When true, suppresses error toasts for this request
  }
  export interface InternalAxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
    _silent?: boolean;
  }
}

// ─── Shared Refresh Lock & Callbacks ──────────────────────────
let refreshPromise: Promise<string | null> | null = null;
let syncStoreCallback: ((payload: any) => void) | null = null;
let logoutCallback: (() => void) | null = null;

export const setAuthInterceptorCallbacks = (callbacks: {
  onSyncStore?: (payload: any) => void;
  onLogout?: () => void;
}) => {
  if (callbacks.onSyncStore) syncStoreCallback = callbacks.onSyncStore;
  if (callbacks.onLogout) logoutCallback = callbacks.onLogout;
};

// ─── Public Endpoints (Excluded from Auth header & Refresh loop) ─
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-registration-otp',
  '/auth/register/verify-otp',
  '/auth/login/request-otp',
  '/auth/login/verify-otp',
  '/auth/otp/request',
  '/auth/otp/verify',
  '/auth/otp/resend',
  '/auth/refresh',
  '/auth/logout',
  '/auth/options',
  '/public/',
  '/public/exams',
];

// ─── Background / polling paths that should NEVER show intrusive toasts ──
const SILENT_PATHS = [
  '/notifications/unread-count',
  '/notifications',
  '/admin/exams/check-availability',
  '/dashboard',
];

const isSilentPath = (url?: string): boolean => {
  if (!url) return false;
  return SILENT_PATHS.some((p) => url.includes(p));
};

const isPublicAuthUrl = (url?: string): boolean => {
  if (!url) return false;
  return PUBLIC_AUTH_PATHS.some((path) => url.includes(path));
};

/**
 * `Axios` — Single configured Axios instance for the application.
 * Configured with `withCredentials: true` to seamlessly pass HttpOnly refresh cookies.
 */
export const Axios: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── REQUEST Interceptor ──────────────────────────────────────
Axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // If request payload is FormData, remove static application/json so browser / axios computes multipart boundary
    if (config.data instanceof FormData && config.headers) {
      if (typeof (config.headers as any).delete === 'function') {
        (config.headers as any).delete('Content-Type');
        (config.headers as any).delete('content-type');
      }
      delete (config.headers as any)['Content-Type'];
      delete (config.headers as any)['content-type'];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── RESPONSE Interceptor: Single-Refresh Lock & Request Retry ──
Axios.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorResponse>) => {
    const originalConfig = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;

    // 1. Only process 401 Unauthorized for protected requests that haven't been retried yet
    // AND only when this specific tab has an active session marker
    if (
      status === 401 &&
      originalConfig &&
      !originalConfig._skipAuthRefresh &&
      !originalConfig._retry &&
      !isPublicAuthUrl(originalConfig.url) &&
      hasTabSession()
    ) {
      originalConfig._retry = true;

      try {
        // 2. Concurrency Lock: Ensure only ONE /auth/refresh call runs simultaneously
        if (!refreshPromise) {
          refreshPromise = axios
            .post(
              `${API_URL}/auth/refresh`,
              {},
              {
                withCredentials: true,
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            )
            .then((refreshRes) => {
              const payload = refreshRes.data?.data || refreshRes.data;
              if (syncStoreCallback) {
                syncStoreCallback(payload);
              }
              return 'refreshed';
            })
            .catch((refreshErr) => {
              if (logoutCallback) {
                logoutCallback();
              }
              clearUserSessionCache();
              throw refreshErr;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        // 3. Await active refresh promise
        await refreshPromise;

        // 4. Retry original request ONLY ONCE with updated cookies automatically sent by browser
        return Axios(originalConfig);
      } catch (refreshErr) {
        // toast.error('Session expired. Please log in again.');
        return Promise.reject(refreshErr);
      }
    }

    // 2. Show user-friendly toast for non-auth errors or after retry failure
    // Skip toast for: silent paths (polling/background), 503 DB-down, or requests marked _silent
    const isSilent =
      originalConfig?._silent ||
      isSilentPath(originalConfig?.url) ||
      status === 503 ||
      status === 504;

    if (originalConfig && !isPublicAuthUrl(originalConfig.url) && !isSilent) {
      let errorMsg: string | undefined;

      // Check for network offline / connection failure
      if (!error.response && (error.code === 'ERR_NETWORK' || (typeof navigator !== 'undefined' && !navigator.onLine))) {
        errorMsg = 'Unable to connect to the server. Please check your internet connection and try again.';
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMsg = 'The request took too long to complete. Please try again.';
      } else {
        const rawMsg = error.response?.data?.message || (error.response?.data as any)?.error;
        if (Array.isArray(rawMsg)) {
          errorMsg = rawMsg.filter(Boolean).join('. ');
        } else if (typeof rawMsg === 'string' && rawMsg.trim().length > 0) {
          errorMsg = rawMsg;
        } else if (status === 403) {
          errorMsg = 'You do not have permission to perform this action.';
        } else if (status === 404) {
          errorMsg = 'The requested resource could not be found.';
        } else if (status === 409) {
          errorMsg = 'A conflict occurred with an existing record.';
        } else if (status && status >= 500) {
          errorMsg = 'An unexpected server error occurred. Please try again later.';
        } else if (error.message && error.message !== 'canceled') {
          errorMsg = error.message;
        }
      }

      if (errorMsg) {
        toast.error(errorMsg);
      }
    }

    // 3. Pass through 403 Forbidden, 400 Bad Request, 404 Not Found, etc. without retrying
    return Promise.reject(error);
  },
);

export default Axios;
