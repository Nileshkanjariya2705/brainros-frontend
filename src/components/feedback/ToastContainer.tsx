import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { toast, ToastItem, ToastType } from '@/utils/toast';

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe((updatedToasts) => {
      setToasts(updatedToasts);
    });
    return unsubscribe;
  }, []);

  if (toasts.length === 0) return null;

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />,
        };
      case 'error':
        return {
          container: 'bg-rose-50 border-rose-200 text-rose-900',
          icon: <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />,
        };
      case 'warning':
        return {
          container: 'bg-amber-50 border-amber-200 text-amber-900',
          icon: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />,
        };
      case 'info':
      default:
        return {
          container: 'bg-indigo-50 border-indigo-200 text-indigo-900',
          icon: <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />,
        };
    }
  };

  return (
    <div
      aria-live="polite"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((item) => {
        const style = getToastStyles(item.type);
        return (
          <div
            key={item.id}
            role="alert"
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${style.container}`}
          >
            <div className="flex items-start gap-3">
              {style.icon}
              <p className="text-sm font-medium leading-relaxed">{item.message}</p>
            </div>
            <button
              onClick={() => toast.dismiss(item.id)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-lg transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
