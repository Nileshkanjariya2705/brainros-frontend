import React, { useEffect, useState } from 'react';
import {
  Building2,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Axios } from '@/base-axios';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { InstitutionDashboardResponse } from '@/types/exam.types';

export const InstitutionDashboardPage: React.FC = () => {
  const [data, setData] = useState<InstitutionDashboardResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await Axios.get('/institutions/me/dashboard');
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load institution dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-semibold">Unable to load institution data</h3>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { institution, summary, topStudent, weakestSubject, batches } = data || {
    institution: { name: 'Institution', code: 'INST', type: 'COACHING', status: 'ACTIVE' },
    summary: {
      totalStudents: 0,
      activeStudents: 0,
      testsConducted: 0,
      averagePercentage: 0,
      averageAccuracy: 0,
      attendancePercentage: 0,
    },
    topStudent: null,
    weakestSubject: null,
    batches: [],
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 backdrop-blur">
                <Building2 className="h-6 w-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{institution.name}</h1>
                <p className="text-sm text-indigo-200">
                  Code: <span className="font-mono">{institution.code}</span> • Type:{' '}
                  {institution.type} • Status:
                  <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                    {institution.status}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NavLink
              to={PRIVATE_NAVIGATION.institutionBatches}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Layers className="h-4 w-4" /> Manage Batches
            </NavLink>
            <NavLink
              to={PRIVATE_NAVIGATION.institutionBulkUpload}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500"
            >
              <FileSpreadsheet className="h-4 w-4" /> Bulk Onboarding
            </NavLink>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {/* Total Students */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Enrolled
            </span>
            <Users className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">{summary.totalStudents}</div>
          <p className="mt-1 text-xs text-slate-500">{summary.activeStudents} actively enrolled</p>
        </div>

        {/* Tests Conducted */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Tests Held
            </span>
            <BookOpen className="h-5 w-5 text-purple-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-slate-900">
            {summary.testsConducted}
          </div>
          <p className="mt-1 text-xs text-slate-500">Institutional mock exams</p>
        </div>

        {/* Avg Percentage */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Avg Percentage
            </span>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-emerald-600">
            {summary.averagePercentage}%
          </div>
          <p className="mt-1 text-xs text-slate-500">Normalized across tests</p>
        </div>

        {/* Avg Accuracy */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Avg Accuracy
            </span>
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-blue-600">
            {summary.averageAccuracy}%
          </div>
          <p className="mt-1 text-xs text-slate-500">Analysis Engine verified</p>
        </div>

        {/* Attendance */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Attendance
            </span>
            <CheckCircle2 className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-amber-600">
            {summary.attendancePercentage}%
          </div>
          <p className="mt-1 text-xs text-slate-500">Scheduled participation</p>
        </div>

        {/* Top Performer */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Top Candidate
            </span>
            <Award className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 truncate text-base font-bold text-slate-900">
            {topStudent ? topStudent.name : 'No test data'}
          </div>
          <p className="mt-1 text-xs font-semibold text-emerald-600">
            {topStudent ? `${topStudent.percentage}% avg score` : 'Pending'}
          </p>
        </div>
      </div>

      {/* Highlights & Batches Section */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left Column: Weakest Subject & Quick Actions */}
        <div className="space-y-6">
          {/* Weakest Subject Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Academic Attention Area</h3>
                <p className="text-xs text-slate-500">Lowest performing subject</p>
              </div>
            </div>
            {weakestSubject ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">{weakestSubject.name}</span>
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                    {weakestSubject.accuracy}% accuracy
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  Recommended: Schedule targeted revision and chapter-level diagnostic tests for
                  this subject across all batches.
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-500">No subject alerts currently identified.</p>
            )}
          </div>

          {/* Quick Reports Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-indigo-50 to-purple-50 p-6">
            <h3 className="font-bold text-slate-900">Export & Reporting</h3>
            <p className="mt-1 text-xs text-slate-600">
              Generate audited student lists, rank lists, and subject analytics in XLSX and PDF
              formats.
            </p>
            <div className="mt-4">
              <NavLink
                to={PRIVATE_NAVIGATION.institutionReports}
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View Report Center <ArrowRight className="h-4 w-4" />
              </NavLink>
            </div>
          </div>
        </div>

        {/* Right Column: Batches Table */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Batch Performance Comparison</h2>
                <p className="text-xs text-slate-500">
                  Real-time breakdown of all institutional batches
                </p>
              </div>
              <NavLink
                to={PRIVATE_NAVIGATION.institutionBatches}
                className="text-xs font-semibold text-indigo-600 hover:underline"
              >
                View All Batches
              </NavLink>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                    <th className="pb-3 font-semibold">Batch Name</th>
                    <th className="pb-3 font-semibold">Students</th>
                    <th className="pb-3 font-semibold">Avg Score</th>
                    <th className="pb-3 font-semibold">Accuracy</th>
                    <th className="pb-3 font-semibold">Attendance</th>
                    <th className="pb-3 font-semibold">Top Student</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-sm text-slate-400">
                        No batches created yet. Click "Manage Batches" to configure your first
                        batch.
                      </td>
                    </tr>
                  ) : (
                    batches.map((b) => (
                      <tr key={b.batchId} className="hover:bg-slate-50">
                        <td className="py-3.5 font-medium text-slate-900">{b.batchName}</td>
                        <td className="py-3.5 text-slate-600">
                          {b.activeStudents} / {b.studentCount}
                        </td>
                        <td className="py-3.5 font-semibold text-emerald-600">
                          {b.averagePercentage}%
                        </td>
                        <td className="py-3.5 text-blue-600">{b.averageAccuracy}%</td>
                        <td className="py-3.5 text-amber-600">{b.attendancePercentage}%</td>
                        <td className="py-3.5 font-medium text-slate-700">
                          {b.topStudent
                            ? `${b.topStudent.name} (${b.topStudent.percentage}%)`
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionDashboardPage;
