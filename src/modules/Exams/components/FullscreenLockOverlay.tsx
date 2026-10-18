import React from 'react';
import { ShieldAlert, Maximize, AlertTriangle, Lock } from 'lucide-react';
import Button from '@/components/ui/Button';

interface FullscreenLockOverlayProps {
  isOpen: boolean;
  onEnterFullscreen: () => void;
  violationsCount?: number;
  examTitle?: string;
}

export const FullscreenLockOverlay: React.FC<FullscreenLockOverlayProps> = ({
  isOpen,
  onEnterFullscreen,
  violationsCount = 0,
  examTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-xl animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg rounded-3xl border-2 border-rose-500/30 bg-slate-900 p-6 sm:p-8 text-center text-white shadow-2xl shadow-rose-950/50 space-y-6">
        {/* Pulsing Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/10 text-rose-500 ring-8 ring-rose-500/10 animate-pulse">
          <ShieldAlert size={42} />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase tracking-wider">
            <Lock size={12} />
            <span>Anti-Cheating Lockdown Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Fullscreen Mode Enforced
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-md mx-auto">
            {examTitle ? <span className="font-bold text-white block mb-1">{examTitle}</span> : null}
            To protect examination integrity, this test must be taken in Fullscreen Mode. You cannot continue or interact with the test outside fullscreen until your exam is submitted.
          </p>
        </div>

        {/* Rules & Violation Notice */}
        <div className="rounded-2xl border border-rose-500/20 bg-rose-950/30 p-4 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 text-rose-400 font-bold">
            <AlertTriangle size={15} />
            <span>Strict Examination Rules:</span>
          </div>
          <ul className="text-slate-300 space-y-1.5 pl-5 list-disc text-[11px] leading-relaxed">
            <li>You cannot exit fullscreen until your test is finalized and submitted.</li>
            <li>Pressing Esc or switching tabs is recorded in your live proctor log.</li>
            <li>Repeated exits trigger automated flags and may auto-submit your test.</li>
          </ul>
          {violationsCount > 0 && (
            <div className="mt-2 pt-2 border-t border-rose-500/20 flex items-center justify-between text-xs font-bold text-amber-300">
              <span>Recorded Security Signals:</span>
              <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
                {violationsCount} {violationsCount === 1 ? 'violation' : 'violations'}
              </span>
            </div>
          )}
        </div>

        {/* Primary Action Button */}
        <div className="pt-2">
          <Button
            type="button"
            onClick={onEnterFullscreen}
            className="w-full bg-gradient-to-r from-rose-600 via-rose-500 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-black text-sm py-3.5 rounded-2xl shadow-lg shadow-rose-900/40 flex items-center justify-center gap-2.5 transition-all transform hover:scale-[1.02]"
          >
            <Maximize size={18} />
            <span>Return to Fullscreen & Resume Examination</span>
          </Button>
          <p className="text-[11px] text-slate-400 mt-2.5">
            Fullscreen will be automatically released upon final test submission.
          </p>
        </div>
      </div>
    </div>
  );
};
export default FullscreenLockOverlay;
