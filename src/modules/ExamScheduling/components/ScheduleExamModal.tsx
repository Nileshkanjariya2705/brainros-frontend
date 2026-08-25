import React, { useState, useEffect } from 'react';
import { X, CalendarClock, CheckCircle2, AlertCircle, Clock, Layers, Globe } from 'lucide-react';
import { useScheduleExamAPI } from '../services/examScheduling.service';
import { useGetExamVersionsAPI } from '@/modules/ExamGenerator/services/examGenerator.service';
import type { ExamVersionItem } from '@/modules/ExamGenerator/types/examGenerator.types';
import Button from '@/components/ui/Button';

interface ScheduleExamModalProps {
  examId: string;
  examTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onScheduled?: () => void;
}

export const ScheduleExamModal: React.FC<ScheduleExamModalProps> = ({
  examId,
  examTitle,
  isOpen,
  onClose,
  onScheduled,
}) => {
  const [versions, setVersions] = useState<ExamVersionItem[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('13:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { getExamVersionsAPI, isLoading: isLoadingVersions } = useGetExamVersionsAPI();
  const { scheduleExamAPI, isLoading: isScheduling } = useScheduleExamAPI();

  useEffect(() => {
    if (!isOpen) return;

    // Set default tomorrow date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    setStartDate(dateStr);
    setEndDate(dateStr);
    setErrorMsg(null);

    getExamVersionsAPI(examId).then(({ data }) => {
      if (data && data.length > 0) {
        setVersions(data);
        // Default to first published or generated version
        const pub = data.find((v) => v.status === 'PUBLISHED') || data[0];
        setSelectedVersionId(pub.id);
      }
    });
  }, [isOpen, examId, getExamVersionsAPI]);

  if (!isOpen) return null;

  const handleSchedule = async () => {
    setErrorMsg(null);

    if (!selectedVersionId) {
      setErrorMsg('Please select an immutable ExamVersion.');
      return;
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      setErrorMsg('Please provide complete start and end date/time.');
      return;
    }

    const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endISO = new Date(`${endDate}T${endTime}:00`).toISOString();

    if (new Date(startISO) >= new Date(endISO)) {
      setErrorMsg('Start time must be strictly before end time.');
      return;
    }

    const { error } = await scheduleExamAPI(examId, {
      examVersionId: selectedVersionId,
      startTime: startISO,
      endTime: endISO,
      timezone,
    });

    if (error) {
      setErrorMsg(typeof error === 'string' ? error : 'Failed to schedule exam.');
      return;
    }

    onScheduled?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <CalendarClock size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Schedule Exam Live Window
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

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Critical Info Banner */}
          <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-xs text-amber-900 space-y-1.5">
            <span className="font-extrabold flex items-center gap-1.5 text-amber-950">
              <Clock size={14} className="text-amber-600" />
              Critical Security Policy (APPROVED ≠ ACTIVE)
            </span>
            <p className="text-slate-600 leading-relaxed">
              Scheduling links the exam to a fixed snapshot version and defines its live window.
              Students will <strong>NOT</strong> have access merely because the start time arrives.
              Explicit <strong>Super Admin Activation</strong> is mandatory.
            </p>
          </div>

          {/* ExamVersion Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-600" />
              Target Immutable ExamVersion *
            </label>
            {isLoadingVersions ? (
              <div className="h-10 rounded-xl bg-slate-100 animate-pulse" />
            ) : versions.length > 0 ? (
              <select
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                {versions.map((ver) => (
                  <option key={ver.id} value={ver.id}>
                    Version #{ver.versionNumber} ({ver.status} | {ver.totalQuestions} Questions)
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-xl border border-dashed border-rose-200 p-3 text-xs text-rose-600 bg-rose-50 font-medium">
                No generated versions found for this exam. Please generate an ExamVersion first.
              </div>
            )}
          </div>

          {/* Live Window Inputs */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Start Time</label>
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
                <label className="text-xs font-bold text-slate-700">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">End Time</label>
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button
            onClick={handleSchedule}
            isLoading={isScheduling}
            disabled={versions.length === 0}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
          >
            <CheckCircle2 size={16} />
            <span>Confirm & Schedule Exam</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
