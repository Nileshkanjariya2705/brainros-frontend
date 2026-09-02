import React from 'react';
import { Layers, ArrowRight, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ExamSessionConflictModalProps {
  isOpen: boolean;
  onTransferSession: () => void;
  onCloseTab: () => void;
  isTransferring?: boolean;
}

export const ExamSessionConflictModal: React.FC<ExamSessionConflictModalProps> = ({
  isOpen,
  onTransferSession,
  onCloseTab,
  isTransferring = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-amber-200 bg-white p-6 sm:p-8 shadow-2xl text-slate-900 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50 mb-4">
          <Layers size={28} />
        </div>

        <h3 className="text-lg font-black text-slate-900 tracking-tight">
          Active in Another Window
        </h3>

        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          Your examination attempt is already actively running in another browser tab, window, or
          device. Running multiple simultaneous sessions is prohibited to prevent conflicts and
          preserve test integrity.
        </p>

        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-left text-xs font-semibold text-amber-900 space-y-1">
          <p>• Only one window can submit answers at any given time.</p>
          <p>• You can transfer the active session to this window if needed.</p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full font-bold flex items-center justify-center gap-2"
            onClick={onCloseTab}
          >
            <XCircle size={15} />
            <span>Close This Window</span>
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
            onClick={onTransferSession}
            isLoading={isTransferring}
          >
            <span>Transfer Session Here</span>
            <ArrowRight size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
};
