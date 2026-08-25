import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Users,
  Database,
  Globe2,
  Sliders,
  Building2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Activity,
  Zap,
  Clock,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Axios } from '@/base-axios';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { AdminDashboardOverview } from '@/types/exam.types';

export const AdminControlCenterPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [range] = useState<string>('30D');

  useEffect(() => {
    fetchDashboard();
  }, [range]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await Axios.get('/admin/dashboard', {
        params: { range },
      });
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load admin control center data');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold">Unable to load Super Admin metrics</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    users,
    questions,
    translations,
    exams,
    attempts,
    evaluation,
    institutions,
    reports,
    approvals,
  } = data || {
    users: {
      total: 0,
      students: 0,
      parents: 0,
      admins: 0,
      institutionAdmins: 0,
      active: 0,
      newThisMonth: 0,
    },
    questions: {
      total: 0,
      draft: 0,
      submitted: 0,
      underReview: 0,
      approved: 0,
      rejected: 0,
      archived: 0,
      translationCoveragePercentage: 0,
    },
    translations: { supportedLanguagesCount: 0, totalTranslatedQuestions: 0, languages: [] },
    exams: {
      total: 0,
      draft: 0,
      submitted: 0,
      approved: 0,
      scheduled: 0,
      active: 0,
      ended: 0,
      completed: 0,
      cancelled: 0,
    },
    attempts: { total: 0, inProgress: 0, submitted: 0, autoSubmitted: 0, completed: 0 },
    evaluation: { totalEvaluated: 0, averageScore: 0, averagePercentage: 0, averageAccuracy: 0 },
    institutions: {
      total: 0,
      active: 0,
      pendingApproval: 0,
      suspended: 0,
      totalBatches: 0,
      totalStudentsManaged: 0,
    },
    reports: { queued: 0, processing: 0, completed: 0, failed: 0 },
    approvals: { pendingTotal: 0, byEntityType: {} },
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-8 text-white shadow-2xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 backdrop-blur border border-indigo-500/30">
                <ShieldAlert className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">Super Admin Control Center</h1>
                <p className="text-xs text-indigo-200">
                  Platform Operations • Unified Governance • High-Risk Approval Authority
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NavLink
              to={PRIVATE_NAVIGATION.adminApprovalQueue}
              className="relative inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/30 transition hover:bg-amber-400"
            >
              <Zap className="h-4 w-4" /> Approval Queue
              {approvals.pendingTotal > 0 && (
                <span className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-amber-400">
                  {approvals.pendingTotal}
                </span>
              )}
            </NavLink>
            <NavLink
              to={PRIVATE_NAVIGATION.adminAuditLogs}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Clock className="h-4 w-4" /> Audit Trails
            </NavLink>
            <button
              onClick={fetchDashboard}
              className="rounded-xl bg-white/5 p-2.5 text-white/70 hover:bg-white/10 hover:text-white"
              title="Refresh Metrics"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Pending Approvals Flash Bar */}
      {approvals.pendingTotal > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">
                {approvals.pendingTotal} Items Awaiting Super Admin Review
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
                {Object.entries(approvals.byEntityType).map(([type, count]) => (
                  <span key={type} className="rounded-md bg-white px-2 py-0.5 shadow-xs">
                    {type}: <span className="text-amber-700 font-bold">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <NavLink
            to={PRIVATE_NAVIGATION.adminApprovalQueue}
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-amber-500"
          >
            Review Requests <ArrowRight className="h-3.5 w-3.5" />
          </NavLink>
        </div>
      )}

      {/* Domain Operational KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Users */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Users
            </span>
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">{users.total}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              {users.students} students • {users.parents} parents
            </span>
            <span className="font-semibold text-emerald-600">+{users.newThisMonth} new</span>
          </div>
        </div>

        {/* Questions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Question Bank
            </span>
            <Database className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">{questions.total}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{questions.approved} approved</span>
            <span className="font-semibold text-amber-600">
              {questions.submitted + questions.underReview} in review
            </span>
          </div>
        </div>

        {/* Exams */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Exams Lifecycle
            </span>
            <Sliders className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">{exams.total}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="font-bold text-emerald-600">{exams.active} LIVE</span>
            <span>
              {exams.scheduled} scheduled • {exams.approved} approved
            </span>
          </div>
        </div>

        {/* B2B Institutions */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              B2B Institutions
            </span>
            <Building2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">{institutions.total}</div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{institutions.active} active organizations</span>
            <span>{institutions.totalStudentsManaged} students</span>
          </div>
        </div>
      </div>

      {/* Deep Operational Breakdown Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Regional Languages Completeness */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5 text-indigo-600" />
              <h2 className="font-bold text-slate-900">Regional Translations</h2>
            </div>
            <span className="text-xs font-bold text-indigo-600">
              {questions.translationCoveragePercentage}% Coverage
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {translations.languages.slice(0, 6).map((lang) => (
              <div key={lang.code}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{lang.name}</span>
                  <span className="font-mono text-slate-500">
                    {lang.translatedCount} translated ({lang.completionRate}%)
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${Math.min(100, lang.completionRate)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Live Attempts & Evaluation Pipeline */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-600" />
              <h2 className="font-bold text-slate-900">Live Test Telemetry</h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>{' '}
              {attempts.inProgress} in-flight
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Total Attempts</div>
              <div className="mt-1 text-xl font-bold text-slate-900">{attempts.total}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Evaluated</div>
              <div className="mt-1 text-xl font-bold text-indigo-600">
                {evaluation.totalEvaluated}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Avg Accuracy</div>
              <div className="mt-1 text-xl font-bold text-emerald-600">
                {evaluation.averageAccuracy}%
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Avg Percentage</div>
              <div className="mt-1 text-xl font-bold text-blue-600">
                {evaluation.averagePercentage}%
              </div>
            </div>
          </div>
        </div>

        {/* Right: Async Background Queues */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-slate-900">Background Job Queues</h2>
            </div>
            <span className="text-xs font-bold text-slate-500">BullMQ</span>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-medium text-slate-700">Analytical Reports Queue</div>
              <span className="text-xs font-bold text-slate-900">
                {reports.processing} running • {reports.queued} queued
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-medium text-slate-700">Bulk Upload Pipeline</div>
              <span className="text-xs font-bold text-slate-900">Staged & Isolated Sandbox</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
              <div className="text-xs font-medium text-slate-700">Audit Log Engine</div>
              <span className="text-xs font-bold text-emerald-600">100% Immutable Append</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminControlCenterPage;
