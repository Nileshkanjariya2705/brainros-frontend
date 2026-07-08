// ** Packages **
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

// ** Config / Utils **
import { API_URL, API_TIMEOUT } from '@config';
import { tokenStorage } from '@/utils/token';
import { PUBLIC_NAVIGATION } from '@/constants/navigation.constant';

// ** Types **
import type { ApiErrorResponse } from './types';

/**
 * `Axios` — the single configured instance for the whole app
 * (mirrors `@libs/common/base-axios`). The useAxios hooks call THIS instance;
 * nothing else imports raw axios. baseURL + timeout come from env config.
 */
export const Axios: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---- REQUEST interceptor: attach the bearer token -------------------------
Axios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ---- RESPONSE interceptor: hard-logout on 401 -----------------------------
// The useAxios hooks normalize the error body; here we only handle the
// cross-cutting concern: an expired/invalid session must boot the user out.
Axios.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const status = error.response?.status;
    if (status === 401) {
      tokenStorage.clear();
      if (window.location.pathname !== PUBLIC_NAVIGATION.login) {
        window.location.href = PUBLIC_NAVIGATION.login;
      }
    }
    return Promise.reject(error);
  },
);

export default Axios;
