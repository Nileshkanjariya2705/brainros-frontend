// ** Packages **
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Calendar,
  FileText,
  Filter,
  Search,
  Award,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Percent,
  Zap,
  BarChart3,
  Layers,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import cn from 'classnames';

// ** Services & Constants **
import { useStudentMockHistoryQuery } from '../services/exams.queries';
import { useAuthOptionsQuery } from '@/services/options.queries';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

// ** Components **
import Loader from '@/components/feedback/Loader';
import Button from '@/components/ui/Button';

// ** Types **
import type { AttemptSummary } from '@/types/exam.types';

export const MockHistoryPage = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const limit = 20;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [targetFilter, setTargetFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'NEWEST' | 'OLDEST' | 'SCORE_HIGH' | 'ACCURACY_HIGH'>('NEWEST');
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null);

  const { data: authOptions } = useAuthOptionsQuery();
  const availableTargets = authOptions?.examTargets || [];

  // Debounce search and reset to page 1
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const queryParams = useMemo(() => {
    const p: Record<string, any> = {
      page,
      limit,
      sort: sortBy,
    };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (statusFilter !== 'ALL') p.status = statusFilter;
    if (targetFilter !== 'ALL') p.targetId = targetFilter;
    return p;
  }, [page, limit, debouncedSearch, statusFilter, targetFilter, sortBy]);

  const { data: mockHistoryResult, isLoading } = useStudentMockHistoryQuery(queryParams);
  const attempts: AttemptSummary[] = mockHistoryResult?.data || [];
  const pagination = mockHistoryResult?.meta || {
    page,
    limit,
    total: attempts.length,
    totalPages: 1,
  };


  // Overall analytics calculation
  const summaryStats = useMemo(() => {
    const completed = attempts.filter((a) =>
      ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED', 'COMPLETED'].includes(a.status?.name),
    );

    if (completed.length === 0) {
      return {
        totalCompleted: 0,
        inProgressCount: attempts.filter((a) => a.status?.name === 'IN_PROGRESS').length,
        averagePercentage: 0,
        bestPercentage: 0,
        averageAccuracy: 0,
        totalTimeSpentHours: 0,
      };
    }

    let totalScorePerc = 0;
    let bestPerc = 0;
    let totalAccuracy = 0;
    let accuracyCount = 0;
    let totalTimeSeconds = 0;

    completed.forEach((a) => {
      const p = a.result?.percentage ?? 0;
      totalScorePerc += p;
      if (p > bestPerc) bestPerc = p;

      if (a.result?.accuracy !== undefined && a.result.accuracy !== null) {
        totalAccuracy += a.result.accuracy;
        accuracyCount++;
      }

      const timeUsed =
        a.result?.timeUsedSeconds ||
        (a.timeAnalyses?.[0]?.totalTimeUsedSeconds ?? 0) ||
        (a.exam?.durationMinutes ? a.exam.durationMinutes * 60 : 0);
      totalTimeSeconds += timeUsed;
    });

    return {
      totalCompleted: pagination.total,
      inProgressCount: attempts.filter((a) => a.status?.name === 'IN_PROGRESS').length,
      averagePercentage: Math.round((totalScorePerc / (completed.length || 1)) * 10) / 10,
      bestPercentage: Math.round(bestPerc * 10) / 10,
      averageAccuracy: accuracyCount > 0 ? Math.round((totalAccuracy / accuracyCount) * 10) / 10 : 0,
      totalTimeSpentHours: Math.round((totalTimeSeconds / 3600) * 10) / 10,
    };
  }, [attempts, pagination.total]);

  const toggleExpand = (attemptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedAttemptId((prev) => (prev === attemptId ? null : attemptId));
  };

  const formatTimeSpent = (seconds?: number) => {
    if (!seconds || seconds <= 0) return null;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
              <Award size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Mock Test History</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed record of all your mock test attempts, scores, national ranks, and subject analytics.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={PRIVATE_NAVIGATION.studentMockTests}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all hover:shadow-indigo-500/25"
          >
            <Zap size={16} />
            Take New Mock Test
          </Link>
        </div>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Mock Tests</span>
            <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <BookOpen size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{summaryStats.totalCompleted}</div>
          <div className="mt-1 text-[11px] text-slate-400">
            {summaryStats.inProgressCount > 0 ? (
              <span className="text-amber-600 font-medium">
                {summaryStats.inProgressCount} in progress
              </span>
            ) : (
              'Completed attempts'
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Average Score</span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Percent size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {summaryStats.totalCompleted > 0 ? `${summaryStats.averagePercentage}%` : '—'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Across all completed mocks</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Best Score</span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
              <Award size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">
            {summaryStats.totalCompleted > 0 ? `${summaryStats.bestPercentage}%` : '—'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">Personal peak performance</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Avg. Accuracy</span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="text-2xl font-black text-sky-700">
            {summaryStats.averageAccuracy > 0 ? `${summaryStats.averageAccuracy}%` : '—'}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {summaryStats.totalTimeSpentHours > 0
              ? `~${summaryStats.totalTimeSpentHours} hrs practiced`
              : 'Precision indicator'}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search mock tests by name or target..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter size={14} className="text-slate-400" />
            <span>Filter:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed / Evaluated</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>

          {availableTargets.length > 0 && (
            <select
              value={targetFilter}
              onChange={(e) => {
                setTargetFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none"
            >
              <option value="ALL">All Targets</option>
              {availableTargets.map((t: any) => (
                <option key={t.id || t.name} value={t.id || t.name}>
                  {t.name}
                </option>
              ))}
            </select>
          )}

          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none"
          >
            <option value="NEWEST">Most Recent</option>
            <option value="SCORE_HIGH">Highest Score</option>
            <option value="ACCURACY_HIGH">Highest Accuracy</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>
      </div>

      {/* History List */}
      {isLoading ? (
        <Loader label="Loading mock test history..." />
      ) : attempts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm">
          <Award className="mx-auto text-slate-300 mb-3" size={48} />
          <h3 className="text-lg font-bold text-slate-800">No mock tests found</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'ALL' || targetFilter !== 'ALL'
              ? 'No attempts match your selected search terms or filter criteria. Try resetting filters.'
              : 'You have not taken any mock tests yet. Take full syllabus or chapter tests to track your rank and performance.'}
          </p>
          <div className="mt-5">
            <Link
              to={PRIVATE_NAVIGATION.studentMockTests}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
            >
              <Zap size={16} />
              Explore Mock Tests
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {attempts.map((attempt) => {
            const isCompleted = ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED', 'COMPLETED'].includes(
              attempt.status?.name,
            );
            const isInProgress = attempt.status?.name === 'IN_PROGRESS';
            const scorePerc = attempt.result?.percentage ?? 0;
            const accuracy = attempt.result?.accuracy;
            const totalScore = attempt.result?.totalScore;
            const maxScore = attempt.result?.maxScore || attempt.exam?.totalMarks || 720;
            const rankRecord = attempt.candidateRanks?.find((r) => r.rankType === 'OVERALL') || attempt.candidateRanks?.[0];
            const avoidablePenalty = attempt.strategyAnalyses?.[0]?.avoidableNegativeMarks;
            const strategyClass = attempt.strategyAnalyses?.[0]?.primaryClassification;
            const subjectResults = attempt.result?.subjectResults || [];
            const isExpanded = expandedAttemptId === attempt.id;
            const timeUsedSec =
              attempt.result?.timeUsedSeconds ||
              attempt.timeAnalyses?.[0]?.totalTimeUsedSeconds;
            const formattedTime = formatTimeSpent(timeUsedSec);

            return (
              <div
                key={attempt.id}
                className={cn(
                  'group flex flex-col rounded-2xl border bg-white shadow-sm transition-all overflow-hidden',
                  isCompleted
                    ? 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                    : 'border-amber-200 bg-amber-50/20',
                )}
              >
                {/* Main Card Body */}
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: Score Badge + Details */}
                    <div className="flex items-start gap-4">
                      {/* Score Badge */}
                      <div
                        className={cn(
                          'flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl font-black text-white shadow-sm',
                          isCompleted
                            ? scorePerc >= 75
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                              : scorePerc >= 50
                                ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                                : 'bg-gradient-to-br from-rose-500 to-red-600'
                            : 'bg-gradient-to-br from-amber-400 to-yellow-500',
                        )}
                      >
                        <span className="text-lg leading-tight font-black">
                          {isCompleted ? `${Math.round(scorePerc)}%` : 'LIVE'}
                        </span>
                        <span className="text-[9px] font-bold tracking-wider uppercase opacity-90">
                          {isCompleted ? 'Score' : 'Active'}
                        </span>
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            onClick={() => {
                              if (isCompleted) {
                                navigate(PRIVATE_NAVIGATION.examResult.replace(':attemptId', attempt.id));
                              }
                            }}
                            className={cn(
                              'text-base font-extrabold text-slate-900 transition-colors',
                              isCompleted && 'cursor-pointer hover:text-indigo-600',
                            )}
                          >
                            {attempt.exam?.title ?? 'Mock Test'}
                          </h3>

                          {attempt.exam?.examTarget?.name && (
                            <span className="rounded-lg bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                              {attempt.exam.examTarget.name}
                            </span>
                          )}

                          {rankRecord && (
                            <span className="rounded-lg bg-purple-50 border border-purple-200 px-2 py-0.5 text-[11px] font-bold text-purple-700">
                              AIR #{rankRecord.rank}
                              {rankRecord.totalCandidates ? ` / ${rankRecord.totalCandidates}` : ''}
                              {rankRecord.percentile !== undefined
                                ? ` (${rankRecord.percentile.toFixed(1)}%ile)`
                                : ''}
                            </span>
                          )}
                        </div>

                        {/* Metadata Row */}
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-slate-400" />
                            {attempt.startedAt
                              ? new Date(attempt.startedAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : '—'}
                          </span>

                          <span className="flex items-center gap-1.5">
                            <Clock size={13} className="text-slate-400" />
                            {attempt.exam?.durationMinutes ?? '—'} mins
                            {formattedTime ? ` (${formattedTime} used)` : ''}
                          </span>

                          <span className="flex items-center gap-1.5">
                            <FileText size={13} className="text-slate-400" />
                            {attempt.exam?.totalQuestions ?? '—'} Questions
                          </span>

                          {strategyClass && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
                              {strategyClass.replace('_', ' ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Score Metrics & Primary CTA */}
                    <div className="flex flex-wrap items-center justify-between sm:justify-end gap-4 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                      {isCompleted && attempt.result && (
                        <div className="flex items-center gap-3.5 text-xs font-semibold bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-100">
                          <div className="text-center">
                            <span className="block text-emerald-600 font-bold">
                              +{attempt.result.correctAnswers}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">Correct</span>
                          </div>

                          <div className="text-center">
                            <span className="block text-rose-500 font-bold">
                              -{attempt.result.wrongAnswers}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">Wrong</span>
                          </div>

                          <div className="text-center">
                            <span className="block text-slate-400 font-bold">
                              {attempt.result.unattempted}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">Skipped</span>
                          </div>

                          <div className="h-6 w-px bg-slate-200" />

                          <div className="text-center min-w-[55px]">
                            <span className="block text-slate-900 font-black">
                              {totalScore}/{maxScore}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">Marks</span>
                          </div>

                          {accuracy !== undefined && accuracy !== null && (
                            <>
                              <div className="h-6 w-px bg-slate-200" />
                              <div className="text-center">
                                <span className="block text-indigo-600 font-black">
                                  {Math.round(accuracy)}%
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal">Accuracy</span>
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Status / Action */}
                      <div className="flex items-center gap-2">
                        {isInProgress ? (
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate(
                                PRIVATE_NAVIGATION.examInterface
                                  .replace(':examId', attempt.exam.id)
                                  .replace(':attemptId', attempt.id),
                              )
                            }
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
                          >
                            <RotateCcw size={14} className="mr-1.5" />
                            Resume Test
                          </Button>
                        ) : isCompleted ? (
                          <div className="flex items-center gap-2">
                            {attempt.exam?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  navigate(
                                    `${PRIVATE_NAVIGATION.studentLeaderboard}?examId=${attempt.exam.id}`,
                                  )
                                }
                                className="border-amber-200 bg-amber-50/60 text-amber-800 hover:bg-amber-100 hover:border-amber-300 font-bold transition-all shadow-2xs"
                              >
                                <Trophy size={13} className="mr-1 text-amber-600" />
                                Leaderboard
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(PRIVATE_NAVIGATION.examResult.replace(':attemptId', attempt.id))
                              }
                              className="border-indigo-200 text-indigo-600 hover:bg-indigo-600 hover:text-white font-bold transition-all shadow-sm"
                            >
                              <BarChart3 size={14} className="mr-1.5" />
                              Detailed Report
                            </Button>

                            {subjectResults.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => toggleExpand(attempt.id, e)}
                                title="Toggle Subject Breakdown"
                                className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-colors"
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 uppercase">
                            {attempt.status?.name?.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Highlights Bar for avoidable penalty or subject pills */}
                  {isCompleted && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                      {/* Left: Subject Pills Preview */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">Subjects:</span>
                        {subjectResults.length > 0 ? (
                          subjectResults.map((sr) => (
                            <span
                              key={sr.subjectId || sr.id}
                              className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200/80 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                            >
                              <span>{sr.subject?.name || 'Subject'}:</span>
                              <strong className="text-slate-900">{sr.score}/{sr.maxScore}</strong>
                              {sr.accuracy !== undefined && (
                                <span className="text-slate-400 font-normal">({Math.round(sr.accuracy)}%)</span>
                              )}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Full Test Paper</span>
                        )}
                      </div>

                      {/* Right: Avoidable negative marks alert if high */}
                      {avoidablePenalty !== undefined && avoidablePenalty > 0 && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                          <AlertCircle size={13} className="text-amber-600" />
                          <span>Avoidable Guesswork Penalty: -{avoidablePenalty} marks</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Collapsible Detailed Subject Breakdown */}
                {isExpanded && subjectResults.length > 0 && (
                  <div className="bg-slate-50/80 border-t border-slate-200/80 p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Layers size={14} className="text-indigo-600" />
                        Subject-wise Performance Breakdown
                      </h4>
                      <span className="text-[11px] text-slate-400">
                        Accuracy & Score distribution
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {subjectResults.map((sr) => {
                        const sAcc = sr.accuracy ?? 0;

                        return (
                          <div
                            key={sr.subjectId || sr.id}
                            className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold text-slate-900">
                                {sr.subject?.name || 'Subject'}
                              </span>
                              <span
                                className={cn(
                                  'rounded-md px-1.5 py-0.5 text-[10px] font-bold',
                                  sAcc >= 80
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : sAcc >= 60
                                      ? 'bg-amber-50 text-amber-700'
                                      : 'bg-rose-50 text-rose-700',
                                )}
                              >
                                {Math.round(sAcc)}% Acc
                              </span>
                            </div>

                            <div className="text-base font-black text-slate-800 mb-2">
                              {sr.score} <span className="text-xs font-normal text-slate-400">/ {sr.maxScore} marks</span>
                            </div>

                            {/* Progress bar */}
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  sAcc >= 80 ? 'bg-emerald-500' : sAcc >= 60 ? 'bg-amber-500' : 'bg-rose-500',
                                )}
                                style={{ width: `${Math.min(100, Math.max(0, sAcc))}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                              <span className="text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={11} />
                                {sr.correctAnswers ?? 0} correct
                              </span>
                              <span className="text-rose-500 flex items-center gap-1">
                                <XCircle size={11} />
                                {sr.wrongAnswers ?? 0} wrong
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Server-Side Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 bg-white px-5 py-4 rounded-2xl shadow-xs mt-6">
          <p className="text-xs font-semibold text-slate-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} mock attempts
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="rounded-xl text-xs font-bold"
            >
              Previous
            </Button>
            <span className="text-xs font-bold text-slate-700 px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-xl text-xs font-bold"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MockHistoryPage;
