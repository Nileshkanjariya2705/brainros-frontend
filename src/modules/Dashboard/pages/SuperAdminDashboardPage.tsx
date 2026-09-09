import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Users,
  Award,
  BookOpen,
  RefreshCw,
  Database,
  Sliders,
  UserCheck,
  Target,
  Clock,
} from 'lucide-react';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

import { Skeleton } from '@/components/ui/Skeleton';

// Services & Queries
import {
  useSuperAdminOverviewQuery,
  useSuperAdminDailyRegistrationsQuery,
  useSuperAdminStateRegistrationsQuery,
  useSuperAdminDistrictRegistrationsQuery,
  useSuperAdminInstitutionRegistrationsQuery,
  useSuperAdminExamTargetsQuery,
  useSuperAdminLanguagePreferencesQuery,
  useSuperAdminRevenueQuery,
  useSuperAdminConversionRateQuery,
  useSuperAdminSalesAgentPerformanceQuery,
  useSuperAdminFiltersMetadataQuery,
  AnalyticsFilterParams,
} from '../services/superAdminDashboard.service';

// Dashboard Components
import { DashboardFilterBar } from '../components/DashboardFilterBar';
import { DailyRegistrationsChart } from '../components/DailyRegistrationsChart';
import { StateDistrictDistribution } from '../components/StateDistrictDistribution';
import { InstitutionAnalyticsTable } from '../components/InstitutionAnalyticsTable';
import { TargetAndLanguageCards } from '../components/TargetAndLanguageCards';
import { RevenueAnalyticsSection } from '../components/RevenueAnalyticsSection';
import { ConversionRateCard } from '../components/ConversionRateCard';
import { SalesAgentPerformanceTable } from '../components/SalesAgentPerformanceTable';

export const SuperAdminDashboardPage = () => {
  const [filters, setFilters] = useState<AnalyticsFilterParams>({
    dateRange: 'ALL',
  });

  const [selectedDrilldownState, setSelectedDrilldownState] = useState<string>('');
  const [institutionPage, setInstitutionPage] = useState(1);
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [salesAgentPage, setSalesAgentPage] = useState(1);
  const [salesAgentSearch, setSalesAgentSearch] = useState('');

  // 1. Metadata Query for Dropdowns
  const { data: metadata, isLoading: isLoadingMeta } = useSuperAdminFiltersMetadataQuery();

  // 2. Analytics Queries
  const {
    data: overview,
    isLoading: isLoadingOverview,
    isFetching: isFetchingOverview,
    refetch: refetchOverview,
  } = useSuperAdminOverviewQuery(filters);

  const {
    data: dailyRegistrations,
    isLoading: isLoadingDaily,
    refetch: refetchDaily,
  } = useSuperAdminDailyRegistrationsQuery(filters);

  const {
    data: stateRegistrations,
    isLoading: isLoadingStates,
    refetch: refetchStates,
  } = useSuperAdminStateRegistrationsQuery(filters);

  const {
    data: districtRegistrations,
    isLoading: isLoadingDistricts,
    refetch: refetchDistricts,
  } = useSuperAdminDistrictRegistrationsQuery({
    ...filters,
    state: selectedDrilldownState || filters.state,
  });

  const {
    data: institutionRegistrations,
    isLoading: isLoadingInstitutions,
    refetch: refetchInstitutions,
  } = useSuperAdminInstitutionRegistrationsQuery({
    ...filters,
    page: institutionPage,
    search: institutionSearch || undefined,
  });

  const {
    data: examTargets,
    isLoading: isLoadingTargets,
    refetch: refetchTargets,
  } = useSuperAdminExamTargetsQuery(filters);

  const {
    data: languagePreferences,
    isLoading: isLoadingLanguages,
    refetch: refetchLanguages,
  } = useSuperAdminLanguagePreferencesQuery(filters);

  const {
    data: revenue,
    isLoading: isLoadingRevenue,
    refetch: refetchRevenue,
  } = useSuperAdminRevenueQuery(filters);

  const {
    data: conversionRate,
    isLoading: isLoadingConversion,
    refetch: refetchConversion,
  } = useSuperAdminConversionRateQuery(filters);

  const {
    data: salesAgentPerformance,
    isLoading: isLoadingSales,
    refetch: refetchSales,
  } = useSuperAdminSalesAgentPerformanceQuery({
    ...filters,
    page: salesAgentPage,
    search: salesAgentSearch || undefined,
  });

  const handleFilterChange = (newFilters: Partial<AnalyticsFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setInstitutionPage(1);
    setSalesAgentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ dateRange: 'ALL' });
    setSelectedDrilldownState('');
    setInstitutionSearch('');
    setSalesAgentSearch('');
    setInstitutionPage(1);
    setSalesAgentPage(1);
  };

  const handleRefreshAll = () => {
    refetchOverview();
    refetchDaily();
    refetchStates();
    refetchDistricts();
    refetchInstitutions();
    refetchTargets();
    refetchLanguages();
    refetchRevenue();
    refetchConversion();
    refetchSales();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* ── Executive Governance Banner ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-15 pointer-events-none">
          <ShieldAlert className="w-64 h-64 text-indigo-400" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>SUPER ADMIN PLATFORM COMMAND CENTER</span>
            </div>

            <button
              onClick={handleRefreshAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer backdrop-blur-sm border border-white/15"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetchingOverview ? 'animate-spin' : ''}`} />
              <span>Refresh Metrics</span>
            </button>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            Platform Executive Analytics
          </h1>
          <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
            Real-time telemetry, student acquisition analytics, geographic distributions, revenue
            reconciliation, and institutional governance.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              to={PRIVATE_NAVIGATION.superAdminControlCenter}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-slate-900 shadow-md hover:bg-slate-100 transition"
            >
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span>Admin Control Center</span>
            </Link>
            <Link
              to={PRIVATE_NAVIGATION.superAdminApprovalQueue}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600/50 hover:bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white border border-indigo-400/30 shadow-md transition"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Review Approval Queue</span>
            </Link>
            <Link
              to={PRIVATE_NAVIGATION.superAdminAuditLogs}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2.5 text-xs font-bold text-slate-200 border border-slate-700 shadow-md transition"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Security Audit Logs</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 1. SUPER ADMIN REGISTRATION TELEMETRY & OVERVIEW CARDS ────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-indigo-600" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Live Registration Telemetry
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Database
            </span>
          </div>
          <Link
            to={PRIVATE_NAVIGATION.superAdminRegistrations}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
          >
            <span>View All Registrations</span>
            <span>&rarr;</span>
          </Link>
        </div>

        {/* 5-Card Grid for Registrations */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* TOTAL REGISTRATIONS */}
          <Link
            to={PRIVATE_NAVIGATION.superAdminRegistrations}
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5 hover:border-indigo-300 hover:shadow-md transition group"
          >
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Registrations</span>
              <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {isLoadingOverview && !overview ? (
                <Skeleton className="h-8 w-24 rounded-lg my-1" />
              ) : (
                (overview?.totalRegistrations ?? overview?.totalStudents ?? 0).toLocaleString()
              )}
            </div>
            <p className="text-[10px] text-indigo-600 font-semibold">
              Total registered accounts &rarr;
            </p>
          </Link>

          {/* TODAY (IST) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Today (IST)</span>
              <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-indigo-700">
              {isLoadingOverview && !overview ? (
                <Skeleton className="h-8 w-20 rounded-lg my-1" />
              ) : (
                (overview?.todayRegistrations ?? 0).toLocaleString()
              )}
            </div>
            <p className="text-[10px] text-indigo-600 font-semibold">Registered on current date</p>
          </div>

          {/* NEET ASPIRANTS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">NEET Registrations</span>
              <div className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-700">
              {isLoadingOverview && !overview ? (
                <Skeleton className="h-8 w-20 rounded-lg my-1" />
              ) : (
                (overview?.neetRegistrations ?? 0).toLocaleString()
              )}
            </div>
            <p className="text-[10px] text-rose-600 font-semibold">Medical entrance stream</p>
          </div>

          {/* JEE ASPIRANTS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">JEE Registrations</span>
              <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-700">
              {isLoadingOverview && !overview ? (
                <Skeleton className="h-8 w-20 rounded-lg my-1" />
              ) : (
                (overview?.jeeRegistrations ?? 0).toLocaleString()
              )}
            </div>
            <p className="text-[10px] text-blue-600 font-semibold">Engineering stream</p>
          </div>

          {/* CET ASPIRANTS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">CET Registrations</span>
              <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700">
              {isLoadingOverview && !overview ? (
                <Skeleton className="h-8 w-20 rounded-lg my-1" />
              ) : (
                (overview?.cetRegistrations ?? 0).toLocaleString()
              )}
            </div>
            <p className="text-[10px] text-amber-600 font-semibold">State common tests</p>
          </div>
        </div>

        {/* 4-Card Platform Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {/* ACTIVE STUDENTS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Accounts</span>
              <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700">
              {isLoadingOverview && !overview ? (
                <Skeleton className="h-8 w-20 rounded-lg my-1" />
              ) : (
                (overview?.activeStudents ?? 0).toLocaleString()
              )}
            </div>
            <p className="text-[10px] text-emerald-600 font-semibold">
              {overview?.activePercentage ?? 0}% verified active ratio
            </p>
          </div>

          {/* EXAMS CONDUCTED */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Exams Conducted</span>
              <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-700">
              {isLoadingOverview && !overview ? (
                <Skeleton className="h-8 w-20 rounded-lg my-1" />
              ) : (
                (overview?.examsConducted ?? 0).toLocaleString()
              )}
            </div>
            <p className="text-[10px] text-purple-600 font-semibold">Evaluated & completed tests</p>
          </div>

          {/* TOTAL ATTEMPTS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Test Attempts</span>
              <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
                <BookOpen className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-700">
              {isLoadingOverview && !overview ? (
                <Skeleton className="h-8 w-20 rounded-lg my-1" />
              ) : (
                (overview?.totalAttempts ?? 0).toLocaleString()
              )}
            </div>
            <p className="text-[10px] text-amber-600 font-semibold">
              {overview?.completedAttempts ?? 0} submitted submissions
            </p>
          </div>

          {/* INSTITUTIONS */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[10px] font-bold uppercase tracking-wider">Active Institutions</span>
              <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
                <Database className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {isLoadingOverview && !overview ? (
                <Skeleton className="h-8 w-20 rounded-lg my-1" />
              ) : (
                (overview?.totalInstitutions ?? 0).toLocaleString()
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">B2B partner institutions</p>
          </div>
        </div>
      </div>

      {/* ── 2. GLOBAL ANALYTICS FILTERS ────────────────────────────── */}
      <DashboardFilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        metadata={metadata}
        isLoading={isLoadingMeta}
      />

      {/* ── 3. DAILY REGISTRATIONS TIME SERIES ────────────────────────────── */}
      <DailyRegistrationsChart
        data={dailyRegistrations}
        isLoading={isLoadingDaily}
        activeRange={filters.dateRange || 'ALL'}
        onRangeChange={(range) => handleFilterChange({ dateRange: range })}
      />

      {/* ── 4. STATE & DISTRICT GEOGRAPHIC BREAKDOWN ────────────────────────────── */}
      <StateDistrictDistribution
        stateData={stateRegistrations}
        districtData={districtRegistrations}
        selectedState={selectedDrilldownState}
        onSelectState={(s) => setSelectedDrilldownState(s)}
        isLoadingStates={isLoadingStates}
        isLoadingDistricts={isLoadingDistricts}
      />

      {/* ── 5. INSTITUTION-WISE REGISTRATIONS ────────────────────────────── */}
      <InstitutionAnalyticsTable
        data={institutionRegistrations}
        isLoading={isLoadingInstitutions}
        onSearchChange={(q) => {
          setInstitutionSearch(q);
          setInstitutionPage(1);
        }}
        page={institutionPage}
        onPageChange={(p) => setInstitutionPage(p)}
      />

      {/* ── 6. EXAM TARGET & LANGUAGE PREFERENCE ANALYTICS ────────────────────────────── */}
      <TargetAndLanguageCards
        targetsData={examTargets}
        languagesData={languagePreferences}
        isLoadingTargets={isLoadingTargets}
        isLoadingLanguages={isLoadingLanguages}
      />

      {/* ── 7. PLATFORM REVENUE & BILLING TELEMETRY ────────────────────────────── */}
      <RevenueAnalyticsSection data={revenue} isLoading={isLoadingRevenue} />

      {/* ── 8. PLATFORM CONVERSION RATE FUNNEL ────────────────────────────── */}
      <ConversionRateCard data={conversionRate} isLoading={isLoadingConversion} />

      {/* ── 9. SALES AGENT PERFORMANCE ANALYTICS ────────────────────────────── */}
      <SalesAgentPerformanceTable
        data={salesAgentPerformance}
        isLoading={isLoadingSales}
        onSearchChange={(q) => {
          setSalesAgentSearch(q);
          setSalesAgentPage(1);
        }}
        page={salesAgentPage}
        onPageChange={(p) => setSalesAgentPage(p)}
      />

      {/* ── 10. QUICK OPERATIONS SHORTCUTS ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-600" />
            <span>Question Bank & Content</span>
          </h3>
          <p className="text-xs text-slate-500">
            Author single-choice, multiple-choice, numerical questions and translate across 9
            regional languages.
          </p>
          <div>
            <Link
              to={PRIVATE_NAVIGATION.superAdminQuestionBank}
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
          <div>
            <Link
              to={PRIVATE_NAVIGATION.superAdminExamBlueprints}
              className="text-xs font-bold text-purple-600 hover:underline"
            >
              Manage Blueprints &rarr;
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span>Security & Audit Logs</span>
          </h3>
          <p className="text-xs text-slate-500">
            Review immutable audit logs, credential updates, permission overrides, and security
            events.
          </p>
          <div>
            <Link
              to={PRIVATE_NAVIGATION.superAdminAuditLogs}
              className="text-xs font-bold text-emerald-600 hover:underline"
            >
              View Audit Logs &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboardPage;
