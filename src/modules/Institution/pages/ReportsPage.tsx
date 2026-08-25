import React, { useEffect, useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { Axios } from '@/base-axios';
import { BatchItem, ReportJobItem } from '@/types/exam.types';

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<ReportJobItem[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // New report form state
  const [reportType, setReportType] = useState<string>('STUDENT_WISE');
  const [format, setFormat] = useState<'XLSX' | 'PDF'>('XLSX');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [requesting, setRequesting] = useState<boolean>(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
    fetchBatches();
    const interval = setInterval(fetchReports, 5000); // Polling for in-progress reports
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const res = await Axios.get('/institutions/me/reports');
      setReports(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch reports', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await Axios.get('/institutions/me/batches');
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestReport = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setRequesting(true);
      setRequestError(null);
      await Axios.post('/institutions/me/reports', {
        reportType,
        format,
        filters: {
          ...(selectedBatchId && { batchId: selectedBatchId }),
        },
      });
      await fetchReports();
    } catch (err: any) {
      setRequestError(err.response?.data?.message || 'Failed to request report generation');
    } finally {
      setRequesting(false);
    }
  };

  const handleDownload = async (reportJobId: string) => {
    try {
      const res = await Axios.get(`/institutions/me/reports/${reportJobId}`);
      if (res.data.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank');
      } else {
        alert('Download link not yet available or job failed.');
      }
    } catch (err) {
      alert('Unable to retrieve download URL.');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">B2B Report Center</h1>
        <p className="text-sm text-slate-500">
          Asynchronously generate and download enterprise analytics, rank distributions, and rosters
          in XLSX and PDF.
        </p>
      </div>

      {/* Generation Form */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Generate New Analytical Report</h2>
        <p className="text-xs text-slate-500">
          Heavy datasets are processed asynchronously in the background. Completed files remain
          available for 7 days.
        </p>

        {requestError && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            {requestError}
          </div>
        )}

        <form
          onSubmit={handleRequestReport}
          className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700">Report Category</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="STUDENT_WISE">Student-Wise Performance Report</option>
              <option value="BATCH_WISE">Batch Comparison Summary</option>
              <option value="RANK_LIST">Official Institutional Rank List</option>
              <option value="SUBJECT_ANALYSIS">Subject & Chapter Diagnostics</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Output Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="XLSX">Spreadsheet (XLSX) - High Density</option>
              <option value="PDF">Executive Document (PDF)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Filter By Batch (Optional)
            </label>
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
            >
              <option value="">All Batches (Institution-wide)</option>
              {batches.map((b: BatchItem) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={requesting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {requesting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Queuing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Request Report
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Generated Reports Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">Generated Reports Queue</h2>
          <button
            onClick={fetchReports}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh List
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No report jobs submitted yet. Use the form above to generate your first report.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="pb-3 font-semibold">Report Type</th>
                  <th className="pb-3 font-semibold">Format</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">File Details</th>
                  <th className="pb-3 font-semibold">Requested At</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((item: ReportJobItem) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 font-semibold text-slate-900">
                      {item.reportType.replace(/_/g, ' ')}
                    </td>
                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-slate-700">
                        {item.format === 'XLSX' ? (
                          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-red-600" />
                        )}
                        {item.format}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'PROCESSING' || item.status === 'QUEUED'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {item.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
                        {item.status} {item.status === 'PROCESSING' && `(${item.progress}%)`}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-500">
                      {item.fileName || 'Pending generation'}{' '}
                      {item.fileSize ? `(${(item.fileSize / 1024).toFixed(1)} KB)` : ''}
                    </td>
                    <td className="py-3 text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      {item.status === 'COMPLETED' ? (
                        <button
                          onClick={() => handleDownload(item.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
