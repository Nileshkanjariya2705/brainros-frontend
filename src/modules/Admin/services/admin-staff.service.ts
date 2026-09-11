import Axios from '@/base-axios';

export interface StaffUserItem {
  id: string;
  name: string | null;
  mobileNumber: string;
  email: string | null;
  roles: string[];
  status: string;
  institutionId?: string | null;
  institutionName?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffPayload {
  name: string;
  mobileNumber: string;
  phoneNumber?: string;
  email?: string;
  role: 'OPERATOR' | 'MANAGER' | 'GENERAL_MANAGER' | 'ACCOUNTANT' | 'ADMIN';
}

export interface UpdateStaffPayload {
  name?: string;
  mobileNumber?: string;
  phoneNumber?: string;
  email?: string;
  role?: 'OPERATOR' | 'MANAGER' | 'GENERAL_MANAGER' | 'ACCOUNTANT' | 'ADMIN';
}

export const AdminStaffApi = {
  getStaffList: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) => {
    const res = await Axios.get('/admin/staff', { params });
    return res.data;
  },

  getStaffById: async (id: string) => {
    const res = await Axios.get(`/admin/staff/${id}`);
    return res.data;
  },

  createStaff: async (payload: CreateStaffPayload) => {
    const res = await Axios.post('/admin/staff', payload);
    return res.data;
  },

  updateStaff: async (id: string, payload: UpdateStaffPayload) => {
    const res = await Axios.patch(`/admin/staff/${id}`, payload);
    return res.data;
  },

  updateStaffStatus: async (id: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    const res = await Axios.patch(`/admin/staff/${id}/status`, { status });
    return res.data;
  },

  getSchoolsDropdown: async () => {
    const res = await Axios.get('/billing/schools');
    return res.data;
  },
};
