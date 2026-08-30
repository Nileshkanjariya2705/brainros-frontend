// ** Packages **
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  ShieldAlert,
  X,
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
  Maximize,
  Minimize,
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
import { QuestionPalette, type QuestionStatusType } from '../components/QuestionPalette';

// ** Utils & Types **
import type { ExamQuestion, AttemptAnswer } from '@/types/exam.types';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import {
  saveLocalAttemptState,
  getLocalAttemptState,
  enqueueSyncEvent,
  getPendingSyncQueue,
  removeSyncEvents,
  type SyncQueueEvent,
} from '@/utils/examStorage';

// ─── Question Type Helper ──────────────────────────────────────
const getNormalizedQuestionType = (
  q?: ExamQuestion,
): 'SCQ' | 'MCQ' | 'NUM' | 'TF' | 'AR' | 'MTF' => {
  if (!q) return 'SCQ';
  const code = (q.questionType?.code || (q as any).type || '').toUpperCase();
  if (code === 'NUM' || code === 'NUMERICAL') return 'NUM';
  if (code === 'MCQ' || code === 'MULTIPLE_CORRECT') return 'MCQ';
  if (code === 'TF' || code === 'TRUE_FALSE') return 'TF';
  if (code === 'AR' || code === 'ASSERTION_REASON') return 'AR';
  if (code === 'MTF' || code === 'MATCH_FOLLOWING') return 'MTF';
  if (code === 'SCQ' || code === 'SINGLE_CORRECT' || code === 'CASE_BASED' || code === 'CASE')
    return 'SCQ';

  if (q.options && q.options.length > 0) return 'SCQ';
  return 'NUM';
};

// ─── Question Type Icon ────────────────────────────────────────
const QuestionTypeIcon = ({ code }: { code?: string }) => {
  const c = (code || '').toUpperCase();
  if (c === 'MCQ' || c === 'MULTIPLE_CORRECT') {
    return <Grid3X3 size={14} />;
  }
  if (c === 'NUM' || c === 'NUMERICAL') {
    return <Hash size={14} />;
  }
  if (c === 'TF' || c === 'TRUE_FALSE') {
    return <ToggleLeft size={14} />;
  }
  return <Circle size={14} />;
};

// ─── Timer Formatter ───────────────────────────────────────────
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
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>('ALL');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [serverEndTime, setServerEndTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [examId, setExamId] = useState<string>('');
  const [currentLanguageId, setCurrentLanguageId] = useState<string>('');

  // Active answer editing state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [numericalAnswer, setNumericalAnswer] = useState<string>('');
  const [isMarkedForReview, setIsMarkedForReview] = useState<boolean>(false);

  // UI & Network state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'syncing'>(
    'idle',
  );
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  const debounceSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sequenceCounterRef = useRef<number>(1);
  const isInitialLoadDoneRef = useRef(false);

  // ─── Network Interruption Recovery Listeners ──────────────────
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (attemptId) {
        syncPendingQueue(attemptId);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [attemptId]);

  // ─── Fullscreen Change Listener ───────────────────────────────
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // ─── Replay Offline Sync Queue ────────────────────────────────
  const syncPendingQueue = useCallback(
    async (attId: string) => {
      const queue = await getPendingSyncQueue(attId);
      if (queue.length === 0) return;

      setSaveStatus('syncing');
      const syncedEventIds: string[] = [];

      for (const event of queue) {
        try {
          await saveAnswerAPI(attId, event.payload);
          syncedEventIds.push(event.eventId);
        } catch {
          // Break if still failing so order is preserved
          break;
        }
      }

      if (syncedEventIds.length > 0) {
        await removeSyncEvents(attId, syncedEventIds);
      }
      setSaveStatus('saved');
    },
    [saveAnswerAPI],
  );

  // ─── Load Initial Questions & Attempt Status ──────────────────
  const loadExamData = useCallback(
    async (_forceLanguageId?: string) => {
      if (!attemptId) return;

      try {
        // 1. Fetch questions
        const qRes = await getAttemptQuestionsAPI(attemptId);
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
        const sData: any = sRes.data?.answers
          ? sRes.data
          : (sRes.data as any)?.data || sRes.response?.data?.data;

        if (sData) {
          if (sData.examId) setExamId(sData.examId);
          if (sData.languageId) setCurrentLanguageId(sData.languageId);
          if (sData.serverEndTime) setServerEndTime(sData.serverEndTime);

          // Server-authoritative timer sync
          if (sData.serverEndTime) {
            const endMs = new Date(sData.serverEndTime).getTime();
            const remainingSecs = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
            setTimeLeft(remainingSecs);
          }

          // Build server answer map
          const serverAnsMap: Record<string, AttemptAnswer> = {};
          (sData.answers || []).forEach((ans: any) => {
            serverAnsMap[ans.examQuestionId] = ans;
          });

          // Check local cached state (for offline recovery)
          const localCache = await getLocalAttemptState(attemptId);
          const mergedAnswers: Record<string, AttemptAnswer> = {
            ...serverAnsMap,
            ...(localCache?.answers || {}),
          };

          setAnswers(mergedAnswers);

          // Set visited questions
          const visited = new Set<string>(localCache?.visitedQuestions || []);
          if (qData[0]?.examQuestionId) {
            visited.add(qData[0].examQuestionId);
          }
          setVisitedQuestions(visited);

          // Process pending sync queue if any
          await syncPendingQueue(attemptId);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Failed to initialize exam session');
      } finally {
        isInitialLoadDoneRef.current = true;
      }
    },
    [attemptId, getAttemptQuestionsAPI, getAttemptStatusAPI, syncPendingQueue],
  );

  useEffect(() => {
    loadExamData();
  }, [loadExamData]);

  // ─── Save Answer to Local Storage and Backend ──────────────────
  const persistAnswer = useCallback(
    async (payload: {
      examQuestionId: string;
      selectedOptionId?: string | null;
      selectedOptions?: string[] | null;
      numericalAnswer?: number | null;
      isMarkedForReview?: boolean;
    }) => {
      if (!attemptId) return;

      // 1. Optimistically update local memory state
      setAnswers((prev) => ({
        ...prev,
        [payload.examQuestionId]: payload,
      }));

      // 2. Persist to local IndexedDB/localStorage immediately
      saveLocalAttemptState(attemptId, {
        answers: {
          ...answers,
          [payload.examQuestionId]: payload,
        },
        visitedQuestions: Array.from(visitedQuestions),
        currentQuestionId: payload.examQuestionId,
        sequence: sequenceCounterRef.current++,
      }).catch(() => {});

      // 3. If offline, enqueue sync event
      if (!navigator.onLine) {
        const syncEvent: SyncQueueEvent = {
          eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          attemptId,
          sequence: sequenceCounterRef.current++,
          action: 'ANSWER_CHANGED',
          payload,
          clientTimestamp: new Date().toISOString(),
          retryCount: 0,
        };
        await enqueueSyncEvent(syncEvent);
        setSaveStatus('saved');
        return;
      }

      // 4. Send to backend
      setSaveStatus('saving');
      try {
        await saveAnswerAPI(attemptId, payload);
        setSaveStatus('saved');
      } catch {
        // On network failure, enqueue for automatic background recovery
        const syncEvent: SyncQueueEvent = {
          eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          attemptId,
          sequence: sequenceCounterRef.current++,
          action: 'ANSWER_CHANGED',
          payload,
          clientTimestamp: new Date().toISOString(),
          retryCount: 0,
        };
        await enqueueSyncEvent(syncEvent);
        setSaveStatus('saved');
      }
    },
    [attemptId, answers, visitedQuestions, saveAnswerAPI],
  );

  // ─── Authoritative Countdown Timer & Background Tab Sync ──────
  const handleAutoSubmit = useCallback(async () => {
    if (!attemptId) return;
    setSaveStatus('saving');
    try {
      // Flush currently selected answer before submitting
      const currentQ = questions[currentIdx];
      if (currentQ) {
        const numVal =
          numericalAnswer !== '' && !isNaN(Number(numericalAnswer))
            ? Number(numericalAnswer)
            : null;
        await persistAnswer({
          examQuestionId: currentQ.examQuestionId,
          selectedOptionId,
          selectedOptions: selectedOptions.length > 0 ? selectedOptions : null,
          numericalAnswer: numVal,
          isMarkedForReview,
        });
      }
      await submitAttemptAPI(attemptId);
    } catch {
      // Non-blocking
    } finally {
      setShowSubmitModal(false);
      navigate(PRIVATE_NAVIGATION.examResult.replace(':attemptId', attemptId));
    }
  }, [
    attemptId,
    navigate,
    submitAttemptAPI,
    questions,
    currentIdx,
    numericalAnswer,
    selectedOptionId,
    selectedOptions,
    isMarkedForReview,
    persistAnswer,
  ]);

  useEffect(() => {
    if (!serverEndTime) return;

    // Recalculate remaining time relative to authoritative server end time
    const updateCountdown = () => {
      const endMs = new Date(serverEndTime).getTime();
      const remainingSecs = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
      setTimeLeft(remainingSecs);

      if (remainingSecs <= 0) {
        handleAutoSubmit();
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    // Resynchronize when tab is reopened or device awakens
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateCountdown();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', updateCountdown);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', updateCountdown);
    };
  }, [serverEndTime, handleAutoSubmit]);

  // ─── Current Question Change & Timing Log ─────────────────────
  useEffect(() => {
    if (questions.length === 0) return;
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    // Record question as visited
    setVisitedQuestions((prev) => {
      const next = new Set(prev);
      next.add(currentQ.examQuestionId);
      return next;
    });

    // Start server-authoritative question timing
    if (attemptId && currentQ.examQuestionId) {
      startQuestionTimingAPI(attemptId, currentQ.examQuestionId, {
        clientTimestamp: new Date().toISOString(),
      }).catch(() => {});
    }

    // Populate active inputs from answer store
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

  // ─── Debounced Auto-Save on User Input Changes ────────────────
  const triggerDebouncedAutoSave = useCallback(
    (newOptId: string | null, newOpts: string[], newNum: string, newMark: boolean) => {
      const currentQ = questions[currentIdx];
      if (!currentQ || !isInitialLoadDoneRef.current) return;

      if (debounceSaveTimerRef.current) {
        clearTimeout(debounceSaveTimerRef.current);
      }

      debounceSaveTimerRef.current = setTimeout(() => {
        const numVal = newNum !== '' && !isNaN(Number(newNum)) ? Number(newNum) : null;
        persistAnswer({
          examQuestionId: currentQ.examQuestionId,
          selectedOptionId: newOptId,
          selectedOptions: newOpts.length > 0 ? newOpts : null,
          numericalAnswer: numVal,
          isMarkedForReview: newMark,
        });
      }, 600);
    },
    [questions, currentIdx, persistAnswer],
  );

  // ─── Option Click Handlers ────────────────────────────────────
  const handleSelectSingleOption = (optId: string) => {
    setSelectedOptionId(optId);
    triggerDebouncedAutoSave(optId, selectedOptions, numericalAnswer, isMarkedForReview);
  };

  const handleToggleMultipleOption = (optId: string) => {
    const updated = selectedOptions.includes(optId)
      ? selectedOptions.filter((id) => id !== optId)
      : [...selectedOptions, optId];
    setSelectedOptions(updated);
    triggerDebouncedAutoSave(selectedOptionId, updated, numericalAnswer, isMarkedForReview);
  };

  const handleNumericalChange = (value: string) => {
    setNumericalAnswer(value);
    triggerDebouncedAutoSave(selectedOptionId, selectedOptions, value, isMarkedForReview);
  };

  // ─── Toolbar Actions ──────────────────────────────────────────
  const handleSaveAndNext = async () => {
    if (debounceSaveTimerRef.current) {
      clearTimeout(debounceSaveTimerRef.current);
    }
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    const numVal =
      numericalAnswer !== '' && !isNaN(Number(numericalAnswer)) ? Number(numericalAnswer) : null;
    await persistAnswer({
      examQuestionId: currentQ.examQuestionId,
      selectedOptionId,
      selectedOptions: selectedOptions.length > 0 ? selectedOptions : null,
      numericalAnswer: numVal,
      isMarkedForReview,
    });

    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleToggleMarkForReview = async () => {
    const nextMark = !isMarkedForReview;
    setIsMarkedForReview(nextMark);

    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    const numVal =
      numericalAnswer !== '' && !isNaN(Number(numericalAnswer)) ? Number(numericalAnswer) : null;
    await persistAnswer({
      examQuestionId: currentQ.examQuestionId,
      selectedOptionId,
      selectedOptions: selectedOptions.length > 0 ? selectedOptions : null,
      numericalAnswer: numVal,
      isMarkedForReview: nextMark,
    });
  };

  const handleClearResponse = async () => {
    setSelectedOptionId(null);
    setSelectedOptions([]);
    setNumericalAnswer('');

    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    await persistAnswer({
      examQuestionId: currentQ.examQuestionId,
      selectedOptionId: null,
      selectedOptions: null,
      numericalAnswer: null,
      isMarkedForReview, // Keep mark for review intact per requirements
    });
  };

  // ─── In-Flight Language Switch Handler ────────────────────────
  const handleLanguageChanged = async (newLangId: string) => {
    setCurrentLanguageId(newLangId);
    // Instantly renders translation from in-memory dictionary.
    // Asynchronously persists chosen language to attempt on server.
    if (attemptId) {
      try {
        await saveAnswerAPI(attemptId, {
          examQuestionId: questions[currentIdx]?.examQuestionId || '',
          selectedOptionId,
          selectedOptions: selectedOptions.length > 0 ? selectedOptions : null,
          numericalAnswer:
            numericalAnswer !== '' && !isNaN(Number(numericalAnswer))
              ? Number(numericalAnswer)
              : null,
          isMarkedForReview,
        });
      } catch {
        // ignore
      }
    }
  };

  // ─── Derived Question Status Helper ───────────────────────────
  const getQuestionStatus = useCallback(
    (q: ExamQuestion): QuestionStatusType => {
      const isVisited = visitedQuestions.has(q.examQuestionId);
      const ans = answers[q.examQuestionId];

      const hasAnswer =
        !!ans &&
        (!!ans.selectedOptionId ||
          (Array.isArray(ans.selectedOptions) && ans.selectedOptions.length > 0) ||
          (ans.numericalAnswer !== null &&
            ans.numericalAnswer !== undefined &&
            !isNaN(Number(ans.numericalAnswer))));

      const isMarked = !!ans?.isMarkedForReview;

      if (hasAnswer && isMarked) return 'ANS_MARKED';
      if (isMarked) return 'MARKED';
      if (hasAnswer) return 'ANSWERED';
      if (isVisited) return 'NOT_ANSWERED';
      return 'NOT_VISITED';
    },
    [answers, visitedQuestions],
  );

  // ─── Sections ────────────────────────────────────────────────
  const sections = Array.from(new Set(questions.map((q) => q.section?.name || 'General'))).filter(
    Boolean,
  );

  const currentQuestion = questions[currentIdx];
  const fontSizeClass = fontSize === 'sm' ? 'text-sm' : fontSize === 'lg' ? 'text-lg' : 'text-base';

  // Multilingual active translation derivation
  const activeQTrans = currentLanguageId
    ? currentQuestion?.translations?.[currentLanguageId] ||
      currentQuestion?.translations?.[currentLanguageId.toLowerCase()]
    : null;
  const displayQuestionText =
    activeQTrans?.questionText ||
    currentQuestion?.questionText ||
    (currentQuestion as any)?.text ||
    'Question text';
  const displayPassage = activeQTrans?.passageText || (currentQuestion as any)?.passage || null;
  const displayAssertion =
    activeQTrans?.assertionText || (currentQuestion as any)?.assertion || null;
  const displayReason = activeQTrans?.reasonText || (currentQuestion as any)?.reason || null;

  // ─── Loading & Error Screens ──────────────────────────────────
  if ((isStatusLoading || isQuestionsLoading) && questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 text-slate-900">
        <Loader />
        <p className="mt-4 text-xs font-semibold text-slate-500 animate-pulse">
          Initializing Secure Examination Environment…
        </p>
      </div>
    );
  }

  if (errorMessage && questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4 text-slate-900">
        <div className="flex max-w-md flex-col items-center rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center shadow-xl backdrop-blur-md">
          <ShieldAlert size={40} className="text-rose-400 mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Unable to Load Examination</h2>
          <p className="mt-2 text-xs text-rose-200">{errorMessage}</p>
          <Button className="mt-5" variant="outline" onClick={() => loadExamData()}>
            Retry Session
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-50 text-slate-900 select-none font-sans">
      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md">
        {/* Left: Brand & Exam Info */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 font-black text-slate-900 text-xs shadow-md shadow-indigo-500/20">
            BR
          </div>
          <div>
            <span className="hidden sm:inline-block text-xs font-black tracking-wide text-slate-900 uppercase">
              Brainros Exam Engine
            </span>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
              <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-indigo-300 font-semibold">
                {currentQuestion?.section?.name ?? 'General Section'}
              </span>
              <span>•</span>
              <span>
                Q{currentIdx + 1} of {questions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-black/40 px-3.5 py-1.5 shadow-inner">
          <Clock
            size={15}
            className={cn(
              'transition-colors',
              timeLeft !== null && timeLeft < 300
                ? 'animate-pulse text-rose-400'
                : 'text-indigo-400',
            )}
          />
          <div className="flex flex-col">
            <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold leading-none">
              Time Left
            </span>
            <span
              className={cn(
                'font-mono text-sm sm:text-base font-black tracking-tight leading-tight',
                timeLeft !== null && timeLeft < 300 ? 'text-rose-400' : 'text-slate-900',
              )}
            >
              {formatTimer(timeLeft)}
            </span>
          </div>
        </div>

        {/* Right: Language, Network, Fullscreen, User, Submit */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher (In-flight multilingual engine) */}
          {attemptId && (
            <ExamLanguageSwitcher
              examId={examId}
              attemptId={attemptId}
              currentLanguageId={currentLanguageId}
              onLanguageChanged={handleLanguageChanged}
            />
          )}

          {/* Network & Autosave State Indicator */}
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-semibold transition-all border',
              !isOnline
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                : saveStatus === 'saving' || saveStatus === 'syncing'
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            )}
            title={
              !isOnline
                ? 'Offline mode: answers safely saved locally and will auto-sync on reconnect'
                : 'Connected to exam server'
            }
          >
            {!isOnline ? (
              <>
                <WifiOff size={13} />
                <span className="hidden md:inline">Offline</span>
              </>
            ) : saveStatus === 'saving' || saveStatus === 'syncing' ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span className="hidden md:inline">Syncing…</span>
              </>
            ) : (
              <>
                <Wifi size={13} />
                <span className="hidden md:inline">Online</span>
              </>
            )}
          </div>

          {/* Full-screen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-black/5 text-slate-600 hover:bg-black/10 hover:text-slate-900 transition-all"
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>

          {/* User badge */}
          <div className="hidden lg:flex items-center gap-2 border-l border-slate-200 pl-3 text-xs">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-[11px]">
              {user?.studentProfile?.name?.charAt(0)?.toUpperCase() ?? <User size={12} />}
            </div>
            <span className="font-medium text-slate-600 text-[11px] max-w-[100px] truncate">
              {user?.studentProfile?.name ?? 'Candidate'}
            </span>
          </div>

          {/* Final Submit Button */}
          <button
            type="button"
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-slate-900 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Send size={13} />
            <span>Submit</span>
          </button>
        </div>
      </header>

      {/* ══ SECTION TABS BAR ═════════════════════════════════════════ */}
      <div className="relative z-10 flex h-10 shrink-0 items-center justify-between border-b border-white/5 bg-white/80 px-4 backdrop-blur-sm">
        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pr-2">
          <button
            type="button"
            onClick={() => setActiveSection('ALL')}
            className={cn(
              'shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition-all',
              activeSection === 'ALL'
                ? 'bg-indigo-600 text-slate-900 shadow-sm shadow-indigo-500/30'
                : 'text-slate-500 hover:bg-black/5 hover:text-slate-800',
            )}
          >
            All ({questions.length})
          </button>
          {sections.map((sec) => {
            const secCount = questions.filter((q) => (q.section?.name || 'General') === sec).length;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => setActiveSection(sec)}
                className={cn(
                  'shrink-0 rounded-lg px-3 py-1 text-xs font-semibold transition-all',
                  activeSection === sec
                    ? 'bg-indigo-600 text-slate-900 shadow-sm shadow-indigo-500/30'
                    : 'text-slate-500 hover:bg-black/5 hover:text-slate-800',
                )}
              >
                {sec} ({secCount})
              </button>
            );
          })}
        </div>

        {/* Font Controls & Palette Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setFontSize('sm')}
            title="Small Font"
            className={cn(
              'rounded-md p-1 transition-colors',
              fontSize === 'sm'
                ? 'text-indigo-400 bg-black/5'
                : 'text-slate-500 hover:text-slate-600',
            )}
          >
            <ZoomOut size={13} />
          </button>
          <button
            type="button"
            onClick={() => setFontSize('base')}
            title="Default Font"
            className={cn(
              'rounded-md p-1 transition-colors',
              fontSize === 'base'
                ? 'text-indigo-400 bg-black/5'
                : 'text-slate-500 hover:text-slate-600',
            )}
          >
            <Eye size={13} />
          </button>
          <button
            type="button"
            onClick={() => setFontSize('lg')}
            title="Large Font"
            className={cn(
              'rounded-md p-1 transition-colors',
              fontSize === 'lg'
                ? 'text-indigo-400 bg-black/5'
                : 'text-slate-500 hover:text-slate-600',
            )}
          >
            <ZoomIn size={13} />
          </button>

          {/* Mobile/Tablet Palette toggle button */}
          <button
            type="button"
            onClick={() => setIsPaletteOpen((v) => !v)}
            title="Toggle Question Palette"
            className="ml-2 flex items-center gap-1 rounded-lg bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-black/10 transition-all lg:hidden"
          >
            {isPaletteOpen ? <EyeOff size={13} /> : <Grid3X3 size={13} />}
            <span>Palette</span>
          </button>
        </div>
      </div>

      {/* ══ MAIN BODY: QUESTION AREA + QUESTION PALETTE (BOTH VISIBLE) ══════════════ */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* ── Center Question Area ─────────────────────────────── */}
        <main className="flex flex-1 min-w-0 flex-col overflow-y-auto bg-white p-4 md:p-6">
          {currentQuestion && (
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-between gap-4 md:gap-5">
              {/* Question Card (Sharp & High Contrast, No Blur) */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-2xl shadow-black/50">
                <div className="h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

                <div className="p-5 md:p-6">
                  {/* Question Header Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-500/15 px-3 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                        Q{currentIdx + 1}
                        <span className="text-indigo-500/60">/</span>
                        <span className="text-indigo-300/60">{questions.length}</span>
                      </span>
                      <span className="rounded-lg bg-black/5 px-2.5 py-1 text-[11px] font-medium text-slate-500 border border-slate-200">
                        {currentQuestion.section?.name ?? 'General'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/10 px-2.5 py-1 text-[11px] font-semibold text-purple-400 border border-purple-500/20">
                        <QuestionTypeIcon
                          code={currentQuestion.questionType?.code || (currentQuestion as any).type}
                        />
                        {currentQuestion.questionType?.name ||
                          (currentQuestion as any).type ||
                          'Multiple Choice'}
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

                  {/* Optional Passage / Comprehension Context */}
                  {displayPassage && (
                    <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm leading-relaxed text-slate-600">
                      <div className="font-semibold text-indigo-400 text-xs mb-1.5 uppercase tracking-wide">
                        Passage / Context:
                      </div>
                      {displayPassage}
                    </div>
                  )}

                  {/* Optional Assertion & Reason */}
                  {displayAssertion && (
                    <div className="mt-4 space-y-2 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 text-sm text-slate-600">
                      <div>
                        <span className="font-bold text-purple-400 mr-2">Assertion (A):</span>
                        {displayAssertion}
                      </div>
                      {displayReason && (
                        <div className="mt-2 pt-2 border-t border-purple-500/10">
                          <span className="font-bold text-purple-400 mr-2">Reason (R):</span>
                          {displayReason}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Question Text (Multilingual) */}
                  <div
                    className={cn('mt-5 leading-relaxed text-slate-900 font-medium', fontSizeClass)}
                  >
                    {displayQuestionText}
                  </div>

                  {/* ── Options / Inputs (Multilingual) ───────────── */}
                  <div className="mt-6 space-y-3">
                    {getNormalizedQuestionType(currentQuestion) === 'NUM' ? (
                      /* NUMERICAL */
                      <div className="mt-4 rounded-xl border border-slate-200 bg-white/[0.03] p-5">
                        <label className="block text-xs font-semibold text-slate-500 mb-3">
                          Enter your numerical answer:
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={numericalAnswer}
                          onChange={(e) => handleNumericalChange(e.target.value)}
                          placeholder="e.g. 25.5"
                          className="w-full rounded-xl border border-slate-200 bg-black/5 px-4 py-3 text-xl font-bold text-slate-900 placeholder-slate-600 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                      </div>
                    ) : getNormalizedQuestionType(currentQuestion) === 'MCQ' ? (
                      /* MULTIPLE CORRECT (MCQ) */
                      (currentQuestion.options || []).map((opt, optIdx) => {
                        const isSelected = selectedOptions.includes(opt.id);
                        const label =
                          opt.optionLabel ||
                          (opt as any).optionKey ||
                          String.fromCharCode(65 + optIdx);

                        const activeOptTrans = currentLanguageId
                          ? opt.translations?.[currentLanguageId] ||
                            opt.translations?.[currentLanguageId.toLowerCase()]
                          : null;
                        const optionText =
                          activeOptTrans?.optionText ||
                          opt.optionText ||
                          opt.optionLabel ||
                          (opt as any).optionKey ||
                          `Option ${label}`;

                        return (
                          <label
                            key={opt.id || optIdx}
                            onClick={() => handleToggleMultipleOption(opt.id)}
                            className={cn(
                              'group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all duration-200',
                              isSelected
                                ? 'border-indigo-500/60 bg-indigo-500/15 shadow-lg shadow-indigo-500/10'
                                : 'border-slate-200 bg-black/[0.02] hover:border-indigo-500/30 hover:bg-indigo-500/5',
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-all duration-200',
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-600 text-slate-900 shadow-lg shadow-indigo-500/30'
                                  : 'border-white/20 text-slate-500 group-hover:border-indigo-400/40',
                              )}
                            >
                              {isSelected ? '✓' : label}
                            </div>
                            <span className="text-sm font-medium text-slate-800 leading-relaxed">
                              {optionText}
                            </span>
                          </label>
                        );
                      })
                    ) : (
                      /* SINGLE CORRECT (SCQ, TF, AR, MTF, etc.) */
                      (currentQuestion.options || []).map((opt, optIdx) => {
                        const isSelected = selectedOptionId === opt.id;
                        const label =
                          opt.optionLabel ||
                          (opt as any).optionKey ||
                          String.fromCharCode(65 + optIdx);

                        const activeOptTrans = currentLanguageId
                          ? opt.translations?.[currentLanguageId] ||
                            opt.translations?.[currentLanguageId.toLowerCase()]
                          : null;
                        const optionText =
                          activeOptTrans?.optionText ||
                          opt.optionText ||
                          opt.optionLabel ||
                          (opt as any).optionKey ||
                          `Option ${label}`;

                        return (
                          <label
                            key={opt.id || optIdx}
                            onClick={() => handleSelectSingleOption(opt.id)}
                            className={cn(
                              'group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all duration-200',
                              isSelected
                                ? 'border-indigo-500/60 bg-indigo-500/15 shadow-lg shadow-indigo-500/10'
                                : 'border-slate-200 bg-black/[0.02] hover:border-indigo-500/30 hover:bg-indigo-500/5',
                            )}
                          >
                            <div
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-200',
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-600 text-slate-900 shadow-lg shadow-indigo-500/30'
                                  : 'border-white/20 text-slate-500 group-hover:border-indigo-400/40 group-hover:text-indigo-300',
                              )}
                            >
                              {isSelected ? <CheckCircle2 size={14} /> : label}
                            </div>
                            <span
                              className={cn(
                                'font-medium text-slate-800 leading-relaxed',
                                fontSizeClass === 'text-lg' ? 'text-base' : 'text-sm',
                              )}
                            >
                              {optionText}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* ── Action Toolbar (Solid & Sharp, No Blur) ──────────────────────────────── */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-100 p-3.5 shadow-md">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Mark for Review */}
                  <button
                    type="button"
                    onClick={handleToggleMarkForReview}
                    className={cn(
                      'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all duration-200',
                      isMarkedForReview
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                        : 'border border-slate-200 bg-black/5 text-slate-600 hover:bg-black/10 hover:text-slate-900',
                    )}
                  >
                    <Flag
                      size={14}
                      className={cn(
                        'transition-transform',
                        isMarkedForReview ? 'fill-purple-400 text-purple-400' : 'text-slate-500',
                      )}
                    />
                    <span>{isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}</span>
                  </button>

                  {/* Clear Response */}
                  <button
                    type="button"
                    onClick={handleClearResponse}
                    disabled={
                      !selectedOptionId && selectedOptions.length === 0 && numericalAnswer === ''
                    }
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-black/5 px-3 py-2 text-xs font-medium text-slate-500 hover:bg-black/10 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  >
                    <RotateCcw size={13} />
                    <span>Clear Response</span>
                  </button>
                </div>

                {/* Navigation: Previous / Next / Save & Next */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevious}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-black/5 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-black/10 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  >
                    <ChevronLeft size={15} />
                    <span>Previous</span>
                  </button>

                  {currentIdx < questions.length - 1 && (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="hidden sm:flex items-center gap-1 rounded-xl border border-slate-200 bg-black/5 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-black/10 hover:text-slate-900 transition-all"
                    >
                      <span>Next</span>
                      <ChevronRight size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleSaveAndNext}
                    className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-slate-900 shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02]"
                  >
                    <span>Save & Next</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── Question Palette Sidebar (Permanently Visible Side-by-Side, No Blur) ─ */}
        <aside
          className={cn(
            'h-full shrink-0 border-l border-slate-200 bg-white transition-all duration-200',
            isPaletteOpen ? 'flex' : 'hidden md:flex',
          )}
        >
          <QuestionPalette
            questions={questions}
            currentIdx={currentIdx}
            activeSection={activeSection}
            sections={sections}
            getQuestionStatus={getQuestionStatus}
            onSelectQuestion={(idx) => setCurrentIdx(idx)}
            onSelectSection={(sec) => setActiveSection(sec)}
          />
        </aside>
      </div>

      {/* ══ SUBMIT CONFIRMATION MODAL ════════════════════════════════ */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
                  <Send size={16} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Submit Examination</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-black/10 hover:text-slate-900"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary Statistics */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-black/5 p-3 border border-white/5">
                <span className="text-slate-500 block text-[11px]">Total Questions</span>
                <span className="text-lg font-bold text-slate-900">{questions.length}</span>
              </div>
              <div className="rounded-xl bg-emerald-500/10 p-3 border border-emerald-500/20">
                <span className="text-emerald-400 block text-[11px]">Answered</span>
                <span className="text-lg font-bold text-emerald-300">
                  {
                    questions.filter((q) => {
                      const st = getQuestionStatus(q);
                      return st === 'ANSWERED' || st === 'ANS_MARKED';
                    }).length
                  }
                </span>
              </div>
              <div className="rounded-xl bg-rose-500/10 p-3 border border-rose-500/20">
                <span className="text-rose-400 block text-[11px]">Unanswered</span>
                <span className="text-lg font-bold text-rose-300">
                  {questions.filter((q) => getQuestionStatus(q) === 'NOT_ANSWERED').length}
                </span>
              </div>
              <div className="rounded-xl bg-purple-500/10 p-3 border border-purple-500/20">
                <span className="text-purple-400 block text-[11px]">Marked for Review</span>
                <span className="text-lg font-bold text-purple-300">
                  {
                    questions.filter((q) => {
                      const st = getQuestionStatus(q);
                      return st === 'MARKED' || st === 'ANS_MARKED';
                    }).length
                  }
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500 leading-relaxed">
              Are you sure you want to end this examination? Once submitted, your answers will be
              finalized and evaluated immediately.
            </p>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-200 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
              >
                Return to Exam
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-slate-900"
                onClick={handleAutoSubmit}
                isLoading={isSubmitting}
              >
                Yes, Submit Now
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamInterfacePage;
