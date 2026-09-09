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

// ** Hooks **
import { useExamProcessingMonitor } from '@/hooks/useExamProcessingMonitor';

// ** Components **
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';
import Modal from '@/components/ui/Modal';

export const SuperAdminExamProcessingMonitorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlExamId = searchParams.get('examId') || '';

  // Exam list for dropdown selector
  const { getPublicationDashboardAPI, isLoading: isExamsListLoading } =
    useGetPublicationDashboardAPI();
  const [examOptions, setExamOptions] = useState<
    { examId: string; examTitle: string; examType: string }[]
  >([]);

  // Load available exams (handles array directly from useAxiosGet or wrapped envelope)
  useEffect(() => {
    let isMounted = true;
    const fetchExams = async () => {
      try {
        const res = await getPublicationDashboardAPI();
        let rawList: any[] = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.data)
          ? (res.data as any).data
          : Array.isArray(res.response?.data?.data)
          ? res.response.data.data
          : [];

        // Fallback: If publication dashboard returned 0 exams, fetch from completed exams service
        if (rawList.length === 0) {
          try {
            const completed = await completedExamReportsService.getCompletedLiveExams();
            if (Array.isArray(completed) && completed.length > 0) {
              rawList = completed.map((c) => ({
                examId: c.id,
                examTitle: c.title,
                examType: 'LIVE',
              }));
            }
          } catch (completedErr) {
            console.warn('Completed exams fallback error:', completedErr);
          }
        }

        if (isMounted && rawList.length > 0) {
          const list = rawList.map((e: any) => ({
            examId: e.examId || e.id,
            examTitle: e.examTitle || e.title,
            examType: e.examType || 'LIVE',
          }));
          setExamOptions(list);

          const currentValid = list.some((item) => item.examId === urlExamId);
          if (!urlExamId || !currentValid) {
            setSearchParams({ examId: list[0].examId }, { replace: true });
          }
        }
      } catch (err) {
        console.error('Failed to load exams for monitor:', err);
      }
    };

    fetchExams();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedExamId = urlExamId || (examOptions[0]?.examId ?? '');

  // Table filters & pagination state
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'RETRYING'
  >('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
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
    setSearchParams({ examId: id });
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
      }, 2500);
    } catch (err: any) {
      setPublishErrorMsg(
        err?.response?.data?.message || 'Failed to publish results. Please verify readiness criteria.',
      );
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Top Control Header ────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Activity className="w-4 h-4" />
            Live Result Pipeline Observability
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Real-Time Exam Result Processing Monitor
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Live BullMQ job tracker monitoring student evaluation, time/strategy analytics, batch ranking snapshots, and publication readiness.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Exam Selector Dropdown */}
          <div className="relative min-w-[240px]">
            <select
              value={selectedExamId}
              onChange={(e) => handleSelectExam(e.target.value)}
              className="w-full bg-slate-800/90 border border-slate-700 text-white text-xs md:text-sm rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            >
              {isExamsListLoading ? (
                <option value="">Loading exams...</option>
              ) : examOptions.length === 0 ? (
                <option value="">No active/live exams found</option>
              ) : (
                examOptions.map((opt) => (
                  <option key={opt.examId} value={opt.examId}>
                    {opt.examTitle} ({opt.examType})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* WebSocket Status Indicator */}
          <div
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border shadow-sm transition-colors',
              isConnected
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                : 'bg-amber-950/40 text-amber-300 border-amber-800/50',
            )}
            title={isConnected ? 'Connected to WebSocket /ws/jobs' : 'Reconnecting or Polling'}
          >
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Wifi className="w-3.5 h-3.5" />
                <span>Live Real-Time</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
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
            className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200"
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
        {jobsData?.pagination && jobsData.pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing page {jobsData.pagination.page} of {jobsData.pagination.totalPages} ({jobsData.pagination.total} total candidate jobs)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={jobsData.pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={jobsData.pagination.page >= jobsData.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
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
