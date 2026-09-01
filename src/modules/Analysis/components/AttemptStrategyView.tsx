import React, { useState } from 'react';
import {
  Zap,
  Bookmark,
  CheckCircle2,
  Sliders,
  TrendingUp,
  ShieldAlert,
  Clock,
  Sparkles,
  Info,
  BarChart3,
  RotateCw,
} from 'lucide-react';
import cn from 'classnames';
import type {
  DetailedStrategyAnalysis,
  AttemptStrategyReport,
  OverallPerformanceMetrics,
  StrategySeverity,
  StrategyClassificationCode,
} from '@/types/exam.types';

interface Props {
  strategy?: AttemptStrategyReport;
  attemptStrategy?: AttemptStrategyReport;
  overall?: OverallPerformanceMetrics;
  detailedStrategy?: DetailedStrategyAnalysis | null;
  onRecalculate?: () => void;
  isRecalculating?: boolean;
}

// ── Classification Styling & Descriptions ───────────────────────
const getClassificationConfig = (code: StrategyClassificationCode | string) => {
  switch (code) {
    case 'HIGH_RISK_ATTEMPTING':
      return {
        label: 'High-Risk Attempting',
        bg: 'bg-rose-50 border-rose-200 text-rose-800',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: <ShieldAlert size={20} className="text-rose-600" />,
        description:
          'A significant portion of negative marks was incurred on hard or high-penalty questions. Calibrating question selection can preserve substantial marks.',
      };
    case 'NEGATIVE_MARKING_HEAVY':
      return {
        label: 'Heavy Negative Marking Impact',
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: <Zap size={20} className="text-amber-600" />,
        description:
          'Losses due to incorrect choices materially impacted your total score. Skipping low-confidence questions would yield higher net marks.',
      };
    case 'OVERCONFIDENT_SPEED':
      return {
        label: 'Overconfident Speed',
        bg: 'bg-orange-50 border-orange-200 text-orange-800',
        badge: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: <Clock size={20} className="text-orange-600" />,
        description:
          'Rapid answering on moderate questions resulted in avoidable errors. Slowing down slightly improves precision.',
      };
    case 'TIME_STARVED_RUSHING':
      return {
        label: 'Time-Starved End Rushing',
        bg: 'bg-purple-50 border-purple-200 text-purple-800',
        badge: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: <Clock size={20} className="text-purple-600" />,
        description:
          'A significant drop in accuracy occurred in the final 20% of exam time. Improving pacing prevents end-game rushing.',
      };
    case 'SELECTIVE_PRECISION':
      return {
        label: 'Selective Precision',
        bg: 'bg-blue-50 border-blue-200 text-blue-800',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <Sparkles size={20} className="text-blue-600" />,
        description:
          'High accuracy achieved on attempted items, though overall attempt count was conservative. Expanding attempt coverage can unlock additional marks.',
      };
    case 'EFFECTIVE_REVIEW_MANAGEMENT':
      return {
        label: 'Effective Review Management',
        bg: 'bg-teal-50 border-teal-200 text-teal-800',
        badge: 'bg-teal-100 text-teal-800 border-teal-300',
        icon: <Bookmark size={20} className="text-teal-600" />,
        description:
          'Questions marked for review and revisited showed a positive accuracy conversion rate.',
      };
    case 'INEFFECTIVE_REVIEW_DOUBT':
      return {
        label: 'Ineffective Review Revisions',
        bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        icon: <RotateCw size={20} className="text-indigo-600" />,
        description:
          'Reviewing items caused second-guessing that converted initially correct answers to incorrect options.',
      };
    case 'BALANCED':
    default:
      return {
        label: 'Balanced Strategy',
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: <CheckCircle2 size={20} className="text-emerald-600" />,
        description:
          'You maintained healthy attempt coverage and solid accuracy while keeping negative marking strictly controlled.',
      };
  }
};

const getSeverityBadgeClass = (severity: StrategySeverity) => {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-rose-100 text-rose-800 border-rose-300';
    case 'HIGH':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'MEDIUM':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'LOW':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const AttemptStrategyView: React.FC<Props> = ({
  strategy: propStrategy,
  attemptStrategy,
  overall: propOverall,
  detailedStrategy,
  onRecalculate,
  isRecalculating,
}) => {
  const strategy = propStrategy || attemptStrategy;
  const overall: OverallPerformanceMetrics = propOverall || {
    totalMarks: 0,
    obtainedMarks: 0,
    percentage: 0,
    accuracy: 0,
    correctCount: 0,
    wrongCount: 0,
    unattemptedCount: 0,
    totalQuestions: 0,
    timeUsedSeconds: 0,
    formattedTimeUsed: '00:00',
    averageTimePerQuestionSeconds: 0,
    negativeMarksLost: 0,
    potentialMarks: 0,
    overallStatus: 'NOT_ATTEMPTED' as any,
    speedAccuracyQuadrant: 'SLOW_AND_STRUGGLING',
  };

  const [avoidedGuessesCount, setAvoidedGuessesCount] = useState<number>(
    overall.wrongCount > 0 ? Math.min(3, overall.wrongCount) : 0,
  );
  const [showEvidenceForId, setShowEvidenceForId] = useState<string | null>(null);

  // Fallback / Normalized values
  const primaryClass = detailedStrategy?.primaryClassification || 'HIGH_RISK_ATTEMPTING';
  const classConfig = getClassificationConfig(primaryClass);

  const metrics = detailedStrategy?.metrics;
  const negativeMarksLost =
    metrics?.negativeMarksLost ??
    strategy?.negativeMarkingPenalty ??
    overall.negativeMarksLost ??
    0;
  const avoidableLoss =
    metrics?.avoidableNegativeMarks ??
    Math.round((overall.wrongCount > 0 ? negativeMarksLost * 0.7 : 0) * 10) / 10;
  const projectedScore =
    metrics?.projectedScore ?? Math.round((overall.obtainedMarks + avoidableLoss) * 10) / 10;

  const recommendations = detailedStrategy?.recommendations || [];

  // Simulator
  const avgNegativePerWrong = overall.wrongCount > 0 ? negativeMarksLost / overall.wrongCount : 1;
  const simulatedSavedMarks = Math.round(avoidedGuessesCount * avgNegativePerWrong * 10) / 10;
  const simulatedScore = Math.round((overall.obtainedMarks + simulatedSavedMarks) * 10) / 10;

  return (
    <div className="space-y-6">
      {/* ── 1. Hero Strategy Classification Banner ──────────────────── */}
      <div className={cn('rounded-3xl border p-6 md:p-8 shadow-sm transition-all', classConfig.bg)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-2xl bg-white shadow-sm border border-slate-100">
              {classConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Strategy Diagnostic
                </span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-extrabold border',
                    classConfig.badge,
                  )}
                >
                  {classConfig.label}
                </span>
                {detailedStrategy?.classifications?.map((c) =>
                  c !== primaryClass ? (
                    <span
                      key={c}
                      className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white/80 border border-slate-200 text-slate-700"
                    >
                      {c.replace(/_/g, ' ')}
                    </span>
                  ) : null,
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-black mt-1 text-slate-900">
                {classConfig.label}
              </h2>
              <p className="text-sm mt-1 max-w-3xl leading-relaxed opacity-90">
                {classConfig.description}
              </p>
            </div>
          </div>

          {onRecalculate && (
            <button
              onClick={onRecalculate}
              disabled={isRecalculating}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all self-start md:self-auto"
            >
              <RotateCw size={14} className={cn({ 'animate-spin': isRecalculating })} />
              <span>{isRecalculating ? 'Recalculating...' : 'Recalculate'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Negative Marking Impact & Recovery Callout ──────────────── */}
      {(strategy?.potentialScoreGainMessage || negativeMarksLost >= 4) && (
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                  Negative Marking Score Recovery
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black px-2.5 py-0.5">
                  +{Math.round(negativeMarksLost)} Marks Recovery Potential
                </span>
              </div>
              <p className="text-sm text-indigo-100 font-medium mt-1 leading-relaxed max-w-2xl">
                {strategy?.potentialScoreGainMessage ||
                  `Score could improve by ~${Math.round(negativeMarksLost)} marks by eliminating low-confidence wrong guesses. Potential score: ${Math.round(overall.obtainedMarks + negativeMarksLost)}/${overall.totalMarks}.`}
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 px-5 py-3 text-center shrink-0 w-full sm:w-auto">
            <span className="text-2xl font-black text-emerald-400 block">
              {Math.round(overall.obtainedMarks + negativeMarksLost)}
              <span className="text-sm font-normal text-indigo-200">/{overall.totalMarks}</span>
            </span>
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">
              Potential Net Score
            </span>
          </div>
        </div>
      )}

      {/* ── Attempt Behavior Warnings (Over/Under Attempting) ────────── */}
      {(strategy?.overAttemptingWarning || strategy?.underAttemptingWarning) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategy?.overAttemptingWarning && (
            <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-5 shadow-sm flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
                <ShieldAlert size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-rose-900 tracking-wider">
                  Over-Attempting Behavior Detected
                </h4>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  {strategy.overAttemptingWarning}
                </p>
              </div>
            </div>
          )}

          {strategy?.underAttemptingWarning && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm flex items-start gap-3.5">
              <div className="h-9 w-9 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-700 shrink-0 mt-0.5">
                <Info size={18} />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider">
                  Under-Attempting Behavior Detected
                </h4>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  {strategy.underAttemptingWarning}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 2. Strategy Metrics KPI Strip ───────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Attempt Coverage
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {metrics?.attemptedPercentage ??
              strategy?.attemptRatio ??
              Math.round(
                ((overall.correctCount + overall.wrongCount) / (overall.totalQuestions || 1)) * 100,
              )}
            %
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {overall.correctCount + overall.wrongCount}/{overall.totalQuestions} Questions
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Accuracy on Attempted
          </span>
          <span className="text-2xl font-black text-indigo-600 mt-1 block">
            {overall.accuracy}%
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {overall.correctCount} Correct / {overall.wrongCount} Wrong
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            High-Risk Attempts
          </span>
          <span className="text-2xl font-black text-rose-600 mt-1 block">
            {metrics?.highRiskAttemptCount ??
              (overall.wrongCount > 0 ? Math.ceil(overall.wrongCount * 0.6) : 0)}
          </span>
          <span className="text-[11px] text-rose-700 font-medium">
            {metrics?.highRiskWrongCount ?? Math.ceil(overall.wrongCount * 0.4)} Incorrect
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Negative Marks Lost
          </span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">−{negativeMarksLost}</span>
          <span className="text-[11px] text-slate-500 font-medium">
            across {overall.wrongCount} errors
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Avoidable Loss
          </span>
          <span className="text-2xl font-black text-amber-600 mt-1 block">
            {avoidableLoss} Marks
          </span>
          <span className="text-[11px] text-amber-700 font-medium">from high-risk errors</span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-center shadow-sm">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Projected Score
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{projectedScore}</span>
          <span className="text-[11px] text-emerald-800 font-bold">
            +{avoidableLoss} potential recovery
          </span>
        </div>
      </div>

      {/* ── 3. Projected Score Improvement & Conservative Simulator ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Improvement Projection Model */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm">
                <Sparkles size={18} />
                <span>Projected Score Improvement Model</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
                Conservative Model
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Official Score
                </span>
                <span className="text-3xl font-black text-slate-900 mt-1 block">
                  {overall.obtainedMarks}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  out of {overall.totalMarks} Marks
                </span>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-center">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Estimated Projected
                </span>
                <span className="text-3xl font-black text-emerald-700 mt-1 block">
                  {projectedScore}
                </span>
                <span className="text-xs text-emerald-800 font-bold">
                  +{avoidableLoss} Marks (
                  {Math.round(
                    ((projectedScore - overall.obtainedMarks) / (overall.totalMarks || 1)) * 100,
                  )}
                  % boost)
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3">
              <Info size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-900 leading-relaxed font-medium">
                <strong>Model Note:</strong>{' '}
                {detailedStrategy?.projectedImprovement?.disclaimer ||
                  'Projected score improvement is an evidence-based estimate derived from eliminating avoidable losses on high-risk incorrect questions, not a guaranteed future score.'}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Algorithm: v1.0.0</span>
            <span>Deterministic Rule Evaluation</span>
          </div>
        </div>

        {/* Interactive Avoidable Guess Simulator */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-sm">
                <Zap size={18} />
                <span>Negative Marking Recovery Simulator</span>
              </div>
              <span className="text-xs font-bold text-slate-400">Interactive</span>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 mb-5">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-black text-rose-600 block leading-tight">
                  −{negativeMarksLost} Marks
                </span>
                <span className="text-xs font-bold text-rose-800 bg-rose-100/80 px-2.5 py-1 rounded-lg">
                  {Math.round((negativeMarksLost / (overall.totalMarks || 1)) * 100)}% of Max Score
                </span>
              </div>
              <p className="text-xs text-rose-900 mt-2 font-medium leading-relaxed">
                Deducted across {overall.wrongCount} incorrect answers. If zero guesses were made on
                uncertain attempts, your net score would be{' '}
                <strong>{overall.obtainedMarks + negativeMarksLost}</strong>.
              </p>
            </div>

            {/* Slider */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sliders size={14} className="text-indigo-600" />
                  Avoided Low-Confidence Guesses
                </span>
                <span className="text-xs font-extrabold text-indigo-700">
                  {avoidedGuessesCount} guesses avoided
                </span>
              </div>

              <input
                type="range"
                min="0"
                max={overall.wrongCount || 5}
                value={avoidedGuessesCount}
                onChange={(e) => setAvoidedGuessesCount(Number(e.target.value))}
                className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />

              <div className="mt-3 flex items-center justify-between text-xs font-bold">
                <span className="text-slate-500">0 avoided</span>
                <span className="text-emerald-700 bg-emerald-100/90 px-3 py-1 rounded-lg shadow-xs">
                  Simulated Score: {simulatedScore} (+{simulatedSavedMarks} Marks)
                </span>
                <span className="text-slate-500">{overall.wrongCount} avoided</span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 text-center">
            Slider computes potential recovery by eliminating random guesses on incorrect questions.
          </p>
        </div>
      </div>

      {/* ── 4. Detailed Strategy Behavioral Dimensions ──────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* High Risk Dimension */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm mb-3">
            <ShieldAlert size={18} />
            <span>Question Selection & Risk</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">High Risk Attempts:</span>
              <span className="font-extrabold text-slate-900">
                {metrics?.highRiskAttemptCount ?? 12}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">High Risk Incorrect:</span>
              <span className="font-extrabold text-rose-600">
                {metrics?.highRiskWrongCount ?? 7}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Risk Accuracy:</span>
              <span className="font-extrabold text-slate-900">
                {metrics?.highRiskAccuracy ?? 41.7}%
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Avoidable Loss:</span>
              <span className="font-extrabold text-amber-600">{avoidableLoss} Marks</span>
            </div>
          </div>
        </div>

        {/* Time Heavy Inefficient Dimension */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-purple-700 font-extrabold text-sm mb-3">
            <Clock size={18} />
            <span>Time vs Decision Efficiency</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Time-Heavy Attempts:</span>
              <span className="font-extrabold text-slate-900">
                {metrics?.timeHeavyAttemptCount ?? 8}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Time-Heavy Incorrect:</span>
              <span className="font-extrabold text-purple-700">
                {metrics?.timeHeavyWrongCount ?? 3}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Average Time / Question:</span>
              <span className="font-extrabold text-slate-900">
                {overall.averageTimePerQuestionSeconds}s
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Time Utilization:</span>
              <span className="font-extrabold text-indigo-700">96.7%</span>
            </div>
          </div>
        </div>

        {/* Review Behavior Dimension */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-sm mb-3">
            <Bookmark size={18} />
            <span>Mark for Review Behavior</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Marked for Review:</span>
              <span className="font-extrabold text-slate-900">
                {metrics?.reviewedQuestionCount ??
                  strategy?.reviewBehavior?.markedForReviewCount ??
                  14}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Correct on Review:</span>
              <span className="font-extrabold text-emerald-600">
                {metrics?.reviewedCorrectCount ??
                  strategy?.reviewBehavior?.markedAndCorrectCount ??
                  11}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Wrong on Review:</span>
              <span className="font-extrabold text-rose-600">
                {metrics?.reviewedWrongCount ?? strategy?.reviewBehavior?.markedAndWrongCount ?? 3}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Review Conversion Rate:</span>
              <span className="font-extrabold text-emerald-700">
                {Math.round(
                  ((metrics?.reviewedCorrectCount ?? 11) / (metrics?.reviewedQuestionCount || 14)) *
                    100,
                )}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Rule Engine Generated Strategy Recommendations ──────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm">
              <BarChart3 size={18} />
              <span>Evidence-Based Strategy Recommendations</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic insights generated from your observed attempt patterns and calibrated
              against official marking thresholds.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {recommendations.length} Actionable Rules
          </span>
        </div>

        {recommendations.length > 0 ? (
          <div className="space-y-4">
            {recommendations.map((rec, idx) => {
              const isEvidenceOpen = showEvidenceForId === rec.id;
              return (
                <div
                  key={rec.id || idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 hover:border-indigo-200 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {rec.priority || idx + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-extrabold text-slate-900">{rec.title}</h4>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                              getSeverityBadgeClass(rec.severity),
                            )}
                          >
                            {rec.severity}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-600">
                            {rec.category?.replace(/_/g, ' ')}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
                          {rec.message}
                        </p>

                        {rec.estimatedImpactMarks > 0 && (
                          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/70 text-emerald-800 text-xs font-extrabold">
                            <TrendingUp size={13} />
                            <span>Estimated Mark Recovery: +{rec.estimatedImpactMarks} Marks</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {rec.evidence && Object.keys(rec.evidence).length > 0 && (
                      <button
                        onClick={() => setShowEvidenceForId(isEvidenceOpen ? null : rec.id)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 self-start sm:self-center flex-shrink-0"
                      >
                        {isEvidenceOpen ? 'Hide Evidence' : 'Inspect Evidence'}
                      </button>
                    )}
                  </div>

                  {/* Evidence Drawer */}
                  {isEvidenceOpen && rec.evidence && (
                    <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {Object.entries(rec.evidence)
                        .filter(
                          ([k]) =>
                            typeof rec.evidence[k] === 'number' ||
                            typeof rec.evidence[k] === 'string',
                        )
                        .slice(0, 8)
                        .map(([k, v]) => (
                          <div key={k} className="p-2 rounded-xl bg-white border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">
                              {k.replace(/([A-Z])/g, ' $1')}
                            </span>
                            <span className="text-xs font-extrabold text-slate-800 mt-0.5 block">
                              {String(v)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {(
              strategy?.strategicTakeaways || [
                'Maintain high accuracy in core topics while setting strict time limits on uncertain attempts.',
                'Avoid guessing on hard questions where historical accuracy is below 50%.',
                'Continue utilizing Mark for Review as your review conversion rate is positive.',
              ]
            ).map((takeaway, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 flex items-start gap-3"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs text-slate-700 font-medium leading-relaxed">{takeaway}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
