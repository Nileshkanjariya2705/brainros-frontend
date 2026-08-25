// ** Packages **
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookOpen, Clock, ArrowRight, Calendar, FileText, Filter, Search } from 'lucide-react';
import cn from 'classnames';

// ** Services & Constants **
import { useGetMyAttemptsAPI } from '../services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

// ** Components **
import Loader from '@/components/feedback/Loader';
import Button from '@/components/ui/Button';

// ** Types **
import type { AttemptSummary } from '@/types/exam.types';

const HistoryPage = () => {
  const navigate = useNavigate();
  const { getMyAttemptsAPI, isLoading } = useGetMyAttemptsAPI();

  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getMyAttemptsAPI();
        if (!active) return;
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.data)
            ? (res.data as any).data
            : [];
        setAttempts(list);
      } catch {
        if (active) setAttempts([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const filteredAttempts = attempts.filter((attempt) => {
    const matchesSearch = (attempt.exam?.title || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'COMPLETED'
          ? ['SUBMITTED', 'AUTO_SUBMITTED'].includes(attempt.status?.name)
          : attempt.status?.name === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Exam History</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review your past test attempts, overall scores, and in-depth performance analytics.
          </p>
        </div>
        <Link
          to={PRIVATE_NAVIGATION.availableExams}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-indigo-700 transition-all"
        >
          <FileText size={16} />
          Take a New Test
        </Link>
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

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-indigo-600 focus:bg-white focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="IN_PROGRESS">In Progress</option>
          </select>
        </div>
      </div>

      {/* History List */}
      {isLoading ? (
        <Loader label="Loading your exam history..." />
      ) : filteredAttempts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BookOpen className="mx-auto text-slate-300 mb-3" size={44} />
          <h3 className="text-lg font-bold text-slate-700">No attempts found</h3>
          <p className="mt-1 text-sm text-slate-500">
            {searchTerm || statusFilter !== 'ALL'
              ? 'Try adjusting your search query or filters.'
              : 'You have not taken any mock tests yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAttempts.map((attempt) => {
            const isCompleted = ['SUBMITTED', 'AUTO_SUBMITTED'].includes(attempt.status?.name);
            const scorePerc = attempt.result?.percentage ?? 0;
            const scoreColor = scorePerc >= 80 ? 'emerald' : scorePerc >= 50 ? 'amber' : 'rose';

            return (
              <div
                key={attempt.id}
                onClick={() => {
                  if (isCompleted) {
                    navigate(PRIVATE_NAVIGATION.examResult.replace(':attemptId', attempt.id));
                  }
                }}
                className={cn(
                  'group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all sm:flex-row sm:items-center sm:justify-between',
                  isCompleted && 'hover:border-indigo-300 hover:shadow-md cursor-pointer',
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Score pill */}
                  <div
                    className={cn(
                      'flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl font-extrabold text-white shadow-sm',
                      isCompleted ? `bg-${scoreColor}-500` : 'bg-slate-400',
                    )}
                  >
                    <span className="text-base leading-none">
                      {isCompleted ? `${scorePerc.toFixed(0)}%` : '—'}
                    </span>
                    <span className="text-[9px] font-semibold tracking-wider uppercase opacity-80 mt-0.5">
                      {isCompleted ? 'Score' : 'Active'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {attempt.exam?.title ?? 'Exam'}
                    </h3>
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
                    </div>
                  </div>
                </div>

                {/* Score Summary Metrics & Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-5 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0">
                  {isCompleted && attempt.result && (
                    <div className="flex items-center gap-4 text-xs font-semibold">
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
                        <span className="block text-slate-600">
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

                  {isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-indigo-200 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"
                    >
                      View Report
                      <ArrowRight size={14} className="ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
