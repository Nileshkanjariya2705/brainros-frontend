import React, { useState } from 'react';
import {
  IndianRupee,
  CreditCard,
  CheckCircle2,
  Calendar,
  RefreshCw,
  TrendingUp,
  Package,
  AlertTriangle,
} from 'lucide-react';
import type { RevenueData, MonthlyRevenueItem } from '../services/superAdminDashboard.service';

interface RevenueAnalyticsSectionProps {
  data?: RevenueData;
  isLoading?: boolean;
  isFetching?: boolean;
  isError?: boolean;
  error?: any;
  refetch?: () => void;
  selectedYear?: number;
  onYearChange?: (year: number) => void;
}

export const RevenueAnalyticsSection: React.FC<RevenueAnalyticsSectionProps> = ({
  data,
  isLoading,
  isFetching,
  isError,
  error,
  refetch,
  selectedYear,
  onYearChange,
}) => {
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

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

  const displayYear = data?.year || selectedYear || new Date().getFullYear();
  const totalRevenueVal = data?.totalRevenue ?? summary.totalRevenue;
  const revenueTillTodayVal = data?.revenueTillToday ?? summary.totalRevenue;
  const currentMonthRevVal = data?.currentMonthRevenue ?? 0;
  const currentMonthNameStr = data?.currentMonthName || 'Current Month';

  const defaultMonths: MonthlyRevenueItem[] = [
    { month: 1, monthName: 'January', amount: 0 },
    { month: 2, monthName: 'February', amount: 0 },
    { month: 3, monthName: 'March', amount: 0 },
    { month: 4, monthName: 'April', amount: 0 },
    { month: 5, monthName: 'May', amount: 0 },
    { month: 6, monthName: 'June', amount: 0 },
    { month: 7, monthName: 'July', amount: 0 },
    { month: 8, monthName: 'August', amount: 0 },
    { month: 9, monthName: 'September', amount: 0 },
    { month: 10, monthName: 'October', amount: 0 },
    { month: 11, monthName: 'November', amount: 0 },
    { month: 12, monthName: 'December', amount: 0 },
  ];

  const monthlyRevenue = data?.monthlyRevenue || defaultMonths;
  const availableYears = data?.availableYears || [2024, 2025, 2026, 2027];
  const products = data?.products || [];
  const gateways = data?.gateways || [];

  const maxMonthlyRevenue = Math.max(...monthlyRevenue.map((m) => m.amount), 1);

  // ── Section-level Loading State ──
  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="h-6 w-48 bg-slate-200 rounded-md" />
          <div className="h-8 w-28 bg-slate-200 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-100 rounded-2xl" />
          <div className="h-28 bg-slate-100 rounded-2xl" />
          <div className="h-28 bg-slate-100 rounded-2xl" />
          <div className="h-28 bg-slate-100 rounded-2xl" />
        </div>
        <div className="h-48 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  // ── Section-level Error State ──
  if (isError) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-6 shadow-xs text-center space-y-4">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h4 className="text-base font-bold text-slate-900">Unable to load revenue data.</h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          {error?.message || 'A network error or permission restriction prevented loading revenue statistics.'}
        </p>
        {refetch && (
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      {/* ── Header with Year Filter & Telemetry Info ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900">
                Revenue — {displayYear}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                AUTHORITATIVE POSTGRESQL SOURCE
              </span>
              {isFetching && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full animate-pulse">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Refreshing...
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Live financial telemetry, month-wise settlement tracking, and payment verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Year Filter Selector */}
          {onYearChange && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1">
              <Calendar className="h-4 w-4 text-slate-400 ml-1.5" />
              <select
                value={displayYear}
                onChange={(e) => onYearChange(Number(e.target.value))}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none pr-1 cursor-pointer py-1"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-slate-500">
            <CreditCard className="h-4 w-4 text-slate-400" />
            <span>INR (₹)</span>
          </div>
        </div>
      </div>

      {/* ── Revenue KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white space-y-2 shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-1/3 -translate-y-1/3 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-300 relative z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Total Revenue
            </span>
            <IndianRupee className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight relative z-10">
            ₹{totalRevenueVal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 font-medium border-t border-white/10 pt-1.5 relative z-10">
            Reporting Period ({displayYear})
          </p>
        </div>

        {/* Revenue Till Today */}
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
          <div className="flex items-center justify-between text-emerald-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Revenue Till Today
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950">
            ₹{revenueTillTodayVal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-700 font-semibold border-t border-emerald-200/60 pt-1.5">
            Actual Settled to Date
          </p>
        </div>

        {/* Current Month Revenue */}
        <div className="p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2">
          <div className="flex items-center justify-between text-indigo-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
              Current Month Revenue
            </span>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-indigo-950">
            ₹{currentMonthRevVal.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-indigo-700 font-semibold border-t border-indigo-200/60 pt-1.5">
            {currentMonthNameStr}
          </p>
        </div>

        {/* Settled Orders & Net Revenue */}
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Settled Orders
            </span>
            <Package className="h-4 w-4 text-slate-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900">
            {summary.successfulTransactions} <span className="text-xs font-semibold text-slate-500">Orders</span>
          </div>
          <p className="text-[11px] text-slate-600 font-bold border-t border-slate-200/60 pt-1.5 flex items-center justify-between">
            <span>Net: ₹{summary.netRevenue.toLocaleString('en-IN')}</span>
            {summary.refundedAmount > 0 && (
              <span className="text-rose-600">Refunds: ₹{summary.refundedAmount.toLocaleString('en-IN')}</span>
            )}
          </p>
        </div>
      </div>

      {/* ── Yearly Revenue Chart (Month-Wise) ── */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Yearly Revenue Chart — {displayYear}
            </h4>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Month-Wise Distribution (₹)
          </span>
        </div>

        {monthlyRevenue.every((m) => m.amount === 0) && totalRevenueVal === 0 ? (
          <div className="p-8 text-center text-xs font-bold text-slate-400 bg-white rounded-xl border border-slate-200/60">
            No revenue data available.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Bar Chart Container */}
            <div className="flex items-end gap-1.5 h-44 w-full pt-6 px-2">
              {monthlyRevenue.map((item, index) => {
                const heightPercent =
                  maxMonthlyRevenue > 0
                    ? Math.max(4, (item.amount / maxMonthlyRevenue) * 100)
                    : 4;
                const isHovered = hoveredMonthIndex === index;

                return (
                  <div
                    key={item.monthName}
                    onMouseEnter={() => setHoveredMonthIndex(index)}
                    onMouseLeave={() => setHoveredMonthIndex(null)}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer min-w-[16px]"
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-10 z-30 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-[10px] font-bold shadow-xl pointer-events-none whitespace-nowrap">
                        {item.monthName}: ₹{item.amount.toLocaleString('en-IN')}
                      </div>
                    )}

                    {/* Bar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isHovered
                          ? 'bg-emerald-600 shadow-md scale-x-105'
                          : item.amount > 0
                            ? 'bg-emerald-500 hover:bg-emerald-600'
                            : 'bg-slate-200'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Month Labels */}
            <div className="grid grid-cols-12 text-[10px] text-slate-500 font-bold text-center pt-1 border-t border-slate-200/60">
              {monthlyRevenue.map((item) => (
                <span key={item.monthName} className="truncate px-0.5">
                  {item.monthName.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Month-Wise Revenue List ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Month-Wise Revenue Breakdown — {displayYear}
          </h4>
          <span className="text-[11px] text-slate-400 font-semibold">12 Months</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {monthlyRevenue.map((item) => {
            const isCurrent =
              item.month === new Date().getMonth() + 1 &&
              displayYear === new Date().getFullYear();

            return (
              <div
                key={item.monthName}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between text-xs ${
                  isCurrent
                    ? 'bg-indigo-50/60 border-indigo-200 shadow-xs'
                    : 'bg-slate-50/70 border-slate-200/70 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{item.monthName}</span>
                    {isCurrent && (
                      <span className="px-1.5 py-0.2 text-[9px] font-black bg-indigo-100 text-indigo-800 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Month {item.month}</span>
                </div>

                <span
                  className={`font-black text-sm whitespace-nowrap ${
                    item.amount > 0 ? 'text-slate-900' : 'text-slate-400'
                  }`}
                >
                  ₹{item.amount.toLocaleString('en-IN')}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Top Packages & Payment Gateways Breakdown ── */}
      {(products.length > 0 || gateways.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          {/* Packages */}
          {products.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-purple-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Top Test Series & Packages
                </h4>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {products.map((prod) => (
                  <div
                    key={prod.name}
                    className="p-2 rounded-xl bg-white border border-slate-200/70 flex items-center justify-between text-xs"
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
            </div>
          )}

          {/* Gateways */}
          {gateways.length > 0 && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-2.5">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-sky-600" />
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Payment Gateway Settlement Ratio
                </h4>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {gateways.map((g) => (
                  <div
                    key={g.gateway}
                    className="p-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between gap-3 min-w-[140px] flex-1"
                  >
                    <span className="text-slate-900">{g.gateway}</span>
                    <span className="text-xs font-black text-indigo-600">{g.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RevenueAnalyticsSection;
