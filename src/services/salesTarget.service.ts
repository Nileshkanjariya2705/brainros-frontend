import Axios from '@/base-axios';

export interface TargetMetrics {
  target: number;
  achieved: number;
  progress: number;
}

export interface CurrentTargetData {
  periodKey: string;
  targets: {
    visits: TargetMetrics;
    institutions: TargetMetrics;
    revenue: TargetMetrics;
  };
  overallAttainment: number;
  commissionEarned: number;
}

export interface LeaderboardEntry {
  rank: number;
  agentId: string;
  agentName: string;
  email: string;
  totalVisits?: number;
  totalDeals: number;
  revenue: number;
  attainmentRate: number;
}

export interface SalesTargetRecord {
  id: string;
  salesAgentId: string;
  period: string;
  periodKey: string;
  targetVisits: number;
  achievedVisits: number;
  targetInstitutions: number;
  achievedInstitutions: number;
  targetRevenue: number;
  achievedRevenue: number;
  startDate: string;
  endDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export const SalesTargetService = {
  getCurrentTarget: async (periodKey?: string): Promise<CurrentTargetData> => {
    const res = await Axios.get('/sales-agent/targets/current', {
      params: periodKey ? { periodKey } : {},
    });
    return res.data.data;
  },

  getLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const res = await Axios.get('/sales-agent/targets/leaderboard');
    return res.data.data;
  },

  listTargets: async (params: Record<string, any> = {}): Promise<{ items: SalesTargetRecord[] }> => {
    const res = await Axios.get('/sales-agent/targets', { params });
    return res.data;
  },
};
