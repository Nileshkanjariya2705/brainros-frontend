import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, X, RefreshCw } from 'lucide-react';
import { Axios } from '@/base-axios';
import { ApprovalRequestItem } from '@/types/exam.types';

export const AdminApprovalQueuePage: React.FC = () => {
  const [requests, setRequests] = useState<ApprovalRequestItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEntity, setSelectedEntity] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');

  // Reject modal state
  const [rejectingItem, setRejectingItem] = useState<ApprovalRequestItem | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchRequests();
  }, [selectedEntity, statusFilter]);

  const getArrayData = (response: any): any[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    return [];
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setActionError(null);
      const params: any = { status: statusFilter };
      if (selectedEntity !== 'ALL') params.entityType = selectedEntity;

      const res = await Axios.get('/admin/approvals', { params });
      setRequests(getArrayData(res));
      setSelectedIds([]);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, comment = 'Approved via Super Admin Review') => {
    try {
      setProcessing(true);
      setActionError(null);
      await Axios.post(`/admin/approvals/${id}/approve`, { comment });
      await fetchRequests();
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
      await fetchRequests();
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
      await fetchRequests();
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

  const entityTypes = ['ALL', 'QUESTION', 'EXAM', 'INSTITUTION', 'BULK_UPLOAD'];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Unified Governance & Approval Queue</h1>
          <p className="text-sm text-slate-500">
            Super Admin single source of truth for reviewable entity changes with mandatory audit
            and self-approval protection.
          </p>
        </div>
        <button
          onClick={fetchRequests}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Queue
        </button>
      </div>

      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          {actionError}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap gap-2">
          {entityTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedEntity(type)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
                selectedEntity === type
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="PENDING">Status: PENDING</option>
            <option value="APPROVED">Status: APPROVED</option>
            <option value="REJECTED">Status: REJECTED</option>
            <option value="CANCELLED">Status: CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && statusFilter === 'PENDING' && (
        <div className="flex items-center justify-between rounded-2xl bg-indigo-900 p-4 text-white shadow-lg">
          <span className="text-sm font-semibold">
            {selectedIds.length} item(s) selected for bulk action
          </span>
          <button
            onClick={handleBulkApprove}
            disabled={processing}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 shadow-sm hover:bg-emerald-400 disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> Bulk Approve Selected
          </button>
        </div>
      )}

      {/* Queue Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">
              Loading approval queue...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No approval requests match the current filter.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  {statusFilter === 'PENDING' && <th className="pb-3 font-semibold w-8"></th>}
                  <th className="pb-3 font-semibold">Entity Type</th>
                  <th className="pb-3 font-semibold">Target Entity ID</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Submitted At</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    {statusFilter === 'PENDING' && (
                      <td className="py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                    )}
                    <td className="py-3.5 font-bold text-slate-900">
                      <span className="inline-flex rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
                        {item.resourceType}
                      </span>
                    </td>
                    <td className="py-3.5 font-mono text-xs text-slate-600">{item.resourceId}</td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : item.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-slate-400">
                      {new Date(item.submittedAt || item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {item.status === 'PENDING' ? (
                          <>
                            <button
                              onClick={() => handleApprove(item.id)}
                              disabled={processing}
                              className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-500 disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => setRejectingItem(item)}
                              disabled={processing}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-red-500 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {item.status === 'REJECTED' && item.rejectionReason
                              ? `Reason: ${item.rejectionReason}`
                              : 'Resolved'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Reject Approval Request</h3>
            <p className="text-xs text-slate-500">
              A mandatory rejection reason is required for governance and audit logging.
            </p>

            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Rejection Reason
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain why this request is rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !rejectionReason.trim()}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-50"
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
