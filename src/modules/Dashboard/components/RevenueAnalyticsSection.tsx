import React, { useState } from 'react';
import {
  IndianRupee,
  CreditCard,
  CheckCircle2,
  Clock,
  RotateCcw,
  TrendingUp,
  Package,
} from 'lucide-react';
import type { RevenueData } from '../services/superAdminDashboard.service';

interface RevenueAnalyticsSectionProps {
  data?: RevenueData;
  isLoading?: boolean;
}

export const RevenueAnalyticsSection: React.FC<RevenueAnalyticsSectionProps> = ({
  data,
  isLoading,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const summary = data?.summary || {
    totalRevenue: 0,
    currency: 'INR',
    currencySymbol: '₹',
    successfulTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    refundedAmount: 0,
    netRevenue: 0,
  };

  const timeline = data?.timeline || [];
  const products = data?.products || [];
  const gateways = data?.gateways || [];

  const maxDailyRevenue = Math.max(...timeline.map((t) => t.revenue), 1);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="h-24 bg-slate-100 rounded-2xl" />
          <div className="h-24 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">
                Platform Revenue & Payment Telemetry
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                DATABASE SOURCE OF TRUTH
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Direct billing statistics, successful settlements, and gateway reconciliation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
          <CreditCard className="h-4 w-4 text-slate-400" />
          <span>Currency: Indian Rupee (INR ₹)</span>
        </div>
      </div>

      {/* Revenue KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total & Net Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-emerald-300">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Gross Revenue
            </span>
            <IndianRupee className="h-4 w-4" />
          </div>
          <div className="text-3xl font-black tracking-tight">
            ₹{summary.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-emerald-300 font-bold flex items-center justify-between border-t border-emerald-800/60 pt-1.5">
            <span>Net: ₹{summary.netRevenue.toLocaleString('en-IN')}</span>
            <span className="text-emerald-400">{summary.successfulTransactions} orders</span>
          </div>
        </div>

        {/* Successful Transactions */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Settled Orders
            </span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-slate-900">{summary.successfulTransactions}</div>
          <p className="text-[11px] text-emerald-600 font-bold">100% Verified in Database</p>
        </div>

        {/* Pending & Failed */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Pending / Incomplete
            </span>
            <Clock className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-amber-600">{summary.pendingTransactions}</div>
          <p className="text-[11px] text-slate-500 font-semibold">
            {summary.failedTransactions} failed attempts
          </p>
        </div>

        {/* Refunded Amount */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Refunds Processed
            </span>
            <RotateCcw className="h-4 w-4" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            ₹{summary.refundedAmount.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-rose-500 font-semibold">Returned to source accounts</p>
        </div>
      </div>

      {/* Revenue Trend Timeline & Product Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Daily Revenue Velocity (₹)
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold">
              30-day chronological timeline
            </span>
          </div>

          {timeline.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No revenue data.</div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-end gap-1 h-36 w-full pt-4">
                {timeline.map((point, index) => {
                  const heightPercent =
                    maxDailyRevenue > 0 ? Math.max(5, (point.revenue / maxDailyRevenue) * 100) : 5;
                  const isHovered = hoveredIndex === index;

                  return (
                    <div
                      key={point.date}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="flex-1 min-w-[12px] flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    >
                      {isHovered && (
                        <div className="absolute -top-10 z-30 px-2 py-1 rounded-xl bg-slate-900 text-white text-[10px] font-bold shadow-lg pointer-events-none whitespace-nowrap">
                          {point.date}: ₹{point.revenue.toLocaleString('en-IN')}
                        </div>
                      )}
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-md transition-all duration-300 ${
                          isHovered
                            ? 'bg-emerald-600'
                            : point.revenue > 0
                              ? 'bg-emerald-500 hover:bg-emerald-600'
                              : 'bg-slate-200'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-1">
                <span>{timeline[0]?.date}</span>
                <span>{timeline[timeline.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>

        {/* Product / Course Revenue Breakdown */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-purple-600" />
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Top Test Series & Packages
            </h4>
          </div>

          <div className="space-y-2.5 max-h-40 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {products.map((prod) => (
              <div
                key={prod.name}
                className="p-2.5 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between text-xs"
              >
                <div className="truncate pr-2">
                  <span className="font-bold text-slate-900 block truncate">{prod.name}</span>
                  <span className="text-[10px] text-slate-400">{prod.count} units sold</span>
                </div>
                <span className="font-black text-slate-900 whitespace-nowrap">
                  ₹{prod.amount.toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>

          {/* Payment Gateways breakdown */}
          {gateways.length > 0 && (
            <div className="border-t border-slate-200/70 pt-2 flex flex-wrap gap-1.5">
              {gateways.map((g) => (
                <span
                  key={g.gateway}
                  className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600"
                >
                  {g.gateway}: {g.percentage}%
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
