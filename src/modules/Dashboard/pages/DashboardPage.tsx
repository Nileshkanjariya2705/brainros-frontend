// ** Packages **
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  BarChart3,
  Zap,
  Target,
  TrendingUp,
  FileText,
  Star,
  Calendar,
} from 'lucide-react';
import cn from 'classnames';

// ** Hooks & Services **
import { useAuth } from '@/hooks/useAuth';
import { useGetMyAttemptsAPI } from '@/modules/Exams/services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

// ** Components **
import Loader from '@/components/feedback/Loader';

// ** Types **
import type { AttemptSummary } from '@/types/exam.types';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getMyAttemptsAPI, isLoading } = useGetMyAttemptsAPI();

  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await getMyAttemptsAPI();
      if (!active) return;
      if (res.data) setAttempts(res.data);
    })();
    return () => {
      active = false;
    };
  }, [getMyAttemptsAPI]);

  // Stats calculations
  const completedAttempts = attempts.filter(
    (a) => a.status?.name === 'SUBMITTED' || a.status?.name === 'AUTO_SUBMITTED',
  );
  const totalExams = completedAttempts.length;
  const avgScore =
    totalExams > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.result?.percentage || 0), 0) / totalExams
      : 0;
  const bestScore =
    totalExams > 0 ? Math.max(...completedAttempts.map((a) => a.result?.percentage || 0)) : 0;
  const totalCorrect = completedAttempts.reduce(
    (sum, a) => sum + (a.result?.correctAnswers || 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-56 w-56 -translate-y-8 translate-x-8 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute left-1/3 bottom-0 h-32 w-32 translate-y-8 rounded-full bg-purple-400/20 blur-2xl"></div>

        <div className="relative flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium mb-2">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span>Welcome back!</span>
            </div>
            <h1 className="text-3xl font-extrabold">
              Hi, {user?.studentProfile?.name ?? user?.phone ?? 'Student'} 👋
            </h1>
            <p className="mt-2 text-sm text-indigo-200 max-w-md">
              Track your exam performance, review your progress, and keep improving. Start a new
              mock test anytime!
            </p>

            <Link
              to={PRIVATE_NAVIGATION.availableExams}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <Zap size={16} />
              Start New Exam
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur text-center min-w-[120px]">
                <span className="block text-3xl font-extrabold">{totalExams}</span>
                <span className="text-[10px] text-indigo-200 font-medium">Tests Taken</span>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur text-center min-w-[120px]">
                <span className="block text-3xl font-extrabold">{avgScore.toFixed(1)}%</span>
                <span className="text-[10px] text-indigo-200 font-medium">Avg Score</span>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur text-center min-w-[120px]">
                <span className="block text-3xl font-extrabold text-amber-300">
                  {bestScore.toFixed(0)}%
                </span>
                <span className="text-[10px] text-indigo-200 font-medium">Best Score</span>
              </div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur text-center min-w-[120px]">
                <span className="block text-3xl font-extrabold text-emerald-300">
                  {totalCorrect}
                </span>
                <span className="text-[10px] text-indigo-200 font-medium">Correct Ans</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards (mobile view) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <FileText size={16} />
            <span className="text-xs font-semibold text-slate-500">Tests Taken</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{totalExams}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <TrendingUp size={16} />
            <span className="text-xs font-semibold text-slate-500">Avg Score</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{avgScore.toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Trophy size={16} />
            <span className="text-xs font-semibold text-slate-500">Best Score</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">{bestScore.toFixed(0)}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-purple-500 mb-1">
            <Target size={16} />
            <span className="text-xs font-semibold text-slate-500">Accuracy</span>
          </div>
          <p className="text-2xl font-extrabold text-slate-900">
            {totalExams > 0
              ? (
                  (totalCorrect /
                    completedAttempts.reduce(
                      (s, a) => s + (a.result?.correctAnswers || 0) + (a.result?.wrongAnswers || 0),
                      0,
                    )) *
                  100
                ).toFixed(0)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Recent Attempts */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 size={20} className="text-indigo-500" />
            Recent Exam History
          </h2>
          <Link
            to={PRIVATE_NAVIGATION.availableExams}
            className="flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Browse Exams <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <Loader label="Loading exam history…" />
        ) : attempts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <BookOpen className="mx-auto text-indigo-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-700">No Exams Attempted Yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Start your first mock test to see your progress here!
            </p>
            <Link
              to={PRIVATE_NAVIGATION.availableExams}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700"
            >
              <Zap size={16} />
              Start First Exam
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {attempts.slice(0, 10).map((attempt) => {
              const isCompleted = ['SUBMITTED', 'AUTO_SUBMITTED'].includes(attempt.status?.name);
              const scorePerc = attempt.result?.percentage ?? 0;
              const scoreColor = scorePerc >= 80 ? 'emerald' : scorePerc >= 50 ? 'amber' : 'rose';

              return (
                <div
                  key={attempt.id}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition-all hover:border-indigo-200 cursor-pointer"
                  onClick={() => {
                    if (isCompleted)
                      navigate(PRIVATE_NAVIGATION.examResult.replace(':attemptId', attempt.id));
                  }}
                >
                  {/* Score Badge */}
                  <div
                    className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center rounded-xl font-extrabold text-white text-sm shadow-sm',
                      isCompleted ? `bg-${scoreColor}-500` : 'bg-slate-400',
                    )}
                  >
                    {isCompleted ? `${scorePerc.toFixed(0)}%` : '—'}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-indigo-700 transition-colors">
                      {attempt.exam?.title ?? 'Exam'}
                    </h4>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {attempt.startedAt ? new Date(attempt.startedAt).toLocaleDateString() : '—'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {attempt.exam?.durationMinutes ?? '—'} min
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText size={12} />
                        {attempt.exam?.totalQuestions ?? '—'} Qs
                      </span>
                    </div>
                  </div>

                  {/* Result Stats */}
                  {isCompleted && attempt.result && (
                    <div className="hidden lg:flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 size={12} /> {attempt.result.correctAnswers}
                      </span>
                      <span className="flex items-center gap-1 text-rose-500">
                        <XCircle size={12} /> {attempt.result.wrongAnswers}
                      </span>
                      <span className="text-slate-400">{attempt.result.unattempted} skip</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <span
                    className={cn(
                      'rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase',
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : attempt.status?.name === 'IN_PROGRESS'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200',
                    )}
                  >
                    {attempt.status?.name?.replace('_', ' ')}
                  </span>

                  {isCompleted && (
                    <ArrowRight
                      size={16}
                      className="text-slate-400 group-hover:text-indigo-500 transition-colors"
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
