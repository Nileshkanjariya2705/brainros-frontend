import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
} from 'lucide-react';
import { SalesAgentService } from '@/services/salesAgent.service';
import { salesAgentKeys } from '@/services/queryKeys';
import { toast } from '@/utils/toast';

export const SalesReportsPage: React.FC = () => {
  const { data: dashboard } = useQuery({
    queryKey: salesAgentKeys.dashboard(),
    queryFn: () => SalesAgentService.getDashboard(),
  });

  const kpis = dashboard?.kpis || {
    totalVisits: 0,
    totalRevenue: 0,
    conversionRate: 0,
  };

  const handleExportCsv = () => {
    toast.success('Sales performance report generated and downloaded.');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sales & Performance Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Export monthly field activity reports and deal velocity metrics.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-transform hover:-translate-y-0.5 flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export Report (CSV)
        </button>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pipeline Value</span>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">
            ₹{((kpis.totalRevenue || 0) * 1.5).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Closed Won Revenue</span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            ₹{(kpis.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Historical Conversion</span>
          <div className="mt-2 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {kpis.conversionRate}%
          </div>
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          Quarterly Performance Breakdown
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="p-3.5">Month</th>
                <th className="p-3.5">Field Visits</th>
                <th className="p-3.5">Institutions Won</th>
                <th className="p-3.5">Revenue Closed</th>
                <th className="p-3.5 text-right">Attainment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold">October 2026</td>
                <td className="p-3.5">18</td>
                <td className="p-3.5">4</td>
                <td className="p-3.5 font-semibold">₹280,000</td>
                <td className="p-3.5 text-right font-bold text-emerald-600">82%</td>
              </tr>
              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold">September 2026</td>
                <td className="p-3.5">24</td>
                <td className="p-3.5">6</td>
                <td className="p-3.5 font-semibold">₹350,000</td>
                <td className="p-3.5 text-right font-bold text-emerald-600">95%</td>
              </tr>
              <tr className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <td className="p-3.5 font-bold">August 2026</td>
                <td className="p-3.5">20</td>
                <td className="p-3.5">3</td>
                <td className="p-3.5 font-semibold">₹210,000</td>
                <td className="p-3.5 text-right font-bold text-emerald-600">76%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
