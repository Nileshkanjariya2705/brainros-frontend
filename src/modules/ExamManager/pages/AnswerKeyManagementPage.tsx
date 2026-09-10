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

export const AnswerKeyManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const params = useParams<{ scheduleId?: string }>();
  const [searchParams] = useSearchParams();

  const routePrefix = location.pathname.startsWith('/super-admin')
    ? '/super-admin'
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

  // Handle Download CSV Template
  const handleDownload = async () => {
    if (!activeScheduleId) return;
    const res = await downloadTemplate(activeScheduleId, examTitle);
    if (res.success) {
      toast.success('Pre-filled Answer Key CSV template downloaded!');
    } else {
      toast.error(res.error || 'Failed to download template');
    }
  };

  // Handle CSV File Upload
  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file to upload.');
      return;
    }
    if (!activeScheduleId) return;

    setIsSubmitting(true);
    const res = await uploadAnswerKey(activeScheduleId, { file: selectedFile });
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(res.data?.message || 'Answer Key uploaded and verified successfully!');
    setSelectedFile(null);
    await loadAnswerKeyData();
    await loadCompletedExams();

    if (res.data?.jobId) {
      setActiveJobId(res.data.jobId);
    }

    queryClient.invalidateQueries({ queryKey: adminKeys.completedExams() });
    queryClient.invalidateQueries({ queryKey: adminKeys.answerKeyStatus(activeScheduleId) });
  };

  // Handle Grid Save
  const handleSaveGrid = async () => {
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
            {/* Step 1: Download Pre-filled Template */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet size={18} className="text-emerald-600" />
                    Step 1: Download Pre-filled Template
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                    Generates a customized CSV pre-populated with all {questions.length} questions, subjects, sections, and available option choices for this exam.
                  </p>
                </div>
                <Button
                  onClick={handleDownload}
                  disabled={isAnswerKeyLoading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shrink-0 shadow-xs"
                >
                  <Download size={14} />
                  Download CSV Template
                </Button>
              </div>
            </div>

            {/* Step 2: Upload Completed Answer Key */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 mb-3">
                <Upload size={18} className="text-indigo-600" />
                Step 2: Upload Completed Answer Key
              </h3>

              <div className="relative border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-8 text-center transition bg-slate-50/60">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
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
                      <p className="text-sm font-black text-emerald-600">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB — Click or drag to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Drop your filled Answer Key CSV here, or <span className="text-indigo-600 underline">browse</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Requires "Question Number" and "Correct Option" columns
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedFile && (
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleFileUpload}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-xs"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Verifying & Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Upload & Verify Answer Key
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

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
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
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
