import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Globe,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Search,
  FileDown,
  Loader2,
  Plus,
  MinusCircle,
  RotateCw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Loader from '@/components/feedback/Loader';
import { toast } from '@/utils/toast';
import {
  useGetExamTranslationCoverageAPI,
  downloadExamTranslationTemplate,
  exportExamTranslations,
  useImportExamTranslationsAPI,
  type ExamTranslationCoverageResponse,
  type ExamLanguageCoverageItem,
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
  const { importExamTranslationsAPI, isLoading: isImporting } =
    useImportExamTranslationsAPI();

  // ─── State ───────────────────────────────────────────────────────────
  const [coverageData, setCoverageData] =
    useState<ExamTranslationCoverageResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'COMPLETED' | 'PROCESSING' | 'NOT_ADDED' | 'FAILED'
  >('ALL');

  // Modal State for Upload
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] =
    useState<ExamLanguageCoverageItem | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [replaceMode, setReplaceMode] = useState(false);
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

  // ─── Dynamic Background Polling while any job is PROCESSING ─────────
  const hasProcessingJobs = coverageData?.languages?.some(
    (l) => l.status === 'PROCESSING',
  );

  useEffect(() => {
    if (!hasProcessingJobs) return;
    const interval = setInterval(() => {
      loadCoverage();
    }, 3000);
    return () => clearInterval(interval);
  }, [hasProcessingJobs, loadCoverage]);

  // ─── Handlers ────────────────────────────────────────────────────────
  const handleOpenUploadModal = (lang: ExamLanguageCoverageItem) => {
    if (lang.status === 'PROCESSING') {
      toast.info('Translation upload is already processing for this language.');
      return;
    }
    setSelectedLanguage(lang);
    setSelectedFile(null);
    setReplaceMode(false);
    setUploadError(null);
    setIsUploadModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setUploadError(null);
    }
  };

  const handleUploadTranslation = async () => {
    if (!examId || !selectedLanguage || !selectedFile) {
      setUploadError('Please select a CSV or Excel translation file.');
      return;
    }

    setUploadError(null);

    const { data, error } = await importExamTranslationsAPI(
      examId,
      selectedLanguage.languageId,
      selectedFile,
      replaceMode,
    );

    if (error || !data) {
      setUploadError(error || 'Failed to start translation upload.');
      return;
    }

    // Immediately show notification to user
    toast.success(
      data.message || 'Translation upload started. Processing in background...',
    );

    // Close modal immediately
    setIsUploadModalOpen(false);
    setSelectedFile(null);

    // Immediately mark row as PROCESSING in local state
    setCoverageData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        languages: prev.languages.map((l) =>
          l.languageId === selectedLanguage.languageId
            ? { ...l, status: 'PROCESSING' }
            : l,
        ),
      };
    });

    // Refresh data in background
    loadCoverage();
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

    const isComplete = l.status === 'COMPLETED' || l.status === 'COMPLETE';
    const isNotAdded = l.status === 'NOT_ADDED' || l.status === 'NOT_STARTED';

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'COMPLETED' && isComplete) ||
      (statusFilter === 'NOT_ADDED' && isNotAdded) ||
      l.status === statusFilter;

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
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-xs">
              <Globe className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-slate-900">
                  {examTitle || coverageData?.examTitle || 'Exam'} Translations
                </h2>
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  ID: {examId.slice(0, 8)}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400 mt-0.5">
                Manage supported languages, upload translations asynchronously, and monitor live status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadCoverage}
              disabled={isCoverageLoading}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isCoverageLoading ? 'animate-spin' : ''}`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Coverage Overview Metrics */}
        {coverageData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-5">
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Questions
              </span>
              <p className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                {coverageData.totalQuestions}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Total Options
              </span>
              <p className="text-xl font-black text-slate-900 mt-0.5 font-mono">
                {coverageData.totalOptions}
              </p>
            </div>
            <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Supported Languages
              </span>
              <p className="text-xl font-black text-slate-900 mt-0.5 font-mono">
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
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'PROCESSING', label: 'Processing' },
            { id: 'NOT_ADDED', label: 'Not Added' },
            { id: 'FAILED', label: 'Failed' },
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

      {/* ─── Language Coverage Table ──────────────────────────────────── */}
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
                  <th className="py-3.5 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLanguages.map((lang) => {
                  const isComplete =
                    lang.status === 'COMPLETED' || lang.status === 'COMPLETE';
                  const isProcessing = lang.status === 'PROCESSING';
                  const isFailed = lang.status === 'FAILED';

                  return (
                    <tr
                      key={lang.languageId}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
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
                              style={{
                                width: `${lang.questionCoveragePercentage}%`,
                              }}
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
                              style={{
                                width: `${lang.optionCoveragePercentage}%`,
                              }}
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

                      {/* Status Column */}
                      <td className="py-4 px-4">
                        {isProcessing ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200 animate-pulse">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            <span>Processing...</span>
                          </span>
                        ) : isComplete ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Completed</span>
                          </span>
                        ) : isFailed ? (
                          <span
                            title={lang.processingError || 'Import failed. Click Add Translation to retry.'}
                            className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-rose-50 text-rose-700 border-rose-200 cursor-help"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            <span>Failed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border bg-slate-100 text-slate-600 border-slate-200">
                            <MinusCircle className="h-3 w-3" />
                            <span>Not Added</span>
                          </span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pre-filled Template Download */}
                          <button
                            type="button"
                            onClick={() => handleDownloadTemplate(lang)}
                            title="Download Pre-filled Translation Template (.xlsx)"
                            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>

                          {/* Export if translations exist */}
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

                          {/* Primary Action Button */}
                          {lang.isDefault ? (
                            <span className="text-slate-400 font-bold px-4 py-1 text-sm select-none">
                              —
                            </span>
                          ) : isProcessing ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled
                              className="flex items-center gap-1.5 text-xs font-bold opacity-75 cursor-not-allowed"
                            >
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              <span>Processing...</span>
                            </Button>
                          ) : isComplete ? (
                            isTranslationImportEnabled && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleOpenUploadModal(lang)}
                                className="flex items-center gap-1.5 text-xs font-bold"
                              >
                                <Upload className="h-3.5 w-3.5" />
                                <span>Update</span>
                              </Button>
                            )
                          ) : isFailed ? (
                            isTranslationImportEnabled && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleOpenUploadModal(lang)}
                                className="flex items-center gap-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                              >
                                <RotateCw className="h-3.5 w-3.5" />
                                <span>Add Translation</span>
                              </Button>
                            )
                          ) : (
                            isTranslationImportEnabled && (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleOpenUploadModal(lang)}
                                className="flex items-center gap-1.5 text-xs font-bold"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                <span>Add Translation</span>
                              </Button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════ */}
      {/* POPUP / MODAL: ADD / UPDATE TRANSLATION FILE                     */}
      {/* ═════════════════════════════════════════════════════════════════ */}
      {selectedLanguage && (
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => {
            if (!isImporting) {
              setIsUploadModalOpen(false);
            }
          }}
          title={
            selectedLanguage.status === 'COMPLETED' ||
            selectedLanguage.status === 'COMPLETE'
              ? `Update ${selectedLanguage.languageName} Translation`
              : `Add ${selectedLanguage.languageName} Translation`
          }
        >
          <div className="space-y-6">
            {/* Language Details Banner */}
            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white font-black text-xs shadow-xs">
                  {selectedLanguage.languageCode.toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Language: {selectedLanguage.languageName}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {selectedLanguage.nativeName} ({selectedLanguage.languageCode})
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDownloadTemplate(selectedLanguage)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-indigo-200 hover:border-indigo-300 transition-colors shadow-xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Template</span>
              </button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* File Dropzone / Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Upload File:
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all space-y-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv, .xlsx, .xls"
                  className="hidden"
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 mx-auto">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    {selectedFile ? selectedFile.name : 'Choose CSV / Excel'}
                  </span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    {selectedFile
                      ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                      : 'Supported formats: .csv, .xlsx, .xls (Max 25MB)'}
                  </span>
                </div>
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
                  Replace Existing Translations
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Overwrites previously imported translations for this language on this exam.
                </span>
              </div>
            </label>

            {/* Modal Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
                disabled={!selectedFile || isImporting}
                isLoading={isImporting}
                onClick={handleUploadTranslation}
                className="flex items-center gap-1.5 font-bold"
              >
                <Upload className="h-4 w-4" />
                <span>Upload Translation</span>
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExamTranslationManager;
