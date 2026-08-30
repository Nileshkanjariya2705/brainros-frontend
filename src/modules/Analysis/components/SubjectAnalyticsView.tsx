import React from 'react';
import cn from 'classnames';
import { Flame, AlertTriangle, Clock, BarChart2, ShieldCheck } from 'lucide-react';
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

  // SVG Radar coordinates computation
  const numAxes = Math.max(3, items.length);
  const center = 100;
  const radius = 70;

  const points = items.map((sub, i) => {
    const angle = ((Math.PI * 2) / numAxes) * i - Math.PI / 2;
    const r = (Math.min(100, Math.max(10, sub.accuracy)) / 100) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle, ...sub };
  });

  const polygonPointsStr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

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

      {/* ── Structured Tabular Layout & Balance Radar ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table Column (Span 2) */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 size={18} className="text-indigo-600" />
                Subject Performance Breakdown
              </h3>
              <span className="text-xs text-slate-500 font-semibold">{items.length} Subjects</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Subject</th>
                    <th className="pb-3 text-center">Correct</th>
                    <th className="pb-3 text-center">Wrong</th>
                    <th className="pb-3 text-center">Skipped</th>
                    <th className="pb-3 text-center">Score</th>
                    <th className="pb-3 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((sub) => (
                    <tr key={sub.subjectId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{sub.subjectName}</span>
                          {sub.isStrongest && (
                            <span className="rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-black px-1.5 py-0.5">
                              BEST
                            </span>
                          )}
                          {sub.isWeakest && (
                            <span className="rounded-md bg-rose-100 text-rose-800 text-[9px] font-black px-1.5 py-0.5">
                              WEAK
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 text-center font-bold text-emerald-600">
                        {sub.correct}
                      </td>
                      <td className="py-3.5 text-center font-bold text-rose-600">{sub.wrong}</td>
                      <td className="py-3.5 text-center font-medium text-slate-400">
                        {sub.unattempted}
                      </td>
                      <td className="py-3.5 text-center font-bold text-slate-900">
                        {sub.score}/{sub.maxScore}
                      </td>
                      <td className="py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-2 rounded-full bg-slate-100 overflow-hidden hidden sm:block">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                sub.accuracy >= 75
                                  ? 'bg-emerald-500'
                                  : sub.accuracy >= 50
                                    ? 'bg-amber-500'
                                    : 'bg-rose-500',
                              )}
                              style={{ width: `${Math.min(100, Math.max(0, sub.accuracy))}%` }}
                            />
                          </div>
                          <span className="font-extrabold text-indigo-700">
                            {sub.accuracy.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Accuracy is calculated on attempted questions per subject.</span>
            <span className="font-semibold text-indigo-600">Dynamic Multi-Subject Matrix</span>
          </div>
        </div>

        {/* Radar Chart Polygon Column */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center justify-between">
          <div className="w-full text-left mb-2">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck size={16} className="text-indigo-600" />
              Subject Balance Radar
            </h4>
            <p className="text-[11px] text-slate-500">
              Accuracy % balance across all tested subjects
            </p>
          </div>

          {/* SVG Radar */}
          <div className="relative w-48 h-48 my-2">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Radar background rings */}
              {[0.25, 0.5, 0.75, 1.0].map((ring) => (
                <circle
                  key={ring}
                  cx={center}
                  cy={center}
                  r={radius * ring}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeDasharray={ring === 1.0 ? undefined : '2,2'}
                  strokeWidth="1"
                />
              ))}

              {/* Axis lines */}
              {points.map((_, i) => {
                const angle = ((Math.PI * 2) / numAxes) * i - Math.PI / 2;
                const endX = center + radius * Math.cos(angle);
                const endY = center + radius * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={endX}
                    y2={endY}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Polygon fill */}
              {polygonPointsStr && (
                <polygon
                  points={polygonPointsStr}
                  fill="rgba(79, 70, 229, 0.2)"
                  stroke="#4f46e5"
                  strokeWidth="2"
                />
              )}

              {/* Data points */}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  className={cn(
                    p.isStrongest
                      ? 'fill-emerald-500 stroke-white'
                      : p.isWeakest
                        ? 'fill-rose-500 stroke-white'
                        : 'fill-indigo-600 stroke-white',
                  )}
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          </div>

          <div className="w-full flex items-center justify-around text-[10px] font-bold text-slate-500 pt-2 border-t border-slate-100">
            {items.map((sub) => (
              <span key={sub.subjectId} className="truncate max-w-[80px]">
                {sub.subjectName}: {Math.round(sub.accuracy)}%
              </span>
            ))}
          </div>
        </div>
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
