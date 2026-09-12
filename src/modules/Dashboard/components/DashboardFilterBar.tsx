import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Building2, Target, Globe, RotateCcw, Search, Loader2 } from 'lucide-react';
import type {
  AnalyticsFilterParams,
  FiltersMetadata,
} from '../services/superAdminDashboard.service';
import {
  fetchAllStatesAPI,
  fetchDistrictsByStateSlugAPI,
  getStateSlug,
  formatLocationName,
  type ApiStateItem,
  type ApiDistrictItem,
} from '@/modules/Auth/services/location.service';

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
  // ─── Live State & City (Registration API) State ─────────────────
  const [liveStates, setLiveStates] = useState<ApiStateItem[]>([]);
  const [liveDistricts, setLiveDistricts] = useState<ApiDistrictItem[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  // Fetch states from registration API on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoadingStates(true);
    fetchAllStatesAPI()
      .then(({ data }) => {
        if (isMounted && data && data.length > 0) {
          setLiveStates(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoadingStates(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch cities/districts when selected state changes
  const selectedStateName = filters.state || '';
  const selectedStateId = filters.stateId || '';

  useEffect(() => {
    const currentState = selectedStateName || '';
    if (!currentState) {
      setLiveDistricts([]);
      return;
    }

    let isMounted = true;
    setIsLoadingDistricts(true);

    const slug = getStateSlug(currentState);
    fetchDistrictsByStateSlugAPI(slug)
      .then(({ data }) => {
        if (isMounted && data) {
          setLiveDistricts(data);
        }
      })
      .catch(() => {
        if (isMounted) setLiveDistricts([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingDistricts(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedStateName]);

  // Merge live registration states with any metadata DB states
  const availableStates = React.useMemo(() => {
    if (liveStates.length > 0) {
      return liveStates.map((s) => ({
        name: formatLocationName(s.name),
        rawName: s.name,
        slug: s.slug || getStateSlug(s.name),
      }));
    }
    if (metadata?.states && metadata.states.length > 0) {
      return metadata.states.map((s) => ({
        name: s.name,
        rawName: s.name,
        slug: getStateSlug(s.name),
        id: s.id,
      }));
    }
    return [];
  }, [liveStates, metadata?.states]);

  // Merge live registration districts with any metadata DB districts
  const availableDistricts = React.useMemo(() => {
    if (liveDistricts.length > 0) {
      return liveDistricts.map((d) => ({
        name: formatLocationName(d.name),
        rawName: d.name,
      }));
    }
    if (metadata?.districts && selectedStateId) {
      return metadata.districts
        .filter((d) => d.stateId === selectedStateId)
        .map((d) => ({ name: d.name, rawName: d.name, id: d.id }));
    }
    return [];
  }, [liveDistricts, metadata?.districts, selectedStateId]);

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
              Cross-filter all dashboard metrics, state distributions, and tables in real-time.
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

        {/* 2. State Filter (Using Live Registration API) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-emerald-500" />
              <span>State</span>
            </span>
            {isLoadingStates && <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />}
          </label>
          <select
            value={filters.state || filters.stateId || ''}
            onChange={(e) => {
              const val = e.target.value;
              const matchedState = availableStates.find(
                (s) => s.rawName === val || s.name === val || (s as any).id === val,
              );
              onFilterChange({
                state: val || undefined,
                stateId: (matchedState as any)?.id || undefined,
                district: undefined,
                districtId: undefined,
              });
            }}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition cursor-pointer"
          >
            <option value="">All States</option>
            {availableStates.map((s, idx) => (
              <option key={s.rawName || idx} value={s.rawName}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. City / District Filter (Dynamic from selected State) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-teal-500" />
              <span>City / District</span>
            </span>
            {isLoadingDistricts && <Loader2 className="h-3 w-3 animate-spin text-teal-500" />}
          </label>
          <select
            value={filters.district || filters.districtId || ''}
            onChange={(e) => {
              const val = e.target.value;
              const matchedDist = availableDistricts.find(
                (d) => d.rawName === val || d.name === val || (d as any).id === val,
              );
              onFilterChange({
                district: val || undefined,
                districtId: (matchedDist as any)?.id || undefined,
              });
            }}
            disabled={!selectedStateName || availableDistricts.length === 0}
            className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition disabled:opacity-50 cursor-pointer"
          >
            <option value="">
              {!selectedStateName
                ? 'Select State first'
                : isLoadingDistricts
                ? 'Loading cities...'
                : availableDistricts.length === 0
                ? 'No cities found'
                : 'All Cities / Districts'}
            </option>
            {availableDistricts.map((d, idx) => (
              <option key={d.rawName || idx} value={d.rawName}>
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
            className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition cursor-pointer"
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
            {metadata?.examTargets
              ?.filter((et) => ['JEE', 'NEET', 'CET'].includes(et.name?.toUpperCase().trim()))
              ?.map((et) => (
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
