import React from 'react';
import { Timer, CheckCircle2, AlertTriangle, HelpCircle, BarChart3 } from 'lucide-react';
import type { TimeAnalyticsReport } from '@/types/exam.types';

interface Props {
  timeAnalysis: TimeAnalyticsReport;
}

export const TimeAnalyticsView: React.FC<Props> = ({ timeAnalysis }) => {
  const totalRushed = timeAnalysis.pacingMetrics.rushedCount;
  const totalOptimal = timeAnalysis.pacingMetrics.optimalPaceCount;
  const totalOverthought = timeAnalysis.pacingMetrics.overthoughtCount;
  const totalPacedQuestions = totalRushed + totalOptimal + totalOverthought || 1;

  return (
    <div className="space-y-6">
      {/* ── 3 Outcome Time Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-2">
            <CheckCircle2 size={16} />
            <span>Time on Correct Answers</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {timeAnalysis.avgTimeOnCorrectSeconds}s
            </span>
            <span className="text-xs text-slate-500 font-semibold">avg / question</span>
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Total of{' '}
            <strong>{Math.round(timeAnalysis.timeOnCorrectQuestionsSeconds / 60)} mins</strong>{' '}
            spent on questions answered correctly.
          </p>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertTriangle size={16} />
            <span>Time on Wrong Answers</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {timeAnalysis.avgTimeOnWrongSeconds}s
            </span>
            <span className="text-xs text-slate-500 font-semibold">avg / question</span>
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Total of{' '}
            <strong>{Math.round(timeAnalysis.timeOnWrongQuestionsSeconds / 60)} mins</strong> spent
            on questions answered incorrectly.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-100/50 to-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-wider mb-2">
            <HelpCircle size={16} />
            <span>Time on Skipped Questions</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">
              {timeAnalysis.avgTimeOnUnattemptedSeconds}s
            </span>
            <span className="text-xs text-slate-500 font-semibold">avg before skip</span>
          </div>
          <p className="mt-2 text-xs text-slate-600 leading-relaxed">
            Total of{' '}
            <strong>{Math.round(timeAnalysis.timeOnUnattemptedQuestionsSeconds / 60)} mins</strong>{' '}
            spent analyzing questions before skipping.
          </p>
        </div>
      </div>

      {/* ── Pacing Distribution Visual Bar ──────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Timer size={18} className="text-indigo-600" />
          Question Pacing Distribution
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Categorizes how you paced each question based on time benchmarks.
        </p>

        {/* Stacked Pacing Bar */}
        <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex shadow-inner">
          <div
            className="bg-amber-500 transition-all duration-500"
            style={{ width: `${(totalRushed / totalPacedQuestions) * 100}%` }}
            title={`Rushed: ${totalRushed}`}
          />
          <div
            className="bg-emerald-500 transition-all duration-500"
            style={{ width: `${(totalOptimal / totalPacedQuestions) * 100}%` }}
            title={`Optimal Pace: ${totalOptimal}`}
          />
          <div
            className="bg-rose-500 transition-all duration-500"
            style={{ width: `${(totalOverthought / totalPacedQuestions) * 100}%` }}
            title={`Overthought/Stuck: ${totalOverthought}`}
          />
        </div>

        {/* Legend 3 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800">⚡ Rushed (&lt; 15s)</span>
              <span className="text-xl font-black text-amber-700">{totalRushed}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">High probability of silly mistakes</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800">🎯 Optimal Pace</span>
              <span className="text-xl font-black text-emerald-700">{totalOptimal}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Ideal time allocation</p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800">⏳ Stuck (&gt; 2.5x Avg)</span>
              <span className="text-xl font-black text-rose-700">{totalOverthought}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Time sink questions; learn to skip</p>
          </div>
        </div>
      </div>

      {/* ── Subject Time Allocation Chart ───────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <BarChart3 size={18} className="text-indigo-600" />
          Subject-wise Time Allocation
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          How your total test time of {Math.round(timeAnalysis.totalTimeUsedSeconds / 60)} minutes
          was distributed across subjects.
        </p>

        <div className="space-y-4">
          {timeAnalysis.subjectTimeDistribution.map((item) => (
            <div key={item.subjectName} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-800">{item.subjectName}</span>
                <span className="text-slate-600">
                  {Math.round(item.timeSpentSeconds / 60)}m ({item.percentageOfTotalTime}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, item.percentageOfTotalTime))}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
