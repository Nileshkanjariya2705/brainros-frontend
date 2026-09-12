import React from 'react';
import {
  Building2,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  Layers,
  RefreshCw,
  BookOpen,
  GraduationCap,
  ArrowRight,
  UserCheck,
  Trophy,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { useInstitutionDashboardSummaryQuery } from '../services/institutionDashboard.service';
import { SectionError } from '@/components/feedback/SectionError';

export const InstitutionDashboardPage: React.FC = () => {
  // ── Queries ──
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isFetching: isDashboardFetching,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useInstitutionDashboardSummaryQuery();

  const institution = dashboardData?.institution || {
    name: 'Institution',
    code: 'INST',
    type: 'COACHING',
    status: 'ACTIVE',
  };

  const summary = dashboardData?.summary || {
    totalStudents: 0,
    activeStudents: 0,
    testsConducted: 0,
    averagePercentage: 0,
    averageAccuracy: 0,
    attendancePercentage: 0,
  };

  const topStudent = dashboardData?.topStudent;
  const batches = Array.isArray(dashboardData?.batches) ? dashboardData.batches : [];

  return (
    <div className="space-y-8 pb-16">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Header Banner */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 backdrop-blur border border-indigo-400/30 shadow-inner">
              <Building2 className="h-7 w-7 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {institution.name}
                </h1>
                <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30">
                  {institution.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-indigo-200">
                Code: <span className="font-mono font-semibold">{institution.code}</span> • Type:{' '}
                <span className="font-medium">{institution.type}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => refetchDashboard()}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-95"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${isDashboardFetching ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <NavLink
              to={PRIVATE_NAVIGATION.institutionStudents}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition active:scale-95"
            >
              <UserCheck className="h-4 w-4" /> Student Directory
            </NavLink>
            <NavLink
              to={PRIVATE_NAVIGATION.institutionRankList}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-amber-500 transition active:scale-95"
            >
              <Trophy className="h-4 w-4" /> Rank List
            </NavLink>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. KPI Cards Grid (Dynamic Database Metrics) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {isDashboardLoading && !dashboardData ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100 border border-slate-200/80 p-5" />
          ))}
        </div>
      ) : dashboardError && !dashboardData ? (
        <SectionError
          title="Unable to load dashboard metrics"
          description="Please refresh or check your connection."
          onRetry={() => refetchDashboard()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {/* Total Students */}
          <NavLink
            to={PRIVATE_NAVIGATION.institutionStudents}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-indigo-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600">
                Total Enrolled
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.totalStudents.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-500 flex items-center justify-between">
              <span><strong className="text-emerald-600">{summary.activeStudents}</strong> active</span>
              <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition">&rarr;</span>
            </p>
          </NavLink>

          {/* Active Students */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Status
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-emerald-600 tracking-tight">
              {summary.activeStudents.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {summary.totalStudents > 0
                ? `${Math.round((summary.activeStudents / summary.totalStudents) * 100)}% active ratio`
                : 'No students enrolled'}
            </p>
          </div>

          {/* Tests Conducted */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Tests Held
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.testsConducted}
            </div>
            <p className="mt-1 text-xs text-slate-500">Completed mock exams</p>
          </div>

          {/* Avg Percentage */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Avg Score
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-blue-600 tracking-tight">
              {summary.averagePercentage}%
            </div>
            <p className="mt-1 text-xs text-slate-500">Across all completed attempts</p>
          </div>

          {/* Attendance */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Attendance
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-amber-600 tracking-tight">
              {summary.attendancePercentage}%
            </div>
            <p className="mt-1 text-xs text-slate-500">Test participation rate</p>
          </div>

          {/* Top Candidate */}
          <NavLink
            to={PRIVATE_NAVIGATION.institutionRankList}
            className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md hover:border-amber-300"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-amber-600">
                Top Student
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 truncate text-base font-bold text-slate-900" title={topStudent?.name}>
              {topStudent ? topStudent.name : 'No test results'}
            </div>
            <p className="mt-1 text-xs font-semibold text-emerald-600 flex items-center justify-between">
              <span>{topStudent ? `${topStudent.percentage}% avg score` : 'Pending attempts'}</span>
              <span className="font-semibold text-amber-600 group-hover:translate-x-0.5 transition">&rarr;</span>
            </p>
          </NavLink>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. Feature Navigation Cards (Students Page & Rank List Page) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Student Directory Card */}
        <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white via-indigo-50/20 to-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
                <UserCheck className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                {summary.totalStudents} Enrolled
              </span>
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">Student Directory</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              Access the complete institute student roster with live search, batch & admission year filters, sorting, and Excel export.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-indigo-100/60 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              <strong className="text-slate-800">{summary.activeStudents}</strong> active accounts
            </span>
            <NavLink
              to={PRIVATE_NAVIGATION.institutionStudents}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition active:scale-95"
            >
              Open Student Directory <ArrowRight className="h-4 w-4" />
            </NavLink>
          </div>
        </div>

        {/* Institute Rank List Card */}
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-white via-amber-50/20 to-white p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
                <Trophy className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                {topStudent ? `Rank #1: ${topStudent.name}` : 'Leaderboard'}
              </span>
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">Institute Rank List</h3>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
              View real-time exam leaderboard rankings, top rankers, test scores, percentage averages, and accuracy metrics.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-amber-100/60 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              <strong className="text-slate-800">{summary.testsConducted}</strong> completed tests
            </span>
            <NavLink
              to={PRIVATE_NAVIGATION.institutionRankList}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 transition active:scale-95"
            >
              Open Rank List <ArrowRight className="h-4 w-4" />
            </NavLink>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. Batch Performance Overview */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Batch Performance Summary</h3>
              <p className="text-xs text-slate-500">Aggregated database metrics across active batches</p>
            </div>
          </div>
          <NavLink
            to={PRIVATE_NAVIGATION.institutionBatches}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Manage All Batches &rarr;
          </NavLink>
        </div>

        {batches.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            <GraduationCap className="mx-auto h-8 w-8 text-slate-400" />
            <p className="mt-2 text-sm font-medium">No batches created yet</p>
            <NavLink
              to={PRIVATE_NAVIGATION.institutionBatches}
              className="mt-3 inline-block rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100"
            >
              Create First Batch
            </NavLink>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Batch Name</th>
                  <th className="py-2.5 px-3 text-center">Students</th>
                  <th className="py-2.5 px-3 text-center">Avg Score</th>
                  <th className="py-2.5 px-3 text-center">Avg Accuracy</th>
                  <th className="py-2.5 px-3 text-center">Attendance</th>
                  <th className="py-2.5 px-3">Top Performer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.slice(0, 5).map((b) => (
                  <tr key={b.batchId} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 font-semibold text-slate-900">{b.batchName}</td>
                    <td className="py-3 px-3 text-center text-slate-700">
                      {b.studentCount} <span className="text-slate-400 font-normal">({b.activeStudents} active)</span>
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-indigo-600">
                      {b.averagePercentage}%
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-blue-600">
                      {b.averageAccuracy}%
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-emerald-600">
                      {b.attendancePercentage}%
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {b.topStudent ? (
                        <span className="font-medium text-slate-800">
                          {b.topStudent.name} <span className="text-emerald-600 font-semibold">({b.topStudent.percentage}%)</span>
                        </span>
                      ) : (
                        <span className="text-slate-400">None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionDashboardPage;
