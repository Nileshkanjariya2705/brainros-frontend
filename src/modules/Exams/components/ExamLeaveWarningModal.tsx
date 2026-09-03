import React from 'react';
import { AlertTriangle, Clock, Send, X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface ExamLeaveWarningModalProps {
  isOpen: boolean;
  timeLeft: number | null;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  markedForReviewCount: number;
  onStay: () => void;
  onLeaveAndSubmit: () => void;
  isSubmitting?: boolean;
  title?: string;
  subtitle?: string;
  warningText?: string;
  stayButtonText?: string;
  leaveButtonText?: string;
  isTabCloseIntent?: boolean;
}

const formatTimer = (totalSeconds: number | null) => {
  if (totalSeconds === null) return '00:00:00';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const ExamLeaveWarningModal: React.FC<ExamLeaveWarningModalProps> = ({
  isOpen,
  timeLeft,
  totalQuestions,
  answeredCount,
  unansweredCount,
  markedForReviewCount,
  onStay,
  onLeaveAndSubmit,
  isSubmitting = false,
  title = 'Exam in Progress',
  subtitle = 'Leaving may submit/end your exam',
  warningText,
  stayButtonText = 'Stay in Exam',
  leaveButtonText = 'Leave & Submit Exam',
  isTabCloseIntent = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-rose-200 bg-white p-6 sm:p-7 shadow-2xl text-slate-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/50">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                {title}
                {isTabCloseIntent && (
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[9px] font-black uppercase text-white tracking-wider animate-pulse">
                    Tab Close Alert
                  </span>
                )}
              </h3>
              <p className="text-[11px] font-semibold text-rose-600">
                {subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onStay}
            disabled={isSubmitting}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Timer Notice (Timer does NOT pause) */}
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-2.5 text-xs text-indigo-950 font-bold">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-indigo-600 shrink-0" />
            <span>Time Remaining (Timer Active):</span>
          </div>
          <span className="font-mono text-sm font-black tabular-nums text-indigo-700">
            {formatTimer(timeLeft)}
          </span>
        </div>

        {/* Description Warning */}
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs font-semibold text-amber-900 leading-relaxed">
          {warningText ||
            'Are you sure you want to leave the exam? Your examination is currently active. Choosing to leave will securely save your answers and finalize/submit your attempt.'}
        </div>

        {/* Progress Snapshot */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
            <span className="text-slate-400 block text-[10px] font-bold uppercase">
              Total Questions
            </span>
            <span className="text-lg font-black text-slate-900 mt-0.5 block">
              {totalQuestions}
            </span>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-3 border border-emerald-100">
            <span className="text-emerald-700 block text-[10px] font-bold uppercase">
              Answered
            </span>
            <span className="text-lg font-black text-emerald-800 mt-0.5 block">
              {answeredCount}
            </span>
          </div>
          <div className="rounded-2xl bg-rose-50 p-3 border border-rose-100">
            <span className="text-rose-700 block text-[10px] font-bold uppercase">
              Unanswered
            </span>
            <span className="text-lg font-black text-rose-800 mt-0.5 block">
              {unansweredCount}
            </span>
          </div>
          <div className="rounded-2xl bg-purple-50 p-3 border border-purple-100">
            <span className="text-purple-700 block text-[10px] font-bold uppercase">
              Marked for Review
            </span>
            <span className="text-lg font-black text-purple-800 mt-0.5 block">
              {markedForReviewCount}
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto font-bold"
            onClick={onStay}
            disabled={isSubmitting}
          >
            {stayButtonText}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            className="w-full sm:w-auto bg-rose-600 hover:bg-rose-700 text-white font-extrabold flex items-center justify-center gap-1.5 shadow-md shadow-rose-200"
            onClick={onLeaveAndSubmit}
            isLoading={isSubmitting}
          >
            <Send size={14} />
            <span>{leaveButtonText}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
