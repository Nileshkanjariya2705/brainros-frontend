import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Trophy,
  PlayCircle,
  Clock,
  Award,
  AlertTriangle,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Flame,
  Sparkles,
  BarChart3,
  BookOpen,
} from 'lucide-react';
import cn from 'classnames';
import { useGetStudentDashboardAPI } from '../services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import Loader from '@/components/feedback/Loader';
import type { StudentDashboardResponse } from '@/types/exam.types';

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { getStudentDashboardAPI, isLoading } = useGetStudentDashboardAPI();
  const [data, setData] = useState<StudentDashboardResponse | null>(null);
  const [trendMetric, setTrendMetric] = useState<'SCORE' | 'ACCURACY' | 'RANK' | 'PERCENTILE'>(
    'SCORE',
  );
  const [countdownSec, setCountdownSec] = useState<number>(0);

  const fetchDashboard = useCallback(async () => {
    const res = await getStudentDashboardAPI();
    if (res.data) {
      setData(res.data);
      if (res.data.nextExam && res.data.nextExam.waitSeconds > 0) {
        setCountdownSec(res.data.nextExam.waitSeconds);
      }
    }
  }, [getStudentDashboardAPI]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Live countdown timer for upcoming exam
  useEffect(() => {
    if (countdownSec <= 0) return;
    const timer = setInterval(() => {
      setCountdownSec((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchDashboard();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdownSec, fetchDashboard]);

  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isLoading && !data) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <Loader label="Loading student analytics & personalized dashboard..." />
      </div>
    );
  }

  const student = data?.student;
  const nextExam = data?.nextExam;
  const activeAttempt = data?.activeAttempt;
  const perf = data?.latestPerformance;
  const rank = data?.rank;
  const predRank = data?.predictedRank;
  const subjects = data?.subjects || [];
  const weakAreas = data?.weakAreas || [];
  const recommendations = data?.recommendations || [];
  const timeMgmt = data?.timeManagement;
  const strategy = data?.attemptStrategy;
  const recentResults = data?.recentResults || [];
  const trend = data?.trendSummary;

  return (
    <div className="space-y-6 pb-12">
      {/* ── 1. Student Header & Identity Bar ──────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-12 translate-x-12 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 h-40 w-40 translate-y-12 rounded-full bg-purple-500/10 blur-2xl" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-[11px] font-black text-indigo-300 border border-indigo-500/30">
                {student?.studentId || 'STUDENT'}
              </span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-black text-emerald-300 border border-emerald-500/30">
                {student?.examTarget || 'NEET'} • {student?.class || 'Class 12'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {student?.name || 'Student'} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Track your mock diagnostic performance, focus on high-yield weak chapters, and achieve
              exam mastery.
            </p>
          </div>

          {/* Quick Nav Shortcut Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
            <button
              onClick={() => navigate(PRIVATE_NAVIGATION.studentExams)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 active:scale-95 transition-all"
            >
              <BookOpen size={15} />
              <span>Take Mock</span>
            </button>
            <button
              onClick={() => navigate(PRIVATE_NAVIGATION.studentComparison)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-white/10 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white border border-white/15 hover:bg-white/20 active:scale-95 transition-all"
            >
              <BarChart3 size={15} />
              <span>Mock Comparison</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. Prominent Resume Exam Card (if active) OR Next Exam Card ── */}
      {activeAttempt ? (
        <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 p-6 md:p-8 shadow-md animate-in fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800">
                  Attempt in Progress
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">
                {activeAttempt.examTitle}
              </h2>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 flex-wrap">
                <span>
                  Question {activeAttempt.currentQuestionNumber} of {activeAttempt.totalQuestions}
                </span>
                <span>•</span>
                <span>{activeAttempt.answeredCount} Answered</span>
                <span>•</span>
                <span className="font-mono text-emerald-800 font-bold">
                  Time Remaining: {formatTimer(activeAttempt.timeRemainingSeconds)}
                </span>
              </div>
            </div>

            <button
              onClick={() =>
                navigate(`/exam/${activeAttempt.examId}/attempt/${activeAttempt.attemptId}`)
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all shrink-0"
            >
              <PlayCircle size={18} />
              <span>Resume Test Session</span>
            </button>
          </div>
        </div>
      ) : nextExam ? (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-200 bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border',
                    nextExam.canStart
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300',
                  )}
                >
                  {nextExam.canStart ? '● Exam Live Now' : 'Upcoming Scheduled Mock'}
                </span>
                <span className="text-xs font-semibold text-slate-500">{nextExam.examTarget}</span>
              </div>

              <h2 className="text-xl md:text-2xl font-black text-slate-900">{nextExam.title}</h2>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock size={14} className="text-indigo-600" />
                  {nextExam.durationMinutes} mins
                </span>
                <span>•</span>
                <span>{nextExam.totalQuestions} Questions</span>
                <span>•</span>
                <span>{nextExam.totalMarks} Marks</span>
                {nextExam.startTime && (
                  <>
                    <span>•</span>
                    <span>
                      {new Date(nextExam.startTime).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                        timeZone: 'Asia/Kolkata',
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              {!nextExam.canStart && countdownSec > 0 && (
                <div className="text-right hidden sm:block">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    Starts In
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {formatTimer(countdownSec)}
                  </span>
                </div>
              )}

              <button
                onClick={() => navigate(`/student/exams/${nextExam.examId}`)}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black text-white shadow-lg active:scale-95 transition-all',
                  nextExam.canStart
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
                )}
              >
                {nextExam.canStart ? <PlayCircle size={18} /> : <Calendar size={18} />}
                <span>{nextExam.canStart ? 'Start Test' : 'View Blueprint'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ── 3. Performance Summary Metric Cards ─────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Latest Score</span>
            <Trophy size={18} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {perf ? perf.latestScore : '—'}
            </span>
            <span className="text-xs font-bold text-slate-400">/ {perf ? perf.maxScore : 720}</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
            {perf ? `${perf.percentage}% Score Rate` : 'No mock attempted yet'}
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Accuracy</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {perf ? `${perf.accuracy}%` : '—'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">
            {perf ? `${perf.correctCount} Correct / ${perf.incorrectCount} Wrong` : 'Pending'}
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Overall Rank</span>
            <Award size={18} className="text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {rank?.rank ? `#${rank.rank.toLocaleString('en-IN')}` : '—'}
            </span>
            {rank?.totalCandidates && (
              <span className="text-xs font-bold text-slate-400">
                / {rank.totalCandidates.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 mt-1 block">
            {rank?.percentile ? `${rank.percentile} Percentile` : 'Rank pending'}
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tests Attempted</span>
            <FileText size={18} className="text-purple-600" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {perf ? perf.totalAttempts : 0}
            </span>
            <span className="text-xs font-bold text-slate-400">Mocks</span>
          </div>
          <Link
            to={PRIVATE_NAVIGATION.studentComparison}
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-0.5"
          >
            Compare All Mocks →
          </Link>
        </div>
      </div>

      {/* ── 4. Interactive Trend & Performance Trajectory Chart ─────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">Performance Progression</h2>
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider',
                  trend?.scoreTrend === 'IMPROVING'
                    ? 'bg-emerald-100 text-emerald-800'
                    : trend?.scoreTrend === 'DECLINING'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-100 text-slate-700',
                )}
              >
                {trend?.scoreTrend === 'IMPROVING'
                  ? '▲ Improving Trajectory'
                  : 'Performance Trajectory'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparative progression across chronological mock attempts.
            </p>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 self-start sm:self-auto">
            {(['SCORE', 'ACCURACY', 'RANK', 'PERCENTILE'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTrendMetric(m)}
                className={cn(
                  'rounded-xl px-3 py-1.5 text-xs font-bold transition-all',
                  trendMetric === m
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900',
                )}
              >
                {m === 'SCORE'
                  ? 'Score'
                  : m === 'ACCURACY'
                    ? 'Accuracy'
                    : m === 'RANK'
                      ? 'Rank (↓ Better)'
                      : 'Percentile'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Multi-Point Bar / Trend Display */}
        {trend && trend.recentScores.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
            {trend.recentScores.map((item, idx) => {
              let valDisplay = '';
              let subDisplay = '';
              if (trendMetric === 'SCORE') {
                valDisplay = `${item.score}`;
                subDisplay = `${item.accuracy}% acc`;
              } else if (trendMetric === 'ACCURACY') {
                valDisplay = `${item.accuracy}%`;
                subDisplay = `${item.score} pts`;
              } else if (trendMetric === 'RANK') {
                valDisplay = item.rank ? `#${item.rank}` : '—';
                subDisplay = item.percentile ? `${item.percentile}%ile` : '';
              } else {
                valDisplay = item.percentile ? `${item.percentile}` : '—';
                subDisplay = `${item.accuracy}% acc`;
              }

              const isLatest = idx === trend.recentScores.length - 1;

              return (
                <div
                  key={idx}
                  className={cn(
                    'rounded-2xl border p-4 text-center transition-all',
                    isLatest
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-slate-50/60',
                  )}
                >
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                    {item.mockLabel}
                  </span>
                  <span className="text-xl font-black text-slate-900 block font-mono">
                    {valDisplay}
                  </span>
                  {subDisplay && (
                    <span className="text-[11px] font-semibold text-slate-500 block mt-0.5">
                      {subDisplay}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-8 text-center text-xs text-slate-500">
            Complete multiple mock exams to populate your continuous improvement chart.
          </div>
        )}
      </div>

      {/* ── 5. Subjects & Weak Areas Split Grid ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Performance Breakdown */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-indigo-600" />
              Subject Performance
            </h3>
            <span className="text-xs font-semibold text-slate-400">Latest Session</span>
          </div>

          <div className="space-y-3">
            {subjects.map((sub) => (
              <div
                key={sub.subjectId}
                className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-900 block">{sub.subjectName}</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {sub.score} / {sub.maxScore} Marks
                  </span>
                </div>

                <div className="flex items-center gap-3 text-right">
                  {sub.trendDelta !== null && sub.trendDelta !== undefined && (
                    <span
                      className={cn(
                        'text-xs font-bold flex items-center gap-0.5',
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

                  <span
                    className={cn(
                      'rounded-xl px-3 py-1 text-xs font-black border',
                      sub.status === 'EXCELLENT'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : sub.status === 'GOOD'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-rose-100 text-rose-800 border-rose-200',
                    )}
                  >
                    {sub.accuracy}% {sub.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak Areas (Focus Chapters) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              Priority Focus Areas
            </h3>
            <span className="text-xs font-semibold text-slate-400">Accuracy &lt; 70%</span>
          </div>

          {weakAreas.length > 0 ? (
            <div className="space-y-3">
              {weakAreas.map((area, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4 flex items-center justify-between gap-4"
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wide block">
                      {area.subjectName}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{area.chapterName}</h4>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-rose-600 block">
                      {area.accuracy}% Acc
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {area.totalQuestions} Questions Tested
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-8 text-center text-xs text-slate-500">
              No severe weak areas detected! Keep up the balanced preparation.
            </div>
          )}
        </div>
      </div>

      {/* ── 6. Recommendations & Smart Action Cards ───────────────── */}
      {recommendations.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-600" />
            Personalized Diagnostic Recommendations
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className={cn(
                  'rounded-2xl border p-4 flex flex-col justify-between gap-3',
                  rec.type === 'WARNING'
                    ? 'border-rose-200 bg-rose-50/30'
                    : rec.type === 'OPPORTUNITY'
                      ? 'border-indigo-200 bg-indigo-50/30'
                      : rec.type === 'STRENGTH'
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : 'border-slate-200 bg-slate-50/50',
                )}
              >
                <p className="text-xs font-bold text-slate-800 leading-relaxed">{rec.message}</p>

                {rec.actionLabel && (
                  <button
                    onClick={() => {
                      if (rec.targetUrl) navigate(rec.targetUrl);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-extrabold text-indigo-700 hover:text-indigo-900 self-start"
                  >
                    <span>{rec.actionLabel}</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Time Management, Attempt Strategy & Predicted Rank ───── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Time Management Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Time Management</span>
            <Clock size={18} className="text-indigo-600" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 block font-mono">
              {timeMgmt?.averageTimePerQuestionSeconds || 60}s
            </span>
            <span className="text-xs font-semibold text-slate-500">Avg Time / Question</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Status</span>
            <span className="font-bold text-indigo-600">
              {timeMgmt?.status === 'OPTIMAL' ? 'Optimal Pace' : 'Needs Speed Drill'}
            </span>
          </div>
        </div>

        {/* Attempt Strategy Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Attempt Strategy</span>
            <Flame size={18} className="text-rose-500" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 block">
              {strategy?.riskLevel || 'MODERATE'} RISK
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {strategy?.highRiskAttemptsCount || 0} High-Risk Questions
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Avoidable Penalty</span>
            <span className="font-bold text-rose-600">
              −{strategy?.avoidableNegativeMarks || 0} Marks
            </span>
          </div>
        </div>

        {/* Predicted Rank Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Predicted Rank</span>
            <Award size={18} className="text-purple-600" />
          </div>
          <div>
            <span className="text-2xl font-black text-purple-700 block font-mono">
              {predRank?.predictedRankMin && predRank?.predictedRankMax
                ? `${predRank.predictedRankMin} – ${predRank.predictedRankMax}`
                : '120 – 170'}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Confidence: {predRank?.confidence || 'Medium'}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Estimated</span>
            <span className="text-[11px] text-purple-700 font-bold">AI Projected</span>
          </div>
        </div>
      </div>

      {/* ── 8. Recent Results Table ─────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Completed Mocks</h3>
            <p className="text-xs text-slate-500">Detailed records of your evaluated sessions.</p>
          </div>
          <Link
            to={PRIVATE_NAVIGATION.studentHistory}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            View All History →
          </Link>
        </div>

        {recentResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-black uppercase tracking-wider">
                  <th className="py-3 px-3">Exam Title</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Score</th>
                  <th className="py-3 px-3 text-right">Accuracy</th>
                  <th className="py-3 px-3 text-right">Rank</th>
                  <th className="py-3 px-3 text-right">Percentile</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                {recentResults.map((row) => (
                  <tr key={row.attemptId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-3 font-bold text-slate-900">{row.examTitle}</td>
                    <td className="py-3.5 px-3 text-slate-500">{row.date}</td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900">
                      {row.score} / {row.maxScore}
                    </td>
                    <td className="py-3.5 px-3 text-right text-emerald-600 font-bold">
                      {row.accuracy}%
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono">
                      {row.rank ? `#${row.rank.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-indigo-600">
                      {row.percentile ?? '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => navigate(`/exam/result/${row.attemptId}`)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        <span>Result</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl bg-slate-50 p-8 text-center text-xs text-slate-500">
            No completed exams found yet. Start your first mock to see results!
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboardPage;
