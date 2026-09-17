import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Globe2,
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  RefreshCw,
  FileCheck,
  Languages,
  Sparkles,
  Save,
  Table as TableIcon,
  LayoutTemplate,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  useUploadTranslationImportFileAPI,
  useGetTranslationImportSessionAPI,
  useGetTranslationImportRowsAPI,
  useUpdateTranslationImportRowAPI,
  useConfirmTranslationImportAPI,
  downloadTranslationTemplate,
  downloadTranslationErrorReport,
} from '../services/translationImport.service';
import type {
  TranslationImportSession,
  TranslationImportRow,
  TranslationImportRowStatus,
} from '../types/translationImport.types';

export const ImportTranslationsPage: React.FC = () => {
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

  // ─── Wizard Step State ─────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [viewMode, setViewMode] = useState<'FORM' | 'TABLE'>('FORM');

  // ─── File Upload State ─────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isDownloadingErrors, setIsDownloadingErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  // ─── Active Import Session State ───────────────────────────────
  const [activeImport, setActiveImport] = useState<TranslationImportSession | null>(null);
  const [rows, setRows] = useState<TranslationImportRow[]>([]);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number>(0);
  const [selectedStatusFilter] = useState<TranslationImportRowStatus | 'ALL'>('ALL');
  const [page] = useState<number>(1);

  // ─── Live Form Editing State for Selected Translation ──────────
  const [editingRawData, setEditingRawData] = useState<Record<string, any>>({
    question_id: '',
    language_code: 'hi',
    question_text: '',
    passage_text: '',
    assertion_text: '',
    reason_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: '',
    option_f: '',
    explanation: '',
  });
  const [isSavingRow, setIsSavingRow] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // ─── API Hooks ─────────────────────────────────────────────────
  const { uploadTranslationImportFileAPI, isLoading: isUploading } =
    useUploadTranslationImportFileAPI();
  const { getTranslationImportSessionAPI } = useGetTranslationImportSessionAPI();
  const { getTranslationImportRowsAPI } = useGetTranslationImportRowsAPI();
  const { updateTranslationImportRowAPI } = useUpdateTranslationImportRowAPI();
  const { confirmTranslationImportAPI, isLoading: isConfirming } =
    useConfirmTranslationImportAPI();

  const currentSelectedRow = rows[selectedRowIndex] || null;

  // ─── Fetch Staging Rows ────────────────────────────────────────
  const fetchRows = useCallback(
    async (importId: string, pageNum = 1, status = selectedStatusFilter) => {
      const res = await getTranslationImportRowsAPI(importId, {
        status: status === 'ALL' ? undefined : status,
        page: pageNum,
        limit: 20,
      });

      const rawPayload = res?.data;
      let loadedRows: TranslationImportRow[] = [];

      if (Array.isArray(rawPayload)) {
        loadedRows = rawPayload;
      } else if (rawPayload && typeof rawPayload === 'object') {
        if (Array.isArray((rawPayload as any).data)) {
          loadedRows = (rawPayload as any).data;
        } else if (Array.isArray((rawPayload as any).items)) {
          loadedRows = (rawPayload as any).items;
        }
      }

      setRows(loadedRows);
      if (loadedRows.length > 0) {
        setSelectedRowIndex(0);
      }
    },
    [getTranslationImportRowsAPI, selectedStatusFilter],
  );

  useEffect(() => {
    if (activeImport && currentStep === 2) {
      fetchRows(activeImport.id, page, selectedStatusFilter);
    }
  }, [activeImport, currentStep, page, selectedStatusFilter, fetchRows]);

  // ─── Sync Form Fields when Selected Row Changes ────────────────
  useEffect(() => {
    if (currentSelectedRow) {
      const raw = (currentSelectedRow.rawData || {}) as Record<string, any>;
      setEditingRawData({
        question_id: raw.question_id || raw.questionId || '',
        language_code: raw.language_code || raw.languageCode || raw.lang || 'hi',
        question_text: raw.question_text || raw.questionText || raw.text || '',
        passage_text: raw.passage_text || raw.passage || '',
        assertion_text: raw.assertion_text || raw.assertion || '',
        reason_text: raw.reason_text || raw.reason || '',
        option_a: raw.option_a || raw.optionA || '',
        option_b: raw.option_b || raw.optionB || '',
        option_c: raw.option_c || raw.optionC || '',
        option_d: raw.option_d || raw.optionD || '',
        option_e: raw.option_e || raw.optionE || '',
        option_f: raw.option_f || raw.optionF || '',
        explanation: raw.explanation || '',
      });
      setSaveSuccessMsg(null);
    }
  }, [currentSelectedRow]);

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
    const { data, error } = await uploadTranslationImportFileAPI(file);

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
      await downloadTranslationTemplate(format);
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
      await downloadTranslationErrorReport(activeImport.id, format);
    } catch {
      alert('Failed to download error report.');
    } finally {
      setIsDownloadingErrors(false);
    }
  };

  // ─── Save & Re-validate Current Selected Translation in Form ───
  const handleSaveCurrentTranslation = async () => {
    if (!activeImport || !currentSelectedRow) return;

    try {
      setIsSavingRow(true);
      setSaveSuccessMsg(null);

      const res = await updateTranslationImportRowAPI(
        activeImport.id,
        currentSelectedRow.id,
        {
          rawData: editingRawData,
        },
      );

      const updatedRow = (res as any)?.data?.data || (res as any)?.data;
      if (updatedRow) {
        setRows((prev) =>
          prev.map((r) => (r.id === updatedRow.id ? updatedRow : r)),
        );
        setSaveSuccessMsg('Translation saved & re-validated successfully!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }

      const sessionRes = await getTranslationImportSessionAPI(activeImport.id);
      if (sessionRes.data) setActiveImport(sessionRes.data);
    } catch {
      alert('Failed to update translation row. Please try again.');
    } finally {
      setIsSavingRow(false);
    }
  };

  // ─── Confirm & Execute Import ──────────────────────────────────
  const handleConfirmImport = async () => {
    if (!activeImport) return;

    setCurrentStep(3);
    const { data, error } = await confirmTranslationImportAPI(activeImport.id);

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
      const sessionRes = await getTranslationImportSessionAPI(activeImport.id);
      if (sessionRes.data) setActiveImport(sessionRes.data);
    }

    setCurrentStep(4);
  };

  // ─── Status Badge Helper ───────────────────────────────────────
  const renderRowStatusBadge = (status: TranslationImportRowStatus) => {
    switch (status) {
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-500" /> New Translation
          </span>
        );
      case 'UPDATE_AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
            <RefreshCw size={12} className="text-blue-500" /> Update Existing
          </span>
        );
      case 'DUPLICATE_IN_FILE':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
            <AlertTriangle size={12} className="text-amber-500" /> File Duplicate
          </span>
        );
      case 'INVALID':
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
            <XCircle size={12} className="text-rose-500" /> Invalid
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Breadcrumb & Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <button
              onClick={() => navigate(`${routePrefix}/languages`)}
              className="hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <Globe2 size={14} /> Regional Languages
            </button>
            <span>/</span>
            <span className="text-slate-900 font-bold">Bulk Question Translations</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Languages className="text-indigo-600" size={26} />
            Bulk Question Translation Studio
          </h1>
          <p className="text-xs text-slate-500">
            Import multi-lingual translations across 9 regional languages in bulk via Excel or CSV.
          </p>
        </div>

        {/* Action Header Buttons */}
        <div className="flex items-center gap-2">
          {currentStep === 2 && (
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('FORM')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'FORM'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutTemplate size={14} />
                <span>Pre-filled Translation Form</span>
              </button>
              <button
                onClick={() => setViewMode('TABLE')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'TABLE'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TableIcon size={14} />
                <span>Staging Summary Grid</span>
              </button>
            </div>
          )}

          <Button
            variant="outline"
            onClick={() => navigate(`${routePrefix}/languages`)}
            className="text-xs font-bold"
          >
            ← Back to Languages
          </Button>
        </div>
      </div>

      {/* ─── 4-Step Progress Indicator ─────────────────────────── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { step: 1, label: 'Upload Translation File', icon: UploadCloud },
          { step: 2, label: 'Auto-Filled Review & Edit', icon: FileCheck },
          { step: 3, label: 'Batch Translation Import', icon: RefreshCw },
          { step: 4, label: 'Import Report & Complete', icon: Sparkles },
        ].map((s) => {
          const Icon = s.icon;
          const isActive = currentStep === s.step;
          const isDone = currentStep > s.step;
          return (
            <div
              key={s.step}
              className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all ${
                isActive
                  ? 'border-indigo-600 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                  : isDone
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-slate-200 bg-white opacity-60'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Step {s.step}
                </div>
                <div
                  className={`text-xs font-extrabold truncate ${
                    isActive
                      ? 'text-indigo-900'
                      : isDone
                      ? 'text-emerald-900'
                      : 'text-slate-700'
                  }`}
                >
                  {s.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          STEP 1: UPLOAD TRANSLATIONS FILE
          ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Dropzone */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Select or Drop Translation Spreadsheet
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Upload an Excel (.xlsx/.xls) or CSV (.csv) containing regional translations for existing question IDs.
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
                  id="translation-file-upload"
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
                          Drop your translation file here!
                        </span>
                      ) : (
                        <>
                          Drag & Drop translation file here, or{' '}
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
                <div className="text-xs text-slate-500">
                  Step 1: Upload & Validate Translations
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={!file || isUploading}
                  isLoading={isUploading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                >
                  <span>Upload & Auto-Fill Translation Form →</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar Guidelines & Template Downloads */}
          <div className="space-y-6">
            {/* Download Templates Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Download size={18} className="text-indigo-600" />
                <span>Sample Templates</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Download a pre-structured template formatted with columns for question IDs and supported language codes.
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

            {/* Language Codes Reference Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                <Languages size={18} className="text-indigo-600" />
                <span>Supported Language Codes</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-indigo-600">hi</span>: Hindi (हिन्दी)
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-indigo-600">gu</span>: Gujarati (ગુજરાતી)
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-indigo-600">mr</span>: Marathi (मराठी)
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-indigo-600">ta</span>: Tamil (தமிழ்)
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-indigo-600">te</span>: Telugu (తెలుగు)
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-indigo-600">kn</span>: Kannada (ಕನ್ನಡ)
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-indigo-600">bn</span>: Bengali (বাংলা)
                </div>
                <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="font-mono font-bold text-indigo-600">en</span>: English
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          STEP 2: AUTO-FILLED TRANSLATION FORM & REVIEW
          ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && activeImport && (
        <div className="space-y-6">
          {/* Top Summary Stats Bar */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-extrabold text-slate-900">
                    {activeImport.fileName}
                  </span>
                  <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-mono font-bold text-indigo-700">
                    {activeImport.fileType}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeImport.totalRows} translation entries staged for validation
                </p>
              </div>
            </div>

            {/* Counts metrics */}
            <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1 md:pb-0">
              <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                <div className="text-sm font-black text-slate-900">{activeImport.totalRows}</div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                <div className="text-[10px] font-bold text-emerald-600 uppercase">New</div>
                <div className="text-sm font-black text-emerald-700">{activeImport.createRows}</div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-center">
                <div className="text-[10px] font-bold text-blue-600 uppercase">Updates</div>
                <div className="text-sm font-black text-blue-700">{activeImport.updateRows}</div>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-100 text-center">
                <div className="text-[10px] font-bold text-rose-600 uppercase">Invalid</div>
                <div className="text-sm font-black text-rose-700">{activeImport.invalidRows}</div>
              </div>

              <Button
                onClick={handleConfirmImport}
                disabled={activeImport.validRows === 0 || isConfirming}
                isLoading={isConfirming}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-200"
              >
                <span>Confirm & Batch Import ({activeImport.validRows}) →</span>
              </Button>
            </div>
          </div>

          {/* ─── FORM VIEW ───────────────────────────────────────── */}
          {viewMode === 'FORM' && (
            <div className="space-y-6">
              {/* Question / Language Pill Selector */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Select Translation Entry to Inspect & Edit:
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedRowIndex((prev) => Math.max(0, prev - 1))}
                      disabled={selectedRowIndex === 0}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-700">
                      Entry {selectedRowIndex + 1} of {rows.length}
                    </span>
                    <button
                      onClick={() =>
                        setSelectedRowIndex((prev) => Math.min(rows.length - 1, prev + 1))
                      }
                      disabled={selectedRowIndex === rows.length - 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                {/* Pill Carousel */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {rows.map((r, idx) => {
                    const isSelected = idx === selectedRowIndex;
                    const isInvalid = r.status === 'INVALID' || r.status === 'DUPLICATE_IN_FILE';
                    const isUpdate = r.status === 'UPDATE_AVAILABLE';
                    const lang = r.languageCode || 'hi';

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRowIndex(idx)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all shrink-0 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200 scale-105'
                            : isInvalid
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : isUpdate
                            ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300'
                        }`}
                      >
                        <span>T{r.rowNumber}</span>
                        <span className="uppercase px-1.5 py-0.5 rounded-md bg-black/10 text-[10px]">
                          {lang}
                        </span>
                        {isInvalid && <AlertTriangle size={12} className="text-rose-500" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Grid & Dual Preview */}
              {currentSelectedRow && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Editable Form Card */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-extrabold text-slate-900">
                            Translation #{currentSelectedRow.rowNumber}
                          </span>
                          {renderRowStatusBadge(currentSelectedRow.status)}
                        </div>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">
                          Target Question ID: {editingRawData.question_id || 'N/A'}
                        </p>
                      </div>

                      <Button
                        onClick={handleSaveCurrentTranslation}
                        disabled={isSavingRow}
                        isLoading={isSavingRow}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
                      >
                        <Save size={14} className="mr-1" />
                        <span>Save & Re-validate</span>
                      </Button>
                    </div>

                    {saveSuccessMsg && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        <span>{saveSuccessMsg}</span>
                      </div>
                    )}

                    {currentSelectedRow.errors && currentSelectedRow.errors.length > 0 && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertTriangle size={14} /> Validation Diagnostics:
                        </div>
                        {currentSelectedRow.errors.map((err, i) => (
                          <div key={i} className="pl-5 list-disc text-[11px]">
                            • {err}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Form Fields */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Question ID *
                          </label>
                          <input
                            type="text"
                            value={editingRawData.question_id}
                            onChange={(e) =>
                              setEditingRawData((prev) => ({
                                ...prev,
                                question_id: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Language Code *
                          </label>
                          <select
                            value={editingRawData.language_code}
                            onChange={(e) =>
                              setEditingRawData((prev) => ({
                                ...prev,
                                language_code: e.target.value,
                              }))
                            }
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                          >
                            <option value="hi">Hindi (hi - हिन्दी)</option>
                            <option value="gu">Gujarati (gu - ગુજરાતી)</option>
                            <option value="mr">Marathi (mr - मराठी)</option>
                            <option value="ta">Tamil (ta - தமிழ்)</option>
                            <option value="te">Telugu (te - తెలుగు)</option>
                            <option value="kn">Kannada (kn - ಕನ್ನಡ)</option>
                            <option value="bn">Bengali (bn - বাংলা)</option>
                            <option value="en">English (en)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Translated Question Statement *
                        </label>
                        <textarea
                          rows={3}
                          value={editingRawData.question_text}
                          onChange={(e) =>
                            setEditingRawData((prev) => ({
                              ...prev,
                              question_text: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          placeholder="Translated question statement in regional script..."
                        />
                      </div>

                      {/* Options Grid */}
                      <div className="space-y-3 pt-2">
                        <label className="block text-xs font-bold text-slate-700">
                          Translated Options:
                        </label>

                        {['a', 'b', 'c', 'd'].map((key) => {
                          const optField = `option_${key}`;
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-xl bg-slate-100 font-mono font-bold text-slate-700 text-xs flex items-center justify-center shrink-0">
                                {key.toUpperCase()}
                              </span>
                              <input
                                type="text"
                                value={editingRawData[optField] || ''}
                                onChange={(e) =>
                                  setEditingRawData((prev) => ({
                                    ...prev,
                                    [optField]: e.target.value,
                                  }))
                                }
                                placeholder={`Translated Option ${key.toUpperCase()} text...`}
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div className="pt-2">
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Translated Step-by-Step Explanation
                        </label>
                        <textarea
                          rows={3}
                          value={editingRawData.explanation}
                          onChange={(e) =>
                            setEditingRawData((prev) => ({
                              ...prev,
                              explanation: e.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          placeholder="Translated solution derivation and scientific explanation..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* Side-by-Side Live Dual Preview Card */}
                  <div className="rounded-3xl border border-indigo-100 bg-gradient-to-b from-indigo-50/30 to-white p-6 shadow-sm space-y-6">
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-600" />
                        <span className="text-sm font-extrabold text-slate-900">
                          Live Regional Script Preview
                        </span>
                      </div>
                      <span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-extrabold text-indigo-800 uppercase">
                        {editingRawData.language_code || 'HI'}
                      </span>
                    </div>

                    {/* Question Statement Box */}
                    <div className="space-y-4">
                      <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-sm space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                          Regional Question Statement:
                        </div>
                        <div className="text-sm font-bold text-slate-900 leading-relaxed">
                          {editingRawData.question_text || (
                            <span className="text-slate-300 italic">No question statement</span>
                          )}
                        </div>
                      </div>

                      {/* Option Pills */}
                      <div className="space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Regional Options:
                        </div>

                        {['a', 'b', 'c', 'd'].map((key) => {
                          const optField = `option_${key}`;
                          const val = editingRawData[optField];
                          if (!val) return null;

                          return (
                            <div
                              key={key}
                              className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center gap-3"
                            >
                              <span className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                                {key.toUpperCase()}
                              </span>
                              <span className="text-xs font-medium text-slate-800">{val}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Solution Explanation Box */}
                      {editingRawData.explanation && (
                        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                            Regional Explanation & Solution:
                          </div>
                          <p className="text-xs text-amber-900 leading-relaxed font-medium">
                            {editingRawData.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TABLE VIEW ──────────────────────────────────────── */}
          {viewMode === 'TABLE' && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Row #</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Question ID</th>
                      <th className="px-4 py-3">Lang</th>
                      <th className="px-4 py-3">Translated Statement</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-mono font-bold text-slate-500">
                          #{r.rowNumber}
                        </td>
                        <td className="px-4 py-3">{renderRowStatusBadge(r.status)}</td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600 truncate max-w-[150px]">
                          {r.targetQuestionId || (r.rawData as any)?.question_id || 'N/A'}
                        </td>
                        <td className="px-4 py-3 font-bold uppercase text-indigo-600">
                          {r.languageCode || 'hi'}
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-medium truncate max-w-[280px]">
                          {(r.rawData as any)?.question_text || ''}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedRowIndex(i);
                              setViewMode('FORM');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 text-[11px]"
                          >
                            Edit in Form
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          STEP 3: IMPORT EXECUTION STATE
          ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 shadow-sm text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-spin">
            <RefreshCw size={32} />
          </div>
          <h2 className="text-lg font-black text-slate-900">
            Importing & Upserting Question Translations...
          </h2>
          <p className="text-xs text-slate-500">
            Applying regional translations to questions and options in the database.
          </p>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          STEP 4: IMPORT COMPLETION SUMMARY
          ═════════════════════════════════════════════════════════════════ */}
      {currentStep === 4 && activeImport && (
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm shadow-emerald-100">
              <Sparkles size={32} />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900">
                Translation Import Completed!
              </h2>
              <p className="text-xs text-slate-500">
                All valid translation entries have been synchronized into the platform.
              </p>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/70">
                <div className="text-[10px] font-bold text-emerald-600 uppercase">Created</div>
                <div className="text-2xl font-black text-emerald-800">
                  {activeImport.createdCount}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/70">
                <div className="text-[10px] font-bold text-blue-600 uppercase">Updated</div>
                <div className="text-2xl font-black text-blue-800">
                  {activeImport.updatedCount}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200/70">
                <div className="text-[10px] font-bold text-rose-600 uppercase">Failed</div>
                <div className="text-2xl font-black text-rose-800">
                  {activeImport.failedCount}
                </div>
              </div>
            </div>

            {activeImport.failedCount > 0 && (
              <div className="pt-2">
                <Button
                  variant="outline"
                  onClick={() => handleDownloadErrors('xlsx')}
                  disabled={isDownloadingErrors}
                  className="text-xs font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Download size={14} className="mr-1" />
                  <span>Download Failed Translations Error Report (.xlsx)</span>
                </Button>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setActiveImport(null);
                  setRows([]);
                  setCurrentStep(1);
                }}
                className="text-xs font-bold"
              >
                Import Another Translation File
              </Button>

              <Button
                onClick={() => navigate(`${routePrefix}/languages`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Go to Languages Management →
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportTranslationsPage;
