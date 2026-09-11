import { useQuery } from '@tanstack/react-query';
import { Axios } from '@/base-axios';

export interface SuperAdminRegistrationItem {
  id: string;
  studentId: string;
  studentCode: string;
  name: string;
  email: string;
  mobile: string;
  state: string;
  stateId?: string;
  district: string;
  districtId?: string;
  schoolCollege: string;
  instituteName: string;
  institutions: Array<{
    id: string;
    name: string;
    code: string;
    batchName?: string;
  }>;
  examTarget: {
    id: string;
    name: string;
  } | null;
  status: string;
  createdAt: string;
}

export interface SuperAdminRegistrationsResponse {
  items: SuperAdminRegistrationItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface RegistrationStats {
  totalRegistrations: number;
  todayRegistrations: number;
  neetRegistrations: number;
  jeeRegistrations: number;
  cetRegistrations: number;
  activeRegistrations: number;
  pendingRegistrations: number;
  examTargets: Array<{ id: string; name: string; count: number }>;
}

export interface RegistrationFilterOptions {
  states: Array<{ id: string; name: string; code: string }>;
  districts: Array<{ id: string; name: string; code?: string; stateId: string }>;
  institutions: Array<{ id: string; name: string; code: string; state?: string; type?: string }>;
  examTargets: Array<{ id: string; name: string }>;
  statuses: Array<{ label: string; value: string }>;
}

export interface RegistrationFilterParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  date?: string; // 'all' | 'today' | string
  stateId?: string;
  districtId?: string;
  institutionId?: string;
  examTarget?: string;
  status?: string;
}

export const superAdminRegistrationKeys = {
  all: ['super-admin-registrations'] as const,
  list: (params: RegistrationFilterParams) =>
    [
      'super-admin-registrations',
      {
        page: params.page || 1,
        pageSize: params.pageSize || 20,
        search: params.search || '',
        sortBy: params.sortBy || 'createdAt',
        sortOrder: params.sortOrder || 'desc',
        date: params.date || 'all',
        stateId: params.stateId || '',
        districtId: params.districtId || '',
        institutionId: params.institutionId || '',
        examTarget: params.examTarget || 'ALL',
        status: params.status || 'ALL',
      },
    ] as const,
  stats: (params: Partial<RegistrationFilterParams> = {}) =>
    ['super-admin-registrations-stats', params] as const,
  filters: (stateId?: string) =>
    ['super-admin-registrations-filters', stateId || 'all'] as const,
};

export const useSuperAdminRegistrationsQuery = (
  params: RegistrationFilterParams = {},
) => {
  return useQuery({
    queryKey: superAdminRegistrationKeys.list(params),
    queryFn: async () => {
      const res = await Axios.get<SuperAdminRegistrationsResponse | { data: SuperAdminRegistrationsResponse }>(
        '/super-admin/registrations',
        { params },
      );
      return (res.data as any)?.data || res.data;
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
};

export const useSuperAdminRegistrationStatsQuery = (
  params: Partial<RegistrationFilterParams> = {},
) => {
  return useQuery({
    queryKey: superAdminRegistrationKeys.stats(params),
    queryFn: async () => {
      const res = await Axios.get<RegistrationStats | { data: RegistrationStats }>(
        '/super-admin/registrations/stats',
        { params },
      );
      return (res.data as any)?.data || res.data;
    },
    staleTime: 60 * 1000,
  });
};

export const useSuperAdminRegistrationFiltersQuery = (stateId?: string) => {
  return useQuery({
    queryKey: superAdminRegistrationKeys.filters(stateId),
    queryFn: async () => {
      const res = await Axios.get<RegistrationFilterOptions | { data: RegistrationFilterOptions }>(
        '/super-admin/registrations/filter-options',
        { params: stateId ? { stateId } : undefined },
      );
      return (res.data as any)?.data || res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache for master data
  });
};
