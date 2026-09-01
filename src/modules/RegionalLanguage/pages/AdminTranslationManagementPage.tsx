import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Search,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  X,
  ChevronLeft,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';
import ExamTranslationManager from '../components/ExamTranslationManager';
import {
  useGetTranslationTargetsAPI,
  type TranslationTargetItem,
  type ExamTranslationTargetsQueryParams,
} from '../services/examTranslation.service';
import { useAxiosGet } from '@/hooks/useAxios';

// ─── Format Created At Date (e.g. 01 Sep 2026, 10:30 AM) ─────────────
const formatCreatedAt = (isoString: string): string => {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '—';
  }
};

export const AdminTranslationManagementPage: React.FC = () => {
  // ─── API Hooks ───────────────────────────────────────────────────────
  const { getTranslationTargetsAPI, isLoading, isError } =
    useGetTranslationTargetsAPI();
  const [getSubjectsReq] = useAxiosGet();

  // ─── State ───────────────────────────────────────────────────────────
  const [items, setItems] = useState<TranslationTargetItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
  });

  // Selected Target for managing translation
  const [selectedTarget, setSelectedTarget] = useState<TranslationTargetItem | null>(null);

  // Filter States
  const [activeTab, setActiveTab] = useState<'ALL' | 'LIVE_EXAM' | 'MOCK' | 'SUBJECT_MOCK'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('ALL');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'title' | 'totalQuestions'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Master Subjects list
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  // ─── Search Debounce ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ─── Load Master Subjects ────────────────────────────────────────────
  useEffect(() => {
    getSubjectsReq<any>('/auth/options').then(({ data }) => {
      const opts = data?.subjects ? data : (data as any)?.data || {};
      if (opts.subjects && Array.isArray(opts.subjects)) {
        setAvailableSubjects(opts.subjects);
      }
    });
  }, [getSubjectsReq]);

  // ─── Load Translation Targets ────────────────────────────────────────
  const loadTargets = useCallback(
    async (pageToLoad = pagination.page) => {
      const params: ExamTranslationTargetsQueryParams = {
        type: activeTab,
        search: debouncedSearch,
        status: selectedStatus,
        subjectId: selectedSubjectId,
        from: fromDate || undefined,
        to: toDate || undefined,
        page: pageToLoad,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      };

      const res = await getTranslationTargetsAPI(params);
      if (res.data) {
        setItems(res.data.items || []);
        if (res.data.pagination) {
          setPagination({
            page: res.data.pagination.page,
            limit: res.data.pagination.limit,
            total: res.data.pagination.total,
            totalPages: res.data.pagination.totalPages,
          });
        }
      }
    },
    [
      activeTab,
      debouncedSearch,
      selectedStatus,
      selectedSubjectId,
      fromDate,
      toDate,
      pagination.limit,
      pagination.page,
      sortBy,
      sortOrder,
      getTranslationTargetsAPI,
    ],
  );

  useEffect(() => {
    loadTargets(1);
  }, [
    activeTab,
    debouncedSearch,
    selectedStatus,
    selectedSubjectId,
    fromDate,
    toDate,
    sortBy,
    sortOrder,
  ]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      loadTargets(newPage);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setDebouncedSearch('');
    setSelectedStatus('ALL');
    setSelectedSubjectId('ALL');
    setFromDate('');
    setToDate('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setActiveTab('ALL');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedStatus !== 'ALL' ||
    selectedSubjectId !== 'ALL' ||
    fromDate ||
    toDate ||
    activeTab !== 'ALL';

  // ─── If a Target is selected, render the Reusable Translation Manager ─
  if (selectedTarget) {
    return (
      <div className="max-w-7xl mx-auto space-y-4 pb-16">
        <div className="flex items-center space-x-2 text-xs text-slate-500 pb-2">
          <button
            onClick={() => setSelectedTarget(null)}
            className="hover:text-indigo-600 font-semibold"
          >
            Translation Management
          </button>
          <span>/</span>
          <span className="font-bold text-slate-800">{selectedTarget.title}</span>
        </div>

        <ExamTranslationManager
          examId={selectedTarget.id}
          examTitle={selectedTarget.title}
          onBack={() => {
            setSelectedTarget(null);
            loadTargets();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* ─── Header Banner ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-500/20 mb-2">
            <Globe size={13} className="text-indigo-600" />
            <span>Multi-Lingual Exam & Question Localization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Translation Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage question and option translations across Exams, Mock Tests, and Subject-wise Mocks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadTargets()}
            disabled={isLoading}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh List</span>
          </Button>
        </div>
      </div>

      {/* ─── Category Tabs ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto text-xs font-bold">
        {[
          { id: 'ALL', label: 'All Tests & Exams' },
          { id: 'LIVE_EXAM', label: 'Live Exams' },
          { id: 'MOCK', label: 'Mock Tests' },
          { id: 'SUBJECT_MOCK', label: 'Subject-wise Mocks' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className={`rounded-2xl px-4 py-2 border transition-all shrink-0 ${
              activeTab === tab.id
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Search & Filters Card ────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <div className="relative lg:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by test name, code or subject..."
              className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            >
              <option value="ALL">All Subjects</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
              }}
              className="w-full py-2.5 px-3 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
            >
              <option value="createdAt-desc">Newest First (Created At)</option>
              <option value="createdAt-asc">Oldest First (Created At)</option>
              <option value="totalQuestions-desc">Most Questions</option>
              <option value="title-asc">Title (A - Z)</option>
            </select>
          </div>
        </div>

        {/* Date Filter Bar & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-500 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Created Date Range:</span>
            </span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-slate-400 font-semibold">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-bold transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Target Items Listing ─────────────────────────────────────── */}
      {isLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <Loader label="Loading translation targets..." />
        </div>
      ) : isError ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-8 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900">Unable to load exams and mock tests</h3>
          <p className="text-xs text-rose-600 max-w-md mx-auto">
            An unexpected error occurred while fetching translation targets. Please try again.
          </p>
          <Button size="sm" variant="outline" onClick={() => loadTargets()}>
            Retry
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <Globe className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No exams or mock tests found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No items matched your current filter criteria. Create an exam or mock test first to manage its translations.
          </p>
          {hasActiveFilters && (
            <Button size="sm" variant="outline" onClick={handleResetFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-5">Type</th>
                    <th className="py-3.5 px-5">Exam / Test Name</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4 text-center">Questions</th>
                    <th className="py-3.5 px-4">Languages Coverage</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5">Created At</th>
                    <th className="py-3.5 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const coverageKeys = Object.keys(item.translationCoverage || {});

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        onClick={() => setSelectedTarget(item)}
                      >
                        {/* Type Badge */}
                        <td className="py-4 px-5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                              item.type === 'SUBJECT_MOCK'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : item.type === 'MOCK'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                            }`}
                          >
                            {item.typeLabel}
                          </span>
                        </td>

                        {/* Name & Subtitle */}
                        <td className="py-4 px-5 font-bold text-slate-900">
                          <div className="space-y-0.5">
                            <span className="text-sm font-extrabold text-slate-900 line-clamp-1">
                              {item.title}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium block">
                              {item.durationMinutes} Mins • {item.totalMarks} Marks
                            </span>
                          </div>
                        </td>

                        {/* Subject */}
                        <td className="py-4 px-4 font-semibold text-slate-700">
                          <span className="inline-flex items-center gap-1.5">
                            {item.subject ? (
                              <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px]">
                                {item.subject.name}
                              </span>
                            ) : (
                              <span className="text-slate-600 text-[11px]">
                                {item.subjectsSummary}
                              </span>
                            )}
                          </span>
                        </td>

                        {/* Questions Count */}
                        <td className="py-4 px-4 text-center font-bold text-slate-800">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono">
                            <Layers className="h-3 w-3 text-slate-400" />
                            <span>{item.totalQuestions}</span>
                          </span>
                        </td>

                        {/* Languages / Translation Coverage */}
                        <td className="py-4 px-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {coverageKeys.length === 0 ? (
                                <span className="text-[11px] text-slate-400 italic">
                                  Default Only
                                </span>
                              ) : (
                                coverageKeys.map((code) => {
                                  const pct = item.translationCoverage[code];
                                  return (
                                    <span
                                      key={code}
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                                        pct >= 100
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : pct > 0
                                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                                            : 'bg-slate-100 text-slate-500 border-slate-200'
                                      }`}
                                    >
                                      {code}: {pct}%
                                    </span>
                                  );
                                })
                              )}
                            </div>
                            <div className="w-24 bg-slate-100 rounded-full h-1 overflow-hidden">
                              <div
                                className={`h-1 rounded-full ${
                                  item.overallCoveragePercentage >= 100
                                    ? 'bg-emerald-500'
                                    : item.overallCoveragePercentage > 0
                                      ? 'bg-indigo-500'
                                      : 'bg-slate-300'
                                }`}
                                style={{
                                  width: `${item.overallCoveragePercentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              item.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : item.status === 'APPROVED'
                                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                                  : item.status === 'SCHEDULED'
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>

                        {/* Created At (Authoritative DB timestamp) */}
                        <td className="py-4 px-5 text-slate-500 font-medium whitespace-nowrap">
                          <span className="font-mono text-[11px] text-slate-700 font-semibold block">
                            {formatCreatedAt(item.createdAt)}
                          </span>
                          {item.createdBy && (
                            <span className="text-[10px] text-slate-400 block">
                              by {item.createdBy.name}
                            </span>
                          )}
                        </td>

                        {/* Manage Action */}
                        <td className="py-4 px-5 text-right">
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTarget(item);
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-bold"
                          >
                            <Globe className="h-3.5 w-3.5" />
                            <span>Manage</span>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile / Tablet Cards View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedTarget(item)}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 transition-all space-y-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`inline-flex items-center text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                      item.type === 'SUBJECT_MOCK'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : item.type === 'MOCK'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}
                  >
                    {item.typeLabel}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    {item.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.subject ? item.subject.name : item.subjectsSummary} • {item.totalQuestions} Questions • {item.durationMinutes} Mins
                  </p>
                </div>

                {/* Translation Summary Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {Object.keys(item.translationCoverage || {}).map((code) => {
                    const pct = item.translationCoverage[code];
                    return (
                      <span
                        key={code}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          pct >= 100
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : pct > 0
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {code}: {pct}%
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    Created: <strong>{formatCreatedAt(item.createdAt)}</strong>
                  </span>

                  <Button
                    size="sm"
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTarget(item);
                    }}
                    className="flex items-center gap-1 text-xs font-bold"
                  >
                    <Globe className="h-3 w-3" />
                    <span>Manage Translation</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Pagination Controls ──────────────────────────────────── */}
          {pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
              <span>
                Showing {(pagination.page - 1) * pagination.limit + 1}–
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                <strong>{pagination.total}</strong> targets
              </span>

              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className="flex items-center gap-1 px-2.5"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </Button>

                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (pagination.totalPages > 5 && pagination.page > 3) {
                    pageNum = pagination.page - 2 + i;
                    if (pageNum > pagination.totalPages) {
                      pageNum = pagination.totalPages - 4 + i;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                        pagination.page === pageNum
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <Button
                  size="sm"
                  variant="outline"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className="flex items-center gap-1 px-2.5"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTranslationManagementPage;
