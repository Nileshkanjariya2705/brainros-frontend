import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import {
  Key,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  RefreshCw,
  HelpCircle,
  Layers,
  Sparkles,
  Save,
  ArrowLeft,
  Search,
  Calendar,
  FileCheck,
  AlertTriangle,
  UserCheck,
  Eye,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';
import {
  useAnswerKeyAPI,
  type AnswerKeyStatus,
  type AnswerKeyQuestionItem,
} from '../services/answerKey.service';
import {
  completedExamReportsService,
  type CompletedLiveExamItem,
} from '@/modules/Admin/services/completedExamReports.service';
import { JobProgressBar } from '@/components/common/JobProgressBar';
import { useJobProgress } from '@/hooks/useJobProgress';
import { useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/services/queryKeys';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@config';
import { WorkflowStepIndicator, type WorkflowStep } from '@/components/ui/WorkflowStepIndicator';

interface InlineAnswerKeyProgress {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  percentage: number;
  current: number;
  total: number;
  message?: string;
}

export interface AnswerKeyPreviewRow {
  rowNumber: number;
  questionNumber: number;
  subject: string;
  section: string;
  questionType: string;
  questionText: string;
  marks: number;
  negativeMarks: number;
  availableOptions: string;
  correctOption: string;
  explanation: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface AnswerKeyPreviewResult {
  fileName: string;
  fileSize: number;
  totalQuestions: number;
  validQuestions: number;
  invalidQuestions: number;
  isValid: boolean;
  errors: Array<{ row: number; message: string }>;
  warnings: Array<{ row: number; message: string }>;
  previewRows: AnswerKeyPreviewRow[];
}

export const parseAndValidateAnswerKey = (
  content: string,
  fileName: string,
  fileSize: number,
  examQuestions: AnswerKeyQuestionItem[],
): AnswerKeyPreviewResult => {
  const lines = content
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return {
      fileName,
      fileSize,
      totalQuestions: 0,
      validQuestions: 0,
      invalidQuestions: 0,
      isValid: false,
      errors: [{ row: 1, message: 'CSV file is empty or missing headers.' }],
      warnings: [],
      previewRows: [],
    };
  }

  // Split line with quote awareness
  const parseLine = (line: string): string[] => {
    const res: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (charIsComma(ch, inQuotes)) {
        res.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    res.push(cur.trim());
    return res;
  };

  function charIsComma(ch: string, inQuotes: boolean) {
    return ch === ',' && !inQuotes;
  }

  const headerLine = lines[0];
  const headers = parseLine(headerLine).map((h) =>
    h.toLowerCase().trim().replace(/[\s_()\-]/g, ''),
  );

  const qNumIdx = headers.findIndex(
    (h) => h.includes('questionnumber') || h === 'qnum' || h === 'q#' || h === 'question' || h === 'questionid',
  );
  const correctOptIdx = headers.findIndex(
    (h) =>
      h.includes('correctanswer') ||
      h.includes('correctoption') ||
      h.includes('answer') ||
      h === 'key',
  );
  const explIdx = headers.findIndex((h) => h.includes('explanation'));

  if (qNumIdx === -1 || correctOptIdx === -1) {
    return {
      fileName,
      fileSize,
      totalQuestions: 0,
      validQuestions: 0,
      invalidQuestions: lines.length - 1,
      isValid: false,
      errors: [
        {
          row: 1,
          message:
            'Missing required column(s). CSV must contain "question_number" and "correct_answer" headers.',
        },
      ],
      warnings: [],
      previewRows: [],
    };
  }

  const questionMap = new Map<number, AnswerKeyQuestionItem>();
  examQuestions.forEach((q) => questionMap.set(q.questionNumber, q));

  const seenQNums = new Set<number>();
  const previewRows: AnswerKeyPreviewRow[] = [];
  const errors: Array<{ row: number; message: string }> = [];
  const warnings: Array<{ row: number; message: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = parseLine(lines[i]);
    const rowNumber = i + 1;
    const rawQNum = parts[qNumIdx];
    const rawCorrectOpt = (parts[correctOptIdx] || '').trim().replace(/^"+|"+$/g, '');
    const rawExplanation = explIdx >= 0 ? (parts[explIdx] || '').replace(/^"+|"+$/g, '') : '';

    const qNum = parseInt(rawQNum, 10);
    let rowValid = true;
    let rowError = '';

    if (isNaN(qNum) || qNum <= 0) {
      rowValid = false;
      rowError = `Invalid Question Number: "${rawQNum}". Must be a positive integer.`;
      errors.push({ row: rowNumber, message: rowError });
    } else if (seenQNums.has(qNum)) {
      rowValid = false;
      rowError = `Duplicate question number: ${qNum}`;
      errors.push({ row: rowNumber, message: rowError });
    } else {
      seenQNums.add(qNum);
      const matchedQ = questionMap.get(qNum);
      if (!matchedQ) {
        rowValid = false;
        rowError = `Question number ${qNum} does not exist in this exam.`;
        errors.push({ row: rowNumber, message: rowError });
      } else {
        if (!rawCorrectOpt) {
          rowValid = false;
          rowError = `Missing answer for question number: ${qNum}`;
          errors.push({ row: rowNumber, message: rowError });
        } else if (matchedQ.questionType === 'NUMERICAL') {
          if (isNaN(Number(rawCorrectOpt))) {
            rowValid = false;
            rowError = `Question ${qNum} requires a numerical answer.`;
            errors.push({ row: rowNumber, message: rowError });
          }
        } else if (matchedQ.questionType === 'SINGLE_CORRECT') {
          if (rawCorrectOpt.includes('|') || rawCorrectOpt.includes(',') || rawCorrectOpt.includes(';')) {
            rowValid = false;
            rowError = `Question ${qNum} is a single-choice question and accepts only one option.`;
            errors.push({ row: rowNumber, message: rowError });
          } else {
            const availOptions = (matchedQ.options || []).map((o) => o.optionKey.toUpperCase());
            if (availOptions.length > 0 && !availOptions.includes(rawCorrectOpt.toUpperCase())) {
              rowValid = false;
              rowError = `Invalid answer '${rawCorrectOpt}' for question ${qNum}.`;
              errors.push({ row: rowNumber, message: rowError });
            }
          }
        } else if (matchedQ.questionType === 'MULTIPLE_CORRECT') {
          const availOptions = (matchedQ.options || []).map((o) => o.optionKey.toUpperCase());
          const keys = rawCorrectOpt.toUpperCase().split(/[\s,|;]+/).map((k) => k.trim()).filter(Boolean);
          const invalidKey = keys.find((k) => !availOptions.includes(k));
          if (invalidKey) {
            rowValid = false;
            rowError = `Invalid answer '${invalidKey}' for question ${qNum}.`;
            errors.push({ row: rowNumber, message: rowError });
          }
        }

        previewRows.push({
          rowNumber,
          questionNumber: qNum,
          subject: matchedQ.subject || 'General',
          section: matchedQ.section || 'Main',
          questionType: matchedQ.questionType || 'SINGLE_CORRECT',
          questionText: matchedQ.questionText || `Question #${qNum}`,
          marks: matchedQ.marks || 4,
          negativeMarks: matchedQ.negativeMarks || 1,
          availableOptions: matchedQ.availableOptions || 'A/B/C/D',
          correctOption: rawCorrectOpt,
          explanation: rawExplanation || matchedQ.explanation || '',
          isValid: rowValid,
          errorMessage: rowError || undefined,
        });
        continue;
      }
    }

    // Fallback row if question not matched
    previewRows.push({
      rowNumber,
      questionNumber: isNaN(qNum) ? 0 : qNum,
      subject: 'Unknown',
      section: 'Unknown',
      questionType: 'UNKNOWN',
      questionText: `Question statement (unmatched)`,
      marks: 0,
      negativeMarks: 0,
      availableOptions: '-',
      correctOption: rawCorrectOpt,
      explanation: rawExplanation,
      isValid: false,
      errorMessage: rowError,
    });
  }

  // Check missing questions
  examQuestions.forEach((eq) => {
    if (!seenQNums.has(eq.questionNumber)) {
      errors.push({
        row: 0,
        message: `Missing answer for question number: ${eq.questionNumber}`,
      });
    }
  });

  const validCount = previewRows.filter((r) => r.isValid).length;
  const invalidCount = previewRows.filter((r) => !r.isValid).length;

  return {
    fileName,
    fileSize,
    totalQuestions: previewRows.length,
    validQuestions: validCount,
    invalidQuestions: invalidCount,
    isValid: errors.length === 0 && invalidCount === 0 && previewRows.length === examQuestions.length && previewRows.length > 0,
    errors,
    warnings,
    previewRows,
  };
};

export const AnswerKeyManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const params = useParams<{ scheduleId?: string }>();
  const [searchParams] = useSearchParams();

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

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'schedule-exam',
      stepNumber: 1,
      title: 'Schedule Exam',
      subtitle: 'Create slots, dates & examination windows',
      status: 'completed',
      to: `${routePrefix}/exam-scheduling`,
    },
    {
      id: 'upload-paper',
      stepNumber: 2,
      title: 'Upload Question Paper',
      subtitle: 'Upload CSV/Excel bilingual paper',
      status: 'completed',
      to: `${routePrefix}/exam-manager/upload`,
    },
    {
      id: 'upload-key',
      stepNumber: 3,
      title: 'Upload Answer Key',
      subtitle: 'Set correct options and scoring scheme',
      status: 'current',
      to: `${routePrefix}/exam-manager/answer-key`,
    },
  ];

  // Schedule ID from route params (:scheduleId) or query (?scheduleId=...)
  const activeScheduleId = params.scheduleId || searchParams.get('scheduleId') || '';

  // ─── API Hooks ────────────────────────────────────────────────────────────
  const {
    getStatus,
    getQuestions,
    downloadTemplate,
    downloadSampleCsv,
    downloadSampleExcel,
    uploadAnswerKey,
    isLoading: isAnswerKeyLoading,
  } = useAnswerKeyAPI();

  // ─── State: Completed Exams Directory ──────────────────────────────────────
  const [completedExams, setCompletedExams] = useState<CompletedLiveExamItem[]>([]);
  const [isLoadingCompletedExams, setIsLoadingCompletedExams] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'CONFIGURED'>('ALL');

  // ─── State: Active Answer Key Editor ───────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'GRID'>('UPLOAD');
  const [statusData, setStatusData] = useState<AnswerKeyStatus | null>(null);
  const [questions, setQuestions] = useState<AnswerKeyQuestionItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<AnswerKeyPreviewResult | null>(null);
  const [isValidatingFile, setIsValidatingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedAnswers, setEditedAnswers] = useState<Record<number, string>>({});
  const [gridSearch, setGridSearch] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [rowProgressMap, setRowProgressMap] = useState<Record<string, InlineAnswerKeyProgress>>({});

  // ─── Authenticated WebSocket Real-Time Inline Progress for Answer Key / Evaluation ───
  const socketRef = useRef<Socket | null>(null);

  // Real-time WebSocket + BullMQ Job Progress tracking
  const jobProgress = useJobProgress({
    queue: 'exam-evaluation-queue',
    jobId: activeJobId || '',
    enabled: Boolean(activeJobId),
    onComplete: () => {
      toast.success('Answer Key evaluated and processed successfully!');
      queryClient.invalidateQueries({ queryKey: adminKeys.completedExams() });
      if (activeScheduleId) {
        loadAnswerKeyData();
      }
    },
    onFailed: (err) => {
      toast.error(err.message || 'Answer Key processing failed.');
    },
  });

  // Load ONLY Completed Exams List
  const loadCompletedExams = useCallback(async () => {
    setIsLoadingCompletedExams(true);
    try {
      const data = await completedExamReportsService.getCompletedLiveExams();
      // Ensure strictly COMPLETED exams (no drafts, active, or upcoming)
      const strictlyCompleted = (data || []).filter((exam) => {
        const st = (exam.status || '').toUpperCase();
        return (
          st === 'COMPLETED' ||
          st === 'ENDED' ||
          st === 'EVALUATED' ||
          st === 'PUBLISHED' ||
          (exam.endTime && new Date(exam.endTime) <= new Date())
        );
      });
      setCompletedExams(strictlyCompleted);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load completed exams.');
    } finally {
      setIsLoadingCompletedExams(false);
    }
  }, []);

  useEffect(() => {
    loadCompletedExams();
  }, [loadCompletedExams]);

  useEffect(() => {
    const token =
      localStorage.getItem('token') ||
      localStorage.getItem('access_token') ||
      sessionStorage.getItem('token') ||
      '';

    const socket = io(API_URL || '', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      loadCompletedExams();
    });

    socket.on('job.progress', (event: any) => {
      if (
        event?.job?.queue === 'exam-evaluation-queue' ||
        event?.queue === 'exam-evaluation-queue' ||
        event?.job?.name?.includes('EVALUATE')
      ) {
        const scheduleId =
          event?.job?.scheduleId ||
          event?.scheduleId ||
          event?.job?.data?.scheduleId ||
          event?.job?.examId;
        if (scheduleId) {
          setRowProgressMap((prev) => ({
            ...prev,
            [scheduleId]: {
              status: 'PROCESSING',
              percentage: Math.min(100, Math.max(0, event?.progress?.percentage || 0)),
              current: event?.progress?.current || 0,
              total: event?.progress?.total || 100,
              message: event?.message || 'Evaluating answers...',
            },
          }));
        }
      }
    });

    socket.on('job.completed', (event: any) => {
      if (
        event?.job?.queue === 'exam-evaluation-queue' ||
        event?.queue === 'exam-evaluation-queue' ||
        event?.job?.name?.includes('EVALUATE')
      ) {
        const scheduleId =
          event?.job?.scheduleId ||
          event?.scheduleId ||
          event?.job?.data?.scheduleId ||
          event?.job?.examId;
        if (scheduleId) {
          setRowProgressMap((prev) => ({
            ...prev,
            [scheduleId]: {
              status: 'COMPLETED',
              percentage: 100,
              current: prev[scheduleId]?.total || 100,
              total: prev[scheduleId]?.total || 100,
              message: 'Evaluation completed',
            },
          }));
          loadCompletedExams();
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [loadCompletedExams]);

  // Current Exam lookup
  const currentExam = useMemo(() => {
    return completedExams.find(
      (e) => e.scheduleId === activeScheduleId || e.id === activeScheduleId,
    );
  }, [completedExams, activeScheduleId]);

  const examTitle = statusData?.examTitle || currentExam?.title || 'Completed Exam';

  // Load Answer Key Status & Questions when activeScheduleId changes
  const loadAnswerKeyData = useCallback(async () => {
    if (!activeScheduleId) return;

    const [statusRes, questionsRes] = await Promise.all([
      getStatus(activeScheduleId),
      getQuestions(activeScheduleId),
    ]);

    if (statusRes.data) {
      setStatusData(statusRes.data);
    }
    if (questionsRes.data && questionsRes.data.questions) {
      setQuestions(questionsRes.data.questions);
      const initial: Record<number, string> = {};
      questionsRes.data.questions.forEach((q) => {
        if (q.correctOption) initial[q.questionNumber] = q.correctOption;
      });
      setEditedAnswers(initial);
    }
  }, [activeScheduleId, getStatus, getQuestions]);

  useEffect(() => {
    if (activeScheduleId) {
      loadAnswerKeyData();
      setSelectedFile(null);
    } else {
      setStatusData(null);
      setQuestions([]);
      setEditedAnswers({});
    }
  }, [activeScheduleId, loadAnswerKeyData]);

  // Handle Download Sample CSV Template
  const handleDownloadSampleCsv = async () => {
    await downloadSampleCsv(activeScheduleId);
    toast.success('Sample CSV template downloaded!');
  };

  // Handle Download Sample Excel Template
  const handleDownloadSampleExcel = async () => {
    const res = await downloadSampleExcel(activeScheduleId);
    if (res.success) {
      toast.success('Sample Excel template downloaded!');
    } else {
      toast.error(res.error || 'Failed to download Excel template');
    }
  };

  // Handle Download Pre-filled CSV Template
  const handleDownload = async () => {
    if (!activeScheduleId) return;
    const res = await downloadTemplate(activeScheduleId, examTitle);
    if (res.success) {
      toast.success('Pre-filled Answer Key CSV template downloaded!');
    } else {
      toast.error(res.error || 'Failed to download template');
    }
  };

  // Handle File Selected -> Parse & Validate immediately
  const handleFileChange = async (file: File) => {
    setSelectedFile(file);
    setIsValidatingFile(true);
    setPreviewData(null);
    try {
      if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        setPreviewData({
          fileName: file.name,
          fileSize: file.size,
          totalQuestions: questions.length,
          validQuestions: questions.length,
          invalidQuestions: 0,
          isValid: true,
          errors: [],
          warnings: [],
          previewRows: questions.map((q) => ({
            rowNumber: q.questionNumber,
            questionNumber: q.questionNumber,
            subject: q.subject || 'General',
            section: q.section || 'Main',
            questionType: q.questionType,
            questionText: q.questionText || `Question #${q.questionNumber}`,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            availableOptions: q.availableOptions,
            correctOption: '(Excel file: verified on submit)',
            explanation: '',
            isValid: true,
          })),
        });
        toast.success(`Excel file selected (${file.name}). Ready for verification and submission.`);
        return;
      }

      const text = await file.text();
      const result = parseAndValidateAnswerKey(text, file.name, file.size, questions);
      setPreviewData(result);
      if (!result.isValid) {
        toast.error(`Validation found ${result.errors.length} issue(s). Please inspect diagnostics below.`);
      } else {
        toast.success(`Answer Key validated successfully! ${result.validQuestions} questions ready.`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to parse file.');
      setPreviewData(null);
    } finally {
      setIsValidatingFile(false);
    }
  };

  // Handle CSV File Upload & Submission
  const handleFileUpload = async () => {
    if (statusData && statusData.isCompleted === false) {
      toast.error('Cannot upload answer key before completing exam.');
      return;
    }
    if (!selectedFile) {
      toast.error('Please select a CSV file to upload.');
      return;
    }
    if (previewData && !previewData.isValid) {
      toast.error('Cannot submit answer key with validation errors. Please resolve issues first.');
      return;
    }
    if (!activeScheduleId) return;

    setIsSubmitting(true);
    const rowsPayload = previewData?.previewRows
      ? previewData.previewRows.map((r) => ({
          questionNumber: r.questionNumber,
          correctOption: r.correctOption,
          explanation: r.explanation,
        }))
      : undefined;

    const res = await uploadAnswerKey(activeScheduleId, { file: selectedFile, rows: rowsPayload });
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(res.data?.message || 'Answer Key uploaded and verified successfully!');
    setSelectedFile(null);
    setPreviewData(null);
    await loadAnswerKeyData();
    await loadCompletedExams();

    if (res.data?.jobId) {
      setActiveJobId(res.data.jobId);
    }

    queryClient.invalidateQueries({ queryKey: adminKeys.completedExams() });
    queryClient.invalidateQueries({ queryKey: adminKeys.answerKeyStatus(activeScheduleId) });
    queryClient.invalidateQueries({ queryKey: adminKeys.answerKeyQuestions(activeScheduleId) });
  };

  // Handle Grid Save
  const handleSaveGrid = async () => {
    if (statusData && statusData.isCompleted === false) {
      toast.error('Cannot upload answer key before completing exam.');
      return;
    }
    if (!activeScheduleId) return;

    const rows = questions.map((q) => ({
      questionNumber: q.questionNumber,
      correctOption: editedAnswers[q.questionNumber] || '',
      explanation: q.explanation || '',
    }));

    const missing = rows.filter((r) => !r.correctOption);
    if (missing.length > 0) {
      if (
        !window.confirm(
          `${missing.length} questions do not have an answer selected. Save anyway?`,
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);
    const res = await uploadAnswerKey(activeScheduleId, { rows });
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(res.data?.message || 'Answer Key saved successfully!');
    await loadAnswerKeyData();
    await loadCompletedExams();

    if (res.data?.jobId) {
      setActiveJobId(res.data.jobId);
    }

    queryClient.invalidateQueries({ queryKey: adminKeys.completedExams() });
    queryClient.invalidateQueries({ queryKey: adminKeys.answerKeyStatus(activeScheduleId) });
  };

  // Filtered Questions for Grid Tab
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    questions.forEach((q) => {
      if (q.subject) subjects.add(q.subject);
    });
    return Array.from(subjects);
  }, [questions]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      const matchesSearch =
        !gridSearch.trim() ||
        String(q.questionNumber).includes(gridSearch.trim()) ||
        q.subject.toLowerCase().includes(gridSearch.toLowerCase()) ||
        q.section.toLowerCase().includes(gridSearch.toLowerCase());

      const matchesSubject =
        selectedSubjectFilter === 'ALL' || q.subject === selectedSubjectFilter;

      return matchesSearch && matchesSubject;
    });
  }, [questions, gridSearch, selectedSubjectFilter]);

  // Filtered Completed Exams
  const filteredCompletedExams = useMemo(() => {
    return completedExams.filter((exam) => {
      const q = search.toLowerCase();
      const matchesText =
        exam.title.toLowerCase().includes(q) ||
        (exam.examTarget?.name || '').toLowerCase().includes(q);

      const hasKey = Boolean(exam.hasAnswerKey);
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'PENDING' && !hasKey) ||
        (statusFilter === 'CONFIGURED' && hasKey);

      return matchesText && matchesStatus;
    });
  }, [completedExams, search, statusFilter]);

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 1: NO SPECIFIC EXAM SELECTED -> COMPLETED EXAMS DIRECTORY
  // ──────────────────────────────────────────────────────────────────────────
  if (!activeScheduleId) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* ── Workflow Step Indicator ── */}
          <WorkflowStepIndicator
            steps={workflowSteps}
            workflowTitle="Admin Examination Lifecycle & Setup"
          />

          {/* Header (White/Light Theme) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 bg-white p-6 rounded-3xl shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                <Key size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    Answer Key Management
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    Completed Exams Only
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  Select a completed live examination to upload, review, or edit the evaluation answer key
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => navigate(`${routePrefix}/exam-manager`)}
              className="flex items-center gap-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold px-4 py-2 rounded-xl self-start sm:self-auto"
            >
              <ArrowLeft size={14} /> Back to Exam Manager
            </Button>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search completed exams by title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial ${
                  statusFilter === 'ALL'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                All Completed ({completedExams.length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial ${
                  statusFilter === 'PENDING'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Key Pending
              </button>
              <button
                onClick={() => setStatusFilter('CONFIGURED')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial ${
                  statusFilter === 'CONFIGURED'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                Key Ready
              </button>
            </div>
          </div>

          {/* Completed Exams Directory (Section-level Loading) */}
          {isLoadingCompletedExams ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-500 shadow-xs">
              <RefreshCw size={28} className="animate-spin text-indigo-600 mb-3" />
              <span className="text-xs font-bold">Loading completed examinations...</span>
            </div>
          ) : filteredCompletedExams.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
              <AlertTriangle size={32} className="mx-auto text-amber-500 mb-2.5" />
              <h3 className="text-base font-bold text-slate-900">No Completed Exams Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Only live exams whose scheduled window has concluded appear here for answer key configuration.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                      <th className="p-4 pl-6">Completed Exam</th>
                      <th className="p-4">Target Standard</th>
                      <th className="p-4">Exam Date & Duration</th>
                      <th className="p-4">Questions</th>
                      <th className="p-4">Student Attendees</th>
                      <th className="p-4">Key Status</th>
                      <th className="p-4 pr-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredCompletedExams.map((exam) => {
                      const hasKey = Boolean(exam.hasAnswerKey);
                      const targetScheduleId = exam.scheduleId || exam.id;
                      const rowProg = rowProgressMap[targetScheduleId] || rowProgressMap[exam.id];
                      const isProcessing = rowProg && rowProg.status === 'PROCESSING';

                      return (
                        <tr key={exam.id} className="hover:bg-slate-50/70 transition">
                          <td className="p-4 pl-6">
                            <div className="font-bold text-slate-900 text-sm">{exam.title}</div>
                            <span className="text-[10px] font-mono text-slate-400">ID: {exam.id.slice(0, 8)}</span>
                          </td>

                          <td className="p-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {exam.examTarget?.name || 'General'}
                            </span>
                          </td>

                          <td className="p-4 text-xs text-slate-600">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{exam.examDate ? new Date(exam.examDate).toLocaleDateString() : 'Concluded'}</span>
                            </div>
                            <span className="text-[10px] text-slate-500">{exam.durationMinutes} minutes</span>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-1.5 font-bold text-slate-900">
                              <Layers size={13} className="text-slate-400" />
                              <span>{exam.totalQuestions} Questions</span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {exam.totalMarks} Marks
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                              <UserCheck size={13} className="text-slate-400" />
                              <span>{exam.totalAttempts || 0} Submissions</span>
                            </div>
                          </td>

                          {/* Key Status & INLINE Progress Bar */}
                          <td className="p-4">
                            {isProcessing ? (
                              <div className="space-y-1.5 min-w-[150px] max-w-[220px]">
                                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-950">
                                  <span className="flex items-center gap-1">
                                    <RefreshCw size={11} className="animate-spin text-emerald-600" />
                                    <span>Processing</span>
                                  </span>
                                  <span className="font-mono text-emerald-600 font-extrabold">
                                    {rowProg?.percentage || 20}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-2xs">
                                  <div
                                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${rowProg?.percentage || 20}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                  <span>
                                    {rowProg?.current || 0} / {rowProg?.total || 100} evaluated
                                  </span>
                                </div>
                              </div>
                            ) : hasKey ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                  <CheckCircle2 size={12} /> Key Ready
                                </span>
                                <span className="text-[10px] text-slate-500 block font-semibold pl-1">
                                  {exam.totalQuestions} Answers Persisted
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                                <Clock size={12} /> Key Pending
                              </span>
                            )}
                          </td>

                          {/* Actions: View / Replace / Add */}
                          <td className="p-4 pr-6 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {hasKey ? (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      navigate(
                                        `${routePrefix}/exams/${targetScheduleId}/answer-key/view`,
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                                  >
                                    <Eye size={12} />
                                    <span>View Answer Key</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      navigate(
                                        `${routePrefix}/exam-manager/answer-key/${targetScheduleId}`,
                                      )
                                    }
                                    disabled={isProcessing}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white transition shadow-2xs"
                                  >
                                    <Key size={12} />
                                    <span>Replace Answer Key</span>
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    navigate(
                                      `${routePrefix}/exam-manager/answer-key/${targetScheduleId}`,
                                    )
                                  }
                                  disabled={isProcessing}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs"
                                >
                                  {isProcessing ? (
                                    <>
                                      <RefreshCw size={12} className="animate-spin" />
                                      <span>Processing...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Key size={12} />
                                      <span>Add Answer Key</span>
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // VIEW 2: SPECIFIC COMPLETED EXAM SELECTED -> ANSWER KEY EDITOR (WHITE THEME)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Workflow Step Indicator ── */}
        <WorkflowStepIndicator
          steps={workflowSteps}
          workflowTitle="Admin Examination Lifecycle & Setup"
        />

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5 bg-white p-6 rounded-3xl shadow-xs">
          <div className="flex items-start gap-3.5">
            <button
              onClick={() => navigate(`${routePrefix}/exam-manager/answer-key`)}
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition"
              title="Back to Completed Exams"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Answer Key Configuration
                </h1>
                {statusData?.hasAnswerKey ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                    <CheckCircle2 size={13} /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                    <Clock size={13} /> Pending Upload
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                <span>Completed Exam:</span>
                <span className="text-slate-900 font-bold">{examTitle}</span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-400">ID: {activeScheduleId.slice(0, 8)}...</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <Button
              variant="outline"
              onClick={() => navigate(`${routePrefix}/exam-manager/answer-key`)}
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold px-3.5 py-2 rounded-xl"
            >
              Completed Exams List
            </Button>
          </div>
        </div>

        {/* Uncompleted Exam Warning Banner */}
        {statusData && statusData.isCompleted === false && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <p className="text-xs font-bold text-rose-900">
                Cannot upload answer key before completing exam
              </p>
              <p className="text-[11px] text-rose-700 mt-0.5">
                This examination is currently scheduled or in progress. Answer key upload and manual editing are locked until the official examination has ended.
              </p>
            </div>
          </div>
        )}

        {/* Snapshot Metric Cards (White/Light Theme) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Questions
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {statusData?.totalQuestions || questions.length || 0}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Configured Keys
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {statusData?.configuredKeysCount || Object.keys(editedAnswers).length}
              <span className="text-xs font-normal text-slate-400 ml-1.5">
                / {statusData?.totalQuestions || questions.length || 0}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Schedule Status
            </span>
            <div className="text-sm font-black text-indigo-600 mt-2 uppercase tracking-wide">
              {statusData?.scheduleStatus || 'COMPLETED'}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Last Updated By
            </span>
            <div className="text-xs font-bold text-slate-800 mt-2 truncate">
              {statusData?.answerKeyUploadedBy?.name || 'Not yet uploaded'}
            </div>
            {statusData?.answerKeyUploadedAt && (
              <div className="text-[10px] text-slate-400 mt-0.5">
                {new Date(statusData.answerKeyUploadedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Evaluation Banner */}
        <div className="flex items-start sm:items-center gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 text-xs text-indigo-950 shadow-xs">
          <Sparkles size={18} className="shrink-0 text-indigo-600 mt-0.5 sm:mt-0" />
          <span>
            <b>Automated Evaluation Notice:</b> Answers saved here establish the master ground truth. Once saved, automated background evaluation triggers for all submitted student attempts using BullMQ and WebSocket updates.
          </span>
        </div>

        {/* Real-time Job Progress (if active) */}
        {activeJobId && (
          <div className="bg-white rounded-2xl border border-indigo-100 p-4 shadow-xs space-y-2">
            <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider block">
              Worker Evaluation Progress
            </span>
            <JobProgressBar
              status={jobProgress.status}
              percentage={jobProgress.percentage}
              stage={jobProgress.stage}
              message={jobProgress.message}
            />
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            onClick={() => setActiveTab('UPLOAD')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'UPLOAD'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Upload size={14} /> Spreadsheet Upload (CSV)
          </button>
          <button
            onClick={() => setActiveTab('GRID')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'GRID'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
            }`}
          >
            <Layers size={14} /> Interactive Answer Grid ({questions.length})
          </button>
        </div>

        {/* Tab Body (Section-level Loading) */}
        {isAnswerKeyLoading && !statusData ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center text-slate-500 shadow-xs">
            <RefreshCw size={26} className="animate-spin text-indigo-600 mb-3" />
            <span className="text-xs font-bold">Loading exam structure & answer keys...</span>
          </div>
        ) : activeTab === 'UPLOAD' ? (
          /* ── TAB 1: SPREADSHEET UPLOAD ── */
          <div className="space-y-5">
            {/* Selected Exam Context Banner (Requirement 15) */}
            <div className="rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-indigo-50/40 p-6 shadow-xs space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 block">
                Selected Examination Context
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 rounded-2xl bg-white border border-indigo-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Exam
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm truncate block mt-0.5">
                    {examTitle || 'Official Exam'}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-indigo-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Version
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-xs font-bold text-indigo-700 mt-0.5">
                    Current ExamVersion
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-white border border-indigo-100 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Question Count
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm block mt-0.5">
                    {statusData?.totalQuestions || questions.length || 0} Questions
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 pt-1">
                Question numbers in your upload are strictly scoped to this <b>ExamVersion</b>. The backend maps each question number to its persistent Question ID, preserving student question randomization.
              </p>
            </div>

            {/* Step 1: Download Templates (Requirement 11, 12, 13, 14) */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet size={18} className="text-emerald-600" />
                    Answer Key Upload Format
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xl">
                    Upload a CSV/Excel file using the following simple columns:
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-indigo-700 font-bold border border-slate-200">
                      question_number
                    </span>
                    <span className="text-slate-400">,</span>
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-indigo-700 font-bold border border-slate-200">
                      correct_answer
                    </span>
                  </div>
                </div>

                {/* Template Download Actions */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    onClick={handleDownloadSampleCsv}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
                  >
                    <Download size={14} />
                    Download Sample CSV
                  </Button>
                  <Button
                    onClick={handleDownloadSampleExcel}
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
                  >
                    <Download size={14} />
                    Download Sample Excel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    disabled={isAnswerKeyLoading}
                    className="flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs"
                  >
                    <Download size={14} />
                    Pre-filled Paper CSV
                  </Button>
                </div>
              </div>

              {/* Sample Format Preview Callout */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs text-slate-600 font-mono flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Sample Structure
                  </span>
                  <code>1,A &nbsp;|&nbsp; 2,B &nbsp;|&nbsp; 3,D &nbsp;|&nbsp; 4,C &nbsp;|&nbsp; 5,A</code>
                </div>
                <span className="text-[11px] text-slate-400 italic">No Question IDs or UUIDs required</span>
              </div>
            </div>

            {/* Step 2: Upload Completed Answer Key */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <Upload size={18} className="text-indigo-600" />
                  Step 2: Upload Completed Answer Key
                </h3>
                {/* Sample Test File Shortcuts */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-slate-400">Test Samples:</span>
                  <button
                    type="button"
                    id="btn-load-valid-answer-key"
                    onClick={() => {
                      const csv = `question_number,correct_answer\n1,A\n2,B\n3,C\n4,D\n5,A\n6,25\n7,10.5\n8,0\n9,100\n10,42\n11,A\n12,B\n13,C\n14,D\n15,A`;
                      const f = new File([csv], 'AnswerKey_Valid_Simple_Format.csv', { type: 'text/csv' });
                      handleFileChange(f);
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                  >
                    Sample: Valid 2-Column Key
                  </button>
                  <button
                    type="button"
                    id="btn-load-invalid-option"
                    onClick={() => {
                      const csv = `question_number,correct_answer\n1,Z\n2,B\n3,C\n4,D\n5,A\n6,25\n7,10.5\n8,0\n9,100\n10,42\n11,A\n12,B\n13,C\n14,D\n15,A`;
                      const f = new File([csv], 'AnswerKey_Invalid_Option.csv', { type: 'text/csv' });
                      handleFileChange(f);
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                  >
                    Sample: Invalid Option 'Z'
                  </button>
                  <button
                    type="button"
                    id="btn-load-duplicate-number"
                    onClick={() => {
                      const csv = `question_number,correct_answer\n1,A\n1,B\n3,C\n4,D\n5,A\n6,25\n7,10.5\n8,0\n9,100\n10,42\n11,A\n12,B\n13,C\n14,D\n15,A`;
                      const f = new File([csv], 'AnswerKey_Duplicate_Number.csv', { type: 'text/csv' });
                      handleFileChange(f);
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition"
                  >
                    Sample: Duplicate Q#1
                  </button>
                  <button
                    type="button"
                    id="btn-load-missing-number"
                    onClick={() => {
                      const csv = `question_number,correct_answer\n1,A\n2,B\n4,D\n5,A\n6,25\n7,10.5\n8,0\n9,100\n10,42\n11,A\n12,B\n13,C\n14,D\n15,A`;
                      const f = new File([csv], 'AnswerKey_Missing_Q3.csv', { type: 'text/csv' });
                      handleFileChange(f);
                    }}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition"
                  >
                    Sample: Missing Q#3
                  </button>
                </div>
              </div>

              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 text-center transition bg-slate-50/60">
                <input
                  id="answer-key-file-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-3 border border-indigo-100">
                    <Upload size={22} />
                  </div>
                  {selectedFile ? (
                    <div>
                      <p id="selected-file-name" className="text-sm font-black text-indigo-700">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB — Click or drag to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Drop your filled Answer Key CSV/Excel here, or <span className="text-indigo-600 underline">browse</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Requires "question_number" and "correct_answer" columns (.csv or .xlsx)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Validation Loading Card */}
            {isValidatingFile && (
              <div className="rounded-3xl border border-indigo-100 bg-white p-8 flex flex-col items-center justify-center text-center shadow-xs">
                <RefreshCw size={26} className="animate-spin text-indigo-600 mb-2" />
                <span className="text-xs font-bold text-slate-900">Validating Answer Key Against Examination Paper...</span>
                <span className="text-[11px] text-slate-400 mt-0.5">Verifying question numbers, question types, available option keys, and scoring parameters</span>
              </div>
            )}

            {/* Step 3: Pre-Submission Preview & Diagnostics */}
            {previewData && !isValidatingFile && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-black">
                        3
                      </span>
                      <span>Pre-Submission Preview & Diagnostics</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Inspect parsed answer options and validation diagnostics before persisting and triggering evaluation
                    </p>
                  </div>
                  <div>
                    {previewData.isValid ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                        <CheckCircle2 size={14} /> Ready for Submission
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                        <AlertTriangle size={14} /> Validation Errors Found ({previewData.errors.length})
                      </span>
                    )}
                  </div>
                </div>

                {/* Validation Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Total Questions in File
                    </div>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {previewData.totalQuestions}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                      Valid Questions
                    </div>
                    <div className="text-lg font-black text-emerald-700 mt-0.5">
                      {previewData.validQuestions}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                    <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                      Invalid Questions
                    </div>
                    <div className="text-lg font-black text-rose-700 mt-0.5">
                      {previewData.invalidQuestions}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                    <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider">
                      Target Exam
                    </div>
                    <div className="text-xs font-bold text-indigo-950 mt-1 truncate">
                      {examTitle}
                    </div>
                  </div>
                </div>

                {/* Error Diagnostics Callout */}
                {previewData.errors.length > 0 && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                      <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                      <span>Validation Diagnostics ({previewData.errors.length} Issue(s) Detected)</span>
                    </div>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pl-6 text-xs text-rose-700 font-medium divide-y divide-rose-100/60">
                      {previewData.errors.map((err, eIdx) => (
                        <div key={eIdx} className="pt-1 first:pt-0">
                          <span className="font-mono font-bold text-rose-900">Row {err.row}:</span> {err.message}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Warnings Callout */}
                {previewData.warnings.length > 0 && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 space-y-1 text-xs text-amber-800 font-medium">
                    <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                      <HelpCircle size={14} className="text-amber-600 shrink-0" />
                      <span>File Completeness Notices ({previewData.warnings.length})</span>
                    </div>
                    {previewData.warnings.map((w, wIdx) => (
                      <div key={wIdx} className="pl-5">
                        • {w.message}
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview Table */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10 text-[11px] uppercase tracking-wider font-bold text-slate-600">
                        <tr>
                          <th className="p-3 pl-4">Row / Q#</th>
                          <th className="p-3">Subject / Section</th>
                          <th className="p-3">Question Statement</th>
                          <th className="p-3">Type</th>
                          <th className="p-3">Marks (+ / -)</th>
                          <th className="p-3">Available Options</th>
                          <th className="p-3">Correct Key</th>
                          <th className="p-3 pr-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {previewData.previewRows.map((row) => (
                          <tr
                            key={row.rowNumber}
                            className={row.isValid ? 'hover:bg-slate-50/60' : 'bg-rose-50/30'}
                          >
                            <td className="p-3 pl-4 font-mono font-bold text-slate-700">
                              Row {row.rowNumber} (Q#{row.questionNumber})
                            </td>
                            <td className="p-3 text-slate-600">
                              <span className="font-semibold text-slate-800">{row.subject}</span>
                              <span className="text-[10px] text-slate-400 block">{row.section}</span>
                            </td>
                            <td className="p-3 max-w-xs sm:max-w-md">
                              <div className="font-medium text-slate-900 line-clamp-1">
                                {row.questionText}
                              </div>
                              {row.explanation && (
                                <span className="text-[10px] text-slate-400 block line-clamp-1">
                                  Expl: {row.explanation}
                                </span>
                              )}
                            </td>
                            <td className="p-3 font-mono text-[11px] text-slate-600">
                              {row.questionType}
                            </td>
                            <td className="p-3 font-mono font-semibold text-slate-700">
                              +{row.marks} / -{row.negativeMarks}
                            </td>
                            <td className="p-3 font-mono text-slate-500">
                              {row.availableOptions}
                            </td>
                            <td className="p-3 font-mono font-bold text-indigo-600 text-sm">
                              {row.correctOption || '—'}
                            </td>
                            <td className="p-3 pr-4 text-center">
                              {row.isValid ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                                  <CheckCircle2 size={11} /> Valid
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10px] font-bold cursor-help"
                                  title={row.errorMessage}
                                >
                                  <AlertTriangle size={11} /> Invalid
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewData(null);
                    }}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl px-4 py-2"
                  >
                    <X size={14} className="mr-1.5" /> Clear & Select Different File
                  </Button>

                  <Button
                    id="submit-answer-key-button"
                    onClick={handleFileUpload}
                    disabled={isSubmitting || !previewData.isValid || statusData?.isCompleted === false}
                    title={
                      statusData?.isCompleted === false
                        ? 'Cannot upload answer key before completing exam'
                        : !previewData.isValid
                        ? 'Resolve all validation diagnostics above to enable submission'
                        : undefined
                    }
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Persisting & Enqueueing Evaluation...
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Submit & Process Answer Key ({previewData.validQuestions} Questions)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* CSV Format Requirements */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-2">
                <FileCheck size={14} className="text-indigo-600" />
                CSV Format Requirements
              </h4>
              <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                <li>Headers must include: <code className="text-indigo-600 font-mono">Question Number</code> and <code className="text-indigo-600 font-mono">Correct Option</code>.</li>
                <li>Single-choice questions accept <code className="text-slate-900 font-mono">A</code>, <code className="text-slate-900 font-mono">B</code>, <code className="text-slate-900 font-mono">C</code>, or <code className="text-slate-900 font-mono">D</code>.</li>
                <li>Numerical questions accept integer or decimal numbers.</li>
              </ul>
            </div>
          </div>
        ) : (
          /* ── TAB 2: INTERACTIVE ANSWER GRID ── */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search Q# or subject..."
                    value={gridSearch}
                    onChange={(e) => setGridSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  />
                </div>

                {uniqueSubjects.length > 0 && (
                  <select
                    value={selectedSubjectFilter}
                    onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">All Subjects ({questions.length})</option>
                    {uniqueSubjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs text-slate-600">
                  Configured: <b className="text-emerald-600">{Object.keys(editedAnswers).length}</b> / {questions.length}
                </span>

                <Button
                  onClick={handleSaveGrid}
                  disabled={isSubmitting || statusData?.isCompleted === false}
                  title={statusData?.isCompleted === false ? 'Cannot upload answer key before completing exam' : undefined}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={13} /> Save Answers ({Object.keys(editedAnswers).length}/{questions.length})
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Questions Table */}
            <div className="border border-slate-200 rounded-3xl overflow-hidden bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                      <th className="p-3.5 pl-5">Q#</th>
                      <th className="p-3.5">Subject / Section</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5">Marks (+ / -)</th>
                      <th className="p-3.5">Options</th>
                      <th className="p-3.5 pr-5">Correct Key</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredQuestions.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-400">
                          No questions match the filter.
                        </td>
                      </tr>
                    ) : (
                      filteredQuestions.map((q) => {
                        const currentVal = editedAnswers[q.questionNumber] || '';
                        const availableOpts = q.availableOptions
                          ? q.availableOptions.split('/')
                          : ['A', 'B', 'C', 'D'];

                        return (
                          <tr key={q.questionNumber} className="hover:bg-slate-50/60 transition">
                            <td className="p-3.5 pl-5 font-black text-slate-900 whitespace-nowrap">
                              #{q.questionNumber}
                            </td>
                            <td className="p-3.5">
                              <span className="text-slate-900 font-bold">{q.subject}</span>
                              <span className="text-slate-400 ml-1.5">({q.section})</span>
                            </td>
                            <td className="p-3.5">
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">
                                {q.questionType}
                              </span>
                            </td>
                            <td className="p-3.5 text-slate-600 font-mono">
                              +{q.marks} / -{q.negativeMarks}
                            </td>
                            <td className="p-3.5 text-slate-500 font-mono">
                              {q.availableOptions || 'A/B/C/D'}
                            </td>
                            <td className="p-3.5 pr-5">
                              {q.questionType === 'NUMERICAL' ? (
                                <input
                                  type="text"
                                  value={currentVal}
                                  onChange={(e) =>
                                    setEditedAnswers((prev) => ({
                                      ...prev,
                                      [q.questionNumber]: e.target.value,
                                    }))
                                  }
                                  placeholder="Enter value"
                                  className="w-32 rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-indigo-500 focus:bg-white focus:outline-none font-mono"
                                />
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  {availableOpts.map((opt) => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() =>
                                        setEditedAnswers((prev) => ({
                                          ...prev,
                                          [q.questionNumber]: opt,
                                        }))
                                      }
                                      className={`h-8 w-8 rounded-lg text-xs font-black transition flex items-center justify-center ${
                                        currentVal.toUpperCase() === opt.toUpperCase()
                                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-xs'
                                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                  {currentVal && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setEditedAnswers((prev) => {
                                          const next = { ...prev };
                                          delete next[q.questionNumber];
                                          return next;
                                        })
                                      }
                                      title="Clear answer"
                                      className="ml-2 text-[10px] text-slate-400 hover:text-rose-600 transition underline"
                                    >
                                      Clear
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 p-3.5 px-5 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <HelpCircle size={13} className="text-slate-400" />
                  Showing {filteredQuestions.length} of {questions.length} questions
                </span>

                <Button
                  onClick={handleSaveGrid}
                  disabled={isSubmitting}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-1.5 rounded-xl shadow-xs"
                >
                  <Save size={13} className="mr-1.5" /> Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnswerKeyManagementPage;
