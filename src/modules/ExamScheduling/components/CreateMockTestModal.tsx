import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Languages,
  Sparkles,
  LoaderCircle,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';
import { useUploadQuestionPaperAPI } from '@/modules/ExamManager/services/examManager.service';
import { downloadQuestionPaperTemplate } from '@/modules/ExamManager/services/examManager.service';

interface CreateMockTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (exam: any) => void;
  examTargets: any[];
  availableLanguages: any[];
}

export const CreateMockTestModal: React.FC<CreateMockTestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  examTargets,
  availableLanguages,
}) => {
  const [step, setStep] = useState<'FORM' | 'VALIDATING' | 'PREVIEW' | 'GENERATED'>('FORM');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [defaultMarks, setDefaultMarks] = useState<number>(4);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState<number>(1);

  // Files
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [translationFiles, setTranslationFiles] = useState<{ languageId: string; file: File }[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [generatedExam, setGeneratedExam] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadQuestionPaperAPI, isLoading: isUploading } = useUploadQuestionPaperAPI();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const f = e.target.files[0];
      const ext = f.name.substring(f.name.lastIndexOf('.')).toLowerCase();
      if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
        setErrorMessage('Only .csv, .xlsx, or .xls files are supported.');
        return;
      }
      setQuestionFile(f);
      setErrorMessage(null);
    }
  };

  const handleAddTranslationFile = (languageId: string, file: File) => {
    setTranslationFiles((prev) => [
      ...prev.filter((tf) => tf.languageId !== languageId),
      { languageId, file },
    ]);
  };

  const handleRemoveTranslationFile = (languageId: string) => {
    setTranslationFiles((prev) => prev.filter((tf) => tf.languageId !== languageId));
  };

  const handleValidateAndSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage('Please enter a mock test name.');
      return;
    }
    if (!selectedTargetId && examTargets.length > 0) {
      setSelectedTargetId(examTargets[0].id);
    }
    if (!questionFile) {
      setErrorMessage('Please upload a Question CSV/Excel file.');
      return;
    }

    setErrorMessage(null);
    setStep('VALIDATING');

    const { data, error } = await uploadQuestionPaperAPI(
      questionFile,
      selectedTargetId || (examTargets[0]?.id || ''),
    );

    if (error) {
      const err = typeof error === 'string' ? error : (error as any).message || 'Validation failed';
      setErrorMessage(err);
      toast.error(err);
      setStep('FORM');
      return;
    }

    const payload = (data as any)?.data || data;
    setUploadResult(payload);

    if (payload?.success || payload?.exam) {
      setGeneratedExam(payload?.exam || payload);
      setStep('GENERATED');
      toast.success('Mock test created successfully from question upload!');
    } else {
      setStep('PREVIEW');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 ring-1 ring-white/10">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Create Mock Test</h2>
              <p className="text-xs text-indigo-200">
                Upload Question CSV/Excel with optional regional translation files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 font-bold flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'FORM' && (
            <div className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-extrabold text-slate-700">
                    Mock Test Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. NEET Grand Mock Test 01"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700">Target Curriculum</label>
                  <select
                    value={selectedTargetId}
                    onChange={(e) => setSelectedTargetId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  >
                    <option value="">Select Target Curriculum...</option>
                    {(examTargets || [])
                      .filter((t) => ['JEE', 'NEET', 'CET'].includes(t.name?.toUpperCase().trim()))
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
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

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-extrabold text-slate-700">Description (Optional)</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide exam instructions or topics covered..."
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                </div>
              </div>

              {/* Question CSV / Excel Upload Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <FileSpreadsheet size={15} className="text-indigo-600" />
                    Question File (CSV / XLSX) <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => downloadQuestionPaperTemplate('xlsx')}
                    className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline inline-flex items-center gap-1 text-[11px]"
                  >
                    Download Template (.xlsx)
                  </button>
                </div>

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
                        Click to browse or drag & drop question paper file
                      </p>
                      <p className="text-[11px] text-slate-400">Supports .csv, .xlsx, .xls (Up to 25 MB)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Regional Translation Files */}
              <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Languages size={15} className="text-indigo-600" />
                    <span className="font-extrabold text-slate-900">
                      Optional Translation Files (Upload Now or Add Later)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">Optional</span>
                </div>

                <p className="text-[11px] text-slate-500">
                  You can upload language translations simultaneously during creation, or add/update them later from the Mock Test details page.
                </p>

                {availableLanguages
                  .filter((l) => (l.code || '').toUpperCase() !== 'EN')
                  .slice(0, 3)
                  .map((lang) => {
                    const existing = translationFiles.find((tf) => tf.languageId === lang.id);
                    return (
                      <div
                        key={lang.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 text-[10px]">
                            {lang.code || lang.name}
                          </span>
                          <span className="font-bold text-slate-800">{lang.name}</span>
                          {existing && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle2 size={11} /> {existing.file.name}
                            </span>
                          )}
                        </div>

                        <div>
                          {existing ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveTranslationFile(lang.id)}
                              className="text-rose-600 hover:text-rose-700 font-bold text-[11px] p-1"
                            >
                              Remove
                            </button>
                          ) : (
                            <label className="cursor-pointer px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition">
                              <span>+ Choose File</span>
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

          {step === 'VALIDATING' && (
            <div className="py-16 text-center space-y-3">
              <LoaderCircle size={36} className="animate-spin text-indigo-600 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-800">
                Parsing & Validating Question Paper...
              </h3>
              <p className="text-xs text-slate-500">
                Checking taxonomy hierarchy, questions, options, and answer keys.
              </p>
            </div>
          )}

          {step === 'GENERATED' && (
            <div className="py-8 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">Mock Test Created Successfully!</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  "{title}" has been created in <b>DRAFT</b> status and is ready for review.
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
                    {uploadResult?.totalQuestions || uploadResult?.exam?.totalQuestions || 50} Questions
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
          {step === 'GENERATED' ? (
            <>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onSuccess(generatedExam);
                  onClose();
                }}
              >
                Done
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleValidateAndSubmit}
                disabled={isUploading || !title.trim() || !questionFile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {isUploading ? 'Validating & Generating...' : 'Validate & Generate Mock Test'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateMockTestModal;
