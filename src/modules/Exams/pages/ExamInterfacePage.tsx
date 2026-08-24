// ** Packages **
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  AlertCircle,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCcw,
  ShieldAlert,
  X,
  FileText,
  User,
} from 'lucide-react';
import cn from 'classnames';

// ** Services & Hooks **
import {
  useGetAttemptStatusAPI,
  useGetAttemptQuestionsAPI,
  useSaveAnswerAPI,
  useSubmitAttemptAPI,
} from '../services';
import { useAuth } from '@/hooks/useAuth';

// ** Components **
import Loader from '@/components/feedback/Loader';
import Button from '@/components/ui/Button';

// ** Types **
import type { ExamQuestion, AttemptAnswer } from '@/types/exam.types';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

const ExamInterfacePage = () => {
  const { attemptId } = useParams<{ examId: string; attemptId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // API hooks
  const { getAttemptStatusAPI, isLoading: isStatusLoading } = useGetAttemptStatusAPI();
  const { getAttemptQuestionsAPI, isLoading: isQuestionsLoading } = useGetAttemptQuestionsAPI();
  const { saveAnswerAPI } = useSaveAnswerAPI();
  const { submitAttemptAPI, isLoading: isSubmitting } = useSubmitAttemptAPI();

  // State
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, AttemptAnswer>>({});
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [activeSection, setActiveSection] = useState<string>('ALL');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [saveStatusText, setSaveStatusText] = useState<string>('Saved');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Current inputs for single question
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [numericalAnswer, setNumericalAnswer] = useState<string>('');
  const [isMarkedForReview, setIsMarkedForReview] = useState<boolean>(false);

  // Load initial status & questions
  useEffect(() => {
    if (!attemptId) return;

    let isMounted = true;
    (async () => {
      // 1. Fetch questions
      const qRes = await getAttemptQuestionsAPI(attemptId);
      if (!isMounted) return;
      if (qRes.error || !qRes.data) {
        setErrorMessage(qRes.error || 'Failed to load exam questions');
        return;
      }
      setQuestions(qRes.data);

      // 2. Fetch attempt status
      const sRes = await getAttemptStatusAPI(attemptId);
      if (!isMounted) return;
      if (sRes.data) {
        // Map existing answers
        const ansMap: Record<string, AttemptAnswer> = {};
        sRes.data.answers.forEach((ans) => {
          ansMap[ans.examQuestionId] = ans;
        });
        setAnswers(ansMap);

        // Calculate timer remaining
        if (sRes.data.serverEndTime) {
          const endMs = new Date(sRes.data.serverEndTime).getTime();
          const remainingSecs = Math.max(0, Math.floor((endMs - Date.now()) / 1000));
          setTimeLeft(remainingSecs);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [attemptId, getAttemptQuestionsAPI, getAttemptStatusAPI]);

  // Sync inputs when currentIdx or answers change
  useEffect(() => {
    if (questions.length === 0) return;
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

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
  }, [currentIdx, questions, answers]);

  // Live Timer Countdown & Auto Submit
  const handleAutoSubmit = useCallback(async () => {
    if (!attemptId) return;
    setSaveStatusText('Time up! Submitting test…');
    const res = await submitAttemptAPI(attemptId);
    if (res.data || res.isSuccess) {
      navigate(PRIVATE_NAVIGATION.examResult.replace(':attemptId', attemptId));
    }
  }, [attemptId, navigate, submitAttemptAPI]);

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

  // Format Timer text (HH:MM:SS)
  const formatTimer = (totalSeconds: number | null) => {
    if (totalSeconds === null) return '00:00:00';
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Sections list from questions
  const sections = Array.from(new Set(questions.map((q) => q.section?.name || 'General')));

  const filteredQuestions =
    activeSection === 'ALL'
      ? questions
      : questions.filter((q) => (q.section?.name || 'General') === activeSection);

  const currentQuestion = questions[currentIdx];

  // Helper to determine question status badge for palette
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

  // Answer Save & Navigation Handler
  const handleSaveAndNext = async (markForReview = false) => {
    if (!attemptId || !currentQuestion) return;

    const numVal = numericalAnswer !== '' ? Number(numericalAnswer) : null;
    const isMarked = markForReview ? true : isMarkedForReview;

    const payload = {
      examQuestionId: currentQuestion.examQuestionId,
      selectedOptionId: selectedOptionId,
      selectedOptions: selectedOptions.length > 0 ? selectedOptions : null,
      numericalAnswer: numVal,
      isMarkedForReview: isMarked,
    };

    // Optimistic state update
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.examQuestionId]: payload,
    }));

    setSaveStatusText('Saving…');
    await saveAnswerAPI(attemptId, payload);
    setSaveStatusText('Saved');

    // Advance to next question
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  // Clear current response
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

    await saveAnswerAPI(attemptId, payload);
  };

  // Final Submit
  const handleFinalSubmit = async () => {
    if (!attemptId) return;
    setShowSubmitModal(false);
    const res = await submitAttemptAPI(attemptId);
    if (res.data || res.isSuccess) {
      navigate(PRIVATE_NAVIGATION.examResult.replace(':attemptId', attemptId));
    }
  };

  // Calculate palette status counts
  const statusCounts = questions.reduce(
    (acc, q) => {
      const st = getQuestionStatus(q);
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  if (isQuestionsLoading || isStatusLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <Loader label="Preparing Exam Workspace…" />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-xl text-center">
          <AlertCircle className="mx-auto mb-4 text-rose-500" size={48} />
          <h2 className="text-xl font-bold text-slate-900">Exam Error</h2>
          <p className="mt-2 text-sm text-slate-600">{errorMessage}</p>
          <Button className="mt-6 w-full" onClick={() => navigate(PRIVATE_NAVIGATION.dashboard)}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-100 font-sans text-slate-900">
      {/* ── Top Header ────────────────────────────────────────── */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-slate-900 px-6 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-inner">
            <FileText size={20} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">Mock Exam Portal</h1>
            <p className="text-xs text-slate-400">
              Target: {user?.studentProfile?.examTarget ?? 'Competitive Exam'}
            </p>
          </div>
        </div>

        {/* Live Synced Countdown Timer */}
        <div
          className={cn(
            'flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-lg font-bold shadow-sm transition-all',
            timeLeft && timeLeft < 300
              ? 'animate-pulse bg-rose-600 text-white'
              : 'bg-slate-800 text-indigo-400 border border-slate-700',
          )}
        >
          <Clock size={20} />
          <span>{formatTimer(timeLeft)}</span>
        </div>

        {/* User Info & Submit Button */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300 border-r border-slate-700 pr-4">
            <User size={16} className="text-indigo-400" />
            <div>
              <span className="font-semibold text-white">
                {user?.studentProfile?.name ?? 'Candidate'}
              </span>
              <span className="block text-[10px] text-slate-400">
                ID: {user?.studentProfile?.studentId ?? 'STU-001'}
              </span>
            </div>
          </div>

          <Button
            variant="primary"
            className="bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-900/30"
            onClick={() => setShowSubmitModal(true)}
          >
            <Send size={16} className="mr-1.5" />
            Submit Test
          </Button>
        </div>
      </header>

      {/* ── Section Navigation Bar ────────────────────────────── */}
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveSection('ALL')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
              activeSection === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            All Sections
          </button>
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setActiveSection(sec)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                activeSection === sec
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
              )}
            >
              {sec}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1 font-medium text-indigo-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
            {saveStatusText}
          </span>
        </div>
      </div>

      {/* ── Main Exam Body (Question + Palette Grid) ─────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Area: Question Display */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          {currentQuestion && (
            <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-between">
              {/* Question Header Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-indigo-50 px-3 py-1 text-sm font-bold text-indigo-700">
                      Question {currentIdx + 1} of {questions.length}
                    </span>
                    <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {currentQuestion.section?.name ?? 'General'}
                    </span>
                    <span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800">
                      {currentQuestion.questionType?.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <span className="text-emerald-600">+{currentQuestion.marks} Marks</span>
                    <span className="text-rose-500">-{currentQuestion.negativeMarks} Marking</span>
                  </div>
                </div>

                {/* Question Text */}
                <div className="mt-5 text-base font-medium leading-relaxed text-slate-800">
                  {currentQuestion.questionText}
                </div>

                {/* Options Area */}
                <div className="mt-6 space-y-3">
                  {/* Single Choice (SCQ / TF / AR) */}
                  {['SCQ', 'TF', 'AR'].includes(currentQuestion.questionType?.code) &&
                    currentQuestion.options.map((opt) => {
                      const isSelected = selectedOptionId === opt.id;
                      return (
                        <label
                          key={opt.id}
                          onClick={() => setSelectedOptionId(opt.id)}
                          className={cn(
                            'flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all',
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all',
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 text-slate-600',
                            )}
                          >
                            {opt.optionLabel}
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {opt.optionText}
                          </span>
                        </label>
                      );
                    })}

                  {/* Multiple Choice (MCQ) */}
                  {currentQuestion.questionType?.code === 'MCQ' &&
                    currentQuestion.options.map((opt) => {
                      const isSelected = selectedOptions.includes(opt.id);
                      const toggleOption = () => {
                        setSelectedOptions((prev) =>
                          prev.includes(opt.id)
                            ? prev.filter((id) => id !== opt.id)
                            : [...prev, opt.id],
                        );
                      };
                      return (
                        <label
                          key={opt.id}
                          onClick={toggleOption}
                          className={cn(
                            'flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition-all',
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50',
                          )}
                        >
                          <div
                            className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-bold transition-all',
                              isSelected
                                ? 'border-indigo-600 bg-indigo-600 text-white'
                                : 'border-slate-300 text-slate-600',
                            )}
                          >
                            {isSelected ? '✓' : opt.optionLabel}
                          </div>
                          <span className="text-sm font-medium text-slate-700">
                            {opt.optionText}
                          </span>
                        </label>
                      );
                    })}

                  {/* Numerical (NUM) */}
                  {currentQuestion.questionType?.code === 'NUM' && (
                    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
                      <label className="block text-xs font-semibold text-slate-600">
                        Type Numerical Answer:
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={numericalAnswer}
                        onChange={(e) => setNumericalAnswer(e.target.value)}
                        placeholder="e.g. 25.5"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-lg font-bold text-slate-900 shadow-sm focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar Bottom */}
              <div className="mt-6 flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => handleSaveAndNext(true)}
                  >
                    <Bookmark size={16} className="mr-1.5" />
                    Mark for Review & Next
                  </Button>

                  <Button
                    variant="ghost"
                    className="text-slate-500 hover:bg-slate-100"
                    onClick={handleClearResponse}
                  >
                    <RotateCcw size={16} className="mr-1.5" />
                    Clear Response
                  </Button>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous
                  </Button>

                  <Button
                    variant="primary"
                    className="bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-md shadow-indigo-200"
                    onClick={() => handleSaveAndNext(false)}
                  >
                    Save & Next
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Palette Sidebar */}
        <aside className="w-80 shrink-0 border-l border-slate-200 bg-white p-5 flex flex-col justify-between overflow-y-auto">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Question Palette
            </h3>

            {/* Status Legend Grid */}
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-medium text-slate-600">
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                <span>Answered ({statusCounts['ANSWERED'] || 0})</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                <span className="h-3 w-3 rounded-full bg-rose-500"></span>
                <span>Not Ans ({statusCounts['NOT_ANSWERED'] || 0})</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                <span className="h-3 w-3 rounded-full bg-purple-600"></span>
                <span>Marked ({statusCounts['MARKED'] || 0})</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-2">
                <span className="h-3 w-3 rounded-full bg-indigo-600 ring-2 ring-purple-300"></span>
                <span>Ans & Marked ({statusCounts['ANS_MARKED'] || 0})</span>
              </div>
            </div>

            {/* Questions Number Grid */}
            <div className="mt-6">
              <p className="text-xs font-semibold text-slate-500 mb-3">Jump to Question:</p>
              <div className="grid grid-cols-5 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {filteredQuestions.map((q) => {
                  const globalIdx = questions.findIndex(
                    (x) => x.examQuestionId === q.examQuestionId,
                  );
                  const status = getQuestionStatus(q);
                  const isCurrent = globalIdx === currentIdx;

                  let badgeClass = 'status-badge-not-visited';
                  if (status === 'ANSWERED') badgeClass = 'status-badge-answered';
                  if (status === 'NOT_ANSWERED') badgeClass = 'status-badge-not-answered';
                  if (status === 'MARKED') badgeClass = 'status-badge-marked';
                  if (status === 'ANS_MARKED') badgeClass = 'status-badge-ans-marked';

                  return (
                    <button
                      key={q.examQuestionId}
                      onClick={() => setCurrentIdx(globalIdx)}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold transition-all shadow-sm',
                        badgeClass,
                        isCurrent && 'ring-4 ring-indigo-400 ring-offset-2 scale-105',
                      )}
                    >
                      {globalIdx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <Button
              variant="primary"
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 font-bold text-white shadow-md shadow-emerald-200"
              onClick={() => setShowSubmitModal(true)}
            >
              <Send size={16} className="mr-2" />
              Submit Exam
            </Button>
          </div>
        </aside>
      </div>

      {/* ── Submit Confirmation Modal ─────────────────────────── */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <ShieldAlert size={24} />
                <h3 className="text-lg text-slate-900">Confirm Exam Submission</h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to submit your test? Here is your summary:
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm font-semibold">
                <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100 text-emerald-800">
                  <span className="block text-2xl font-extrabold">
                    {statusCounts['ANSWERED'] || 0}
                  </span>
                  <span className="text-xs text-emerald-600 font-medium">Answered Questions</span>
                </div>
                <div className="rounded-xl bg-rose-50 p-4 border border-rose-100 text-rose-800">
                  <span className="block text-2xl font-extrabold">
                    {statusCounts['NOT_ANSWERED'] || 0}
                  </span>
                  <span className="text-xs text-rose-600 font-medium">Unanswered Questions</span>
                </div>
                <div className="rounded-xl bg-purple-50 p-4 border border-purple-100 text-purple-800">
                  <span className="block text-2xl font-extrabold">
                    {statusCounts['MARKED'] || 0}
                  </span>
                  <span className="text-xs text-purple-600 font-medium">Marked for Review</span>
                </div>
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-slate-800">
                  <span className="block text-2xl font-extrabold">
                    {statusCounts['NOT_VISITED'] || 0}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Not Visited</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
              <Button variant="ghost" onClick={() => setShowSubmitModal(false)}>
                Continue Exam
              </Button>
              <Button
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-500 font-bold text-white px-6 shadow-lg shadow-emerald-200"
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting…' : 'Yes, Final Submit'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamInterfacePage;
