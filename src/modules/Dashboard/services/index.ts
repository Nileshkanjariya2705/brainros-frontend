// ** Packages **
import type { AxiosRequestConfig } from 'axios';

// ** Custom Hooks **
import { useAxiosGet } from '@/hooks/useAxios';

// ** Types **
export interface DashboardStats {
  totalUsers: number;
  revenue: number;
  activeSessions: number;
}

// Base path for every dashboard endpoint.
const DASHBOARD_API_BASE_PATH = '/dashboard';

export const useGetStatsAPI = () => {
  const [callApi, { isLoading, isError, isSuccess }] = useAxiosGet();
  const getStatsAPI = async (config: AxiosRequestConfig<object> = {}) => {
    return callApi<DashboardStats>(`${DASHBOARD_API_BASE_PATH}/stats`, config);
  };
  return { getStatsAPI, isLoading, isError, isSuccess };
};
