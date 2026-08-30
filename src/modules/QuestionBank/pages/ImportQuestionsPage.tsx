import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  RefreshCw,
  Download,
  ArrowLeft,
  Edit3,
  Check,
  X,
  Database,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  useUploadImportFileAPI,
  useGetImportSessionAPI,
  useGetImportRowsAPI,
  useUpdateImportRowAPI,
  useConfirmImportAPI,
  useCancelImportAPI,
  downloadQuestionTemplate,
  downloadImportErrorReport,
} from '../services/questionImport.service';
import type {
  QuestionImportSession,
  QuestionImportRow,
  ImportRowStatus,
} from '../types/questionImport.types';
import Button from '@/components/ui/Button';

export const ImportQuestionsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const routePrefix = location.pathname.startsWith('/super-admin') ? '/super-admin' : '/admin';

  // ─── Step State: 1: Upload, 2: Preview & Validation, 3: Confirmation, 4: Result ──
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // ─── Upload State ─────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeImport, setActiveImport] = useState<QuestionImportSession | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState<boolean>(false);
  const [isDownloadingErrors, setIsDownloadingErrors] = useState<boolean>(false);

  // ─── Preview Table State ──────────────────────────────────────
  const [rows, setRows] = useState<QuestionImportRow[]>([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1,
  });

  // ─── Modal Row Inspector & Editor State ───────────────────────
  const [selectedRow, setSelectedRow] = useState<QuestionImportRow | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingRawData, setEditingRawData] = useState<Record<string, any>>({});
  const [isSavingRow, setIsSavingRow] = useState<boolean>(false);

  // ─── API Hooks ─────────────────────────────────────────────────
  const { uploadImportFileAPI, isLoading: isUploading } = useUploadImportFileAPI();
  const { getImportSessionAPI } = useGetImportSessionAPI();
  const { getImportRowsAPI, isLoading: isLoadingRows } = useGetImportRowsAPI();
  const { updateImportRowAPI } = useUpdateImportRowAPI();
  const { confirmImportAPI } = useConfirmImportAPI();
  const { cancelImportAPI } = useCancelImportAPI();

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef<number>(0);

  // ─── Polling Import Status When Processing ────────────────────
  const fetchImportSession = useCallback(
    async (importId: string) => {
      const res = await getImportSessionAPI(importId);
      const data: QuestionImportSession | undefined =
        (res as any)?.data?.data || (res as any)?.data;
      if (data) {
        setActiveImport(data);

        if (data.status === 'READY_TO_IMPORT' || data.status === 'VALIDATED') {
          if (currentStep === 1) setCurrentStep(2);
        } else if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          if (currentStep === 2 || currentStep === 3) setCurrentStep(4);
        }
      }
      return data;
    },
    [getImportSessionAPI, currentStep],
  );

  useEffect(() => {
    if (
      activeImport &&
      (activeImport.status === 'PROCESSING' || activeImport.status === 'IMPORTING')
    ) {
      pollingTimerRef.current = setInterval(() => {
        fetchImportSession(activeImport.id);
      }, 1500);
    } else if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }
    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [activeImport, fetchImportSession]);

  // ─── Fetch Staging Rows ────────────────────────────────────────
  const fetchRows = useCallback(
    async (importId: string, pageNum = 1, status = selectedStatusFilter) => {
      const res = await getImportRowsAPI(importId, {
        status: status === 'ALL' ? undefined : status,
        page: pageNum,
        limit: 15,
      });

      const payload = (res as any)?.data?.data || (res as any)?.data;
      if (payload) {
        setRows(payload.data || []);
        if (payload.meta) {
          setPaginationMeta(payload.meta);
        }
      }
    },
    [getImportRowsAPI, selectedStatusFilter],
  );

  useEffect(() => {
    if (activeImport && currentStep === 2) {
      fetchRows(activeImport.id, page, selectedStatusFilter);
    }
  }, [activeImport, currentStep, page, selectedStatusFilter, fetchRows]);

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
    // Reset value so selecting same file again triggers change
    if (e.target) {
      e.target.value = '';
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
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
  };

  // ─── Upload Handler ────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) {
      setUploadError('Please select a CSV or Excel file to upload.');
      return;
    }

    setUploadError(null);
    const { data, error } = await uploadImportFileAPI(file);

    if (error) {
      setUploadError(
        typeof error === 'string'
          ? error
          : (error as any).message || 'Failed to upload spreadsheet.',
      );
      return;
    }

    const payload: any = (data as any)?.data || data;
    if (payload?.id) {
      setActiveImport({
        ...payload,
        status: 'PROCESSING',
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        duplicateRows: 0,
        updateRows: 0,
        createRows: 0,
        processedRows: 0,
        createdCount: 0,
        updatedCount: 0,
        failedCount: 0,
      });

      // Poll until validation finishes
      const interval = setInterval(async () => {
        const session = await fetchImportSession(payload.id);
        if (session && session.status !== 'PROCESSING' && session.status !== 'UPLOADED') {
          clearInterval(interval);
          setCurrentStep(2);
        }
      }, 1000);
    }
  };

  // ─── Template Download ─────────────────────────────────────────
  const handleDownloadTemplate = async (format: 'xlsx' | 'csv') => {
    try {
      setIsDownloadingTemplate(true);
      await downloadQuestionTemplate(format);
    } catch (err: any) {
      alert('Failed to download template. Please try again.');
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  // ─── Error Report Download ─────────────────────────────────────
  const handleDownloadErrors = async (format: 'xlsx' | 'csv') => {
    if (!activeImport) return;
    try {
      setIsDownloadingErrors(true);
      await downloadImportErrorReport(activeImport.id, format);
    } catch (err: any) {
      alert('Failed to download error report. Please try again.');
    } finally {
      setIsDownloadingErrors(false);
    }
  };

  // ─── Inline Row Edit Modal Handlers ────────────────────────────
  const handleOpenEditModal = (row: QuestionImportRow) => {
    setSelectedRow(row);
    setEditingRawData({
      ...((row.rawData as any) || {}),
      question_id: (row.rawData as any)?.question_id || (row.rawData as any)?.id || '',
      subject: (row.rawData as any)?.subject || (row.rawData as any)?.subject_name || '',
      chapter: (row.rawData as any)?.chapter || (row.rawData as any)?.chapter_name || '',
      topic: (row.rawData as any)?.topic || '',
      sub_topic: (row.rawData as any)?.sub_topic || '',
      question_text: (row.rawData as any)?.question_text || (row.rawData as any)?.question || '',
      question_type:
        (row.rawData as any)?.question_type || (row.rawData as any)?.type || 'SINGLE_CORRECT',
      difficulty:
        (row.rawData as any)?.difficulty || (row.rawData as any)?.difficulty_level || 'MEDIUM',
      marks: (row.rawData as any)?.marks ?? 4,
      negative_marks: (row.rawData as any)?.negative_marks ?? 1,
      option_a: (row.rawData as any)?.option_a || '',
      option_b: (row.rawData as any)?.option_b || '',
      option_c: (row.rawData as any)?.option_c || '',
      option_d: (row.rawData as any)?.option_d || '',
      correct_answer: (row.rawData as any)?.correct_answer || '',
      numerical_answer: (row.rawData as any)?.numerical_answer ?? '',
      numerical_tolerance: (row.rawData as any)?.numerical_tolerance ?? 0,
      assertion: (row.rawData as any)?.assertion || '',
      reason: (row.rawData as any)?.reason || '',
      passage: (row.rawData as any)?.passage || '',
      explanation: (row.rawData as any)?.explanation || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveRow = async () => {
    if (!activeImport || !selectedRow) return;
    setIsSavingRow(true);

    try {
      const { data: updated } = await updateImportRowAPI(activeImport.id, selectedRow.id, {
        rawData: editingRawData,
      });

      if (updated) {
        setIsEditModalOpen(false);
        await fetchImportSession(activeImport.id);
        await fetchRows(activeImport.id, page, selectedStatusFilter);
      }
    } catch (err: any) {
      alert('Failed to save row changes.');
    } finally {
      setIsSavingRow(false);
    }
  };

  // ─── Confirmation & Execution ──────────────────────────────────
  const handleConfirmImport = async () => {
    if (!activeImport) return;
    setCurrentStep(3);

    const { error } = await confirmImportAPI(activeImport.id);
    if (error) {
      alert(
        typeof error === 'string'
          ? error
          : (error as any).message || 'Failed to start batch import.',
      );
      setCurrentStep(2);
      return;
    }

    // Refresh status until complete
    const interval = setInterval(async () => {
      const session = await fetchImportSession(activeImport.id);
      if (session && (session.status === 'COMPLETED' || session.status === 'FAILED')) {
        clearInterval(interval);
        setCurrentStep(4);
      }
    }, 1500);
  };

  // ─── Status Badge Helper ───────────────────────────────────────
  const getStatusBadge = (status: ImportRowStatus) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
            <CheckCircle2 size={12} />
            <span>Valid (Create)</span>
          </span>
        );
      case 'UPDATE_AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 ring-1 ring-inset ring-blue-600/20">
            <Sparkles size={12} />
            <span>Update Existing</span>
          </span>
        );
      case 'DUPLICATE':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
            <Copy size={12} />
            <span>Duplicate</span>
          </span>
        );
      case 'INVALID':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
            <XCircle size={12} />
            <span>Invalid</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`${routePrefix}/question-bank`)}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-500/20 mb-1">
              <UploadCloud size={13} />
              <span>Bulk Data Operations</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Bulk Question Import (CSV / Excel)
            </h1>
            <p className="text-xs text-slate-500">
              Upload, validate, preview, and batch create or update examination questions
            </p>
          </div>
        </div>

        {/* Wizard Step Indicator */}
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: 'Upload' },
            { num: 2, label: 'Preview' },
            { num: 3, label: 'Importing' },
            { num: 4, label: 'Result' },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                currentStep === s.num
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : currentStep > s.num
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-400'
              }`}
            >
              <span>{currentStep > s.num ? '✓' : s.num}</span>
              <span className="hidden md:inline">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 1: UPLOAD & TEMPLATE DOWNLOAD */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Dropzone */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-indigo-600" />
                  Select Spreadsheet File
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload a <code>.xlsx</code> or <code>.csv</code> spreadsheet containing question
                  statements, options, answers, and academic hierarchy tags.
                </p>
              </div>

              {/* Drag and Drop Zone */}
              <input
                type="file"
                ref={fileInputRef}
                id="question-file-upload"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileInput}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01] ring-4 ring-indigo-500/20 shadow-lg'
                    : file
                      ? 'border-emerald-500 bg-emerald-50/40'
                      : 'border-slate-300 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-300'
                }`}
              >
                <div
                  className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-transform ${
                    dragActive
                      ? 'bg-indigo-600 text-white scale-110'
                      : file
                        ? 'bg-emerald-100 text-emerald-600'
                        : 'bg-indigo-100 text-indigo-600'
                  }`}
                >
                  {file ? (
                    <FileSpreadsheet size={32} />
                  ) : dragActive ? (
                    <UploadCloud size={32} className="animate-bounce" />
                  ) : (
                    <UploadCloud size={32} />
                  )}
                </div>

                {file ? (
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                      <CheckCircle2 size={13} />
                      <span>File Selected & Ready</span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace file
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setUploadError(null);
                      }}
                      className="mt-2 text-xs font-semibold text-rose-600 hover:underline inline-block"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-slate-800">
                      {dragActive ? (
                        <span className="text-indigo-600 font-extrabold text-base">
                          Drop your spreadsheet file here!
                        </span>
                      ) : (
                        <>
                          Drag & Drop your questions file here, or{' '}
                          <span className="text-indigo-600 underline">Browse</span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      Supports .xlsx, .xls, and .csv files up to 25 MB (max 50,000 rows)
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
                <div className="text-xs text-slate-500">Step 1: File Upload & Validation Check</div>
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  isLoading={isUploading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                >
                  <span>Upload & Validate Spreadsheet →</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar Guidelines & Template Downloads */}
          <div className="space-y-6">
            {/* Download Templates Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Download size={16} className="text-indigo-600" />
                <h3>Download Official Templates</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Use our standard import templates with pre-configured headers, type validations, and
                sample questions.
              </p>

              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={isDownloadingTemplate}
                  onClick={() => handleDownloadTemplate('xlsx')}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-xs font-bold text-slate-800 group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700">📊</span>
                    <div className="text-left">
                      <p className="text-slate-900 font-bold">Excel Template (.xlsx)</p>
                      <p className="text-[10px] text-slate-400 font-normal">
                        Includes formatted sample rows & guide
                      </p>
                    </div>
                  </div>
                  <Download size={14} className="text-slate-400 group-hover:text-indigo-600" />
                </button>

                <button
                  type="button"
                  disabled={isDownloadingTemplate}
                  onClick={() => handleDownloadTemplate('csv')}
                  className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-indigo-50 hover:border-indigo-200 transition-all text-xs font-bold text-slate-800 group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-blue-100 text-blue-700">📄</span>
                    <div className="text-left">
                      <p className="text-slate-900 font-bold">CSV Template (.csv)</p>
                      <p className="text-[10px] text-slate-400 font-normal">
                        Plain text format for scripts & bulk exports
                      </p>
                    </div>
                  </div>
                  <Download size={14} className="text-slate-400 group-hover:text-indigo-600" />
                </button>
              </div>
            </div>

            {/* Create vs Update Guide Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Sparkles size={16} className="text-indigo-600" />
                <h3>Create vs. Update Rules</h3>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">●</span>
                  <span>
                    <strong>New Question:</strong> Leave <code>question_id</code> empty to create a
                    new draft question.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">●</span>
                  <span>
                    <strong>Update Existing:</strong> Provide existing question UUID in{' '}
                    <code>question_id</code> to update fields and options in place.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 font-bold">●</span>
                  <span>
                    <strong>Supported Types:</strong> Single MCQ, Multiple Choice, Numerical,
                    Assertion-Reason, and Case-Based.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 2: PREVIEW & VALIDATION SUMMARY */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && activeImport && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Rows
              </p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {activeImport.totalRows}
              </p>
            </div>

            {/* Valid (Create) */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                New Valid
              </p>
              <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                {activeImport.createRows}
              </p>
            </div>

            {/* Update Available */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Updates
              </p>
              <p className="text-2xl font-extrabold text-blue-900 mt-1">
                {activeImport.updateRows}
              </p>
            </div>

            {/* Invalid */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Invalid
              </p>
              <p className="text-2xl font-extrabold text-rose-900 mt-1">
                {activeImport.invalidRows}
              </p>
            </div>

            {/* Duplicate */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Duplicates
              </p>
              <p className="text-2xl font-extrabold text-amber-900 mt-1">
                {activeImport.duplicateRows}
              </p>
            </div>
          </div>

          {/* Filter Bar & Action Header */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl">
                {[
                  { key: 'ALL', label: 'All Rows' },
                  { key: 'VALID', label: 'New Valid' },
                  { key: 'UPDATE_AVAILABLE', label: 'Updates' },
                  { key: 'INVALID', label: 'Invalid / Errors' },
                  { key: 'DUPLICATE', label: 'Duplicates' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setSelectedStatusFilter(tab.key);
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedStatusFilter === tab.key
                        ? 'bg-white text-indigo-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Download Error Report button */}
              {activeImport.invalidRows > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadErrors('xlsx')}
                  disabled={isDownloadingErrors}
                  className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  <Download size={13} className="mr-1" />
                  <span>Download Error Report (.xlsx)</span>
                </Button>
              )}
            </div>

            {/* Staging Rows Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3.5 text-center w-16">Row #</th>
                    <th className="py-3 px-3.5 w-32">Status</th>
                    <th className="py-3 px-3.5 w-40">Subject & Chapter</th>
                    <th className="py-3 px-3.5">Question Statement & Format</th>
                    <th className="py-3 px-3.5 w-60">Validation Notes / Errors</th>
                    <th className="py-3 px-3.5 text-right w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-800">
                  {isLoadingRows ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw
                          size={24}
                          className="animate-spin mx-auto mb-2 text-indigo-600"
                        />
                        <span>Loading staging rows preview...</span>
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        No rows found matching current filter.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => {
                      const raw = (r.rawData || {}) as any;
                      const hasErrors = r.errors && r.errors.length > 0;
                      const hasWarnings = r.warnings && r.warnings.length > 0;

                      return (
                        <tr
                          key={r.id}
                          className={`hover:bg-slate-50/70 transition-colors ${
                            r.status === 'INVALID' ? 'bg-rose-50/20' : ''
                          }`}
                        >
                          <td className="py-3 px-3.5 text-center font-bold text-slate-500">
                            #{r.rowNumber}
                          </td>
                          <td className="py-3 px-3.5">{getStatusBadge(r.status)}</td>
                          <td className="py-3 px-3.5">
                            <p className="font-bold text-slate-900">{raw.subject || '—'}</p>
                            <p className="text-[11px] text-slate-500">{raw.chapter || '—'}</p>
                          </td>
                          <td className="py-3 px-3.5">
                            <p className="font-medium text-slate-900 line-clamp-2">
                              {raw.question_text || raw.question || '—'}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span className="font-bold uppercase text-indigo-600">
                                {raw.question_type || raw.type || 'SINGLE_CORRECT'}
                              </span>
                              <span>•</span>
                              <span>Diff: {raw.difficulty || 'MEDIUM'}</span>
                              <span>•</span>
                              <span>
                                Marks: +{raw.marks ?? 4} / -{raw.negative_marks ?? 1}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3.5">
                            {hasErrors && (
                              <div className="space-y-1">
                                {r.errors?.map((err, idx) => (
                                  <div
                                    key={idx}
                                    className="text-[11px] font-semibold text-rose-700 flex items-start gap-1"
                                  >
                                    <span className="text-rose-500">✕</span>
                                    <span>{err}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {hasWarnings && (
                              <div className="space-y-1 mt-1">
                                {r.warnings?.map((warn, idx) => (
                                  <div
                                    key={idx}
                                    className="text-[11px] font-medium text-amber-700 flex items-start gap-1"
                                  >
                                    <span className="text-amber-500">⚠</span>
                                    <span>{warn}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {!hasErrors && !hasWarnings && (
                              <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                <Check size={12} /> Ready for import
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(r)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                              title="Inspect & Edit Row"
                            >
                              <Edit3 size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {paginationMeta.totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
                <span>
                  Page <strong>{page}</strong> of <strong>{paginationMeta.totalPages}</strong> (
                  {paginationMeta.total} rows)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={14} /> Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= paginationMeta.totalPages}
                    onClick={() => setPage((p) => Math.min(paginationMeta.totalPages, p + 1))}
                  >
                    Next <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {activeImport.validRows + activeImport.updateRows} questions ready to import
              </p>
              <p className="text-xs text-slate-500">
                {activeImport.createRows} new questions will be created in DRAFT status, and{' '}
                {activeImport.updateRows} existing questions will be updated.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm('Cancel this import session?')) {
                    cancelImportAPI(activeImport.id);
                    navigate(`${routePrefix}/question-bank`);
                  }
                }}
              >
                Cancel Session
              </Button>
              <Button
                onClick={handleConfirmImport}
                disabled={activeImport.validRows + activeImport.updateRows === 0}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
              >
                <Check size={16} className="mr-1.5" />
                <span>
                  Confirm & Import ({activeImport.validRows + activeImport.updateRows}) Questions →
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 3: PROCESSING & IMPORTING PROGRESS */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && activeImport && (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm space-y-6 max-w-2xl mx-auto my-12">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 mx-auto animate-pulse">
            <RefreshCw size={40} className="animate-spin" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900">
              Importing Questions into Database...
            </h2>
            <p className="text-xs text-slate-500">
              Processing batch transactions, attaching options, creating solution derivations, and
              preserving audit histories.
            </p>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-3 rounded-full transition-all duration-500 animate-pulse"
              style={{ width: '75%' }}
            ></div>
          </div>

          <p className="text-xs font-semibold text-indigo-700">
            Please do not close this window while database writes are active.
          </p>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 4: IMPORT COMPLETED SUMMARY */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 4 && activeImport && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm space-y-8 max-w-3xl mx-auto">
          <div className="text-center space-y-3">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 mx-auto">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Question Import Complete!</h2>
            <p className="text-xs text-slate-500">
              The bulk questions spreadsheet has been processed into the Question Bank repository.
            </p>
          </div>

          {/* Result Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
              <p className="text-[11px] font-bold text-emerald-700 uppercase">Created</p>
              <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                {activeImport.createdCount}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-center">
              <p className="text-[11px] font-bold text-blue-700 uppercase">Updated</p>
              <p className="text-2xl font-extrabold text-blue-900 mt-1">
                {activeImport.updatedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-center">
              <p className="text-[11px] font-bold text-amber-700 uppercase">Skipped</p>
              <p className="text-2xl font-extrabold text-amber-900 mt-1">
                {activeImport.duplicateRows}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-center">
              <p className="text-[11px] font-bold text-rose-700 uppercase">Failed</p>
              <p className="text-2xl font-extrabold text-rose-900 mt-1">
                {activeImport.failedCount}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-100">
            {activeImport.invalidRows > 0 && (
              <Button
                variant="outline"
                onClick={() => handleDownloadErrors('xlsx')}
                disabled={isDownloadingErrors}
                className="w-full sm:w-auto"
              >
                <Download size={15} className="mr-1.5" />
                <span>Download Error Report (.xlsx)</span>
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setActiveImport(null);
                setFile(null);
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto"
            >
              <UploadCloud size={15} className="mr-1.5" />
              <span>Import Another File</span>
            </Button>

            <Button
              onClick={() => navigate(`${routePrefix}/question-bank`)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
            >
              <Database size={15} className="mr-1.5" />
              <span>Go to Question Bank →</span>
            </Button>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* INLINE ROW EDIT / INSPECTION MODAL */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && selectedRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Inspect & Edit Staging Row #{selectedRow.rowNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  Correct validation errors inline and update row data before importing
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error alerts if present */}
            {selectedRow.errors && selectedRow.errors.length > 0 && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs space-y-1">
                <p className="font-bold text-rose-900">Validation Errors:</p>
                {selectedRow.errors.map((err, i) => (
                  <p key={i} className="text-rose-700">
                    • {err}
                  </p>
                ))}
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Question ID (Optional) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Question ID (for updates)</label>
                <input
                  type="text"
                  value={editingRawData.question_id || ''}
                  onChange={(e) =>
                    setEditingRawData((prev) => ({
                      ...prev,
                      question_id: e.target.value,
                    }))
                  }
                  placeholder="Optional UUID to update existing"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Subject *</label>
                <input
                  type="text"
                  value={editingRawData.subject || ''}
                  onChange={(e) =>
                    setEditingRawData((prev) => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="e.g. Physics"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium"
                />
              </div>

              {/* Chapter */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Chapter *</label>
                <input
                  type="text"
                  value={editingRawData.chapter || ''}
                  onChange={(e) =>
                    setEditingRawData((prev) => ({
                      ...prev,
                      chapter: e.target.value,
                    }))
                  }
                  placeholder="e.g. Electrostatics"
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium"
                />
              </div>

              {/* Question Type */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Question Type</label>
                <select
                  value={editingRawData.question_type || 'SINGLE_CORRECT'}
                  onChange={(e) =>
                    setEditingRawData((prev) => ({
                      ...prev,
                      question_type: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium"
                >
                  <option value="SINGLE_CORRECT">Single Correct MCQ</option>
                  <option value="MULTIPLE_CORRECT">Multiple Correct MCQ</option>
                  <option value="NUMERICAL">Numerical Value</option>
                  <option value="ASSERTION_REASON">Assertion - Reason</option>
                  <option value="CASE_BASED">Case / Passage Based</option>
                </select>
              </div>

              {/* Question Text */}
              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-700">Question Statement *</label>
                <textarea
                  rows={3}
                  value={editingRawData.question_text || ''}
                  onChange={(e) =>
                    setEditingRawData((prev) => ({
                      ...prev,
                      question_text: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 p-2.5 font-medium"
                />
              </div>

              {/* Option A */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Option A</label>
                <input
                  type="text"
                  value={editingRawData.option_a || ''}
                  onChange={(e) =>
                    setEditingRawData((prev) => ({
                      ...prev,
                      option_a: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 p-2 font-medium"
                />
              </div>

              {/* Option B */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Option B</label>
                <input
                  type="text"
                  value={editingRawData.option_b || ''}
                  onChange={(e) =>
                    setEditingRawData((prev) => ({
                      ...prev,
                      option_b: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 p-2 font-medium"
                />
              </div>

              {/* Option C */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Option C</label>
                <input
                  type="text"
                  value={editingRawData.option_c || ''}
                  onChange={(e) =>
                    setEditingRawData((prev) => ({
                      ...prev,
                      option_c: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 p-2 font-medium"
                />
              </div>

              {/* Option D */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Option D</label>
                <input
                  type="text"
                  value={editingRawData.option_d || ''}
                  onChange={(e) =>
                    setEditingRawData((prev) => ({
                      ...prev,
                      option_d: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 p-2 font-medium"
                />
              </div>

              {/* Correct Answer */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Correct Answer (e.g. A, B, or A,C)
                </label>
                <input
                  type="text"
                  value={editingRawData.correct_answer || ''}
                  onChange={(e) =>
                    setEditingRawData((prev) => ({
                      ...prev,
                      correct_answer: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 p-2 font-bold text-indigo-900"
                />
              </div>

              {/* Numerical Value (if numerical) */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700">
                  Numerical Value (if Numerical type)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editingRawData.numerical_answer || ''}
                  onChange={(e) =>
                    setEditingRawData((prev) => ({
                      ...prev,
                      numerical_answer: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 p-2 font-bold text-indigo-900"
                />
              </div>

              {/* Explanation */}
              <div className="sm:col-span-2 space-y-1">
                <label className="font-bold text-slate-700">Explanation</label>
                <textarea
                  rows={2}
                  value={editingRawData.explanation || ''}
                  onChange={(e) =>
                    setEditingRawData((prev) => ({
                      ...prev,
                      explanation: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 p-2 font-medium"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveRow}
                isLoading={isSavingRow}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Save & Re-validate Row
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportQuestionsPage;
