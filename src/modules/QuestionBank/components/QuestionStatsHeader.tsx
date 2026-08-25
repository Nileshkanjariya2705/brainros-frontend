import React from 'react';
import {
  FileQuestion,
  CheckCircle2,
  Clock,
  FileEdit,
  AlertCircle,
  Archive,
  Layers,
} from 'lucide-react';
import type { QuestionStatsResponse } from '../types/questionBank.types';

interface QuestionStatsHeaderProps {
  stats: QuestionStatsResponse | null;
  isLoading: boolean;
  selectedStatus?: string;
  onStatusClick?: (status: string) => void;
}

export const QuestionStatsHeader: React.FC<QuestionStatsHeaderProps> = ({
  stats,
  isLoading,
  selectedStatus = 'ALL',
  onStatusClick,
}) => {
  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-slate-200/70" />
        ))}
      </div>
    );
  }

  const total = stats?.totalQuestions ?? 0;
  const approved = stats?.byStatus?.APPROVED ?? 0;
  const underReview = (stats?.byStatus?.UNDER_REVIEW ?? 0) + (stats?.byStatus?.SUBMITTED ?? 0);
  const drafts = stats?.byStatus?.DRAFT ?? 0;
  const rejected = stats?.byStatus?.REJECTED ?? 0;
  const archived = stats?.byStatus?.ARCHIVED ?? 0;

  const statCards = [
    {
      id: 'ALL',
      label: 'Total Questions',
      count: total,
      icon: FileQuestion,
      bgGradient: 'from-indigo-500 to-purple-600',
      textColor: 'text-indigo-600',
      activeRing: 'ring-indigo-500 bg-indigo-50/50',
    },
    {
      id: 'APPROVED',
      label: 'Approved Bank',
      count: approved,
      icon: CheckCircle2,
      bgGradient: 'from-emerald-500 to-teal-600',
      textColor: 'text-emerald-600',
      activeRing: 'ring-emerald-500 bg-emerald-50/50',
    },
    {
      id: 'UNDER_REVIEW',
      label: 'In Review / Queue',
      count: underReview,
      icon: Clock,
      bgGradient: 'from-amber-500 to-orange-600',
      textColor: 'text-amber-600',
      activeRing: 'ring-amber-500 bg-amber-50/50',
    },
    {
      id: 'DRAFT',
      label: 'Drafts',
      count: drafts,
      icon: FileEdit,
      bgGradient: 'from-blue-500 to-cyan-600',
      textColor: 'text-blue-600',
      activeRing: 'ring-blue-500 bg-blue-50/50',
    },
    {
      id: 'REJECTED',
      label: 'Needs Revision',
      count: rejected,
      icon: AlertCircle,
      bgGradient: 'from-rose-500 to-pink-600',
      textColor: 'text-rose-600',
      activeRing: 'ring-rose-500 bg-rose-50/50',
    },
    {
      id: 'ARCHIVED',
      label: 'Archived',
      count: archived,
      icon: Archive,
      bgGradient: 'from-slate-500 to-gray-600',
      textColor: 'text-slate-600',
      activeRing: 'ring-slate-500 bg-slate-50/50',
    },
  ];

  return (
    <div className="space-y-4">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isActive = selectedStatus === card.id;

          return (
            <button
              key={card.id}
              onClick={() => onStatusClick && onStatusClick(card.id)}
              className={`group relative overflow-hidden rounded-2xl border bg-white/80 backdrop-blur-md p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                isActive
                  ? `border-transparent ring-2 ${card.activeRing}`
                  : 'border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${card.bgGradient} text-white shadow-sm`}
                >
                  <Icon size={16} />
                </div>
                {isActive && (
                  <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-ping" />
                )}
              </div>

              <div className="mt-3">
                <div className="text-2xl font-black text-slate-900 tracking-tight">
                  {card.count.toLocaleString()}
                </div>
                <div className="text-[11px] font-semibold text-slate-500 truncate mt-0.5">
                  {card.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Difficulty Distribution Bar */}
      {stats?.byDifficulty && Object.keys(stats.byDifficulty).length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-md px-4 py-2.5 text-xs text-slate-600 shadow-sm">
          <span className="flex items-center gap-1.5 font-bold text-slate-800 shrink-0">
            <Layers size={14} className="text-indigo-600" />
            Difficulty Distribution:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Easy: <strong>{stats.byDifficulty.EASY ?? 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 border border-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Medium: <strong>{stats.byDifficulty.MEDIUM ?? 0}</strong>
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 font-semibold text-rose-700 border border-rose-200">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              Hard: <strong>{stats.byDifficulty.HARD ?? 0}</strong>
            </span>
            {stats.byDifficulty.VERY_HARD !== undefined && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 font-semibold text-purple-700 border border-purple-200">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                Very Hard: <strong>{stats.byDifficulty.VERY_HARD}</strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
