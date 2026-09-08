import { Axios } from '@/base-axios';

export interface SchoolItem {
  id: string;
  name: string;
  code: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'ARCHIVED';
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  stateRef?: { id: string; name: string; code?: string } | null;
  districtRef?: { id: string; name: string; code?: string } | null;
  studentCount: number;
  batchCount: number;
  adminCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SchoolsResponse {
  data: SchoolItem[];
  meta: SchoolsPagination;
}

export interface SchoolFilterOptions {
  states: Array<{ id: string; name: string; code: string }>;
  districts: Array<{ id: string; name: string; stateId: string }>;
}

export interface CreateSchoolPayload {
  name: string;
  code: string;
  email?: string;
  phone?: string;
  state?: string;
  city?: string;
  address?: string;
  stateId?: string;
  districtId?: string;
}

export interface BulkUploadPreviewResponse {
  upload: {
    id: string;
    fileName: string;
    status: string;
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    createdAt: string;
  };
  rows: Array<{
    id: string;
    rowNumber: number;
    data: {
      name: string;
      code: string;
      email?: string;
      phone?: string;
      state?: string;
      city?: string;
      address?: string;
    };
    validationStatus: 'VALID' | 'INVALID';
    deduplicationStatus: string;
    errorCount: number;
  }>;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const AdminSchoolsApi = {
  getSchools: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    stateId?: string;
    districtId?: string;
    status?: string;
  }): Promise<SchoolsResponse> => {
    const res = await Axios.get('/admin/schools', { params });
    const payload = res.data;

    // ResponseInterceptor format { success: true, data: [...], meta: {...} }
    if (payload && Array.isArray(payload.data)) {
      return {
        data: payload.data,
        meta: payload.meta || {
          page: params?.page || 1,
          limit: params?.limit || 20,
          total: payload.data.length,
          totalPages: 1,
        },
      };
    }

    // Direct object with nested data
    if (payload?.data && Array.isArray(payload.data.data)) {
      return {
        data: payload.data.data,
        meta: payload.data.meta || {
          page: params?.page || 1,
          limit: params?.limit || 20,
          total: payload.data.data.length,
          totalPages: 1,
        },
      };
    }

    // Direct array
    if (Array.isArray(payload)) {
      return {
        data: payload,
        meta: {
          page: params?.page || 1,
          limit: params?.limit || 20,
          total: payload.length,
          totalPages: 1,
        },
      };
    }

    return payload || { data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  },

  getFilterOptions: async (): Promise<SchoolFilterOptions> => {
    const res = await Axios.get('/admin/schools/filter-options');
    return res.data?.data || res.data;
  },

  createSchool: async (payload: CreateSchoolPayload): Promise<SchoolItem> => {
    const res = await Axios.post('/admin/schools', payload);
    return res.data?.data || res.data;
  },

  getSchoolById: async (id: string): Promise<SchoolItem> => {
    const res = await Axios.get(`/admin/schools/${id}`);
    return res.data?.data || res.data;
  },

  updateSchool: async (id: string, payload: Partial<CreateSchoolPayload>): Promise<SchoolItem> => {
    const res = await Axios.patch(`/admin/schools/${id}`, payload);
    return res.data?.data || res.data;
  },

  updateSchoolStatus: async (id: string, status: string, reason?: string) => {
    const res = await Axios.patch(`/admin/schools/${id}/status`, { status, reason });
    return res.data?.data || res.data;
  },

  downloadTemplate: async (format: 'csv' | 'xlsx' = 'xlsx') => {
    const res = await Axios.get('/admin/schools/bulk-template', {
      params: { format },
      responseType: 'blob',
    });
    const blob = new Blob([res.data], {
      type:
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `brainros_schools_template.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  uploadSchools: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await Axios.post('/admin/schools/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data || res.data;
  },

  getUploadPreview: async (
    uploadId: string,
    page = 1,
    limit = 20,
    filterStatus?: string,
  ): Promise<BulkUploadPreviewResponse> => {
    const res = await Axios.get(`/admin/schools/bulk-upload/${uploadId}/preview`, {
      params: { page, limit, filterStatus },
    });
    return res.data?.data || res.data;
  },

  confirmUpload: async (uploadId: string) => {
    const res = await Axios.post(`/admin/schools/bulk-upload/${uploadId}/confirm`);
    return res.data?.data || res.data;
  },
};

export const adminSchoolsService = AdminSchoolsApi;
