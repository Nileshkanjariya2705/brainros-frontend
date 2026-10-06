import Axios from '@/base-axios';

export interface SalesAgentProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  stats: {
    totalVisits: number;
    totalOrders: number;
  };
}

export interface SalesDashboardData {
  kpis: {
    totalVisits: number;
    monthVisits: number;
    totalRevenue: number;
    monthRevenue: number;
    conversionRate: number;
    totalInstitutions: number;
    todayVisitsCount: number;
    monthlyVisitsTarget: number;
    monthlyVisitsCompleted: number;
  };
  revenueTrend: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface TerritoryData {
  states: Array<{ id: string; name: string; code: string }>;
  districts: Array<{ id: string; name: string; stateId: string }>;
  institutions: Array<{
    id: string;
    name: string;
    code: string;
    address?: string;
    city?: string;
    state?: string;
    districtId?: string;
    email?: string;
    phone?: string;
    status: string;
  }>;
}

export const SalesAgentService = {
  getProfile: async (): Promise<SalesAgentProfile> => {
    const res = await Axios.get('/sales-agent/profile');
    return res.data.data;
  },

  updateProfile: async (payload: Partial<SalesAgentProfile>): Promise<SalesAgentProfile> => {
    const res = await Axios.patch('/sales-agent/profile', payload);
    return res.data.data;
  },

  getDashboard: async (): Promise<SalesDashboardData> => {
    const res = await Axios.get('/sales-agent/dashboard');
    return res.data.data;
  },

  getTerritory: async (): Promise<TerritoryData> => {
    const res = await Axios.get('/sales-agent/territory');
    return res.data.data;
  },
};
