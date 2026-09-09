import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Calendar,
  RotateCw,
  ShieldCheck,
  BookOpen,
  Award,
  TrendingUp,
  CheckSquare,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Activity,
} from 'lucide-react';
import cn from 'classnames';
import { useGetParentStudentsAPI, useGetParentChildDashboardAPI } from '@/modules/Exams/services';
import type {
  ParentStudentInfo,
  ParentDashboardResponse,
  RecommendedRevisionItem,
} from '@/types/exam.types';
import Button from '@/components/ui/Button';
import { DashboardMainContentSkeleton } from '@/components/ui/Skeleton';

export const ParentDashboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStudentId = searchParams.get('studentId') || '';

  const { getParentStudentsAPI, isLoading: isLoadingStudents } = useGetParentStudentsAPI();
  const { getParentChildDashboardAPI, isLoading: isLoadingDashboard } =
    useGetParentChildDashboardAPI();

  const [students, setStudents] = useState<ParentStudentInfo[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(urlStudentId);
  const [dashboardData, setDashboardData] = useState<ParentDashboardResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SUBJECTS' | 'REVISION' | 'TESTS'>(
    'OVERVIEW',
  );
  const [hoveredTrendIdx, setHoveredTrendIdx] = useState<number | null>(null);

  const loadStudents = async () => {
    const res = await getParentStudentsAPI();
    if (res.data && res.data.length > 0) {
      setStudents(res.data);
      const match = res.data.find((s) => s.studentId === urlStudentId);
      if (match) {
        setSelectedStudentId(match.studentId);
      } else if (!selectedStudentId) {
        setSelectedStudentId(res.data[0].studentId);
      }
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const loadChildDashboard = async (id: string) => {
    if (!id) return;
    const res = await getParentChildDashboardAPI(id);
    if (res.data) {
      setDashboardData(res.data);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      loadChildDashboard(selectedStudentId);
    }
  }, [selectedStudentId]);

  const trend = dashboardData?.trendHistory || [];
  const maxScore = Math.max(...trend.map((t) => t.score), 100);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 md:p-8 space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 border border-teal-200 text-teal-800 flex items-center gap-1">
              <ShieldCheck size={13} className="text-teal-600" />
              Verified Parental Access
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
              Brainros Academic Guardian Suite
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Parent Academic Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Holistic performance analytics, weak subject diagnostics, time discipline, rank
            standing, and personalized revision plans.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="secondary"
            onClick={() => selectedStudentId && loadChildDashboard(selectedStudentId)}
            className="gap-1.5"
            size="sm"
            disabled={isLoadingDashboard}
          >
            <RotateCw size={14} className={isLoadingDashboard ? 'animate-spin text-teal-600' : ''} />
            <span>{isLoadingDashboard ? 'Refreshing...' : 'Refresh Analytics'}</span>
          </Button>
        </div>
      </div>

      {/* ── Multi-Child Switcher ────────────────────────────────────── */}
      {students.length > 1 && (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3 pl-1">
            Select Linked Student:
          </span>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {students.map((st) => (
              <button
                key={st.studentId}
                onClick={() => {
                  setSelectedStudentId(st.studentId);
                  setSearchParams({ studentId: st.studentId });
                }}
                className={cn(
                  'p-3 sm:p-3.5 rounded-2xl border transition-all text-left flex items-center gap-2.5 sm:gap-3 min-w-[200px] sm:min-w-[240px] cursor-pointer',
                  selectedStudentId === st.studentId
                    ? 'bg-teal-50/90 border-teal-300 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50',
                )}
              >
                <div
                  className={cn(
                    'p-2 sm:p-2.5 rounded-xl text-white font-black text-xs',
                    selectedStudentId === st.studentId ? 'bg-teal-600' : 'bg-slate-400',
                  )}
                >
                  {st.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">{st.name}</h4>
                  <span className="text-[10px] text-slate-500 font-bold block">
                    {st.examTarget || 'General'} • {st.grade || 'Student'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Dashboard Content ─────────────────────────────────── */}
      {(isLoadingDashboard && !dashboardData) || (isLoadingStudents && students.length === 0) ? (
        <DashboardMainContentSkeleton />
      ) : dashboardData ? (
        <div className="space-y-6">
          {/* ── 1. Hero Performance & Student Profile Card ───────────── */}
          <div className="rounded-2xl sm:rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-teal-950 to-indigo-950 p-4 sm:p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Award className="w-64 h-64 text-teal-400" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-teal-800/50 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full text-xs font-black bg-teal-500/20 border border-teal-400/30 text-teal-300">
                    {dashboardData.student.examTarget || 'Exam Candidate'}
                  </span>
                  {dashboardData.student.grade && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-slate-200">
                      {dashboardData.student.grade}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                  {dashboardData.student.name}
                </h2>
                <p className="text-xs text-teal-200/80 mt-1">
                  {dashboardData.student.schoolCollege} • ID: {dashboardData.student.studentCode} •{' '}
                  {dashboardData.student.district || dashboardData.student.state || 'India'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 backdrop-blur-xs">
                  <Calendar size={14} className="text-teal-300" />
                  <span>Attendance: {dashboardData.summary.attendancePercentage}%</span>
                </div>
              </div>
            </div>

            {/* Metric KPI Grid (9 Specific Parent Requirements) */}
            <div className="relative z-10 grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6">
              {/* 1. Tests Attempted */}
              <div className="p-3.5 min-[360px]:p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
                <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider block">
                  Tests Attempted
                </span>
                <div className="text-2xl md:text-3xl font-black text-white">
                  {dashboardData.summary.testsAttempted} Tests
                </div>
                <span className="text-[10px] text-teal-300 font-bold block">
                  {dashboardData.attendance.attendedCount} of{' '}
                  {dashboardData.attendance.scheduledCount} Scheduled
                </span>
              </div>

              {/* 2. Latest Score & Best */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
                <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider block">
                  Latest Score
                </span>
                <div className="text-2xl md:text-3xl font-black text-white">
                  {dashboardData.summary.latestScore}
                </div>
                <span className="text-[10px] text-slate-300 font-bold block">
                  Avg: {dashboardData.summary.averageScore} • Best:{' '}
                  {dashboardData.summary.bestScore}
                </span>
              </div>

              {/* 3. Improvement Delta */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
                <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider block">
                  Score Improvement
                </span>
                <div className="text-2xl md:text-3xl font-black text-emerald-300 flex items-center gap-1">
                  {dashboardData.summary.scoreImprovement >= 0 ? (
                    <ArrowUpRight size={24} className="text-emerald-400" />
                  ) : (
                    <ArrowDownRight size={24} className="text-rose-400" />
                  )}
                  <span>
                    {dashboardData.summary.scoreImprovement >= 0
                      ? `+${dashboardData.summary.scoreImprovement}`
                      : dashboardData.summary.scoreImprovement}
                  </span>
                </div>
                <span className="text-[10px] text-emerald-300 font-bold block">
                  Growth vs First Mock Exam
                </span>
              </div>

              {/* 4. Rank & Percentile */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs space-y-1">
                <span className="text-[11px] font-bold text-teal-200 uppercase tracking-wider block">
                  National Standing
                </span>
                <div className="text-2xl md:text-3xl font-black text-amber-300">
                  {dashboardData.summary.latestRank ? `#${dashboardData.summary.latestRank}` : '—'}
                </div>
                <span className="text-[10px] text-amber-300 font-bold block">
                  {dashboardData.summary.latestPercentile
                    ? `${dashboardData.summary.latestPercentile}% Percentile`
                    : 'Percentile Tracked'}
                </span>
              </div>
            </div>
          </div>

          {/* ── Navigation Tab Bar ───────────────────────────────────── */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={cn(
                'px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5',
                activeTab === 'OVERVIEW'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <Activity size={14} />
              <span>Full Analytics Overview</span>
            </button>
            <button
              onClick={() => setActiveTab('SUBJECTS')}
              className={cn(
                'px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5',
                activeTab === 'SUBJECTS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <BookOpen size={14} />
              <span>Subject Diagnostics</span>
            </button>
            <button
              onClick={() => setActiveTab('REVISION')}
              className={cn(
                'px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5',
                activeTab === 'REVISION'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <Sparkles size={14} />
              <span>Recommended Revision & Action Plan</span>
            </button>
            <button
              onClick={() => setActiveTab('TESTS')}
              className={cn(
                'px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5',
                activeTab === 'TESTS'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100',
              )}
            >
              <FileText size={14} />
              <span>All Attempted Tests ({dashboardData.recentTests.length})</span>
            </button>
          </div>

          {/* ── Tab 1: Full Analytics Overview ───────────────────────── */}
          {(activeTab === 'OVERVIEW' || activeTab === 'SUBJECTS') && (
            <div className="space-y-6">
              {/* Chronological Score & Improvement Trajectory */}
              {trend.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="text-teal-600" size={18} />
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          Mock Test Score & Improvement Trajectory
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Progress curve across all chronological test attempts.
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">
                      {trend.length} Historical Mocks
                    </span>
                  </div>

                  {/* Visual Chart */}
                  <div className="relative pt-6 pb-2">
                    <div className="flex items-end gap-2 h-44 w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
                      {trend.map((pt, idx) => {
                        const heightPercent =
                          maxScore > 0 ? Math.max(10, (pt.score / maxScore) * 100) : 10;
                        const isHovered = hoveredTrendIdx === idx;

                        return (
                          <div
                            key={pt.attemptId || idx}
                            onMouseEnter={() => setHoveredTrendIdx(idx)}
                            onMouseLeave={() => setHoveredTrendIdx(null)}
                            className="flex-1 min-w-[36px] max-w-[64px] flex flex-col items-center justify-end h-full relative group cursor-pointer"
                          >
                            {isHovered && (
                              <div className="absolute -top-14 z-30 px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-[10px] font-bold shadow-lg pointer-events-none whitespace-nowrap">
                                <div>{pt.examName}</div>
                                <div className="text-teal-300">
                                  Score: {pt.score}/{pt.maxScore} ({pt.accuracy}% accuracy)
                                </div>
                              </div>
                            )}

                            <span className="text-[10px] font-extrabold text-slate-700 mb-1">
                              {pt.score}
                            </span>
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className={`w-full rounded-t-xl transition-all duration-300 ${
                                isHovered
                                  ? 'bg-gradient-to-t from-teal-700 to-teal-500 shadow-md'
                                  : 'bg-gradient-to-t from-teal-600 to-teal-400 group-hover:from-teal-500'
                              }`}
                            />
                            <span className="text-[9px] text-slate-400 font-bold mt-1.5 truncate max-w-full">
                              {pt.date}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── 2-Column Analytic Breakdown ──────────────────────────── */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Subject Mastery & Weak Subjects */}
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <BookOpen className="text-indigo-600" size={18} />
                      <div>
                        <h3 className="text-sm font-black text-slate-900">
                          Subject Mastery & Diagnostics
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Strongest areas vs weak subjects requiring intervention.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {dashboardData.subjects.strongest && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                          Strongest Subject
                        </span>
                        <h4 className="text-sm font-black text-emerald-950">
                          {dashboardData.subjects.strongest.name}
                        </h4>
                        <span className="text-xs font-extrabold text-emerald-700 block">
                          {dashboardData.subjects.strongest.accuracy}% Solving Accuracy
                        </span>
                      </div>
                    )}

                    {dashboardData.subjects.weakest && (
                      <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 space-y-1">
                        <span className="text-[10px] font-bold text-rose-800 uppercase block">
                          Weak Subject (Priority)
                        </span>
                        <h4 className="text-sm font-black text-rose-950">
                          {dashboardData.subjects.weakest.name}
                        </h4>
                        <span className="text-xs font-extrabold text-rose-700 block">
                          {dashboardData.subjects.weakest.accuracy}% Solving Accuracy
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Subject List */}
                  <div className="space-y-2 pt-1">
                    {dashboardData.subjects.all.map((sub) => (
                      <div
                        key={sub.subjectId}
                        className="p-3 rounded-2xl bg-slate-50/60 border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-extrabold text-slate-900 block">{sub.name}</span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            {sub.score} / {sub.maxScore} Marks ({sub.percentage}%)
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-indigo-700 block">
                            {sub.accuracy}% Accuracy
                          </span>
                          <span
                            className={cn(
                              'text-[9px] font-black uppercase px-2 py-0.5 rounded-full',
                              sub.status === 'EXCELLENT' || sub.status === 'STRONG'
                                ? 'bg-emerald-100 text-emerald-800'
                                : sub.status === 'GOOD'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : 'bg-rose-100 text-rose-800',
                            )}
                          >
                            {sub.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Time Management & Attendance Discipline */}
                <div className="space-y-6">
                  {/* Time Management */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="text-indigo-600" size={18} />
                        <div>
                          <h3 className="text-sm font-black text-slate-900">
                            Time Management & Pacing
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Question velocity and exam duration utilization.
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'px-2.5 py-0.5 rounded-full text-xs font-black',
                          dashboardData.timeManagement.status === 'EXCELLENT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : dashboardData.timeManagement.status === 'GOOD'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800',
                        )}
                      >
                        {dashboardData.timeManagement.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Average Solving Speed
                        </span>
                        <span className="text-lg font-black text-slate-900 mt-1 block">
                          {dashboardData.timeManagement.averageTimePerQuestionSeconds}s
                        </span>
                        <span className="text-[10px] text-slate-400">per question</span>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Time Utilization
                        </span>
                        <span className="text-lg font-black text-indigo-600 mt-1 block">
                          {dashboardData.timeManagement.timeUtilizationPercentage}%
                        </span>
                        <span className="text-[10px] text-slate-400">of available time</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs font-medium text-indigo-950 leading-relaxed">
                      💡 <span className="font-bold">Observation:</span>{' '}
                      {dashboardData.timeManagement.observation}
                    </div>
                  </div>

                  {/* Attendance & Test Discipline */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="text-teal-600" size={18} />
                        <div>
                          <h3 className="text-sm font-black text-slate-900">
                            Attendance & Mock Discipline
                          </h3>
                          <p className="text-[11px] text-slate-500">
                            Scheduled mock exams attended vs missed tests.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Scheduled
                        </span>
                        <span className="text-base font-black text-slate-900 mt-1 block">
                          {dashboardData.attendance.scheduledCount}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-teal-50 border border-teal-200">
                        <span className="text-[10px] font-bold text-teal-800 uppercase block">
                          Attended
                        </span>
                        <span className="text-base font-black text-teal-950 mt-1 block">
                          {dashboardData.attendance.attendedCount}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200">
                        <span className="text-[10px] font-bold text-rose-800 uppercase block">
                          Missed
                        </span>
                        <span className="text-base font-black text-rose-950 mt-1 block">
                          {dashboardData.attendance.missedCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Tab 2: Recommended Revision & Guidance ─────────────────── */}
          {(activeTab === 'OVERVIEW' || activeTab === 'REVISION') && (
            <div className="space-y-6">
              {/* Recommended Revisions Section */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900">
                        Recommended Revision & Topic Action Plan
                      </h3>
                      <p className="text-xs text-slate-500">
                        High-yield topics requiring targeted practice based on diagnostic accuracy
                        gaps.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(dashboardData.recommendedRevisions || []).map(
                    (rev: RecommendedRevisionItem, idx: number) => (
                      <div
                        key={idx}
                        className="p-5 rounded-2xl border border-slate-200/80 bg-slate-50/60 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 text-sm">
                            {rev.subjectName}
                          </span>
                          <span
                            className={cn(
                              'px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase',
                              rev.priority === 'HIGH'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : rev.priority === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-teal-100 text-teal-800 border border-teal-200',
                            )}
                          >
                            {rev.priority} Priority
                          </span>
                        </div>

                        <h4 className="text-xs font-extrabold text-indigo-900">{rev.topicName}</h4>
                        <p className="text-[11px] text-slate-500">{rev.reason}</p>

                        <div className="border-t border-slate-200/60 pt-2 space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Recommended Actions ({rev.estimatedHours}h estimated):
                          </span>
                          {rev.recommendedActions.map((act, actIdx) => (
                            <div
                              key={actIdx}
                              className="flex items-start gap-1.5 text-xs text-slate-700"
                            >
                              <CheckSquare size={13} className="text-teal-600 shrink-0 mt-0.5" />
                              <span>{act}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              {/* Constructive Parental Guidance */}
              {dashboardData.recommendations.length > 0 && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-black text-slate-900">
                    Constructive Parent Coaching Tips
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {dashboardData.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'p-4 rounded-2xl border text-xs flex items-start gap-3',
                          rec.severity === 'HIGH'
                            ? 'bg-amber-50/70 border-amber-200 text-amber-950'
                            : 'bg-indigo-50/60 border-indigo-200 text-indigo-950',
                        )}
                      >
                        {rec.severity === 'HIGH' ? (
                          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 size={18} className="text-indigo-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <h4 className="font-extrabold text-slate-900">{rec.title}</h4>
                          <p className="text-slate-600 mt-1 leading-relaxed font-medium">
                            {rec.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab 3: Completed Mock Exams Log ────────────────────────── */}
          {(activeTab === 'OVERVIEW' || activeTab === 'TESTS') && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="text-indigo-600" size={18} />
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Attempted Examination Log
                    </h3>
                    <p className="text-xs text-slate-500">
                      Chronological history of completed tests with scores, solving accuracy, and
                      ranks.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="py-3 px-4">Exam Name</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-center">Accuracy</th>
                      <th className="py-3 px-4 text-right">National Rank</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboardData.recentTests.map((t) => (
                      <tr key={t.attemptId} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{t.examName}</td>
                        <td className="py-3.5 px-4 text-slate-500">{t.date}</td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-indigo-700">
                          {t.score} / {t.maxScore} ({t.percentage}%)
                        </td>
                        <td className="py-3.5 px-4 text-center font-extrabold text-teal-600">
                          {t.accuracy}%
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-purple-700">
                          {t.rank ? `#${t.rank}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-16 text-center shadow-xs space-y-3">
          <Users className="mx-auto text-slate-300" size={48} />
          <h3 className="text-base font-bold text-slate-800">No Student Profile Linked</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            There are currently no active student profiles associated with your parent account.
            Please link your child's student ID with parental authorization.
          </p>
        </div>
      )}
    </div>
  );
};

export default ParentDashboardPage;
