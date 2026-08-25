import React, { useState, useEffect, useCallback } from 'react';
import { X, ShieldAlert, ShieldCheck, Clock, RefreshCw, Server, Layers } from 'lucide-react';
import { useCheckExamAccessAPI } from '../services/examScheduling.service';
import type { StudentAccessCheckResult } from '../types/examScheduling.types';
import Button from '@/components/ui/Button';

interface ExamAccessCheckModalProps {
  examId: string;
  examTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExamAccessCheckModal: React.FC<ExamAccessCheckModalProps> = ({
  examId,
  examTitle,
  isOpen,
  onClose,
}) => {
  const [result, setResult] = useState<StudentAccessCheckResult | null>(null);
  const [deniedInfo, setDeniedInfo] = useState<{
    code?: string;
    message?: string;
    serverTime?: string;
    startTime?: string;
    endTime?: string;
  } | null>(null);

  const { checkExamAccessAPI, isLoading } = useCheckExamAccessAPI();

  const runCheck = useCallback(async () => {
    setResult(null);
    setDeniedInfo(null);

    const res = await checkExamAccessAPI(examId);
    if (res.data) {
      setResult(res.data);
    } else if (res.error) {
      const err = res.error as any;
      setDeniedInfo({
        code: err?.code || 'ACCESS_DENIED',
        message: err?.message || (typeof err === 'string' ? err : 'Student access denied.'),
        serverTime: err?.serverTime,
        startTime: err?.startTime,
        endTime: err?.endTime,
      });
    }
  }, [examId, checkExamAccessAPI]);

  useEffect(() => {
    if (isOpen) {
      runCheck();
    }
  }, [isOpen, runCheck]);

  if (!isOpen) return null;

  const formatSeconds = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${hrs}h ${mins}m ${s}s`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <Server size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Live Student Access Policy Simulator
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {examTitle || `Exam: ${examId.slice(0, 8)}...`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-10 space-y-3">
              <RefreshCw size={28} className="animate-spin text-indigo-600" />
              <p className="text-xs text-slate-500 font-semibold">
                Querying server-authoritative live window & activation status...
              </p>
            </div>
          ) : result ? (
            /* ALLOWED STATE */
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-emerald-950">
                    ACCESS GRANTED (200 OK)
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Exam is ACTIVE, Super Admin activated, and current server time is inside the
                    live window.
                  </p>
                </div>
              </div>

              {/* Time Remaining Metric */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Remaining Window Duration
                </span>
                <span className="text-2xl font-black text-indigo-600 font-mono block">
                  {formatSeconds(result.timeRemainingSeconds)}
                </span>
              </div>

              {/* Snapshot Details */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs space-y-2 font-mono">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Server Clock (UTC):</span>
                  <span className="font-bold text-slate-900">
                    {new Date(result.serverTime).toUTCString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Window Start:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(result.startTime).toUTCString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Window End:</span>
                  <span className="font-bold text-slate-900">
                    {new Date(result.endTime).toUTCString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 border-t border-slate-100 pt-2">
                  <span className="flex items-center gap-1">
                    <Layers size={13} className="text-indigo-600" />
                    Pinned ExamVersion:
                  </span>
                  <span className="font-bold text-indigo-700">{result.examVersionId}</span>
                </div>
              </div>
            </div>
          ) : deniedInfo ? (
            /* DENIED STATE */
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shrink-0">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-rose-950">ACCESS DENIED</h3>
                    <span className="rounded bg-rose-200 px-1.5 py-0.5 text-[10px] font-mono font-bold text-rose-900">
                      {deniedInfo.code}
                    </span>
                  </div>
                  <p className="text-xs text-rose-800 mt-0.5">{deniedInfo.message}</p>
                </div>
              </div>

              {/* Policy Explanation */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs text-slate-600 space-y-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock size={13} className="text-slate-500" />
                  Access Policy Rule Matrix
                </span>
                <p>
                  In Brainros, <strong>APPROVED ≠ ACTIVE</strong>. Even when an exam is approved and
                  within its scheduled hours, students are completely barred from entry until{' '}
                  <strong>Super Admin explicitly activates</strong> the exam schedule.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={runCheck}
            isLoading={isLoading}
            className="flex items-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Re-evaluate Access</span>
          </Button>

          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
