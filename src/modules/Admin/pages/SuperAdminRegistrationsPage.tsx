import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import {
  Users,
  Search,
  RotateCw,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Target,
  ShieldCheck,
  Clock,
  Filter,
} from 'lucide-react';
import {
  useSuperAdminRegistrationsQuery,
  useSuperAdminRegistrationStatsQuery,
  useSuperAdminRegistrationFiltersQuery,
  type SuperAdminRegistrationItem,
  type SuperAdminRegistrationsResponse,
  type RegistrationStats,
  type RegistrationFilterOptions,
  type RegistrationFilterParams,
} from '../services/superAdminRegistrations.service';
import { ExportPdfButton } from '@/components/export/ExportPdfButton';

export const SuperAdminRegistrationsPage: React.FC = () => {
  // ── State for Filters ──────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today'>('all');
  const [selectedExamTarget, setSelectedExamTarget] = useState<string>('ALL');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Pagination & Sorting state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // When state changes, reset district
  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    setSelectedDistrict('');
    setPage(1);
  };

  // Build query params
  const queryParams: RegistrationFilterParams = useMemo(
    () => ({
      page,
      pageSize,
      search: debouncedSearch || undefined,
      sortBy,
      sortOrder,
      date: dateFilter,
      stateId: selectedState || undefined,
      districtId: selectedDistrict || undefined,
      institutionId: selectedInstitution || undefined,
      examTarget: selectedExamTarget !== 'ALL' ? selectedExamTarget : undefined,
      status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
    }),
    [
      page,
      pageSize,
      debouncedSearch,
      sortBy,
      sortOrder,
      dateFilter,
      selectedState,
      selectedDistrict,
      selectedInstitution,
      selectedExamTarget,
      selectedStatus,
    ],
  );

  // ── React Query Hooks ──────────────────────────────────────────────────────
  const {
    data: rawRegistrationData,
    isLoading: isLoadingList,
    isFetching: isFetchingList,
    refetch: refetchList,
  } = useSuperAdminRegistrationsQuery(queryParams);

  const {
    data: rawStatsData,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useSuperAdminRegistrationStatsQuery(queryParams);

  const { data: rawFilterOptions, isLoading: isLoadingFilters } =
    useSuperAdminRegistrationFiltersQuery(selectedState || undefined);

  // Safe unwrapping: handle direct or wrapped payload
  const registrationData: SuperAdminRegistrationsResponse | undefined = useMemo(() => {
    return (rawRegistrationData as any)?.data || rawRegistrationData;
  }, [rawRegistrationData]);

  const statsData: RegistrationStats | undefined = useMemo(() => {
    return (rawStatsData as any)?.data || rawStatsData;
  }, [rawStatsData]);

  const filterOptions: RegistrationFilterOptions | undefined = useMemo(() => {
    return (rawFilterOptions as any)?.data || rawFilterOptions;
  }, [rawFilterOptions]);

  // Active filters count
  const activeFiltersCount = [
    dateFilter === 'today',
    selectedExamTarget !== 'ALL',
    Boolean(selectedState),
    Boolean(selectedDistrict),
    Boolean(selectedInstitution),
    selectedStatus !== 'ALL',
    Boolean(debouncedSearch),
  ].filter(Boolean).length;

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setDateFilter('all');
    setSelectedExamTarget('ALL');
    setSelectedState('');
    setSelectedDistrict('');
    setSelectedInstitution('');
    setSelectedStatus('ALL');
    setPage(1);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  const handleRefreshAll = () => {
    refetchList();
    refetchStats();
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  // ── TanStack Table Column Definitions ──────────────────────────────────────
  const columns = useMemo<ColumnDef<SuperAdminRegistrationItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Student Name',
        cell: ({ row }) => {
          const item = row.original;
          const initial = item.name ? item.name.charAt(0).toUpperCase() : '?';
          return (
            <div className="flex items-center gap-3 py-1">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-slate-900 text-sm truncate">
                  {item.name || 'Unnamed Student'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 truncate">
                  <span>{item.email}</span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'studentId',
        header: 'Student ID',
        cell: ({ row }) => {
          const item = row.original;
          return (
            <div className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-200/60 px-2.5 py-1 rounded-lg inline-block whitespace-nowrap">
              {item.studentCode || item.studentId || '—'}
            </div>
          );
        },
      },
      {
        accessorKey: 'mobile',
        header: 'Mobile',
        cell: ({ row }) => (
          <span className="text-xs text-slate-700 font-mono whitespace-nowrap font-medium">
            {row.original.mobile || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Email',
        cell: ({ row }) => (
          <span className="text-xs text-slate-600 truncate max-w-[160px] block" title={row.original.email}>
            {row.original.email || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'state',
        header: 'State',
        cell: ({ row }) => (
          <span className="text-xs text-slate-800 font-medium whitespace-nowrap">
            {row.original.state || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'district',
        header: 'District',
        cell: ({ row }) => (
          <span className="text-xs text-slate-700 font-medium whitespace-nowrap">
            {row.original.district || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'schoolCollege',
        header: 'Institute / School',
        cell: ({ row }) => {
          const item = row.original;
          const displayInst = item.instituteName || item.schoolCollege || '—';
          return (
            <div className="max-w-[200px] truncate" title={displayInst}>
              <span className="text-xs text-slate-800 font-semibold block truncate">
                {displayInst}
              </span>
              {item.institutions?.length > 0 && (
                <span className="text-[10px] text-indigo-600 font-medium block">
                  B2B Batch: {item.institutions[0].batchName || 'Assigned'}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'examTarget',
        header: 'Exam Target',
        cell: ({ row }) => {
          const target = row.original.examTarget?.name || 'Unassigned';
          let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
          const tUpper = target.toUpperCase();
          if (tUpper.includes('NEET')) {
            badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
          } else if (tUpper.includes('JEE')) {
            badgeClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
          } else if (tUpper.includes('CET')) {
            badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
          }

          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border ${badgeClass} whitespace-nowrap`}
            >
              {target}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Registration Date',
        cell: ({ row }) => {
          const dateStr = row.original.createdAt;
          if (!dateStr) return <span className="text-xs text-slate-400">—</span>;
          const d = new Date(dateStr);
          const formatted = d.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Kolkata',
          });
          const time = d.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: 'Asia/Kolkata',
          });
          return (
            <div className="whitespace-nowrap">
              <div className="text-xs font-bold text-slate-800">{formatted}</div>
              <div className="text-[10px] text-slate-400 font-medium">{time} IST</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status || 'ACTIVE';
          const isPending = status === 'PENDING';
          const isInactive = status === 'INACTIVE' || status === 'SUSPENDED';

          const badgeColor = isPending
            ? 'bg-amber-50 text-amber-700 border-amber-200'
            : isInactive
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200';

          return (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badgeColor}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isPending ? 'bg-amber-500' : isInactive ? 'bg-rose-500' : 'bg-emerald-500'
                }`}
              />
              <span>{status}</span>
            </span>
          );
        },
      },
    ],
    [],
  );

  // TanStack Table Instance
  const table = useReactTable({
    data: registrationData?.items || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const totalRecords = registrationData?.pagination?.total ?? 0;
  const totalPages = registrationData?.pagination?.totalPages ?? 1;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ── 1. Page Header & Live Telemetry Banner ────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Users className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                <span>SUPER ADMIN REGISTRATION GOVERNANCE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Student Registration Directory
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Server-side paginated telemetry of all student registrations across NEET, JEE, CET,
                states, and institutional cohorts.
              </p>
            </div>

            <button
              onClick={handleRefreshAll}
              disabled={isFetchingList}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition cursor-pointer backdrop-blur-sm border border-white/15 self-start sm:self-center disabled:opacity-50"
            >
              <RotateCw className={`h-3.5 w-3.5 ${isFetchingList ? 'animate-spin' : ''}`} />
              <span>{isFetchingList ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>
          </div>

          {/* ── 2. Live Dynamic Summary KPI Bar ────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            {/* Total Registrations */}
            <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                Total Registrations
              </span>
              <div className="text-xl sm:text-2xl font-black text-white">
                {isLoadingStats ? '...' : (statsData?.totalRegistrations ?? 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-indigo-300 font-semibold block">
                All-time database total
              </span>
            </div>

            {/* Today Registrations */}
            <div className="p-3.5 rounded-2xl bg-indigo-500/20 backdrop-blur-md border border-indigo-400/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
                  Today (IST)
                </span>
                <Clock className="h-3 w-3 text-indigo-300" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-indigo-200">
                {isLoadingStats ? '...' : (statsData?.todayRegistrations ?? 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-indigo-300 font-semibold block">
                Registered today
              </span>
            </div>

            {/* NEET Registrations */}
            <div className="p-3.5 rounded-2xl bg-rose-500/20 backdrop-blur-md border border-rose-400/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200">
                NEET Aspirants
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-200">
                {isLoadingStats ? '...' : (statsData?.neetRegistrations ?? 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-rose-300 font-semibold block">Medical stream</span>
            </div>

            {/* JEE Registrations */}
            <div className="p-3.5 rounded-2xl bg-blue-500/20 backdrop-blur-md border border-blue-400/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                JEE Aspirants
              </span>
              <div className="text-xl sm:text-2xl font-black text-blue-200">
                {isLoadingStats ? '...' : (statsData?.jeeRegistrations ?? 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-blue-300 font-semibold block">Engineering stream</span>
            </div>

            {/* CET Registrations */}
            <div className="p-3.5 rounded-2xl bg-amber-500/20 backdrop-blur-md border border-amber-400/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200">
                CET Aspirants
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-200">
                {isLoadingStats ? '...' : (statsData?.cetRegistrations ?? 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-amber-300 font-semibold block">State level tests</span>
            </div>

            {/* Active Students */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                Active Ratio
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-200">
                {isLoadingStats ? '...' : (statsData?.activeRegistrations ?? 0).toLocaleString()}
              </div>
              <span className="text-[10px] text-emerald-300 font-semibold block">
                Verified accounts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Dynamic Filter Bar ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-black text-slate-900">Dynamic Multi-Criteria Filters</h2>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                {activeFiltersCount} Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ExportPdfButton
              resource="registrations"
              filters={{
                status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
                examTargetId: selectedExamTarget !== 'ALL' ? selectedExamTarget : undefined,
                stateId: selectedState || undefined,
                districtId: selectedDistrict || undefined,
                institutionId: selectedInstitution || undefined,
              }}
              search={debouncedSearch}
              page={page}
              pageSize={pageSize}
              filename="registrations-report.pdf"
            />

            {/* Quick Date Toggle [ All | Today ] */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setDateFilter('all');
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition ${
                  dateFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Time
              </button>
              <button
                type="button"
                onClick={() => {
                  setDateFilter('today');
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                  dateFilter === 'today'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-indigo-600'
                }`}
              >
                <Clock className="h-3 w-3" />
                <span>Today</span>
              </button>
            </div>

            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 rounded-xl hover:bg-rose-50 transition"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Search Bar */}
          <div className="lg:col-span-2 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name, ID, mobile, email..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 font-medium"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* 2. State Filter */}
          <div>
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              disabled={isLoadingFilters}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium cursor-pointer"
            >
              <option value="">All States</option>
              {filterOptions?.states?.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. District Filter (Cascades with selected State) */}
          <div>
            <select
              value={selectedDistrict}
              onChange={(e) => {
                setSelectedDistrict(e.target.value);
                setPage(1);
              }}
              disabled={isLoadingFilters || (Boolean(selectedState) && filterOptions?.districts?.length === 0)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium cursor-pointer disabled:opacity-60"
            >
              <option value="">
                {selectedState ? 'All Districts in State' : 'All Districts'}
              </option>
              {filterOptions?.districts?.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Institute / School Filter */}
          <div>
            <select
              value={selectedInstitution}
              onChange={(e) => {
                setSelectedInstitution(e.target.value);
                setPage(1);
              }}
              disabled={isLoadingFilters}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium cursor-pointer"
            >
              <option value="">All Institutes / Schools</option>
              {filterOptions?.institutions?.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-medium cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        {/* ── 4. Exam Target Filter Pills [ All | NEET | JEE | CET ] ──────────────── */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Target className="h-3.5 w-3.5 text-slate-400" />
            <span>Exam Target:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedExamTarget('ALL');
              setPage(1);
            }}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              selectedExamTarget === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Exams
          </button>

          {/* Dynamic Exam Target Options from DB */}
          {filterOptions?.examTargets
            ?.filter((target) => ['JEE', 'NEET', 'CET'].includes(target.name?.toUpperCase().trim()))
            ?.map((target) => {
            const isSelected =
              selectedExamTarget === target.id ||
              selectedExamTarget.toUpperCase() === target.name.toUpperCase();

            let activeClass = 'bg-indigo-600 text-white shadow-xs';
            if (target.name.toUpperCase().includes('NEET')) {
              activeClass = 'bg-rose-600 text-white shadow-xs';
            } else if (target.name.toUpperCase().includes('JEE')) {
              activeClass = 'bg-blue-600 text-white shadow-xs';
            } else if (target.name.toUpperCase().includes('CET')) {
              activeClass = 'bg-amber-600 text-white shadow-xs';
            }

            return (
              <button
                key={target.id}
                type="button"
                onClick={() => {
                  setSelectedExamTarget(isSelected ? 'ALL' : target.name);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                  isSelected
                    ? activeClass
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                {target.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 5. Server-Side Data Table ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {/* Table top summary */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="font-bold text-slate-700">
            Showing{' '}
            <span className="text-slate-900 font-black">
              {totalRecords > 0 ? (page - 1) * pageSize + 1 : 0}
            </span>{' '}
            to{' '}
            <span className="text-slate-900 font-black">
              {Math.min(page * pageSize, totalRecords)}
            </span>{' '}
            of <span className="text-slate-900 font-black">{totalRecords.toLocaleString()}</span>{' '}
            Registrations
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="py-1 px-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:outline-hidden"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Main Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                {table.getHeaderGroups().map((headerGroup) =>
                  headerGroup.headers.map((header) => {
                    const columnId = header.id;
                    const isSorted = sortBy === columnId;
                    const canSort = [
                      'name',
                      'studentId',
                      'email',
                      'state',
                      'district',
                      'schoolCollege',
                      'examTarget',
                      'createdAt',
                      'status',
                    ].includes(columnId);

                    return (
                      <th
                        key={header.id}
                        className={`px-4 py-3.5 whitespace-nowrap ${
                          canSort ? 'cursor-pointer hover:bg-slate-100 transition' : ''
                        }`}
                        onClick={() => canSort && handleSort(columnId)}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                          {canSort && (
                            <span className="text-slate-400">
                              {isSorted ? (
                                sortOrder === 'asc' ? (
                                  <ArrowUp className="h-3.5 w-3.5 text-indigo-600 font-bold" />
                                ) : (
                                  <ArrowDown className="h-3.5 w-3.5 text-indigo-600 font-bold" />
                                )
                              ) : (
                                <ArrowUpDown className="h-3 w-3 opacity-40" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  }),
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {isLoadingList ? (
                // Loading Skeleton Rows
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-4 py-4" colSpan={10}>
                      <div className="h-7 bg-slate-100 rounded-xl w-full" />
                    </td>
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Search className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-slate-800 text-sm">No registrations found</p>
                        <p className="text-xs text-slate-500 max-w-sm">
                          Try adjusting or clearing your filters to see student registrations.
                        </p>
                      </div>
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-indigo-50/30 transition-colors group"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── 6. Server-Side Pagination Footer ────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
          <div className="text-xs text-slate-500 font-medium">
            Page <span className="font-bold text-slate-900">{page}</span> of{' '}
            <span className="font-bold text-slate-900">{totalPages}</span>
          </div>

          <div className="flex items-center gap-1 self-end sm:self-auto">
            {/* First Page */}
            <button
              type="button"
              onClick={() => setPage(1)}
              disabled={page <= 1 || isLoadingList}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            {/* Previous Page */}
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoadingList}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            {/* Page number indicators */}
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let pNum = page - 2 + idx;
                if (page <= 3) pNum = idx + 1;
                else if (page >= totalPages - 2) pNum = totalPages - 4 + idx;
                if (pNum < 1 || pNum > totalPages) return null;

                const isCurrent = pNum === page;
                return (
                  <button
                    key={pNum}
                    type="button"
                    onClick={() => setPage(pNum)}
                    className={`h-8 w-8 rounded-xl text-xs font-bold transition ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pNum}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoadingList}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none text-xs font-bold transition"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages || isLoadingList}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminRegistrationsPage;
