import React, { useState } from 'react';
import cn from 'classnames';
import { Target, Sliders, Search } from 'lucide-react';
import type {
  ChapterAnalyticsItem,
  PerformanceStatus,
  PerformanceThresholds,
} from '@/types/exam.types';

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
      return { label: 'Critical Focus', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
    default:
      return { label: 'Not Attempted', bg: 'bg-slate-50 text-slate-600 border-slate-200' };
  }
};

interface Props {
  chapters: {
    items: ChapterAnalyticsItem[];
    mastered: ChapterAnalyticsItem[];
    revisionNeeded: ChapterAnalyticsItem[];
    criticalFocus: ChapterAnalyticsItem[];
  };
  thresholds?: PerformanceThresholds;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  excellent: 80,
  strong: 65,
  good: 50,
  weak: 35,
};

export const ChapterDiagnosisView: React.FC<Props> = ({
  chapters,
  thresholds = DEFAULT_THRESHOLDS,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'REVISION' | 'MASTERED'>('ALL');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');

  const subjects = Array.from(new Set(chapters.items.map((c) => c.subjectName)));

  const baseItems =
    filter === 'ALL'
      ? chapters.items
      : filter === 'CRITICAL'
        ? chapters.criticalFocus
        : filter === 'REVISION'
          ? chapters.revisionNeeded
          : chapters.mastered;

  const filteredChapters = baseItems.filter((c) => {
    const matchesSearch =
      c.chapterName.toLowerCase().includes(search.toLowerCase()) ||
      c.subjectName.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === 'ALL' || c.subjectName === subjectFilter;
    return matchesSearch && matchesSubject;
  });

  return (
    <div className="space-y-6">
      {/* ── Configurable Threshold Inspector Card ─────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Configurable Diagnostic Thresholds
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-3 py-1">
            Exam Custom Config Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-center">
            <span className="text-sm font-black text-emerald-700 block">
              ≥ {thresholds.excellent}%
            </span>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
              EXCELLENT
            </span>
          </div>
          <div className="rounded-2xl border border-teal-200 bg-teal-50/60 p-3.5 text-center">
            <span className="text-sm font-black text-teal-700 block">
              {thresholds.strong}%–{thresholds.excellent - 1}%
            </span>
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
              STRONG
            </span>
          </div>
          <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3.5 text-center">
            <span className="text-sm font-black text-blue-700 block">
              {thresholds.good}%–{thresholds.strong - 1}%
            </span>
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
              GOOD
            </span>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3.5 text-center">
            <span className="text-sm font-black text-amber-700 block">
              {thresholds.weak}%–{thresholds.good - 1}%
            </span>
            <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
              WEAK
            </span>
          </div>
          <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3.5 text-center col-span-2 sm:col-span-1">
            <span className="text-sm font-black text-rose-700 block">&lt; {thresholds.weak}%</span>
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
              CRITICAL
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter Controls & Search Bar ────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('ALL')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm',
              filter === 'ALL'
                ? 'bg-indigo-600 text-white shadow-indigo-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200',
            )}
          >
            All Chapters ({chapters.items.length})
          </button>
          <button
            onClick={() => setFilter('CRITICAL')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm',
              filter === 'CRITICAL'
                ? 'bg-rose-600 text-white shadow-rose-200'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
            )}
          >
            Critical Focus ({chapters.criticalFocus.length})
          </button>
          <button
            onClick={() => setFilter('REVISION')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm',
              filter === 'REVISION'
                ? 'bg-amber-600 text-white shadow-amber-200'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
            )}
          >
            Revision Needed ({chapters.revisionNeeded.length})
          </button>
          <button
            onClick={() => setFilter('MASTERED')}
            className={cn(
              'rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm',
              filter === 'MASTERED'
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
            )}
          >
            Mastered ({chapters.mastered.length})
          </button>
        </div>

        {/* Search & Subject select */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search chapters..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Chapters List Cards ─────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="divide-y divide-slate-100">
          {filteredChapters.map((chap) => {
            const badge = getStatusBadge(chap.status);
            const accColor =
              chap.accuracy >= 75
                ? 'bg-emerald-500'
                : chap.accuracy >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500';

            return (
              <div
                key={chap.chapterId}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50/80 transition-all gap-4"
              >
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold uppercase text-indigo-700 border border-indigo-100">
                      {chap.subjectName}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {chap.chapterName}
                    </h4>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>
                      Questions: <strong>{chap.totalQuestions}</strong>
                    </span>
                    <span>
                      Score:{' '}
                      <strong>
                        {chap.score}/{chap.maxScore}
                      </strong>{' '}
                      Marks
                    </span>
                    <span>
                      Avg Speed: <strong>{chap.avgTimePerQuestionSeconds}s/Q</strong>
                    </span>
                  </div>
                </div>

                {/* Right: Metrics + Status Badge */}
                <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                  {/* Correct / Wrong / Skipped */}
                  <div className="flex items-center gap-3 text-xs font-bold">
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {chap.correct}✓
                    </span>
                    <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">
                      {chap.wrong}✗
                    </span>
                    <span className="text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                      {chap.unattempted}—
                    </span>
                  </div>

                  {/* Accuracy Bar & Value */}
                  <div className="w-24 text-right">
                    <span className="text-sm font-black text-slate-900 block leading-tight">
                      {chap.accuracy.toFixed(1)}%
                    </span>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn('h-full', accColor)}
                        style={{ width: `${Math.min(100, Math.max(0, chap.accuracy))}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={cn(
                      'rounded-xl px-3 py-1 text-[10px] font-bold uppercase border min-w-[100px] text-center shrink-0 shadow-sm',
                      badge.bg,
                    )}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>
            );
          })}

          {filteredChapters.length === 0 && (
            <div className="p-12 text-center text-sm text-slate-500">
              <Target size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">
                No chapters found matching this filter.
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try selecting a different category or clearing search.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
