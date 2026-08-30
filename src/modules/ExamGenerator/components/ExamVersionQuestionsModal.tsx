import React, { useState, useEffect, useCallback } from 'react';
import { X, FileCheck2, Globe, Check, Award, Sparkles } from 'lucide-react';

import { useGetExamVersionQuestionsAPI } from '../services/examGenerator.service';
import { useGetLanguagesAPI } from '@/modules/RegionalLanguage/services/regionalLanguage.service';
import type { ExamVersionItem, ExamVersionQuestionSnapshot } from '../types/examGenerator.types';
import type { SupportedLanguage } from '@/modules/RegionalLanguage/types/regionalLanguage.types';
import Button from '@/components/ui/Button';
import { formatSubjectDisplayName } from '@/constants/subjects.constant';

interface ExamVersionQuestionsModalProps {
  version: ExamVersionItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExamVersionQuestionsModal: React.FC<ExamVersionQuestionsModalProps> = ({
  version,
  isOpen,
  onClose,
}) => {
  const [questions, setQuestions] = useState<ExamVersionQuestionSnapshot[]>([]);
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');

  const { getExamVersionQuestionsAPI, isLoading } = useGetExamVersionQuestionsAPI();
  const { getLanguagesAPI } = useGetLanguagesAPI();

  const fetchQuestions = useCallback(async () => {
    if (!version) return;
    const { data } = await getExamVersionQuestionsAPI(version.id, selectedLanguageId || undefined);
    if (data) setQuestions(data);
  }, [version, selectedLanguageId, getExamVersionQuestionsAPI]);

  useEffect(() => {
    if (!isOpen || !version) return;

    getLanguagesAPI(false).then(({ data }) => {
      if (data) setLanguages(data);
    });

    fetchQuestions();
  }, [isOpen, version, fetchQuestions, getLanguagesAPI]);

  if (!isOpen || !version) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <FileCheck2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Frozen Snapshot Questions
                </h2>
                <span className="rounded-lg bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                  Version #{version.versionNumber}
                </span>
                <span
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                    version.status === 'PUBLISHED'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-indigo-100 text-indigo-800'
                  }`}
                >
                  {version.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Seed: {version.generationSeed || 'N/A'} | Total: {version.totalQuestions} Questions
                | {version.durationMinutes} Mins
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Regional Language Snapshot Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs">
              <Globe size={14} className="text-indigo-600" />
              <select
                value={selectedLanguageId}
                onChange={(e) => setSelectedLanguageId(e.target.value)}
                className="bg-transparent font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="">Default Language</option>
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nativeName || l.name} ({l.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-600 shrink-0" />
              <span>
                <strong>Immutable Guarantee:</strong> These questions and randomized options are
                100% frozen in snapshot tables. Live Question Bank updates will never alter this
                version.
              </span>
            </div>
            <span className="font-mono font-bold shrink-0 ml-2">
              {questions.length} / {version.totalQuestions} Loaded
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <p className="text-xs font-bold text-slate-500">Loading snapshot questions...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <div
                  key={q.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-3.5 hover:border-indigo-200 transition-colors"
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 font-mono text-xs font-black text-white">
                        {q.sequenceNumber}
                      </span>

                      {q.subjectName && (
                        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                          {formatSubjectDisplayName(q.subjectName)}
                        </span>
                      )}

                      <span
                        className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold ${
                          q.difficultyLevel === 'EASY'
                            ? 'bg-emerald-50 text-emerald-700'
                            : q.difficultyLevel === 'MEDIUM'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {q.difficultyLevel}
                      </span>

                      <span className="rounded-lg bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                        {q.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                        <Award size={13} className="text-indigo-600" />+{q.marks} / -
                        {q.negativeMarks}
                      </span>
                    </div>
                  </div>

                  {/* Case Passage if any */}
                  {q.passage && (
                    <div className="rounded-2xl bg-amber-50/50 border border-amber-200/70 p-3.5 text-xs text-amber-950 leading-relaxed font-serif">
                      <strong className="block font-sans font-bold text-[11px] uppercase tracking-wider text-amber-800 mb-1">
                        Passage / Case Study:
                      </strong>
                      {q.passage}
                    </div>
                  )}

                  {/* Assertion / Reason */}
                  {q.assertion && q.reason && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                        <strong className="text-indigo-700 block mb-1">Assertion (A):</strong>
                        <span>{q.assertion}</span>
                      </div>
                      <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                        <strong className="text-indigo-700 block mb-1">Reason (R):</strong>
                        <span>{q.reason}</span>
                      </div>
                    </div>
                  )}

                  {/* Question Statement */}
                  <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                    {q.questionText}
                  </p>

                  {/* Randomized Options List */}
                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-3 rounded-2xl border p-3 text-xs transition-colors ${
                            opt.isCorrect
                              ? 'border-emerald-300 bg-emerald-50/70 font-semibold text-emerald-950'
                              : 'border-slate-200 bg-slate-50/40 text-slate-700'
                          }`}
                        >
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-lg font-bold text-xs ${
                              opt.isCorrect
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {opt.optionKey}
                          </span>
                          <span className="flex-1 truncate">{opt.optionText}</span>
                          {opt.isCorrect && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                              <Check size={12} /> Correct
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Solution / Explanation */}
                  {q.explanation && (
                    <div className="rounded-2xl bg-indigo-50/40 border border-indigo-100 p-3 text-xs text-indigo-950 pt-2.5">
                      <strong className="block text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                        Solution / Derivation:
                      </strong>
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <span className="text-xs text-slate-500 font-mono">
            Auditable Snapshot ID: {version.id}
          </span>

          <Button variant="outline" onClick={onClose}>
            Close Explorer
          </Button>
        </div>
      </div>
    </div>
  );
};
