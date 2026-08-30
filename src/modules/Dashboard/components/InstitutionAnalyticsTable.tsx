import React, { useState } from 'react';
import { Building2, Search, Users, Layers, ChevronLeft, ChevronRight, School } from 'lucide-react';
import type { InstitutionRegistrationItem } from '../services/superAdminDashboard.service';

interface InstitutionAnalyticsTableProps {
  data?: {
    data: InstitutionRegistrationItem[];
    totalCount: number;
    meta?: { page: number; limit: number; pages: number };
  };
  isLoading?: boolean;
  onSearchChange?: (search: string) => void;
  page?: number;
  onPageChange?: (page: number) => void;
}

export const InstitutionAnalyticsTable: React.FC<InstitutionAnalyticsTableProps> = ({
  data,
  isLoading,
  onSearchChange,
  page = 1,
  onPageChange,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    if (onSearchChange) onSearchChange(val);
  };

  const institutions = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 20, pages: 1 };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-purple-50 text-purple-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Institution-wise Registrations</h3>
            <p className="text-xs text-slate-500">
              Student distribution across coaching institutes, colleges, and schools.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search institutions..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-3 py-2 text-slate-800 focus:bg-white focus:border-indigo-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Table */}
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
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  Loading institutional analytics...
                </td>
              </tr>
            ) : institutions.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No institution records match the current filters.
                </td>
              </tr>
            ) : (
              institutions.map((inst, index) => (
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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                      <Users className="h-3 w-3" />
                      {inst.studentCount}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {meta.pages > 1 && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-bold text-slate-600">
          <span>
            Page {meta.page} of {meta.pages} ({data?.totalCount ?? 0} institutions)
          </span>
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
        </div>
      )}
    </div>
  );
};
