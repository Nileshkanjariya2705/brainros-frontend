import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  BadgeCheck,
  Building2,
  Eye,
  Edit2,
  Power,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { toast } from '@/utils/toast';
import {
  SuperAdminSalesAgentApi,
  type SalesAgentDetail,
  type SalesAgentActivityItem,
} from '../services/superAdminSalesAgent.service';
import { superAdminSalesAgentKeys } from '@/services/queryKeys';
import { EditSalesAgentModal } from '../components/EditSalesAgentModal';
import { SuperAdminActivityDetailView } from '../components/SuperAdminActivityDetailView';

export const SuperAdminSalesAgentDetailPage: React.FC = () => {
  const { salesAgentId } = useParams<{ salesAgentId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Activity list filters & pagination
  const [activitySearch, setActivitySearch] = useState('');
  const [activityType, setActivityType] = useState('');
  const [activityStatus, setActivityStatus] = useState('');
  const [activityInterest, setActivityInterest] = useState('');
  const [activityPage, setActivityPage] = useState(1);
  const [activityLimit, setActivityLimit] = useState(10);

  // Modals / In-page Activity Details state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    searchParams.get('activityId') || null
  );
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Sync selectedActivityId with URL query params
  useEffect(() => {
    const urlActivityId = searchParams.get('activityId');
    if (urlActivityId && urlActivityId !== selectedActivityId) {
      setSelectedActivityId(urlActivityId);
    }
  }, [searchParams]);

  const handleSelectActivity = (id: string) => {
    setSelectedActivityId(id);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('activityId', id);
    setSearchParams(newParams, { replace: true });
  };

  const handleBackFromActivity = () => {
    setSelectedActivityId(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('activityId');
    setSearchParams(newParams, { replace: true });
  };

  // 1. Fetch Sales Agent Profile & Stats
  const {
    data: detailResponse,
    isLoading: isProfileLoading,
    isError: isProfileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: superAdminSalesAgentKeys.detail(salesAgentId || ''),
    queryFn: () => SuperAdminSalesAgentApi.getSalesAgentDetail(salesAgentId!),
    enabled: !!salesAgentId,
  });

  const agent: SalesAgentDetail | undefined =
    (detailResponse as any)?.data?.agent ||
    (detailResponse as any)?.agent ||
    (detailResponse as any)?.data;

  const rawStats =
    (detailResponse as any)?.data?.stats ||
    (detailResponse as any)?.stats ||
    agent?.stats;

  // 2. Fetch Aggregated Activities
  const {
    data: activitiesResponse,
    isLoading: isActivitiesLoading,
    isFetching: isActivitiesFetching,
    refetch: refetchActivities,
  } = useQuery({
    queryKey: superAdminSalesAgentKeys.activities(salesAgentId || '', {
      page: activityPage,
      limit: activityLimit,
      search: activitySearch.trim() || undefined,
      type: activityType || undefined,
      status: activityStatus || undefined,
      interestLevel: activityInterest || undefined,
    }),
    queryFn: () =>
      SuperAdminSalesAgentApi.getActivities(salesAgentId!, {
        page: activityPage,
        limit: activityLimit,
        search: activitySearch.trim() || undefined,
        type: activityType || undefined,
        status: activityStatus || undefined,
        interestLevel: activityInterest || undefined,
      }),
    enabled: !!salesAgentId,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const activityList: SalesAgentActivityItem[] = useMemo(() => {
    if (Array.isArray(activitiesResponse?.items)) return activitiesResponse.items;
    if (Array.isArray(activitiesResponse?.data?.items)) return activitiesResponse.data.items;
    if (Array.isArray(activitiesResponse?.data)) return activitiesResponse.data;
    return [];
  }, [activitiesResponse]);

  const activityPagination = useMemo(() => {
    const p = activitiesResponse?.pagination || activitiesResponse?.data?.pagination;
    return {
      total: p?.total ?? activityList.length,
      totalPages: p?.totalPages || p?.pages || 1,
      page: p?.page ?? activityPage,
      limit: p?.limit ?? activityLimit,
    };
  }, [activitiesResponse, activityList, activityPage, activityLimit]);

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
      if (!salesAgentId) throw new Error('No agent ID');
      return SuperAdminSalesAgentApi.updateSalesAgentStatus(salesAgentId, status);
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Status updated successfully.');
      queryClient.invalidateQueries({ queryKey: superAdminSalesAgentKeys.all });
      setIsStatusModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update status.');
    },
  });

  // Soft-Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => {
      if (!salesAgentId) throw new Error('No agent ID');
      return SuperAdminSalesAgentApi.deleteSalesAgent(salesAgentId);
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Sales agent soft-deleted successfully.');
      queryClient.invalidateQueries({ queryKey: superAdminSalesAgentKeys.all });
      navigate('/super-admin/sales-agents');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete sales agent.');
    },
  });

  if (isProfileLoading) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-3xl" />
      </div>
    );
  }

  if (isProfileError || !agent) {
    return (
      <div className="p-12 text-center max-w-xl mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900">Sales Agent Not Found</h2>
        <p className="text-slate-500 text-sm mt-1">
          The requested sales agent does not exist or may have been permanently removed.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate('/super-admin/sales-agents')}
          className="mt-6"
        >
          Back to Sales Agents
        </Button>
      </div>
    );
  }

  const stats = rawStats || agent.stats || {
    totalVisits: (rawStats as any)?.totalVisits ?? 0,
    visitsToday: (rawStats as any)?.visitsToday ?? 0,
    visitsThisMonth: (rawStats as any)?.visitsThisMonth ?? 0,
    totalOrders: (rawStats as any)?.totalOrders ?? 0,
    totalRevenue: (rawStats as any)?.totalRevenue ?? 0,
    conversionRate: (rawStats as any)?.conversionRate ?? 0,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" data-testid="super-admin-sales-agent-detail-page">
      {/* Top Back Navigation & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigate('/super-admin/sales-agents')}
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sales Agents</span>
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchProfile();
              refetchActivities();
            }}
            title="Refresh details"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            data-testid="edit-agent-detail-button"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1 text-blue-600" /> Edit Agent
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsStatusModalOpen(true)}
            data-testid="toggle-status-agent-detail-button"
          >
            <Power className="w-3.5 h-3.5 mr-1 text-amber-600" />
            {agent.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Button>

          {agent.status !== 'DELETED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(true)}
              data-testid="delete-agent-detail-button"
              className="text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
            </Button>
          )}
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-2xl shrink-0 shadow-inner">
              {agent.name ? agent.name.charAt(0).toUpperCase() : 'S'}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {agent.name || 'Unnamed Agent'}
                </h1>
                <Badge
                  variant={
                    agent.status === 'ACTIVE'
                      ? 'success'
                      : agent.status === 'INACTIVE'
                      ? 'secondary'
                      : agent.status === 'DELETED'
                      ? 'danger'
                      : 'warning'
                  }
                  size="md"
                >
                  {agent.status}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm text-slate-500 font-medium">
                {agent.employeeId && (
                  <span className="flex items-center gap-1 text-slate-700 font-semibold">
                    <BadgeCheck className="w-4 h-4 text-indigo-500" /> ID: {agent.employeeId}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {agent.mobileNumber}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {agent.email}
                </span>
              </div>

              {agent.address && (
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{agent.address}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex md:flex-col items-start md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 text-xs text-slate-500 gap-2">
            <div>
              <span className="font-semibold text-slate-400 uppercase">Created:</span>{' '}
              <span className="font-bold text-slate-700">
                {new Date(agent.createdAt).toLocaleDateString()}
              </span>
            </div>
            {agent.dateOfJoining && (
              <div>
                <span className="font-semibold text-slate-400 uppercase">Joined:</span>{' '}
                <span className="font-bold text-slate-700">
                  {new Date(agent.dateOfJoining).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Visits Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Total Field Visits
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalVisits}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-1">
            <span>Today: <strong className="text-indigo-600">{stats.visitsToday}</strong></span>
            <span>•</span>
            <span>Month: <strong className="text-slate-800">{stats.visitsThisMonth}</strong></span>
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Total Orders
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats.totalOrders}</p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Revenue: <strong className="text-emerald-700 font-bold">₹{stats.totalRevenue.toLocaleString()}</strong>
          </p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">
              Conversion Rate
            </span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{stats.conversionRate}%</p>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Visit to Deal Ratio
          </p>
        </div>
      </div>

      {/* Activity Details In-Page View OR Activity Timeline Table */}
      {selectedActivityId && salesAgentId ? (
        <SuperAdminActivityDetailView
          salesAgentId={salesAgentId}
          activityId={selectedActivityId}
          agentName={agent?.name}
          onBack={handleBackFromActivity}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Activity History</h3>
              <p className="text-xs text-slate-500 font-medium">
                Complete timeline of field visits, scheduled appointments, and leads recorded by this agent.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchActivities()}
                disabled={isActivitiesFetching}
              >
                <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isActivitiesFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="search-agent-activities"
                data-testid="search-agent-activities-input"
                type="text"
                value={activitySearch}
                onChange={(e) => {
                  setActivitySearch(e.target.value);
                  setActivityPage(1);
                }}
                placeholder="Search institute or contact..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-xs font-medium focus:bg-white focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Activity Type Filter */}
              <select
                id="filter-activity-type"
                data-testid="filter-activity-type-select"
                value={activityType}
                onChange={(e) => {
                  setActivityType(e.target.value);
                  setActivityPage(1);
                }}
                className="py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:bg-white transition-all"
              >
                <option value="">All Activity Types</option>
                <option value="VISIT_COMPLETED">Visit Completed</option>
                <option value="VISIT_SCHEDULED">Visit Scheduled</option>
                <option value="VISIT_CHECKIN">Visit Check-In</option>
                <option value="LEAD_CREATED">Lead Created</option>
                <option value="LEAD_CONVERTED">Lead Converted</option>
              </select>

              {/* Status Filter */}
              <select
                id="filter-activity-status"
                data-testid="filter-activity-status-select"
                value={activityStatus}
                onChange={(e) => {
                  setActivityStatus(e.target.value);
                  setActivityPage(1);
                }}
                className="py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:bg-white transition-all"
              >
                <option value="">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="CONVERTED">Converted</option>
              </select>

              {/* Interest Filter */}
              <select
                id="filter-activity-interest"
                value={activityInterest}
                onChange={(e) => {
                  setActivityInterest(e.target.value);
                  setActivityPage(1);
                }}
                className="py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:bg-white transition-all"
              >
                <option value="">All Interest Levels</option>
                <option value="HOT">Hot</option>
                <option value="WARM">Warm</option>
                <option value="COLD">Cold</option>
              </select>
            </div>
          </div>

          {/* Activity Table */}
          <div className="rounded-2xl border border-slate-100 overflow-hidden">
            {isActivitiesLoading ? (
              <div className="p-6 space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : activityList.length === 0 ? (
              <div className="p-10">
                <EmptyState
                  icon={<Building2 className="w-10 h-10 text-slate-400" />}
                  title="No Activities Found"
                  description={
                    activitySearch || activityType || activityInterest
                      ? 'No activities match the applied filters.'
                      : 'This sales agent has not recorded any client visits or leads yet.'
                  }
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" data-testid="agent-activities-table">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[10px] font-black uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Activity Type</th>
                      <th className="py-3 px-4">Institute / Client</th>
                      <th className="py-3 px-4">Contact Person</th>
                      <th className="py-3 px-4">Status / Interest</th>
                      <th className="py-3 px-4">Follow-Up Date</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {activityList.map((act) => {
                      const actType = (act.type || (act as any).activityType || '').toString();
                      return (
                        <tr
                          key={act.id}
                          data-testid={`activity-row-${act.id}`}
                          className="hover:bg-indigo-50/40 transition-colors cursor-pointer"
                          onClick={() => handleSelectActivity(act.id)}
                        >
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  actType.includes('COMPLETED') || actType.includes('CONVERTED')
                                    ? 'bg-emerald-500'
                                    : actType.includes('SCHEDULED')
                                    ? 'bg-indigo-500'
                                    : 'bg-slate-400'
                                }`}
                              />
                              {act.title}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-semibold text-slate-800">
                            {act.instituteName || '—'}
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {act.contactPerson || '—'}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant={
                                  act.status === 'COMPLETED' || act.status === 'CONVERTED'
                                    ? 'success'
                                    : act.status === 'CANCELLED'
                                    ? 'danger'
                                    : 'secondary'
                                }
                                size="sm"
                              >
                                {act.status}
                              </Badge>
                              {act.interestLevel && (
                                <Badge
                                  variant={
                                    act.interestLevel === 'HOT'
                                      ? 'danger'
                                      : act.interestLevel === 'WARM'
                                      ? 'primary'
                                      : 'secondary'
                                  }
                                  size="sm"
                                >
                                  {act.interestLevel}
                                </Badge>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {act.followUpDate ? (
                              <span className="font-semibold text-indigo-700">
                                {new Date(act.followUpDate).toLocaleDateString()}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>

                          <td className="py-3 px-4 text-slate-500">
                            {new Date(act.timestamp).toLocaleString()}
                          </td>

                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleSelectActivity(act.id)}
                              data-testid={`view-activity-detail-${act.id}`}
                              title="View Complete Activity Detail"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activityPagination.totalPages > 1 && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500 font-medium">
                  Page {activityPagination.page} of {activityPagination.totalPages}
                </span>
                <Pagination
                  page={activityPagination.page}
                  totalPages={activityPagination.totalPages}
                  total={activityPagination.total}
                  limit={activityPagination.limit}
                  onPageChange={(p) => setActivityPage(p)}
                  onLimitChange={(l) => {
                    setActivityLimit(l);
                    setActivityPage(1);
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Agent Modal */}
      <EditSalesAgentModal
        isOpen={isEditModalOpen}
        agent={agent}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => refetchProfile()}
      />

      {/* Status Toggle Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title={agent.status === 'ACTIVE' ? 'Deactivate Sales Agent' : 'Activate Sales Agent'}
        description={
          agent.status === 'ACTIVE'
            ? 'Are you sure you want to deactivate this sales agent? They will lose login access, but past activities are retained.'
            : 'Are you sure you want to activate this sales agent?'
        }
        maxWidth="md"
      >
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => setIsStatusModalOpen(false)}
            disabled={statusMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              statusMutation.mutate(agent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE');
            }}
            disabled={statusMutation.isPending}
            className={
              agent.status === 'ACTIVE'
                ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
            }
          >
            {statusMutation.isPending
              ? 'Updating...'
              : agent.status === 'ACTIVE'
              ? 'Confirm Deactivate'
              : 'Confirm Activate'}
          </Button>
        </div>
      </Modal>

      {/* Delete / Soft Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Soft-Delete Sales Agent"
        description="Are you sure you want to delete this agent? All historical leads and visits will remain safely archived."
        maxWidth="md"
      >
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => setIsDeleteModalOpen(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Confirm Soft Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminSalesAgentDetailPage;
