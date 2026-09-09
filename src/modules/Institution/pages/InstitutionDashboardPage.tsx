import React, { useState, useMemo } from 'react';
import {
  Building2,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  Search,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  BookOpen,
  GraduationCap,
  Medal,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import {
  useInstitutionDashboardSummaryQuery,
  useInstitutionStudentsQuery,
  useInstitutionAdmissionYearsQuery,
  useInstitutionBatchesQuery,
  useInstitutionRankExamsQuery,
  useInstitutionRankingsQuery,
  downloadInstituteStudentsExcel,
  InstituteStudentItem,
  InstituteRankItem,
} from '../services/institutionDashboard.service';
import { SectionError } from '@/components/feedback/SectionError';
import { Skeleton } from '@/components/ui/Skeleton';

export const InstitutionDashboardPage: React.FC = () => {
  // ── Global Filter State for Student Directory ──
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedAdmissionYear, setSelectedAdmissionYear] = useState<number | ''>('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentLimit, setStudentLimit] = useState(10);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // ── Rank List State ──
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [rankBatchId, setRankBatchId] = useState<string>('');
  const [rankPage, setRankPage] = useState(1);
  const rankLimit = 10;

  // ── Queries ──
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isFetching: isDashboardFetching,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useInstitutionDashboardSummaryQuery();

  const { data: batchesData = [] } = useInstitutionBatchesQuery();

  const { data: admissionYearsData = [] } = useInstitutionAdmissionYearsQuery();

  const {
    data: studentsData,
    isLoading: isStudentsLoading,
    isFetching: isStudentsFetching,
    error: studentsError,
    refetch: refetchStudents,
  } = useInstitutionStudentsQuery({
    page: studentPage,
    limit: studentLimit,
    search: studentSearch,
    batchId: selectedBatchId || undefined,
    admissionYear: selectedAdmissionYear || undefined,
    sortBy,
    sortOrder,
  });

  const { data: rankExamsData = [] } = useInstitutionRankExamsQuery();
  const safeRankExams = Array.isArray(rankExamsData) ? rankExamsData : [];

  // If selectedExamId is empty and rankExamsData loaded, pick first exam by default
  const activeExamId = useMemo(() => {
    if (selectedExamId) return selectedExamId;
    if (safeRankExams.length > 0) return safeRankExams[0].id;
    return undefined;
  }, [selectedExamId, safeRankExams]);

  const {
    data: rankingsData,
    isLoading: isRankingsLoading,
    isFetching: isRankingsFetching,
    error: rankingsError,
    refetch: refetchRankings,
  } = useInstitutionRankingsQuery({
    examId: activeExamId,
    batchId: rankBatchId || undefined,
    page: rankPage,
    limit: rankLimit,
  });

  // ── Handlers ──
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setStudentPage(1);
  };

  const handleClearFilters = () => {
    setStudentSearch('');
    setSelectedBatchId('');
    setSelectedAdmissionYear('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setStudentPage(1);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      await downloadInstituteStudentsExcel({
        search: studentSearch,
        batchId: selectedBatchId || undefined,
        admissionYear: selectedAdmissionYear || undefined,
      });
    } catch (err: any) {
      setExportError('Unable to generate Excel report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = Boolean(
    studentSearch.trim() || selectedBatchId || selectedAdmissionYear !== '',
  );

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
  const weakestSubject = dashboardData?.weakestSubject;
  const batches = Array.isArray(dashboardData?.batches) ? dashboardData.batches : [];

  const studentList = Array.isArray(studentsData?.data) ? studentsData.data : [];
  const studentMeta = studentsData?.meta || {
    total: studentList.length,
    page: studentPage,
    limit: studentLimit,
    totalPages: Math.ceil(studentList.length / studentLimit) || 1,
  };

  const rankList = Array.isArray(rankingsData?.data) ? rankingsData.data : [];
  const rankMeta = rankingsData?.meta || {
    total: rankList.length,
    page: rankPage,
    limit: rankLimit,
    totalPages: Math.ceil(rankList.length / rankLimit) || 1,
  };

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
              onClick={() => {
                refetchDashboard();
                refetchStudents();
                refetchRankings();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-95"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${isDashboardFetching || isStudentsFetching || isRankingsFetching ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <NavLink
              to={PRIVATE_NAVIGATION.institutionBatches}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs sm:text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-95"
            >
              <Layers className="h-4 w-4" /> Manage Batches
            </NavLink>
            <NavLink
              to={PRIVATE_NAVIGATION.institutionBulkUpload}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95"
            >
              <FileSpreadsheet className="h-4 w-4" /> Bulk Onboarding
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
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Enrolled
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">
              {summary.totalStudents.toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600">{summary.activeStudents}</span> active students
            </p>
          </div>

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
          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Top Student
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
                <Award className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-2 truncate text-base font-bold text-slate-900" title={topStudent?.name}>
              {topStudent ? topStudent.name : 'No test results'}
            </div>
            <p className="mt-1 text-xs font-semibold text-emerald-600">
              {topStudent ? `${topStudent.percentage}% avg score` : 'Pending attempts'}
            </p>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Academic Highlights: Weakest Subject & Batch Summary */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Weakest Subject Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Weakest Subject</h3>
              <p className="text-xs text-slate-500">Lowest performing academic domain</p>
            </div>
          </div>
          {weakestSubject ? (
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{weakestSubject.name}</span>
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                  {weakestSubject.accuracy}% accuracy
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Subject requiring reinforcement. Recommended to schedule focused revision tests for this area.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">
              No subject-level deficiencies identified yet.
            </div>
          )}
        </div>

        {/* Batch Performance Overview */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:col-span-2">
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
              Manage All &rarr;
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. STUDENT DIRECTORY (Server-side Paginated, Searchable, Filterable) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Header with Title and Download Excel Action */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/20">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Student Directory</h2>
                  <p className="text-xs text-slate-500">
                    Institute-scoped student records with live server-side search, sorting, and batch + year filters
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 active:scale-95 disabled:opacity-50 transition"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" /> Generating Excel...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Download Excel
                  </>
                )}
              </button>
            </div>
          </div>

          {exportError && (
            <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              {exportError}
            </div>
          )}

          {/* Filter Bar */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, ID, mobile, email..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setStudentPage(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-xs sm:text-sm placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
              />
            </div>

            {/* Batch Filter */}
            <div className="relative">
              <select
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  setStudentPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-3.5 pr-8 text-xs sm:text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
              >
                <option value="">All Batches</option>
                {batchesData.map((b) => (
                  <option key={b.id} value={b.id}>
                    Batch: {b.name}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>

            {/* Admission Year Filter */}
            <div className="relative">
              <select
                value={selectedAdmissionYear}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : '';
                  setSelectedAdmissionYear(val);
                  setStudentPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-3.5 pr-8 text-xs sm:text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
              >
                <option value="">All Admission Years</option>
                {admissionYearsData.map((yr) => (
                  <option key={yr} value={yr}>
                    Admission Year: {yr}
                  </option>
                ))}
              </select>
              <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50 transition active:scale-95"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto relative">
          {isStudentsFetching && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-600 animate-pulse" />
          )}

          {studentsError && studentList.length === 0 ? (
            <div className="p-6">
              <SectionError
                title="Failed to load students"
                description="Unable to retrieve the student directory. Please try again or adjust your filters."
                onRetry={() => refetchStudents()}
              />
            </div>
          ) : isStudentsLoading && studentList.length === 0 ? (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Exam Target</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4 text-center">Admission Year</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Enrolled On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><Skeleton className="h-4 w-32 rounded" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20 rounded" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28 rounded" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-16 rounded" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20 rounded" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24 rounded" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-12 rounded mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20 rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : studentList.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">No students found</h3>
              <p className="mt-1 text-xs text-slate-500">
                {hasActiveFilters
                  ? 'No students match your active filter criteria.'
                  : 'No students have been enrolled in this institute yet.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none transition"
                  >
                    <div className="flex items-center gap-1.5">
                      Student Name
                      {sortBy === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-600" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('studentId')}
                    className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none transition"
                  >
                    <div className="flex items-center gap-1.5">
                      Student ID
                      {sortBy === 'studentId' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-600" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Exam Target</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th
                    onClick={() => handleSort('admissionYear')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:text-indigo-600 select-none transition"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      Admission Year
                      {sortBy === 'admissionYear' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-600" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:text-indigo-600 select-none transition"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      Status
                      {sortBy === 'status' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-600" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none transition"
                  >
                    <div className="flex items-center gap-1.5">
                      Enrolled On
                      {sortBy === 'createdAt' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-600" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentList.map((student: InstituteStudentItem) => (
                  <tr key={student.id} className="hover:bg-indigo-50/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{student.name}</div>
                      {student.email && (
                        <div className="text-xs text-slate-500 truncate max-w-[180px]">
                          {student.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-700">
                      {student.studentCode || student.studentId}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {student.mobile}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {student.className}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {student.examTargetName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                        {student.batchName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">
                      {student.admissionYear || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          student.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : student.status === 'SUSPENDED'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(student.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {studentMeta.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3.5 gap-4">
            <div className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-bold text-slate-800">
                {(studentPage - 1) * studentLimit + (studentList.length > 0 ? 1 : 0)}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-800">
                {Math.min(studentPage * studentLimit, studentMeta.total)}
              </span>{' '}
              of <span className="font-bold text-slate-800">{studentMeta.total}</span> students
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Rows:</span>
                <select
                  value={studentLimit}
                  onChange={(e) => {
                    setStudentLimit(Number(e.target.value));
                    setStudentPage(1);
                  }}
                  className="rounded-lg border border-slate-300 bg-white py-1 px-2 text-xs focus:border-indigo-600 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                  disabled={studentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-xs font-semibold text-slate-700">
                  {studentPage} / {studentMeta.totalPages}
                </span>
                <button
                  onClick={() => setStudentPage((p) => Math.min(studentMeta.totalPages, p + 1))}
                  disabled={studentPage >= studentMeta.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. DYNAMIC RANK LIST (Section 9 - 12) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/50 p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-500/20">
                <Medal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Institute Rank List</h2>
                <p className="text-xs text-slate-500">
                  Live leaderboard scoped to institution candidates with dynamic exam selection
                </p>
              </div>
            </div>

            {/* Exam Selector Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px]">
                <select
                  value={activeExamId || ''}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    setRankPage(1);
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-3.5 pr-8 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                >
                  {safeRankExams.length === 0 && (
                    <option value="">No completed exams</option>
                  )}
                  {safeRankExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.targetName})
                    </option>
                  ))}
                </select>
                <BookOpen className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>

              {/* Optional Batch Filter for Rank List */}
              <div className="relative min-w-[160px]">
                <select
                  value={rankBatchId}
                  onChange={(e) => {
                    setRankBatchId(e.target.value);
                    setRankPage(1);
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-3.5 pr-8 text-xs sm:text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                >
                  <option value="">All Batches</option>
                  {batchesData.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <Filter className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Rank Table Content */}
        <div className="overflow-x-auto relative">
          {isRankingsFetching && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500 animate-pulse" />
          )}

          {rankingsError && rankList.length === 0 ? (
            <div className="p-6">
              <SectionError
                title="Unable to load rank list"
                description="Failed to retrieve ranking data for this exam. Please check your connection and retry."
                onRetry={() => refetchRankings()}
              />
            </div>
          ) : isRankingsLoading && rankList.length === 0 ? (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4 text-right">Score</th>
                  <th className="py-3.5 px-4 text-right">Percentage</th>
                  <th className="py-3.5 px-4 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4 text-center"><Skeleton className="h-7 w-7 rounded-full mx-auto" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-32 rounded" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-20 rounded" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-24 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-12 rounded ml-auto" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-14 rounded ml-auto" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-12 rounded ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : rankList.length === 0 ? (
            <div className="p-12 text-center">
              <Medal className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">No rank data available</h3>
              <p className="mt-1 text-xs text-slate-500">
                {activeExamId
                  ? 'No submitted attempts recorded for the selected test.'
                  : 'Complete institutional mock tests to view student rankings.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4 text-right">Score</th>
                  <th className="py-3.5 px-4 text-right">Percentage</th>
                  <th className="py-3.5 px-4 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankList.map((item: InstituteRankItem) => {
                  const isGold = item.rank === 1;
                  const isSilver = item.rank === 2;
                  const isBronze = item.rank === 3;

                  return (
                    <tr
                      key={item.studentId + item.rank}
                      className={`hover:bg-amber-50/20 transition ${
                        isGold ? 'bg-amber-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            isGold
                              ? 'bg-amber-400 text-amber-950 shadow-sm'
                              : isSilver
                                ? 'bg-slate-300 text-slate-900 shadow-sm'
                                : isBronze
                                  ? 'bg-amber-700/20 text-amber-900 border border-amber-600/30'
                                  : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {item.studentName}
                          {isGold && <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-indigo-700 font-semibold">
                        {item.studentId}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                          {item.batchName || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {item.score}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          {item.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                          {item.accuracy}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Rank List Pagination */}
        {rankMeta.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3.5 gap-4">
            <div className="text-xs text-slate-500">
              Showing rank{' '}
              <span className="font-bold text-slate-800">
                {(rankPage - 1) * rankLimit + (rankList.length > 0 ? 1 : 0)}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-800">
                {Math.min(rankPage * rankLimit, rankMeta.total)}
              </span>{' '}
              of <span className="font-bold text-slate-800">{rankMeta.total}</span> ranked students
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setRankPage((p) => Math.max(1, p - 1))}
                disabled={rankPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs font-semibold text-slate-700">
                {rankPage} / {rankMeta.totalPages}
              </span>
              <button
                onClick={() => setRankPage((p) => Math.min(rankMeta.totalPages, p + 1))}
                disabled={rankPage >= rankMeta.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default InstitutionDashboardPage;
