import { useQuery } from '@tanstack/react-query';
import { Axios } from '@/base-axios';

export interface AnalyticsFilterParams {
  dateRange?: string;
  year?: number;
  from?: string;
  to?: string;
  stateId?: string;
  state?: string;
  districtId?: string;
  district?: string;
  institutionId?: string;
  examTargetId?: string;
  languageId?: string;
  salesAgentId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SuperAdminOverviewData {
  totalStudents: number;
  totalRegistrations: number;
  todayRegistrations: number;
  neetRegistrations: number;
  jeeRegistrations: number;
  cetRegistrations: number;
  examTargetStats?: Array<{ id: string; name: string; count: number }>;
  activeStudents: number;
  activePercentage: number;
  examsConducted: number;
  totalAttempts: number;
  completedAttempts: number;
  totalInstitutions: number;
  timestamp: string;
}

export interface DailyRegistrationPoint {
  date: string;
  registrations: number;
  cumulative: number;
}

export interface DailyRegistrationsData {
  timeline: DailyRegistrationPoint[];
  totalRegistrations: number;
  averageDaily: number;
  range: { from: string; to: string };
}

export interface StateRegistrationItem {
  state: string;
  stateId?: string;
  count: number;
  percentage: number;
}

export interface DistrictRegistrationItem {
  district: string;
  state: string;
  count: number;
  percentage: number;
}

export interface InstitutionRegistrationItem {
  institutionId?: string;
  name: string;
  code: string;
  type: string;
  status: string;
  state: string;
  city: string;
  batchCount: number;
  studentCount: number;
}

export interface ExamTargetItem {
  id: string;
  name: string;
  description: string;
  count: number;
  percentage: number;
}

export interface LanguagePreferenceItem {
  id: string;
  name: string;
  code: string;
  nativeName: string;
  count: number;
  percentage: number;
}

export interface MonthlyRevenueItem {
  month: number;
  monthName: string;
  amount: number;
}

export interface RevenueData {
  year?: number;
  totalRevenue?: number;
  revenueTillToday?: number;
  currentMonthRevenue?: number;
  currentMonthName?: string;
  monthlyRevenue?: MonthlyRevenueItem[];
  availableYears?: number[];
  summary: {
    totalRevenue: number;
    currency: string;
    currencySymbol: string;
    successfulTransactions: number;
    pendingTransactions: number;
    failedTransactions: number;
    refundedAmount: number;
    netRevenue: number;
  };
  timeline: { date: string; revenue: number }[];
  products: { name: string; amount: number; count: number }[];
  gateways: { gateway: string; amount: number; percentage: number }[];
}

export interface ConversionRateData {
  funnel: {
    totalRegistered: number;
    attemptedExam: number;
    attemptConversionRate: number;
    purchasedPackage: number;
    payingConversionRate: number;
  };
  salesLeads: {
    totalLeads: number;
    convertedLeads: number;
    leadConversionRate: number;
  };
  formulaUsed: string;
}

export interface SalesAgentPerformanceItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  assignedLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalOrders: number;
  successfulSales: number;
  revenueGenerated: number;
  averageOrderValue: number;
  currency: string;
}

export interface FiltersMetadata {
  states: { id: string; name: string; code: string }[];
  districts: { id: string; name: string; stateId: string }[];
  institutions: { id: string; name: string; code: string }[];
  examTargets: { id: string; name: string }[];
  languages: { id: string; name: string; code: string }[];
  salesAgents: { id: string; name: string }[];
}

export const superAdminKeys = {
  all: ['super-admin'] as const,
  overview: (filters: AnalyticsFilterParams) =>
    [...superAdminKeys.all, 'overview', filters] as const,
  dailyRegistrations: (filters: AnalyticsFilterParams) =>
    [...superAdminKeys.all, 'daily-registrations', filters] as const,
  stateRegistrations: (filters: AnalyticsFilterParams) =>
    [...superAdminKeys.all, 'state-registrations', filters] as const,
  districtRegistrations: (filters: AnalyticsFilterParams) =>
    [...superAdminKeys.all, 'district-registrations', filters] as const,
  institutionRegistrations: (filters: AnalyticsFilterParams) =>
    [...superAdminKeys.all, 'institution-registrations', filters] as const,
  examTargets: (filters: AnalyticsFilterParams) =>
    [...superAdminKeys.all, 'exam-targets', filters] as const,
  languagePreferences: (filters: AnalyticsFilterParams) =>
    [...superAdminKeys.all, 'language-preferences', filters] as const,
  revenue: (filters: AnalyticsFilterParams) => [...superAdminKeys.all, 'revenue', filters] as const,
  conversionRate: (filters: AnalyticsFilterParams) =>
    [...superAdminKeys.all, 'conversion-rate', filters] as const,
  salesAgentPerformance: (filters: AnalyticsFilterParams) =>
    [...superAdminKeys.all, 'sales-agent-performance', filters] as const,
  filtersMetadata: () => [...superAdminKeys.all, 'filters-metadata'] as const,
};

export const useSuperAdminOverviewQuery = (filters: AnalyticsFilterParams = {}) =>
  useQuery({
    queryKey: superAdminKeys.overview(filters),
    queryFn: async () => {
      const res = await Axios.get<{ data: SuperAdminOverviewData } | SuperAdminOverviewData>(
        '/super-admin/dashboard/overview',
        { params: filters },
      );
      return (res.data as any).data || res.data;
    },
  });

export const useSuperAdminDailyRegistrationsQuery = (filters: AnalyticsFilterParams = {}) =>
  useQuery({
    queryKey: superAdminKeys.dailyRegistrations(filters),
    queryFn: async () => {
      const res = await Axios.get<{ data: DailyRegistrationsData } | DailyRegistrationsData>(
        '/super-admin/dashboard/daily-registrations',
        { params: filters },
      );
      return (res.data as any).data || res.data;
    },
  });

export const useSuperAdminStateRegistrationsQuery = (filters: AnalyticsFilterParams = {}) =>
  useQuery({
    queryKey: superAdminKeys.stateRegistrations(filters),
    queryFn: async () => {
      const res = await Axios.get('/super-admin/dashboard/state-registrations', {
        params: filters,
      });
      return res.data;
    },
  });

export const useSuperAdminDistrictRegistrationsQuery = (filters: AnalyticsFilterParams = {}) =>
  useQuery({
    queryKey: superAdminKeys.districtRegistrations(filters),
    queryFn: async () => {
      const res = await Axios.get('/super-admin/dashboard/district-registrations', {
        params: filters,
      });
      return res.data;
    },
  });

export const useSuperAdminInstitutionRegistrationsQuery = (filters: AnalyticsFilterParams = {}) =>
  useQuery({
    queryKey: superAdminKeys.institutionRegistrations(filters),
    queryFn: async () => {
      const res = await Axios.get('/super-admin/dashboard/institution-registrations', {
        params: filters,
      });
      return res.data;
    },
  });

export const useSuperAdminExamTargetsQuery = (filters: AnalyticsFilterParams = {}) =>
  useQuery({
    queryKey: superAdminKeys.examTargets(filters),
    queryFn: async () => {
      const res = await Axios.get<{ data: { targets: ExamTargetItem[]; totalStudents: number } }>(
        '/super-admin/dashboard/exam-targets',
        { params: filters },
      );
      return (res.data as any).data || res.data;
    },
  });

export const useSuperAdminLanguagePreferencesQuery = (filters: AnalyticsFilterParams = {}) =>
  useQuery({
    queryKey: superAdminKeys.languagePreferences(filters),
    queryFn: async () => {
      const res = await Axios.get<{
        data: { languages: LanguagePreferenceItem[]; totalStudents: number };
      }>('/super-admin/dashboard/language-preferences', { params: filters });
      return (res.data as any).data || res.data;
    },
  });

export const useSuperAdminRevenueQuery = (filters: AnalyticsFilterParams = {}) =>
  useQuery({
    queryKey: superAdminKeys.revenue(filters),
    queryFn: async () => {
      const res = await Axios.get<{ data: RevenueData } | RevenueData>(
        '/super-admin/dashboard/revenue',
        { params: filters },
      );
      return (res.data as any).data || res.data;
    },
  });

export const useSuperAdminConversionRateQuery = (filters: AnalyticsFilterParams = {}) =>
  useQuery({
    queryKey: superAdminKeys.conversionRate(filters),
    queryFn: async () => {
      const res = await Axios.get<{ data: ConversionRateData } | ConversionRateData>(
        '/super-admin/dashboard/conversion-rate',
        { params: filters },
      );
      return (res.data as any).data || res.data;
    },
  });

export const useSuperAdminSalesAgentPerformanceQuery = (filters: AnalyticsFilterParams = {}) =>
  useQuery({
    queryKey: superAdminKeys.salesAgentPerformance(filters),
    queryFn: async () => {
      const res = await Axios.get('/super-admin/dashboard/sales-agent-performance', {
        params: filters,
      });
      return (res.data as any).data || res.data;
    },
  });

export const useSuperAdminFiltersMetadataQuery = () =>
  useQuery({
    queryKey: superAdminKeys.filtersMetadata(),
    queryFn: async () => {
      const res = await Axios.get<{ data: FiltersMetadata } | FiltersMetadata>(
        '/super-admin/dashboard/filters-metadata',
      );
      return (res.data as any).data || res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
