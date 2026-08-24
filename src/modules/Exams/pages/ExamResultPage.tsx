// ** Packages **
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import cn from 'classnames';
import {
  Trophy,
  Target,
  CheckCircle2,
  XCircle,
  MinusCircle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Award,
  Percent,
  Zap,
  Clock,
} from 'lucide-react';

// ** Services **
import {
  useCalculateResultAPI,
  useGetResultAPI,
  useGetSubjectResultsAPI,
  useGetChapterResultsAPI,
  useGetAnswerReviewAPI,
} from '../services';

// ** Components **
import Loader from '@/components/feedback/Loader';
import Button from '@/components/ui/Button';

// ** Types **
import type {
  ExamResult,
  SubjectResult,
  ChapterResult,
  QuestionReviewItem,
} from '@/types/exam.types';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

// ─── Score Circle Component ────────────────────────────────────
const ScoreCircle = ({
  percentage,
  size = 120,
  label,
}: {
  percentage: number;
  size?: number;
  label?: string;
}) => {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const color =
    percentage >= 80 ? 'text-emerald-500' : percentage >= 50 ? 'text-amber-500' : 'text-rose-500';

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={color}
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('text-2xl font-extrabold', color)}>{percentage.toFixed(1)}%</span>
        {label && <span className="text-[10px] text-slate-500 font-medium">{label}</span>}
      </div>
    </div>
  );
};

// ─── Main Result Page ──────────────────────────────────────────
const ExamResultPage = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const { calculateResultAPI } = useCalculateResultAPI();
  const { getResultAPI, isLoading: isResultLoading } = useGetResultAPI();
  const { getSubjectResultsAPI } = useGetSubjectResultsAPI();
  const { getChapterResultsAPI } = useGetChapterResultsAPI();
  const { getAnswerReviewAPI, isLoading: isReviewLoading } = useGetAnswerReviewAPI();

  const [result, setResult] = useState<ExamResult | null>(null);
  const [subjectResults, setSubjectResults] = useState<SubjectResult[]>([]);
  const [chapterResults, setChapterResults] = useState<ChapterResult[]>([]);
  const [reviewItems, setReviewItems] = useState<QuestionReviewItem[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'chapters' | 'review'>(
    'overview',
  );
  const [expandedReviewIdx, setExpandedReviewIdx] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    let isMounted = true;

    (async () => {
      // 1. Calculate result
      await calculateResultAPI(attemptId);

      // 2. Fetch result
      const rRes = await getResultAPI(attemptId);
      if (!isMounted) return;
      if (rRes.error) {
        setErrorMsg(rRes.error);
        return;
      }
      if (rRes.data) setResult(rRes.data);

      // 3. Fetch breakdowns
      const [sRes, cRes] = await Promise.all([
        getSubjectResultsAPI(attemptId),
        getChapterResultsAPI(attemptId),
      ]);
      if (!isMounted) return;
      if (sRes.data) setSubjectResults(sRes.data);
      if (cRes.data) setChapterResults(cRes.data);
    })();

    return () => {
      isMounted = false;
    };
  }, [attemptId, calculateResultAPI, getResultAPI, getSubjectResultsAPI, getChapterResultsAPI]);

  // Load review when tab is clicked
  const loadReview = async () => {
    if (!attemptId || reviewItems.length > 0) return;
    const res = await getAnswerReviewAPI(attemptId);
    if (res.data) setReviewItems(res.data);
  };

  if (isResultLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader label="Calculating your results…" />
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-200">
        <XCircle className="mx-auto text-rose-500 mb-4" size={48} />
        <h2 className="text-xl font-bold text-slate-900">Result Not Available</h2>
        <p className="mt-2 text-sm text-slate-600">{errorMsg}</p>
        <Button className="mt-6" onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  if (!result) return null;

  const exam = result.attempt?.exam;
  const timeTakenMs =
    result.attempt?.submittedAt && result.attempt?.startedAt
      ? new Date(result.attempt.submittedAt).getTime() -
        new Date(result.attempt.startedAt).getTime()
      : 0;
  const timeTakenMins = Math.round(timeTakenMs / 60000);

  const performanceLevel =
    result.percentage >= 80
      ? 'Excellent'
      : result.percentage >= 60
        ? 'Good'
        : result.percentage >= 40
          ? 'Average'
          : 'Needs Improvement';

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <button
        onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Dashboard
      </button>

      {/* Result Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-12 translate-x-12 rounded-full bg-indigo-500/20 blur-3xl"></div>
        <div className="absolute left-0 bottom-0 h-40 w-40 translate-y-8 -translate-x-8 rounded-full bg-purple-500/20 blur-2xl"></div>

        <div className="relative flex flex-col items-center gap-6 lg:flex-row lg:items-start lg:gap-10">
          <ScoreCircle percentage={result.percentage} size={160} label="Score" />

          <div className="flex-1 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 text-indigo-300 text-sm mb-1">
              <Trophy size={16} />
              <span className="font-medium">Exam Results</span>
            </div>
            <h1 className="text-2xl font-extrabold">{exam?.title ?? 'Exam Result'}</h1>
            <p className="mt-1 text-sm text-indigo-200">{exam?.examTarget?.name}</p>

            <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur">
              <Award size={16} className="text-amber-400" />
              <span className="text-sm font-bold">{performanceLevel}</span>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur text-center">
                <span className="block text-xl font-extrabold text-white">
                  {result.totalScore}/{result.maxScore}
                </span>
                <span className="text-[10px] text-indigo-200 font-medium">Score</span>
              </div>
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur text-center">
                <span className="block text-xl font-extrabold text-emerald-400">
                  {result.correctAnswers}
                </span>
                <span className="text-[10px] text-indigo-200 font-medium">Correct</span>
              </div>
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur text-center">
                <span className="block text-xl font-extrabold text-rose-400">
                  {result.wrongAnswers}
                </span>
                <span className="text-[10px] text-indigo-200 font-medium">Wrong</span>
              </div>
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur text-center">
                <span className="block text-xl font-extrabold text-slate-300">
                  {result.unattempted}
                </span>
                <span className="text-[10px] text-indigo-200 font-medium">Unattempted</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <Percent size={16} />
            <span className="text-xs font-semibold text-slate-500">Accuracy</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{result.accuracy}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <Target size={16} />
            <span className="text-xs font-semibold text-slate-500">Attempted</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {result.correctAnswers + result.wrongAnswers}/{result.totalQuestions}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Clock size={16} />
            <span className="text-xs font-semibold text-slate-500">Time Taken</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{timeTakenMins} min</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-purple-500 mb-1">
            <Zap size={16} />
            <span className="text-xs font-semibold text-slate-500">Speed</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {timeTakenMins > 0
              ? ((result.correctAnswers + result.wrongAnswers) / timeTakenMins).toFixed(1)
              : '—'}{' '}
            Q/min
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
        {(['overview', 'subjects', 'chapters', 'review'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab);
              if (tab === 'review') loadReview();
            }}
            className={cn(
              'flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold capitalize transition-all',
              activeTab === tab
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {tab === 'review' ? 'Answer Review' : tab === 'overview' ? 'Overview' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-500" />
            Score Distribution
          </h3>
          <div className="space-y-4">
            {/* Correct Bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-emerald-500" /> Correct
                </span>
                <span className="font-bold text-emerald-600">{result.correctAnswers}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-1000"
                  style={{ width: `${(result.correctAnswers / result.totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
            {/* Wrong Bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <XCircle size={14} className="text-rose-500" /> Wrong
                </span>
                <span className="font-bold text-rose-600">{result.wrongAnswers}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-rose-500 transition-all duration-1000"
                  style={{ width: `${(result.wrongAnswers / result.totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
            {/* Unattempted Bar */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700 flex items-center gap-1">
                  <MinusCircle size={14} className="text-slate-400" /> Unattempted
                </span>
                <span className="font-bold text-slate-500">{result.unattempted}</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-400 transition-all duration-1000"
                  style={{ width: `${(result.unattempted / result.totalQuestions) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-4">
          {subjectResults.map((sr) => (
            <div key={sr.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-base font-bold text-slate-900">{sr.subject.name}</h4>
                <span className="text-sm font-bold text-indigo-600">
                  {sr.score}/{sr.maxScore}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-3 text-center text-xs">
                <div className="rounded-xl bg-slate-50 p-3">
                  <span className="block text-lg font-extrabold text-slate-900">
                    {sr.totalQuestions}
                  </span>
                  <span className="text-slate-500">Total</span>
                </div>
                <div className="rounded-xl bg-emerald-50 p-3">
                  <span className="block text-lg font-extrabold text-emerald-700">
                    {sr.correctAnswers}
                  </span>
                  <span className="text-emerald-600">Correct</span>
                </div>
                <div className="rounded-xl bg-rose-50 p-3">
                  <span className="block text-lg font-extrabold text-rose-700">
                    {sr.wrongAnswers}
                  </span>
                  <span className="text-rose-600">Wrong</span>
                </div>
                <div className="rounded-xl bg-indigo-50 p-3">
                  <span className="block text-lg font-extrabold text-indigo-700">
                    {sr.accuracy}%
                  </span>
                  <span className="text-indigo-600">Accuracy</span>
                </div>
              </div>
              {/* Accuracy bar */}
              <div className="mt-4 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
                  style={{ width: `${sr.accuracy}%` }}
                ></div>
              </div>
            </div>
          ))}
          {subjectResults.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-8">
              No subject-level data available.
            </p>
          )}
        </div>
      )}

      {activeTab === 'chapters' && (
        <div className="space-y-3">
          {chapterResults.map((cr) => {
            const statusColor =
              cr.performanceStatus === 'STRONG'
                ? 'emerald'
                : cr.performanceStatus === 'MODERATE'
                  ? 'amber'
                  : cr.performanceStatus === 'WEAK'
                    ? 'rose'
                    : 'slate';
            return (
              <div
                key={cr.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex items-center gap-4"
              >
                <div
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg text-white font-bold text-sm',
                    `bg-${statusColor}-500`,
                  )}
                >
                  {cr.performanceStatus === 'STRONG' ? (
                    <TrendingUp size={18} />
                  ) : cr.performanceStatus === 'WEAK' ? (
                    <TrendingDown size={18} />
                  ) : (
                    <BarChart3 size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{cr.chapter.name}</h4>
                  <p className="text-[11px] text-slate-500">{cr.chapter.subject?.name}</p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="text-emerald-600">{cr.correctAnswers}✓</span>
                  <span className="text-rose-500">{cr.wrongAnswers}✗</span>
                  <span className="text-slate-500">{cr.unattempted}—</span>
                  <span
                    className={cn(
                      'rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase',
                      `bg-${statusColor}-50 text-${statusColor}-700 border border-${statusColor}-200`,
                    )}
                  >
                    {cr.performanceStatus}
                  </span>
                </div>
              </div>
            );
          })}
          {chapterResults.length === 0 && (
            <p className="text-center text-sm text-slate-500 py-8">
              No chapter-level data available.
            </p>
          )}
        </div>
      )}

      {activeTab === 'review' && (
        <div className="space-y-3">
          {isReviewLoading ? (
            <Loader label="Loading answer review…" />
          ) : reviewItems.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-8">No review data available.</p>
          ) : (
            reviewItems.map((item, idx) => {
              const isExpanded = expandedReviewIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedReviewIdx(isExpanded ? null : idx)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white',
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
                        <span className="text-sm font-semibold text-slate-900">
                          Q{item.displayOrder}.
                        </span>
                        <span className="ml-2 text-xs text-slate-500">
                          {item.sectionName} • {item.questionType?.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-0.5 text-[10px] font-bold',
                          item.isCorrect
                            ? 'bg-emerald-50 text-emerald-700'
                            : item.isAttempted
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-500',
                        )}
                      >
                        {item.isCorrect ? 'Correct' : item.isAttempted ? 'Wrong' : 'Skipped'}
                      </span>
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                      <p className="text-sm font-medium text-slate-800 mb-4">{item.questionText}</p>
                      <div className="space-y-2">
                        {item.options.map((opt) => {
                          const isStudentChoice = item.studentAnswer?.selectedOptionId === opt.id;
                          return (
                            <div
                              key={opt.id}
                              className={cn(
                                'flex items-center gap-3 rounded-lg border p-3 text-sm',
                                opt.isCorrect
                                  ? 'border-emerald-300 bg-emerald-50'
                                  : isStudentChoice
                                    ? 'border-rose-300 bg-rose-50'
                                    : 'border-slate-200',
                              )}
                            >
                              <span
                                className={cn(
                                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                                  opt.isCorrect
                                    ? 'bg-emerald-500 text-white'
                                    : isStudentChoice
                                      ? 'bg-rose-500 text-white'
                                      : 'bg-slate-200 text-slate-600',
                                )}
                              >
                                {opt.optionLabel}
                              </span>
                              <span className="text-slate-700">{opt.optionText}</span>
                              {opt.isCorrect && (
                                <CheckCircle2 size={14} className="ml-auto text-emerald-500" />
                              )}
                              {isStudentChoice && !opt.isCorrect && (
                                <XCircle size={14} className="ml-auto text-rose-500" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      {item.explanation && (
                        <div className="mt-4 rounded-lg bg-indigo-50 border border-indigo-100 p-4">
                          <span className="text-xs font-bold text-indigo-600 uppercase">
                            Explanation
                          </span>
                          <p className="mt-1 text-sm text-indigo-900">{item.explanation}</p>
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
