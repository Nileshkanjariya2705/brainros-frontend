import React, { useState } from 'react';
import { TrendingUp, Calendar, Users, BarChart3, Flame } from 'lucide-react';
import type { DailyRegistrationsData } from '../services/superAdminDashboard.service';

interface DailyRegistrationsChartProps {
  data?: DailyRegistrationsData;
  isLoading?: boolean;
  activeRange?: string;
  onRangeChange?: (range: string) => void;
}

export const DailyRegistrationsChart: React.FC<DailyRegistrationsChartProps> = ({
  data,
  isLoading,
  activeRange = '30D',
  onRangeChange,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'BAR' | 'CUMULATIVE'>('BAR');

  const timeline = data?.timeline || [];
  const maxRegistrations = Math.max(...timeline.map((t) => t.registrations), 1);
  const maxCumulative = Math.max(...timeline.map((t) => t.cumulative), 1);

  // Peak registrations day
  const peakDay = React.useMemo(() => {
    if (timeline.length === 0) return null;
    let peak = timeline[0];
    for (const t of timeline) {
      if (t.registrations > peak.registrations) peak = t;
    }
    return peak;
  }, [timeline]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs animate-pulse space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded-md" />
        <div className="h-56 w-full bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900">Daily Student Registrations</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                LIVE DATABASE METRIC
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Chronological student acquisition trajectory and registration velocity.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setChartMode('BAR')}
              className={`px-2.5 py-1 rounded-lg transition ${
                chartMode === 'BAR'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Daily Volume
            </button>
            <button
              onClick={() => setChartMode('CUMULATIVE')}
              className={`px-2.5 py-1 rounded-lg transition ${
                chartMode === 'CUMULATIVE'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Cumulative Growth
            </button>
          </div>

          {/* Range Buttons */}
          {onRangeChange && (
            <div className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold">
              {(['7D', '30D', '90D', 'ALL'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => onRangeChange(r)}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    activeRange === r
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Period Total
            </span>
            <div className="text-xl font-black text-slate-900">
              {data?.totalRegistrations ?? 0} Students
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-teal-100 text-teal-700">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Daily Average
            </span>
            <div className="text-xl font-black text-teal-700">{data?.averageDaily ?? 0} / day</div>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Peak Day Volume
            </span>
            <div className="text-xl font-black text-rose-700">
              {peakDay?.registrations ?? 0} ({peakDay?.date || 'N/A'})
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Chart Area */}
      {timeline.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-50 border border-slate-100">
          <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
          <p className="text-xs font-bold text-slate-600">
            No registration activity in this period.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative pt-6 pb-2">
            <div className="flex items-end gap-1 sm:gap-1.5 h-48 w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
              {timeline.map((point, index) => {
                const value = chartMode === 'BAR' ? point.registrations : point.cumulative;
                const maxValue = chartMode === 'BAR' ? maxRegistrations : maxCumulative;
                const heightPercent = maxValue > 0 ? Math.max(6, (value / maxValue) * 100) : 6;
                const isHovered = hoveredIndex === index;

                return (
                  <div
                    key={point.date}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className="flex-1 min-w-[20px] max-w-[40px] flex flex-col items-center justify-end h-full group relative cursor-pointer"
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute -top-12 z-30 px-2.5 py-1.5 rounded-xl bg-slate-900 text-white text-[11px] font-bold shadow-lg pointer-events-none whitespace-nowrap animate-in fade-in duration-150">
                        <div className="text-[10px] text-slate-400 font-normal">{point.date}</div>
                        <div>
                          {point.registrations} new ({point.cumulative} total)
                        </div>
                      </div>
                    )}

                    {/* Bar Pillar */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        chartMode === 'BAR'
                          ? isHovered
                            ? 'bg-gradient-to-t from-indigo-700 to-indigo-500 shadow-md'
                            : point.registrations > 0
                              ? 'bg-gradient-to-t from-indigo-600 to-indigo-400 group-hover:from-indigo-500'
                              : 'bg-slate-200'
                          : isHovered
                            ? 'bg-gradient-to-t from-purple-700 to-purple-500 shadow-md'
                            : 'bg-gradient-to-t from-purple-600 to-purple-400 group-hover:from-purple-500'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Date Bounds */}
          <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 border-t border-slate-100 pt-2 px-1">
            <span>{timeline[0]?.date}</span>
            <span className="text-slate-600">Daily Timeline ({timeline.length} days)</span>
            <span>{timeline[timeline.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  );
};
