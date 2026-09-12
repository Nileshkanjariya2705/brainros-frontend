import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Send,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';
import {
  usePreviewQuestionPaperUploadAPI,
  useSubmitQuestionPaperUploadAPI,
  downloadQuestionPaperTemplate,
  useGetExamsListAPI,
} from '../services/examManager.service';
import type {
  QuestionPaperPreviewResult,
  ExamItem,
} from '../types/examManager.types';

export const UploadExamQuestionPaperPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

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

  // ─── Exam Details State ───────────────────────────────────────────────────
  const [exam, setExam] = useState<ExamItem | null>(null);
  const { getExamsListAPI } = useGetExamsListAPI();

  // ─── File & Preview State ─────────────────────────────────────────────────
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<QuestionPaperPreviewResult | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { previewQuestionPaperUploadAPI } = usePreviewQuestionPaperUploadAPI();
  const { submitQuestionPaperUploadAPI } = useSubmitQuestionPaperUploadAPI();

  // Load target exam metadata
  useEffect(() => {
    if (examId) {
      getExamsListAPI({ limit: 100 }).then((res) => {
        if (res.data?.items) {
          const found = res.data.items.find((e) => e.id === examId);
          if (found) setExam(found);
        }
      });
    }
  }, [examId, getExamsListAPI]);

  // ─── File Validation & Preview ────────────────────────────────────────────
  const handleFileSelection = useCallback(
    async (file: File) => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
        setUploadError(
          `Unsupported file type '${ext}'. Please select a .csv, .xlsx, or .xls spreadsheet.`,
        );
        setSelectedFile(null);
        setPreviewData(null);
        return;
      }

      const MAX_SIZE = 25 * 1024 * 1024; // 25MB
      if (file.size > MAX_SIZE) {
        setUploadError('File size exceeds the 25MB maximum limit.');
        setSelectedFile(null);
        setPreviewData(null);
        return;
      }

      setSelectedFile(file);
      setUploadError(null);
      setPreviewData(null);

      // Trigger automatic preview
      if (examId) {
        setIsPreviewing(true);
        const res = await previewQuestionPaperUploadAPI(examId, file);
        setIsPreviewing(false);

        if (res.error) {
          setUploadError(res.error);
        } else if (res.data) {
          setPreviewData(res.data);
          if (res.data.invalidQuestions > 0) {
            toast.error(
              `Preview detected ${res.data.invalidQuestions} invalid questions. Please inspect errors before submission.`,
            );
          } else {
            toast.success('Question paper preview and validation successful!');
          }
        }
      }
    },
    [examId, previewQuestionPaperUploadAPI],
  );

  // Drag & Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  // ─── Submit Flow ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!selectedFile || !examId) {
      toast.error('Please select and preview a question paper file before submission.');
      return;
    }

    if (previewData && previewData.invalidQuestions > 0 && previewData.validQuestions === 0) {
      toast.error('Cannot submit a question paper where all rows are invalid.');
      return;
    }

    setIsSubmitting(true);
    setUploadError(null);

    const res = await submitQuestionPaperUploadAPI(examId, selectedFile);
    setIsSubmitting(false);

    if (res.error) {
      setUploadError(res.error);
      toast.error(res.error);
      return;
    }

    toast.success('Question paper has been queued for processing.');

    // Redirect to exam list with active exam ID for real-time inline progress
    navigate(
      `${routePrefix}/exam-manager/upload?activeExamId=${examId}&jobId=${res.data?.jobId || ''}`,
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Top Header Navigation (White / Light Theme) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 bg-white p-6 rounded-3xl shadow-xs">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(`${routePrefix}/exam-manager/upload`)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition shadow-2xs"
              title="Back to Exam List"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  Upload Question Paper
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {exam?.totalQuestions && exam.totalQuestions > 0 ? 'Replace Flow' : 'Add Flow'}
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Upload CSV or Excel • Review Preview & Validation • Asynchronous BullMQ Queue
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
              onClick={() => navigate(`${routePrefix}/exam-manager/upload`)}
              className="flex items-center gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold px-3.5 py-2 rounded-xl"
            >
              Back to List
            </Button>
          </div>
        </div>

        {/* ── Selected Exam Summary Card ── */}
        {exam && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Target Examination
              </span>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">{exam.title}</h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {exam.examTarget?.name || 'General'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {exam.subjectsSummary || 'All Subjects'} • {exam.durationMinutes || 180} mins
              </p>
            </div>

            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 block">Current Status</span>
                <span className="text-xs font-bold text-slate-800">
                  {exam.totalQuestions && exam.totalQuestions > 0
                    ? `${exam.totalQuestions} Questions Uploaded`
                    : 'No Paper Uploaded'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ── Error Banner ── */}
        {uploadError && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 shadow-xs">
            <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1">
              <div className="font-bold">Validation / Upload Issue</div>
              <div className="mt-0.5 text-rose-600 font-normal">{uploadError}</div>
            </div>
          </div>
        )}

        {/* ── Step 1: Upload Dropzone ── */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-black">
                1
              </span>
              <span>Select Question Paper File (CSV or Excel)</span>
            </h3>
            {selectedFile && (
              <button
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewData(null);
                  setUploadError(null);
                }}
                className="text-xs font-bold text-rose-600 hover:text-rose-700"
              >
                Clear File
              </button>
            )}
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center p-8 sm:p-10 border-2 border-dashed rounded-3xl cursor-pointer transition text-center ${
              dragActive
                ? 'border-indigo-600 bg-indigo-50/50'
                : selectedFile
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60 hover:border-slate-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelection(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {selectedFile ? (
              <div className="space-y-2">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-100">
                  <FileSpreadsheet size={24} />
                </div>
                <div className="font-extrabold text-slate-900 text-sm">{selectedFile.name}</div>
                <div className="text-xs font-semibold text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Click or drag to replace file
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-900">
                    Click to choose file or drag & drop here
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Step 2: Preview & Validation Results ── */}
        {isPreviewing && (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-500 shadow-xs">
            <RefreshCw size={28} className="animate-spin text-indigo-600 mb-2.5" />
            <span className="text-sm font-bold text-slate-800">Validating Question Paper...</span>
            <span className="text-xs text-slate-400 mt-0.5">
              Parsing questions, options, types, and checking exam compatibility
            </span>
          </div>
        )}

        {previewData && !isPreviewing && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-black">
                  2
                </span>
                <span>Pre-Submission Preview & Validation</span>
              </h3>
              <div className="flex items-center gap-2">
                {previewData.isValid ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 size={14} /> Ready for Submission
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <AlertTriangle size={14} /> Contains Validation Warnings
                  </span>
                )}
              </div>
            </div>

            {/* Validation Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Total Questions
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
                  Subjects
                </div>
                <div className="text-xs font-bold text-indigo-950 mt-1 truncate">
                  {previewData.subjects.join(', ') || 'General'}
                </div>
              </div>
            </div>

            {/* Error Diagnostics Callout */}
            {previewData.errors && previewData.errors.length > 0 && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                  <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                  <span>Row-Level Diagnostics ({previewData.errors.length} Issue(s))</span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pl-6 text-xs text-rose-700 font-medium divide-y divide-rose-100/60">
                  {previewData.errors.map((err, eIdx) => (
                    <div key={eIdx} className="pt-1 first:pt-0">
                      <span className="font-mono font-bold">Row {err.row}:</span> {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Preview Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100 border-b border-slate-200 z-10 text-[11px] uppercase tracking-wider font-bold text-slate-600">
                    <tr>
                      <th className="p-3 pl-4">Q.No</th>
                      <th className="p-3">Question Statement</th>
                      <th className="p-3">Option A</th>
                      <th className="p-3">Option B</th>
                      <th className="p-3">Option C</th>
                      <th className="p-3">Option D</th>
                      <th className="p-3 pr-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.previewRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.isValid ? 'hover:bg-slate-50/60' : 'bg-rose-50/30'}
                      >
                        <td className="p-3 pl-4 font-mono font-bold text-slate-500">
                          #{row.rowNumber}
                        </td>
                        <td className="p-3 max-w-xs sm:max-w-md">
                          <div className="font-semibold text-slate-900 line-clamp-2">
                            {row.questionText}
                          </div>
                          {row.errors.length > 0 && (
                            <div className="text-[11px] text-rose-600 font-medium mt-0.5">
                              {row.errors.join(' • ')}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-medium text-slate-700 max-w-[120px] truncate">
                          {row.options.A || '-'}
                        </td>
                        <td className="p-3 font-medium text-slate-700 max-w-[120px] truncate">
                          {row.options.B || '-'}
                        </td>
                        <td className="p-3 font-medium text-slate-700 max-w-[120px] truncate">
                          {row.options.C || '-'}
                        </td>
                        <td className="p-3 font-medium text-slate-700 max-w-[120px] truncate">
                          {row.options.D || '-'}
                        </td>
                        <td className="p-3 pr-4 text-center">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <CheckCircle2 size={14} /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600">
                              <XCircle size={14} /> Invalid
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Step 3: Final Submit ── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
              <div className="text-xs text-slate-500">
                Submitting queues the paper for background BullMQ processing. You will see real-time
                progress in the exam list.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={() => navigate(`${routePrefix}/exam-manager/upload`)}
                  className="border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold px-4 py-2.5 rounded-xl flex-1 sm:flex-initial"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSubmit}
                  disabled={isSubmitting || previewData.totalQuestions === 0}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs flex-1 sm:flex-initial"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Queuing...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Submit Question Paper</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadExamQuestionPaperPage;
