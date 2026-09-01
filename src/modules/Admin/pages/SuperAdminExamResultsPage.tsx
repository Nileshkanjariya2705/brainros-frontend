// ** Packages **
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import cn from 'classnames';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Users,
  ShieldCheck,
  Send,
  Eye,
  Check,
  Lock,
  Layers,
  FileCheck2,
  HelpCircle,
} from 'lucide-react';

// ** Services **
import {
  useGetPublicationDashboardAPI,
  useGetPublicationPreviewAPI,
  usePublishExamResultsAPI,
} from '@/modules/Exams/services';

// ** Components **
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';
import Modal from '@/components/ui/Modal';

// ** Types **
import type {
  PublicationDashboardItem,
  PublicationPreviewResponse,
} from '@/types/exam.types';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

export const SuperAdminExamResultsPage: React.FC = () => {
  const navigate = useNavigate();

  // APIs
  const { getPublicationDashboardAPI, isLoading: isDashboardLoading } =
    useGetPublicationDashboardAPI();
  const { getPublicationPreviewAPI, isLoading: isPreviewLoading } =
    useGetPublicationPreviewAPI();
  const { publishExamResultsAPI, isLoading: isPublishing } =
    usePublishExamResultsAPI();

  // State
  const [exams, setExams] = useState<PublicationDashboardItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    'ALL' | 'READY_TO_PUBLISH' | 'PROCESSING' | 'PUBLISHED'
  >('ALL');

  // Modal State
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [previewData, setPreviewData] =
    useState<PublicationPreviewResponse | null>(null);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Load publication dashboard
  const loadDashboard = useCallback(async () => {
    const res = await getPublicationDashboardAPI();
    if (res.data && res.data.data) {
      setExams(res.data.data);
    }
  }, [getPublicationDashboardAPI]);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // Open Preview & Confirmation Modal
  const handleOpenPublishModal = async (examId: string) => {
    setSelectedExamId(examId);
    setConfirmChecked(false);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);

    const res = await getPublicationPreviewAPI(examId);
    if (res.data && res.data.data) {
      setPreviewData(res.data.data);
    }
  };

  // Execute Official Result Publication
  const handleExecutePublish = async () => {
    if (!selectedExamId || !confirmChecked) return;
    setActionErrorMsg(null);

    const res = await publishExamResultsAPI(selectedExamId);
    if (res.data && res.data.data) {
      setActionSuccessMsg(
        `Official results for "${res.data.data.examTitle}" published successfully!`,
      );
      loadDashboard();
      setTimeout(() => {
        setSelectedExamId(null);
        setPreviewData(null);
        setActionSuccessMsg(null);
      }, 2000);
    } else if (res.error) {
      setActionErrorMsg(
        (res.error as any)?.message ||
          'Failed to publish results. Please ensure all readiness criteria are met.',
      );
    }
  };

  // Filtered exams
  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.examTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.examTarget.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'READY_TO_PUBLISH')
      return exam.publicationStatus === 'READY_TO_PUBLISH';
    if (filterStatus === 'PROCESSING')
      return ['PROCESSING', 'NOT_READY'].includes(exam.publicationStatus);
    if (filterStatus === 'PUBLISHED')
      return exam.publicationStatus === 'PUBLISHED';
    return true;
  });

  const readyCount = exams.filter(
    (e) => e.publicationStatus === 'READY_TO_PUBLISH',
  ).length;
  const processingCount = exams.filter((e) =>
    ['PROCESSING', 'NOT_READY'].includes(e.publicationStatus),
  ).length;
  const publishedCount = exams.filter(
    (e) => e.publicationStatus === 'PUBLISHED',
  ).length;

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Header & Top Overview ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-xl text-white">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            Super Admin Result Control Center
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Result Processing & Official Publication
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Monitor real-time asynchronous evaluation queues, verify batch ranking readiness, and authorize official transactional publication for Live Exams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboard}
            className="border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-200"
          >
            <RefreshCw
              className={cn(
                'w-4 h-4 mr-2',
                isDashboardLoading && 'animate-spin',
              )}
            />
            Refresh Queues
          </Button>
        </div>
      </div>

      {/* ─── Metrics Cards ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Monitored Exams
            </span>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {exams.length}
            </span>
            <span className="text-xs text-slate-500">Exams recorded</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Ready to Publish
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {readyCount}
            </span>
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">
              Awaiting Super Admin
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-800/40 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              In Processing Queue
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {processingCount}
            </span>
            <span className="text-xs text-amber-600/80">Evaluating / Ranking</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800/40 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Published Results
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {publishedCount}
            </span>
            <span className="text-xs text-blue-600/80">Live to candidates</span>
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ──────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search exam title, target exam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'READY_TO_PUBLISH', 'PROCESSING', 'PUBLISHED'] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap',
                  filterStatus === status
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600',
                )}
              >
                {status.replace(/_/g, ' ')}
              </button>
            ),
          )}
        </div>
      </div>

      {/* ─── Exams Table / List ────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        {isDashboardLoading && exams.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader label="Loading publication queues and readiness statuses..." />
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <HelpCircle className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="font-medium text-slate-700 dark:text-slate-300">
              No exams found matching the criteria
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Exam Details</th>
                  <th className="py-3.5 px-4">Candidates & Finalization</th>
                  <th className="py-3.5 px-4">Evaluation & Analytics</th>
                  <th className="py-3.5 px-4">Rank Snapshot</th>
                  <th className="py-3.5 px-4">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
                {filteredExams.map((exam) => {
                  const evalProgress =
                    exam.finalizedAttempts > 0
                      ? Math.round(
                          (exam.evaluatedAttempts / exam.finalizedAttempts) *
                            100,
                        )
                      : 0;

                  return (
                    <tr
                      key={exam.examId}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors"
                    >
                      {/* Exam Title & Type */}
                      <td className="py-4 px-4 align-top">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {exam.examTitle}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {exam.examTarget}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold',
                              exam.examType === 'LIVE'
                                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                                : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
                            )}
                          >
                            {exam.examType}
                          </span>
                        </div>
                      </td>

                      {/* Candidates & Finalization */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-medium">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>{exam.totalCandidates} Total Candidates</span>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {exam.finalizedAttempts} finalized attempts
                        </div>
                      </td>

                      {/* Evaluation & Analytics */}
                      <td className="py-4 px-4 align-top">
                        <div className="space-y-1.5 w-44">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-slate-600 dark:text-slate-300">
                              Evaluated
                            </span>
                            <span className="text-slate-900 dark:text-white font-semibold">
                              {exam.evaluatedAttempts} / {exam.finalizedAttempts}
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full transition-all duration-300',
                                evalProgress === 100
                                  ? 'bg-emerald-500'
                                  : 'bg-indigo-500',
                              )}
                              style={{ width: `${evalProgress}%` }}
                            />
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Analytics: {exam.analyticsCompletedAttempts} /{' '}
                            {exam.finalizedAttempts}
                          </div>
                        </div>
                      </td>

                      {/* Rank Snapshot */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex items-center gap-1.5">
                          {exam.rankingCompleted ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
                              <Check className="w-3.5 h-3.5" /> Generated
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-md border border-amber-200 dark:border-amber-800">
                              <Clock className="w-3.5 h-3.5 animate-spin" /> Pending
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" /> Security:{' '}
                          {exam.securityReviewCompleted ? 'Cleared' : 'Review Req'}
                        </div>
                      </td>

                      {/* Status & Action */}
                      <td className="py-4 px-4 align-top">
                        <div className="flex flex-col gap-2">
                          {exam.publicationStatus === 'PUBLISHED' ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Official Result Published
                              </span>
                              {exam.publishedAt && (
                                <div className="text-[11px] text-slate-400 mt-1">
                                  {new Date(exam.publishedAt).toLocaleString()}
                                </div>
                              )}
                              <Button
                                size="xs"
                                variant="outline"
                                className="mt-2 text-xs"
                                onClick={() =>
                                  navigate(
                                    PRIVATE_NAVIGATION.adminLeaderboard +
                                      `?examId=${exam.examId}`,
                                  )
                                }
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View Leaderboard
                              </Button>
                            </div>
                          ) : exam.publicationStatus === 'READY_TO_PUBLISH' ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 animate-pulse">
                                <Award className="w-3.5 h-3.5" /> Ready to Publish
                              </span>
                              <Button
                                size="sm"
                                onClick={() => handleOpenPublishModal(exam.examId)}
                                className="mt-2 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white shadow-md font-semibold text-xs flex items-center gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" /> Publish Results
                              </Button>
                            </div>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                <Clock className="w-3.5 h-3.5" /> Processing
                              </span>
                              {exam.notReadyReason && (
                                <div className="text-[11px] text-amber-600/90 dark:text-amber-400/90 mt-1 max-w-[200px]">
                                  {exam.notReadyReason}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Result Publication Preview & Confirmation Modal ─────────── */}
      <Modal
        isOpen={Boolean(selectedExamId)}
        onClose={() => {
          if (!isPublishing) {
            setSelectedExamId(null);
            setPreviewData(null);
          }
        }}
        title="Authorize Official Result Publication"
      >
        <div className="space-y-5">
          {isPreviewLoading || !previewData ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2">
              <Loader label="Fetching readiness audit & candidate snapshot..." />
            </div>
          ) : (
            <>
              {/* Exam Info Card */}
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Live Examination
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Ready for Release
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {previewData.examTitle}
                </h3>
                <div className="text-xs text-slate-500 flex items-center gap-4">
                  <span>Target: {previewData.examTarget}</span>
                  <span>Version: v{previewData.currentPublicationVersion}</span>
                </div>
              </div>

              {/* Readiness Checks Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="text-emerald-700 dark:text-emerald-300 font-semibold">
                    ✓ Attempts Finalized
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-bold text-sm mt-0.5">
                    {previewData.finalizedAttempts} Candidates
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="text-emerald-700 dark:text-emerald-300 font-semibold">
                    ✓ Evaluation & Scoring
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-bold text-sm mt-0.5">
                    {previewData.evaluatedAttempts} / {previewData.finalizedAttempts} Complete
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="text-emerald-700 dark:text-emerald-300 font-semibold">
                    ✓ Analytics & Strategy
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-bold text-sm mt-0.5">
                    {previewData.analyticsCompleted} / {previewData.finalizedAttempts} Computed
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="text-emerald-700 dark:text-emerald-300 font-semibold">
                    ✓ Rank & Percentile
                  </div>
                  <div className="text-slate-700 dark:text-slate-300 font-bold text-sm mt-0.5">
                    Batch Snapshot Ready
                  </div>
                </div>
              </div>

              {/* Warning Notice */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3 text-xs text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="space-y-1">
                  <span className="font-bold">Irreversible Action:</span>
                  <p>
                    Publishing results will immediately make individual scorecards, subject breakdowns, percentile rankings, and answer reviews visible to all candidates, parents, and institutions.
                  </p>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  I confirm that all evaluation benchmarks and integrity checks have been verified. I authorize immediate official publication.
                </span>
              </label>

              {/* Action Feedback */}
              {actionSuccessMsg && (
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  {actionSuccessMsg}
                </div>
              )}

              {actionErrorMsg && (
                <div className="p-3 bg-rose-100 dark:bg-rose-900/60 border border-rose-300 dark:border-rose-700 rounded-lg text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  {actionErrorMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedExamId(null);
                    setPreviewData(null);
                  }}
                  disabled={isPublishing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExecutePublish}
                  disabled={!confirmChecked || isPublishing}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2"
                >
                  {isPublishing ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Publishing Results...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Confirm & Publish Results
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default SuperAdminExamResultsPage;
