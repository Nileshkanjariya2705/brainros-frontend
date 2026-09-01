import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Languages,
  Plus,
  Trash2,
  Layers,
  LoaderCircle,
  Download,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';
import {
  useValidateExamUploadAPI,
  useCreateExamFromUploadAPI,
  downloadQuestionPaperTemplate,
} from '../services/examManager.service';
import type {
  BlueprintItem,
  ComprehensiveExamValidationResult,
} from '../types/examManager.types';

interface UploadQuestionPaperWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  blueprint: BlueprintItem | null;
  onSuccess: (exam: any) => void;
  availableLanguages: any[];
}

export const UploadQuestionPaperWizardModal: React.FC<UploadQuestionPaperWizardModalProps> = ({
  isOpen,
  onClose,
  blueprint,
  onSuccess,
  availableLanguages,
}) => {
  const [step, setStep] = useState<'FILES_CONFIG' | 'VALIDATING' | 'PREVIEW' | 'GENERATING' | 'SUCCESS'>('FILES_CONFIG');

  // Exam Configuration
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [defaultMarks, setDefaultMarks] = useState<number>(4);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState<number>(1);

  // Files
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [translationFiles, setTranslationFiles] = useState<Array<{ languageId: string; file: File }>>([]);
  const [dragActive, setDragActive] = useState(false);
  const [validationResult, setValidationResult] = useState<ComprehensiveExamValidationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdExamResult, setCreatedExamResult] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { validateExamUploadAPI, isLoading: isValidating } = useValidateExamUploadAPI();
  const { createExamFromUploadAPI, isLoading: isCreating } = useCreateExamFromUploadAPI();

  React.useEffect(() => {
    if (blueprint) {
      setTitle(`${blueprint.name} Full Mock Test 01`);
      setDurationMinutes(blueprint.durationMinutes || 180);
      setStep('FILES_CONFIG');
      setQuestionFile(null);
      setTranslationFiles([]);
      setValidationResult(null);
      setErrorMessage(null);
    }
  }, [blueprint]);

  if (!isOpen || !blueprint) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
        setErrorMessage('Only .csv, .xlsx, or .xls spreadsheets are supported.');
        return;
      }
      setQuestionFile(f);
      setErrorMessage(null);
    }
  };

  const handleAddTranslationFile = (languageId: string, file: File) => {
    const existing = translationFiles.find((tf) => tf.languageId === languageId);
    if (existing) {
      if (!window.confirm('A translation file for this language is already attached. Replace it?')) {
        return;
      }
    }
    setTranslationFiles((prev) => [
      ...prev.filter((tf) => tf.languageId !== languageId),
      { languageId, file },
    ]);
  };

  const handleRemoveTranslationFile = (languageId: string) => {
    setTranslationFiles((prev) => prev.filter((tf) => tf.languageId !== languageId));
  };

  const handleValidate = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter an exam title.');
      return;
    }
    if (!questionFile) {
      setErrorMessage('Please select a Question Paper spreadsheet to validate.');
      return;
    }

    setErrorMessage(null);
    setStep('VALIDATING');

    const { data, error } = await validateExamUploadAPI(
      questionFile,
      blueprint.id,
      translationFiles,
    );

    if (error) {
      const err = typeof error === 'string' ? error : (error as any).message || 'Validation failed';
      setErrorMessage(err);
      toast.error(err);
      setStep('FILES_CONFIG');
      return;
    }

    if (data) {
      setValidationResult(data);
      setStep('PREVIEW');
      if (data.isValid) {
        toast.success('Question paper and translations validated against blueprint rules!');
      } else {
        toast.error('Validation detected blueprint or data mismatches. Check errors below.');
      }
    }
  };

  const handleCreateExam = async () => {
    if (!questionFile || !validationResult) return;

    setStep('GENERATING');
    setErrorMessage(null);

    const { data, error } = await createExamFromUploadAPI(
      {
        title: title.trim(),
        blueprintId: blueprint.id,
        description: description.trim() || undefined,
        durationMinutes,
        defaultMarksPerQuestion: defaultMarks,
        defaultNegativeMarks,
      },
      questionFile,
      translationFiles,
    );

    if (error) {
      const err = typeof error === 'string' ? error : (error as any).message || 'Failed to create exam';
      setErrorMessage(err);
      toast.error(err);
      setStep('PREVIEW');
      return;
    }

    if (data) {
      setCreatedExamResult((data as any)?.data || data);
      setStep('SUCCESS');
      toast.success('Exam created successfully in DRAFT status!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden my-6 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 ring-1 ring-white/10">
              <UploadCloud size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 text-indigo-300 font-black text-[10px] uppercase">
                  Blueprint: {blueprint.name}
                </span>
                <span className="text-xs text-slate-400">
                  {blueprint.totalQuestions} Questions · {durationMinutes} mins
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight">Upload Question Paper & Translations</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Files & Configuration */}
          {step === 'FILES_CONFIG' && (
            <div className="space-y-6">
              {/* Blueprint Summary Banner */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="font-extrabold text-indigo-900 text-xs flex items-center gap-1.5">
                    <Layers size={14} className="text-indigo-600" />
                    Selected Blueprint: {blueprint.name} ({blueprint.totalQuestions} Questions)
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {blueprint.subjectDistribution?.map((rule, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-white text-indigo-800 font-bold border border-indigo-200 text-[10px]"
                      >
                        {rule.subject}: {rule.questionCount}Q
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => downloadQuestionPaperTemplate('xlsx')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-white px-3 py-1.5 rounded-xl border border-indigo-200 hover:bg-indigo-50 transition shadow-2xs shrink-0"
                >
                  <Download size={13} />
                  Download Blueprint Template (.xlsx)
                </button>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-extrabold text-slate-700">
                    Exam Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. NEET All-India Grand Mock Test 01"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={10}
                    max={360}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700">Marks per Question (+)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={defaultMarks}
                    onChange={(e) => setDefaultMarks(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700">Negative Marks (-)</label>
                  <input
                    type="number"
                    step="0.25"
                    value={defaultNegativeMarks}
                    onChange={(e) => setDefaultNegativeMarks(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700">Description (Optional)</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Instructions or topics covered..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                </div>
              </div>

              {/* Primary Question File Upload Dropzone */}
              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileSpreadsheet size={15} className="text-indigo-600" />
                  Primary Question Paper (CSV / XLSX) <span className="text-rose-500">*</span>
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    if (e.dataTransfer.files?.[0]) {
                      setQuestionFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`rounded-3xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50/50'
                      : questionFile
                        ? 'border-emerald-300 bg-emerald-50/20'
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {questionFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                        <FileCheck size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-slate-900">{questionFile.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {(questionFile.size / 1024).toFixed(1)} KB — Click to change file
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <UploadCloud size={30} className="mx-auto text-slate-400" />
                      <p className="font-bold text-slate-700">
                        Click to browse or drag & drop question paper spreadsheet
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Supports .xlsx, .xls, .csv (Strict subject count & blueprint validation)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Multiple Regional Translation Files Upload */}
              <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/40 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Languages size={15} className="text-indigo-600" />
                    <span className="font-extrabold text-slate-900">
                      Simultaneous Regional Translation Files
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">Optional</span>
                </div>

                <p className="text-[11px] text-slate-500">
                  Upload multiple regional language translations (Hindi, Gujarati, Tamil, etc.) simultaneously during creation, or add/update them later from the Exam details page.
                </p>

                {availableLanguages
                  .filter((l) => (l.code || '').toUpperCase() !== 'EN')
                  .slice(0, 4)
                  .map((lang) => {
                    const existing = translationFiles.find((tf) => tf.languageId === lang.id);
                    return (
                      <div
                        key={lang.id}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-black border border-indigo-100 text-[10px]">
                            {lang.code || lang.name}
                          </span>
                          <div>
                            <span className="font-bold text-slate-800 block">{lang.name}</span>
                            {existing && (
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 size={11} /> {existing.file.name} ({(existing.file.size / 1024).toFixed(1)} KB)
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          {existing ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveTranslationFile(lang.id)}
                              className="text-rose-600 hover:text-rose-700 font-bold text-xs p-1 flex items-center gap-1"
                            >
                              <Trash2 size={13} />
                              <span>Remove</span>
                            </button>
                          ) : (
                            <label className="cursor-pointer px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-bold text-xs transition border border-slate-200 flex items-center gap-1">
                              <Plus size={13} />
                              <span>Choose {lang.name} File</span>
                              <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files?.[0]) {
                                    handleAddTranslationFile(lang.id, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* STEP 2: VALIDATING SPINNER */}
          {step === 'VALIDATING' && (
            <div className="py-20 text-center space-y-3">
              <LoaderCircle size={40} className="animate-spin text-indigo-600 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">
                Validating Question Paper & Translations...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Enforcing blueprint subject distribution, question count, taxonomy hierarchy, and regional translation coverage.
              </p>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION SUMMARY */}
          {step === 'PREVIEW' && validationResult && (
            <div className="space-y-6">
              {/* Blueprint Check Summary */}
              <div
                className={`p-4 rounded-2xl border ${
                  validationResult.blueprint.isMatched
                    ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                    : 'border-rose-200 bg-rose-50/40 text-rose-900'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm">
                  {validationResult.blueprint.isMatched ? (
                    <CheckCircle2 size={18} className="text-emerald-600" />
                  ) : (
                    <AlertTriangle size={18} className="text-rose-600" />
                  )}
                  <span>
                    Blueprint Structure Validation: {validationResult.blueprint.isMatched ? 'PASSED' : 'MISMATCH'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3">
                  {validationResult.blueprint.subjectChecks?.map((sc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-center space-y-0.5"
                    >
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        {sc.subject}
                      </span>
                      <span
                        className={`text-xs font-black ${
                          sc.isMatched ? 'text-slate-800' : 'text-rose-600'
                        }`}
                      >
                        {sc.actualCount} / {sc.expectedCount} Qs
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Translation Coverage Badges */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                  <Languages size={14} className="text-indigo-600" /> Regional Translation Coverage:
                </span>

                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs border border-emerald-200">
                    English: 100% (Primary)
                  </span>

                  {validationResult.translationsSummary?.map((ts, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-xl font-black text-xs border ${
                        ts.coveragePercentage >= 90
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : ts.coveragePercentage > 0
                            ? 'bg-amber-100 text-amber-800 border-amber-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                      }`}
                    >
                      {ts.languageName}: {ts.coveragePercentage}% ({ts.translatedQuestions} Qs)
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample Question Preview Table */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 text-xs">
                  Question Preview ({validationResult.previewRows?.length} sample questions):
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2.5 bg-slate-50/50">
                  {validationResult.previewRows?.map((row, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl bg-white border text-xs space-y-1.5 ${
                        row.status === 'VALID' ? 'border-slate-200' : 'border-rose-300 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">
                          #{row.rowNumber} [{row.subject || 'Subject'}] {row.chapter ? `— ${row.chapter}` : ''}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'VALID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </div>
                      <p className="text-slate-700 line-clamp-1">{row.questionText}</p>
                      {row.errors && row.errors.length > 0 && (
                        <p className="text-[11px] text-rose-600 font-bold">
                          Errors: {row.errors.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: GENERATING SPINNER */}
          {step === 'GENERATING' && (
            <div className="py-20 text-center space-y-3">
              <LoaderCircle size={40} className="animate-spin text-indigo-600 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">
                Transactionally Creating Exam & Immutable Snapshots...
              </h3>
              <p className="text-xs text-slate-500">
                Writing Exam, Sections, Questions, Options, ExamVersion, and Regional Translations.
              </p>
            </div>
          )}

          {/* STEP 5: SUCCESS */}
          {step === 'SUCCESS' && (
            <div className="py-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 size={36} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">Exam Created Successfully!</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  "{title}" has been created based on <b>{blueprint.name}</b> in <b>DRAFT</b> status and is ready for review.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-indigo-600">DRAFT (Pending Submit)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Questions:</span>
                  <span className="font-bold text-slate-800">
                    {validationResult?.questionsSummary?.totalQuestions || blueprint.totalQuestions} Questions
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Languages:</span>
                  <span className="font-bold text-slate-800">
                    English + {translationFiles.length} Regional
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-800">{durationMinutes} Minutes</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50 shrink-0">
          {step === 'SUCCESS' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onSuccess(createdExamResult);
                  onClose();
                }}
              >
                Done
              </Button>
            </>
          ) : step === 'PREVIEW' ? (
            <>
              <Button variant="outline" onClick={() => setStep('FILES_CONFIG')} disabled={isCreating}>
                <ArrowLeft size={14} className="mr-1" />
                Back to Upload
              </Button>
              <Button
                variant="primary"
                onClick={handleCreateExam}
                disabled={isCreating || !validationResult?.isValid}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {isCreating ? 'Creating Exam...' : 'Confirm & Create Exam'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isValidating}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleValidate}
                disabled={isValidating || !title.trim() || !questionFile}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                <span>{isValidating ? 'Validating...' : 'Validate Files'}</span>
                <ArrowRight size={14} />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadQuestionPaperWizardModal;
