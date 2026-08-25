import React, { useState, useEffect, useCallback } from 'react';
import { X, Languages, CheckCircle2, AlertCircle, Save, Trash2, Globe2 } from 'lucide-react';
import {
  useGetTranslationCompletenessAPI,
  useGetQuestionTranslationsAPI,
  useUpsertFullQuestionTranslationAPI,
  useDeleteQuestionTranslationAPI,
  useGetLanguagesAPI,
} from '@/modules/RegionalLanguage/services/regionalLanguage.service';
import type {
  SupportedLanguage,
  TranslationCompletenessResponse,
  QuestionTranslationItem,
} from '@/modules/RegionalLanguage/types/regionalLanguage.types';
import type { QuestionItem } from '../types/questionBank.types';
import Button from '@/components/ui/Button';

interface QuestionTranslationsModalProps {
  question: QuestionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export const QuestionTranslationsModal: React.FC<QuestionTranslationsModalProps> = ({
  question,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [completenessData, setCompletenessData] = useState<TranslationCompletenessResponse | null>(
    null,
  );
  const [existingTranslations, setExistingTranslations] = useState<QuestionTranslationItem[]>([]);
  const [activeLangId, setActiveLangId] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State for Active Language Translation
  const [questionText, setQuestionText] = useState('');
  const [passageText, setPassageText] = useState('');
  const [assertionText, setAssertionText] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [optionTranslations, setOptionTranslations] = useState<
    { optionId: string; optionKey: string; originalText: string; translatedText: string }[]
  >([]);

  const { getLanguagesAPI } = useGetLanguagesAPI();
  const { getTranslationCompletenessAPI } = useGetTranslationCompletenessAPI();
  const { getQuestionTranslationsAPI } = useGetQuestionTranslationsAPI();
  const { upsertFullQuestionTranslationAPI, isLoading: isSaving } =
    useUpsertFullQuestionTranslationAPI();
  const { deleteQuestionTranslationAPI, isLoading: isDeleting } = useDeleteQuestionTranslationAPI();

  const loadData = useCallback(async () => {
    if (!question) return;
    const [compRes, transRes] = await Promise.all([
      getTranslationCompletenessAPI(question.id),
      getQuestionTranslationsAPI(question.id),
    ]);

    if (compRes.data) setCompletenessData(compRes.data);
    if (transRes.data) setExistingTranslations(transRes.data);
  }, [question, getTranslationCompletenessAPI, getQuestionTranslationsAPI]);

  // Load languages & translation data
  useEffect(() => {
    if (!isOpen || !question) return;

    getLanguagesAPI(false).then(({ data }) => {
      if (data) {
        setLanguages(data);
        if (!activeLangId && data.length > 0) {
          setActiveLangId(data[0].id);
        }
      }
    });

    loadData();
  }, [isOpen, question, getLanguagesAPI, loadData, activeLangId]);

  // Populate active translation form whenever activeLangId or existingTranslations change
  useEffect(() => {
    if (!question || !activeLangId) return;

    const currentTr = existingTranslations.find((t) => t.languageId === activeLangId);

    if (currentTr) {
      setQuestionText(currentTr.questionText || '');
      setPassageText(currentTr.passageText || '');
      setAssertionText(currentTr.assertionText || '');
      setReasonText(currentTr.reasonText || '');
      setExplanation(currentTr.explanation || '');
    } else {
      setQuestionText('');
      setPassageText('');
      setAssertionText('');
      setReasonText('');
      setExplanation('');
    }

    // Populate options
    const mappedOpts = (question.options || []).map((opt) => {
      const optTr = opt.translations?.find((ot) => ot.languageId === activeLangId);
      return {
        optionId: opt.id,
        optionKey: opt.optionKey || 'A',
        originalText: opt.optionLabel || opt.optionText || '',
        translatedText: optTr?.optionText || '',
      };
    });
    setOptionTranslations(mappedOpts);
  }, [activeLangId, existingTranslations, question]);

  if (!isOpen || !question) return null;

  const handleSaveTranslation = async () => {
    if (!questionText.trim()) {
      setErrorMsg('Question statement text is required.');
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);

    const payload = {
      languageId: activeLangId,
      questionText: questionText.trim(),
      passageText: passageText.trim() || undefined,
      assertionText: assertionText.trim() || undefined,
      reasonText: reasonText.trim() || undefined,
      explanation: explanation.trim() || undefined,
      optionTranslations: optionTranslations.map((o) => ({
        optionId: o.optionId,
        optionText: o.translatedText.trim() || o.originalText,
      })),
    };

    const { error } = await upsertFullQuestionTranslationAPI(question.id, payload);

    if (error) {
      setErrorMsg(typeof error === 'string' ? error : 'Failed to save translation');
      return;
    }

    setSuccessMsg('Translation saved successfully!');
    setTimeout(() => setSuccessMsg(null), 3000);
    await loadData();
    onUpdated?.();
  };

  const handleDeleteTranslation = async () => {
    if (!window.confirm('Delete this language translation?')) return;
    setErrorMsg(null);

    const { error } = await deleteQuestionTranslationAPI(question.id, activeLangId);
    if (error) {
      setErrorMsg(typeof error === 'string' ? error : 'Failed to delete translation');
      return;
    }

    await loadData();
    onUpdated?.();
  };

  const activeLangObj = languages.find((l) => l.id === activeLangId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Languages size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Multilingual Translation Hub
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Question ID: {question.id.slice(0, 8)}... | 9 Regional Languages
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

        {/* Translation Completeness Progress Matrix */}
        <div className="border-b border-slate-100 bg-indigo-50/30 px-6 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
              <Globe2 size={13} className="text-indigo-600" />
              Supported Regional Languages
            </span>
            <span className="text-xs font-bold text-indigo-700">
              {completenessData?.completeness.filter((c) => c.isComplete).length || 0} of{' '}
              {languages.length} Translated
            </span>
          </div>

          {/* Language Tabs / Badges */}
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {languages.map((lang) => {
              const comp = completenessData?.completeness.find((c) => c.languageId === lang.id);
              const isSelected = lang.id === activeLangId;
              const isDone = comp?.isComplete;

              return (
                <button
                  key={lang.id}
                  onClick={() => setActiveLangId(lang.id)}
                  className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-md'
                      : isDone
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{lang.nativeName || lang.name}</span>
                  {isDone ? (
                    <CheckCircle2
                      size={13}
                      className={isSelected ? 'text-emerald-400' : 'text-emerald-600'}
                    />
                  ) : (
                    <AlertCircle
                      size={13}
                      className={isSelected ? 'text-amber-400' : 'text-slate-400'}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Translation Editor Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              {successMsg}
            </div>
          )}

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <span>Translating in</span>
              <span className="rounded-lg bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                {activeLangObj?.name} ({activeLangObj?.nativeName})
              </span>
            </h3>

            {existingTranslations.some((t) => t.languageId === activeLangId) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteTranslation}
                isLoading={isDeleting}
                className="text-xs text-rose-600 hover:bg-rose-50 border-rose-200"
              >
                <Trash2 size={13} className="mr-1" /> Delete Translation
              </Button>
            )}
          </div>

          {/* Passage if case-based */}
          {question.type === 'CASE_BASED' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Translated Passage Text
              </label>
              <textarea
                rows={3}
                value={passageText}
                onChange={(e) => setPassageText(e.target.value)}
                placeholder={`Enter passage in ${activeLangObj?.name}...`}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:outline-none"
              />
            </div>
          )}

          {/* Assertion & Reason */}
          {question.type === 'ASSERTION_REASON' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Assertion (A) in {activeLangObj?.name}
                </label>
                <textarea
                  rows={2}
                  value={assertionText}
                  onChange={(e) => setAssertionText(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Reason (R) in {activeLangObj?.name}
                </label>
                <textarea
                  rows={2}
                  value={reasonText}
                  onChange={(e) => setReasonText(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Question Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Question Statement in {activeLangObj?.name} *
            </label>
            <textarea
              rows={3}
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={`Enter question in ${activeLangObj?.name}...`}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none leading-relaxed"
            />
          </div>

          {/* Option Translations */}
          {optionTranslations.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Option Translations ({activeLangObj?.name})
              </label>

              <div className="space-y-2.5">
                {optionTranslations.map((opt, idx) => (
                  <div
                    key={opt.optionId}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-3"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white border border-slate-300 font-bold text-xs text-slate-700 shrink-0">
                      {opt.optionKey}
                    </span>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        disabled
                        value={opt.originalText}
                        className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs text-slate-500 cursor-not-allowed"
                        title="Original Option Text"
                      />
                      <input
                        type="text"
                        value={opt.translatedText}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOptionTranslations((prev) => {
                            const arr = [...prev];
                            arr[idx].translatedText = val;
                            return arr;
                          });
                        }}
                        placeholder={`Option ${opt.optionKey} in ${activeLangObj?.name}...`}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">
              Solution / Explanation in {activeLangObj?.name}
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder={`Enter step-by-step solution in ${activeLangObj?.name}...`}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-900 focus:outline-none"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          <Button
            onClick={handleSaveTranslation}
            isLoading={isSaving}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
          >
            <Save size={15} />
            <span>Save {activeLangObj?.name} Translation</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
