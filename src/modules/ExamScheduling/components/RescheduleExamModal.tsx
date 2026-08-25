import React, { useState, useEffect } from 'react';
import { X, RotateCcw, CheckCircle2, AlertCircle, Globe } from 'lucide-react';
import { useRescheduleExamAPI } from '../services/examScheduling.service';
import type { ExamScheduleItem } from '../types/examScheduling.types';
import Button from '@/components/ui/Button';

interface RescheduleExamModalProps {
  schedule: ExamScheduleItem | null;
  isOpen: boolean;
  onClose: () => void;
  onRescheduled?: () => void;
}

export const RescheduleExamModal: React.FC<RescheduleExamModalProps> = ({
  schedule,
  isOpen,
  onClose,
  onRescheduled,
}) => {
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { rescheduleExamAPI, isLoading } = useRescheduleExamAPI();

  useEffect(() => {
    if (!isOpen || !schedule) return;

    try {
      const s = new Date(schedule.startTime);
      const e = new Date(schedule.endTime);

      setStartDate(s.toISOString().split('T')[0]);
      setStartTime(s.toTimeString().slice(0, 5));
      setEndDate(e.toISOString().split('T')[0]);
      setEndTime(e.toTimeString().slice(0, 5));
      setTimezone(schedule.timezone || 'Asia/Kolkata');
      setReason('');
      setErrorMsg(null);
    } catch {
      // ignore
    }
  }, [isOpen, schedule]);

  if (!isOpen || !schedule) return null;

  const handleReschedule = async () => {
    setErrorMsg(null);

    if (!startDate || !startTime || !endDate || !endTime) {
      setErrorMsg('Please provide complete start and end date/time.');
      return;
    }

    const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endISO = new Date(`${endDate}T${endTime}:00`).toISOString();

    if (new Date(startISO) >= new Date(endISO)) {
      setErrorMsg('New start time must be strictly before new end time.');
      return;
    }

    const { error } = await rescheduleExamAPI(schedule.id, {
      startTime: startISO,
      endTime: endISO,
      timezone,
      reason: reason.trim() || undefined,
    });

    if (error) {
      setErrorMsg(typeof error === 'string' ? error : 'Failed to reschedule exam.');
      return;
    }

    onRescheduled?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-md shadow-amber-200">
              <RotateCcw size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Reschedule Exam Window
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Schedule ID: {schedule.id.slice(0, 8)}...
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

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* New Live Window Inputs */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">New Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">New Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">New End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">New End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Timezone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Globe size={14} className="text-indigo-600" />
              Canonical Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST +4:00)</option>
            </select>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Reschedule Reason (Audit Log)
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Shifted start time by 30 minutes due to maintenance."
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleReschedule}
            isLoading={isLoading}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200"
          >
            <CheckCircle2 size={16} />
            <span>Update Schedule</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
