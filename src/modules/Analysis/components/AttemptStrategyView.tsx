import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import cn from 'classnames';
import type {
  DetailedStrategyAnalysis,
  AttemptStrategyReport,
  OverallPerformanceMetrics,
  StrategySeverity,
  StrategyClassificationCode,
  StrategyConfidence,
  StrategyTrend,
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
    case 'OVER_ATTEMPTING':
    case 'HIGH_RISK_ATTEMPTING':
      return {
        label: 'Over-Attempting (High Risk)',
        bg: 'bg-rose-50 border-rose-200 text-rose-800',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
        icon: <ShieldAlert size={22} className="text-rose-600" />,
        description:
          'You are attempting high-risk or difficult questions despite lower accuracy. Reducing uncertain guesses will preserve marks and elevate your net score.',
      };
    case 'UNDER_ATTEMPTING':
      return {
        label: 'Under-Attempting (Conservative)',
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
        icon: <Clock size={22} className="text-amber-600" />,
        description:
          'Your accuracy on attempted questions is high, but significant questions were left unattempted with surplus time. Expanding your attempt horizon will unlock additional marks.',
      };
    case 'TIME_HEAVY':
      return {
        label: 'Time-Heavy Inefficiency',
        bg: 'bg-purple-50 border-purple-200 text-purple-800',
        badge: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: <Clock size={22} className="text-purple-600" />,
        description:
          'Excessive time spent on uncertain questions created time pressure and avoidable errors. Implementing a 90-second skip protocol will optimize pacing.',
      };
    case 'NEGATIVE_MARKING_HEAVY':
      return {
        label: 'Heavy Negative Marking Penalty',
        bg: 'bg-orange-50 border-orange-200 text-orange-800',
        badge: 'bg-orange-100 text-orange-800 border-orange-300',
        icon: <Zap size={22} className="text-orange-600" />,
        description:
          'Negative marking penalty significantly reduced your net score. Calibrating question selection and eliminating blind guesses preserves essential marks.',
      };
    case 'KNOWLEDGE_GAP':
      return {
        label: 'Foundational Knowledge Focus',
        bg: 'bg-blue-50 border-blue-200 text-blue-800',
        badge: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <BookOpen size={22} className="text-blue-600" />,
        description:
          'Errors are distributed across standard questions rather than reckless guessing. Prioritize foundational concept revisions over attempt strategy changes.',
      };
    case 'INSUFFICIENT_DATA':
      return {
        label: 'Insufficient Attempt Data',
        bg: 'bg-slate-50 border-slate-200 text-slate-800',
        badge: 'bg-slate-100 text-slate-700 border-slate-300',
        icon: <Info size={22} className="text-slate-600" />,
        description:
          'Too few questions were attempted in this session. Complete a full-length mock test to generate high-confidence AI strategy diagnostics.',
      };
    case 'BALANCED':
    default:
      return {
        label: 'Balanced Strategy',
        bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        icon: <CheckCircle2 size={22} className="text-emerald-600" />,
        description:
          'You maintained healthy attempt coverage and solid accuracy while keeping negative marking strictly controlled.',
      };
  }
};

const getConfidenceBadge = (confidence?: StrategyConfidence) => {
  switch (confidence) {
    case 'HIGH':
      return {
        label: 'High Confidence',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      };
    case 'MEDIUM':
      return {
        label: 'Medium Confidence',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
      };
    case 'LOW':
    default:
      return {
        label: 'Preliminary Signal',
        badge: 'bg-slate-100 text-slate-700 border-slate-300',
      };
  }
};

const getTrendBadge = (trend?: StrategyTrend) => {
  switch (trend) {
    case 'IMPROVING':
      return {
        label: '▲ Improving Trajectory',
        badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'DECLINING':
      return {
        label: '▼ Declining Risk',
        badge: 'bg-rose-50 text-rose-700 border-rose-200',
      };
    case 'STABLE':
      return {
        label: '● Stable Pattern',
        badge: 'bg-slate-50 text-slate-600 border-slate-200',
      };
    default:
      return null;
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
  const navigate = useNavigate();
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
  const [showEvidenceDrawer, setShowEvidenceDrawer] = useState<boolean>(false);
  const [showEvidenceForId, setShowEvidenceForId] = useState<string | null>(null);

  // Fallback / Normalized values from DetailedStrategyAnalysis
  const primaryClass = detailedStrategy?.primaryClassification || 'BALANCED';
  const classConfig = getClassificationConfig(primaryClass);
  const confConfig = getConfidenceBadge(detailedStrategy?.confidence);
  const trendConfig = getTrendBadge(detailedStrategy?.trend);

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
  const signals = detailedStrategy?.signals || [];

  // Simulator calculation
  const avgNegativePerWrong =
    overall.wrongCount > 0 ? negativeMarksLost / overall.wrongCount : 1;
  const simulatedSavedMarks =
    Math.round(avoidedGuessesCount * avgNegativePerWrong * 10) / 10;
  const simulatedScore =
    Math.round((overall.obtainedMarks + simulatedSavedMarks) * 10) / 10;

  return (
    <div className="space-y-6">
      {/* ── 1. Hero Strategy Decision Engine Banner ────────────────── */}
      <div
        className={cn(
          'rounded-3xl border p-6 md:p-8 shadow-sm transition-all',
          classConfig.bg,
        )}
      >
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-white shadow-sm border border-slate-100 shrink-0">
              {classConfig.icon}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  AI Strategy Diagnostic
                </span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-black border',
                    classConfig.badge,
                  )}
                >
                  {classConfig.label}
                </span>
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded-full text-xs font-bold border',
                    confConfig.badge,
                  )}
                >
                  {confConfig.label}
                </span>
                {trendConfig && (
                  <span
                    className={cn(
                      'px-2.5 py-0.5 rounded-full text-[11px] font-bold border',
                      trendConfig.badge,
                    )}
                  >
                    {trendConfig.label}
                  </span>
                )}
              </div>

              <h2 className="text-xl md:text-2xl font-black text-slate-900">
                {classConfig.label}
              </h2>

              <p className="text-sm font-medium text-slate-800 leading-relaxed max-w-3xl">
                {detailedStrategy?.whyStatement || classConfig.description}
              </p>

              {/* Secondary Classifications */}
              {detailedStrategy?.secondaryClassifications &&
                detailedStrategy.secondaryClassifications.length > 0 && (
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-xs font-bold text-slate-500">Secondary Factors:</span>
                    {detailedStrategy.secondaryClassifications.map((sec) => (
                      <span
                        key={sec}
                        className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-white/90 border border-slate-200 text-slate-700 shadow-2xs"
                      >
                        {sec.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* Recalculate & Action Links */}
          <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
            {detailedStrategy?.actionRecommendation && (
              <button
                onClick={() =>
                  navigate(detailedStrategy.actionRecommendation!.targetUrl)
                }
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <span>{detailedStrategy.actionRecommendation.label}</span>
                <ArrowRight size={13} />
              </button>
            )}

            {onRecalculate && (
              <button
                onClick={onRecalculate}
                disabled={isRecalculating}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50 active:scale-95 transition-all"
              >
                <RotateCw
                  size={14}
                  className={cn({ 'animate-spin': isRecalculating })}
                />
                <span>{isRecalculating ? 'Recalculating...' : 'Recalculate'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Expandable "Why am I seeing this?" Section */}
        <div className="mt-6 pt-4 border-t border-slate-200/60 flex flex-col gap-3">
          <button
            onClick={() => setShowEvidenceDrawer(!showEvidenceDrawer)}
            className="inline-flex items-center gap-2 text-xs font-extrabold text-slate-700 hover:text-indigo-600 transition-colors self-start"
          >
            <HelpCircle size={14} className="text-indigo-600" />
            <span>Why am I seeing this decision? (Inspect Behavioral Signals)</span>
            {showEvidenceDrawer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showEvidenceDrawer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {signals.length > 0 ? (
                signals.map((sig, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider truncate">
                        {sig.name}
                      </span>
                      <span className="text-xs font-black text-indigo-700 font-mono">
                        {sig.value}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-tight">
                      {sig.evidence}
                    </p>
                    {sig.impact && (
                      <span className="text-[11px] font-bold text-amber-700 block">
                        Impact: {sig.impact}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-white text-xs text-slate-600">
                  Decision generated from {overall.totalQuestions} questions across accuracy, pacing, and negative marking penalty data.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Negative Marking Impact & Recovery Callout ──────────────── */}
      {(negativeMarksLost > 0 || avoidableLoss > 0) && (
        <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-900 via-indigo-950 to-purple-950 p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                  Evidence-Based Score Recovery
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black px-2.5 py-0.5">
                  +{avoidableLoss} Marks Avoidable Loss
                </span>
              </div>
              <p className="text-sm text-indigo-100 font-medium mt-1 leading-relaxed max-w-2xl">
                Your score could improve by approximately{' '}
                <strong>{avoidableLoss} marks</strong> by reducing low-probability attempts on high-risk questions.
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 border border-white/15 px-5 py-3 text-center shrink-0 w-full sm:w-auto">
            <span className="text-2xl font-black text-emerald-400 block">
              {projectedScore}
              <span className="text-sm font-normal text-indigo-200">
                /{overall.totalMarks}
              </span>
            </span>
            <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">
              Potential Net Score
            </span>
          </div>
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
                ((overall.correctCount + overall.wrongCount) /
                  (overall.totalQuestions || 1)) *
                  100,
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
            {metrics?.highRiskAttemptCount ?? 0}
          </span>
          <span className="text-[11px] text-rose-700 font-medium">
            {metrics?.highRiskWrongCount ?? 0} Incorrect
          </span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Negative Marks Lost
          </span>
          <span className="text-2xl font-black text-rose-700 mt-1 block">
            −{negativeMarksLost}
          </span>
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
          <span className="text-[11px] text-amber-700 font-medium">
            from high-risk errors
          </span>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-center shadow-sm">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Projected Score
          </span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">
            {projectedScore}
          </span>
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
                    ((projectedScore - overall.obtainedMarks) /
                      (overall.totalMarks || 1)) *
                      100,
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
                  'Estimated avoidable loss is calculated strictly from actual exam marking scheme penalties on high-risk incorrect answers. This is an evidence-based potential recovery estimate.'}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Algorithm: v2.0.0</span>
            <span>Deterministic Multi-Signal Decision Engine</span>
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
                  {Math.round(
                    (negativeMarksLost / (overall.totalMarks || 1)) * 100,
                  )}
                  % of Max Score
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
                <span className="text-emerald-700 bg-emerald-100/90 px-3 py-1 rounded-lg shadow-2xs">
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
                {metrics?.highRiskAttemptCount ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">High Risk Incorrect:</span>
              <span className="font-extrabold text-rose-600">
                {metrics?.highRiskWrongCount ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Risk Accuracy:</span>
              <span className="font-extrabold text-slate-900">
                {metrics?.highRiskAccuracy ?? 0}%
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
                {metrics?.timeHeavyAttemptCount ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Time-Heavy Incorrect:</span>
              <span className="font-extrabold text-purple-700">
                {metrics?.timeHeavyWrongCount ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Unused Exam Time:</span>
              <span className="font-extrabold text-indigo-700">
                {metrics?.unusedTimeMinutes ?? 0} mins
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Avg Time / Question:</span>
              <span className="font-extrabold text-slate-900">
                {metrics?.averageTimePerQuestionSeconds ??
                  overall.averageTimePerQuestionSeconds}
                s
              </span>
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
                {metrics?.reviewedQuestionCount ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Correct on Review:</span>
              <span className="font-extrabold text-emerald-600">
                {metrics?.reviewedCorrectCount ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Wrong on Review:</span>
              <span className="font-extrabold text-rose-600">
                {metrics?.reviewedWrongCount ?? 0}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-600 font-medium">Review Conversion Rate:</span>
              <span className="font-extrabold text-emerald-700">
                {metrics?.reviewedQuestionCount && metrics.reviewedQuestionCount > 0
                  ? Math.round(
                      (metrics.reviewedCorrectCount / metrics.reviewedQuestionCount) * 100,
                    )
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. AI Decision Engine Generated Strategy Recommendations ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-sm">
              <BarChart3 size={18} />
              <span>Personalized Strategy Next Steps</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Deterministic, explainable insights generated from your observed behavioral signals and calibrated against official marking schemes.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {recommendations.length} Actionable Recommendations
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
                          <h4 className="text-base font-extrabold text-slate-900">
                            {rec.title}
                          </h4>
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-extrabold border',
                              getSeverityBadgeClass(rec.severity),
                            )}
                          >
                            {rec.severity}
                          </span>
                          {rec.confidence && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-600">
                              {rec.confidence} Confidence
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium">
                          {rec.message}
                        </p>

                        {rec.estimatedImpactMarks > 0 && (
                          <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100/70 text-emerald-800 text-xs font-extrabold">
                            <TrendingUp size={13} />
                            <span>
                              Estimated Mark Recovery: +{rec.estimatedImpactMarks} Marks
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                      {rec.action && (
                        <button
                          onClick={() => navigate(rec.action!.targetUrl)}
                          className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 transition-all shadow-2xs"
                        >
                          <span>{rec.action.label}</span>
                          <ArrowRight size={12} />
                        </button>
                      )}

                      {rec.evidence && Object.keys(rec.evidence).length > 0 && (
                        <button
                          onClick={() =>
                            setShowEvidenceForId(isEvidenceOpen ? null : rec.id)
                          }
                          className="text-xs font-bold text-slate-600 hover:text-indigo-600 flex-shrink-0"
                        >
                          {isEvidenceOpen ? 'Hide Evidence' : 'Inspect Evidence'}
                        </button>
                      )}
                    </div>
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
                          <div
                            key={k}
                            className="p-2 rounded-xl bg-white border border-slate-200"
                          >
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
          <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
            No severe strategy flaws detected. Keep up your balanced approach!
          </div>
        )}
      </div>
    </div>
  );
};
