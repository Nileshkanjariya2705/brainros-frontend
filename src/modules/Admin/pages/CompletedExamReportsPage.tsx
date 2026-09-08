import React, { useState, useEffect, useCallback } from 'react';
import {
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
} from 'lucide-react';
import {
  completedExamReportsService,
  CompletedLiveExamItem,
  LiveExamSummaryMetrics,
  AttendeeItem,
  StudentAttemptAnalysisResponse,
} from '../services/completedExamReports.service';

export const CompletedExamReportsPage: React.FC = () => {
  // ── State ──
  const [exams, setExams] = useState<CompletedLiveExamItem[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [loadingExams, setLoadingExams] = useState<boolean>(true);

  // Summary State
  const [summary, setSummary] = useState<LiveExamSummaryMetrics | null>(null);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);

  // Attendees List State
  const [attendees, setAttendees] = useState<AttendeeItem[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState<boolean>(false);
  const [totalAttendees, setTotalAttendees] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters & Sorting
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Analysis Modal State
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [analysisData, setAnalysisData] = useState<StudentAttemptAnalysisResponse | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState<boolean>(false);
  const [activeAnalysisTab, setActiveAnalysisTab] = useState<'overview' | 'subjects' | 'chapters' | 'time_strategy' | 'review'>('overview');

  // Email Confirmation & Action State
  const [emailConfirmTarget, setEmailConfirmTarget] = useState<AttendeeItem | null>(null);
  const [sendingEmailAttemptId, setSendingEmailAttemptId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);

  // ── Load Completed Live Exams ──
  const fetchCompletedExams = useCallback(async () => {
    try {
      setLoadingExams(true);
      const list = await completedExamReportsService.getCompletedLiveExams();
      setExams(list);
      if (list.length > 0) {
        setSelectedExamId((prev) => (prev ? prev : list[0].id));
      }
    } catch (err: any) {
      setActionErrorMessage(err?.response?.data?.message || 'Failed to load completed live exams.');
    } finally {
      setLoadingExams(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletedExams();
  }, [fetchCompletedExams]);

  // ── Load Exam Summary & Attendees when selectedExamId changes ──
  const fetchExamDetails = useCallback(async () => {
    if (!selectedExamId) return;

    try {
      setLoadingSummary(true);
      const summaryData = await completedExamReportsService.getLiveExamSummary(selectedExamId);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Error fetching exam summary:', err);
    } finally {
      setLoadingSummary(false);
    }

    try {
      setLoadingAttendees(true);
      const attendeesData = await completedExamReportsService.getLiveExamAttendees(selectedExamId, {
        search: searchTerm,
        status: statusFilter,
        sortBy,
        sortOrder,
        page,
        limit,
      });
      setAttendees(attendeesData.items);
      setTotalAttendees(attendeesData.meta.total);
      setTotalPages(attendeesData.meta.totalPages);
    } catch (err: any) {
      console.error('Error fetching attendees:', err);
      setActionErrorMessage('Failed to load attendees list.');
    } finally {
      setLoadingAttendees(false);
    }
  }, [selectedExamId, searchTerm, statusFilter, sortBy, sortOrder, page, limit]);

  useEffect(() => {
    fetchExamDetails();
  }, [fetchExamDetails]);

  // ── Open Student Analysis ──
  const handleOpenAnalysis = async (attemptId: string) => {
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

  // ── Approve Report ──
  const handleApproveReport = async (attempt: AttendeeItem) => {
    try {
      setActionErrorMessage(null);
      await completedExamReportsService.approveReport(selectedExamId, attempt.attemptId);
      setActionSuccessMessage(`Analysis report approved for ${attempt.studentName}.`);
      fetchExamDetails();
    } catch (err: any) {
      setActionErrorMessage(err?.response?.data?.message || 'Failed to approve report.');
    } finally {
      setTimeout(() => setActionSuccessMessage(null), 6000);
    }
  };

  // ── Trigger Email Dispatch ──
  const handleSendEmail = async (attempt: AttendeeItem) => {
    try {
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

  const selectedExam = exams.find((e) => e.id === selectedExamId);

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
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              Live Exams Only
            </span>
            <span className="text-xs text-slate-500">• Mock Tests Excluded</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mt-1">
            Completed Live Exam Reports
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
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setPage(1);
              }}
              disabled={loadingExams || exams.length === 0}
              className="w-full appearance-none bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 text-slate-800 px-4 py-2.5 pr-10 rounded-xl text-sm font-medium shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
            >
              {exams.length === 0 ? (
                <option value="">No completed Live Exams found</option>
              ) : (
                exams.map((exam, idx) => (
                  <option key={exam.id} value={exam.id}>
                    {idx === 0 ? `★ [Latest] ${exam.title}` : exam.title}
                  </option>
                ))
              )}
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
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          EXAM SUMMARY KPI TILES
      ═══════════════════════════════════════════════════════════════ */}
      {selectedExam && summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
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
                          onClick={() => handleOpenAnalysis(item.attemptId)}
                          className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 text-xs font-semibold border border-slate-200 transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                          View
                        </button>

                        {/* Approve Report */}
                        {item.reportStatus === 'READY_FOR_REVIEW' && (
                          <button
                            onClick={() => handleApproveReport(item)}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200 transition-all flex items-center gap-1.5 shadow-xs"
                            title="Approve Report for Email Sending"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            Approve
                          </button>
                        )}

                        {/* Send Email */}
                        <button
                          onClick={() => setEmailConfirmTarget(item)}
                          disabled={sendingEmailAttemptId === item.attemptId || !item.score}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Send Report as PDF by Email"
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
                              Email
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
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-semibold text-slate-900">{attendees.length}</span> of{' '}
            <span className="font-semibold text-slate-900">{totalAttendees.toLocaleString()}</span> attendees
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loadingAttendees}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:hover:border-slate-200 text-slate-700 font-medium transition-all"
            >
              Previous
            </button>
            <span className="px-2">
              Page {page} of {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loadingAttendees}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 disabled:opacity-40 disabled:hover:border-slate-200 text-slate-700 font-medium transition-all"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          EMAIL CONFIRMATION MODAL
      ═══════════════════════════════════════════════════════════════ */}
      {emailConfirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Mail className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">Send Report by Email</h3>
              </div>
              <button
                onClick={() => setEmailConfirmTarget(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <p>
                A branded, multi-page PDF performance analysis report will be generated and dispatched via Resend.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Student Name:</span>
                  <span className="font-semibold text-slate-900">{emailConfirmTarget.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Student Code:</span>
                  <span className="font-mono text-indigo-600 text-xs">{emailConfirmTarget.studentCode}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-xs">Authoritative Email:</span>
                  <span className="font-semibold text-emerald-600 text-xs font-mono">{emailConfirmTarget.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 text-xs">Exam:</span>
                  <span className="text-slate-800 text-xs text-right max-w-[200px] truncate">{selectedExam?.title}</span>
                </div>
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Recipient email is verified server-side from student profile.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setEmailConfirmTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSendEmail(emailConfirmTarget)}
                disabled={sendingEmailAttemptId === emailConfirmTarget.attemptId}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-200 flex items-center gap-2 transition-all disabled:opacity-50"
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
                {/* Send Email Button */}
                {analysisData && (
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
                            {analysisData.analysis?.score ?? analysisData.analysis?.totalScore ?? '—'}
                            <span className="text-xs font-normal text-slate-500 ml-1">
                              / {analysisData.analysis?.maxScore ?? selectedExam?.totalMarks}
                            </span>
                          </div>
                          <div className="text-xs text-indigo-600 mt-1 font-semibold">
                            {Number(analysisData.analysis?.percentage || 0).toFixed(1)}% Score
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          <span className="text-xs text-slate-500 font-semibold uppercase">Accuracy</span>
                          <div className="text-2xl font-bold text-emerald-600 mt-1">
                            {Number(analysisData.analysis?.accuracy || 0).toFixed(1)}%
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Correct: {analysisData.analysis?.correctAnswers || 0} / Wrong: {analysisData.analysis?.wrongAnswers || 0}
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
                            {analysisData.analysis?.timeUsedSeconds
                              ? `${Math.floor(analysisData.analysis.timeUsedSeconds / 60)}m ${analysisData.analysis.timeUsedSeconds % 60}s`
                              : '—'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            Avg {Number(analysisData.analysis?.averageTimePerQuestion || 0).toFixed(1)}s / question
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
                            Unattempted questions: <strong>{analysisData.analysis?.unattempted ?? 0}</strong>.
                            Accuracy rate stands at <strong>{Number(analysisData.analysis?.accuracy || 0).toFixed(1)}%</strong>.
                          </div>
                          <div className="p-4 rounded-xl bg-white border border-slate-200">
                            <span className="font-semibold text-emerald-700 block mb-1">Negative Marking Impact</span>
                            Avoidable negative mark deduction estimated at ~<strong>{(analysisData.analysis?.wrongAnswers || 0) * 1} marks</strong>.
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
                            {(analysisData.analysis?.subjectAnalysis || analysisData.analysis?.subjectResults || []).map((sub: any, i: number) => (
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
                        {(analysisData.analysis?.chapterAnalysis || analysisData.analysis?.chapterResults || []).map((ch: any, i: number) => (
                          <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-slate-900 text-xs">{ch.chapterName || ch.name || ch.chapter?.name}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{ch.subjectName || ch.chapter?.subject?.name || 'General'}</div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-sm font-bold text-indigo-600">{Number(ch.accuracy || 0).toFixed(1)}%</span>
                              <div className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">
                                {ch.performanceStatus || (ch.accuracy >= 70 ? 'STRONG' : ch.accuracy >= 40 ? 'AVERAGE' : 'WEAK')}
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
                              <span className="font-mono font-bold text-slate-900">{Number(analysisData.analysis?.timeAnalysis?.averageTimePerQuestion || analysisData.analysis?.averageTimePerQuestion || 0).toFixed(1)}s</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Total Duration Used:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {Math.floor((analysisData.analysis?.timeUsedSeconds || 0) / 60)} minutes
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
                          <h5 className="font-bold text-emerald-700 text-xs uppercase tracking-wider">Strategy Profile</h5>
                          <div className="space-y-2 text-xs text-slate-700">
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Risk Profile:</span>
                              <span className="font-bold text-emerald-700">
                                {(analysisData.analysis?.attemptStrategy?.riskProfile || 'BALANCED').replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-slate-200">
                              <span className="text-slate-500">Avoidable Loss:</span>
                              <span className="font-mono font-bold text-rose-600">
                                ~{(analysisData.analysis?.wrongAnswers || 0) * 1} marks
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
    </div>
  );
};

export default CompletedExamReportsPage;
