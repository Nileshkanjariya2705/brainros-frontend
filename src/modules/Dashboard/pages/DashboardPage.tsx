import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  Target,
  FileText,
  Star,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Database,
  Sliders,
  DollarSign,
} from 'lucide-react';

// ** Hooks & Services **
import { useAuth } from '@/hooks/useAuth';
import { useRole, ROLES } from '@/modules/Auth/auth-access';
import { useGetMyAttemptsAPI } from '@/modules/Exams/services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

// ** Components **
import Loader from '@/components/feedback/Loader';

// ** Types **
import type { AttemptSummary } from '@/types/exam.types';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { activeRole } = useRole();
  const { getMyAttemptsAPI, isLoading } = useGetMyAttemptsAPI();

  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await getMyAttemptsAPI();
        if (!active) return;
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray((res.data as any)?.data)
            ? (res.data as any).data
            : [];
        setAttempts(list);
      } catch {
        if (active) setAttempts([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [getMyAttemptsAPI]);

  // ═════════════════════════════════════════════════════════════════════
  // 1. SUPER ADMIN / PLATFORM DASHBOARD VIEW
  // ═════════════════════════════════════════════════════════════════════
  if (activeRole === ROLES.SUPER_ADMIN) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* Super Admin Welcome Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-8 text-white shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 p-8 opacity-15 pointer-events-none">
            <ShieldAlert className="w-64 h-64 text-indigo-400" />
          </div>
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>PLATFORM EXECUTIVE GOVERNANCE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Platform Command Center
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time platform analytics, question repositories, high-risk approval queues, and
              institutional B2B governance.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <Link
                to={PRIVATE_NAVIGATION.adminControlCenter}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md hover:bg-slate-100 transition"
              >
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span>Admin Control Center</span>
              </Link>
              <Link
                to={PRIVATE_NAVIGATION.adminApprovalQueue}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600/50 hover:bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white border border-indigo-400/30 shadow-md transition"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Review Approval Queue</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Platform Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">
                Question Repository
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Database className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">4,850+</div>
            <p className="text-[11px] text-emerald-600 font-semibold">
              Active & verified questions
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Active Blueprints</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Sliders className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">24 Blueprints</div>
            <p className="text-[11px] text-purple-600 font-semibold">JEE & NEET generators</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">
                Institutional Clients
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900">12 Institutes</div>
            <p className="text-[11px] text-blue-600 font-semibold">B2B Coaching networks</p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600">3 Items</div>
            <p className="text-[11px] text-slate-500 font-semibold">
              Exams & Bulk uploads awaiting sign-off
            </p>
          </div>
        </div>

        {/* Quick Operations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="h-5 w-5 text-indigo-600" />
              <span>Question Bank & Content</span>
            </h3>
            <p className="text-xs text-slate-500">
              Author single-choice, multiple-choice, numerical questions and translate across 5+
              regional languages.
            </p>
            <div className="flex gap-2">
              <Link
                to={PRIVATE_NAVIGATION.questionBank}
                className="text-xs font-bold text-indigo-600 hover:underline"
              >
                Open Question Bank &rarr;
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-5 w-5 text-purple-600" />
              <span>Exam Generator Studio</span>
            </h3>
            <p className="text-xs text-slate-500">
              Configure dynamic blueprint rules, difficulty stratifications, and section timing
              constraints.
            </p>
            <div className="flex gap-2">
              <Link
                to={PRIVATE_NAVIGATION.examBlueprints}
                className="text-xs font-bold text-purple-600 hover:underline"
              >
                Manage Blueprints &rarr;
              </Link>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <span>Audit & High-Risk Logs</span>
            </h3>
            <p className="text-xs text-slate-500">
              Review immutable audit logs, credential updates, permission overrides, and security
              events.
            </p>
            <div className="flex gap-2">
              <Link
                to={PRIVATE_NAVIGATION.adminAuditLogs}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                View Audit Logs &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // 2. ADMIN / OPERATIONAL DASHBOARD VIEW
  // ═════════════════════════════════════════════════════════════════════
  if (activeRole === ROLES.ADMIN) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-8 text-white shadow-xl">
          <h1 className="text-3xl font-black">Academic Administration Dashboard</h1>
          <p className="mt-2 text-sm text-indigo-200 max-w-xl">
            Oversee question authoring, translation pipelines, exam blueprints, and attempt
            evaluations.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              to={PRIVATE_NAVIGATION.questionBank}
              className="px-4 py-2 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-md hover:bg-slate-100 transition"
            >
              Question Bank
            </Link>
            <Link
              to={PRIVATE_NAVIGATION.examBlueprints}
              className="px-4 py-2 rounded-xl bg-white/20 text-white font-bold text-xs hover:bg-white/30 transition"
            >
              Exam Blueprints
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Question Bank</span>
            <div className="text-2xl font-black text-slate-900">4,850 Questions</div>
            <Link
              to={PRIVATE_NAVIGATION.questionBank}
              className="text-xs font-bold text-indigo-600 block pt-2"
            >
              Browse Questions &rarr;
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Exam Schedules</span>
            <div className="text-2xl font-black text-slate-900">8 Active</div>
            <Link
              to={PRIVATE_NAVIGATION.examScheduling}
              className="text-xs font-bold text-indigo-600 block pt-2"
            >
              Manage Schedules &rarr;
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Regional Languages</span>
            <div className="text-2xl font-black text-slate-900">5 Languages</div>
            <Link
              to={PRIVATE_NAVIGATION.languages}
              className="text-xs font-bold text-indigo-600 block pt-2"
            >
              Language Settings &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // 3. INSTITUTION ADMIN / B2B DASHBOARD VIEW
  // ═════════════════════════════════════════════════════════════════════
  if (activeRole === ROLES.INSTITUTION_ADMIN) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 p-8 text-white shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
            <Building2 className="h-3.5 w-3.5" />
            <span>INSTITUTION PORTAL</span>
          </div>
          <h1 className="text-3xl font-black">Institution Performance Hub</h1>
          <p className="mt-2 text-sm text-blue-200 max-w-xl">
            Manage your batches, bulk student registrations, assigned mock test participation, and
            performance analytics.
          </p>
          <div className="mt-5 flex gap-3">
            <Link
              to={PRIVATE_NAVIGATION.institutionBatches}
              className="px-4 py-2 rounded-xl bg-white text-blue-900 font-bold text-xs shadow-md hover:bg-slate-100 transition"
            >
              Manage Batches
            </Link>
            <Link
              to={PRIVATE_NAVIGATION.institutionBulkUpload}
              className="px-4 py-2 rounded-xl bg-white/20 text-white font-bold text-xs hover:bg-white/30 transition"
            >
              Bulk Upload Students
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Batches</span>
            <div className="text-2xl font-black text-slate-900">4 Active Batches</div>
            <Link
              to={PRIVATE_NAVIGATION.institutionBatches}
              className="text-xs font-bold text-blue-600 block pt-2"
            >
              View Batches &rarr;
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Enrolled Students</span>
            <div className="text-2xl font-black text-slate-900">320 Students</div>
            <Link
              to={PRIVATE_NAVIGATION.institutionBulkUpload}
              className="text-xs font-bold text-blue-600 block pt-2"
            >
              Add More Students &rarr;
            </Link>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Reports</span>
            <div className="text-2xl font-black text-slate-900">Weekly Summary</div>
            <Link
              to={PRIVATE_NAVIGATION.institutionReports}
              className="text-xs font-bold text-blue-600 block pt-2"
            >
              Download Reports &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // 4. SALES AGENT DASHBOARD VIEW
  // ═════════════════════════════════════════════════════════════════════
  if (activeRole === ROLES.SALES_AGENT) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 p-8 text-white shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
            <DollarSign className="h-3.5 w-3.5" />
            <span>SALES & B2B ONBOARDING</span>
          </div>
          <h1 className="text-3xl font-black">Sales Pipeline & Institutional Accounts</h1>
          <p className="mt-2 text-sm text-emerald-200 max-w-xl">
            Track coaching institute leads, active subscriptions, onboarding progress, and
            commission targets.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">
              Institutions Onboarded
            </span>
            <div className="text-2xl font-black text-slate-900">12 Institutes</div>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Active Subscriptions</span>
            <div className="text-2xl font-black text-slate-900">8 Active Plans</div>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Conversion Rate</span>
            <div className="text-2xl font-black text-emerald-600">68%</div>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // 5. PARENT DASHBOARD VIEW
  // ═════════════════════════════════════════════════════════════════════
  if (activeRole === ROLES.PARENT) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-indigo-900 p-8 text-white shadow-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>PARENT PORTAL</span>
          </div>
          <h1 className="text-3xl font-black">Student Academic Progress & Monitoring</h1>
          <p className="mt-2 text-sm text-teal-100 max-w-xl">
            Review your linked student's mock exam scores, weak subject areas, time discipline, and
            national percentile ranks.
          </p>
          <div className="mt-5">
            <Link
              to={PRIVATE_NAVIGATION.parentDashboard}
              className="px-5 py-2.5 rounded-xl bg-white text-teal-900 font-bold text-xs shadow-md hover:bg-slate-100 transition"
            >
              Open Comprehensive Ward Portal &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // 6. STUDENT DASHBOARD (DEFAULT VIEW)
  // ═════════════════════════════════════════════════════════════════════
  const completedAttempts = attempts.filter((a) =>
    ['SUBMITTED', 'AUTO_SUBMITTED', 'EVALUATED', 'COMPLETED'].includes(a.status?.name),
  );
  const totalExams = completedAttempts.length;
  const avgScore =
    totalExams > 0
      ? completedAttempts.reduce((sum, a) => sum + (a.result?.percentage || 0), 0) / totalExams
      : 0;
  const bestScore =
    totalExams > 0 ? Math.max(...completedAttempts.map((a) => a.result?.percentage || 0)) : 0;
  const totalCorrect = completedAttempts.reduce(
    (sum, a) => sum + (a.result?.correctAnswers || 0),
    0,
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-56 w-56 -translate-y-8 translate-x-8 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 h-32 w-32 translate-y-8 rounded-full bg-purple-400/20 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-sm font-medium mb-2">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span>Welcome back!</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              Hi, {user?.studentProfile?.name ?? user?.phone ?? 'Student'} 👋
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-indigo-200 max-w-md">
              Track your mock test results, accuracy breakdowns, and improvement areas.
            </p>

            <Link
              to={PRIVATE_NAVIGATION.availableExams}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-indigo-700 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
            >
              <BookOpen size={16} />
              <span>Take a Mock Test</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {/* Quick Target Badge */}
          <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 border border-white/15 text-xs space-y-1.5 min-w-[200px]">
            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
              Target Goal
            </span>
            <p className="text-lg font-black text-white font-mono">
              {user?.studentProfile?.examTarget || 'JEE / NEET Mock'}
            </p>
            <p className="text-[11px] text-indigo-200">
              {user?.studentProfile?.class || 'Class 12 Standard'}
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tests Taken</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalExams}</div>
          <p className="text-[11px] text-slate-500 font-semibold">Completed mock tests</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Average Score</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{avgScore.toFixed(1)}%</div>
          <p className="text-[11px] text-slate-500 font-semibold">Across all attempts</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Best Score</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600">{bestScore.toFixed(1)}%</div>
          <p className="text-[11px] text-slate-500 font-semibold">Personal high</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Correct Answers</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-600">{totalCorrect}</div>
          <p className="text-[11px] text-slate-500 font-semibold">Total questions solved</p>
        </div>
      </div>

      {/* Recent Attempts Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Test Attempts</h2>
            <p className="text-xs text-slate-500">
              Review your past scores and detailed question analysis
            </p>
          </div>
          <Link
            to={PRIVATE_NAVIGATION.myHistory}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <span>View Full History</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader label="Loading recent test attempts..." />
          </div>
        ) : attempts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <BookOpen className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No mock tests attempted yet</p>
            <Link
              to={PRIVATE_NAVIGATION.availableExams}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:underline"
            >
              <span>Explore Available Mock Tests</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attempts.slice(0, 5).map((att) => {
              const examTitle =
                (att as any).exam?.title || (att as any).examSchedule?.exam?.title || 'Mock Test';
              const targetName =
                (att as any).exam?.examTarget?.name ||
                (att as any).examSchedule?.exam?.examTarget?.name ||
                'JEE/NEET';
              const score = att.result?.totalScore ?? 0;
              const percentage = att.result?.percentage ?? 0;

              return (
                <div
                  key={att.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-slate-900">{examTitle}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span>Target: {targetName}</span>
                      <span>•</span>
                      <span>Status: {att.status?.name || 'Completed'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-black text-indigo-600">
                        {percentage.toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-slate-400">{score} Marks</div>
                    </div>
                    <Link
                      to={PRIVATE_NAVIGATION.examResult.replace(':attemptId', att.id)}
                      className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition"
                    >
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
