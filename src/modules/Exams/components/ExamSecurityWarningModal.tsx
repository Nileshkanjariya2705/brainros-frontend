import React from 'react';
import { ShieldAlert, Maximize2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ExamSecurityWarningModalProps {
  isOpen: boolean;
  message: string;
  onDismiss: () => void;
  onReEnterFullscreen?: () => void;
  requiresFullscreen?: boolean;
}

export const ExamSecurityWarningModal: React.FC<ExamSecurityWarningModalProps> = ({
  isOpen,
  message,
  onDismiss,
  onReEnterFullscreen,
  requiresFullscreen = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-3 sm:p-4 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-rose-200 bg-white p-5 sm:p-6 md:p-8 shadow-2xl space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
          <ShieldAlert size={28} />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Security Policy Alert
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            {message || 'You have triggered an examination security policy signal.'}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-[11px] font-semibold text-amber-800 text-left">
          • Please remain focused on your test screen at all times.<br />
          • Repeated exits or tab switches are recorded and flagged for review.
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          {requiresFullscreen && onReEnterFullscreen ? (
            <Button
              onClick={() => {
                onReEnterFullscreen();
                onDismiss();
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 flex items-center justify-center gap-2"
            >
              <Maximize2 size={16} />
              <span>Re-enter Fullscreen</span>
            </Button>
          ) : (
            <Button
              onClick={onDismiss}
              className="w-full bg-slate-900 hover:bg-black text-white font-black text-xs py-3"
            >
              I Understand & Resume Test
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
