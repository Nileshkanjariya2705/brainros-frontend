import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Sparkles,
  Bell,
  BookOpen,
  FileText,
  Award,
} from 'lucide-react';
import { useScheduleExamAPI, useScheduleAdminExamAPI } from '../services/examScheduling.service';
import { useAxiosGet } from '@/hooks/useAxios';
import Button from '@/components/ui/Button';

interface ScheduleExamModalProps {
  examId?: string;
  examTitle?: string;
  examDuration?: number;
  examsList?: any[];
  onSelectExam?: (exam: any) => void;
  isOpen: boolean;
  onClose: () => void;
  onScheduled?: () => void;
}

export type AdminExamType = 'SPECIFIC_SUBJECT' | 'SPECIFIC_CHAPTER' | 'JEE_NEET_CET';

function calculateEndTime(startDateStr: string, startTimeStr: string, durationMinutes: number) {
  if (!startDateStr || !startTimeStr) {
    return { endDate: startDateStr, endTime: startTimeStr, endFormatted: '' };
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

  const displayFormatted = `${endDateFormatted} at ${endTimeFormatted}`;

  return { endDate: endDateFormatted, endTime: endTimeFormatted, endFormatted: displayFormatted };
}

export const ScheduleExamModal: React.FC<ScheduleExamModalProps> = ({
  examId: initialExamId,
  examTitle: initialExamTitle,
  examDuration: initialExamDuration = 180,
  isOpen,
  onClose,
  onScheduled,
}) => {
  const [getReq] = useAxiosGet();

  // Mode: Existing exam vs New Admin Exam Manager Flow
  const [examType, setExamType] = useState<AdminExamType>('SPECIFIC_SUBJECT');

  // Specific Subject / Chapter / Blueprint states
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [blueprints, setBlueprints] = useState<any[]>([]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('');

  const [totalQuestions, setTotalQuestions] = useState<number>(30);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  const [currentExamId, setCurrentExamId] = useState<string>(initialExamId || '');
  const [currentExamTitle, setCurrentExamTitle] = useState<string>(initialExamTitle || '');

  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { scheduleExamAPI, isLoading: isSchedulingExisting } = useScheduleExamAPI();
  const { scheduleAdminExamAPI, isLoading: isSchedulingAdmin } = useScheduleAdminExamAPI();

  const isLoading = isSchedulingExisting || isSchedulingAdmin;

  // Load Subjects & Blueprints on open
  useEffect(() => {
    if (!isOpen) return;

    // Reset default tomorrow start date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDateStr = tomorrow.toISOString().split('T')[0];
    setStartDate(defaultDateStr);
    setStartTime('10:00');
    setErrorMsg(null);

    if (initialExamId) {
      setCurrentExamId(initialExamId);
      setCurrentExamTitle(initialExamTitle || '');
    }

    // Fetch subjects
    getReq<any[]>('/academic/subjects').then(({ data }) => {
      if (data && Array.isArray(data)) {
        setSubjects(data);
        if (data.length > 0) setSelectedSubjectId(data[0].id);
      }
    });

    // Fetch blueprints
    getReq<any>('/admin/exam-manager/blueprints').then(({ data }) => {
      const bps = Array.isArray(data) ? data : data?.items || [];
      setBlueprints(bps);
      if (bps.length > 0) {
        setSelectedBlueprintId(bps[0].id);
        if (bps[0].totalQuestions) setTotalQuestions(bps[0].totalQuestions);
        if (bps[0].durationMinutes) setDurationMinutes(bps[0].durationMinutes);
      }
    });
  }, [isOpen, getReq]);

  // Load chapters dynamically when subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId('');
      return;
    }
    getReq<any[]>(`/academic/subjects/${selectedSubjectId}/chapters`).then(({ data }) => {
      if (data && Array.isArray(data)) {
        setChapters(data);
        if (data.length > 0) setSelectedChapterId(data[0].id);
      } else {
        setChapters([]);
        setSelectedChapterId('');
      }
    });
  }, [selectedSubjectId, getReq]);

  // When blueprint changes, auto-fill question count and duration
  const handleBlueprintChange = (blueprintId: string) => {
    setSelectedBlueprintId(blueprintId);
    const found = blueprints.find((b) => b.id === blueprintId);
    if (found) {
      if (found.totalQuestions) setTotalQuestions(found.totalQuestions);
      if (found.durationMinutes) setDurationMinutes(found.durationMinutes);
    }
  };

  if (!isOpen) return null;

  const effectiveDuration = initialExamId ? initialExamDuration : durationMinutes;

  // Dynamically calculate End Date & Time
  const calculatedEnd = calculateEndTime(
    startDate,
    startTime,
    effectiveDuration,
  );

  const handleSchedule = async () => {
    setErrorMsg(null);

    if (!startDate || !startTime) {
      setErrorMsg('Please select a valid start date and start time.');
      return;
    }

    const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();

    // If initialExamId is present, schedule existing exam
    if (initialExamId && currentExamId) {
      const endISO = new Date(
        new Date(startISO).getTime() + (effectiveDuration || 180) * 60 * 1000,
      ).toISOString();

      const payload: any = {
        startTime: startISO,
        endTime: endISO,
        timezone,
      };

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
      return;
    }

    // Otherwise, use New Admin Exam Manager Flow (3 Exam Types)
    if (examType === 'SPECIFIC_SUBJECT') {
      if (!selectedSubjectId) {
        setErrorMsg('Please select a subject.');
        return;
      }
      if (!totalQuestions || totalQuestions <= 0) {
        setErrorMsg('Please enter a valid question count.');
        return;
      }
      if (!durationMinutes || durationMinutes <= 0) {
        setErrorMsg('Please select a valid duration in minutes.');
        return;
      }
    } else if (examType === 'SPECIFIC_CHAPTER') {
      if (!selectedSubjectId) {
        setErrorMsg('Please select a subject.');
        return;
      }
      if (!selectedChapterId) {
        setErrorMsg('Please select a chapter.');
        return;
      }
      if (!totalQuestions || totalQuestions <= 0) {
        setErrorMsg('Please enter a valid question count.');
        return;
      }
      if (!durationMinutes || durationMinutes <= 0) {
        setErrorMsg('Please select a valid duration in minutes.');
        return;
      }
    } else if (examType === 'JEE_NEET_CET') {
      if (!selectedBlueprintId) {
        setErrorMsg('Please select an Exam Blueprint for JEE/NEET/CET.');
        return;
      }
    }

    const adminPayload = {
      examType:
        examType === 'JEE_NEET_CET'
          ? (blueprints.find((b) => b.id === selectedBlueprintId)?.examTarget?.name || 'JEE')
          : examType,
      subjectId: examType !== 'JEE_NEET_CET' ? selectedSubjectId : undefined,
      chapterId: examType === 'SPECIFIC_CHAPTER' ? selectedChapterId : undefined,
      blueprintId: examType === 'JEE_NEET_CET' ? selectedBlueprintId : undefined,
      totalQuestions: Number(totalQuestions),
      durationMinutes: Number(durationMinutes),
      startTime: startISO,
      timezone,
    };

    const { error } = await scheduleAdminExamAPI(adminPayload);

    if (error) {
      const msg =
        typeof error === 'string'
          ? error
          : (error as any)?.message
            ? Array.isArray((error as any).message)
              ? (error as any).message.join(', ')
              : (error as any).message
            : 'Failed to schedule exam. Insufficient question pool or invalid configuration.';
      setErrorMsg(msg);
      return;
    }

    onScheduled?.();
    onClose();
  };

  const activeDuration = effectiveDuration;
  const durationHours = Math.floor(activeDuration / 60);
  const durationMinsRemainder = activeDuration % 60;
  const formattedDurationText =
    durationHours > 0
      ? `${durationHours}h ${durationMinsRemainder > 0 ? `${durationMinsRemainder}m` : ''}`
      : `${activeDuration} mins`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200">
              <CalendarClock size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                Schedule Exam Flow
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {initialExamId
                  ? `Exam: ${currentExamTitle || initialExamId.slice(0, 8)}`
                  : 'Admin Exam Manager — Select Exam Type & Schedule'}
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

          {/* Broadcast Banner */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-3.5 text-xs text-indigo-950 flex items-start gap-2.5">
            <Bell size={16} className="text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-extrabold block">Async Student Broadcast</span>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Upon successful schedule, eligible students are automatically notified via async
                BullMQ background notifications.
              </p>
            </div>
          </div>

          {/* Exam Type Tabs (if scheduling new admin exam) */}
          {!initialExamId && (
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">
                1. Select Exam Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setExamType('SPECIFIC_SUBJECT')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                    examType === 'SPECIFIC_SUBJECT'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-sm ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <BookOpen size={18} className="mb-1 text-indigo-600" />
                  Specific Subject
                </button>

                <button
                  type="button"
                  onClick={() => setExamType('SPECIFIC_CHAPTER')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                    examType === 'SPECIFIC_CHAPTER'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-sm ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <FileText size={18} className="mb-1 text-indigo-600" />
                  Specific Chapter
                </button>

                <button
                  type="button"
                  onClick={() => setExamType('JEE_NEET_CET')}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold transition-all ${
                    examType === 'JEE_NEET_CET'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-sm ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Award size={18} className="mb-1 text-purple-600" />
                  JEE / NEET / CET
                </button>
              </div>
            </div>
          )}

          {/* Exam Type Specific Inputs */}
          {!initialExamId && (
            <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
              {/* Specific Subject / Chapter */}
              {(examType === 'SPECIFIC_SUBJECT' || examType === 'SPECIFIC_CHAPTER') && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Select Subject *</label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name} ({sub.code || 'Master'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {examType === 'SPECIFIC_CHAPTER' && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Select Chapter *</label>
                      <select
                        value={selectedChapterId}
                        onChange={(e) => setSelectedChapterId(e.target.value)}
                        disabled={chapters.length === 0}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                      >
                        {chapters.length === 0 ? (
                          <option value="">No chapters found for subject</option>
                        ) : (
                          chapters.map((ch) => (
                            <option key={ch.id} value={ch.id}>
                              {ch.chapterNumber ? `Ch ${ch.chapterNumber}: ` : ''}
                              {ch.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Number of Questions *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={500}
                        value={totalQuestions}
                        onChange={(e) => setTotalQuestions(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">
                        Select Duration (mins) *
                      </label>
                      <select
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value={30}>30 mins</option>
                        <option value={45}>45 mins</option>
                        <option value={60}>60 mins (1 hr)</option>
                        <option value={90}>90 mins (1.5 hrs)</option>
                        <option value={120}>120 mins (2 hrs)</option>
                        <option value={180}>180 mins (3 hrs)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* JEE / NEET / CET Blueprint Flow */}
              {examType === 'JEE_NEET_CET' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Select Exam Blueprint *</label>
                    <select
                      value={selectedBlueprintId}
                      onChange={(e) => handleBlueprintChange(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {blueprints.length === 0 ? (
                        <option value="">No blueprints loaded</option>
                      ) : (
                        blueprints.map((bp) => (
                          <option key={bp.id} value={bp.id}>
                            {bp.name} ({bp.totalQuestions || 90} Qs • {bp.durationMinutes || 180} mins)
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-xs text-purple-900 space-y-1">
                    <span className="font-extrabold block">Dynamic Blueprint Configuration</span>
                    <p className="text-[11px] text-purple-700">
                      Questions, subject distribution, and duration are determined dynamically from
                      the selected Exam Blueprint master.
                    </p>
                    <div className="flex gap-4 pt-1 font-bold">
                      <span>Questions: {totalQuestions}</span>
                      <span>Duration: {durationMinutes} mins</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Start Date & Start Time Input */}
          <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={14} className="text-indigo-600" />
                Starting Date & Time
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
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-black text-indigo-950 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Dynamic Auto-Calculated End Date/Time (No manual input) */}
          <div className="space-y-2 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={14} className="text-emerald-600" />
                Ending Date & Time (Calculated Automatically)
              </label>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg">
                Calculated dynamically
              </span>
            </div>

            <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 flex items-center justify-between">
              <span className="text-xs font-mono font-black text-emerald-950">
                {calculatedEnd.endFormatted || 'Select Start Date & Time'}
              </span>
              <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                +{activeDuration} mins
              </span>
            </div>
          </div>

          {/* Canonical Timezone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Globe size={14} className="text-indigo-600" />
              Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-indigo-500"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST +5:30)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
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
            isLoading={isLoading}
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
