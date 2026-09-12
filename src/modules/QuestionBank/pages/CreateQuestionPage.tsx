import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
} from '../services/questionBank.service';
import { useGetLanguagesAPI } from '@/modules/RegionalLanguage/services/regionalLanguage.service';
import type { CreateQuestionPayload, NamedEntity } from '../types/questionBank.types';
import { QuestionDifficultyEnum, QuestionTypeEnum } from '../types/questionBank.types';
import { QuestionPreviewCard } from '../components/QuestionPreviewCard';
import Button from '@/components/ui/Button';
import { isAllowedSubject, formatSubjectDisplayName } from '@/constants/subjects.constant';

const CreateQuestionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── Hierarchy State ──────────────────────────────────────────
  const [subjects, setSubjects] = useState<NamedEntity[]>([]);
  const [chapters, setChapters] = useState<NamedEntity[]>([]);
  const [languages, setLanguages] = useState<
    Array<{ id: string; name: string; isDefault?: boolean }>
  >([]);

  const { getSubjectsAPI } = useGetSubjectsAPI();
  const { getChaptersAPI, isLoading: isLoadingChapters } = useGetChaptersAPI();
  const { getLanguagesAPI } = useGetLanguagesAPI();
  const { createQuestionAPI, isLoading: isCreating } = useCreateQuestionAPI();
  const { submitQuestionAPI } = useSubmitQuestionAPI();

  // ─── Payload State ────────────────────────────────────────────
  const [formData, setFormData] = useState<CreateQuestionPayload>({
    subjectId: '',
    chapterId: '',
    topicName: '',
    subTopicName: '',
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

  // ─── Load Languages (Default: English) ────────────────────────
  useEffect(() => {
    getLanguagesAPI().then((res) => {
      const raw = res?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.data)
          ? (raw as any).data
          : [];
      if (list && list.length > 0) {
        setLanguages(list);
        const englishLang =
          list.find(
            (l: any) => l.code === 'en' || l.name?.toUpperCase() === 'ENGLISH' || l.isDefault,
          ) || list[0];

        setFormData((prev) => ({
          ...prev,
          defaultLanguageId: englishLang.id,
          translations: [
            {
              languageId: englishLang.id,
              questionText: prev.translations[0]?.questionText || '',
              passageText: prev.translations[0]?.passageText || '',
              assertionText: prev.translations[0]?.assertionText || '',
              reasonText: prev.translations[0]?.reasonText || '',
              explanation: prev.translations[0]?.explanation || '',
            },
          ],
        }));
      }
    });
  }, [getLanguagesAPI]);

  // ─── Load Subjects directly (Filtered for Core Subjects) ──────
  useEffect(() => {
    getSubjectsAPI().then((res) => {
      const raw = res?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.data)
          ? (raw as any).data
          : [];
      const filtered = list.filter((s: any) => isAllowedSubject(s.name));

      // Remove duplicates by name if any
      const uniqueSubjects: NamedEntity[] = [];
      const seenNames = new Set<string>();
      filtered.forEach((s: any) => {
        const normalized = s.name.toUpperCase().trim();
        if (!seenNames.has(normalized)) {
          seenNames.add(normalized);
          uniqueSubjects.push(s);
        }
      });

      setSubjects(uniqueSubjects);
    });
  }, [getSubjectsAPI]);

  // ─── Load Chapters dynamically based on selected Subject ─────
  useEffect(() => {
    if (formData.subjectId) {
      getChaptersAPI(formData.subjectId).then((res) => {
        const raw = res?.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as any)?.data)
            ? (raw as any).data
            : [];
        setChapters(list);
      });
    } else {
      setChapters([]);
    }
  }, [formData.subjectId, getChaptersAPI]);

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
        return 'Please provide either a numerical exact value or a valid numerical range.';
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

  const handlePrev = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
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

  // ─── Save Question ─────────────────────────────────────────────
  const handleSave = async (submitForReview = false) => {
    setErrorMsg(null);

    const payload: CreateQuestionPayload = {
      ...formData,
      topicName: formData.topicName?.trim() || undefined,
      subTopicName: formData.subTopicName?.trim() || undefined,
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

    navigate(`${routePrefix}/question-bank`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${routePrefix}/question-bank`)}
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
                    topicName: '',
                    subTopicName: '',
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSubjectDisplayName(s.name)}
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
                disabled={!formData.subjectId || isLoadingChapters}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    chapterId: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 disabled:opacity-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">
                  {isLoadingChapters
                    ? 'Loading chapters dynamically...'
                    : !formData.subjectId
                      ? 'Select Subject first'
                      : chapters.length === 0
                        ? 'No chapters found for this subject'
                        : 'Select Chapter'}
                </option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic (Text Field) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Topic (Optional)</label>
              <input
                type="text"
                value={formData.topicName || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    topicName: e.target.value,
                  }))
                }
                placeholder="e.g., Kinematics, Chemical Bonding, Cell Biology"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
              />
            </div>

            {/* Sub-Topic (Text Field) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Sub-Topic (Optional)</label>
              <input
                type="text"
                value={formData.subTopicName || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    subTopicName: e.target.value,
                  }))
                }
                placeholder="e.g., Projectile Motion, Hybridization, Mitosis"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400"
              />
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                {Object.values(QuestionDifficultyEnum).map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>

            {/* Marks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Correct Marks (+)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.marks ?? 4}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, marks: parseFloat(e.target.value) || 0 }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Negative Marks */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Negative Marks (-)</label>
              <input
                type="number"
                min="0"
                step="0.25"
                value={formData.negativeMarks ?? 1}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    negativeMarks: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Default Language Selection */}
          <div className="pt-4 border-t border-slate-100">
            <div className="space-y-1.5 max-w-sm">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Languages size={14} className="text-indigo-600" />
                Default Creation Language <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.defaultLanguageId}
                onChange={(e) => {
                  const langId = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    defaultLanguageId: langId,
                    translations: [
                      {
                        ...prev.translations[0],
                        languageId: langId,
                      },
                    ],
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select Language</option>
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleNext} className="px-6 py-2.5 bg-indigo-600 text-white font-bold">
              Continue to Content & Options &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 2: QUESTION TYPE, STATEMENTS & OPTIONS */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileQuestion size={18} className="text-indigo-600" />
              2. Question Type & Content Studio
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              Editing primary text in{' '}
              <strong className="text-indigo-600">
                {languages.find((l) => l.id === formData.defaultLanguageId)?.name || 'Default Language'}
              </strong>
            </span>
          </div>

          {/* Question Type Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Question Pattern / Type</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { type: QuestionTypeEnum.SINGLE_CORRECT, label: 'Single Correct MCQ' },
                { type: QuestionTypeEnum.MULTIPLE_CORRECT, label: 'Multiple Correct' },
                { type: QuestionTypeEnum.NUMERICAL, label: 'Numerical Value' },
                { type: QuestionTypeEnum.ASSERTION_REASON, label: 'Assertion & Reason' },
                { type: QuestionTypeEnum.CASE_BASED, label: 'Case / Passage Based' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      type: item.type,
                      answer: { ...prev.answer, answerType: item.type },
                    }))
                  }
                  className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all ${
                    formData.type === item.type
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 ring-2 ring-indigo-600/20 shadow-sm'
                      : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Case Based Passage Input */}
          {formData.type === QuestionTypeEnum.CASE_BASED && (
            <div className="space-y-1.5 rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4">
              <label className="text-xs font-bold text-indigo-950 block">
                Passage / Case Study Text <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={formData.passage || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    passage: e.target.value,
                    translations: [
                      {
                        ...prev.translations[0],
                        passageText: e.target.value,
                      },
                    ],
                  }))
                }
                placeholder="Enter the background paragraph or experiment details here..."
                className="w-full rounded-xl border border-indigo-200 bg-white p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}

          {/* Assertion & Reason Inputs */}
          {formData.type === QuestionTypeEnum.ASSERTION_REASON && (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/30 p-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-950 block">
                  Assertion (A) Statement <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.assertion || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      assertion: e.target.value,
                      translations: [
                        {
                          ...prev.translations[0],
                          assertionText: e.target.value,
                        },
                      ],
                    }))
                  }
                  placeholder="e.g., Light travels faster in vacuum than in glass."
                  className="w-full rounded-xl border border-amber-200 bg-white p-3 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-950 block">
                  Reason (R) Statement <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.reason || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                      translations: [
                        {
                          ...prev.translations[0],
                          reasonText: e.target.value,
                        },
                      ],
                    }))
                  }
                  placeholder="e.g., The refractive index of vacuum is 1."
                  className="w-full rounded-xl border border-amber-200 bg-white p-3 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>
          )}

          {/* Main Question Statement */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Question Statement <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={formData.translations[0]?.questionText || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  translations: [
                    {
                      ...prev.translations[0],
                      questionText: e.target.value,
                    },
                  ],
                }))
              }
              placeholder="Enter complete question statement here (LaTeX supported: $\\int x dx$, etc.)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Options Studio (MCQ / Assertion / Multiple Correct) */}
          {(formData.type === QuestionTypeEnum.SINGLE_CORRECT ||
            formData.type === QuestionTypeEnum.MULTIPLE_CORRECT ||
            formData.type === QuestionTypeEnum.ASSERTION_REASON) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Answer Options (Click checkbox/radio to mark correct)
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  <Plus size={14} /> Add Option
                </button>
              </div>

              <div className="space-y-2.5">
                {(formData.options || []).map((opt, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                      opt.isCorrect
                        ? 'border-emerald-500 bg-emerald-50/40 ring-1 ring-emerald-500/30'
                        : 'border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSetOptionCorrect(idx)}
                      className={`h-7 w-7 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                        opt.isCorrect
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'
                      }`}
                    >
                      {opt.optionKey || String.fromCharCode(65 + idx)}
                    </button>

                    <input
                      type="text"
                      value={opt.optionLabel || opt.optionText || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData((prev) => {
                          const updated = [...(prev.options || [])];
                          updated[idx] = {
                            ...updated[idx],
                            optionLabel: val,
                            optionText: val,
                          };
                          return { ...prev, options: updated };
                        });
                      }}
                      placeholder={`Enter text for Option ${opt.optionKey || String.fromCharCode(65 + idx)}...`}
                      className="flex-1 rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />

                    {opt.isCorrect && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-lg">
                        Correct Answer
                      </span>
                    )}

                    {(formData.options || []).length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Numerical Input Configuration */}
          {formData.type === QuestionTypeEnum.NUMERICAL && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-5 space-y-4">
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Numerical Evaluation Criteria
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Exact Value</label>
                  <input
                    type="number"
                    step="any"
                    value={formData.answer?.numericalAnswer ?? ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        answer: {
                          ...prev.answer,
                          numericalAnswer:
                            e.target.value === '' ? undefined : parseFloat(e.target.value),
                        },
                      }))
                    }
                    placeholder="e.g., 9.8"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Tolerance (+/- Range)
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
                          numericalTolerance: parseFloat(e.target.value) || 0,
                        },
                      }))
                    }
                    placeholder="e.g., 0.05"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Accepted Range (Optional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Min"
                      value={formData.answer?.numericalRangeStart ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          answer: {
                            ...prev.answer,
                            numericalRangeStart:
                              e.target.value === '' ? undefined : parseFloat(e.target.value),
                          },
                        }))
                      }
                      className="w-1/2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">to</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="Max"
                      value={formData.answer?.numericalRangeEnd ?? ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          answer: {
                            ...prev.answer,
                            numericalRangeEnd:
                              e.target.value === '' ? undefined : parseFloat(e.target.value),
                          },
                        }))
                      }
                      className="w-1/2 rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={handlePrev}>
              &larr; Back to Academic Info
            </Button>
            <Button onClick={handleNext} className="bg-indigo-600 text-white font-bold px-6">
              Continue to Solution & Live Simulation &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 3: EXPLANATION & LIVE STUDENT SIMULATION */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              3. Solution Rationale & Student Preview
            </h2>

            {/* Explanation Studio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Detailed Solution & Pedagogical Explanation
              </label>
              <textarea
                rows={4}
                value={formData.explanation?.explanation || formData.translations[0]?.explanation || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData((prev) => ({
                    ...prev,
                    explanation: { explanation: val },
                    translations: [
                      {
                        ...prev.translations[0],
                        explanation: val,
                      },
                    ],
                  }));
                }}
                placeholder="Provide a step-by-step breakdown explaining why the answer is correct..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Live Interactive Preview Box */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Eye size={15} className="text-indigo-600" />
                Live Candidate Interface Preview
              </label>
              <QuestionPreviewCard
                question={formData}
                selectedLanguageId={formData.defaultLanguageId}
                showSolution={true}
              />
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-slate-100">
              <Button variant="outline" onClick={handlePrev}>
                &larr; Back to Question Editor
              </Button>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => handleSave(false)}
                  disabled={isCreating}
                  className="w-full sm:w-auto font-bold"
                >
                  <Save size={15} className="mr-2" /> Save as Draft
                </Button>
                <Button
                  onClick={() => handleSave(true)}
                  disabled={isCreating}
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-100"
                >
                  <Send size={15} className="mr-2" /> Submit for Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateQuestionPage;
