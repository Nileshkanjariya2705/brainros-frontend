// ** Packages **
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  PlayCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Target,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

// ** Services **
import { useStartAttemptAPI, type StudentExamItem } from '../services';
import { useStudentExamsQuery } from '../services/exams.queries';

// ** Hooks **
import { useAuth } from '@/hooks/useAuth';
import { useAuthOptionsQuery } from '@/services/options.queries';

// ** Components **
import Button from '@/components/ui/Button';
import { ExamStartLanguageModal } from '../components/ExamStartLanguageModal';

// ─── Format Schedule Date/Time (Asia/Kolkata) ────────────────
const formatScheduleTime = (isoString?: string | null) => {
  if (!isoString) return 'Self-Paced / Anytime';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  } catch {
    return 'TBD';
  }
};

export const AvailableExamsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { startAttemptAPI } = useStartAttemptAPI();

  const [page, setPage] = useState<number>(1);
  const limit = 12;

  const [statusTab, setStatusTab] = useState<'ALL' | 'UPCOMING' | 'LIVE' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('UPCOMING_SOONEST');

  const [startingExamId, setStartingExamId] = useState<string | null>(null);
  const [showLangModal, setShowLangModal] = useState<any | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: authOptions } = useAuthOptionsQuery();
  const examTargets: Array<{ id: string; name: string }> = authOptions?.examTargets || [];

  const queryParams = useMemo(() => {
    const params: Record<string, any> = {
      status: statusTab,
      page,
      limit,
      sort: sortOption,
    };
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }
    if (selectedTarget) {
      params.examTargetId = selectedTarget;
    }
    return params;
  }, [statusTab, page, limit, sortOption, debouncedSearch, selectedTarget]);

  const { data: examsResult, isLoading } = useStudentExamsQuery(queryParams);
  const exams = examsResult?.data || [];
  const pagination = examsResult?.meta || {
    page,
    limit,
    total: exams.length,
    totalPages: 1,
  };

  // Handle Exam Actions
  const handleStartExam = (exam: StudentExamItem) => {
    if (exam.isInProgress && exam.activeAttemptId) {
      navigate(`/exam/${exam.id}/attempt/${exam.activeAttemptId}`);
      return;
    }
    setStartError(null);
    setShowLangModal(exam);
  };

  const launchExam = async (examId: string, languageId: string) => {
    setStartingExamId(examId);
    setStartError(null);
    const res = await startAttemptAPI(examId, languageId);
    setStartingExamId(null);

    const payload: any = res.data;
    const raw: any = res.response?.data;
    const attemptData = payload?.data || payload || raw?.data;
    const attemptId = attemptData?.attemptId || attemptData?.id;

    if (attemptId) {
      setShowLangModal(null);
      navigate(`/exam/${examId}/attempt/${attemptId}`);
    } else {
      const errMsg =
        res.error || raw?.message || payload?.message || 'Unable to start exam attempt.';
      setStartError(errMsg);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <Sparkles size={13} className="text-amber-300" />
            Official Examination Portal
          </div>

          <h1 className="text-2xl font-black sm:text-3xl md:text-4xl tracking-tight">
            All Examinations
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-indigo-100 leading-relaxed">
            Discover scheduled official examinations, enter live synchronized tests, and inspect comprehensive performance results for your completed attempts.
          </p>

          {/* Quick Metrics */}
          <div className="mt-5 flex flex-wrap items-center gap-6 text-xs font-semibold">
            <div className="flex items-center gap-2 text-indigo-200">
              <FileText size={15} className="text-indigo-300" />
              <span>{pagination.total} Total Registered Exams</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-200">
              <Target size={15} className="text-indigo-300" />
              <span>Target: {user?.studentProfile?.examTarget || 'General'}</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-200">
              <TrendingUp size={15} className="text-emerald-400" />
              <span>Auto-Evaluated & Rank-Indexed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs, Search & Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto">
          {[
            { key: 'ALL', label: 'All Exams' },
            { key: 'UPCOMING', label: 'Upcoming' },
            { key: 'LIVE', label: 'Live Now' },
            { key: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setStatusTab(tab.key as any);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                statusTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search, Target Filter & Sort */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[220px] flex-1 sm:flex-initial">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Search exams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Exam Target Dropdown */}
          <select
            value={selectedTarget}
            onChange={(e) => {
              setSelectedTarget(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="">All Targets</option>
            {examTargets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Sort Dropdown */}
          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="UPCOMING_SOONEST">Upcoming Soonest</option>
            <option value="NEWEST">Newest First</option>
            <option value="NAME_ASC">Name (A-Z)</option>
            <option value="NAME_DESC">Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Exam Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-64 rounded-3xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700 p-6 space-y-4"
            >
              <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded-full" />
              <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-700 rounded-lg" />
              <div className="h-16 w-full bg-slate-200 dark:bg-slate-700 rounded-xl" />
              <div className="h-8 w-full bg-slate-200 dark:bg-slate-700 rounded-xl mt-auto" />
            </div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center bg-white dark:bg-slate-800 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-4">
            <FileText size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {statusTab === 'UPCOMING'
              ? 'No upcoming exams scheduled'
              : statusTab === 'LIVE'
                ? 'No live exams active at this moment'
                : statusTab === 'COMPLETED'
                  ? 'No completed exams yet'
                  : 'No examinations found matching your criteria'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {debouncedSearch
              ? `No tests match '${debouncedSearch}'. Try clearing the search query or adjusting your filters.`
              : 'Official live tests and scheduled examination papers will appear here when activated.'}
          </p>
          {(debouncedSearch || selectedTarget || statusTab !== 'ALL') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedTarget('');
                setStatusTab('ALL');
              }}
              className="mt-4 rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => {
            const hasCompletedAttempt =
              exam.status === 'COMPLETED' &&
              exam.attempt &&
              ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED'].includes(exam.attempt.status);

            const result = exam.attempt?.result;

            return (
              <div
                key={exam.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300"
              >
                <div>
                  {/* Card Header: Target & Status Pill */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-1 text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                      <Target size={12} />
                      {exam.examTarget}
                    </span>

                    {/* Status Badge */}
                    {exam.status === 'LIVE' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-400">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                        LIVE NOW
                      </span>
                    ) : exam.status === 'UPCOMING' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        <Clock size={11} />
                        Upcoming
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        <CheckCircle2 size={11} className="text-emerald-500" />
                        Completed
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {exam.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {exam.description || 'Comprehensive exam paper designed according to standard examination syllabus.'}
                  </p>

                  {/* Subject Pills */}
                  {exam.subjects && exam.subjects.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {exam.subjects.slice(0, 3).map((sub, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                        >
                          {sub}
                        </span>
                      ))}
                      {exam.subjects.length > 3 && (
                        <span className="rounded-md bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          +{exam.subjects.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* Key Stats Grid */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-2.5 text-center border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Questions</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {exam.totalQuestions}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Marks</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {exam.totalMarks}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duration</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {exam.durationMinutes}m
                      </p>
                    </div>
                  </div>

                  {/* Schedule Window */}
                  <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <Calendar size={13} className="text-slate-400" />
                    <span className="truncate">Start: {formatScheduleTime(exam.startTime)}</span>
                  </div>

                  {/* Persisted Result Banner if Completed */}
                  {hasCompletedAttempt && result && (
                    <div className="mt-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 p-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                          Your Score
                        </span>
                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                          {result.totalScore} / {result.maxScore}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300">
                          Accuracy
                        </span>
                        <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                          {Number(result.accuracy || 0).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Action Button */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  {hasCompletedAttempt ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/exam/result/${exam.attempt?.id}`)}
                      className="w-full rounded-xl text-xs font-bold text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
                    >
                      View Result & Analytics
                    </Button>
                  ) : exam.isInProgress ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartExam(exam)}
                      className="w-full rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200 dark:shadow-none flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw size={14} /> Resume Exam
                    </Button>
                  ) : exam.status === 'LIVE' ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleStartExam(exam)}
                      disabled={startingExamId === exam.id}
                      className="w-full rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-1.5"
                    >
                      {startingExamId === exam.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <PlayCircle size={14} />
                      )}
                      Start Exam
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/student/exams/${exam.id}`)}
                      className="w-full rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      View Details & Syllabus
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 pt-5 mt-6">
          <p className="text-xs text-slate-500 font-medium">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} exams
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="rounded-xl text-xs flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Previous
            </Button>
            <span className="text-xs font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              {pagination.page} / {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((prev) => prev + 1)}
              className="rounded-xl text-xs flex items-center gap-1"
            >
              Next <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Language Selection Modal */}
      {showLangModal && (
        <ExamStartLanguageModal
          isOpen={true}
          examId={showLangModal.id}
          examTitle={showLangModal.title}
          isStarting={startingExamId === showLangModal.id}
          startError={startError}
          onClose={() => {
            setShowLangModal(null);
            setStartError(null);
          }}
          onConfirmStart={(languageId: string) => launchExam(showLangModal.id, languageId)}
        />
      )}
    </div>
  );
};

export default AvailableExamsPage;
