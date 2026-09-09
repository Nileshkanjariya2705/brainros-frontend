import { Link } from 'react-router-dom';
import { ShieldCheck, TrendingUp, UserCheck, ArrowRight, BookOpen, Award } from 'lucide-react';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { useParentOverviewQuery } from '@/modules/Exams/services/parent.queries';
import { SkeletonCard } from '@/components/ui/Skeleton';

export const ParentDashboardLandingPage = () => {
  const { data: students = [], isLoading } = useParentOverviewQuery();

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Parent Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-indigo-900 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-56 w-56 -translate-y-8 translate-x-8 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>PARENT PORTAL</span>
          </div>
          <h1 className="text-3xl font-black">Student Academic Progress & Monitoring</h1>
          <p className="mt-2 text-sm text-teal-100 max-w-xl leading-relaxed">
            Review your linked student's mock exam scores, weak subject areas, time discipline,
            national percentile ranks, and targeted revision plans.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={PRIVATE_NAVIGATION.parentWardProgress}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-teal-900 font-bold text-xs shadow-md hover:bg-slate-100 transition"
            >
              <span>Open Comprehensive Ward Portal</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>

      {/* Linked Students Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <UserCheck className="text-teal-600 h-5 w-5" />
            <span>Your Linked Students</span>
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {students.length} Linked Profiles
          </span>
        </div>

        {isLoading && students.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white border border-slate-200 shadow-xs text-xs text-slate-500">
            No active student accounts linked to this parent profile.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((st) => (
              <div
                key={st.studentId}
                className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4 hover:shadow-md transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-teal-50 text-teal-700 font-black text-sm">
                      {st.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">{st.name}</h4>
                      <span className="text-[11px] text-slate-500 font-bold">
                        Target: {st.examTarget || 'General'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-50 text-teal-800 border border-teal-200">
                    ID: {st.studentCode}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      Score
                    </span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">
                      {st.latestScore}
                    </span>
                    <span className="text-[9px] text-teal-600 font-bold">
                      ({st.latestPercentage}%)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      Tests
                    </span>
                    <span className="text-sm font-black text-slate-900 mt-0.5 block">
                      {st.testsAttempted}
                    </span>
                    <span className="text-[9px] text-slate-500 font-bold">Attempted</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">
                      Rank
                    </span>
                    <span className="text-sm font-black text-purple-700 mt-0.5 block">
                      {st.latestRank ? `#${st.latestRank}` : '—'}
                    </span>
                    <span className="text-[9px] text-amber-600 font-bold">
                      {st.latestPercentile ? `${st.latestPercentile}%` : 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-[11px]">
                    Attendance:{' '}
                    <strong className="text-slate-700">{st.attendancePercentage}%</strong>
                  </span>
                  <Link
                    to={`${PRIVATE_NAVIGATION.parentWardProgress}?studentId=${st.studentId}`}
                    className="font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                  >
                    <span>Full Diagnostic &rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Feature Highlight Quadrants */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 w-fit">
            <TrendingUp size={20} />
          </div>
          <h4 className="text-sm font-black text-slate-900">Score & Growth Trajectory</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Monitor historical improvement deltas across chronological mock tests and watch your
            ward's solving accuracy improve.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="p-2.5 rounded-2xl bg-rose-50 text-rose-600 w-fit">
            <BookOpen size={20} />
          </div>
          <h4 className="text-sm font-black text-slate-900">Weak Subject Action Plan</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Diagnose difficult topics and receive targeted, actionable revision recommendations
            tailored to your child's accuracy gaps.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600 w-fit">
            <Award size={20} />
          </div>
          <h4 className="text-sm font-black text-slate-900">National Percentile Standing</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Understand your child's relative competitive standing with official percentiles and
            projected target exam rank brackets.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardLandingPage;
