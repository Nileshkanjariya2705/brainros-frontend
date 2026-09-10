import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  Clock,
  HelpCircle,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  Building2,
  Users,
  Layers,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  UserCheck,
  Languages,
  BookOpen,
} from 'lucide-react';
import { Axios } from '@/base-axios';
import { API_URL } from '@config';
import { io, Socket } from 'socket.io-client';

export interface QueueTypeOption {
  key: string;
  label: string;
  resourceType: string;
  pendingCount: number;
}

export interface ApprovalRequestItem {
  id: string;
  resourceType: string;
  resourceId: string;
  requestedById: string;
  requestedByName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  metadata?: Record<string, any>;
  entitySummary?: any;
  rejectionReason?: string;
  reviewComment?: string;
  submittedAt?: string;
  createdAt: string;
  reviewedAt?: string;
}

export const AdminApprovalQueuePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const routePrefix = location.pathname.startsWith('/super-admin')
    ? '/super-admin'
    : '/admin';

  // State
  const [selectedQueue, setSelectedQueue] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [page, setPage] = useState<number>(1);
  const pageSize = 15;

  // Selection & Modals
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [approvingItem, setApprovingItem] = useState<ApprovalRequestItem | null>(null);
  const [rejectingItem, setRejectingItem] = useState<ApprovalRequestItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ApprovalRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when queue or status filter changes
  useEffect(() => {
    setPage(1);
    setSelectedIds([]);
  }, [selectedQueue, statusFilter]);

  // ── 1. Fetch Dynamic Queue Types & Live Counts ─────────────────────────────
  const {
    data: queueTypesData,
    refetch: refetchQueueTypes,
  } = useQuery<{ queueTypes: QueueTypeOption[]; totalPending: number }>({
    queryKey: ['approval-queue-types'],
    queryFn: async () => {
      try {
        const res = await Axios.get('/admin/approvals/queue-types');
        return res.data;
      } catch {
        // Fallback default structure
        return {
          queueTypes: [
            { key: 'ALL', label: 'All Requests', resourceType: 'ALL', pendingCount: 0 },
            { key: 'STUDENT_REGISTRATION', label: 'Student Registration', resourceType: 'BULK_UPLOAD', pendingCount: 0 },
            { key: 'SCHOOL_REGISTRATION', label: 'School Registration', resourceType: 'INSTITUTION', pendingCount: 0 },
            { key: 'EXAM', label: 'Live Exams & Mocks', resourceType: 'EXAM', pendingCount: 0 },
            { key: 'QUESTION', label: 'Question Bank', resourceType: 'QUESTION', pendingCount: 0 },
            { key: 'TRANSLATION', label: 'Translations', resourceType: 'QUESTION_TRANSLATION', pendingCount: 0 },
            { key: 'BILL', label: 'Bills & Invoices', resourceType: 'BILL', pendingCount: 0 },
            { key: 'STAFF_UPDATE', label: 'Staff Updates', resourceType: 'STAFF_UPDATE', pendingCount: 0 },
          ],
          totalPending: 0,
        };
      }
    },
    staleTime: 10000,
  });

  // ── 2. Fetch Approval Items with Server-Side React Query ───────────────────
  const queryParams = {
    queueType: selectedQueue,
    page,
    pageSize,
    search: debouncedSearch,
    status: statusFilter,
    sortBy,
    sortOrder,
  };

  const {
    data: queueResponse,
    isLoading: isLoadingItems,
    isFetching: isFetchingItems,
    refetch: refetchItems,
  } = useQuery<{ data: ApprovalRequestItem[]; meta: { total: number; page: number; limit: number; pages: number } }>({
    queryKey: ['approval-queue', queryParams],
    queryFn: async () => {
      const params: any = {
        page,
        limit: pageSize,
        sortBy,
        sortOrder,
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (selectedQueue !== 'ALL') params.entityType = selectedQueue;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const res = await Axios.get('/admin/approvals', { params });
      const raw = res.data;
      if (Array.isArray(raw)) {
        return {
          data: raw,
          meta: { total: raw.length, page: 1, limit: pageSize, pages: 1 },
        };
      }
      return {
        data: raw.data || [],
        meta: raw.meta || { total: (raw.data || []).length, page, limit: pageSize, pages: 1 },
      };
    },
    staleTime: 5000,
  });

  const requests = queueResponse?.data || [];
  const meta = queueResponse?.meta || { total: 0, page: 1, limit: pageSize, pages: 1 };
  const queueTypes = queueTypesData?.queueTypes || [];

  // ── 3. WebSocket Real-Time Listener for Invalidation ────────────────────────
  useEffect(() => {
    const wsUrl = API_URL ? API_URL.replace(/^http/, 'ws') : 'http://localhost:3000';
    let socket: Socket | null = null;
    try {
      socket = io(wsUrl, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
      });

      socket.on('approval-updated', () => {
        queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
        queryClient.invalidateQueries({ queryKey: ['approval-queue-types'] });
      });

      socket.on('notification', (data: any) => {
        if (data?.type?.includes('APPROVAL') || data?.type?.includes('QUEUE')) {
          queryClient.invalidateQueries({ queryKey: ['approval-queue'] });
          queryClient.invalidateQueries({ queryKey: ['approval-queue-types'] });
        }
      });
    } catch {
      // socket fallback
    }

    return () => {
      if (socket) socket.disconnect();
    };
  }, [queryClient]);

  // ── 4. Approval Actions with Targeted React Query Invalidation ─────────────
  const invalidateQueueData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['approval-queue'] }),
      queryClient.invalidateQueries({ queryKey: ['approval-queue-types'] }),
    ]);
  };

  const handleApproveConfirm = async (item: ApprovalRequestItem) => {
    try {
      setProcessing(true);
      setActionError(null);
      const isMock = item.resourceType === 'MOCK_TEST' || item.entitySummary?.isMock;
      const comment = isMock
        ? 'Mock test approved and published to students by Super Admin.'
        : `${item.resourceType} approved and processed by Super Admin.`;

      await Axios.post(`/admin/approvals/${item.id}/approve`, { comment });
      setApprovingItem(null);
      await invalidateQueueData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Approval failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem || !rejectionReason.trim()) return;

    try {
      setProcessing(true);
      setActionError(null);
      await Axios.post(`/admin/approvals/${rejectingItem.id}/reject`, {
        reason: rejectionReason,
      });
      setRejectingItem(null);
      setRejectionReason('');
      await invalidateQueueData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Rejection failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    try {
      setProcessing(true);
      setActionError(null);
      await Axios.post('/admin/approvals/bulk-approve', {
        approvalRequestIds: selectedIds,
        comment: 'Bulk approved by Super Admin',
      });
      setSelectedIds([]);
      await invalidateQueueData();
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Bulk approval failed');
    } finally {
      setProcessing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === requests.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(requests.map((r) => r.id));
    }
  };

  // ── Helper to resolve icon & label for queue types ─────────────────────────
  const getQueueIcon = (type: string) => {
    switch (type) {
      case 'BULK_UPLOAD':
      case 'STUDENT_REGISTRATION':
        return <Users className="h-4 w-4 text-sky-600" />;
      case 'INSTITUTION':
      case 'SCHOOL_REGISTRATION':
        return <Building2 className="h-4 w-4 text-emerald-600" />;
      case 'EXAM':
      case 'MOCK_TEST':
      case 'MOCK':
        return <BookOpen className="h-4 w-4 text-indigo-600" />;
      case 'QUESTION':
        return <HelpCircle className="h-4 w-4 text-purple-600" />;
      case 'QUESTION_TRANSLATION':
      case 'TRANSLATION':
        return <Languages className="h-4 w-4 text-amber-600" />;
      case 'BILL':
      case 'BILLING':
        return <DollarSign className="h-4 w-4 text-teal-600" />;
      case 'STAFF_UPDATE':
        return <UserCheck className="h-4 w-4 text-rose-600" />;
      default:
        return <Layers className="h-4 w-4 text-slate-600" />;
    }
  };

  const getFriendlyTypeName = (resourceType: string, isMock?: boolean) => {
    if (isMock || resourceType === 'MOCK_TEST') return 'Mock Test';
    switch (resourceType) {
      case 'BULK_UPLOAD':
        return 'Student Registration';
      case 'INSTITUTION':
        return 'School Onboarding';
      case 'EXAM':
        return 'Live Exam';
      case 'QUESTION':
        return 'Question Bank';
      case 'QUESTION_TRANSLATION':
      case 'TRANSLATION':
        return 'Translation';
      case 'BILL':
      case 'BILLING':
        return 'Bill & Invoice';
      case 'STAFF_UPDATE':
        return 'Staff Update';
      default:
        return resourceType;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ── 1. Page Header (Visible during section loading) ────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-500/20 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Central Governance & Approval Queue</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Central Approval Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Single unified approval workspace for Student Registrations, School Onboarding, Exams, Questions, Translations, and Invoices.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              refetchQueueTypes();
              refetchItems();
            }}
            disabled={isFetchingItems}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetchingItems ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-bold text-rose-800 animate-in fade-in">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {/* ── 2. Queue Type Selector & Dynamic Badges ────────────────────────── */}
      <div className="space-y-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-600" />
            <label htmlFor="queue-type-selector" className="text-xs font-black uppercase tracking-wider text-slate-700">
              Queue Type:
            </label>
          </div>

          {/* Quick Dropdown on Mobile / Small screens */}
          <div className="sm:hidden">
            <select
              id="queue-type-selector"
              value={selectedQueue}
              onChange={(e) => setSelectedQueue(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-hidden"
            >
              {queueTypes.map((q) => (
                <option key={q.key} value={q.key}>
                  {q.label} {q.pendingCount > 0 ? `(${q.pendingCount})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Queue Chips on Desktop / Tablet */}
        <div className="hidden sm:flex flex-wrap gap-2 pt-1">
          {queueTypes.map((q) => {
            const isSelected = selectedQueue === q.key;
            return (
              <button
                key={q.key}
                type="button"
                onClick={() => setSelectedQueue(q.key)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                    : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{q.label}</span>
                {q.pendingCount > 0 && (
                  <span
                    className={`inline-flex items-center justify-center rounded-full px-2 py-0.2 text-[10px] font-black ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {q.pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Filters, Search, Sorting & Status Bar ───────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search queue by title, ID, or submitter..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-hidden transition"
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-indigo-600 focus:outline-hidden"
            >
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
              <option value="ALL">ALL STATUSES</option>
            </select>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Sort:</span>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(dir as 'asc' | 'desc');
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-indigo-600 focus:outline-hidden"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 4. Bulk Action Bar ─────────────────────────────────────────────── */}
      {selectedIds.length > 0 && statusFilter === 'PENDING' && (
        <div className="flex items-center justify-between rounded-2xl bg-indigo-900 p-4 text-white shadow-lg animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <span className="text-xs sm:text-sm font-bold">
              {selectedIds.length} item(s) selected for bulk approval
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:text-white"
            >
              Deselect All
            </button>
            <button
              onClick={handleBulkApprove}
              disabled={processing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 shadow-xs hover:bg-emerald-400 disabled:opacity-50 transition"
            >
              <Check className="h-4 w-4" /> Bulk Approve Selected
            </button>
          </div>
        </div>
      )}

      {/* ── 5. Main Queue List Section (Section-Level Loading) ─────────────── */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs min-h-[300px]">
        {isLoadingItems ? (
          <div className="space-y-4 py-8">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400">
              <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
              <span>Loading approval records for selected queue...</span>
            </div>
            {/* Skeleton rows */}
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-16 w-full rounded-2xl bg-slate-50 animate-pulse border border-slate-100" />
            ))}
          </div>
        ) : requests.length === 0 ? (
          /* Empty State Requirement 17 */
          <div className="py-16 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Layers className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {statusFilter === 'PENDING'
                ? 'No pending items in this queue.'
                : 'No approval requests match the current filters.'}
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Approval submissions from admins, schools, and staff members will appear here for governance review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {statusFilter === 'PENDING' && (
                    <th className="pb-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === requests.length && requests.length > 0}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                  )}
                  <th className="pb-3 font-black">Queue Type</th>
                  <th className="pb-3 font-black">Item & Details</th>
                  <th className="pb-3 font-black">Submitted By</th>
                  <th className="pb-3 font-black">Status</th>
                  <th className="pb-3 font-black">Submitted At</th>
                  <th className="pb-3 font-black text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((item) => {
                  const isMock = item.resourceType === 'MOCK_TEST' || item.entitySummary?.isMock;
                  const friendlyType = getFriendlyTypeName(item.resourceType, isMock);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {statusFilter === 'PENDING' && (
                        <td className="py-4 align-top">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                      )}

                      {/* Queue Type Tag */}
                      <td className="py-4 align-top">
                        <div className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200/60 px-2.5 py-1 text-xs font-bold text-slate-800">
                          {getQueueIcon(item.resourceType)}
                          <span>{friendlyType}</span>
                        </div>
                      </td>

                      {/* Item Details */}
                      <td className="py-4 align-top max-w-xs sm:max-w-md">
                        <div className="space-y-1">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">
                            {item.entitySummary?.title || item.resourceId}
                          </p>

                          {/* Dynamic summary badges based on entity type */}
                          {item.entitySummary && (
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                              {item.entitySummary.totalQuestions > 0 && (
                                <span className="inline-flex items-center gap-1 font-semibold">
                                  <HelpCircle className="h-3 w-3 text-indigo-500" />
                                  {item.entitySummary.totalQuestions} Questions
                                </span>
                              )}
                              {item.entitySummary.durationMinutes > 0 && (
                                <span className="inline-flex items-center gap-1 font-semibold">
                                  <Clock className="h-3 w-3 text-slate-400" />
                                  {item.entitySummary.durationMinutes} mins
                                </span>
                              )}
                              {item.entitySummary.validRowCount !== undefined && (
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  {item.entitySummary.validRowCount} Candidates
                                </span>
                              )}
                              {item.entitySummary.schoolName && (
                                <span className="inline-flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                  <Building2 className="h-3 w-3 text-slate-500" />
                                  {item.entitySummary.schoolName}
                                </span>
                              )}
                              {item.entitySummary.city && item.entitySummary.state && (
                                <span className="font-semibold text-slate-500">
                                  {item.entitySummary.city}, {item.entitySummary.state}
                                </span>
                              )}
                              {item.entitySummary.totalAmount !== undefined && (
                                <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                  ₹{Number(item.entitySummary.totalAmount).toLocaleString()}
                                </span>
                              )}
                              {item.entitySummary.targetExam && (
                                <span className="rounded bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                                  {item.entitySummary.targetExam}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Submitted By */}
                      <td className="py-4 align-top text-xs font-semibold text-slate-700">
                        {item.requestedByName || 'Staff Member'}
                      </td>

                      {/* Status */}
                      <td className="py-4 align-top">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                            item.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : item.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>

                      {/* Submitted At */}
                      <td className="py-4 align-top text-xs font-semibold text-slate-400">
                        {new Date(item.submittedAt || item.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Actions: View, Approve, Reject */}
                      <td className="py-4 align-top text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {/* View Action (Requirement 11 & 12) */}
                          <button
                            onClick={() => setViewingItem(item)}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50 transition"
                            title="View Full Item Details"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-500" />
                            <span>View</span>
                          </button>

                          {item.status === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => setApprovingItem(item)}
                                disabled={processing}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 disabled:opacity-50 transition"
                              >
                                <Check className="h-3.5 w-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => setRejectingItem(item)}
                                disabled={processing}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-rose-500 disabled:opacity-50 transition"
                              >
                                <X className="h-3.5 w-3.5" /> Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold px-2">
                              {item.status === 'REJECTED' && item.rejectionReason
                                ? `Reason: ${item.rejectionReason}`
                                : 'Resolved'}
                            </span>
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

        {/* ── 6. Server-Side Pagination Controls ─────────────────────────── */}
        {meta.pages > 1 && (
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs font-bold text-slate-600">
            <div>
              Showing page {meta.page} of {meta.pages} ({meta.total} total items)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoadingItems}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <span className="px-2">{page} / {meta.pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(meta.pages, p + 1))}
                disabled={page >= meta.pages || isLoadingItems}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-xs hover:bg-slate-50 disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL 1: VIEW DETAILS MODAL ─────────────────────────────────────── */}
      {viewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  {getQueueIcon(viewingItem.resourceType)}
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {getFriendlyTypeName(viewingItem.resourceType, viewingItem.entitySummary?.isMock)} Request
                  </h3>
                  <p className="text-[11px] font-mono text-slate-400">ID: {viewingItem.id}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Title / Resource:</span>
                <span className="font-bold text-slate-900 text-right">{viewingItem.entitySummary?.title || viewingItem.resourceId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Resource Type:</span>
                <span className="font-mono text-slate-700">{viewingItem.resourceType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Submitted By:</span>
                <span className="font-bold text-slate-800">{viewingItem.requestedByName || 'Staff'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Submitted Date:</span>
                <span className="text-slate-700">
                  {new Date(viewingItem.submittedAt || viewingItem.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-bold">Current Status:</span>
                <span className="font-bold text-indigo-700">{viewingItem.status}</span>
              </div>

              {viewingItem.metadata && Object.keys(viewingItem.metadata).length > 0 && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-slate-400 font-bold block mb-1">Attached Metadata:</span>
                  <pre className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] font-mono text-slate-700 overflow-x-auto max-h-36">
                    {JSON.stringify(viewingItem.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              {/* Navigate to detail page if appropriate */}
              <div>
                {(viewingItem.resourceType === 'BULK_UPLOAD' || viewingItem.resourceType === 'STUDENT_REGISTRATION') && (
                  <button
                    onClick={() => navigate(`${routePrefix}/students/bulk-register`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Open Student Directory <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                {viewingItem.resourceType === 'INSTITUTION' && (
                  <button
                    onClick={() => navigate(`${routePrefix}/schools`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Open Schools Page <ArrowRight className="h-3 w-3" />
                  </button>
                )}
                {(viewingItem.resourceType === 'EXAM' || viewingItem.resourceType === 'MOCK_TEST') && (
                  <button
                    onClick={() => navigate(`${routePrefix}/exam-scheduling`)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    Open Exam Scheduler <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setViewingItem(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                {viewingItem.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const it = viewingItem;
                        setViewingItem(null);
                        setRejectingItem(it);
                      }}
                      className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-rose-500"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const it = viewingItem;
                        setViewingItem(null);
                        setApprovingItem(it);
                      }}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: APPROVE CONFIRMATION MODAL ─────────────────────────────── */}
      {approvingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Approve {getFriendlyTypeName(approvingItem.resourceType, approvingItem.entitySummary?.isMock)}
                </h3>
                <p className="text-xs text-slate-500 truncate max-w-xs">
                  {approvingItem.entitySummary?.title || approvingItem.resourceId}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-xs space-y-2 text-slate-600 border border-slate-100">
              <p>
                <strong>Approval Impact:</strong> This action will mark this record as certified and trigger the appropriate downstream workflow automatically.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setApprovingItem(null)}
                disabled={processing}
                className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleApproveConfirm(approvingItem)}
                disabled={processing}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50 transition"
              >
                {processing ? 'Approving...' : 'Confirm & Approve'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: REJECT MODAL ──────────────────────────────────────────── */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Reject {getFriendlyTypeName(rejectingItem.resourceType, rejectingItem.entitySummary?.isMock)}
                </h3>
                <p className="text-xs text-slate-500">
                  A mandatory rejection reason is required for audit logging.
                </p>
              </div>
            </div>

            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rejection Reason *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this request is rejected (e.g., incorrect format, validation errors)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 p-3 text-xs focus:border-rose-600 focus:outline-hidden transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !rejectionReason.trim()}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-500 disabled:opacity-50 transition shadow-xs"
                >
                  {processing ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminApprovalQueuePage;
