// ** Packages **
import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
  FileText,
  Filter,
  Search,
  Award,
  TrendingUp,
  Percent,
  RotateCcw,
  Zap,
  Trophy,
} from 'lucide-react';
import cn from 'classnames';

// ** Services & Constants **
import { useStudentExamHistoryQuery } from '../services/exams.queries';
import { useAuthOptionsQuery } from '@/services/options.queries';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

// ** Components **
import Loader from '@/components/feedback/Loader';
import Button from '@/components/ui/Button';

const HistoryPage = () => {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const limit = 20;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [targetFilter, setTargetFilter] = useState('ALL');
  const sortBy = 'createdAt';
  const sortOrder: 'asc' | 'desc' = 'desc';

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
      sortBy,
      sortOrder,
    };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (statusFilter !== 'ALL') p.status = statusFilter;
    if (targetFilter !== 'ALL') p.targetId = targetFilter;
    return p;
  }, [page, limit, debouncedSearch, statusFilter, targetFilter, sortBy, sortOrder]);

  const { data: historyResult, isLoading } = useStudentExamHistoryQuery(queryParams);
  const attempts = historyResult?.data || [];
  const pagination = historyResult?.meta || {
    page,
    limit,
    total: attempts.length,
    totalPages: 1,
  };

  const summaryStats = useMemo(() => {
    const completed = attempts.filter((a) =>
      ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED', 'COMPLETED'].includes(a.status?.name),
    );

    if (completed.length === 0) {
      return { total: pagination.total || 0, avgScore: 0, bestScore: 0, avgAccuracy: 0 };
    }

    let totalScorePerc = 0;
    let bestPerc = 0;
    let totalAcc = 0;
    let accCount = 0;

    completed.forEach((a) => {
      const p = a.result?.percentage ?? 0;
      totalScorePerc += p;
      if (p > bestPerc) bestPerc = p;
      if (a.result?.accuracy !== undefined && a.result.accuracy !== null) {
        totalAcc += a.result.accuracy;
        accCount++;
      }
    });

    return {
      total: pagination.total,
      avgScore: Math.round((totalScorePerc / completed.length) * 10) / 10,
      bestScore: Math.round(bestPerc * 10) / 10,
      avgAccuracy: accCount > 0 ? Math.round((totalAcc / accCount) * 10) / 10 : 0,
    };
  }, [attempts, pagination.total]);

  return (
    <div className="space-y-6 pb-12">
      {/* Navigation Tabs Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Exam History</h1>
            <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
              <span className="rounded-lg bg-white px-3 py-1 text-indigo-700 shadow-2xs">
                Exams
              </span>
              <Link
                to={PRIVATE_NAVIGATION.studentMockHistory}
                className="rounded-lg px-3 py-1 text-slate-600 hover:text-slate-900 transition-colors"
              >
                Mock Tests
              </Link>
            </div>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Review your past test attempts, overall scores, and in-depth performance analytics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={PRIVATE_NAVIGATION.studentMockHistory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 px-3.5 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-all"
          >
            <Award size={15} />
            Mock Test History
          </Link>

          <Link
            to={PRIVATE_NAVIGATION.availableExams}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
          >
            <Zap size={16} />
            Take a New Test
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Completed</span>
            <BookOpen size={16} className="text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summaryStats.total}</div>
          <div className="mt-0.5 text-[11px] text-slate-400">Recorded test sessions</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Average Score</span>
            <Percent size={16} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {summaryStats.total > 0 ? `${summaryStats.avgScore}%` : '—'}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Across completed tests</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Highest Score</span>
            <Award size={16} className="text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">
            {summaryStats.total > 0 ? `${summaryStats.bestScore}%` : '—'}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Peak performance</div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Average Accuracy</span>
            <TrendingUp size={16} className="text-sky-600" />
          </div>
          <div className="text-2xl font-black text-sky-700">
            {summaryStats.avgAccuracy > 0 ? `${summaryStats.avgAccuracy}%` : '—'}
          </div>
          <div className="mt-0.5 text-[11px] text-slate-400">Answer precision</div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by test name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
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
        </div>
      </div>

      {/* History List */}
      {isLoading ? (
        <Loader label="Loading your exam history..." />
      ) : attempts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BookOpen className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-lg font-bold text-slate-700">No attempts found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your search query or filters.'
              : 'You have not taken any exams or tests yet.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link
              to={PRIVATE_NAVIGATION.availableExams}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
            >
              View Available Exams
            </Link>
            <Link
              to={PRIVATE_NAVIGATION.studentMockTests}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
            >
              Browse Mock Tests
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {attempts.map((attempt) => {
            const isCompleted = ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED', 'COMPLETED'].includes(
              attempt.status?.name,
            );
            const isInProgress = attempt.status?.name === 'IN_PROGRESS';
            const scorePerc = attempt.result?.percentage ?? 0;
            const accuracy = attempt.result?.accuracy;
            const rankRecord = (attempt as any).candidateRanks?.find((r: any) => r.rankType === 'OVERALL') || (attempt as any).candidateRanks?.[0];
            const subjectResults = (attempt.result as any)?.subjectResults || [];

            return (
              <div
                key={attempt.id}
                className={cn(
                  'group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between',
                  isCompleted && 'hover:border-indigo-300 hover:shadow-md cursor-pointer',
                )}
                onClick={() => {
                  if (isCompleted) {
                    navigate(PRIVATE_NAVIGATION.examResult.replace(':attemptId', attempt.id));
                  }
                }}
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Score pill */}
                  <div
                    className={cn(
                      'flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl font-extrabold text-white shadow-sm',
                      isCompleted
                        ? scorePerc >= 80
                          ? 'bg-emerald-500'
                          : scorePerc >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        : 'bg-amber-500',
                    )}
                  >
                    <span className="text-base leading-none">
                      {isCompleted ? `${scorePerc.toFixed(0)}%` : 'LIVE'}
                    </span>
                    <span className="text-[9px] font-semibold tracking-wider uppercase opacity-80 mt-0.5">
                      {isCompleted ? 'Score' : 'Active'}
                    </span>
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {attempt.exam?.title ?? 'Exam'}
                      </h3>

                      {attempt.exam?.examTarget?.name && (
                        <span className="rounded-md bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                          {attempt.exam.examTarget.name}
                        </span>
                      )}

                      {rankRecord && (
                        <span className="rounded-md bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                          Rank #{rankRecord.rank}
                          {rankRecord.percentile !== undefined
                            ? ` (${rankRecord.percentile.toFixed(1)}%ile)`
                            : ''}
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {attempt.startedAt ? new Date(attempt.startedAt).toLocaleDateString() : '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {attempt.exam?.durationMinutes ?? '—'} mins
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={13} />
                        {attempt.exam?.totalQuestions ?? '—'} Questions
                      </span>
                      {accuracy !== undefined && accuracy !== null && (
                        <span className="text-indigo-600 font-semibold">
                          {Math.round(accuracy)}% Accuracy
                        </span>
                      )}
                    </div>

                    {/* Subject Pills preview if available */}
                    {subjectResults.length > 0 && (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {subjectResults.slice(0, 4).map((sr: any) => (
                          <span
                            key={sr.subjectId || sr.id}
                            className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                          >
                            {sr.subject?.name}: {sr.score}/{sr.maxScore}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Score Summary Metrics & Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                  {isCompleted && attempt.result && (
                    <div className="flex items-center gap-3.5 text-xs font-semibold">
                      <div className="text-center">
                        <span className="block text-emerald-600">
                          {attempt.result.correctAnswers}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Correct</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-rose-500">{attempt.result.wrongAnswers}</span>
                        <span className="text-[10px] text-slate-400 font-normal">Wrong</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-slate-700 font-bold">
                          {attempt.result.totalScore}/{attempt.result.maxScore}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">Marks</span>
                      </div>
                    </div>
                  )}

                  <span
                    className={cn(
                      'rounded-xl px-3 py-1.5 text-xs font-bold uppercase tracking-wider',
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200',
                    )}
                  >
                    {attempt.status?.name?.replace('_', ' ')}
                  </span>

                  {isInProgress ? (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(
                          PRIVATE_NAVIGATION.examInterface
                            .replace(':examId', attempt.exam.id)
                            .replace(':attemptId', attempt.id),
                        );
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                    >
                      <RotateCcw size={14} className="mr-1" />
                      Resume
                    </Button>
                  ) : isCompleted ? (
                    <div className="flex items-center gap-2">
                      {attempt.exam?.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(
                              `${PRIVATE_NAVIGATION.studentLeaderboard}?examId=${attempt.exam.id}`,
                            );
                          }}
                          className="border-amber-200 bg-amber-50/60 text-amber-800 hover:bg-amber-100 hover:border-amber-300 font-bold transition-all shadow-2xs"
                        >
                          <Trophy size={13} className="mr-1 text-amber-600" />
                          Leaderboard
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(
                            PRIVATE_NAVIGATION.examResult.replace(':attemptId', attempt.id),
                          );
                        }}
                        className="border-indigo-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors font-bold"
                      >
                        View Report
                        <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Server-Side Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 bg-white px-5 py-4 rounded-2xl shadow-xs">
          <p className="text-xs font-semibold text-slate-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} test attempts
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

export default HistoryPage;
