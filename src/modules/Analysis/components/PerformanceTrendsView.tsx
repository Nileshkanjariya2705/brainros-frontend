import React, { useState } from 'react';
import {
  TrendingUp,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
} from 'lucide-react';
import cn from 'classnames';
import type {
  PerformanceTrendsResponse,
  DirectComparisonResponse,
  TrendDirection,
} from '@/types/exam.types';
import Button from '@/components/ui/Button';

interface PerformanceTrendsViewProps {
  data: PerformanceTrendsResponse;
  comparisonData?: DirectComparisonResponse | null;
  onCompareMocks?: (attemptA: string, attemptB: string) => void;
  isLoadingComparison?: boolean;
}

export const PerformanceTrendsView: React.FC<PerformanceTrendsViewProps> = ({
  data,
  comparisonData,
  onCompareMocks,
  isLoadingComparison = false,
}) => {
  const {
    summary,
    mocks,
    scoreTrend,
    accuracyTrend,
    rankTrend,
    timeTrend,
    subjectTrends,
    trendInsights,
  } = data;

  const [activeChartTab, setActiveChartTab] = useState<'SCORE' | 'ACCURACY' | 'RANK' | 'TIME'>(
    'SCORE',
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    subjectTrends[0]?.subjectId || '',
  );

  // Comparator selection state
  const [selectedMockA, setSelectedMockA] = useState<string>(mocks[0]?.attemptId || '');
  const [selectedMockB, setSelectedMockB] = useState<string>(
    mocks[mocks.length - 1]?.attemptId || '',
  );

  if (!mocks || mocks.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <TrendingUp className="mx-auto text-slate-300 mb-3" size={40} />
        <h3 className="text-base font-bold text-slate-800">No Mock History Available</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Complete at least two full-length mock exams to visualize your score trajectory, accuracy
          gains, and ranking improvement over time.
        </p>
      </div>
    );
  }

  const getDirectionBadge = (dir: TrendDirection, label: string) => {
    switch (dir) {
      case 'IMPROVING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
            <ArrowUpRight size={13} />
            {label}: IMPROVING
          </span>
        );
      case 'DECLINING':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
            <ArrowDownRight size={13} />
            {label}: DECLINING
          </span>
        );
      case 'STABLE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
            <Minus size={13} />
            {label}: STABLE
          </span>
        );
      default:
        return null;
    }
  };

  const handleRunComparison = () => {
    if (onCompareMocks && selectedMockA && selectedMockB) {
      onCompareMocks(selectedMockA, selectedMockB);
    }
  };

  const activeSubject =
    subjectTrends.find((s) => s.subjectId === selectedSubjectId) || subjectTrends[0];

  return (
    <div className="space-y-6">
      {/* ── 1. Growth Highlights Hero Card ───────────────────────────── */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10 border-b border-indigo-700/50 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                Performance Analytics
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
                {summary.totalMocks} Mocks Analyzed
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
              Performance Trend & Trajectory
            </h2>
            <p className="text-xs md:text-sm text-indigo-200 mt-1">
              Aggregated progression across all completed mock examinations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {getDirectionBadge(summary.trendDirections.scoreTrend, 'Score')}
            {getDirectionBadge(summary.trendDirections.accuracyTrend, 'Accuracy')}
            {summary.trendDirections.rankTrend !== 'INSUFFICIENT_DATA' &&
              getDirectionBadge(summary.trendDirections.rankTrend, 'Rank')}
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 relative z-10">
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
              Score Gain
            </span>
            <div className="text-2xl md:text-3xl font-black text-white mt-1">
              {summary.scoreDelta >= 0 ? `+${summary.scoreDelta}` : summary.scoreDelta}
            </div>
            <span className="text-[10px] text-emerald-300 font-bold">
              {summary.percentageDelta >= 0
                ? `+${summary.percentageDelta}%`
                : `${summary.percentageDelta}%`}{' '}
              Net Growth
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
              Solving Accuracy
            </span>
            <div className="text-2xl md:text-3xl font-black text-white mt-1">
              {summary.latestMock?.accuracy ?? 0}%
            </div>
            <span className="text-[10px] text-teal-300 font-bold">
              {summary.accuracyDelta >= 0
                ? `+${summary.accuracyDelta}%`
                : `${summary.accuracyDelta}%`}{' '}
              vs First Mock
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
              Rank Trajectory
            </span>
            <div className="text-2xl md:text-3xl font-black text-white mt-1">
              {summary.latestMock?.rank ? `#${summary.latestMock.rank}` : '—'}
            </div>
            <span className="text-[10px] text-emerald-300 font-bold">
              {summary.rankImprovement !== null
                ? summary.rankImprovement > 0
                  ? `▲ Improved by ${summary.rankImprovement} spots`
                  : `▼ Slipped by ${Math.abs(summary.rankImprovement)} spots`
                : 'Official Rank Tracked'}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
              Percentile
            </span>
            <div className="text-2xl md:text-3xl font-black text-amber-300 mt-1">
              {summary.latestMock?.percentile ? `${summary.latestMock.percentile}%` : '—'}
            </div>
            <span className="text-[10px] text-indigo-200 font-bold">
              {summary.percentileDelta !== null
                ? `${summary.percentileDelta >= 0 ? `+${summary.percentileDelta}%` : `${summary.percentileDelta}%`} Gain`
                : 'National Percentile'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Interactive Charts Section ────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">Progression Trajectory</h3>
            <p className="text-xs text-slate-500">
              Visual progress across chronological mock examinations.
            </p>
          </div>

          {/* Chart Metric Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200">
            {(['SCORE', 'ACCURACY', 'RANK', 'TIME'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveChartTab(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all',
                  activeChartTab === tab
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800',
                )}
              >
                {tab === 'SCORE'
                  ? 'Score & Marks'
                  : tab === 'ACCURACY'
                    ? 'Accuracy %'
                    : tab === 'RANK'
                      ? 'Rank & %tile'
                      : 'Speed & Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Chart View Area */}
        <div className="min-h-[220px] flex flex-col justify-end">
          {activeChartTab === 'SCORE' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 items-end pt-8">
              {scoreTrend.map((pt) => {
                const heightPercent = Math.max(
                  15,
                  Math.min(100, (pt.score / pt.maximumScore) * 100),
                );
                return (
                  <div key={pt.attemptId} className="flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-black text-indigo-700">{pt.score}</span>
                    <div className="w-full h-36 bg-slate-100 rounded-2xl p-1 flex flex-col justify-end">
                      <div
                        className="w-full rounded-xl bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500 group-hover:to-indigo-300 transition-all"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-700">{pt.label}</span>
                    <span className="text-[9px] text-slate-400">{pt.date}</span>
                  </div>
                );
              })}
            </div>
          )}

          {activeChartTab === 'ACCURACY' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 items-end pt-8">
              {accuracyTrend.map((pt) => {
                return (
                  <div key={pt.attemptId} className="flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-black text-teal-600">{pt.accuracy}%</span>
                    <div className="w-full h-36 bg-slate-100 rounded-2xl p-1 flex flex-col justify-end">
                      <div
                        className="w-full rounded-xl bg-gradient-to-t from-teal-600 to-teal-400 group-hover:from-teal-500 group-hover:to-teal-300 transition-all"
                        style={{ height: `${Math.max(15, pt.accuracy)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-700">{pt.label}</span>
                    <span className="text-[9px] text-slate-400">{pt.date}</span>
                  </div>
                );
              })}
            </div>
          )}

          {activeChartTab === 'RANK' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 items-end pt-8">
              {rankTrend.map((pt) => {
                return (
                  <div key={pt.attemptId} className="flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-black text-purple-700">
                      {pt.rank ? `#${pt.rank}` : 'Pending'}
                    </span>
                    <div className="w-full h-36 bg-slate-100 rounded-2xl p-1 flex flex-col justify-end">
                      <div
                        className="w-full rounded-xl bg-gradient-to-t from-purple-600 to-purple-400 group-hover:from-purple-500 group-hover:to-purple-300 transition-all"
                        style={{ height: `${pt.percentile ? Math.max(15, pt.percentile) : 20}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-700">{pt.label}</span>
                    <span className="text-[9px] text-slate-400 font-bold text-amber-600">
                      {pt.percentile ? `${pt.percentile}%tile` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {activeChartTab === 'TIME' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 items-end pt-8">
              {timeTrend.map((pt) => {
                const mins = pt.timeUsedSeconds ? Math.round(pt.timeUsedSeconds / 60) : 0;
                return (
                  <div key={pt.attemptId} className="flex flex-col items-center gap-2 group">
                    <span className="text-[11px] font-black text-amber-700">{mins} min</span>
                    <div className="w-full h-36 bg-slate-100 rounded-2xl p-1 flex flex-col justify-end">
                      <div
                        className="w-full rounded-xl bg-gradient-to-t from-amber-600 to-amber-400 group-hover:from-amber-500 group-hover:to-amber-300 transition-all"
                        style={{
                          height: `${pt.timeUtilizationPercentage ? Math.max(15, pt.timeUtilizationPercentage) : 50}%`,
                        }}
                      />
                    </div>
                    <span className="text-[11px] font-extrabold text-slate-700">{pt.label}</span>
                    <span className="text-[9px] text-slate-400">{pt.date}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Subject-by-Subject Trend Breakdown ────────────────────── */}
      {subjectTrends.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Subject Performance Trajectory</h3>
              <p className="text-xs text-slate-500">
                Track subject-specific accuracy gains across all tests.
              </p>
            </div>

            {/* Subject Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {subjectTrends.map((sub) => (
                <button
                  key={sub.subjectId}
                  onClick={() => setSelectedSubjectId(sub.subjectId)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all border whitespace-nowrap',
                    selectedSubjectId === sub.subjectId
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                  )}
                >
                  {sub.subjectName}
                </button>
              ))}
            </div>
          </div>

          {/* Subject Highlights Badges */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {summary.mostImprovedSubject && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <ArrowUpRight size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    Most Improved
                  </span>
                  <span className="text-xs font-black text-emerald-950">
                    {summary.mostImprovedSubject.subjectName} (+
                    {summary.mostImprovedSubject.accuracyDelta}% gain)
                  </span>
                </div>
              </div>
            )}

            {summary.strongestCurrentSubject && (
              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                  <Award size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-800 uppercase block">
                    Strongest Recent
                  </span>
                  <span className="text-xs font-black text-indigo-950">
                    {summary.strongestCurrentSubject.subjectName} (
                    {summary.strongestCurrentSubject.latestAccuracy}% acc)
                  </span>
                </div>
              </div>
            )}

            {summary.weakestCurrentSubject && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">
                    Focus Priority
                  </span>
                  <span className="text-xs font-black text-amber-950">
                    {summary.weakestCurrentSubject.subjectName} (
                    {summary.weakestCurrentSubject.latestAccuracy}% acc)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Selected Subject Trend Points Grid */}
          {activeSubject && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
              {activeSubject.points.map((pt) => (
                <div
                  key={pt.attemptId}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center"
                >
                  <span className="text-xs font-extrabold text-slate-700 block">{pt.label}</span>
                  <span className="text-base font-black text-indigo-700 block mt-0.5">
                    {pt.accuracy}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block">
                    {pt.score} / {pt.maxScore} Marks
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Actionable Trend Insights ─────────────────────────────── */}
      {trendInsights && trendInsights.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="text-indigo-600" size={18} />
            <h3 className="text-base font-black text-slate-900">Trend Insights & Guidance</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {trendInsights.map((insight, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-4 rounded-2xl border text-xs font-bold flex items-start gap-3',
                  insight.type === 'POSITIVE'
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                    : insight.type === 'WARNING'
                      ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                      : 'bg-slate-50 border-slate-200 text-slate-800',
                )}
              >
                {insight.type === 'POSITIVE' ? (
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                )}
                <span>{insight.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Side-by-Side Mock Comparator Tool ────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <GitCompare className="text-indigo-600" size={20} />
            <div>
              <h3 className="text-base font-black text-slate-900">Direct Mock Comparator</h3>
              <p className="text-xs text-slate-500">
                Compare any two mock exams side-by-side to inspect delta changes.
              </p>
            </div>
          </div>

          {/* Selectors & Trigger */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <select
              value={selectedMockA}
              onChange={(e) => setSelectedMockA(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {mocks.map((m) => (
                <option key={m.attemptId} value={m.attemptId}>
                  {m.label} ({m.score} pts)
                </option>
              ))}
            </select>

            <span className="text-slate-400">vs</span>

            <select
              value={selectedMockB}
              onChange={(e) => setSelectedMockB(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {mocks.map((m) => (
                <option key={m.attemptId} value={m.attemptId}>
                  {m.label} ({m.score} pts)
                </option>
              ))}
            </select>

            <Button
              size="sm"
              onClick={handleRunComparison}
              disabled={isLoadingComparison || selectedMockA === selectedMockB}
            >
              {isLoadingComparison ? 'Comparing...' : 'Compare'}
            </Button>
          </div>
        </div>

        {/* Side-by-Side Comparison Output */}
        {comparisonData && (
          <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Metric</th>
                  <th className="py-2.5 px-4 text-center">
                    {comparisonData.mockA.label} ({comparisonData.mockA.date})
                  </th>
                  <th className="py-2.5 px-4 text-center">
                    {comparisonData.mockB.label} ({comparisonData.mockB.date})
                  </th>
                  <th className="py-2.5 px-4 text-right">Net Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-800">Obtained Score</td>
                  <td className="py-2.5 px-4 text-center text-slate-700">
                    {comparisonData.mockA.score}
                  </td>
                  <td className="py-2.5 px-4 text-center text-slate-700">
                    {comparisonData.mockB.score}
                  </td>
                  <td className="py-2.5 px-4 text-right font-black text-emerald-600">
                    {comparisonData.scoreDelta >= 0
                      ? `+${comparisonData.scoreDelta}`
                      : comparisonData.scoreDelta}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-800">Solving Accuracy</td>
                  <td className="py-2.5 px-4 text-center text-slate-700">
                    {comparisonData.mockA.accuracy}%
                  </td>
                  <td className="py-2.5 px-4 text-center text-slate-700">
                    {comparisonData.mockB.accuracy}%
                  </td>
                  <td className="py-2.5 px-4 text-right font-black text-teal-600">
                    {comparisonData.accuracyDelta >= 0
                      ? `+${comparisonData.accuracyDelta}%`
                      : `${comparisonData.accuracyDelta}%`}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-800">National Rank</td>
                  <td className="py-2.5 px-4 text-center text-slate-700">
                    {comparisonData.mockA.rank ? `#${comparisonData.mockA.rank}` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-center text-slate-700">
                    {comparisonData.mockB.rank ? `#${comparisonData.mockB.rank}` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-black text-purple-600">
                    {comparisonData.rankImprovement !== null
                      ? comparisonData.rankImprovement > 0
                        ? `▲ +${comparisonData.rankImprovement} spots`
                        : `▼ ${comparisonData.rankImprovement} spots`
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-bold text-slate-800">Percentile</td>
                  <td className="py-2.5 px-4 text-center text-slate-700">
                    {comparisonData.mockA.percentile ? `${comparisonData.mockA.percentile}%` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-center text-slate-700">
                    {comparisonData.mockB.percentile ? `${comparisonData.mockB.percentile}%` : '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-black text-amber-600">
                    {comparisonData.percentileDelta !== null
                      ? `${comparisonData.percentileDelta >= 0 ? `+${comparisonData.percentileDelta}%` : `${comparisonData.percentileDelta}%`}`
                      : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PerformanceTrendsView;
