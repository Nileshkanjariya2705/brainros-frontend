import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  CalendarClock,
  ArrowLeft,
  BookOpen,
  Layers,
  Award,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAxiosGet, useAxiosPost } from '@/hooks/useAxios';
import { Axios } from '@/base-axios';
import { useQueryClient } from '@tanstack/react-query';
import { adminKeys, academicCalendarKeys, examKeys, scheduleKeys } from '@/services/queryKeys';
import { toast } from '@/utils/toast';

export type ExamType = 'SPECIFIC_CHAPTER' | 'SPECIFIC_SUBJECT' | 'FULL_EXAM';
export type FullExamTarget = 'NEET' | 'JEE' | 'CET';

interface ChapterItem {
  id: string;
  name: string;
  code?: string;
  subjectId?: string;
}

interface SubjectGroup {
  id: string;
  subjectId: string;
  selectedChapterIds: string[];
  questionCount?: number;
}

export interface CanonicalSubject {
  key: 'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS' | 'BIOLOGY';
  name: string;
  id: string;
  allMatchingIds: string[];
}

export const CANONICAL_CONFIG: Array<{
  key: 'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS' | 'BIOLOGY';
  name: string;
  match: string[];
}> = [
  { key: 'PHYSICS', name: 'Physics', match: ['PHYSIC'] },
  { key: 'CHEMISTRY', name: 'Chemistry', match: ['CHEM'] },
  { key: 'MATHEMATICS', name: 'Mathematics', match: ['MATH'] },
  { key: 'BIOLOGY', name: 'Biology', match: ['BIO', 'BOTAN', 'ZOOL'] },
];

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

export const ScheduleExamPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const editExamId = searchParams.get('examId') || '';

  const [getReq] = useAxiosGet();
  const [postReq] = useAxiosPost();
  const queryClient = useQueryClient();

  const firstSegment = location.pathname.split('/')[1];
  const routePrefix = [
    'super-admin',
    'admin',
    'general-manager',
    'manager',
    'operator',
    'staff',
  ].includes(firstSegment)
    ? `/${firstSegment}`
    : '/admin';

  // ── Exam Type Selection ───────────────────────────────────────────────────────
  const [examType, setExamType] = useState<ExamType>('SPECIFIC_CHAPTER');

  // ── Common Configuration Fields ──────────────────────────────────────────────
  const [examName, setExamName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(30);
  const [duration, setDuration] = useState<number>(60);
  const [marksPerQuestion, setMarksPerQuestion] = useState<number>(4);
  const [negativeMarks, setNegativeMarks] = useState<number>(1);
  const [selectedLanguageId, setSelectedLanguageId] = useState<string>('');

  // ── Specific Subject Exam Selection (Multi-Subject) ──────────────────────────
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // ── Specific Chapter Exam Selection (Multi-Subject Groups with Multi-Chapters) ─
  const [subjectGroups, setSubjectGroups] = useState<SubjectGroup[]>([
    { id: 'group-1', subjectId: '', selectedChapterIds: [] },
  ]);

  // ── Full Exam Configuration ──────────────────────────────────────────────────
  const [fullExamTarget, setFullExamTarget] = useState<FullExamTarget>('NEET');

  // ── Date & Time ──────────────────────────────────────────────────────────────
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [timezone] = useState('Asia/Kolkata');

  // ── Master Data & Loading States ─────────────────────────────────────────────
  const [examTargets, setExamTargets] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectChaptersMap, setSubjectChaptersMap] = useState<Record<string, ChapterItem[]>>({});

  const [isLoadingMaster, setIsLoadingMaster] = useState(true);
  const [isLoadingChaptersFor, setIsLoadingChaptersFor] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Question Availability State ──────────────────────────────────────────────
  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Initialize dates
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setStartDate(tomorrow.toISOString().split('T')[0]);
  }, []);

  // Fetch Master Options (Targets, Subjects)
  useEffect(() => {
    setIsLoadingMaster(true);
    Promise.all([
      getReq<any>('/auth/options'),
      getReq<any[]>('/academic/subjects'),
    ]).then(([optsRes, subjectsRes]) => {
      setIsLoadingMaster(false);

      const opts = optsRes?.data?.data || optsRes?.data || {};
      if (opts.examTargets && Array.isArray(opts.examTargets)) {
        const ALLOWED = ['JEE', 'NEET', 'CET'];
        const filtered = opts.examTargets.filter((t: any) =>
          ALLOWED.includes(t.name?.toUpperCase().trim()),
        );
        setExamTargets(filtered.length > 0 ? filtered : opts.examTargets);
        if (filtered[0]) setSelectedTargetId(filtered[0].id);
      }

      if (opts.languages && Array.isArray(opts.languages)) {
        const en = opts.languages.find((l: any) => l.code === 'EN' || l.name === 'English');
        if (en) setSelectedLanguageId(en.id);
        else if (opts.languages[0]) setSelectedLanguageId(opts.languages[0].id);
      }

      const allSubs = Array.isArray(subjectsRes?.data) ? subjectsRes.data : [];
      setSubjects(allSubs);

      // Default first canonical subject in subject group
      if (allSubs.length > 0 && !editExamId) {
        const firstMatching = allSubs.find((s: any) =>
          (s.name || '').toUpperCase().includes('PHYSIC'),
        ) || allSubs[0];
        setSubjectGroups([
          { id: 'group-1', subjectId: firstMatching.id, selectedChapterIds: [] },
        ]);
        setSelectedSubjectIds([firstMatching.id]);
      }
    });
  }, [getReq, editExamId]);

  // Active Target Name resolution (JEE, NEET, CET, or General)
  const activeTargetName = useMemo(() => {
    if (examType === 'FULL_EXAM') {
      return fullExamTarget.toUpperCase().trim();
    }
    const targetObj = examTargets.find((t) => t.id === selectedTargetId);
    return (targetObj?.name || '').toUpperCase().trim();
  }, [examType, fullExamTarget, examTargets, selectedTargetId]);

  // Target-specific allowed subjects
  // JEE -> Physics, Chemistry, Mathematics
  // NEET -> Physics, Chemistry, Biology
  // CET -> Physics, Chemistry, Mathematics, Biology
  const targetAllowedKeys = useMemo(() => {
    if (activeTargetName.includes('JEE')) {
      return ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS'];
    }
    if (activeTargetName.includes('NEET')) {
      return ['PHYSICS', 'CHEMISTRY', 'BIOLOGY'];
    }
    // CET, General, or other targets
    return ['PHYSICS', 'CHEMISTRY', 'MATHEMATICS', 'BIOLOGY'];
  }, [activeTargetName]);

  // Consolidate into clean canonical subjects dynamically matching the selected target
  const canonicalSubjects: CanonicalSubject[] = useMemo(() => {
    if (subjects.length === 0) return [];
    const filteredConfigs = CANONICAL_CONFIG.filter((conf) =>
      targetAllowedKeys.includes(conf.key),
    );

    return filteredConfigs
      .map((conf) => {
        const matching = subjects.filter((s) => {
          const upper = (s.name || '').toUpperCase();
          return conf.match.some((m) => upper.includes(m));
        });

        if (matching.length === 0) return null;

        const targetMatch = selectedTargetId
          ? matching.find(
              (s) =>
                s.examTargetId === selectedTargetId || s.examTarget?.id === selectedTargetId,
            )
          : null;

        const primary = targetMatch || matching[0];

        return {
          key: conf.key,
          name: conf.name,
          id: primary.id,
          allMatchingIds: matching.map((s) => s.id),
        };
      })
      .filter((s): s is CanonicalSubject => Boolean(s));
  }, [subjects, selectedTargetId, targetAllowedKeys]);

  // Keep subjectGroups consistent with available canonical subjects & prevent duplicates
  useEffect(() => {
    if (canonicalSubjects.length === 0) return;
    const validSubjectIds = canonicalSubjects.map((s) => s.id);

    setSubjectGroups((prevGroups) => {
      const usedSubjectIds = new Set<string>();
      const sanitized: SubjectGroup[] = [];

      for (const g of prevGroups) {
        let sid = g.subjectId;
        // If subject is not in valid list for this target or already used in previous group, find first unused
        if (!validSubjectIds.includes(sid) || usedSubjectIds.has(sid)) {
          const available = canonicalSubjects.find((s) => !usedSubjectIds.has(s.id));
          if (!available) break; // no more distinct subjects available for this target
          sid = available.id;
        }

        usedSubjectIds.add(sid);
        sanitized.push({
          ...g,
          subjectId: sid,
          selectedChapterIds: sid === g.subjectId ? g.selectedChapterIds : [],
        });
      }

      // If sanitized is empty, initialize with first canonical subject
      if (sanitized.length === 0) {
        sanitized.push({
          id: 'group-1',
          subjectId: canonicalSubjects[0].id,
          selectedChapterIds: [],
        });
      }

      return sanitized;
    });

    setSelectedSubjectIds((prev) => prev.filter((id) => validSubjectIds.includes(id)));
  }, [canonicalSubjects]);

  // Load chapters for a subject on demand (fetching and merging distinct chapters)
  const loadChaptersForSubject = useCallback(
    async (subjectId: string) => {
      if (!subjectId || subjectChaptersMap[subjectId]) return;

      const canonical = canonicalSubjects.find(
        (c) => c.id === subjectId || c.allMatchingIds.includes(subjectId),
      );
      const rawIds =
        canonical && canonical.allMatchingIds.length > 0
          ? canonical.allMatchingIds
          : [subjectId];

      const idsToFetch = rawIds.filter((id) =>
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
      );

      if (idsToFetch.length === 0) return;

      setIsLoadingChaptersFor((prev) => ({ ...prev, [subjectId]: true }));
      try {
        const responses = await Promise.all(
          idsToFetch.map((id) =>
            getReq<ChapterItem[]>(`/academic/subjects/${id}/chapters`).catch(() => ({ data: [] })),
          ),
        );

        const merged: ChapterItem[] = [];
        const seen = new Set<string>();

        responses.forEach((res) => {
          const list = Array.isArray(res.data) ? res.data : [];
          list.forEach((ch) => {
            const norm = ch.name.trim().toLowerCase();
            if (!seen.has(norm)) {
              seen.add(norm);
              merged.push(ch);
            }
          });
        });

        setSubjectChaptersMap((prev) => ({ ...prev, [subjectId]: merged }));
      } finally {
        setIsLoadingChaptersFor((prev) => ({ ...prev, [subjectId]: false }));
      }
    },
    [getReq, subjectChaptersMap, canonicalSubjects],
  );

  // Auto-load chapters when subjects are selected in groups
  useEffect(() => {
    subjectGroups.forEach((g) => {
      if (g.subjectId && !subjectChaptersMap[g.subjectId]) {
        loadChaptersForSubject(g.subjectId);
      }
    });
  }, [subjectGroups, loadChaptersForSubject, subjectChaptersMap]);

  // If editing an existing exam, load full schedule details
  useEffect(() => {
    if (!editExamId) return;

    getReq<any>(`/admin/exams/${editExamId}/schedule-detail`).then(({ data }) => {
      if (!data) return;
      const detail = data.data || data;

      if (detail.title) setExamName(detail.title);
      if (detail.description) setDescription(detail.description);
      if (detail.examTargetId) setSelectedTargetId(detail.examTargetId);
      if (detail.durationMinutes) setDuration(detail.durationMinutes);
      if (detail.totalQuestions) setQuestionCount(detail.totalQuestions);
      if (detail.defaultMarksPerQuestion) setMarksPerQuestion(detail.defaultMarksPerQuestion);
      if (detail.defaultNegativeMarks !== undefined) setNegativeMarks(detail.defaultNegativeMarks);
      if (detail.languageId) setSelectedLanguageId(detail.languageId);

      if (detail.examType) {
        setExamType(detail.examType as ExamType);
      }

      if (detail.subjectGroups && detail.subjectGroups.length > 0) {
        setSubjectGroups(
          detail.subjectGroups.map((g: any, idx: number) => ({
            id: `group-${idx + 1}`,
            subjectId: g.subjectId,
            selectedChapterIds: g.chapterIds || [],
            questionCount: g.questionCount,
          })),
        );
      }

      if (detail.subjectIds && detail.subjectIds.length > 0) {
        setSelectedSubjectIds(detail.subjectIds);
      }

      if (detail.startTime) {
        const dt = new Date(detail.startTime);
        setStartDate(dt.toISOString().split('T')[0]);
        const hrs = String(dt.getHours()).padStart(2, '0');
        const mins = String(dt.getMinutes()).padStart(2, '0');
        setStartTime(`${hrs}:${mins}`);
      }
    });
  }, [editExamId, getReq]);

  // Live question pool availability checker
  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsCheckingAvailability(true);
      try {
        let payload: any = {
          examType,
          examTargetId: selectedTargetId || undefined,
          questionCount: Number(questionCount),
        };

        if (examType === 'SPECIFIC_SUBJECT') {
          payload.subjectIds = selectedSubjectIds;
        } else if (examType === 'SPECIFIC_CHAPTER') {
          payload.subjectGroups = subjectGroups
            .filter((g) => g.subjectId && g.selectedChapterIds.length > 0)
            .map((g) => ({
              subjectId: g.subjectId,
              chapterIds: g.selectedChapterIds,
            }));
        } else {
          payload.examTargetName = fullExamTarget;
        }

        const queryParams = new URLSearchParams();
        if (payload.examType) queryParams.append('examType', payload.examType);
        if (payload.questionCount) queryParams.append('questionCount', String(payload.questionCount));
        if (payload.examTargetId) queryParams.append('examTargetId', payload.examTargetId);
        if (payload.examTargetName) queryParams.append('examTargetName', payload.examTargetName);
        if (payload.subjectIds) {
          payload.subjectIds.forEach((sId: string) => queryParams.append('subjectIds[]', sId));
        }

        const res = await Axios.get(`/admin/exams/check-availability?${queryParams.toString()}`).catch(() => null);
        const count = res?.data?.data?.availableCount ?? res?.data?.availableCount ?? null;
        setAvailableCount(count);
      } catch {
        setAvailableCount(null);
      } finally {
        setIsCheckingAvailability(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    examType,
    selectedTargetId,
    questionCount,
    selectedSubjectIds,
    subjectGroups,
    fullExamTarget,
  ]);

  // Calculate dynamic end time
  const dynamicEnd = useMemo(() => {
    return calculateEndTime(startDate, startTime, duration);
  }, [startDate, startTime, duration]);

  // Specific Chapter Exam: Add / Remove Subject Group
  const handleAddSubjectGroup = () => {
    const unselectedSubject = canonicalSubjects.find(
      (s) => !subjectGroups.some((g) => g.subjectId === s.id),
    );
    if (!unselectedSubject) return;
    setSubjectGroups((prev) => [
      ...prev,
      { id: `group-${Date.now()}`, subjectId: unselectedSubject.id, selectedChapterIds: [] },
    ]);
  };

  const handleRemoveSubjectGroup = (groupId: string) => {
    if (subjectGroups.length <= 1) return;
    setSubjectGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleSubjectGroupChangeSubject = (groupId: string, newSubjectId: string) => {
    setSubjectGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, subjectId: newSubjectId, selectedChapterIds: [] } : g,
      ),
    );
    loadChaptersForSubject(newSubjectId);
  };

  const handleToggleChapterInGroup = (groupId: string, chapterId: string) => {
    setSubjectGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const exists = g.selectedChapterIds.includes(chapterId);
        return {
          ...g,
          selectedChapterIds: exists
            ? g.selectedChapterIds.filter((id) => id !== chapterId)
            : [...g.selectedChapterIds, chapterId],
        };
      }),
    );
  };

  // Specific Subject Exam: Toggle Subject Multi-Select
  const handleToggleSubject = (subjectId: string) => {
    setSelectedSubjectIds((prev) =>
      prev.includes(subjectId) ? prev.filter((id) => id !== subjectId) : [...prev, subjectId],
    );
  };

  // Form Submit / Schedule Action
  const handleScheduleExam = async () => {
    setErrorMsg(null);

    // Dynamic start ISO validation
    if (!startDate || !startTime) {
      setErrorMsg('Please select a valid start date and start time.');
      return;
    }

    const [hours, minutes] = startTime.split(':').map(Number);
    const startObj = new Date(`${startDate}T00:00:00`);
    startObj.setHours(hours || 0, minutes || 0, 0, 0);
    const startISO = startObj.toISOString();

    if (startObj.getTime() <= Date.now() + 60 * 1000) {
      setErrorMsg('Exam start time must be in the future.');
      return;
    }

    // Exam Type Specific Validation
    if (examType === 'SPECIFIC_SUBJECT') {
      if (selectedSubjectIds.length === 0) {
        setErrorMsg('Please select at least one Subject.');
        return;
      }
    } else if (examType === 'SPECIFIC_CHAPTER') {
      if (subjectGroups.length === 0) {
        setErrorMsg('Please add at least one Subject group.');
        return;
      }
      for (let i = 0; i < subjectGroups.length; i++) {
        const g = subjectGroups[i];
        if (!g.subjectId) {
          setErrorMsg(`Please select a Subject for Subject Group ${i + 1}.`);
          return;
        }
        if (g.selectedChapterIds.length === 0) {
          const subName = subjects.find((s) => s.id === g.subjectId)?.name || `Group ${i + 1}`;
          setErrorMsg(`Please select at least one Chapter for ${subName}.`);
          return;
        }
      }
    }

    if (questionCount <= 0) {
      setErrorMsg('Total question count must be greater than 0.');
      return;
    }
    if (duration <= 0) {
      setErrorMsg('Exam duration in minutes must be greater than 0.');
      return;
    }

    const defaultTitle =
      examName.trim() ||
      (examType === 'SPECIFIC_CHAPTER'
        ? 'Chapter Practice Exam'
        : examType === 'SPECIFIC_SUBJECT'
        ? 'Subject Practice Exam'
        : `${fullExamTarget} Full Exam`);

    const payload: any = {
      examId: editExamId || undefined,
      examType,
      examName: defaultTitle,
      title: defaultTitle,
      description: description.trim() || undefined,
      examTargetId: selectedTargetId || undefined,
      duration: Number(duration),
      durationMinutes: Number(duration),
      questionCount: Number(questionCount),
      totalQuestions: Number(questionCount),
      marksPerQuestion: Number(marksPerQuestion),
      negativeMarks: Number(negativeMarks),
      languageId: selectedLanguageId || undefined,
      startTime: startISO,
      timezone,
    };

    if (examType === 'SPECIFIC_SUBJECT') {
      payload.subjectIds = selectedSubjectIds;
      payload.subjects = selectedSubjectIds.map((sId) => ({
        subjectId: sId,
        questionCount: Math.floor(questionCount / (selectedSubjectIds.length || 1)),
      }));
    } else if (examType === 'SPECIFIC_CHAPTER') {
      payload.subjectGroups = subjectGroups.map((g) => ({
        subjectId: g.subjectId,
        chapterIds: g.selectedChapterIds,
        questionCount: Math.floor(questionCount / (subjectGroups.length || 1)),
      }));
    } else {
      payload.examTargetName = fullExamTarget;
    }

    setIsSubmitting(true);
    try {
      const res = await postReq('/admin/exams/schedule', payload);
      setIsSubmitting(false);

      if (res.error) {
        const msg =
          typeof res.error === 'string'
            ? res.error
            : (res.error as any)?.message || 'Failed to schedule examination.';
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      toast.success(
        editExamId ? 'Exam schedule updated successfully!' : 'Examination scheduled successfully!',
      );

      // Targeted cache invalidation
      queryClient.invalidateQueries({ queryKey: adminKeys.scheduledExams() });
      queryClient.invalidateQueries({ queryKey: academicCalendarKeys.all });
      queryClient.invalidateQueries({ queryKey: examKeys.public() });
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });

      navigate(`${routePrefix}/exam-scheduling`);
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err?.response?.data?.message || err?.message || 'Failed to schedule exam.';
      setErrorMsg(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-3 sm:px-6 animate-in fade-in duration-150">
      {/* ── Top Header & Navigation ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${routePrefix}/exam-scheduling`)}
            className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
                <CalendarClock size={12} />
                {editExamId ? 'Edit Schedule' : 'New Examination Window'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              {editExamId ? 'Edit Scheduled Exam' : 'Schedule Examination'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Configure curriculum targets, multi-subject/chapter distributions, and live exam duration.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            onClick={() => navigate(`${routePrefix}/exam-scheduling`)}
            className="rounded-2xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleScheduleExam}
            disabled={isSubmitting || isLoadingMaster}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-100"
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle2 size={16} />
            )}
            <span>{editExamId ? 'Update Schedule' : 'Schedule Exam'}</span>
          </Button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {errorMsg && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-800 flex items-start gap-3 text-sm shadow-sm animate-in slide-in-from-top-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-bold">Scheduling Error</p>
            <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* ── Step 1: Exam Type Selection Cards ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">1. Select Examination Type</h2>
          <p className="text-xs text-slate-500 font-medium">
            Choose whether this exam focuses on specific chapters, entire subjects, or full mock curriculum.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Option 1: Specific Chapter Exam */}
          <button
            type="button"
            onClick={() => setExamType('SPECIFIC_CHAPTER')}
            className={`flex flex-col text-left p-5 rounded-3xl border-2 transition-all duration-200 ${
              examType === 'SPECIFIC_CHAPTER'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  examType === 'SPECIFIC_CHAPTER'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <BookOpen size={20} />
              </div>
              {examType === 'SPECIFIC_CHAPTER' && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check size={14} />
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3">Specific Chapter Exam</h3>
            <p className="text-xs text-slate-500 mt-1">
              Select one or multiple subject groups with multiple specific chapters in each.
            </p>
          </button>

          {/* Option 2: Specific Subject Exam */}
          <button
            type="button"
            onClick={() => setExamType('SPECIFIC_SUBJECT')}
            className={`flex flex-col text-left p-5 rounded-3xl border-2 transition-all duration-200 ${
              examType === 'SPECIFIC_SUBJECT'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  examType === 'SPECIFIC_SUBJECT'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Layers size={20} />
              </div>
              {examType === 'SPECIFIC_SUBJECT' && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check size={14} />
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3">Specific Subject Exam</h3>
            <p className="text-xs text-slate-500 mt-1">
              Multi-select one or multiple subjects (Physics, Chemistry, Mathematics, etc.).
            </p>
          </button>

          {/* Option 3: Full Exam */}
          <button
            type="button"
            onClick={() => setExamType('FULL_EXAM')}
            className={`flex flex-col text-left p-5 rounded-3xl border-2 transition-all duration-200 ${
              examType === 'FULL_EXAM'
                ? 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-100'
                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  examType === 'FULL_EXAM'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Award size={20} />
              </div>
              {examType === 'FULL_EXAM' && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Check size={14} />
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-3">Full Exam</h3>
            <p className="text-xs text-slate-500 mt-1">
              Complete standard mock exam following official NEET / JEE / CET patterns.
            </p>
          </button>
        </div>
      </div>

      {/* ── If FULL_EXAM: Step 2: Target Entrance Exam ── */}
      {examType === 'FULL_EXAM' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              2. Target Entrance Exam
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Select standard national entrance exam pattern (NEET, JEE, or CET).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Target Entrance Exam
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['NEET', 'JEE', 'CET'] as FullExamTarget[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setFullExamTarget(t);
                    if (t === 'NEET') {
                      setQuestionCount(200);
                      setDuration(200);
                    } else if (t === 'JEE') {
                      setQuestionCount(90);
                      setDuration(180);
                    } else {
                      setQuestionCount(150);
                      setDuration(180);
                    }
                  }}
                  className={`py-3 rounded-2xl text-sm font-black transition-all ${
                    fullExamTarget === t
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 scale-102 ring-2 ring-indigo-500/30'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Exam Timing, Duration & Question Format ── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            {examType === 'FULL_EXAM'
              ? '3. Exam Timing, Duration & Question Format'
              : '2. Exam Timing, Duration & Question Format'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Define question quantities, marks, schedule start time, and dynamic window calculation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Exam Name */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Exam Title (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Physics Mechanics Assessment"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Target Curriculum */}
          {examTargets.length > 0 && examType !== 'FULL_EXAM' && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                Target Curriculum
              </label>
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Select Target Curriculum (Optional)</option>
                {examTargets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Question Count */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Total Questions
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={questionCount || ''}
              onKeyDown={(e) => {
                if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setQuestionCount(val ? Number(val) : 0);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Duration (Minutes) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Duration (Minutes)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={duration || ''}
              onKeyDown={(e) => {
                if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setDuration(val ? Number(val) : 0);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Marks Per Question */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Marks Per Question
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={marksPerQuestion === 0 ? '0' : marksPerQuestion || ''}
              onKeyDown={(e) => {
                if (e.key === '.' && (e.currentTarget.value.includes('.') || !e.currentTarget.value)) {
                  e.preventDefault();
                } else if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setMarksPerQuestion(val ? Number(val) : 0);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          {/* Negative Marks */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Negative Marks Per Wrong Answer
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={negativeMarks === 0 ? '0' : negativeMarks || ''}
              onKeyDown={(e) => {
                if (e.key === '.' && (e.currentTarget.value.includes('.') || !e.currentTarget.value)) {
                  e.preventDefault();
                } else if (!/[0-9.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9.]/g, '');
                setNegativeMarks(val ? Number(val) : 0);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

        </div>

        {/* ── Schedule Window: Start Date, Start Time & Dynamic End Time ── */}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-4">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
            <Clock size={16} className="text-indigo-600" />
            <span>Examination Window Schedule</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Calculated End Time (Dynamic)
              </label>
              <div className="flex items-center h-[42px] px-3 rounded-xl border border-slate-200 bg-slate-100/80 text-xs font-bold text-slate-700">
                {dynamicEnd.endFormatted || 'Automatically computed'}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-500 italic">
            * End Time is strictly calculated dynamically as <span className="font-semibold text-slate-700">Start Time + Duration ({duration} mins)</span>.
          </p>
        </div>

        {/* ── Question Pool Availability Status ── */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <HelpCircle size={15} className="text-slate-400 shrink-0" />
            <span>
              {isCheckingAvailability ? (
                <span className="flex items-center gap-1 text-indigo-600">
                  <Loader2 size={12} className="animate-spin" /> Checking available questions pool...
                </span>
              ) : availableCount !== null ? (
                <>
                  Found <span className="font-bold text-slate-900">{availableCount}</span> question(s) in the Question Bank matching criteria. (Question paper can also be uploaded after scheduling).
                </>
              ) : (
                'Question paper spreadsheet or manual questions can be added after scheduling.'
              )}
            </span>
          </div>

          {availableCount !== null && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
                availableCount >= questionCount
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {availableCount >= questionCount ? 'Pool Ready' : 'Paper Upload Required'}
            </span>
          )}
        </div>
      </div>

      {/* ── Step 3: Dynamic Subject / Chapter Configuration ── */}
      {examType === 'SPECIFIC_CHAPTER' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                3. Subject & Chapter Configuration
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Add subject groups and choose one or more chapters for each subject.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddSubjectGroup}
              disabled={subjectGroups.length >= canonicalSubjects.length}
              className="flex items-center gap-1.5 text-xs font-bold rounded-2xl disabled:opacity-50"
            >
              <Plus size={14} />
              <span>
                {subjectGroups.length >= canonicalSubjects.length
                  ? `All ${canonicalSubjects.length} Subjects Added`
                  : 'Add Subject Group'}
              </span>
            </Button>
          </div>

          <div className="space-y-4">
            {subjectGroups.map((group, groupIdx) => {
              const currentSubject = canonicalSubjects.find((s) => s.id === group.subjectId) || subjects.find((s) => s.id === group.subjectId);
              const chaptersList = subjectChaptersMap[group.subjectId] || [];
              const isChaptersLoading = isLoadingChaptersFor[group.subjectId] || false;

              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                        {groupIdx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        Subject Group #{groupIdx + 1}
                      </span>
                    </div>

                    {subjectGroups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubjectGroup(group.id)}
                        className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-bold p-1 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  {/* Subject Dropdown */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Subject
                    </label>
                    <select
                      value={group.subjectId}
                      onChange={(e) => handleSubjectGroupChangeSubject(group.id, e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="" disabled>
                        Select Subject
                      </option>
                      {canonicalSubjects
                        .filter(
                          (s) =>
                            s.id === group.subjectId ||
                            !subjectGroups.some((g) => g.id !== group.id && g.subjectId === s.id),
                        )
                        .map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Chapter Multi-Select Chips */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Selected Chapters ({group.selectedChapterIds.length})
                      </label>
                      {isChaptersLoading && (
                        <span className="flex items-center gap-1 text-xs text-indigo-600">
                          <Loader2 size={12} className="animate-spin" /> Loading chapters...
                        </span>
                      )}
                    </div>

                    {chaptersList.length === 0 && !isChaptersLoading ? (
                      <p className="text-xs text-slate-400 italic bg-white p-3 rounded-xl border border-slate-200">
                        No chapters found for {currentSubject?.name || 'this subject'}.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-3 bg-white rounded-xl border border-slate-200">
                        {chaptersList.map((ch) => {
                          const isSelected = group.selectedChapterIds.includes(ch.id);
                          return (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => handleToggleChapterInGroup(group.id, ch.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {isSelected ? <Check size={13} /> : <Plus size={13} />}
                              <span>{ch.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {examType === 'SPECIFIC_SUBJECT' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              3. Subject Selection
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Select one or multiple subjects included in this examination.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 p-4 bg-slate-50/60 rounded-2xl border border-slate-200">
            {canonicalSubjects.map((s) => {
              const isSelected = selectedSubjectIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleToggleSubject(s.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isSelected ? <Check size={16} /> : <Plus size={16} />}
                  <span>{s.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bottom Submit Actions ── */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => navigate(`${routePrefix}/exam-scheduling`)}
          className="rounded-2xl"
        >
          Cancel
        </Button>
        <Button
          onClick={handleScheduleExam}
          disabled={isSubmitting || isLoadingMaster}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-100 px-6 py-2.5"
        >
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <CheckCircle2 size={16} />
          )}
          <span>{editExamId ? 'Update Schedule' : 'Schedule Exam'}</span>
        </Button>
      </div>
    </div>
  );
};
export default ScheduleExamPage;
