import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  ArrowLeft,
  Edit3,
  Check,
  Database,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Table as TableIcon,
  FileText,
  Save,
  Layers,
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
  const routePrefix = location.pathname.startsWith('/super-admin')
    ? '/super-admin'
    : '/admin';

  // ─── Step State: 1: Upload, 2: Preview & Validation, 3: Confirmation, 4: Result ──
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // ─── View Mode for Step 2: 'FORM' (Pre-filled Question Form) or 'TABLE' (Summary Grid) ──
  const [viewMode, setViewMode] = useState<'FORM' | 'TABLE'>('FORM');

  // ─── Upload State ─────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [activeImport, setActiveImport] = useState<QuestionImportSession | null>(
    null,
  );
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState<boolean>(
    false,
  );
  const [isDownloadingErrors, setIsDownloadingErrors] = useState<boolean>(false);

  // ─── Preview Staging Rows State ───────────────────────────────
  const [rows, setRows] = useState<QuestionImportRow[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  // ─── Pre-filled Form State for Selected Question ──────────────
  const [editingRawData, setEditingRawData] = useState<Record<string, any>>({});
  const [isSavingRow, setIsSavingRow] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // ─── API Hooks ─────────────────────────────────────────────────
  const { uploadImportFileAPI, isLoading: isUploading } = useUploadImportFileAPI();
  const { getImportSessionAPI } = useGetImportSessionAPI();
  const { getImportRowsAPI, isLoading: isLoadingRows } = useGetImportRowsAPI();
  const { updateImportRowAPI } = useUpdateImportRowAPI();
  const { confirmImportAPI, isLoading: isConfirming } = useConfirmImportAPI();
  const { cancelImportAPI } = useCancelImportAPI();

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef<number>(0);

  // ─── Current Active Selected Row ───────────────────────────────
  const currentSelectedRow = rows[selectedRowIndex] || rows[0] || null;

  // ─── Sync Form Fields when Selected Row Changes ────────────────
  useEffect(() => {
    if (currentSelectedRow) {
      const raw = (currentSelectedRow.rawData || {}) as Record<string, any>;
      setEditingRawData({
        question_id: raw.question_id || raw.id || '',
        subject: raw.subject || '',
        chapter: raw.chapter || '',
        topic: raw.topic || '',
        sub_topic: raw.sub_topic || '',
        question_type: raw.question_type || raw.type || 'SINGLE_CORRECT',
        difficulty: raw.difficulty || 'MEDIUM',
        marks: raw.marks !== undefined ? raw.marks : 4,
        negative_marks: raw.negative_marks !== undefined ? raw.negative_marks : 1,
        question_text: raw.question_text || raw.question || '',
        option_a: raw.option_a || raw.optionA || '',
        option_b: raw.option_b || raw.optionB || '',
        option_c: raw.option_c || raw.optionC || '',
        option_d: raw.option_d || raw.optionD || '',
        option_e: raw.option_e || raw.optionE || '',
        option_f: raw.option_f || raw.optionF || '',
        correct_answer: raw.correct_answer || raw.answer || 'A',
        numerical_answer: raw.numerical_answer || '',
        numerical_tolerance: raw.numerical_tolerance || '0',
        assertion: raw.assertion || '',
        reason: raw.reason || '',
        passage: raw.passage || '',
        explanation: raw.explanation || '',
      });
      setSaveSuccessMsg(null);
    }
  }, [currentSelectedRow]);

  // ─── Polling Import Status When Processing ────────────────────
  const fetchImportSession = useCallback(
    async (importId: string) => {
      const res = await getImportSessionAPI(importId);
      const data: QuestionImportSession | undefined =
        (res as any)?.data?.data || (res as any)?.data;
      if (data) {
        setActiveImport(data);

        if (data.status === 'READY_TO_IMPORT' || data.status === 'VALIDATED') {
          if (currentStep === 1) {
            setCurrentStep(2);
            setViewMode('FORM'); // Auto-open pre-filled form
          }
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
      (activeImport.status === 'PROCESSING' ||
        activeImport.status === 'IMPORTING')
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
        limit: 20,
      });

      const rawPayload = res?.data;
      let loadedRows: QuestionImportRow[] = [];
      let loadedMeta: any = null;

      if (Array.isArray(rawPayload)) {
        loadedRows = rawPayload;
      } else if (rawPayload && typeof rawPayload === 'object') {
        if (Array.isArray((rawPayload as any).data)) {
          loadedRows = (rawPayload as any).data;
          loadedMeta = (rawPayload as any).meta;
        } else if (Array.isArray((rawPayload as any).items)) {
          loadedRows = (rawPayload as any).items;
          loadedMeta = (rawPayload as any).meta;
        }
      }

      setRows(loadedRows);
      if (loadedMeta) {
        setPaginationMeta(loadedMeta);
      }
      if (loadedRows.length > 0) {
        setSelectedRowIndex(0);
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
      setActiveImport(payload);
      // Immediately fetch rows and open pre-filled form
      await fetchRows(payload.id, 1, 'ALL');
      setCurrentStep(2);
      setViewMode('FORM');
    }
  };

  // ─── Template Download ─────────────────────────────────────────
  const handleDownloadTemplate = async (format: 'xlsx' | 'csv') => {
    try {
      setIsDownloadingTemplate(true);
      await downloadQuestionTemplate(format);
    } catch {
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
    } catch {
      alert('Failed to download error report.');
    } finally {
      setIsDownloadingErrors(false);
    }
  };

  // ─── Save & Re-validate Current Selected Question in Form ─────
  const handleSaveCurrentQuestion = async () => {
    if (!activeImport || !currentSelectedRow) return;

    try {
      setIsSavingRow(true);
      setSaveSuccessMsg(null);

      const res = await updateImportRowAPI(activeImport.id, currentSelectedRow.id, {
        rawData: editingRawData,
      });

      const updatedRow = (res as any)?.data?.data || (res as any)?.data;
      if (updatedRow) {
        setRows((prev) =>
          prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)),
        );
        setSaveSuccessMsg('Question saved & re-validated successfully!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }

      await fetchImportSession(activeImport.id);
    } catch {
      alert('Failed to update question row. Please try again.');
    } finally {
      setIsSavingRow(false);
    }
  };

  // ─── Confirm & Execute Import ──────────────────────────────────
  const handleConfirmImport = async () => {
    if (!activeImport) return;

    setCurrentStep(3);
    const { data, error } = await confirmImportAPI(activeImport.id);

    if (error) {
      alert(
        typeof error === 'string'
          ? error
          : (error as any).message || 'Failed to start import execution.',
      );
      setCurrentStep(2);
      return;
    }

    const payload = (data as any)?.data || data;
    if (payload) {
      setActiveImport(payload);
    } else {
      await fetchImportSession(activeImport.id);
    }

    setCurrentStep(4);
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
            <AlertTriangle size={12} />
            <span>Duplicate</span>
          </span>
        );
      case 'INVALID':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20">
            <AlertTriangle size={12} />
            <span>Validation Error</span>
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* ── Header & Breadcrumbs ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate(`${routePrefix}/question-bank`)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            <span>Back to Question Bank</span>
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="text-indigo-600" size={26} />
            <span>Bulk Question Import (CSV / Excel)</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Import, auto-fill, validate, and batch-create examination questions from Excel or CSV files
          </p>
        </div>

        {/* Wizard Step Pills */}
        <div className="flex items-center gap-2">
          {[
            { num: 1, label: 'Upload' },
            { num: 2, label: 'Pre-filled Form & Preview' },
            { num: 3, label: 'Importing' },
            { num: 4, label: 'Completed' },
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
                  Upload a <code>.xlsx</code> or <code>.csv</code> spreadsheet. All questions will be parsed and automatically populated into the Question Form for review.
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
                  <span>Upload & Auto-Fill Question Form →</span>
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
                        Plain CSV structure with standard headers
                      </p>
                    </div>
                  </div>
                  <Download size={14} className="text-slate-400 group-hover:text-indigo-600" />
                </button>
              </div>
            </div>

            {/* Quick Rules */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Sparkles size={16} className="text-amber-500" />
                <h3>Automatic Form Filling</h3>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">●</span>
                  <span>
                    <strong>Auto-Filled:</strong> Subject, chapter, difficulty, statements, options, answers, and derivations are populated immediately.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">●</span>
                  <span>
                    <strong>Direct Editing:</strong> Review or modify any question right in the form before batch importing.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════ */}
      {/* STEP 2: PRE-FILLED FORM & VALIDATION PREVIEW */}
      {/* ═════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && activeImport && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Questions
              </p>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">
                {activeImport.totalRows}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Valid (Create)
              </p>
              <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                {activeImport.createRows}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                Updates
              </p>
              <p className="text-2xl font-extrabold text-blue-900 mt-1">
                {activeImport.updateRows}
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                Invalid / Errors
              </p>
              <p className="text-2xl font-extrabold text-rose-900 mt-1">
                {activeImport.invalidRows}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                Duplicates
              </p>
              <p className="text-2xl font-extrabold text-amber-900 mt-1">
                {activeImport.duplicateRows}
              </p>
            </div>
          </div>

          {/* Top Control Bar: Mode Toggle + Confirm Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => setViewMode('FORM')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'FORM'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText size={15} />
                <span>Pre-filled Question Form</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('TABLE')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'TABLE'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon size={15} />
                <span>Staging Summary Grid</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {activeImport.invalidRows > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadErrors('xlsx')}
                  disabled={isDownloadingErrors}
                  className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50"
                >
                  <Download size={13} className="mr-1" />
                  <span>Download Error Report</span>
                </Button>
              )}

              <Button
                onClick={handleConfirmImport}
                disabled={activeImport.validRows + activeImport.updateRows === 0 || isConfirming}
                isLoading={isConfirming}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
              >
                <Check size={16} className="mr-1.5" />
                <span>
                  Confirm & Batch Import ({activeImport.validRows + activeImport.updateRows}) Questions →
                </span>
              </Button>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* VIEW MODE 1: AUTO-FILLED QUESTION FORM */}
          {/* ───────────────────────────────────────────────────────────── */}
          {viewMode === 'FORM' && (
            <div className="space-y-6">
              {/* Question Navigation Carousel / Selector Bar */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 font-extrabold text-xs">
                      #{selectedRowIndex + 1}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Imported Questions ({rows.length} loaded)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={selectedRowIndex <= 0}
                      onClick={() => setSelectedRowIndex((idx) => Math.max(0, idx - 1))}
                      className="text-xs"
                    >
                      <ChevronLeft size={14} className="mr-1" /> Previous
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={selectedRowIndex >= rows.length - 1}
                      onClick={() => setSelectedRowIndex((idx) => Math.min(rows.length - 1, idx + 1))}
                      className="text-xs"
                    >
                      Next <ChevronRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Horizontal Question Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1">
                  {rows.map((r, index) => {
                    const isSelected = index === selectedRowIndex;
                    const isErr = r.status === 'INVALID';
                    const isUpd = r.status === 'UPDATE_AVAILABLE';

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRowIndex(index)}
                        className={`flex shrink-0 items-center gap-2 rounded-2xl px-3.5 py-2 text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                            : isErr
                              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                              : isUpd
                                ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <span>Q{r.rowNumber}</span>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isErr
                              ? 'bg-rose-500'
                              : isUpd
                                ? 'bg-blue-500'
                                : 'bg-emerald-500'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Pre-filled Question Form & Live Preview Grid */}
              {currentSelectedRow ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left: Pre-filled Interactive Question Form (7 cols) */}
                  <div className="lg:col-span-7 space-y-6">
                    {/* Validation Alerts for Current Row */}
                    {currentSelectedRow.errors && currentSelectedRow.errors.length > 0 && (
                      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-xs space-y-2">
                        <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                          <AlertTriangle size={16} />
                          <span>Validation Issues in Question #{currentSelectedRow.rowNumber}</span>
                        </div>
                        <ul className="space-y-1 text-rose-700 font-medium">
                          {currentSelectedRow.errors.map((err, i) => (
                            <li key={i}>• {err}</li>
                          ))}
                        </ul>
                        <p className="text-[11px] text-rose-600 font-semibold pt-1">
                          You can fix these details directly in the form below and click "Save & Re-validate".
                        </p>
                      </div>
                    )}

                    {saveSuccessMsg && (
                      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        <span>{saveSuccessMsg}</span>
                      </div>
                    )}

                    {/* Section 1: Academic Hierarchy & Configuration */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                          <Layers size={16} className="text-indigo-600" />
                          <span>Academic Hierarchy & Rules (Pre-filled)</span>
                        </h3>
                        {getStatusBadge(currentSelectedRow.status)}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
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
                            placeholder="e.g. Physics (NEET)"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 font-semibold text-slate-900 focus:bg-white focus:border-indigo-500"
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
                            placeholder="e.g. Laws of Motion & Mechanics"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 font-semibold text-slate-900 focus:bg-white focus:border-indigo-500"
                          />
                        </div>

                        {/* Topic */}
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Topic (Optional)</label>
                          <input
                            type="text"
                            value={editingRawData.topic || ''}
                            onChange={(e) =>
                              setEditingRawData((prev) => ({
                                ...prev,
                                topic: e.target.value,
                              }))
                            }
                            placeholder="e.g. Newton Laws of Motion"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 font-semibold text-slate-900 focus:bg-white focus:border-indigo-500"
                          />
                        </div>

                        {/* Question Type */}
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Question Type *</label>
                          <select
                            value={editingRawData.question_type || 'SINGLE_CORRECT'}
                            onChange={(e) =>
                              setEditingRawData((prev) => ({
                                ...prev,
                                question_type: e.target.value,
                              }))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 font-bold text-indigo-900 focus:bg-white focus:border-indigo-500"
                          >
                            <option value="SINGLE_CORRECT">Single Correct MCQ</option>
                            <option value="MULTIPLE_CORRECT">Multiple Correct MCQ</option>
                            <option value="NUMERICAL">Numerical Value</option>
                            <option value="ASSERTION_REASON">Assertion - Reason</option>
                            <option value="CASE_BASED">Case / Passage Based</option>
                          </select>
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-1">
                          <label className="font-bold text-slate-700">Difficulty Level</label>
                          <select
                            value={editingRawData.difficulty || 'MEDIUM'}
                            onChange={(e) =>
                              setEditingRawData((prev) => ({
                                ...prev,
                                difficulty: e.target.value,
                              }))
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 font-semibold text-slate-900 focus:bg-white"
                          >
                            <option value="EASY">EASY</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HARD">HARD</option>
                            <option value="VERY_HARD">VERY HARD</option>
                          </select>
                        </div>

                        {/* Marks & Penalty */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Marks (+)</label>
                            <input
                              type="number"
                              value={editingRawData.marks ?? 4}
                              onChange={(e) =>
                                setEditingRawData((prev) => ({
                                  ...prev,
                                  marks: Number(e.target.value),
                                }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 font-bold text-emerald-700 focus:bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">Negative (-)</label>
                            <input
                              type="number"
                              value={editingRawData.negative_marks ?? 1}
                              onChange={(e) =>
                                setEditingRawData((prev) => ({
                                  ...prev,
                                  negative_marks: Number(e.target.value),
                                }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 font-bold text-rose-700 focus:bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Question Statement & Content */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                      <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <FileText size={16} className="text-indigo-600" />
                        <span>Question Statement (Pre-filled)</span>
                      </h3>

                      {/* Passage (if Case-based) */}
                      {editingRawData.question_type === 'CASE_BASED' && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700">
                            Reading Passage / Case Study Narrative *
                          </label>
                          <textarea
                            rows={3}
                            value={editingRawData.passage || ''}
                            onChange={(e) =>
                              setEditingRawData((prev) => ({
                                ...prev,
                                passage: e.target.value,
                              }))
                            }
                            placeholder="Enter background passage..."
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:bg-white"
                          />
                        </div>
                      )}

                      {/* Assertion & Reason (if Assertion-Reason) */}
                      {editingRawData.question_type === 'ASSERTION_REASON' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">
                              Assertion (A) Statement *
                            </label>
                            <textarea
                              rows={3}
                              value={editingRawData.assertion || ''}
                              onChange={(e) =>
                                setEditingRawData((prev) => ({
                                  ...prev,
                                  assertion: e.target.value,
                                }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:bg-white"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700">
                              Reason (R) Statement *
                            </label>
                            <textarea
                              rows={3}
                              value={editingRawData.reason || ''}
                              onChange={(e) =>
                                setEditingRawData((prev) => ({
                                  ...prev,
                                  reason: e.target.value,
                                }))
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:bg-white"
                            />
                          </div>
                        </div>
                      )}

                      {/* Main Question Text */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Main Question Text *
                        </label>
                        <textarea
                          rows={3}
                          value={editingRawData.question_text || ''}
                          onChange={(e) =>
                            setEditingRawData((prev) => ({
                              ...prev,
                              question_text: e.target.value,
                            }))
                          }
                          placeholder="Type or review the full question statement..."
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-semibold text-slate-900 focus:bg-white focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Section 3: Options & Answers */}
                    {editingRawData.question_type !== 'NUMERICAL' ? (
                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            Options & Correct Answer Selection
                          </h3>
                          <span className="text-xs font-bold text-indigo-700">
                            Current Answer: {editingRawData.correct_answer || 'None'}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {['a', 'b', 'c', 'd'].map((key) => {
                            const upperKey = key.toUpperCase();
                            const optKey = `option_${key}`;
                            const isCorrect = (editingRawData.correct_answer || '')
                              .toUpperCase()
                              .split(',')
                              .map((s: string) => s.trim())
                              .includes(upperKey);

                            return (
                              <div
                                key={key}
                                className={`flex items-center gap-3 rounded-2xl border p-3 transition-all ${
                                  isCorrect
                                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                                    : 'border-slate-200 bg-slate-50/30'
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      editingRawData.question_type ===
                                      'MULTIPLE_CORRECT'
                                    ) {
                                      const currentList = (
                                        editingRawData.correct_answer || ''
                                      )
                                        .toUpperCase()
                                        .split(',')
                                        .map((s: string) => s.trim())
                                        .filter(Boolean);
                                      const newList = currentList.includes(upperKey)
                                        ? currentList.filter((k: string) => k !== upperKey)
                                        : [...currentList, upperKey];
                                      setEditingRawData((prev) => ({
                                        ...prev,
                                        correct_answer: newList.sort().join(','),
                                      }));
                                    } else {
                                      setEditingRawData((prev) => ({
                                        ...prev,
                                        correct_answer: upperKey,
                                      }));
                                    }
                                  }}
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-extrabold text-xs transition-all ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                  }`}
                                  title="Toggle Correct Answer"
                                >
                                  {isCorrect ? <Check size={14} /> : upperKey}
                                </button>

                                <input
                                  type="text"
                                  value={editingRawData[optKey] || ''}
                                  onChange={(e) =>
                                    setEditingRawData((prev) => ({
                                      ...prev,
                                      [optKey]: e.target.value,
                                    }))
                                  }
                                  placeholder={`Option ${upperKey} text...`}
                                  className="w-full bg-transparent text-xs font-medium text-slate-900 focus:outline-none"
                                />

                                {isCorrect && (
                                  <span className="shrink-0 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                                    CORRECT
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      /* Numerical Answer Card */
                      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <h3 className="text-sm font-extrabold text-slate-900">
                          Numerical Answer Configuration
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">
                              Exact Numerical Target Value *
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
                              placeholder="e.g. 7"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 font-extrabold text-indigo-900 focus:bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700">
                              Acceptable Tolerance (±)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={editingRawData.numerical_tolerance || '0'}
                              onChange={(e) =>
                                setEditingRawData((prev) => ({
                                  ...prev,
                                  numerical_tolerance: e.target.value,
                                }))
                              }
                              placeholder="e.g. 0.05"
                              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 font-semibold text-slate-800 focus:bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Section 4: Explanation & Solution Derivation */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                      <h3 className="text-sm font-extrabold text-slate-900">
                        Step-by-Step Explanation & Derivation
                      </h3>
                      <textarea
                        rows={3}
                        value={editingRawData.explanation || ''}
                        onChange={(e) =>
                          setEditingRawData((prev) => ({
                            ...prev,
                            explanation: e.target.value,
                          }))
                        }
                        placeholder="Explain the step-by-step solution derivation..."
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:bg-white focus:border-indigo-500"
                      />
                    </div>

                    {/* Save & Revalidate Action */}
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-xs text-slate-500">
                        Edits will update Staging Row #{currentSelectedRow.rowNumber} and re-run all validation rules.
                      </p>

                      <Button
                        onClick={handleSaveCurrentQuestion}
                        isLoading={isSavingRow}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                      >
                        <Save size={15} className="mr-1.5" />
                        <span>Save & Re-validate Question #{currentSelectedRow.rowNumber}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Right: Live Preview Card Simulation (5 cols) */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="sticky top-6 space-y-4">
                      {/* Live Question Preview Box */}
                      <div className="rounded-3xl border border-indigo-100 bg-gradient-to-b from-white to-slate-50/50 p-6 shadow-sm space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 font-bold text-xs">
                              <Sparkles size={13} />
                            </span>
                            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                              Live Student Portal Preview
                            </span>
                          </div>

                          <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase">
                            {editingRawData.difficulty || 'MEDIUM'}
                          </span>
                        </div>

                        {/* Subject & Scoring Badge */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">
                            {editingRawData.subject || 'Subject'} • {editingRawData.chapter || 'Chapter'}
                          </span>
                          <span className="font-extrabold text-emerald-700">
                            +{editingRawData.marks ?? 4} / -{editingRawData.negative_marks ?? 1}
                          </span>
                        </div>

                        {/* Passage if Case-based */}
                        {editingRawData.passage && (
                          <div className="rounded-2xl bg-indigo-50/60 p-4 text-xs text-slate-800 leading-relaxed italic border border-indigo-100">
                            <p className="font-bold text-indigo-900 not-italic mb-1">Passage:</p>
                            {editingRawData.passage}
                          </div>
                        )}

                        {/* Assertion / Reason */}
                        {editingRawData.assertion && (
                          <div className="space-y-2 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-800 border border-slate-200">
                            <p>
                              <strong>Assertion (A):</strong> {editingRawData.assertion}
                            </p>
                            <p>
                              <strong>Reason (R):</strong> {editingRawData.reason}
                            </p>
                          </div>
                        )}

                        {/* Question Text */}
                        <div className="text-sm font-bold text-slate-900 leading-relaxed">
                          {editingRawData.question_text || (
                            <span className="text-slate-400 font-normal italic">
                              Question statement will appear here...
                            </span>
                          )}
                        </div>

                        {/* Options Preview */}
                        {editingRawData.question_type !== 'NUMERICAL' ? (
                          <div className="space-y-2 pt-2">
                            {['a', 'b', 'c', 'd'].map((k) => {
                              const upper = k.toUpperCase();
                              const optVal = editingRawData[`option_${k}`];
                              if (!optVal) return null;
                              const isCorrect = (editingRawData.correct_answer || '')
                                .toUpperCase()
                                .split(',')
                                .map((s: string) => s.trim())
                                .includes(upper);

                              return (
                                <div
                                  key={k}
                                  className={`flex items-center gap-3 rounded-2xl border p-3 text-xs ${
                                    isCorrect
                                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold'
                                      : 'border-slate-200 bg-white text-slate-700'
                                  }`}
                                >
                                  <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-lg font-bold text-xs ${
                                      isCorrect
                                        ? 'bg-emerald-600 text-white'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {upper}
                                  </span>
                                  <span>{optVal}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 text-xs">
                            <p className="font-bold text-indigo-900">Numerical Target Answer:</p>
                            <p className="text-base font-extrabold text-indigo-700 mt-1">
                              {editingRawData.numerical_answer || '—'} (±{editingRawData.numerical_tolerance || '0'})
                            </p>
                          </div>
                        )}

                        {/* Solution Derivation Preview */}
                        {editingRawData.explanation && (
                          <div className="rounded-2xl bg-amber-50/60 p-4 text-xs text-amber-950 border border-amber-200/60 space-y-1">
                            <p className="font-bold text-amber-900">Solution Derivation:</p>
                            <p className="text-[11px] leading-relaxed">
                              {editingRawData.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-400">
                  No question selected.
                </div>
              )}
            </div>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* VIEW MODE 2: STAGING SUMMARY GRID TABLE */}
          {/* ───────────────────────────────────────────────────────────── */}
          {viewMode === 'TABLE' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl w-fit">
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

              {/* Grid Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5 text-center w-12">#</th>
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
                          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-600" />
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
                      rows.map((r, idx) => {
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
                                <span>Marks: +{raw.marks ?? 4} / -{raw.negative_marks ?? 1}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3.5">
                              {hasErrors && (
                                <div className="space-y-1">
                                  {r.errors?.map((err, i) => (
                                    <div key={i} className="text-[11px] font-semibold text-rose-700 flex items-start gap-1">
                                      <span className="text-rose-500">✕</span>
                                      <span>{err}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              {hasWarnings && (
                                <div className="space-y-1 mt-1">
                                  {r.warnings?.map((warn, i) => (
                                    <div key={i} className="text-[11px] font-medium text-amber-700 flex items-start gap-1">
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
                                onClick={() => {
                                  setSelectedRowIndex(idx);
                                  setViewMode('FORM');
                                }}
                                className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors"
                              >
                                <Edit3 size={13} />
                                <span>Open Form</span>
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
                    Page <strong>{page}</strong> of <strong>{paginationMeta.totalPages}</strong> ({paginationMeta.total} rows)
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
          )}

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
                disabled={activeImport.validRows + activeImport.updateRows === 0 || isConfirming}
                isLoading={isConfirming}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
              >
                <Check size={16} className="mr-1.5" />
                <span>
                  Confirm & Batch Import ({activeImport.validRows + activeImport.updateRows}) Questions →
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
    </div>
  );
};

export default ImportQuestionsPage;
