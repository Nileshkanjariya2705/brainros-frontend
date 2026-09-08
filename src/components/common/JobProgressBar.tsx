import React from 'react';
import type { JobStatus } from '@/hooks/useJobProgress';

export interface JobProgressBarProps {
  status?: JobStatus;
  current?: number;
  total?: number;
  percentage?: number;
  stage?: string;
  message?: string;
  errorCode?: string;
  resultSummary?: Record<string, any>;
  showDetails?: boolean;
  className?: string;
  onRetry?: () => void;
  title?: string;
}

export const JobProgressBar: React.FC<JobProgressBarProps> = ({
  status = 'PROCESSING',
  current = 0,
  total = 0,
  percentage = 0,
  stage,
  message,
  errorCode,
  resultSummary,
  showDetails = true,
  className = '',
  onRetry,
  title,
}) => {
  const isIndeterminate = (!total || total <= 0) && status === 'PROCESSING';
  const clampedPct = Math.min(100, Math.max(0, Math.round(percentage || 0)));

  // Status color badges & bar themes
  const getStatusBadge = () => {
    switch (status) {
      case 'QUEUED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500 animate-ping" />
            Queued
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-indigo-500 animate-pulse" />
            Processing
          </span>
        );
      case 'RETRYING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-orange-500 animate-bounce" />
            Retrying
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="5 13l4 4L19 7" />
            </svg>
            Completed
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
            <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="6 18L18 6M6 6l12 12" />
            </svg>
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Idle
          </span>
        );
    }
  };

  const getBarColor = () => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-500';
      case 'FAILED':
        return 'bg-rose-500';
      case 'RETRYING':
        return 'bg-orange-500';
      case 'QUEUED':
        return 'bg-amber-400';
      default:
        return 'bg-indigo-600 dark:bg-indigo-500';
    }
  };

  return (
    <div className={`w-full p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all ${className}`}>
      {/* Header Title & Status Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {title && <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h4>}
          {stage && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Stage: {stage}
            </span>
          )}
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Message Label */}
      {message && (
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 truncate">
          {message}
        </p>
      )}

      {/* Progress Bar Container */}
      <div
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : clampedPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={title || stage || message || 'Job Progress'}
        className="relative w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden"
      >
        {isIndeterminate ? (
          <div className="absolute inset-y-0 left-0 w-1/3 bg-indigo-500 rounded-full animate-indeterminate" />
        ) : (
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${getBarColor()}`}
            style={{ width: `${clampedPct}%` }}
          />
        )}
      </div>

      {/* Details Row: Counter & Percentage */}
      {showDetails && (
        <div className="flex items-center justify-between mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div>
            {total > 0 ? (
              <span>
                {current.toLocaleString()} / {total.toLocaleString()} processed
              </span>
            ) : status === 'COMPLETED' ? (
              <span>100% completed</span>
            ) : status === 'FAILED' ? (
              <span className="text-rose-600 dark:text-rose-400">{errorCode || 'Processing error'}</span>
            ) : (
              <span>Processing...</span>
            )}
          </div>
          <div>{clampedPct}%</div>
        </div>
      )}

      {/* Error & Retry Banner */}
      {status === 'FAILED' && onRetry && (
        <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50">
          <span className="text-xs text-rose-700 dark:text-rose-300">
            Job failed. You can attempt to retry the operation.
          </span>
          <button
            type="button"
            onClick={onRetry}
            className="px-3 py-1 text-xs font-medium rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
          >
            Retry Job
          </button>
        </div>
      )}

      {/* Result Summary Metrics */}
      {status === 'COMPLETED' && resultSummary && Object.keys(resultSummary).length > 0 && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-xs grid grid-cols-2 gap-2">
          {Object.entries(resultSummary).map(([key, val]) => (
            <div key={key} className="flex flex-col">
              <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{String(val)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JobProgressBar;
