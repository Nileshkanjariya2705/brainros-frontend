import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Globe,
  Sparkles,
  Bell,
} from 'lucide-react';
import { useScheduleExamAPI } from '../services/examScheduling.service';
import { useGetExamVersionsAPI } from '@/modules/ExamGenerator/services/examGenerator.service';
import type { ExamVersionItem } from '@/modules/ExamGenerator/types/examGenerator.types';
import Button from '@/components/ui/Button';

interface ScheduleExamModalProps {
  examId: string;
  examTitle?: string;
  examDuration?: number;
  examsList?: any[];
  onSelectExam?: (exam: any) => void;
  isOpen: boolean;
  onClose: () => void;
  onScheduled?: () => void;
}

/**
 * Calculates End Date & Time from Start Date, Start Time, and Duration in minutes
 */
function calculateEndTime(startDateStr: string, startTimeStr: string, durationMinutes: number) {
  if (!startDateStr || !startTimeStr) {
    return { endDate: startDateStr, endTime: startTimeStr };
  }

  const [hours, minutes] = startTimeStr.split(':').map(Number);
  const startObj = new Date(`${startDateStr}T00:00:00`);
  startObj.setHours(hours || 0, minutes || 0, 0, 0);

  const endObj = new Date(startObj.getTime() + (durationMinutes || 180) * 60 * 1000);

  const endYear = endObj.getFullYear();
  const endMonth = String(endObj.getMonth() + 1).padStart(2, '0');
  const endDay = String(endObj.getDate()).padStart(2, '0');
  const endDateFormatted = `${endYear}-${endMonth}-${endDay}`;

  const endHours = String(endObj.getHours()).padStart(2, '0');
  const endMinutes = String(endObj.getMinutes()).padStart(2, '0');
  const endTimeFormatted = `${endHours}:${endMinutes}`;

  return { endDate: endDateFormatted, endTime: endTimeFormatted };
}

export const ScheduleExamModal: React.FC<ScheduleExamModalProps> = ({
  examId: initialExamId,
  examTitle: initialExamTitle,
  examDuration: initialExamDuration = 180,
  examsList = [],
  onSelectExam,
  isOpen,
  onClose,
  onScheduled,
}) => {
  const [currentExamId, setCurrentExamId] = useState<string>(initialExamId);
  const [currentExamTitle, setCurrentExamTitle] = useState<string>(initialExamTitle || '');
  const [currentDuration, setCurrentDuration] = useState<number>(initialExamDuration);

  const [versions, setVersions] = useState<ExamVersionItem[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('13:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { getExamVersionsAPI } = useGetExamVersionsAPI();
  const { scheduleExamAPI, isLoading: isScheduling } = useScheduleExamAPI();

  // Helper to re-calculate end date/time
  const updateStartAndCalculateEnd = (
    newStartDate: string,
    newStartTime: string,
    duration: number,
  ) => {
    setStartDate(newStartDate);
    setStartTime(newStartTime);
    const calculated = calculateEndTime(newStartDate, newStartTime, duration);
    setEndDate(calculated.endDate);
    setEndTime(calculated.endTime);
  };

  useEffect(() => {
    if (!isOpen) return;

    setCurrentExamId(initialExamId);
    setCurrentExamTitle(initialExamTitle || '');
    setCurrentDuration(initialExamDuration || 180);

    // Set default tomorrow date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDateStr = tomorrow.toISOString().split('T')[0];
    const defaultStartTime = '10:00';

    updateStartAndCalculateEnd(defaultDateStr, defaultStartTime, initialExamDuration || 180);
    setErrorMsg(null);

    if (initialExamId) {
      getExamVersionsAPI(initialExamId).then(({ data }) => {
        if (data && data.length > 0) {
          setVersions(data);
          const pub = data.find((v) => v.status === 'PUBLISHED') || data[0];
          setSelectedVersionId(pub.id);
        } else {
          setVersions([]);
          setSelectedVersionId('');
        }
      });
    }
  }, [isOpen, initialExamId, initialExamTitle, initialExamDuration, getExamVersionsAPI]);

  const handleExamDropdownChange = (newId: string) => {
    setCurrentExamId(newId);
    const found = examsList.find((e) => e.id === newId);
    if (found) {
      setCurrentExamTitle(found.title);
      const dur = found.durationMinutes || 180;
      setCurrentDuration(dur);
      updateStartAndCalculateEnd(startDate, startTime, dur);
      onSelectExam?.(found);

      getExamVersionsAPI(newId).then(({ data }) => {
        if (data && data.length > 0) {
          setVersions(data);
          const pub = data.find((v) => v.status === 'PUBLISHED') || data[0];
          setSelectedVersionId(pub.id);
        } else {
          setVersions([]);
          setSelectedVersionId('');
        }
      });
    }
  };

  if (!isOpen) return null;

  const handleSchedule = async () => {
    setErrorMsg(null);

    if (!currentExamId) {
      setErrorMsg('Please select an examination to schedule.');
      return;
    }

    if (!startDate || !startTime || !endDate || !endTime) {
      setErrorMsg('Please provide a valid start date and start time.');
      return;
    }

    const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();
    const endISO = new Date(`${endDate}T${endTime}:00`).toISOString();

    if (new Date(startISO) >= new Date(endISO)) {
      setErrorMsg('Start time must be strictly before end time.');
      return;
    }

    const payload: any = {
      startTime: startISO,
      endTime: endISO,
      timezone,
    };
    if (selectedVersionId || versions[0]?.id) {
      payload.examVersionId = selectedVersionId || versions[0]?.id;
    }

    const { error } = await scheduleExamAPI(currentExamId, payload);

    if (error) {
      const msg =
        typeof error === 'string'
          ? error
          : (error as any)?.message
            ? Array.isArray((error as any).message)
              ? (error as any).message.join(', ')
              : (error as any).message
            : 'Failed to schedule exam.';
      setErrorMsg(msg);
      return;
    }

    onScheduled?.();
    onClose();
  };

  const durationHours = Math.floor(currentDuration / 60);
  const durationMinsRemainder = currentDuration % 60;
  const formattedDurationText =
    durationHours > 0
      ? `${durationHours}h ${durationMinsRemainder > 0 ? `${durationMinsRemainder}m` : ''}`
      : `${currentDuration} mins`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
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
                {currentExamTitle ||
                  `Exam: ${currentExamId ? currentExamId.slice(0, 8) + '...' : 'Select Exam'}`}
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

          {/* Student Notification Guarantee Banner */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
            <Bell size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold block">Automatic Student Broadcast</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Upon confirming schedule, instant notifications are automatically dispatched to all
                eligible students informing them of the test date and starting time.
              </p>
            </div>
          </div>

          {/* Optional Exam Selector if list provided */}
          {examsList.length > 1 && (
            <div className="space-y-1.5 bg-slate-50/70 p-3.5 rounded-2xl border border-slate-200">
              <label className="text-xs font-bold text-slate-700 block">Select Examination</label>
              <select
                value={currentExamId}
                onChange={(e) => handleExamDropdownChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
              >
                {examsList.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} ({exam.totalQuestions} Qs • {exam.durationMinutes} mins •{' '}
                    {exam.examTarget?.name || 'General'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 1. Start Date & Start Time (User Input) */}
          <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-600" />
                Select Start Date & Time
              </label>
              <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                Duration: {formattedDurationText}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Start Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    updateStartAndCalculateEnd(e.target.value, startTime, currentDuration)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) =>
                    updateStartAndCalculateEnd(startDate, e.target.value, currentDuration)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-black text-indigo-950 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Auto-Calculated End Date & Time Display */}
          <div className="space-y-2 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600" />
                Auto-Calculated End Window
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-lg">
                Calculated ({currentDuration} mins)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-emerald-800">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 bg-white/90 p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-emerald-800">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 bg-white/90 p-2.5 text-xs font-black text-emerald-950 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Immutable Version Selector (if available) */}
          {versions.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-600" />
                Target Exam Version
              </label>
              <select
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {versions.map((ver) => (
                  <option key={ver.id} value={ver.id}>
                    Version #{ver.versionNumber} ({ver.status} | {ver.totalQuestions} Questions)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 4. Timezone */}
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
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
          >
            <CheckCircle2 size={16} />
            <span>Confirm & Schedule Exam</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
