import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  CalendarClock,
  CheckCircle2,
  AlertCircle,
  Clock,
  BookOpen,
  FileText,
  Award,
  Sliders,
  FileSpreadsheet,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import {
  useScheduleAdminExamAPI,
  useScheduleExamAPI,
  ScheduleAdminExamPayload,
} from '../services/examScheduling.service';
import { useAxiosGet } from '@/hooks/useAxios';
import { useQueryClient } from '@tanstack/react-query';
import { adminKeys, examKeys, academicCalendarKeys } from '@/services/queryKeys';
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

export type NewExamType = 'SPECIFIC_SUBJECT' | 'SPECIFIC_CHAPTER' | 'FULL_EXAM';
export type FullExamConfigMode = 'MANUAL' | 'BLUEPRINT';
export type FullExamTarget = 'JEE' | 'NEET' | 'CET';

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
  const queryClient = useQueryClient();

  // ── Step Navigation ────────────────────────────────────────────────────────
  // Step 1: Select Type | Step 2: Configure | Step 3: Review & Schedule
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // ── Step 1: Selected Exam Type ──────────────────────────────────────────────
  const [examType, setExamType] = useState<NewExamType>('SPECIFIC_SUBJECT');

  // ── Full Exam specific sub-choices ─────────────────────────────────────────
  const [fullExamTarget, setFullExamTarget] = useState<FullExamTarget>('NEET');
  const [fullExamConfigMode, setFullExamConfigMode] = useState<FullExamConfigMode>('MANUAL');

  // ── Form Fields ────────────────────────────────────────────────────────────
  const [examName, setExamName] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(30);
  const [duration, setDuration] = useState<number>(60);
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(4);
  const [negativeMarks, setNegativeMarks] = useState<number>(1);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');

  // ── Blueprint Choice ───────────────────────────────────────────────────────
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<string>('');
  const [selectedBlueprint, setSelectedBlueprint] = useState<any | null>(null);

  // ── Date & Time (End time is dynamic, non-editable) ─────────────────────────
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [timezone] = useState('Asia/Kolkata');

  // ── Master Data & Section Loaders ──────────────────────────────────────────
  const [examTargets, setExamTargets] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [blueprints, setBlueprints] = useState<any[]>([]);

  const [isTargetsLoading, setIsTargetsLoading] = useState(false);
  const [isSubjectsLoading, setIsSubjectsLoading] = useState(false);
  const [isChaptersLoading, setIsChaptersLoading] = useState(false);
  const [isBlueprintsLoading, setIsBlueprintsLoading] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scheduledSuccessData, setScheduledSuccessData] = useState<{
    examId: string;
    title: string;
  } | null>(null);

  const navigate = useNavigate();

  // ── API Hooks ──────────────────────────────────────────────────────────────
  const { scheduleAdminExamAPI, isLoading: isSchedulingAdmin } = useScheduleAdminExamAPI();
  const { scheduleExamAPI, isLoading: isSchedulingExisting } = useScheduleExamAPI();
  const isSubmitting = isSchedulingAdmin || isSchedulingExisting;

  // Initialize form when opened
  useEffect(() => {
    if (!isOpen) return;

    setCurrentStep(initialExamId ? 2 : 1);
    setErrorMsg(null);
    setScheduledSuccessData(null);

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow.toISOString().split('T')[0]);
    setStartTime('10:00');

    // Fetch Targets & Languages
    setIsTargetsLoading(true);
    getReq<any>('/auth/options').then(({ data }) => {
      setIsTargetsLoading(false);
      const opts = data?.data || data || {};
      if (opts.examTargets && Array.isArray(opts.examTargets)) {
        const ALLOWED = ['JEE', 'NEET', 'CET'];
        const filtered = opts.examTargets.filter((t: any) => ALLOWED.includes(t.name?.toUpperCase().trim()));
        setExamTargets(filtered);
        if (filtered.length > 0) {
          setSelectedTargetId(filtered[0].id);
        }
      }
      if (opts.languages && Array.isArray(opts.languages)) {
        setLanguages(opts.languages);
        const en = opts.languages.find((l: any) => l.code === 'EN' || l.name === 'English');
        if (en) setSelectedLanguageId(en.id);
        else if (opts.languages[0]) setSelectedLanguageId(opts.languages[0].id);
      }
    });

    // Fetch Subjects
    setIsSubjectsLoading(true);
    getReq<any[]>('/academic/subjects').then(({ data }) => {
      setIsSubjectsLoading(false);
      if (data && Array.isArray(data)) {
        setSubjects(data);
        if (data.length > 0) setSelectedSubjectId(data[0].id);
      }
    });

    // Fetch Blueprints
    setIsBlueprintsLoading(true);
    getReq<any>('/admin/exam-manager/blueprints').then(({ data }) => {
      setIsBlueprintsLoading(false);
      const bps = Array.isArray(data) ? data : data?.items || [];
      setBlueprints(bps);
    });
  }, [isOpen, initialExamId, getReq]);

  // Load chapters when selectedSubjectId changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setChapters([]);
      setSelectedChapterId('');
      return;
    }
    setIsChaptersLoading(true);
    getReq<any[]>(`/academic/subjects/${selectedSubjectId}/chapters`).then(({ data }) => {
      setIsChaptersLoading(false);
      if (data && Array.isArray(data)) {
        setChapters(data);
        if (data.length > 0) setSelectedChapterId(data[0].id);
      } else {
        setChapters([]);
        setSelectedChapterId('');
      }
    });
  }, [selectedSubjectId, getReq]);

  // Filter subjects for the selected target if target is chosen
  const filteredSubjects = useMemo(() => {
    if (!selectedTargetId) return subjects;
    const target = examTargets.find((t) => t.id === selectedTargetId);
    if (!target) return subjects;
    const matched = subjects.filter((s) => s.examTargetId === selectedTargetId);
    return matched.length > 0 ? matched : subjects;
  }, [subjects, selectedTargetId, examTargets]);

  // Ensure selectedSubjectId always belongs to the selectedTargetId (for Subject & Chapter exams)
  useEffect(() => {
    if (examType === 'FULL_EXAM') return;
    if (!selectedTargetId || subjects.length === 0) return;
    const targetSubjects = subjects.filter((s) => s.examTargetId === selectedTargetId);
    if (targetSubjects.length > 0) {
      const currentValid = targetSubjects.some((s) => s.id === selectedSubjectId);
      if (!currentValid) {
        setSelectedSubjectId(targetSubjects[0].id);
      }
    }
  }, [selectedTargetId, subjects, selectedSubjectId, examType]);

  // Auto-sync selectedTargetId when fullExamTarget changes in FULL_EXAM mode
  useEffect(() => {
    if (examType === 'FULL_EXAM' && examTargets.length > 0) {
      const matched = examTargets.find(
        (t) => t.name?.toUpperCase().trim() === fullExamTarget.toUpperCase().trim(),
      );
      if (matched && matched.id !== selectedTargetId) {
        setSelectedTargetId(matched.id);
      }
    }
  }, [examType, fullExamTarget, examTargets, selectedTargetId]);

  // Filter blueprints for selected target when in Full Exam mode
  const filteredBlueprints = useMemo(() => {
    if (examType !== 'FULL_EXAM') return blueprints;
    const targetSearch = fullExamTarget.toUpperCase();
    return blueprints.filter((b) => {
      const bTargetName = (b.exam?.examTarget?.name || b.name || '').toUpperCase();
      return bTargetName.includes(targetSearch);
    });
  }, [blueprints, examType, fullExamTarget]);

  // When filtered blueprints change or target changes, pick the first
  useEffect(() => {
    if (examType === 'FULL_EXAM' && fullExamConfigMode === 'BLUEPRINT') {
      const candidate = filteredBlueprints[0] || null;
      if (candidate) {
        setSelectedBlueprintId(candidate.id);
        setSelectedBlueprint(candidate);
        if (candidate.totalQuestions) setQuestionCount(candidate.totalQuestions);
        if (candidate.durationMinutes) setDuration(candidate.durationMinutes);
      } else {
        setSelectedBlueprintId('');
        setSelectedBlueprint(null);
      }
    }
  }, [filteredBlueprints, examType, fullExamConfigMode]);

  // Set default duration & question count based on examType
  useEffect(() => {
    if (examType === 'SPECIFIC_SUBJECT') {
      setQuestionCount(10);
      setDuration(60);
    } else if (examType === 'SPECIFIC_CHAPTER') {
      setQuestionCount(10);
      setDuration(45);
    } else if (examType === 'FULL_EXAM') {
      if (fullExamTarget === 'NEET') {
        setQuestionCount(20);
        setDuration(180);
      } else if (fullExamTarget === 'JEE') {
        setQuestionCount(15);
        setDuration(180);
      } else {
        setQuestionCount(15);
        setDuration(180);
      }
    }
  }, [examType, fullExamTarget]);

  // Effective duration for end time calculation
  const effectiveDuration = useMemo(() => {
    if (examType === 'FULL_EXAM' && fullExamConfigMode === 'BLUEPRINT' && selectedBlueprint?.durationMinutes) {
      return selectedBlueprint.durationMinutes;
    }
    return duration || 60;
  }, [examType, fullExamConfigMode, selectedBlueprint, duration]);

  // Dynamic automatic end time
  const calculatedEnd = useMemo(() => {
    return calculateEndTime(startDate, startTime, effectiveDuration);
  }, [startDate, startTime, effectiveDuration]);

  if (!isOpen) return null;

  // ── Step Navigation Handlers ───────────────────────────────────────────────
  const handleProceedToConfigure = (type: NewExamType) => {
    setExamType(type);
    setCurrentStep(2);
    setErrorMsg(null);
  };

  const handleProceedToReview = async () => {
    setErrorMsg(null);

    // Validation
    const nameToValidate = examName.trim() || getDefaultExamName();
    if (!nameToValidate) {
      setErrorMsg('Please enter an exam name.');
      return;
    }
    if (!startDate || !startTime) {
      setErrorMsg('Please select a valid start date and start time.');
      return;
    }
    if (!questionCount || questionCount <= 0) {
      setErrorMsg('Question count must be greater than 0.');
      return;
    }
    if (!duration || duration <= 0) {
      setErrorMsg('Duration in minutes must be greater than 0.');
      return;
    }

    if (examType === 'SPECIFIC_SUBJECT' && !selectedSubjectId) {
      setErrorMsg('Please select a subject.');
      return;
    }
    if (examType === 'SPECIFIC_CHAPTER') {
      if (!selectedSubjectId) {
        setErrorMsg('Please select a subject.');
        return;
      }
      if (!selectedChapterId) {
        setErrorMsg('Please select a chapter.');
        return;
      }
    }
    if (examType === 'FULL_EXAM' && fullExamConfigMode === 'BLUEPRINT' && !selectedBlueprintId) {
      setErrorMsg(`No blueprint selected. Please choose an existing ${fullExamTarget} blueprint or switch to Manual mode.`);
      return;
    }

    setCurrentStep(3);
  };

  const getDefaultExamName = () => {
    if (examType === 'SPECIFIC_SUBJECT') {
      const sub = subjects.find((s) => s.id === selectedSubjectId);
      return sub ? `${sub.name} Subject Exam` : 'Subject Exam';
    }
    if (examType === 'SPECIFIC_CHAPTER') {
      const sub = subjects.find((s) => s.id === selectedSubjectId);
      const ch = chapters.find((c) => c.id === selectedChapterId);
      return sub && ch ? `${sub.name} - ${ch.name} Exam` : 'Chapter Exam';
    }
    if (examType === 'FULL_EXAM') {
      if (fullExamConfigMode === 'BLUEPRINT' && selectedBlueprint) {
        return `${selectedBlueprint.name || fullExamTarget} Exam`;
      }
      return `${fullExamTarget} Full Exam`;
    }
    return 'Examination';
  };

  // ── Final Schedule Submission ──────────────────────────────────────────────
  const handleFinalSchedule = async () => {
    setErrorMsg(null);

    const startISO = new Date(`${startDate}T${startTime}:00`).toISOString();

    // Scheduling an existing approved exam
    if (initialExamId) {
      const endISO = new Date(
        new Date(startISO).getTime() + (initialExamDuration || 180) * 60 * 1000,
      ).toISOString();

      const { error } = await scheduleExamAPI(initialExamId, {
        startTime: startISO,
        endTime: endISO,
        timezone,
      });

      if (error) {
        const msg =
          typeof error === 'string'
            ? error
            : (error as any)?.message || 'Failed to schedule exam.';
        setErrorMsg(msg);
        return;
      }

      queryClient.invalidateQueries({ queryKey: adminKeys.scheduledExams() });
      queryClient.invalidateQueries({ queryKey: academicCalendarKeys.all });
      queryClient.invalidateQueries({ queryKey: examKeys.public() });
      onScheduled?.();
      onClose();
      return;
    }

    // Scheduling New Exam
    const finalExamName = examName.trim() || getDefaultExamName();

    const payload: ScheduleAdminExamPayload = {
      examType,
      examName: finalExamName,
      title: finalExamName,
      examTargetName: examType === 'FULL_EXAM' ? fullExamTarget : undefined,
      examTargetId: selectedTargetId || undefined,
      configurationMode: examType === 'FULL_EXAM' ? fullExamConfigMode : 'MANUAL',
      subjectId: examType !== 'FULL_EXAM' ? selectedSubjectId : undefined,
      chapterId: examType === 'SPECIFIC_CHAPTER' ? selectedChapterId : undefined,
      blueprintId: fullExamConfigMode === 'BLUEPRINT' ? selectedBlueprintId : undefined,
      questionCount: Number(questionCount),
      totalQuestions: Number(questionCount),
      duration: Number(effectiveDuration),
      durationMinutes: Number(effectiveDuration),
      marksPerQuestion: Number(marksPerQuestion),
      negativeMarks: Number(negativeMarks),
      languageId: selectedLanguageId || undefined,
      startTime: startISO,
      timezone,
    };

    const res = await scheduleAdminExamAPI(payload);
    if (res.error) {
      const msg =
        typeof res.error === 'string'
          ? res.error
          : (res.error as any)?.message
            ? Array.isArray((res.error as any).message)
              ? (res.error as any).message.join(', ')
              : (res.error as any).message
            : 'Failed to schedule exam.';
      setErrorMsg(msg);
      return;
    }

    queryClient.invalidateQueries({ queryKey: adminKeys.scheduledExams() });
    queryClient.invalidateQueries({ queryKey: academicCalendarKeys.all });
    queryClient.invalidateQueries({ queryKey: examKeys.public() });
    onScheduled?.();

    const createdExamId =
      (res.data as any)?.examId ||
      (res.data as any)?.exam?.id ||
      (res.data as any)?.id ||
      '';

    setScheduledSuccessData({
      examId: createdExamId,
      title: finalExamName,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden text-slate-800">
        
        {/* ── Modal Header (Clean White / Light Theme) ── */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
              <CalendarClock size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Schedule Examination
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {initialExamId
                  ? `Exam: ${initialExamTitle || initialExamId.slice(0, 8)}`
                  : 'Configure exam window, target curriculum, duration, and question format. (Question paper uploaded after scheduling)'}
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

        {/* ── Step Progress Indicator ── */}
        {!initialExamId && !scheduledSuccessData && (
          <div className="border-b border-slate-100 bg-white px-6 py-2.5">
            <div className="flex items-center justify-between max-w-md mx-auto text-xs font-semibold">
              <div className={`flex items-center gap-1.5 ${currentStep >= 1 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${currentStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  1
                </span>
                <span>Select Type</span>
              </div>

              <div className={`h-0.5 w-10 sm:w-16 ${currentStep >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`} />

              <div className={`flex items-center gap-1.5 ${currentStep >= 2 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${currentStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  2
                </span>
                <span>Configure Exam</span>
              </div>

              <div className={`h-0.5 w-10 sm:w-16 ${currentStep >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`} />

              <div className={`flex items-center gap-1.5 ${currentStep >= 3 ? 'text-indigo-600 font-bold' : 'text-slate-400'}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${currentStep >= 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  3
                </span>
                <span>Review & Schedule</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Body Content ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
              <AlertCircle size={18} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              POST-SCHEDULE SUCCESS SCREEN (With Direct Question Paper Upload Link)
          ══════════════════════════════════════════════════════════════════ */}
          {scheduledSuccessData ? (
            <div className="py-6 px-4 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-lg shadow-emerald-100/50">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-1">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  Exam Window Scheduled Successfully
                </span>
                <h3 className="text-xl font-black text-slate-900 pt-1">
                  {scheduledSuccessData.title}
                </h3>
              </div>

              <div className="mx-auto max-w-md p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span>Lifecycle Status:</span>
                  <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    SCHEDULED
                  </span>
                </div>
                <div className="flex items-center justify-between font-semibold text-slate-700">
                  <span>Question Paper:</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Not Uploaded Yet (Pending)
                  </span>
                </div>
                <p className="text-slate-500 pt-1.5 border-t border-slate-200 text-[11px] leading-relaxed">
                  The exam schedule window is saved. No questions are attached yet. You can prepare and upload the question paper via CSV/Excel now or later from Question Paper Manager.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    const firstSeg = window.location.pathname.split('/')[1];
                    const prefix = [
                      'super-admin',
                      'admin',
                      'general-manager',
                      'manager',
                      'operator',
                      'staff',
                    ].includes(firstSeg)
                      ? `/${firstSeg}`
                      : '/admin';
                    navigate(
                      `${prefix}/exam-manager/upload?activeExamId=${scheduledSuccessData.examId}`,
                    );
                    onClose();
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold shadow-md shadow-indigo-100 px-5 py-2.5 text-xs"
                >
                  <FileSpreadsheet size={16} />
                  <span>Upload Question Paper Now</span>
                  <ArrowRight size={15} />
                </Button>

                <Button
                  variant="outline"
                  onClick={onClose}
                  className="w-full sm:w-auto text-slate-600 border-slate-200 hover:bg-slate-100 font-semibold px-4 py-2.5 text-xs"
                >
                  Done / Back to Schedule List
                </Button>
              </div>
            </div>
          ) : (
            <>
              {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center sm:text-left">
                <h3 className="text-sm font-bold text-slate-900">Choose Exam Scheduling Type</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select one of the 3 supported scheduling formats below. Question paper will be prepared & uploaded separately.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                {/* 1. Specific Subject Exam */}
                <div
                  onClick={() => handleProceedToConfigure('SPECIFIC_SUBJECT')}
                  className="group relative flex flex-col justify-between p-5 rounded-3xl border border-slate-200 bg-white hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-50/60 transition-all cursor-pointer"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs mb-4">
                      <BookOpen size={22} />
                    </div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-md mb-1.5">
                      Type 1
                    </span>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Specific Subject Exam
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Schedule an exam targeting a single subject. Question paper can be prepared & uploaded after scheduling.
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-indigo-600">
                    <span>Configure Flow</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 2. Specific Chapter Exam */}
                <div
                  onClick={() => handleProceedToConfigure('SPECIFIC_CHAPTER')}
                  className="group relative flex flex-col justify-between p-5 rounded-3xl border border-slate-200 bg-white hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-50/60 transition-all cursor-pointer"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-xs mb-4">
                      <FileText size={22} />
                    </div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 rounded-md mb-1.5">
                      Type 2
                    </span>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                      Specific Chapter Exam
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Targeted single-chapter examination. Question paper can be prepared & uploaded after scheduling.
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                    <span>Configure Flow</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 3. Full Exam — JEE / NEET / CET */}
                <div
                  onClick={() => handleProceedToConfigure('FULL_EXAM')}
                  className="group relative flex flex-col justify-between p-5 rounded-3xl border border-slate-200 bg-white hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-50/60 transition-all cursor-pointer"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all shadow-xs mb-4">
                      <Award size={22} />
                    </div>
                    <span className="inline-block px-2 py-0.5 text-[10px] font-bold text-purple-600 bg-purple-50 rounded-md mb-1.5">
                      Type 3
                    </span>
                    <h4 className="text-sm font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                      Full Exam — JEE / NEET / CET
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Grand mock test for JEE, NEET, or CET. Question paper can be prepared & uploaded after scheduling.
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-purple-600">
                    <span>Configure Flow</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 2: CONFIGURE EXAM
          ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-5">
              {/* Type Banner */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Selected Type:</span>
                  <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-xl border border-indigo-100">
                    {examType === 'SPECIFIC_SUBJECT' && 'Specific Subject Exam'}
                    {examType === 'SPECIFIC_CHAPTER' && 'Specific Chapter Exam'}
                    {examType === 'FULL_EXAM' && `Full Exam (${fullExamTarget})`}
                  </span>
                </div>
                {!initialExamId && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold text-slate-600 hover:text-indigo-600 underline"
                  >
                    Change Type
                  </button>
                )}
              </div>

              {/* FULL EXAM TARGET & MODE SELECTOR */}
              {examType === 'FULL_EXAM' && (
                <div className="space-y-4 p-4 rounded-2xl border border-purple-100 bg-purple-50/40">
                  {/* Select Target: JEE / NEET / CET */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Select Exam Target
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['JEE', 'NEET', 'CET'] as FullExamTarget[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFullExamTarget(t)}
                          className={`py-2 px-3 rounded-xl text-xs font-black transition-all ${
                            fullExamTarget === t
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Configuration Mode: Manual vs Blueprint */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Configuration Option
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFullExamConfigMode('MANUAL')}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          fullExamConfigMode === 'MANUAL'
                            ? 'border-purple-600 bg-white text-purple-950 ring-2 ring-purple-500/20 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Sliders size={16} className={fullExamConfigMode === 'MANUAL' ? 'text-purple-600' : 'text-slate-400'} />
                        <div>
                          <span className="text-xs font-bold block">A. Manual Configuration</span>
                          <span className="text-[11px] text-slate-500">Configure questions, marking & duration</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFullExamConfigMode('BLUEPRINT')}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          fullExamConfigMode === 'BLUEPRINT'
                            ? 'border-purple-600 bg-white text-purple-950 ring-2 ring-purple-500/20 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <FileSpreadsheet size={16} className={fullExamConfigMode === 'BLUEPRINT' ? 'text-purple-600' : 'text-slate-400'} />
                        <div>
                          <span className="text-xs font-bold block">B. Choose Existing Blueprint</span>
                          <span className="text-[11px] text-slate-500">Dynamic predefined exam blueprint</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* BLUEPRINT SELECTION SECTION (if FULL_EXAM + BLUEPRINT) */}
              {examType === 'FULL_EXAM' && fullExamConfigMode === 'BLUEPRINT' && (
                <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Select Blueprint</label>
                    {isBlueprintsLoading && (
                      <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                        <Loader2 size={12} className="animate-spin" /> Loading blueprints...
                      </span>
                    )}
                  </div>

                  <select
                    value={selectedBlueprintId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedBlueprintId(id);
                      const bp = blueprints.find((b) => b.id === id);
                      setSelectedBlueprint(bp || null);
                      if (bp) {
                        if (bp.totalQuestions) setQuestionCount(bp.totalQuestions);
                        if (bp.durationMinutes) setDuration(bp.durationMinutes);
                      }
                    }}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    {filteredBlueprints.length === 0 && (
                      <option value="">No blueprints found for {fullExamTarget}</option>
                    )}
                    {filteredBlueprints.map((bp) => (
                      <option key={bp.id} value={bp.id}>
                        {bp.name} ({bp.totalQuestions || 180} Qs • {bp.exam?.durationMinutes || 180} mins)
                      </option>
                    ))}
                  </select>

                  {/* Blueprint Resolved Configuration Card */}
                  {selectedBlueprint && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Resolved Blueprint Configuration:
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 font-semibold pt-1">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Total Questions</span>
                          <span>{selectedBlueprint.totalQuestions || questionCount} Qs</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Duration</span>
                          <span>{selectedBlueprint.exam?.durationMinutes || duration} mins</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Exam Target</span>
                          <span>{selectedBlueprint.exam?.examTarget?.name || fullExamTarget}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EXAM NAME */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Exam Name</label>
                <input
                  type="text"
                  placeholder={getDefaultExamName()}
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* TARGET & SUBJECT SELECTION (FOR SUBJECT OR CHAPTER EXAMS) */}
              {examType !== 'FULL_EXAM' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Exam Target */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Exam Target</label>
                      {isTargetsLoading && <Loader2 size={12} className="animate-spin text-indigo-600" />}
                    </div>
                    <select
                      value={selectedTargetId}
                      onChange={(e) => setSelectedTargetId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      {examTargets.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Subject */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Subject</label>
                      {isSubjectsLoading && <Loader2 size={12} className="animate-spin text-indigo-600" />}
                    </div>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    >
                      {filteredSubjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* CHAPTER SELECTION (ONLY FOR SPECIFIC CHAPTER EXAM) */}
              {examType === 'SPECIFIC_CHAPTER' && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Chapter</label>
                    {isChaptersLoading && (
                      <span className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium">
                        <Loader2 size={12} className="animate-spin" /> Loading chapters for subject...
                      </span>
                    )}
                  </div>
                  <select
                    value={selectedChapterId}
                    onChange={(e) => setSelectedChapterId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    {chapters.length === 0 && (
                      <option value="">No chapters available for selected subject</option>
                    )}
                    {chapters.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* SCHEDULE ONLY INFO BANNER */}
              <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-900">
                <FileSpreadsheet size={16} className="text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Exam Schedule Window Only</p>
                  <p className="text-[11px] text-indigo-700 mt-0.5 leading-relaxed">
                    At this time, questions are not required. You are configuring the live exam time window, duration, and target question count. The question paper can be prepared & uploaded in Question Paper Manager after scheduling.
                  </p>
                </div>
              </div>

              {/* QUESTION COUNT & DURATION */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Question Count */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Question Count</label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                      Upload paper after scheduling
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500">
                    Target question count for this exam paper.
                  </p>
                </div>

                {/* Duration in Minutes */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* MARKING SCHEME & LANGUAGES */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Marks Per Correct (+)</label>
                  <input
                    type="number"
                    min={0}
                    value={marksPerQuestion}
                    onChange={(e) => setMarksPerQuestion(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Negative Marks (-)</label>
                  <input
                    type="number"
                    min={0}
                    value={negativeMarks}
                    onChange={(e) => setNegativeMarks(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Language</label>
                  <select
                    value={selectedLanguageId}
                    onChange={(e) => setSelectedLanguageId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                  >
                    {languages.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name} ({l.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* START DATE & TIME (WITH STRICT AUTOMATIC END TIME) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock size={15} className="text-indigo-600" />
                  <span>Exam Window & Dynamic Timing</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Start Time</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-bold text-slate-900 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Auto Calculated Dynamic End Time (strictly read-only) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Calculated End Date</label>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Auto (Non-editable)
                      </span>
                    </div>
                    <input
                      type="date"
                      value={calculatedEnd.endDate}
                      disabled
                      readOnly
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs font-semibold text-slate-600 cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Calculated End Time</label>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Auto (Start + Duration)
                      </span>
                    </div>
                    <input
                      type="time"
                      value={calculatedEnd.endTime}
                      disabled
                      readOnly
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs font-bold text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              STEP 3: REVIEW BEFORE SCHEDULE
          ══════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                      Exam Scheduling Review
                    </span>
                    <h3 className="text-base font-black text-slate-900 mt-0.5">
                      {examName.trim() || getDefaultExamName()}
                    </h3>
                  </div>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-bold rounded-xl">
                    {examType === 'SPECIFIC_SUBJECT' && 'Specific Subject'}
                    {examType === 'SPECIFIC_CHAPTER' && 'Specific Chapter'}
                    {examType === 'FULL_EXAM' && `Full Exam (${fullExamTarget})`}
                  </span>
                </div>

                {/* Summary Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Exam Target</span>
                    <span className="font-bold text-slate-800">
                      {examType === 'FULL_EXAM'
                        ? fullExamTarget
                        : examTargets.find((t) => t.id === selectedTargetId)?.name || 'General'}
                    </span>
                  </div>

                  {examType !== 'FULL_EXAM' && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Subject</span>
                      <span className="font-bold text-slate-800">
                        {subjects.find((s) => s.id === selectedSubjectId)?.name || '—'}
                      </span>
                    </div>
                  )}

                  {examType === 'SPECIFIC_CHAPTER' && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Chapter</span>
                      <span className="font-bold text-slate-800">
                        {chapters.find((c) => c.id === selectedChapterId)?.name || '—'}
                      </span>
                    </div>
                  )}

                  {examType === 'FULL_EXAM' && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Config Mode</span>
                      <span className="font-bold text-slate-800">
                        {fullExamConfigMode === 'BLUEPRINT' ? 'Existing Blueprint' : 'Manual Configuration'}
                      </span>
                    </div>
                  )}

                  <div>
                    <span className="text-slate-400 block text-[11px]">Question Count</span>
                    <span className="font-bold text-slate-800">{questionCount} Questions</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Duration</span>
                    <span className="font-bold text-slate-800">{effectiveDuration} Minutes</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Marking Scheme</span>
                    <span className="font-bold text-emerald-700">+{marksPerQuestion} / -{negativeMarks}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Language</span>
                    <span className="font-bold text-slate-800">
                      {languages.find((l) => l.id === selectedLanguageId)?.name || 'English'}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200">
                    <span className="text-slate-400 block text-[11px]">Scheduled Live Window</span>
                    <span className="font-bold text-indigo-900">
                      {startDate} at {startTime} &rarr; {calculatedEnd.endDate} at {calculatedEnd.endTime} ({timezone})
                    </span>
                  </div>
                </div>

                {/* Question Paper Readiness Notice */}
                <div className="pt-2">
                  <div className="flex items-start gap-2.5 p-3.5 bg-indigo-50/80 rounded-xl border border-indigo-100 text-xs font-semibold text-indigo-900">
                    <CheckCircle2 size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Next Step: Question Paper Preparation</span>
                      <span className="text-[11px] text-indigo-700 font-medium block mt-0.5">
                        This exam will be scheduled in <strong>SCHEDULED</strong> status. No questions are attached yet. Once scheduled, you can proceed directly to <strong>Upload Question Paper</strong> to import questions via CSV or Excel.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </div>

        {/* ── Modal Footer ── */}
        {!scheduledSuccessData && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          {currentStep === 1 ? (
            <div>
              <Button variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
            </div>
          ) : currentStep === 2 ? (
            <div className="flex w-full items-center justify-between">
              {!initialExamId ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentStep(1)}
                  className="flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} /> Back
                </Button>
              ) : (
                <div />
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={handleProceedToReview}
                className="flex items-center gap-1.5"
              >
                Review Configuration <ArrowRight size={14} />
              </Button>
            </div>
          ) : (
            <div className="flex w-full items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Edit Configuration
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleFinalSchedule}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Scheduling...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} /> Schedule Exam
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};
