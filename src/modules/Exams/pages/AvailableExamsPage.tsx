// ** Packages **
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  FileText,
  Award,
  BookOpen,
  ArrowRight,
  Search,
  Target,
  TrendingUp,
  PlayCircle,
  Globe2,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import cn from 'classnames';

// ** Services **
import { useGetAvailableExamsAPI, useStartAttemptAPI } from '../services';

// ** Hooks **
import { useAuth } from '@/hooks/useAuth';
import { useAxiosGet } from '@/hooks/useAxios';

// ** Components **
import Loader from '@/components/feedback/Loader';

// ** Types **
import type { Exam } from '@/types/exam.types';

// ─── Difficulty Badge ─────────────────────────────────────────
const getDifficultyLabel = (negMarks: number) => {
  if (negMarks <= 0) return { label: 'Easy', color: 'emerald' };
  if (negMarks < 0.5) return { label: 'Moderate', color: 'amber' };
  return { label: 'Tough', color: 'rose' };
};

const AvailableExamsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [get] = useAxiosGet();

  const { getAvailableExamsAPI, isLoading } = useGetAvailableExamsAPI();
  const { startAttemptAPI } = useStartAttemptAPI();

  const [exams, setExams] = useState<Exam[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [examTargets, setExamTargets] = useState<{ id: string; name: string }[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [languages, setLanguages] = useState<{ id: string; name: string }[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [startingExamId, setStartingExamId] = useState<string | null>(null);
  const [showLangModal, setShowLangModal] = useState<Exam | null>(null);
  const [tempLang, setTempLang] = useState<string | null>(null);

  // Load options on mount
  useEffect(() => {
    (async () => {
      const res = await get<{
        classes: { id: string; name: string }[];
        languages: { id: string; name: string }[];
        examTargets: { id: string; name: string }[];
      }>('/auth/options');
      if (res.data) {
        setExamTargets(res.data.examTargets || []);
        setLanguages(res.data.languages || []);

        if (user?.studentProfile?.examTarget) {
          const target = (res.data.examTargets || []).find(
            (t) => t.name === user.studentProfile?.examTarget,
          );
          if (target) setSelectedTarget(target.id);
        }
        if (user?.studentProfile?.preferredLanguage) {
          const lang = (res.data.languages || []).find(
            (l) => l.name === user.studentProfile?.preferredLanguage,
          );
          if (lang) setSelectedLanguage(lang.id);
        }
      }
    })();
  }, [get, user]);

  // Load exams when target changes
  useEffect(() => {
    if (!selectedTarget) return;
    (async () => {
      const res = await getAvailableExamsAPI(selectedTarget);
      if (res.data) setExams(res.data);
    })();
  }, [selectedTarget, getAvailableExamsAPI]);

  const filteredExams = exams.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleStartExam = async (exam: Exam) => {
    if (!selectedLanguage) {
      setShowLangModal(exam);
      setTempLang(languages[0]?.id || null);
      return;
    }
    await launchExam(exam.id, selectedLanguage);
  };

  const launchExam = async (examId: string, languageId: string) => {
    setStartingExamId(examId);
    const res = await startAttemptAPI(examId, languageId);
    setStartingExamId(null);
    setShowLangModal(null);

    if (res.data) {
      const attemptId = res.data.attemptId;
      navigate(`/exam/${examId}/attempt/${attemptId}`);
    }
  };

  const totalAnswered = exams.length;

  return (
    <div className="space-y-6">
      {/* ── Hero Header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 p-6 md:p-8 text-white shadow-2xl shadow-indigo-900/30">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute right-0 top-0 h-72 w-72 -translate-y-12 translate-x-12 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute left-1/3 bottom-0 h-48 w-48 translate-y-16 rounded-full bg-purple-400/10 blur-2xl" />
          <div className="absolute left-0 bottom-0 h-64 w-64 -translate-x-16 translate-y-8 rounded-full bg-indigo-300/5 blur-3xl" />
        </div>

        <div className="relative">
          {/* Status pill */}
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Mock Tests Available
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl md:text-4xl">
            Available Exams
          </h1>
          <p className="mt-2 max-w-xl text-sm text-indigo-200 leading-relaxed">
            Select your target exam below. All tests are server-timed, auto-saved, and scored
            instantly with detailed AI-powered analytics.
          </p>

          {/* Stats row */}
          <div className="mt-5 flex flex-wrap items-center gap-6 text-xs font-semibold">
            <div className="flex items-center gap-2 text-indigo-200">
              <FileText size={14} className="text-indigo-300" />
              <span>{totalAnswered} Exams</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-200">
              <Globe2 size={14} className="text-indigo-300" />
              <span>{languages.length} Languages</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-200">
              <TrendingUp size={14} className="text-indigo-300" />
              <span>Instant Results</span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-300"
                size={16}
              />
              <input
                type="text"
                placeholder="Search exams…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl bg-white/10 pl-9 pr-4 py-2.5 text-sm text-white placeholder-indigo-300 border border-white/15 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-white/15 transition-all"
              />
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 px-3 py-2 backdrop-blur">
              <Globe2 size={14} className="text-indigo-300 shrink-0" />
              <select
                value={selectedLanguage || ''}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent text-xs font-medium text-white focus:outline-none cursor-pointer"
              >
                <option value="" className="text-gray-900 bg-white">
                  Select Language
                </option>
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id} className="text-gray-900 bg-white">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Target Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {examTargets.map((target) => (
              <button
                key={target.id}
                onClick={() => setSelectedTarget(target.id)}
                className={cn(
                  'rounded-xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200',
                  selectedTarget === target.id
                    ? 'bg-white text-indigo-700 shadow-xl shadow-white/10'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/10',
                )}
              >
                {target.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Exam Grid ─────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader label="Loading available exams…" />
        </div>
      ) : !selectedTarget ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500">
            <Target size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">Select Your Exam Target</h3>
          <p className="mt-2 max-w-xs text-sm text-slate-500">
            Choose one of the target exam categories above to see all available tests.
          </p>
          {examTargets.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {examTargets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTarget(t.id)}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <BookOpen size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No Exams Available</h3>
          <p className="mt-2 text-sm text-slate-500">
            {searchQuery
              ? `No results for "${searchQuery}". Try a different search.`
              : 'No active exams for this category. Check back soon!'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-sm text-indigo-600 font-semibold hover:underline"
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filteredExams.map((exam, i) => {
            const diff = getDifficultyLabel(exam.defaultNegativeMarks);
            const isStarting = startingExamId === exam.id;

            return (
              <div
                key={exam.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200"
              >
                {/* Top gradient strip */}
                <div
                  className={cn(
                    'h-1.5 bg-gradient-to-r transition-all duration-300',
                    i % 3 === 0
                      ? 'from-indigo-500 via-purple-500 to-pink-500'
                      : i % 3 === 1
                        ? 'from-emerald-500 via-teal-500 to-cyan-500'
                        : 'from-amber-500 via-orange-500 to-rose-500',
                  )}
                />

                <div className="flex flex-col flex-1 p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          <FileText size={10} />
                          {exam.examTarget?.name || 'General'}
                        </span>
                        <span
                          className={cn(
                            'rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                            diff.color === 'emerald'
                              ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                              : diff.color === 'amber'
                                ? 'bg-amber-50 border-amber-100 text-amber-600'
                                : 'bg-rose-50 border-rose-100 text-rose-600',
                          )}
                        >
                          {diff.label}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors line-clamp-2">
                        {exam.title}
                      </h3>
                      {exam.description && (
                        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {exam.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <div className="flex flex-col items-center gap-0.5">
                      <FileText size={14} className="text-indigo-500" />
                      <span className="text-sm font-bold text-slate-900">
                        {exam.totalQuestions}
                      </span>
                      <span className="text-[10px] text-slate-500">Questions</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 border-x border-slate-200">
                      <Award size={14} className="text-amber-500" />
                      <span className="text-sm font-bold text-slate-900">{exam.totalMarks}</span>
                      <span className="text-[10px] text-slate-500">Total Marks</span>
                    </div>
                    <div className="flex flex-col items-center gap-0.5">
                      <Clock size={14} className="text-emerald-500" />
                      <span className="text-sm font-bold text-slate-900">
                        {exam.durationMinutes}
                      </span>
                      <span className="text-[10px] text-slate-500">Minutes</span>
                    </div>
                  </div>

                  {/* Marking Scheme */}
                  <div className="mt-3 flex items-center gap-3 text-xs font-semibold">
                    <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-100 px-2.5 py-1 text-emerald-700">
                      <CheckCircle2 size={12} />+{exam.defaultMarksPerQuestion} correct
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-100 px-2.5 py-1 text-rose-700">
                      <X size={12} />−{exam.defaultNegativeMarks} wrong
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleStartExam(exam)}
                      disabled={isStarting}
                      className={cn(
                        'group/btn relative w-full flex items-center justify-center gap-2 overflow-hidden rounded-xl py-3 text-sm font-bold text-white transition-all duration-300',
                        isStarting
                          ? 'bg-indigo-400 cursor-not-allowed'
                          : 'bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200/60 hover:shadow-lg hover:shadow-indigo-200/80 hover:scale-[1.01]',
                      )}
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover/btn:translate-x-full transition-transform duration-700" />

                      {isStarting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Launching Exam…
                        </>
                      ) : (
                        <>
                          <PlayCircle size={16} />
                          Start Test
                          <ArrowRight
                            size={14}
                            className="ml-0.5 group-hover/btn:translate-x-1 transition-transform"
                          />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Language Selection Modal ────────────────────────── */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Globe2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Select Exam Language</h3>
                    <p className="text-xs text-slate-500">
                      You can switch language during the exam
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLangModal(null)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="mb-4 rounded-xl bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-800 border border-indigo-100">
                📝 {showLangModal.title}
              </p>

              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setTempLang(lang.id)}
                    className={cn(
                      'rounded-xl border p-3 text-sm font-semibold text-left transition-all',
                      tempLang === lang.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50/50',
                    )}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setShowLangModal(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (tempLang && showLangModal) {
                      setSelectedLanguage(tempLang);
                      launchExam(showLangModal.id, tempLang);
                    }
                  }}
                  disabled={!tempLang || startingExamId === showLangModal.id}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-200/50 transition-all disabled:opacity-60"
                >
                  {startingExamId === showLangModal.id ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Starting…
                    </>
                  ) : (
                    <>
                      <PlayCircle size={15} /> Start Exam
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableExamsPage;
