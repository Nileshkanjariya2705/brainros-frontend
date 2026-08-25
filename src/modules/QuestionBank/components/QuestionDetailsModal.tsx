import React, { useState } from 'react';
import {
  X,
  FileQuestion,
  Languages,
  ListOrdered,
  History,
  GitBranch,
  CheckCircle2,
  User,
  Check,
} from 'lucide-react';
import type { QuestionItem } from '../types/questionBank.types';
import { QuestionTypeEnum } from '../types/questionBank.types';
import Button from '@/components/ui/Button';

interface QuestionDetailsModalProps {
  question: QuestionItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (question: QuestionItem) => void;
}

export const QuestionDetailsModal: React.FC<QuestionDetailsModalProps> = ({
  question,
  isOpen,
  onClose,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'translations' | 'options' | 'history'>(
    'details',
  );

  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <FileQuestion size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">Question Inspector</h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 border border-indigo-200">
                  <GitBranch size={11} /> v{question.version}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">ID: {question.id}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          {[
            { id: 'details', label: 'Overview & Question', icon: FileQuestion },
            { id: 'options', label: 'Options & Answer', icon: ListOrdered },
            {
              id: 'translations',
              label: `Translations (${question.translations?.length || 1})`,
              icon: Languages,
            },
            {
              id: 'history',
              label: `Audit Trail (${question.reviewHistory?.length || 0})`,
              icon: History,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 border-b-2 py-3.5 px-4 text-xs font-bold transition-colors ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: OVERVIEW & QUESTION STATEMENT */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Hierarchy Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Subject
                  </span>
                  <span className="font-bold text-slate-800">{question.subject?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Chapter
                  </span>
                  <span className="font-bold text-slate-800">{question.chapter?.name}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Topic
                  </span>
                  <span className="font-medium text-slate-700">{question.topic?.name || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Sub-Topic
                  </span>
                  <span className="font-medium text-slate-700">
                    {question.subTopic?.name || '—'}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Difficulty
                  </span>
                  <span className="font-bold text-slate-800">{question.difficultyLevel}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Question Type
                  </span>
                  <span className="font-bold text-slate-800">{question.type}</span>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Scoring
                  </span>
                  <span className="font-bold text-emerald-700">
                    +{question.marks} / -{question.negativeMarks}
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Status
                  </span>
                  <span className="font-bold text-indigo-700">{question.status}</span>
                </div>
              </div>

              {/* Passage if case-based */}
              {question.type === QuestionTypeEnum.CASE_BASED && question.passage && (
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-1.5 text-xs text-slate-700 font-serif leading-relaxed">
                  <span className="font-sans font-bold text-indigo-900 uppercase text-[10px] tracking-wider block">
                    Case / Passage Description:
                  </span>
                  <p>{question.passage}</p>
                </div>
              )}

              {/* Assertion & Reason if applicable */}
              {question.type === QuestionTypeEnum.ASSERTION_REASON && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-2 text-xs text-slate-800">
                  <div>
                    <strong className="text-amber-900 font-bold">Assertion (A): </strong>
                    <span>{question.assertion}</span>
                  </div>
                  <div>
                    <strong className="text-amber-900 font-bold">Reason (R): </strong>
                    <span>{question.reason}</span>
                  </div>
                </div>
              )}

              {/* Main Question Text */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Primary Question Statement
                </h3>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm font-semibold text-slate-900 leading-relaxed shadow-sm">
                  {question.translations?.[0]?.questionText || '—'}
                </div>
              </div>

              {/* Solution / Explanation Preview */}
              {(question.explanation?.explanation || question.translations?.[0]?.explanation) && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 size={16} />
                    <span>Official Solution & Explanation</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {question.explanation?.explanation || question.translations?.[0]?.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: OPTIONS & ANSWER DETAILS */}
          {activeTab === 'options' && (
            <div className="space-y-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Configured Question Options ({question.options?.length || 0})
              </h3>

              {question.options && question.options.length > 0 ? (
                <div className="space-y-3">
                  {question.options.map((opt) => (
                    <div
                      key={opt.id}
                      className={`flex items-start justify-between rounded-2xl border p-4 text-xs transition-all ${
                        opt.isCorrect
                          ? 'border-emerald-300 bg-emerald-50/70 font-semibold text-emerald-950 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-xl font-bold text-xs ${
                            opt.isCorrect
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {opt.optionKey}
                        </span>
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-900">
                            {opt.optionLabel || opt.optionText || `Option ${opt.optionKey}`}
                          </p>
                          {opt.translations && opt.translations.length > 0 && (
                            <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
                              {opt.translations.map((ot, idx) => (
                                <span key={idx} className="rounded bg-slate-100 px-2 py-0.5">
                                  {ot.language?.name || 'Lang'}: {ot.optionText}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {opt.isCorrect && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
                          <Check size={13} /> Correct Answer
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : question.type === QuestionTypeEnum.NUMERICAL ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider block text-[10px]">
                    Numerical Answer Config:
                  </span>
                  <div className="font-mono text-sm font-bold text-indigo-700">
                    Answer: {question.answer?.numericalAnswer ?? 'Range configured'}
                    {question.answer?.numericalTolerance
                      ? ` (±${question.answer.numericalTolerance})`
                      : ''}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No option structures required for this question.
                </p>
              )}
            </div>
          )}

          {/* TAB 3: MULTILINGUAL TRANSLATIONS */}
          {activeTab === 'translations' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Language Translations
              </h3>
              {question.translations?.map((tr, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-bold text-indigo-700 text-xs flex items-center gap-1.5">
                      <Languages size={14} />
                      {tr.language?.name || `Language ${idx + 1}`}
                    </span>
                    {tr.languageId === question.defaultLanguageId && (
                      <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-200">
                        Default Language
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-900 font-medium leading-relaxed">
                    {tr.questionText}
                  </div>
                  {tr.explanation && (
                    <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-600 border border-slate-200/60">
                      <strong>Solution in {tr.language?.name || 'language'}: </strong>
                      {tr.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL & REVIEW HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Complete Review & Modification History
              </h3>

              {question.reviewHistory && question.reviewHistory.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {question.reviewHistory.map((hist, idx) => (
                    <div key={idx} className="relative text-xs">
                      {/* Node Dot */}
                      <div className="absolute -left-6 top-1 h-5 w-5 rounded-full border-2 border-white bg-indigo-600 shadow-sm flex items-center justify-center text-white text-[10px]">
                        ✓
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">{hist.action}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(hist.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          {hist.comment || 'Action executed'}
                        </p>
                        <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 border-t border-slate-200/60">
                          <User size={11} />
                          <span>By: {hist.performedBy?.email || hist.performedById}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No audit history records available.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/70 px-6 py-4">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>

          {onEdit && (
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onEdit(question);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Edit Question
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
