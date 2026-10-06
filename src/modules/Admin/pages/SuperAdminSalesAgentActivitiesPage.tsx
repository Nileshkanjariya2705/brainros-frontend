import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Search,
  RefreshCw,
  Building2,
  MapPin,
  Clock,
  Phone,
  User,
  Users,
  Eye,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Camera,
  X,
  Filter,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { SalesVisitService, type SalesVisit } from '@/services/salesVisit.service';
import { SuperAdminSalesAgentApi } from '../services/superAdminSalesAgent.service';

export const SuperAdminSalesAgentActivitiesPage: React.FC = () => {
  const navigate = useNavigate();

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [dateFilter, setDateFilter] = useState<'TODAY' | 'YESTERDAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'ALL'>('TODAY');
  const [customDate, setCustomDate] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Lightbox photo state
  const [lightboxPhotoUrl, setLightboxPhotoUrl] = useState<string | null>(null);

  // 1. Fetch all sales agents for filter dropdown
  const { data: agentsData } = useQuery({
    queryKey: ['super-admin-sales-agents-list-all'],
    queryFn: () => SuperAdminSalesAgentApi.getSalesAgents({ limit: 100 }),
    staleTime: 60000,
  });
  const agentsList = agentsData?.items || [];

  // Compute date ranges based on dateFilter
  const dateRange = useMemo(() => {
    const now = new Date();
    if (customDate) {
      const start = new Date(customDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customDate);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (dateFilter === 'TODAY') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (dateFilter === 'YESTERDAY') {
      const start = new Date(now);
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
      return { startDate: start.toISOString(), endDate: end.toISOString() };
    }
    if (dateFilter === 'LAST_7_DAYS') {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      return { startDate: start.toISOString(), endDate: undefined };
    }
    if (dateFilter === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: start.toISOString(), endDate: undefined };
    }
    return { startDate: undefined, endDate: undefined };
  }, [dateFilter, customDate]);

  // 2. Fetch all sales activities
  const {
    data: visitsResponse,
    isLoading,
    isFetching,
    refetch,
    isError,
  } = useQuery({
    queryKey: [
      'super-admin-sales-agent-activities',
      page,
      limit,
      search,
      selectedAgentId,
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: () =>
      SalesVisitService.listVisits({
        page,
        limit,
        search: search.trim() || undefined,
        salesAgentId: selectedAgentId || undefined,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const rawVisitsData = visitsResponse as any;
  const activities: SalesVisit[] = Array.isArray(rawVisitsData?.items)
    ? rawVisitsData.items
    : Array.isArray(rawVisitsData?.data?.items)
    ? rawVisitsData.data.items
    : Array.isArray(rawVisitsData?.data)
    ? rawVisitsData.data
    : Array.isArray(rawVisitsData)
    ? rawVisitsData
    : [];

  const pagination = rawVisitsData?.pagination || {
    page: 1,
    limit: 10,
    total: activities.length,
    totalPages: Math.ceil(activities.length / 10) || 1,
  };

  // Summary Metrics calculations
  const totalActivitiesCount = pagination.total || activities.length;
  const uniqueAgentsCount = useMemo(() => {
    const set = new Set(activities.map((a) => a.salesAgentId || a.salesAgent?.id).filter(Boolean));
    return set.size;
  }, [activities]);

  const uniqueSchoolsCount = useMemo(() => {
    const set = new Set(activities.map((a) => a.institutionName?.toLowerCase().trim()).filter(Boolean));
    return set.size;
  }, [activities]);

  const photoProofsCount = useMemo(() => {
    return activities.filter(
      (a) => (a.photos && a.photos.length > 0) || (a.checkInPhotos && a.checkInPhotos.length > 0),
    ).length;
  }, [activities]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedAgentId('');
    setDateFilter('TODAY');
    setCustomDate('');
    setPage(1);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300" data-testid="super-admin-sales-agent-activities-page">
      {/* Top Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold uppercase tracking-wider text-blue-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>Real-Time Sales Activity Feed</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Today's Sales Agent Activities
            </h1>
            <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
              Track real-time field visits, school discussions, client meetings, verified GPS coordinates, and Map Camera photo proofs submitted today.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-white/15 hover:bg-white/25 border-white/20 text-white font-bold backdrop-blur flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh Feed</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/super-admin/sales-agents')}
              className="bg-white text-indigo-700 hover:bg-blue-50 font-extrabold shadow-lg flex items-center gap-2"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Manage Sales Agents</span>
            </Button>
          </div>
        </div>

        {/* Decorative background blur shapes */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-48 h-48 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Activities */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {dateFilter === 'TODAY' ? "Today's Activities" : 'Total Activities'}
            </span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {totalActivitiesCount}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Logged
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {dateFilter === 'TODAY' ? "Submitted in today's shift" : 'In selected date range'}
          </p>
        </div>

        {/* Active Agents */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Field Agents
            </span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {uniqueAgentsCount}
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Agents
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            On the field recording visits
          </p>
        </div>

        {/* Institutions Visited */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Institutions Visited
            </span>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {uniqueSchoolsCount}
            </span>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
              Schools
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Across registered territories
          </p>
        </div>

        {/* GPS Map Camera Proofs */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              GPS Photo Proofs
            </span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {photoProofsCount}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Verified
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Watermarked with coordinates
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        {/* Date Quick Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Date:
            </span>
            {(
              [
                { id: 'TODAY', label: "Today's Activities" },
                { id: 'YESTERDAY', label: 'Yesterday' },
                { id: 'LAST_7_DAYS', label: 'Last 7 Days' },
                { id: 'THIS_MONTH', label: 'This Month' },
                { id: 'ALL', label: 'All Time' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setDateFilter(tab.id);
                  setCustomDate('');
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  dateFilter === tab.id && !customDate
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Specific Custom Date Picker */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 whitespace-nowrap">
              Pick Date:
            </label>
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                setCustomDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
          </div>
        </div>

        {/* Search & Agent Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search bar */}
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search school name, agent name, phone, city, notes..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
          </div>

          {/* Sales Agent Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedAgentId}
              onChange={(e) => {
                setSelectedAgentId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white font-medium"
            >
              <option value="">All Sales Agents</option>
              {agentsList.map((agent: any) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} {agent.mobileNumber ? `(${agent.mobileNumber})` : ''}
                </option>
              ))}
            </select>

            {(search || selectedAgentId || dateFilter !== 'TODAY' || customDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold shrink-0"
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Activities Table & Feed */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-rose-600">Failed to load sales activities.</p>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-16 text-center">
            <EmptyState
              title={dateFilter === 'TODAY' ? "No Activities Submitted Today Yet" : "No Activities Found"}
              description={
                dateFilter === 'TODAY'
                  ? "Field sales representatives have not logged any activities yet today. New activity entries will appear here automatically."
                  : "No activity records matched your filter criteria. Try resetting your search or picking another date."
              }
              actionLabel="View All Activities"
              onAction={handleResetFilters}
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-5">Sales Agent</th>
                    <th className="py-3.5 px-4">School / Institution</th>
                    <th className="py-3.5 px-4">Location & GPS</th>
                    <th className="py-3.5 px-4">GPS Photo Proof</th>
                    <th className="py-3.5 px-4">Discussion Notes</th>
                    <th className="py-3.5 px-4">Submission Time</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                  {activities.map((act) => {
                    const agentName = act.salesAgent?.name || 'Sales Representative';
                    const agentPhone = act.salesAgent?.mobileNumber || act.salesAgent?.phone || act.contactPhone || '';
                    const photoProofUrl = (act.photos && act.photos[0]) || (act.checkInPhotos && act.checkInPhotos[0]) || null;
                    const lat = act.latitude || act.checkInLat;
                    const lng = act.longitude || act.checkInLng;

                    return (
                      <tr
                        key={act.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors group"
                      >
                        {/* Sales Agent Column */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                              {agentName.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (act.salesAgentId) {
                                    navigate(`/super-admin/sales-agents/${act.salesAgentId}`);
                                  }
                                }}
                                className="font-extrabold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 text-left transition-colors flex items-center gap-1 group/btn"
                              >
                                <span>{agentName}</span>
                                <ExternalLink className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity text-indigo-500" />
                              </button>
                              {agentPhone && (
                                <a
                                  href={`tel:${agentPhone}`}
                                  className="text-[11px] text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1 mt-0.5"
                                >
                                  <Phone className="w-3 h-3" />
                                  <span>{agentPhone}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* School / Institution Column */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5 max-w-xs">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate">{act.institutionName}</span>
                            </h4>
                            {act.contactPerson && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{act.contactPerson}</span>
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Location & GPS Column */}
                        <td className="py-4 px-4">
                          <div className="space-y-1 max-w-[220px]">
                            {act.locationAddress ? (
                              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium truncate flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span title={act.locationAddress}>{act.locationAddress}</span>
                              </p>
                            ) : (
                              <span className="text-slate-400 text-xs italic">Location pending</span>
                            )}

                            {lat != null && lng != null ? (
                              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200/60 dark:border-emerald-800/60">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                <span>
                                  {lat.toFixed(4)}°, {lng.toFixed(4)}°
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </td>

                        {/* GPS Map Camera Photo Proof Column */}
                        <td className="py-4 px-4">
                          {photoProofUrl ? (
                            <div
                              onClick={() => setLightboxPhotoUrl(photoProofUrl)}
                              className="relative group/photo w-20 h-14 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 cursor-pointer shadow-sm hover:shadow-md transition-all shrink-0"
                            >
                              <img
                                src={photoProofUrl}
                                alt="GPS Map Camera Proof"
                                className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-extrabold gap-1">
                                <Eye className="w-3 h-3" />
                                <span>View</span>
                              </div>
                              <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/70 text-white text-[7px] font-extrabold flex items-center gap-0.5">
                                <Sparkles className="w-2 h-2 text-yellow-400" />
                                <span>GPS</span>
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">No photo proof</span>
                          )}
                        </td>

                        {/* Notes / Discussion Column */}
                        <td className="py-4 px-4">
                          <div className="max-w-[260px]">
                            {act.notes || act.summary ? (
                              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                {act.notes || act.summary}
                              </p>
                            ) : (
                              <span className="text-slate-400 text-xs italic">No notes recorded</span>
                            )}
                          </div>
                        </td>

                        {/* Submission Time Column */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-blue-500" />
                              {new Date(act.scheduledAt || act.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              {new Date(act.scheduledAt || act.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                        </td>

                        {/* Actions Column */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/super-admin/sales-agent-activities/${act.id}`)}
                            data-testid={`view-activity-detail-${act.id}`}
                            className="text-xs font-bold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 ml-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <Pagination
                  page={page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  limit={limit}
                  onPageChange={(p) => setPage(p)}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Fullscreen Photo Proof Lightbox */}
      {lightboxPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in">
          <button
            onClick={() => setLightboxPhotoUrl(null)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxPhotoUrl}
            alt="Full GPS Map Camera Proof"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};

export default SuperAdminSalesAgentActivitiesPage;
