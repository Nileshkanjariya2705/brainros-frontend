import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileSpreadsheet,
  UploadCloud,
  History,
  BookOpen,
  Search,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useGetExamsListAPI } from '../services/examManager.service';
import type { ExamItem } from '../types/examManager.types';

export const ExamManagerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const routePrefix = location.pathname.startsWith('/super-admin')
    ? '/super-admin'
    : '/admin';

  const [exams, setExams] = useState<ExamItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedExam, setSelectedExam] = useState<ExamItem | null>(null);

  const { getExamsListAPI, isLoading } = useGetExamsListAPI();

  const loadExams = useCallback(async () => {
    const res = await getExamsListAPI();
    const list = Array.isArray(res.data)
      ? res.data
      : (res.data as any)?.data || [];
    setExams(list);
  }, [getExamsListAPI]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const filteredExams = exams.filter((e) => {
    const titleMatch = e.title?.toLowerCase().includes(search.toLowerCase());
    const descMatch = e.description?.toLowerCase().includes(search.toLowerCase());
    return titleMatch || descMatch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-500/20 mb-1">
            <FileSpreadsheet size={13} className="text-indigo-600" />
            <span>Question Paper File-Driven Exam Engine</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="text-indigo-600" size={26} />
            Exam Manager
          </h1>
          <p className="text-xs text-slate-500">
            Create, manage, and inspect multi-section exams automatically constructed from question paper spreadsheets.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`${routePrefix}/exam-manager/history`)}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <History size={15} />
            <span>Import History</span>
          </Button>

          <Button
            onClick={() => navigate(`${routePrefix}/exam-manager/upload`)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200 text-xs font-bold"
          >
            <UploadCloud size={16} />
            <span>Upload Question Paper</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Exams
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{exams.length}</span>
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">
            Active Question Papers
          </span>
          <span className="text-2xl font-black text-indigo-900 mt-1 block">
            {exams.reduce((acc, e) => acc + (e.totalQuestions || 0), 0)} Qs
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Live in Portal
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            {exams.filter((e) => e.status?.name === 'PUBLISHED' || e.status?.name === 'ACTIVE').length}
          </span>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">
            Zero Data Loss
          </span>
          <span className="text-xs font-semibold text-purple-900 mt-2 block">
            Transaction Safe Creation
          </span>
        </div>
      </div>

      {/* Search and Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search exams by title or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="text-xs font-bold text-slate-500">
            Showing {filteredExams.length} of {exams.length} exams
          </div>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading exams...</div>
        ) : filteredExams.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <FileSpreadsheet size={24} />
            </div>
            <p className="text-sm font-bold text-slate-700">No exams found</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Upload a question paper spreadsheet (.xlsx/.csv) to automatically construct and publish exams.
            </p>
            <Button
              onClick={() => navigate(`${routePrefix}/exam-manager/upload`)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
            >
              Upload Question Paper Now →
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Exam Title</th>
                  <th className="px-5 py-3">Target</th>
                  <th className="px-5 py-3">Questions</th>
                  <th className="px-5 py-3">Marks</th>
                  <th className="px-5 py-3">Duration</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExams.map((exam) => (
                  <tr key={exam.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-extrabold text-slate-900">{exam.title}</div>
                      {exam.description && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[280px]">
                          {exam.description}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-indigo-700">
                      {exam.examTarget?.name || 'NEET'}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                      {exam.totalQuestions} Qs
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-700">
                      {exam.totalMarks} Marks
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-600">
                      {exam.durationMinutes} mins
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={11} />
                        {exam.status?.name || 'PUBLISHED'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedExam(exam)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-5 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen size={18} className="text-indigo-600" />
                <h2 className="text-base font-extrabold text-slate-900">Exam Details</h2>
              </div>
              <button
                onClick={() => setSelectedExam(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-400 uppercase text-[10px]">Title:</span>
                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{selectedExam.title}</p>
              </div>

              {selectedExam.description && (
                <div>
                  <span className="font-bold text-slate-400 uppercase text-[10px]">Description:</span>
                  <p className="text-slate-600 mt-0.5">{selectedExam.description}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Questions</div>
                  <div className="text-sm font-black text-slate-900 mt-0.5">{selectedExam.totalQuestions}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-[10px] text-emerald-600 uppercase font-bold">Total Marks</div>
                  <div className="text-sm font-black text-emerald-800 mt-0.5">{selectedExam.totalMarks}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="text-[10px] text-amber-600 uppercase font-bold">Duration</div>
                  <div className="text-sm font-black text-amber-800 mt-0.5">{selectedExam.durationMinutes}m</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setSelectedExam(null)}
                className="text-xs font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamManagerDashboardPage;
