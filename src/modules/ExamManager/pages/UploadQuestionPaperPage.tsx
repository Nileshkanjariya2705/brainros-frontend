import React, { useState, useRef, useEffect } from 'react';
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
  Layers,
  ArrowRight,
  Search,
  Check,
  Sliders,
  Clock,
  HelpCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';
import {
  useGetBlueprintsAPI,
  useCreateExamFromUploadAPI,
  useUploadQuestionPaperAPI,
  downloadQuestionPaperTemplate,
  downloadQuestionPaperErrorReport,
} from '../services/examManager.service';
import type { BlueprintItem } from '../types/examManager.types';

export const UploadQuestionPaperPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const routePrefix = location.pathname.startsWith('/super-admin')
    ? '/super-admin'
    : '/admin';

  // ─── Step State: 1 = Choose Blueprint, 2 = File & Section Upload ────
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // ─── Step 1: Blueprints State ──────────────────────────────────
  const [blueprints, setBlueprints] = useState<BlueprintItem[]>([]);
  const [blueprintSearch, setBlueprintSearch] = useState('');
  const [selectedBlueprint, setSelectedBlueprint] = useState<BlueprintItem | null>(null);

  const { getBlueprintsAPI, isLoading: isLoadingBlueprints } = useGetBlueprintsAPI();

  // Load Blueprints on mount
  useEffect(() => {
    getBlueprintsAPI().then(({ data }) => {
      if (data && Array.isArray(data)) {
        setBlueprints(data);
      }
    });
  }, [getBlueprintsAPI]);

  // ─── Step 2: Form & File State ─────────────────────────────────
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [defaultMarks, setDefaultMarks] = useState<number>(4);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState<number>(1);

  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [isDownloadingErrors, setIsDownloadingErrors] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const { uploadQuestionPaperAPI, isLoading: isUploading } = useUploadQuestionPaperAPI();
  const { createExamFromUploadAPI, isLoading: isCreating } = useCreateExamFromUploadAPI();

  // Update defaults when blueprint selected
  const handleSelectBlueprint = (bp: BlueprintItem) => {
    setSelectedBlueprint(bp);
    setTitle(`${bp.name} Mock Test 01`);
    setDurationMinutes(bp.durationMinutes || 180);
    setCurrentStep(2);
    setUploadError(null);
    setFile(null);
    setUploadResult(null);
  };

  // Filtered blueprints
  const filteredBlueprints = blueprints.filter((b) => {
    const q = blueprintSearch.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      (b.examTarget?.name || '').toLowerCase().includes(q) ||
      (b.description || '').toLowerCase().includes(q)
    );
  });

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
      toast.error('Please select a question paper file to upload.');
      return;
    }

    setUploadError(null);
    setUploadResult(null);

    if (selectedBlueprint) {
      const { data, error } = await createExamFromUploadAPI(
        {
          title: title.trim() || `${selectedBlueprint.name} Mock Test`,
          blueprintId: selectedBlueprint.id,
          description: description.trim() || undefined,
          durationMinutes: Number(durationMinutes) || 180,
          defaultMarksPerQuestion: Number(defaultMarks) || 4,
          defaultNegativeMarks: Number(defaultNegativeMarks) || 1,
        },
        file,
      );

      if (error) {
        const errorMsg =
          typeof error === 'string'
            ? error
            : (error as any).message || 'Failed to process question paper against blueprint.';
        setUploadError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      const payload = (data as any)?.data || data;
      setUploadResult(payload);

      if (payload?.success || payload?.id) {
        toast.success(payload.message || 'Exam created successfully from blueprint!');
      } else {
        toast.error(payload?.message || 'Question paper validation failed. Check diagnostics below.');
      }
    } else {
      const { data, error } = await uploadQuestionPaperAPI(file);

      if (error) {
        const errorMsg =
          typeof error === 'string'
            ? error
            : (error as any).message || 'Failed to process question paper.';
        setUploadError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      const payload = (data as any)?.data || data;
      setUploadResult(payload);

      if (payload?.success) {
        toast.success(payload.message || 'Exam created successfully!');
      } else {
        toast.error(payload?.message || 'Question paper validation failed. Please check errors below.');
      }
    }
  };

  // ─── Template Download ─────────────────────────────────────────
  const handleDownloadTemplate = async (format: 'xlsx' | 'csv') => {
    try {
      setIsDownloadingTemplate(true);
      await downloadQuestionPaperTemplate(format);
      toast.success(`Question paper ${format.toUpperCase()} template downloaded.`);
    } catch {
      toast.error('Failed to download template. Please try again.');
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
      toast.success('Error report workbook downloaded.');
    } catch {
      toast.error('Failed to download error report.');
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
            First select an Exam Blueprint specification, then configure sections and upload your spreadsheet.
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

      {/* ─── Stepper Indicator ─────────────────────────────────── */}
      {!uploadResult && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 text-xs font-extrabold cursor-pointer transition-colors ${
              currentStep === 1 ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                currentStep === 1
                  ? 'bg-indigo-600 text-white'
                  : selectedBlueprint
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {selectedBlueprint && currentStep !== 1 ? '✓' : '1'}
            </span>
            <span>1. Choose Exam Blueprint</span>
          </div>

          <span className="text-slate-300">/</span>

          <div
            onClick={() => selectedBlueprint && setCurrentStep(2)}
            className={`flex items-center gap-2 text-xs font-extrabold transition-colors ${
              currentStep === 2
                ? 'text-indigo-600'
                : selectedBlueprint
                ? 'text-slate-500 hover:text-slate-800 cursor-pointer'
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-black ${
                currentStep === 2
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              2
            </span>
            <span>2. Upload File & Section Configuration</span>
          </div>
        </div>
      )}

      {/* ─── Main Content ──────────────────────────────────────── */}
      {!uploadResult ? (
        currentStep === 1 ? (
          /* ════════════════════════════════════════════════════════════
             STEP 1: CHOOSE EXAM BLUEPRINT
             ════════════════════════════════════════════════════════════ */
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sliders size={18} className="text-indigo-600" />
                  <span>Select Target Exam Blueprint</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Select a predefined curriculum blueprint specification to validate question distribution rules.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search blueprints..."
                  value={blueprintSearch}
                  onChange={(e) => setBlueprintSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:border-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            {isLoadingBlueprints ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-44 rounded-3xl bg-slate-200/70 animate-pulse" />
                ))}
              </div>
            ) : filteredBlueprints.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBlueprints.map((bp) => {
                  const isSelected = selectedBlueprint?.id === bp.id;
                  return (
                    <div
                      key={bp.id}
                      onClick={() => handleSelectBlueprint(bp)}
                      className={`group relative rounded-3xl border p-5 shadow-xs transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-600/30'
                          : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xs shadow-xs shadow-indigo-200">
                              v{bp.version}
                            </div>
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {bp.name}
                              </h3>
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                {bp.examTarget?.name || 'General Exam'}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xs">
                              <Check size={14} />
                            </span>
                          )}
                        </div>

                        {bp.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                            {bp.description}
                          </p>
                        )}

                        {/* Specs */}
                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] font-semibold text-slate-600">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                            <HelpCircle size={13} className="text-indigo-500" />
                            <span>{bp.totalQuestions} Questions</span>
                          </div>
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-1.5">
                            <Clock size={13} className="text-emerald-500" />
                            <span>{bp.durationMinutes || 180} mins</span>
                          </div>
                        </div>

                        {/* Section / Rules Tag Summary */}
                        {bp.rules && bp.rules.length > 0 && (
                          <div className="pt-2 flex flex-wrap gap-1">
                            {bp.rules.slice(0, 3).map((r: any, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                              >
                                {r.subject?.name || 'Subject'}: {r.selectionCount} Qs
                              </span>
                            ))}
                            {bp.rules.length > 3 && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                +{bp.rules.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-bold text-indigo-600">
                        <span>Select Blueprint</span>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center space-y-3">
                <Layers className="h-10 w-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No blueprints found</h3>
                <p className="text-xs text-slate-500">
                  Try adjusting your search query, or proceed without a blueprint template.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBlueprint(null);
                    setCurrentStep(2);
                  }}
                  className="mt-2 text-xs font-bold"
                >
                  Skip Blueprint & Upload Directly →
                </Button>
              </div>
            )}
          </div>
        ) : (
          /* ════════════════════════════════════════════════════════════
             STEP 2: SECTION & FILE UPLOAD
             ════════════════════════════════════════════════════════════ */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Dropzone & Config Card */}
            <div className="lg:col-span-2 space-y-6">
              {/* Selected Blueprint Header Banner */}
              {selectedBlueprint && (
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xs shadow-xs">
                      v{selectedBlueprint.version}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-900">
                          Blueprint: {selectedBlueprint.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-200/60 text-indigo-800">
                          {selectedBlueprint.examTarget?.name || 'Curriculum'}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-700 mt-0.5">
                        {selectedBlueprint.totalQuestions} Questions · {selectedBlueprint.durationMinutes || 180} Minutes
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50"
                  >
                    Change Blueprint
                  </Button>
                </div>
              )}

              {/* Exam & Section Settings */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  1. Exam Parameters & Scoring
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Exam Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. JEE Main 2026 Full Length Mock 01"
                      className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-700">Description (Optional)</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Comprehensive mock exam covering Physics, Chemistry and Maths"
                      className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Duration (Minutes)</label>
                    <input
                      type="number"
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Marks / Q</label>
                      <input
                        type="number"
                        value={defaultMarks}
                        onChange={(e) => setDefaultMarks(Number(e.target.value))}
                        className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Negative Marks</label>
                      <input
                        type="number"
                        value={defaultNegativeMarks}
                        onChange={(e) => setDefaultNegativeMarks(Number(e.target.value))}
                        className="w-full text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900 focus:bg-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dropzone container */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    2. Select Question Paper Spreadsheet
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">.xlsx, .xls, .csv</span>
                </div>

                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${
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
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-transform ${
                      file
                        ? 'bg-emerald-100 text-emerald-600'
                        : dragActive
                        ? 'bg-indigo-600 text-white scale-110'
                        : 'bg-indigo-100 text-indigo-600'
                    }`}
                  >
                    {file ? <FileCheck size={28} /> : <UploadCloud size={28} />}
                  </div>

                  {file ? (
                    <div className="text-center space-y-1">
                      <p className="text-sm font-extrabold text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Ready to Validate & Create
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
                    <div className="text-center space-y-1.5">
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
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold w-full sm:w-auto"
                  >
                    ← Back to Blueprints
                  </Button>

                  <Button
                    onClick={handleUpload}
                    disabled={!file || isUploading || isCreating}
                    isLoading={isUploading || isCreating}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 font-extrabold text-xs w-full sm:w-auto"
                  >
                    <span>Validate & Auto-Create Exam →</span>
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
                  Download a pre-formatted question paper spreadsheet with sample sections and scoring rules.
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isDownloadingTemplate}
                    onClick={() => handleDownloadTemplate('xlsx')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    <FileSpreadsheet size={16} className="text-emerald-600" />
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button
                    type="button"
                    disabled={isDownloadingTemplate}
                    onClick={() => handleDownloadTemplate('csv')}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-xs font-bold text-slate-700 transition-all cursor-pointer"
                  >
                    <Download size={16} className="text-blue-600" />
                    <span>CSV (.csv)</span>
                  </button>
                </div>
              </div>

              {/* Blueprint Sections Summary */}
              {selectedBlueprint && selectedBlueprint.rules && (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
                  <div className="text-slate-900 font-extrabold text-sm flex items-center gap-2">
                    <Layers size={16} className="text-indigo-600" />
                    <span>Blueprint Section Rules</span>
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    {selectedBlueprint.rules.map((rule: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                      >
                        <span className="font-bold text-slate-800 truncate">
                          {rule.subject?.name || 'Section'}
                        </span>
                        <span className="font-mono text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {rule.selectionCount} Questions
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
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
