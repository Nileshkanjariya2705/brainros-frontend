// ** Packages **
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useBlocker } from 'react-router-dom';
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
  Maximize,
  Minimize,
  GraduationCap,
  LogOut,
} from 'lucide-react';
import cn from 'classnames';
import { API_URL } from '@config';
import { toast } from '@/utils/toast';

// ** Services & Hooks **
import {
  useGetAttemptStatusAPI,
  useGetAttemptQuestionsAPI,
  useSaveAnswerAPI,
  useSubmitAttemptAPI,
  useStartQuestionTimingAPI,
} from '../services';
import { useExamSecurity } from '../hooks/useExamSecurity';
import { ExamSecurityWarningModal } from '../components/ExamSecurityWarningModal';
import { ExamLeaveWarningModal } from '../components/ExamLeaveWarningModal';
import { ExamSessionConflictModal } from '../components/ExamSessionConflictModal';
import type { SecurityProfile } from '../services/security.service';
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

// ─── Isolated Timer Badge (Prevents 1-Second Full Exam Page Rerenders) ─
interface ExamTimerBadgeProps {
  serverEndTime: string | null;
  onTimeUp: () => void;
  onTick?: (remainingSecs: number) => void;
}

const ExamTimerBadge: React.FC<ExamTimerBadgeProps> = React.memo(
  ({ serverEndTime, onTimeUp, onTick }) => {
    const [remainingSecs, setRemainingSecs] = useState<number | null>(() => {
      if (!serverEndTime) return null;
      return Math.max(0, Math.floor((new Date(serverEndTime).getTime() - Date.now()) / 1000));
    });

    useEffect(() => {
      if (!serverEndTime) return;

      const updateCountdown = () => {
        const endMs = new Date(serverEndTime).getTime();
        const secs = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
        setRemainingSecs(secs);
        if (onTick) {
          onTick(secs);
        }
        if (secs <= 0) {
          onTimeUp();
        }
      };

      updateCountdown();
      const interval = setInterval(updateCountdown, 1000);

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
    }, [serverEndTime, onTimeUp, onTick]);

    return (
      <div
        className={cn(
          'flex items-center gap-2 rounded-2xl px-3.5 py-1.5 border transition-all shadow-xs',
          remainingSecs !== null && remainingSecs < 300
            ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse ring-2 ring-rose-200'
            : remainingSecs !== null && remainingSecs < 600
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-indigo-50/70 border-indigo-200/80 text-indigo-900',
        )}
      >
        <Clock
          size={16}
          className={cn(
            'shrink-0',
            remainingSecs !== null && remainingSecs < 300
              ? 'text-rose-600'
              : remainingSecs !== null && remainingSecs < 600
                ? 'text-amber-600'
                : 'text-indigo-600',
          )}
        />
        <div className="flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold leading-none">
            Time Left
          </span>
          <span className="font-mono text-sm sm:text-base font-black tracking-tight leading-tight tabular-nums">
            {formatTimer(remainingSecs)}
          </span>
        </div>
      </div>
    );
  },
);

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
  const timeLeftRef = useRef<number | null>(null);
  const [serverEndTime, setServerEndTime] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [examId, setExamId] = useState<string>('');
  const [examTitle, setExamTitle] = useState<string>('Competitive Mock Examination');
  const [currentLanguageId, setCurrentLanguageId] = useState<string>('');
  const [securityProfile, setSecurityProfile] = useState<SecurityProfile | null>(null);
  const [warningModalOpen, setWarningModalOpen] = useState(false);
  const [securityWarningMessage, setSecurityWarningMessage] = useState('');

  // Active answer editing state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [numericalAnswer, setNumericalAnswer] = useState<string>('');
  const [isMarkedForReview, setIsMarkedForReview] = useState<boolean>(false);

  // UI & Network state
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveModalConfig, setLeaveModalConfig] = useState<{
    title: string;
    subtitle: string;
    warningText: string;
    stayButtonText: string;
    leaveButtonText: string;
    isTabCloseIntent: boolean;
  }>({
    title: 'Exam in Progress',
    subtitle: 'Leaving may submit/end your exam',
    warningText:
      'Are you sure you want to leave the exam? Your examination is currently active. Choosing to leave will securely save your answers and finalize/submit your attempt.',
    stayButtonText: 'Stay in Exam',
    leaveButtonText: 'Leave & Submit Exam',
    isTabCloseIntent: false,
  });
  const hasSubmittedRef = useRef(false);

  const isExamInProgress =
    !hasSubmittedRef.current &&
    !isSubmitting &&
    questions.length > 0;

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'syncing'>(
    'idle',
  );
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  const debounceSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sequenceCounterRef = useRef<number>(1);
  const isInitialLoadDoneRef = useRef(false);

  // ─── Cross-Tab Active Exam Synchronization ────────────────────────
  useEffect(() => {
    if (attemptId && examId && isExamInProgress) {
      localStorage.setItem(
        'brainros_active_exam',
        JSON.stringify({
          attemptId,
          examId,
          examTitle,
          serverEndTime,
          startedAt: new Date().toISOString(),
        }),
      );
    }
  }, [attemptId, examId, examTitle, serverEndTime, isExamInProgress]);

  // ─── Exam Security Engine Integration ────────────────────────
  const {
    sessionConflict,
    isTransferring,
    transferActiveSession,
    enterFullscreen: enterSecFullscreen,
    recordEvent: recordSecEvent,
  } = useExamSecurity({
    attemptId,
    examId,
    securityProfile,
    isExamActive: isExamInProgress,
    onViolationWarning: (msg) => {
      setSecurityWarningMessage(msg);
      setWarningModalOpen(true);
    },
    onMultipleSessionsDetected: () => {
      // Captured via sessionConflict modal
    },
    onAutoSubmitTriggered: () => {
      handleAutoSubmit();
    },
  });

  // React Router Navigation Blocker (intercepts Back/Forward, sidebar links, route changes)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isExamInProgress && !sessionConflict && currentLocation.pathname !== nextLocation.pathname,
  );

  // Track navigation blocked and leave modal events
  useEffect(() => {
    if (blocker.state === 'blocked') {
      recordSecEvent('NAVIGATION_BLOCKED', 0, {
        targetLocation: blocker.location?.pathname,
      });
      recordSecEvent('LEAVE_WARNING_SHOWN');
    }
  }, [blocker.state, blocker.location, recordSecEvent]);

  // ─── Fire-and-forget Auto-Submit on Forceful Tab Close / Window Destroy ───
  const triggerUnloadAutoSubmit = useCallback(() => {
    if (!attemptId || hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;

    try {
      localStorage.removeItem('brainros_active_exam');
    } catch {}

    const leaveUrl = `${API_URL}/attempts/${attemptId}/leave`;
    const payload = JSON.stringify({ reason: 'FORCE_CLOSE_TAB' });

    // 1. Fetch with keepalive (runs asynchronously in browser network layer even after page teardown)
    try {
      fetch(leaveUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        keepalive: true,
        body: payload,
      }).catch(() => {});
    } catch {}

    // 2. Beacon fallback for maximum browser compatibility
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(leaveUrl, blob);
      }
    } catch {}
  }, [attemptId]);

  // ─── Native BeforeUnload Guard & Forceful Close Auto-Submit ────────
  useEffect(() => {
    if (!isExamInProgress) return;

    let cancelCheckTimer: NodeJS.Timeout | null = null;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      const warningText =
        'Warning: An exam/mock test is currently in progress. If you close this tab, your exam will be automatically submitted!';
      e.returnValue = warningText;

      // If user clicks "Cancel" and remains in the tab:
      if (cancelCheckTimer) clearTimeout(cancelCheckTimer);
      cancelCheckTimer = setTimeout(() => {
        // Tab is still open! User cancelled the browser prompt.
        if (document.visibilityState === 'visible' && !hasSubmittedRef.current) {
          setLeaveModalConfig({
            title: '⚠️ Tab Close Attempt Detected',
            subtitle: 'Closing this tab will auto-submit your exam',
            warningText:
              'You attempted to close this exam tab. Please note: if you close this tab, refresh, or exit the browser, your exam/mock test will be automatically submitted with your current answers and cannot be resumed.',
            stayButtonText: 'Stay & Continue Exam',
            leaveButtonText: 'Force Close & Auto-Submit',
            isTabCloseIntent: true,
          });
          setShowLeaveModal(true);
          recordSecEvent('TAB_CLOSE_CANCELLED', 0, {}, true);
        }
      }, 700);

      return warningText;
    };

    const handlePageHide = (e: PageTransitionEvent) => {
      // Fires when user confirms "Leave" or tab is actually closing
      if (!hasSubmittedRef.current) {
        recordSecEvent('TAB_FORCE_CLOSED', 0, { persisted: e.persisted }, true);
        triggerUnloadAutoSubmit();
      }
    };

    // Exit-intent detection: cursor leaves top of window viewport
    const handleMouseLeave = (e: MouseEvent) => {
      if (
        e.clientY <= 0 &&
        !showLeaveModal &&
        !showSubmitModal &&
        !hasSubmittedRef.current &&
        isExamInProgress
      ) {
        setLeaveModalConfig({
          title: '⚠️ Exiting Exam Window?',
          subtitle: 'Closing this tab will submit your exam',
          warningText:
            'You are moving towards the browser tab bar. Closing or leaving this tab will automatically submit your exam and finalize your answers immediately.',
          stayButtonText: 'Continue Taking Exam',
          leaveButtonText: 'Submit & Exit Exam',
          isTabCloseIntent: true,
        });
        setShowLeaveModal(true);
        recordSecEvent('EXIT_INTENT_DETECTED');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      if (cancelCheckTimer) clearTimeout(cancelCheckTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [
    isExamInProgress,
    triggerUnloadAutoSubmit,
    showLeaveModal,
    showSubmitModal,
    recordSecEvent,
  ]);

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
          const rawStatus = (sData.status || (sData as any).attemptStatus || '').toUpperCase();
          if (
            rawStatus === 'SUBMITTED' ||
            rawStatus === 'AUTO_SUBMITTED' ||
            rawStatus === 'CANCELLED'
          ) {
            hasSubmittedRef.current = true;
            toast.info('This exam/mock test has already been finalized and submitted.');
            navigate(PRIVATE_NAVIGATION.examResult.replace(':attemptId', attemptId), {
              replace: true,
            });
            return;
          }

          if (sData.examId) setExamId(sData.examId);
          if (sData.exam?.title || sData.examTitle) {
            setExamTitle(sData.exam?.title || sData.examTitle);
          }
          if (sData.languageId) setCurrentLanguageId(sData.languageId);
          if (sData.serverEndTime) setServerEndTime(sData.serverEndTime);
          if (sData.securityProfile) setSecurityProfile(sData.securityProfile);

          // Server-authoritative timer sync
          if (sData.serverEndTime) {
            const endMs = new Date(sData.serverEndTime).getTime();
            const remainingSecs = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
            timeLeftRef.current = remainingSecs;
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
    hasSubmittedRef.current = true;
    setSaveStatus('saving');
    recordSecEvent('EXAM_SUBMITTED', 0, { trigger: 'FINAL_SUBMISSION' }, true);
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
      localStorage.removeItem('brainros_active_exam');
    } catch {
      // Non-blocking
    } finally {
      setShowSubmitModal(false);
      setShowLeaveModal(false);
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
    recordSecEvent,
  ]);

  const handleLeaveAndSubmit = useCallback(async () => {
    if (!attemptId) return;
    hasSubmittedRef.current = true;
    recordSecEvent('LEAVE_CONFIRMED', 0, { reason: 'USER_LEAVE' }, true);
    try {
      await handleAutoSubmit();
      localStorage.removeItem('brainros_active_exam');
      if (blocker.state === 'blocked') {
        blocker.proceed();
      }
    } catch (err) {
      console.error('Failed to submit on leave:', err);
    } finally {
      setShowLeaveModal(false);
    }
  }, [attemptId, handleAutoSubmit, blocker, recordSecEvent]);


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
    recordSecEvent('LANGUAGE_CHANGED', 0, { languageId: newLangId });
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
    <div className="flex h-screen w-screen flex-col bg-slate-50 text-slate-900 overflow-hidden select-none font-sans">
      {/* ══ HEADER BAR ════════════════════════════════════════════════ */}
      <header className="relative z-20 flex min-h-14 sm:h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-2.5 sm:px-6 py-1.5 sm:py-0 flex-wrap sm:flex-nowrap gap-x-2 gap-y-1.5 shadow-xs">
        {/* Left: Brand & Exam Meta */}
        <div
          className={cn(
            'flex items-center gap-2 sm:gap-3 transition-opacity min-w-0 shrink',
            isExamInProgress && 'cursor-pointer hover:opacity-90',
          )}
          onClick={() => {
            if (isExamInProgress) {
              setShowLeaveModal(true);
            }
          }}
          title={
            isExamInProgress
              ? 'Exam is currently active. Click to view submission/leave options.'
              : undefined
          }
        >
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200">
            <GraduationCap size={18} className="sm:hidden" />
            <GraduationCap size={20} className="hidden sm:block" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="hidden xs:inline text-[10px] sm:text-xs font-black tracking-tight text-indigo-600 uppercase shrink-0">
                Brainros
              </span>
              <span className="hidden sm:inline text-slate-300">•</span>
              <h1 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate max-w-[110px] xs:max-w-[140px] sm:max-w-[240px] md:max-w-[340px]">
                {examTitle}
              </h1>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-500">
              <span className="truncate max-w-[80px] xs:max-w-[100px] sm:max-w-[160px]">
                {currentQuestion?.section?.name ?? 'General Section'}
              </span>
              <span>•</span>
              <span className="font-mono text-slate-700 shrink-0">
                Q{currentIdx + 1}/{questions.length}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Countdown Timer (Isolated render boundary for 1-second countdowns) */}
        <div className="shrink-0">
          <ExamTimerBadge
            serverEndTime={serverEndTime}
            onTimeUp={handleAutoSubmit}
            onTick={(secs) => {
              timeLeftRef.current = secs;
            }}
          />
        </div>

        {/* Right: Controls & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 ml-auto sm:ml-0">
          {/* Language Switcher */}
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
              'flex items-center gap-1 sm:gap-1.5 rounded-xl px-2 sm:px-2.5 py-1 text-xs font-bold transition-all border shadow-2xs shrink-0',
              !isOnline
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : saveStatus === 'saving' || saveStatus === 'syncing'
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200',
            )}
            title={
              !isOnline
                ? 'Offline mode: answers safely saved locally and will auto-sync on reconnect'
                : 'Connected to exam server'
            }
          >
            {!isOnline ? (
              <>
                <WifiOff size={13} className="text-rose-600" />
                <span className="hidden md:inline">Offline</span>
              </>
            ) : saveStatus === 'saving' || saveStatus === 'syncing' ? (
              <>
                <Loader2 size={13} className="animate-spin text-amber-600" />
                <span className="hidden md:inline">Syncing…</span>
              </>
            ) : (
              <>
                <Wifi size={13} className="text-emerald-600" />
                <span className="hidden md:inline">Saved</span>
              </>
            )}
          </div>

          {/* Full-screen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            title={isFullscreen ? 'Exit Full Screen' : 'Enter Full Screen'}
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all shrink-0"
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>

          {/* User badge */}
          <div className="hidden lg:flex items-center gap-2 border-l border-slate-200 pl-3 text-xs shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700 font-black text-xs">
              {user?.studentProfile?.name?.charAt(0)?.toUpperCase() ?? <User size={12} />}
            </div>
            <span className="font-bold text-slate-700 text-xs max-w-[100px] truncate">
              {user?.studentProfile?.name ?? 'Candidate'}
            </span>
          </div>

          {/* Exit / Close Exam Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLeaveModalConfig({
                title: 'Exit Examination',
                subtitle: 'Leaving will finalize and submit your answers',
                warningText:
                  'Are you sure you want to exit? Your exam is currently active. Choosing to leave or close will automatically finalize and submit your attempt immediately.',
                stayButtonText: 'Stay in Exam',
                leaveButtonText: 'Leave & Submit Exam',
                isTabCloseIntent: false,
              });
              setShowLeaveModal(true);
            }}
            className="flex items-center gap-1 sm:gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 font-bold text-xs shadow-2xs px-2 sm:px-3 py-1 sm:py-1.5 shrink-0"
            title="Exit / Close Exam"
          >
            <LogOut size={13} />
            <span className="hidden sm:inline">Exit</span>
          </Button>

          {/* Final Submit Button */}
          <Button
            type="button"
            variant="success"
            size="sm"
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-1 sm:gap-1.5 shadow-md shadow-emerald-200 font-extrabold text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 shrink-0"
          >
            <Send size={13} />
            <span className="hidden xs:inline">Submit</span>
          </Button>
        </div>
      </header>

      {/* ══ SECTION TABS BAR ═════════════════════════════════════════ */}
      <div className="relative z-10 flex h-11 sm:h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-2.5 sm:px-6 gap-2">
        {/* Section Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none pr-1 min-w-0">
          <button
            type="button"
            onClick={() => setActiveSection('ALL')}
            className={cn(
              'shrink-0 rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold transition-all',
              activeSection === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
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
                  'shrink-0 rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold transition-all',
                  activeSection === sec
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                {sec} ({secCount})
              </button>
            );
          })}
        </div>

        {/* Font Controls & Mobile Palette Toggle */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden xs:flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setFontSize('sm')}
              title="Small Font"
              className={cn(
                'rounded-lg px-2 py-1 font-bold transition-colors',
                fontSize === 'sm' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900',
              )}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setFontSize('base')}
              title="Default Font"
              className={cn(
                'rounded-lg px-2 py-1 font-bold transition-colors',
                fontSize === 'base' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900',
              )}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setFontSize('lg')}
              title="Large Font"
              className={cn(
                'rounded-lg px-2 py-1 font-bold transition-colors',
                fontSize === 'lg' ? 'bg-white text-indigo-600 shadow-2xs' : 'text-slate-500 hover:text-slate-900',
              )}
            >
              A+
            </button>
          </div>

          {/* Mobile/Tablet Palette toggle button */}
          <button
            type="button"
            onClick={() => setIsPaletteOpen((v) => !v)}
            title="Toggle Question Palette"
            className="flex lg:hidden items-center gap-1 sm:gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold text-indigo-700 shadow-2xs shrink-0"
          >
            <Grid3X3 size={14} />
            <span>Palette ({currentIdx + 1}/{questions.length})</span>
          </button>
        </div>
      </div>

      {/* ══ MAIN BODY: QUESTION AREA + QUESTION PALETTE ══════════════ */}
      <div className="flex flex-1 overflow-hidden min-h-0 relative">
        {/* ── Center Question Area ─────────────────────────────── */}
        <main className="flex flex-1 min-w-0 flex-col overflow-y-auto bg-slate-50/70 p-2.5 sm:p-6 lg:p-8 pb-20 lg:pb-8">
          {currentQuestion && (
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-between gap-4 sm:gap-5">
              {/* Question Card */}
              <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-3.5 sm:p-6 lg:p-8 shadow-xs">
                {/* Question Header Meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 sm:pb-4">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-indigo-50 px-2.5 sm:px-3 py-1 text-xs font-black text-indigo-700 border border-indigo-200/80">
                      Question {currentIdx + 1}
                      <span className="text-indigo-300">/</span>
                      <span className="text-indigo-400 font-semibold">{questions.length}</span>
                    </span>
                    <span className="rounded-xl bg-slate-100 px-2 sm:px-2.5 py-1 text-xs font-bold text-slate-600 border border-slate-200">
                      {currentQuestion.section?.name ?? 'General Section'}
                    </span>
                    <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-xl bg-purple-50 px-2 sm:px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200/80">
                      <QuestionTypeIcon
                        code={currentQuestion.questionType?.code || (currentQuestion as any).type}
                      />
                      {currentQuestion.questionType?.name ||
                        (currentQuestion as any).type ||
                        'Multiple Choice'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-black">
                    <span className="flex items-center gap-1 rounded-xl bg-emerald-50 px-2 sm:px-2.5 py-1 text-emerald-700 border border-emerald-200">
                      +{currentQuestion.marks} Mark{currentQuestion.marks > 1 ? 's' : ''}
                    </span>
                    {currentQuestion.negativeMarks > 0 && (
                      <span className="flex items-center gap-1 rounded-xl bg-rose-50 px-2 sm:px-2.5 py-1 text-rose-700 border border-rose-200">
                        −{currentQuestion.negativeMarks} Neg
                      </span>
                    )}
                  </div>
                </div>

                {/* Optional Passage / Context */}
                {displayPassage && (
                  <div className="mt-3.5 sm:mt-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-3 sm:p-4 text-xs sm:text-sm leading-relaxed text-slate-700 break-words overflow-wrap-anywhere">
                    <div className="font-bold text-indigo-700 text-xs mb-1 uppercase tracking-wider">
                      Passage / Comprehension Context:
                    </div>
                    {displayPassage}
                  </div>
                )}

                {/* Optional Assertion & Reason */}
                {displayAssertion && (
                  <div className="mt-3.5 sm:mt-4 space-y-2 rounded-2xl border border-purple-100 bg-purple-50/40 p-3 sm:p-4 text-xs sm:text-sm text-slate-700 break-words overflow-wrap-anywhere">
                    <div>
                      <span className="font-bold text-purple-800 mr-2">Assertion (A):</span>
                      {displayAssertion}
                    </div>
                    {displayReason && (
                      <div className="mt-2 pt-2 border-t border-purple-100">
                        <span className="font-bold text-purple-800 mr-2">Reason (R):</span>
                        {displayReason}
                      </div>
                    )}
                  </div>
                )}

                {/* Question Text */}
                <div
                  className={cn(
                    'mt-4 sm:mt-5 leading-relaxed text-slate-900 font-semibold break-words overflow-wrap-anywhere [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-xl',
                    fontSizeClass,
                  )}
                >
                  {displayQuestionText}
                </div>

                {/* ── Options / Inputs ────────────────────────────── */}
                <div className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3">
                  {getNormalizedQuestionType(currentQuestion) === 'NUM' ? (
                    /* NUMERICAL */
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 sm:p-5">
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Enter your numerical response:
                      </label>
                      <input
                        type="number"
                        step="any"
                        inputMode="decimal"
                        value={numericalAnswer}
                        onChange={(e) => handleNumericalChange(e.target.value)}
                        placeholder="e.g. 25.5"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 sm:px-4 sm:py-3 text-base sm:text-lg font-bold text-slate-900 placeholder-slate-400 shadow-xs focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
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
                            'group flex cursor-pointer items-start gap-2.5 sm:gap-3.5 rounded-2xl border p-3 sm:p-4 transition-all duration-150 select-none min-w-0',
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/30 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/20',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-xl border text-xs font-black transition-all mt-0.5',
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                                : 'border-slate-300 text-slate-600 group-hover:border-indigo-400',
                            )}
                          >
                            {isSelected ? '✓' : label}
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed min-w-0 flex-1 break-words overflow-wrap-anywhere [&_img]:max-w-full [&_img]:h-auto">
                            {optionText}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    /* SINGLE CORRECT (SCQ, TF, AR, MTF) */
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
                            'group flex cursor-pointer items-start gap-2.5 sm:gap-3.5 rounded-2xl border p-3 sm:p-4 transition-all duration-150 select-none min-w-0',
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600/30 shadow-xs'
                              : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/20',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full border text-xs font-black transition-all mt-0.5',
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                                : 'border-slate-300 text-slate-600 group-hover:border-indigo-400',
                            )}
                          >
                            {isSelected ? <CheckCircle2 size={15} /> : label}
                          </div>
                          <span
                            className={cn(
                              'font-medium text-slate-800 leading-relaxed min-w-0 flex-1 break-words overflow-wrap-anywhere [&_img]:max-w-full [&_img]:h-auto',
                              fontSizeClass === 'text-lg' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm',
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

              {/* ── Action Toolbar ──────────────────────────────── */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                  {/* Mark for Review */}
                  <button
                    type="button"
                    onClick={handleToggleMarkForReview}
                    className={cn(
                      'flex items-center gap-1.5 sm:gap-2 rounded-xl px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs font-bold transition-all',
                      isMarkedForReview
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-200'
                        : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
                    )}
                  >
                    <Flag
                      size={14}
                      className={cn(
                        'transition-transform shrink-0',
                        isMarkedForReview ? 'fill-white text-white' : 'text-purple-600',
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
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 sm:py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  >
                    <RotateCcw size={13} className="shrink-0" />
                    <span>Clear Response</span>
                  </button>
                </div>

                {/* Navigation (Desktop / Tablet lg+): Previous / Next / Save & Next */}
                <div className="hidden lg:flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentIdx === 0}
                    className="flex items-center gap-1 font-bold text-xs"
                  >
                    <ChevronLeft size={15} />
                    <span>Previous</span>
                  </Button>

                  {currentIdx < questions.length - 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleNext}
                      className="flex items-center gap-1 font-bold text-xs"
                    >
                      <span>Next</span>
                      <ChevronRight size={15} />
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleSaveAndNext}
                    className="flex items-center gap-1.5 shadow-md shadow-indigo-200 font-extrabold text-xs"
                  >
                    <span>Save & Next</span>
                    <ChevronRight size={15} />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* ── Fixed Mobile Bottom Navigation Bar (Mobile / Tablet < lg) ── */}
        <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between border-t border-slate-200/90 bg-white/95 px-3 py-2 backdrop-blur-md lg:hidden shadow-lg pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentIdx === 0}
            className="flex items-center gap-1 font-bold text-xs px-2.5 py-1.5"
          >
            <ChevronLeft size={15} />
            <span>Prev</span>
          </Button>

          <button
            type="button"
            onClick={() => setIsPaletteOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 shadow-2xs"
          >
            <Grid3X3 size={14} />
            <span>Q {currentIdx + 1}/{questions.length}</span>
          </button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSaveAndNext}
            className="flex items-center gap-1.5 shadow-md shadow-indigo-200 font-extrabold text-xs px-3 py-1.5"
          >
            <span>Save & Next</span>
            <ChevronRight size={15} />
          </Button>
        </div>

        {/* ── Question Palette Sidebar (Desktop) ─ */}
        <aside className="hidden lg:flex h-full shrink-0">
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

        {/* ── Mobile/Tablet Slide-over Drawer for Question Palette ─ */}
        {isPaletteOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs lg:hidden animate-in fade-in duration-150">
            <div className="relative h-full w-full max-w-xs sm:max-w-sm bg-white shadow-2xl animate-in slide-in-from-right duration-200">
              <QuestionPalette
                questions={questions}
                currentIdx={currentIdx}
                activeSection={activeSection}
                sections={sections}
                getQuestionStatus={getQuestionStatus}
                onSelectQuestion={(idx) => {
                  setCurrentIdx(idx);
                  setIsPaletteOpen(false);
                }}
                onSelectSection={(sec) => setActiveSection(sec)}
                onClose={() => setIsPaletteOpen(false)}
                isMobileDrawer={true}
              />
            </div>
          </div>
        )}
      </div>

      {/* ══ SUBMIT CONFIRMATION MODAL ════════════════════════════════ */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-2xl text-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
                  <Send size={16} />
                </div>
                <h3 className="text-base font-black text-slate-900">Submit Examination</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Summary Statistics */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-2xl bg-slate-50 p-3 sm:p-3.5 border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Total Questions</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{questions.length}</span>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-3 sm:p-3.5 border border-emerald-100">
                <span className="text-emerald-700 block text-[10px] font-bold uppercase">Answered</span>
                <span className="text-xl font-black text-emerald-800 mt-0.5 block">
                  {
                    questions.filter((q) => {
                      const st = getQuestionStatus(q);
                      return st === 'ANSWERED' || st === 'ANS_MARKED';
                    }).length
                  }
                </span>
              </div>
              <div className="rounded-2xl bg-rose-50 p-3 sm:p-3.5 border border-rose-100">
                <span className="text-rose-700 block text-[10px] font-bold uppercase">Unanswered</span>
                <span className="text-xl font-black text-rose-800 mt-0.5 block">
                  {questions.filter((q) => getQuestionStatus(q) === 'NOT_ANSWERED').length}
                </span>
              </div>
              <div className="rounded-2xl bg-purple-50 p-3 sm:p-3.5 border border-purple-100">
                <span className="text-purple-700 block text-[10px] font-bold uppercase">Marked for Review</span>
                <span className="text-xl font-black text-purple-800 mt-0.5 block">
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
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto font-bold"
                onClick={() => setShowSubmitModal(false)}
                disabled={isSubmitting}
              >
                Return to Exam
              </Button>
              <Button
                variant="success"
                size="sm"
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold"
                onClick={handleAutoSubmit}
                isLoading={isSubmitting}
              >
                Yes, Submit Examination
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Security Policy Alert Modal */}
      <ExamSecurityWarningModal
        isOpen={warningModalOpen}
        message={securityWarningMessage}
        onDismiss={() => setWarningModalOpen(false)}
        onReEnterFullscreen={enterSecFullscreen}
        requiresFullscreen={Boolean(securityProfile?.fullscreenRequired)}
      />

      {/* Exam Leave & Navigation Warning Modal */}
      <ExamLeaveWarningModal
        isOpen={blocker.state === 'blocked' || showLeaveModal}
        timeLeft={timeLeftRef.current}
        totalQuestions={questions.length}
        answeredCount={
          questions.filter((q) => {
            const st = getQuestionStatus(q);
            return st === 'ANSWERED' || st === 'ANS_MARKED';
          }).length
        }
        unansweredCount={questions.filter((q) => getQuestionStatus(q) === 'NOT_ANSWERED').length}
        markedForReviewCount={
          questions.filter((q) => {
            const st = getQuestionStatus(q);
            return st === 'MARKED' || st === 'ANS_MARKED';
          }).length
        }
        title={blocker.state === 'blocked' ? 'Leave Examination?' : leaveModalConfig.title}
        subtitle={
          blocker.state === 'blocked'
            ? 'Navigating away will finalize and submit your exam'
            : leaveModalConfig.subtitle
        }
        warningText={
          blocker.state === 'blocked'
            ? 'You are attempting to navigate away from the examination. Leaving will automatically finalize and submit your answers immediately.'
            : leaveModalConfig.warningText
        }
        stayButtonText={leaveModalConfig.stayButtonText}
        leaveButtonText={leaveModalConfig.leaveButtonText}
        isTabCloseIntent={leaveModalConfig.isTabCloseIntent}
        onStay={() => {
          recordSecEvent('LEAVE_CANCELLED');
          if (blocker.state === 'blocked') {
            blocker.reset();
          }
          setShowLeaveModal(false);
        }}
        onLeaveAndSubmit={handleLeaveAndSubmit}
        isSubmitting={isSubmitting}
      />

      {/* Multi-Tab & Device Session Conflict Modal */}
      <ExamSessionConflictModal
        isOpen={Boolean(sessionConflict)}
        onTransferSession={transferActiveSession}
        isTransferring={isTransferring}
        onCloseTab={() => {
          localStorage.removeItem('brainros_active_exam');
          try {
            window.close();
          } catch {}
          navigate('/student/dashboard', { replace: true });
        }}
      />
    </div>
  );
};

export default ExamInterfacePage;
