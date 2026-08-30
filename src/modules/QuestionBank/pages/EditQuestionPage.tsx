import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  GitBranch,
  Save,
  Layers,
  FileQuestion,
  Plus,
  Trash2,
  Eye,
  AlertTriangle,
  Languages,
} from 'lucide-react';
import {
  useGetQuestionByIdAPI,
  useUpdateQuestionAPI,
  useGetSubjectsAPI,
  useGetChaptersAPI,
  useGetTopicsAPI,
  useGetSubTopicsAPI,
} from '../services/questionBank.service';
import { useGetLanguagesAPI } from '@/modules/RegionalLanguage/services/regionalLanguage.service';
import type { CreateQuestionPayload, NamedEntity } from '../types/questionBank.types';
import {
  QuestionDifficultyEnum,
  QuestionTypeEnum,
  QuestionStatus,
} from '../types/questionBank.types';
import { QuestionPreviewCard } from '../components/QuestionPreviewCard';
import Button from '@/components/ui/Button';
import { isAllowedSubject, formatSubjectDisplayName } from '@/constants/subjects.constant';

const EditQuestionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = location.pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isApprovedOriginal, setIsApprovedOriginal] = useState(false);
  const [originalVersion, setOriginalVersion] = useState(1);

  // Hierarchy Data
  const [subjects, setSubjects] = useState<NamedEntity[]>([]);
  const [allSubjects, setAllSubjects] = useState<any[]>([]);
  const [examTargets, setExamTargets] = useState<NamedEntity[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [chapters, setChapters] = useState<NamedEntity[]>([]);
  const [topics, setTopics] = useState<NamedEntity[]>([]);
  const [subTopics, setSubTopics] = useState<NamedEntity[]>([]);
  const [languages, setLanguages] = useState<Array<{ id: string; name: string }>>([]);

  const { getQuestionByIdAPI, isLoading: isFetching } = useGetQuestionByIdAPI();
  const { updateQuestionAPI, isLoading: isUpdating } = useUpdateQuestionAPI();
  const { getSubjectsAPI } = useGetSubjectsAPI();
  const { getChaptersAPI } = useGetChaptersAPI();
  const { getTopicsAPI } = useGetTopicsAPI();
  const { getSubTopicsAPI } = useGetSubTopicsAPI();
  const { getLanguagesAPI } = useGetLanguagesAPI();

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
    options: [],
    answer: {},
    explanation: { explanation: '' },
  });

  const [activeTranslationIndex, setActiveTranslationIndex] = useState(0);

  // Load languages
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
      }
    });
  }, [getLanguagesAPI]);

  // 1. Fetch Question by ID
  useEffect(() => {
    if (!id) return;
    getQuestionByIdAPI(id).then((res) => {
      const data = (res?.data as any)?.data || res?.data;
      if (data) {
        setIsApprovedOriginal(data.status === QuestionStatus.APPROVED);
        setOriginalVersion(data.version);

        setFormData({
          subjectId: data.subjectId,
          chapterId: data.chapterId,
          topicId: data.topicId || '',
          subTopicId: data.subTopicId || '',
          difficultyLevel: data.difficultyLevel,
          type: data.type,
          defaultLanguageId: data.defaultLanguageId,
          marks: data.marks,
          negativeMarks: data.negativeMarks,
          passage: data.passage || '',
          assertion: data.assertion || '',
          reason: data.reason || '',
          translations:
            data.translations && data.translations.length > 0
              ? data.translations.map((t: any) => ({
                  languageId: t.languageId,
                  questionText: t.questionText,
                  passageText: t.passageText || '',
                  assertionText: t.assertionText || '',
                  reasonText: t.reasonText || '',
                  explanation: t.explanation || '',
                }))
              : [
                  {
                    languageId: data.defaultLanguageId,
                    questionText: '',
                    explanation: '',
                  },
                ],
          options: data.options?.map((o: any) => ({
            id: o.id,
            optionKey: o.optionKey,
            optionLabel: o.optionLabel || o.optionText || '',
            optionText: o.optionText || '',
            isCorrect: o.isCorrect,
            displayOrder: o.displayOrder,
          })),
          answer: data.answer
            ? {
                answerType: data.answer.answerType,
                correctOptionIds: data.answer.correctOptionIds || undefined,
                numericalAnswer: data.answer.numericalAnswer ?? undefined,
                numericalTolerance: data.answer.numericalTolerance ?? undefined,
                numericalRangeStart: data.answer.numericalRangeStart ?? undefined,
                numericalRangeEnd: data.answer.numericalRangeEnd ?? undefined,
                matchPairs: data.answer.matchPairs,
              }
            : {},
          explanation: data.explanation
            ? {
                explanation: data.explanation.explanation,
                mediaUrl: data.explanation.mediaUrl || undefined,
              }
            : {
                explanation: data.translations?.[0]?.explanation || '',
              },
        });
      }
    });
  }, [id, getQuestionByIdAPI]);

  // 2. Cascading Hierarchy Loaders (Filtered for Physics, Chemistry, Mathematics, Biology)
  useEffect(() => {
    getSubjectsAPI().then((res) => {
      const raw = res?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.data)
          ? (raw as any).data
          : [];
      const filtered = list.filter((s: any) => isAllowedSubject(s.name));

      setAllSubjects(filtered);

      const uniqueTargetsMap = new Map();
      filtered.forEach((s: any) => {
        if (s.examTarget) {
          uniqueTargetsMap.set(s.examTarget.id, s.examTarget);
        }
      });
      setExamTargets(Array.from(uniqueTargetsMap.values()));
    });
  }, [getSubjectsAPI]);

  useEffect(() => {
    if (selectedTargetId) {
      const filtered = allSubjects.filter((s) => s.examTarget?.id === selectedTargetId);
      setSubjects(filtered);
    } else {
      setSubjects([]);
    }
  }, [selectedTargetId, allSubjects]);

  // Auto-resolve selectedTargetId when formData.subjectId and allSubjects are available
  useEffect(() => {
    if (formData.subjectId && allSubjects.length > 0 && !selectedTargetId) {
      const match = allSubjects.find((s) => s.id === formData.subjectId);
      if (match && match.examTarget) {
        setSelectedTargetId(match.examTarget.id);
      }
    }
  }, [formData.subjectId, allSubjects, selectedTargetId]);

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
    }
  }, [formData.subjectId, getChaptersAPI]);

  useEffect(() => {
    if (formData.chapterId) {
      getTopicsAPI(formData.chapterId).then((res) => {
        const raw = res?.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as any)?.data)
            ? (raw as any).data
            : [];
        setTopics(list);
      });
    }
  }, [formData.chapterId, getTopicsAPI]);

  useEffect(() => {
    if (formData.topicId) {
      getSubTopicsAPI(formData.topicId).then((res) => {
        const raw = res?.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as any)?.data)
            ? (raw as any).data
            : [];
        setSubTopics(list);
      });
    }
  }, [formData.topicId, getSubTopicsAPI]);

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

  const handleSave = async () => {
    if (!id) return;
    setErrorMsg(null);

    const payload: Partial<CreateQuestionPayload> = {
      ...formData,
      topicId: formData.topicId || undefined,
      subTopicId: formData.subTopicId || undefined,
      options: (formData.options || []).map((o, idx) => ({
        ...o,
        optionText: o.optionLabel || o.optionText,
        displayOrder: idx,
      })),
      explanation: formData.explanation?.explanation ? formData.explanation : undefined,
    };

    const { error } = await updateQuestionAPI(id, payload);

    if (error) {
      setErrorMsg(typeof error === 'string' ? error : (error as any).message || 'Update failed');
      return;
    }

    navigate(`${routePrefix}/question-bank`);
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

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
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Edit Question
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                <GitBranch size={12} /> v{originalVersion}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">Question ID: {id}</p>
          </div>
        </div>

        {/* Step Wizard Indicator */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              onClick={() => setCurrentStep(step as any)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs transition-all ${
                currentStep === step
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {step}
            </button>
          ))}
        </div>
      </div>

      {/* Auto-Versioning Notice for Approved Questions */}
      {isApprovedOriginal && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 text-xs shadow-sm">
          <AlertTriangle size={18} className="shrink-0 text-amber-600 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold">Auto-Versioning Enabled for Approved Question</h4>
            <p className="text-amber-800 leading-relaxed">
              This question is currently <strong>Approved</strong> and may be linked to ongoing
              exams. Saving changes will automatically create{' '}
              <strong>Version {originalVersion + 1}</strong> in <strong>Draft</strong> status,
              leaving Version {originalVersion} safely intact for student records.
            </p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 shadow-sm">
          {errorMsg}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 1: HIERARCHY & METADATA */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers size={18} className="text-indigo-600" />
            1. Academic Classification & Scoring
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Target Exam */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Target Exam <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedTargetId}
                onChange={(e) => {
                  setSelectedTargetId(e.target.value);
                  setFormData((prev) => ({
                    ...prev,
                    subjectId: '',
                    chapterId: '',
                    topicId: '',
                    subTopicId: '',
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select Target Exam</option>
                {examTargets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Subject */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.subjectId}
                disabled={!selectedTargetId}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    subjectId: e.target.value,
                    chapterId: '',
                    topicId: '',
                    subTopicId: '',
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none disabled:opacity-50"
              >
                <option value="">Select Subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {formatSubjectDisplayName(s.name)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Chapter</label>
              <select
                value={formData.chapterId}
                onChange={(e) => setFormData((prev) => ({ ...prev, chapterId: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select Chapter</option>
                {chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Topic (Optional)</label>
              <select
                value={formData.topicId}
                onChange={(e) => setFormData((prev) => ({ ...prev, topicId: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Select Topic</option>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Sub-Topic (Optional)</label>
              <select
                value={formData.subTopicId}
                onChange={(e) => setFormData((prev) => ({ ...prev, subTopicId: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
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
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Difficulty</label>
              <select
                value={formData.difficultyLevel}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    difficultyLevel: e.target.value as QuestionDifficultyEnum,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
              >
                <option value={QuestionDifficultyEnum.EASY}>Easy</option>
                <option value={QuestionDifficultyEnum.MEDIUM}>Medium</option>
                <option value={QuestionDifficultyEnum.HARD}>Hard</option>
                <option value={QuestionDifficultyEnum.VERY_HARD}>Very Hard</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Marks (+)</label>
              <input
                type="number"
                value={formData.marks}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, marks: Number(e.target.value) }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Negative Marks (-)</label>
              <input
                type="number"
                value={formData.negativeMarks}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, negativeMarks: Number(e.target.value) }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button
              onClick={() => setCurrentStep(2)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Next: Content Editor →
            </Button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 2: CONTENT & OPTIONS */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <FileQuestion size={18} className="text-indigo-600" />
            2. Question Content & Options
          </h2>

          {/* Translation Tab Selection if multiple */}
          {formData.translations.length > 1 && (
            <div className="flex gap-2 pb-2 border-b border-slate-100">
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
          )}

          {/* Passage if case-based */}
          {formData.type === QuestionTypeEnum.CASE_BASED && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-indigo-900 block">Passage Text</label>
              <textarea
                rows={3}
                value={formData.passage}
                onChange={(e) => setFormData((prev) => ({ ...prev, passage: e.target.value }))}
                className="w-full rounded-2xl border border-indigo-200 bg-indigo-50/30 p-3 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          )}

          {/* Assertion & Reason */}
          {formData.type === QuestionTypeEnum.ASSERTION_REASON && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-900 block">Assertion (A)</label>
                <textarea
                  rows={2}
                  value={formData.assertion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, assertion: e.target.value }))}
                  className="w-full rounded-2xl border border-amber-200 bg-amber-50/30 p-3 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-amber-900 block">Reason (R)</label>
                <textarea
                  rows={2}
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  className="w-full rounded-2xl border border-amber-200 bg-amber-50/30 p-3 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Question Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 block">Question Statement</label>
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
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none leading-relaxed"
            />
          </div>

          {/* Options */}
          {formData.options && formData.options.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Options & Correct Answer
                </label>
                <Button variant="outline" size="sm" onClick={handleAddOption} className="text-xs">
                  <Plus size={13} className="mr-1" /> Add Option
                </Button>
              </div>

              <div className="space-y-3">
                {formData.options.map((opt, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                      opt.isCorrect
                        ? 'border-emerald-300 bg-emerald-50/60 ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSetOptionCorrect(idx)}
                      className={`flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs transition-colors shrink-0 ${
                        opt.isCorrect
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white border border-slate-300 text-slate-600'
                      }`}
                    >
                      {opt.optionKey}
                    </button>

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
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none"
                    />

                    {formData.options!.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              ← Back to Step 1
            </Button>
            <Button
              onClick={() => setCurrentStep(3)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Next: Solution & Preview →
            </Button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 3: PREVIEW & SAVE */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-600" />
              3. Solution & Preview
            </h2>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Solution & Explanation
              </label>
              <textarea
                rows={3}
                value={formData.explanation?.explanation || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    explanation: { ...prev.explanation, explanation: e.target.value },
                  }))
                }
                placeholder="Enter detailed explanation..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-medium text-slate-900 focus:outline-none leading-relaxed"
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

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider px-1">
              <Eye size={15} className="text-indigo-600" />
              <span>Real-Time Simulation</span>
            </div>
            <QuestionPreviewCard question={formData} showSolution={true} />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              ← Back to Step 2
            </Button>

            <Button
              onClick={handleSave}
              isLoading={isUpdating}
              className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
            >
              <Save size={15} />
              <span>
                {isApprovedOriginal ? `Save as Version ${originalVersion + 1}` : 'Save Changes'}
              </span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditQuestionPage;
