import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Download,
  Languages,
  Calendar,
  Sparkles,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';
import {
  useGetExamsListAPI,
  usePreviewQuestionPaperUploadAPI,
  useSubmitQuestionPaperUploadAPI,
  downloadQuestionPaperTemplate,
  useRetryQuestionPaperUploadAPI,
} from '../services/examManager.service';
import type { ExamItem, QuestionPaperPreviewResult } from '../types/examManager.types';
import ExamTranslationManager from '@/modules/RegionalLanguage/components/ExamTranslationManager';
import { ExportPdfButton } from '@/components/export/ExportPdfButton';
import { io, Socket } from 'socket.io-client';
import { API_URL } from '@config';

interface InlineProgressState {
  status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  percentage: number;
  current: number;
  total: number;
  message?: string;
}

export const OperatorScheduledExamsPage: React.FC = () => {
  // ─── Data & Filter State ───────────────────────────────────────────────────
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);

  // ─── Modals State ─────────────────────────────────────────────────────────
  const [uploadTargetExam, setUploadTargetExam] = useState<ExamItem | null>(null);
  const [translationTargetExam, setTranslationTargetExam] = useState<ExamItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<QuestionPaperPreviewResult | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ─── WebSocket Progress State ─────────────────────────────────────────────
  const [progressMap, setProgressMap] = useState<Record<string, InlineProgressState>>({});
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── APIs ─────────────────────────────────────────────────────────────────
  const { getExamsListAPI } = useGetExamsListAPI();
  const { previewQuestionPaperUploadAPI } = usePreviewQuestionPaperUploadAPI();
  const { submitQuestionPaperUploadAPI } = useSubmitQuestionPaperUploadAPI();
  const { retryQuestionPaperUploadAPI } = useRetryQuestionPaperUploadAPI();

  // Load exams requiring question paper upload
  const loadExams = useCallback(async () => {
    setIsLoading(true);
    const res = await getExamsListAPI({
      missingQuestionPaperOnly: true,
      search: search.trim() || undefined,
      limit: 50,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setIsLoading(false);

    if (res.data?.items) {
      setExams(res.data.items);
    }
  }, [getExamsListAPI, search]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // ─── WebSocket Setup ──────────────────────────────────────────────────────
  useEffect(() => {
    const wsUrl = (API_URL || 'http://localhost:3000').replace(/^http/, 'ws');
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    const socket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token: token ? `Bearer ${token}` : undefined },
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('exam-paper:progress', (data: { examId: string; progress: number; current: number; total: number; message?: string }) => {
      setProgressMap((prev) => ({
        ...prev,
        [data.examId]: {
          status: 'PROCESSING',
          percentage: data.progress,
          current: data.current,
          total: data.total,
          message: data.message || `Processing questions (${data.current}/${data.total})...`,
        },
      }));
    });

    socket.on('exam-paper:complete', (data: { examId: string; totalQuestions: number }) => {
      setProgressMap((prev) => ({
        ...prev,
        [data.examId]: {
          status: 'COMPLETED',
          percentage: 100,
          current: data.totalQuestions,
          total: data.totalQuestions,
          message: `Successfully processed ${data.totalQuestions} questions!`,
        },
      }));
      toast.success(`Question paper processing completed!`);
      loadExams();
    });

    socket.on('exam-paper:failed', (data: { examId: string; error: string }) => {
      setProgressMap((prev) => ({
        ...prev,
        [data.examId]: {
          status: 'FAILED',
          percentage: 0,
          current: 0,
          total: 0,
          message: data.error || 'Question paper processing failed',
        },
      }));
      toast.error(`Question paper upload failed: ${data.error}`);
    });

    return () => {
      socket.disconnect();
    };
  }, [loadExams]);

  // ─── File Selection & Validation ──────────────────────────────────────────
  const handleFileSelected = async (file: File, examId: string) => {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
      setUploadError(`Unsupported file type '${ext}'. Please select a .csv, .xlsx, or .xls spreadsheet.`);
      setSelectedFile(null);
      setPreviewData(null);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds the 25MB maximum limit.');
      setSelectedFile(null);
      setPreviewData(null);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
    setPreviewData(null);

    setIsPreviewing(true);
    const res = await previewQuestionPaperUploadAPI(examId, file);
    setIsPreviewing(false);

    if (res.error) {
      setUploadError(res.error);
    } else if (res.data) {
      setPreviewData(res.data);
      if (res.data.invalidQuestions > 0) {
        toast.warning(
          `Validation completed with ${res.data.invalidQuestions} errors. Review errors before submitting.`,
        );
      } else {
        toast.success(`Validation successful! ${res.data.validQuestions} valid questions found.`);
      }
    }
  };

  const handleConfirmSubmit = async () => {
    if (!uploadTargetExam || !selectedFile) return;

    setIsSubmitting(true);
    const res = await submitQuestionPaperUploadAPI(uploadTargetExam.id, selectedFile);
    setIsSubmitting(false);

    if (res.error) {
      setUploadError(res.error);
      toast.error(res.error);
      return;
    }

    toast.success('Question paper submitted for background BullMQ processing!');
    setProgressMap((prev) => ({
      ...prev,
      [uploadTargetExam.id]: {
        status: 'PROCESSING',
        percentage: 10,
        current: 0,
        total: previewData?.totalQuestions || 0,
        message: 'Question paper queued for processing...',
      },
    }));

    setUploadTargetExam(null);
    setSelectedFile(null);
    setPreviewData(null);
    loadExams();
  };

  const handleDownloadTemplate = () => {
    downloadQuestionPaperTemplate('csv');
    toast.success('Question paper CSV template downloaded.');
  };

  const filteredExams = exams.filter((exam) => {
    if (selectedTarget === 'ALL') return true;
    return (exam.target || (exam as any).targetExam || '').toUpperCase().includes(selectedTarget.toUpperCase());
  });

  // Drilldown translation view
  if (translationTargetExam) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ExamTranslationManager
          examId={translationTargetExam.id}
          examTitle={translationTargetExam.title}
          onBack={() => {
            setTranslationTargetExam(null);
            loadExams();
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-blue-100 mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Operator Portal — Exam Papers
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Scheduled Exams Awaiting Question Papers
            </h1>
            <p className="mt-2 text-blue-100 max-w-2xl text-sm sm:text-base">
              Upload, preview, validate, and submit question papers and regional translations for scheduled exams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-4 h-4 mr-2 text-blue-200" />
              Download Template
            </Button>
            <Button
              variant="secondary"
              className="bg-white text-blue-900 hover:bg-blue-50 font-semibold shadow-md"
              onClick={loadExams}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by exam name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-medium text-slate-600 whitespace-nowrap">Target:</label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Targets (JEE / NEET / CET)</option>
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
              <option value="CET">CET</option>
            </select>

            <ExportPdfButton
              resource="exams"
              filters={{ target: selectedTarget !== 'ALL' ? selectedTarget : undefined }}
              search={search}
              filename="scheduled-exams.pdf"
            />
          </div>
        </div>
      </div>

      {/* Scheduled Exams Table / List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Loading scheduled exams...</p>
          </div>
        ) : filteredExams.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900">All Scheduled Exams Have Question Papers</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
              There are currently no scheduled exams pending question paper upload.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Exam Name & Code</th>
                  <th className="py-3.5 px-4">Target & Type</th>
                  <th className="py-3.5 px-4">Subject / Chapter</th>
                  <th className="py-3.5 px-4">Schedule Window</th>
                  <th className="py-3.5 px-4">Questions</th>
                  <th className="py-3.5 px-4">Paper Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExams.map((exam) => {
                  const progress = progressMap[exam.id];
                  const hasQuestions = (exam.totalQuestions || 0) > 0;
                  const targetStr = exam.target || (exam as any).targetExam || (exam.examTarget?.name) || 'General';

                  return (
                    <React.Fragment key={exam.id}>
                      <tr className="hover:bg-slate-50/50 transition">
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-900">{exam.title}</div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">{exam.code || exam.id.slice(0, 12)}</div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            {targetStr}
                          </span>
                          <div className="text-xs text-slate-500 mt-1 capitalize">
                            {exam.type ? exam.type.toLowerCase().replace('_', ' ') : 'Full Exam'}
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-xs font-medium text-slate-700">
                            {(exam as any).subject?.name || (exam as any).subjectName || (exam.blueprint ? exam.blueprint.name : 'All Subjects')}
                          </div>
                          {(exam as any).chapter && (
                            <div className="text-xs text-slate-500">
                              {(exam as any).chapter.name || (exam as any).chapterName}
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {exam.schedule?.startDate
                              ? new Date(exam.schedule.startDate).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : 'Not Set'}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {exam.schedule?.startTime || '00:00'} - {exam.schedule?.endTime || '00:00'} ({exam.durationMinutes || 180}m)
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <div className="text-xs font-semibold text-slate-800">
                            {exam.totalQuestions || 0} / {exam.blueprint?.totalQuestions || exam.totalMarks ? Math.round((exam.totalMarks || 100) / 4) : '--'}
                          </div>
                          <div className="text-xs text-slate-500">Marks: {exam.totalMarks || 300}</div>
                        </td>

                        <td className="py-4 px-4">
                          {progress && progress.status === 'PROCESSING' ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Processing ({progress.percentage}%)
                              </span>
                              <div className="w-32 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-blue-600 h-full rounded-full transition-all duration-300"
                                  style={{ width: `${progress.percentage}%` }}
                                />
                              </div>
                            </div>
                          ) : hasQuestions ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              Uploaded
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              Paper Missing
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-blue-200 text-blue-700 hover:bg-blue-50"
                              onClick={() => {
                                setUploadTargetExam(exam);
                                setSelectedFile(null);
                                setPreviewData(null);
                                setUploadError(null);
                              }}
                            >
                              <UploadCloud className="w-3.5 h-3.5 mr-1 text-blue-600" />
                              Upload Paper
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-indigo-700 hover:bg-indigo-50"
                              onClick={() => setTranslationTargetExam(exam)}
                              title="Manage regional language translations"
                            >
                              <Languages className="w-3.5 h-3.5 mr-1" />
                              Translations
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Inline Processing Error if any */}
                      {progress && progress.status === 'FAILED' && (
                        <tr className="bg-rose-50/50">
                          <td colSpan={7} className="px-4 py-2 text-xs text-rose-700 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Processing Failed: {progress.message}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs text-rose-800 underline ml-auto"
                              onClick={() => retryQuestionPaperUploadAPI(exam.id)}
                            >
                              Retry Processing
                            </Button>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Question Paper Modal */}
      {uploadTargetExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/75">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Upload Question Paper — {uploadTargetExam.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Target: <span className="font-semibold text-blue-600">{uploadTargetExam.target || (uploadTargetExam as any).targetExam || 'General'}</span> | Code: {uploadTargetExam.code || uploadTargetExam.id.slice(0, 10)}
                </p>
              </div>
              <button
                onClick={() => setUploadTargetExam(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Drag & Drop Upload Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleFileSelected(e.dataTransfer.files[0], uploadTargetExam.id);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileSelected(e.target.files[0], uploadTargetExam.id);
                    }
                  }}
                />
                <FileSpreadsheet className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-900">
                  {selectedFile ? selectedFile.name : 'Click to select or drag & drop CSV/Excel file'}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Supports .csv, .xlsx, or .xls format (Max 25MB). Auto-validates bilingual columns & equations.
                </p>
              </div>

              {/* Error Alert */}
              {uploadError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">Validation or Upload Error</div>
                    <div className="mt-0.5">{uploadError}</div>
                  </div>
                </div>
              )}

              {/* Preview Status & Validation Summary */}
              {isPreviewing && (
                <div className="p-6 text-center border border-slate-200 rounded-xl bg-slate-50">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">Validating question structure, formulas, and options...</p>
                </div>
              )}

              {previewData && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Validation Preview Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="text-xs text-slate-500">Total Questions</div>
                      <div className="text-lg font-bold text-slate-900">{previewData.totalQuestions}</div>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="text-xs text-emerald-700">Valid Questions</div>
                      <div className="text-lg font-bold text-emerald-800">{previewData.validQuestions}</div>
                    </div>
                    <div className="p-3 bg-rose-50 rounded-lg border border-rose-200">
                      <div className="text-xs text-rose-700">Invalid / Errors</div>
                      <div className="text-lg font-bold text-rose-800">{previewData.invalidQuestions}</div>
                    </div>
                  </div>

                  {/* Errors details list if invalid */}
                  {previewData.invalidQuestions > 0 && previewData.errors && (
                    <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 max-h-40 overflow-y-auto space-y-1">
                      {previewData.errors.map((err, idx) => (
                        <div key={idx} className="text-xs text-rose-700 flex items-center gap-1.5">
                          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>Row {err.row}: {err.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Valid Questions Sample */}
                  {previewData.previewRows && previewData.previewRows.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 text-xs font-semibold text-slate-700">
                        First 3 Questions Preview
                      </div>
                      <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {previewData.previewRows.slice(0, 3).map((q, idx) => (
                          <div key={idx} className="p-3 text-xs">
                            <div className="font-medium text-slate-900">
                              Q{idx + 1}. {q.questionText}
                            </div>
                            <div className="mt-1 grid grid-cols-2 gap-2 text-slate-600">
                              <div>A: {q.options.A}</div>
                              <div>B: {q.options.B}</div>
                              <div>C: {q.options.C}</div>
                              <div>D: {q.options.D}</div>
                            </div>
                            <div className="mt-1 text-emerald-700 font-semibold">
                              Correct Option: {q.correctAnswer}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadTargetExam(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white shadow"
                disabled={!selectedFile || isSubmitting || isPreviewing || (previewData?.invalidQuestions || 0) > 0}
                onClick={handleConfirmSubmit}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Submitting to BullMQ...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4 mr-2" />
                    Submit Question Paper
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorScheduledExamsPage;
