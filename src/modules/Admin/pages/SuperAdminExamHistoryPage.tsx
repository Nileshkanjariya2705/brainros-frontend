import React, { useEffect, useState, useMemo } from 'react';
import {
  History,
  Search,
  Users,
  Eye,
  RefreshCw,
  Layers,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  useCompletedExamsHistoryQuery,
  CompletedExamItem,
} from '../services/examHistory.service';
import { CompletedExamDetailModal } from '../components/CompletedExamDetailModal';
import { Pagination } from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';

export const SuperAdminExamHistoryPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [selectedTarget, setSelectedTarget] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const queryParams = useMemo(
    () => ({
      page,
      limit,
      search: debouncedSearch || undefined,
      examTargetId: selectedTarget !== 'ALL' ? selectedTarget : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [page, limit, debouncedSearch, selectedTarget, startDate, endDate],
  );

  const { data: historyData, isLoading, isFetching, error: queryError, refetch } = useCompletedExamsHistoryQuery(queryParams);

  const exams: CompletedExamItem[] = historyData?.exams || [];
  const pagination = historyData?.pagination || {
    page,
    limit,
    total: 0,
    totalPages: 1,
    hasMore: false,
  };
  const error = queryError ? ((queryError as any)?.response?.data?.message || queryError.message || 'Failed to load exam history') : null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PUBLISHED') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'READY_TO_PUBLISH' || s === 'EVALUATED') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (s === 'ENDED' || s === 'COMPLETED') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Quick statistics calculated across current loaded results
  const totalAttemptsAcrossPage = exams.reduce((acc, curr) => acc + (curr.totalAttempts || 0), 0);
  const totalEvaluatedAcrossPage = exams.reduce((acc, curr) => acc + (curr.totalEvaluated || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <History size={26} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Completed Exam History
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-0.5">
              Comprehensive historical records of all completed examinations, participant attendance, subject syllabi, and performance benchmarks.
            </p>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 active:scale-98 transition-all shadow-2xs self-start md:self-auto"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh Records
        </button>
      </div>

      {/* ── Metric Summary Strip ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Layers size={22} />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 block">
              {pagination.total}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Total Concluded Exams
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Users size={22} />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 block">
              {totalAttemptsAcrossPage}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Attempts on Page
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-600 block">
              {totalEvaluatedAcrossPage}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              Evaluated & Processed
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 block">
              {pagination.totalPages}
            </span>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
              History Archive Pages
            </span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ─────────────────────────────────── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by exam title, subject, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Exam Target Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            >
              <option value="ALL">All Exam Targets (JEE / NEET / CET)</option>
              <option value="JEE">JEE Main & Advanced</option>
              <option value="NEET">NEET Medical</option>
              <option value="CET">MHT-CET / State CET</option>
            </select>
          </div>

          {/* Date Filter Start */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="Start Date"
            />
          </div>

          {/* Date Filter End */}
          <div className="md:col-span-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              placeholder="End Date"
            />
          </div>
        </div>
      </div>

      {/* ── Error Banner ────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* ── Main Data Table / List ──────────────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {(isLoading || isFetching) ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 flex items-center justify-between gap-4 animate-pulse">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-48 rounded" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-64 rounded" />
                </div>
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <div className="py-20 text-center px-4 space-y-3">
            <div className="h-14 w-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <History size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No Completed Exams Found
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No concluded examinations matched your query or filter criteria. Once an exam passes its scheduled end time, it will automatically archive here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th className="py-4 px-6">Examination Title & Target</th>
                  <th className="py-4 px-4">Date & Schedule Window</th>
                  <th className="py-4 px-4">Subjects & Chapters</th>
                  <th className="py-4 px-4 text-center">Questions / Marks</th>
                  <th className="py-4 px-4 text-center">Participation</th>
                  <th className="py-4 px-4 text-center">Avg Score</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {exams.map((exam) => (
                  <tr
                    key={exam.id}
                    onClick={() => setSelectedExamId(exam.id)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    {/* Title & Target */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm line-clamp-1">
                            {exam.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold">
                            {exam.examTarget}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • {exam.durationMinutes} mins
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Date & Schedule */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 block">
                          {formatDate(exam.startTime)}
                        </span>
                        <span className="text-[11px] text-slate-400 block">
                          To: {formatDate(exam.endTime)}
                        </span>
                      </div>
                    </td>

                    {/* Subjects & Chapters */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {exam.sections.map((sec, sIdx) => {
                          const subName = sec.subject?.name || `Subject ${sIdx + 1}`;
                          const chCount = sec.chapters?.length || 0;
                          return (
                            <span
                              key={sec.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200/70"
                              title={
                                chCount > 0
                                  ? `Chapters: ${sec.chapters.join(', ')}`
                                  : 'Full Subject Syllabus'
                              }
                            >
                              <span>{subName}</span>
                              {chCount > 0 && (
                                <span className="h-3.5 px-1 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-black flex items-center justify-center">
                                  {chCount} ch
                                </span>
                              )}
                            </span>
                          );
                        })}
                      </div>
                    </td>

                    {/* Questions / Marks */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-bold text-slate-800 block">
                        {exam.totalQuestions} Qs ({exam.totalMarks} M)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        +{exam.defaultMarksPerQuestion} / −{exam.defaultNegativeMarks}
                      </span>
                    </td>

                    {/* Participation */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-bold text-slate-900 block text-sm">
                        {exam.totalAttempts}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold">
                        {exam.totalEvaluated} Evaluated
                      </span>
                    </td>

                    {/* Avg Score */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span className="font-bold text-slate-800 block">
                        {exam.averageScore}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {exam.averageAccuracy}% acc
                      </span>
                    </td>

                    {/* Status Badges */}
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getStatusBadge(
                          exam.publicationStatus,
                        )}`}
                      >
                        {exam.publicationStatus.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedExamId(exam.id);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all shadow-2xs"
                      >
                        <Eye size={13} />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination Controls ───────────────────────────────────── */}
        {!isLoading && exams.length > 0 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              page={page}
              totalPages={pagination.totalPages || 1}
              total={pagination.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
              limitOptions={[5, 10, 20, 50]}
              isFetching={isLoading}
              itemName="completed exams"
            />
          </div>
        )}
      </div>

      {/* ── Granular Detailed Modal ─────────────────────────────────── */}
      <CompletedExamDetailModal
        examId={selectedExamId}
        onClose={() => setSelectedExamId(null)}
      />
    </div>
  );
};
