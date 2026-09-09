import React from 'react';
import cn from 'classnames';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rounded',
  className,
  ...props
}) => {
  const variantStyles = {
    rectangular: 'rounded-none',
    circular: 'rounded-full',
    rounded: 'rounded-xl',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200/80 dark:bg-slate-700/80',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC = () => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-6 w-16" />
    </div>
    <Skeleton className="h-8 w-36" />
    <Skeleton className="h-3 w-full" />
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-8 w-24" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonKpiGrid: React.FC<{ count?: number; cols?: string }> = ({
  count = 4,
  cols = 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
}) => (
  <div className={`grid gap-3.5 sm:gap-4 ${cols}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton variant="circular" className="h-8 w-8" />
        </div>
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-3 w-32" />
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC<{ heightClass?: string }> = ({
  heightClass = 'h-64 sm:h-72',
}) => (
  <div className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
    <div className="flex items-center justify-between">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>
      <Skeleton className="h-8 w-28 rounded-xl" />
    </div>
    <div className={`w-full flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-100 ${heightClass}`}>
      {Array.from({ length: 8 }).map((_, i) => {
        const heights = ['h-24', 'h-40', 'h-32', 'h-48', 'h-36', 'h-56', 'h-44', 'h-60'];
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <Skeleton className={`w-full rounded-t-lg ${heights[i % heights.length]}`} />
            <Skeleton className="h-2.5 w-6" />
          </div>
        );
      })}
    </div>
  </div>
);

export const DashboardMainContentSkeleton: React.FC = () => (
  <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
    {/* Banner placeholder */}
    <div className="h-36 sm:h-44 rounded-2xl sm:rounded-3xl bg-slate-200/70 animate-pulse border border-slate-200" />
    {/* KPI cards placeholder */}
    <SkeletonKpiGrid count={4} />
    {/* Grid of chart and side section */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <SkeletonChart />
      </div>
      <div>
        <SkeletonTable rows={4} />
      </div>
    </div>
  </div>
);

export default Skeleton;

