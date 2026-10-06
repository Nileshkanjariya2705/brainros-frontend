import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  Globe,
  Award,
} from 'lucide-react';
import { SalesAgentService } from '@/services/salesAgent.service';
import { salesAgentKeys } from '@/services/queryKeys';

export const SalesProfilePage: React.FC = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: salesAgentKeys.profile(),
    queryFn: () => SalesAgentService.getProfile(),
  });

  if (isLoading) {
    return <div className="p-12 text-center text-slate-400 text-sm">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shrink-0">
          {profile?.name?.charAt(0) || 'S'}
        </div>
        <div className="space-y-1.5 text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {profile?.name || 'Sales Representative'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              SALES_AGENT
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Brainros Field Sales Team • Member since {new Date(profile?.createdAt || Date.now()).toLocaleDateString()}
          </p>
          <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              {profile?.email}
            </span>
            {profile?.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                {profile?.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Territory & Scope */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
            <Globe className="w-5 h-5 text-blue-600" />
            <span>Assigned Territory</span>
          </div>
          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Primary Region</span>
              <span className="font-semibold">North & Central Zone</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Assigned States</span>
              <span className="font-semibold">Haryana, Punjab, Delhi NCR</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Commission Rate</span>
              <span className="font-semibold text-emerald-600">8.0% Standard Payout</span>
            </div>
          </div>
        </div>

        {/* Lifetime Activity Stats */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-bold text-base text-slate-900 dark:text-white">
            <Award className="w-5 h-5 text-indigo-600" />
            <span>Lifetime Performance</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <span className="text-xs text-slate-500">Total Field Visits</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {profile?.stats?.totalVisits || 0}
              </div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
              <span className="text-xs text-slate-500">Closed Orders</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {profile?.stats?.totalOrders || 0}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
