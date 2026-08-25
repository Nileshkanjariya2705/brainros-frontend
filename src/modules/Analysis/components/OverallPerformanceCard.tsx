import React from 'react';
import cn from 'classnames';
import { BrainCircuit, Clock, Timer, AlertTriangle } from 'lucide-react';
import type { OverallPerformanceMetrics, PerformanceStatus } from '@/types/exam.types';

const getStatusBadge = (status: PerformanceStatus) => {
  switch (status) {
    case 'EXCELLENT':
      return {
        label: 'Excellent',
        color: 'emerald',
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    case 'STRONG':
      return {
        label: 'Strong',
        color: 'teal',
        bg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      };
    case 'GOOD':
      return {
        label: 'Good',
        color: 'blue',
        bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      };
    case 'WEAK':
      return {
        label: 'Weak',
        color: 'amber',
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    case 'CRITICAL':
      return {
        label: 'Critical Focus',
        color: 'rose',
        bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      };
    default:
      return {
        label: 'Not Attempted',
        color: 'slate',
        bg: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      };
  }
};

const getQuadrantBadge = (quadrant: OverallPerformanceMetrics['speedAccuracyQuadrant']) => {
  switch (quadrant) {
    case 'FAST_AND_ACCURATE':
      return {
        label: '⚡ Fast & Accurate (Optimal)',
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      };
    case 'SLOW_AND_ACCURATE':
      return {
        label: '🎯 Methodical & Accurate',
        bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30',
      };
    case 'RUSHED_AND_INACCURATE':
      return {
        label: '⚠️ Rushed & High Error Rate',
        bg: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      };
    default:
      return {
        label: '🐢 Struggling with Pace & Accuracy',
        bg: 'bg-rose-500/20 text-rose-300 border-rose-400/30',
      };
  }
};

interface Props {
  overall: OverallPerformanceMetrics;
  examTitle: string;
  examTargetName: string;
}

export const OverallPerformanceCard: React.FC<Props> = ({ overall, examTitle, examTargetName }) => {
  const statusBadge = getStatusBadge(overall.overallStatus);
  const quadrantBadge = getQuadrantBadge(overall.speedAccuracyQuadrant);

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (Math.min(100, Math.max(0, overall.accuracy)) / 100) * circumference;

  const scoreColor =
    overall.accuracy >= 80
      ? 'text-emerald-400'
      : overall.accuracy >= 60
        ? 'text-indigo-400'
        : overall.accuracy >= 40
          ? 'text-amber-400'
          : 'text-rose-400';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-[#0f172a] to-indigo-950 p-6 md:p-8 text-white shadow-2xl border border-indigo-500/20">
      {/* Background glow decorations */}
      <div className="absolute right-0 top-0 h-96 w-96 -translate-y-24 translate-x-24 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
      <div className="absolute left-1/4 bottom-0 h-72 w-72 translate-y-24 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        {/* Left Side: Circular Gauge + Title Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Circular Gauge */}
          <div className="relative flex flex-col items-center justify-center shrink-0">
            <svg width={150} height={150} className="-rotate-90">
              <circle
                cx={75}
                cy={75}
                r={radius}
                fill="none"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={12}
              />
              <circle
                cx={75}
                cy={75}
                r={radius}
                fill="none"
                className={scoreColor}
                stroke="currentColor"
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={cn('text-3xl font-black tracking-tight leading-none', scoreColor)}>
                {overall.accuracy.toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-1">
                Accuracy
              </span>
            </div>
          </div>

          {/* Title & Metadata */}
          <div className="text-center sm:text-left flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-1 text-xs font-bold text-indigo-300">
                <BrainCircuit size={13} />
                Brainros Analysis Engine
              </span>
              <span
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-bold border uppercase',
                  statusBadge.bg,
                )}
              >
                {statusBadge.label}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {examTitle}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-indigo-200">
              Target: <strong className="text-white">{examTargetName}</strong>
            </p>

            {/* Quadrant Pill */}
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-semibold border backdrop-blur">
              <span className={quadrantBadge.bg}>{quadrantBadge.label}</span>
            </div>

            {/* Key Micro Stats */}
            <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <Timer size={14} className="text-indigo-400" />
                <span>
                  Time: <strong className="text-white">{overall.formattedTimeUsed}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <Clock size={14} className="text-indigo-400" />
                <span>
                  Avg/Q:{' '}
                  <strong className="text-white">{overall.averageTimePerQuestionSeconds}s</strong>
                </span>
              </div>
              {overall.negativeMarksLost > 0 && (
                <div className="flex items-center gap-1.5 text-rose-300">
                  <AlertTriangle size={14} />
                  <span>
                    Negative Penalty:{' '}
                    <strong className="text-rose-200">−{overall.negativeMarksLost} Marks</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: KPI Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto shrink-0">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center backdrop-blur shadow-inner">
            <span className="block text-2xl font-black text-white leading-tight">
              {overall.obtainedMarks}
              <span className="text-xs text-slate-400 font-normal">/{overall.totalMarks}</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider mt-1 block">
              Marks Obtained
            </span>
          </div>

          <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center backdrop-blur shadow-inner">
            <span className="block text-2xl font-black text-emerald-400 leading-tight">
              {overall.correctCount}
              <span className="text-xs text-emerald-200/60 font-normal">
                /{overall.totalQuestions}
              </span>
            </span>
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider mt-1 block">
              Correct
            </span>
          </div>

          <div className="rounded-2xl bg-rose-500/10 border border-rose-500/20 p-4 text-center backdrop-blur shadow-inner">
            <span className="block text-2xl font-black text-rose-400 leading-tight">
              {overall.wrongCount}
              <span className="text-xs text-rose-200/60 font-normal">
                /{overall.totalQuestions}
              </span>
            </span>
            <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider mt-1 block">
              Wrong
            </span>
          </div>

          <div className="rounded-2xl bg-slate-500/10 border border-slate-500/20 p-4 text-center backdrop-blur shadow-inner">
            <span className="block text-2xl font-black text-slate-300 leading-tight">
              {overall.unattemptedCount}
              <span className="text-xs text-slate-400/60 font-normal">
                /{overall.totalQuestions}
              </span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1 block">
              Skipped
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
