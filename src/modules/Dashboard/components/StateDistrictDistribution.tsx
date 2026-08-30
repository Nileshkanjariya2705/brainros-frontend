import React, { useState } from 'react';
import { MapPin, Search, Compass, Building } from 'lucide-react';
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
}

export const StateDistrictDistribution: React.FC<StateDistrictDistributionProps> = ({
  stateData,
  districtData,
  selectedState,
  onSelectState,
  isLoadingStates,
  isLoadingDistricts,
}) => {
  const [stateSearch, setStateSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');

  const states = (stateData?.data || []).filter((s) =>
    s.state.toLowerCase().includes(stateSearch.toLowerCase()),
  );
  const districts = (districtData?.data || []).filter((d) =>
    d.district.toLowerCase().includes(districtSearch.toLowerCase()),
  );

  const maxStateCount = Math.max(...(stateData?.data || []).map((s) => s.count), 1);
  const maxDistrictCount = Math.max(...(districtData?.data || []).map((d) => d.count), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── State-wise Registrations ────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  State-wise Student Registrations
                </h3>
                <p className="text-[11px] text-slate-500">
                  Total student geographic distribution across Indian states.
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search states..."
              value={stateSearch}
              onChange={(e) => setStateSearch(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
            />
          </div>

          {/* States List */}
          {isLoadingStates ? (
            <div className="space-y-2 py-4">
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ) : states.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No state registration data.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {states.map((s) => {
                const isSelected = selectedState === s.state;
                const widthPercent = Math.max(5, (s.count / maxStateCount) * 100);

                return (
                  <div
                    key={s.state}
                    onClick={() => onSelectState && onSelectState(isSelected ? '' : s.state)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-slate-800">{s.state}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-extrabold">{s.count} students</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                          {s.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Fill */}
                    <div className="w-full h-2 rounded-full bg-slate-200/70 overflow-hidden">
                      <div
                        style={{ width: `${widthPercent}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span>Click any state to drill down into districts.</span>
          <span className="font-bold text-slate-700">{states.length} Active States</span>
        </div>
      </div>

      {/* ── District-wise Registrations ────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Building className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  District-wise Breakdown {selectedState ? `(${selectedState})` : ''}
                </h3>
                <p className="text-[11px] text-slate-500">
                  City and municipal district level distribution.
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search districts..."
              value={districtSearch}
              onChange={(e) => setDistrictSearch(e.target.value)}
              className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
            />
          </div>

          {/* District List */}
          {isLoadingDistricts ? (
            <div className="space-y-2 py-4">
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
              <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            </div>
          ) : districts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No district registration records found.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
              {districts.map((d) => {
                const widthPercent = Math.max(5, (d.count / maxDistrictCount) * 100);

                return (
                  <div
                    key={`${d.state}-${d.district}`}
                    className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-extrabold">{d.district}</span>
                        <span className="text-[10px] text-slate-400">({d.state})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800 font-bold">{d.count} students</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-100 text-teal-800">
                          {d.percentage}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Fill */}
                    <div className="w-full h-2 rounded-full bg-slate-200/70 overflow-hidden">
                      <div
                        style={{ width: `${widthPercent}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span>Ranked by student enrollment concentration.</span>
          <span className="font-bold text-slate-700">{districts.length} Recorded Districts</span>
        </div>
      </div>
    </div>
  );
};
