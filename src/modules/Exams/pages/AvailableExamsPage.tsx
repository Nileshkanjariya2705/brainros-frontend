// ** Packages **
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Search,
  Globe2,
  TrendingUp,
  Loader2,
  X,
  PlayCircle,
  Calendar,
  Lock,
} from 'lucide-react';

// ** Services **
import { useGetAvailableExamsAPI, useStartAttemptAPI } from '../services';

// ** Hooks **
import { useAuth } from '@/hooks/useAuth';
import { useAxiosGet } from '@/hooks/useAxios';

// ** Components **
import Loader from '@/components/feedback/Loader';
import Button from '@/components/ui/Button';
import { ExamStartLanguageModal } from '../components/ExamStartLanguageModal';

// ** Types **
import type { Exam } from '@/types/exam.types';

// ─── Difficulty Badge ─────────────────────────────────────────
const getDifficultyLabel = (negMarks: number) => {
  if (negMarks <= 0) return { label: 'Easy', color: 'emerald' };
  if (negMarks < 0.5) return { label: 'Moderate', color: 'amber' };
  return { label: 'Tough', color: 'rose' };
};

// ─── Format Schedule Date/Time (Asia/Kolkata) ────────────────
const formatScheduleTime = (isoString?: string) => {
  if (!isoString) return '';
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
    return '';
  }
};

// ─── Format Countdown Seconds ────────────────────────────────
const formatCountdown = (seconds: number) => {
  if (seconds <= 0) return 'Live Now';
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
};

const AvailableExamsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [get] = useAxiosGet();

  const { getAvailableExamsAPI, isLoading } = useGetAvailableExamsAPI();
  const { startAttemptAPI } = useStartAttemptAPI();

  const [exams, setExams] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [examTargets, setExamTargets] = useState<{ id: string; name: string }[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [languages, setLanguages] = useState<{ id: string; name: string }[]>([]);
  const [categoryTab, setCategoryTab] = useState<'ALL' | 'MOCKS' | 'UPCOMING' | 'LIVE'>('ALL');
  const [startingExamId, setStartingExamId] = useState<string | null>(null);
  const [showLangModal, setShowLangModal] = useState<Exam | null>(null);
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
      }
    })();
    return () => {
      active = false;
    };
  }, [get, user?.studentProfile?.examTarget]);

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

  const filteredExams = exams.filter((e) => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const isMock = e.isMock ?? (e.title.toUpperCase().includes('MOCK') || (e.sections && e.sections.length === 1));
    const isScheduled = e.status?.name === 'SCHEDULED';
    const isActiveLive = e.status?.name === 'ACTIVE' && !isMock;

    if (categoryTab === 'MOCKS') return isMock;
    if (categoryTab === 'UPCOMING') return isScheduled;
    if (categoryTab === 'LIVE') return isActiveLive;
    return true;
  });

  const handleStartExam = async (exam: any) => {
    if (!exam.canStart && exam.status?.name === 'SCHEDULED') {
      alert('This exam is scheduled for a future live window. Please check the countdown timer and wait for the test to start.');
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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-indigo-800 to-purple-900 p-6 md:p-8 text-white shadow-xl">
        <div className="relative">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Active Testing Engine
          </div>

          <h1 className="text-2xl font-black sm:text-3xl md:text-4xl">
            Available Examination Portal
          </h1>
          <p className="mt-2 max-w-xl text-xs sm:text-sm text-indigo-200 leading-relaxed">
            Practice with self-paced Mock Tests or enter scheduled Live Exams. All tests are server-timed, auto-saved, and scored instantly.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-6 text-xs font-semibold">
            <div className="flex items-center gap-2 text-indigo-200">
              <FileText size={14} className="text-indigo-300" />
              <span>{exams.length} Available Tests</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-200">
              <Globe2 size={14} className="text-indigo-300" />
              <span>{languages.length || 5} Regional Languages</span>
            </div>
            <div className="flex items-center gap-2 text-indigo-200">
              <TrendingUp size={14} className="text-indigo-300" />
              <span>Instant AI Diagnostic Scorecard</span>
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

      {/* Category Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
        {[
          { key: 'ALL', label: 'All Examinations' },
          { key: 'MOCKS', label: 'Available Mock Tests' },
          { key: 'UPCOMING', label: 'Upcoming Live Exams' },
          { key: 'LIVE', label: 'Live Now' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setCategoryTab(tab.key as any)}
            className={`rounded-2xl px-4 py-2 border transition-all shrink-0 ${
              categoryTab === tab.key
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
          <Loader label="Loading available examinations..." />
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="p-12 text-center rounded-3xl border border-slate-200 bg-white space-y-3">
          <FileText className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Examinations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No examinations match the current filter. Try selecting "All Examinations".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const diff = getDifficultyLabel(exam.defaultNegativeMarks || 0);
            const isStarting = startingExamId === exam.id;
            const isMock =
              exam.isMock ?? (exam.title.toUpperCase().includes('MOCK') || (exam.sections && exam.sections.length === 1));
            const isScheduled = exam.status?.name === 'SCHEDULED';

            return (
              <div
                key={exam.id}
                className="rounded-3xl bg-white border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isMock
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : isScheduled
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {isMock ? 'Mock Test' : isScheduled ? 'Upcoming Live' : 'Live Exam'}
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

                  {/* Scheduled Window Banner */}
                  {isScheduled && exam.activeSchedule && (
                    <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between text-amber-900 font-bold">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-amber-600" />
                          Starts: {formatScheduleTime(exam.activeSchedule.startTime)}
                        </span>
                      </div>
                      {exam.activeSchedule.startsInSeconds > 0 && (
                        <p className="text-[11px] font-semibold text-amber-700">
                          Starts in: <span className="font-bold">{formatCountdown(exam.activeSchedule.startsInSeconds)}</span>
                        </p>
                      )}
                    </div>
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

                {isScheduled && !exam.canStart ? (
                  <Button
                    variant="outline"
                    size="md"
                    disabled
                    className="w-full flex items-center justify-center gap-2 font-bold bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed"
                  >
                    <Lock size={15} />
                    <span>Upcoming — Starts Soon</span>
                  </Button>
                ) : (
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
                        <span>{isMock ? 'Start Mock Test' : 'Start Live Exam'}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Language Selection Modal (Gate before starting attempt) ─ */}
      <ExamStartLanguageModal
        isOpen={Boolean(showLangModal)}
        examId={showLangModal?.id || ''}
        examTitle={showLangModal?.title}
        onClose={() => setShowLangModal(null)}
        onConfirmStart={async (chosenLangId) => {
          if (showLangModal) {
            await launchExam(showLangModal.id, chosenLangId);
          }
        }}
        isStarting={startingExamId !== null}
        startError={startError}
      />
    </div>
  );
};

export default AvailableExamsPage;
