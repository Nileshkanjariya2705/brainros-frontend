// ** Packages **
import React from 'react';
import { Check, Flag, CircleDot, HelpCircle, BookmarkCheck, X, Layers } from 'lucide-react';
import cn from 'classnames';

// ** Types **
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
    <div
      className={cn('flex flex-col bg-[#0d0f1a] h-full w-64 lg:w-72 xl:w-80 shrink-0 p-3.5 xl:p-4')}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-3.5 border-b border-white/8">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400">
            <Layers size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Question Palette
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {questions.length} Questions in total
            </p>
          </div>
        </div>

        {onClose && isMobileDrawer && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close palette"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={16} />
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
              'shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all',
              activeSection === 'ALL'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200',
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
                  'shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all',
                  activeSection === sec
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200',
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
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-5">
          {sectionQuestions.map((q) => {
            // Find global index in questions array
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
                  'group relative flex h-10 w-full flex-col items-center justify-center rounded-xl text-xs font-bold transition-all duration-150 select-none focus:outline-none',
                  isCurrent &&
                    'ring-2 ring-indigo-400 ring-offset-2 ring-offset-[#0d0f1a] scale-105 shadow-lg z-10',
                  // ANSWERED
                  status === 'ANSWERED' &&
                    'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 hover:bg-emerald-500',
                  // NOT_ANSWERED (Visited, but no answer chosen)
                  status === 'NOT_ANSWERED' &&
                    'bg-rose-600 text-white shadow-sm shadow-rose-600/30 hover:bg-rose-500',
                  // MARKED (for review, no answer)
                  status === 'MARKED' &&
                    'bg-purple-600 text-white shadow-sm shadow-purple-600/30 hover:bg-purple-500',
                  // ANS_MARKED (Answered AND marked for review)
                  status === 'ANS_MARKED' &&
                    'bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-sm shadow-purple-600/30 hover:brightness-110 border border-purple-300/40',
                  // NOT_VISITED
                  status === 'NOT_VISITED' &&
                    'bg-white/[0.06] text-slate-400 border border-white/10 hover:bg-white/[0.12] hover:text-white',
                )}
              >
                {/* Number */}
                <span>{globalIdx + 1}</span>

                {/* Micro Status Shape/Icon */}
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-900 ring-1 ring-white/20">
                  {status === 'ANSWERED' && (
                    <Check size={8} className="text-emerald-400" strokeWidth={3} />
                  )}
                  {status === 'NOT_ANSWERED' && (
                    <CircleDot size={8} className="text-rose-400" strokeWidth={3} />
                  )}
                  {status === 'MARKED' && (
                    <Flag size={7} className="text-purple-400 fill-purple-400" />
                  )}
                  {status === 'ANS_MARKED' && (
                    <BookmarkCheck size={8} className="text-indigo-300 fill-indigo-300" />
                  )}
                  {status === 'NOT_VISITED' && (
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Status Legend & Counters ──────────────────────────── */}
      <div className="mt-auto border-t border-white/8 pt-3 text-[11px] space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5 font-medium">
          {/* Answered */}
          <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-2 py-1.5 text-emerald-400 border border-emerald-500/20">
            <span className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-md bg-emerald-600 text-white">
                <Check size={10} strokeWidth={3} />
              </span>
              Answered
            </span>
            <span className="font-bold">{counts.ANSWERED}</span>
          </div>

          {/* Not Answered */}
          <div className="flex items-center justify-between rounded-lg bg-rose-500/10 px-2 py-1.5 text-rose-400 border border-rose-500/20">
            <span className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-md bg-rose-600 text-white">
                <CircleDot size={10} />
              </span>
              Unanswered
            </span>
            <span className="font-bold">{counts.NOT_ANSWERED}</span>
          </div>

          {/* Marked for Review */}
          <div className="flex items-center justify-between rounded-lg bg-purple-500/10 px-2 py-1.5 text-purple-400 border border-purple-500/20">
            <span className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-md bg-purple-600 text-white">
                <Flag size={9} className="fill-white" />
              </span>
              Marked
            </span>
            <span className="font-bold">{counts.MARKED}</span>
          </div>

          {/* Answered & Marked */}
          <div className="flex items-center justify-between rounded-lg bg-indigo-500/10 px-2 py-1.5 text-indigo-300 border border-indigo-500/20">
            <span className="flex items-center gap-1.5">
              <span className="flex h-4 w-4 items-center justify-center rounded-md bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
                <BookmarkCheck size={9} />
              </span>
              Ans & Marked
            </span>
            <span className="font-bold">{counts.ANS_MARKED}</span>
          </div>
        </div>

        {/* Not Visited */}
        <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-2 py-1.5 text-slate-400 border border-white/5">
          <span className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded-md bg-white/10 text-slate-400">
              <HelpCircle size={10} />
            </span>
            Not Visited
          </span>
          <span className="font-bold text-slate-300">{counts.NOT_VISITED}</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionPalette;
