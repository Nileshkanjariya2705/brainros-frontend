import React, { useState } from 'react';
import cn from 'classnames';
import {
  Zap,
  Filter,
  Check,
  Sparkles,
  Award,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import type {
  ActionableRecommendation,
  ChapterAnalyticsItem,
  SubjectAnalyticsItem,
} from '@/types/exam.types';

interface Props {
  recommendations: ActionableRecommendation[];
  chapters?: {
    items: ChapterAnalyticsItem[];
    mastered: ChapterAnalyticsItem[];
    revisionNeeded: ChapterAnalyticsItem[];
    criticalFocus: ChapterAnalyticsItem[];
  };
  subjects?: {
    items: SubjectAnalyticsItem[];
    strongestSubject: SubjectAnalyticsItem | null;
    weakestSubject: SubjectAnalyticsItem | null;
  };
}

export const SmartRecommendationsView: React.FC<Props> = ({
  recommendations,
  chapters,
  subjects,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const filteredRecs = recommendations.filter((r) => {
    if (priorityFilter === 'ALL') return true;
    return r.priority === priorityFilter;
  });

  const totalPotentialGain = recommendations.reduce((acc, r) => acc + r.impactScore, 0);

  const toggleCompleted = (id: string) => {
    setCompletedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Top Strengths (Top 3 highest accuracy chapters or mastered)
  const topStrengths = (chapters?.items || [])
    .filter((c) => c.accuracy >= 75)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 4);

  // Priority Focus Areas (Critical & low accuracy chapters)
  const priorityFocusAreas = (chapters?.items || [])
    .filter((c) => c.accuracy < 60 && c.totalQuestions > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* ── Header Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 p-6 md:p-8 text-white shadow-xl">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles size={16} />
              <span>AI Diagnostic Intelligence</span>
            </div>
            <h3 className="text-2xl font-black text-white">Smart Action Plan & Diagnostics</h3>
            <p className="text-xs text-indigo-200 mt-1 max-w-lg leading-relaxed">
              Automated strengths extraction, high-yield weakness remediation, and concrete
              step-by-step revision guidance.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/15 p-4 text-center sm:text-right shrink-0 backdrop-blur">
            <span className="text-3xl font-black text-emerald-400 block leading-tight">
              +{totalPotentialGain}
            </span>
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider mt-0.5 block">
              Max Potential Score Recovery
            </span>
          </div>
        </div>
      </div>

      {/* ── 3-Column AI Summary Grid: Strengths, Focus Areas, Next Action ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* 🟢 Column 1: Top Strengths */}
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-500/10 via-emerald-50/40 to-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-3">
              <Award size={16} className="text-emerald-600" />
              <span>Top Strengths</span>
            </div>
            <h4 className="text-base font-black text-slate-900 mb-2">Commanded Topics</h4>
            <p className="text-xs text-slate-600 mb-4">
              High accuracy maintained. Retain mastery with rapid periodic formula revision.
            </p>

            <div className="space-y-2">
              {topStrengths.length > 0 ? (
                topStrengths.map((item) => (
                  <div
                    key={item.chapterId}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2"
                  >
                    <span className="text-xs font-bold text-emerald-950 truncate">
                      {item.chapterName}
                    </span>
                    <span className="rounded-full bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 shrink-0">
                      {Math.round(item.accuracy)}% Acc
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                  Focus on upcoming tests to identify standout subject strengths.
                </div>
              )}
            </div>
          </div>

          {subjects?.strongestSubject && (
            <div className="mt-4 pt-3 border-t border-emerald-200/60 text-[11px] text-emerald-900 font-semibold flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
              <span>
                Strongest Subject: <strong>{subjects.strongestSubject.subjectName}</strong>
              </span>
            </div>
          )}
        </div>

        {/* 🔴 Column 2: Priority Focus Areas */}
        <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-500/10 via-rose-50/40 to-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider mb-3">
              <AlertCircle size={16} className="text-rose-600" />
              <span>Priority Focus Areas</span>
            </div>
            <h4 className="text-base font-black text-slate-900 mb-2">Critical Leaks</h4>
            <p className="text-xs text-slate-600 mb-4">
              Lowest accuracy areas contributing to score drops and negative penalties.
            </p>

            <div className="space-y-2">
              {priorityFocusAreas.length > 0 ? (
                priorityFocusAreas.map((item) => (
                  <div
                    key={item.chapterId}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-rose-200 bg-rose-50/70 px-3.5 py-2"
                  >
                    <span className="text-xs font-bold text-rose-950 truncate">
                      {item.chapterName}
                    </span>
                    <span className="rounded-full bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 shrink-0">
                      {Math.round(item.accuracy)}% Acc
                    </span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-500">
                  No critical topic failures detected.
                </div>
              )}
            </div>
          </div>

          {subjects?.weakestSubject && (
            <div className="mt-4 pt-3 border-t border-rose-200/60 text-[11px] text-rose-900 font-semibold flex items-center gap-1.5">
              <AlertCircle size={13} className="text-rose-600 shrink-0" />
              <span>
                Needs Attention: <strong>{subjects.weakestSubject.subjectName}</strong>
              </span>
            </div>
          )}
        </div>

        {/* 💡 Column 3: Next Action Plan */}
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-500/10 via-indigo-50/40 to-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider mb-3">
              <Lightbulb size={16} className="text-indigo-600" />
              <span>Next Action Plan</span>
            </div>
            <h4 className="text-base font-black text-slate-900 mb-2">Strategic Steps</h4>
            <p className="text-xs text-slate-600 mb-4">
              Concrete high-yield steps to implement before your next practice test.
            </p>

            <div className="space-y-2.5">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <div
                  key={rec.id}
                  className="rounded-2xl border border-indigo-100 bg-white p-3 shadow-xs space-y-1"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-black shrink-0">
                      {idx + 1}
                    </span>
                    <span className="truncate">{rec.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug pl-7">{rec.actionStep}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-indigo-200/60 text-[11px] text-indigo-900 font-semibold flex items-center gap-1.5">
            <BookOpen size={13} className="text-indigo-600 shrink-0" />
            <span>Target: Solve 20+ topic drills per identified weak chapter</span>
          </div>
        </div>
      </div>

      {/* ── Priority Filter Bar ──────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-500 mr-2 flex items-center gap-1">
          <Filter size={13} />
          Priority:
        </span>
        <button
          onClick={() => setPriorityFilter('ALL')}
          className={cn(
            'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all',
            priorityFilter === 'ALL'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200',
          )}
        >
          All Insights ({recommendations.length})
        </button>
        <button
          onClick={() => setPriorityFilter('HIGH')}
          className={cn(
            'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all',
            priorityFilter === 'HIGH'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200',
          )}
        >
          High Priority ({recommendations.filter((r) => r.priority === 'HIGH').length})
        </button>
        <button
          onClick={() => setPriorityFilter('MEDIUM')}
          className={cn(
            'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all',
            priorityFilter === 'MEDIUM'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
          )}
        >
          Medium Priority ({recommendations.filter((r) => r.priority === 'MEDIUM').length})
        </button>
        <button
          onClick={() => setPriorityFilter('LOW')}
          className={cn(
            'rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all',
            priorityFilter === 'LOW'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200',
          )}
        >
          Low Priority ({recommendations.filter((r) => r.priority === 'LOW').length})
        </button>
      </div>

      {/* ── Recommendations List ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4">
        {filteredRecs.map((rec) => {
          const isDone = completedIds.includes(rec.id);
          return (
            <div
              key={rec.id}
              className={cn(
                'group relative rounded-3xl border bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5',
                isDone ? 'border-emerald-200 bg-emerald-50/20 opacity-75' : 'border-slate-200',
              )}
            >
              <div className="flex-1">
                {/* Badge Row */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      'rounded-lg px-2.5 py-0.5 text-[10px] font-extrabold uppercase border',
                      rec.priority === 'HIGH'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : rec.priority === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200',
                    )}
                  >
                    {rec.priority} Priority
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    • {rec.category.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Title & Description */}
                <h4
                  className={cn(
                    'text-base font-bold text-slate-900',
                    isDone && 'line-through text-slate-500',
                  )}
                >
                  {rec.title}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.description}</p>

                {/* Action Step Box */}
                <div className="mt-3.5 rounded-2xl bg-slate-50 border border-slate-100 p-3.5 text-xs text-indigo-900 font-semibold flex items-start gap-2.5">
                  <Zap size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">Action Step: {rec.actionStep}</span>
                </div>
              </div>

              {/* Right: Potential Marks + Done Button */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center md:border-l md:border-slate-100 md:pl-6 shrink-0 gap-3">
                <div className="text-left sm:text-right">
                  <span className="text-2xl font-black text-emerald-600 block leading-tight">
                    +{rec.impactScore}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Potential Marks
                  </span>
                </div>

                <button
                  onClick={() => toggleCompleted(rec.id)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                >
                  <Check size={13} />
                  <span>{isDone ? 'Completed' : 'Mark as Done'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
