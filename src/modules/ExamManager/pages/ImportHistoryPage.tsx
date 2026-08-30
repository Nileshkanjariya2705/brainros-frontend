import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  History,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  useGetExamImportHistoryAPI,
  downloadQuestionPaperErrorReport,
} from '../services/examManager.service';
import type { ExamImportSession } from '../types/examManager.types';

export const ImportHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const routePrefix = location.pathname.startsWith('/super-admin')
    ? '/super-admin'
    : '/admin';

  const [historyItems, setHistoryItems] = useState<ExamImportSession[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const { getExamImportHistoryAPI, isLoading } = useGetExamImportHistoryAPI();

  const loadHistory = useCallback(async () => {
    const res = await getExamImportHistoryAPI();
    const list = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.data || [];
    setHistoryItems(list);
  }, [getExamImportHistoryAPI]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDownloadErrors = async (importId: string) => {
    try {
      setDownloadingId(importId);
      await downloadQuestionPaperErrorReport(importId, 'xlsx');
    } catch {
      alert('Failed to download error report.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button
              onClick={() => navigate(`${routePrefix}/exam-manager`)}
              className="hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <BookOpen size={14} /> Exam Manager
            </button>
            <span>/</span>
            <span className="text-slate-900 font-bold">Import History</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="text-indigo-600" size={26} />
            Question Paper Import History
          </h1>
          <p className="text-xs text-slate-500">
            Audit logs and historical processing records for all question paper file uploads.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate(`${routePrefix}/exam-manager`)}
          className="text-xs font-bold"
        >
          ← Back to Exam Manager
        </Button>
      </div>

      {/* History Table Card */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Loading import history...
          </div>
        ) : historyItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <History size={24} />
            </div>
            <p className="text-sm font-bold text-slate-700">No import history found</p>
            <p className="text-xs text-slate-400">
              When you upload question papers, their processing audits will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">File Name</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created Exam</th>
                  <th className="px-5 py-3">Questions</th>
                  <th className="px-5 py-3">Sections</th>
                  <th className="px-5 py-3">Upload Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historyItems.map((item) => {
                  const isSuccess = item.status === 'COMPLETED';
                  const isFailed = item.status === 'FAILED';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-extrabold text-slate-900 flex items-center gap-2">
                          <FileSpreadsheet size={15} className="text-indigo-600" />
                          <span>{item.fileName}</span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {item.fileType} • {item.fileSize ? `${(item.fileSize / 1024).toFixed(1)} KB` : ''}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Completed
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle size={11} /> Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock size={11} /> {item.status}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {item.createdExamTitle ? (
                          <div>
                            <div className="font-extrabold text-slate-800 truncate max-w-[220px]">
                              {item.createdExamTitle}
                            </div>
                            <div className="text-[10px] font-mono text-indigo-600">
                              {item.createdExamCode || 'N/A'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                        {item.questionsCreated || item.totalRows || 0}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-600">
                        {item.sectionsCreated || (isSuccess ? 1 : 0)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 font-medium">
                        {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isFailed && (
                          <button
                            onClick={() => handleDownloadErrors(item.id)}
                            disabled={downloadingId === item.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
                          >
                            <Download size={13} />
                            <span>Error Report</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportHistoryPage;
