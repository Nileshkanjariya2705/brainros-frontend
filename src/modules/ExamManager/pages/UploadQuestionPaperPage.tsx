import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  UploadCloud,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  ArrowLeft,
  RefreshCw,
  Eye,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';
import {
  useGetExamsListAPI,
  useRetryQuestionPaperUploadAPI,
  downloadQuestionPaperTemplate,
} from '../services/examManager.service';
import type { ExamItem } from '../types/examManager.types';
import { useQueryClient } from '@tanstack/react-query';
import { adminKeys } from '@/services/queryKeys';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@config';
import { WorkflowStepIndicator, type WorkflowStep } from '@/components/ui/WorkflowStepIndicator';

interface InlineProgressState {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  percentage: number;
  current: number;
  total: number;
  message?: string;
}

export const UploadQuestionPaperPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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

  const activeExamIdFromUrl = searchParams.get('activeExamId');

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
      status: 'current',
      to: `${routePrefix}/exam-manager/upload`,
    },
    {
      id: 'upload-key',
      stepNumber: 3,
      title: 'Upload Answer Key',
      subtitle: 'Set correct options and scoring scheme',
      status: 'pending',
      to: `${routePrefix}/exam-manager/answer-key`,
    },
  ];

  // ─── Data & Filter State ───────────────────────────────────────────────────
  const [scheduledExams, setScheduledExams] = useState<ExamItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING' | 'UPLOADED'>('ALL');

  // ─── Inline Row Progress State Map (examId -> Progress) ───────────────────
  const [rowProgressMap, setRowProgressMap] = useState<Record<string, InlineProgressState>>({});

  // ─── API Hooks ─────────────────────────────────────────────────────────────
  const { getExamsListAPI, isLoading: isLoadingExams } = useGetExamsListAPI();
  const { retryQuestionPaperUploadAPI } = useRetryQuestionPaperUploadAPI();

  // Load Scheduled Exams List
  const loadExams = useCallback(async () => {
    const res = await getExamsListAPI({ limit: 100, sortBy: 'createdAt', sortOrder: 'desc' });
    if (res.data && res.data.items) {
      // Show exams that have a schedule or are in SCHEDULED / DRAFT / ACTIVE status
      const scheduled = res.data.items.filter(
        (e) => Boolean(e.schedule) || e.status === 'SCHEDULED' || (e.totalQuestions || 0) > 0,
      );
      setScheduledExams(scheduled);

      // Initialize row progress for any exams currently in PROCESSING status
      const initialProgress: Record<string, InlineProgressState> = {};
      scheduled.forEach((exam) => {
        if (exam.questionPaperStatus === 'PROCESSING' || exam.id === activeExamIdFromUrl) {
          const total = exam.totalRows || exam.totalQuestions || 100;
          const current = exam.validRows || 0;
          const pct = total > 0 && current > 0 ? Math.round((current / total) * 100) : 10;
          initialProgress[exam.id] = {
            status: 'PROCESSING',
            percentage: pct,
            current,
            total,
            message: 'Processing questions in background...',
          };
        }
      });
      if (Object.keys(initialProgress).length > 0) {
        setRowProgressMap((prev) => ({ ...prev, ...initialProgress }));
      }
    }
  }, [getExamsListAPI, activeExamIdFromUrl]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // ─── Authenticated WebSocket Real-Time Inline Progress ─────────────────────
  const socketRef = useRef<Socket | null>(null);

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
      // Re-synchronize state on connect / reconnect
      loadExams();
    });

    // Handle real-time progress events from BullMQ worker
    socket.on('job.progress', (event: any) => {
      if (event?.job?.queue === 'exam-import-queue') {
        const examId = event?.job?.examId;
        if (examId) {
          setRowProgressMap((prev) => ({
            ...prev,
            [examId]: {
              status: 'PROCESSING',
              percentage: Math.min(100, Math.max(0, event?.progress?.percentage || 0)),
              current: event?.progress?.current || 0,
              total: event?.progress?.total || 0,
              message: event?.message || 'Processing questions...',
            },
          }));
        }
      }
    });

    // Handle completion
    socket.on('job.completed', (event: any) => {
      if (event?.job?.queue === 'exam-import-queue') {
        const examId = event?.job?.examId;
        if (examId) {
          setRowProgressMap((prev) => {
            const updated = { ...prev };
            delete updated[examId];
            return updated;
          });

          // Optimistically update the affected exam row without full-page reloads
          setScheduledExams((prev) =>
            prev.map((e) =>
              e.id === examId
                ? {
                    ...e,
                    questionPaperStatus: 'COMPLETED',
                    totalQuestions:
                      event?.resultSummary?.questionsCreated || e.totalQuestions || 1,
                  }
                : e,
            ),
          );

          toast.success('Question paper processed and imported successfully!');
          queryClient.invalidateQueries({ queryKey: adminKeys.scheduledExams() });
        }
      }
    });

    // Handle failure
    socket.on('job.failed', (event: any) => {
      if (event?.job?.queue === 'exam-import-queue') {
        const examId = event?.job?.examId;
        if (examId) {
          setRowProgressMap((prev) => {
            const updated = { ...prev };
            delete updated[examId];
            return updated;
          });

          setScheduledExams((prev) =>
            prev.map((e) =>
              e.id === examId
                ? {
                    ...e,
                    questionPaperStatus: 'FAILED',
                    importError: event?.message || 'Processing failed.',
                  }
                : e,
            ),
          );

          toast.error(`Question paper import failed: ${event?.message || 'Unknown error'}`);
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [loadExams, queryClient]);

  // ─── Filtered Scheduled Exams ──────────────────────────────────────────────
  const filteredScheduledExams = useMemo(() => {
    return scheduledExams.filter((exam) => {
      const q = search.toLowerCase();
      const matchesText =
        exam.title.toLowerCase().includes(q) ||
        (exam.examTarget?.name || '').toLowerCase().includes(q) ||
        exam.sections?.some((s) => {
          const subName = typeof s.subject === 'object' ? s.subject?.name : String(s.subject || '');
          return s.name.toLowerCase().includes(q) || (subName || '').toLowerCase().includes(q);
        });

      const hasQuestions =
        exam.questionPaperStatus === 'COMPLETED' ||
        ((exam.totalQuestions || 0) > 0 && exam.questionPaperStatus !== 'NOT_UPLOADED');

      const matchesTab =
        filterTab === 'ALL' ||
        (filterTab === 'PENDING' && !hasQuestions) ||
        (filterTab === 'UPLOADED' && hasQuestions);

      return matchesText && matchesTab;
    });
  }, [scheduledExams, search, filterTab]);

  // ─── Retry Handler ────────────────────────────────────────────────────────
  const handleRetry = async (examId: string) => {
    toast.info('Re-queuing question paper upload...');
    const res = await retryQuestionPaperUploadAPI(examId);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Question paper queued for retry.');
      setRowProgressMap((prev) => ({
        ...prev,
        [examId]: {
          status: 'PROCESSING',
          percentage: 5,
          current: 0,
          total: 100,
          message: 'Retrying question paper processing...',
        },
      }));
      setScheduledExams((prev) =>
        prev.map((e) => (e.id === examId ? { ...e, questionPaperStatus: 'PROCESSING' } : e)),
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Workflow Step Indicator ── */}
        <WorkflowStepIndicator
          steps={workflowSteps}
          workflowTitle="Admin Examination Lifecycle & Setup"
        />

        {/* ── Header (White/Light Theme) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 bg-white p-6 rounded-3xl shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <UploadCloud size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Question Paper Upload
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Scheduled Exams
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Upload and inspect question papers for scheduled examinations via CSV or Excel
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="outline"
              onClick={() => downloadQuestionPaperTemplate('xlsx')}
              className="flex items-center gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold px-3.5 py-2 rounded-xl"
            >
              <Download size={14} className="text-emerald-600" /> Excel Template
            </Button>
            <Button
              variant="outline"
              onClick={() => downloadQuestionPaperTemplate('csv')}
              className="flex items-center gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold px-3.5 py-2 rounded-xl"
            >
              <Download size={14} className="text-indigo-600" /> CSV Template
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`${routePrefix}/exam-manager`)}
              className="flex items-center gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold px-3.5 py-2 rounded-xl"
            >
              <ArrowLeft size={14} /> Back
            </Button>
          </div>
        </div>

        {/* ── Search & Filter Bar ── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search scheduled exam by title or target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial ${
                filterTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              All Scheduled ({scheduledExams.length})
            </button>
            <button
              onClick={() => setFilterTab('PENDING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial ${
                filterTab === 'PENDING'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Paper Pending
            </button>
            <button
              onClick={() => setFilterTab('UPLOADED')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial ${
                filterTab === 'UPLOADED'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              Paper Ready
            </button>
          </div>
        </div>

        {/* ── Scheduled Exams Table (Section-level Loading) ── */}
        {isLoadingExams ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-500 shadow-xs">
            <RefreshCw size={28} className="animate-spin text-indigo-600 mb-3" />
            <span className="text-xs font-bold">Loading scheduled examinations...</span>
          </div>
        ) : filteredScheduledExams.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
            <AlertTriangle size={32} className="mx-auto text-amber-500 mb-2.5" />
            <h3 className="text-base font-bold text-slate-900">No Scheduled Exams Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No examinations currently match your filter. Please schedule an examination first under Exam Scheduling.
            </p>
            <Button
              onClick={() => navigate(`${routePrefix}/exam-scheduling`)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Go to Exam Scheduling
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider font-bold text-slate-500">
                    <th className="p-4 pl-6">Exam Name</th>
                    <th className="p-4">Target / Type</th>
                    <th className="p-4">Subject & Sections</th>
                    <th className="p-4">Schedule Window</th>
                    <th className="p-4">Question Paper</th>
                    <th className="p-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredScheduledExams.map((exam) => {
                    const rowProg = rowProgressMap[exam.id];
                    const isProcessing =
                      Boolean(rowProg) || exam.questionPaperStatus === 'PROCESSING';

                    const hasQuestions =
                      exam.questionPaperStatus === 'COMPLETED' ||
                      ((exam.totalQuestions || 0) > 0 && exam.questionPaperStatus !== 'NOT_UPLOADED');

                    const isFailed =
                      exam.questionPaperStatus === 'FAILED' && !isProcessing && !hasQuestions;

                    const startTime = exam.schedule?.startTime;
                    const endTime = exam.schedule?.endTime;

                    const firstSec = exam.sections?.[0];
                    const firstSubName = firstSec
                      ? typeof firstSec.subject === 'object'
                        ? firstSec.subject?.name
                        : String(firstSec.subject || '')
                      : '';

                    return (
                      <tr key={exam.id} className="hover:bg-slate-50/70 transition">
                        {/* Exam Title */}
                        <td className="p-4 pl-6">
                          <div className="font-bold text-slate-900 text-sm">{exam.title}</div>
                          <span className="text-[10px] font-mono text-slate-400">
                            ID: {exam.id.slice(0, 8)}
                          </span>
                        </td>

                        {/* Target */}
                        <td className="p-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {exam.examTarget?.name || 'General'}
                          </span>
                        </td>

                        {/* Subject & Sections */}
                        <td className="p-4">
                          {firstSec ? (
                            <div className="space-y-0.5">
                              <span className="text-slate-900 font-semibold">
                                {firstSubName || firstSec.name}
                              </span>
                              {exam.sections && exam.sections.length > 1 && (
                                <span className="text-[10px] text-slate-500 block">
                                  +{exam.sections.length - 1} more section(s)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Not specified</span>
                          )}
                        </td>

                        {/* Schedule Window */}
                        <td className="p-4 text-xs text-slate-600">
                          {startTime ? (
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1">
                                <Clock size={12} className="text-slate-400" />
                                <span>{new Date(startTime).toLocaleDateString()}</span>
                              </div>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {new Date(startTime).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                -{' '}
                                {endTime
                                  ? new Date(endTime).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })
                                  : 'End'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Time unconfigured</span>
                          )}
                        </td>

                        {/* Question Paper Status & INLINE Progress Bar */}
                        <td className="p-4">
                          {isProcessing ? (
                            <div className="space-y-1.5 min-w-[150px] max-w-[220px]">
                              <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950">
                                <span className="flex items-center gap-1">
                                  <RefreshCw size={11} className="animate-spin text-indigo-600" />
                                  <span>Processing</span>
                                </span>
                                <span className="font-mono text-indigo-600 font-extrabold">
                                  {rowProg?.percentage || 15}%
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-2xs">
                                <div
                                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                                  style={{ width: `${rowProg?.percentage || 15}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                <span>
                                  {rowProg?.current || 0} / {rowProg?.total || 100} questions
                                </span>
                              </div>
                            </div>
                          ) : hasQuestions ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                <CheckCircle2 size={12} /> ✓ Uploaded
                              </span>
                              <span className="text-[10px] text-slate-500 block font-semibold pl-1">
                                {exam.totalQuestions} Questions Ready
                              </span>
                            </div>
                          ) : isFailed ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                                <XCircle size={12} /> ✕ Failed
                              </span>
                              {exam.importError && (
                                <span
                                  className="text-[10px] text-rose-600 block line-clamp-1 max-w-[160px]"
                                  title={exam.importError}
                                >
                                  {exam.importError}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                              <Clock size={12} /> Not Uploaded
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 pr-6 text-right">
                          {isProcessing ? (
                            <Button
                              size="sm"
                              disabled
                              className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-400 text-xs font-bold px-3 py-1.5 rounded-xl cursor-not-allowed border border-slate-200"
                            >
                              <RefreshCw size={12} className="animate-spin" /> Processing
                            </Button>
                          ) : hasQuestions ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  navigate(`${routePrefix}/exams/${exam.id}/question-paper/view`)
                                }
                                className="inline-flex items-center gap-1 text-indigo-600 border-indigo-200 hover:bg-indigo-50 text-xs font-bold px-3 py-1.5 rounded-xl shadow-2xs"
                              >
                                <Eye size={12} /> View Question Paper
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  navigate(`${routePrefix}/exams/${exam.id}/question-paper/upload`)
                                }
                                className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs"
                              >
                                <UploadCloud size={12} /> Replace Question Paper
                              </Button>
                            </div>
                          ) : isFailed ? (
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRetry(exam.id)}
                                className="inline-flex items-center gap-1 text-amber-700 border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-bold px-2.5 py-1.5 rounded-xl"
                              >
                                <RefreshCw size={12} /> Retry
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  navigate(`${routePrefix}/exams/${exam.id}/question-paper/upload`)
                                }
                                className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs"
                              >
                                <UploadCloud size={12} /> Add Question Paper
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() =>
                                navigate(`${routePrefix}/exams/${exam.id}/question-paper/upload`)
                              }
                              className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-xs"
                            >
                              <UploadCloud size={13} />
                              <span>Add Question Paper</span>
                            </Button>
                          )}
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
};

export default UploadQuestionPaperPage;
