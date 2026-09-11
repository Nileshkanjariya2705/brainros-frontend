import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Receipt,
  Plus,
  Send,
  Download,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Search,
  Eye,
  X,
  Zap,
} from 'lucide-react';
import {
  BillingApi,
  type BillItem,
  type CreateBillPayload,
  type BillStatus,
} from '../services/billing.service';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';
import { toast } from '@/utils/toast';
import { billingKeys } from '@/services/queryKeys';
import { useDebounce } from '@/hooks/useDebounce';
import { ExportPdfButton } from '@/components/export/ExportPdfButton';

const STATUS_CONFIG: Record<
  BillStatus,
  { label: string; badgeColor: string; icon: React.ComponentType<any> }
> = {
  DRAFT: {
    label: 'Draft',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Clock,
  },
  SUBMITTED: {
    label: 'Submitted',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
  },
  PENDING_APPROVAL: {
    label: 'Pending Approval',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Clock,
  },
  APPROVED: {
    label: 'Approved',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Rejected',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
  },
  GENERATED: {
    label: 'Generated',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
  },
  SENT: {
    label: 'Sent',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: CheckCircle2,
  },
  PAID: {
    label: 'Paid',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  OVERDUE: {
    label: 'Overdue',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
  },
};

export const StaffBillsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [statusFilter, setStatusFilter] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');

  // Main View Mode (Invoices vs Schools Directory)
  const [mainTab, setMainTab] = useState<'INVOICES' | 'SCHOOLS'>('INVOICES');
  const [schoolSearch, setSchoolSearch] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingBill, setViewingBill] = useState<BillItem | null>(null);

  // Create Bill Form State
  const [createForm, setCreateForm] = useState<CreateBillPayload>({
    institutionId: '',
    billDate: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    tax: 0,
    submitDirectly: false,
  });

  // Fetch dynamic schools dropdown
  const { data: schoolsData } = useQuery({
    queryKey: billingKeys.schools(),
    queryFn: BillingApi.getSchoolsDropdown,
    staleTime: 5 * 60 * 1000,
  });

  const schools = schoolsData?.data || [];

  const filteredSchoolsList = useMemo(() => {
    if (!schools) return [];
    if (!schoolSearch.trim()) return schools;
    const query = schoolSearch.toLowerCase().trim();
    return schools.filter(
      (s: any) =>
        s.name?.toLowerCase().includes(query) ||
        s.code?.toLowerCase().includes(query) ||
        s.city?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query),
    );
  }, [schools, schoolSearch]);

  const openCreateBillForSchool = (institutionId: string) => {
    setCreateForm({
      institutionId,
      billDate: new Date().toISOString().split('T')[0],
      description: 'Monthly Assessment Platform Service Fee',
      amount: 0,
      tax: 0,
      submitDirectly: false,
    });
    setIsCreateModalOpen(true);
  };

  // Fetch Bills List
  const staffBillsParams = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch.trim() || undefined,
      status: statusFilter || undefined,
      institutionId: schoolFilter || undefined,
    }),
    [page, debouncedSearch, statusFilter, schoolFilter],
  );

  const {
    data: billsData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: billingKeys.invoices(staffBillsParams),
    queryFn: () => BillingApi.getBills(staffBillsParams),
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });

  const bills: BillItem[] = billsData?.data?.items || [];
  const pagination = billsData?.data?.pagination || { total: 0, totalPages: 1 };

  // Create Bill Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateBillPayload) => BillingApi.createBill(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Bill created successfully!');
      queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
      setIsCreateModalOpen(false);
      setCreateForm({
        institutionId: '',
        billDate: new Date().toISOString().split('T')[0],
        description: '',
        amount: 0,
        tax: 0,
        submitDirectly: false,
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create bill.';
      toast.error(msg);
    },
  });

  // Submit Bill to Super Admin Mutation
  const submitMutation = useMutation({
    mutationFn: (id: string) => BillingApi.submitBill(id),
    onSuccess: (res) => {
      toast.success(res.message || 'Bill submitted to Super Admin for approval!');
      queryClient.invalidateQueries({ queryKey: billingKeys.invoices() });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to submit bill.';
      toast.error(msg);
    },
  });

  // Handle PDF Download
  const handleDownloadPdf = async (bill: BillItem) => {
    try {
      toast.info('Preparing invoice PDF...');
      await BillingApi.downloadBillPdf(bill.id, bill.billNumber);
      toast.success('Invoice PDF downloaded!');
    } catch {
      toast.error('Failed to download invoice PDF.');
    }
  };

  // Subtotal + Tax preview calculation
  const subtotal = Number(createForm.amount) || 0;
  const taxAmount = Number(createForm.tax) || 0;
  const calculatedTotal = subtotal + taxAmount;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Receipt size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Institutional Billing
            </h1>
            <p className="text-sm text-slate-500">
              Generate school-specific invoices, submit to Super Admin for approval, and track lifecycle
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </Button>

          <ExportPdfButton
            resource="bills"
            filters={{ status: statusFilter, institutionId: schoolFilter }}
            search={debouncedSearch}
            page={page}
            pageSize={10}
            filename="bills-register.pdf"
          />

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold"
          >
            <Plus size={16} />
            Create Bill
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
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Receipt size={16} />
            Invoices History ({pagination.total})
          </button>
          <button
            type="button"
            onClick={() => setMainTab('SCHOOLS')}
            className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition flex items-center gap-2 ${
              mainTab === 'SCHOOLS'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Building2 size={16} />
            Schools & Colleges Directory ({schools.length})
          </button>
        </div>
        <div className="text-xs text-slate-500 font-medium px-2">
          {mainTab === 'INVOICES'
            ? 'Manage invoices, submit for approval & track statuses'
            : 'Generate invoice individually for any specific school in 1-click'}
        </div>
      </div>

      {mainTab === 'SCHOOLS' ? (
        /* ── Schools & Colleges Directory View ── */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 size={18} className="text-amber-600" />
                Schools & Colleges Directory
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                List of all registered institutions. Click <strong>Generate Invoice</strong> on any row to create an invoice for that specific school.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search school name, code, city..."
                value={schoolSearch}
                onChange={(e) => setSchoolSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">School / College Name</th>
                  <th className="py-3.5 px-4">School Code</th>
                  <th className="py-3.5 px-4">City / Location</th>
                  <th className="py-3.5 px-4">Contact Email</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredSchoolsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No schools found matching search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSchoolsList.map((school: any) => (
                    <tr key={school.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-bold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                            <Building2 size={16} />
                          </div>
                          <span>{school.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-600">
                        {school.code || 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-xs">
                        {school.city || '—'}
                      </td>
                      <td className="py-4 px-4 text-slate-600 text-xs font-mono">
                        {school.email || '—'}
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <Button
                          size="sm"
                          onClick={() => openCreateBillForSchool(school.id)}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 shadow-xs text-xs ml-auto"
                          title={`Generate Invoice for ${school.name}`}
                        >
                          <Zap size={14} />
                          Generate Invoice
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <>
          {/* ── Filter Toolbar ── */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search bill #, school, description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>

        <div>
          <select
            value={schoolFilter}
            onChange={(e) => {
              setSchoolFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
          >
            <option value="">All Schools</option>
            {schools.map((school: any) => (
              <option key={school.id} value={school.id}>
                {school.name} ({school.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* ── Bills Table ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader label="Loading invoices..." />
          </div>
        ) : bills.length === 0 ? (
          <div className="py-16 text-center">
            <Receipt size={44} className="mx-auto text-slate-300 mb-3" />
            <p className="text-base font-medium text-slate-700">No invoices recorded</p>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
              Select a school and click "Create Bill" to draft a new institutional invoice.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Bill Number</th>
                  <th className="py-3.5 px-4">School / Institution</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {bills.map((bill) => {
                  const statusMeta = STATUS_CONFIG[bill.status] || STATUS_CONFIG.DRAFT;
                  const isDraft = bill.status === 'DRAFT';

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-bold text-slate-900 font-mono">
                          {bill.billNumber}
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-xs">
                          {bill.description}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Building2 size={14} className="text-indigo-500" />
                          <span>{bill.institution?.name}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {bill.institution?.code}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-600">
                        {new Date(bill.billDate).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900">
                          ₹{bill.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Subtotal: ₹{bill.amount.toFixed(2)} + Tax: ₹{bill.tax.toFixed(2)}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusMeta.badgeColor}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              bill.status === 'APPROVED'
                                ? 'bg-emerald-500'
                                : bill.status === 'REJECTED'
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                          />
                          {statusMeta.label}
                        </span>
                        {bill.status === 'REJECTED' && bill.rejectionReason && (
                          <p className="text-[11px] text-rose-600 mt-1 max-w-xs truncate">
                            Reason: {bill.rejectionReason}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDraft && (
                            <Button
                              size="sm"
                              onClick={() => submitMutation.mutate(bill.id)}
                              disabled={submitMutation.isPending}
                              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 text-xs py-1 px-2.5"
                              title="Submit to Super Admin"
                            >
                              <Send size={12} />
                              Submit
                            </Button>
                          )}

                          <button
                            type="button"
                            onClick={() => setViewingBill(bill)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Invoice Details"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(bill)}
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => openCreateBillForSchool(bill.institutionId)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title={`Generate invoice for ${bill.institution?.name}`}
                          >
                            <Zap size={16} />
                          </button>
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
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>
              Showing page {page} of {pagination.totalPages} ({pagination.total} total invoices)
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
                disabled={page >= pagination.totalPages}
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

      {/* ── CREATE BILL MODAL ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <Plus size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create New Bill</h2>
                <p className="text-xs text-slate-500">
                  Every bill is strictly tied to a selected institution
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createMutation.mutate(createForm);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select School / Institution *
                </label>
                <select
                  required
                  value={createForm.institutionId}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, institutionId: e.target.value })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                >
                  <option value="">-- Choose School --</option>
                  {schools.map((school: any) => (
                    <option key={school.id} value={school.id}>
                      {school.name} ({school.code}) - {school.city || 'Campus'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Invoice Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={createForm.billDate}
                    onChange={(e) => setCreateForm({ ...createForm, billDate: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Subtotal (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    step="0.01"
                    value={createForm.amount || ''}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, amount: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tax Amount (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={createForm.tax || ''}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, tax: parseFloat(e.target.value) || 0 })
                  }
                  placeholder="0.00"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Description / Purpose *
                </label>
                <textarea
                  required
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="e.g. Assessment exam fees for Batch 2026 Phase 1"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none"
                />
              </div>

              {/* Total Calculation Display */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">Calculated Total:</span>
                <span className="text-base font-bold text-slate-900 font-mono">
                  ₹{calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="submitDirectly"
                  checked={createForm.submitDirectly}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, submitDirectly: e.target.checked })
                  }
                  className="h-4 w-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
                />
                <label htmlFor="submitDirectly" className="text-xs text-slate-700 font-medium">
                  Submit directly to Super Admin for approval (skip draft)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Invoice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW INVOICE MODAL ── */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setViewingBill(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-bold text-lg">
                <Receipt size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Invoice {viewingBill.billNumber}
                </h3>
                <p className="text-xs text-slate-400">
                  School: {viewingBill.institution.name} ({viewingBill.institution.code})
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Bill Date:</span>
                <span className="font-medium text-slate-800">
                  {new Date(viewingBill.billDate).toLocaleDateString('en-IN')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Subtotal:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  ₹{viewingBill.amount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Tax:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  ₹{viewingBill.tax.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60 text-base">
                <span className="font-bold text-slate-700">Total Amount:</span>
                <span className="font-bold text-indigo-700 font-mono">
                  ₹{viewingBill.totalAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Status:</span>
                <span className="font-semibold text-amber-600">{viewingBill.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Created By:</span>
                <span className="font-medium text-slate-800">
                  {viewingBill.createdBy.name || 'Staff User'} ({viewingBill.createdBy.mobileNumber})
                </span>
              </div>
              {viewingBill.approvedBy && (
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500">Approved By:</span>
                  <span className="font-medium text-emerald-700">
                    {viewingBill.approvedBy.name || 'Super Admin'}
                  </span>
                </div>
              )}
              <div className="py-1">
                <span className="text-slate-500 block mb-1">Description:</span>
                <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                  {viewingBill.description}
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownloadPdf(viewingBill)}
                className="flex items-center gap-1.5"
              >
                <Download size={14} />
                Download PDF
              </Button>

              <Button variant="outline" size="sm" onClick={() => setViewingBill(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffBillsPage;
