import React from 'react';
import { Check, Flag, CircleDot, HelpCircle, BookmarkCheck, X, Layers } from 'lucide-react';
import cn from 'classnames';
import type { ExamQuestion } from '@/types/exam.types';

export type QuestionStatusType =
  | 'ANSWERED'
  | 'NOT_ANSWERED'
  | 'MARKED'
  | 'ANS_MARKED'
  | 'NOT_VISITED';

export interface QuestionPaletteProps {
  questions: ExamQuestion[];
  currentIdx: number;
  activeSection: string;
  sections: string[];
  getQuestionStatus: (q: ExamQuestion) => QuestionStatusType;
  onSelectQuestion: (index: number) => void;
  onSelectSection: (section: string) => void;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentIdx,
  activeSection,
  sections,
  getQuestionStatus,
  onSelectQuestion,
  onSelectSection,
  onClose,
  isMobileDrawer = false,
}) => {
  // Filter questions for active section
  const sectionQuestions =
    activeSection === 'ALL'
      ? questions
      : questions.filter((q) => (q.section?.name || 'General') === activeSection);

  // Status counts across all questions
  const counts = questions.reduce(
    (acc, q) => {
      const st = getQuestionStatus(q);
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    {
      ANSWERED: 0,
      NOT_ANSWERED: 0,
      MARKED: 0,
      ANS_MARKED: 0,
      NOT_VISITED: 0,
    } as Record<QuestionStatusType, number>,
  );

  return (
    <div className="flex flex-col bg-white h-full w-full max-w-sm lg:w-72 xl:w-80 shrink-0 p-4 border-l border-slate-200">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
            <Layers size={16} />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Question Palette
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {questions.length} Questions total
            </p>
          </div>
        </div>

        {onClose && isMobileDrawer && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close question palette"
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Section Tabs ──────────────────────────────────────── */}
      {sections.length > 1 && (
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => onSelectSection('ALL')}
            className={cn(
              'shrink-0 rounded-xl px-3 py-1 text-xs font-bold transition-all',
              activeSection === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
            )}
          >
            All ({questions.length})
          </button>
          {sections.map((sec) => {
            const secTotal = questions.filter((q) => (q.section?.name || 'General') === sec).length;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => onSelectSection(sec)}
                className={cn(
                  'shrink-0 rounded-xl px-3 py-1 text-xs font-bold transition-all',
                  activeSection === sec
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                )}
              >
                {sec} ({secTotal})
              </button>
            );
          })}
        </div>
      )}

      {/* ── Question Numbers Grid ─────────────────────────────── */}
      <div className="my-3.5 flex-1 overflow-y-auto pr-1">
        <div className="grid grid-cols-5 gap-2">
          {sectionQuestions.map((q) => {
            const globalIdx = questions.findIndex((gq) => gq.examQuestionId === q.examQuestionId);
            const isCurrent = globalIdx === currentIdx;
            const status = getQuestionStatus(q);

            return (
              <button
                key={q.examQuestionId}
                type="button"
                onClick={() => onSelectQuestion(globalIdx)}
                aria-label={`Question ${globalIdx + 1}, status ${status}${isCurrent ? ', current question' : ''}`}
                className={cn(
                  'group relative flex h-10 w-full flex-col items-center justify-center rounded-xl text-xs font-black transition-all duration-150 select-none focus:outline-none',
                  isCurrent &&
                    'ring-2 ring-indigo-600 ring-offset-2 ring-offset-white scale-105 shadow-md z-10 font-black',
                  // ANSWERED
                  status === 'ANSWERED' &&
                    'bg-emerald-500 text-white shadow-sm shadow-emerald-200 hover:bg-emerald-600',
                  // NOT_ANSWERED (Visited, no answer)
                  status === 'NOT_ANSWERED' &&
                    'bg-rose-500 text-white shadow-sm shadow-rose-200 hover:bg-rose-600',
                  // MARKED (for review, no answer)
                  status === 'MARKED' &&
                    'bg-purple-600 text-white shadow-sm shadow-purple-200 hover:bg-purple-700',
                  // ANS_MARKED (Answered AND marked)
                  status === 'ANS_MARKED' &&
                    'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-sm shadow-indigo-200 hover:brightness-105 border border-purple-200',
                  // NOT_VISITED
                  status === 'NOT_VISITED' &&
                    'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 hover:text-slate-900',
                )}
              >
                <span>{globalIdx + 1}</span>

                {/* Dual Indicator Pin */}
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white shadow-xs border border-slate-100">
                  {status === 'ANSWERED' && (
                    <Check size={8} className="text-emerald-600" strokeWidth={3} />
                  )}
                  {status === 'NOT_ANSWERED' && (
                    <CircleDot size={8} className="text-rose-600" strokeWidth={3} />
                  )}
                  {status === 'MARKED' && (
                    <Flag size={7} className="text-purple-600 fill-purple-600" />
                  )}
                  {status === 'ANS_MARKED' && (
                    <BookmarkCheck size={8} className="text-indigo-600 fill-indigo-600" />
                  )}
                  {status === 'NOT_VISITED' && (
                    <span className="h-1 w-1 rounded-full bg-slate-400" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Status Legend & Counters ──────────────────────────── */}
      <div className="mt-auto border-t border-slate-100 pt-3 text-xs space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5 font-bold">
          {/* Answered */}
          <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-2.5 py-1.5 text-emerald-800 border border-emerald-100">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="flex h-4 w-4 items-center justify-center rounded-md bg-emerald-600 text-white">
                <Check size={10} strokeWidth={3} />
              </span>
              Answered
            </span>
            <span className="font-mono font-black">{counts.ANSWERED}</span>
          </div>

          {/* Not Answered */}
          <div className="flex items-center justify-between rounded-xl bg-rose-50 px-2.5 py-1.5 text-rose-800 border border-rose-100">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="flex h-4 w-4 items-center justify-center rounded-md bg-rose-600 text-white">
                <CircleDot size={10} />
              </span>
              Unanswered
            </span>
            <span className="font-mono font-black">{counts.NOT_ANSWERED}</span>
          </div>

          {/* Marked for Review */}
          <div className="flex items-center justify-between rounded-xl bg-purple-50 px-2.5 py-1.5 text-purple-800 border border-purple-100">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="flex h-4 w-4 items-center justify-center rounded-md bg-purple-600 text-white">
                <Flag size={9} className="fill-white" />
              </span>
              Marked
            </span>
            <span className="font-mono font-black">{counts.MARKED}</span>
          </div>

          {/* Answered & Marked */}
          <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-2.5 py-1.5 text-indigo-800 border border-indigo-100">
            <span className="flex items-center gap-1.5 text-[11px]">
              <span className="flex h-4 w-4 items-center justify-center rounded-md bg-indigo-600 text-white">
                <BookmarkCheck size={9} />
              </span>
              Ans & Marked
            </span>
            <span className="font-mono font-black">{counts.ANS_MARKED}</span>
          </div>
        </div>

        {/* Not Visited */}
        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-2.5 py-1.5 text-slate-600 border border-slate-200">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold">
            <span className="flex h-4 w-4 items-center justify-center rounded-md bg-slate-200 text-slate-600">
              <HelpCircle size={10} />
            </span>
            Not Visited
          </span>
          <span className="font-mono font-black text-slate-800">{counts.NOT_VISITED}</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;
