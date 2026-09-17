import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarClock,
  Clock,
  HelpCircle,
  Globe2,
  AlertCircle,
  Sparkles,
  Search,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
} from 'lucide-react';
import type { ScheduledExam } from '../types/ai-translation.types';

interface ScheduledExamsListProps {
  exams: ScheduledExam[];
  isLoading?: boolean;
  onSelectExam: (exam: ScheduledExam, mode?: 'upload' | 'view') => void;
}

type StatusFilter = 'ALL' | 'PENDING_UPLOAD' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export const ScheduledExamsList: React.FC<ScheduledExamsListProps> = ({
  exams,
  isLoading = false,
  onSelectExam,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const firstSegment = location.pathname.split('/')[1];
  const routePrefix = [
    'super-admin',
    'super_admin',
    'admin',
    'general-manager',
    'manager',
    'operator',
    'staff',
  ].includes(firstSegment)
    ? `/${firstSegment}`
    : '/admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Sort all exams by latest startTime first
  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => {
      const dateA = new Date(a.startTime).getTime();
      const dateB = new Date(b.startTime).getTime();
      return dateB - dateA; // descending — latest first
    });
  }, [exams]);

  // Compute summary stats from all exams
  const stats = useMemo(() => {
    const total = sortedExams.length;
    let pendingUpload = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;

    for (const exam of sortedExams) {
      const status = exam.translationJob?.status;
      if (!exam.translationJob) {
        pendingUpload++;
      } else if (status === 'PROCESSING' || status === 'QUEUED') {
        processing++;
      } else if (status === 'COMPLETED' || status === 'PARTIALLY_COMPLETED') {
        completed++;
      } else if (status === 'FAILED') {
        failed++;
      } else {
        pendingUpload++;
      }
    }

    return { total, pendingUpload, processing, completed, failed };
  }, [sortedExams]);

  // Filtered exams
  const filteredExams = useMemo(() => {
    return sortedExams.filter((exam) => {
      // Search match
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        exam.examTitle?.toLowerCase().includes(query) ||
        exam.examCode?.toLowerCase().includes(query) ||
        exam.targetLanguages?.some((l) =>
          l.name.toLowerCase().includes(query) || l.code.toLowerCase().includes(query)
        );

      if (!matchesSearch) return false;

      // Status match
      const status = exam.translationJob?.status;
      if (statusFilter === 'PENDING_UPLOAD') {
        return !exam.translationJob;
      }
      if (statusFilter === 'PROCESSING') {
        return status === 'PROCESSING' || status === 'QUEUED';
      }
      if (statusFilter === 'COMPLETED') {
        return status === 'COMPLETED' || status === 'PARTIALLY_COMPLETED';
      }
      if (statusFilter === 'FAILED') {
        return status === 'FAILED';
      }

      return true;
    });
  }, [sortedExams, searchQuery, statusFilter]);

  // Pagination calculation
  const totalCount = filteredExams.length;
  const totalPages = Math.ceil(totalCount / limit) || 1;
  const paginatedExams = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredExams.slice(start, start + limit);
  }, [filteredExams, page, limit]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleStatusFilterChange = (filter: StatusFilter) => {
    setStatusFilter(filter);
    setPage(1);
  };

  const getStatusBadge = (exam: ScheduledExam) => {
    if (!exam.translationJob) {
      if ((exam.currentQuestionsCount || 0) > 0) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <Sparkles className="w-3.5 h-3.5" />
            {exam.currentQuestionsCount} Questions Ready
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-3.5 h-3.5" />
          Pending Upload
        </span>
      );
    }

    const { status, overallProgress } = exam.translationJob;

    switch (status) {
      case 'PROCESSING':
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 animate-pulse">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Translating ({overallProgress}%)
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completed
          </span>
        );
      case 'PARTIALLY_COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Partially Translated
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
            <AlertTriangle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Total Scheduled Exams
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {stats.total}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
            <CalendarClock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Pending Paper Upload
            </p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {stats.pendingUpload}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-100 dark:border-amber-900">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Translating In Progress
            </p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {stats.processing}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Completed Translations
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.completed}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-900">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Scheduled Exams List
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select an exam schedule to upload question papers or view AI translations.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by exam name or code..."
                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { id: 'ALL', label: 'All' },
                  { id: 'PENDING_UPLOAD', label: 'Needs Upload' },
                  { id: 'PROCESSING', label: 'Translating' },
                  { id: 'COMPLETED', label: 'Completed' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleStatusFilterChange(f.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    statusFilter === f.id
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Loading scheduled exams...
            </p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              {searchQuery || statusFilter !== 'ALL'
                ? 'No matching scheduled exams found'
                : 'No scheduled exams found'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try clearing your search filters to see all exams.'
                : 'Schedule exams in the Exam Scheduling module to upload question papers and start AI translation.'}
            </p>
            {(searchQuery || statusFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                  setPage(1);
                }}
                className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedExams.map((exam) => {
                const hasJob = !!exam.translationJob;
                const isProcessing =
                  exam.translationJob?.status === 'PROCESSING' ||
                  exam.translationJob?.status === 'QUEUED';

                return (
                  <div
                    key={exam.scheduleId}
                    className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                  >
                    {/* Left Column: Exam Details */}
                    <div className="space-y-3 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">
                          {exam.examTitle}
                        </h3>
                        {exam.examCode && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {exam.examCode}
                          </span>
                        )}
                        {getStatusBadge(exam)}
                      </div>

                      {/* Metadata Items */}
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CalendarClock className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span>
                            {new Date(exam.startTime).toLocaleDateString()} (
                            {new Date(exam.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            )
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                          <span>{exam.durationMinutes} Minutes</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <HelpCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>
                            {exam.totalQuestionsConfigured || 0} Questions Configured
                          </span>
                        </div>
                      </div>

                      {/* Target Languages */}
                      <div className="flex items-center gap-2 pt-1">
                        <Globe2 className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium shrink-0">
                          Target Languages ({exam.targetLanguages?.length || 0}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {exam.targetLanguages && exam.targetLanguages.length > 0 ? (
                            exam.targetLanguages.map((lang) => (
                              <span
                                key={lang.id}
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60"
                              >
                                {lang.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400 italic">English only</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Manage Translation / Upload Question Paper Button */}
                    <div className="flex items-center gap-2.5 shrink-0 self-start lg:self-center">
                      {hasJob ? (
                        <button
                          type="button"
                          onClick={() => onSelectExam(exam, 'view')}
                          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                            isProcessing
                              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20'
                              : 'bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white shadow-sm'
                          }`}
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>{isProcessing ? 'Translating In Progress' : 'Manage Translation'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (exam.currentQuestionsCount || 0) > 0 ? (
                        <button
                          type="button"
                          onClick={() => onSelectExam(exam, 'upload')}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 hover:shadow-md hover:shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Start AI Translation</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`${routePrefix}/exams/${exam.examId}/question-paper/add`)
                          }
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-600/20 hover:shadow-md hover:shadow-indigo-600/30 transition-all cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4" />
                          <span>Upload Question Paper</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  Showing{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {(page - 1) * limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {Math.min(page * limit, totalCount)}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {totalCount}
                  </span>{' '}
                  exams
                </span>

                <div className="flex items-center gap-1.5 ml-2">
                  <span>Per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 px-2">
                  Page <span className="font-semibold text-slate-900 dark:text-white">{page}</span> of{' '}
                  <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span>
                </span>

                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
