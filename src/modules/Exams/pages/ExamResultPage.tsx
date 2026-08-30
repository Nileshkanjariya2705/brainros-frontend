// ** Packages **
import { useEffect, useState } from 'react';
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
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';

// ** Services **
import {
  useCalculateResultAPI,
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
} from '@/types/exam.types';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const ExamResultPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const { calculateResultAPI } = useCalculateResultAPI();
  const { getFullAnalysisAPI, isLoading: isAnalysisLoading } = useGetFullAnalysisAPI();
  const { getAnswerReviewAPI, isLoading: isReviewLoading } = useGetAnswerReviewAPI();
  const { getAttemptStrategyAPI } = useGetAttemptStrategyAPI();
  const { recalculateStrategyAPI, isLoading: isRecalculatingStrategy } =
    useRecalculateStrategyAPI();
  const { getMyRanksAPI, isLoading: isRanksLoading } = useGetMyRanksAPI();

  const [analysis, setAnalysis] = useState<FullAnalysisReport | null>(null);
  const [detailedStrategy, setDetailedStrategy] = useState<DetailedStrategyAnalysis | null>(null);
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
  const [expandedReviewIdx, setExpandedReviewIdx] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    let isMounted = true;

    (async () => {
      // 1. Ensure result calculated
      await calculateResultAPI(attemptId);

      // 2. Fetch full Brainros Analysis Engine report (with auto-retry)
      let aRes = await getFullAnalysisAPI(attemptId);
      if (!aRes.data && aRes.error) {
        // Retry once after 600ms in case calculation was in-flight
        await new Promise((resolve) => setTimeout(resolve, 600));
        aRes = await getFullAnalysisAPI(attemptId);
      }

      if (!isMounted) return;
      if (aRes.error && !aRes.data) {
        setErrorMsg(aRes.error);
        return;
      }
      if (aRes.data) {
        setAnalysis(aRes.data);
      }

      // 3. Fetch detailed Attempt Strategy
      const sRes = await getAttemptStrategyAPI(attemptId);
      if (isMounted && sRes.data) {
        setDetailedStrategy(sRes.data);
      }

      // 4. Fetch official Ranks & Percentiles
      const rRes = await getMyRanksAPI(attemptId);
      if (isMounted && rRes.data) {
        setRanks(rRes.data);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [attemptId, calculateResultAPI, getFullAnalysisAPI, getAttemptStrategyAPI, getMyRanksAPI]);

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

  if (isAnalysisLoading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="h-16 w-16 rounded-3xl bg-indigo-600/10 flex items-center justify-center text-indigo-600 shadow-inner">
          <BrainCircuit size={32} className="animate-pulse" />
        </div>
        <Loader label="Brainros Analysis Engine is generating diagnostic insights…" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center shadow-sm border border-slate-200 max-w-lg mx-auto mt-10">
        <XCircle className="mx-auto text-rose-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-900">Analysis Not Ready</h2>
        <p className="mt-2 text-sm text-slate-600">{errorMsg}</p>
        <Button className="mt-6 w-full" onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  if (!analysis) return null;

  const { overall, subjects, chapters, timeAnalysis, attemptStrategy, recommendations } = analysis;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header Navigation ────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Exam Target:{' '}
            <span className="text-indigo-600 font-bold">{analysis.examTargetName}</span>
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
      <div className="flex items-center gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm scrollbar-none">
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
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
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
          <ChapterDiagnosisView chapters={chapters} thresholds={analysis.thresholdsUsed} />
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

      {activeTab === 'chapters' && (
        <ChapterDiagnosisView chapters={chapters} thresholds={analysis.thresholdsUsed} />
      )}

      {activeTab === 'time' && <TimeAnalyticsView timeAnalysis={timeAnalysis} />}

      {activeTab === 'strategy' && (
        <AttemptStrategyView
          strategy={attemptStrategy}
          overall={overall}
          detailedStrategy={detailedStrategy}
          onRecalculate={handleRecalculateStrategy}
          isRecalculating={isRecalculatingStrategy}
        />
      )}

      {activeTab === 'recommendations' && (
        <SmartRecommendationsView
          recommendations={recommendations}
          chapters={chapters}
          subjects={subjects}
        />
      )}

      {activeTab === 'review' && (
        <div className="space-y-3">
          {isReviewLoading ? (
            <Loader label="Loading detailed answer reviews…" />
          ) : reviewItems.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">
              No review questions available.
            </p>
          ) : (
            reviewItems.map((item, idx) => {
              const isExpanded = expandedReviewIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedReviewIdx(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        className={cn(
                          'flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold text-white shadow-sm',
                          item.isCorrect
                            ? 'bg-emerald-500'
                            : item.isAttempted
                              ? 'bg-rose-500'
                              : 'bg-slate-400',
                        )}
                      >
                        {item.displayOrder}
                      </span>
                      <div>
                        <span className="text-sm font-bold text-slate-900">
                          Question {item.displayOrder}
                        </span>
                        <span className="ml-2 text-xs text-slate-500 font-medium">
                          {item.sectionName} • {item.questionType?.name}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-[10px] font-bold uppercase',
                          item.isCorrect
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.isAttempted
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200',
                        )}
                      >
                        {item.isCorrect ? 'Correct' : item.isAttempted ? 'Wrong' : 'Skipped'}
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 p-6 bg-slate-50/40">
                      <p className="text-sm font-medium text-slate-900 leading-relaxed mb-4">
                        {item.questionText}
                      </p>
                      <div className="space-y-2.5">
                        {item.options.map((opt) => {
                          const isStudentChoice = item.studentAnswer?.selectedOptionId === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={cn(
                                'flex items-center gap-3 rounded-2xl border p-3.5 text-sm transition-all',
                                opt.isCorrect
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950 font-semibold'
                                  : isStudentChoice
                                    ? 'border-rose-300 bg-rose-50 text-rose-950 font-semibold'
                                    : 'border-slate-200 bg-white text-slate-700',
                              )}
                            >
                              <span
                                className={cn(
                                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0',
                                  opt.isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : isStudentChoice
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-200 text-slate-600',
                                )}
                              >
                                {opt.optionLabel}
                              </span>
                              <span className="flex-1 leading-relaxed">{opt.optionText}</span>
                              {opt.isCorrect && (
                                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                              )}
                              {isStudentChoice && !opt.isCorrect && (
                                <XCircle size={18} className="text-rose-600 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {item.explanation && (
                        <div className="mt-5 rounded-2xl bg-indigo-50/70 border border-indigo-100 p-4">
                          <span className="text-[11px] font-extrabold text-indigo-700 uppercase tracking-wider block mb-1">
                            Explanation & Key Learning
                          </span>
                          <p className="text-xs text-indigo-950 leading-relaxed">
                            {item.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ExamResultPage;
