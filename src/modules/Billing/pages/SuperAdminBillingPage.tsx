import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Eye,
  Send,
  Download,
  Search,
  RefreshCw,
  Building2,
  X,
  Mail,
  AlertTriangle,
  Check,
  PlusCircle,
  Settings,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Clock,
  Sparkles,
  Info,
  Zap,
  Edit3,
  ChevronDown,
} from 'lucide-react';
import {
  BillingApi,
  type BillItem,
} from '../services/billing.service';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';
import { toast } from '@/utils/toast';
import { useJobProgress } from '@/hooks/useJobProgress';
import { useRole } from '@/modules/Auth/auth-access/useRole';

/* ── Generate All Invoices Button with Integrated Inline Progress ───────────── */
interface GenerateAllInvoicesButtonProps {
  activeJobId: string | null;
  onJobComplete: () => void;
  onGenerate: () => void;
  isPending: boolean;
}

const GenerateAllInvoicesButton: React.FC<GenerateAllInvoicesButtonProps> = ({
  activeJobId,
  onJobComplete,
  onGenerate,
  isPending,
}) => {
  const { percentage, stage, message, isCompleted, isFailed, current, total } = useJobProgress({
    queue: 'bulk-invoices',
    jobId: activeJobId || '',
    enabled: Boolean(activeJobId),
    queryKeyToInvalidate: ['superadmin-invoices'],
  });

  useEffect(() => {
    if (activeJobId && (isCompleted || isFailed)) {
      const timer = setTimeout(() => {
        onJobComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeJobId, isCompleted, isFailed, onJobComplete]);

  const isGenerating = Boolean(activeJobId) && !isCompleted && !isFailed;

  if (isGenerating) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 shadow-md flex items-center min-w-[220px] select-none">
        {/* Animated Fill Bar */}
        <div
          className="absolute inset-0 bg-indigo-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.max(percentage, 8)}%`, opacity: 0.75 }}
        />
        <div className="relative z-10 flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1.5 font-semibold">
            <RefreshCw size={13} className="animate-spin text-white" />
            <span className="truncate max-w-[130px]">{stage || message || 'Generating Invoices...'}</span>
          </div>
          <span className="font-mono font-bold bg-indigo-900/60 px-1.5 py-0.5 rounded text-[11px]">
            {percentage}% {total > 0 ? `(${current}/${total})` : ''}
          </span>
        </div>
      </div>
    );
  }

  if (activeJobId && isCompleted) {
    return (
      <div className="rounded-xl bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 shadow-md flex items-center gap-1.5 animate-in fade-in select-none">
        <CheckCircle2 size={14} />
        <span>Invoices Generated! {total > 0 ? `(${total})` : ''}</span>
      </div>
    );
  }

  if (activeJobId && isFailed) {
    return (
      <div className="rounded-xl bg-rose-600 text-white font-bold text-xs px-3.5 py-2 shadow-md flex items-center gap-1.5 animate-in fade-in select-none">
        <AlertTriangle size={14} />
        <span>Generation Failed</span>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={onGenerate}
      disabled={isPending}
      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-md font-bold px-4 py-2 text-sm"
      title="Generate invoices for all eligible schools for selected month"
    >
      {isPending ? (
        <RefreshCw size={15} className="animate-spin" />
      ) : (
        <Zap size={15} />
      )}
      Generate All Invoices
    </Button>
  );
};

/* ── Send All Invoices Button with Integrated Inline Progress ───────────── */
interface SendAllInvoicesButtonProps {
  activeJobId: string | null;
  onJobComplete: () => void;
  onOpenModal: () => void;
  isPending: boolean;
}

const SendAllInvoicesButton: React.FC<SendAllInvoicesButtonProps> = ({
  activeJobId,
  onJobComplete,
  onOpenModal,
  isPending,
}) => {
  const { percentage, isCompleted, isFailed, current, total } = useJobProgress({
    queue: 'bulk-bill-email',
    jobId: activeJobId || '',
    enabled: Boolean(activeJobId),
    queryKeyToInvalidate: ['superadmin-invoices'],
  });

  useEffect(() => {
    if (activeJobId && (isCompleted || isFailed)) {
      const timer = setTimeout(() => {
        onJobComplete();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeJobId, isCompleted, isFailed, onJobComplete]);

  const isSending = Boolean(activeJobId) && !isCompleted && !isFailed;

  if (isSending) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-blue-700 text-white font-bold text-xs px-3.5 py-2 shadow-md flex items-center min-w-[210px] select-none">
        {/* Animated Fill Bar */}
        <div
          className="absolute inset-0 bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${Math.max(percentage, 8)}%`, opacity: 0.75 }}
        />
        <div className="relative z-10 flex items-center justify-between w-full gap-2">
          <div className="flex items-center gap-1.5 font-semibold">
            <RefreshCw size={13} className="animate-spin text-white" />
            <span>Sending Invoices...</span>
          </div>
          <span className="font-mono font-bold bg-blue-900/60 px-1.5 py-0.5 rounded text-[11px]">
            {percentage}% {total > 0 ? `(${current}/${total})` : ''}
          </span>
        </div>
      </div>
    );
  }

  if (activeJobId && isCompleted) {
    return (
      <div className="rounded-xl bg-emerald-600 text-white font-bold text-xs px-3.5 py-2 shadow-md flex items-center gap-1.5 animate-in fade-in select-none">
        <CheckCircle2 size={14} />
        <span>All Invoices Sent! {total > 0 ? `(${total})` : ''}</span>
      </div>
    );
  }

  if (activeJobId && isFailed) {
    return (
      <div className="rounded-xl bg-rose-600 text-white font-bold text-xs px-3.5 py-2 shadow-md flex items-center gap-1.5 animate-in fade-in select-none">
        <AlertTriangle size={14} />
        <span>Send Incomplete</span>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      onClick={onOpenModal}
      disabled={isPending}
      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 shadow-md font-bold px-4 py-2 text-sm"
      title="Send all generated invoices for selected billing period"
    >
      {isPending ? (
        <RefreshCw size={15} className="animate-spin" />
      ) : (
        <Send size={15} />
      )}
      Send All Invoices
    </Button>
  );
};

export const SuperAdminBillingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { isSuperAdmin, isAccountant, activeRoleMeta } = useRole();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Last completed month calculation
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.getMonth() + 1;
  const lastMonthYear = lastMonthDate.getFullYear();
  const lastMonthName = lastMonthDate.toLocaleString('en-US', { month: 'long' });
  const currentMonthName = now.toLocaleString('en-US', { month: 'long' });

  // Filters State: Default to last month of ALL schools!
  const [selectedMonth, setSelectedMonth] = useState<string>(String(lastMonth));
  const [selectedYear, setSelectedYear] = useState<string>(String(lastMonthYear));
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Single school row generation loading state
  const [generatingSchoolId, setGeneratingSchoolId] = useState<string | null>(null);

  // Main View Mode (Invoices vs Schools Directory)
  const [mainTab, setMainTab] = useState<'INVOICES' | 'SCHOOLS'>('INVOICES');
  const [schoolSearch, setSchoolSearch] = useState<string>('');

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<BillItem | null>(null);
  const [activeBulkJobId, setActiveBulkJobId] = useState<string | null>(null);

  // Legacy approval review state
  const [rejectingBill, setRejectingBill] = useState<BillItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 1. Dynamic Filter Options & Pricing Data
  const { data: filterOptionsRes, refetch: refetchFilterOptions } = useQuery({
    queryKey: ['billing-filter-options'],
    queryFn: BillingApi.getFilterOptions,
  });

  const filterOptions = filterOptionsRes?.data || {
    availableYears: [currentYear - 1, currentYear, currentYear + 1],
    months: [
      { month: 1, name: 'January' },
      { month: 2, name: 'February' },
      { month: 3, name: 'March' },
      { month: 4, name: 'April' },
      { month: 5, name: 'May' },
      { month: 6, name: 'June' },
      { month: 7, name: 'July' },
      { month: 8, name: 'August' },
      { month: 9, name: 'September' },
      { month: 10, name: 'October' },
      { month: 11, name: 'November' },
      { month: 12, name: 'December' },
    ],
    schools: [],
    currentPrice: 300,
  };

  const filteredSchoolsList = useMemo(() => {
    if (!filterOptions.schools) return [];
    if (!schoolSearch.trim()) return filterOptions.schools;
    const query = schoolSearch.toLowerCase().trim();
    return filterOptions.schools.filter(
      (s: any) =>
        s.name?.toLowerCase().includes(query) ||
        s.code?.toLowerCase().includes(query) ||
        s.city?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query),
    );
  }, [filterOptions.schools, schoolSearch]);

  const openGenerateInvoiceForSchool = (schoolId: string) => {
    setGenSchoolId(schoolId);
    setGenMonth(selectedMonth ? Number(selectedMonth) : lastMonth);
    setGenYear(selectedYear ? Number(selectedYear) : lastMonthYear);
    setIsGenerateModalOpen(true);
  };

  const handleGenerateSingleSchoolInvoice = (schoolId: string) => {
    const month = selectedMonth ? Number(selectedMonth) : lastMonth;
    const year = selectedYear ? Number(selectedYear) : lastMonthYear;
    setGeneratingSchoolId(schoolId);
    generateMutation.mutate(
      { institutionId: schoolId, billingMonth: month, billingYear: year },
      {
        onSettled: () => setGeneratingSchoolId(null),
      },
    );
  };

  const handleGenerateAllInvoices = () => {
    const month = selectedMonth ? Number(selectedMonth) : lastMonth;
    const year = selectedYear ? Number(selectedYear) : lastMonthYear;
    generateMutation.mutate({ generateAll: true, billingMonth: month, billingYear: year });
  };

  const currentPricing = filterOptions.currentPrice ?? 300;

  // 2. Fetch Invoices List (Server-side filtering, sorting createdAt DESC, includes unbilled school overview)
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    month: selectedMonth ? Number(selectedMonth) : undefined,
    year: selectedYear ? Number(selectedYear) : undefined,
    institutionId: selectedSchool || undefined,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    search: search.trim() || undefined,
    includeUnbilled: true,
    sortBy: 'createdAt',
    sortOrder: 'desc' as const,
  }), [page, pageSize, selectedMonth, selectedYear, selectedSchool, selectedStatus, search]);

  const {
    data: invoicesData,
    isLoading: isInvoicesLoading,
    isFetching: isInvoicesFetching,
    refetch: refetchInvoices,
  } = useQuery({
    queryKey: ['superadmin-invoices', queryParams],
    queryFn: () => BillingApi.getBills(queryParams),
  });

  const invoices: BillItem[] = invoicesData?.data || [];
  const meta = invoicesData?.meta || { total: 0, pages: 1 };

  // 3. Update Pricing Mutation
  const [newPricingRate, setNewPricingRate] = useState<number>(currentPricing);
  const updatePricingMutation = useMutation({
    mutationFn: (price: number) => BillingApi.updatePricing(price),
    onSuccess: (res) => {
      toast.success(res.message || 'Pricing setting updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['billing-filter-options'] });
      setIsPricingModalOpen(false);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update pricing setting.';
      toast.error(msg);
    },
  });

  // Inline Price Editing State
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>('');

  // Inline Price Mutation with Targeted Cache Update
  const inlinePriceMutation = useMutation({
    mutationFn: ({ schoolId, price }: { schoolId: string; price: number }) =>
      BillingApi.updateSchoolPricing(schoolId, {
        pricePerStudent: price,
        billingMonth: selectedMonth ? Number(selectedMonth) : undefined,
        billingYear: selectedYear ? Number(selectedYear) : undefined,
      }),
    onSuccess: (res, variables) => {
      toast.success(res.message || 'School pricing updated successfully!');
      setEditingSchoolId(null);
      setEditingPriceValue('');

      // Targeted cache update using setQueryData on superadmin-invoices
      queryClient.setQueryData(['superadmin-invoices', queryParams], (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((item: BillItem) => {
            if (item.institution?.id === variables.schoolId) {
              const studentCount = item.studentCount || 0;
              const subtotal = Math.round(studentCount * variables.price * 100) / 100;
              const tax = Math.round(subtotal * 0.18 * 100) / 100;
              return {
                ...item,
                pricePerStudent: variables.price,
                amount: subtotal,
                tax: tax,
                totalAmount: Math.round((subtotal + tax) * 100) / 100,
              };
            }
            return item;
          }),
        };
      });

      queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-filter-options'] });
      queryClient.invalidateQueries({ queryKey: ['school-pricings'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Unable to update price. Please try again.';
      toast.error(msg);
    },
  });

  const startInlineEdit = (schoolId: string, currentPrice: number) => {
    setEditingSchoolId(schoolId);
    setEditingPriceValue(String(currentPrice));
  };

  const cancelInlineEdit = () => {
    setEditingSchoolId(null);
    setEditingPriceValue('');
  };

  const saveInlineEdit = (schoolId: string) => {
    const num = Number(editingPriceValue);
    if (!editingPriceValue || isNaN(num) || num <= 0) {
      toast.error('Please enter a valid price greater than zero.');
      return;
    }
    if (num > 1000000) {
      toast.error('Price cannot exceed ₹10,00,000.');
      return;
    }
    inlinePriceMutation.mutate({ schoolId, price: num });
  };

  // 3.5. Update Invoice Payment Status (Paid / Unpaid)
  const [updatingStatusBillId, setUpdatingStatusBillId] = useState<string | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: ({ billId, status }: { billId: string; status: string }) =>
      BillingApi.updateBillStatus(billId, status),
    onSuccess: (res, variables) => {
      toast.success(res.message || `Status updated to ${variables.status === 'PAID' ? 'Paid' : 'Unpaid'}`);
      setUpdatingStatusBillId(null);
      // Optimistic cache update
      queryClient.setQueryData(['superadmin-invoices', queryParams], (oldData: any) => {
        if (!oldData || !oldData.data) return oldData;
        return {
          ...oldData,
          data: oldData.data.map((b: BillItem) =>
            b.id === variables.billId
              ? { ...b, status: variables.status === 'UNPAID' ? 'GENERATED' : variables.status }
              : b,
          ),
        };
      });
      queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update payment status.');
      setUpdatingStatusBillId(null);
    },
  });

  // 4. Generate Invoice Form State
  const [genSchoolId, setGenSchoolId] = useState<string>('ALL');
  const [genMonth, setGenMonth] = useState<number>(currentMonth);
  const [genYear, setGenYear] = useState<number>(currentYear);

  // Live Preview Query for Single School Generation
  const { data: previewData, isFetching: isPreviewFetching } = useQuery({
    queryKey: ['invoice-preview', genSchoolId, genMonth, genYear],
    queryFn: () => BillingApi.getInvoicePreview(genSchoolId, genMonth, genYear),
    enabled: isGenerateModalOpen && genSchoolId !== 'ALL' && Boolean(genSchoolId),
  });

  const preview = previewData?.data;

  // Generate Invoice Mutation
  const generateMutation = useMutation({
    mutationFn: (payload: {
      institutionId?: string;
      billingMonth: number;
      billingYear: number;
      generateAll?: boolean;
    }) => BillingApi.generateInvoice(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Invoice generation initiated successfully!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-filter-options'] });
      queryClient.invalidateQueries({ queryKey: ['super-admin', 'revenue'] });
      setIsGenerateModalOpen(false);

      if (res.data?.jobId) {
        setActiveBulkJobId(res.data.jobId);
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Unable to generate invoice for this school.';
      toast.error(msg);
    },
  });

  // 5. Send Invoice Email Mutation
  const sendEmailMutation = useMutation({
    mutationFn: (id: string) => BillingApi.sendBillEmail(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Invoice email queued for delivery!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to dispatch invoice email.';
      toast.error(msg);
    },
  });

  // 6. Bulk Send All Invoices Mutation & State
  const [activeBulkSendJobId, setActiveBulkSendJobId] = useState<string | null>(null);
  const [isSendAllModalOpen, setIsSendAllModalOpen] = useState(false);
  const [forceRetrySendAll, setForceRetrySendAll] = useState(false);

  const sendBulkMutation = useMutation({
    mutationFn: (payload: { billingMonth: number; billingYear: number; forceRetryFailed?: boolean }) =>
      BillingApi.sendBulkInvoices(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Bulk invoice email dispatch initiated!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
      setIsSendAllModalOpen(false);
      if (res.data?.jobId) {
        setActiveBulkSendJobId(res.data.jobId);
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to dispatch bulk invoice emails.';
      toast.error(msg);
    },
  });

  // 7. School-Specific Pricing Management & Query
  const [isSchoolPricingModalOpen, setIsSchoolPricingModalOpen] = useState(false);
  const [selectedSchoolForPricing, setSelectedSchoolForPricing] = useState<any | null>(null);
  const [schoolPriceInput, setSchoolPriceInput] = useState<number>(300);
  const [schoolEffectiveFromInput, setSchoolEffectiveFromInput] = useState<string>('');

  const { data: schoolPricingsData, refetch: refetchSchoolPricings } = useQuery({
    queryKey: ['school-pricings'],
    queryFn: BillingApi.getSchoolPricings,
    enabled: mainTab === 'SCHOOLS',
  });

  const schoolPricingsList = schoolPricingsData?.data || [];

  const updateSchoolPricingMutation = useMutation({
    mutationFn: (payload: { institutionId: string; pricePerStudent: number; effectiveFrom?: string }) =>
      BillingApi.updateSchoolPricing(payload.institutionId, {
        pricePerStudent: payload.pricePerStudent,
        effectiveFrom: payload.effectiveFrom || undefined,
      }),
    onSuccess: (res) => {
      toast.success(res.message || 'School pricing updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['school-pricings'] });
      queryClient.invalidateQueries({ queryKey: ['billing-filter-options'] });
      queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
      setIsSchoolPricingModalOpen(false);
      setSelectedSchoolForPricing(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update school pricing.';
      toast.error(msg);
    },
  });

  const openConfigureSchoolPricing = (school: any) => {
    setSelectedSchoolForPricing(school);
    const existingPrice = school.pricePerStudent ?? currentPricing;
    setSchoolPriceInput(existingPrice);
    setSchoolEffectiveFromInput(new Date().toISOString().split('T')[0]);
    setIsSchoolPricingModalOpen(true);
  };

  // 8. Retry Failed Email Mutation
  const retryEmailMutation = useMutation({
    mutationFn: (id: string) => BillingApi.retryBillEmail(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Email delivery retry initiated!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to retry email delivery.';
      toast.error(msg);
    },
  });

  // 7. Download PDF Handler
  const handleDownloadPdf = async (bill: BillItem) => {
    try {
      toast.info('Compiling official invoice PDF...');
      await BillingApi.downloadBillPdf(bill.id, bill.billNumber || 'Invoice');
      toast.success('Invoice PDF downloaded!');
    } catch {
      toast.error('Failed to download invoice PDF.');
    }
  };

  // 8. Legacy Approval Actions (Approve / Reject)
  const approveMutation = useMutation({
    mutationFn: (id: string) => BillingApi.approveBill(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Bill approved successfully!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to approve bill.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      BillingApi.rejectBill(id, reason),
    onSuccess: (res) => {
      toast.success(res.message || 'Bill rejected.');
      queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
      setRejectingBill(null);
      setRejectionReason('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to reject bill.');
    },
  });

  const resetFilters = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setSelectedSchool('');
    setSelectedStatus('ALL');
    setSearch('');
    setPage(1);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      {/* ── 1. Page Header & Pricing Control Card ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-start sm:items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Receipt size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Institutional Invoices
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                {isSuperAdmin ? 'Super Admin' : isAccountant ? 'Accountant' : (activeRoleMeta?.label || 'Staff')}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              School-wise monthly invoice generation, automated student-count billing, PDF downloads & email dispatch
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Generate All Invoices Button with Inline Progress */}
          <GenerateAllInvoicesButton
            activeJobId={activeBulkJobId}
            onJobComplete={() => {
              setActiveBulkJobId(null);
              queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
              queryClient.invalidateQueries({ queryKey: ['billing-filter-options'] });
            }}
            onGenerate={handleGenerateAllInvoices}
            isPending={generateMutation.isPending && !generatingSchoolId}
          />

          {/* Send All Invoices Button with Inline Progress */}
          <SendAllInvoicesButton
            activeJobId={activeBulkSendJobId}
            onJobComplete={() => {
              setActiveBulkSendJobId(null);
              queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
            }}
            onOpenModal={() => setIsSendAllModalOpen(true)}
            isPending={sendBulkMutation.isPending}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchInvoices();
              refetchFilterOptions();
              refetchSchoolPricings();
            }}
            disabled={isInvoicesFetching}
            className="flex items-center gap-1.5"
            title="Refresh Invoices & Options"
          >
            <RefreshCw size={15} className={isInvoicesFetching ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ── Main View Mode Switcher (Invoices vs Schools Directory) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMainTab('INVOICES')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 ${
              mainTab === 'INVOICES'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Receipt size={16} />
            Invoices History ({meta.total})
          </button>
          <button
            type="button"
            onClick={() => setMainTab('SCHOOLS')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 ${
              mainTab === 'SCHOOLS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Building2 size={16} />
            School Pricing & Directory ({filterOptions.schools.length})
          </button>
        </div>
        <div className="text-xs text-slate-500 font-medium px-2">
          {mainTab === 'INVOICES'
            ? 'Manage invoices, statuses, PDF downloads & email dispatches'
            : 'Configure school-specific pricing (₹/student/month) and generate school invoices'}
        </div>
      </div>

      {mainTab === 'SCHOOLS' ? (
        /* ── Schools & Colleges Directory View with School-Wise Pricing ── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-indigo-600" />
                School Pricing & Directory Management
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Every school has its own configurable billing price per student per month. Historical invoices remain strictly immutable.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search school name, code, city..."
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">School / College Name</th>
                  <th className="py-3.5 px-4">School Code</th>
                  <th className="py-3.5 px-4 text-right">Configured Rate</th>
                  <th className="py-3.5 px-4">Pricing Status</th>
                  <th className="py-3.5 px-4">Contact Email</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSchoolsList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No schools found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSchoolsList.map((school: any) => {
                    const pricingDetail = schoolPricingsList.find((p) => p.institutionId === school.id);
                    const rate = pricingDetail ? pricingDetail.pricePerStudent : (school.pricePerStudent ?? currentPricing);
                    const isCustom = pricingDetail ? pricingDetail.isCustom : Boolean(school.isCustomPrice);

                    return (
                      <tr key={school.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">
                          <div className="flex items-center gap-2.5">
                            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                              <Building2 size={16} />
                            </div>
                            <div>
                              <span>{school.name}</span>
                              <div className="text-[11px] text-slate-400 font-normal">
                                {school.city || 'Location not specified'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-600">
                          {school.code || 'N/A'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          {editingSchoolId === school.id ? (
                            <div className="flex items-center justify-end gap-1 min-w-[140px]">
                              <div className="relative w-20">
                                <span className="absolute left-2 top-1.5 text-xs font-bold text-slate-400">₹</span>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={editingPriceValue}
                                  autoFocus
                                  disabled={inlinePriceMutation.isPending}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveInlineEdit(school.id);
                                    if (e.key === 'Escape') cancelInlineEdit();
                                    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                      e.preventDefault();
                                    }
                                  }}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setEditingPriceValue(val);
                                  }}
                                  className="w-full pl-5 pr-1.5 py-1 text-xs font-bold font-mono border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => saveInlineEdit(school.id)}
                                disabled={inlinePriceMutation.isPending}
                                className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                                title="Save Price"
                              >
                                {inlinePriceMutation.isPending ? (
                                  <RefreshCw size={12} className="animate-spin" />
                                ) : (
                                  <Check size={12} />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={cancelInlineEdit}
                                disabled={inlinePriceMutation.isPending}
                                className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition text-xs font-bold"
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5 font-mono">
                              <span className="font-bold text-slate-900">
                                ₹{rate.toLocaleString('en-IN')}
                              </span>
                              <span className="text-[11px] font-normal text-slate-400 font-sans">/ student</span>
                              {(isSuperAdmin || isAccountant) && (
                                <button
                                  type="button"
                                  onClick={() => startInlineEdit(school.id, rate)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                  title="Inline Edit School Price"
                                >
                                  <Edit3 size={13} />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          {isCustom ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 size={12} />
                              Custom Rate
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                              Default (₹{currentPricing})
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-slate-600 text-xs font-mono">
                          {school.email || '—'}
                        </td>
                        <td className="py-4 px-4 sm:px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(isSuperAdmin || isAccountant) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openConfigureSchoolPricing({ ...school, pricePerStudent: rate, isCustom })}
                                className="text-xs font-semibold flex items-center gap-1 text-slate-700 hover:text-indigo-600 hover:border-indigo-300"
                                title="Configure price for this school"
                              >
                                <Settings size={13} />
                                Edit Price
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => openGenerateInvoiceForSchool(school.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 shadow-xs text-xs"
                              title={`Generate Invoice for ${school.name}`}
                            >
                              <Zap size={14} />
                              Generate Invoice
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* ── 2. Filters & Search Bar ── */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
        {/* Quick Period Presets */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Views:</span>
            <button
              type="button"
              onClick={() => {
                setSelectedMonth(String(lastMonth));
                setSelectedYear(String(lastMonthYear));
                setSelectedSchool('');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                selectedMonth === String(lastMonth) && selectedYear === String(lastMonthYear) && !selectedSchool
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calendar size={13} />
              Last Month ({lastMonthName} {lastMonthYear}) — All Schools
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedMonth(String(currentMonth));
                setSelectedYear(String(currentYear));
                setSelectedSchool('');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                selectedMonth === String(currentMonth) && selectedYear === String(currentYear) && !selectedSchool
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Calendar size={13} />
              Current Month ({currentMonthName} {currentYear})
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedMonth('');
                setSelectedYear('');
                setSelectedSchool('');
                setPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                !selectedMonth && !selectedYear && !selectedSchool
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Invoices (All Time)
            </button>
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Filtering Month-wise & Year-wise
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search invoice #, school name, code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
            />
          </div>

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
            >
              <option value="">All Months</option>
              {filterOptions.months.map((m) => (
                <option key={m.month} value={m.month}>
                  {m.name} {m.month === lastMonth && selectedYear === String(lastMonthYear) ? '(Last Month)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
            >
              <option value="">All Years</option>
              {filterOptions.availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          {/* School Filter */}
          <div>
            <select
              value={selectedSchool}
              onChange={(e) => {
                setSelectedSchool(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white font-medium"
            >
              <option value="">All Schools</option>
              {filterOptions.schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Tabs & Active Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { key: 'ALL', label: 'All Invoices' },
              { key: 'GENERATED', label: 'Generated' },
              { key: 'SENT', label: 'Sent' },
              { key: 'PAID', label: 'Paid' },
              { key: 'OVERDUE', label: 'Overdue' },
              { key: 'PENDING_APPROVAL', label: 'Pending Approval' },
              { key: 'APPROVED', label: 'Approved' },
              { key: 'REJECTED', label: 'Rejected' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setSelectedStatus(tab.key);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  selectedStatus === tab.key
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {(selectedMonth || selectedYear || selectedSchool || selectedStatus !== 'ALL' || search) && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1"
            >
              <X size={12} />
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* ── Active Period Summary Banner ── */}
      {(selectedMonth || selectedYear || selectedSchool) && (
        <div className="bg-indigo-50/80 border border-indigo-100/90 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  {selectedMonth
                    ? filterOptions.months.find((m) => m.month === Number(selectedMonth))?.name
                    : 'All Months'}{' '}
                  {selectedYear || ''}
                </span>
                <span className="text-xs font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                  {selectedSchool
                    ? filterOptions.schools.find((s) => s.id === selectedSchool)?.name || 'Selected School'
                    : 'All Schools'}
                </span>
                {selectedMonth === String(lastMonth) && selectedYear === String(lastMonthYear) && !selectedSchool && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                    Last Month
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Displaying invoices matching selected month & year criteria
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-500">Invoices: </span>
              <strong className="font-bold text-slate-900 font-mono">{meta.total}</strong>
            </div>
            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200/80">
              <span className="text-slate-500">Total Billed: </span>
              <strong className="font-bold text-indigo-700 font-mono">
                ₹{invoices.reduce((acc, cur) => acc + Number(cur.totalAmount || 0), 0).toLocaleString('en-IN')}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Invoices Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isInvoicesLoading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader label="Loading invoices..." />
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center">
            <Receipt size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-base font-semibold text-slate-700">
              No invoices found for{' '}
              {selectedMonth
                ? filterOptions.months.find((m) => m.month === Number(selectedMonth))?.name
                : ''}{' '}
              {selectedYear || ''}
            </p>
            <p className="text-sm text-slate-400 max-w-md mx-auto mt-1">
              Invoices have not been generated for this billing period yet. You can generate invoices for all schools with one click below.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="sm"
                onClick={() => {
                  setGenSchoolId('ALL');
                  setGenMonth(selectedMonth ? Number(selectedMonth) : lastMonth);
                  setGenYear(selectedYear ? Number(selectedYear) : lastMonthYear);
                  setIsGenerateModalOpen(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
              >
                <Zap size={15} />
                Generate Invoices for All Schools
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
              >
                View All Invoices
              </Button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Invoice #</th>
                  <th className="py-3.5 px-4">School</th>
                  <th className="py-3.5 px-4">Billing Period</th>
                  <th className="py-3.5 px-4 text-right">Students</th>
                  <th className="py-3.5 px-4 text-right">Price / Student / Month</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Email Delivery</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {invoices.map((bill) => {
                  const isGeneratedOrApproved =
                    bill.status === 'GENERATED' || bill.status === 'APPROVED' || bill.status === 'SENT';
                  const isPending =
                    bill.status === 'PENDING_APPROVAL' || bill.status === 'SUBMITTED';

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Invoice Number */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-bold text-slate-900 font-mono">
                          {bill.billNumber || '—'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {bill.createdAt
                            ? new Date(bill.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Unbilled'}
                        </div>
                      </td>

                      {/* School */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 size={14} className="text-indigo-500 shrink-0" />
                          <span className="truncate max-w-xs">{bill.institution?.name}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {bill.institution?.code}
                          {bill.institution?.city ? ` • ${bill.institution.city}` : ''}
                        </span>
                      </td>

                      {/* Billing Period */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-800 flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          <span>{bill.billingPeriod || 'Custom Period'}</span>
                        </div>
                      </td>

                      {/* Students */}
                      <td className="py-4 px-4 text-right font-semibold text-slate-800 font-mono">
                        {bill.studentCount > 0 ? bill.studentCount.toLocaleString('en-IN') : '—'}
                      </td>

                      {/* Price per student / month */}
                      <td className="py-4 px-4 text-right">
                        {editingSchoolId === bill.institution?.id ? (
                          <div className="flex items-center justify-end gap-1 min-w-[140px]">
                            <div className="relative w-20">
                              <span className="absolute left-2 top-1.5 text-xs font-bold text-slate-400">₹</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={editingPriceValue}
                                autoFocus
                                disabled={inlinePriceMutation.isPending}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveInlineEdit(bill.institution.id);
                                  if (e.key === 'Escape') cancelInlineEdit();
                                  if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                    e.preventDefault();
                                  }
                                }}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  setEditingPriceValue(val);
                                }}
                                className="w-full pl-5 pr-1.5 py-1 text-xs font-bold font-mono border border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => saveInlineEdit(bill.institution.id)}
                              disabled={inlinePriceMutation.isPending}
                              className="p-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition text-xs font-bold disabled:opacity-50 flex items-center gap-1"
                              title="Save Price"
                            >
                              {inlinePriceMutation.isPending ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : (
                                <Check size={12} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={cancelInlineEdit}
                              disabled={inlinePriceMutation.isPending}
                              className="p-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition text-xs font-bold"
                              title="Cancel"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 font-mono">
                            <span className="font-semibold text-slate-800">
                              ₹{(bill.pricePerStudent > 0 ? bill.pricePerStudent : currentPricing).toLocaleString('en-IN')}
                            </span>
                            {(isSuperAdmin || isAccountant) && (
                              <button
                                type="button"
                                onClick={() => startInlineEdit(bill.institution.id, bill.pricePerStudent > 0 ? bill.pricePerStudent : currentPricing)}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                                title="Edit School Price"
                              >
                                <Edit3 size={13} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 text-right">
                        <div className="font-bold text-slate-900 font-mono">
                          ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Invoice Status Dropdown (Paid / Unpaid) */}
                      <td className="py-4 px-4">
                        {bill.status === 'NOT_GENERATED' || bill.isUnbilled ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Not Generated
                          </span>
                        ) : (
                          <div className="relative inline-flex items-center">
                            <select
                              value={bill.status === 'PAID' ? 'PAID' : 'UNPAID'}
                              disabled={updateStatusMutation.isPending && updatingStatusBillId === bill.id}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                setUpdatingStatusBillId(bill.id);
                                updateStatusMutation.mutate({ billId: bill.id, status: newStatus });
                              }}
                              className={`cursor-pointer appearance-none pl-3 pr-7 py-1 rounded-full text-xs font-bold border transition shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                                bill.status === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
                              }`}
                              title="Click to update status (Paid / Unpaid)"
                            >
                              <option value="PAID">Paid</option>
                              <option value="UNPAID">Unpaid</option>
                            </select>
                            <div className="pointer-events-none absolute right-2 flex items-center">
                              {updateStatusMutation.isPending && updatingStatusBillId === bill.id ? (
                                <RefreshCw size={11} className="animate-spin text-slate-500" />
                              ) : (
                                <ChevronDown size={12} className={bill.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'} />
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Email Status */}
                      <td className="py-4 px-4">
                        {bill.status === 'NOT_GENERATED' ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : bill.emailStatus === 'SENT' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            <CheckCircle2 size={12} />
                            Sent
                          </span>
                        ) : bill.emailStatus === 'PROCESSING' || bill.emailStatus === 'QUEUED' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                            <Clock size={12} className="animate-spin" />
                            {bill.emailStatus === 'PROCESSING' ? 'Processing' : 'Queued'}
                          </span>
                        ) : bill.emailStatus === 'FAILED' ? (
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-flex items-center gap-1 text-xs font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100 cursor-help"
                              title={bill.emailFailedReason || 'Email dispatch failed'}
                            >
                              <AlertTriangle size={12} />
                              Failed
                            </span>
                            <button
                              type="button"
                              onClick={() => retryEmailMutation.mutate(bill.id)}
                              disabled={retryEmailMutation.isPending}
                              className="p-1 text-slate-400 hover:text-indigo-600 rounded transition"
                              title="Retry email dispatch"
                            >
                              <RotateCcw size={12} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Not Dispatched</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {bill.status === 'NOT_GENERATED' ? (
                            <Button
                              size="sm"
                              onClick={() => handleGenerateSingleSchoolInvoice(bill.institution.id)}
                              disabled={generatingSchoolId === bill.institution.id || generateMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 text-xs shadow-xs ml-auto"
                              title={`Generate Invoice for ${bill.institution?.name}`}
                            >
                              {generatingSchoolId === bill.institution.id ? (
                                <RefreshCw size={13} className="animate-spin" />
                              ) : (
                                <Zap size={13} />
                              )}
                              Generate Invoice
                            </Button>
                          ) : (
                            <>
                              {/* View Modal Action */}
                              <button
                                type="button"
                                onClick={() => setViewingInvoice(bill)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="View Invoice"
                              >
                                <Eye size={16} />
                              </button>

                              {/* Download PDF Action */}
                              <button
                                type="button"
                                onClick={() => handleDownloadPdf(bill)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Download PDF"
                              >
                                <Download size={16} />
                              </button>

                              {/* Quick Generate Invoice for this School */}
                              <button
                                type="button"
                                onClick={() => openGenerateInvoiceForSchool(bill.institution.id)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                title={`Generate new invoice for ${bill.institution?.name}`}
                              >
                                <Zap size={16} />
                              </button>

                              {/* Send Email Action with Inline Progress */}
                              {isGeneratedOrApproved && (
                                sendEmailMutation.isPending && (sendEmailMutation.variables as string) === bill.id ? (
                                  <div className="w-24 space-y-1 py-1" title="Queuing and sending invoice email...">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-indigo-600">
                                      <span>Sending...</span>
                                      <span className="animate-pulse">50%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-indigo-600 rounded-full animate-pulse w-3/5 transition-all duration-300" />
                                    </div>
                                  </div>
                                ) : bill.emailStatus === 'PROCESSING' || bill.emailStatus === 'QUEUED' ? (
                                  <div className="w-24 space-y-1 py-1" title="Background PDF compilation and email delivery...">
                                    <div className="flex items-center justify-between text-[10px] font-bold text-amber-600">
                                      <span>{bill.emailStatus === 'QUEUED' ? 'Queued' : 'Sending...'}</span>
                                      <span>{bill.emailStatus === 'QUEUED' ? '30%' : '80%'}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-amber-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-amber-500 rounded-full animate-pulse transition-all duration-300"
                                        style={{ width: bill.emailStatus === 'QUEUED' ? '30%' : '80%' }}
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      if (!bill.institution.email) {
                                        toast.error(
                                          `School email is not configured for ${bill.institution.name}.`,
                                        );
                                        return;
                                      }
                                      sendEmailMutation.mutate(bill.id);
                                    }}
                                    className="text-xs py-1 px-2.5 flex items-center gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold"
                                    title="Send Invoice to School via Email"
                                  >
                                    <Mail size={12} />
                                    {bill.emailStatus === 'SENT' ? 'Resend' : 'Send'}
                                  </Button>
                                )
                              )}

                              {/* Legacy Approve/Reject Actions */}
                              {isPending && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => approveMutation.mutate(bill.id)}
                                    disabled={approveMutation.isPending}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1 px-2.5 flex items-center gap-1 font-semibold"
                                    title="Approve Bill"
                                  >
                                    <Check size={12} />
                                    Approve
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setRejectingBill(bill)}
                                    className="border-rose-300 text-rose-700 hover:bg-rose-50 text-xs py-1 px-2.5 flex items-center gap-1"
                                    title="Reject Bill"
                                  >
                                    <X size={12} />
                                    Reject
                                  </Button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {meta.total > 0 && (
          <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-white">
            <div className="flex items-center gap-3">
              <span>
                Showing page {page} of {meta.pages || 1} ({meta.total} total records)
              </span>
              <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                <span className="text-slate-400">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= (meta.pages || 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* ── 4. GENERATE INVOICES MODAL ── */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsGenerateModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                <PlusCircle size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Generate Monthly Invoices</h3>
                <p className="text-xs text-slate-500">
                  Calculates eligible student counts from DB at current rate of ₹{currentPricing}/student
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              {/* Target School Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target School / Institution
                </label>
                <select
                  value={genSchoolId}
                  onChange={(e) => setGenSchoolId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="ALL">All Active Schools (Bulk Generation with Progress)</option>
                  {filterOptions.schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Billing Period Presets in Modal */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Quick Period:</span>
                <button
                  type="button"
                  onClick={() => {
                    setGenMonth(lastMonth);
                    setGenYear(lastMonthYear);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                    genMonth === lastMonth && genYear === lastMonthYear
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Last Month ({lastMonthName} {lastMonthYear})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGenMonth(currentMonth);
                    setGenYear(currentYear);
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                    genMonth === currentMonth && genYear === currentYear
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Current Month ({currentMonthName} {currentYear})
                </button>
              </div>

              {/* Billing Month & Year Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billing Month
                  </label>
                  <select
                    value={genMonth}
                    onChange={(e) => setGenMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    {filterOptions.months.map((m) => (
                      <option key={m.month} value={m.month}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Billing Year
                  </label>
                  <select
                    value={genYear}
                    onChange={(e) => setGenYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                  >
                    {filterOptions.availableYears.map((yr) => (
                      <option key={yr} value={yr}>
                        {yr}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Single School Live Preview Card */}
              {genSchoolId !== 'ALL' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-1 border-b border-slate-200/60">
                    <span>LIVE CALCULATION PREVIEW</span>
                    {isPreviewFetching && <span className="text-indigo-600 animate-pulse">Calculating...</span>}
                  </div>

                  {preview ? (
                    <>
                      <div className="flex justify-between py-0.5 text-xs">
                        <span className="text-slate-600">Eligible Active Students:</span>
                        <span className="font-bold text-slate-900 font-mono">
                          {preview.studentCount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between py-0.5 text-xs">
                        <span className="text-slate-600">Configured Rate per Student:</span>
                        <span className="font-bold text-slate-900 font-mono">
                          ₹{preview.pricePerStudent} <span className="text-[10px] text-slate-400 font-sans font-normal">/ month</span>
                        </span>
                      </div>
                      {(() => {
                        const rate = preview.pricePerStudent;
                        const subtotal = preview.studentCount * rate;
                        const tax = Math.round(subtotal * 0.18 * 100) / 100;
                        const total = Math.round((subtotal + tax) * 100) / 100;
                        return (
                          <>
                            <div className="flex justify-between py-0.5 text-xs text-slate-600">
                              <span>Subtotal:</span>
                              <span className="font-mono">₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between py-0.5 text-xs text-slate-600">
                              <span>GST (18%):</span>
                              <span className="font-mono font-medium text-emerald-700">₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between py-1 border-t border-slate-200 text-sm font-bold">
                              <span className="text-slate-800">Total Invoice Amount:</span>
                              <span className="text-indigo-700 font-mono">
                                ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </>
                        );
                      })()}

                      {preview.alreadyGenerated && (
                        <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-1.5">
                          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                          <span>
                            Invoice for this school and billing period already exists (
                            <strong>{preview.existingInvoice?.billNumber}</strong>). Duplicate monthly invoices are prohibited.
                          </span>
                        </div>
                      )}

                      {preview.studentCount === 0 && (
                        <div className="mt-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-1.5">
                          <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                          <span>
                            This school has 0 eligible active students. Invoice generation requires at least 1 active student.
                          </span>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-2 text-xs text-slate-400 text-center">Loading school details...</div>
                  )}
                </div>
              )}

              {/* Bulk Generation Note */}
              {genSchoolId === 'ALL' && (
                <div className="bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-indigo-800">
                    <Sparkles size={14} />
                    Bulk Asynchronous Generation
                  </div>
                  <p className="text-slate-600">
                    Invoices will be generated across all active schools using each school's dynamic configured rate. Schools with existing invoices for this month or with 0 students will be safely skipped.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setIsGenerateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={
                  generateMutation.isPending ||
                  (genSchoolId !== 'ALL' && (preview?.alreadyGenerated || preview?.studentCount === 0))
                }
                onClick={() =>
                  generateMutation.mutate({
                    institutionId: genSchoolId === 'ALL' ? undefined : genSchoolId,
                    billingMonth: genMonth,
                    billingYear: genYear,
                    generateAll: genSchoolId === 'ALL',
                  })
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {generateMutation.isPending ? 'Generating...' : 'Confirm & Generate'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. CONFIGURE PRICING MODAL ── */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsPricingModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Settings size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Configure Billing Rate</h3>
                <p className="text-xs text-slate-500">
                  Global price per student per month setting
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Price per Student / Month (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newPricingRate || ''}
                    onKeyDown={(e) => {
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setNewPricingRate(val ? Number(val) : 0);
                    }}
                    className="w-full pl-8 pr-4 py-2 text-base font-bold font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1 text-amber-800">
                  <Info size={13} />
                  Historical Invoice Immutability Rule
                </div>
                <p className="text-slate-600">
                  Updating this setting applies <strong>ONLY to newly generated future invoices</strong>. All existing historical invoices remain permanently locked to their stored snapshot price.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setIsPricingModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!newPricingRate || newPricingRate <= 0 || updatePricingMutation.isPending}
                onClick={() => updatePricingMutation.mutate(newPricingRate)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {updatePricingMutation.isPending ? 'Saving...' : 'Save Pricing Setting'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 6. VIEW INVOICE MODAL (Full-Fidelity Brainros Design) ── */}
      {viewingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative my-8 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setViewingInvoice(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={22} />
            </button>

            {/* Official Invoice Header */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-white">BRAINROS</h2>
                <p className="text-xs text-slate-400">Exam Management & Academic Platform</p>
              </div>
              <div className="sm:text-right">
                <span className="text-xs uppercase tracking-widest text-sky-400 font-bold block">
                  Official Invoice
                </span>
                <span className="text-lg font-bold font-mono text-white">
                  {viewingInvoice.billNumber}
                </span>
              </div>
            </div>

            {/* Invoice Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs mb-6">
              <div className="space-y-1">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                  Billed To (School / Institution)
                </span>
                <div className="text-sm font-bold text-slate-900">
                  {viewingInvoice.institution.name}
                </div>
                <div className="text-slate-600 font-mono">
                  Code: {viewingInvoice.institution.code}
                </div>
                {viewingInvoice.institution.email && (
                  <div className="text-slate-600">Email: {viewingInvoice.institution.email}</div>
                )}
                {viewingInvoice.institution.phone && (
                  <div className="text-slate-600">Contact: {viewingInvoice.institution.phone}</div>
                )}
                {viewingInvoice.institution.address && (
                  <div className="text-slate-600">{viewingInvoice.institution.address}</div>
                )}
              </div>

              <div className="space-y-1 sm:text-right">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                  Invoice Summary
                </span>
                <div className="text-sm font-bold text-indigo-700 font-sans">
                  Billing Period: {viewingInvoice.billingPeriod || 'Custom Period'}
                </div>
                <div className="text-slate-600">
                  Invoice Date:{' '}
                  {viewingInvoice.billDate
                    ? new Date(viewingInvoice.billDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Unbilled'}
                </div>
                <div className="text-slate-600">
                  Status: <strong className="text-slate-900">{viewingInvoice.status}</strong>
                </div>
                <div className="text-slate-600">
                  Email Status: <strong className="text-slate-900">{viewingInvoice.emailStatus}</strong>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden mb-6 text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Eligible Students</th>
                    <th className="py-2.5 px-3 text-right">Price / Student</th>
                    <th className="py-2.5 px-3 text-right">Total (INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {viewingInvoice.description || 'Student Platform Subscription'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Institutional Assessment & Analytics
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800">
                      {viewingInvoice.studentCount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      ₹{viewingInvoice.pricePerStudent.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{viewingInvoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Subtotal & Total Block */}
              {(() => {
                const subtotal = viewingInvoice.amount || 0;
                const tax = viewingInvoice.tax > 0 ? viewingInvoice.tax : Math.round(subtotal * 0.18 * 100) / 100;
                const grandTotal = viewingInvoice.tax > 0 && viewingInvoice.totalAmount > subtotal
                  ? viewingInvoice.totalAmount
                  : Math.round((subtotal + tax) * 100) / 100;

                return (
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col items-end gap-1.5 text-xs">
                    <div className="flex justify-between w-56 text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-mono">
                        ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between w-56 text-slate-600">
                      <span>Tax (18% GST):</span>
                      <span className="font-mono font-medium text-emerald-700">
                        ₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between w-56 text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                      <span>Total Amount Due:</span>
                      <span className="text-indigo-700 font-mono">
                        ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPdf(viewingInvoice)}
                className="flex items-center gap-1.5"
              >
                <Download size={14} />
                Download PDF
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={sendEmailMutation.isPending}
                  onClick={() => {
                    if (!viewingInvoice.institution.email) {
                      toast.error(`School email is not configured for ${viewingInvoice.institution.name}.`);
                      return;
                    }
                    sendEmailMutation.mutate(viewingInvoice.id);
                    setViewingInvoice(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                >
                  <Send size={13} />
                  {sendEmailMutation.isPending ? 'Queuing...' : 'Send Invoice Email'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setViewingInvoice(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. REJECT BILL MODAL (Legacy Approval) ── */}
      {rejectingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setRejectingBill(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Reject Bill</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {rejectingBill.billNumber} • {rejectingBill.institution.name}
                </p>
              </div>
            </div>

            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Specify the reason for rejection..."
              className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setRejectingBill(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!rejectionReason.trim() || rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate({
                    id: rejectingBill.id,
                    reason: rejectionReason.trim(),
                  })
                }
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. CONFIGURE SCHOOL-SPECIFIC PRICING MODAL ── */}
      {isSchoolPricingModalOpen && selectedSchoolForPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => {
                setIsSchoolPricingModalOpen(false);
                setSelectedSchoolForPricing(null);
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Building2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Configure School Pricing</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedSchoolForPricing.name} ({selectedSchoolForPricing.code || 'No Code'})
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Custom Price per Student / Month (₹ INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={schoolPriceInput || ''}
                    onKeyDown={(e) => {
                      if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setSchoolPriceInput(val ? Number(val) : 0);
                    }}
                    className="w-full pl-8 pr-4 py-2 text-base font-bold font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Effective From Date
                </label>
                <input
                  type="date"
                  value={schoolEffectiveFromInput}
                  onChange={(e) => setSchoolEffectiveFromInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1 text-amber-800">
                  <Info size={13} />
                  Historical Invoice Immutability Rule
                </div>
                <p className="text-slate-600">
                  Changing this rate applies <strong>strictly to new invoices</strong> generated on or after this date. Past generated invoices permanently preserve their stored pricing snapshot.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsSchoolPricingModalOpen(false);
                  setSelectedSchoolForPricing(null);
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!schoolPriceInput || schoolPriceInput <= 0 || updateSchoolPricingMutation.isPending}
                onClick={() =>
                  updateSchoolPricingMutation.mutate({
                    institutionId: selectedSchoolForPricing.id,
                    pricePerStudent: schoolPriceInput,
                    effectiveFrom: schoolEffectiveFromInput,
                  })
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
              >
                {updateSchoolPricingMutation.isPending ? 'Saving...' : 'Save School Pricing'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── 10. CONFIRM BULK SEND ALL INVOICES MODAL ── */}
      {isSendAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsSendAllModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <Send size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Send All Invoices</h3>
                <p className="text-xs text-slate-500">
                  Dispatch official PDF billing notifications for the selected billing period
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">Target Billing Period:</span>
                  <span className="font-bold font-mono text-indigo-700 text-sm">
                    {filterOptions.months.find((m) => m.month === (selectedMonth ? Number(selectedMonth) : lastMonth))?.name || 'Selected Month'}{' '}
                    {selectedYear || lastMonthYear}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-medium">Selected Scope:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedSchool
                      ? filterOptions.schools.find((s: any) => s.id === selectedSchool)?.name || 'Single School'
                      : 'All Eligible Schools'}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200/80 text-xs text-blue-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-blue-800">
                  <Mail size={13} />
                  Automated Idempotent Delivery System
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                  <li>Invoices are queued through BullMQ background workers and dispatched via Resend.</li>
                  <li>Each school's invoice is sent to its authorized registered billing email.</li>
                  <li>Invoices already successfully sent are skipped to prevent duplicate delivery.</li>
                  <li>Missing email addresses are flagged without halting the rest of the batch.</li>
                </ul>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={forceRetrySendAll}
                  onChange={(e) => setForceRetrySendAll(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Force re-send to schools that failed or already received this period's invoice
                </span>
              </label>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setIsSendAllModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={sendBulkMutation.isPending}
                onClick={() => {
                  setIsSendAllModalOpen(false);
                  sendBulkMutation.mutate({
                    billingMonth: selectedMonth ? Number(selectedMonth) : lastMonth,
                    billingYear: selectedYear ? Number(selectedYear) : lastMonthYear,
                    forceRetryFailed: forceRetrySendAll,
                  });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-md"
              >
                {sendBulkMutation.isPending ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Confirm & Send All Invoices
              </Button>
            </div>
          </div>
        </div>
      )}




    </div>
  );
};

export default SuperAdminBillingPage;
