import React from 'react';
import { Calendar, MapPin, Building2, Target, Globe, RotateCcw, Search } from 'lucide-react';
import type {
  AnalyticsFilterParams,
  FiltersMetadata,
} from '../services/superAdminDashboard.service';

interface DashboardFilterBarProps {
  filters: AnalyticsFilterParams;
  onFilterChange: (newFilters: Partial<AnalyticsFilterParams>) => void;
  onReset: () => void;
  metadata?: FiltersMetadata;
  isLoading?: boolean;
}

export const DashboardFilterBar: React.FC<DashboardFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  metadata,
}) => {
  const selectedStateId = filters.stateId;
  const filteredDistricts = React.useMemo(() => {
    if (!metadata?.districts) return [];
    if (!selectedStateId) return metadata.districts;
    return metadata.districts.filter((d) => d.stateId === selectedStateId);
  }, [metadata?.districts, selectedStateId]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
            <Search className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
              Executive Analytics Filters
            </h4>
            <p className="text-[11px] text-slate-500">
              Cross-filter all dashboard metrics and tables in real-time.
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold transition self-start sm:self-auto cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. Date Range Preset */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-indigo-500" />
            <span>Time Period</span>
          </label>
          <select
            value={filters.dateRange || 'ALL'}
            onChange={(e) => onFilterChange({ dateRange: e.target.value })}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
          >
            <option value="ALL">All Time</option>
            <option value="TODAY">Today</option>
            <option value="7D">Last 7 Days</option>
            <option value="30D">Last 30 Days</option>
            <option value="90D">Last 90 Days</option>
          </select>
        </div>

        {/* 2. State Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-emerald-500" />
            <span>State</span>
          </label>
          <select
            value={filters.stateId || ''}
            onChange={(e) => {
              const val = e.target.value;
              onFilterChange({ stateId: val || undefined, districtId: undefined });
            }}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
          >
            <option value="">All States</option>
            {metadata?.states.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. District Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-teal-500" />
            <span>District</span>
          </label>
          <select
            value={filters.districtId || ''}
            onChange={(e) => onFilterChange({ districtId: e.target.value || undefined })}
            disabled={filteredDistricts.length === 0}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition disabled:opacity-50"
          >
            <option value="">All Districts</option>
            {filteredDistricts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Institution Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Building2 className="h-3 w-3 text-purple-500" />
            <span>Institution / B2B</span>
          </label>
          <select
            value={filters.institutionId || ''}
            onChange={(e) => onFilterChange({ institutionId: e.target.value || undefined })}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
          >
            <option value="">All Institutions</option>
            {metadata?.institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Exam Target Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Target className="h-3 w-3 text-rose-500" />
            <span>Target Exam</span>
          </label>
          <select
            value={filters.examTargetId || ''}
            onChange={(e) => onFilterChange({ examTargetId: e.target.value || undefined })}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
          >
            <option value="">All Targets</option>
            {metadata?.examTargets.map((et) => (
              <option key={et.id} value={et.id}>
                {et.name}
              </option>
            ))}
          </select>
        </div>

        {/* 6. Language Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
            <Globe className="h-3 w-3 text-blue-500" />
            <span>Language</span>
          </label>
          <select
            value={filters.languageId || ''}
            onChange={(e) => onFilterChange({ languageId: e.target.value || undefined })}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
          >
            <option value="">All Languages</option>
            {metadata?.languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
