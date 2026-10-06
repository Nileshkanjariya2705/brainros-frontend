import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Trophy,
  DollarSign,
  CalendarDays,
  Building2,
  Sparkles,
} from 'lucide-react';
import { SalesTargetService } from '@/services/salesTarget.service';
import { salesAgentKeys } from '@/services/queryKeys';

export const SalesTargetsPage: React.FC = () => {
  const { data: currentTarget } = useQuery({
    queryKey: salesAgentKeys.currentTarget(),
    queryFn: () => SalesTargetService.getCurrentTarget(),
  });

  const { data: leaderboard } = useQuery({
    queryKey: salesAgentKeys.leaderboard(),
    queryFn: () => SalesTargetService.getLeaderboard(),
  });

  const targets = (currentTarget?.targets as any) || {
    visits: { target: 30, achieved: 15, progress: 50 },
    institutions: { target: 5, achieved: 3, progress: 60 },
    revenue: { target: 300000, achieved: 180000, progress: 60 },
  };

  const overallAttainment = currentTarget?.overallAttainment || 58;
  const commissionEarned = currentTarget?.commissionEarned || 14400;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Targets, Quotas & Commissions
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Review your monthly milestone progress, calculated performance commissions, and team rankings.
        </p>
      </div>

      {/* Top Banner: Overall Attainment & Commission */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attainment Card */}
        <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl space-y-4 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              {currentTarget?.periodKey || 'Current Period'} Target Cycle
            </span>
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            <div>
              <span className="text-xs uppercase tracking-wider text-blue-200 font-semibold">
                Overall Quota Attainment
              </span>
              <div className="text-4xl sm:text-5xl font-extrabold mt-1">
                {overallAttainment}%
              </div>
              <p className="text-xs text-blue-100 mt-2">
                Across field visits, completed demos, and onboarded partner institutions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur border border-white/20 space-y-1">
              <span className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
                Accrued Commission
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-yellow-300">
                ₹{commissionEarned.toLocaleString('en-IN')}
              </div>
              <span className="text-[11px] text-blue-100">
                Calculated at 8% standard payout rate
              </span>
            </div>
          </div>
        </div>

        {/* Quota Level Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Performance Tier</span>
            <Trophy className="w-5 h-5 text-amber-500" />
          </div>
          <div className="my-4">
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Gold Performer
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Top 10% in regional field execution and school conversions this quarter.
            </p>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs font-semibold text-amber-800 dark:text-amber-300">
            Next Tier: Platinum (85% Attainment)
          </div>
        </div>
      </div>

      {/* Target Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Field Visits */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Field Visits</span>
            <CalendarDays className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {targets.visits?.achieved || 0} / {targets.visits?.target || 30}
            </span>
            <span className="text-xs font-bold text-blue-600">{targets.visits?.progress || 0}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${targets.visits?.progress || 0}%` }} />
          </div>
        </div>

        {/* Institutions Onboarded */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Institutions</span>
            <Building2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">
              {targets.institutions.achieved} / {targets.institutions.target}
            </span>
            <span className="text-xs font-bold text-emerald-600">{targets.institutions.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${targets.institutions.progress}%` }} />
          </div>
        </div>

        {/* Revenue Closed */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Revenue</span>
            <DollarSign className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              ₹{(targets.revenue.achieved / 1000).toFixed(0)}k / ₹{(targets.revenue.target / 1000).toFixed(0)}k
            </span>
            <span className="text-xs font-bold text-purple-600">{targets.revenue.progress}%</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div className="bg-purple-600 h-full rounded-full" style={{ width: `${targets.revenue.progress}%` }} />
          </div>
        </div>
      </div>

      {/* Team Leaderboard */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Sales Representative Leaderboard
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Updated Real-Time</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="p-3.5">Rank</th>
                <th className="p-3.5">Agent Name</th>
                <th className="p-3.5">Total Visits</th>
                <th className="p-3.5">Deals Closed</th>
                <th className="p-3.5">Revenue Closed</th>
                <th className="p-3.5 text-right">Attainment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(leaderboard || []).map((agent) => (
                <tr key={agent.agentId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="p-3.5 font-extrabold text-slate-900 dark:text-white">
                    {agent.rank === 1 ? '🥇 #1' : agent.rank === 2 ? '🥈 #2' : agent.rank === 3 ? '🥉 #3' : `#${agent.rank}`}
                  </td>
                  <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
                    {agent.agentName}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">
                    {agent.totalVisits ?? 0}
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-400">
                    {agent.totalDeals}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-900 dark:text-white">
                    ₹{agent.revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                    {agent.attainmentRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
