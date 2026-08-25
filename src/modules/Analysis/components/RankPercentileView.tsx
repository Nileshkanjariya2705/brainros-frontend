import React from 'react';
import {
  MapPin,
  Building2,
  GraduationCap,
  Sparkles,
  RotateCw,
  Clock,
  CheckCircle2,
  Users,
} from 'lucide-react';
import cn from 'classnames';
import type { MyRanksResponse, ScopedRankSummary } from '@/types/exam.types';
import Button from '@/components/ui/Button';

interface Props {
  ranks?: MyRanksResponse | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

export const RankPercentileView: React.FC<Props> = ({ ranks, isLoading, onRefresh }) => {
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <RotateCw className="mx-auto text-indigo-500 animate-spin mb-3" size={32} />
        <h3 className="text-base font-bold text-slate-800">Loading Ranking Data...</h3>
        <p className="text-xs text-slate-500 mt-1">
          Retrieving official calculated ranks and percentiles.
        </p>
      </div>
    );
  }

  if (!ranks || ranks.status === 'RANK_PENDING' || ranks.status === 'RANK_PROCESSING') {
    return (
      <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-8 text-center shadow-sm">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-600 mb-3">
          <Clock size={24} />
        </div>
        <h3 className="text-lg font-black text-slate-900">Rank Calculation in Progress</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 mb-4 leading-relaxed">
          Official rankings are generated in a deterministic batch once all candidates in the exam
          population are evaluated. Your provisional score is saved.
        </p>
        {onRefresh && (
          <Button onClick={onRefresh} variant="secondary" size="sm" className="gap-2 mx-auto">
            <RotateCw size={14} />
            <span>Check Ranking Status</span>
          </Button>
        )}
      </div>
    );
  }

  const { overall, state, district, school, category, predictedRank } = ranks;

  const getRankMedal = (rank: number) => {
    if (rank === 1)
      return {
        label: '1st Place',
        color: 'from-amber-400 to-yellow-500 text-amber-950',
        icon: '🥇',
      };
    if (rank === 2)
      return {
        label: '2nd Place',
        color: 'from-slate-300 to-slate-400 text-slate-900',
        icon: '🥈',
      };
    if (rank === 3)
      return { label: '3rd Place', color: 'from-amber-600 to-amber-700 text-white', icon: '🥉' };
    return null;
  };

  const medal = getRankMedal(overall.rank);

  return (
    <div className="space-y-6">
      {/* ── Hero Overall Rank & Percentile Banner ─────────────────────── */}
      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background glow & grid */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white/10 border border-white/20 text-indigo-200">
                Official Ranking Snapshot v{ranks.snapshotVersion}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center gap-1">
                <CheckCircle2 size={12} />
                Audited & Immutable
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-black mt-3 flex items-center gap-3">
              <span>Overall National Rank</span>
              {medal && <span className="text-2xl">{medal.icon}</span>}
            </h2>
            <p className="text-xs md:text-sm text-indigo-200/80 mt-1 max-w-xl">
              Deterministic competition ranking calculated against all{' '}
              {overall.totalCandidates.toLocaleString()} eligible candidates.
            </p>

            {/* Main Rank Display */}
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-5xl md:text-7xl font-black tracking-tight text-white">
                #{overall.rank.toLocaleString()}
              </span>
              <span className="text-sm md:text-base font-bold text-indigo-300">
                / {overall.totalCandidates.toLocaleString()} Candidates
              </span>
            </div>
          </div>

          {/* Percentile Card inside Hero */}
          <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-6 lg:min-w-[280px] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-indigo-200 font-bold mb-2">
                <span>National Percentile</span>
                <span className="text-emerald-400 font-black">
                  {overall.percentile.toFixed(2)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-3 rounded-full bg-white/15 overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-1000 shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(2, overall.percentile))}%` }}
                />
              </div>

              <p className="text-[11px] text-indigo-200/70 mt-2">
                Better than{' '}
                <strong className="text-white font-bold">{overall.percentile.toFixed(2)}%</strong>{' '}
                of candidates who took this exam.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
              <span className="text-indigo-200">
                Score: <strong className="text-white">{overall.score}</strong>
              </span>
              <span className="text-indigo-200">
                Accuracy: <strong className="text-white">{overall.accuracy.toFixed(1)}%</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scoped Regional & Institutional Breakdown ───────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900">Geographic & Scoped Rankings</h3>
            <p className="text-xs text-slate-500">
              Partitioned evaluation isolated to your specific regional and institutional
              populations.
            </p>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5"
            >
              <RotateCw size={13} />
              <span>Refresh</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* State Rank */}
          <ScopeRankCard
            icon={<MapPin className="text-blue-600" size={20} />}
            title="State Rank"
            scopeName={state?.scopeName || 'Your State'}
            summary={state}
            bgClass="border-blue-100 bg-blue-50/30"
            badgeClass="bg-blue-100 text-blue-800"
          />

          {/* District Rank */}
          <ScopeRankCard
            icon={<Building2 className="text-emerald-600" size={20} />}
            title="District Rank"
            scopeName={district?.scopeName || 'Your District'}
            summary={district}
            bgClass="border-emerald-100 bg-emerald-50/30"
            badgeClass="bg-emerald-100 text-emerald-800"
          />

          {/* School / College Rank */}
          <ScopeRankCard
            icon={<GraduationCap className="text-purple-600" size={20} />}
            title="Institution Rank"
            scopeName={school?.scopeName || 'Your School'}
            summary={school}
            bgClass="border-purple-100 bg-purple-50/30"
            badgeClass="bg-purple-100 text-purple-800"
          />

          {/* Category Rank */}
          <ScopeRankCard
            icon={<Users className="text-amber-600" size={20} />}
            title="Category Rank"
            scopeName={category?.scopeName || 'Your Category'}
            summary={category}
            bgClass="border-amber-100 bg-amber-50/30"
            badgeClass="bg-amber-100 text-amber-800"
          />
        </div>
      </div>

      {/* ── Predicted Rank Projection Card ──────────────────────────── */}
      {predictedRank && (
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-white to-indigo-50/40 p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Statistical Model {predictedRank.modelVersion}
                </span>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[11px] font-bold border',
                    predictedRank.confidence === 'HIGH'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200',
                  )}
                >
                  {predictedRank.confidence} Confidence
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 mt-1">
                <Sparkles className="text-indigo-600" size={18} />
                <span>Projected Target Exam Rank Bracket</span>
              </h3>
              <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                {predictedRank.disclaimer}
              </p>
            </div>

            {/* Predicted Bracket Box */}
            <div className="rounded-2xl border border-indigo-200 bg-white p-4 text-center min-w-[200px] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Estimated Range
              </span>
              <div className="text-2xl font-black text-indigo-600 mt-1">
                #{predictedRank.predictedRankMin.toLocaleString()} – #
                {predictedRank.predictedRankMax.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                Projected Final Benchmark
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface ScopeCardProps {
  icon: React.ReactNode;
  title: string;
  scopeName: string;
  summary?: ScopedRankSummary;
  bgClass: string;
  badgeClass: string;
}

const ScopeRankCard: React.FC<ScopeCardProps> = ({
  icon,
  title,
  scopeName,
  summary,
  bgClass,
  badgeClass,
}) => {
  if (!summary) {
    return (
      <div className="rounded-3xl border border-slate-200/70 bg-slate-50/50 p-5 opacity-70">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h4 className="text-xs font-bold text-slate-600">{title}</h4>
        </div>
        <p className="text-xs text-slate-400 mt-4">Not applicable for this attempt.</p>
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-3xl border p-5 transition-all flex flex-col justify-between', bgClass)}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <h4 className="text-xs font-bold text-slate-700">{title}</h4>
              <span className="text-[11px] font-bold text-slate-500 truncate block max-w-[120px]">
                {scopeName}
              </span>
            </div>
          </div>

          <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-black', badgeClass)}>
            {summary.percentile.toFixed(1)}%tile
          </span>
        </div>

        <div className="mt-4">
          <div className="text-2xl md:text-3xl font-black text-slate-900">
            #{summary.rank.toLocaleString()}
          </div>
          <span className="text-xs font-medium text-slate-500">
            out of {summary.totalCandidates.toLocaleString()} in {summary.scopeName || scopeName}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span>Score: {summary.score}</span>
        <span>Accuracy: {summary.accuracy.toFixed(1)}%</span>
      </div>
    </div>
  );
};

export default RankPercentileView;
