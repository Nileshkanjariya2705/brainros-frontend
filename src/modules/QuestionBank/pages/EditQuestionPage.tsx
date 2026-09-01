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
} from 'lucide-react';
import {
  useGetQuestionByIdAPI,
  useUpdateQuestionAPI,
  useGetSubjectsAPI,
  useGetChaptersAPI,
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
  const [chapters, setChapters] = useState<NamedEntity[]>([]);
  const [languages, setLanguages] = useState<Array<{ id: string; name: string }>>([]);

  const { getQuestionByIdAPI, isLoading: isFetching } = useGetQuestionByIdAPI();
  const { updateQuestionAPI, isLoading: isUpdating } = useUpdateQuestionAPI();
  const { getSubjectsAPI } = useGetSubjectsAPI();
  const { getChaptersAPI, isLoading: isLoadingChapters } = useGetChaptersAPI();
  const { getLanguagesAPI } = useGetLanguagesAPI();

  const [formData, setFormData] = useState<CreateQuestionPayload>({
    subjectId: '',
    chapterId: '',
    topicId: '',
    topicName: '',
    subTopicId: '',
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
          topicName: data.topic?.name || '',
          subTopicId: data.subTopicId || '',
          subTopicName: data.subTopic?.name || '',
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
            optionText: o.optionText || o.optionLabel || '',
            isCorrect: o.isCorrect,
            displayOrder: o.displayOrder,
            translations: o.translations || [],
          })) || [],
          answer: data.answer || {},
          explanation: data.explanation || { explanation: '' },
        });
      }
    });
  }, [id, getQuestionByIdAPI]);

  // 2. Load Subjects directly (Filtered for Core Subjects)
  useEffect(() => {
    getSubjectsAPI().then((res) => {
      const raw = res?.data;
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray((raw as any)?.data)
          ? (raw as any).data
          : [];
      const filtered = list.filter((s: any) => isAllowedSubject(s.name));

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

  // 3. Load Chapters dynamically for selected Subject
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

  // ─── Option Handlers ──────────────────────────────────────────
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
      topicName: formData.topicName?.trim() || undefined,
      subTopicName: formData.subTopicName?.trim() || undefined,
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 disabled:opacity-50 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">
                  {isLoadingChapters
                    ? 'Loading chapters...'
                    : !formData.subjectId
                      ? 'Select Subject first'
                      : chapters.length === 0
                        ? 'No chapters available for this subject'
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
                    topicId: '',
                  }))
                }
                placeholder="e.g., Kinematics, Chemical Bonding"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none placeholder:text-slate-400"
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
                    subTopicId: '',
                  }))
                }
                placeholder="e.g., Projectile Motion, Hybridization"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none placeholder:text-slate-400"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setCurrentStep(2)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold">
              Continue to Content & Options &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 2: CONTENT & MULTI-LANGUAGE TRANSLATIONS */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileQuestion size={18} className="text-indigo-600" />
              2. Question Content & Language Variants
            </h2>

            {/* Language Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto p-1 bg-slate-100 rounded-xl">
              {formData.translations.map((t, idx) => {
                const lang = languages.find((l) => l.id === t.languageId);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTranslationIndex(idx)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      activeTranslationIndex === idx
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {lang?.name || `Lang #${idx + 1}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question Statement for Active Language */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Question Statement ({languages.find((l) => l.id === formData.translations[activeTranslationIndex]?.languageId)?.name || 'Active Language'})
            </label>
            <textarea
              rows={4}
              value={formData.translations[activeTranslationIndex]?.questionText || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData((prev) => {
                  const updated = [...prev.translations];
                  updated[activeTranslationIndex] = {
                    ...updated[activeTranslationIndex],
                    questionText: val,
                  };
                  return { ...prev, translations: updated };
                });
              }}
              placeholder="Enter question statement here..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Options Studio */}
          {(formData.type === QuestionTypeEnum.SINGLE_CORRECT ||
            formData.type === QuestionTypeEnum.MULTIPLE_CORRECT ||
            formData.type === QuestionTypeEnum.ASSERTION_REASON) && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Answer Options (Click icon to mark correct)
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
                      placeholder={`Option ${opt.optionKey || String.fromCharCode(65 + idx)} text...`}
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

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              &larr; Back to Hierarchy
            </Button>
            <Button onClick={() => setCurrentStep(3)} className="bg-indigo-600 text-white font-bold px-6">
              Continue to Solution & Simulation &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 3: EXPLANATION & LIVE SIMULATION */}
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
                value={formData.explanation?.explanation || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    explanation: { explanation: e.target.value },
                  }))
                }
                placeholder="Provide a step-by-step breakdown explaining why the answer is correct..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none"
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
              <Button variant="outline" onClick={() => setCurrentStep(2)}>
                &larr; Back to Question Editor
              </Button>

              <Button
                onClick={handleSave}
                disabled={isUpdating}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md shadow-indigo-100 px-6 py-2.5"
              >
                <Save size={15} className="mr-2" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditQuestionPage;
