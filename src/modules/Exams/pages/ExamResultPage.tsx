// ** Packages **
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import cn from 'classnames';
import {
  Trophy,
  BarChart3,
  Target,
  Clock,
  Compass,
  Lightbulb,
  FileSpreadsheet,
  ArrowLeft,
  XCircle,
  BrainCircuit,
  Award,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Check,
  X,
  Download,
} from 'lucide-react';
import { Axios } from '@/base-axios';
import { toast } from '@/utils/toast';
import { Pagination } from '@/components/ui/Pagination';


import {
  useResultStatusQuery,
  useFullAnalysisQuery,
  useAttemptStrategyQuery,
  useMyRanksQuery,
  useAnswerReviewQuery,
} from '../services/exams.queries';

// ** Components **
import Loader from '@/components/feedback/Loader';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

// ** Analysis Modular Components **
import { OverallPerformanceCard } from '@/modules/Analysis/components/OverallPerformanceCard';
import { SubjectAnalyticsView } from '@/modules/Analysis/components/SubjectAnalyticsView';
import { ChapterDiagnosisView } from '@/modules/Analysis/components/ChapterDiagnosisView';
import { TimeAnalyticsView } from '@/modules/Analysis/components/TimeAnalyticsView';
import { AttemptStrategyView } from '@/modules/Analysis/components/AttemptStrategyView';
import { SmartRecommendationsView } from '@/modules/Analysis/components/SmartRecommendationsView';
import { RankPercentileView } from '@/modules/Analysis/components/RankPercentileView';

// ** Types **
import type { QuestionReviewItem } from '@/types/exam.types';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const ExamResultPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'ranks'
    | 'subjects'
    | 'chapters'
    | 'time'
    | 'strategy'
    | 'recommendations'
    | 'review'
  >('overview');

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!attemptId) return;
    try {
      setIsDownloadingPdf(true);
      const response = await Axios.get(`/results/${attemptId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const cleanExamTitle = (analysis?.examTitle || 'Exam').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.setAttribute('download', `Exam_Analysis_Report_${cleanExamTitle}_${attemptId.slice(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Exam analysis report downloaded successfully.');
    } catch (err) {
      console.error('Failed to download PDF report', err);
      toast.error('Unable to download report. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };


  // TanStack Query for Result Status with auto-polling (polls every 3s, terminates on terminal state)
  const {
    data: resultStatusData,
    isLoading: isStatusLoading,
    refetch: refetchStatus,
  } = useResultStatusQuery(attemptId);

  const isPendingPublication = Boolean(
    resultStatusData?.availability === 'RESULT_PENDING' ||
      (resultStatusData?.examType === 'LIVE' &&
        resultStatusData?.publicationStatus !== 'PUBLISHED'),
  );

  const isReady = Boolean(
    !isPendingPublication &&
      (resultStatusData?.availability === 'PUBLISHED' ||
        resultStatusData?.publicationStatus === 'PUBLISHED' ||
        (resultStatusData?.reportAvailable === true &&
          resultStatusData?.publicationStatus === 'PUBLISHED')),
  );

  const isPolling =
    !isReady &&
    !isPendingPublication &&
    (isStatusLoading ||
      resultStatusData?.availability === 'PROCESSING' ||
      resultStatusData?.processingStatus === 'PROCESSING');

  // TanStack Query for immutable analysis report (staleTime: Infinity once completed)
  const {
    data: analysis,
    isLoading: isAnalysisLoading,
    error: analysisError,
  } = useFullAnalysisQuery(attemptId, isReady);

  // Lazy-loaded section queries
  const {
    data: detailedStrategy,
  } = useAttemptStrategyQuery(
    attemptId,
    isReady && (activeTab === 'strategy' || activeTab === 'overview'),
  );

  const {
    data: ranks,
    isLoading: isRanksLoading,
    refetch: refetchRanks,
  } = useMyRanksQuery(
    attemptId,
    isReady && (activeTab === 'ranks' || activeTab === 'overview'),
  );

  const {
    data: reviewData,
    isLoading: isReviewLoading,
    isFetching: isReviewFetching,
  } = useAnswerReviewQuery(attemptId, isReady && activeTab === 'review');
  const reviewItems: QuestionReviewItem[] = reviewData || [];


  // Question review pagination and filtering
  const [reviewFilter, setReviewFilter] = useState<
    'ALL' | 'CORRECT' | 'INCORRECT' | 'UNATTEMPTED'
  >('ALL');
  const [reviewPage, setReviewPage] = useState<number>(1);
  const reviewPageSize = 5;

  const errorMsg =
    (analysisError as any)?.response?.data?.message ||
    (analysisError as any)?.message ||
    (resultStatusData?.availability === 'FAILED' ||
    resultStatusData?.processingStatus === 'FAILED'
      ? resultStatusData?.message ||
        'We could not calculate your result. Please try again later.'
      : null);

  const checkStatus = () => {
    refetchStatus();
  };


  const handleRefreshRanks = async () => {
    refetchRanks();
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
  };

  // ─── Case 1: LIVE EXAM Awaiting Super Admin Publication ──────────
  if (isPendingPublication || resultStatusData?.availability === 'RESULT_PENDING') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <div className="rounded-3xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 p-8 text-center shadow-xl shadow-indigo-100/30 dark:shadow-none">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-300 dark:shadow-none mb-6">
            <CheckCircle2 size={40} />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 mb-3">
            <Calendar size={13} /> Live Examination Submitted
          </div>

          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Responses Successfully Evaluated
          </h1>

          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-lg mx-auto">
            {resultStatusData?.message || 'Your responses have been saved and scored.'}
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Exam Title:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {resultStatusData?.examTitle || 'Live Examination'}
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Evaluation Status:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Automated Scoring Completed ✓
              </span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Official Publication:</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                Pending Super Admin Release
              </span>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={checkStatus}
              className="w-full sm:w-auto"
            >
              <RefreshCw size={15} className="mr-2" /> Check for Publication
            </Button>
            <Button
              onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
            >
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Case 1.5: Report is Available, Data is Loading ────────────
  if (!analysis && isAnalysisLoading) {
    return (
      <div className="max-w-lg mx-auto py-24 px-4 text-center space-y-4">
        <Loader label="Loading your exam result report..." />
      </div>
    );
  }

  // ─── Case 2: In-flight Processing (Mock or Live calculation) ─────
  if (
    !analysis &&
    (isPolling ||
      resultStatusData?.availability === 'PROCESSING' ||
      resultStatusData?.processingStatus === 'PROCESSING')
  ) {
    return (
      <div className="max-w-lg mx-auto py-20 px-4 text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner">
          <BrainCircuit size={40} className="animate-spin text-indigo-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Processing Your Exam Result
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Our asynchronous evaluation engine is scoring questions, generating diagnostic insights, and compiling percentile benchmarks.
          </p>
        </div>

        {/* Multi-step progress visual */}
        <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-3 text-xs shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold">
            <CheckCircle2 size={16} /> Answers Safely Saved & Locked
          </div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold animate-pulse">
            <Clock size={16} className="animate-spin" /> Automated Question-Level Evaluation
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Clock size={16} /> Strategy & Time Management Diagnostics
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Clock size={16} /> Percentile & Official Ranking Snapshot
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center justify-center gap-2"
          >
            <RefreshCw size={15} /> Reload Page
          </Button>
          <Button
            variant="outline"
            onClick={checkStatus}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <RefreshCw size={15} /> Check Result
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}
            className="w-full sm:w-auto text-slate-600 dark:text-slate-300"
          >
            Return to Dashboard
          </Button>
        </div>

        <div className="pt-2">
          <Loader label="Auto-refreshing in real time..." />
        </div>
      </div>
    );
  }

  // ─── Case 3: Error State ────────────────────────────────────────
  if (errorMsg) {
    return (
      <div className="rounded-3xl bg-white dark:bg-slate-800 p-8 text-center shadow-sm border border-slate-200 dark:border-slate-700 max-w-lg mx-auto mt-10">
        <XCircle className="mx-auto text-rose-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Analysis Not Ready
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {errorMsg}
        </p>
        <Button
          className="mt-6 w-full"
          onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (!analysis) return null;

  const {
    overall,
    subjects,
    chapters,
    timeAnalysis,
    attemptStrategy,
    recommendations,
  } = analysis;

  // ─── Case 4: Complete Published Brainros Diagnostic Report ──────
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header Navigation ────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {analysis.examId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(`${PRIVATE_NAVIGATION.studentLeaderboard}?examId=${analysis.examId}`)
              }
              className="flex items-center gap-1.5 text-xs font-bold border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 shadow-2xs"
            >
              <Trophy size={14} className="text-amber-600" />
              <span>View Leaderboard</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex items-center gap-1.5 text-xs font-bold border-indigo-300 text-indigo-800 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 shadow-2xs"
          >
            {isDownloadingPdf ? (
              <RefreshCw size={14} className="animate-spin text-indigo-600" />
            ) : (
              <Download size={14} className="text-indigo-600" />
            )}
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}</span>
          </Button>


          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Exam Target:{' '}
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              {analysis.examTargetName}
            </span>
          </span>
        </div>
      </div>

      {/* ── Overall Performance Hero Card ─────────────────────── */}
      <OverallPerformanceCard
        overall={overall}
        examTitle={analysis.examTitle}
        examTargetName={analysis.examTargetName}
      />

      {/* ── Tab Navigation Bar ───────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1.5 shadow-sm scrollbar-none">
        {[
          { id: 'overview', label: 'Overall Overview', icon: Trophy },
          { id: 'ranks', label: 'Ranks & Percentile', icon: Award },
          { id: 'subjects', label: 'Subject Analytics', icon: BarChart3 },
          { id: 'chapters', label: 'Chapter Diagnosis', icon: Target },
          { id: 'time', label: 'Time Analytics', icon: Clock },
          { id: 'strategy', label: 'Attempt Strategy', icon: Compass },
          {
            id: 'recommendations',
            label: 'Smart Insights',
            icon: Lightbulb,
            badge: recommendations.length,
          },
          { id: 'review', label: 'Question Review', icon: FileSpreadsheet },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id as any)}
            className={cn(
              'flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200',
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white',
            )}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-black',
                  activeTab === tab.id
                    ? 'bg-indigo-800 text-white'
                    : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
                )}
              >
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content Views ─────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <SubjectAnalyticsView subjects={subjects} />
          <ChapterDiagnosisView chapters={chapters} />
          <TimeAnalyticsView timeAnalysis={timeAnalysis} />
          <AttemptStrategyView attemptStrategy={attemptStrategy} />
          <SmartRecommendationsView recommendations={recommendations} />
        </div>
      )}

      {activeTab === 'ranks' && (
        <RankPercentileView
          ranks={ranks}
          isLoading={isRanksLoading}
          onRefresh={handleRefreshRanks}
          onViewFullLeaderboard={() =>
            navigate(`${PRIVATE_NAVIGATION.studentLeaderboard}?examId=${analysis.examId}`)
          }
        />
      )}

      {activeTab === 'subjects' && <SubjectAnalyticsView subjects={subjects} />}

      {activeTab === 'chapters' && <ChapterDiagnosisView chapters={chapters} />}

      {activeTab === 'time' && <TimeAnalyticsView timeAnalysis={timeAnalysis} />}

      {activeTab === 'strategy' && (
        <AttemptStrategyView
          attemptStrategy={attemptStrategy}
          detailedStrategy={detailedStrategy}
        />
      )}

      {activeTab === 'recommendations' && (
        <SmartRecommendationsView recommendations={recommendations} />
      )}

      {activeTab === 'review' && (() => {
        if (isReviewLoading || (isReviewFetching && !reviewData)) {
          return (
            <div className="space-y-4">
              {/* Review Header Skeleton */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-pulse">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-3 w-80 max-w-full" />
                </div>
                <div className="flex flex-wrap gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                  <Skeleton className="h-7 w-16" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-7 w-24" />
                </div>
              </div>

              {/* Question Cards Skeleton */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4 animate-pulse"
                >
                  {/* Question Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                  </div>

                  {/* Question Statement */}
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>

                  {/* Answer Comparison Strip */}
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-48" />
                  </div>

                  {/* Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {Array.from({ length: 4 }).map((_, optIdx) => (
                      <div
                        key={optIdx}
                        className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30"
                      >
                        <Skeleton className="h-5 w-5 rounded-md shrink-0" />
                        <Skeleton className="h-4 flex-1" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        }

        const filteredReviewItems = reviewItems.filter((item) => {
          if (reviewFilter === 'CORRECT') return item.isCorrect;
          if (reviewFilter === 'INCORRECT') return item.isAttempted && !item.isCorrect;
          if (reviewFilter === 'UNATTEMPTED') return !item.isAttempted;
          return true;
        });

        const totalReviewPages = Math.ceil(filteredReviewItems.length / reviewPageSize) || 1;
        const paginatedReviewItems = filteredReviewItems.slice(
          (reviewPage - 1) * reviewPageSize,
          reviewPage * reviewPageSize,
        );

        const reviewStats = {
          total: reviewItems.length,
          correct: reviewItems.filter((i) => i.isCorrect).length,
          incorrect: reviewItems.filter((i) => i.isAttempted && !i.isCorrect).length,
          unattempted: reviewItems.filter((i) => !i.isAttempted).length,
        };

        return (
          <div className="space-y-4">
            {/* Review Header & Filter Chips */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Official Question Solutions & Answer Review
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify correct answers against your submitted responses.
                </p>
              </div>

              {/* Status Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                {[
                  { key: 'ALL', label: `All (${reviewStats.total})` },
                  { key: 'CORRECT', label: `Correct (${reviewStats.correct})` },
                  { key: 'INCORRECT', label: `Incorrect (${reviewStats.incorrect})` },
                  { key: 'UNATTEMPTED', label: `Unattempted (${reviewStats.unattempted})` },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => {
                      setReviewFilter(f.key as any);
                      setReviewPage(1);
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-xs font-bold transition-all',
                      reviewFilter === f.key
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions List */}
            {isReviewLoading || isReviewFetching ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4 animate-pulse"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-6 w-6 rounded-full" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <Skeleton className="h-12 w-full rounded-xl" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredReviewItems.length === 0 ? (
              <div className="p-8 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800">
                <p className="text-xs font-bold text-slate-500">
                  No questions match the selected filter.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {paginatedReviewItems.map((item, localIdx) => {
                  const questionGlobalIdx =
                    (reviewPage - 1) * reviewPageSize + localIdx + 1;

                  const studentChosenOpt = item.options.find(
                    (o) => o.id === item.studentAnswer?.selectedOptionId,
                  );
                  const correctOpt = item.options.find((o) => o.isCorrect);

                  return (
                    <div
                      key={item.displayOrder || questionGlobalIdx}
                      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4"
                    >
                      {/* Question Card Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                            {questionGlobalIdx}
                          </span>
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                            {item.sectionName}
                          </span>
                        </div>

                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1',
                            item.isCorrect
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : item.isAttempted
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
                          )}
                        >
                          {item.isCorrect ? (
                            <>
                              <Check size={12} /> Correct
                            </>
                          ) : item.isAttempted ? (
                            <>
                              <X size={12} /> Incorrect
                            </>
                          ) : (
                            'Unattempted'
                          )}
                        </span>
                      </div>

                      {/* Question Text */}
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                        {item.questionText}
                      </p>

                      {/* Quick Answer Summary Bar (shows BOTH user selected & correct answer) */}
                      <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 text-xs">
                        {/* Student Choice Summary */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            Your Selected Answer:
                          </span>
                          {studentChosenOpt ? (
                            <span
                              className={cn(
                                'font-bold px-2 py-0.5 rounded-md flex items-center gap-1',
                                item.isCorrect
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
                              )}
                            >
                              Option{' '}
                              {studentChosenOpt.optionLabel ||
                                (studentChosenOpt as any).optionKey}{' '}
                              ({studentChosenOpt.optionText})
                              {item.isCorrect ? <Check size={11} /> : <X size={11} />}
                            </span>
                          ) : (
                            <span className="font-medium px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                              Not Attempted
                            </span>
                          )}
                        </div>

                        <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

                        {/* Official Correct Answer Summary */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-500 dark:text-slate-400">
                            Correct Answer:
                          </span>
                          {correctOpt ? (
                            <span className="font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
                              <Check size={11} />
                              Option{' '}
                              {correctOpt.optionLabel || (correctOpt as any).optionKey}{' '}
                              ({correctOpt.optionText})
                            </span>
                          ) : (
                            <span className="font-medium text-slate-400">N/A</span>
                          )}
                        </div>
                      </div>

                      {/* Options List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {item.options.map((opt, oIdx) => {
                          const isStudentPick =
                            item.studentAnswer?.selectedOptionId === opt.id;
                          const isCorrectOpt = opt.isCorrect;
                          const label =
                            opt.optionLabel ||
                            (opt as any).optionKey ||
                            String.fromCharCode(65 + oIdx);
                          const text =
                            opt.optionText || (opt as any).text || `Option ${label}`;

                          return (
                            <div
                              key={opt.id || oIdx}
                              className={cn(
                                'p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all',
                                isCorrectOpt && isStudentPick
                                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500/20'
                                  : isStudentPick && !isCorrectOpt
                                    ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-1 ring-rose-400/20'
                                    : isCorrectOpt && !isStudentPick
                                      ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300',
                              )}
                            >
                              <div className="flex items-center gap-2.5 pr-2">
                                <span
                                  className={cn(
                                    'h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0',
                                    isCorrectOpt
                                      ? 'bg-emerald-500 text-white'
                                      : isStudentPick
                                        ? 'bg-rose-500 text-white'
                                        : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200',
                                  )}
                                >
                                  {label}
                                </span>
                                <span className="font-semibold">{text}</span>
                              </div>

                              {/* Badges on the right */}
                              <div className="flex items-center gap-1 shrink-0">
                                {isStudentPick && (
                                  <span
                                    className={cn(
                                      'px-2 py-0.5 rounded text-[10px] font-extrabold flex items-center gap-1',
                                      isCorrectOpt
                                        ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
                                    )}
                                  >
                                    Your Choice
                                  </span>
                                )}

                                {isCorrectOpt && (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100 flex items-center gap-1">
                                    <Check size={11} /> Correct
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Review Pagination Controls */}
            {filteredReviewItems.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                <Pagination
                  page={reviewPage}
                  totalPages={totalReviewPages}
                  total={filteredReviewItems.length}
                  limit={reviewPageSize}
                  onPageChange={setReviewPage}
                  limitOptions={[5, 10, 20, 50]}
                  itemName="questions"
                />
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
};

export default ExamResultPage;
