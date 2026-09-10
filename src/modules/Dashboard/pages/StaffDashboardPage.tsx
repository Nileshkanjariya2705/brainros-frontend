import React from 'react';
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
  ShieldAlert,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/modules/Auth/auth-access/useRole';
import { usePermission } from '@/modules/Auth/auth-access/usePermission';
import { PERMISSIONS } from '@/modules/Auth/auth-access/permission.constants';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import Button from '@/components/ui/Button';

export const StaffDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeRole, activeRoleMeta, isAccountant } = useRole();
  const { can } = usePermission();

  const userName = (user as any)?.name || user?.mobileNumber || 'Staff Member';

  // Operational Action Cards with permission-based visibility
  const operationalModules = [
    {
      title: 'Bills & Invoices',
      description: 'Create institutional bills, review draft invoices, and submit for Super Admin approval',
      icon: Receipt,
      to: PRIVATE_NAVIGATION.staffBilling,
      color: 'bg-amber-500',
      badge: isAccountant ? 'Primary Module' : 'Financials',
      badgeColor: 'bg-amber-100 text-amber-800',
      visible: can(PERMISSIONS.BILL_VIEW) || isAccountant,
    },
    {
      title: 'Schools & Centers',
      description: 'View registered schools, affiliated centers, and assigned institutional scopes',
      icon: Building2,
      to: PRIVATE_NAVIGATION.superAdminSchools,
      color: 'bg-blue-600',
      badge: 'B2B Centers',
      badgeColor: 'bg-blue-100 text-blue-800',
      visible: can(PERMISSIONS.INSTITUTION_VIEW),
    },
    {
      title: 'Candidate Directory',
      description: 'Search student registrations, inspect enrollments, and verify batch eligibility',
      icon: Users,
      to: PRIVATE_NAVIGATION.superAdminStudents,
      color: 'bg-indigo-600',
      badge: 'Students',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      visible: can(PERMISSIONS.STUDENT_VIEW),
    },
    {
      title: 'Question Bank',
      description: 'Browse curriculum questions, create new questions, and submit for review',
      icon: Database,
      to: PRIVATE_NAVIGATION.superAdminQuestionBank,
      color: 'bg-teal-600',
      badge: 'Curriculum',
      badgeColor: 'bg-teal-100 text-teal-800',
      visible: can(PERMISSIONS.QUESTION_VIEW),
    },
    {
      title: 'Translations Master',
      description: 'Access regional language translation packages and multilingual question items',
      icon: Globe,
      to: PRIVATE_NAVIGATION.superAdminTranslations,
      color: 'bg-emerald-600',
      badge: 'Multilingual',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      visible: can(PERMISSIONS.TRANSLATION_VIEW),
    },
    {
      title: 'Mock Tests & Exams',
      description: 'Track scheduled test series, subject blueprints, and official assessment sessions',
      icon: FileSpreadsheet,
      to: PRIVATE_NAVIGATION.superAdminMockTests,
      color: 'bg-purple-600',
      badge: 'Assessments',
      badgeColor: 'bg-purple-100 text-purple-800',
      visible: can(PERMISSIONS.EXAM_VIEW),
    },
    {
      title: 'Completed Exam Reports',
      description: 'Analyze exam turnout, candidate performance metrics, and evaluation summaries',
      icon: FileText,
      color: 'bg-rose-600',
      to: PRIVATE_NAVIGATION.superAdminCompletedExams,
      badge: 'Analytics',
      badgeColor: 'bg-rose-100 text-rose-800',
      visible: can(PERMISSIONS.REPORT_VIEW),
    },
    {
      title: 'Notification Center',
      description: 'View platform broadcast messages, system alerts, and approval notifications',
      icon: Bell,
      color: 'bg-sky-600',
      to: PRIVATE_NAVIGATION.superAdminNotifications,
      badge: 'Updates',
      badgeColor: 'bg-sky-100 text-sky-800',
      visible: can(PERMISSIONS.NOTIFICATION_VIEW),
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
                onClick={() => navigate(PRIVATE_NAVIGATION.staffBilling)}
                className="bg-white text-slate-900 hover:bg-slate-100 font-semibold shadow-md flex items-center justify-center gap-2"
              >
                <Receipt size={16} className="text-indigo-600" />
                Manage Bills
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Governance & Zero-Delete Policy Banner ── */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-amber-900">
        <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
          <ShieldAlert size={22} />
        </div>
        <div className="flex-1 text-xs sm:text-sm">
          <p className="font-bold text-amber-950">
            Platform Governance Policy: Zero-Delete & Super Admin Approval Workflow
          </p>
          <p className="text-amber-800/90 mt-0.5">
            Staff roles have zero delete privileges across all platform entities (Students, Schools,
            Exams, Questions, Translations, Invoices). Sensitive data modifications automatically submit an{' '}
            <span className="font-semibold underline">ApprovalRequest</span> to Super Admin for validation before applying.
          </p>
        </div>
      </div>

      {/* ── Role Information Card ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Role</p>
            <p className="text-base font-bold text-slate-800">{activeRoleMeta?.label || activeRole}</p>
            <p className="text-xs text-slate-500 mt-0.5">{activeRoleMeta?.description}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Audit & Security</p>
            <p className="text-base font-bold text-slate-800">100% Traceable</p>
            <p className="text-xs text-slate-500 mt-0.5">All staff actions recorded in Security Audit Logs</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Exam Time Governance</p>
            <p className="text-base font-bold text-slate-800">Super Admin Controlled</p>
            <p className="text-xs text-slate-500 mt-0.5">Official exam timings protected against local overrides</p>
          </div>
        </div>
      </div>

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
