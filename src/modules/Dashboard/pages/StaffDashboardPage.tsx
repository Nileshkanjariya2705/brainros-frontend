import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Database,
  FileSpreadsheet,
  Globe,
  Receipt,
  FileText,
  Bell,
  ArrowRight,
  UploadCloud,
  KeyRound,
  UserPlus,
  Plus,
  Languages,
  CalendarClock,
  History,
  Sliders,
  Award,
  Trophy,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/modules/Auth/auth-access/useRole';
import { usePermission } from '@/modules/Auth/auth-access/usePermission';
import { PERMISSIONS } from '@/modules/Auth/auth-access/permission.constants';
import Button from '@/components/ui/Button';
import { useSuperAdminRevenueQuery } from '../services/superAdminDashboard.service';
import { RevenueAnalyticsSection } from '../components/RevenueAnalyticsSection';

export const StaffDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeRole, activeRoleMeta, isAccountant } = useRole();
  const { can } = usePermission();

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const hasRevenuePermission = isAccountant || can(PERMISSIONS.REVENUE_VIEW);

  const {
    data: revenueData,
    isLoading: isLoadingRevenue,
    isFetching: isFetchingRevenue,
    isError: isErrorRevenue,
    error: revenueError,
    refetch: refetchRevenue,
  } = useSuperAdminRevenueQuery(hasRevenuePermission ? { year: selectedYear } : undefined);

  const rawEmail = (user as any)?.email;
  const emailPrefix = rawEmail ? rawEmail.split('@')[0] : null;
  const formattedEmailName = emailPrefix
    ? emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
    : null;

  const userName =
    (user as any)?.name ||
    (user as any)?.fullName ||
    (user as any)?.student?.name ||
    formattedEmailName ||
    activeRoleMeta?.label ||
    'Staff Member';

  const rolePrefix =
    activeRole === 'GENERAL_MANAGER'
      ? '/general-manager'
      : activeRole === 'MANAGER'
      ? '/manager'
      : activeRole === 'OPERATOR'
      ? '/operator'
      : activeRole === 'ACCOUNTANT'
      ? '/accountant'
      : activeRole === 'SUPER_ADMIN'
      ? '/super-admin'
      : '/admin';

  // Operational Action Cards with permission-based visibility
  const operationalModules = [
    {
      title: 'Bills & Invoices',
      description: 'Create institutional bills, review draft invoices, and submit for Super Admin approval',
      icon: Receipt,
      to: `${rolePrefix}/billing`,
      color: 'bg-amber-500',
      badge: isAccountant ? 'Primary Module' : 'Financials',
      badgeColor: 'bg-amber-100 text-amber-800',
      visible: can(PERMISSIONS.BILL_VIEW) || isAccountant,
    },
    {
      title: 'Schools & Centers',
      description: 'View registered schools, affiliated centers, and assigned institutional scopes',
      icon: Building2,
      to: `${rolePrefix}/schools`,
      color: 'bg-blue-600',
      badge: 'B2B Centers',
      badgeColor: 'bg-blue-100 text-blue-800',
      visible: can(PERMISSIONS.INSTITUTION_VIEW),
    },
    {
      title: 'Candidate Directory',
      description: 'Search student registrations, inspect enrollments, and verify batch eligibility',
      icon: Users,
      to: `${rolePrefix}/students`,
      color: 'bg-indigo-600',
      badge: 'Students',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      visible: can(PERMISSIONS.STUDENT_VIEW),
    },
    {
      title: 'Bulk Register Students',
      description: 'Upload Excel/CSV manifests to enroll students into institutional cohorts',
      icon: UserPlus,
      to: `${rolePrefix}/students/bulk-register`,
      color: 'bg-violet-600',
      badge: 'Registration',
      badgeColor: 'bg-violet-100 text-violet-800',
      visible: can(PERMISSIONS.STUDENT_VIEW),
    },
    {
      title: 'Question Bank',
      description: 'Browse curriculum questions, create new questions, and submit for review',
      icon: Database,
      to: `${rolePrefix}/question-bank`,
      color: 'bg-teal-600',
      badge: 'Curriculum',
      badgeColor: 'bg-teal-100 text-teal-800',
      visible: can(PERMISSIONS.QUESTION_VIEW),
    },
    {
      title: 'Add New Question',
      description: 'Author single/multi-choice, numerical, or subjective questions with LaTeX support',
      icon: Plus,
      to: `${rolePrefix}/question-bank/create`,
      color: 'bg-emerald-600',
      badge: 'Authoring',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      visible: can(PERMISSIONS.QUESTION_CREATE) || can(PERMISSIONS.QUESTION_VIEW),
    },
    {
      title: 'Bulk Import Questions',
      description: 'Import structured question items in bulk via Excel, CSV, or JSON templates',
      icon: UploadCloud,
      to: `${rolePrefix}/question-bank/import`,
      color: 'bg-cyan-600',
      badge: 'Bulk Upload',
      badgeColor: 'bg-cyan-100 text-cyan-800',
      visible: can(PERMISSIONS.QUESTION_CREATE) || can(PERMISSIONS.QUESTION_VIEW),
    },
    {
      title: 'Exam Scheduling',
      description: 'Configure exam timetables, shift timings, center allocations, and candidate rosters',
      icon: CalendarClock,
      to: `${rolePrefix}/exam-scheduling`,
      color: 'bg-sky-600',
      badge: 'Scheduling',
      badgeColor: 'bg-sky-100 text-sky-800',
      visible: can(PERMISSIONS.EXAM_VIEW),
    },
    {
      title: 'Upload Question Paper',
      description: 'Upload and validate question papers and regional language packages',
      icon: UploadCloud,
      to: `${rolePrefix}/exam-manager/upload`,
      color: 'bg-blue-500',
      badge: 'Uploads',
      badgeColor: 'bg-blue-100 text-blue-800',
      visible: can(PERMISSIONS.EXAM_VIEW),
    },
    {
      title: 'Translation Management',
      description: 'Manage regional language translations and multilingual question packages',
      icon: Globe,
      to: `${rolePrefix}/translations`,
      color: 'bg-teal-500',
      badge: 'Multilingual',
      badgeColor: 'bg-teal-100 text-teal-800',
      visible: can(PERMISSIONS.TRANSLATION_VIEW),
    },
    {
      title: 'Upload Answer Key',
      description: 'Upload, edit, and publish official answer key templates for scheduled exams',
      icon: KeyRound,
      to: `${rolePrefix}/exam-manager/answer-key`,
      color: 'bg-orange-600',
      badge: 'Answer Keys',
      badgeColor: 'bg-orange-100 text-orange-800',
      visible: can(PERMISSIONS.EXAM_VIEW),
    },
    {
      title: 'Import History',
      description: 'Review paper upload logs, processing audits, and verification manifests',
      icon: History,
      to: `${rolePrefix}/exam-manager/history`,
      color: 'bg-slate-600',
      badge: 'Audit Logs',
      badgeColor: 'bg-slate-100 text-slate-800',
      visible: can(PERMISSIONS.EXAM_VIEW),
    },
    {
      title: 'Blueprint Generator',
      description: 'Create automated exam blueprints, subject weightages, and section rules',
      icon: Sliders,
      to: `${rolePrefix}/exam-blueprints`,
      color: 'bg-fuchsia-600',
      badge: 'Blueprints',
      badgeColor: 'bg-fuchsia-100 text-fuchsia-800',
      visible: can(PERMISSIONS.EXAM_VIEW),
    },
    {
      title: 'Mock Test Manager',
      description: 'Track scheduled test series, subject blueprints, and official assessment sessions',
      icon: FileSpreadsheet,
      to: `${rolePrefix}/exams`,
      color: 'bg-purple-600',
      badge: 'Assessments',
      badgeColor: 'bg-purple-100 text-purple-800',
      visible: can(PERMISSIONS.EXAM_VIEW),
    },
    {
      title: 'Result Publication Center',
      description: 'Verify candidate answer sheets, generate scorecards, and publish final results',
      icon: Award,
      to: `${rolePrefix}/exam-results`,
      color: 'bg-amber-600',
      badge: 'Results',
      badgeColor: 'bg-amber-100 text-amber-800',
      visible: can(PERMISSIONS.EXAM_VIEW) || can(PERMISSIONS.REPORT_VIEW),
    },
    {
      title: 'Completed Exam Reports',
      description: 'Analyze exam turnout, candidate performance metrics, and evaluation summaries',
      icon: FileText,
      to: `${rolePrefix}/completed-exams`,
      color: 'bg-rose-600',
      badge: 'Analytics',
      badgeColor: 'bg-rose-100 text-rose-800',
      visible: can(PERMISSIONS.REPORT_VIEW),
    },
    {
      title: 'Leaderboard',
      description: 'Inspect top candidate rankings, institutional percentiles, and performance badges',
      icon: Trophy,
      to: `${rolePrefix}/leaderboard`,
      color: 'bg-yellow-600',
      badge: 'Rankings',
      badgeColor: 'bg-yellow-100 text-yellow-800',
      visible: can(PERMISSIONS.RANK_VIEW) || can(PERMISSIONS.EXAM_VIEW),
    },
    {
      title: 'Chapter Master',
      description: 'Manage subject chapters, curriculum topics, and syllabus mapping',
      icon: BookOpen,
      to: `${rolePrefix}/chapters`,
      color: 'bg-indigo-500',
      badge: 'Syllabus',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      visible: can(PERMISSIONS.QUESTION_VIEW) || can(PERMISSIONS.EXAM_VIEW),
    },
    {
      title: 'Language Master',
      description: 'Configure active regional languages, fonts, and translation dictionaries',
      icon: Languages,
      to: `${rolePrefix}/languages`,
      color: 'bg-green-600',
      badge: 'Languages',
      badgeColor: 'bg-green-100 text-green-800',
      visible: can(PERMISSIONS.TRANSLATION_VIEW) || can(PERMISSIONS.QUESTION_VIEW),
    },
    {
      title: 'Question Bank Translations',
      description: 'Import regional language packages for existing question items',
      icon: Globe,
      to: `${rolePrefix}/languages/import`,
      color: 'bg-cyan-500',
      badge: 'Translations',
      badgeColor: 'bg-cyan-100 text-cyan-800',
      visible: can(PERMISSIONS.TRANSLATION_VIEW),
    },
    {
      title: 'Notification Center',
      description: 'View platform broadcast messages, system alerts, and approval notifications',
      icon: Bell,
      color: 'bg-sky-600',
      to: `${rolePrefix}/notifications`,
      badge: 'Updates',
      badgeColor: 'bg-sky-100 text-sky-800',
      visible: can(PERMISSIONS.NOTIFICATION_VIEW) && activeRole !== 'GENERAL_MANAGER',
    },
  ].filter((m) => m.visible);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Welcome & Role Header ── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/15">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{activeRoleMeta?.label || activeRole}</span>
              <span className="text-white/40">•</span>
              <span>Staff Portal</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {userName}!
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Your operational workspace provides centralized access to institution records,
              question studios, assessment monitoring, and institutional billing according to your assigned RBAC role.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {can(PERMISSIONS.BILL_VIEW) && (
              <Button
                onClick={() => navigate(`${rolePrefix}/billing`)}
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-md flex items-center justify-center gap-2"
              >
                <Receipt size={16} className="text-indigo-600" />
                Manage Bills
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Accountant Revenue Module ── */}
      {hasRevenuePermission && (
        <RevenueAnalyticsSection
          data={revenueData}
          isLoading={isLoadingRevenue}
          isFetching={isFetchingRevenue}
          isError={isErrorRevenue}
          error={revenueError}
          refetch={refetchRevenue}
          selectedYear={selectedYear}
          onYearChange={(yr) => setSelectedYear(yr)}
        />
      )}



      {/* ── Operational Modules Grid ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Permitted Operational Modules</h2>
            <p className="text-xs text-slate-500">
              Access platform features corresponding to your role privileges
            </p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {operationalModules.length} Modules Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {operationalModules.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                onClick={() => navigate(item.to)}
                className="group bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`h-11 w-11 rounded-xl ${item.color} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}
                    >
                      <Icon size={22} />
                    </div>
                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">
                  <span>Open Module</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboardPage;
