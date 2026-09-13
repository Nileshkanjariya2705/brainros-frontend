import { Axios } from '@/base-axios';
import type { AxiosRequestConfig } from 'axios';
import { useCallback, useState } from 'react';

export interface PublicStudentItem {
  id: string;
  studentId: string;
  studentCode: string;
  name: string;
  email: string;
  mobile: string;
  schoolCollege: string;
  state: { id?: string; name: string; code?: string };
  district: { id?: string; name: string; code?: string };
  class: { id: string; name: string } | null;
  examTarget: { id: string; name: string } | null;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED' | 'ARCHIVED';
  accountStatus: 'ACTIVE' | 'INACTIVE';
  registrationSource: 'PUBLIC' | 'ADMIN' | 'OPERATOR' | 'OTHER';
  createdAt: string;
  totalAttempts?: number;
  totalPayments?: number;
  totalOrders?: number;
}

export interface PublicRegistrationStats {
  totalPublic: number;
  activePublic: number;
  inactivePublic: number;
  todayPublic: number;
  byTarget: {
    NEET: number;
    JEE: number;
    CET: number;
    OTHER: number;
  };
}

export interface PublicRegistrationsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  date?: string;
  stateId?: string;
  districtId?: string;
  institutionId?: string;
  examTarget?: string;
  examTargetId?: string;
  classId?: string;
}

export interface PublicRegistrationsResponse {
  items: PublicStudentItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const BASE_URL = '/super-admin/public-registrations';

/**
 * 1. Fetch Paginated Public Registrations List
 */
export const fetchPublicRegistrationsAPI = async (
  params: PublicRegistrationsQueryParams = {},
): Promise<PublicRegistrationsResponse> => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set('page', String(params.page));
  if (params.pageSize) queryParams.set('pageSize', String(params.pageSize));
  if (params.search) queryParams.set('search', params.search);
  if (params.sortBy) queryParams.set('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.set('sortOrder', params.sortOrder);
  if (params.status && params.status !== 'ALL') queryParams.set('status', params.status);
  if (params.date && params.date !== 'all') queryParams.set('date', params.date);
  if (params.stateId && params.stateId !== 'ALL') queryParams.set('stateId', params.stateId);
  if (params.districtId && params.districtId !== 'ALL') queryParams.set('districtId', params.districtId);
  if (params.institutionId && params.institutionId !== 'ALL') queryParams.set('institutionId', params.institutionId);
  if (params.examTarget && params.examTarget !== 'ALL') queryParams.set('examTarget', params.examTarget);
  if (params.examTargetId && params.examTargetId !== 'ALL') queryParams.set('examTargetId', params.examTargetId);
  if (params.classId && params.classId !== 'ALL') queryParams.set('classId', params.classId);

  const response = await Axios.get(`${BASE_URL}?${queryParams.toString()}`);
  return response.data;
};

/**
 * 2. Fetch Public Registration KPI Stats
 */
export const fetchPublicRegistrationStatsAPI = async (): Promise<PublicRegistrationStats> => {
  const response = await Axios.get(`${BASE_URL}/stats`);
  return response.data;
};

/**
 * 3. Fetch Dynamic Filter Options
 */
export const fetchPublicRegistrationFilterOptionsAPI = async (stateId?: string) => {
  const url = stateId ? `${BASE_URL}/filter-options?stateId=${stateId}` : `${BASE_URL}/filter-options`;
  const response = await Axios.get(url);
  return response.data;
};

/**
 * 4. Fetch Single Public Student Detail
 */
export const fetchPublicStudentByIdAPI = async (studentId: string) => {
  const response = await Axios.get(`${BASE_URL}/${studentId}`);
  return response.data;
};

/**
 * 5. Deactivate Public Student Account
 */
export const deactivatePublicStudentAPI = async (studentId: string, reason?: string) => {
  const response = await Axios.patch(`${BASE_URL}/${studentId}/deactivate`, { reason });
  return response.data;
};

/**
 * 6. Reactivate Public Student Account
 */
export const activatePublicStudentAPI = async (studentId: string) => {
  const response = await Axios.patch(`${BASE_URL}/${studentId}/activate`);
  return response.data;
};

/**
 * Hook for imperative deactivation
 */
export const useDeactivatePublicStudentAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deactivatePublicStudent = useCallback(
    async (studentId: string, reason?: string, config: AxiosRequestConfig = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.patch(
          `${BASE_URL}/${studentId}/deactivate`,
          { reason },
          config,
        );
        return { data: response.data, error: null };
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to deactivate student.';
        setError(msg);
        return { data: null, error: msg };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { deactivatePublicStudent, isLoading, error };
};
