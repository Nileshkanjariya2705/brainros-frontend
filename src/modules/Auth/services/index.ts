// ** Packages **
import { useCallback } from 'react';
import type { AxiosRequestConfig } from 'axios';

// ** Custom Hooks **
import { useAxiosGet, useAxiosPost } from '@/hooks/useAxios';

// ** Types **
import type {
  LoginResponse,
  RegisterStudentResponse,
  RegisterOptionsResponse,
  User,
} from '../types/auth.types';

// Base path for every auth endpoint — defined once, reused below (repo convention).
const AUTH_API_BASE_PATH = '/auth';

export const useSendOtpAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const sendOtpAPI = useCallback(
    async (data: { mobileNumber: string }, config: AxiosRequestConfig = {}) => {
      return callApi<{ success: boolean; message: string }>(
        `${AUTH_API_BASE_PATH}/otp/send`,
        data,
        config,
      );
    },
    [callApi],
  );
  return { sendOtpAPI, isLoading, isError, isSuccess };
};

export const useVerifyOtpAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const verifyOtpAPI = useCallback(
    async (data: { mobileNumber: string; otp: string }, config: AxiosRequestConfig = {}) => {
      return callApi<LoginResponse>(`${AUTH_API_BASE_PATH}/otp/verify`, data, config);
    },
    [callApi],
  );
  return { verifyOtpAPI, isLoading, isError, isSuccess };
};

export const useRegisterStudentAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const registerStudentAPI = useCallback(
    async (data: object, config: AxiosRequestConfig = {}) => {
      return callApi<RegisterStudentResponse>(
        `${AUTH_API_BASE_PATH}/register/student`,
        data,
        config,
      );
    },
    [callApi],
  );
  return { registerStudentAPI, isLoading, isError, isSuccess };
};

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

export const useLogoutAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const logoutAPI = useCallback(
    async (data: { refreshToken: string }, config: AxiosRequestConfig = {}) => {
      return callApi(`${AUTH_API_BASE_PATH}/logout`, data, config);
    },
    [callApi],
  );
  return { logoutAPI, isLoading, isError, isSuccess };
};
