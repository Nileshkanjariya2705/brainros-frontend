import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Layers,
  FileQuestion,
  Plus,
  Trash2,
  Check,
  Send,
  Save,
  Languages,
  Eye,
} from 'lucide-react';
import {
  useCreateQuestionAPI,
  useSubmitQuestionAPI,
  useGetSubjectsAPI,
  useGetChaptersAPI,
  useGetTopicsAPI,
  useGetSubTopicsAPI,
} from '../services/questionBank.service';
import { useGetLanguagesAPI } from '@/modules/RegionalLanguage/services/regionalLanguage.service';
import type { CreateQuestionPayload, NamedEntity } from '../types/questionBank.types';
import { QuestionDifficultyEnum, QuestionTypeEnum } from '../types/questionBank.types';
import { QuestionPreviewCard } from '../components/QuestionPreviewCard';
import Button from '@/components/ui/Button';

const CreateQuestionPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── Hierarchy State ──────────────────────────────────────────
  const [subjects, setSubjects] = useState<NamedEntity[]>([]);
  const [chapters, setChapters] = useState<NamedEntity[]>([]);
  const [topics, setTopics] = useState<NamedEntity[]>([]);
  const [subTopics, setSubTopics] = useState<NamedEntity[]>([]);
  const [languages, setLanguages] = useState<
    Array<{ id: string; name: string; isDefault?: boolean }>
  >([]);

  const { getSubjectsAPI } = useGetSubjectsAPI();
  const { getChaptersAPI } = useGetChaptersAPI();
  const { getTopicsAPI } = useGetTopicsAPI();
  const { getSubTopicsAPI } = useGetSubTopicsAPI();
  const { getLanguagesAPI } = useGetLanguagesAPI();
  const { createQuestionAPI, isLoading: isCreating } = useCreateQuestionAPI();
  const { submitQuestionAPI } = useSubmitQuestionAPI();

  // ─── Payload State ────────────────────────────────────────────
  const [formData, setFormData] = useState<CreateQuestionPayload>({
    subjectId: '',
    chapterId: '',
    topicId: '',
    subTopicId: '',
    difficultyLevel: QuestionDifficultyEnum.MEDIUM,
    type: QuestionTypeEnum.SINGLE_CORRECT,
    defaultLanguageId: '',
    marks: 4,
    negativeMarks: 1,
    passage: '',
    assertion: '',
    reason: '',
    translations: [
      {
        languageId: '',
        questionText: '',
        passageText: '',
        assertionText: '',
        reasonText: '',
        explanation: '',
      },
    ],
    options: [
      { optionKey: 'A', optionLabel: '', optionText: '', isCorrect: true, displayOrder: 0 },
      { optionKey: 'B', optionLabel: '', optionText: '', isCorrect: false, displayOrder: 1 },
      { optionKey: 'C', optionLabel: '', optionText: '', isCorrect: false, displayOrder: 2 },
      { optionKey: 'D', optionLabel: '', optionText: '', isCorrect: false, displayOrder: 3 },
    ],
    answer: {
      answerType: QuestionTypeEnum.SINGLE_CORRECT,
      numericalAnswer: undefined,
      numericalTolerance: 0,
      numericalRangeStart: undefined,
      numericalRangeEnd: undefined,
    },
    explanation: {
      explanation: '',
      mediaUrl: '',
    },
  });

  // Active translation tab in step 2
  const [activeTranslationIndex, setActiveTranslationIndex] = useState(0);

  // ─── Load Languages ──────────────────────────────────────────
  useEffect(() => {
    getLanguagesAPI().then(({ data }) => {
      if (data && data.length > 0) {
        setLanguages(data);
        const defaultLang = (data as any[]).find((l) => l.isDefault || l.code === 'en') || data[0];
        setFormData((prev) => ({
          ...prev,
          defaultLanguageId: prev.defaultLanguageId || defaultLang.id,
          translations: prev.translations.map((t, idx) =>
            idx === 0 && !t.languageId ? { ...t, languageId: defaultLang.id } : t,
          ),
        }));
      }
    });
  }, [getLanguagesAPI]);

  // ─── Load Hierarchy Cascades ──────────────────────────────────
  useEffect(() => {
    getSubjectsAPI().then(({ data }) => setSubjects(data || []));
  }, [getSubjectsAPI]);

  useEffect(() => {
    if (formData.subjectId) {
      getChaptersAPI(formData.subjectId).then(({ data }) => setChapters(data || []));
    } else {
      setChapters([]);
    }
  }, [formData.subjectId, getChaptersAPI]);

  useEffect(() => {
    if (formData.chapterId) {
      getTopicsAPI(formData.chapterId).then(({ data }) => setTopics(data || []));
    } else {
      setTopics([]);
    }
  }, [formData.chapterId, getTopicsAPI]);

  useEffect(() => {
    if (formData.topicId) {
      getSubTopicsAPI(formData.topicId).then(({ data }) => setSubTopics(data || []));
    } else {
      setSubTopics([]);
    }
  }, [formData.topicId, getSubTopicsAPI]);

  // ─── Step 1 Validation ─────────────────────────────────────────
  const validateStep1 = () => {
    if (!formData.subjectId) return 'Please select a Subject.';
    if (!formData.chapterId) return 'Please select a Chapter.';
    if (!formData.defaultLanguageId) return 'Please select a Default Language.';
    return null;
  };

  // ─── Step 2 Validation ─────────────────────────────────────────
  const validateStep2 = () => {
    const primaryText = formData.translations[0]?.questionText?.trim();
    if (!primaryText) return 'Primary question statement is required.';

    if (formData.type === QuestionTypeEnum.CASE_BASED && !formData.passage?.trim()) {
      return 'Case Based question requires a passage text.';
    }

    if (formData.type === QuestionTypeEnum.ASSERTION_REASON) {
      if (!formData.assertion?.trim() || !formData.reason?.trim()) {
        return 'Both Assertion (A) and Reason (R) statements are required.';
      }
    }

    if (
      formData.type === QuestionTypeEnum.SINGLE_CORRECT ||
      formData.type === QuestionTypeEnum.MULTIPLE_CORRECT ||
      formData.type === QuestionTypeEnum.ASSERTION_REASON
    ) {
      const validOptions = (formData.options || []).filter((o) =>
        (o.optionLabel || o.optionText)?.trim(),
      );
      if (validOptions.length < 2) {
        return 'Please provide at least 2 options with labels.';
      }
      const hasCorrect = formData.options?.some((o) => o.isCorrect);
      if (!hasCorrect) {
        return 'Please mark at least one option as the correct answer.';
      }
    }

    if (formData.type === QuestionTypeEnum.NUMERICAL) {
      const hasDirect =
        formData.answer?.numericalAnswer !== undefined && formData.answer?.numericalAnswer !== null;
      const hasRange =
        formData.answer?.numericalRangeStart !== undefined &&
        formData.answer?.numericalRangeEnd !== undefined;
      if (!hasDirect && !hasRange) {
        return 'Please specify a numerical answer value or tolerance range.';
      }
    }

    return null;
  };

  const handleNext = () => {
    setErrorMsg(null);
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) {
        setErrorMsg(err);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      const err = validateStep2();
      if (err) {
        setErrorMsg(err);
        return;
      }
      setCurrentStep(3);
    }
  };

  // ─── Option Helpers ────────────────────────────────────────────
  const handleAddOption = () => {
    const nextKey = String.fromCharCode(65 + (formData.options?.length || 0));
    setFormData((prev) => ({
      ...prev,
      options: [
        ...(prev.options || []),
        {
          optionKey: nextKey,
          optionLabel: '',
          optionText: '',
          isCorrect: false,
          displayOrder: prev.options?.length || 0,
        },
      ],
    }));
  };

  const handleRemoveOption = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      options: (prev.options || []).filter((_, i) => i !== index),
    }));
  };

  const handleSetOptionCorrect = (index: number) => {
    setFormData((prev) => {
      const isSingle =
        prev.type === QuestionTypeEnum.SINGLE_CORRECT ||
        prev.type === QuestionTypeEnum.ASSERTION_REASON;

      const updated = (prev.options || []).map((opt, i) => ({
        ...opt,
        isCorrect: isSingle ? i === index : i === index ? !opt.isCorrect : opt.isCorrect,
      }));
      return { ...prev, options: updated };
    });
  };

  // ─── Translation Tab Helpers ───────────────────────────────────
  const handleAddLanguageTab = (languageId: string) => {
    if (formData.translations.some((t) => t.languageId === languageId)) return;
    setFormData((prev) => ({
      ...prev,
      translations: [
        ...prev.translations,
        {
          languageId,
          questionText: '',
          passageText: '',
          assertionText: '',
          reasonText: '',
          explanation: '',
        },
      ],
    }));
    setActiveTranslationIndex(formData.translations.length);
  };

  // ─── Save Question ─────────────────────────────────────────────
  const handleSave = async (submitForReview = false) => {
    setErrorMsg(null);

    const payload: CreateQuestionPayload = {
      ...formData,
      topicId: formData.topicId || undefined,
      subTopicId: formData.subTopicId || undefined,
      options: (formData.options || []).map((o, idx) => ({
        ...o,
        optionText: o.optionLabel || o.optionText,
        displayOrder: idx,
      })),
      explanation: formData.explanation?.explanation
        ? formData.explanation
        : formData.translations[0]?.explanation
          ? { explanation: formData.translations[0].explanation }
          : undefined,
    };

    const { data: created, error } = await createQuestionAPI(payload);

    if (error) {
      setErrorMsg(typeof error === 'string' ? error : (error as any).message || 'Creation failed');
      return;
    }

    if (created && submitForReview) {
      await submitQuestionAPI(created.id, 'Submitted directly upon creation');
    }

    navigate('/question-bank');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/question-bank')}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Create New Question
            </h1>
            <p className="text-xs text-slate-500">
              Step {currentStep} of 3 —{' '}
              {currentStep === 1
                ? 'Academic Scope & Scoring'
                : currentStep === 2
                  ? 'Question Type & Content'
                  : 'Solution & Live Simulation'}
            </p>
          </div>
        </div>

        {/* Step Wizard Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs transition-all ${
                currentStep === step
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : currentStep > step
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              {currentStep > step ? <Check size={14} /> : step}
            </div>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 shadow-sm animate-in fade-in duration-200">
          {errorMsg}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 1: ACADEMIC SCOPE & METADATA */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" />
            1. Academic Classification & Scoring
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    subjectId: e.target.value,
                    chapterId: '',
                    topicId: '',
                    subTopicId: '',
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Chapter */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Chapter <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.chapterId}
                disabled={!formData.subjectId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    chapterId: e.target.value,
                    topicId: '',
                    subTopicId: '',
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 disabled:opacity-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select Chapter</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Topic (Optional)</label>
              <select
                value={formData.topicId}
                disabled={!formData.chapterId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    topicId: e.target.value,
                    subTopicId: '',
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 disabled:opacity-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select Topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sub-Topic (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Sub-Topic (Optional)</label>
              <select
                value={formData.subTopicId}
                disabled={!formData.topicId}
                onChange={(e) => setFormData((prev) => ({ ...prev, subTopicId: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 disabled:opacity-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select Sub-Topic</option>
                {subTopics.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Difficulty Level</label>
              <select
                value={formData.difficultyLevel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    difficultyLevel: e.target.value as QuestionDifficultyEnum,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value={QuestionDifficultyEnum.EASY}>Easy</option>
                <option value={QuestionDifficultyEnum.MEDIUM}>Medium</option>
                <option value={QuestionDifficultyEnum.HARD}>Hard</option>
                <option value={QuestionDifficultyEnum.VERY_HARD}>Very Hard</option>
              </select>
            </div>

            {/* Marks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Marks (+ Correct)</label>
              <input
                type="number"
                min={0}
                value={formData.marks}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, marks: Number(e.target.value) }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Negative Marks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Negative Marks (- Wrong)
              </label>
              <input
                type="number"
                min={0}
                value={formData.negativeMarks}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, negativeMarks: Number(e.target.value) }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Continue to Step 2 →
            </Button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 2: QUESTION TYPE & CONTENT AUTHORING */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileQuestion size={18} className="text-indigo-600" />
            2. Question Type & Question Content
          </h2>

          {/* Question Type Visual Selection Tabs */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Select Question Format</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              {[
                { type: QuestionTypeEnum.SINGLE_CORRECT, label: 'Single Choice MCQ' },
                { type: QuestionTypeEnum.MULTIPLE_CORRECT, label: 'Multiple Choice MCQ' },
                { type: QuestionTypeEnum.NUMERICAL, label: 'Numerical Value' },
                { type: QuestionTypeEnum.ASSERTION_REASON, label: 'Assertion-Reason' },
                { type: QuestionTypeEnum.MATCH_FOLLOWING, label: 'Match Following' },
                { type: QuestionTypeEnum.CASE_BASED, label: 'Case / Passage' },
              ].map((item) => {
                const isSelected = formData.type === item.type;
                return (
                  <button
                    type="button"
                    key={item.type}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        type: item.type,
                        answer: { ...prev.answer, answerType: item.type },
                      }))
                    }
                    className={`rounded-2xl border p-3 text-center text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20 shadow-sm'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multilingual Translation Tabs */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Languages size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Question Text in Languages
                </span>
              </div>

              {/* Add Language dropdown */}
              <div className="flex items-center gap-1.5">
                {languages.map((lang) => {
                  const isAdded = formData.translations.some((t) => t.languageId === lang.id);
                  if (isAdded) return null;
                  return (
                    <button
                      type="button"
                      key={lang.id}
                      onClick={() => handleAddLanguageTab(lang.id)}
                      className="rounded-lg bg-indigo-50 px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                    >
                      + Add {lang.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Language Tabs */}
            <div className="flex gap-2">
              {formData.translations.map((tr, idx) => {
                const langName =
                  languages.find((l) => l.id === tr.languageId)?.name || `Language ${idx + 1}`;
                const isActive = activeTranslationIndex === idx;
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => setActiveTranslationIndex(idx)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {langName}
                  </button>
                );
              })}
            </div>

            {/* Case Based Passage (if active) */}
            {formData.type === QuestionTypeEnum.CASE_BASED && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold text-indigo-900 block">
                  Passage / Case Narrative <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={formData.passage}
                  onChange={(e) => setFormData((prev) => ({ ...prev, passage: e.target.value }))}
                  placeholder="Enter the case study description or reading comprehension passage..."
                  className="w-full rounded-2xl border border-indigo-200 bg-indigo-50/30 p-3.5 text-xs text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            )}

            {/* Assertion & Reason (if active) */}
            {formData.type === QuestionTypeEnum.ASSERTION_REASON && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-900 block">
                    Assertion (A) Statement <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.assertion}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, assertion: e.target.value }))
                    }
                    placeholder="Enter assertion statement..."
                    className="w-full rounded-2xl border border-amber-200 bg-amber-50/30 p-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-900 block">
                    Reason (R) Statement <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.reason}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter reason statement..."
                    className="w-full rounded-2xl border border-amber-200 bg-amber-50/30 p-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Question Text in active language */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-800 block">
                Question Statement (
                {languages.find(
                  (l) => l.id === formData.translations[activeTranslationIndex]?.languageId,
                )?.name || 'Active Language'}
                ) <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.translations[activeTranslationIndex]?.questionText || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => {
                    const trs = [...prev.translations];
                    trs[activeTranslationIndex] = {
                      ...trs[activeTranslationIndex],
                      questionText: val,
                    };
                    return { ...prev, translations: trs };
                  });
                }}
                placeholder="Enter the question text..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 leading-relaxed"
              />
            </div>
          </div>

          {/* Type-Specific Options & Answers Editor */}
          {(formData.type === QuestionTypeEnum.SINGLE_CORRECT ||
            formData.type === QuestionTypeEnum.MULTIPLE_CORRECT ||
            formData.type === QuestionTypeEnum.ASSERTION_REASON ||
            formData.type === QuestionTypeEnum.CASE_BASED) && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Options & Correct Answer Selection
                </label>
                <Button variant="outline" size="sm" onClick={handleAddOption} className="text-xs">
                  <Plus size={13} className="mr-1" /> Add Option
                </Button>
              </div>

              <div className="space-y-3">
                {formData.options?.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                      opt.isCorrect
                        ? 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    {/* Correct Toggle */}
                    <button
                      type="button"
                      onClick={() => handleSetOptionCorrect(idx)}
                      title={
                        opt.isCorrect
                          ? 'Marked as Correct Answer'
                          : 'Click to mark as Correct Answer'
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs transition-colors shrink-0 ${
                        opt.isCorrect
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white border border-slate-300 text-slate-600 hover:border-emerald-500'
                      }`}
                    >
                      {opt.optionKey}
                    </button>

                    {/* Option Label input */}
                    <input
                      type="text"
                      value={opt.optionLabel || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => {
                          const opts = [...(prev.options || [])];
                          opts[idx] = { ...opts[idx], optionLabel: val, optionText: val };
                          return { ...prev, options: opts };
                        });
                      }}
                      placeholder={`Enter text for Option ${opt.optionKey}...`}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />

                    {/* Delete Option button */}
                    {(formData.options?.length || 0) > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Numerical Input Editor */}
          {formData.type === QuestionTypeEnum.NUMERICAL && (
            <div className="space-y-4 pt-4 border-t border-slate-100 p-5 rounded-2xl bg-slate-50/70 border border-slate-200">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Numerical Answer Configuration
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Exact Numerical Value
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.answer?.numericalAnswer ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        answer: {
                          ...prev.answer,
                          numericalAnswer: e.target.value ? Number(e.target.value) : undefined,
                        },
                      }))
                    }
                    placeholder="e.g. 3.14 or 100"
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-indigo-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Tolerance (± margin)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.answer?.numericalTolerance ?? 0}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        answer: {
                          ...prev.answer,
                          numericalTolerance: Number(e.target.value),
                        },
                      }))
                    }
                    placeholder="e.g. 0.05"
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              ← Back to Step 1
            </Button>
            <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Continue to Step 3 (Preview) →
            </Button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 3: EXPLANATION & LIVE SIMULATION PREVIEW */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          {/* Solution Editor Card */}
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              3. Solution Explanation & Verification
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Detailed Step-by-Step Explanation & Derivation
              </label>
              <textarea
                rows={4}
                value={
                  formData.explanation?.explanation || formData.translations[0]?.explanation || ''
                }
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    explanation: { ...prev.explanation, explanation: val },
                  }));
                }}
                placeholder="Explain why the correct answer is right and provide formulas or scientific context..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 leading-relaxed"
              />
            </div>
          </div>

          {/* 9 Mandatory Languages Translation Status Checklist */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Languages size={18} className="text-indigo-600" />
                <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  9 Mandatory Languages Completeness Status
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-500">
                All 9 regional languages must be translated before publishing
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2 pt-1">
              {languages.map((lang) => {
                const tr = formData.translations.find((t) => t.languageId === lang.id);
                const isComplete = Boolean(tr?.questionText?.trim());
                return (
                  <div
                    key={lang.id}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all ${
                      isComplete
                        ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900 shadow-sm'
                        : 'border-rose-200 bg-rose-50/30 text-rose-800'
                    }`}
                  >
                    <span className="text-xs font-bold">{lang.name}</span>
                    <span className="text-sm mt-0.5">{isComplete ? '✅' : '❌'}</span>
                    <span className="text-[9px] font-medium text-slate-500 mt-0.5">
                      {isComplete ? 'Complete' : 'Missing'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Student Test Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
              <Eye size={15} className="text-indigo-600" />
              <span>Real-Time Student Test Simulation</span>
            </div>
            <QuestionPreviewCard
              question={formData}
              selectedLanguageId={formData.defaultLanguageId}
              showSolution={true}
            />
          </div>

          {/* Action Submission Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              ← Back to Step 2
            </Button>

            <div className="flex items-center gap-2.5">
              <Button
                variant="secondary"
                onClick={() => handleSave(false)}
                isLoading={isCreating}
                className="flex items-center gap-1.5"
              >
                <Save size={15} />
                <span>Save as Draft</span>
              </Button>

              <Button
                onClick={() => handleSave(true)}
                isLoading={isCreating}
                className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
              >
                <Send size={15} />
                <span>Save & Submit for Review</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateQuestionPage;
