import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from '@/utils/toast';
import {
  useSendHeartbeatAPI,
  useIngestSecurityEventsAPI,
  useCreateExamSessionAPI,
  type SecurityProfile,
  type SecurityEventPayload,
} from '../services/security.service';

interface UseExamSecurityOptions {
  attemptId?: string;
  examId?: string;
  securityProfile?: SecurityProfile | null;
  isExamActive: boolean;
  onViolationWarning?: (message: string) => void;
  onMultipleSessionsDetected?: () => void;
  onAutoSubmitTriggered?: () => void;
}

export const useExamSecurity = ({
  attemptId,
  examId,
  securityProfile,
  isExamActive,
  onViolationWarning,
  onMultipleSessionsDetected,
  onAutoSubmitTriggered,
}: UseExamSecurityOptions) => {
  const { sendHeartbeatAPI } = useSendHeartbeatAPI();
  const { ingestSecurityEventsAPI } = useIngestSecurityEventsAPI();
  const { createExamSessionAPI } = useCreateExamSessionAPI();

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionConflict, setSessionConflict] = useState<boolean>(false);
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [violationsCount, setViolationsCount] = useState<number>(0);

  const sessionInitializedRef = useRef<boolean>(false);
  const eventBufferRef = useRef<SecurityEventPayload[]>([]);
  const sequenceNumberRef = useRef<number>(1);
  const hiddenStartTimeRef = useRef<number | null>(null);
  const flushTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastResizeRef = useRef<{ width: number; height: number }>({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Helper to generate UUID v4
  const generateEventId = () => {
    return 'evt_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
  };

  /**
   * Queue security event into buffer
   */
  const recordEvent = useCallback(
    (
      eventType: string,
      duration?: number,
      metadata?: Record<string, any>,
      immediate: boolean = false,
    ) => {
      if (!attemptId || !isExamActive) return;

      const event: SecurityEventPayload = {
        eventId: generateEventId(),
        eventType,
        sequenceNumber: sequenceNumberRef.current++,
        clientTimestamp: new Date().toISOString(),
        duration: duration || 0,
        metadata: metadata || {},
      };

      eventBufferRef.current.push(event);

      if (immediate) {
        flushEvents();
      }
    },
    [attemptId, isExamActive],
  );

  /**
   * Flush queued events to backend
   */
  const flushEvents = useCallback(async () => {
    if (!attemptId || eventBufferRef.current.length === 0) return;

    const eventsToSend = [...eventBufferRef.current];
    eventBufferRef.current = [];

    try {
      const res = await ingestSecurityEventsAPI(
        attemptId,
        eventsToSend,
        sessionId || undefined,
      );

      if (res.data?.evaluation) {
        const evalData = res.data.evaluation;
        if (evalData.violationsCount !== undefined) {
          setViolationsCount(evalData.violationsCount);
        }
        if (evalData.action === 'WARN' && evalData.warningMessage && onViolationWarning) {
          onViolationWarning(evalData.warningMessage);
        } else if (evalData.action === 'AUTO_SUBMIT' && onAutoSubmitTriggered) {
          onAutoSubmitTriggered();
        }
      }
    } catch {
      // Offline fallback: prepend failed events back into the buffer
      eventBufferRef.current = [...eventsToSend, ...eventBufferRef.current];
    }
  }, [attemptId, ingestSecurityEventsAPI, sessionId, onViolationWarning, onAutoSubmitTriggered]);

  /**
   * Request browser fullscreen
   */
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        recordEvent('FULLSCREEN_ENTERED');
      }
    } catch (err) {
      console.warn('Fullscreen request denied or not supported:', err);
    }
  }, [recordEvent]);

  /**
   * Exit fullscreen safely
   */
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
    }
  }, []);

  /**
   * Transfer active session to this window/device
   */
  const transferActiveSession = useCallback(async () => {
    if (!attemptId) return;
    setIsTransferring(true);
    try {
      const deviceMeta = {
        examId,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        platform: navigator.platform,
        language: navigator.language,
      };
      const res = await createExamSessionAPI(attemptId, deviceMeta, true);
      if (res.data?.id) {
        setSessionId(res.data.id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`exam_session_${attemptId}`, res.data.id);
        }
        setSessionConflict(false);
        sessionInitializedRef.current = true;
        toast.success('Active session successfully transferred to this window.');
      } else if (res.error) {
        toast.error(res.error || 'Failed to transfer session.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to transfer session.');
    } finally {
      setIsTransferring(false);
    }
  }, [attemptId, examId, createExamSessionAPI]);

  // ─── 1. Initialize Active Exam Session ─────────────────────────────
  useEffect(() => {
    if (!attemptId || !isExamActive || sessionInitializedRef.current) return;
    sessionInitializedRef.current = true;

    const initSession = async () => {
      const storedSessionId =
        typeof window !== 'undefined'
          ? sessionStorage.getItem(`exam_session_${attemptId}`) || undefined
          : undefined;

      const deviceMeta = {
        examId,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        platform: navigator.platform,
        language: navigator.language,
      };

      const res = await createExamSessionAPI(
        attemptId,
        deviceMeta,
        false,
        storedSessionId,
      );

      if (res.data?.conflict) {
        setSessionConflict(true);
        if (onMultipleSessionsDetected) {
          onMultipleSessionsDetected();
        }
      } else if (res.data?.id) {
        setSessionId(res.data.id);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`exam_session_${attemptId}`, res.data.id);
        }
        setSessionConflict(false);
      }
    };

    initSession();
  }, [attemptId, examId, isExamActive, createExamSessionAPI, onMultipleSessionsDetected]);

  // ─── 2. Periodic Event Buffer Flush ────────────────────────────────
  useEffect(() => {
    if (!attemptId || !isExamActive) return;

    flushTimerRef.current = setInterval(() => {
      flushEvents();
    }, 4000);

    return () => {
      if (flushTimerRef.current) clearInterval(flushTimerRef.current);
      flushEvents(); // Flush remaining on exit
    };
  }, [attemptId, isExamActive, flushEvents]);

  // ─── 3. Periodic Heartbeat (every 12 seconds) ──────────────────────
  useEffect(() => {
    if (!attemptId || !isExamActive) return;

    const intervalSec = Math.min(12, securityProfile?.heartbeatIntervalSeconds || 12);
    heartbeatTimerRef.current = setInterval(async () => {
      const res = await sendHeartbeatAPI(attemptId, {
        sessionId: sessionId || undefined,
        isFullscreen: Boolean(document.fullscreenElement),
        isOnline: navigator.onLine,
        visibilityState: document.visibilityState,
      });

      if (res.data?.multipleSessionDetected) {
        setSessionConflict(true);
        if (onMultipleSessionsDetected) {
          recordEvent('MULTIPLE_SESSION_DETECTED', 0, {}, true);
          onMultipleSessionsDetected();
        }
      }
    }, intervalSec * 1000);

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [
    attemptId,
    isExamActive,
    securityProfile?.heartbeatIntervalSeconds,
    sessionId,
    sendHeartbeatAPI,
    recordEvent,
    onMultipleSessionsDetected,
  ]);

  // ─── 4. Event Listeners Registration & Teardown ────────────────────
  useEffect(() => {
    if (!attemptId || !isExamActive) return;

    // Fullscreen change
    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsFullscreen(active);
      if (!active) {
        recordEvent('FULLSCREEN_EXITED');
        if (securityProfile?.fullscreenRequired && onViolationWarning) {
          onViolationWarning('Fullscreen mode was exited. Fullscreen is required for this examination.');
        }
      } else {
        recordEvent('FULLSCREEN_ENTERED');
      }
    };

    // Tab visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenStartTimeRef.current = Date.now();
        recordEvent('TAB_HIDDEN');
      } else {
        let duration = 0;
        if (hiddenStartTimeRef.current) {
          duration = Math.round((Date.now() - hiddenStartTimeRef.current) / 1000);
          hiddenStartTimeRef.current = null;
        }
        recordEvent('TAB_VISIBLE', duration);
        if (securityProfile?.detectTabSwitch && onViolationWarning && duration > 1) {
          onViolationWarning('You left the examination tab. Please remain on the exam screen.');
        }
      }
    };

    // Window blur & focus
    const handleBlur = () => {
      recordEvent('WINDOW_BLUR');
    };
    const handleFocus = () => {
      recordEvent('WINDOW_FOCUS');
    };

    // Context menu (right-click)
    const handleContextMenu = (e: MouseEvent) => {
      if (securityProfile?.preventContextMenu) {
        e.preventDefault();
        recordEvent('CONTEXT_MENU_BLOCKED');
      }
    };

    // Copy / Cut / Paste
    const handleCopy = (e: ClipboardEvent) => {
      if (securityProfile?.preventCopyPaste) {
        e.preventDefault();
        recordEvent('COPY_BLOCKED');
      }
    };
    const handleCut = (e: ClipboardEvent) => {
      if (securityProfile?.preventCopyPaste) {
        e.preventDefault();
        recordEvent('CUT_BLOCKED');
      }
    };
    const handlePaste = (e: ClipboardEvent) => {
      if (securityProfile?.preventCopyPaste) {
        e.preventDefault();
        recordEvent('PASTE_BLOCKED');
      }
    };

    // Keyboard shortcuts (Devtools, PrintScreen, Source view)
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isCtrlOrMeta = isMac ? e.metaKey : e.ctrlKey;

      // F12 or Ctrl+Shift+I / Cmd+Alt+I
      if (
        e.key === 'F12' ||
        (isCtrlOrMeta && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        recordEvent('DEVTOOLS_SHORTCUT_DETECTED', 0, { key: e.key }, true);
      }

      // Ctrl+U / Cmd+U (View source)
      if (isCtrlOrMeta && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        recordEvent('SOURCE_VIEW_SHORTCUT_DETECTED', 0, { key: e.key });
      }

      // Copy/Paste shortcuts
      if (securityProfile?.preventCopyPaste) {
        if (isCtrlOrMeta && (e.key === 'c' || e.key === 'C')) {
          recordEvent('COPY_BLOCKED');
        }
        if (isCtrlOrMeta && (e.key === 'v' || e.key === 'V')) {
          recordEvent('PASTE_BLOCKED');
        }
        if (isCtrlOrMeta && (e.key === 'x' || e.key === 'X')) {
          recordEvent('CUT_BLOCKED');
        }
      }
    };

    // Window Resize
    const handleResize = () => {
      const widthDiff = Math.abs(window.innerWidth - lastResizeRef.current.width);
      const heightDiff = Math.abs(window.innerHeight - lastResizeRef.current.height);
      if (widthDiff > 100 || heightDiff > 100) {
        recordEvent('WINDOW_RESIZE', 0, {
          prevWidth: lastResizeRef.current.width,
          prevHeight: lastResizeRef.current.height,
          newWidth: window.innerWidth,
          newHeight: window.innerHeight,
        });
        lastResizeRef.current = { width: window.innerWidth, height: window.innerHeight };
      }
    };

    // Network Online / Offline
    const handleOnline = () => {
      setIsOnline(true);
      recordEvent('NETWORK_ONLINE', 0, {}, true);
    };
    const handleOffline = () => {
      setIsOnline(false);
      recordEvent('NETWORK_OFFLINE');
    };

    // Register all listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopy);
    window.addEventListener('cut', handleCut);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial fullscreen trigger if required
    if (securityProfile?.fullscreenRequired && !document.fullscreenElement) {
      enterFullscreen();
    }

    // Cleanup on unmount
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopy);
      window.removeEventListener('cut', handleCut);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [attemptId, isExamActive, securityProfile, recordEvent, enterFullscreen, onViolationWarning]);

  return {
    isFullscreen,
    isOnline,
    violationsCount,
    sessionConflict,
    isTransferring,
    transferActiveSession,
    enterFullscreen,
    exitFullscreen,
    recordEvent,
    flushEvents,
  };
};
