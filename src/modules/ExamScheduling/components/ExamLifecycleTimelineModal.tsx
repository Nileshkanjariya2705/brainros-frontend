import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  CheckCircle2,
  CalendarClock,
  Play,
  XCircle,
  Clock,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useGetExamLifecycleAPI } from '../services/examScheduling.service';
import type { ExamLifecycleHistoryItem } from '../types/examScheduling.types';
import Button from '@/components/ui/Button';

interface ExamLifecycleTimelineModalProps {
  examId: string;
  examTitle?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExamLifecycleTimelineModal: React.FC<ExamLifecycleTimelineModalProps> = ({
  examId,
  examTitle,
  isOpen,
  onClose,
}) => {
  const [history, setHistory] = useState<ExamLifecycleHistoryItem[]>([]);
  const { getExamLifecycleAPI, isLoading } = useGetExamLifecycleAPI();

  useEffect(() => {
    if (!isOpen) return;
    getExamLifecycleAPI(examId).then(({ data }) => {
      if (data) setHistory(data);
    });
  }, [isOpen, examId, getExamLifecycleAPI]);

  if (!isOpen) return null;

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'SUBMIT':
        return { icon: Play, bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'APPROVE':
        return { icon: ShieldCheck, bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'SCHEDULE':
        return { icon: CalendarClock, bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'ACTIVATE':
        return { icon: CheckCircle2, bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'CANCEL':
        return { icon: XCircle, bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      default:
        return { icon: Clock, bg: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <History size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Exam Lifecycle Audit Trail
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {examTitle || `Exam ID: ${examId.slice(0, 8)}...`}
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

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-slate-100" />
              ))}
            </div>
          ) : history.length > 0 ? (
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6">
              {history.map((item, idx) => {
                const badge = getActionBadge(item.action);
                const IconComponent = badge.icon;

                return (
                  <div key={item.id || idx} className="relative pl-6">
                    {/* Circle marker */}
                    <div className="absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full bg-white border-2 border-indigo-600 shadow-sm">
                      <IconComponent size={14} className="text-indigo-600" />
                    </div>

                    {/* Card */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 hover:border-indigo-200 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`rounded-lg px-2 py-0.5 text-xs font-black border ${badge.bg}`}
                          >
                            {item.action}
                          </span>
                          <span className="text-xs font-bold text-slate-700">
                            {item.fromStatus} → {item.toStatus}
                          </span>
                        </div>

                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {item.comment && (
                        <p className="text-xs text-slate-600 italic bg-white p-2 rounded-xl border border-slate-100">
                          "{item.comment}"
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          <span>
                            Performed by:{' '}
                            {item.performedBy?.email || item.performedById.slice(0, 8)}
                          </span>
                        </span>

                        {item.examVersion && (
                          <span className="font-mono font-bold text-indigo-700">
                            Version #{item.examVersion.versionNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-2">
              <History size={32} />
              <p className="text-xs">No lifecycle events recorded for this exam yet.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
