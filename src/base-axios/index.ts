// ** Packages **
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

// ** Config / Utils **
import { API_URL, API_TIMEOUT } from '@config';
import { tokenStorage } from '@/utils/token';

// ** Types **
import type { ApiErrorResponse } from './types';

declare module 'axios' {
  export interface AxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
  }
  export interface InternalAxiosRequestConfig {
    _skipAuthRefresh?: boolean;
    _retry?: boolean;
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
  '/auth/options',
];

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

// ─── REQUEST Interceptor: Attach Bearer token ──────────────────
Axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const isPublic = isPublicAuthUrl(config.url);
    const token = tokenStorage.get();

    if (token && !isPublic && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
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

    // 1. Only process 401 Unauthorized for protected requests
    if (
      status === 401 &&
      originalConfig &&
      !originalConfig._skipAuthRefresh &&
      !originalConfig._retry &&
      !isPublicAuthUrl(originalConfig.url)
    ) {
      originalConfig._retry = true;

      try {
        // 2. Concurrency Lock: Ensure only ONE /auth/refresh call runs simultaneously
        if (!refreshPromise) {
          const fallbackToken = tokenStorage.getRefreshToken();

          refreshPromise = axios
            .post(`${API_URL}/auth/refresh`, fallbackToken ? { refreshToken: fallbackToken } : {}, {
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
                ...(fallbackToken ? { 'x-refresh-token': fallbackToken } : {}),
              },
            })
            .then((refreshRes) => {
              const payload = refreshRes.data?.data || refreshRes.data;
              const newAccessToken = payload?.accessToken;
              const newRefreshToken = payload?.refreshToken;

              if (newAccessToken) {
                tokenStorage.set(newAccessToken);
                if (newRefreshToken) {
                  tokenStorage.setRefreshToken(newRefreshToken);
                }
                if (syncStoreCallback) {
                  syncStoreCallback(payload);
                }
                return newAccessToken;
              }
              throw new Error('No access token returned from refresh');
            })
            .catch((refreshErr) => {
              tokenStorage.clear();
              if (logoutCallback) {
                logoutCallback();
              }
              throw refreshErr;
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        // 3. Await active refresh promise
        const newAccessToken = await refreshPromise;

        if (newAccessToken) {
          // 4. Retry original request with new access token
          originalConfig.headers.Authorization = `Bearer ${newAccessToken}`;
          return Axios(originalConfig);
        }
      } catch (refreshErr) {
        return Promise.reject(refreshErr);
      }
    }

    // 2. Pass through 403 Forbidden, 400 Bad Request, network errors without refreshing
    return Promise.reject(error);
  },
);

export default Axios;
