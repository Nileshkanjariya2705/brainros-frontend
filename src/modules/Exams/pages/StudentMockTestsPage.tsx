// ** Packages **
import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  Award,
  Search,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  RotateCcw,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Zap,
  History,
} from 'lucide-react';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

// ** Services **
import {
  useGetStudentMockTestsAPI,
  useStartAttemptAPI,
  type StudentMockTestItem,
  type StudentPaginationMeta,
} from '../services';

// ** Hooks **
import { useAxiosGet } from '@/hooks/useAxios';

// ** Components **
import Button from '@/components/ui/Button';
import { ExamStartLanguageModal } from '../components/ExamStartLanguageModal';
import { MockAttemptsModal } from '../components/MockAttemptsModal';

// ─── Difficulty Color Helper ─────────────────────────────────
const getDifficultyBadge = (difficulty: string) => {
  switch (difficulty?.toUpperCase()) {
    case 'EASY':
      return {
        label: 'Easy',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      };
    case 'HARD':
      return {
        label: 'Hard',
        className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      };
    default:
      return {
        label: 'Medium',
        className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      };
  }
};

export const StudentMockTestsPage = () => {
  const navigate = useNavigate();
  const [get] = useAxiosGet();

  const { getStudentMockTestsAPI, isLoading } = useGetStudentMockTestsAPI();
  const { startAttemptAPI } = useStartAttemptAPI();

  const [mockTests, setMockTests] = useState<StudentMockTestItem[]>([]);
  const [pagination, setPagination] = useState<StudentPaginationMeta>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  const [attemptTab, setAttemptTab] = useState<'ALL' | 'NOT_ATTEMPTED' | 'ATTEMPTED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [examTargets, setExamTargets] = useState<{ id: string; name: string }[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [sortOption, setSortOption] = useState<string>('NEWEST');

  const [searchParams] = useSearchParams();
  const mockTestIdParam = searchParams.get('mockTestId');
  const autoOpenedRef = useRef<boolean>(false);

  const [startingTestId, setStartingTestId] = useState<string | null>(null);
  const [showLangModal, setShowLangModal] = useState<any | null>(null);
  const [selectedMockForAttempts, setSelectedMockForAttempts] = useState<StudentMockTestItem | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load target options on mount
  useEffect(() => {
    let active = true;
    (async () => {
      const res = await get<{
        examTargets: { id: string; name: string }[];
      }>('/auth/options');
      if (!active) return;
      const opts = res.data?.examTargets ? res.data : (res.data as any)?.data || {};
      if (opts?.examTargets) {
        setExamTargets(opts.examTargets);
      }
    })();
    return () => {
      active = false;
    };
  }, [get]);

  // Fetch Mock Tests from API
  const fetchMockTests = useCallback(async () => {
    const params: Record<string, any> = {
      attemptStatus: attemptTab,
      page: pagination.page,
      limit: pagination.limit,
      sort: sortOption,
    };
    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }
    if (selectedTarget) {
      params.examTargetId = selectedTarget;
    }
    if (selectedDifficulty && selectedDifficulty !== 'ALL') {
      params.difficulty = selectedDifficulty;
    }
    if (selectedSubject) {
      params.subjectId = selectedSubject;
    }

    const res = await getStudentMockTestsAPI(params);
    if (res.data) {
      setMockTests(Array.isArray(res.data) ? res.data : (res.data as any).data || []);
      const meta = (res as any).meta || (res.response?.data as any)?.meta;
      if (meta) {
        setPagination(meta);
      }
    }
  }, [
    attemptTab,
    pagination.page,
    pagination.limit,
    sortOption,
    debouncedSearch,
    selectedTarget,
    selectedDifficulty,
    selectedSubject,
    getStudentMockTestsAPI,
  ]);

  useEffect(() => {
    fetchMockTests();
  }, [fetchMockTests]);

  // Handle mockTestId query parameter (e.g. from Dashboard diagnostic recommendation)
  useEffect(() => {
    if (mockTestIdParam && mockTests.length > 0 && !autoOpenedRef.current) {
      const matchedTest = mockTests.find((t) => t.id === mockTestIdParam);
      if (matchedTest) {
        autoOpenedRef.current = true;
        if (matchedTest.attemptStatus === 'ATTEMPTED') {
          setSelectedMockForAttempts(matchedTest);
        } else {
          handleGiveTest(matchedTest);
        }
      }
    }
  }, [mockTestIdParam, mockTests]);

  // Start / Resume Handlers
  const handleGiveTest = (test: StudentMockTestItem) => {
    if (test.attemptStatus === 'IN_PROGRESS' && test.activeAttemptId) {
      navigate(`/exam/${test.id}/attempt/${test.activeAttemptId}`);
      return;
    }
    setStartError(null);
    setShowLangModal(test);
  };

  const launchTest = async (testId: string, languageId: string) => {
    setStartingTestId(testId);
    setStartError(null);
    const res = await startAttemptAPI(testId, languageId);
    setStartingTestId(null);

    const payload: any = res.data;
    const raw: any = res.response?.data;
    const attemptData = payload?.data || payload || raw?.data;
    const attemptId = attemptData?.attemptId || attemptData?.id;

    if (attemptId) {
      setShowLangModal(null);
      navigate(`/exam/${testId}/attempt/${attemptId}`);
    } else {
      const errMsg =
        res.error || raw?.message || payload?.message || 'Unable to start practice test.';
      setStartError(errMsg);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative z-10">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
            <Zap size={13} className="text-amber-300" />
            Adaptive Practice & Mock Engine
          </div>

          <h1 className="text-2xl font-black sm:text-3xl md:text-4xl tracking-tight">
            Mock Tests & Practice Papers
          </h1>
          <p className="mt-2 max-w-2xl text-xs sm:text-sm text-purple-100 leading-relaxed">
            Take unlimited practice mock tests anytime. Sharpen your speed and accuracy with real-time question timers, instant answer evaluations, and AI test-taking analytics.
          </p>

          {/* Quick Metrics & History Link */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold">
              <div className="flex items-center gap-2 text-purple-200">
                <Award size={15} className="text-amber-400" />
                <span>{pagination.total} Available Mock Tests</span>
              </div>
              <div className="flex items-center gap-2 text-purple-200">
                <BookOpen size={15} className="text-purple-300" />
                <span>Multi-Subject & Full Syllabus</span>
              </div>
              <div className="flex items-center gap-2 text-purple-200">
                <TrendingUp size={15} className="text-emerald-400" />
                <span>Detailed Section & Chapter Analytics</span>
              </div>
            </div>

            <Link
              to={PRIVATE_NAVIGATION.studentMockHistory}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition-all shadow-sm"
            >
              <History size={14} />
              View Mock Test History
            </Link>
          </div>
        </div>
      </div>

      {/* Control Bar: Tabs, Search & Filters */}
      <div className="flex flex-col gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Attempt Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-x-auto">
            {[
              { key: 'ALL', label: 'All Tests' },
              { key: 'NOT_ATTEMPTED', label: 'Not Attempted' },
              { key: 'ATTEMPTED', label: 'Attempted' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setAttemptTab(tab.key as any);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  attemptTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px] flex-1 md:max-w-xs">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={15}
            />
            <input
              type="text"
              placeholder="Search mock tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="Biology">Biology / Botany / Zoology</option>
            <option value="Mathematics">Mathematics</option>
          </select>

          {/* Difficulty Filter */}
          <select
            value={selectedDifficulty}
            onChange={(e) => {
              setSelectedDifficulty(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>

          {/* Target Filter */}
          <select
            value={selectedTarget}
            onChange={(e) => {
              setSelectedTarget(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
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

          {/* Sort Filter */}
          <select
            value={sortOption}
            onChange={(e) => {
              setSortOption(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium ml-auto"
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
            <option value="MOST_ATTEMPTED">Most Attempted</option>
            <option value="NAME_ASC">Name (A-Z)</option>
            <option value="NAME_DESC">Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Mock Tests Grid */}
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
      ) : mockTests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center bg-white dark:bg-slate-800 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-4">
            <Award size={26} />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {attemptTab === 'NOT_ATTEMPTED'
              ? 'You have attempted all available mock tests!'
              : attemptTab === 'ATTEMPTED'
                ? 'No mock tests attempted yet'
                : 'No mock tests found'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {debouncedSearch || selectedSubject || selectedDifficulty !== 'ALL'
              ? 'No practice tests match your filter criteria. Try resetting your search filters.'
              : 'Practice mock tests will appear here once published by your institution.'}
          </p>
          {(debouncedSearch || selectedSubject || selectedDifficulty !== 'ALL' || selectedTarget || attemptTab !== 'ALL') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedSubject('');
                setSelectedDifficulty('ALL');
                setSelectedTarget('');
                setAttemptTab('ALL');
              }}
              className="mt-4 rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {mockTests.map((test) => {
            const diffBadge = getDifficultyBadge(test.difficulty);
            const isAttempted = test.attemptStatus === 'ATTEMPTED';
            const isInProgress = test.attemptStatus === 'IN_PROGRESS';

            return (
              <div
                key={test.id}
                className="group relative flex flex-col justify-between rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-300"
              >
                <div>
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 dark:bg-purple-900/40 px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                      <BookOpen size={12} />
                      {test.primarySubject}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${diffBadge.className}`}
                      >
                        {diffBadge.label}
                      </span>

                      {isInProgress ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-extrabold text-amber-700 dark:text-amber-400">
                          In-Progress
                        </span>
                      ) : isAttempted ? (
                        <button
                          type="button"
                          onClick={() => setSelectedMockForAttempts(test)}
                          className="inline-flex items-center gap-1 rounded-full bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                          title="Click to view all attempts"
                        >
                          <CheckCircle2 size={10} />
                          Attempted ({test.attemptsCount})
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                          New
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Test Title & Description */}
                  <h3 className="text-base font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {test.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {test.description || 'Full-length practice test with official syllabus questions, negative marking, and timer.'}
                  </p>

                  {/* Subject Pills */}
                  {test.subjects && test.subjects.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {test.subjects.slice(0, 3).map((sub, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                        >
                          {sub}
                        </span>
                      ))}
                      {test.subjects.length > 3 && (
                        <span className="rounded-md bg-slate-100 dark:bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                          +{test.subjects.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Key Stats Grid */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-2.5 text-center border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Questions</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {test.totalQuestions}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Marks</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {test.totalMarks}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Duration</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {test.durationMinutes}m
                      </p>
                    </div>
                  </div>

                  {/* Best Score Banner if Attempted */}
                  {isAttempted && test.bestScore !== null && (
                    <div className="mt-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 p-2.5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-purple-800 dark:text-purple-300">
                          Best Score
                        </span>
                        <p className="text-sm font-black text-purple-700 dark:text-purple-400">
                          {test.bestScore} / {test.totalMarks}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-purple-800 dark:text-purple-300">
                          Score Rate
                        </span>
                        <p className="text-sm font-black text-purple-700 dark:text-purple-400">
                          {Number(test.bestPercentage || 0).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  {isInProgress ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleGiveTest(test)}
                      className="w-full rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200 dark:shadow-none flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw size={14} /> Resume Test
                    </Button>
                  ) : isAttempted ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/exam/result/${test.latestAttemptId}`)}
                          className="flex-1 rounded-xl text-xs font-bold text-purple-700 border-purple-200 hover:bg-purple-50 dark:border-purple-800 dark:text-purple-300 dark:hover:bg-purple-950/50"
                        >
                          View Result
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleGiveTest(test)}
                          disabled={startingTestId === test.id}
                          className="flex-1 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200 dark:shadow-none flex items-center justify-center gap-1"
                        >
                          {startingTestId === test.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <RotateCcw size={13} />
                          )}
                          Give Test Again
                        </Button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedMockForAttempts(test)}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold text-slate-600 hover:text-purple-700 dark:text-slate-400 dark:hover:text-purple-300 transition-colors"
                      >
                        <History size={12} />
                        <span>All Attempts ({test.attemptsCount})</span>
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleGiveTest(test)}
                      disabled={startingTestId === test.id}
                      className="w-full rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200 dark:shadow-none flex items-center justify-center gap-1.5"
                    >
                      {startingTestId === test.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <PlayCircle size={14} />
                      )}
                      Give Test
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
            {pagination.total} tests
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
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
              onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
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
          isStarting={startingTestId === showLangModal.id}
          startError={startError}
          onClose={() => {
            setShowLangModal(null);
            setStartError(null);
          }}
          onConfirmStart={(languageId: string) => launchTest(showLangModal.id, languageId)}
        />
      )}

      {/* Mock Test All Attempts Modal */}
      {selectedMockForAttempts && (
        <MockAttemptsModal
          isOpen={!!selectedMockForAttempts}
          mockTestId={selectedMockForAttempts.id}
          mockTestTitle={selectedMockForAttempts.title}
          onClose={() => setSelectedMockForAttempts(null)}
          onRetakeTest={() => {
            const testToRetake = selectedMockForAttempts;
            setSelectedMockForAttempts(null);
            handleGiveTest(testToRetake);
          }}
          onResumeTest={(mockId, attId) => {
            setSelectedMockForAttempts(null);
            navigate(`/exam/${mockId}/attempt/${attId}`);
          }}
        />
      )}
    </div>
  );
};

export default StudentMockTestsPage;
