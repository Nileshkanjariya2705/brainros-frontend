import Axios from '@/base-axios';

export interface SalesAgentListItem {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  employeeId?: string | null;
  status: string;
  isActive: boolean;
  totalVisits: number;
  totalOrders: number;
  lastActivityAt?: string | null;
  createdAt: string;
}

export interface SalesAgentDetail {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  employeeId?: string | null;
  address?: string | null;
  profilePhoto?: string | null;
  dateOfJoining?: string | null;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    totalVisits: number;
    visitsToday: number;
    visitsThisMonth: number;
    totalOrders: number;
    totalRevenue: number;
    conversionRate: number;
  };
}

export interface SalesAgentActivityItem {
  id: string;
  type: string;
  title: string;
  description?: string;
  instituteName?: string;
  contactPerson?: string;
  status: string;
  interestLevel?: string;
  followUpDate?: string;
  timestamp: string;
  rawType: string;
  rawId: string;
}

export interface SalesAgentActivityDetail {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  status: string;
  outcome?: string | null;
  purpose?: string | null;
  notes?: string | null;
  requirements?: string | null;
  photos?: string[];
  slipPhoto?: string | null;
  slipUrl?: string | null;
  institute?: {
    name?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    district?: string | null;
    pincode?: string | null;
    contactPerson?: string | null;
    contactPhone?: string | null;
    contactEmail?: string | null;
    contactRole?: string | null;
    estimatedStudentCount?: number | null;
    targetExam?: string | null;
    currentProvider?: string | null;
    painPoints?: string | null;
  };
  visitDetails?: {
    scheduledAt?: string;
    completedAt?: string;
    status?: string;
    outcome?: string | null;
    purpose?: string | null;
    visitType?: string | null;
    interestLevel?: string | null;
    notes?: string | null;
    summary?: string | null;
    keyDiscussionPoints?: string | null;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    slipPhoto?: string | null;
    slipUrl?: string | null;
  };
  location?: {
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    address?: string | null;
  } | null;
  followUp?: {
    nextFollowUpDate?: string | null;
    status?: string | null;
    notes?: string | null;
  } | null;
  audit?: {
    createdAt?: string;
    updatedAt?: string;
    convertedAt?: string | null;
  };
  visit?: {
    id: string;
    institutionName?: string;
    address?: string;
    city?: string;
    state?: string;
    district?: string;
    pincode?: string;
    contactPerson?: string;
    contactPhone?: string;
    contactRole?: string;
    contactEmail?: string;
    visitType?: string;
    interestLevel?: string;
    status: string;
    outcome?: string | null;
    purpose?: string | null;
    notes?: string;
    requirements?: string;
    checkInLatitude?: number | null;
    checkInLongitude?: number | null;
    checkInAccuracy?: number;
    checkInAddress?: string;
    checkInTime?: string;
    checkOutTime?: string;
    photos?: string[];
    slipPhoto?: string | null;
    slipUrl?: string | null;
    followUpDate?: string;
    followUpNotes?: string;
    followUpStatus?: string;
    scheduledAt: string;
    completedAt?: string;
    createdAt: string;
    estimatedStudentCount?: number;
  } | null;
}

export interface CreateSalesAgentPayload {
  name: string;
  mobileNumber: string;
  email?: string;
  employeeId?: string;
  password?: string;
  address?: string;
  dateOfJoining?: string;
}

export interface UpdateSalesAgentPayload {
  name?: string;
  email?: string;
  mobileNumber?: string;
  employeeId?: string;
  address?: string;
  dateOfJoining?: string;
  status?: string;
}

export interface SalesAgentListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SalesAgentActivityParams {
  page?: number;
  limit?: number;
  type?: string;
  status?: string;
  interestLevel?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  state?: string;
  city?: string;
}

export const SuperAdminSalesAgentApi = {
  getSalesAgents: async (params?: SalesAgentListParams) => {
    const res = await Axios.get('/super-admin/sales-agents', { params });
    return res.data;
  },

  getSalesAgentDetail: async (id: string): Promise<{ data: SalesAgentDetail }> => {
    const res = await Axios.get(`/super-admin/sales-agents/${id}`);
    return res.data;
  },

  createSalesAgent: async (payload: CreateSalesAgentPayload) => {
    const res = await Axios.post('/super-admin/sales-agents', payload);
    return res.data;
  },

  updateSalesAgent: async (id: string, payload: UpdateSalesAgentPayload) => {
    const res = await Axios.patch(`/super-admin/sales-agents/${id}`, payload);
    return res.data;
  },

  updateSalesAgentStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    const res = await Axios.patch(`/super-admin/sales-agents/${id}/status`, { status });
    return res.data;
  },

  deleteSalesAgent: async (id: string) => {
    const res = await Axios.delete(`/super-admin/sales-agents/${id}`);
    return res.data;
  },

  getActivities: async (id: string, params?: SalesAgentActivityParams) => {
    const res = await Axios.get(`/super-admin/sales-agents/${id}/activities`, { params });
    return res.data;
  },

  getActivityDetail: async (id: string, activityId: string): Promise<{ data: SalesAgentActivityDetail }> => {
    const res = await Axios.get(`/super-admin/sales-agents/${id}/activities/${activityId}`);
    return res.data;
  },
};
