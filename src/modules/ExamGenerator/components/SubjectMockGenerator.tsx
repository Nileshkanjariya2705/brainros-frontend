import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowLeft,
  Check,
  Sparkles,
  Atom,
  FlaskConical,
  Binary,
  Dna,
  XCircle,
  ChevronRight,
  Sliders,
  Globe,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import ExamTranslationManager from '@/modules/RegionalLanguage/components/ExamTranslationManager';
import {
  downloadSubjectTemplate,
  useUploadAndValidateSubjectMockAPI,
  useGenerateSubjectMockAPI,
  type SubjectMockUploadResponse,
  type GeneratedSubjectMockResponse,
} from '../services/subjectMockGenerator.service';
import { toast } from '@/utils/toast';

interface SubjectMockGeneratorProps {
  subject: 'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS' | 'BIOLOGY';
  onBack: () => void;
}

const SUBJECT_CONFIGS: Record<
  string,
  {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
    badgeColor: string;
    gradient: string;
    borderColor: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  PHYSICS: {
    title: 'Physics',
    icon: Atom,
    accentColor: 'indigo',
    badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    gradient: 'from-indigo-600 to-blue-600',
    borderColor: 'border-indigo-200',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
  CHEMISTRY: {
    title: 'Chemistry',
    icon: FlaskConical,
    accentColor: 'emerald',
    badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    gradient: 'from-emerald-600 to-teal-600',
    borderColor: 'border-emerald-200',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  MATHEMATICS: {
    title: 'Mathematics',
    icon: Binary,
    accentColor: 'amber',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    gradient: 'from-amber-600 to-orange-600',
    borderColor: 'border-amber-200',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
  },
  BIOLOGY: {
    title: 'Biology',
    icon: Dna,
    accentColor: 'rose',
    badgeColor: 'bg-rose-100 text-rose-700 border-rose-200',
    gradient: 'from-rose-600 to-pink-600',
    borderColor: 'border-rose-200',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
};

export const SubjectMockGenerator: React.FC<SubjectMockGeneratorProps> = ({
  subject,
  onBack,
}) => {
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

  const config = SUBJECT_CONFIGS[subject] || SUBJECT_CONFIGS.PHYSICS;
  const SubjectIcon = config.icon;

  // ─── Step State: 1: Upload, 2: Preview & Validation, 3: Configure, 4: Created ──
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // ─── Step 1: Upload State ──────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ─── Step 2: Validation Result State ───────────────────────────────
  const [uploadResult, setUploadResult] =
    useState<SubjectMockUploadResponse | null>(null);
  const [rowStatusFilter, setRowStatusFilter] = useState<
    'ALL' | 'VALID' | 'INVALID' | 'DUPLICATE'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // ─── Step 3: Mock Test Configuration State ─────────────────────────
  const [testTitle, setTestTitle] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [totalQuestions, setTotalQuestions] = useState<number>(50);
  const [defaultMarks, setDefaultMarks] = useState<number>(4);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState<number>(1);
  const [configError, setConfigError] = useState<string | null>(null);

  // ─── Step 4: Final Success Result ──────────────────────────────────
  const [generatedMockResult, setGeneratedMockResult] =
    useState<GeneratedSubjectMockResponse | null>(null);
  const [showTranslationsManager, setShowTranslationsManager] = useState(false);

  // ─── API Hooks ─────────────────────────────────────────────────────
  const { uploadAndValidateSubjectMockAPI, isLoading: isUploading } =
    useUploadAndValidateSubjectMockAPI();
  const { generateSubjectMockAPI, isLoading: isGenerating } =
    useGenerateSubjectMockAPI();

  // Initialize Suggested Test Name on mount / subject change
  useEffect(() => {
    const today = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    setTestTitle(`${config.title} Mock Test 01 - ${today}`);
  }, [subject, config.title]);

  // Set default question count when upload results arrive
  useEffect(() => {
    if (uploadResult && uploadResult.validRows > 0) {
      setTotalQuestions(Math.min(50, uploadResult.validRows));
    }
  }, [uploadResult]);

  // ─── Drag & Drop Handlers ──────────────────────────────────────────
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
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
      setUploadError('Invalid file format. Please upload a .csv, .xlsx, or .xls file.');
      setFile(null);
      return;
    }
    setUploadError(null);
    setFile(selectedFile);
  };

  // ─── Submit File for Validation ────────────────────────────────────
  const handleUploadAndValidate = async () => {
    if (!file) {
      setUploadError('Please select a CSV or Excel file to upload.');
      return;
    }

    setUploadError(null);
    const { data, error } = await uploadAndValidateSubjectMockAPI(file, subject);

    if (error) {
      const msg =
        typeof error === 'string'
          ? error
          : (error as any).message || 'Failed to parse and validate file';
      setUploadError(msg);
      toast.error(msg);
      return;
    }

    if (data) {
      setUploadResult(data);
      setCurrentStep(2);
      toast.success(
        `File validated: ${data.validRows} valid questions out of ${data.totalRows} rows.`,
      );
    }
  };

  // ─── Filter preview rows ───────────────────────────────────────────
  const filteredPreviewRows = (uploadResult?.previewRows || []).filter((row) => {
    if (rowStatusFilter !== 'ALL' && row.status !== rowStatusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inText = row.questionText?.toLowerCase().includes(q);
      const inChapter = row.chapter?.toLowerCase().includes(q);
      const inTopic = row.topic?.toLowerCase().includes(q);
      const inError = row.errors?.some((e) => e.toLowerCase().includes(q));
      return inText || inChapter || inTopic || inError;
    }
    return true;
  });

  // ─── Step 3 Submit -> Final Exam Generation ────────────────────────
  const handleGenerateExam = async () => {
    if (!uploadResult) return;
    if (!testTitle.trim()) {
      setConfigError('Please provide an Exam Title.');
      return;
    }
    if (totalQuestions <= 0) {
      setConfigError('Total questions must be greater than 0.');
      return;
    }
    if (totalQuestions > uploadResult.validRows) {
      setConfigError(
        `Requested ${totalQuestions} questions, but only ${uploadResult.validRows} valid questions are available in the uploaded file.`,
      );
      return;
    }

    setConfigError(null);
    const { data, error } = await generateSubjectMockAPI({
      importId: uploadResult.importId,
      subject,
      title: testTitle.trim(),
      description: `${config.title} Mock Test generated from file: ${uploadResult.fileName}`,
      durationMinutes,
      totalQuestions,
      defaultMarksPerQuestion: defaultMarks,
      defaultNegativeMarks,
      difficultyDistribution: {
        easyPercentage: 30,
        mediumPercentage: 50,
        hardPercentage: 20,
      },
      publishImmediately: false,
    });

    if (error) {
      const msg =
        typeof error === 'string'
          ? error
          : (error as any).message || 'Failed to generate subject mock exam';
      setConfigError(msg);
      toast.error(msg);
      return;
    }

    if (data) {
      setGeneratedMockResult(data);
      setCurrentStep(4);
      toast.success(`${config.title} Mock Test generated successfully!`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
            title="Back to Subject Selection"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.badgeColor}`}
              >
                <SubjectIcon className="h-3.5 w-3.5" />
                <span>{config.title} Mock Test Generator</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Generate {config.title} Mock Test
            </h1>
          </div>
        </div>

        {/* Multi-step progress indicator */}
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500">
          <span
            className={`px-3 py-1 rounded-lg transition ${
              currentStep === 1
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            1. Upload
          </span>
          <span>&rarr;</span>
          <span
            className={`px-3 py-1 rounded-lg transition ${
              currentStep === 2
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            2. Preview & Validation
          </span>
          <span>&rarr;</span>
          <span
            className={`px-3 py-1 rounded-lg transition ${
              currentStep === 3
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            3. Configure
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* STEP 1: FILE UPLOAD & TEMPLATE DOWNLOAD                         */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Action Hero Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="flex items-center space-x-3.5">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.iconBg} ${config.iconColor}`}
                >
                  <SubjectIcon className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Upload {config.title} Questions File
                  </h2>
                  <p className="text-xs text-slate-500">
                    Upload questions in CSV or Excel format. Every row must belong to{' '}
                    <strong>{config.title}</strong>.
                  </p>
                </div>
              </div>

              {/* Template Download Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSubjectTemplate(subject, 'xlsx')}
                  className="shadow-xs"
                >
                  <Download className="h-4 w-4 mr-1.5 text-slate-500" />
                  <span>Download Excel Template</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSubjectTemplate(subject, 'csv')}
                  className="shadow-xs"
                >
                  <Download className="h-4 w-4 mr-1.5 text-slate-500" />
                  <span>CSV</span>
                </Button>
              </div>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="flex items-start space-x-3 rounded-xl bg-red-50 p-4 border border-red-200 text-red-800 text-xs font-semibold animate-in fade-in">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">File Upload Error</p>
                  <p>{uploadError}</p>
                </div>
              </div>
            )}

            {/* Drag & Drop Box */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-4 ${
                dragActive
                  ? 'border-brand-500 bg-brand-50/50 scale-[1.01]'
                  : file
                    ? 'border-emerald-300 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-brand-400 bg-slate-50/50 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, .xlsx, .xls"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-100 text-brand-600">
                {file ? (
                  <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                ) : (
                  <UploadCloud className="h-8 w-8 text-brand-600" />
                )}
              </div>

              <div className="space-y-1">
                {file ? (
                  <div>
                    <p className="text-base font-bold text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB &bull; Click or drop another file to replace
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      Click to choose file or drag & drop here
                    </p>
                    <p className="text-xs text-slate-500">
                      Supports Excel (.xlsx, .xls) and Comma-Separated Values (.csv) up to 25MB
                    </p>
                  </div>
                )}
              </div>

              {file && (
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Check className="h-3.5 w-3.5" />
                  <span>Ready for Validation</span>
                </span>
              )}
            </div>

            {/* Template Requirements Checklist */}
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Sparkles className="h-4 w-4 text-brand-600" />
                <span>Validation Checklist & Instructions</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center space-x-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Subject column must strictly contain <strong>{config.title}</strong>
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Chapter & Topic names are matched against {config.title} syllabus</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Supported Question Types: SINGLE_CORRECT, MULTIPLE_CORRECT, NUMERICAL</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Difficulty: EASY, MEDIUM, HARD, VERY_HARD</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end space-x-3 pt-2">
              <Button type="button" variant="outline" size="md" onClick={onBack}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!file}
                isLoading={isUploading}
                onClick={handleUploadAndValidate}
                className="shadow-sm"
              >
                <span>Upload & Validate File</span>
                <ChevronRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* STEP 2: PREVIEW & VALIDATION BREAKDOWN                          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && uploadResult && (
        <div className="space-y-6 animate-in fade-in">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Rows
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono">
                {uploadResult.totalRows}
              </p>
              <p className="text-xs text-slate-500 truncate">{uploadResult.fileName}</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                Valid Questions
              </span>
              <p className="text-2xl font-black text-emerald-700 font-mono">
                {uploadResult.validRows}
              </p>
              <p className="text-xs text-emerald-600">Ready for mock test</p>
            </div>

            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-5 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-red-700 uppercase tracking-wider">
                Invalid Rows
              </span>
              <p className="text-2xl font-black text-red-700 font-mono">
                {uploadResult.invalidRows}
              </p>
              <p className="text-xs text-red-600">Failed validation</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                Duplicates
              </span>
              <p className="text-2xl font-black text-amber-800 font-mono">
                {uploadResult.duplicateRows}
              </p>
              <p className="text-xs text-amber-700">Repeated in file</p>
            </div>
          </div>

          {/* Difficulty Breakdown Pill */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="font-bold text-slate-700">Difficulty Distribution in Valid Pool:</span>
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
                Easy: {uploadResult.difficultyCounts?.EASY || 0}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
                Medium: {uploadResult.difficultyCounts?.MEDIUM || 0}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold">
                Hard: {uploadResult.difficultyCounts?.HARD || 0}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 font-bold">
                Very Hard: {uploadResult.difficultyCounts?.VERY_HARD || 0}
              </span>
            </div>
          </div>

          {/* Main Preview Table Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Question Validation Preview
                </h3>
                <p className="text-xs text-slate-500">
                  Review row-level validation results before generating the mock test
                </p>
              </div>

              {/* Status Filter Tabs & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search questions or errors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none"
                />

                <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setRowStatusFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      rowStatusFilter === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({uploadResult.totalRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRowStatusFilter('VALID')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      rowStatusFilter === 'VALID'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    Valid ({uploadResult.validRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRowStatusFilter('INVALID')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      rowStatusFilter === 'INVALID'
                        ? 'bg-white text-red-700 shadow-xs'
                        : 'text-slate-600 hover:text-red-700'
                    }`}
                  >
                    Errors ({uploadResult.invalidRows})
                  </button>
                  <button
                    type="button"
                    onClick={() => setRowStatusFilter('DUPLICATE')}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      rowStatusFilter === 'DUPLICATE'
                        ? 'bg-white text-amber-800 shadow-xs'
                        : 'text-slate-600 hover:text-amber-800'
                    }`}
                  >
                    Duplicates ({uploadResult.duplicateRows})
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-[450px]">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider sticky top-0 border-b border-slate-200 z-10">
                  <tr>
                    <th className="py-3 px-3.5">Row</th>
                    <th className="py-3 px-3.5">Status</th>
                    <th className="py-3 px-3.5 min-w-[220px]">Question Text</th>
                    <th className="py-3 px-3.5">Chapter / Topic</th>
                    <th className="py-3 px-3.5">Difficulty</th>
                    <th className="py-3 px-3.5">Answer</th>
                    <th className="py-3 px-3.5 min-w-[180px]">Validation Details / Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPreviewRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-semibold">
                        No rows matching the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredPreviewRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={`hover:bg-slate-50/80 transition ${
                          row.status === 'INVALID'
                            ? 'bg-red-50/20'
                            : row.status === 'DUPLICATE'
                              ? 'bg-amber-50/20'
                              : ''
                        }`}
                      >
                        <td className="py-3 px-3.5 font-bold font-mono text-slate-500">
                          #{row.rowNumber}
                        </td>
                        <td className="py-3 px-3.5">
                          {row.status === 'VALID' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <Check className="h-3 w-3" />
                              <span>Valid</span>
                            </span>
                          )}
                          {row.status === 'INVALID' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3" />
                              <span>Invalid</span>
                            </span>
                          )}
                          {row.status === 'DUPLICATE' && (
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <AlertTriangle className="h-3 w-3" />
                              <span>Duplicate</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3.5 font-medium text-slate-800 max-w-sm truncate">
                          {row.questionText}
                        </td>
                        <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                          <p className="font-semibold text-slate-800">{row.chapter || '—'}</p>
                          <p className="text-[10px] text-slate-400">{row.topic || ''}</p>
                        </td>
                        <td className="py-3 px-3.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.difficulty === 'EASY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : row.difficulty === 'HARD' || row.difficulty === 'VERY_HARD'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {row.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-3.5 font-mono font-bold text-slate-700">
                          {row.correctAnswer || '—'}
                        </td>
                        <td className="py-3 px-3.5">
                          {row.errors && row.errors.length > 0 ? (
                            <div className="space-y-0.5">
                              {row.errors.map((err, i) => (
                                <p key={i} className="text-[11px] font-semibold text-red-600">
                                  &bull; {err}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-semibold flex items-center">
                              <Check className="h-3 w-3 mr-1" />
                              All checks passed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span>Upload Different File</span>
              </Button>

              <div className="flex items-center space-x-3">
                {uploadResult.validRows === 0 ? (
                  <p className="text-xs text-red-600 font-bold">
                    No valid questions found to generate mock. Please fix errors and re-upload.
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={() => setCurrentStep(3)}
                    className="shadow-sm"
                  >
                    <span>Proceed to Test Configuration ({uploadResult.validRows} Questions)</span>
                    <ChevronRight className="h-4 w-4 ml-1.5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* STEP 3: MOCK TEST CONFIGURATION & FINAL GENERATION             */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && uploadResult && (
        <div className="space-y-6 animate-in fade-in">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.iconBg} ${config.iconColor}`}
              >
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Configure {config.title} Mock Test
                </h2>
                <p className="text-xs text-slate-500">
                  Set the duration, question count, marking rules, and difficulty distribution
                </p>
              </div>
            </div>

            {/* Config Error Message */}
            {configError && (
              <div className="flex items-start space-x-3 rounded-xl bg-red-50 p-4 border border-red-200 text-red-800 text-xs font-semibold animate-in fade-in">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <span>{configError}</span>
              </div>
            )}

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700">
                  Mock Test Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder={`e.g. ${config.title} Full Mock Test 01`}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>Total Questions to Include</span>
                  <span className="text-slate-400 font-normal">
                    Available in file: <strong>{uploadResult.validRows}</strong>
                  </span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={uploadResult.validRows}
                  value={totalQuestions}
                  onChange={(e) => setTotalQuestions(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Duration (in Minutes)
                </label>
                <input
                  type="number"
                  min={5}
                  max={360}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Marks per Question (+)
                </label>
                <input
                  type="number"
                  value={defaultMarks}
                  onChange={(e) => setDefaultMarks(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Negative Marks per Wrong Answer (-)
                </label>
                <input
                  type="number"
                  value={defaultNegativeMarks}
                  onChange={(e) => setDefaultNegativeMarks(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>
            </div>

            {/* Test Blueprint Summary Preview Box */}
            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs space-y-2">
              <p className="font-bold text-slate-800">Summary Snapshot Preview</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
                <div>
                  Subject:{' '}
                  <strong className="text-slate-900">{config.title}</strong>
                </div>
                <div>
                  Questions:{' '}
                  <strong className="text-slate-900">{totalQuestions}</strong>
                </div>
                <div>
                  Total Marks:{' '}
                  <strong className="text-slate-900">{totalQuestions * defaultMarks}</strong>
                </div>
                <div>
                  Duration:{' '}
                  <strong className="text-slate-900">{durationMinutes} min</strong>
                </div>
              </div>
            </div>

            {/* Bottom Step Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCurrentStep(2)}
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                <span>Back to Preview</span>
              </Button>

              <Button
                type="button"
                variant="primary"
                size="lg"
                isLoading={isGenerating}
                onClick={handleGenerateExam}
                className="shadow-md bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                <span>Generate {config.title} Mock Test</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* STEP 4: GENERATION SUCCESS SCREEN                               */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {currentStep === 4 && generatedMockResult && (
        <div className="rounded-2xl border border-emerald-200 bg-white p-8 sm:p-12 shadow-md text-center space-y-6 animate-in zoom-in-95 max-w-2xl mx-auto">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 shadow-sm mx-auto">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-widest">
              Mock Test Created & Snapshot Generated
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              {generatedMockResult.title}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Immutable ExamVersion snapshot generated and saved to database. The test is in{' '}
              <strong className="text-slate-800 uppercase font-mono">
                {generatedMockResult.status}
              </strong>{' '}
              status ready for approval & scheduling.
            </p>
          </div>

          {/* Key Specs Card */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600 font-medium">
            <div>
              Subject: <strong className="text-slate-900 block">{config.title}</strong>
            </div>
            <div>
              Questions: <strong className="text-slate-900 block">{generatedMockResult.totalQuestions}</strong>
            </div>
            <div>
              Total Marks: <strong className="text-slate-900 block">{generatedMockResult.totalMarks}</strong>
            </div>
            <div>
              Duration: <strong className="text-slate-900 block">{generatedMockResult.durationMinutes} min</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowTranslationsManager(true)}
              className="flex items-center gap-1.5 text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <Globe className="h-4 w-4" />
              <span>Manage Translations</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={onBack}
            >
              <span>Generate Another Mock</span>
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => navigate(`${routePrefix}/exams`)}
              className="shadow-sm"
            >
              <span>View in Exam Management</span>
              <ChevronRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Translations Management Subview */}
      {showTranslationsManager && generatedMockResult && (
        <div className="pt-4 border-t border-slate-200 animate-in fade-in">
          <ExamTranslationManager
            examId={generatedMockResult.examId}
            examTitle={generatedMockResult.title}
            onBack={() => setShowTranslationsManager(false)}
          />
        </div>
      )}
    </div>
  );
};

export default SubjectMockGenerator;
