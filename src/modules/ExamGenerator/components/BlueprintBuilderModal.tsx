import React, { useState, useEffect } from 'react';
import { X, Layers, Plus, Trash2, AlertCircle, Sliders, CheckCircle2 } from 'lucide-react';
import { useCreateBlueprintAPI } from '../services/examGenerator.service';
import {
  useGetSubjectsAPI,
  useGetChaptersAPI,
} from '@/modules/QuestionBank/services/questionBank.service';
import type {
  CreateBlueprintRulePayload,
  QuestionDifficultyEnum,
  QuestionTypeEnum,
} from '../types/examGenerator.types';
import type { NamedEntity } from '@/modules/QuestionBank/types/questionBank.types';
import Button from '@/components/ui/Button';

interface BlueprintBuilderModalProps {
  examId: string;
  examTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const BlueprintBuilderModal: React.FC<BlueprintBuilderModalProps> = ({
  examId,
  examTitle,
  isOpen,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState('');
  const [totalQuestions, setTotalQuestions] = useState<number>(180);
  const [rules, setRules] = useState<CreateBlueprintRulePayload[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active Rule Form State
  const [ruleSubjectId, setRuleSubjectId] = useState<string>('');
  const [ruleChapterId, setRuleChapterId] = useState<string>('');
  const [ruleDifficulty, setRuleDifficulty] = useState<QuestionDifficultyEnum | ''>('');
  const [ruleType, setRuleType] = useState<QuestionTypeEnum | ''>('');
  const [mode, setMode] = useState<'COUNT' | 'PERCENTAGE'>('COUNT');
  const [ruleCount, setRuleCount] = useState<number>(45);
  const [rulePercentage, setRulePercentage] = useState<number>(25);

  // Subjects & Chapters
  const [subjects, setSubjects] = useState<NamedEntity[]>([]);
  const [chapters, setChapters] = useState<NamedEntity[]>([]);

  const { getSubjectsAPI } = useGetSubjectsAPI();
  const { getChaptersAPI } = useGetChaptersAPI();
  const { createBlueprintAPI, isLoading: isSaving } = useCreateBlueprintAPI();

  useEffect(() => {
    if (!isOpen) return;
    getSubjectsAPI().then(({ data }) => {
      if (data) setSubjects(data);
    });
    setName(`${examTitle || 'Exam'} Blueprint v1`);
    setRules([]);
    setErrorMsg(null);
  }, [isOpen, examTitle, getSubjectsAPI]);

  useEffect(() => {
    if (!ruleSubjectId) {
      setChapters([]);
      setRuleChapterId('');
      return;
    }
    getChaptersAPI(ruleSubjectId).then(({ data }) => {
      if (data) setChapters(data);
    });
  }, [ruleSubjectId, getChaptersAPI]);

  if (!isOpen) return null;

  const handleAddRule = () => {
    setErrorMsg(null);

    const newRule: CreateBlueprintRulePayload = {
      subjectId: ruleSubjectId || undefined,
      chapterId: ruleChapterId || undefined,
      difficultyLevel: ruleDifficulty ? (ruleDifficulty as QuestionDifficultyEnum) : undefined,
      type: ruleType ? (ruleType as QuestionTypeEnum) : undefined,
      selectionCount: mode === 'COUNT' ? Number(ruleCount) : undefined,
      selectionPercentage: mode === 'PERCENTAGE' ? Number(rulePercentage) : undefined,
      priority: rules.length + 1,
    };

    if (mode === 'COUNT' && (!ruleCount || ruleCount <= 0)) {
      setErrorMsg('Please specify a positive question count for the rule.');
      return;
    }
    if (mode === 'PERCENTAGE' && (!rulePercentage || rulePercentage <= 0)) {
      setErrorMsg('Please specify a valid percentage for the rule.');
      return;
    }

    setRules((prev) => [...prev, newRule]);
    // Reset partial form
    setRuleChapterId('');
  };

  const handleRemoveRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index));
  };

  // Compute total questions configured
  const countTotal = rules
    .filter((r) => r.selectionCount && r.selectionCount > 0)
    .reduce((sum, r) => sum + (r.selectionCount || 0), 0);

  const percentageTotal = rules
    .filter((r) => r.selectionPercentage && r.selectionPercentage > 0)
    .reduce((sum, r) => sum + (r.selectionPercentage || 0), 0);

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg('Blueprint name is required.');
      return;
    }
    if (totalQuestions <= 0) {
      setErrorMsg('Total questions must be greater than 0.');
      return;
    }
    if (rules.length === 0) {
      setErrorMsg('Please configure at least one blueprint rule.');
      return;
    }

    setErrorMsg(null);

    const { error } = await createBlueprintAPI(examId, {
      name: name.trim(),
      totalQuestions: Number(totalQuestions),
      rules,
    });

    if (error) {
      setErrorMsg(typeof error === 'string' ? error : 'Failed to create blueprint');
      return;
    }

    onSaved?.();
    onClose();
  };

  const getSubjectName = (id?: string) => subjects.find((s) => s.id === id)?.name || 'Any Subject';
  const getChapterName = (id?: string) => chapters.find((c) => c.id === id)?.name || 'Any Chapter';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Layers size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Exam Blueprint & Rule Builder
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {examTitle || `Exam: ${examId.slice(0, 8)}...`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Blueprint Name & Target Questions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Blueprint Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. NEET 2026 Full Syllabus Mock #1"
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">Target Questions *</label>
              <input
                type="number"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Add Rule Form */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders size={14} className="text-indigo-600" />
                Add Distribution Rule
              </h3>
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setMode('COUNT')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    mode === 'COUNT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Exact Count
                </button>
                <button
                  type="button"
                  onClick={() => setMode('PERCENTAGE')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                    mode === 'PERCENTAGE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500'
                  }`}
                >
                  Percentage (%)
                </button>
              </div>
            </div>

            {/* Criteria Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-600">Subject</label>
                <select
                  value={ruleSubjectId}
                  onChange={(e) => setRuleSubjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Chapter</label>
                <select
                  disabled={!ruleSubjectId}
                  value={ruleChapterId}
                  onChange={(e) => setRuleChapterId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800 disabled:opacity-50"
                >
                  <option value="">All Chapters</option>
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Difficulty</label>
                <select
                  value={ruleDifficulty}
                  onChange={(e) => setRuleDifficulty(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800"
                >
                  <option value="">Any Difficulty</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                  <option value="VERY_HARD">Very Hard</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">Question Type</label>
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-medium text-slate-800"
                >
                  <option value="">Any Type</option>
                  <option value="SINGLE_CORRECT">Single Correct</option>
                  <option value="MULTIPLE_CORRECT">Multiple Correct</option>
                  <option value="NUMERICAL">Numerical</option>
                  <option value="ASSERTION_REASON">Assertion Reason</option>
                  <option value="CASE_BASED">Case Based</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-600">
                  {mode === 'COUNT' ? 'Required Count' : 'Percentage (%)'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={mode === 'COUNT' ? ruleCount : rulePercentage}
                    onChange={(e) =>
                      mode === 'COUNT'
                        ? setRuleCount(Number(e.target.value))
                        : setRulePercentage(Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white p-2 text-xs font-bold text-slate-900"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddRule}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
                  >
                    <Plus size={14} className="mr-1" /> Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Configured Rules List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Configured Rules ({rules.length})</span>
              <span
                className={`font-mono ${
                  countTotal === totalQuestions || percentageTotal === 100
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              >
                {countTotal > 0 && `Count Sum: ${countTotal} / ${totalQuestions}`}
                {percentageTotal > 0 && ` | Percentage Sum: ${percentageTotal}% / 100%`}
              </span>
            </div>

            {rules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                No rules added yet. Use the rule builder above to add subject/difficulty
                distributions.
              </div>
            ) : (
              <div className="space-y-2">
                {rules.map((rule, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-xs hover:border-indigo-200 transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 font-mono font-bold text-slate-600 text-[11px]">
                        #{idx + 1}
                      </span>

                      <span className="rounded-lg bg-indigo-50 px-2.5 py-1 font-bold text-indigo-700 border border-indigo-100">
                        {getSubjectName(rule.subjectId)}
                      </span>

                      {rule.chapterId && (
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-slate-600">
                          {getChapterName(rule.chapterId)}
                        </span>
                      )}

                      {rule.difficultyLevel && (
                        <span
                          className={`rounded-lg px-2 py-0.5 font-semibold text-[11px] ${
                            rule.difficultyLevel === 'EASY'
                              ? 'bg-emerald-50 text-emerald-700'
                              : rule.difficultyLevel === 'MEDIUM'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {rule.difficultyLevel}
                        </span>
                      )}

                      {rule.type && (
                        <span className="rounded-lg bg-purple-50 px-2 py-0.5 text-purple-700 text-[11px]">
                          {rule.type}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-extrabold text-slate-900 font-mono bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                        {rule.selectionCount
                          ? `${rule.selectionCount} Qs`
                          : `${rule.selectionPercentage}%`}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveRule(idx)}
                        className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        title="Delete Rule"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            isLoading={isSaving}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
          >
            <CheckCircle2 size={16} />
            <span>Save Blueprint</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
