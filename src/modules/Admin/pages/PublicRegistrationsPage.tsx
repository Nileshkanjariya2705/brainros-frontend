import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  RotateCw,
  X,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ShieldCheck,
  Eye,
  Users,
  CheckCircle2,
  XCircle,
  Globe,
  UserCheck,
  UserX,
  Clock,
  Layers,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import {
  usePublicRegistrationsQuery,
  usePublicRegistrationStatsQuery,
  usePublicRegistrationFilterOptionsQuery,
  usePublicStudentDetailQuery,
  useDeactivatePublicStudentMutation,
  useActivatePublicStudentMutation,
} from '../services/public-registrations.queries';
import {
  type PublicStudentItem,
  type PublicRegistrationsQueryParams,
} from '../services/public-registrations.service';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';
import { ExportPdfButton } from '@/components/export/ExportPdfButton';
import { toast } from '@/utils/toast';

/* ── View Public Student Details Modal ────────────────────────────────────── */
interface ViewStudentModalProps {
  studentId: string;
  onClose: () => void;
  onDeactivate: (student: PublicStudentItem) => void;
  onActivate: (student: PublicStudentItem) => void;
}

const ViewStudentModal: React.FC<ViewStudentModalProps> = ({
  studentId,
  onClose,
  onDeactivate,
  onActivate,
}) => {
  const { data: student, isLoading } = usePublicStudentDetailQuery(studentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-white/10">
              <User size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[10px] tracking-wider uppercase">
                  Source: {student?.registrationSource || 'PUBLIC'}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  {student?.studentCode || student?.studentId}
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight">{student?.name || 'Student Profile'}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-700">
          {isLoading ? (
            <div className="py-16 text-center">
              <Loader label="Loading student profile..." />
            </div>
          ) : !student ? (
            <div className="py-12 text-center text-slate-500">Student not found.</div>
          ) : (
            <>
              {/* Account Status Strip */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Account Status</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                        student.user?.isActive && student.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {student.user?.isActive && student.status === 'ACTIVE' ? (
                        <>
                          <CheckCircle2 size={13} /> Active
                        </>
                      ) : (
                        <>
                          <XCircle size={13} /> Inactive / Deactivated
                        </>
                      )}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Registered on {new Date(student.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div>
                  {student.user?.isActive && student.status === 'ACTIVE' ? (
                    <button
                      onClick={() => onDeactivate(student as any)}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold border border-rose-200 hover:bg-rose-100 transition flex items-center gap-1.5 text-xs shadow-2xs"
                    >
                      <UserX size={14} />
                      <span>Deactivate Account</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => onActivate(student as any)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 hover:bg-emerald-100 transition flex items-center gap-1.5 text-xs shadow-2xs"
                    >
                      <UserCheck size={14} />
                      <span>Reactivate Account</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Personal & Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <User size={15} className="text-indigo-600" /> Personal & Contact Details
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Full Name</span>
                      <span className="font-bold text-slate-900">{student.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Mobile Number</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {student.user?.mobileNumber || student.user?.phone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Email Address</span>
                      <span className="font-bold text-slate-900">{student.user?.email || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Last Login</span>
                      <span className="font-medium text-slate-700">
                        {student.user?.lastLoginAt
                          ? new Date(student.user.lastLoginAt).toLocaleString()
                          : 'Never logged in'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                  <h3 className="font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <GraduationCap size={15} className="text-indigo-600" /> Academic & Institution
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Exam Target</span>
                      <span className="inline-flex px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-black border border-indigo-100 text-[11px]">
                        {student.examTarget?.name || 'General'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Class / Grade</span>
                      <span className="font-bold text-slate-900">{student.studentClass?.name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">School / College</span>
                      <span className="font-bold text-slate-900">
                        {student.institution?.name || student.schoolCollege || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-bold uppercase">Location</span>
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {student.districtRef?.name || student.district || '—'},{' '}
                        {student.stateRef?.name || student.state || '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historical Preserved Data Note */}
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 text-blue-900 space-y-1.5">
                <div className="font-black flex items-center gap-1.5 text-xs">
                  <ShieldCheck size={15} className="text-blue-600" />
                  Preserved Academic & Payment History
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  This public student's exam attempts, test results, candidate ranks, and payment transactions are
                  permanently preserved in the database. Deactivating the account suspends access while maintaining
                  full compliance and historical audit integrity.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl font-bold">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ── Deactivate Confirmation Modal ────────────────────────────────────────── */
interface DeactivateModalProps {
  student: PublicStudentItem | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  isLoading: boolean;
}

const DeactivateModal: React.FC<DeactivateModalProps> = ({
  student,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [reason, setReason] = useState('');

  if (!student) return null;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <UserX size={24} />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Deactivate Student Account</h3>
            <p className="text-xs text-slate-500">Public Registration Student</p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
          <p className="font-bold text-slate-800">
            {student.name} ({student.studentCode || student.studentId})
          </p>
          <p className="text-slate-500">{student.mobile} · {student.email}</p>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Are you sure you want to deactivate this student account? The student will no longer be able to log in or take tests. <b>All past exam results, attempts, and payment records will remain safely preserved.</b>
        </p>

        <form onSubmit={handleConfirm} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-700">Reason for Deactivation (Optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Duplicate registration or student requested hold"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isLoading}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {isLoading ? 'Deactivating...' : 'Confirm Deactivation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Public Registrations Page Component ────────────────────────────── */
export const PublicRegistrationsPage: React.FC = () => {
  // Query Filter State
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [examTargetFilter, setExamTargetFilter] = useState<string>('ALL');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [districtFilter, setDistrictFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('all');

  // Debounce search by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on search change
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  // Query Params Payload
  const queryParams: PublicRegistrationsQueryParams = useMemo(
    () => ({
      page,
      pageSize,
      search: debouncedSearch,
      sortBy,
      sortOrder,
      status: statusFilter,
      examTarget: examTargetFilter,
      stateId: stateFilter,
      districtId: districtFilter,
      date: dateFilter,
    }),
    [
      page,
      pageSize,
      debouncedSearch,
      sortBy,
      sortOrder,
      statusFilter,
      examTargetFilter,
      stateFilter,
      districtFilter,
      dateFilter,
    ],
  );

  // Queries
  const { data, isLoading, isFetching, refetch } = usePublicRegistrationsQuery(queryParams);
  const { data: statsData } = usePublicRegistrationStatsQuery();
  const { data: filterOptions } = usePublicRegistrationFilterOptionsQuery(stateFilter);

  // Mutations
  const deactivateMutation = useDeactivatePublicStudentMutation();
  const activateMutation = useActivatePublicStudentMutation();

  // Modals state
  const [selectedStudentForView, setSelectedStudentForView] = useState<string | null>(null);
  const [studentToDeactivate, setStudentToDeactivate] = useState<PublicStudentItem | null>(null);

  // Handlers
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleDeactivate = async (reason: string) => {
    if (!studentToDeactivate) return;
    try {
      await deactivateMutation.mutateAsync({
        studentId: studentToDeactivate.id,
        reason,
      });
      toast.success(`Student '${studentToDeactivate.name}' deactivated successfully.`);
      setStudentToDeactivate(null);
      if (selectedStudentForView) setSelectedStudentForView(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Unable to deactivate this student.');
    }
  };

  const handleActivate = async (student: PublicStudentItem) => {
    try {
      await activateMutation.mutateAsync(student.id);
      toast.success(`Student '${student.name}' reactivated successfully.`);
      if (selectedStudentForView) setSelectedStudentForView(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Unable to reactivate student.');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setExamTargetFilter('ALL');
    setStateFilter('ALL');
    setDistrictFilter('ALL');
    setDateFilter('all');
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() !== '' ||
    statusFilter !== 'ALL' ||
    examTargetFilter !== 'ALL' ||
    stateFilter !== 'ALL' ||
    districtFilter !== 'ALL' ||
    dateFilter !== 'all';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black text-xs border border-indigo-100 uppercase tracking-wider flex items-center gap-1.5">
              <Globe size={13} />
              Public Registration Portal
            </span>
            <span className="text-xs text-slate-400 font-bold">Super Admin Dedicated View</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Public Registrations
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Monitor, filter, manage, and safely deactivate students who registered through the public student registration flow.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl font-bold bg-white text-slate-700 border-slate-200 shadow-2xs"
          >
            <RotateCw size={14} className={isFetching ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          {/* Filter-Aware Landscape PDF Export */}
          <ExportPdfButton
            resource="public_registrations"
            filters={{
              status: statusFilter,
              examTargetName: examTargetFilter,
              stateId: stateFilter,
              districtId: districtFilter,
            }}
            search={debouncedSearch}
            sort={{ field: sortBy, direction: sortOrder }}
            label="Download PDF"
            filename={`public_registrations_${new Date().toISOString().split('T')[0]}`}
            className="rounded-xl font-bold"
          />
        </div>
      </div>

      {/* ── KPI Summary Cards Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Total Public Registrations</span>
            <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {statsData?.totalPublic?.toLocaleString() ?? '—'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Self-registered candidates</div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Active Accounts</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {statsData?.activePublic?.toLocaleString() ?? '—'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {statsData?.totalPublic
              ? `${Math.round((statsData.activePublic / statsData.totalPublic) * 100)}% active rate`
              : 'Active in system'}
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Today's Registrations</span>
            <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-700">
            {statsData?.todayPublic?.toLocaleString() ?? '0'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">Registered in last 24 hours</div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Target Breakdown</span>
            <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-black text-[10px] border border-rose-100">
              NEET: {statsData?.byTarget?.NEET || 0}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-black text-[10px] border border-blue-100">
              JEE: {statsData?.byTarget?.JEE || 0}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-black text-[10px] border border-emerald-100">
              CET: {statsData?.byTarget?.CET || 0}
            </span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls Bar ── */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {/* Search Box */}
          <div className="sm:col-span-2 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Name, Student ID, Mobile, or Email..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-2xl border border-slate-200 font-medium text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs bg-slate-50/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Exam Target Filter */}
          <div>
            <select
              value={examTargetFilter}
              onChange={(e) => {
                setExamTargetFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-2xl border border-slate-200 font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs bg-white"
            >
              <option value="ALL">All Targets</option>
              <option value="NEET">NEET</option>
              <option value="JEE">JEE</option>
              <option value="CET">CET</option>
              {filterOptions?.examTargets?.map((t: any) => (
                <option key={t.id} value={t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-2xl border border-slate-200 font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive / Deactivated</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          {/* State Filter */}
          <div>
            <select
              value={stateFilter}
              onChange={(e) => {
                setStateFilter(e.target.value);
                setDistrictFilter('ALL');
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-2xl border border-slate-200 font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs bg-white"
            >
              <option value="ALL">All States</option>
              {filterOptions?.states?.map((st: any) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <select
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-2xl border border-slate-200 font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs bg-white"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 text-[11px] border-t border-slate-100">
            <span className="text-slate-500 font-medium">
              Filters active. Showing matching results.
            </span>
            <button
              onClick={clearFilters}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
            >
              <X size={12} /> Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Public Registrations Data Table ── */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4 w-12 text-center text-slate-400">#</th>
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student Name</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('studentId')}
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Student ID</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">School / College</th>
                <th className="py-3 px-4">Exam Target</th>
                <th
                  onClick={() => handleSort('createdAt')}
                  className="py-3 px-4 cursor-pointer hover:text-indigo-600 transition"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Registration Date</span>
                    <ArrowUpDown size={12} className="text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={10} className="py-20 text-center">
                    <Loader label="Loading public registration students..." />
                  </td>
                </tr>
              ) : !data?.items || data.items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Users size={24} />
                      </div>
                      <p className="font-bold text-slate-800 text-sm">No public-registration students found</p>
                      <p className="text-xs text-slate-400">
                        {hasActiveFilters
                          ? 'No records match your active search and filter criteria. Try clearing filters.'
                          : 'No students have registered through the public portal yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.items.map((student, idx) => {
                  const isActive = student.accountStatus === 'ACTIVE' && student.status === 'ACTIVE';
                  const rowNum = (page - 1) * pageSize + idx + 1;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-400">
                        {rowNum}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{student.name}</div>
                        <div className="text-[10px] text-indigo-600 font-bold">
                          Source: {student.registrationSource}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {student.studentCode || student.studentId}
                      </td>

                      <td className="py-3 px-4 space-y-0.5">
                        <div className="font-mono text-slate-800 font-medium">{student.mobile}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {student.email}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium text-slate-800">{student.district?.name || '—'}</div>
                        <div className="text-[10px] text-slate-400">{student.state?.name || '—'}</div>
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-[160px] truncate" title={student.schoolCollege}>
                        {student.schoolCollege || '—'}
                      </td>

                      <td className="py-3 px-4">
                        <span className="inline-flex px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-black border border-indigo-100 text-[10px]">
                          {student.examTarget?.name || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-600">
                        <div className="font-medium">
                          {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {student.createdAt ? new Date(student.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 size={10} /> Active
                            </>
                          ) : (
                            <>
                              <XCircle size={10} /> Inactive
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedStudentForView(student.id)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition shadow-2xs"
                            title="View Profile"
                          >
                            <Eye size={14} />
                          </button>

                          {isActive ? (
                            <button
                              onClick={() => setStudentToDeactivate(student)}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] border border-rose-200 transition shadow-2xs flex items-center gap-1"
                              title="Deactivate Student"
                            >
                              <UserX size={12} />
                              <span>Deactivate</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleActivate(student)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-[11px] border border-emerald-200 transition shadow-2xs flex items-center gap-1"
                              title="Reactivate Student"
                            >
                              <UserCheck size={12} />
                              <span>Activate</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Server-Side Pagination Bar ── */}
        {data?.pagination && data.pagination.total > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span>
                Showing <b>{(page - 1) * pageSize + 1}</b> to{' '}
                <b>{Math.min(page * pageSize, data.pagination.total)}</b> of{' '}
                <b>{data.pagination.total.toLocaleString()}</b> students
              </span>

              <span className="text-slate-300">|</span>

              <div className="flex items-center gap-1.5">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-200 py-1 px-2 text-xs font-bold text-slate-700 bg-white"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronsLeft size={14} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronLeft size={14} />
              </Button>

              <span className="px-3 py-1 font-bold text-slate-800">
                Page {page} of {data.pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page >= data.pagination.totalPages}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronRight size={14} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(data.pagination.totalPages)}
                disabled={page >= data.pagination.totalPages}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronsRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── View Student Detail Modal ── */}
      {selectedStudentForView && (
        <ViewStudentModal
          studentId={selectedStudentForView}
          onClose={() => setSelectedStudentForView(null)}
          onDeactivate={(st) => {
            setSelectedStudentForView(null);
            setStudentToDeactivate(st);
          }}
          onActivate={handleActivate}
        />
      )}

      {/* ── Deactivate Confirmation Modal ── */}
      {studentToDeactivate && (
        <DeactivateModal
          student={studentToDeactivate}
          onClose={() => setStudentToDeactivate(null)}
          onConfirm={handleDeactivate}
          isLoading={deactivateMutation.isPending}
        />
      )}
    </div>
  );
};

export default PublicRegistrationsPage;
