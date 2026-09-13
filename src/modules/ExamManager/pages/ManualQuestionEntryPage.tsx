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
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { Axios } from '@/base-axios';
import { toast } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { questionPaperKeys, examKeys, adminKeys } from '@/services/queryKeys';

interface QuestionDraft {
  id: string;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
}

const createInitialDrafts = (count: number): QuestionDraft[] => {
  const targetCount = Math.max(1, count || 1);
  const list: QuestionDraft[] = [];
  for (let i = 1; i <= targetCount; i++) {
    list.push({
      id: `q-${i}`,
      questionNumber: i,
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
    });
  }
  return list;
};

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

  // ── Questions State ───────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => createInitialDrafts(10));

  // ── Active Navigation & Animation State ───────────────────────────────────────
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [slideDirection, setSlideDirection] = useState<'next' | 'prev'>('next');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const navScrollRef = useRef<HTMLDivElement>(null);
  const questionInputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch target exam context & auto-allocate total question slots
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
          setQuestions(createInitialDrafts(totalQ));
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
              setQuestions(createInitialDrafts(totalQ));
            }
          })
          .catch(() => {
            setIsLoadingExam(false);
          });
      });
  }, [examId]);

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

  // Helper to check if a specific question is completed
  const isQuestionComplete = (q: QuestionDraft): boolean => {
    return (
      q.questionText.trim().length > 0 &&
      q.optionA.trim().length > 0 &&
      q.optionB.trim().length > 0 &&
      q.optionC.trim().length > 0 &&
      q.optionD.trim().length > 0 &&
      ['A', 'B', 'C', 'D'].includes(q.correctAnswer)
    );
  };

  // Navigate to Question with Directional Slide Animation
  const goToQuestion = (targetIndex: number) => {
    if (targetIndex === currentIndex || targetIndex < 0 || targetIndex >= questions.length) return;
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
      setQuestions((prev) =>
        prev.map((q, idx) =>
          idx === nextIdx
            ? {
                ...q,
                questionText: `${currentQ.questionText} (Copy)`,
                optionA: currentQ.optionA,
                optionB: currentQ.optionB,
                optionC: currentQ.optionC,
                optionD: currentQ.optionD,
                correctAnswer: currentQ.correctAnswer,
                explanation: currentQ.explanation,
              }
            : q,
        ),
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
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === currentIndex
          ? {
              ...q,
              questionText: '',
              optionA: '',
              optionB: '',
              optionC: '',
              optionD: '',
              correctAnswer: 'A',
              explanation: '',
            }
          : q,
      ),
    );
    toast.info(`Cleared Question #${currentIndex + 1}`);
    questionInputRef.current?.focus();
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

    if (!currentQ.optionA.trim() || !currentQ.optionB.trim() || !currentQ.optionC.trim() || !currentQ.optionD.trim()) {
      toast.error(`Please provide all 4 options (A, B, C, D) for Question #${currentIndex + 1}.`);
      return;
    }

    if (currentIndex < questions.length - 1) {
      // Advance to next preallocated question slot with slide animation
      setSlideDirection('next');
      setCurrentIndex(currentIndex + 1);
      setTimeout(() => questionInputRef.current?.focus(), 50);
    } else {
      // On the final question: Show preview
      setIsPreviewMode(true);
      toast.success('All question slots reviewed! Please inspect the preview before saving.');
    }
  };

  // Previous Question
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setSlideDirection('prev');
      setCurrentIndex(currentIndex - 1);
      setTimeout(() => questionInputRef.current?.focus(), 50);
    }
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
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          optionA: q.optionA.trim(),
          optionB: q.optionB.trim(),
          optionC: q.optionC.trim(),
          optionD: q.optionD.trim(),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation?.trim() || undefined,
        })),
      };

      const res = await Axios.post(
        `/admin/exam-manager/exams/${examId}/manual-questions`,
        payload,
      );

      setIsSubmitting(false);
      toast.success(res?.data?.message || 'Question paper saved successfully!');

      // Targeted cache invalidation
      queryClient.invalidateQueries({ queryKey: questionPaperKeys.all });
      queryClient.invalidateQueries({ queryKey: examKeys.all });
      queryClient.invalidateQueries({ queryKey: adminKeys.scheduledExams() });

      navigate(`${routePrefix}/exams/${examId}/question-paper/view`);
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
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                <FileText size={12} />
                Question Paper Studio
              </span>
              <span className="text-xs text-slate-400 font-semibold">•</span>
              <span className="text-xs font-bold text-slate-600">
                {completedCount} of {expectedQuestionsCount} Questions Completed
              </span>
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

      {/* ── Progress & Status Bar ── */}
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
            className={`h-2 rounded-full transition-all duration-300 ${
              completedCount === expectedQuestionsCount
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Top Horizontal 1, 2, 3, 4, 5... Number List ── */}
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

        {/* Scrollable Horizontal Numbers: 1, 2, 3, ... N */}
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
                className={`relative flex flex-col items-center justify-center min-w-[42px] h-[42px] px-2 rounded-xl text-xs font-black transition-all duration-150 shrink-0 ${
                  isCurrent
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

      {/* ── Read-Only Preview Mode OR Active Question Card with Horizontal Slide Animation ── */}
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

            return (
              <div
                key={q.id}
                className={`rounded-3xl border bg-white p-5 shadow-sm space-y-3 ${
                  !isFilled ? 'border-amber-300 ring-1 ring-amber-300/30' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      Question #{idx + 1}
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
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <Check size={12} /> Correct: Option {q.correctAnswer}
                    </span>
                  )}
                </div>

                <p className="text-sm font-bold text-slate-900 whitespace-pre-wrap">
                  {q.questionText || <span className="text-rose-500 italic">[Empty question statement]</span>}
                </p>

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
                    const isCorrect = q.correctAnswer === key;

                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-medium ${
                          isCorrect
                            ? 'border-emerald-500 bg-emerald-50/60 text-emerald-950 font-bold'
                            : 'border-slate-200 bg-slate-50/50 text-slate-700'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold ${
                            isCorrect
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
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Active Question Card with Smooth Horizontal Slide Transition Animation ── */
        <div className="overflow-hidden">
          <div
            key={currentQ.id}
            className={`rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-5 transition-all duration-200 ${
              slideDirection === 'next'
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
                    Fill the question text and 4 choices, then select the correct answer key
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

            {/* Question Text Area */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Question Statement <span className="text-rose-500">*</span>
              </label>
              <textarea
                ref={questionInputRef}
                rows={3}
                placeholder={`Type or paste Question #${currentIndex + 1} statement here...`}
                value={currentQ.questionText}
                onChange={(e) => handleUpdateField('questionText', e.target.value)}
                className={`w-full rounded-2xl border bg-white p-3.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-100 transition-colors ${
                  validationErrors[`${currentQ.id}_questionText`]
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

            {/* Multiple Choice Options (A, B, C, D) */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Answer Options & Correct Key <span className="text-rose-500">*</span>
              </label>

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
                  const isCorrect = currentQ.correctAnswer === key;
                  const optErr = validationErrors[`${currentQ.id}_${optField}`];

                  return (
                    <div
                      key={key}
                      className={`rounded-2xl border p-3.5 transition-all ${
                        isCorrect
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
                          onClick={() => handleUpdateField('correctAnswer', key)}
                          className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold transition-all ${
                            isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs scale-105'
                              : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          {isCorrect ? (
                            <>
                              <Check size={12} /> Correct Answer
                            </>
                          ) : (
                            'Mark as Correct'
                          )}
                        </button>
                      </div>

                      <input
                        type="text"
                        placeholder={`Enter Option ${key} text...`}
                        value={optVal}
                        onChange={(e) => handleUpdateField(optField, e.target.value)}
                        className={`w-full rounded-xl border bg-white px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:ring-2 focus:ring-indigo-100 transition-colors ${
                          optErr
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
