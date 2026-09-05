// ** Packages **
import { useCallback } from 'react';
import type { AxiosRequestConfig } from 'axios';

// ** Custom Hooks **
import { useAxiosGet, useAxiosPost, useAxiosDelete, useAxiosPatch } from '@/hooks/useAxios';

// ** Types **
import type {
  LoginResponse,
  RegisterStudentResponse,
  RegisterOptionsResponse,
  User,
  AuthSession,
  StudentProfile,
  RegisterStudentDto,
  LoginEmailDto,
  LoginStudentIdDto,
  GoogleLoginDto,
} from '../types/auth.types';

// Base path for every auth endpoint
const AUTH_API_BASE_PATH = '/auth';
const STUDENT_API_BASE_PATH = '/students';

/**
 * 1. Mobile OTP Request API
 */
export const useSendOtpAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const sendOtpAPI = useCallback(
    async (
      data: { phone: string; purpose?: string; mobileNumber?: string },
      config: AxiosRequestConfig = {},
    ) => {
      // Backend expects { phone, purpose } for /auth/otp/request
      const payload = {
        phone: data.phone || data.mobileNumber,
        purpose: data.purpose || 'LOGIN',
      };
      return callApi<{ success: boolean; message: string }>(
        `${AUTH_API_BASE_PATH}/otp/request`,
        payload,
        config,
      );
    },
    [callApi],
  );
  return { sendOtpAPI, isLoading, isError, isSuccess };
};

/**
 * 2. Mobile OTP Verify & Login API
 */
export const useVerifyOtpAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const verifyOtpAPI = useCallback(
    async (
      data: { mobileNumber: string; otp: string; purpose?: string },
      config: AxiosRequestConfig = {},
    ) => {
      const payload = {
        mobileNumber: data.mobileNumber,
        otp: data.otp,
        purpose: data.purpose || 'LOGIN',
      };
      return callApi<LoginResponse>(`${AUTH_API_BASE_PATH}/otp/verify`, payload, config);
    },
    [callApi],
  );
  return { verifyOtpAPI, isLoading, isError, isSuccess };
};

/**
 * 3. Email & Password Login API
 */
export const useLoginEmailAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const loginEmailAPI = useCallback(
    async (data: LoginEmailDto, config: AxiosRequestConfig = {}) => {
      return callApi<LoginResponse>(`${AUTH_API_BASE_PATH}/login/email`, data, config);
    },
    [callApi],
  );
  return { loginEmailAPI, isLoading, isError, isSuccess };
};

/**
 * 4. Student ID & Password Login API
 */
export const useLoginStudentIdAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const loginStudentIdAPI = useCallback(
    async (data: LoginStudentIdDto, config: AxiosRequestConfig = {}) => {
      return callApi<LoginResponse>(`${AUTH_API_BASE_PATH}/login/student-id`, data, config);
    },
    [callApi],
  );
  return { loginStudentIdAPI, isLoading, isError, isSuccess };
};

/**
 * 5. Google Sign In API
 */
export const useLoginGoogleAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const loginGoogleAPI = useCallback(
    async (data: GoogleLoginDto, config: AxiosRequestConfig = {}) => {
      return callApi<LoginResponse>(`${AUTH_API_BASE_PATH}/google`, data, config);
    },
    [callApi],
  );
  return { loginGoogleAPI, isLoading, isError, isSuccess };
};

/**
 * 6. Student Registration API
 */
export const useRegisterStudentAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const registerStudentAPI = useCallback(
    async (data: RegisterStudentDto, config: AxiosRequestConfig = {}) => {
      return callApi<RegisterStudentResponse>(`${AUTH_API_BASE_PATH}/register`, data, config);
    },
    [callApi],
  );
  return { registerStudentAPI, isLoading, isError, isSuccess };
};

/**
 * 7. Metadata / Options API (Classes, Exam Targets, Languages, States & Districts)
 */
export const useGetRegisterOptionsAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosGet();
  const getRegisterOptionsAPI = useCallback(
    async (config: AxiosRequestConfig = {}) => {
      return callApi<RegisterOptionsResponse>(`${AUTH_API_BASE_PATH}/options`, config);
    },
    [callApi],
  );
  return { getRegisterOptionsAPI, isLoading, isError, isSuccess };
};

/**
 * 8. Current Authenticated User Profile API
 */
export const useGetProfileAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosGet();
  const getProfileAPI = useCallback(
    async (config: AxiosRequestConfig = {}) => {
      return callApi<User>(`${AUTH_API_BASE_PATH}/me`, config);
    },
    [callApi],
  );
  return { getProfileAPI, isLoading, isError, isSuccess };
};

/**
 * 9. Active Sessions List API
 */
export const useGetSessionsAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosGet();
  const getSessionsAPI = useCallback(
    async (config: AxiosRequestConfig = {}) => {
      return callApi<AuthSession[]>(`${AUTH_API_BASE_PATH}/sessions`, config);
    },
    [callApi],
  );
  return { getSessionsAPI, isLoading, isError, isSuccess };
};

/**
 * 10. Revoke Specific Session API
 */
export const useRevokeSessionAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosDelete();
  const revokeSessionAPI = useCallback(
    async (sessionId: string, config: AxiosRequestConfig = {}) => {
      return callApi<{ message: string }>(`${AUTH_API_BASE_PATH}/sessions/${sessionId}`, config);
    },
    [callApi],
  );
  return { revokeSessionAPI, isLoading, isError, isSuccess };
};

/**
 * 11. Logout API (Current Device Session)
 */
export const useLogoutAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const logoutAPI = useCallback(
    async (config: AxiosRequestConfig = {}) => {
      return callApi(`${AUTH_API_BASE_PATH}/logout`, {}, config);
    },
    [callApi],
  );
  return { logoutAPI, isLoading, isError, isSuccess };
};

/**
 * 12. Logout All Devices API
 */
export const useLogoutAllAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const logoutAllAPI = useCallback(
    async (config: AxiosRequestConfig = {}) => {
      return callApi(`${AUTH_API_BASE_PATH}/logout-all`, {}, config);
    },
    [callApi],
  );
  return { logoutAllAPI, isLoading, isError, isSuccess };
};

/**
 * 13. Student Profile Get & Update APIs
 */
export const useStudentProfileAPI = () => {
  const [getApi, { isLoading: isGetLoading }] = useAxiosGet();
  const [patchApi, { isLoading: isPatchLoading }] = useAxiosPatch();

  const getStudentProfile = useCallback(
    async (config: AxiosRequestConfig = {}) => {
      return getApi<StudentProfile>(`${STUDENT_API_BASE_PATH}/me`, config);
    },
    [getApi],
  );

  const updateStudentProfile = useCallback(
    async (data: Partial<StudentProfile>, config: AxiosRequestConfig = {}) => {
      return patchApi<StudentProfile>(`${STUDENT_API_BASE_PATH}/me`, data, config);
    },
    [patchApi],
  );

  return {
    getStudentProfile,
    updateStudentProfile,
    isLoading: isGetLoading || isPatchLoading,
  };
};

/**
 * 14. Verify Registration OTP API
 */
export const useVerifyRegistrationOtpAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const verifyRegistrationOtpAPI = useCallback(
    async (data: { registrationId: string; otp: string }, config: AxiosRequestConfig = {}) => {
      return callApi<LoginResponse>(`${AUTH_API_BASE_PATH}/verify-registration-otp`, data, config);
    },
    [callApi],
  );
  return { verifyRegistrationOtpAPI, isLoading, isError, isSuccess };
};

/**
 * 15. Passwordless Login Request OTP API
 */
export const useRequestPasswordlessLoginOtpAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const requestPasswordlessLoginOtpAPI = useCallback(
    async (data: { identifier: string }, config: AxiosRequestConfig = {}) => {
      return callApi<{
        requiresOtp: boolean;
        purpose: string;
        loginRequestId: string;
        mobileMasked: string;
        expiresIn: number;
        resendAvailableIn: number;
        otpLength?: number;
      }>(`${AUTH_API_BASE_PATH}/login/request-otp`, data, config);
    },
    [callApi],
  );
  return { requestPasswordlessLoginOtpAPI, isLoading, isError, isSuccess };
};

/**
 * 16. Passwordless Login Verify OTP API
 */
export const useVerifyPasswordlessLoginOtpAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const verifyPasswordlessLoginOtpAPI = useCallback(
    async (data: { loginRequestId: string; otp: string }, config: AxiosRequestConfig = {}) => {
      return callApi<LoginResponse>(`${AUTH_API_BASE_PATH}/login/verify-otp`, data, config);
    },
    [callApi],
  );
  return { verifyPasswordlessLoginOtpAPI, isLoading, isError, isSuccess };
};

/**
 * 17. Resend OTP API
 */
export const useResendOtpAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const resendOtpAPI = useCallback(
    async (
      data: {
        registrationId?: string;
        loginRequestId?: string;
        mobileNumber?: string;
        purpose?: string;
      },
      config: AxiosRequestConfig = {},
    ) => {
      return callApi<{ resendAvailableIn: number; expiresIn: number }>(
        `${AUTH_API_BASE_PATH}/otp/resend`,
        data,
        config,
      );
    },
    [callApi],
  );
  return { resendOtpAPI, isLoading, isError, isSuccess };
};

// ** Location & Pincode Services **
export * from './location.service';

