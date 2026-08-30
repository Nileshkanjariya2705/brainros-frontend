import React from 'react';
import { Percent, UserCheck, Award, CreditCard, Info } from 'lucide-react';
import type { ConversionRateData } from '../services/superAdminDashboard.service';

interface ConversionRateCardProps {
  data?: ConversionRateData;
  isLoading?: boolean;
}

export const ConversionRateCard: React.FC<ConversionRateCardProps> = ({ data, isLoading }) => {
  const funnel = data?.funnel || {
    totalRegistered: 0,
    attemptedExam: 0,
    attemptConversionRate: 0,
    purchasedPackage: 0,
    payingConversionRate: 0,
  };

  const salesLeads = data?.salesLeads || {
    totalLeads: 0,
    convertedLeads: 0,
    leadConversionRate: 0,
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded-md" />
        <div className="h-32 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">
              Platform Conversion Rate & Funnel
            </h3>
            <p className="text-xs text-slate-500">
              Student transition from free account to examination attempt and paid subscription.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black">
            {funnel.payingConversionRate}% Paid Conversion
          </span>
        </div>
      </div>

      {/* Funnel Pipeline Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
        {/* Step 1: Registered */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 relative">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Step 1: Onboarded
            </span>
            <UserCheck className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{funnel.totalRegistered}</div>
            <p className="text-[11px] text-slate-500 font-semibold">Total Registered Students</p>
          </div>
          <div className="text-[10px] text-slate-400 font-bold">100% Platform Baseline</div>
        </div>

        {/* Step 2: Attempted Exam */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 relative">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Step 2: Engaged</span>
            <Award className="h-4 w-4 text-purple-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{funnel.attemptedExam}</div>
            <p className="text-[11px] text-purple-700 font-bold">Attempted Mock / Official Exam</p>
          </div>
          <div className="text-[10px] text-purple-600 font-bold">
            {funnel.attemptConversionRate}% Engagement Velocity
          </div>
        </div>

        {/* Step 3: Paying Customer */}
        <div className="p-5 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3 relative">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Step 3: Converted
            </span>
            <CreditCard className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900">{funnel.purchasedPackage}</div>
            <p className="text-[11px] text-emerald-700 font-bold">Paid Package Subscribers</p>
          </div>
          <div className="text-[10px] text-emerald-600 font-bold">
            {funnel.payingConversionRate}% Final Conversion Rate
          </div>
        </div>
      </div>

      {/* Formula Documentation & Sales Funnel Footer */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-500">
          <Info className="h-4 w-4 text-indigo-500 shrink-0" />
          <span>
            <strong className="text-slate-700">Calculation Method: </strong>
            {data?.formulaUsed ||
              'Paying Conversion Rate = (Paying Students / Total Registered Students) * 100'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-slate-700 font-bold">
          <span>Sales Team Leads:</span>
          <span className="px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-800 text-[11px]">
            {salesLeads.convertedLeads} / {salesLeads.totalLeads} ({salesLeads.leadConversionRate}%)
          </span>
        </div>
      </div>
    </div>
  );
};
