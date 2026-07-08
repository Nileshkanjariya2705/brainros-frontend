// ** Packages **
import type { AxiosRequestConfig } from 'axios';

// ** Custom Hooks **
import { useAxiosGet, useAxiosPost } from '@/hooks/useAxios';

// ** Types **
import type { LoginResponse, User } from '../types/auth.types';

// Base path for every auth endpoint — defined once, reused below (repo convention).
const AUTH_API_BASE_PATH = '/auth';

export const useLoginAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const loginAPI = async (data: object, config: AxiosRequestConfig<object> = {}) => {
    return callApi<LoginResponse>(`${AUTH_API_BASE_PATH}/login`, data, config);
  };
  return { loginAPI, isLoading, isError, isSuccess };
};

export const useGetProfileAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosGet();
  const getProfileAPI = async (config: AxiosRequestConfig<object> = {}) => {
    return callApi<User>(`${AUTH_API_BASE_PATH}/me`, config);
  };
  return { getProfileAPI, isLoading, isError, isSuccess };
};

export const useLogoutAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosPost();
  const logoutAPI = async (data: object = {}, config: AxiosRequestConfig<object> = {}) => {
    return callApi(`${AUTH_API_BASE_PATH}/logout`, data, config);
  };
  return { logoutAPI, isLoading, isError, isSuccess };
};
