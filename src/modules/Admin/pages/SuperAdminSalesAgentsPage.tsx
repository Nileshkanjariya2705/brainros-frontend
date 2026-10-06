import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Power,
  Trash2,
  RefreshCw,
  Phone,
  Mail,
  AlertTriangle,
  ShieldAlert,
  Activity,
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
  type SalesAgentListItem,
} from '../services/superAdminSalesAgent.service';
import { superAdminSalesAgentKeys } from '@/services/queryKeys';
import { CreateSalesAgentModal } from '../components/CreateSalesAgentModal';
import { EditSalesAgentModal } from '../components/EditSalesAgentModal';

export const SuperAdminSalesAgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Filters & Pagination State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SalesAgentListItem | null>(null);
  const [statusToggleAgent, setStatusToggleAgent] = useState<SalesAgentListItem | null>(null);
  const [deletingAgent, setDeletingAgent] = useState<SalesAgentListItem | null>(null);

  // Query Sales Agents
  const {
    data: responseData,
    isLoading,
    isFetching,
    refetch,
    isError,
  } = useQuery({
    queryKey: superAdminSalesAgentKeys.list({
      page,
      limit,
      search: search.trim() || undefined,
      status: statusFilter || undefined,
      sortBy,
      sortOrder,
    }),
    queryFn: () =>
      SuperAdminSalesAgentApi.getSalesAgents({
        page,
        limit,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      }),
  });

  const agentList: SalesAgentListItem[] = useMemo(() => {
    if (Array.isArray(responseData?.items)) return responseData.items;
    if (Array.isArray(responseData?.data?.items)) return responseData.data.items;
    if (Array.isArray(responseData?.data)) return responseData.data;
    return [];
  }, [responseData]);

  const pagination = useMemo(() => {
    const p = responseData?.pagination || responseData?.data?.pagination;
    return {
      total: p?.total ?? agentList.length,
      totalPages: p?.totalPages || p?.pages || 1,
      page: p?.page ?? page,
      limit: p?.limit ?? limit,
    };
  }, [responseData, agentList, page, limit]);

  // Activate / Deactivate Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }) =>
      SuperAdminSalesAgentApi.updateSalesAgentStatus(id, status),
    onSuccess: (res) => {
      toast.success(res?.message || 'Sales agent status updated successfully.');
      queryClient.invalidateQueries({ queryKey: superAdminSalesAgentKeys.all });
      setStatusToggleAgent(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update status.');
    },
  });

  // Soft-Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => SuperAdminSalesAgentApi.deleteSalesAgent(id),
    onSuccess: (res) => {
      toast.success(res?.message || 'Sales agent deactivated/deleted successfully.');
      queryClient.invalidateQueries({ queryKey: superAdminSalesAgentKeys.all });
      setDeletingAgent(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete sales agent.');
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto" data-testid="super-admin-sales-agents-page">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Agents</h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Manage field sales representatives, track client visits, and inspect field activity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => navigate('/super-admin/sales-agent-activities')}
            className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200 font-bold"
          >
            <Activity className="w-4 h-4 text-indigo-600" />
            <span>Today's Activities</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 text-slate-700 hover:bg-slate-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            data-testid="create-sales-agent-button"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Sales Agent</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="search-sales-agents"
            data-testid="search-sales-agents-input"
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email, phone, ID..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status:</span>
            <select
              id="filter-status-sales-agents"
              data-testid="filter-status-sales-agents"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:bg-white focus:border-indigo-500 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="DELETED">Deleted</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sort:</span>
            <select
              id="sort-by-sales-agents"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so as 'asc' | 'desc');
                setPage(1);
              }}
              className="py-1.5 px-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-bold focus:bg-white focus:border-indigo-500 transition-all"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-12 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">Failed to load Sales Agents</h3>
            <p className="text-xs text-slate-500 mt-1">Please try refreshing the page.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : agentList.length === 0 ? (
          <div className="p-12">
            <EmptyState
              icon={<Users className="w-12 h-12 text-slate-400" />}
              title="No Sales Agents Found"
              description={
                search || statusFilter
                  ? 'No sales agents match the current filter criteria. Try clearing filters.'
                  : 'Start by creating your first sales agent to track visits and client onboardings.'
              }
              actionLabel={!search && !statusFilter ? 'Create First Sales Agent' : 'Clear Filters'}
              onAction={
                !search && !statusFilter
                  ? () => setIsCreateModalOpen(true)
                  : () => {
                      setSearch('');
                      setStatusFilter('');
                    }
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" data-testid="sales-agents-table">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-5">Sales Agent</th>
                  <th className="py-3.5 px-5">Contact Details</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-center">Visits</th>
                  <th className="py-3.5 px-5 text-center">Orders</th>
                  <th className="py-3.5 px-5">Last Activity</th>
                  <th className="py-3.5 px-5">Created At</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {agentList.map((agent) => (
                  <tr
                    key={agent.id}
                    data-testid={`sales-agent-row-${agent.id}`}
                    className="hover:bg-slate-50/60 transition-colors group"
                  >
                    {/* Agent Name & ID */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 font-black text-sm shrink-0">
                          {agent.name ? agent.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {agent.name || 'Unnamed Agent'}
                          </p>
                          {agent.employeeId ? (
                            <span className="text-[11px] font-semibold text-slate-500">
                              ID: {agent.employeeId}
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-indigo-600">Field Representative</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td className="py-4 px-5">
                      <div className="space-y-0.5 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{agent.mobileNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-[160px]">{agent.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-5">
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
                        size="sm"
                      >
                        {agent.status}
                      </Badge>
                    </td>

                    {/* Metrics */}
                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs">
                        {agent.totalVisits ?? 0}
                      </span>
                    </td>

                    <td className="py-4 px-5 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs">
                        {agent.totalOrders ?? 0}
                      </span>
                    </td>

                    {/* Last Activity */}
                    <td className="py-4 px-5 text-xs text-slate-600 font-medium">
                      {agent.lastActivityAt ? (
                        new Date(agent.lastActivityAt).toLocaleDateString()
                      ) : (
                        <span className="text-slate-400">No activity yet</span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="py-4 px-5 text-xs text-slate-500 font-medium">
                      {new Date(agent.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => navigate(`/super-admin/sales-agents/${agent.id}`)}
                          data-testid={`view-sales-agent-${agent.id}`}
                          title="View Agent Profile & Activity"
                          className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingAgent(agent)}
                          data-testid={`edit-sales-agent-${agent.id}`}
                          title="Edit Agent"
                          className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setStatusToggleAgent(agent)}
                          data-testid={`toggle-status-sales-agent-${agent.id}`}
                          title={agent.status === 'ACTIVE' ? 'Deactivate Agent' : 'Activate Agent'}
                          className={`p-2 rounded-xl transition-colors ${
                            agent.status === 'ACTIVE'
                              ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-4 h-4" />
                        </button>

                        {agent.status !== 'DELETED' && (
                          <button
                            type="button"
                            onClick={() => setDeletingAgent(agent)}
                            data-testid={`delete-sales-agent-${agent.id}`}
                            title="Deactivate / Delete Agent"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} total agents)
            </span>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => setPage(p)}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateSalesAgentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Edit Modal */}
      <EditSalesAgentModal
        isOpen={!!editingAgent}
        agent={editingAgent}
        onClose={() => setEditingAgent(null)}
        onSuccess={() => refetch()}
      />

      {/* Status Confirmation Modal */}
      <Modal
        isOpen={!!statusToggleAgent}
        onClose={() => setStatusToggleAgent(null)}
        title={
          statusToggleAgent?.status === 'ACTIVE'
            ? 'Deactivate Sales Agent'
            : 'Activate Sales Agent'
        }
        description={
          statusToggleAgent?.status === 'ACTIVE'
            ? 'Are you sure you want to deactivate this sales agent? They will no longer be able to log in or record new visits, but all historical activities will be preserved.'
            : 'Are you sure you want to activate this sales agent? They will regain access to field CRM features.'
        }
        maxWidth="md"
      >
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => setStatusToggleAgent(null)}
            disabled={statusMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              if (statusToggleAgent) {
                statusMutation.mutate({
                  id: statusToggleAgent.id,
                  status: statusToggleAgent.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                });
              }
            }}
            disabled={statusMutation.isPending}
            data-testid="confirm-status-toggle-button"
            className={
              statusToggleAgent?.status === 'ACTIVE'
                ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold'
            }
          >
            {statusMutation.isPending
              ? 'Updating...'
              : statusToggleAgent?.status === 'ACTIVE'
              ? 'Yes, Deactivate Agent'
              : 'Yes, Activate Agent'}
          </Button>
        </div>
      </Modal>

      {/* Delete / Soft-Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingAgent}
        onClose={() => setDeletingAgent(null)}
        title={
          <div className="flex items-center gap-2 text-rose-600">
            <ShieldAlert className="w-5 h-5" />
            <span>Soft-Delete Sales Agent</span>
          </div>
        }
        description={
          <span>
            Are you sure you want to delete <strong>{deletingAgent?.name}</strong>? Following production safety standards, this will mark the agent as <strong>DELETED</strong>, revoke system access, but strictly preserve all historical visits, leads, and audit logs.
          </span>
        }
        maxWidth="md"
      >
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button
            variant="outline"
            onClick={() => setDeletingAgent(null)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              if (deletingAgent) {
                deleteMutation.mutate(deletingAgent.id);
              }
            }}
            disabled={deleteMutation.isPending}
            data-testid="confirm-delete-sales-agent-button"
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Confirm Soft Delete'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminSalesAgentsPage;
