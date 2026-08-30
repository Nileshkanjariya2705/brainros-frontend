import React from 'react';
import cn from 'classnames';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this section. Please try again.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-rose-100 bg-rose-50/40',
        className,
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-100/80 text-rose-600 flex items-center justify-center mb-4">
        <AlertTriangle size={26} />
      </div>
      <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{title}</h3>
      <p className="text-xs text-rose-700 font-medium max-w-md mt-1 mb-5">{message}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 border-slate-300 hover:bg-white"
        >
          <RefreshCw size={13} />
          <span>Try Again</span>
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
