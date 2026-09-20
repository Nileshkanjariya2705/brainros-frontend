import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import cn from 'classnames';
import {
  Building2,
  Mail,
  Send,
  Search,
  RefreshCw,
  Award,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Target,
  BarChart3,
  Sparkles,
  X,
  ShieldCheck,
  Check,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  HelpCircle,
  Activity,
  RotateCw,
} from 'lucide-react';
import {
  completedExamReportsService,
  type AttendeeItem,
  type StudentAttemptAnalysisResponse,
} from '../services/completedExamReports.service';
import {
  useCompletedExamsQuery,
  useCompletedExamSummaryQuery,
  useCompletedExamAttendeesQuery,
} from '../services/completedExamReports.queries';
import { useGetPublicationDashboardAPI } from '@/modules/Exams/services';
import type { PublicationDashboardItem } from '@/types/exam.types';
import Skeleton from '@/components/ui/Skeleton';
import { useJobProgress } from '@/hooks/useJobProgress';
import Pagination from '@/components/ui/Pagination';

export const CompletedExamReportsPage: React.FC = () => {
  // ── URL Search Params ──
  const [searchParams, setSearchParams] = useSearchParams();
  const urlExamId = searchParams.get('examId') || '';
  const selectedExamId = urlExamId;

  // ── Directory List State (when !urlExamId) ──
  const { getPublicationDashboardAPI, isLoading: isDashboardLoading } =
    useGetPublicationDashboardAPI();
  const [directoryExams, setDirectoryExams] = useState<PublicationDashboardItem[]>([]);
  const [dirSearchInput, setDirSearchInput] = useState('');
  const [dirDebouncedSearch, setDirDebouncedSearch] = useState('');
  const [dirStatus, setDirStatus] = useState<
    'ALL' | 'READY_TO_PUBLISH' | 'PUBLISHED' | 'PROCESSING' | 'NOT_READY'
  >('ALL');
  const [dirPage, setDirPage] = useState(1);
  const [dirLimit, setDirLimit] = useState(5);
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

  // Load completed exams directory
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
          const total = (payload as any).pagination.total || 0;
          setDirTotalCount(total);
          setDirTotalPages((payload as any).pagination.totalPages || Math.ceil(total / dirLimit) || 1);
        }
        if ((payload as any).summary?.totalMonitored !== undefined) {
          setDirTotalMonitored((payload as any).summary.totalMonitored);
        }
      } else {
        const allItems = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.data)
          ? (res.data as any).data
          : Array.isArray(res.response?.data?.data)
          ? res.response.data.data
          : [];
        setDirTotalCount(allItems.length);
        setDirTotalPages(Math.ceil(allItems.length / dirLimit) || 1);
        rawList = allItems.slice((dirPage - 1) * dirLimit, dirPage * dirLimit);
      }

      // Fallback: If publication dashboard returned 0 exams, fetch from completed exams service
      if (rawList.length === 0 && !dirDebouncedSearch && dirStatus === 'ALL') {
        try {
          const completed = await completedExamReportsService.getCompletedLiveExams();
          if (Array.isArray(completed) && completed.length > 0) {
            const allItems = completed.map((c) => ({
              examId: c.id,
              examTitle: c.title,
              examTarget: c.examTarget?.name || 'LIVE',
              examStatus: 'COMPLETED',
              examType: 'LIVE',
              totalCandidates: c.totalAttempts || 0,
              finalizedAttempts: c.totalAttempts || 0,
              evaluatedAttempts: c.totalAttempts || 0,
              analyticsCompletedAttempts: c.totalAttempts || 0,
              rankingCompleted: true,
              securityReviewCompleted: true,
              publicationStatus: c.publicationStatus || 'PUBLISHED',
              isReadyToPublish: true,
              notReadyReason: null,
              publishedAt: null,
              publishedBy: null,
              publicationVersion: 1,
              lastSchedule: c.endTime
                ? { startTime: c.startTime || '', endTime: c.endTime, status: 'COMPLETED' }
                : null,
            }));
            setDirTotalCount(allItems.length);
            setDirTotalPages(Math.ceil(allItems.length / dirLimit) || 1);
            rawList = allItems.slice((dirPage - 1) * dirLimit, dirPage * dirLimit);
          }
        } catch (completedErr) {
          console.warn('Completed exams directory fallback error:', completedErr);
        }
      }

      setDirectoryExams(rawList);
    } catch (err) {
      console.error('Failed to load completed exam directory:', err);
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
      const pubA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      const pubB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
      return pubB - pubA;
    });
  }, [directoryExams]);

  // Handle Exam Selection Change
  const handleSelectExam = (id: string) => {
    if (!id) {
      setSearchParams({});
    } else {
      setSearchParams({ examId: id });
    }
    setPage(1);
    setSearchTerm('');
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

  // ── Detailed View State (when urlExamId is set) ──
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(5);

  // Filters & Sorting for attendees
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Analysis Modal State
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<StudentAttemptAnalysisResponse | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'overview' | 'subjects' | 'chapters' | 'time_strategy' | 'review'>('overview');

  // Email Confirmation & Pre-Send Inspection State
  const [emailConfirmTarget, setEmailConfirmTarget] = useState<AttendeeItem | null>(null);
  const [instituteConfirmTarget, setInstituteConfirmTarget] = useState<AttendeeItem | null>(null);
  const [emailPreviewAnalysis, setEmailPreviewAnalysis] = useState<StudentAttemptAnalysisResponse | null>(null);
  const [loadingEmailPreview, setLoadingEmailPreview] = useState<boolean>(false);
  const [emailPreviewTab, setEmailPreviewTab] = useState<'overview' | 'subjects_chapters' | 'pacing_strategy' | 'recommendations' | 'questions'>('overview');
  const [sendingEmailAttemptId, setSendingEmailAttemptId] = useState<string | null>(null);
  const [sendingInstituteEmailAttemptId, setSendingInstituteEmailAttemptId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // Send-to-All & WebSocket Progress State
  const [isSendAllModalOpen, setIsSendAllModalOpen] = useState<boolean>(false);
  const [activeBulkJobId, setActiveBulkJobId] = useState<string | null>(null);
  const [isDispatchingAll, setIsDispatchingAll] = useState<boolean>(false);

  // ── WebSocket Live Progress ──
  const bulkProgress = useJobProgress({
    queue: 'bulk-exam-report-email',
    jobId: activeBulkJobId,
    enabled: Boolean(activeBulkJobId),
    onComplete: () => {
      fetchExamDetails();
      setActionSuccessMessage('Bulk report email delivery completed successfully.');
    },
    onFailed: (event) => {
      setActionErrorMessage(event.message || 'Bulk report email delivery encountered an issue.');
    },
  });

  const { data: examsData = [] } = useCompletedExamsQuery();

  const exams = examsData;

  const {
    data: summaryData,
    isLoading: loadingSummary,
    refetch: refetchSummary,
  } = useCompletedExamSummaryQuery(selectedExamId || undefined);
  const summary = summaryData || null;

  const {
    data: attendeesResponse,
    isLoading: loadingAttendees,
    refetch: refetchAttendees,
  } = useCompletedExamAttendeesQuery(selectedExamId || undefined, {
    page,
    limit,
    search: searchTerm || undefined,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    sortBy,
    sortOrder,
  });

  const attendees = attendeesResponse?.items || [];
  const totalAttendees = attendeesResponse?.meta?.total || 0;
  const totalPages = attendeesResponse?.meta?.totalPages || 1;

  const fetchExamDetails = useCallback(() => {
    refetchSummary();
    refetchAttendees();
  }, [refetchSummary, refetchAttendees]);

  // ── Pre-send Inspection: Load analysis when emailConfirmTarget is selected ──
  useEffect(() => {
    if (!emailConfirmTarget || !selectedExamId) {
      setEmailPreviewAnalysis(null);
      setEmailPreviewTab('overview');
      return;
    }

    // Reuse if already loaded in drawer
    if (analysisData && selectedAttemptId === emailConfirmTarget.attemptId) {
      setEmailPreviewAnalysis(analysisData);
      return;
    }

    let isMounted = true;
    setLoadingEmailPreview(true);
    completedExamReportsService
      .getStudentAttemptAnalysis(selectedExamId, emailConfirmTarget.attemptId)
      .then((data) => {
        if (isMounted) {
          setEmailPreviewAnalysis(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load pre-send email analysis:', err);
      })
      .finally(() => {
        if (isMounted) {
          setLoadingEmailPreview(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [emailConfirmTarget, selectedExamId, analysisData, selectedAttemptId]);

  // ── Helper to verify if an attempt is fully evaluated ──
  const isAttemptEvaluated = (item: AttendeeItem): boolean => {
    if (item.score === null || item.score === undefined) return false;
    const resStatus = (item.resultStatus || '').toUpperCase();
    const attStatus = (item.attemptStatus || '').toUpperCase();
    if (resStatus === 'EVALUATING' || resStatus === 'PROCESSING' || resStatus === 'PENDING') {
      return false;
    }
    return (
      resStatus === 'EVALUATED' ||
      resStatus === 'PUBLISHED' ||
      resStatus === 'READY_TO_PUBLISH' ||
      attStatus === 'EVALUATED' ||
      attStatus === 'COMPLETED'
    );
  };

  // ── Open Student Analysis ──
  const handleOpenAnalysis = async (attemptId: string, item?: AttendeeItem) => {
    if (item && !isAttemptEvaluated(item)) {
      setActionErrorMessage('This exam attempt is still being evaluated. Report is only viewable once evaluation completes.');
      return;
    }
    setSelectedAttemptId(attemptId);
    setAnalysisData(null);
    setActiveAnalysisTab('overview');
    try {
      setLoadingAnalysis(true);
      const data = await completedExamReportsService.getStudentAttemptAnalysis(selectedExamId, attemptId);
      setAnalysisData(data);
    } catch (err: any) {
      setActionErrorMessage(err?.response?.data?.message || 'Failed to fetch student analysis.');
      setSelectedAttemptId(null);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // ── Trigger Email Dispatch ──
  const handleSendEmail = async (attempt: AttendeeItem) => {
    try {
      if (!isAttemptEvaluated(attempt)) {
        setActionErrorMessage('Cannot send report email for an un-evaluated attempt.');
        return;
      }
      setSendingEmailAttemptId(attempt.attemptId);
      setActionErrorMessage(null);
      const res = await completedExamReportsService.sendStudentReportEmail(selectedExamId, attempt.attemptId);

      setActionSuccessMessage(`Report email queued for ${attempt.studentName} (${res.recipientEmail || attempt.email}).`);
      setEmailConfirmTarget(null);

      // Refresh list to update status pill
      fetchExamDetails();

      // If analysis drawer is currently open for this attempt, update its status
      if (selectedAttemptId === attempt.attemptId) {
        setAnalysisData((prev) =>
          prev
            ? {
                ...prev,
                emailStatus: {
                  status: 'QUEUED',
                  sentAt: null,
                  messageId: null,
                  error: null,
                },
              }
            : null,
        );
      }
    } catch (err: any) {
      setActionErrorMessage(err?.response?.data?.message || 'Failed to queue report email.');
    } finally {
      setSendingEmailAttemptId(null);
      setTimeout(() => setActionSuccessMessage(null), 6000);
    }
  };

  // ── Trigger Institute Email Dispatch ──
  const handleSendInstituteEmail = async (attempt: AttendeeItem) => {
    try {
      setSendingInstituteEmailAttemptId(attempt.attemptId);
      setActionErrorMessage(null);
      const res = await completedExamReportsService.sendReportToInstitute(selectedExamId, attempt.attemptId);

      setActionSuccessMessage(
        res.message || `Student analysis report has been queued for sending to the institute.`
      );
      setInstituteConfirmTarget(null);
      fetchExamDetails();
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Unable to queue the report email. Please try again.';
      setActionErrorMessage(errorMsg);
    } finally {
      setSendingInstituteEmailAttemptId(null);
      setTimeout(() => setActionSuccessMessage(null), 6000);
    }
  };

  // ── Trigger Bulk Email Dispatch to All Evaluated Attendees ──
  const handleSendAllReports = async () => {
    if (!selectedExamId) return;
    try {
      setIsDispatchingAll(true);
      setActionErrorMessage(null);
      const res = await completedExamReportsService.sendAllReportEmails(selectedExamId);
      setActiveBulkJobId(res.jobId);
      setIsSendAllModalOpen(false);
      setActionSuccessMessage(
        res.message || `Bulk report email dispatch initiated for ${res.totalAttendees} candidates.`
      );
    } catch (err: any) {
      setActionErrorMessage(
        err?.response?.data?.message || 'Failed to initiate bulk email dispatch for all candidates.'
      );
    } finally {
      setIsDispatchingAll(false);
      setTimeout(() => setActionSuccessMessage(null), 6000);
    }
  };

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  // ═════════════════════════════════════════════════════════════════════
  // VIEW 1: COMPLETED EXAMS DIRECTORY LIST VIEW (WHEN !urlExamId)
  // ═════════════════════════════════════════════════════════════════════
  if (!urlExamId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 space-y-6">
        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-semibold uppercase tracking-wider mb-1">
              <Activity className="w-4 h-4" />
              Completed Live Exam Reports
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
              Completed Live Exam Directory
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-2xl">
              Select a completed live exam to view student attendee scorecards, deep diagnostic analytics & bulk PDF email dispatch.
            </p>
          </div>

          <button
            onClick={() => loadDirectoryExams()}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-xs transition-all"
          >
            <RotateCw className={cn('w-4 h-4', isDashboardLoading && 'animate-spin')} />
            Refresh Directory
          </button>
        </div>

        {/* ── Metric Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Monitored Exams
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {dirTotalMonitored || dirTotalCount}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Completed live exam pipelines</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Ready To Publish
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-2">
              {sortedDirectoryExams.filter((e) => e.publicationStatus === 'READY_TO_PUBLISH').length}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Evaluated scorecards ready</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Published Results
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-blue-700 mt-2">
              {sortedDirectoryExams.filter((e) => e.publicationStatus === 'PUBLISHED').length}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Published to student portals</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                In Progress
              </span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-700 mt-2">
              {
                sortedDirectoryExams.filter(
                  (e) =>
                    e.publicationStatus === 'NOT_READY' || e.publicationStatus === 'PROCESSING',
                ).length
              }
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">Active evaluation pipelines</span>
          </div>
        </div>

        {/* ── Directory Table Card ── */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Toolbar: Search + Status Tabs + Sort Indicator */}
          <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search exam by title or target..."
                value={dirSearchInput}
                onChange={(e) => setDirSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Sort Order Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sorted by Latest Completed</span>
              </div>
            </div>
          </div>

          {/* Directory Table */}
          <div className="overflow-x-auto">
            {isDashboardLoading ? (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Exam Title & Target</th>
                    <th className="py-3.5 px-6">Completed / Schedule</th>
                    <th className="py-3.5 px-6">Attempts</th>
                    <th className="py-3.5 px-6 w-48">Evaluated Progress</th>
                    <th className="py-3.5 px-6">Result Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-4 px-6"><Skeleton className="h-4 w-40 rounded" /><Skeleton className="h-3 w-20 rounded mt-1.5" /></td>
                      <td className="py-4 px-6"><Skeleton className="h-4 w-28 rounded" /></td>
                      <td className="py-4 px-6"><Skeleton className="h-4 w-24 rounded" /></td>
                      <td className="py-4 px-6"><Skeleton className="h-3 w-36 rounded" /></td>
                      <td className="py-4 px-6"><Skeleton className="h-5 w-24 rounded-full" /></td>
                      <td className="py-4 px-6 text-right"><Skeleton className="h-8 w-24 rounded ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : sortedDirectoryExams.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-medium text-slate-700">No completed live exams found</p>
                <p className="text-xs text-slate-400 mt-1">
                  Try adjusting your search terms or status filter.
                </p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Exam Title & Target</th>
                    <th className="py-3.5 px-6">Completed / Schedule</th>
                    <th className="py-3.5 px-6">Attempts</th>
                    <th className="py-3.5 px-6 w-48">Evaluated Progress</th>
                    <th className="py-3.5 px-6">Result Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
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
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                        onClick={() => handleSelectExam(exam.examId)}
                      >
                        {/* Exam Name & Target */}
                        <td className="py-4 px-6 align-middle">
                          <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {exam.examTitle}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-slate-500">
                              {exam.examTarget || 'General Target'}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                                exam.examType === 'LIVE'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-indigo-100 text-indigo-700',
                              )}
                            >
                              {exam.examType || 'LIVE'}
                            </span>
                          </div>
                        </td>

                        {/* Completed Date */}
                        <td className="py-4 px-6 align-middle text-slate-600">
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
                        <td className="py-4 px-6 align-middle">
                          <div className="flex items-center gap-1 text-slate-800 font-medium text-xs">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>{exam.finalizedAttempts || exam.totalCandidates || 0} Attendees</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {exam.evaluatedAttempts} Evaluated
                          </div>
                        </td>

                        {/* Evaluation Progress Bar */}
                        <td className="py-4 px-6 align-middle">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold">
                              <span className="text-slate-700">{evalPercentage}%</span>
                              <span className="text-slate-400">
                                {exam.evaluatedAttempts} / {exam.finalizedAttempts || exam.evaluatedAttempts}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full transition-all duration-300 rounded-full',
                                  evalPercentage === 100 ? 'bg-emerald-500' : 'bg-indigo-600',
                                )}
                                style={{ width: `${evalPercentage}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Pipeline Status */}
                        <td className="py-4 px-6 align-middle">
                          {exam.publicationStatus === 'READY_TO_PUBLISH' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ready to Publish
                            </span>
                          ) : exam.publicationStatus === 'PUBLISHED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              <Award className="w-3.5 h-3.5" /> Published
                            </span>
                          ) : exam.publicationStatus === 'PROCESSING' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
                              <RotateCw className="w-3.5 h-3.5 animate-spin" /> Processing
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              <Clock className="w-3.5 h-3.5" /> In Progress
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-4 px-6 align-middle text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectExam(exam.examId);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 ml-auto"
                          >
                            Inspect Reports <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Directory Pagination Footer */}
          {dirTotalCount > 0 && (
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-3">
                <span>
                  Showing <b>{dirTotalCount === 0 ? 0 : (dirPage - 1) * dirLimit + 1}</b>–
                  <b>{Math.min(dirPage * dirLimit, dirTotalCount)}</b> of <b>{dirTotalCount}</b> exams
                </span>
                <div className="flex items-center gap-1.5 border-l border-slate-200 pl-3">
                  <span>Per page:</span>
                  <select
                    value={dirLimit}
                    onChange={(e) => {
                      setDirLimit(Number(e.target.value));
                      setDirPage(1);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>

              {(dirTotalPages > 1 || Math.ceil(dirTotalCount / dirLimit) > 1) && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={dirPage <= 1}
                    onClick={() => setDirPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-xs transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                  <span className="px-2 font-bold text-slate-700">
                    Page {dirPage} of {dirTotalPages || Math.ceil(dirTotalCount / dirLimit) || 1}
                  </span>
                  <button
                    disabled={dirPage >= (dirTotalPages || Math.ceil(dirTotalCount / dirLimit) || 1)}
                    onClick={() => setDirPage((p) => p + 1)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 shadow-xs transition-all"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // VIEW 2: DETAILED ATTENDEE PERFORMANCE REPORTS (WHEN urlExamId IS SET)
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 space-y-6">
      {/* ── Toast Messages ── */}
      {actionSuccessMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3.5 rounded-xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{actionSuccessMessage}</span>
          <button onClick={() => setActionSuccessMessage(null)} className="ml-2 text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-rose-50 border border-rose-200 text-rose-800 px-5 py-3.5 rounded-xl shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span className="text-sm font-medium">{actionErrorMessage}</span>
          <button onClick={() => setActionErrorMessage(null)} className="ml-2 text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PAGE HEADER & EXAM SELECTOR
      ═══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => handleSelectExam('')}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Exam Directory
            </button>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Live Exams Only
              </span>
              <span>• Mock Tests Excluded</span>
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {summary?.examTitle || selectedExam?.title || 'Completed Live Exam Reports'}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Authoritative student attendee performance directory, deep diagnostic analytics & automated PDF dispatch.
          </p>
        </div>

        {/* Exam Dropdown Selector */}
        <div className="flex items-center gap-3">
          <div className="relative min-w-[280px] md:min-w-[340px]">
            <select
              value={selectedExamId}
              onChange={(e) => handleSelectExam(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-slate-800 px-4 py-2.5 pr-10 rounded-xl text-sm font-medium shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">← Back to Exam Directory</option>
              {exams.map((exam, idx) => (
                <option key={exam.id} value={exam.id}>
                  {idx === 0 ? `★ [Latest] ${exam.title}` : exam.title}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              ▼
            </div>
          </div>

          <button
            onClick={() => fetchExamDetails()}
            disabled={loadingAttendees || loadingSummary}
            className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 transition-all shadow-xs"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${(loadingAttendees || loadingSummary) ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          {/* Send to All Button */}
          <button
            onClick={() => setIsSendAllModalOpen(true)}
            disabled={
              !selectedExam ||
              !summary ||
              summary.metrics.evaluated === 0 ||
              loadingSummary ||
              isDispatchingAll ||
              bulkProgress.isProcessing
            }
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-100 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title={
              !summary || summary.metrics.evaluated === 0
                ? 'No evaluated candidates available for this exam yet.'
                : 'Send official analysis report PDFs to all evaluated student attendees'
            }
          >
            <Send className={`w-4 h-4 ${bulkProgress.isProcessing ? 'animate-pulse' : ''}`} />
            <span>Send to All ({summary?.metrics?.evaluated ?? 0})</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          EXAM SUMMARY KPI TILES
      ═══════════════════════════════════════════════════════════════ */}
      {selectedExam && summary && (
        <div className="grid grid-cols-1 min-[360px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
          {/* Registered */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>REGISTERED</span>
              <Users className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-slate-900 mt-1.5">
              {summary.metrics.registered.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Eligible Cohort</div>
          </div>

          {/* Attended */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>ATTENDED</span>
              <Target className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-indigo-600 mt-1.5">
              {summary.metrics.attended.toLocaleString()}
            </div>
            <div className="text-[11px] text-indigo-600 mt-0.5">
              {summary.metrics.registered > 0
                ? `${((summary.metrics.attended / summary.metrics.registered) * 100).toFixed(1)}% Turnout`
                : 'Active Attempts'}
            </div>
          </div>

          {/* Evaluated */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>EVALUATED</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-emerald-600 mt-1.5">
              {summary.metrics.evaluated.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">
              {summary.metrics.failed > 0 ? `${summary.metrics.failed} Failed` : '0 Processing Errors'}
            </div>
          </div>

          {/* Average Score */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>AVG SCORE</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-amber-600 mt-1.5">
              {summary.metrics.averageScore}
              <span className="text-xs font-normal text-slate-500 ml-1">/ {summary.totalMarks}</span>
            </div>
            <div className="text-[11px] text-amber-600 mt-0.5">
              {summary.metrics.averagePercentage}% Marks
            </div>
          </div>

          {/* Average Accuracy */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>AVG ACCURACY</span>
              <BarChart3 className="w-4 h-4 text-cyan-600" />
            </div>
            <div className="text-xl md:text-2xl font-bold text-cyan-600 mt-1.5">
              {summary.metrics.averageAccuracy}%
            </div>
            <div className="text-[11px] text-cyan-600 mt-0.5">
              High: {summary.metrics.highestScore} pts
            </div>
          </div>

          {/* Publication Status */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>RESULT STATUS</span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <div className="mt-2">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                  summary.publication.status === 'PUBLISHED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : summary.publication.status === 'READY_TO_PUBLISH'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {summary.publication.status === 'PUBLISHED' ? '✓ PUBLISHED' : summary.publication.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {summary.publication.publishedAt
                ? `On ${new Date(summary.publication.publishedAt).toLocaleDateString()}`
                : 'Official Release'}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          LIVE WEBSOCKET BULK REPORT PROGRESS BAR
      ═══════════════════════════════════════════════════════════════ */}
      {activeBulkJobId && (
        <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-xs space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <Send className={`w-5 h-5 ${bulkProgress.isProcessing ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    Bulk Email Dispatch: {selectedExam?.title}
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      bulkProgress.isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : bulkProgress.isFailed
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        bulkProgress.isCompleted
                          ? 'bg-emerald-500'
                          : bulkProgress.isFailed
                          ? 'bg-rose-500'
                          : 'bg-indigo-500 animate-ping'
                      }`}
                    />
                    {bulkProgress.status === 'COMPLETED'
                      ? 'Completed'
                      : bulkProgress.status === 'FAILED'
                      ? 'Failed'
                      : 'Live Dispatching (WebSocket)'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {bulkProgress.message ||
                    (bulkProgress.isCompleted
                      ? 'All candidate reports generated and dispatched.'
                      : 'Preparing PDF reports and streaming real-time status...')}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="text-right">
                <div className="text-base font-bold text-slate-900 font-mono">
                  {bulkProgress.current} / {bulkProgress.total || summary?.metrics?.evaluated || 0}
                </div>
                <div className="text-[11px] text-slate-500 font-mono font-medium">
                  {bulkProgress.percentage}% Processed
                </div>
              </div>

              {(bulkProgress.isCompleted || bulkProgress.isFailed) && (
                <button
                  onClick={() => setActiveBulkJobId(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Dismiss Progress Banner"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar Track & Fill */}
          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${
                bulkProgress.isCompleted
                  ? 'bg-emerald-500'
                  : bulkProgress.isFailed
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
              }`}
              style={{ width: `${bulkProgress.percentage}%` }}
            />
          </div>

          {bulkProgress.isCompleted && (
            <div className="flex items-center justify-between text-xs text-emerald-800 bg-emerald-50/90 px-3.5 py-2.5 rounded-xl border border-emerald-200">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All report emails queued and dispatched successfully to student mailboxes.</span>
              </span>
              <button
                onClick={() => {
                  fetchExamDetails();
                  setActiveBulkJobId(null);
                }}
                className="font-bold text-emerald-700 hover:text-emerald-900 underline ml-2 shrink-0"
              >
                Refresh & Dismiss
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          FILTER & SEARCH TOOLBAR
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, code, email, phone..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 text-slate-900 pl-10 pr-4 py-2 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="AUTO_SUBMITTED">Auto Submitted</option>
              <option value="EVALUATED">Evaluated</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs px-3 py-2 rounded-xl focus:border-indigo-500 focus:outline-none"
            >
              <option value="submittedAt">Submitted Time</option>
              <option value="score">Total Score</option>
              <option value="accuracy">Accuracy</option>
              <option value="studentName">Student Name</option>
            </select>

            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-slate-900"
              title="Toggle Sort Order"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          ATTENDEES TABLE
      ═══════════════════════════════════════════════════════════════ */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Attempt Status</th>
                <th className="px-6 py-4 text-right">Score</th>
                <th className="px-6 py-4 text-right">Accuracy</th>
                <th className="px-6 py-4 text-right">Overall Rank</th>
                <th className="px-6 py-4 text-center">Result Status</th>
                <th className="px-6 py-4 text-center">Report Status</th>
                <th className="px-6 py-4 text-center">Email Report</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingAttendees ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading attendee results...
                  </td>
                </tr>
              ) : attendees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    No attendees matched the current criteria for this Live Exam.
                  </td>
                </tr>
              ) : (
                attendees.map((item) => (
                  <tr key={item.attemptId} className="hover:bg-slate-50/80 transition-colors">
                    {/* Student Info */}
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.studentName}</div>
                      <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-indigo-600">{item.studentCode}</span>
                        <span>•</span>
                        <span>{item.email}</span>
                      </div>
                    </td>

                    {/* Attempt Status */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {item.attemptStatus}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-6 py-4 text-right font-mono">
                      {item.score !== null ? (
                        <div>
                          <span className="font-bold text-slate-900 text-base">{item.score}</span>
                          <span className="text-xs text-slate-500"> / {item.maxScore}</span>
                          <div className="text-[11px] text-slate-500">{Number(item.percentage || 0).toFixed(1)}%</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Accuracy */}
                    <td className="px-6 py-4 text-right font-mono font-medium">
                      {item.accuracy !== null ? (
                        <span className={`${item.accuracy >= 70 ? 'text-emerald-600' : item.accuracy >= 40 ? 'text-amber-600' : 'text-rose-600'}`}>
                          {Number(item.accuracy).toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Rank */}
                    <td className="px-6 py-4 text-right font-mono font-medium">
                      {item.rank ? (
                        <div>
                          <span className="text-indigo-600 font-bold">#{item.rank.toLocaleString()}</span>
                          {item.percentile !== null && (
                            <div className="text-[10px] text-slate-500">{Number(item.percentile).toFixed(1)}%ile</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Result Status */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.resultStatus === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.resultStatus === 'READY_TO_PUBLISH'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : item.resultStatus === 'EVALUATED'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.resultStatus}
                      </span>
                    </td>

                    {/* Report Status */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          item.reportStatus === 'APPROVED'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : item.reportStatus === 'EMAILED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.reportStatus === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.reportStatus === 'READY_FOR_REVIEW'
                          ? 'Ready for Review'
                          : item.reportStatus || 'Pending'}
                      </span>
                    </td>

                    {/* Email Status Pill */}
                    <td className="px-6 py-4 text-center">
                      {item.emailStatus === 'SENT' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200" title={item.lastEmailSentAt ? `Sent at ${new Date(item.lastEmailSentAt).toLocaleString()}` : 'Delivered'}>
                          <Check className="w-3 h-3" /> Sent
                        </span>
                      ) : item.emailStatus === 'QUEUED' || item.emailStatus === 'PROCESSING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                          <Clock className="w-3 h-3" /> Queued...
                        </span>
                      ) : item.emailStatus === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3" /> Failed
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Not Sent</span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* View Analysis */}
                        <button
                          onClick={() => handleOpenAnalysis(item.attemptId, item)}
                          disabled={!isAttemptEvaluated(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-50 disabled:hover:text-slate-700"
                          title={
                            !isAttemptEvaluated(item)
                              ? 'Evaluation in progress. Report is only viewable once exam evaluation is completed.'
                              : 'View Student Detailed Analysis & Report'
                          }
                        >
                          <BarChart3 className={`w-3.5 h-3.5 ${isAttemptEvaluated(item) ? 'text-indigo-600' : 'text-slate-400'}`} />
                          View
                        </button>

                        {/* Send Email */}
                        <button
                          onClick={() => setEmailConfirmTarget(item)}
                          disabled={
                            sendingEmailAttemptId === item.attemptId ||
                            !isAttemptEvaluated(item) ||
                            !item.email
                          }
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                          title={
                            !isAttemptEvaluated(item)
                              ? 'Attempt has not been evaluated yet. Please wait for evaluation to complete.'
                              : !item.email
                              ? 'No registered student email'
                              : 'Send Report as PDF by Email'
                          }
                        >
                          {sendingEmailAttemptId === item.attemptId ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : item.emailStatus === 'SENT' ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5" />
                              Resend
                            </>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              Send
                            </>
                          )}
                        </button>

                        {/* Send to Institute */}
                        <button
                          onClick={() => setInstituteConfirmTarget(item)}
                          disabled={
                            sendingInstituteEmailAttemptId === item.attemptId ||
                            !isAttemptEvaluated(item)
                          }
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                          title={
                            !isAttemptEvaluated(item)
                              ? 'Attempt has not been evaluated yet. Please wait for evaluation to complete.'
                              : item.institutionName
                              ? `Send Report to Institute (${item.institutionName})`
                              : 'Send Report to Student\'s Institute'
                          }
                        >
                          {sendingInstituteEmailAttemptId === item.attemptId ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                          ) : (
                            <>
                              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                              Send to Institute
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalAttendees > 0 && (
          <div className="p-4 border-t border-slate-200">
            <Pagination
              page={page}
              totalPages={totalPages || 1}
              total={totalAttendees}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(newLimit) => {
                setLimit(newLimit);
                setPage(1);
              }}
              limitOptions={[5, 10, 20, 50]}
              isFetching={loadingAttendees}
              itemName="attendees"
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          EMAIL CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════
          EMAIL CONFIRMATION & PRE-SEND INSPECTION MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {emailConfirmTarget && (() => {
        const previewAnalysis = emailPreviewAnalysis?.analysis;
        const previewRank = emailPreviewAnalysis?.rank || {
          rank: emailConfirmTarget.rank,
          percentile: emailConfirmTarget.percentile,
          totalCandidates: null,
        };
        const previewQuestions = emailPreviewAnalysis?.questionsReview || [];

        const score = previewAnalysis?.score ?? previewAnalysis?.totalScore ?? previewAnalysis?.overall?.obtainedMarks ?? emailConfirmTarget.score ?? 0;
        const maxScore = previewAnalysis?.maxScore ?? previewAnalysis?.overall?.totalMarks ?? emailConfirmTarget.maxScore ?? selectedExam?.totalMarks ?? 0;
        const percentage = previewAnalysis?.percentage ?? previewAnalysis?.overall?.percentage ?? emailConfirmTarget.percentage ?? 0;
        const accuracy = previewAnalysis?.accuracy ?? previewAnalysis?.overall?.accuracy ?? emailConfirmTarget.accuracy ?? 0;
        const correctAnswers = previewAnalysis?.correctAnswers ?? previewAnalysis?.overall?.correctCount ?? (previewQuestions.filter((q) => q.isCorrect).length);
        const wrongAnswers = previewAnalysis?.wrongAnswers ?? previewAnalysis?.overall?.wrongCount ?? (previewQuestions.filter((q) => q.isAttempted && !q.isCorrect).length);
        const unattempted = previewAnalysis?.unattempted ?? previewAnalysis?.overall?.unattemptedCount ?? (previewQuestions.filter((q) => !q.isAttempted).length);
        const timeUsedSeconds = previewAnalysis?.timeUsedSeconds ?? previewAnalysis?.overall?.timeUsedSeconds ?? previewAnalysis?.timeAnalysis?.totalTimeUsedSeconds ?? 0;
        const avgTime = Number(previewAnalysis?.averageTimePerQuestion ?? previewAnalysis?.overall?.averageTimePerQuestionSeconds ?? previewAnalysis?.timeAnalysis?.averageTimePerQuestionSeconds ?? 0).toFixed(1);
        const quadrant = (previewAnalysis?.quadrant ?? previewAnalysis?.overall?.speedAccuracyQuadrant ?? 'BALANCED').replace(/_/g, ' ');
        const avoidableNegatives = previewAnalysis?.strategyAnalysis?.avoidableNegativeMarks ?? previewAnalysis?.attemptStrategy?.negativeMarkingPenalty ?? Math.round(wrongAnswers * 1);
        const projectedScore = previewAnalysis?.strategyAnalysis?.projectedScore ?? previewAnalysis?.attemptStrategy?.scoreWithoutNegativeMarking ?? (score + wrongAnswers);

        const subjects = previewAnalysis?.subjectAnalysis || previewAnalysis?.subjectResults || previewAnalysis?.subjects?.items || [];
        const chapters = previewAnalysis?.chapterAnalysis || previewAnalysis?.chapterResults || previewAnalysis?.chapters?.items || [];
        const masteredChapters = chapters.filter((c: any) => (c.accuracy ?? 0) >= 70);
        const criticalChapters = chapters.filter((c: any) => (c.accuracy ?? 0) < 50);
        const recommendations = previewAnalysis?.recommendations || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-5 md:p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg md:text-xl">
                      Pre-Send Report Inspection
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Verify complete student diagnostics before dispatching authoritative PDF report
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEmailConfirmTarget(null)}
                  className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Student & Verified Recipient Strip */}
              <div className="px-6 py-3 bg-indigo-50/60 border-b border-indigo-100/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{emailConfirmTarget.studentName}</span>
                  <span className="font-mono text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200 font-semibold">
                    {emailConfirmTarget.studentCode}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 truncate max-w-[220px]">{selectedExam?.title}</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{emailConfirmTarget.email}</span>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="px-6 border-b border-slate-200 bg-slate-50/40 flex gap-1 overflow-x-auto text-xs font-semibold shrink-0">
                <button
                  onClick={() => setEmailPreviewTab('overview')}
                  className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
                    emailPreviewTab === 'overview'
                      ? 'border-indigo-600 text-indigo-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  Overview & KPIs
                </button>
                <button
                  onClick={() => setEmailPreviewTab('subjects_chapters')}
                  className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
                    emailPreviewTab === 'subjects_chapters'
                      ? 'border-indigo-600 text-indigo-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5" />
                  Subjects & Chapters ({subjects.length})
                </button>
                <button
                  onClick={() => setEmailPreviewTab('pacing_strategy')}
                  className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
                    emailPreviewTab === 'pacing_strategy'
                      ? 'border-indigo-600 text-indigo-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Pacing & Strategy
                </button>
                <button
                  onClick={() => setEmailPreviewTab('recommendations')}
                  className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
                    emailPreviewTab === 'recommendations'
                      ? 'border-indigo-600 text-indigo-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Recommendations ({recommendations.length})
                </button>
                <button
                  onClick={() => setEmailPreviewTab('questions')}
                  className={`py-3 px-3.5 border-b-2 transition-all flex items-center gap-1.5 ${
                    emailPreviewTab === 'questions'
                      ? 'border-indigo-600 text-indigo-600 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Questions Audit ({previewQuestions.length})
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5">
                {loadingEmailPreview ? (
                  <div className="text-center py-16 text-slate-500">
                    <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading authoritative student diagnostics for pre-send inspection...
                  </div>
                ) : (
                  <>
                    {/* TAB 1: OVERVIEW & KPIS */}
                    {emailPreviewTab === 'overview' && (
                      <div className="space-y-5">
                        {/* KPI Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <span className="text-[11px] text-slate-500 font-semibold uppercase">Total Score</span>
                            <div className="text-2xl font-bold text-slate-900 mt-1">
                              {score}
                              <span className="text-xs font-normal text-slate-500 ml-1">/ {maxScore}</span>
                            </div>
                            <div className="text-xs text-indigo-600 mt-1 font-semibold">
                              {Number(percentage).toFixed(1)}% Marks
                            </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <span className="text-[11px] text-slate-500 font-semibold uppercase">Accuracy</span>
                            <div className="text-2xl font-bold text-emerald-600 mt-1">
                              {Number(accuracy).toFixed(1)}%
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              ✓ {correctAnswers} | ✗ {wrongAnswers} | — {unattempted}
                            </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <span className="text-[11px] text-slate-500 font-semibold uppercase">Official Rank</span>
                            <div className="text-2xl font-bold text-indigo-600 mt-1">
                              {previewRank?.rank ? `#${previewRank.rank.toLocaleString()}` : '—'}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              {previewRank?.percentile !== null && previewRank?.percentile !== undefined
                                ? `${Number(previewRank.percentile).toFixed(1)}%ile`
                                : 'Cohort standing'}
                            </div>
                          </div>

                          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                            <span className="text-[11px] text-slate-500 font-semibold uppercase">Time & Speed</span>
                            <div className="text-2xl font-bold text-amber-600 mt-1">
                              {timeUsedSeconds > 0 ? `${Math.floor(timeUsedSeconds / 60)}m ${timeUsedSeconds % 60}s` : '—'}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              Avg {avgTime}s / question
                            </div>
                          </div>
                        </div>

                        {/* Status & Diagnostics Strip */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-500 uppercase">Speed-Accuracy Profile</span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                                {quadrant}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              Diagnosis:{' '}
                              <strong>
                                {quadrant.includes('RUSHED')
                                  ? 'Candidate answers quickly but incurs avoidable error penalties.'
                                  : quadrant.includes('METHODICAL')
                                  ? 'Candidate maintains solid accuracy with disciplined pacing.'
                                  : 'Candidate has a balanced pace across sections.'}
                              </strong>
                            </p>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-500 uppercase">Negative Marking Loss</span>
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                −{avoidableNegatives} Marks
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">
                              Eliminating negative guesses could elevate score to{' '}
                              <strong className="text-emerald-700 font-mono">~{projectedScore} marks</strong>.
                            </p>
                          </div>
                        </div>

                        {/* PDF Dispatch Notice */}
                        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-3">
                          <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <div className="font-bold">Authoritative 3-Page PDF Report Attachment</div>
                            <p className="text-indigo-800">
                              The attached PDF generated by the background queue will include Executive KPIs, Subject & Chapter Diagnostics, Time Pacing Quadrants, Strategy Analysis, Personalized Action Steps, and the complete Question Review.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: SUBJECTS & CHAPTERS */}
                    {emailPreviewTab === 'subjects_chapters' && (
                      <div className="space-y-5">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm mb-3">Subject-Wise Breakdown</h4>
                          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                            <table className="w-full text-left text-xs text-slate-700">
                              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                                <tr>
                                  <th className="px-4 py-3">Subject</th>
                                  <th className="px-4 py-3 text-right">Score</th>
                                  <th className="px-4 py-3 text-right">Correct</th>
                                  <th className="px-4 py-3 text-right">Wrong</th>
                                  <th className="px-4 py-3 text-right">Skipped</th>
                                  <th className="px-4 py-3 text-right">Accuracy</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {subjects.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="text-center py-6 text-slate-400">
                                      No subject breakdown available
                                    </td>
                                  </tr>
                                ) : (
                                  subjects.map((sub: any, i: number) => (
                                    <tr key={i} className="hover:bg-slate-50/80">
                                      <td className="px-4 py-3 font-bold text-slate-900">
                                        {sub.subjectName || sub.name || sub.subject?.name}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono font-semibold text-indigo-600">
                                        {sub.score ?? sub.totalScore ?? 0} / {sub.maxScore ?? '—'}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                                        {sub.correct ?? sub.correctAnswers ?? 0}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">
                                        {sub.wrong ?? sub.wrongAnswers ?? 0}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono text-slate-500">
                                        {sub.unattempted ?? 0}
                                      </td>
                                      <td className="px-4 py-3 text-right font-mono font-bold text-cyan-600">
                                        {Number(sub.accuracy || 0).toFixed(1)}%
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Chapter Diagnostic Pills */}
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 space-y-2.5">
                            <span className="text-xs font-bold text-emerald-800 uppercase flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Mastered Chapters (≥ 70% Accuracy)
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {masteredChapters.length === 0 ? (
                                <span className="text-xs text-slate-500 italic">No chapters currently ≥70%</span>
                              ) : (
                                masteredChapters.map((ch: any, i: number) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-medium border border-emerald-200"
                                  >
                                    {ch.chapterName || ch.name}: {Number(ch.accuracy || 0).toFixed(0)}%
                                  </span>
                                ))
                              )}
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200 space-y-2.5">
                            <span className="text-xs font-bold text-rose-800 uppercase flex items-center gap-1.5">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                              Critical Revision Focus (&lt; 50% Accuracy)
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {criticalChapters.length === 0 ? (
                                <span className="text-xs text-slate-500 italic">No critical chapters &lt;50%</span>
                              ) : (
                                criticalChapters.map((ch: any, i: number) => (
                                  <span
                                    key={i}
                                    className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 text-xs font-medium border border-rose-200"
                                  >
                                    {ch.chapterName || ch.name}: {Number(ch.accuracy || 0).toFixed(0)}%
                                  </span>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: PACING & STRATEGY */}
                    {emailPreviewTab === 'pacing_strategy' && (
                      <div className="space-y-5">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                            <h5 className="font-bold text-indigo-700 text-xs uppercase tracking-wider">
                              Time Allocation & Pacing
                            </h5>
                            <div className="space-y-2 text-xs text-slate-700">
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500">Average Time / Question:</span>
                                <span className="font-mono font-bold text-slate-900">{avgTime}s</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500">Rushed Questions (&lt;30s):</span>
                                <span className="font-mono font-bold text-rose-600">
                                  {previewAnalysis?.timeAnalysis?.rushedCount ?? 0}
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500">Optimal Pacing (30s–90s):</span>
                                <span className="font-mono font-bold text-emerald-600">
                                  {previewAnalysis?.timeAnalysis?.optimalCount ?? 0}
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500">Overthought (&gt;90s):</span>
                                <span className="font-mono font-bold text-amber-600">
                                  {previewAnalysis?.timeAnalysis?.overthoughtCount ?? 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                            <h5 className="font-bold text-emerald-700 text-xs uppercase tracking-wider">
                              Strategy Diagnostics & Negative Marking
                            </h5>
                            <div className="space-y-2 text-xs text-slate-700">
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500">Avoidable Negative Deductions:</span>
                                <span className="font-mono font-bold text-rose-600">−{avoidableNegatives} Marks</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500">Potential Score Without Guessing:</span>
                                <span className="font-mono font-bold text-emerald-600">~{projectedScore} Marks</span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500">Risk Profile:</span>
                                <span className="font-bold text-indigo-700">
                                  {(previewAnalysis?.attemptStrategy?.riskProfile || previewAnalysis?.strategyAnalysis?.primaryClassification || 'BALANCED').replace(/_/g, ' ')}
                                </span>
                              </div>
                              <div className="flex justify-between py-1.5 border-b border-slate-200">
                                <span className="text-slate-500">Confidence Level:</span>
                                <span className="font-semibold text-emerald-700">
                                  {previewAnalysis?.strategyAnalysis?.confidence || 'HIGH'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {previewAnalysis?.attemptStrategy?.takeaways && (
                          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200 text-xs text-slate-700">
                            <strong className="font-semibold text-indigo-900 block mb-1">Strategic Takeaway:</strong>
                            {previewAnalysis.attemptStrategy.takeaways}
                          </div>
                        )}
                      </div>
                    )}

                    {/* TAB 4: RECOMMENDATIONS */}
                    {emailPreviewTab === 'recommendations' && (
                      <div className="space-y-3">
                        {recommendations.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 text-xs">
                            No personalized recommendations available.
                          </div>
                        ) : (
                          recommendations.map((rec: any, i: number) => (
                            <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">{rec.title}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    rec.priority === 'HIGH'
                                      ? 'bg-rose-100 text-rose-800'
                                      : 'bg-amber-100 text-amber-800'
                                  }`}
                                >
                                  {rec.priority || 'MEDIUM'} Priority
                                </span>
                              </div>
                              <p className="text-slate-600">{rec.description}</p>
                              {rec.action && (
                                <div className="text-indigo-600 font-medium pt-1">
                                  👉 Action: {rec.action}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* TAB 5: QUESTIONS AUDIT */}
                    {emailPreviewTab === 'questions' && (
                      <div className="space-y-3">
                        <div className="text-xs text-slate-500 flex justify-between items-center pb-1">
                          <span>Showing all {previewQuestions.length} responses evaluated</span>
                          <span className="font-semibold text-indigo-600">Attached to Email PDF Report</span>
                        </div>

                        <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                          {previewQuestions.map((q: any, idx: number) => (
                            <div
                              key={idx}
                              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                                !q.isAttempted
                                  ? 'bg-slate-50 border-slate-200'
                                  : q.isCorrect
                                  ? 'bg-emerald-50/60 border-emerald-200'
                                  : 'bg-rose-50/60 border-rose-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">
                                  Q{q.displayOrder || idx + 1}. {q.sectionName || 'Question'}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                    !q.isAttempted
                                      ? 'bg-slate-200 text-slate-700'
                                      : q.isCorrect
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-rose-100 text-rose-800'
                                  }`}
                                >
                                  {!q.isAttempted ? 'Unattempted' : q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                </span>
                              </div>
                              <p className="text-slate-700 line-clamp-2">{q.questionText}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">Email verified: <strong>{emailConfirmTarget.email}</strong></span>
                </div>

                <div className="flex items-center justify-end gap-2.5 sm:gap-3">
                  <button
                    onClick={() => setEmailConfirmTarget(null)}
                    className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs transition-all shadow-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSendEmail(emailConfirmTarget)}
                    disabled={sendingEmailAttemptId === emailConfirmTarget.attemptId}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-200 flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {sendingEmailAttemptId === emailConfirmTarget.attemptId ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Queueing Job...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Confirm & Send Email
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════════════════════════════
          SEND TO INSTITUTE CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {instituteConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-base">
                <Building2 className="w-5 h-5 text-indigo-600" />
                <span>Send Report to Institute</span>
              </div>
              <button
                onClick={() => setInstituteConfirmTarget(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-slate-600 space-y-3">
              <p>
                Send this student's analysis report to{' '}
                <strong>
                  {instituteConfirmTarget.institutionName || 'their registered institute'}
                </strong>
                ?
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div>
                  Student: <strong>{instituteConfirmTarget.studentName}</strong> ({instituteConfirmTarget.studentCode})
                </div>
                {instituteConfirmTarget.institutionName && (
                  <div>
                    Institute: <strong>{instituteConfirmTarget.institutionName}</strong>
                  </div>
                )}
                {instituteConfirmTarget.institutionEmail && (
                  <div className="text-slate-500">Email: {instituteConfirmTarget.institutionEmail}</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setInstituteConfirmTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendInstituteEmail(instituteConfirmTarget)}
                disabled={sendingInstituteEmailAttemptId === instituteConfirmTarget.attemptId}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition disabled:opacity-50"
              >
                {sendingInstituteEmailAttemptId === instituteConfirmTarget.attemptId ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          STUDENT ANALYSIS MODAL / DRAWER
      ═══════════════════════════════════════════════════════════════ */}
      {selectedAttemptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-slate-900">
                    {analysisData?.student.name || 'Student Performance Analysis'}
                  </h2>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {analysisData?.student.studentCode}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                  <span>{selectedExam?.title}</span>
                  <span>•</span>
                  <span>{analysisData?.student.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Send Email Buttons */}
                {analysisData && (
                  <>
                    <button
                      onClick={() => {
                        const found = attendees.find((a) => a.attemptId === selectedAttemptId);
                        if (found) setEmailConfirmTarget(found);
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 flex items-center gap-2 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Report by Email
                    </button>
                    <button
                      onClick={() => {
                        const found = attendees.find((a) => a.attemptId === selectedAttemptId);
                        if (found) setInstituteConfirmTarget(found);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-md flex items-center gap-2 transition-all"
                    >
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                      Send to Institute
                    </button>
                  </>
                )}

                <button
                  onClick={() => setSelectedAttemptId(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 border-b border-slate-200 bg-slate-50/50 flex gap-2 overflow-x-auto text-xs font-semibold">
              <button
                onClick={() => setActiveAnalysisTab('overview')}
                className={`py-3 px-3.5 border-b-2 transition-all ${
                  activeAnalysisTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Overview & Summary
              </button>
              <button
                onClick={() => setActiveAnalysisTab('subjects')}
                className={`py-3 px-3.5 border-b-2 transition-all ${
                  activeAnalysisTab === 'subjects'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Subject Breakdown
              </button>
              <button
                onClick={() => setActiveAnalysisTab('chapters')}
                className={`py-3 px-3.5 border-b-2 transition-all ${
                  activeAnalysisTab === 'chapters'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Chapter Mastery
              </button>
              <button
                onClick={() => setActiveAnalysisTab('time_strategy')}
                className={`py-3 px-3.5 border-b-2 transition-all ${
                  activeAnalysisTab === 'time_strategy'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Time & Strategy Insights
              </button>
              <button
                onClick={() => setActiveAnalysisTab('review')}
                className={`py-3 px-3.5 border-b-2 transition-all ${
                  activeAnalysisTab === 'review'
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Question Answers Review
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingAnalysis ? (
                <div className="text-center py-20 text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />
                  Reading persisted student diagnostics...
                </div>
              ) : !analysisData ? (
                <div className="text-center py-20 text-slate-500">
                  Could not load analysis details for this attempt.
                </div>
              ) : (
                <>
                  {/* TAB 1: OVERVIEW */}
                  {activeAnalysisTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Top Metric Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <span className="text-xs text-slate-500 font-semibold uppercase">Total Score</span>
                          <div className="text-2xl font-bold text-slate-900 mt-1">
                            {analysisData.analysis?.score ?? analysisData.analysis?.totalScore ?? analysisData.analysis?.overall?.obtainedMarks ?? '—'}
                            <span className="text-xs font-normal text-slate-500 ml-1">
                              / {analysisData.analysis?.maxScore ?? analysisData.analysis?.overall?.totalMarks ?? selectedExam?.totalMarks}
                            </span>
                          </div>
                          <div className="text-xs text-indigo-600 mt-1 font-semibold">
                            {Number(analysisData.analysis?.percentage ?? analysisData.analysis?.overall?.percentage ?? 0).toFixed(1)}% Score
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <span className="text-xs text-slate-500 font-semibold uppercase">Accuracy</span>
                          <div className="text-2xl font-bold text-emerald-600 mt-1">
                            {Number(analysisData.analysis?.accuracy ?? analysisData.analysis?.overall?.accuracy ?? 0).toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Correct: {analysisData.analysis?.correctAnswers ?? analysisData.analysis?.overall?.correctCount ?? 0} / Wrong: {analysisData.analysis?.wrongAnswers ?? analysisData.analysis?.overall?.wrongCount ?? 0}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <span className="text-xs text-slate-500 font-semibold uppercase">Overall Rank</span>
                          <div className="text-2xl font-bold text-indigo-600 mt-1">
                            {analysisData.rank?.rank ? `#${analysisData.rank.rank.toLocaleString()}` : '—'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            {analysisData.rank?.totalCandidates
                              ? `Out of ${analysisData.rank.totalCandidates.toLocaleString()} candidates`
                              : 'Official Rank'}
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <span className="text-xs text-slate-500 font-semibold uppercase">Time Spent</span>
                          <div className="text-2xl font-bold text-amber-600 mt-1">
                            {(analysisData.analysis?.timeUsedSeconds ?? analysisData.analysis?.overall?.timeUsedSeconds ?? analysisData.analysis?.timeAnalysis?.totalTimeUsedSeconds)
                              ? `${Math.floor((analysisData.analysis?.timeUsedSeconds ?? analysisData.analysis?.overall?.timeUsedSeconds ?? analysisData.analysis?.timeAnalysis?.totalTimeUsedSeconds) / 60)}m ${(analysisData.analysis?.timeUsedSeconds ?? analysisData.analysis?.overall?.timeUsedSeconds ?? analysisData.analysis?.timeAnalysis?.totalTimeUsedSeconds) % 60}s`
                              : '—'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Avg {Number(analysisData.analysis?.averageTimePerQuestion ?? analysisData.analysis?.overall?.averageTimePerQuestionSeconds ?? analysisData.analysis?.timeAnalysis?.averageTimePerQuestionSeconds ?? 0).toFixed(1)}s / question
                          </div>
                        </div>
                      </div>

                      {/* Performance Highlights */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          Diagnostic Summary & Action Items
                        </h4>
                        <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-700">
                          <div className="p-4 rounded-xl bg-white border border-slate-200">
                            <span className="font-semibold text-indigo-700 block mb-1">Attempt Discipline</span>
                            Unattempted questions: <strong>{analysisData.analysis?.unattempted ?? analysisData.analysis?.overall?.unattemptedCount ?? 0}</strong>.
                            Accuracy rate stands at <strong>{Number(analysisData.analysis?.accuracy ?? analysisData.analysis?.overall?.accuracy ?? 0).toFixed(1)}%</strong>.
                          </div>
                          <div className="p-4 rounded-xl bg-white border border-slate-200">
                            <span className="font-semibold text-emerald-700 block mb-1">Negative Marking Impact</span>
                            Avoidable negative mark deduction estimated at ~<strong>{(analysisData.analysis?.wrongAnswers ?? analysisData.analysis?.overall?.wrongCount ?? 0) * 1} marks</strong>.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SUBJECT BREAKDOWN */}
                  {activeAnalysisTab === 'subjects' && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 text-sm">Subject-wise Performance Breakdown</h4>
                      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        <table className="w-full text-left text-xs text-slate-700">
                          <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                            <tr>
                              <th className="px-5 py-3">Subject</th>
                              <th className="px-5 py-3 text-right">Score</th>
                              <th className="px-5 py-3 text-right">Correct</th>
                              <th className="px-5 py-3 text-right">Wrong</th>
                              <th className="px-5 py-3 text-right">Unattempted</th>
                              <th className="px-5 py-3 text-right">Accuracy</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(analysisData.analysis?.subjectAnalysis || analysisData.analysis?.subjectResults || analysisData.analysis?.subjects?.items || []).map((sub: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/80">
                                <td className="px-5 py-3.5 font-bold text-slate-900">{sub.subjectName || sub.name || sub.subject?.name}</td>
                                <td className="px-5 py-3.5 text-right font-mono font-semibold text-indigo-600">
                                  {sub.score ?? sub.totalScore ?? 0} / {sub.maxScore ?? '—'}
                                </td>
                                <td className="px-5 py-3.5 text-right font-mono text-emerald-600 font-semibold">{sub.correct ?? sub.correctAnswers ?? 0}</td>
                                <td className="px-5 py-3.5 text-right font-mono text-rose-600 font-semibold">{sub.wrong ?? sub.wrongAnswers ?? 0}</td>
                                <td className="px-5 py-3.5 text-right font-mono text-slate-500">{sub.unattempted ?? 0}</td>
                                <td className="px-5 py-3.5 text-right font-mono font-bold text-cyan-600">
                                  {Number(sub.accuracy || 0).toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CHAPTER MASTERY */}
                  {activeAnalysisTab === 'chapters' && (
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 text-sm">Chapter-Level Mastery & Accuracy</h4>
                      <div className="grid md:grid-cols-2 gap-3.5">
                        {(analysisData.analysis?.chapterAnalysis || analysisData.analysis?.chapterResults || analysisData.analysis?.chapters?.items || []).map((ch: any, i: number) => (
                          <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-900 text-xs">{ch.chapterName || ch.name || ch.chapter?.name}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{ch.subjectName || ch.chapter?.subject?.name || 'General'}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-sm font-bold text-indigo-600">{Number(ch.accuracy || 0).toFixed(1)}%</span>
                              <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">
                                {ch.performanceStatus || ch.status || (ch.accuracy >= 70 ? 'STRONG' : ch.accuracy >= 40 ? 'AVERAGE' : 'WEAK')}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: TIME & STRATEGY */}
                  {activeAnalysisTab === 'time_strategy' && (
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                          <h5 className="font-bold text-indigo-700 text-xs uppercase tracking-wider">Time Metrics</h5>
                          <div className="space-y-2 text-xs text-slate-700">
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Average Time / Question:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {Number(
                                  analysisData.analysis?.averageTimePerQuestion ??
                                  analysisData.analysis?.timeAnalysis?.averageTimePerQuestion ??
                                  analysisData.analysis?.overall?.averageTimePerQuestionSeconds ??
                                  analysisData.analysis?.timeAnalysis?.averageTimePerQuestionSeconds ??
                                  0
                                ).toFixed(1)}s
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Total Duration Used:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {Math.floor((analysisData.analysis?.timeUsedSeconds ?? analysisData.analysis?.overall?.timeUsedSeconds ?? analysisData.analysis?.timeAnalysis?.totalTimeUsedSeconds ?? 0) / 60)} minutes
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                          <h5 className="font-bold text-emerald-700 text-xs uppercase tracking-wider">
                            AI Strategy Profile & Diagnostics
                          </h5>
                          <div className="space-y-2 text-xs text-slate-700">
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Primary Strategy Issue:</span>
                              <span className="font-bold text-indigo-700">
                                {(
                                  analysisData.analysis?.strategyAnalysis?.primaryClassification ||
                                  analysisData.analysis?.attemptStrategy?.accuracyVsSpeedProfile ||
                                  analysisData.analysis?.attemptStrategy?.riskProfile ||
                                  analysisData.analysis?.overall?.speedAccuracyQuadrant ||
                                  'BALANCED'
                                ).replace(/_/g, ' ')}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Confidence Level:</span>
                              <span className="font-semibold text-emerald-700">
                                {analysisData.analysis?.strategyAnalysis?.confidence || 'HIGH'}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Avoidable Negative Loss:</span>
                              <span className="font-mono font-bold text-rose-600">
                                −{analysisData.analysis?.strategyAnalysis?.avoidableNegativeMarks ??
                                  analysisData.analysis?.attemptStrategy?.negativeMarkingPenalty ??
                                  analysisData.analysis?.strategyAnalysis?.metrics?.avoidableNegativeMarks ??
                                  Math.round((analysisData.analysis?.wrongAnswers ?? analysisData.analysis?.overall?.wrongCount ?? 0) * 1)}{' '}
                                Marks
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Estimated Projected Score:</span>
                              <span className="font-mono font-bold text-emerald-600">
                                {analysisData.analysis?.strategyAnalysis?.projectedScore ??
                                  analysisData.analysis?.attemptStrategy?.scoreWithoutNegativeMarking ??
                                  analysisData.analysis?.strategyAnalysis?.metrics?.projectedScore ??
                                  (analysisData.analysis?.score ?? analysisData.analysis?.overall?.obtainedMarks ?? 0) +
                                    (analysisData.analysis?.wrongAnswers ?? analysisData.analysis?.overall?.wrongCount ?? 0)}{' '}
                                Marks
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: QUESTION REVIEW */}
                  {activeAnalysisTab === 'review' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-sm">Question-by-Question Response Review</h4>
                        <span className="text-xs text-slate-500">Immutable Exam Version Snapshot</span>
                      </div>

                      <div className="space-y-3">
                        {(analysisData.questionsReview || []).map((q, idx) => (
                          <div
                            key={idx}
                            className={`p-4 rounded-2xl border text-xs space-y-3 ${
                              !q.isAttempted
                                ? 'bg-slate-50 border-slate-200'
                                : q.isCorrect
                                ? 'bg-emerald-50/60 border-emerald-200'
                                : 'bg-rose-50/60 border-rose-200'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900">
                                Q{q.displayOrder || idx + 1}. {q.sectionName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                  !q.isAttempted
                                    ? 'bg-slate-200 text-slate-700'
                                    : q.isCorrect
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {!q.isAttempted ? 'Unattempted' : q.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                              </span>
                            </div>

                            <div className="text-slate-800 font-medium">{q.questionText}</div>

                            {/* Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                              {q.options?.map((opt) => {
                                const isSelected = q.studentAnswer?.selectedOptionId === opt.id || (Array.isArray(q.studentAnswer?.selectedOptions) && q.studentAnswer?.selectedOptions.includes(opt.id));
                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                                      opt.isCorrect
                                        ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-semibold'
                                        : isSelected
                                        ? 'bg-rose-100 border-rose-300 text-rose-900'
                                        : 'bg-white border-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <span>
                                      <strong className="mr-1.5">{opt.optionLabel || opt.optionKey}.</strong> {opt.optionText}
                                    </span>
                                    {isSelected && <span className="text-[10px] font-bold uppercase">(Selected)</span>}
                                    {opt.isCorrect && <span className="text-[10px] font-bold text-emerald-700 uppercase">✓ Correct</span>}
                                  </div>
                                );
                              })}
                            </div>

                            {q.explanation && (
                              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-600">
                                <strong className="text-slate-800 block mb-0.5">Explanation:</strong>
                                {q.explanation}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          SEND TO ALL CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {isSendAllModalOpen && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">
                    Send Reports to All Students
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Batch PDF generation and automated email distribution
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSendAllModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Summary Card */}
            <div className="space-y-3.5">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Selected Live Exam:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[240px]">
                    {selectedExam.title}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200">
                  <span className="text-slate-500 font-medium">Evaluated Candidates:</span>
                  <span className="font-bold text-indigo-600 font-mono text-sm">
                    {summary?.metrics?.evaluated ?? 0} Students
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Delivery Channel:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Student Emails (PDF)
                  </span>
                </div>
              </div>

              {/* Information Notice */}
              <div className="p-3.5 bg-indigo-50/60 border border-indigo-200 text-xs text-indigo-900 rounded-2xl space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  What happens next?
                </div>
                <ul className="list-disc list-inside space-y-1 text-indigo-800 text-[11px] pl-0.5">
                  <li>3-page diagnostic PDF reports with complete analysis will be generated.</li>
                  <li>Jobs are processed asynchronously through the background email queue.</li>
                  <li>Real-time progress will stream live on this page via WebSocket.</li>
                </ul>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSendAllModalOpen(false)}
                disabled={isDispatchingAll}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendAllReports}
                disabled={isDispatchingAll || !summary || summary.metrics.evaluated === 0}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-200 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isDispatchingAll ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Queueing All Reports...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirm & Send to All ({summary?.metrics?.evaluated ?? 0})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompletedExamReportsPage;
