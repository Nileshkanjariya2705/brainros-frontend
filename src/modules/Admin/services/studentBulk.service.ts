import { Axios } from '@/base-axios';

export interface BulkStudentUploadSummary {
  uploadId: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  status: string;
  message: string;
}

export interface BulkStudentRow {
  id: string;
  rowNumber: number;
  data: {
    name?: string;
    mobile?: string;
    email?: string;
    state?: string;
    city?: string;
    class?: string;
    examTarget?: string;
    preferredLanguage?: string;
    schoolCollege?: string;
    [key: string]: any;
  };
  validationStatus: 'VALID' | 'INVALID' | 'PENDING';
  deduplicationStatus: 'UNIQUE' | 'DUPLICATE_IN_FILE' | 'EXISTING_STUDENT' | 'PENDING';
  activationStatus: 'PENDING' | 'ACTIVATED' | 'FAILED';
  activationError?: string;
  matchedStudentId?: string;
  errors: {
    field: string;
    errorCode: string;
    message: string;
  }[];
}

export interface BulkStudentPreviewResponse {
  upload: {
    id: string;
    fileName: string;
    fileType: string;
    rowCount: number;
    validRowCount: number;
    invalidRowCount: number;
    duplicateRowCount: number;
    activatedCount: number;
    failedCount: number;
    status: string;
    createdAt: string;
    processedAt?: string;
    activatedAt?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  rows: BulkStudentRow[];
}

export interface BulkStudentHistoryItem {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  rowCount: number;
  validRowCount: number;
  invalidRowCount: number;
  duplicateRowCount: number;
  activatedCount: number;
  failedCount: number;
  status: string;
  createdAt: string;
  activatedAt?: string;
}

export interface BulkStudentHistoryResponse {
  uploads: BulkStudentHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface BulkRegistrationResult {
  uploadId: string;
  totalValid: number;
  activated: number;
  failed: number;
  status: string;
  message?: string;
}

export const studentBulkService = {
  /**
   * Download registration sample template in CSV or Excel format
   */
  async downloadTemplate(format: 'csv' | 'xlsx' = 'xlsx'): Promise<Blob> {
    const response = await Axios.get(`/admin/students/bulk-template?format=${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Upload CSV or Excel file for staging and initial validation
   */
  async uploadStudents(file: File): Promise<BulkStudentUploadSummary> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await Axios.post('/admin/students/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data?.data || response.data;
  },

  async uploadFile(file: File): Promise<BulkStudentUploadSummary> {
    return this.uploadStudents(file);
  },

  /**
   * Fetch paginated preview of staged rows & validation results
   */
  async getUploadPreview(
    uploadId: string,
    params?: { page?: number; limit?: number; status?: string; search?: string; filterStatus?: 'ALL' | 'VALID' | 'INVALID' },
  ): Promise<BulkStudentPreviewResponse> {
    const response = await Axios.get(`/admin/students/bulk-upload/${uploadId}/preview`, {
      params,
    });
    return response.data?.data || response.data;
  },

  async getPreview(
    uploadId: string,
    params?: { page?: number; limit?: number; status?: string; search?: string; filterStatus?: 'ALL' | 'VALID' | 'INVALID' },
  ): Promise<BulkStudentPreviewResponse> {
    return this.getUploadPreview(uploadId, params);
  },

  /**
   * Fetch upload history
   */
  async getUploadHistory(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<BulkStudentHistoryResponse> {
    const response = await Axios.get('/admin/students/bulk-uploads', {
      params,
    });
    return response.data?.data || response.data;
  },

  /**
   * Confirm and execute student bulk registration
   */
  async confirmRegistration(
    uploadId: string,
  ): Promise<BulkRegistrationResult> {
    const response = await Axios.post(`/admin/students/bulk-upload/${uploadId}/confirm`);
    return response.data?.data || response.data;
  },

  /**
   * Download Error Report for failed rows
   */
  async downloadErrorReport(uploadId: string, format: 'csv' | 'xlsx' = 'xlsx'): Promise<Blob> {
    const response = await Axios.get(
      `/admin/students/bulk-upload/${uploadId}/error-report?format=${format}`,
      {
        responseType: 'blob',
      },
    );
    return response.data;
  },
};

