import React, { useState } from 'react';
import cn from 'classnames';
import { Zap, Filter, Check, Sparkles } from 'lucide-react';
import type { ActionableRecommendation } from '@/types/exam.types';

interface Props {
  recommendations: ActionableRecommendation[];
}

export const SmartRecommendationsView: React.FC<Props> = ({ recommendations }) => {
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

  return (
    <div className="space-y-6">
      {/* ── Header Banner ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 p-6 md:p-8 text-white shadow-xl">
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles size={16} />
              <span>AI Action Plan</span>
            </div>
            <h3 className="text-2xl font-black text-white">Smart Diagnostic Action Plan</h3>
            <p className="text-xs text-indigo-200 mt-1 max-w-lg leading-relaxed">
              Targeted study interventions prioritized by maximum potential marks increase for your
              next mock test.
            </p>
          </div>

          <div className="rounded-2xl bg-white/10 border border-white/15 p-4 text-center sm:text-right shrink-0 backdrop-blur">
            <span className="text-3xl font-black text-emerald-400 block leading-tight">
              +{totalPotentialGain}
            </span>
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider mt-0.5 block">
              Max Potential Gain
            </span>
          </div>
        </div>
      </div>

      {/* ── Priority Filter Bar ──────────────────────────────────── */}
      <div className="flex items-center gap-2">
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
