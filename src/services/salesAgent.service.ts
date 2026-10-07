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
};
