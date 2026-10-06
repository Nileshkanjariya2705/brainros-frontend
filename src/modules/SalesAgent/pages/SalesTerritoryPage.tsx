import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Globe,
  MapPin,
  Building2,
  Phone,
  Mail,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SalesAgentService } from '@/services/salesAgent.service';
import { salesAgentKeys } from '@/services/queryKeys';

export const SalesTerritoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedState, setSelectedState] = useState<string>('ALL');

  const { data: territoryData, isLoading } = useQuery({
    queryKey: salesAgentKeys.territory(),
    queryFn: () => SalesAgentService.getTerritory(),
  });

  const states = territoryData?.states || [];
  const districts = territoryData?.districts || [];
  const institutions = territoryData?.institutions || [];

  const filteredInstitutions = institutions.filter((inst) => {
    const matchesSearch =
      !search ||
      inst.name.toLowerCase().includes(search.toLowerCase()) ||
      inst.code.toLowerCase().includes(search.toLowerCase()) ||
      inst.city?.toLowerCase().includes(search.toLowerCase());
    const matchesState = selectedState === 'ALL' || inst.state === selectedState;
    return matchesSearch && matchesState;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Territory & Regional Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Explore registered schools, coaching centers, and regional coverage.
          </p>
        </div>
        <button
          onClick={() => navigate('/sales-agent/add-activity')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Building2 className="w-4 h-4" />
          Log Activity
        </button>
      </div>

      {/* Coverage Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Covered States</span>
            <Globe className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {states.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Districts</span>
            <MapPin className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {districts.length}
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Institutions</span>
            <Building2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {institutions.length}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search institution by name, code, or city..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
          >
            <option value="ALL">All States</option>
            {states.map((st) => (
              <option key={st.id} value={st.name}>
                {st.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Institutions Directory Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading territory directory...</div>
      ) : filteredInstitutions.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-sm">
          No institutions found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredInstitutions.map((inst) => (
            <div
              key={inst.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">
                    {inst.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {inst.code}
                  </span>
                </div>
                <div className="mt-2 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{inst.city || 'General'}, {inst.state || 'India'}</span>
                  </div>
                  {inst.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{inst.phone}</span>
                    </div>
                  )}
                  {inst.email && (
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{inst.email}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-3 h-3" />
                  Active
                </span>
                <button
                  onClick={() => navigate('/sales-agent/add-activity')}
                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
                >
                  Log Activity
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
