import React, { useState } from 'react';
import { UserCheck, Search, Phone, Mail, ChevronLeft, ChevronRight, Briefcase } from 'lucide-react';
import type { SalesAgentPerformanceItem } from '../services/superAdminDashboard.service';

interface SalesAgentPerformanceTableProps {
  data?: {
    data: SalesAgentPerformanceItem[];
    totalCount: number;
    meta?: { page: number; limit: number; pages: number };
  };
  isLoading?: boolean;
  onSearchChange?: (search: string) => void;
  page?: number;
  onPageChange?: (page: number) => void;
}

export const SalesAgentPerformanceTable: React.FC<SalesAgentPerformanceTableProps> = ({
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

  const agents = data?.data || [];
  const meta = data?.meta || { page: 1, limit: 20, pages: 1 };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-600">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Sales Agent & Partner Performance
            </h3>
            <p className="text-xs text-slate-500">
              Assigned leads, conversion velocity, revenue contributions, and Average Order Value
              (AOV).
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search sales agents..."
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
              <th className="pb-3 px-3">Sales Agent</th>
              <th className="pb-3 px-3 text-center">Assigned Leads</th>
              <th className="pb-3 px-3 text-center">Converted</th>
              <th className="pb-3 px-3 text-center">Conversion %</th>
              <th className="pb-3 px-3 text-center">Settled Deals</th>
              <th className="pb-3 px-3 text-right">Revenue Generated</th>
              <th className="pb-3 px-3 text-right">Avg. Order Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  Loading sales performance metrics...
                </td>
              </tr>
            ) : agents.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No sales agent accounts found.
                </td>
              </tr>
            ) : (
              agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                        <UserCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 block">{agent.name}</span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                          {agent.email && (
                            <span className="flex items-center gap-0.5">
                              <Mail className="h-2.5 w-2.5" />
                              {agent.email}
                            </span>
                          )}
                          {agent.phone && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="h-2.5 w-2.5" />
                              {agent.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                    {agent.assignedLeads}
                  </td>
                  <td className="py-3.5 px-3 text-center font-extrabold text-teal-700">
                    {agent.convertedLeads}
                  </td>
                  <td className="py-3.5 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-teal-50 text-teal-800 border border-teal-200">
                      {agent.conversionRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-center font-bold text-slate-800">
                    {agent.successfulSales}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className="font-black text-slate-900 text-xs">
                      ₹{agent.revenueGenerated.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className="font-extrabold text-indigo-600">
                      ₹{agent.averageOrderValue.toLocaleString('en-IN')}
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
            Page {meta.page} of {meta.pages} ({data?.totalCount ?? 0} agents)
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
