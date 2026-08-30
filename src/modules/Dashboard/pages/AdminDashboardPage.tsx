import { Link } from 'react-router-dom';
import {
  Database,
  Sliders,
  CalendarClock,
  Globe2,
  ShieldCheck,
  CheckCircle2,
  Trophy,
} from 'lucide-react';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

export const AdminDashboardPage = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Admin Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 h-56 w-56 -translate-y-8 translate-x-8 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>ACADEMIC OPERATIONS</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Academic Administration Dashboard
          </h1>
          <p className="text-sm text-indigo-200 max-w-xl leading-relaxed">
            Oversee question authoring, regional translation pipelines, dynamic blueprint
            configurations, and live test scheduling.
          </p>

          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              to={PRIVATE_NAVIGATION.adminQuestionBank}
              className="px-4 py-2.5 rounded-xl bg-white text-indigo-900 font-bold text-xs shadow-md hover:bg-slate-100 transition"
            >
              Question Bank
            </Link>
            <Link
              to={PRIVATE_NAVIGATION.adminExamBlueprints}
              className="px-4 py-2.5 rounded-xl bg-white/20 text-white font-bold text-xs hover:bg-white/30 transition border border-white/20"
            >
              Exam Blueprints
            </Link>
            <Link
              to={PRIVATE_NAVIGATION.adminExamScheduling}
              className="px-4 py-2.5 rounded-xl bg-white/20 text-white font-bold text-xs hover:bg-white/30 transition border border-white/20"
            >
              Exam Schedules
            </Link>
          </div>
        </div>
      </div>

      {/* Operational Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Question Bank</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Database className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">4,850+</div>
          <Link
            to={PRIVATE_NAVIGATION.adminQuestionBank}
            className="text-xs font-bold text-indigo-600 hover:underline block pt-1"
          >
            Browse Questions &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Exam Schedules</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <CalendarClock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">8 Active</div>
          <Link
            to={PRIVATE_NAVIGATION.adminExamScheduling}
            className="text-xs font-bold text-purple-600 hover:underline block pt-1"
          >
            Manage Schedules &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Regional Languages</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Globe2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">9 Languages</div>
          <Link
            to={PRIVATE_NAVIGATION.adminLanguages}
            className="text-xs font-bold text-blue-600 hover:underline block pt-1"
          >
            Translation Studio &rarr;
          </Link>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Approvals</span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">3 Items</div>
          <Link
            to={PRIVATE_NAVIGATION.adminApprovalQueuePage}
            className="text-xs font-bold text-rose-600 hover:underline block pt-1"
          >
            Review Queue &rarr;
          </Link>
        </div>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <span>Question & Content Studio</span>
          </h3>
          <p className="text-xs text-slate-500">
            Author single-choice, multiple-choice, numerical questions across JEE, NEET, and CAT
            subjects.
          </p>
          <div className="flex gap-2">
            <Link
              to={PRIVATE_NAVIGATION.adminCreateQuestion}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              + Create New Question &rarr;
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-purple-600" />
            <span>Exam Generator Studio</span>
          </h3>
          <p className="text-xs text-slate-500">
            Configure dynamic blueprint rules, difficulty stratifications, and section constraints.
          </p>
          <div className="flex gap-2">
            <Link
              to={PRIVATE_NAVIGATION.adminExamBlueprints}
              className="text-xs font-bold text-purple-600 hover:underline"
            >
              Manage Blueprints &rarr;
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-600" />
            <span>National Leaderboard</span>
          </h3>
          <p className="text-xs text-slate-500">
            Inspect top percentile distributions, batch rankings, and student performance metrics.
          </p>
          <div className="flex gap-2">
            <Link
              to={PRIVATE_NAVIGATION.adminLeaderboard}
              className="text-xs font-bold text-amber-600 hover:underline"
            >
              View Leaderboard &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
