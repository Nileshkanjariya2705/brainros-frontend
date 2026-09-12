import React, { useState } from 'react';
import { Compass, Building, Search, RefreshCw, AlertCircle, MapPin } from 'lucide-react';
import type {
  StateRegistrationItem,
  DistrictRegistrationItem,
} from '../services/superAdminDashboard.service';

interface StateDistrictDistributionProps {
  stateData?: { data: StateRegistrationItem[]; totalStudents: number };
  districtData?: { data: DistrictRegistrationItem[]; totalStudents: number };
  selectedState?: string;
  onSelectState?: (stateName: string) => void;
  isLoadingStates?: boolean;
  isLoadingDistricts?: boolean;
  isErrorStates?: boolean;
  isErrorDistricts?: boolean;
  onRetryStates?: () => void;
  onRetryDistricts?: () => void;
}

export const StateDistrictDistribution: React.FC<StateDistrictDistributionProps> = ({
  stateData,
  districtData,
  selectedState,
  onSelectState,
  isLoadingStates,
  isLoadingDistricts,
  isErrorStates,
  isErrorDistricts,
  onRetryStates,
  onRetryDistricts,
}) => {
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [stateChartMode, setStateChartMode] = useState<'HORIZONTAL' | 'VERTICAL'>('HORIZONTAL');
  const [districtChartMode, setDistrictChartMode] = useState<'HORIZONTAL' | 'VERTICAL'>('HORIZONTAL');
  const [hoveredStateIndex, setHoveredStateIndex] = useState<number | null>(null);
  const [hoveredDistrictIndex, setHoveredDistrictIndex] = useState<number | null>(null);

  // Robust array extraction supporting both raw array and object wrappers
  const rawStateList: StateRegistrationItem[] = Array.isArray(stateData)
    ? stateData
    : Array.isArray((stateData as any)?.data)
      ? (stateData as any).data
      : Array.isArray((stateData as any)?.data?.data)
        ? (stateData as any).data.data
        : [];

  const rawDistrictList: DistrictRegistrationItem[] = Array.isArray(districtData)
    ? districtData
    : Array.isArray((districtData as any)?.data)
      ? (districtData as any).data
      : Array.isArray((districtData as any)?.data?.data)
        ? (districtData as any).data.data
        : [];

  const states = rawStateList
    .filter((s) => s.state.toLowerCase().includes(stateSearch.toLowerCase()))
    .sort((a, b) => b.count - a.count);

  const districts = rawDistrictList
    .filter((d) => d.district.toLowerCase().includes(districtSearch.toLowerCase()))
    .sort((a, b) => b.count - a.count);

  const maxStateCount = Math.max(...states.map((s) => s.count), 1);
  const maxDistrictCount = Math.max(...districts.map((d) => d.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── 1. STATE-WISE STUDENT BAR CHART ────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  State-wise Student Bar Chart
                </h3>
                <p className="text-[11px] text-slate-500">
                  Total student geographic distribution across states.
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold self-start sm:self-auto">
              <button
                onClick={() => setStateChartMode('HORIZONTAL')}
                className={`px-2 py-0.5 rounded-lg transition ${
                  stateChartMode === 'HORIZONTAL'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Horizontal Bar
              </button>
              <button
                onClick={() => setStateChartMode('VERTICAL')}
                className={`px-2 py-0.5 rounded-lg transition ${
                  stateChartMode === 'VERTICAL'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Vertical Bar
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search states..."
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none transition"
            />
          </div>

          {/* State Chart Content */}
          {isLoadingStates ? (
            <div className="space-y-3 py-6">
              <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ) : isErrorStates ? (
            <div className="p-8 text-center rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
              <AlertCircle className="mx-auto h-6 w-6 text-rose-500" />
              <p className="text-xs font-bold text-rose-800">Unable to load state-wise data.</p>
              {onRetryStates && (
                <button
                  onClick={onRetryStates}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry Query</span>
                </button>
              )}
            </div>
          ) : states.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 rounded-2xl bg-slate-50 border border-slate-100">
              No state-wise student data available.
            </div>
          ) : stateChartMode === 'HORIZONTAL' ? (
            /* ── HORIZONTAL BAR CHART MODE ── */
            <div className="relative border border-slate-100 rounded-2xl bg-slate-50/40 p-3.5 space-y-2.5 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              {states.map((s, idx) => {
                const isSelected = selectedState === s.state;
                const widthPercent = Math.max(6, (s.count / maxStateCount) * 100);
                const isHovered = hoveredStateIndex === idx;

                return (
                  <div
                    key={`${s.state}-${idx}`}
                    onMouseEnter={() => setHoveredStateIndex(idx)}
                    onMouseLeave={() => setHoveredStateIndex(null)}
                    onClick={() => onSelectState && onSelectState(isSelected ? '' : s.state)}
                    className={`group p-2.5 rounded-xl border transition cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/60 shadow-xs'
                        : 'border-slate-200/80 bg-white hover:border-emerald-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2 truncate max-w-[65%]">
                        <MapPin className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-emerald-500'}`} />
                        <span className="text-slate-800 truncate" title={s.state}>
                          {s.state}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-900 font-extrabold">{s.count.toLocaleString()}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          {s.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Bar Line with Gradient & Glow */}
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden relative p-0.5">
                      <div
                        style={{ width: `${widthPercent}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-400 shadow-sm'
                            : isHovered
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-300'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── VERTICAL PILLAR BAR CHART MODE (WITH HORIZONTAL SCROLL) ── */
            <div className="relative border border-slate-100 rounded-2xl bg-slate-50/40 p-4">
              <div className="overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                <div
                  style={{ minWidth: `${Math.max(280, states.length * 52)}px` }}
                  className="h-64 flex items-end justify-start gap-3 px-2"
                >
                  {states.map((s, idx) => {
                    const isSelected = selectedState === s.state;
                    const heightPercent = Math.max(8, (s.count / maxStateCount) * 100);
                    const isHovered = hoveredStateIndex === idx;

                    return (
                      <div
                        key={`${s.state}-${idx}`}
                        onMouseEnter={() => setHoveredStateIndex(idx)}
                        onMouseLeave={() => setHoveredStateIndex(null)}
                        onClick={() => onSelectState && onSelectState(isSelected ? '' : s.state)}
                        className="group relative flex flex-col items-center justify-end h-full flex-1 max-w-[60px] min-w-[36px] cursor-pointer"
                      >
                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-12 z-30 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-[11px] font-bold shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                            <div>{s.state}</div>
                            <div className="text-[10px] text-emerald-400 font-extrabold">
                              {s.count.toLocaleString()} students ({s.percentage}%)
                            </div>
                          </div>
                        )}

                        <span className="text-[10px] font-extrabold text-slate-700 mb-1 group-hover:scale-110 transition-transform">
                          {s.count >= 1000 ? `${(s.count / 1000).toFixed(1)}k` : s.count}
                        </span>

                        <div className="w-full bg-slate-200/80 rounded-t-xl overflow-hidden h-44 flex items-end p-0.5">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-lg transition-all duration-500 ${
                              isSelected
                                ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md ring-2 ring-emerald-400'
                                : 'bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:from-emerald-600'
                            }`}
                          />
                        </div>

                        <div className="mt-2 text-center w-full">
                          <span
                            className={`block text-[10px] font-bold truncate max-w-full ${
                              isSelected ? 'text-emerald-700 font-extrabold' : 'text-slate-600 group-hover:text-slate-900'
                            }`}
                            title={s.state}
                          >
                            {s.state}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 text-right pt-1 font-semibold">
                ← Scroll horizontally to view all states →
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span>Click any state bar to filter district breakdown.</span>
          <span className="font-bold text-slate-700">{states.length} Active States</span>
        </div>
      </div>

      {/* ── 2. DISTRICT-WISE STUDENT BAR CHART ────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  District-wise Student Bar Chart {selectedState ? `(${selectedState})` : ''}
                </h3>
                <p className="text-[11px] text-slate-500">
                  City and municipal district student concentration.
                </p>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-bold self-start sm:self-auto">
              <button
                onClick={() => setDistrictChartMode('HORIZONTAL')}
                className={`px-2 py-0.5 rounded-lg transition ${
                  districtChartMode === 'HORIZONTAL'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Horizontal Bar
              </button>
              <button
                onClick={() => setDistrictChartMode('VERTICAL')}
                className={`px-2 py-0.5 rounded-lg transition ${
                  districtChartMode === 'VERTICAL'
                    ? 'bg-white text-teal-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Vertical Bar
              </button>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search districts..."
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-slate-800 focus:bg-white focus:border-teal-500 focus:outline-none transition"
            />
          </div>

          {/* District Chart Content */}
          {isLoadingDistricts ? (
            <div className="space-y-3 py-6">
              <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ) : isErrorDistricts ? (
            <div className="p-8 text-center rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
              <AlertCircle className="mx-auto h-6 w-6 text-rose-500" />
              <p className="text-xs font-bold text-rose-800">Unable to load district-wise data.</p>
              {onRetryDistricts && (
                <button
                  onClick={onRetryDistricts}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" />
                  <span>Retry Query</span>
                </button>
              )}
            </div>
          ) : districts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 rounded-2xl bg-slate-50 border border-slate-100">
              No district-wise student data available.
            </div>
          ) : districtChartMode === 'HORIZONTAL' ? (
            /* ── HORIZONTAL BAR CHART MODE ── */
            <div className="relative border border-slate-100 rounded-2xl bg-slate-50/40 p-3.5 space-y-2.5 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
              {districts.map((d, idx) => {
                const widthPercent = Math.max(6, (d.count / maxDistrictCount) * 100);
                const isHovered = hoveredDistrictIndex === idx;

                return (
                  <div
                    key={`${d.state}-${d.district}-${idx}`}
                    onMouseEnter={() => setHoveredDistrictIndex(idx)}
                    onMouseLeave={() => setHoveredDistrictIndex(null)}
                    className="group p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-teal-300 transition cursor-pointer space-y-1.5 hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                        <span className="text-slate-900 font-extrabold truncate" title={d.district}>
                          {d.district}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">({d.state})</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-900 font-extrabold">{d.count.toLocaleString()}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800">
                          {d.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Bar Fill */}
                    <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden relative p-0.5">
                      <div
                        style={{ width: `${widthPercent}%` }}
                        className={`h-full rounded-full transition-all duration-500 ${
                          isHovered
                            ? 'bg-gradient-to-r from-teal-600 to-cyan-300'
                            : 'bg-gradient-to-r from-teal-500 to-cyan-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* ── VERTICAL PILLAR BAR CHART MODE (WITH HORIZONTAL SCROLL) ── */
            <div className="relative border border-slate-100 rounded-2xl bg-slate-50/40 p-4">
              <div className="overflow-x-auto pb-4 pt-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                <div
                  style={{ minWidth: `${Math.max(280, districts.length * 52)}px` }}
                  className="h-64 flex items-end justify-start gap-3 px-2"
                >
                  {districts.map((d, idx) => {
                    const heightPercent = Math.max(8, (d.count / maxDistrictCount) * 100);
                    const isHovered = hoveredDistrictIndex === idx;

                    return (
                      <div
                        key={`${d.state}-${d.district}-${idx}`}
                        onMouseEnter={() => setHoveredDistrictIndex(idx)}
                        onMouseLeave={() => setHoveredDistrictIndex(null)}
                        className="group relative flex flex-col items-center justify-end h-full flex-1 max-w-[60px] min-w-[36px] cursor-pointer"
                      >
                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-12 z-30 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-[11px] font-bold shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                            <div>{d.district} ({d.state})</div>
                            <div className="text-[10px] text-teal-400 font-extrabold">
                              {d.count.toLocaleString()} students ({d.percentage}%)
                            </div>
                          </div>
                        )}

                        <span className="text-[10px] font-extrabold text-slate-700 mb-1 group-hover:scale-110 transition-transform">
                          {d.count >= 1000 ? `${(d.count / 1000).toFixed(1)}k` : d.count}
                        </span>

                        <div className="w-full bg-slate-200/80 rounded-t-xl overflow-hidden h-44 flex items-end p-0.5">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full rounded-t-lg transition-all duration-500 bg-gradient-to-t from-teal-500 to-cyan-400 group-hover:from-teal-600"
                          />
                        </div>

                        <div className="mt-2 text-center w-full">
                          <span
                            className="block text-[10px] font-bold truncate max-w-full text-slate-600 group-hover:text-slate-900"
                            title={`${d.district} (${d.state})`}
                          >
                            {d.district}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 text-right pt-1 font-semibold">
                ← Scroll horizontally to view all districts →
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-[11px] text-slate-500 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span>Ranked by student concentration descending.</span>
          <span className="font-bold text-slate-700">{districts.length} Districts</span>
        </div>
      </div>
    </div>
  );
};
