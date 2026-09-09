import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import Button from '@/components/ui/Button';

export interface SectionErrorProps {
  title?: string;
  message?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export const SectionError: React.FC<SectionErrorProps> = ({
  title = 'Unable to load section data',
  message,
  description,
  onRetry,
  className = '',
}) => {
  const displayMessage =
    description || message || 'A network error occurred while loading this section. Please try again.';
  return (
    <div
      className={`rounded-2xl border border-red-200/80 bg-red-50/50 p-6 text-center text-red-700 shadow-xs ${className}`}
    >
      <AlertTriangle className="mx-auto h-7 w-7 text-red-500 mb-2" />
      <h4 className="text-sm font-bold text-red-900">{title}</h4>
      <p className="mt-1 text-xs text-red-600 max-w-md mx-auto">{displayMessage}</p>
      {onRetry && (
        <div className="mt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 border-red-200 text-red-700 hover:bg-red-100"
          >
            <RotateCw size={13} />
            <span>Retry</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default SectionError;
