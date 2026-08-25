import React, { useEffect, useState } from 'react';
import { RefreshCw, Code } from 'lucide-react';
import { Axios } from '@/base-axios';
import { AuditLogItem } from '@/types/exam.types';

export const AdminAuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('');
  const [inspectLog, setInspectLog] = useState<AuditLogItem | null>(null);

  useEffect(() => {
    fetchAuditLogs();
  }, [actionFilter, entityFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;

      const res = await Axios.get('/admin/audit-logs', { params });
      setLogs(res.data.data || []);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Immutable Audit Trails & Governance Explorer
          </h1>
          <p className="text-sm text-slate-500">
            Append-only verification ledger recording all high-risk state mutations, approvals, and
            activations.
          </p>
        </div>
        <button
          onClick={fetchAuditLogs}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Trails
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none"
        >
          <option value="">All Actions</option>
          <option value="APPROVE">APPROVE</option>
          <option value="REJECT">REJECT</option>
          <option value="SUBMIT_APPROVAL">SUBMIT_APPROVAL</option>
          <option value="ACTIVATE_EXAM">ACTIVATE_EXAM</option>
          <option value="DEACTIVATE_EXAM">DEACTIVATE_EXAM</option>
          <option value="CANCEL_APPROVAL">CANCEL_APPROVAL</option>
        </select>

        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:outline-none"
        >
          <option value="">All Entities</option>
          <option value="QUESTION">QUESTION</option>
          <option value="EXAM">EXAM</option>
          <option value="INSTITUTION">INSTITUTION</option>
          <option value="BULK_UPLOAD">BULK_UPLOAD</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading audit ledger...</div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No audit records match criteria.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="pb-3 font-semibold">Timestamp</th>
                  <th className="pb-3 font-semibold">Action</th>
                  <th className="pb-3 font-semibold">Entity Type</th>
                  <th className="pb-3 font-semibold">Entity ID</th>
                  <th className="pb-3 font-semibold">Actor User</th>
                  <th className="pb-3 font-semibold">Reason / Notes</th>
                  <th className="pb-3 font-semibold text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log: AuditLogItem) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 text-xs text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 font-bold">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-black ${
                          log.action === 'APPROVE' || log.action === 'ACTIVATE_EXAM'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'REJECT' || log.action === 'DEACTIVATE_EXAM'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-xs font-semibold text-slate-800">{log.entityType}</td>
                    <td className="py-3 font-mono text-xs text-slate-500">{log.entityId}</td>
                    <td className="py-3 font-mono text-xs text-slate-700">
                      {log.actorUserId || 'SYSTEM'}
                    </td>
                    <td className="py-3 text-xs text-slate-600 truncate max-w-xs">
                      {log.reason || '—'}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setInspectLog(log)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                      >
                        <Code className="h-3.5 w-3.5" /> Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Inspect State Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Audit Snapshot: {inspectLog.action} on {inspectLog.entityType}
                </h3>
                <p className="text-xs font-mono text-slate-400">ID: {inspectLog.id}</p>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400">Before State</h4>
                <pre className="mt-1.5 h-48 overflow-auto rounded-xl bg-slate-950 p-3 font-mono text-xs text-emerald-400">
                  {JSON.stringify(inspectLog.beforeState || {}, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase text-slate-400">After State</h4>
                <pre className="mt-1.5 h-48 overflow-auto rounded-xl bg-slate-950 p-3 font-mono text-xs text-blue-400">
                  {JSON.stringify(inspectLog.afterState || {}, null, 2)}
                </pre>
              </div>
            </div>

            {inspectLog.reason && (
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
                <span className="font-bold text-slate-900">Reason / Notes:</span>{' '}
                {inspectLog.reason}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectLog(null)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500"
              >
                Close Snapshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;
