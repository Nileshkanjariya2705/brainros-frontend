import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import cn from 'classnames';
import {
  Activity,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Search,
  Eye,
  Send,
  Wifi,
  WifiOff,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  XCircle,
  HelpCircle,
  Layers,
  ArrowLeft,
  Calendar,
  Users,
  ArrowUpDown,
} from 'lucide-react';

// ** Queries & Services **
import {
  useExamProcessingSummaryQuery,
  useExamProcessingJobsQuery,
  useExamJobDetailQuery,
  useRetryFailedJobsMutation,
  useRetrySingleJobMutation,
  usePublishResultsMutation,
} from '@/modules/Admin/services/examProcessing.queries';
import { useGetPublicationDashboardAPI } from '@/modules/Exams/services';
import { completedExamReportsService } from '@/modules/Admin/services/completedExamReports.service';
import type { PublicationDashboardItem } from '@/types/exam.types';

// ** Hooks **
import { useExamProcessingMonitor } from '@/hooks/useExamProcessingMonitor';

// ** Components **
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';
import Modal from '@/components/ui/Modal';

export const SuperAdminExamProcessingMonitorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlExamId = searchParams.get('examId') || '';

  // ─── Directory List State (when !urlExamId) ──────────────────────────
  const { getPublicationDashboardAPI, isLoading: isDashboardLoading } =
    useGetPublicationDashboardAPI();
  const [directoryExams, setDirectoryExams] = useState<PublicationDashboardItem[]>([]);
  const [dirSearchInput, setDirSearchInput] = useState('');
  const [dirDebouncedSearch, setDirDebouncedSearch] = useState('');
  const [dirStatus, setDirStatus] = useState<
    'ALL' | 'READY_TO_PUBLISH' | 'PUBLISHED' | 'PROCESSING' | 'NOT_READY'
  >('ALL');
  const [dirPage, setDirPage] = useState(1);
  const [dirLimit, setDirLimit] = useState(10);
  const [dirTotalCount, setDirTotalCount] = useState(0);
  const [dirTotalPages, setDirTotalPages] = useState(1);
  const [dirTotalMonitored, setDirTotalMonitored] = useState(0);

  // Debounce directory search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDirDebouncedSearch(dirSearchInput.trim());
      setDirPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [dirSearchInput]);

  // Load publication dashboard directory
  const loadDirectoryExams = useCallback(async () => {
    try {
      const res = await getPublicationDashboardAPI({
        page: dirPage,
        limit: dirLimit,
        search: dirDebouncedSearch || undefined,
        status: dirStatus,
      });

      const payload = res.data;
      let rawList: any[] = [];
      if (payload && (payload as any).items) {
        rawList = (payload as any).items;
        if ((payload as any).pagination) {
          setDirTotalCount((payload as any).pagination.total || 0);
          setDirTotalPages((payload as any).pagination.totalPages || 1);
        }
        if ((payload as any).summary?.totalMonitored !== undefined) {
          setDirTotalMonitored((payload as any).summary.totalMonitored);
        }
      } else {
        rawList = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.data)
          ? (res.data as any).data
          : Array.isArray(res.response?.data?.data)
          ? res.response.data.data
          : [];
        setDirTotalCount(rawList.length);
        setDirTotalPages(1);
      }

      // Fallback: If publication dashboard returned 0 exams, fetch from completed exams service
      if (rawList.length === 0 && !dirDebouncedSearch && dirStatus === 'ALL') {
        try {
          const completed = await completedExamReportsService.getCompletedLiveExams();
          if (Array.isArray(completed) && completed.length > 0) {
            rawList = completed.map((c) => ({
              examId: c.id,
              examTitle: c.title,
              examTarget: 'LIVE',
              examStatus: 'COMPLETED',
              examType: 'LIVE',
              totalCandidates: 0,
              finalizedAttempts: 0,
              evaluatedAttempts: 0,
              analyticsCompletedAttempts: 0,
              rankingCompleted: false,
              securityReviewCompleted: false,
              publicationStatus: 'NOT_READY',
              isReadyToPublish: false,
              notReadyReason: null,
              publishedAt: null,
              publishedBy: null,
              publicationVersion: 1,
            }));
            setDirTotalCount(rawList.length);
            setDirTotalPages(1);
          }
        } catch (completedErr) {
          console.warn('Completed exams directory fallback error:', completedErr);
        }
      }

      setDirectoryExams(rawList);
    } catch (err) {
      console.error('Failed to load publication directory exams:', err);
    }
  }, [getPublicationDashboardAPI, dirPage, dirLimit, dirDebouncedSearch, dirStatus]);

  useEffect(() => {
    loadDirectoryExams();
  }, [loadDirectoryExams]);

  // Sort directory exams by latest completed schedule end time / created time
  const sortedDirectoryExams = useMemo(() => {
    return [...directoryExams].sort((a, b) => {
      const timeA = a.lastSchedule?.endTime
        ? new Date(a.lastSchedule.endTime).getTime()
        : 0;
      const timeB = b.lastSchedule?.endTime
        ? new Date(b.lastSchedule.endTime).getTime()
        : 0;
      if (timeA !== timeB) return timeB - timeA;
      // Secondary sort: publishedAt date
      const pubA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const pubB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return pubB - pubA;
    });
  }, [directoryExams]);

  // Exam list for top dropdown selector in detailed view
  const examOptions = useMemo(() => {
    return directoryExams.map((e) => ({
      examId: e.examId,
      examTitle: e.examTitle,
      examType: e.examType || 'LIVE',
    }));
  }, [directoryExams]);

  const selectedExamId = urlExamId;

  // ─── Detailed Processing Monitor State (when urlExamId is set) ──────
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING'
  >('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const sortBy = 'updatedAt';
  const sortOrder: 'asc' | 'desc' = 'desc';

  // Job detail modal state
  const [inspectJobId, setInspectJobId] = useState<string | null>(null);

  // Publish modal state
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [confirmPublishChecked, setConfirmPublishChecked] = useState(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);
  const [publishErrorMsg, setPublishErrorMsg] = useState<string | null>(null);

  // Summary Query
  const {
    data: summary,
    isLoading: isSummaryLoading,
    refetch: refetchSummary,
  } = useExamProcessingSummaryQuery(selectedExamId);

  // Jobs Query (Server-side paginated & filtered)
  const jobsQueryParams = useMemo(
    () => ({
      page,
      limit,
      status: statusFilter,
      search: debouncedSearch,
      sortBy,
      sortOrder,
    }),
    [page, limit, statusFilter, debouncedSearch, sortBy, sortOrder],
  );

  const {
    data: jobsData,
    isLoading: isJobsLoading,
    refetch: refetchJobs,
  } = useExamProcessingJobsQuery(selectedExamId, jobsQueryParams);

  // Job Detail Query (for modal)
  const { data: jobDetail, isLoading: isJobDetailLoading } = useExamJobDetailQuery(
    selectedExamId,
    inspectJobId,
  );

  const handleExamCompleted = useCallback(() => {
    refetchSummary();
    refetchJobs();
  }, [refetchSummary, refetchJobs]);

  // Real-time WebSocket monitor
  const { isConnected, mergeLiveWithItem } = useExamProcessingMonitor({
    examId: selectedExamId,
    enabled: Boolean(selectedExamId),
    onExamCompleted: handleExamCompleted,
  });

  // Mutations
  const retryFailedMutation = useRetryFailedJobsMutation(selectedExamId);
  const retrySingleMutation = useRetrySingleJobMutation(selectedExamId);
  const publishMutation = usePublishResultsMutation(selectedExamId);

  // Merge live WebSocket progress into current page of jobs
  const liveJobs = useMemo(() => {
    if (!jobsData?.items) return [];
    return jobsData.items.map((item) => mergeLiveWithItem(item));
  }, [jobsData?.items, mergeLiveWithItem]);

  // Handle Exam Selection Change
  const handleSelectExam = (id: string) => {
    if (!id) {
      setSearchParams({});
    } else {
      setSearchParams({ examId: id });
    }
    setPage(1);
    setSearchInput('');
    setStatusFilter('ALL');
  };

  // Trigger batch retry
  const handleRetryFailed = async () => {
    await retryFailedMutation.mutateAsync();
  };

  // Trigger single job retry
  const handleRetrySingle = async (jobId: string) => {
    await retrySingleMutation.mutateAsync(jobId);
    if (inspectJobId === jobId) {
      setInspectJobId(null);
    }
  };

  // Trigger official publish
  const handleExecutePublish = async () => {
    if (!confirmPublishChecked || !selectedExamId) return;
    setPublishErrorMsg(null);

    try {
      await publishMutation.mutateAsync();
      setPublishSuccessMsg('Official results have been successfully published to all candidates!');
      setTimeout(() => {
        setIsPublishModalOpen(false);
        setPublishSuccessMsg(null);
        setConfirmPublishChecked(false);
        loadDirectoryExams();
      }, 2500);
    } catch (err: any) {
      setPublishErrorMsg(
        err?.response?.data?.message || 'Failed to publish results. Please verify readiness criteria.',
      );
    }
  };

  // Format date helper
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // ═════════════════════════════════════════════════════════════════════
  // VIEW 1: EXAM DIRECTORY LIST VIEW (WHEN !urlExamId)
  // ═════════════════════════════════════════════════════════════════════
  if (!urlExamId) {
    return (
      <div className="space-y-6 pb-16">
        {/* ─── Page Header ────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" />
              Live Result Pipeline Observability
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Exam Result Processing
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Select an exam below to inspect live processing pipelines, evaluation progress, time/strategy analytics, and result publication readiness.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDirectoryExams()}
            className="self-start md:self-auto border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
          >
            <RotateCw className={cn('w-4 h-4 mr-1.5', isDashboardLoading && 'animate-spin')} />
            Refresh Directory
          </Button>
        </div>

        {/* ─── Metric Summary Cards ────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Monitored
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {dirTotalMonitored || dirTotalCount}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Active exam pipelines</span>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Ready To Publish
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-2">
              {sortedDirectoryExams.filter((e) => e.publicationStatus === 'READY_TO_PUBLISH').length}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Evaluated & un-published</span>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Published Results
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-2">
              {sortedDirectoryExams.filter((e) => e.publicationStatus === 'PUBLISHED').length}
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Visible on student portal</span>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                In Progress
              </span>
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-2">
              {
                sortedDirectoryExams.filter(
                  (e) =>
                    e.publicationStatus === 'NOT_READY' || e.publicationStatus === 'PROCESSING',
                ).length
              }
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">Active processing/evaluation</span>
          </div>
        </div>

        {/* ─── Directory Table Card ─────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          {/* Controls Bar: Search + Status Tabs + Sort Badge */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search exam by title or target..."
                value={dirSearchInput}
                onChange={(e) => setDirSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0">
                {(
                  [
                    { id: 'ALL', label: 'All Exams' },
                    { id: 'READY_TO_PUBLISH', label: 'Ready' },
                    { id: 'PUBLISHED', label: 'Published' },
                    { id: 'PROCESSING', label: 'Processing' },
                    { id: 'NOT_READY', label: 'In Progress' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setDirStatus(tab.id);
                      setDirPage(1);
                    }}
                    className={cn(
                      'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap',
                      dirStatus === tab.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sort Order Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-500" />
                <span>Sorted by Latest Completed</span>
              </div>
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto">
            {isDashboardLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2">
                <Loader label="Loading completed exams directory..." />
              </div>
            ) : sortedDirectoryExams.length === 0 ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-medium text-slate-700 dark:text-slate-300">
                  No exams match the specified filter criteria
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting search keywords or selecting a different status tab.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Exam Name & Target</th>
                    <th className="py-3.5 px-4">Completed / Schedule</th>
                    <th className="py-3.5 px-4">Attempts</th>
                    <th className="py-3.5 px-4 w-44">Evaluation Progress</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs md:text-sm">
                  {sortedDirectoryExams.map((exam) => {
                    const evalPercentage =
                      exam.finalizedAttempts > 0
                        ? Math.min(
                            100,
                            Math.round(
                              (exam.evaluatedAttempts / exam.finalizedAttempts) * 100,
                            ),
                          )
                        : exam.evaluatedAttempts > 0
                        ? 100
                        : 0;

                    return (
                      <tr
                        key={exam.examId}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-750 transition-colors cursor-pointer"
                        onClick={() => handleSelectExam(exam.examId)}
                      >
                        {/* Exam Name & Target */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="font-bold text-slate-900 dark:text-white group-hover:text-indigo-600">
                            {exam.examTitle}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {exam.examTarget || 'General Target'}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                                exam.examType === 'LIVE'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300',
                              )}
                            >
                              {exam.examType || 'LIVE'}
                            </span>
                          </div>
                        </td>

                        {/* Schedule / Completed Date */}
                        <td className="py-3.5 px-4 align-middle text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {exam.lastSchedule?.endTime
                                ? formatDate(exam.lastSchedule.endTime)
                                : exam.publishedAt
                                ? formatDate(exam.publishedAt)
                                : 'Completed recently'}
                            </span>
                          </div>
                        </td>

                        {/* Attempt Numbers */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{exam.finalizedAttempts || exam.totalCandidates || 0} Attempts</span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {exam.evaluatedAttempts} Evaluated
                          </div>
                        </td>

                        {/* Progress Bar */}
                        <td className="py-3.5 px-4 align-middle">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold">
                              <span className="text-slate-600 dark:text-slate-300">
                                {evalPercentage}%
                              </span>
                              <span className="text-slate-400">
                                {exam.evaluatedAttempts} / {exam.finalizedAttempts || exam.evaluatedAttempts}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full transition-all duration-300 rounded-full',
                                  evalPercentage === 100
                                    ? 'bg-emerald-500'
                                    : 'bg-indigo-600 dark:bg-indigo-500',
                                )}
                                style={{ width: `${evalPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Pipeline Status */}
                        <td className="py-3.5 px-4 align-middle">
                          {exam.publicationStatus === 'READY_TO_PUBLISH' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Publish
                            </span>
                          ) : exam.publicationStatus === 'PUBLISHED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                              <Award className="w-3.5 h-3.5" /> Published
                            </span>
                          ) : exam.publicationStatus === 'PROCESSING' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                              <RotateCw className="w-3.5 h-3.5 animate-spin" /> Processing
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                              <Clock className="w-3.5 h-3.5" /> In Progress
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 align-middle text-right">
                          <Button
                            size="xs"
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectExam(exam.examId);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm"
                          >
                            Inspect Pipeline <ChevronRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Directory Pagination Footer */}
          {dirTotalPages > 0 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  Showing <b>{dirTotalCount === 0 ? 0 : (dirPage - 1) * dirLimit + 1}</b>–
                  <b>{Math.min(dirPage * dirLimit, dirTotalCount)}</b> of <b>{dirTotalCount}</b> exams
                </span>
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3">
                  <span>Per page:</span>
                  <select
                    value={dirLimit}
                    onChange={(e) => {
                      setDirLimit(Number(e.target.value));
                      setDirPage(1);
                    }}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {dirTotalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={dirPage <= 1}
                    onClick={() => setDirPage((p) => Math.max(1, p - 1))}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                  </Button>
                  <span className="px-2 font-bold text-slate-700 dark:text-slate-200">
                    Page {dirPage} of {dirTotalPages}
                  </span>
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={dirPage >= dirTotalPages}
                    onClick={() => setDirPage((p) => p + 1)}
                    className="flex items-center gap-1"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // VIEW 2: DETAILED LIVE PIPELINE MONITOR VIEW (WHEN urlExamId IS SET)
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 pb-16">
      {/* ─── Top Control Header ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {/* Back to Exam Directory List */}
            <Button
              variant="outline"
              size="xs"
              onClick={() => setSearchParams({})}
              className="border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Exam Directory
            </Button>
            <span className="text-slate-300 dark:text-slate-600">|</span>
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider">
              <Activity className="w-4 h-4" />
              Pipeline Observability
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {summary?.examTitle || 'Exam Result Processing'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Live BullMQ processing pipeline monitoring student evaluation, time/strategy analytics, batch ranking snapshots, and publication readiness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Exam Selector Dropdown */}
          <div className="relative min-w-[240px]">
            <select
              value={selectedExamId}
              onChange={(e) => handleSelectExam(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-100 text-xs md:text-sm rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              <option value="">← Back to Exam Directory</option>
              {examOptions.map((opt) => (
                <option key={opt.examId} value={opt.examId}>
                  {opt.examTitle} ({opt.examType})
                </option>
              ))}
            </select>
          </div>

          {/* WebSocket Status Indicator */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border shadow-sm transition-colors',
              isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
            )}
            title={isConnected ? 'Connected to WebSocket /ws/jobs' : 'Reconnecting or Polling'}
          >
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Wifi className="w-3.5 h-3.5" />
                <span>Live Real-Time</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <WifiOff className="w-3.5 h-3.5" />
                <span>Reconnecting...</span>
              </>
            )}
          </div>

          {/* Manual Refresh */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchSummary();
              refetchJobs();
            }}
            className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
          >
            <RotateCw className={cn('w-4 h-4 mr-1.5', (isSummaryLoading || isJobsLoading) && 'animate-spin')} />
            Refresh
          </Button>
        </div>
      </div>

      {/* ─── Overall Progress Card ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">
              {summary?.examTitle || 'Selected Exam'} — Overall Progress
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {summary ? `${summary.overallPercentage}%` : '0%'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {summary
                ? `${summary.completedJobs.toLocaleString()} / ${summary.totalJobs.toLocaleString()} Jobs Completed`
                : '0 / 0 Jobs'}
            </div>
          </div>

          {/* Status Badge & Publication Action */}
          <div className="flex flex-wrap items-center gap-3">
            {summary?.status === 'READY_TO_PUBLISH' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 animate-pulse">
                <CheckCircle2 className="w-4 h-4" /> Ready to Publish
              </span>
            ) : summary?.status === 'PUBLISHED' ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
                <Award className="w-4 h-4" /> Result Published
              </span>
            ) : summary?.failedJobs && summary.failedJobs > 0 ? (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                <AlertTriangle className="w-4 h-4" /> Processing Issues ({summary.failedJobs} Failed)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
                <Clock className="w-4 h-4 animate-spin" /> In Progress
              </span>
            )}

            {/* Retry Failed Jobs Button */}
            {summary?.failedJobs && summary.failedJobs > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetryFailed}
                isLoading={retryFailedMutation.isPending}
                className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-xs font-semibold"
              >
                <RotateCw className="w-3.5 h-3.5 mr-1.5" />
                Retry Failed Jobs ({summary.failedJobs})
              </Button>
            ) : null}

            {/* Authoritative Publish Button */}
            {summary?.status === 'READY_TO_PUBLISH' && (
              <Button
                size="sm"
                onClick={() => setIsPublishModalOpen(true)}
                className="bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-md font-bold text-xs flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Publish Result
              </Button>
            )}
          </div>
        </div>

        {/* Large Progress Bar */}
        <div className="mt-5 space-y-2">
          <div className="w-full bg-slate-100 dark:bg-slate-700/60 h-3 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                summary?.overallPercentage === 100
                  ? 'bg-emerald-500'
                  : summary?.failedJobs && summary.failedJobs > 0
                  ? 'bg-amber-500'
                  : 'bg-indigo-600 dark:bg-indigo-500',
              )}
              style={{ width: `${summary?.overallPercentage || 0}%` }}
            />
          </div>

          {/* Metric Stat Pills */}
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 pt-3">
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                  Completed
                </span>
                <div className="text-xl font-bold text-emerald-900 dark:text-emerald-200 mt-0.5">
                  {summary?.completedJobs.toLocaleString() || 0}
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-400 uppercase">
                  Processing
                </span>
                <div className="text-xl font-bold text-indigo-900 dark:text-indigo-200 mt-0.5">
                  {summary?.processingJobs.toLocaleString() || 0}
                </div>
              </div>
              <RotateCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
            </div>

            <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase">
                  Pending
                </span>
                <div className="text-xl font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                  {summary?.pendingJobs.toLocaleString() || 0}
                </div>
              </div>
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>

            <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 uppercase">
                  Failed
                </span>
                <div className="text-xl font-bold text-rose-900 dark:text-rose-200 mt-0.5">
                  {summary?.failedJobs.toLocaleString() || 0}
                </div>
              </div>
              <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Processing Stages Grid ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-indigo-500" />
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Multi-Stage Pipeline Progression
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stage 1: Evaluation */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">1. Evaluation</span>
              <span
                className={cn(
                  summary?.stages?.evaluation?.percentage === 100
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-600 dark:text-indigo-400',
                )}
              >
                {summary?.stages?.evaluation?.percentage || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${summary?.stages?.evaluation?.percentage || 0}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
              <span>{summary?.stages?.evaluation?.completed || 0} Evaluated</span>
              <span>Total: {summary?.stages?.evaluation?.total || 0}</span>
            </div>
          </div>

          {/* Stage 2: Analytics */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">2. Analytics</span>
              <span
                className={cn(
                  summary?.stages?.analytics?.percentage === 100
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-600 dark:text-indigo-400',
                )}
              >
                {summary?.stages?.analytics?.percentage || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${summary?.stages?.analytics?.percentage || 0}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
              <span>{summary?.stages?.analytics?.completed || 0} Computed</span>
              <span>Time & Strategy</span>
            </div>
          </div>

          {/* Stage 3: Ranking */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">3. Ranking</span>
              <span
                className={cn(
                  summary?.stages?.ranking?.percentage === 100
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-indigo-600 dark:text-indigo-400',
                )}
              >
                {summary?.stages?.ranking?.percentage || 0}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${summary?.stages?.ranking?.percentage || 0}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
              <span>{summary?.stages?.ranking?.completed || 0} Ranked</span>
              <span>Percentiles</span>
            </div>
          </div>

          {/* Stage 4: Reconciliation */}
          <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-700 dark:text-slate-300">4. Reconciliation</span>
              <span
                className={cn(
                  summary?.stages?.reconciliation?.status === 'HEALTHY'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400',
                )}
              >
                {summary?.stages?.reconciliation?.status || 'HEALTHY'}
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300"
                style={{ width: `${summary?.stages?.reconciliation?.percentage || 0}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between">
              <span>Integrity Verified</span>
              <span>0 Orphaned</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Student Jobs Table Section ─────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Student, Attempt ID, Job ID..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {(['ALL', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'] as const).map(
              (status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap',
                    statusFilter === status
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
                  )}
                >
                  {status}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {isJobsLoading && liveJobs.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2">
              <Loader label="Loading candidate processing jobs..." />
            </div>
          ) : liveJobs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              <HelpCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                No jobs match the specified criteria
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try clearing search terms or selecting a different status filter.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Job ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 w-48">Progress</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 text-xs md:text-sm">
                {liveJobs.map((job) => (
                  <tr
                    key={job.jobId}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors"
                  >
                    {/* Student Info */}
                    <td className="py-3 px-4 align-middle">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {job.studentName}
                      </div>
                      {job.studentEmail && (
                        <div className="text-[11px] text-slate-400">{job.studentEmail}</div>
                      )}
                    </td>

                    {/* Job ID */}
                    <td className="py-3 px-4 align-middle font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {job.jobId}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 align-middle">
                      {job.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3 h-3" /> Completed
                        </span>
                      ) : job.status === 'PROCESSING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          <RotateCw className="w-3 h-3 animate-spin" /> Processing
                        </span>
                      ) : job.status === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <X className="w-3 h-3" /> Failed
                        </span>
                      ) : job.status === 'RETRYING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                          <RotateCw className="w-3 h-3 animate-bounce" /> Retrying
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          <Clock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>

                    {/* Progress Bar */}
                    <td className="py-3 px-4 align-middle">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-500">{job.progress}%</span>
                          <span className="text-slate-400">{job.message}</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all duration-300',
                              job.status === 'COMPLETED'
                                ? 'bg-emerald-500'
                                : job.status === 'FAILED'
                                ? 'bg-rose-500'
                                : 'bg-indigo-500',
                            )}
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Stage */}
                    <td className="py-3 px-4 align-middle">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {job.stage}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 align-middle text-right">
                      <div className="inline-flex items-center gap-1">
                        <Button
                          size="xs"
                          variant="ghost"
                          onClick={() => setInspectJobId(job.jobId)}
                          title="Inspect Job Details"
                          className="text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        {job.status === 'FAILED' && (
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => handleRetrySingle(job.jobId)}
                            isLoading={retrySingleMutation.isPending}
                            title="Retry Job"
                            className="border-rose-300 text-rose-600 hover:bg-rose-50"
                          >
                            <RotateCw className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Server-Side Pagination Bar */}
        {jobsData?.pagination && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-3">
              <span>
                Showing <b>{jobsData.pagination.total === 0 ? 0 : (page - 1) * limit + 1}</b>–
                <b>{Math.min(page * limit, jobsData.pagination.total)}</b> of{' '}
                <b>{jobsData.pagination.total}</b> candidate jobs
              </span>
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-700 pl-3">
                <span>Per page:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            {jobsData.pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  disabled={jobsData.pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                </Button>
                <span className="px-2 font-bold text-slate-700 dark:text-slate-200">
                  Page {jobsData.pagination.page} of {jobsData.pagination.totalPages}
                </span>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={jobsData.pagination.page >= jobsData.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1"
                >
                  Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Job Details Inspection Modal ───────────────────────────────── */}
      <Modal
        isOpen={Boolean(inspectJobId)}
        onClose={() => setInspectJobId(null)}
        title="BullMQ Job Details"
      >
        {isJobDetailLoading || !jobDetail ? (
          <div className="py-12 flex justify-center">
            <Loader label="Loading job execution details..." />
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Student Name</span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {jobDetail.studentName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Student ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {jobDetail.studentId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attempt ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {jobDetail.attemptId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">BullMQ Job ID</span>
                <span className="font-mono text-indigo-500 font-medium">
                  {jobDetail.jobId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current Status</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {jobDetail.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Active Stage</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {jobDetail.stage}
                </span>
              </div>
              {jobDetail.retryCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Retry Count</span>
                  <span className="font-semibold text-amber-500">
                    {jobDetail.retryCount}
                  </span>
                </div>
              )}
            </div>

            {/* Stage Breakdown Badges */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Evaluation
                </div>
                <div
                  className={cn(
                    'font-bold mt-1 text-xs',
                    jobDetail.stages.evaluation === 'COMPLETED'
                      ? 'text-emerald-500'
                      : 'text-slate-400',
                  )}
                >
                  {jobDetail.stages.evaluation}
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Analytics
                </div>
                <div
                  className={cn(
                    'font-bold mt-1 text-xs',
                    jobDetail.stages.analytics === 'COMPLETED'
                      ? 'text-emerald-500'
                      : 'text-slate-400',
                  )}
                >
                  {jobDetail.stages.analytics}
                </div>
              </div>
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-lg text-center">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">
                  Ranking
                </div>
                <div
                  className={cn(
                    'font-bold mt-1 text-xs',
                    jobDetail.stages.ranking === 'COMPLETED'
                      ? 'text-emerald-500'
                      : 'text-slate-400',
                  )}
                >
                  {jobDetail.stages.ranking}
                </div>
              </div>
            </div>

            {/* Error Message if Failed */}
            {jobDetail.errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-300">
                <div className="font-semibold text-xs flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Failure Detail
                </div>
                <p className="text-[11px] leading-relaxed">{jobDetail.errorMessage}</p>
              </div>
            )}

            {/* Retry Button inside Modal if Failed */}
            {jobDetail.status === 'FAILED' && (
              <Button
                variant="outline"
                onClick={() => handleRetrySingle(jobDetail.jobId)}
                isLoading={retrySingleMutation.isPending}
                className="w-full border-rose-300 text-rose-700 dark:text-rose-300 hover:bg-rose-50 text-xs font-semibold"
              >
                <RotateCw className="w-3.5 h-3.5 mr-1.5" /> Retry Job Now
              </Button>
            )}
          </div>
        )}
      </Modal>

      {/* ─── Result Publication Confirmation Modal ──────────────────────── */}
      <Modal
        isOpen={isPublishModalOpen}
        onClose={() => {
          if (!publishMutation.isPending) {
            setIsPublishModalOpen(false);
            setPublishErrorMsg(null);
            setConfirmPublishChecked(false);
          }
        }}
        title="Authorize Official Result Publication"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3.5 rounded-xl text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Final Super Admin Verification
            </div>
            <p className="text-[11px] leading-relaxed">
              All {summary?.totalJobs} candidate attempts have completed evaluation, analytics, and official rank snapshots. Once published, official scorecards and percentiles will become visible to students immediately.
            </p>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmPublishChecked}
              onChange={(e) => setConfirmPublishChecked(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-slate-700 dark:text-slate-300 text-xs select-none">
              I have verified the calculations and authorize immediate transactional publication for <strong>{summary?.examTitle}</strong>.
            </span>
          </label>

          {publishErrorMsg && (
            <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs flex items-center gap-1.5">
              <XCircle className="w-4 h-4" />
              {publishErrorMsg}
            </div>
          )}

          {publishSuccessMsg && (
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              {publishSuccessMsg}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPublishModalOpen(false)}
              disabled={publishMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!confirmPublishChecked || publishMutation.isPending}
              isLoading={publishMutation.isPending}
              onClick={handleExecutePublish}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              <Send className="w-3.5 h-3.5 mr-1" /> Confirm & Publish
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminExamProcessingMonitorPage;

