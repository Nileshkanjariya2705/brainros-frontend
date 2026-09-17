import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ListOrdered,
  FileSpreadsheet,
  Plus,
  Layers,
  Hash,
  CheckSquare,
  ArrowRightLeft,
  Zap,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Axios } from '@/base-axios';
import { toast } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { questionPaperKeys, examKeys, adminKeys } from '@/services/queryKeys';
import {
  QuestionDraft,
  QuestionDifficulty,
  QuestionType,
  createInitialDrafts,
  loadManualQuestionDraft,
  saveManualQuestionDraft,
  clearManualQuestionDraft,
  getDefaultColumnA,
  getDefaultColumnB,
  getDefaultMatchPairs,
} from '../utils/manualQuestionDraft';

const DIFFICULTY_OPTIONS: { value: QuestionDifficulty; label: string; color: string; badgeBg: string }[] = [
  { value: 'EASY', label: 'Easy', color: 'text-emerald-700 border-emerald-300 bg-emerald-50', badgeBg: 'bg-emerald-100 text-emerald-800' },
  { value: 'MEDIUM', label: 'Medium', color: 'text-amber-700 border-amber-300 bg-amber-50', badgeBg: 'bg-amber-100 text-amber-800' },
  { value: 'HARD', label: 'Hard', color: 'text-orange-700 border-orange-300 bg-orange-50', badgeBg: 'bg-orange-100 text-orange-800' },
  { value: 'VERY_HARD', label: 'Very Hard', color: 'text-rose-700 border-rose-300 bg-rose-50', badgeBg: 'bg-rose-100 text-rose-800' },
];

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    value: 'SINGLE_CORRECT',
    label: 'Single correct MCQ',
    icon: <Zap size={14} className="text-indigo-600" />,
    desc: '4 options, exactly 1 correct answer',
  },
  {
    value: 'MULTIPLE_CORRECT',
    label: 'Multiple correct',
    icon: <CheckSquare size={14} className="text-purple-600" />,
    desc: '4 options, 1 or more correct answers',
  },
  {
    value: 'NUMERICAL',
    label: 'Numerical answer',
    icon: <Hash size={14} className="text-teal-600" />,
    desc: 'Direct decimal/integer numerical answer',
  },
  {
    value: 'ASSERTION_REASON',
    label: 'Assertion & Reason',
    icon: <Layers size={14} className="text-amber-600" />,
    desc: 'Assertion (A), Reason (R) statements with 4 choices',
  },
  {
    value: 'MATCH_FOLLOWING',
    label: 'Match the following',
    icon: <ArrowRightLeft size={14} className="text-blue-600" />,
    desc: 'Column A & Column B matrix matching with options',
  },
];

const DEFAULT_AR_OPTIONS = [
  { key: 'A', text: 'Both Assertion and Reason are true, and Reason is the correct explanation of Assertion.' },
  { key: 'B', text: 'Both Assertion and Reason are true, but Reason is NOT the correct explanation of Assertion.' },
  { key: 'C', text: 'Assertion is true, but Reason is false.' },
  { key: 'D', text: 'Assertion is false, but Reason is true.' },
];

export const ManualQuestionEntryPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const firstSegment = location.pathname.split('/')[1];
  const routePrefix = [
    'super-admin',
    'admin',
    'general-manager',
    'manager',
    'operator',
    'staff',
  ].includes(firstSegment)
    ? `/${firstSegment}`
    : '/admin';

  // ── Exam Details State ────────────────────────────────────────────────────────
  const [exam, setExam] = useState<any | null>(null);
  const [isLoadingExam, setIsLoadingExam] = useState(true);

  // ── Questions & Draft State ───────────────────────────────────────────────────
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => createInitialDrafts(10));
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);

  // ── Active Navigation & Animation State ───────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const navScrollRef = useRef<HTMLDivElement>(null);
  const questionInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch target exam context & restore draft if available or allocate total question slots
  useEffect(() => {
    if (!examId) return;

    setIsLoadingExam(true);
    Axios.get(`/admin/exams/${examId}/schedule-detail`)
      .then((res) => {
        setIsLoadingExam(false);
        const data = res?.data?.data !== undefined ? res.data.data : res?.data;
        if (data) {
          setExam(data);
          const totalQ = data.totalQuestions || 10;
          const savedDraft = loadManualQuestionDraft(examId, data.examVersionId);
          if (savedDraft && savedDraft.questions.length > 0) {
            setQuestions(savedDraft.questions);
            setCurrentIndex(savedDraft.currentIndex);
            setIsDraftRestored(true);
            const restoredDate = new Date(savedDraft.updatedAt);
            setLastSavedTime(
              restoredDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            );
            toast.info(
              `Your unsaved Question Paper draft has been restored (${savedDraft.questions.length} questions).`,
            );
          } else {
            setQuestions(createInitialDrafts(totalQ));
          }
          setIsInitialized(true);
        }
      })
      .catch(() => {
        Axios.get(`/exams/${examId}`)
          .then((res) => {
            setIsLoadingExam(false);
            const data = res?.data?.data !== undefined ? res.data.data : res?.data;
            if (data) {
              setExam(data);
              const totalQ = data.totalQuestions || 10;
              const savedDraft = loadManualQuestionDraft(examId, data.examVersionId);
              if (savedDraft && savedDraft.questions.length > 0) {
                setQuestions(savedDraft.questions);
                setCurrentIndex(savedDraft.currentIndex);
                setIsDraftRestored(true);
                const restoredDate = new Date(savedDraft.updatedAt);
                setLastSavedTime(
                  restoredDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                );
                toast.info(
                  `Your unsaved Question Paper draft has been restored (${savedDraft.questions.length} questions).`,
                );
              } else {
                setQuestions(createInitialDrafts(totalQ));
              }
              setIsInitialized(true);
            }
          })
          .catch(() => {
            setIsLoadingExam(false);
            const savedDraft = loadManualQuestionDraft(examId);
            if (savedDraft && savedDraft.questions.length > 0) {
              setQuestions(savedDraft.questions);
              setCurrentIndex(savedDraft.currentIndex);
              setIsDraftRestored(true);
              toast.info(`Your unsaved Question Paper draft has been restored.`);
            }
            setIsInitialized(true);
          });
      });
  }, [examId]);

  // Debounced autosave to localStorage on questions or index changes
  useEffect(() => {
    if (!isInitialized || !examId || questions.length === 0) return;

    const timer = setTimeout(() => {
      const saved = saveManualQuestionDraft(
        examId,
        currentIndex,
        questions,
        exam?.examVersionId,
      );
      if (saved) {
        setLastSavedTime(
          new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        );
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [questions, currentIndex, examId, isInitialized, exam?.examVersionId]);

  // Auto-scroll the top horizontal bar to keep active question centered in view
  useEffect(() => {
    if (navScrollRef.current) {
      const activeBtn = navScrollRef.current.querySelector(
        `[data-question-index="${currentIndex}"]`,
      ) as HTMLElement | null;
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    }
  }, [currentIndex]);

  const currentQ = questions[currentIndex] || questions[0];

  // Helper to check if a specific question is completed based on its question type
  const isQuestionComplete = (q: QuestionDraft): boolean => {
    if (!q.difficulty || !q.type) return false;
    if (!q.questionText.trim()) return false;

    switch (q.type) {
      case 'SINGLE_CORRECT':
        return (
          q.optionA.trim().length > 0 &&
          q.optionB.trim().length > 0 &&
          q.optionC.trim().length > 0 &&
          q.optionD.trim().length > 0 &&
          ['A', 'B', 'C', 'D'].includes(q.correctAnswer)
        );

      case 'MULTIPLE_CORRECT':
        return (
          q.optionA.trim().length > 0 &&
          q.optionB.trim().length > 0 &&
          q.optionC.trim().length > 0 &&
          q.optionD.trim().length > 0 &&
          Array.isArray(q.correctAnswers) &&
          q.correctAnswers.length > 0
        );

      case 'NUMERICAL':
        return q.numericalAnswer.trim().length > 0 && !isNaN(Number(q.numericalAnswer));

      case 'ASSERTION_REASON':
        return (
          q.assertion.trim().length > 0 &&
          q.reason.trim().length > 0 &&
          q.optionA.trim().length > 0 &&
          q.optionB.trim().length > 0 &&
          q.optionC.trim().length > 0 &&
          q.optionD.trim().length > 0 &&
          ['A', 'B', 'C', 'D'].includes(q.correctAnswer)
        );

      case 'MATCH_FOLLOWING':
        return (
          q.columnA.every((c) => c.text.trim().length > 0) &&
          q.columnB.every((c) => c.text.trim().length > 0) &&
          q.optionA.trim().length > 0 &&
          q.optionB.trim().length > 0 &&
          q.optionC.trim().length > 0 &&
          q.optionD.trim().length > 0 &&
          ['A', 'B', 'C', 'D'].includes(q.correctAnswer)
        );

      default:
        return false;
    }
  };

  // Navigate to Question with Directional Slide Animation
  const goToQuestion = (targetIndex: number) => {
    if (targetIndex === currentIndex || targetIndex < 0 || targetIndex >= questions.length) return;
    saveManualQuestionDraft(examId || '', targetIndex, questions, exam?.examVersionId);
    setSlideDirection(targetIndex > currentIndex ? 'next' : 'prev');
    setCurrentIndex(targetIndex);
    setTimeout(() => {
      questionInputRef.current?.focus();
    }, 50);
  };

  // Duplicate Current Question to Next Slot
  const handleDuplicateCurrent = () => {
    if (currentIndex < questions.length - 1) {
      const nextIdx = currentIndex + 1;
      const updatedQuestions = questions.map((q, idx) =>
        idx === nextIdx
          ? {
            ...currentQ,
            id: q.id,
            questionNumber: q.questionNumber,
            questionText: `${currentQ.questionText} (Copy)`,
          }
          : q,
      );
      setQuestions(updatedQuestions);
      saveManualQuestionDraft(examId || '', nextIdx, updatedQuestions, exam?.examVersionId);
      setLastSavedTime(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      );
      setSlideDirection('next');
      setCurrentIndex(nextIdx);
      toast.success(`Copied to Question #${nextIdx + 1}`);
    } else {
      toast.info('This is the last configured question slot.');
    }
  };

  // Clear Active Question Form
  const handleClearCurrent = () => {
    const updatedQuestions = questions.map((q, idx) =>
      idx === currentIndex
        ? {
          id: q.id,
          questionNumber: q.questionNumber,
          difficulty: 'MEDIUM' as QuestionDifficulty,
          type: 'SINGLE_CORRECT' as QuestionType,
          questionText: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: 'A' as const,
          correctAnswers: ['A'] as ('A' | 'B' | 'C' | 'D')[],
          numericalAnswer: '',
          assertion: '',
          reason: '',
          columnA: getDefaultColumnA(),
          columnB: getDefaultColumnB(),
          matchPairs: getDefaultMatchPairs(),
          explanation: '',
        }
        : q,
    );
    setQuestions(updatedQuestions);
    saveManualQuestionDraft(examId || '', currentIndex, updatedQuestions, exam?.examVersionId);
    setLastSavedTime(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    );
    toast.info(`Cleared Question #${currentIndex + 1}`);
    questionInputRef.current?.focus();
  };

  // Changing Question Type handler (cleans up and sets sensible defaults)
  const handleChangeQuestionType = (newType: QuestionType) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== currentIndex) return q;

        const updated: QuestionDraft = {
          ...q,
          type: newType,
        };

        // If switching to Assertion & Reason, preload standard options if empty
        if (newType === 'ASSERTION_REASON' && !updated.optionA.trim()) {
          updated.optionA = DEFAULT_AR_OPTIONS[0].text;
          updated.optionB = DEFAULT_AR_OPTIONS[1].text;
          updated.optionC = DEFAULT_AR_OPTIONS[2].text;
          updated.optionD = DEFAULT_AR_OPTIONS[3].text;
        }

        // If switching to Match the following, ensure columns & match pairs are initialized
        if (newType === 'MATCH_FOLLOWING') {
          if (!updated.columnA || updated.columnA.length === 0) {
            updated.columnA = getDefaultColumnA();
          }
          if (!updated.columnB || updated.columnB.length === 0) {
            updated.columnB = getDefaultColumnB();
          }
          if (!updated.matchPairs || updated.matchPairs.length === 0) {
            updated.matchPairs = getDefaultMatchPairs();
          }
          // Set standard matching option templates if empty
          if (!updated.optionA.trim()) {
            updated.optionA = '1-A, 2-B, 3-C, 4-D';
            updated.optionB = '1-B, 2-D, 3-A, 4-C';
            updated.optionC = '1-C, 2-A, 3-D, 4-B';
            updated.optionD = '1-D, 2-C, 3-B, 4-A';
          }
        }

        // If switching to Multiple Correct, ensure correctAnswers is an array
        if (newType === 'MULTIPLE_CORRECT' && (!updated.correctAnswers || updated.correctAnswers.length === 0)) {
          updated.correctAnswers = [updated.correctAnswer || 'A'];
        }

        return updated;
      }),
    );

    // Clear stale field validation errors for this question
    setValidationErrors((prev) => {
      const copy = { ...prev };
      Object.keys(copy).forEach((k) => {
        if (k.startsWith(`${currentQ.id}_`)) delete copy[k];
      });
      return copy;
    });
  };

  // Update Question Field
  const handleUpdateField = (
    field: keyof QuestionDraft,
    value: any,
  ) => {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === currentIndex ? { ...q, [field]: value } : q)),
    );
    // Clear field error
    setValidationErrors((prev) => {
      const copy = { ...prev };
      delete copy[`${currentQ.id}_${field}`];
      return copy;
    });
  };

  // Toggle multiple correct answer options
  const handleToggleMultipleCorrect = (optKey: 'A' | 'B' | 'C' | 'D') => {
    const current = currentQ.correctAnswers || [];
    let updated: ('A' | 'B' | 'C' | 'D')[];
    if (current.includes(optKey)) {
      updated = current.filter((k) => k !== optKey);
    } else {
      updated = [...current, optKey].sort();
    }
    handleUpdateField('correctAnswers', updated);
  };

  // Update Match the following column item text
  const handleUpdateColumnItem = (col: 'A' | 'B', itemIdx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== currentIndex) return q;
        if (col === 'A') {
          const newCol = [...q.columnA];
          newCol[itemIdx] = { ...newCol[itemIdx], text };
          return { ...q, columnA: newCol };
        } else {
          const newCol = [...q.columnB];
          newCol[itemIdx] = { ...newCol[itemIdx], text };
          return { ...q, columnB: newCol };
        }
      }),
    );
  };

  // Update Match the following pair mapping
  const handleUpdateMatchPair = (leftKey: string, rightKey: string) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== currentIndex) return q;
        const newPairs = (q.matchPairs || []).map((p) =>
          p.leftKey === leftKey ? { ...p, rightKey } : p,
        );
        return { ...q, matchPairs: newPairs };
      }),
    );
  };

  // Save Current & Advance to Next Question
  const handleSaveAndNext = () => {
    // Validate current question
    if (!currentQ.questionText.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        [`${currentQ.id}_questionText`]: 'Question statement is required before proceeding.',
      }));
      toast.error(`Please enter Question #${currentIndex + 1} statement.`);
      questionInputRef.current?.focus();
      return;
    }

    if (currentQ.type === 'SINGLE_CORRECT' || currentQ.type === 'MULTIPLE_CORRECT') {
      if (!currentQ.optionA.trim() || !currentQ.optionB.trim() || !currentQ.optionC.trim() || !currentQ.optionD.trim()) {
        toast.error(`Please provide all 4 options (A, B, C, D) for Question #${currentIndex + 1}.`);
        return;
      }
      if (currentQ.type === 'MULTIPLE_CORRECT' && (!currentQ.correctAnswers || currentQ.correctAnswers.length === 0)) {
        toast.error(`Please select at least 1 correct answer for Question #${currentIndex + 1}.`);
        return;
      }
    } else if (currentQ.type === 'NUMERICAL') {
      if (!currentQ.numericalAnswer.trim() || isNaN(Number(currentQ.numericalAnswer))) {
        toast.error(`Please enter a valid numeric answer for Question #${currentIndex + 1}.`);
        return;
      }
    } else if (currentQ.type === 'ASSERTION_REASON') {
      if (!currentQ.assertion.trim() || !currentQ.reason.trim()) {
        toast.error(`Please enter both Assertion (A) and Reason (R) for Question #${currentIndex + 1}.`);
        return;
      }
      if (!currentQ.optionA.trim() || !currentQ.optionB.trim() || !currentQ.optionC.trim() || !currentQ.optionD.trim()) {
        toast.error(`Please provide all 4 options for Question #${currentIndex + 1}.`);
        return;
      }
    } else if (currentQ.type === 'MATCH_FOLLOWING') {
      if (currentQ.columnA.some((c) => !c.text.trim()) || currentQ.columnB.some((c) => !c.text.trim())) {
        toast.error(`Please fill in all Column A and Column B items for Question #${currentIndex + 1}.`);
        return;
      }
      if (!currentQ.optionA.trim() || !currentQ.optionB.trim() || !currentQ.optionC.trim() || !currentQ.optionD.trim()) {
        toast.error(`Please provide all 4 matching answer choices for Question #${currentIndex + 1}.`);
        return;
      }
    }

    const nextIdx = currentIndex < questions.length - 1 ? currentIndex + 1 : currentIndex;

    // Immediately persist current progress to localStorage before advancing
    saveManualQuestionDraft(examId || '', nextIdx, questions, exam?.examVersionId);
    setLastSavedTime(
      new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    );

    if (currentIndex < questions.length - 1) {
      setSlideDirection('next');
      setCurrentIndex(nextIdx);
      setTimeout(() => questionInputRef.current?.focus(), 50);
    } else {
      setIsPreviewMode(true);
      toast.success('All question slots reviewed! Please inspect the preview before saving.');
    }
  };

  // Previous Question
  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      saveManualQuestionDraft(examId || '', prevIdx, questions, exam?.examVersionId);
      setSlideDirection('prev');
      setCurrentIndex(prevIdx);
      setTimeout(() => questionInputRef.current?.focus(), 50);
    }
  };

  // Validate that ALL required question slots are completely filled
  const validateAllQuestions = (): boolean => {
    const errors: Record<string, string> = {};
    let firstIncompleteIdx = -1;

    for (let idx = 0; idx < questions.length; idx++) {
      const q = questions[idx];
      const qNum = idx + 1;

      if (!q.questionText.trim()) {
        errors[`${q.id}_questionText`] = `Question ${qNum}: Statement is required.`;
        if (firstIncompleteIdx === -1) firstIncompleteIdx = idx;
      }

      switch (q.type) {
        case 'SINGLE_CORRECT':
        case 'MULTIPLE_CORRECT':
          if (!q.optionA.trim()) {
            errors[`${q.id}_optionA`] = `Question ${qNum}: Option A is required.`;
            if (firstIncompleteIdx === -1) firstIncompleteIdx = idx;
          }
          if (!q.optionB.trim()) {
            errors[`${q.id}_optionB`] = `Question ${qNum}: Option B is required.`;
            if (firstIncompleteIdx === -1) firstIncompleteIdx = idx;
          }
          if (!q.optionC.trim()) {
            errors[`${q.id}_optionC`] = `Question ${qNum}: Option C is required.`;
            if (firstIncompleteIdx === -1) firstIncompleteIdx = idx;
          }
          if (!q.optionD.trim()) {
            errors[`${q.id}_optionD`] = `Question ${qNum}: Option D is required.`;
            if (firstIncompleteIdx === -1) firstIncompleteIdx = idx;
          }
          if (q.type === 'MULTIPLE_CORRECT' && (!q.correctAnswers || q.correctAnswers.length === 0)) {
            errors[`${q.id}_correctAnswers`] = `Question ${qNum}: Select at least one correct option.`;
            if (firstIncompleteIdx === -1) firstIncompleteIdx = idx;
          }
          break;

        case 'NUMERICAL':
          if (!q.numericalAnswer.trim() || isNaN(Number(q.numericalAnswer))) {
            errors[`${q.id}_numericalAnswer`] = `Question ${qNum}: Valid numerical answer is required.`;
            if (firstIncompleteIdx === -1) firstIncompleteIdx = idx;
          }
          break;

        case 'ASSERTION_REASON':
          if (!q.assertion.trim()) {
            errors[`${q.id}_assertion`] = `Question ${qNum}: Assertion (A) is required.`;
            if (firstIncompleteIdx === -1) firstIncompleteIdx = idx;
          }
          if (!q.reason.trim()) {
            errors[`${q.id}_reason`] = `Question ${qNum}: Reason (R) is required.`;
            if (firstIncompleteIdx === -1) firstIncompleteIdx = idx;
          }
          if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
            errors[`${q.id}_optionA`] = `Question ${qNum}: Options A-D are required.`;
            if (firstIncompleteIdx === -1) firstIncompleteIdx = idx;
          }
          break;

        case 'MATCH_FOLLOWING':
          if (q.columnA.some((c) => !c.text.trim()) || q.columnB.some((c) => !c.text.trim())) {
            errors[`${q.id}_columns`] = `Question ${qNum}: All Column A and B entries are required.`;
            if (firstIncompleteIdx === -1) firstIncompleteIdx = idx;
          }
          if (!q.optionA.trim() || !q.optionB.trim() || !q.optionC.trim() || !q.optionD.trim()) {
            errors[`${q.id}_optionA`] = `Question ${qNum}: Matching answer choices A-D are required.`;
            if (firstIncompleteIdx === -1) firstIncompleteIdx = idx;
          }
          break;
      }
    }

    if (exam?.totalQuestions && questions.length !== exam.totalQuestions) {
      errors['global_count'] = `This examination requires exactly ${exam.totalQuestions} questions, but you have ${questions.length}.`;
    }

    setValidationErrors(errors);

    if (firstIncompleteIdx !== -1) {
      toast.error(
        `Please complete all ${questions.length} required questions before saving. Missing: Question #${firstIncompleteIdx + 1}.`,
      );
      setIsPreviewMode(false);
      goToQuestion(firstIncompleteIdx);
      return false;
    }

    return Object.keys(errors).length === 0;
  };

  // Save / Publish All Questions
  const handleSaveQuestions = async () => {
    if (!validateAllQuestions()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        questions: questions.map((q) => {
          const item: any = {
            questionText: q.questionText.trim(),
            difficulty: q.difficulty,
            type: q.type,
            explanation: q.explanation?.trim() || undefined,
          };

          if (q.type === 'SINGLE_CORRECT') {
            item.optionA = q.optionA.trim();
            item.optionB = q.optionB.trim();
            item.optionC = q.optionC.trim();
            item.optionD = q.optionD.trim();
            item.correctAnswer = q.correctAnswer;
          } else if (q.type === 'MULTIPLE_CORRECT') {
            item.optionA = q.optionA.trim();
            item.optionB = q.optionB.trim();
            item.optionC = q.optionC.trim();
            item.optionD = q.optionD.trim();
            item.correctAnswers = q.correctAnswers;
            item.correctAnswer = q.correctAnswers[0] || 'A';
          } else if (q.type === 'NUMERICAL') {
            item.numericalAnswer = parseFloat(q.numericalAnswer);
          } else if (q.type === 'ASSERTION_REASON') {
            item.assertion = q.assertion.trim();
            item.reason = q.reason.trim();
            item.optionA = q.optionA.trim();
            item.optionB = q.optionB.trim();
            item.optionC = q.optionC.trim();
            item.optionD = q.optionD.trim();
            item.correctAnswer = q.correctAnswer;
          } else if (q.type === 'MATCH_FOLLOWING') {
            item.columnA = q.columnA.map((c) => ({ key: c.key, text: c.text.trim() }));
            item.columnB = q.columnB.map((c) => ({ key: c.key, text: c.text.trim() }));
            item.matchPairs = q.matchPairs;
            item.optionA = q.optionA.trim();
            item.optionB = q.optionB.trim();
            item.optionC = q.optionC.trim();
            item.optionD = q.optionD.trim();
            item.correctAnswer = q.correctAnswer;
          }

          return item;
        }),
      };

      const res = await Axios.post(
        `/admin/exam-manager/exams/${examId}/manual-questions`,
        payload,
      );

      // Clear draft ONLY on success
      clearManualQuestionDraft(examId || '', exam?.examVersionId);

      const translationJobId =
        res?.data?.data?.translationJobId ||
        res?.data?.data?.jobId ||
        res?.data?.translationJobId;

      setIsSubmitting(false);

      // Targeted cache invalidation
      queryClient.invalidateQueries({ queryKey: questionPaperKeys.all });
      queryClient.invalidateQueries({ queryKey: examKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.scheduledExams() });
      queryClient.invalidateQueries({ queryKey: ['ai-translation-scheduled-exams'] });

      if (translationJobId) {
        toast.success(
          res?.data?.message || 'Question paper saved! Redirecting to AI Translation...',
        );
        navigate(`${routePrefix}/ai-translation?jobId=${translationJobId}&examId=${examId}`);
      } else {
        toast.success(res?.data?.message || 'Question paper saved successfully!');
        navigate(`${routePrefix}/exams/${examId}/question-paper/view`);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to save questions. Please try again.';
      toast.error(msg);
    }
  };

  const expectedQuestionsCount = exam?.totalQuestions || questions.length;
  const completedCount = questions.filter(isQuestionComplete).length;
  const remainingCount = expectedQuestionsCount - completedCount;
  const progressPercent = Math.round((completedCount / (expectedQuestionsCount || 1)) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-20 px-3 sm:px-6 animate-in fade-in duration-150 text-slate-800">
      {/* ── Top Header & Action Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${routePrefix}/exams/${examId}/question-paper/upload`)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
            title="Back to Upload options"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                <FileText size={12} />
                Question Paper Studio
              </span>
              <span className="text-xs text-slate-400 font-semibold">•</span>
              <span className="text-xs font-bold text-slate-600">
                {completedCount} of {expectedQuestionsCount} Questions Completed
              </span>
              {lastSavedTime && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                  <Check size={11} />
                  Draft saved {lastSavedTime}
                </span>
              )}
              {isDraftRestored && (
                <span className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700 ring-1 ring-inset ring-sky-600/20">
                  Restored
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {exam?.title || exam?.examName || 'Examination Question Paper'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="flex items-center gap-1.5 rounded-2xl text-xs font-bold"
          >
            {isPreviewMode ? <EyeOff size={15} /> : <Eye size={15} />}
            <span>{isPreviewMode ? 'Question Editor' : 'Preview Paper'}</span>
          </Button>

          <Button
            onClick={handleSaveQuestions}
            disabled={isSubmitting || isLoadingExam}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-100 px-5"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            <span>Save Question Paper</span>
          </Button>
        </div>
      </div>

      {/* ── Question Entry Method Tabs ── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white text-indigo-700 shadow-xs transition"
        >
          <Plus size={15} />
          <span>1. Add Questions Manually</span>
        </button>
        <button
          type="button"
          onClick={() => navigate(`${routePrefix}/exams/${examId}/question-paper/upload`)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-white/60 transition"
        >
          <FileSpreadsheet size={15} />
          <span>2. Upload CSV / Excel</span>
        </button>
      </div>

      {/* ── Progress Bar ── */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-600">
          <div className="flex items-center gap-2">
            <span>Overall Paper Progress:</span>
            <span className="text-indigo-600 font-black">{completedCount} / {expectedQuestionsCount}</span>
            <span className="text-[11px] font-semibold text-slate-400">({progressPercent}%)</span>
          </div>

          <div className="flex items-center gap-2">
            {remainingCount > 0 ? (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                {remainingCount} question(s) pending
              </span>
            ) : (
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <Check size={12} /> All {expectedQuestionsCount} Questions Ready!
              </span>
            )}
          </div>
        </div>

        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${completedCount === expectedQuestionsCount
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600'
              }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Question Index Bar ── */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-700">
            <ListOrdered size={15} className="text-indigo-600" />
            <span>Questions List (All {questions.length} Required)</span>
          </div>
          <span className="text-[11px] text-slate-400 font-semibold">
            Click any number to jump directly
          </span>
        </div>

        <div
          ref={navScrollRef}
          className="flex items-center gap-1.5 overflow-x-auto py-1.5 px-0.5 no-scrollbar scroll-smooth"
        >
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const isFilled = isQuestionComplete(q);
            const hasError = !!validationErrors[`${q.id}_questionText`];

            return (
              <button
                key={q.id}
                type="button"
                data-question-index={idx}
                onClick={() => {
                  setIsPreviewMode(false);
                  goToQuestion(idx);
                }}
                className={`relative flex flex-col items-center justify-center min-w-[42px] h-[42px] px-2 rounded-xl text-xs font-black transition-all duration-150 shrink-0 ${isCurrent
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-200 scale-105 ring-2 ring-indigo-500/40'
                    : isFilled
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300'
                      : hasError
                        ? 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-transparent'
                  }`}
                title={`Question ${idx + 1}: ${isFilled ? 'Completed' : 'Pending'}`}
              >
                <span>{idx + 1}</span>
                {isFilled && !isCurrent && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white text-[8px] font-bold shadow-xs">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Global Validation Alert ── */}
      {validationErrors['global_count'] && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-800 flex items-start gap-3 text-sm shadow-sm animate-in slide-in-from-top-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
          <p className="font-semibold text-xs text-rose-800">
            {validationErrors['global_count']}
          </p>
        </div>
      )}

      {/* ── Preview Mode vs Active Question Card ── */}
      {isPreviewMode ? (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-indigo-950 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <Eye size={15} className="text-indigo-600" /> Complete Question Paper Preview ({questions.length} Questions)
            </span>
            <button
              onClick={() => setIsPreviewMode(false)}
              className="text-indigo-700 underline hover:text-indigo-900 font-extrabold"
            >
              Return to Question Editor
            </button>
          </div>

          {questions.map((q, idx) => {
            const isFilled = isQuestionComplete(q);
            const diffMeta = DIFFICULTY_OPTIONS.find((d) => d.value === q.difficulty) || DIFFICULTY_OPTIONS[1];
            const typeMeta = QUESTION_TYPE_OPTIONS.find((t) => t.value === q.type) || QUESTION_TYPE_OPTIONS[0];

            return (
              <div
                key={q.id}
                className={`rounded-3xl border bg-white p-5 shadow-sm space-y-3 ${!isFilled ? 'border-amber-300 ring-1 ring-amber-300/30' : 'border-slate-200'
                  }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      Question #{idx + 1}
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${diffMeta.badgeBg}`}>
                      {diffMeta.label}
                    </span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                      {typeMeta.icon}
                      {typeMeta.label}
                    </span>
                    {!isFilled && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Incomplete
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setIsPreviewMode(false);
                        goToQuestion(idx);
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-indigo-600 underline"
                    >
                      Edit
                    </button>
                  </div>

                  {isFilled && (
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Check size={12} />
                      {q.type === 'SINGLE_CORRECT' && `Correct: Option ${q.correctAnswer}`}
                      {q.type === 'MULTIPLE_CORRECT' && `Correct: Options ${q.correctAnswers.join(', ')}`}
                      {q.type === 'NUMERICAL' && `Answer: ${q.numericalAnswer}`}
                      {q.type === 'ASSERTION_REASON' && `Correct: Option ${q.correctAnswer}`}
                      {q.type === 'MATCH_FOLLOWING' && `Correct: Option ${q.correctAnswer}`}
                    </div>
                  )}
                </div>

                {/* Assertion & Reason Preview Boxes */}
                {q.type === 'ASSERTION_REASON' && (
                  <div className="space-y-2 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div>
                      <span className="font-extrabold text-indigo-900">Assertion (A): </span>
                      <span className="font-medium text-slate-800">{q.assertion || <span className="text-rose-400 italic">[Empty]</span>}</span>
                    </div>
                    <div>
                      <span className="font-extrabold text-indigo-900">Reason (R): </span>
                      <span className="font-medium text-slate-800">{q.reason || <span className="text-rose-400 italic">[Empty]</span>}</span>
                    </div>
                  </div>
                )}

                {/* Match the following Preview Columns */}
                {q.type === 'MATCH_FOLLOWING' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="space-y-1">
                      <span className="font-extrabold text-indigo-950 uppercase text-[10px] tracking-wider block">Column A</span>
                      {q.columnA.map((ca) => (
                        <div key={ca.id} className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 min-w-[20px]">{ca.key}.</span>
                          <span className="font-medium text-slate-800">{ca.text || <span className="text-rose-400 italic">[Empty]</span>}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <span className="font-extrabold text-indigo-950 uppercase text-[10px] tracking-wider block">Column B</span>
                      {q.columnB.map((cb) => (
                        <div key={cb.id} className="flex items-center gap-2">
                          <span className="font-bold text-slate-700 min-w-[20px]">{cb.key}.</span>
                          <span className="font-medium text-slate-800">{cb.text || <span className="text-rose-400 italic">[Empty]</span>}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-sm font-bold text-slate-900 whitespace-pre-wrap">
                  {q.questionText || <span className="text-rose-500 italic">[Empty question statement]</span>}
                </p>

                {/* Numerical Value Preview */}
                {q.type === 'NUMERICAL' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-900 flex items-center gap-2">
                    <Hash size={14} className="text-emerald-600" />
                    <span>Expected Numerical Answer: <span className="font-mono text-sm">{q.numericalAnswer || '[Empty]'}</span></span>
                  </div>
                )}

                {/* Options Grid (for non-numerical questions) */}
                {q.type !== 'NUMERICAL' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {(['A', 'B', 'C', 'D'] as const).map((key) => {
                      const optText =
                        key === 'A'
                          ? q.optionA
                          : key === 'B'
                            ? q.optionB
                            : key === 'C'
                              ? q.optionC
                              : q.optionD;
                      const isCorrect =
                        q.type === 'MULTIPLE_CORRECT'
                          ? (q.correctAnswers || []).includes(key)
                          : q.correctAnswer === key;

                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium ${isCorrect
                              ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold'
                              : 'border-slate-200 bg-slate-50/50 text-slate-700'
                            }`}
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                              }`}
                          >
                            {key}
                          </span>
                          <span className="flex-1 truncate">
                            {optText || <span className="text-rose-400 italic">[Empty]</span>}
                          </span>
                          {isCorrect && <Check size={13} className="text-emerald-600 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Active Question Editor Card ── */
        <div className="overflow-hidden">
          <div
            key={currentQ.id}
            className={`rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5 transition-all duration-200 ${slideDirection === 'next'
                ? 'animate-in slide-in-from-right-8 duration-200'
                : 'animate-in slide-in-from-left-8 duration-200'
              }`}
          >
            {/* Card Header: Question Number & Action Tools */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black shadow-sm shadow-indigo-100">
                  {currentIndex + 1}
                </span>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Question #{currentIndex + 1} of {questions.length}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-semibold">
                    Configure Difficulty, Question Type, statement, and required answers
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={handleDuplicateCurrent}
                  disabled={currentIndex >= questions.length - 1}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-2xs"
                  title="Copy this question to next slot"
                >
                  <Copy size={13} />
                  <span>Copy to Next</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearCurrent}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 font-bold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 transition-colors shadow-2xs"
                  title="Clear fields"
                >
                  <RotateCcw size={13} />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* ── Difficulty & Question Type Selectors (Required) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
              {/* Difficulty Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Difficulty <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {DIFFICULTY_OPTIONS.map((opt) => {
                    const isSelected = currentQ.difficulty === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleUpdateField('difficulty', opt.value)}
                        className={`px-2 py-2 rounded-xl text-xs font-bold border transition-all text-center ${isSelected
                            ? `${opt.color} ring-2 ring-indigo-500/30 font-extrabold shadow-xs scale-105`
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Type Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Question Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currentQ.type}
                  onChange={(e) => handleChangeQuestionType(e.target.value as QuestionType)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-2xs"
                >
                  {QUESTION_TYPE_OPTIONS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} — {t.desc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ── Assertion & Reason Statement Fields (if ASSERTION_REASON) ── */}
            {currentQ.type === 'ASSERTION_REASON' && (
              <div className="space-y-3 bg-purple-50/40 p-4 rounded-2xl border border-purple-200/80">
                <div>
                  <label className="block text-xs font-extrabold text-purple-900 uppercase tracking-wider mb-1">
                    Assertion (A) Statement <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter Assertion statement (A)..."
                    value={currentQ.assertion}
                    onChange={(e) => handleUpdateField('assertion', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  {validationErrors[`${currentQ.id}_assertion`] && (
                    <p className="text-xs text-rose-600 font-semibold mt-1">
                      {validationErrors[`${currentQ.id}_assertion`]}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-purple-900 uppercase tracking-wider mb-1">
                    Reason (R) Statement <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter Reason statement (R)..."
                    value={currentQ.reason}
                    onChange={(e) => handleUpdateField('reason', e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm font-medium text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  {validationErrors[`${currentQ.id}_reason`] && (
                    <p className="text-xs text-rose-600 font-semibold mt-1">
                      {validationErrors[`${currentQ.id}_reason`]}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* ── Match the Following Columns (if MATCH_FOLLOWING) ── */}
            {currentQ.type === 'MATCH_FOLLOWING' && (
              <div className="space-y-3 bg-blue-50/40 p-4 rounded-2xl border border-blue-200/80">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Column A (1, 2, 3, 4) */}
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wider block">
                      Column A (Items 1 - 4) <span className="text-rose-500">*</span>
                    </span>
                    {currentQ.columnA.map((ca, cIdx) => (
                      <div key={ca.id} className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-900 text-xs font-black">
                          {ca.key}
                        </span>
                        <input
                          type="text"
                          placeholder={`Column A item #${ca.key}...`}
                          value={ca.text}
                          onChange={(e) => handleUpdateColumnItem('A', cIdx, e.target.value)}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Column B (A, B, C, D) */}
                  <div className="space-y-2">
                    <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wider block">
                      Column B (Items A - D) <span className="text-rose-500">*</span>
                    </span>
                    {currentQ.columnB.map((cb, cIdx) => (
                      <div key={cb.id} className="flex items-center gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-900 text-xs font-black">
                          {cb.key}
                        </span>
                        <input
                          type="text"
                          placeholder={`Column B item #${cb.key}...`}
                          value={cb.text}
                          onChange={(e) => handleUpdateColumnItem('B', cIdx, e.target.value)}
                          className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Correct Matching Pair selector */}
                <div className="pt-2 border-t border-blue-200/60">
                  <span className="text-xs font-extrabold text-blue-950 uppercase tracking-wider block mb-1.5">
                    Matching Key Relationships (1 → ?, 2 → ?, etc.)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {currentQ.matchPairs.map((p) => (
                      <div key={p.leftKey} className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-slate-200 text-xs font-bold">
                        <span className="text-blue-900 font-extrabold">{p.leftKey} →</span>
                        <select
                          value={p.rightKey}
                          onChange={(e) => handleUpdateMatchPair(p.leftKey, e.target.value)}
                          className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black text-slate-800"
                        >
                          {['A', 'B', 'C', 'D'].map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Question Text Area */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Question Statement / Instructions <span className="text-rose-500">*</span>
              </label>
              <textarea
                ref={questionInputRef}
                rows={3}
                placeholder={`Type or paste Question #${currentIndex + 1} statement here...`}
                value={currentQ.questionText}
                onChange={(e) => handleUpdateField('questionText', e.target.value)}
                className={`w-full rounded-2xl border bg-white p-3.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-100 transition-colors ${validationErrors[`${currentQ.id}_questionText`]
                    ? 'border-rose-400 focus:border-rose-500'
                    : 'border-slate-200 focus:border-indigo-500'
                  }`}
              />
              {validationErrors[`${currentQ.id}_questionText`] && (
                <p className="text-xs text-rose-600 font-semibold mt-1">
                  {validationErrors[`${currentQ.id}_questionText`]}
                </p>
              )}
            </div>

            {/* ── Type Specific Input Areas ── */}

            {/* Case 1: Numerical Question */}
            {currentQ.type === 'NUMERICAL' && (
              <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-teal-950">
                  Numerical Correct Answer <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 42.5 or -10"
                      value={currentQ.numericalAnswer}
                      onChange={(e) => handleUpdateField('numericalAnswer', e.target.value.replace(/[^0-9.-]/g, ''))}
                      className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base font-bold text-slate-900 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    Supports integer and decimal answers
                  </span>
                </div>
                {validationErrors[`${currentQ.id}_numericalAnswer`] && (
                  <p className="text-xs text-rose-600 font-semibold mt-1">
                    {validationErrors[`${currentQ.id}_numericalAnswer`]}
                  </p>
                )}
              </div>
            )}

            {/* Case 2: Options Grid for Single Correct, Multiple Correct, Assertion & Reason, Match following */}
            {currentQ.type !== 'NUMERICAL' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    {currentQ.type === 'MULTIPLE_CORRECT'
                      ? 'Options & Correct Answer(s) — Select All That Apply'
                      : currentQ.type === 'MATCH_FOLLOWING'
                        ? 'Answer Options (Combination Choices)'
                        : 'Answer Options & Correct Answer'} <span className="text-rose-500">*</span>
                  </label>
                  {currentQ.type === 'MULTIPLE_CORRECT' && (
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                      {currentQ.correctAnswers?.length || 0} Correct Option(s) Selected
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => {
                    const optVal =
                      key === 'A'
                        ? currentQ.optionA
                        : key === 'B'
                          ? currentQ.optionB
                          : key === 'C'
                            ? currentQ.optionC
                            : currentQ.optionD;
                    const optField =
                      key === 'A'
                        ? 'optionA'
                        : key === 'B'
                          ? 'optionB'
                          : key === 'C'
                            ? 'optionC'
                            : 'optionD';

                    const isMultiple = currentQ.type === 'MULTIPLE_CORRECT';
                    const isCorrect = isMultiple
                      ? (currentQ.correctAnswers || []).includes(key)
                      : currentQ.correctAnswer === key;

                    const optErr = validationErrors[`${currentQ.id}_${optField}`];

                    return (
                      <div
                        key={key}
                        className={`rounded-2xl border p-3.5 transition-all ${isCorrect
                            ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-black text-slate-700">
                            Option {key}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (isMultiple) {
                                handleToggleMultipleCorrect(key);
                              } else {
                                handleUpdateField('correctAnswer', key);
                              }
                            }}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold transition-all ${isCorrect
                                ? 'bg-emerald-600 text-white shadow-xs scale-105'
                                : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                              }`}
                          >
                            {isCorrect ? (
                              <>
                                <Check size={12} /> Correct
                              </>
                            ) : (
                              'Mark Correct'
                            )}
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder={`Enter Option ${key} text...`}
                          value={optVal}
                          onChange={(e) => handleUpdateField(optField, e.target.value)}
                          className={`w-full rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-colors ${optErr
                              ? 'border-rose-400 focus:border-rose-500'
                              : 'border-slate-200 focus:border-indigo-500'
                            }`}
                        />
                        {optErr && (
                          <p className="text-xs text-rose-600 font-semibold mt-1">{optErr}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Optional Explanation */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Solution Explanation (Optional)
              </label>
              <input
                type="text"
                placeholder="Optional explanation shown on the student result scorecard..."
                value={currentQ.explanation || ''}
                onChange={(e) => handleUpdateField('explanation', e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Step-by-Step Navigation Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 pt-4 bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0 || isPreviewMode}
            className="flex items-center gap-1.5 rounded-2xl text-xs font-bold"
          >
            <ChevronLeft size={16} />
            <span>Previous (Q{currentIndex > 0 ? currentIndex : 1})</span>
          </Button>

          <Button
            type="button"
            onClick={handleSaveAndNext}
            disabled={isPreviewMode}
            className="flex items-center gap-1.5 rounded-2xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <span>
              {currentIndex < questions.length - 1
                ? `Save & Next (Q${currentIndex + 2})`
                : 'Review & Finish'}
            </span>
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-auto">
          <Button
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className="rounded-2xl text-xs font-bold"
          >
            {isPreviewMode ? 'Edit Mode' : 'Preview All'}
          </Button>

          <Button
            onClick={handleSaveQuestions}
            disabled={isSubmitting || isLoadingExam}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-100 px-6"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            <span>Save Question Paper ({completedCount}/{expectedQuestionsCount})</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
export default ManualQuestionEntryPage;
