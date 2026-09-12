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
  ChevronLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  Sparkles,
  BarChart3,
  BookOpen,
  RotateCw,
} from 'lucide-react';
import cn from 'classnames';
import { useStudentDashboardQuery } from '../services/dashboard.queries';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import {
  Skeleton,
  SkeletonKpiGrid,
  SkeletonChart,
  SkeletonTable,
} from '@/components/ui/Skeleton';
import SectionError from '@/components/feedback/SectionError';

// ── Student Dashboard Skeleton ───────────────────────────────────────────────
const StudentDashboardSkeleton: React.FC = () => (
  <div className="space-y-6 pb-12 animate-in fade-in duration-200">
    {/* Identity Bar Skeleton */}
    <div className="rounded-3xl bg-slate-900/90 p-6 md:p-8 space-y-3 border border-slate-800 shadow-xl">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-24 bg-slate-800" />
        <Skeleton className="h-6 w-32 bg-slate-800" />
      </div>
      <Skeleton className="h-9 w-64 bg-slate-800" />
      <Skeleton className="h-4 w-96 max-w-full bg-slate-800" />
    </div>

    {/* Upcoming Exams Slider Skeleton */}
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-100 p-4 space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-8 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>

    {/* 4-Card KPI Grid Skeleton */}
    <SkeletonKpiGrid count={4} />

    {/* Performance Chart Skeleton */}
    <SkeletonChart />

    {/* Tables Grid Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonTable rows={4} />
      <SkeletonTable rows={4} />
    </div>
  </div>
);

// ── Upcoming Exams Slider Component ──────────────────────────────────────────
interface UpcomingExamsSliderProps {
  exams: Array<{
    examId: string;
    title: string;
    examTarget: string;
    durationMinutes: number;
    totalQuestions: number;
    totalMarks: number;
    startTime: string | null;
    endTime: string | null;
    status: string;
    canStart: boolean;
    waitSeconds: number;
    accessStatus: string;
    message: string;
  }>;
}

const UpcomingExamsSlider: React.FC<UpcomingExamsSliderProps> = ({ exams }) => {
  const navigate = useNavigate();
  const sliderRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(exams.length > 1);
  const [activeSlide, setActiveSlide] = useState(0);

  const checkScrollState = useCallback(() => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
      const cardWidth = 360;
      const index = Math.round(scrollLeft / cardWidth);
      setActiveSlide(Math.max(0, Math.min(exams.length - 1, index)));
    }
  }, [exams.length]);

  useEffect(() => {
    checkScrollState();
  }, [checkScrollState, exams]);

  const slide = (direction: 'prev' | 'next') => {
    if (sliderRef.current) {
      const cardWidth = 360;
      sliderRef.current.scrollBy({
        left: direction === 'prev' ? -cardWidth : cardWidth,
        behavior: 'smooth',
      });
    }
  };

  const jumpToSlide = (index: number) => {
    if (sliderRef.current) {
      const cardWidth = 360;
      sliderRef.current.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
    }
  };

  if (!exams || exams.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 p-6 text-center shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto mb-2">
          <Calendar size={18} />
        </div>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
          No Upcoming Exams Scheduled
        </p>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          All your targeted mock exams are up to date. You can practice with standalone mock tests or check the calendar.
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <button
            onClick={() => navigate(PRIVATE_NAVIGATION.studentMockTests)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-sm"
          >
            Browse Mock Tests
          </button>
          <button
            onClick={() => navigate(PRIVATE_NAVIGATION.studentExams)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            All Examinations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-indigo-100/80 dark:border-slate-800 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-850 p-5 md:p-6 shadow-sm space-y-4">
      {/* Slider Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none">
            <Calendar size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900 dark:text-white">
                Upcoming & Live Examinations
              </h2>
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-950 px-2.5 py-0.5 text-[10px] font-black text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
                {exams.length} {exams.length === 1 ? 'Exam' : 'Exams'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              Swipe or navigate through your scheduled mocks and live assessments
            </p>
          </div>
        </div>

        {/* Action / Slider Controls */}
        <div className="flex items-center gap-2">
          <Link
            to={PRIVATE_NAVIGATION.studentExams}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 mr-2"
          >
            <span>All Exams</span>
            <ChevronRight size={14} />
          </Link>

          <button
            onClick={() => slide('prev')}
            disabled={!canScrollLeft}
            aria-label="Previous Slide"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl border transition-all',
              canScrollLeft
                ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm active:scale-95'
                : 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed',
            )}
          >
            <ChevronLeft size={16} />
          </button>

          <button
            onClick={() => slide('next')}
            disabled={!canScrollRight}
            aria-label="Next Slide"
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl border transition-all',
              canScrollRight
                ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm active:scale-95'
                : 'border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed',
            )}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={sliderRef}
        onScroll={checkScrollState}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 pt-1 no-scrollbar snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {exams.map((exam, idx) => {
          const isLive = exam.status === 'LIVE';
          const remainingMinutes = isLive && exam.endTime
            ? Math.max(0, Math.ceil((new Date(exam.endTime).getTime() - Date.now()) / (1000 * 60)))
            : null;

          const formatCardTime = (isoString?: string | null) => {
            if (!isoString) return 'Flexible Schedule';
            try {
              const d = new Date(isoString);
              return d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata',
              }).replace(',', ' •');
            } catch {
              return 'Flexible Schedule';
            }
          };

          return (
            <div
              key={exam.examId || idx}
              className={cn(
                'min-w-[280px] sm:min-w-[340px] md:min-w-[370px] max-w-[400px] shrink-0 snap-start flex flex-col justify-between rounded-3xl p-5 border transition-all duration-300 hover:shadow-lg',
                isLive
                  ? 'border-emerald-300 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/40 dark:from-slate-800 dark:to-emerald-950/20 shadow-emerald-500/5'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-slate-200/50 dark:shadow-none',
              )}
            >
              <div className="space-y-3">
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 text-[11px] font-black text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                    {typeof exam.examTarget === 'object'
                      ? (exam.examTarget as any)?.name
                      : exam.examTarget || 'General'}
                  </span>

                  {isLive ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 text-[10px] font-black text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      LIVE
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <Clock size={11} />
                      UPCOMING
                    </span>
                  )}
                </div>

                {/* Exam Title */}
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white line-clamp-1">
                  {exam.title}
                </h3>

                {/* Metrics Pill Grid */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 flex-wrap">
                  <span className="flex items-center gap-1 rounded-md bg-slate-50 dark:bg-slate-700/50 px-2 py-1 border border-slate-100 dark:border-slate-700">
                    <Clock size={12} className="text-indigo-500" />
                    {exam.durationMinutes} mins
                  </span>
                  <span className="rounded-md bg-slate-50 dark:bg-slate-700/50 px-2 py-1 border border-slate-100 dark:border-slate-700">
                    {exam.totalQuestions} Qs
                  </span>
                  <span className="rounded-md bg-slate-50 dark:bg-slate-700/50 px-2 py-1 border border-slate-100 dark:border-slate-700">
                    {exam.totalMarks} Marks
                  </span>
                </div>

                {/* Start Time & End Time */}
                <div className="space-y-1.5 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 p-3 border border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 font-medium">Start:</span>
                    <span className="font-semibold">{formatCardTime(exam.startTime)}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400 font-medium">End:</span>
                    <span className="font-semibold">{formatCardTime(exam.endTime)}</span>
                  </div>
                  {isLive && remainingMinutes !== null && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-800 text-emerald-600 dark:text-emerald-400 font-bold">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Remaining:
                      </span>
                      <span>{remainingMinutes} minutes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                <button
                  onClick={() => navigate(`/student/exams/${exam.examId}`)}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-black text-white shadow-md active:scale-95 transition-all',
                    isLive
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 dark:shadow-none'
                      : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none',
                  )}
                >
                  {isLive ? <PlayCircle size={15} /> : <Calendar size={15} />}
                  <span>{isLive ? 'Start Exam' : 'View Details'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Position Dots (only if multiple exams) */}
      {exams.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {exams.map((_, dotIdx) => (
            <button
              key={dotIdx}
              onClick={() => jumpToSlide(dotIdx)}
              aria-label={`Go to slide ${dotIdx + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all duration-300',
                activeSlide === dotIdx
                  ? 'w-6 bg-indigo-600 dark:bg-indigo-400'
                  : 'w-1.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const round2 = (val: number | string | null | undefined): string => {
  if (val === null || val === undefined || val === '') return '0';
  const num = Number(val);
  if (isNaN(num)) return '0';
  return (Math.round(num * 100) / 100).toString();
};

const formatTimer = (sec: number) => {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const secs = sec % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const StudentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading, isFetching, error, refetch } = useStudentDashboardQuery();
  const [trendMetric, setTrendMetric] = useState<'SCORE' | 'ACCURACY' | 'RANK' | 'PERCENTILE'>(
    'SCORE',
  );

  const nextExam = data?.nextExam;

  // Auto-refresh when upcoming exam unlocks without interval polling
  useEffect(() => {
    if (!nextExam || !nextExam.waitSeconds || nextExam.waitSeconds <= 0) return;
    const timer = setTimeout(() => {
      refetch();
    }, nextExam.waitSeconds * 1000);
    return () => clearTimeout(timer);
  }, [nextExam?.waitSeconds, refetch]);

  // Auto-refresh when any live exam end-time is reached to transition away from LIVE
  useEffect(() => {
    const liveExams = data?.upcomingExams?.filter((e) => e.status === 'LIVE' && e.endTime) || [];
    if (liveExams.length === 0) return;

    const timers = liveExams.map((e) => {
      const msUntilEnd = new Date(e.endTime!).getTime() - Date.now();
      if (msUntilEnd <= 0) {
        refetch();
        return null;
      }
      return setTimeout(() => {
        refetch();
      }, Math.min(msUntilEnd + 1000, 2147483647));
    });

    return () => {
      timers.forEach((t) => t && clearTimeout(t));
    };
  }, [data?.upcomingExams, refetch]);

  if (isLoading && !data) {
    return <StudentDashboardSkeleton />;
  }

  if (error && !data) {
    return (
      <div className="py-8">
        <SectionError
          title="Unable to load personalized student dashboard"
          message="We encountered an issue fetching your analytics and exam schedule. Your sidebar and navigation remain active."
          onRetry={refetch}
        />
      </div>
    );
  }

  const student = data?.student;
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
              {isFetching && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-[10px] font-bold text-indigo-200 border border-indigo-400/30 animate-pulse">
                  <RotateCw size={10} className="animate-spin text-indigo-300" />
                  <span>Syncing...</span>
                </span>
              )}
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
              onClick={() => navigate(PRIVATE_NAVIGATION.studentMockTests)}
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

      {/* ── 2. Active Attempt in Progress (if any) ────────────────── */}
      {activeAttempt && (
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
      )}

      {/* ── 3. Upcoming & Live Examinations Slider ────────────────── */}
      <UpcomingExamsSlider
        exams={
          data?.upcomingExams && data.upcomingExams.length > 0
            ? data.upcomingExams
            : nextExam
              ? [nextExam]
              : []
        }
      />

      {/* ── 3. Performance Summary Metric Cards ─────────────────────── */}
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 min-[360px]:p-4 sm:p-5 shadow-xs">
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
            {perf ? `${round2(perf.percentage)}% Score Rate` : 'No mock attempted yet'}
          </span>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 min-[360px]:p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Accuracy</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-slate-900">
              {perf ? `${round2(perf.accuracy)}%` : '—'}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 mt-1 block">
            {perf && (perf.correctCount !== undefined || (perf as any).correctAnswers !== undefined)
              ? `${perf.correctCount ?? (perf as any).correctAnswers ?? 0} Correct / ${perf.incorrectCount ?? (perf as any).wrongAnswers ?? 0} Wrong`
              : 'Pending diagnostic'}
          </span>
        </div>

        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 min-[360px]:p-4 sm:p-5 shadow-xs">
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

        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 min-[360px]:p-4 sm:p-5 shadow-xs">
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
          <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 self-start sm:self-auto max-w-full overflow-x-auto scrollbar-none shrink-0">
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
                subDisplay = `${round2(item.accuracy)}% acc`;
              } else if (trendMetric === 'ACCURACY') {
                valDisplay = `${round2(item.accuracy)}%`;
                subDisplay = `${item.score} pts`;
              } else if (trendMetric === 'RANK') {
                valDisplay = item.rank ? `#${item.rank}` : '—';
                subDisplay = item.percentile ? `${round2(item.percentile)}%ile` : '';
              } else {
                valDisplay = item.percentile ? `${round2(item.percentile)}` : '—';
                subDisplay = `${round2(item.accuracy)}% acc`;
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
                    {round2(sub.accuracy)}% {sub.status}
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
                      {round2(area.accuracy)}% Acc
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
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 md:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-600" />
              Personalized Diagnostic Recommendations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Targeted academic priorities derived from your actual question accuracy, timing, and error patterns
            </p>
          </div>
          {recommendations.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 border border-indigo-100 self-start sm:self-auto">
              {recommendations.length} Active {recommendations.length === 1 ? 'Insight' : 'Insights'}
            </span>
          )}
        </div>

        {recommendations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-slate-300" />
            <h4 className="mt-2 text-sm font-bold text-slate-800">No diagnostic alerts yet</h4>
            <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
              Complete more mock tests to generate personalized chapter diagnoses, pacing tips, and targeted revision priorities.
            </p>
            <button
              onClick={() => navigate('/student/mock-tests')}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition shadow-sm"
            >
              Explore Available Mock Tests <ArrowRight size={13} />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec) => {
              const isCritical = rec.priority === 'CRITICAL' || rec.type === 'WARNING';
              const isStrength = rec.priority === 'STRENGTH' || rec.type === 'STRENGTH';
              const isOpportunity = rec.type === 'OPPORTUNITY';

              return (
                <div
                  key={rec.id}
                  className={cn(
                    'rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:shadow-md',
                    isCritical
                      ? 'border-rose-200/90 bg-gradient-to-br from-rose-50/40 via-white to-white'
                      : isStrength
                        ? 'border-emerald-200/90 bg-gradient-to-br from-emerald-50/40 via-white to-white'
                        : isOpportunity
                          ? 'border-indigo-200/90 bg-gradient-to-br from-indigo-50/40 via-white to-white'
                          : 'border-slate-200/90 bg-gradient-to-br from-amber-50/30 via-white to-white',
                  )}
                >
                  <div className="space-y-2.5">
                    {/* Priority & Subject Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            'rounded-lg px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase',
                            rec.priority === 'CRITICAL'
                              ? 'bg-rose-600 text-white'
                              : rec.priority === 'HIGH'
                                ? 'bg-rose-100 text-rose-800'
                                : rec.priority === 'STRENGTH'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isOpportunity
                                    ? 'bg-indigo-100 text-indigo-800'
                                    : 'bg-amber-100 text-amber-800',
                          )}
                        >
                          {rec.priority === 'CRITICAL'
                            ? 'Critical Focus'
                            : rec.priority === 'HIGH'
                              ? 'High Priority'
                              : rec.priority === 'STRENGTH'
                                ? 'Mastery'
                                : rec.type === 'TIP'
                                  ? 'Pacing Tip'
                                  : 'Priority Area'}
                        </span>

                        {rec.subjectName && (
                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                            {rec.subjectName}
                          </span>
                        )}

                        {rec.chapterName && (
                          <span className="rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 truncate max-w-[140px]" title={rec.chapterName}>
                            {rec.chapterName}
                          </span>
                        )}
                      </div>

                      {rec.confidence && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {rec.confidence === 'HIGH' ? 'High Confidence' : 'Preliminary Signal'}
                        </span>
                      )}
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {rec.title || rec.message}
                      </h4>
                      {rec.reason && (
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          {rec.reason}
                        </p>
                      )}
                    </div>

                    {/* Key Metrics Pills */}
                    {rec.metrics && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {rec.metrics.accuracy !== undefined && (
                          <span className={cn(
                            'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold',
                            rec.metrics.accuracy < 50
                              ? 'bg-rose-50 text-rose-700 border border-rose-100'
                              : rec.metrics.accuracy >= 75
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-slate-100 text-slate-700',
                          )}>
                            Accuracy: {rec.metrics.accuracy}%
                          </span>
                        )}
                        {rec.metrics.sampleSize !== undefined && (
                          <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 border border-slate-200">
                            {rec.metrics.sampleSize} Questions
                          </span>
                        )}
                        {rec.metrics.wrongCount !== undefined && rec.metrics.wrongCount > 0 && (
                          <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 border border-rose-100">
                            {rec.metrics.wrongCount} Wrong
                          </span>
                        )}
                        {rec.metrics.negativeMarksLost !== undefined && rec.metrics.negativeMarksLost > 0 && (
                          <span className="inline-flex items-center rounded-md bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-700 border border-rose-200">
                            −{rec.metrics.negativeMarksLost} Marks Penalty
                          </span>
                        )}
                        {rec.metrics.trendDelta !== undefined && (
                          <span className={cn(
                            'inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold',
                            rec.metrics.trendDelta > 0
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-rose-50 text-rose-700',
                          )}>
                            {rec.metrics.trendDelta > 0 ? `+${rec.metrics.trendDelta}%` : `${rec.metrics.trendDelta}%`} Trend
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    {rec.mockTestId ? (
                      <button
                        onClick={() => {
                          navigate(rec.targetUrl || `/student/mock-tests?mockTestId=${rec.mockTestId}`);
                        }}
                        className="inline-flex items-center gap-2 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-1.5 rounded-xl transition-all shadow-xs active:scale-95"
                      >
                        <BookOpen size={13} />
                        <span>{rec.actionLabel || `Practice ${rec.subjectName || ''} Mock Test`}</span>
                        <ArrowRight size={13} />
                      </button>
                    ) : rec.fallbackMessage ? (
                      <span className="text-[11px] font-medium text-slate-400 italic">
                        {rec.fallbackMessage}
                      </span>
                    ) : rec.actionLabel && rec.targetUrl ? (
                      <button
                        onClick={() => {
                          if (rec.targetUrl) navigate(rec.targetUrl);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 hover:underline active:scale-95 transition"
                      >
                        <span>{rec.actionLabel}</span>
                        <ArrowRight size={13} />
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate('/student/mock-tests')}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 active:scale-95 transition"
                      >
                        <span>Practice Mock Tests</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider">Attempt Strategy</span>
              <Flame size={18} className="text-rose-500" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900 block">
                {strategy?.riskLevel || 'BALANCED'}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {strategy?.highRiskAttemptsCount || 0} High-Risk Questions Attempted
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span>Avoidable Penalty</span>
              <span className="font-bold text-rose-600">
                −{strategy?.avoidableNegativeMarks || 0} Marks
              </span>
            </div>
          </div>
          {recentResults[0]?.attemptId && (
            <button
              onClick={() => navigate(`/exam/result/${recentResults[0].attemptId}`)}
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 self-start pt-1"
            >
              <span>View Strategy Analysis</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>

        {/* Predicted Rank Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Predicted Rank</span>
              {predRank?.targetExam && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-purple-100 text-purple-700 uppercase">
                  {predRank.targetExam}
                </span>
              )}
            </div>
            <Award size={18} className="text-purple-600" />
          </div>

          {predRank?.available !== false && (predRank?.predictedRank || predRank?.predictedRankMin) ? (
            <div className="space-y-2">
              <div>
                <span className="text-2xl font-black text-purple-700 block font-mono tracking-tight">
                  {predRank.predictedRank
                    ? `~${predRank.predictedRank.toLocaleString()}`
                    : `${predRank.predictedRankMin?.toLocaleString()} – ${predRank.predictedRankMax?.toLocaleString()}`}
                </span>
                {predRank.predictedRankMin && predRank.predictedRankMax && (
                  <span className="text-xs font-semibold text-slate-600 block">
                    Expected: {predRank.predictedRankMin.toLocaleString()} – {predRank.predictedRankMax.toLocaleString()}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span
                  className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    predRank.confidence === 'HIGH'
                      ? 'bg-emerald-100 text-emerald-800'
                      : predRank.confidence === 'MEDIUM'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {predRank.confidence || 'Medium'} Confidence
                </span>
                {predRank.attemptsUsed ? (
                  <span className="text-slate-400 text-[10px]">
                    Based on {predRank.attemptsUsed} attempt{predRank.attemptsUsed > 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-1">
              <p className="text-xs font-semibold text-slate-700">
                {predRank?.reason === 'NO_TARGET_EXAM'
                  ? 'Select your target exam to see predicted rank.'
                  : predRank?.reason === 'PREDICTION_UNAVAILABLE'
                    ? 'Predicted rank is not available yet.'
                    : 'Complete an exam to get your predicted rank.'}
              </p>
              <p className="text-[11px] text-slate-400">
                Statistical projection based on verified historical datasets.
              </p>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {predRank?.targetExamName || 'Competitive Model'}
            </span>
            <span className="text-[10px] text-purple-700 font-bold">Historical Projection</span>
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
          <div className="flex items-center gap-3">
            <Link
              to={PRIVATE_NAVIGATION.studentMockHistory}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
            >
              View Mock Test History →
            </Link>
          </div>
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
                      {round2(row.accuracy)}%
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
