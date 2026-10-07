import Axios from '@/base-axios';

export interface SalesVisit {
  id: string;
  salesAgentId: string;
  salesAgent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    mobileNumber?: string;
  };
  institutionId?: string | null;
  institutionName: string;
  contactPerson?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  locationAddress?: string | null;
  state?: string | null;
  district?: string | null;
  scheduledAt: string;
  purpose?: string | null;
  notes?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | 'MISSED';
  outcome?: 'INTERESTED' | 'DEMO_REQUESTED' | 'FOLLOW_UP_NEEDED' | 'PROPOSAL_REQUESTED' | 'NOT_INTERESTED' | 'ONBOARDED' | null;
  checkInTime?: string | null;
  checkInLat?: number | null;
  checkInLng?: number | null;
  checkInAddress?: string | null;
  checkInPhotos?: string[];
  checkOutTime?: string | null;
  checkOutLat?: number | null;
  checkOutLng?: number | null;
  checkOutAddress?: string | null;
  checkOutPhotos?: string[];
  photos?: string[];
  slipPhoto?: string | null;
  slipUrl?: string | null;
  summary?: string | null;
  keyDiscussionPoints?: string | null;
  nextFollowUpDate?: string | null;
  estimatedStudentCount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalesVisitPayload {
  institutionName: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  locationAddress?: string;
  state?: string;
  district?: string;
  scheduledAt?: string;
  purpose?: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  photos?: string[];
  slipPhoto?: string;
  slipUrl?: string;
}

export interface CheckInPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  locationAddress?: string;
  photos?: string[];
  notes?: string;
}

export interface CheckOutPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  locationAddress?: string;
  outcome?: string;
  summary?: string;
  keyDiscussionPoints?: string;
  nextFollowUpDate?: string;
  photos?: string[];
  estimatedStudentCount?: number;
}

export interface SalesVisitListResponse {
  items: SalesVisit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const SalesVisitService = {
  listVisits: async (params: Record<string, any> = {}): Promise<SalesVisitListResponse> => {
    const res = await Axios.get('/sales-agent/visits', { params });
    return res.data;
  },

  getVisitById: async (id: string): Promise<SalesVisit> => {
    const res = await Axios.get(`/sales-agent/visits/${id}`);
    return res.data.data;
  },

  scheduleVisit: async (payload: CreateSalesVisitPayload): Promise<SalesVisit> => {
    const res = await Axios.post('/sales-agent/visits', payload);
    return res.data.data;
  },

  checkIn: async (id: string, payload: CheckInPayload): Promise<SalesVisit> => {
    const res = await Axios.post(`/sales-agent/visits/${id}/check-in`, payload);
    return res.data.data;
  },

  checkOut: async (id: string, payload: CheckOutPayload): Promise<SalesVisit> => {
    const res = await Axios.post(`/sales-agent/visits/${id}/check-out`, payload);
    return res.data.data;
  },

  uploadPhoto: async (file: File): Promise<{ url: string; key: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await Axios.post('/sales-agent/visits/upload-photo', formData);
    return res.data.data;
  },
};
