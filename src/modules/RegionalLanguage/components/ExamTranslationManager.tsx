import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Check,
  XCircle,
  Clock,
  ChevronRight,
  ArrowLeft,
  Search,
  FileDown,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Loader from '@/components/feedback/Loader';
import { toast } from '@/utils/toast';
import {
  useGetExamTranslationCoverageAPI,
  downloadExamTranslationTemplate,
  exportExamTranslations,
  useValidateExamTranslationFileAPI,
  useImportExamTranslationsAPI,
  type ExamTranslationCoverageResponse,
  type ExamLanguageCoverageItem,
  type ExamTranslationValidationResponse,
} from '../services/examTranslation.service';
import { useFeature } from '@/modules/Auth/auth-access/useFeature';
import { FEATURES } from '@/constants/feature-flag.constant';

interface Props {
  examId: string;
  examTitle?: string;
  onBack?: () => void;
}

export const ExamTranslationManager: React.FC<Props> = ({
  examId,
  examTitle,
  onBack,
}) => {
  const isTranslationImportEnabled = useFeature(FEATURES.BULK_IMPORT_TRANSLATION);

  // ─── API Hooks ───────────────────────────────────────────────────────
  const { getExamTranslationCoverageAPI, isLoading: isCoverageLoading } =
    useGetExamTranslationCoverageAPI();
  const { validateExamTranslationFileAPI, isLoading: isValidating } =
    useValidateExamTranslationFileAPI();
  const { importExamTranslationsAPI, isLoading: isImporting } =
    useImportExamTranslationsAPI();

  // ─── State ───────────────────────────────────────────────────────────
  const [coverageData, setCoverageData] =
    useState<ExamTranslationCoverageResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLETE' | 'IN_PROGRESS' | 'NOT_STARTED'>('ALL');

  // Modal State for Upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<ExamLanguageCoverageItem | null>(null);
  const [uploadStep, setUploadStep] = useState<1 | 2>(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ExamTranslationValidationResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Load Coverage Data ──────────────────────────────────────────────
  const loadCoverage = useCallback(async () => {
    if (!examId) return;
    const res = await getExamTranslationCoverageAPI(examId);
    if (res.data) {
      setCoverageData(res.data);
    }
  }, [examId, getExamTranslationCoverageAPI]);

  useEffect(() => {
    loadCoverage();
  }, [loadCoverage]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleOpenUploadModal = (lang: ExamLanguageCoverageItem) => {
    setSelectedLanguage(lang);
    setSelectedFile(null);
    setReplaceMode(false);
    setValidationResult(null);
    setUploadError(null);
    setUploadStep(1);
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleValidateFile = async () => {
    if (!examId || !selectedLanguage || !selectedFile) {
      setUploadError('Please select a valid translation file.');
      return;
    }

    setUploadError(null);
    const { data, error } = await validateExamTranslationFileAPI(
      examId,
      selectedLanguage.languageId,
      selectedFile,
    );

    if (error || !data) {
      setUploadError(error || 'Validation failed. Please check your file.');
      return;
    }

    setValidationResult(data);
    setUploadStep(2);
  };

  const handleExecuteImport = async () => {
    if (!examId || !selectedLanguage || !selectedFile) return;

    const { data, error } = await importExamTranslationsAPI(
      examId,
      selectedLanguage.languageId,
      selectedFile,
      replaceMode,
    );

    if (error || !data) {
      toast.error(error || 'Failed to import translations.');
      return;
    }

    toast.success(data.message || 'Translations successfully imported!');
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    setValidationResult(null);
    if (data.coverage) {
      setCoverageData(data.coverage);
    } else {
      loadCoverage();
    }
  };

  const handleDownloadTemplate = async (lang: ExamLanguageCoverageItem) => {
    try {
      await downloadExamTranslationTemplate(examId, lang.languageId, 'xlsx');
      toast.success(`Downloaded template for ${lang.languageName}`);
    } catch (err: any) {
      toast.error('Failed to download translation template.');
    }
  };

  const handleExportTranslations = async (lang: ExamLanguageCoverageItem) => {
    try {
      await exportExamTranslations(examId, lang.languageId, 'xlsx');
      toast.success(`Exported ${lang.languageName} translations.`);
    } catch (err: any) {
      toast.error('Failed to export translations.');
    }
  };

  // ─── Filtered Languages ──────────────────────────────────────────────
  const languages = coverageData?.languages || [];
  const filteredLanguages = languages.filter((l) => {
    const matchesSearch =
      l.languageName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.languageCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.nativeName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || l.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* ─── Top Header Card ──────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3.5">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
                title="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  Question & Option Translations
                </h2>
                {coverageData && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      coverageData.isAllRequiredComplete
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {coverageData.isAllRequiredComplete
                      ? '✓ Fully Translated'
                      : `${coverageData.overallCompletenessPercentage}% Completed`}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {examTitle || coverageData?.examTitle || 'Exam Mock'} •{' '}
                {coverageData?.totalQuestions ?? '—'} Total Questions •{' '}
                {coverageData?.totalOptions ?? '—'} Total Options
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadCoverage}
              disabled={isCoverageLoading}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isCoverageLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Coverage</span>
            </Button>
          </div>
        </div>

        {/* Overall Completeness Bar */}
        {coverageData && (
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Questions
              </span>
              <p className="text-xl font-black text-slate-800 mt-0.5">
                {coverageData.totalQuestions}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Options
              </span>
              <p className="text-xl font-black text-slate-800 mt-0.5">
                {coverageData.totalOptions}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Supported Languages
              </span>
              <p className="text-xl font-black text-slate-800 mt-0.5">
                {coverageData.languages.length}
              </p>
            </div>
            <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-100">
              <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                Average Coverage
              </span>
              <div className="flex items-center justify-between mt-0.5">
                <span className="text-xl font-black text-indigo-900">
                  {coverageData.overallCompletenessPercentage}%
                </span>
                <div className="w-20 bg-indigo-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{
                      width: `${coverageData.overallCompletenessPercentage}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── Filter & Search Bar ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search language or code..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Languages' },
            { id: 'COMPLETE', label: 'Complete (100%)' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'NOT_STARTED', label: 'Not Started (0%)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Language Coverage Table / Cards ──────────────────────────── */}
      {isCoverageLoading && !coverageData ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2">
          <Loader label="Calculating translation coverage metrics..." />
        </div>
      ) : filteredLanguages.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <Globe className="h-10 w-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No languages found</h3>
          <p className="text-xs text-slate-500">
            No regional languages match your current search or status filter.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Language</th>
                  <th className="py-3.5 px-4">Question Coverage</th>
                  <th className="py-3.5 px-4">Option Coverage</th>
                  <th className="py-3.5 px-4">Overall %</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLanguages.map((lang) => (
                  <tr key={lang.languageId} className="hover:bg-slate-50/60 transition-colors">
                    {/* Language Name & Code */}
                    <td className="py-4 px-5">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-black text-xs">
                          {lang.languageCode.toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm">
                              {lang.languageName}
                            </span>
                            {lang.isDefault && (
                              <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Default
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-medium">
                            {lang.nativeName}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Question Coverage */}
                    <td className="py-4 px-4 font-medium">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            {lang.translatedQuestions} / {lang.totalQuestions}
                          </span>
                          <span className="text-slate-500 font-semibold">
                            {lang.questionCoveragePercentage}%
                          </span>
                        </div>
                        <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              lang.questionCoveragePercentage >= 100
                                ? 'bg-emerald-500'
                                : lang.questionCoveragePercentage > 0
                                  ? 'bg-amber-500'
                                  : 'bg-slate-300'
                            }`}
                            style={{ width: `${lang.questionCoveragePercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Option Coverage */}
                    <td className="py-4 px-4 font-medium">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            {lang.translatedOptions} / {lang.totalOptions}
                          </span>
                          <span className="text-slate-500 font-semibold">
                            {lang.optionCoveragePercentage}%
                          </span>
                        </div>
                        <div className="w-28 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              lang.optionCoveragePercentage >= 100
                                ? 'bg-emerald-500'
                                : lang.optionCoveragePercentage > 0
                                  ? 'bg-amber-500'
                                  : 'bg-slate-300'
                            }`}
                            style={{ width: `${lang.optionCoveragePercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Overall Percentage */}
                    <td className="py-4 px-4">
                      <span className="font-black text-slate-900 text-sm">
                        {lang.overallCoveragePercentage}%
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          lang.status === 'COMPLETE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : lang.status === 'IN_PROGRESS'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {lang.status === 'COMPLETE' && <CheckCircle2 className="h-3 w-3" />}
                        {lang.status === 'IN_PROGRESS' && <Clock className="h-3 w-3" />}
                        {lang.status === 'NOT_STARTED' && <XCircle className="h-3 w-3" />}
                        <span>
                          {lang.status === 'COMPLETE'
                            ? 'Complete'
                            : lang.status === 'IN_PROGRESS'
                              ? 'In Progress'
                              : 'Not Started'}
                        </span>
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDownloadTemplate(lang)}
                          title="Download Pre-filled Translation Template (.xlsx)"
                          className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </button>

                        {lang.translatedQuestions > 0 && (
                          <button
                            type="button"
                            onClick={() => handleExportTranslations(lang)}
                            title="Export Existing Translations (.xlsx)"
                            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                          >
                            <FileDown className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {isTranslationImportEnabled && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleOpenUploadModal(lang)}
                            className="flex items-center gap-1.5 text-xs font-bold"
                          >
                            <Upload className="h-3.5 w-3.5" />
                            <span>
                              {lang.status === 'COMPLETE' ? 'Update' : 'Upload'}
                            </span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* MODAL: UPLOAD & VALIDATE TRANSLATION FILE                        */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {selectedLanguage && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => {
            if (!isImporting && !isValidating) {
              setIsUploadModalOpen(false);
            }
          }}
          title={`Upload ${selectedLanguage.languageName} (${selectedLanguage.nativeName}) Translations`}
        >
          <div className="space-y-6">
            {/* ── Step 1: File Selection ──────────────────────────────── */}
            {uploadStep === 1 && (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-start space-x-3">
                  <Globe className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-indigo-900 leading-relaxed">
                    <strong>Target Language:</strong> {selectedLanguage.languageName} (<code>{selectedLanguage.languageCode}</code>).
                    The translation file should contain question translations matching the {coverageData?.totalQuestions ?? 0} questions belonging to this exam.
                  </div>
                </div>

                {uploadError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* File Dropzone Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-3xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all space-y-3"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".csv, .xlsx, .xls"
                    className="hidden"
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 mx-auto">
                    <FileSpreadsheet className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">
                      {selectedFile ? selectedFile.name : 'Click to select CSV or Excel translation file'}
                    </span>
                    <span className="text-xs text-slate-400 block mt-1">
                      {selectedFile
                        ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                        : 'Supported formats: .xlsx, .xls, .csv (Max 25MB)'}
                    </span>
                  </div>
                </div>

                {/* Replace Mode Toggle */}
                <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={replaceMode}
                    onChange={(e) => setReplaceMode(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Replace Existing Translations Mode
                    </span>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      When checked, all previous {selectedLanguage.languageName} translations on this exam will be replaced with rows from this file.
                    </span>
                  </div>
                </label>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDownloadTemplate(selectedLanguage)}
                    className="flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Template</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsUploadModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      disabled={!selectedFile}
                      isLoading={isValidating}
                      onClick={handleValidateFile}
                      className="flex items-center gap-1.5 font-bold"
                    >
                      <span>Validate File</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 2: Validation Preview & Confirmation ──────────── */}
            {uploadStep === 2 && validationResult && (
              <div className="space-y-5">
                {/* Diff Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Total Rows
                    </span>
                    <p className="text-lg font-black text-slate-900 mt-0.5 font-mono">
                      {validationResult.totalRows}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">
                      Valid Rows
                    </span>
                    <p className="text-lg font-black text-emerald-700 mt-0.5 font-mono">
                      {validationResult.validRows}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">
                      New / Updated
                    </span>
                    <p className="text-lg font-black text-blue-700 mt-0.5 font-mono">
                      +{validationResult.newTranslationsCount} / ↑{validationResult.updatedTranslationsCount}
                    </p>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase">
                      Post-Import Coverage
                    </span>
                    <p className="text-lg font-black text-indigo-700 mt-0.5 font-mono">
                      {validationResult.coverageAfterImportPercentage}%
                    </p>
                  </div>
                </div>

                {/* Validation Warnings / Errors */}
                {validationResult.invalidRows > 0 && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                      <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>
                        {validationResult.invalidRows} row(s) failed validation and will be skipped:
                      </span>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-amber-900 font-mono">
                      {validationResult.rowDetails
                        .filter((r) => r.errors.length > 0)
                        .slice(0, 10)
                        .map((r, i) => (
                          <p key={i}>
                            &bull; Row {r.rowNumber} (Q: {r.questionId || 'N/A'}): {r.errors.join(', ')}
                          </p>
                        ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setUploadStep(1)}
                    disabled={isImporting}
                    className="flex items-center gap-1.5"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Upload Different File</span>
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsUploadModalOpen(false)}
                      disabled={isImporting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      disabled={validationResult.validRows === 0}
                      isLoading={isImporting}
                      onClick={handleExecuteImport}
                      className="bg-emerald-600 hover:bg-emerald-700 font-bold flex items-center gap-1.5"
                    >
                      <Check className="h-4 w-4" />
                      <span>
                        Confirm & Import ({validationResult.validRows} Translations)
                      </span>
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExamTranslationManager;
