// ** Packages **
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  ShieldAlert,
  X,
  FileText,
  User,
  Wifi,
  WifiOff,
  CheckCircle2,
  Circle,
  Hash,
  ToggleLeft,
  Grid3X3,
  Loader2,
  Flag,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import cn from 'classnames';

// ** Services & Hooks **
import {
  useGetAttemptStatusAPI,
  useGetAttemptQuestionsAPI,
  useSaveAnswerAPI,
  useSubmitAttemptAPI,
  useStartQuestionTimingAPI,
} from '../services';
import { useAuth } from '@/hooks/useAuth';

// ** Components **
import Loader from '@/components/feedback/Loader';
import Button from '@/components/ui/Button';
import { ExamLanguageSwitcher } from '../components/ExamLanguageSwitcher';

// ** Types **
import type { ExamQuestion, AttemptAnswer } from '@/types/exam.types';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

// ─── Question Type Icon ────────────────────────────────────────
const QuestionTypeIcon = ({ code }: { code: string }) => {
  switch (code) {
    case 'MCQ':
      return <Grid3X3 size={14} />;
    case 'NUM':
      return <Hash size={14} />;
    case 'TF':
      return <ToggleLeft size={14} />;
    default:
      return <Circle size={14} />;
  }
};

// ─── Status Badge Colors ───────────────────────────────────────
const getPaletteBadgeClass = (status: string, isCurrent: boolean) => {
  const base =
    'flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all duration-200 select-none cursor-pointer';
  const activeRing = isCurrent ? 'ring-2 ring-offset-1 ring-indigo-400 scale-110 shadow-lg' : '';
  switch (status) {
    case 'ANSWERED':
      return cn(base, activeRing, 'bg-emerald-500 text-white shadow-emerald-200 shadow-sm');
    case 'NOT_ANSWERED':
      return cn(base, activeRing, 'bg-rose-500 text-white shadow-rose-200 shadow-sm');
    case 'MARKED':
      return cn(base, activeRing, 'bg-purple-600 text-white shadow-purple-200 shadow-sm');
    case 'ANS_MARKED':
      return cn(base, activeRing, 'bg-indigo-600 text-white ring-purple-400 shadow-sm');
    default:
      return cn(base, activeRing, 'bg-slate-200 text-slate-600');
  }
};

// ─── Timer Badge ───────────────────────────────────────────────
const formatTimer = (totalSeconds: number | null) => {
  if (totalSeconds === null) return '00:00:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const ExamInterfacePage = () => {
  const { attemptId } = useParams<{ examId: string; attemptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // API hooks
  const { getAttemptStatusAPI, isLoading: isStatusLoading } = useGetAttemptStatusAPI();
  const { getAttemptQuestionsAPI, isLoading: isQuestionsLoading } = useGetAttemptQuestionsAPI();
  const { saveAnswerAPI } = useSaveAnswerAPI();
  const { submitAttemptAPI, isLoading: isSubmitting } = useSubmitAttemptAPI();
  const { startQuestionTimingAPI } = useStartQuestionTimingAPI();

  // Core exam state
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AttemptAnswer>>({});
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>('ALL');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [examTitle] = useState<string>('');

  // UI state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [saveStatusText, setSaveStatusText] = useState<'idle' | 'saving' | 'saved' | 'error'>(
    'idle',
  );
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  // Current question input state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [numericalAnswer, setNumericalAnswer] = useState<string>('');
  const [isMarkedForReview, setIsMarkedForReview] = useState<boolean>(false);

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load initial status & questions
  useEffect(() => {
    if (!attemptId) return;
    let isMounted = true;

    (async () => {
      // 1. Fetch questions
      const qRes = await getAttemptQuestionsAPI(attemptId);
      if (!isMounted) return;
      const qData: ExamQuestion[] = Array.isArray(qRes.data)
        ? qRes.data
        : Array.isArray((qRes.data as any)?.data)
          ? (qRes.data as any).data
          : Array.isArray(qRes.response?.data?.data)
            ? qRes.response.data.data
            : [];

      if (!qData || qData.length === 0) {
        setErrorMessage(
          qRes.error ||
            qRes.response?.data?.message ||
            (qRes.data as any)?.message ||
            'Failed to load exam questions',
        );
        return;
      }
      setQuestions(qData);

      // 2. Fetch attempt status
      const sRes = await getAttemptStatusAPI(attemptId);
      if (!isMounted) return;
      const sData: any = sRes.data?.answers
        ? sRes.data
        : (sRes.data as any)?.data || sRes.response?.data?.data;

      if (sData) {
        const ansMap: Record<string, AttemptAnswer> = {};
        (sData.answers || []).forEach((ans: any) => {
          ansMap[ans.examQuestionId] = ans;
        });
        setAnswers(ansMap);

        if (sData.serverEndTime) {
          const endMs = new Date(sData.serverEndTime).getTime();
          const remainingSecs = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
          setTimeLeft(remainingSecs);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [attemptId, getAttemptQuestionsAPI, getAttemptStatusAPI]);

  // Sync inputs & record server-authoritative question timing on navigation
  useEffect(() => {
    if (questions.length === 0) return;
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    // Report question timing start to server (server is authoritative)
    if (attemptId && currentQ.examQuestionId) {
      startQuestionTimingAPI(attemptId, currentQ.examQuestionId, {
        clientTimestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    const existingAns = answers[currentQ.examQuestionId];
    if (existingAns) {
      setSelectedOptionId(existingAns.selectedOptionId ?? null);
      setSelectedOptions(existingAns.selectedOptions ?? []);
      setNumericalAnswer(
        existingAns.numericalAnswer !== null && existingAns.numericalAnswer !== undefined
          ? String(existingAns.numericalAnswer)
          : '',
      );
      setIsMarkedForReview(existingAns.isMarkedForReview ?? false);
    } else {
      setSelectedOptionId(null);
      setSelectedOptions([]);
      setNumericalAnswer('');
      setIsMarkedForReview(false);
    }
  }, [currentIdx, questions, answers, attemptId, startQuestionTimingAPI]);

  // Auto-submit on time expiry
  const handleAutoSubmit = useCallback(async () => {
    if (!attemptId) return;
    setSaveStatusText('saving');
    const res = await submitAttemptAPI(attemptId);
    if (res.data || res.isSuccess) {
      navigate(PRIVATE_NAVIGATION.examResult.replace(':attemptId', attemptId));
    }
  }, [attemptId, navigate, submitAttemptAPI]);

  // Live Countdown Timer
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, handleAutoSubmit]);

  // ── Derived Data ──────────────────────────────────────────────
  const sections = Array.from(new Set(questions.map((q) => q.section?.name || 'General')));

  const filteredQuestions =
    activeSection === 'ALL'
      ? questions
      : questions.filter((q) => (q.section?.name || 'General') === activeSection);

  const currentQuestion = questions[currentIdx];

  const getQuestionStatus = (q: ExamQuestion) => {
    const ans = answers[q.examQuestionId];
    if (!ans) return 'NOT_VISITED';
    const hasSelection =
      ans.selectedOptionId ||
      (ans.selectedOptions && ans.selectedOptions.length > 0) ||
      (ans.numericalAnswer !== null && ans.numericalAnswer !== undefined);
    if (ans.isMarkedForReview && hasSelection) return 'ANS_MARKED';
    if (ans.isMarkedForReview) return 'MARKED';
    if (hasSelection) return 'ANSWERED';
    return 'NOT_ANSWERED';
  };

  const statusCounts = questions.reduce(
    (acc, q) => {
      const st = getQuestionStatus(q);
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // ── Answer Actions ────────────────────────────────────────────
  const persistAnswer = useCallback(
    async (payload: {
      examQuestionId: string;
      selectedOptionId?: string | null;
      selectedOptions?: string[] | null;
      numericalAnswer?: number | null;
      isMarkedForReview?: boolean;
    }) => {
      if (!attemptId) return;
      setSaveStatusText('saving');
      try {
        await saveAnswerAPI(attemptId, payload);
        setSaveStatusText('saved');
      } catch {
        setSaveStatusText('error');
      }
    },
    [attemptId, saveAnswerAPI],
  );

  const handleSaveAndNavigate = async (markForReview = false, nextIdx?: number) => {
    if (!attemptId || !currentQuestion) return;

    const numVal = numericalAnswer !== '' ? Number(numericalAnswer) : null;
    const isMarked = markForReview ? true : isMarkedForReview;

    const payload = {
      examQuestionId: currentQuestion.examQuestionId,
      selectedOptionId,
      selectedOptions: selectedOptions.length > 0 ? selectedOptions : null,
      numericalAnswer: numVal,
      isMarkedForReview: isMarked,
    };

    // Optimistic update
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.examQuestionId]: payload,
    }));

    await persistAnswer(payload);

    // Navigate
    const target = nextIdx !== undefined ? nextIdx : currentIdx + 1;
    if (target < questions.length && target >= 0) {
      setCurrentIdx(target);
    }
  };

  const handleClearResponse = async () => {
    if (!attemptId || !currentQuestion) return;
    setSelectedOptionId(null);
    setSelectedOptions([]);
    setNumericalAnswer('');
    setIsMarkedForReview(false);

    const payload = {
      examQuestionId: currentQuestion.examQuestionId,
      selectedOptionId: null,
      selectedOptions: null,
      numericalAnswer: null,
      isMarkedForReview: false,
    };

    setAnswers((prev) => {
      const nextMap = { ...prev };
      delete nextMap[currentQuestion.examQuestionId];
      return nextMap;
    });

    await persistAnswer(payload);
  };

  // Auto-save on input change (debounced)
  useEffect(() => {
    if (!currentQuestion) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      const hasAnyInput =
        selectedOptionId !== null || selectedOptions.length > 0 || numericalAnswer !== '';

      if (!hasAnyInput) return;

      const numVal = numericalAnswer !== '' ? Number(numericalAnswer) : null;
      const payload = {
        examQuestionId: currentQuestion.examQuestionId,
        selectedOptionId,
        selectedOptions: selectedOptions.length > 0 ? selectedOptions : null,
        numericalAnswer: numVal,
        isMarkedForReview,
      };

      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.examQuestionId]: payload,
      }));

      await persistAnswer(payload);
    }, 800);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOptionId, selectedOptions, numericalAnswer, isMarkedForReview]);

  const handleFinalSubmit = async () => {
    if (!attemptId) return;
    setShowSubmitModal(false);
    const res = await submitAttemptAPI(attemptId);
    if (res.data || res.isSuccess) {
      navigate(PRIVATE_NAVIGATION.examResult.replace(':attemptId', attemptId));
    }
  };

  const handleLanguageChanged = async () => {
    if (!attemptId) return;
    const qRes = await getAttemptQuestionsAPI(attemptId);
    if (qRes.data) setQuestions(qRes.data);
  };

  // ── Font Size classes ─────────────────────────────────────────
  const fontSizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
  }[fontSize];

  // ── Timer state ───────────────────────────────────────────────
  const isTimeCritical = timeLeft !== null && timeLeft < 300;
  const isTimeWarning = timeLeft !== null && timeLeft < 900 && timeLeft >= 300;

  // ── Loading / Error states ────────────────────────────────────
  if (isQuestionsLoading || isStatusLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <FileText size={28} className="text-white" />
          </div>
          <Loader label="Preparing Exam Workspace…" />
          <p className="text-sm text-slate-400">Loading your personalized exam…</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md w-full rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-2xl text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <AlertCircle className="text-rose-400" size={32} />
          </div>
          <h2 className="text-xl font-bold text-white">Exam Access Error</h2>
          <p className="mt-2 text-sm text-slate-400">{errorMessage}</p>
          <Button
            className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // ── Main Exam UI ──────────────────────────────────────────────
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[#0d0f1a] font-sans text-white">
      {/* ══ TOP HEADER ══════════════════════════════════════════════ */}
      <header className="relative z-20 flex h-[60px] shrink-0 items-center justify-between border-b border-white/5 bg-[#0d0f1a]/95 px-4 backdrop-blur-xl shadow-lg shadow-black/20 md:px-6">
        {/* Left: Brand + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
            <FileText size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate leading-tight">
              {examTitle || 'Exam Portal'}
            </h1>
            <p className="hidden sm:block text-[10px] text-slate-400 truncate">
              {user?.studentProfile?.examTarget ?? 'Competitive Exam'}
            </p>
          </div>
        </div>

        {/* Center: Timer + Language Switcher */}
        <div className="flex items-center gap-3">
          {/* Timer */}
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono font-bold text-base transition-all duration-300',
              isTimeCritical
                ? 'animate-pulse bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : isTimeWarning
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-white/5 text-indigo-400 border border-white/10',
            )}
          >
            <Clock
              size={16}
              className={isTimeCritical ? 'animate-spin' : ''}
              style={isTimeCritical ? { animationDuration: '2s' } : {}}
            />
            <span className="tabular-nums text-sm">{formatTimer(timeLeft)}</span>
          </div>

          {/* Language Switcher */}
          {attemptId && (
            <ExamLanguageSwitcher attemptId={attemptId} onLanguageChanged={handleLanguageChanged} />
          )}
        </div>

        {/* Right: Connection + User + Submit */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Connection indicator */}
          <div
            className={cn(
              'hidden sm:flex items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-semibold',
              isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400',
            )}
          >
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            <span className="hidden md:inline">{isOnline ? 'Connected' : 'Offline'}</span>
          </div>

          {/* Save Status */}
          <div className="hidden md:flex items-center gap-1.5 text-[10px] font-medium">
            {saveStatusText === 'saving' && (
              <span className="flex items-center gap-1 text-amber-400">
                <Loader2 size={10} className="animate-spin" /> Saving…
              </span>
            )}
            {saveStatusText === 'saved' && (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 size={10} /> Saved
              </span>
            )}
            {saveStatusText === 'error' && (
              <span className="flex items-center gap-1 text-rose-400">
                <AlertCircle size={10} /> Error
              </span>
            )}
          </div>

          {/* User info */}
          <div className="hidden sm:flex items-center gap-2 border-l border-white/10 pl-3 text-xs">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-[11px]">
              {user?.studentProfile?.name?.charAt(0)?.toUpperCase() ?? <User size={12} />}
            </div>
            <span className="hidden lg:block font-medium text-slate-300 text-[11px]">
              {user?.studentProfile?.name ?? 'Candidate'}
            </span>
          </div>

          {/* Submit Button */}
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-emerald-500/30 hover:scale-[1.02]"
          >
            <Send size={13} />
            <span className="hidden sm:inline">Submit</span>
          </button>
        </div>
      </header>

      {/* ══ SECTION TABS ════════════════════════════════════════════ */}
      <div className="relative z-10 flex h-10 shrink-0 items-center gap-1 border-b border-white/5 bg-[#0d0f1a]/80 px-4 backdrop-blur-sm overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSection('ALL')}
          className={cn(
            'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200',
            activeSection === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
          )}
        >
          All ({questions.length})
        </button>
        {sections.map((sec) => {
          const secCount = questions.filter((q) => (q.section?.name || 'General') === sec).length;
          return (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200',
                activeSection === sec
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200',
              )}
            >
              {sec} ({secCount})
            </button>
          );
        })}

        {/* Font controls */}
        <div className="ml-auto flex items-center gap-1 shrink-0">
          <button
            onClick={() => setFontSize('sm')}
            className={cn(
              'rounded-md p-1 transition-colors',
              fontSize === 'sm' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            <ZoomOut size={13} />
          </button>
          <button
            onClick={() => setFontSize('base')}
            className={cn(
              'rounded-md p-1 transition-colors',
              fontSize === 'base' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            <Eye size={13} />
          </button>
          <button
            onClick={() => setFontSize('lg')}
            className={cn(
              'rounded-md p-1 transition-colors',
              fontSize === 'lg' ? 'text-indigo-400' : 'text-slate-500 hover:text-slate-300',
            )}
          >
            <ZoomIn size={13} />
          </button>

          {/* Toggle palette on mobile */}
          <button
            onClick={() => setIsPaletteOpen((v) => !v)}
            className="ml-2 rounded-lg bg-white/5 px-2.5 py-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-all xl:hidden"
          >
            {isPaletteOpen ? <EyeOff size={13} /> : <Grid3X3 size={13} />}
          </button>
        </div>
      </div>

      {/* ══ MAIN BODY ═══════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        {/* ── Question Area ─────────────────────────────────────── */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-[#0d0f1a] p-4 md:p-6 xl:p-8">
          {currentQuestion && (
            <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5">
              {/* Question Card */}
              <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-b from-white/[0.04] to-transparent shadow-2xl shadow-black/40 backdrop-blur-sm">
                {/* Top color bar */}
                <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="p-5 md:p-6">
                  {/* Question meta */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                        Q{currentIdx + 1}
                        <span className="text-indigo-500/60">/</span>
                        <span className="text-indigo-300/60">{questions.length}</span>
                      </span>
                      <span className="rounded-lg bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-400 border border-white/8">
                        {currentQuestion.section?.name ?? 'General'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-400 border border-purple-500/20">
                        <QuestionTypeIcon code={currentQuestion.questionType?.code} />
                        {currentQuestion.questionType?.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-bold">
                      <span className="flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-emerald-400 border border-emerald-500/20">
                        +{currentQuestion.marks}
                      </span>
                      <span className="flex items-center gap-1 rounded-lg bg-rose-500/10 px-2.5 py-1 text-rose-400 border border-rose-500/20">
                        −{currentQuestion.negativeMarks}
                      </span>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div
                    className={cn('mt-5 leading-relaxed text-slate-100 font-medium', fontSizeClass)}
                  >
                    {currentQuestion.questionText}
                  </div>

                  {/* Options */}
                  <div className="mt-6 space-y-3">
                    {/* SCQ / TF / AR */}
                    {['SCQ', 'TF', 'AR'].includes(currentQuestion.questionType?.code) &&
                      currentQuestion.options.map((opt, optIdx) => {
                        const isSelected = selectedOptionId === opt.id;
                        const label = opt.optionLabel || String.fromCharCode(65 + optIdx);
                        return (
                          <label
                            key={opt.id}
                            onClick={() => setSelectedOptionId(opt.id)}
                            className={cn(
                              'group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all duration-200',
                              isSelected
                                ? 'border-indigo-500/60 bg-indigo-500/15 shadow-lg shadow-indigo-500/10'
                                : 'border-white/8 bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-500/5',
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-200',
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                  : 'border-white/20 text-slate-400 group-hover:border-indigo-400/40 group-hover:text-indigo-300',
                              )}
                            >
                              {isSelected ? <CheckCircle2 size={14} /> : label}
                            </div>
                            <span
                              className={cn(
                                'font-medium text-slate-200 leading-relaxed',
                                fontSizeClass === 'text-lg' ? 'text-base' : 'text-sm',
                              )}
                            >
                              {opt.optionText}
                            </span>
                          </label>
                        );
                      })}

                    {/* MCQ */}
                    {currentQuestion.questionType?.code === 'MCQ' &&
                      currentQuestion.options.map((opt, optIdx) => {
                        const isSelected = selectedOptions.includes(opt.id);
                        const label = opt.optionLabel || String.fromCharCode(65 + optIdx);
                        const toggle = () =>
                          setSelectedOptions((prev) =>
                            prev.includes(opt.id)
                              ? prev.filter((id) => id !== opt.id)
                              : [...prev, opt.id],
                          );
                        return (
                          <label
                            key={opt.id}
                            onClick={toggle}
                            className={cn(
                              'group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all duration-200',
                              isSelected
                                ? 'border-indigo-500/60 bg-indigo-500/15 shadow-lg shadow-indigo-500/10'
                                : 'border-white/8 bg-white/[0.02] hover:border-indigo-500/30 hover:bg-indigo-500/5',
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-200',
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-600 text-white'
                                  : 'border-white/20 text-slate-400 group-hover:border-indigo-400/40',
                              )}
                            >
                              {isSelected ? '✓' : label}
                            </div>
                            <span className="text-sm font-medium text-slate-200 leading-relaxed">
                              {opt.optionText}
                            </span>
                          </label>
                        );
                      })}

                    {/* NUM */}
                    {currentQuestion.questionType?.code === 'NUM' && (
                      <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-5">
                        <label className="block text-xs font-semibold text-slate-400 mb-3">
                          Enter your numerical answer:
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={numericalAnswer}
                          onChange={(e) => setNumericalAnswer(e.target.value)}
                          placeholder="e.g. 25.5"
                          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xl font-bold text-white placeholder-slate-600 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3.5 backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setIsMarkedForReview((prev) => !prev);
                      handleSaveAndNavigate(true);
                    }}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-200',
                      isMarkedForReview
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                        : 'border border-white/10 text-slate-400 hover:bg-white/5 hover:text-purple-300',
                    )}
                  >
                    <Flag size={14} className={isMarkedForReview ? 'fill-current' : ''} />
                    {isMarkedForReview ? 'Marked' : 'Mark for Review'}
                  </button>

                  <button
                    onClick={handleClearResponse}
                    className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-200"
                  >
                    <RotateCcw size={14} />
                    Clear
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => handleSaveAndNavigate(false, currentIdx - 1)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={14} />
                    Prev
                  </button>

                  <button
                    onClick={() => handleSaveAndNavigate(false)}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:shadow-indigo-500/30 hover:scale-[1.02]"
                  >
                    Save & Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Question Palette Sidebar ────────────────────────── */}
        <aside
          className={cn(
            'shrink-0 border-l border-white/5 bg-[#0a0c16] flex flex-col overflow-hidden transition-all duration-300',
            isPaletteOpen ? 'w-72' : 'w-0 overflow-hidden',
          )}
        >
          <div className="flex flex-col h-full overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Question Palette
              </h3>
              <button
                onClick={() => setIsPaletteOpen(false)}
                className="xl:hidden rounded-lg p-1 text-slate-500 hover:text-slate-300 hover:bg-white/5"
              >
                <X size={14} />
              </button>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { color: 'bg-emerald-500', label: 'Answered', key: 'ANSWERED' },
                { color: 'bg-rose-500', label: 'Not Ans', key: 'NOT_ANSWERED' },
                { color: 'bg-purple-600', label: 'Marked', key: 'MARKED' },
                { color: 'bg-indigo-600', label: 'Ans+Mark', key: 'ANS_MARKED' },
                { color: 'bg-slate-600', label: 'Visited', key: 'NOT_VISITED' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5"
                >
                  <span className={cn('h-2.5 w-2.5 rounded-full', item.color)} />
                  <span className="text-[10px] font-medium text-slate-400">
                    {item.label} ({statusCounts[item.key] || 0})
                  </span>
                </div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mb-4 rounded-xl bg-white/[0.03] border border-white/8 p-3">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-2">
                <span>Progress</span>
                <span className="text-indigo-400">
                  {statusCounts['ANSWERED'] || 0}/{questions.length} answered
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500"
                  style={{
                    width: `${((statusCounts['ANSWERED'] || 0) / Math.max(questions.length, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Question Number Grid */}
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Jump to Question
            </p>
            <div className="grid grid-cols-5 gap-2 flex-1 content-start">
              {filteredQuestions.map((q) => {
                const globalIdx = questions.findIndex((x) => x.examQuestionId === q.examQuestionId);
                const status = getQuestionStatus(q);
                const isCurrent = globalIdx === currentIdx;

                return (
                  <button
                    key={q.examQuestionId}
                    onClick={() => setCurrentIdx(globalIdx)}
                    className={getPaletteBadgeClass(status, isCurrent)}
                    title={`Question ${globalIdx + 1}: ${status.replace('_', ' ')}`}
                  >
                    {globalIdx + 1}
                  </button>
                );
              })}
            </div>

            {/* Submit CTA */}
            <div className="mt-4 pt-4 border-t border-white/5">
              <button
                onClick={() => setShowSubmitModal(true)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 hover:shadow-emerald-500/30"
              >
                <Send size={16} />
                Submit Exam
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ══ SUBMIT CONFIRMATION MODAL ════════════════════════════════ */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0d0f1a] shadow-2xl shadow-black/60 overflow-hidden">
            {/* Modal header gradient */}
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-purple-500" />

            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <ShieldAlert size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Confirm Submission</h3>
                    <p className="text-xs text-slate-400">This action cannot be undone</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-300 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: 'Answered',
                    value: statusCounts['ANSWERED'] || 0,
                    color: 'emerald',
                    bg: 'emerald-500/10',
                    border: 'emerald-500/20',
                    text: 'emerald-400',
                  },
                  {
                    label: 'Unanswered',
                    value: statusCounts['NOT_ANSWERED'] || 0,
                    color: 'rose',
                    bg: 'rose-500/10',
                    border: 'rose-500/20',
                    text: 'rose-400',
                  },
                  {
                    label: 'For Review',
                    value: (statusCounts['MARKED'] || 0) + (statusCounts['ANS_MARKED'] || 0),
                    color: 'purple',
                    bg: 'purple-500/10',
                    border: 'purple-500/20',
                    text: 'purple-400',
                  },
                  {
                    label: 'Not Visited',
                    value: statusCounts['NOT_VISITED'] || 0,
                    color: 'slate',
                    bg: 'white/5',
                    border: 'white/10',
                    text: 'slate-400',
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={cn(
                      'rounded-xl border p-4 text-center',
                      `bg-${stat.bg}`,
                      `border-${stat.border}`,
                    )}
                  >
                    <span className={cn('block text-2xl font-extrabold', `text-${stat.text}`)}>
                      {stat.value}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium mt-1 block">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Warning message */}
              {(statusCounts['NOT_ANSWERED'] || 0) > 0 && (
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                  <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/80">
                    You have{' '}
                    <span className="font-bold text-amber-300">
                      {statusCounts['NOT_ANSWERED'] || 0}
                    </span>{' '}
                    unanswered questions. Are you sure you want to submit?
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-all"
                >
                  Continue Exam
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-200 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Submitting…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={15} /> Final Submit
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

export default ExamInterfacePage;
