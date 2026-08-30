import React from 'react';
import {
  Timer,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  BarChart3,
  Zap,
  Clock,
  TrendingDown,
} from 'lucide-react';
import cn from 'classnames';
import type { TimeAnalyticsReport } from '@/types/exam.types';

interface Props {
  timeAnalysis: TimeAnalyticsReport;
}

export const TimeAnalyticsView: React.FC<Props> = ({ timeAnalysis }) => {
  const totalRushed = timeAnalysis.pacingMetrics?.rushedCount || 0;
  const totalOptimal = timeAnalysis.pacingMetrics?.optimalPaceCount || 0;
  const totalOverthought = timeAnalysis.pacingMetrics?.overthoughtCount || 0;
  const totalPacedQuestions = totalRushed + totalOptimal + totalOverthought || 1;

  const timeWastedMins = Math.round((timeAnalysis.timeWastedSeconds || 0) / 60);

  return (
    <div className="space-y-6">
      {/* ── Time Wasted Alert Callout Banner ──────────────────────── */}
      {timeAnalysis.timeWastedSeconds > 0 && (
        <div className="rounded-3xl border border-amber-300/80 bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-50 p-5 md:p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0">
              <TrendingDown size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                Time Investment Efficiency Alert
              </h4>
              <p className="text-xs text-amber-900/90 mt-0.5 max-w-xl leading-relaxed">
                You spent ~
                <strong>
                  {timeWastedMins} minutes ({timeAnalysis.timeWastedSeconds}s)
                </strong>{' '}
                on questions that were answered incorrectly or skipped. Improving your
                decision-speed will free up crucial minutes for high-scoring questions.
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-amber-600/10 border border-amber-300 px-4 py-2 text-center shrink-0 w-full sm:w-auto">
            <span className="text-xl font-black text-amber-900 block">{timeWastedMins}m</span>
            <span className="text-[10px] font-bold text-amber-700 uppercase">
              Unproductive Time
            </span>
          </div>
        </div>
      )}

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

      {/* ── Speed Extremes: Fastest & Slowest Questions ─────────── */}
      {(timeAnalysis.fastestQuestion || timeAnalysis.slowestQuestion) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {timeAnalysis.fastestQuestion && (
            <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-500/10 via-teal-50/40 to-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-teal-800 font-bold text-xs uppercase tracking-wider">
                  <Zap size={16} className="text-teal-600" />
                  <span>Fastest Answered Question</span>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide border',
                    timeAnalysis.fastestQuestion.isCorrect
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300',
                  )}
                >
                  {timeAnalysis.fastestQuestion.isCorrect ? 'Correct ✓' : 'Wrong ✗'}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900">
                  {timeAnalysis.fastestQuestion.timeSeconds}s
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Question #{timeAnalysis.fastestQuestion.displayOrder} (
                  {timeAnalysis.fastestQuestion.sectionName})
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Quickest question attempt recorded during this test session.
              </p>
            </div>
          )}

          {timeAnalysis.slowestQuestion && (
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-500/10 via-indigo-50/40 to-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs uppercase tracking-wider">
                  <Clock size={16} className="text-indigo-600" />
                  <span>Slowest Bottleneck Question</span>
                </div>
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide border',
                    timeAnalysis.slowestQuestion.isCorrect
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300',
                  )}
                >
                  {timeAnalysis.slowestQuestion.isCorrect ? 'Correct ✓' : 'Wrong ✗'}
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-3xl font-black text-slate-900">
                  {timeAnalysis.slowestQuestion.timeSeconds}s
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Question #{timeAnalysis.slowestQuestion.displayOrder} (
                  {timeAnalysis.slowestQuestion.sectionName})
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Longest question attempt. Evaluate whether time invested yielded positive marks.
              </p>
            </div>
          )}
        </div>
      )}

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

      {/* ── Subject Time Allocation & Benchmark Comparison ───────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <BarChart3 size={18} className="text-indigo-600" />
          Subject-wise Time Allocation vs Recommended Benchmark
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          Comparison between your actual time spent and the ideal recommended time distribution.
        </p>

        <div className="space-y-5">
          {(timeAnalysis.subjectBenchmarkComparisons?.length
            ? timeAnalysis.subjectBenchmarkComparisons
            : timeAnalysis.subjectTimeDistribution.map((item) => ({
                subjectName: item.subjectName,
                actualSeconds: item.timeSpentSeconds,
                recommendedSeconds: item.timeSpentSeconds,
                deltaPercent: 0,
                observation: `${Math.round(item.timeSpentSeconds / 60)}m spent (${item.percentageOfTotalTime}%)`,
              }))
          ).map((item) => (
            <div
              key={item.subjectName}
              className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{item.subjectName}</span>
                  {item.deltaPercent !== 0 && (
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold border',
                        item.deltaPercent > 20
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : item.deltaPercent < -20
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300',
                      )}
                    >
                      {item.deltaPercent > 0
                        ? `+${item.deltaPercent}% time`
                        : `${item.deltaPercent}% time`}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-600 font-semibold">
                  Actual:{' '}
                  <strong className="text-slate-900">{Math.round(item.actualSeconds / 60)}m</strong>{' '}
                  / Recommended: ~{Math.round(item.recommendedSeconds / 60)}m
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    item.deltaPercent > 20 ? 'bg-amber-500' : 'bg-indigo-600',
                  )}
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        5,
                        timeAnalysis.totalTimeUsedSeconds > 0
                          ? (item.actualSeconds / timeAnalysis.totalTimeUsedSeconds) * 100
                          : 33,
                      ),
                    )}%`,
                  }}
                />
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">{item.observation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
