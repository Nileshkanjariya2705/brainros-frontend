import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import cn from 'classnames';
import { useGetParentStudentsAPI, useGetParentChildDashboardAPI } from '@/modules/Exams/services';
import type { ParentStudentInfo, ParentDashboardResponse } from '@/types/exam.types';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';

export const ParentDashboardPage: React.FC = () => {
  const { getParentStudentsAPI, isLoading: isLoadingStudents } = useGetParentStudentsAPI();
  const { getParentChildDashboardAPI, isLoading: isLoadingDashboard } =
    useGetParentChildDashboardAPI();

  const [students, setStudents] = useState<ParentStudentInfo[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [dashboardData, setDashboardData] = useState<ParentDashboardResponse | null>(null);

  const loadStudents = async () => {
    const res = await getParentStudentsAPI();
    if (res.data && res.data.length > 0) {
      setStudents(res.data);
      if (!selectedStudentId) {
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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 border border-purple-200 text-purple-800 flex items-center gap-1">
              <ShieldCheck size={12} />
              Verified Parent Access
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
              Read-Only Performance Portal
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Parent Overview Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor your child's academic growth, mock exam consistency, subject mastery, and time
            efficiency.
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => selectedStudentId && loadChildDashboard(selectedStudentId)}
          className="gap-1.5 self-start md:self-auto"
          size="sm"
        >
          <RotateCw size={14} />
          <span>Refresh Data</span>
        </Button>
      </div>

      {/* ── Multi-Child Switcher ────────────────────────────────────── */}
      {students.length > 1 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3 pl-1">
            Select Linked Child:
          </span>
          <div className="flex items-center gap-3 overflow-x-auto">
            {students.map((st) => (
              <button
                key={st.studentId}
                onClick={() => setSelectedStudentId(st.studentId)}
                className={cn(
                  'p-3.5 rounded-2xl border transition-all text-left flex items-center gap-3 min-w-[220px]',
                  selectedStudentId === st.studentId
                    ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20'
                    : 'bg-white border-slate-200 hover:bg-slate-50',
                )}
              >
                <div
                  className={cn(
                    'p-2.5 rounded-xl text-white font-black text-xs',
                    selectedStudentId === st.studentId ? 'bg-indigo-600' : 'bg-slate-400',
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

      {/* ── Loading / Dashboard View ─────────────────────────────────── */}
      {isLoadingDashboard || isLoadingStudents ? (
        <div className="py-20">
          <Loader label="Loading student performance report..." />
        </div>
      ) : dashboardData ? (
        <div className="space-y-6">
          {/* ── 1. Hero Performance Card ──────────────────────────────── */}
          <div className="rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-950 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-800/60 pb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                    {dashboardData.student.examTarget || 'Exam Candidate'}
                  </span>
                  {dashboardData.student.grade && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/10 text-indigo-100">
                      {dashboardData.student.grade}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl md:text-3xl font-black text-white mt-1">
                  {dashboardData.student.name}
                </h2>
                <p className="text-xs text-indigo-200 mt-1">
                  {dashboardData.student.schoolCollege} • {dashboardData.student.studentCode}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10 self-start md:self-auto">
                <Calendar size={14} className="text-indigo-300" />
                <span>Attendance: {dashboardData.summary.attendancePercentage}%</span>
              </div>
            </div>

            {/* Metric KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
                  Latest Score
                </span>
                <div className="text-2xl md:text-3xl font-black text-white mt-1">
                  {dashboardData.summary.latestScore}
                </div>
                <span className="text-[10px] text-emerald-300 font-bold">
                  {dashboardData.summary.scoreImprovement >= 0
                    ? `+${dashboardData.summary.scoreImprovement} growth since 1st test`
                    : `${dashboardData.summary.scoreImprovement} net delta`}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
                  Solving Accuracy
                </span>
                <div className="text-2xl md:text-3xl font-black text-white mt-1">
                  {dashboardData.summary.latestAccuracy}%
                </div>
                <span className="text-[10px] text-teal-300 font-bold">
                  Avg Accuracy: {dashboardData.summary.averageAccuracy}%
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
                  National Rank
                </span>
                <div className="text-2xl md:text-3xl font-black text-white mt-1">
                  {dashboardData.summary.latestRank ? `#${dashboardData.summary.latestRank}` : '—'}
                </div>
                <span className="text-[10px] text-indigo-200 font-bold">
                  {dashboardData.rank.official.totalCandidates
                    ? `Out of ${dashboardData.rank.official.totalCandidates.toLocaleString()} candidates`
                    : 'Official Rank Tracked'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider block">
                  Percentile
                </span>
                <div className="text-2xl md:text-3xl font-black text-amber-300 mt-1">
                  {dashboardData.summary.latestPercentile
                    ? `${dashboardData.summary.latestPercentile}%`
                    : '—'}
                </div>
                <span className="text-[10px] text-indigo-200 font-bold">
                  {dashboardData.summary.testsAttempted} Completed Tests
                </span>
              </div>
            </div>
          </div>

          {/* ── 2. Analytical Quadrants Grid ───────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Quadrant 1: Subject Mastery */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-indigo-600" size={18} />
                  <h3 className="text-base font-black text-slate-900">Subject Mastery</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {dashboardData.subjects.strongest && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                      Strongest
                    </span>
                    <h4 className="text-sm font-black text-emerald-950 mt-0.5">
                      {dashboardData.subjects.strongest.name}
                    </h4>
                    <span className="text-xs font-extrabold text-emerald-700">
                      {dashboardData.subjects.strongest.accuracy}% Accuracy
                    </span>
                  </div>
                )}

                {dashboardData.subjects.weakest && (
                  <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">
                      Focus Priority
                    </span>
                    <h4 className="text-sm font-black text-amber-950 mt-0.5">
                      {dashboardData.subjects.weakest.name}
                    </h4>
                    <span className="text-xs font-extrabold text-amber-700">
                      {dashboardData.subjects.weakest.accuracy}% Accuracy
                    </span>
                  </div>
                )}
              </div>

              {/* Subject Table */}
              <div className="space-y-2 pt-1">
                {dashboardData.subjects.all.map((sub) => (
                  <div
                    key={sub.subjectId}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900 block">{sub.name}</span>
                      <span className="text-[10px] text-slate-400 font-bold">
                        {sub.score} / {sub.maxScore} Marks
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-indigo-700 block">{sub.accuracy}%</span>
                      <span
                        className={cn(
                          'text-[9px] font-black uppercase px-2 py-0.5 rounded-full',
                          sub.status === 'EXCELLENT' || sub.status === 'STRONG'
                            ? 'bg-emerald-100 text-emerald-800'
                            : sub.status === 'GOOD'
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-amber-100 text-amber-800',
                        )}
                      >
                        {sub.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quadrant 2: Time Management & Speed */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="text-indigo-600" size={18} />
                  <h3 className="text-base font-black text-slate-900">Time Management</h3>
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
                    Average Speed
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
                  <span className="text-[10px] text-slate-400">of available duration</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs font-medium text-indigo-900 leading-relaxed">
                💡 <span className="font-bold">Observation:</span>{' '}
                {dashboardData.timeManagement.observation}
              </div>

              {/* Target Exam Predicted Rank */}
              {dashboardData.rank.predicted && (
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-purple-900">
                      Projected Target Exam Rank
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-200 text-purple-900">
                      {dashboardData.rank.predicted.confidence} Confidence
                    </span>
                  </div>
                  <div className="text-lg font-black text-purple-950">
                    #{dashboardData.rank.predicted.rankMin} – #
                    {dashboardData.rank.predicted.rankMax}
                  </div>
                  <span className="text-[10px] text-purple-700 block mt-0.5">
                    {dashboardData.rank.predicted.disclaimer}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── 3. Constructive Guidance & Recommendations ───────────── */}
          {dashboardData.recommendations.length > 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-600" size={18} />
                <h3 className="text-base font-black text-slate-900">
                  Constructive Parent Guidance
                </h3>
              </div>

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

          {/* ── 4. Recent Completed Tests ────────────────────────────── */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">Recent Completed Exams</h3>

            <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-4">Exam Name</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4 text-center">Score</th>
                    <th className="py-2.5 px-4 text-center">Accuracy</th>
                    <th className="py-2.5 px-4 text-right">National Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {dashboardData.recentTests.map((t) => (
                    <tr key={t.attemptId} className="hover:bg-slate-50/60">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{t.examName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{t.date}</td>
                      <td className="py-2.5 px-4 text-center font-extrabold text-indigo-700">
                        {t.score} / {t.maxScore}
                      </td>
                      <td className="py-2.5 px-4 text-center font-extrabold text-teal-600">
                        {t.accuracy}%
                      </td>
                      <td className="py-2.5 px-4 text-right font-black text-purple-700">
                        {t.rank ? `#${t.rank}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <Users className="mx-auto text-slate-300 mb-3" size={40} />
          <h3 className="text-base font-bold text-slate-800">No Student Linked</h3>
          <p className="text-xs text-slate-500 mt-1">
            There are currently no active student profiles associated with your parent account.
          </p>
        </div>
      )}
    </div>
  );
};

export default ParentDashboardPage;
