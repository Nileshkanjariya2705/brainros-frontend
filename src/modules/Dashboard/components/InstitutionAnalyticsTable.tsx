import React, { useState } from 'react';
import {
  Building2,
  Search,
  School,
  Layers,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  BarChart2,
  Table as TableIcon,
} from 'lucide-react';
import type { InstitutionRegistrationItem } from '../services/superAdminDashboard.service';

interface InstitutionAnalyticsTableProps {
  data?: {
    data: InstitutionRegistrationItem[];
    totalCount: number;
    meta?: { page: number; limit: number; pages: number };
  };
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onSearchChange?: (search: string) => void;
  page?: number;
  onPageChange?: (page: number) => void;
}

export const InstitutionAnalyticsTable: React.FC<InstitutionAnalyticsTableProps> = ({
  data,
  isLoading,
  isError,
  onRetry,
  onSearchChange,
  page = 1,
  onPageChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'BAR_CHART' | 'PILLAR_CHART' | 'TABLE'>('BAR_CHART');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearchChange) onSearchChange(val);
  };

  const rawInstitutions: InstitutionRegistrationItem[] = Array.isArray(data)
    ? data
    : Array.isArray((data as any)?.data)
      ? (data as any).data
      : Array.isArray((data as any)?.data?.data)
        ? (data as any).data.data
        : [];

  // Ensure descending sort by student count
  const institutions = [...rawInstitutions].sort((a, b) => b.studentCount - a.studentCount);
  const meta = data?.meta || { page: 1, limit: 50, pages: 1 };
  const maxStudentCount = Math.max(...institutions.map((i) => i.studentCount), 1);

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      {/* ── FULL-WIDTH HEADER ────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">
                Student Distribution by Institute
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-50 text-purple-700 border border-purple-200">
                FULL-WIDTH ANALYTICS
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Complete student enrollment density across coaching centers, junior colleges, and partner schools.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search institutes..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-slate-800 focus:bg-white focus:border-purple-500 focus:outline-none transition"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setViewMode('BAR_CHART')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'BAR_CHART'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Horizontal Bars</span>
            </button>
            <button
              onClick={() => setViewMode('PILLAR_CHART')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'PILLAR_CHART'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5 rotate-90" />
              <span>Pillar Scroll</span>
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                viewMode === 'TABLE'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT BODY ────────────────────────────── */}
      {isLoading ? (
        <div className="space-y-4 py-8">
          <div className="h-10 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-10 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-10 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="h-10 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      ) : isError ? (
        <div className="p-10 text-center rounded-2xl bg-rose-50/50 border border-rose-100 space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
          <p className="text-sm font-bold text-rose-800">Unable to load institute distribution data.</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Loading</span>
            </button>
          )}
        </div>
      ) : institutions.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-500 rounded-2xl bg-slate-50 border border-slate-100">
          No institution student data available matching your search criteria.
        </div>
      ) : viewMode === 'BAR_CHART' ? (
        /* ── 1. PROMINENT FULL-WIDTH HORIZONTAL BAR CHART ── */
        <div className="space-y-3">
          <div className="border border-slate-100 rounded-2xl bg-slate-50/50 p-4 space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
            {institutions.map((inst, idx) => {
              const widthPercent = Math.max(5, (inst.studentCount / maxStudentCount) * 100);
              const isHovered = hoveredIndex === idx;

              return (
                <div
                  key={`${inst.name}-${idx}`}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="group p-3.5 rounded-2xl border border-slate-200/80 bg-white hover:border-purple-300 transition-all hover:shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between gap-3 text-xs font-bold">
                    {/* Institute Title & Metadata */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-700 shrink-0">
                        <School className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-900 text-sm block truncate" title={inst.name}>
                          {inst.name}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px]">
                            {inst.code}
                          </span>
                          <span>•</span>
                          <span>
                            {inst.city !== 'N/A' ? `${inst.city}, ` : ''}
                            {inst.state}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Layers className="h-3 w-3 text-slate-400" />
                            {inst.batchCount} batches
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Enrolled Students Count */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-900 font-black text-sm">
                        {inst.studentCount.toLocaleString()}{' '}
                        <span className="text-[11px] font-bold text-slate-500">students</span>
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar Fill */}
                  <div className="w-full h-3.5 rounded-full bg-slate-100 overflow-hidden relative p-0.5">
                    <div
                      style={{ width: `${widthPercent}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHovered
                          ? 'bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-400 shadow-sm'
                          : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'PILLAR_CHART' ? (
        /* ── 2. VERTICAL PILLAR BAR CHART WITH HORIZONTAL SCROLL ── */
        <div className="space-y-2">
          <div className="relative border border-slate-100 rounded-2xl bg-slate-50/50 p-4">
            <div className="overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
              <div
                style={{ minWidth: `${Math.max(600, institutions.length * 75)}px` }}
                className="h-72 flex items-end justify-start gap-4 px-4"
              >
                {institutions.map((inst, idx) => {
                  const heightPercent = Math.max(8, (inst.studentCount / maxStudentCount) * 100);
                  const isHovered = hoveredIndex === idx;

                  return (
                    <div
                      key={`${inst.name}-${idx}`}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="group relative flex flex-col items-center justify-end h-full flex-1 max-w-[80px] min-w-[50px] cursor-pointer"
                    >
                      {/* Interactive Tooltip */}
                      {isHovered && (
                        <div className="absolute -top-16 z-30 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                          <div className="font-extrabold">{inst.name}</div>
                          <div className="text-[10px] text-purple-300 font-medium">
                            {inst.city !== 'N/A' ? `${inst.city}, ` : ''}{inst.state} • {inst.batchCount} batches
                          </div>
                          <div className="text-[11px] text-emerald-400 font-black">
                            {inst.studentCount.toLocaleString()} enrolled students
                          </div>
                        </div>
                      )}

                      <span className="text-[11px] font-black text-slate-800 mb-1 group-hover:scale-110 transition-transform">
                        {inst.studentCount >= 1000 ? `${(inst.studentCount / 1000).toFixed(1)}k` : inst.studentCount}
                      </span>

                      <div className="w-full bg-slate-200/80 rounded-t-2xl overflow-hidden h-52 flex items-end p-0.5">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className={`w-full rounded-t-xl transition-all duration-500 ${
                            isHovered
                              ? 'bg-gradient-to-t from-purple-700 to-indigo-400 shadow-md'
                              : 'bg-gradient-to-t from-purple-600 to-indigo-500'
                          }`}
                        />
                      </div>

                      <div className="mt-2 text-center w-full">
                        <span
                          className="block text-[11px] font-bold truncate max-w-full text-slate-700 group-hover:text-slate-900"
                          title={inst.name}
                        >
                          {inst.name}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-[11px] text-slate-500 text-right pt-2 font-semibold border-t border-slate-100">
              ← Scroll horizontally to inspect full institutional chart dataset →
            </div>
          </div>
        </div>
      ) : (
        /* ── 3. DATA TABLE MODE ── */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="pb-3 px-3">Institution</th>
                <th className="pb-3 px-3">Code / Category</th>
                <th className="pb-3 px-3">Location</th>
                <th className="pb-3 px-3">Active Batches</th>
                <th className="pb-3 px-3 text-right">Enrolled Students</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {institutions.map((inst, index) => (
                <tr key={`${inst.name}-${index}`} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-700">
                        <School className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 block">{inst.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {inst.type} • {inst.status}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 font-mono">
                      {inst.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-slate-600 font-medium">
                    {inst.city !== 'N/A' ? `${inst.city}, ` : ''}
                    {inst.state}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className="inline-flex items-center gap-1 text-slate-700 font-bold">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      {inst.batchCount} batches
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200">
                      {inst.studentCount.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── FOOTER & PAGINATION ────────────────────────────── */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-slate-600">
        <span>
          Showing {institutions.length} institutions (Page {meta.page} of {meta.pages})
        </span>
        {meta.pages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange && onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => onPageChange && onPageChange(Math.min(meta.pages, page + 1))}
              disabled={page >= meta.pages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
