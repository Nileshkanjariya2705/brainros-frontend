import React from 'react';
import cn from 'classnames';
import { Flame, AlertTriangle, Clock } from 'lucide-react';
import type { SubjectAnalyticsItem, PerformanceStatus } from '@/types/exam.types';

const getStatusBadge = (status: PerformanceStatus) => {
  switch (status) {
    case 'EXCELLENT':
      return { label: 'Excellent', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
    case 'STRONG':
      return { label: 'Strong', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
    case 'GOOD':
      return { label: 'Good', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
    case 'WEAK':
      return { label: 'Weak', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
    case 'CRITICAL':
      return { label: 'Critical', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: 'Unattempted', bg: 'bg-slate-50 text-slate-600 border-slate-200' };
  }
};

interface Props {
  subjects: {
    items: SubjectAnalyticsItem[];
    strongestSubject: SubjectAnalyticsItem | null;
    weakestSubject: SubjectAnalyticsItem | null;
  };
}

export const SubjectAnalyticsView: React.FC<Props> = ({ subjects }) => {
  const { items, strongestSubject, weakestSubject } = subjects;

  return (
    <div className="space-y-6">
      {/* ── Strongest & Weakest Callout Highlights ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {strongestSubject && (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-700 font-extrabold text-sm">
                <Flame size={18} className="text-emerald-600" />
                <span>Strongest Subject</span>
              </div>
              <span className="rounded-full bg-emerald-600 text-white px-3 py-1 text-xs font-black shadow-sm shadow-emerald-200">
                {strongestSubject.accuracy.toFixed(1)}% Accuracy
              </span>
            </div>

            <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
              {strongestSubject.subjectName}
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Score:{' '}
              <strong className="text-slate-900">
                {strongestSubject.score}/{strongestSubject.maxScore}
              </strong>{' '}
              Marks ({strongestSubject.percentage.toFixed(1)}%) • {strongestSubject.correct}{' '}
              Correct, {strongestSubject.wrong} Wrong
            </p>

            <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-emerald-800">
              <span>
                Time Spent:{' '}
                <strong>{Math.round(strongestSubject.timeSpentSeconds / 60)} mins</strong>
              </span>
              <span>
                Avg Speed: <strong>{strongestSubject.avgTimePerQuestionSeconds}s / question</strong>
              </span>
            </div>
          </div>
        )}

        {weakestSubject && (
          <div className="relative overflow-hidden rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm">
                <AlertTriangle size={18} className="text-rose-600" />
                <span>Needs Targeted Focus</span>
              </div>
              <span className="rounded-full bg-rose-600 text-white px-3 py-1 text-xs font-black shadow-sm shadow-rose-200">
                {weakestSubject.accuracy.toFixed(1)}% Accuracy
              </span>
            </div>

            <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
              {weakestSubject.subjectName}
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              Score:{' '}
              <strong className="text-slate-900">
                {weakestSubject.score}/{weakestSubject.maxScore}
              </strong>{' '}
              Marks • {weakestSubject.wrong} Incorrect answers causing mark loss
            </p>

            <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-rose-800">
              <span>
                Time Spent: <strong>{Math.round(weakestSubject.timeSpentSeconds / 60)} mins</strong>
              </span>
              <span>
                Avg Speed: <strong>{weakestSubject.avgTimePerQuestionSeconds}s / question</strong>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Subject Cards Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {items.map((sub) => {
          const badge = getStatusBadge(sub.status);
          const accColor =
            sub.accuracy >= 75
              ? 'bg-emerald-500'
              : sub.accuracy >= 50
                ? 'bg-amber-500'
                : 'bg-rose-500';

          return (
            <div
              key={sub.subjectId}
              className={cn(
                'group relative overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
                sub.isStrongest
                  ? 'border-emerald-300 ring-2 ring-emerald-400/20'
                  : sub.isWeakest
                    ? 'border-rose-300 ring-2 ring-rose-400/20'
                    : 'border-slate-200',
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 border border-indigo-100">
                  {sub.subjectName}
                </span>
                <span
                  className={cn(
                    'rounded-full px-3 py-0.5 text-[10px] font-bold uppercase border',
                    badge.bg,
                  )}
                >
                  {badge.label}
                </span>
              </div>

              {/* Score & Accuracy Numbers */}
              <div className="mt-5 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-black text-slate-900">{sub.score}</span>
                  <span className="text-xs font-bold text-slate-400">/{sub.maxScore} Marks</span>
                </div>
                <span className="text-lg font-black text-indigo-600">
                  {sub.accuracy.toFixed(1)}% Acc
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-700', accColor)}
                  style={{ width: `${Math.min(100, Math.max(0, sub.accuracy))}%` }}
                />
              </div>

              {/* Stats 3-Column Pill */}
              <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50 p-3.5 text-center border border-slate-100">
                <div>
                  <span className="block text-base font-black text-emerald-600">{sub.correct}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Correct</span>
                </div>
                <div className="border-x border-slate-200">
                  <span className="block text-base font-black text-rose-500">{sub.wrong}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Wrong</span>
                </div>
                <div>
                  <span className="block text-base font-black text-slate-400">
                    {sub.unattempted}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Skipped</span>
                </div>
              </div>

              {/* Time & Pacing */}
              <div className="mt-4 flex items-center justify-between text-xs font-semibold text-slate-500 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-indigo-500" />
                  <span>
                    Time: <strong>{Math.round(sub.timeSpentSeconds / 60)}m</strong>
                  </span>
                </div>
                <div>
                  <span>
                    Avg: <strong>{sub.avgTimePerQuestionSeconds}s/Q</strong>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
