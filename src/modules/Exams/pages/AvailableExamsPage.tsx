// ** Packages **
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Search, Globe2, TrendingUp, Loader2, X, PlayCircle } from 'lucide-react';

// ** Services **
import { useGetAvailableExamsAPI, useStartAttemptAPI } from '../services';

// ** Hooks **
import { useAuth } from '@/hooks/useAuth';
import { useAxiosGet } from '@/hooks/useAxios';

// ** Components **
import Loader from '@/components/feedback/Loader';
import Button from '@/components/ui/Button';

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
  const [startError, setStartError] = useState<string | null>(null);

  // Load options on mount
  useEffect(() => {
    let active = true;
    (async () => {
      const res = await get<{
        classes: { id: string; name: string }[];
        languages: { id: string; name: string }[];
        examTargets: { id: string; name: string }[];
      }>('/auth/options');
      if (!active) return;
      const opts = res.data?.examTargets ? res.data : (res.data as any)?.data || {};
      if (opts) {
        setExamTargets(opts.examTargets || []);
        setLanguages(opts.languages || []);

        if (user?.studentProfile?.examTarget) {
          const target = (opts.examTargets || []).find(
            (t: any) => t.name === user.studentProfile?.examTarget,
          );
          if (target) setSelectedTarget(target.id);
        }
        if (user?.studentProfile?.preferredLanguage) {
          const lang = (opts.languages || []).find(
            (l: any) => l.name === user.studentProfile?.preferredLanguage,
          );
          if (lang) setSelectedLanguage(lang.id);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [get, user?.studentProfile?.examTarget, user?.studentProfile?.preferredLanguage]);

  // Load exams
  useEffect(() => {
    let active = true;
    (async () => {
      const targetParam = selectedTarget || 'all';
      const res = await getAvailableExamsAPI(targetParam);
      if (!active) return;
      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray((res.data as any)?.data)
          ? (res.data as any).data
          : Array.isArray(res.response?.data?.data)
            ? res.response.data.data
            : [];
      setExams(list);
    })();
    return () => {
      active = false;
    };
  }, [selectedTarget, getAvailableExamsAPI]);

  const filteredExams = exams.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleStartExam = async (exam: Exam) => {
    setStartError(null);
    const langToUse = selectedLanguage || languages[0]?.id;
    if (!langToUse) {
      setShowLangModal(exam);
      setTempLang(languages[0]?.id || null);
      return;
    }
    await launchExam(exam.id, langToUse);
  };

  const launchExam = async (examId: string, languageId: string) => {
    setStartingExamId(examId);
    setStartError(null);
    const res = await startAttemptAPI(examId, languageId);
    setStartingExamId(null);
    setShowLangModal(null);

    const payload: any = res.data;
    const raw: any = res.response?.data;
    const attemptData = payload?.data || payload || raw?.data;
    const attemptId = attemptData?.attemptId || attemptData?.id;

    if (attemptId) {
      navigate(`/exam/${examId}/attempt/${attemptId}`);
    } else {
      const errMsg =
        res.error || raw?.message || payload?.message || 'Unable to start exam attempt.';
      setStartError(errMsg);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Mock Tests Ready
          </div>

          <h1 className="text-2xl font-black sm:text-3xl md:text-4xl">
            Available Examination Portal
          </h1>
          <p className="mt-2 max-w-xl text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Select a mock test below to practice. All tests are server-timed, auto-saved, and scored
            instantly with detailed analytics.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-6 text-xs font-semibold">
            <div className="flex items-center gap-2 text-indigo-200">
              <FileText size={14} className="text-indigo-300" />
              <span>{exams.length} Available Tests</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-200">
              <Globe2 size={14} className="text-indigo-300" />
              <span>{languages.length || 5} Languages</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-200">
              <TrendingUp size={14} className="text-indigo-300" />
              <span>Instant AI Performance Report</span>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="relative mt-6 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-300"
                size={16}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mock exams by title..."
                className="w-full rounded-xl bg-white/10 pl-10 pr-4 py-2 text-xs font-medium text-white placeholder-indigo-300 border border-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-md"
              />
            </div>

            {/* Exam Target Dropdown */}
            <select
              value={selectedTarget || ''}
              onChange={(e) => setSelectedTarget(e.target.value || null)}
              aria-label="Filter by Target Exam"
              className="rounded-xl bg-white/10 px-3.5 py-2 text-xs font-semibold text-white border border-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-md"
            >
              <option value="" className="text-slate-800">
                All Target Curriculums
              </option>
              {examTargets.map((t) => (
                <option key={t.id} value={t.id} className="text-slate-800">
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Error alert if start attempt failed */}
      {startError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between">
          <span>{startError}</span>
          <button onClick={() => setStartError(null)} className="p-1 hover:bg-rose-100 rounded-lg">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Exam Grid */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader label="Loading available exams..." />
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-slate-200 bg-white space-y-3">
          <FileText className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Exams Available</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No active mock tests found for the selected filter. Try selecting "All Target
            Curriculums".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const diff = getDifficultyLabel(exam.defaultNegativeMarks || 0);
            const isStarting = startingExamId === exam.id;

            return (
              <div
                key={exam.id}
                className="rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {exam.examTarget?.name || 'Mock Test'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold bg-${diff.color}-50 text-${diff.color}-700 border border-${diff.color}-200`}
                    >
                      {diff.label}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                    {exam.title}
                  </h3>

                  {exam.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {exam.description}
                    </p>
                  )}

                  <div className="pt-2 grid grid-cols-3 gap-2 border-t border-slate-100 text-center">
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 block">Questions</span>
                      <span className="text-xs font-black text-slate-800">
                        {exam.totalQuestions || exam._count?.examQuestions || 20}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 block">Duration</span>
                      <span className="text-xs font-black text-slate-800">
                        {exam.durationMinutes || 60}m
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 block">
                        Total Marks
                      </span>
                      <span className="text-xs font-black text-indigo-600">
                        {exam.totalMarks || 100}
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={() => handleStartExam(exam)}
                  disabled={isStarting}
                  className="w-full flex items-center justify-center gap-2 font-bold shadow-sm"
                >
                  {isStarting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Starting Test...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle size={16} />
                      <span>Start Test Now</span>
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Language Selection Modal (fallback) */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">Select Test Language</h4>
              <button
                onClick={() => setShowLangModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Choose your preferred language for <strong>{showLangModal.title}</strong>. You can
              also switch languages during the test.
            </p>

            <div className="space-y-2">
              {languages.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setTempLang(l.id)}
                  className={`w-full p-3 rounded-2xl border text-xs font-bold text-left transition ${
                    tempLang === l.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLangModal(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => tempLang && launchExam(showLangModal.id, tempLang)}
                disabled={!tempLang || startingExamId !== null}
                className="flex-1"
              >
                Start Test
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableExamsPage;
