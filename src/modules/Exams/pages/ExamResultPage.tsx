// ** Packages **
import { useEffect, useState, useCallback } from 'react';
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
} from 'lucide-react';

// ** Services **
import {
  useGetAttemptResultStatusAPI,
  useGetFullAnalysisAPI,
  useGetAnswerReviewAPI,
  useGetAttemptStrategyAPI,
  useRecalculateStrategyAPI,
  useGetMyRanksAPI,
} from '../services';

// ** Components **
import Loader from '@/components/feedback/Loader';
import Button from '@/components/ui/Button';

// ** Analysis Modular Components **
import { OverallPerformanceCard } from '@/modules/Analysis/components/OverallPerformanceCard';
import { SubjectAnalyticsView } from '@/modules/Analysis/components/SubjectAnalyticsView';
import { ChapterDiagnosisView } from '@/modules/Analysis/components/ChapterDiagnosisView';
import { TimeAnalyticsView } from '@/modules/Analysis/components/TimeAnalyticsView';
import { AttemptStrategyView } from '@/modules/Analysis/components/AttemptStrategyView';
import { SmartRecommendationsView } from '@/modules/Analysis/components/SmartRecommendationsView';
import { RankPercentileView } from '@/modules/Analysis/components/RankPercentileView';

// ** Types **
import type {
  FullAnalysisReport,
  QuestionReviewItem,
  DetailedStrategyAnalysis,
  MyRanksResponse,
  ResultStatusResponse,
} from '@/types/exam.types';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const ExamResultPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  // API Hooks
  const { getAttemptResultStatusAPI } = useGetAttemptResultStatusAPI();
  const { getFullAnalysisAPI, isLoading: isAnalysisLoading } =
    useGetFullAnalysisAPI();
  const { getAnswerReviewAPI } = useGetAnswerReviewAPI();
  const { getAttemptStrategyAPI } = useGetAttemptStrategyAPI();
  const { recalculateStrategyAPI, isLoading: isRecalculatingStrategy } =
    useRecalculateStrategyAPI();
  const { getMyRanksAPI, isLoading: isRanksLoading } = useGetMyRanksAPI();

  // Lifecycle & Status State
  const [resultStatusData, setResultStatusData] =
    useState<ResultStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Analysis State
  const [analysis, setAnalysis] = useState<FullAnalysisReport | null>(null);
  const [detailedStrategy, setDetailedStrategy] =
    useState<DetailedStrategyAnalysis | null>(null);
  const [ranks, setRanks] = useState<MyRanksResponse | null>(null);
  const [reviewItems, setReviewItems] = useState<QuestionReviewItem[]>([]);
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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── 1. Check Result Status & Poll if in processing ─────────────
  const checkStatus = useCallback(async () => {
    if (!attemptId) return;
    try {
      const res = await getAttemptResultStatusAPI(attemptId);
      if (res.data) {
        setResultStatusData(res.data);

        // If Published or Ready, stop polling and load full analysis
        if (
          res.data.availability === 'PUBLISHED' ||
          res.data.resultStatus === 'PUBLISHED'
        ) {
          setIsPolling(false);
          loadPublishedReport();
        } else if (res.data.availability === 'RESULT_PENDING') {
          setIsPolling(false);
        }
      }
    } catch {
      // Non-blocking status retry
    }
  }, [attemptId, getAttemptResultStatusAPI]);

  // Load published results
  const loadPublishedReport = useCallback(async () => {
    if (!attemptId) return;
    const aRes = await getFullAnalysisAPI(attemptId);
    if (aRes.data) {
      setAnalysis(aRes.data);
    } else if (aRes.error) {
      setErrorMsg(aRes.error);
    }

    const sRes = await getAttemptStrategyAPI(attemptId);
    if (sRes.data) {
      setDetailedStrategy(sRes.data);
    }

    const rRes = await getMyRanksAPI(attemptId);
    if (rRes.data) {
      setRanks(rRes.data);
    }
  }, [attemptId, getFullAnalysisAPI, getAttemptStrategyAPI, getMyRanksAPI]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Periodic polling while in PROCESSING state
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(() => {
      checkStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [isPolling, checkStatus]);

  const handleRecalculateStrategy = async () => {
    if (!attemptId) return;
    const res = await recalculateStrategyAPI(attemptId, 1);
    if (res.data) {
      setDetailedStrategy(res.data);
    }
  };

  const handleRefreshRanks = async () => {
    if (!attemptId) return;
    const res = await getMyRanksAPI(attemptId);
    if (res.data) {
      setRanks(res.data);
    }
  };

  // Lazy load review when review tab selected
  const handleTabChange = async (tab: typeof activeTab) => {
    setActiveTab(tab);
    if (tab === 'review' && attemptId && reviewItems.length === 0) {
      const res = await getAnswerReviewAPI(attemptId);
      if (res.data) setReviewItems(res.data);
    }
    if (tab === 'strategy' && attemptId && !detailedStrategy) {
      const res = await getAttemptStrategyAPI(attemptId);
      if (res.data) setDetailedStrategy(res.data);
    }
    if (tab === 'ranks' && attemptId && !ranks) {
      const res = await getMyRanksAPI(attemptId);
      if (res.data) setRanks(res.data);
    }
  };

  // ─── Case 1: LIVE EXAM Awaiting Super Admin Publication ──────────
  if (resultStatusData?.availability === 'RESULT_PENDING') {
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
            {resultStatusData.message}
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Exam Title:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {resultStatusData.examTitle}
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

  // ─── Case 2: In-flight Processing (Mock or Live calculation) ─────
  if (
    isPolling ||
    resultStatusData?.availability === 'PROCESSING' ||
    (isAnalysisLoading && !analysis)
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
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
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
            {tab.badge !== undefined && (
              <span
                className={cn(
                  'ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold',
                  activeTab === tab.id
                    ? 'bg-white text-indigo-700'
                    : 'bg-indigo-100 text-indigo-700',
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
        />
      )}

      {activeTab === 'subjects' && <SubjectAnalyticsView subjects={subjects} />}

      {activeTab === 'chapters' && <ChapterDiagnosisView chapters={chapters} />}

      {activeTab === 'time' && <TimeAnalyticsView timeAnalysis={timeAnalysis} />}

      {activeTab === 'strategy' && (
        <AttemptStrategyView
          attemptStrategy={attemptStrategy}
          detailedStrategy={detailedStrategy}
          onRecalculate={handleRecalculateStrategy}
          isRecalculating={isRecalculatingStrategy}
        />
      )}

      {activeTab === 'recommendations' && (
        <SmartRecommendationsView recommendations={recommendations} />
      )}

      {activeTab === 'review' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Official Question Solutions & Answer Review
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {reviewItems.length} Questions Evaluated
            </span>
          </div>

          <div className="space-y-3">
            {reviewItems.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {item.sectionName}
                    </span>
                  </div>

                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-bold',
                      item.isCorrect
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : item.isAttempted
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400',
                    )}
                  >
                    {item.isCorrect
                      ? 'Correct'
                      : item.isAttempted
                        ? 'Incorrect'
                        : 'Unattempted'}
                  </span>
                </div>

                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {item.questionText}
                </p>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {item.options.map((opt) => {
                    const isStudentPick =
                      item.studentAnswer?.selectedOptionId === opt.id;
                    const isCorrectOpt = opt.isCorrect;

                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          'p-3 rounded-xl border text-xs font-medium flex items-center justify-between',
                          isCorrectOpt
                            ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                            : isStudentPick
                              ? 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{opt.optionLabel}.</span>
                          <span>{opt.optionText}</span>
                        </div>
                        {isCorrectOpt && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            Correct Answer
                          </span>
                        )}
                        {isStudentPick && !isCorrectOpt && (
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {item.explanation && (
                  <div className="mt-3 p-3 bg-indigo-50/60 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-950 dark:text-indigo-200">
                    <span className="font-bold block mb-1">Explanation:</span>
                    {item.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamResultPage;
