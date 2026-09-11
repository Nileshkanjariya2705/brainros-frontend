import Axios from '@/base-axios';

export type BillStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'GENERATED'
  | 'SENT'
  | 'PAID'
  | 'OVERDUE';

export type EmailDeliveryStatus = 'IDLE' | 'QUEUED' | 'PROCESSING' | 'SENT' | 'FAILED';

export interface BillItem {
  id: string;
  billNumber: string;
  institutionId: string;
  institution: {
    id: string;
    name: string;
    code: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    city?: string | null;
  };
  billDate: string;
  billingMonth?: number | null;
  billingYear?: number | null;
  billingPeriod?: string | null;
  studentCount: number;
  pricePerStudent: number;
  description: string;
  amount: number;
  tax: number;
  totalAmount: number;
  status: BillStatus;
  rejectionReason?: string | null;
  emailStatus: EmailDeliveryStatus;
  emailFailedReason?: string | null;
  createdById: string;
  createdBy: {
    id: string;
    name: string | null;
    mobileNumber: string;
    email: string | null;
    role?: string;
    roles?: string[];
  };
  approvedById?: string | null;
  approvedBy?: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  approvedAt?: string | null;
  sentAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillPayload {
  institutionId: string;
  billDate?: string;
  description: string;
  amount: number;
  tax?: number;
  submitImmediately?: boolean;
  submitDirectly?: boolean;
}

export interface GenerateInvoicePayload {
  institutionId?: string;
  billingMonth: number;
  billingYear: number;
  generateAll?: boolean;
  pricePerStudent?: number;
}

export interface FilterOptionsResponse {
  availableYears: number[];
  months: { month: number; name: string }[];
  schools: { id: string; name: string; code: string; email?: string | null; city?: string | null }[];
  currentPrice: number;
  currentMonth?: number;
  currentYear?: number;
  lastMonth?: number;
  lastMonthYear?: number;
}

export const BillingApi = {
  getBills: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    institutionId?: string;
    month?: number;
    year?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const res = await Axios.get('/billing/bills', { params });
    return res.data;
  },

  getBillById: async (id: string) => {
    const res = await Axios.get(`/billing/bills/${id}`);
    return res.data;
  },

  createBill: async (payload: CreateBillPayload) => {
    const res = await Axios.post('/billing/bills', payload);
    return res.data;
  },

  submitBill: async (id: string) => {
    const res = await Axios.post(`/billing/bills/${id}/submit`);
    return res.data;
  },

  approveBill: async (id: string) => {
    const res = await Axios.post(`/billing/bills/${id}/approve`);
    return res.data;
  },

  rejectBill: async (id: string, reason: string) => {
    const res = await Axios.post(`/billing/bills/${id}/reject`, { reason });
    return res.data;
  },

  sendBillEmail: async (id: string, recipientEmail?: string) => {
    const res = await Axios.post(`/billing/bills/${id}/send`, { recipientEmail });
    return res.data;
  },

  retryBillEmail: async (id: string) => {
    const res = await Axios.post(`/billing/bills/${id}/retry-email`);
    return res.data;
  },

  downloadBillPdf: async (id: string, billNumber: string) => {
    const response = await Axios.get(`/billing/bills/${id}/pdf`, {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Invoice_${billNumber}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  getSchoolsDropdown: async () => {
    const res = await Axios.get('/billing/schools');
    return res.data;
  },

  getPricing: async () => {
    const res = await Axios.get('/billing/pricing');
    return res.data;
  },

  updatePricing: async (pricePerStudent: number) => {
    const res = await Axios.put('/billing/pricing', { pricePerStudent });
    return res.data;
  },

  getFilterOptions: async (): Promise<{ data: FilterOptionsResponse }> => {
    const res = await Axios.get('/billing/filter-options');
    return res.data;
  },

  getInvoicePreview: async (
    institutionId: string,
    month: number,
    year: number,
    pricePerStudent?: number,
  ) => {
    const res = await Axios.get('/billing/invoices/preview', {
      params: {
        institutionId,
        month,
        year,
        ...(pricePerStudent && pricePerStudent > 0 ? { pricePerStudent } : {}),
      },
    });
    return res.data;
  },

  generateInvoice: async (payload: GenerateInvoicePayload) => {
    const res = await Axios.post('/billing/invoices/generate', payload);
    return res.data;
  },

  getTaxConfiguration: async () => {
    const res = await Axios.get('/billing/tax-configuration');
    return res.data;
  },

  updateTaxConfiguration: async (payload: any) => {
    const res = await Axios.put('/billing/tax-configuration', payload);
    return res.data;
  },
};

