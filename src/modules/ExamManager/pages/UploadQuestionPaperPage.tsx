import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  FileCheck,
  BookOpen,
  ShieldCheck,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  useUploadQuestionPaperAPI,
  downloadQuestionPaperTemplate,
  downloadQuestionPaperErrorReport,
} from '../services/examManager.service';

export const UploadQuestionPaperPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const routePrefix = location.pathname.startsWith('/super-admin')
    ? '/super-admin'
    : '/admin';

  // ─── State ─────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isDownloadingErrors, setIsDownloadingErrors] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const { uploadQuestionPaperAPI, isLoading: isUploading } =
    useUploadQuestionPaperAPI();

  // ─── Drag & Drop Handlers ──────────────────────────────────────
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragActive) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      setDragActive(false);
      dragCounterRef.current = 0;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
      e.dataTransfer.clearData();
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
    if (e.target) {
      e.target.value = '';
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name
      .substring(selectedFile.name.lastIndexOf('.'))
      .toLowerCase();
    if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
      setUploadError(
        `Unsupported file type '${ext || 'unknown'}'. Please upload a valid .csv, .xlsx, or .xls file.`,
      );
      return;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      setUploadError(
        `File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of 25 MB.`,
      );
      return;
    }
    setFile(selectedFile);
    setUploadError(null);
    setUploadResult(null);
  };

  // ─── Upload & Process Handler ──────────────────────────────────
  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a question paper file to upload.');
      return;
    }

    setUploadError(null);
    setUploadResult(null);

    const { data, error } = await uploadQuestionPaperAPI(file);

    if (error) {
      setUploadError(
        typeof error === 'string'
          ? error
          : (error as any).message || 'Failed to process question paper.',
      );
      return;
    }

    const payload = (data as any)?.data || data;
    setUploadResult(payload);
  };

  // ─── Template Download ─────────────────────────────────────────
  const handleDownloadTemplate = async (format: 'xlsx' | 'csv') => {
    try {
      setIsDownloadingTemplate(true);
      await downloadQuestionPaperTemplate(format);
    } catch {
      alert('Failed to download template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // ─── Error Report Download ─────────────────────────────────────
  const handleDownloadErrors = async (format: 'xlsx' | 'csv') => {
    if (!uploadResult?.importId) return;
    try {
      setIsDownloadingErrors(true);
      await downloadQuestionPaperErrorReport(uploadResult.importId, format);
    } catch {
      alert('Failed to download error report.');
    } finally {
      setIsDownloadingErrors(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button
              onClick={() => navigate(`${routePrefix}/exam-manager`)}
              className="hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <BookOpen size={14} /> Exam Manager
            </button>
            <span>/</span>
            <span className="text-slate-900 font-bold">Upload Question Paper</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UploadCloud className="text-indigo-600" size={26} />
            Upload Question Paper & Auto-Create Exam
          </h1>
          <p className="text-xs text-slate-500">
            Upload complete exam question papers via Excel or CSV with automatic section, question, and option creation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`${routePrefix}/exam-manager/history`)}
            className="text-xs font-bold"
          >
            View Import History
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`${routePrefix}/exam-manager`)}
            className="text-xs font-bold"
          >
            ← Back to Exam List
          </Button>
        </div>
      </div>

      {/* ─── Main Content ──────────────────────────────────────── */}
      {!uploadResult ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Dropzone Card */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Select Question Paper Spreadsheet
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Supports Excel (.xlsx, .xls) and CSV (.csv) containing exam codes, subjects, sections, questions, and scoring rules.
                </p>
              </div>

              {/* Dropzone container */}
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
                  dragActive
                    ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
                    : file
                    ? 'border-emerald-500 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/60 hover:bg-indigo-50/20'
                }`}
              >
                <input
                  ref={fileInputRef}
                  id="paper-file-upload"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInput}
                  className="hidden"
                />

                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform ${
                    file
                      ? 'bg-emerald-100 text-emerald-600'
                      : dragActive
                      ? 'bg-indigo-600 text-white scale-110'
                      : 'bg-indigo-100 text-indigo-600'
                  }`}
                >
                  {file ? <FileCheck size={32} /> : <UploadCloud size={32} />}
                </div>

                {file ? (
                  <div className="text-center space-y-1">
                    <p className="text-sm font-extrabold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • File Selected & Ready
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 underline"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-2">
                    <p className="text-sm font-bold text-slate-800">
                      {dragActive ? (
                        <span className="text-indigo-600 font-extrabold text-base">
                          Drop your question paper file here!
                        </span>
                      ) : (
                        <>
                          Drag & Drop question paper here, or{' '}
                          <span className="text-indigo-600 underline">Browse</span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      Supports .xlsx, .xls, and .csv files up to 25 MB
                    </p>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Upload CTA */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <ShieldCheck size={15} className="text-emerald-600" />
                  <span>Atomic Transaction Safety (0 partial data created on error)</span>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  isLoading={isUploading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 font-extrabold text-xs"
                >
                  <span>Upload & Create Exam →</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar Templates & Guidelines */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Download size={18} className="text-indigo-600" />
                <span>Question Paper Templates</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Download a pre-formatted question paper spreadsheet with sample questions in Physics, Chemistry, and Biology.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  disabled={isDownloadingTemplate}
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs font-bold text-slate-700 transition-all"
                >
                  <FileSpreadsheet size={16} className="text-emerald-600" />
                  <span>Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  disabled={isDownloadingTemplate}
                  onClick={() => handleDownloadTemplate('csv')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs font-bold text-slate-700 transition-all"
                >
                  <Download size={16} className="text-blue-600" />
                  <span>CSV (.csv)</span>
                </button>
              </div>
            </div>

            {/* Checklist */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="text-slate-900 font-extrabold text-sm">
                Supported Question Types
              </div>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold">Single Correct MCQ</span>
                  <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">SINGLE_CORRECT</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold">Multiple Correct</span>
                  <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">MULTIPLE_CORRECT</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold">Assertion-Reason</span>
                  <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">ASSERTION_REASON</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="font-semibold">Numerical</span>
                  <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">NUMERICAL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : uploadResult.success ? (
        /* ─── SUCCESS RESULT ────────────────────────────────────── */
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm shadow-emerald-100">
              <Sparkles size={32} />
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                <CheckCircle2 size={13} />
                <span>Exam Created Transactionally</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {uploadResult.examTitle || 'Exam Created Successfully!'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Code: {uploadResult.examCode || 'N/A'}
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Questions</div>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {uploadResult.summary?.questionsCreated || uploadResult.summary?.totalRows || 0}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                <div className="text-[10px] font-bold text-indigo-600 uppercase">Sections</div>
                <div className="text-xl font-black text-indigo-800 mt-1">
                  {uploadResult.summary?.sectionsCreated || 1}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <div className="text-[10px] font-bold text-emerald-600 uppercase">Total Marks</div>
                <div className="text-xl font-black text-emerald-800 mt-1">
                  {uploadResult.summary?.totalMarks || 720}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <div className="text-[10px] font-bold text-amber-600 uppercase">Duration</div>
                <div className="text-xl font-black text-amber-800 mt-1">
                  {uploadResult.summary?.durationMinutes || 200} Mins
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setUploadResult(null);
                }}
                className="text-xs font-bold"
              >
                Upload Another Question Paper
              </Button>
              <Button
                onClick={() => navigate(`${routePrefix}/exam-manager`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200"
              >
                Go to Exam Manager List →
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── FAILED RESULT & ERROR DIAGNOSTICS ──────────────────── */
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-rose-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <XCircle size={26} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Question Paper Validation Failed
                  </h2>
                  <p className="text-xs text-rose-600 font-semibold mt-0.5">
                    {uploadResult.message || 'Validation errors detected. No database records committed.'}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => handleDownloadErrors('xlsx')}
                disabled={isDownloadingErrors}
                className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <Download size={14} className="mr-1" />
                <span>Download Error Workbook (.xlsx)</span>
              </Button>
            </div>

            {/* Diagnostics Table */}
            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Row-by-Row Validation Diagnostics ({uploadResult.errors.length}):
                </div>
                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Row #</th>
                        <th className="px-4 py-2.5">Column</th>
                        <th className="px-4 py-2.5">Error Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {uploadResult.errors.map((err: any, idx: number) => (
                        <tr key={idx} className="hover:bg-rose-50/30">
                          <td className="px-4 py-2.5 font-mono font-bold text-slate-700">
                            #{err.row || idx + 1}
                          </td>
                          <td className="px-4 py-2.5 font-mono text-[11px] text-indigo-600">
                            {err.column || 'general'}
                          </td>
                          <td className="px-4 py-2.5 text-rose-700 font-semibold">
                            {err.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setUploadResult(null);
                }}
                className="text-xs font-bold"
              >
                ← Fix Spreadsheet & Try Again
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadQuestionPaperPage;
