import React, { useState, useMemo } from 'react';
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
  Activity,
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
} from 'lucide-react';
import {
  BillingApi,
  type BillItem,
} from '../services/billing.service';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';
import { toast } from '@/utils/toast';
import { useJobProgress } from '@/hooks/useJobProgress';

/* ── WebSocket Live Job Progress Modal for Bill Email Dispatch ───────────── */
interface BillEmailProgressModalProps {
  jobId: string;
  billNumber: string;
  onClose: () => void;
}

const BillEmailProgressModal: React.FC<BillEmailProgressModalProps> = ({
  jobId,
  billNumber,
  onClose,
}) => {
  const { percentage, stage, message, status, isCompleted, isFailed } = useJobProgress({
    queue: 'bill-email',
    jobId,
    enabled: Boolean(jobId),
    queryKeyToInvalidate: ['superadmin-invoices'],
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
        <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
          <Activity size={28} className={!isCompleted && !isFailed ? 'animate-pulse' : ''} />
        </div>

        <h3 className="text-lg font-bold text-slate-900">Dispatching Invoice {billNumber}</h3>
        <p className="text-xs text-slate-500 mt-1">
          BullMQ Email Queue + Resend Delivery Worker
        </p>

        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>{stage || status}</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isFailed
                  ? 'bg-rose-500'
                  : isCompleted
                  ? 'bg-emerald-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.max(percentage, 5)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 italic mt-1">{message || 'Processing invoice...'}</p>
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={!isCompleted && !isFailed}
          >
            {isCompleted ? 'Done' : isFailed ? 'Dismiss' : 'Processing...'}
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ── WebSocket Live Progress Modal for Bulk Invoice Generation ───────────── */
interface BulkInvoiceProgressModalProps {
  jobId: string;
  onClose: () => void;
}

const BulkInvoiceProgressModal: React.FC<BulkInvoiceProgressModalProps> = ({ jobId, onClose }) => {
  const { percentage, stage, message, status, isCompleted, isFailed } = useJobProgress({
    queue: 'bulk-invoices',
    jobId,
    enabled: Boolean(jobId),
    queryKeyToInvalidate: ['superadmin-invoices'],
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center">
        <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-4">
          <Activity size={28} className={!isCompleted && !isFailed ? 'animate-pulse' : ''} />
        </div>

        <h3 className="text-lg font-bold text-slate-900">Generating Invoices</h3>
        <p className="text-xs text-slate-500 mt-1">
          BullMQ Worker + Database Student Count Calculation
        </p>

        <div className="mt-5 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>{stage || status}</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isFailed
                  ? 'bg-rose-500'
                  : isCompleted
                  ? 'bg-emerald-500'
                  : 'bg-indigo-600'
              }`}
              style={{ width: `${Math.max(percentage, 5)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 italic mt-1">{message || 'Processing schools...'}</p>
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={!isCompleted && !isFailed}
          >
            {isCompleted ? 'Done' : isFailed ? 'Dismiss' : 'Processing...'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const SuperAdminBillingPage: React.FC = () => {
  const queryClient = useQueryClient();

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
  const [pageSize] = useState<number>(15);

  // Modals state
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<BillItem | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState<BillItem | null>(null);
  const [activeEmailJobId, setActiveEmailJobId] = useState<string | null>(null);
  const [activeEmailBillNumber, setActiveEmailBillNumber] = useState<string>('');
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

  const currentPricing = filterOptions.currentPrice ?? 300;

  // 2. Fetch Invoices List (Server-side filtering, sorting createdAt DESC)
  const queryParams = useMemo(() => ({
    page,
    limit: pageSize,
    month: selectedMonth ? Number(selectedMonth) : undefined,
    year: selectedYear ? Number(selectedYear) : undefined,
    institutionId: selectedSchool || undefined,
    status: selectedStatus === 'ALL' ? undefined : selectedStatus,
    search: search.trim() || undefined,
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

  // 4. Generate Invoice Form State
  const [genSchoolId, setGenSchoolId] = useState<string>('ALL');
  const [genMonth, setGenMonth] = useState<number>(currentMonth);
  const [genYear, setGenYear] = useState<number>(currentYear);

  // Live Preview Query for Single School Generation
  const { data: previewData, isFetching: isPreviewFetching } = useQuery({
    queryKey: ['invoice-preview', genSchoolId, genMonth, genYear],
    queryFn: () =>
      BillingApi.getInvoicePreview(genSchoolId, genMonth, genYear),
    enabled: isGenerateModalOpen && genSchoolId !== 'ALL' && Boolean(genSchoolId),
  });

  const preview = previewData?.data;

  // Generate Invoice Mutation
  const generateMutation = useMutation({
    mutationFn: (payload: { institutionId?: string; billingMonth: number; billingYear: number; generateAll?: boolean }) =>
      BillingApi.generateInvoice(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Invoice generation initiated successfully!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['billing-filter-options'] });
      setIsGenerateModalOpen(false);

      if (res.data?.jobId) {
        setActiveBulkJobId(res.data.jobId);
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to generate invoice.';
      toast.error(msg);
    },
  });

  // 5. Send Invoice Email Mutation
  const sendEmailMutation = useMutation({
    mutationFn: (id: string) => BillingApi.sendBillEmail(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Invoice email queued for delivery!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
      if (res.data?.jobId) {
        setActiveEmailJobId(res.data.jobId);
        setActiveEmailBillNumber(sendingInvoice?.billNumber || '');
      }
      setSendingInvoice(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to dispatch invoice email.';
      toast.error(msg);
    },
  });

  // 6. Retry Failed Email Mutation
  const retryEmailMutation = useMutation({
    mutationFn: (id: string) => BillingApi.retryBillEmail(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Email delivery retry initiated!');
      queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
      if (res.data?.jobId) {
        setActiveEmailJobId(res.data.jobId);
      }
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
      await BillingApi.downloadBillPdf(bill.id, bill.billNumber);
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
                Super Admin
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              School-wise monthly invoice generation, automated student-count billing, PDF downloads & email dispatch
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Configurable Price Card */}
          <div className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100/80 px-4 py-2 rounded-xl border border-slate-200 transition">
            <div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Current Billing Rate
              </div>
              <div className="text-base font-bold text-slate-900 font-mono flex items-center gap-1">
                <span>₹{currentPricing}</span>
                <span className="text-xs font-normal text-slate-500 font-sans">/ student / month</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setNewPricingRate(currentPricing);
                setIsPricingModalOpen(true);
              }}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition border border-transparent hover:border-slate-200"
              title="Configure Billing Rate"
            >
              <Settings size={16} />
            </button>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setGenSchoolId('ALL');
              setGenMonth(lastMonth);
              setGenYear(lastMonthYear);
              setIsGenerateModalOpen(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs font-semibold"
            title={`Generate invoices for all schools for last month (${lastMonthName} ${lastMonthYear})`}
          >
            <Zap size={15} />
            Generate Last Month Invoices
          </Button>

          <Button
            size="sm"
            onClick={() => {
              setGenSchoolId('ALL');
              setGenMonth(currentMonth);
              setGenYear(currentYear);
              setIsGenerateModalOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-xs"
          >
            <PlusCircle size={16} />
            Generate Invoices
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchInvoices();
              refetchFilterOptions();
            }}
            disabled={isInvoicesFetching}
            className="flex items-center gap-1.5"
            title="Refresh Invoices"
          >
            <RefreshCw size={15} className={isInvoicesFetching ? 'animate-spin' : ''} />
            Refresh
          </Button>
        </div>
      </div>

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
                  <th className="py-3.5 px-4 text-right">Price / Student</th>
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
                          {bill.billNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(bill.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
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

                      {/* Price per student */}
                      <td className="py-4 px-4 text-right font-medium text-slate-600 font-mono">
                        ₹{bill.pricePerStudent > 0 ? bill.pricePerStudent.toLocaleString('en-IN') : '300'}
                      </td>

                      {/* Total Amount */}
                      <td className="py-4 px-4 text-right">
                        <div className="font-bold text-slate-900 font-mono">
                          ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      {/* Invoice Status */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            bill.status === 'GENERATED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : bill.status === 'SENT'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : bill.status === 'PAID'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : bill.status === 'OVERDUE'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : bill.status === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : bill.status === 'REJECTED'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              bill.status === 'GENERATED'
                                ? 'bg-blue-500'
                                : bill.status === 'SENT'
                                ? 'bg-indigo-500'
                                : bill.status === 'PAID'
                                ? 'bg-emerald-500'
                                : bill.status === 'OVERDUE'
                                ? 'bg-rose-500'
                                : bill.status === 'APPROVED'
                                ? 'bg-emerald-500'
                                : bill.status === 'REJECTED'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          {bill.status}
                        </span>
                      </td>

                      {/* Email Status */}
                      <td className="py-4 px-4">
                        {bill.emailStatus === 'SENT' ? (
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

                          {/* Send Email Action */}
                          {isGeneratedOrApproved && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSendingInvoice(bill)}
                              disabled={bill.emailStatus === 'PROCESSING' || bill.emailStatus === 'QUEUED'}
                              className="text-xs py-1 px-2.5 flex items-center gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-semibold"
                              title="Send Invoice to School via Email"
                            >
                              <Mail size={12} />
                              {bill.emailStatus === 'SENT' ? 'Resend' : 'Send'}
                            </Button>
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
        {meta.pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-white">
            <span>
              Showing page {page} of {meta.pages} ({meta.total} total records)
            </span>
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
                disabled={page >= meta.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

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
                        <span className="text-slate-600">Rate per Student:</span>
                        <span className="font-medium text-slate-800 font-mono">₹{preview.pricePerStudent}</span>
                      </div>
                      <div className="flex justify-between py-1 border-t border-slate-200 text-sm font-bold">
                        <span className="text-slate-800">Total Invoice Amount:</span>
                        <span className="text-indigo-700 font-mono">
                          ₹{preview.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

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
                    Invoices will be generated across all active schools. Schools with existing invoices for this month or with 0 students will be safely skipped. Progress will be displayed live via WebSocket.
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
                    type="number"
                    min="1"
                    step="1"
                    value={newPricingRate}
                    onChange={(e) => setNewPricingRate(Number(e.target.value))}
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
                  {new Date(viewingInvoice.billDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
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
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col items-end gap-1 text-xs">
                <div className="flex justify-between w-48 text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">
                    ₹{viewingInvoice.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between w-48 text-slate-600">
                  <span>Tax (0%):</span>
                  <span className="font-mono">
                    ₹{viewingInvoice.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between w-56 text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total Amount Due:</span>
                  <span className="text-indigo-700 font-mono">
                    ₹{viewingInvoice.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
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
                  onClick={() => {
                    setSendingInvoice(viewingInvoice);
                    setViewingInvoice(null);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5"
                >
                  <Send size={13} />
                  Send Invoice Email
                </Button>
                <Button variant="outline" size="sm" onClick={() => setViewingInvoice(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. SEND INVOICE EMAIL CONFIRMATION MODAL ── */}
      {sendingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSendingInvoice(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Mail size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Send Invoice by Email</h3>
                <p className="text-xs text-slate-500 font-mono">
                  {sendingInvoice.billNumber} • ₹{sendingInvoice.totalAmount.toFixed(2)}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient School:</span>
                <span className="font-semibold text-slate-800">{sendingInvoice.institution.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Registered Email:</span>
                <span className="font-semibold text-indigo-600 font-mono">
                  {sendingInvoice.institution.email || 'None on record'}
                </span>
              </div>
            </div>

            {!sendingInvoice.institution.email ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 mb-4">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>
                  School email is not configured. Please update the school's profile with a valid email before sending.
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-600 mb-4">
                The invoice PDF will be compiled asynchronously and sent to the school's official registered address via BullMQ + Resend.
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5">
              <Button variant="outline" size="sm" onClick={() => setSendingInvoice(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!sendingInvoice.institution.email || sendEmailMutation.isPending}
                onClick={() => sendEmailMutation.mutate(sendingInvoice.id)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-1.5"
              >
                <Send size={14} />
                {sendEmailMutation.isPending ? 'Queuing...' : 'Queue & Dispatch Email'}
              </Button>
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

      {/* ── 9. LIVE WEBSOCKET PROGRESS MODALS ── */}
      {activeEmailJobId && (
        <BillEmailProgressModal
          jobId={activeEmailJobId}
          billNumber={activeEmailBillNumber}
          onClose={() => {
            setActiveEmailJobId(null);
            queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
          }}
        />
      )}

      {activeBulkJobId && (
        <BulkInvoiceProgressModal
          jobId={activeBulkJobId}
          onClose={() => {
            setActiveBulkJobId(null);
            queryClient.invalidateQueries({ queryKey: ['superadmin-invoices'] });
          }}
        />
      )}
    </div>
  );
};

export default SuperAdminBillingPage;
