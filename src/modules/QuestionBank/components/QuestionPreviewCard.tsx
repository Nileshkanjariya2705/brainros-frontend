import React, { useState } from 'react';
import { Sparkles, CheckCircle2, HelpCircle, Check } from 'lucide-react';
import type { QuestionItem, CreateQuestionPayload } from '../types/questionBank.types';
import { QuestionTypeEnum } from '../types/questionBank.types';

interface QuestionPreviewCardProps {
  question?: Partial<QuestionItem> | Partial<CreateQuestionPayload>;
  selectedLanguageId?: string;
  showSolution?: boolean;
}

export const QuestionPreviewCard: React.FC<QuestionPreviewCardProps> = ({
  question,
  selectedLanguageId,
  showSolution = true,
}) => {
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedMultiOptionIds, setSelectedMultiOptionIds] = useState<string[]>([]);
  const [numericalInput, setNumericalInput] = useState<string>('');

  if (!question) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-400">
        <HelpCircle size={32} className="mb-2 opacity-50" />
        <p className="text-sm font-medium">No question content to preview</p>
      </div>
    );
  }

  const translations = question.translations || [];
  const activeTranslation = translations.find((t) => t.languageId === selectedLanguageId) ||
    translations[0] || {
      questionText: 'Question statement will appear here...',
    };

  const type = question.type || QuestionTypeEnum.SINGLE_CORRECT;
  const options = question.options || [];

  const handleOptionClick = (keyOrId: string) => {
    if (type === QuestionTypeEnum.SINGLE_CORRECT || type === QuestionTypeEnum.ASSERTION_REASON) {
      setSelectedOptionId(keyOrId);
    } else if (type === QuestionTypeEnum.MULTIPLE_CORRECT) {
      setSelectedMultiOptionIds((prev) =>
        prev.includes(keyOrId) ? prev.filter((id) => id !== keyOrId) : [...prev, keyOrId],
      );
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-sm space-y-5">
      {/* Simulation Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 font-bold text-xs">
            <Sparkles size={13} />
          </span>
          <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
            Live Student Portal Simulation
          </span>
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Marks: <span className="text-emerald-600 font-bold">+{question.marks ?? 4}</span> /{' '}
          <span className="text-rose-500 font-bold">-{question.negativeMarks ?? 1}</span>
        </div>
      </div>

      {/* Case Based Passage */}
      {type === QuestionTypeEnum.CASE_BASED &&
        (question.passage || activeTranslation.passageText) && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 text-xs font-serif leading-relaxed text-slate-700">
            <strong className="font-sans block mb-1 text-[11px] font-bold uppercase text-indigo-800 tracking-wider">
              Read the passage carefully:
            </strong>
            {question.passage || activeTranslation.passageText}
          </div>
        )}

      {/* Assertion & Reason */}
      {type === QuestionTypeEnum.ASSERTION_REASON && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-900 shrink-0">Assertion (A):</span>
            <span className="text-slate-800">
              {question.assertion || activeTranslation.assertionText || '—'}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-bold text-amber-900 shrink-0">Reason (R):</span>
            <span className="text-slate-800">
              {question.reason || activeTranslation.reasonText || '—'}
            </span>
          </div>
        </div>
      )}

      {/* Question Text */}
      <div className="text-sm font-semibold text-slate-900 leading-relaxed">
        {activeTranslation.questionText || 'Enter your question statement...'}
      </div>

      {/* Options Rendering per Question Type */}
      {(type === QuestionTypeEnum.SINGLE_CORRECT ||
        type === QuestionTypeEnum.MULTIPLE_CORRECT ||
        type === QuestionTypeEnum.ASSERTION_REASON ||
        type === QuestionTypeEnum.CASE_BASED) &&
        options.length > 0 && (
          <div className="space-y-2.5">
            {options.map((opt, idx) => {
              const optKey = opt.optionKey || String.fromCharCode(65 + idx);
              const optId = (opt as any).id || optKey;
              const isSelected =
                type === QuestionTypeEnum.MULTIPLE_CORRECT
                  ? selectedMultiOptionIds.includes(optId)
                  : selectedOptionId === optId;

              // Find translation for option
              const optTranslation =
                opt.translations?.find((t) => t.languageId === selectedLanguageId) ||
                opt.translations?.[0];
              const label =
                optTranslation?.optionText ||
                opt.optionLabel ||
                opt.optionText ||
                `Option ${optKey}`;

              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleOptionClick(optId)}
                  className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left text-xs font-medium transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 font-semibold ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg font-bold text-xs transition-colors ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {optKey}
                    </span>
                    <span>{label}</span>
                  </div>
                  {isSelected && <Check size={16} className="text-indigo-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

      {/* Numerical Answer Input Simulation */}
      {type === QuestionTypeEnum.NUMERICAL && (
        <div className="space-y-2 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
          <label className="text-xs font-bold text-slate-700 block">Enter Numerical Value:</label>
          <input
            type="number"
            value={numericalInput}
            onChange={(e) => setNumericalInput(e.target.value)}
            placeholder="e.g. 9.81 or 24"
            className="w-full sm:max-w-xs rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
          <p className="text-[11px] text-slate-500">
            Accepts integer or decimal numerical answers.
          </p>
        </div>
      )}

      {/* Match The Following Columns Simulation */}
      {type === QuestionTypeEnum.MATCH_FOLLOWING && options.length > 0 && (
        <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50/40 text-xs">
          <div className="space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
              Column A
            </span>
            {options
              .filter((o) => o.matchColumn === 'COLUMN_A' || !o.matchColumn)
              .map((opt, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-white border border-slate-200 p-2 text-slate-800 font-medium"
                >
                  <strong>{opt.optionKey || `A${i + 1}`}:</strong>{' '}
                  {opt.optionLabel || opt.optionText}
                </div>
              ))}
          </div>
          <div className="space-y-2">
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] block">
              Column B
            </span>
            {options
              .filter((o) => o.matchColumn === 'COLUMN_B')
              .map((opt, i) => (
                <div
                  key={i}
                  className="rounded-lg bg-white border border-slate-200 p-2 text-slate-800 font-medium"
                >
                  <strong>{opt.optionKey || `B${i + 1}`}:</strong>{' '}
                  {opt.optionLabel || opt.optionText}
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Detailed Solution Accordion / Box */}
      {showSolution && (question.explanation?.explanation || activeTranslation.explanation) && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-1.5 text-xs text-emerald-950">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
            <CheckCircle2 size={15} />
            <span>Solution & Explanation:</span>
          </div>
          <p className="leading-relaxed text-slate-700">
            {question.explanation?.explanation || activeTranslation.explanation}
          </p>
        </div>
      )}
    </div>
  );
};
