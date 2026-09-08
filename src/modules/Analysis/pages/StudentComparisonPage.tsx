import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Layers,
  ArrowUpRight,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  ArrowLeft,
  ArrowUpDown,
} from 'lucide-react';
import cn from 'classnames';
import { useGetStudentComparisonAPI } from '@/modules/Dashboard/services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import Loader from '@/components/feedback/Loader';
import type { DetailedComparisonResponse, ComparisonAttemptItem } from '@/types/exam.types';

export const StudentComparisonPage: React.FC = () => {
  const navigate = useNavigate();
  const { getStudentComparisonAPI, isLoading } = useGetStudentComparisonAPI();

  const [data, setData] = useState<DetailedComparisonResponse | null>(null);
  const [selectedAttemptIds, setSelectedAttemptIds] = useState<string[]>([]);
  const [examTypeFilter, setExamTypeFilter] = useState<string>('');
  const [activeSubject, setActiveSubject] = useState<string>('');
  const [sortField, setSortField] = useState<keyof ComparisonAttemptItem>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const fetchComparison = useCallback(async () => {
    const res = await getStudentComparisonAPI({
      examType: examTypeFilter || undefined,
      limit: 15,
      attemptIds: selectedAttemptIds.length > 0 ? selectedAttemptIds.join(',') : undefined,
    });
    if (res.data) {
      setData(res.data);
      if (res.data.subjectComparison.length > 0 && !activeSubject) {
        setActiveSubject(res.data.subjectComparison[0].subjectName);
      }
    }
  }, [getStudentComparisonAPI, examTypeFilter, selectedAttemptIds, activeSubject]);

  useEffect(() => {
    fetchComparison();
  }, [fetchComparison]);

  const summary = data?.summary;
  const attempts = data?.attempts || [];
  const subjectComparison = data?.subjectComparison || [];
  const subjectTrends = data?.subjectTrends || [];
  const insights = data?.insights || [];

  // Toggle selection of an attempt
  const toggleAttemptSelection = (attemptId: string) => {
    setSelectedAttemptIds((prev) => {
      if (prev.includes(attemptId)) {
        return prev.filter((id) => id !== attemptId);
      }
      return [...prev, attemptId];
    });
  };

  // Select all or reset
  const selectAllAttempts = () => {
    setSelectedAttemptIds([]);
  };

  // Find best values across attempts for table highlights
  const bestValues = useMemo(() => {
    if (attempts.length === 0) return { score: 0, accuracy: 0, rank: 0, percentile: 0 };
    const maxScore = Math.max(...attempts.map((a) => a.score));
    const maxAcc = Math.max(...attempts.map((a) => a.accuracy));
    const validRanks = attempts.map((a) => a.rank).filter((r): r is number => r !== null && r > 0);
    const minRank = validRanks.length > 0 ? Math.min(...validRanks) : 0; // Lower is best for rank
    const maxPerc = Math.max(...attempts.map((a) => a.percentile || 0));

    return { score: maxScore, accuracy: maxAcc, rank: minRank, percentile: maxPerc };
  }, [attempts]);

  // Sortable attempts list
  const sortedAttempts = useMemo(() => {
    return [...attempts].sort((a, b) => {
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [attempts, sortField, sortAsc]);

  const handleSort = (field: keyof ComparisonAttemptItem) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rank' ? true : false); // Rank ascending is better, score descending
    }
  };

  const activeSubjectTrend = useMemo(() => {
    return subjectTrends.find((st) => st.subjectName === activeSubject);
  }, [subjectTrends, activeSubject]);

  if (isLoading && !data) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <Loader label="Aggregating multi-mock comparison analytics & matrices..." />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* ── Page Header ───────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shrink-0">
              <BarChart3 size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-black text-slate-900">Attempt Comparison Dashboard</h1>
                <span className="rounded-full bg-indigo-50 text-indigo-700 text-xs font-black px-2.5 py-0.5 border border-indigo-200">
                  {summary?.totalAttempts || 0} Mocks Evaluated
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Comparative performance progression, score deltas, subject matrices, and rank
                improvements.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(PRIVATE_NAVIGATION.studentDashboard)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all self-start sm:self-auto"
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Mocks Multi-Selection Chips & Filters */}
        {attempts.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                Filter Mocks:
              </span>
              <button
                onClick={selectAllAttempts}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-bold transition-all border',
                  selectedAttemptIds.length === 0
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100',
                )}
              >
                All ({attempts.length})
              </button>

              {attempts.map((att, idx) => {
                const isSelected =
                  selectedAttemptIds.length === 0 || selectedAttemptIds.includes(att.attemptId);
                const mockLabel = `Mock ${String(idx + 1).padStart(2, '0')}`;

                return (
                  <button
                    key={att.attemptId}
                    onClick={() => toggleAttemptSelection(att.attemptId)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border',
                      isSelected
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-extrabold shadow-xs'
                        : 'bg-white border-slate-200 text-slate-400 hover:text-slate-600',
                    )}
                  >
                    {isSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                    <span>{mockLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                <Filter size={13} />
                Target:
              </span>
              <select
                value={examTypeFilter}
                onChange={(e) => setExamTypeFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Targets</option>
                <option value="JEE">JEE</option>
                <option value="NEET">NEET</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. First vs Latest Comparison Summary Bar ──────────────── */}
      {summary && summary.totalAttempts >= 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* First Mock Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block">
              Baseline • {summary.first?.label || 'Mock 01'}
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 font-mono">
                {summary.first?.score ?? '—'}
              </span>
              <span className="text-xs font-bold text-slate-400">
                / {summary.first?.maximumScore ?? 720}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 pt-2 border-t border-slate-100">
              <span>{summary.first?.accuracy}% Accuracy</span>
              <span>•</span>
              <span>
                {summary.first?.rank ? `#${summary.first.rank.toLocaleString('en-IN')}` : 'No Rank'}
              </span>
              <span>•</span>
              <span>{summary.first?.percentile ?? '—'} %ile</span>
            </div>
          </div>

          {/* Latest Mock Card */}
          <div className="rounded-3xl border-2 border-indigo-500 bg-indigo-50/30 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-indigo-700 block">
                Latest Attempt • {summary.latest?.label}
              </span>
              <span className="rounded-full bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5">
                Current
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-950 font-mono">
                {summary.latest?.score ?? '—'}
              </span>
              <span className="text-xs font-bold text-indigo-400">
                / {summary.latest?.maximumScore ?? 720}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold text-indigo-800 pt-2 border-t border-indigo-100">
              <span>{summary.latest?.accuracy}% Accuracy</span>
              <span>•</span>
              <span>
                {summary.latest?.rank
                  ? `#${summary.latest.rank.toLocaleString('en-IN')}`
                  : 'No Rank'}
              </span>
              <span>•</span>
              <span>{summary.latest?.percentile ?? '—'} %ile</span>
            </div>
          </div>

          {/* Net Progress Deltas */}
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-xs space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-800 block">
              Net Performance Delta
            </span>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span
                className={cn(
                  'text-3xl font-black font-mono',
                  summary.scoreDelta >= 0 ? 'text-emerald-700' : 'text-rose-700',
                )}
              >
                {summary.scoreDelta >= 0 ? `+${summary.scoreDelta}` : summary.scoreDelta}
              </span>
              <span className="text-xs font-bold text-slate-500">Marks Progress</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-2 border-t border-emerald-100">
              <span className="text-emerald-800">
                Accuracy:{' '}
                {summary.accuracyDelta >= 0
                  ? `+${summary.accuracyDelta}%`
                  : `${summary.accuracyDelta}%`}
              </span>
              <span className="text-emerald-800">
                {summary.rankImprovement !== null
                  ? summary.rankImprovement > 0
                    ? `+${summary.rankImprovement.toLocaleString('en-IN')} Positions`
                    : `${summary.rankImprovement.toLocaleString('en-IN')} Positions`
                  : 'Rank: Constant'}
              </span>
              <span className="text-emerald-800">
                Percentile:{' '}
                {summary.percentileDelta !== null && summary.percentileDelta >= 0
                  ? `+${summary.percentileDelta}`
                  : (summary.percentileDelta ?? '—')}
              </span>
              <span className="text-slate-600">
                {summary.timeUsedDeltaSeconds !== null
                  ? `${Math.round(summary.timeUsedDeltaSeconds / 60)}m Time Delta`
                  : 'Time: Consistent'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Main Comparison Data Table ─────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Comprehensive Mock Comparison Table
            </h3>
            <p className="text-xs text-slate-500">
              Sortable side-by-side performance records across all attempted mock tests.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            ★ Highlighted values denote personal best metrics
          </span>
        </div>

        {sortedAttempts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider">
                  <th
                    onClick={() => handleSort('examName')}
                    className="py-3 px-3 cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Test / Mock</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('date')}
                    className="py-3 px-3 cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('score')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Score</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('percentage')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Percentage</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('accuracy')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Accuracy</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('rank')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Rank</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('percentile')}
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Percentile</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-right">Time Used</th>
                  <th className="py-3 px-3 text-right">Breakdown</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {sortedAttempts.map((row) => {
                  const isBestScore = row.score === bestValues.score && bestValues.score > 0;
                  const isBestAccuracy =
                    row.accuracy === bestValues.accuracy && bestValues.accuracy > 0;
                  const isBestRank =
                    row.rank !== null && row.rank === bestValues.rank && bestValues.rank > 0;
                  const isBestPercentile =
                    row.percentile !== null &&
                    row.percentile === bestValues.percentile &&
                    bestValues.percentile > 0;

                  return (
                    <tr
                      key={row.attemptId}
                      className="hover:bg-slate-50/80 transition-colors duration-150"
                    >
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-900 block">{row.examName}</span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {row.examType}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-slate-500 whitespace-nowrap">{row.date}</td>

                      {/* Score Column */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <span
                          className={cn(
                            'font-bold text-slate-900',
                            isBestScore && 'text-indigo-600 font-black',
                          )}
                        >
                          {row.score}
                        </span>
                        <span className="text-slate-400 text-[11px]"> / {row.maximumScore}</span>
                        {isBestScore && (
                          <span className="ml-1 text-[10px] font-black text-indigo-600">★</span>
                        )}
                      </td>

                      {/* Percentage */}
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-700">
                        {row.percentage}%
                      </td>

                      {/* Accuracy Column */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        <span
                          className={cn(
                            'font-bold text-emerald-600',
                            isBestAccuracy && 'text-emerald-700 font-black',
                          )}
                        >
                          {row.accuracy}%
                        </span>
                        {isBestAccuracy && (
                          <span className="ml-1 text-[10px] font-black text-emerald-600">★</span>
                        )}
                      </td>

                      {/* Rank Column */}
                      <td className="py-3.5 px-3 text-right font-mono">
                        {row.rank ? (
                          <span
                            className={cn(
                              'font-bold text-slate-900',
                              isBestRank && 'text-purple-700 font-black',
                            )}
                          >
                            #{row.rank.toLocaleString('en-IN')}
                            {isBestRank && (
                              <span className="ml-1 text-[10px] text-purple-700">★</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Processing</span>
                        )}
                      </td>

                      {/* Percentile Column */}
                      <td className="py-3.5 px-3 text-right font-mono font-bold text-indigo-600">
                        {row.percentile !== null ? (
                          <>
                            {row.percentile}
                            {isBestPercentile && <span className="ml-1 text-[10px]">★</span>}
                          </>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Time Used */}
                      <td className="py-3.5 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                        {row.timeUsedSeconds
                          ? `${Math.floor(row.timeUsedSeconds / 60)}m ${row.timeUsedSeconds % 60}s`
                          : '—'}
                      </td>

                      {/* Correct / Wrong Count */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span className="text-emerald-600 font-bold">{row.correctCount}C</span>
                        <span className="text-slate-300 mx-1">/</span>
                        <span className="text-rose-600 font-bold">{row.wrongCount}W</span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => navigate(`/exam/result/${row.attemptId}`)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition-colors"
                        >
                          <span>Analyze</span>
                          <ArrowUpRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-8 text-center text-xs text-slate-500">
            No mock tests match the selected filters.
          </div>
        )}
      </div>

      {/* ── 4. Subject Comparison Matrix & Trend Chart ──────────────── */}
      {subjectComparison.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subject Matrix Table */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              Subject Accuracy Comparison Matrix
            </h3>
            <p className="text-xs text-slate-500">Cross-mock subject performance progression.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider">
                    <th className="py-3 px-3">Subject</th>
                    {attempts.map((att, idx) => (
                      <th key={att.attemptId} className="py-3 px-3 text-right">
                        Mock {String(idx + 1).padStart(2, '0')}
                      </th>
                    ))}
                    <th className="py-3 px-3 text-right text-emerald-600">Net Delta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                  {subjectComparison.map((sub) => (
                    <tr
                      key={sub.subjectId}
                      onClick={() => setActiveSubject(sub.subjectName)}
                      className={cn(
                        'cursor-pointer transition-colors',
                        activeSubject === sub.subjectName
                          ? 'bg-indigo-50/60 font-bold'
                          : 'hover:bg-slate-50',
                      )}
                    >
                      <td className="py-3 px-3 font-bold text-slate-900">{sub.subjectName}</td>
                      {attempts.map((att, idx) => {
                        const label = `Mock ${String(idx + 1).padStart(2, '0')}`;
                        const acc = sub.mockAccuracies[label];
                        return (
                          <td key={att.attemptId} className="py-3 px-3 text-right font-mono">
                            {acc !== undefined ? `${acc}%` : '—'}
                          </td>
                        );
                      })}
                      <td className="py-3 px-3 text-right font-mono font-bold">
                        {sub.trendDelta !== undefined && (
                          <span
                            className={cn(
                              sub.trendDelta > 0
                                ? 'text-emerald-600'
                                : sub.trendDelta < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-500',
                            )}
                          >
                            {sub.trendDelta > 0 ? `+${sub.trendDelta}%` : `${sub.trendDelta}%`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subject Performance Trajectory Visualizer */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-600" />
                Subject Trend Visualizer
              </h3>
              <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-xl border border-indigo-100">
                {activeSubject || 'Select Subject'}
              </span>
            </div>

            {activeSubjectTrend && activeSubjectTrend.data.length > 0 ? (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {activeSubjectTrend.data.map((dp, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-center"
                    >
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                        {dp.mockLabel}
                      </span>
                      <span className="text-lg font-black text-slate-900 font-mono block">
                        {dp.accuracy}%
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        {dp.score} Marks
                      </span>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl bg-indigo-50/40 border border-indigo-100 p-4 text-xs font-semibold text-indigo-900 leading-relaxed">
                  Click on any subject row in the comparison matrix to visualize mock-by-mock
                  accuracy progression and score distribution.
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-xs text-slate-500">
                Select a subject from the matrix to view detailed progression charts.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 5. Comparison Insights & Highlights ─────────────────────── */}
      {insights.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-amber-500" />
            Performance Insights & Observations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((msg, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-xs font-bold text-slate-800 leading-relaxed flex items-start gap-2.5"
              >
                <span>{msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentComparisonPage;
