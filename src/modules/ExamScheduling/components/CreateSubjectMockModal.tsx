import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Atom,
  FlaskConical,
  Binary,
  Dna,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Sparkles,
  Download,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';
import {
  useGetSubjectMockStatsAPI,
  downloadSubjectTemplate,
  useUploadAndValidateSubjectMockAPI,
  useGenerateSubjectMockAPI,
  type SubjectMockStatItem,
  type SubjectMockUploadResponse,
  type GeneratedSubjectMockResponse,
} from '@/modules/ExamGenerator/services/subjectMockGenerator.service';

interface CreateSubjectMockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (exam: any) => void;
  availableLanguages?: any[];
}

const SUBJECTS_METADATA = [
  {
    key: 'PHYSICS',
    name: 'Physics',
    icon: Atom,
    color: 'indigo',
    border: 'border-indigo-200',
    bg: 'bg-indigo-50/50 hover:bg-indigo-50',
    iconColor: 'text-indigo-600',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  {
    key: 'CHEMISTRY',
    name: 'Chemistry',
    icon: FlaskConical,
    color: 'emerald',
    border: 'border-emerald-200',
    bg: 'bg-emerald-50/50 hover:bg-emerald-50',
    iconColor: 'text-emerald-600',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  {
    key: 'MATHEMATICS',
    name: 'Mathematics',
    icon: Binary,
    color: 'amber',
    border: 'border-amber-200',
    bg: 'bg-amber-50/50 hover:bg-amber-50',
    iconColor: 'text-amber-600',
    badge: 'bg-amber-100 text-amber-800',
  },
  {
    key: 'BIOLOGY',
    name: 'Biology',
    icon: Dna,
    color: 'rose',
    border: 'border-rose-200',
    bg: 'bg-rose-50/50 hover:bg-rose-50',
    iconColor: 'text-rose-600',
    badge: 'bg-rose-100 text-rose-700',
  },
];

export const CreateSubjectMockModal: React.FC<CreateSubjectMockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [selectedSubject, setSelectedSubject] = useState<'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS' | 'BIOLOGY'>('PHYSICS');
  const [step, setStep] = useState<'SELECT_SUBJECT' | 'UPLOAD_CONFIG' | 'PREVIEW' | 'GENERATED'>('SELECT_SUBJECT');

  // Stats
  const [subjectStats, setSubjectStats] = useState<SubjectMockStatItem[]>([]);
  const { getSubjectMockStatsAPI } = useGetSubjectMockStatsAPI();

  // Config
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [totalQuestions, setTotalQuestions] = useState<number>(50);
  const [defaultMarks, setDefaultMarks] = useState<number>(4);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState<number>(1);

  // Files
  const [questionFile, setQuestionFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [validationResult, setValidationResult] = useState<SubjectMockUploadResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedExam, setGeneratedExam] = useState<GeneratedSubjectMockResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { uploadAndValidateSubjectMockAPI, isLoading: isValidating } =
    useUploadAndValidateSubjectMockAPI();
  const { generateSubjectMockAPI, isLoading: isGenerating } =
    useGenerateSubjectMockAPI();

  useEffect(() => {
    if (isOpen) {
      getSubjectMockStatsAPI().then(({ data }) => {
        if (data) setSubjectStats(data);
      });
    }
  }, [isOpen, getSubjectMockStatsAPI]);

  useEffect(() => {
    const subName = selectedSubject.charAt(0) + selectedSubject.slice(1).toLowerCase();
    setTitle(`${subName} Subject Mock Test 01`);
  }, [selectedSubject]);

  if (!isOpen) return null;

  const handleSubjectSelect = (sub: 'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS' | 'BIOLOGY') => {
    setSelectedSubject(sub);
    setStep('UPLOAD_CONFIG');
    setQuestionFile(null);
    setValidationResult(null);
    setErrorMessage(null);
  };

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

  const handleValidateFile = async () => {
    if (!questionFile) {
      setErrorMessage('Please select a question file to validate.');
      return;
    }

    setErrorMessage(null);
    const { data, error } = await uploadAndValidateSubjectMockAPI(
      questionFile,
      selectedSubject,
    );

    if (error) {
      const err = typeof error === 'string' ? error : (error as any).message || 'Validation failed';
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    if (data) {
      setValidationResult(data);
      setTotalQuestions(data.validRows || 50);
      setStep('PREVIEW');
      toast.success(`Validated ${data.validRows} ${selectedSubject.toLowerCase()} questions successfully.`);
    }
  };

  const handleGenerateExam = async () => {
    if (!validationResult) return;
    if (!title.trim()) {
      setErrorMessage('Please enter a mock test title.');
      return;
    }

    setErrorMessage(null);
    const { data, error } = await generateSubjectMockAPI({
      importId: validationResult.importId,
      subject: selectedSubject,
      title: title.trim(),
      description: description.trim() || undefined,
      durationMinutes,
      totalQuestions,
      defaultMarksPerQuestion: defaultMarks,
      defaultNegativeMarks,
      publishImmediately: false,
    });

    if (error) {
      const err = typeof error === 'string' ? error : (error as any).message || 'Generation failed';
      setErrorMessage(err);
      toast.error(err);
      return;
    }

    if (data) {
      setGeneratedExam(data);
      setStep('GENERATED');
      toast.success(`${selectedSubject} Mock Test created successfully!`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl rounded-3xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 ring-1 ring-white/10">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Create Subject-wise Mock Test</h2>
              <p className="text-xs text-indigo-200">
                Single-subject mock generation with strict taxonomy validation & optional translations
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

          {/* STEP 1: Select Subject */}
          {step === 'SELECT_SUBJECT' && (
            <div className="space-y-6">
              <div className="text-center space-y-1">
                <h3 className="text-base font-extrabold text-slate-900">
                  Select Subject for Targeted Mock Test
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Choose the subject curriculum. Uploaded questions will be verified against this subject's syllabus taxonomy.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SUBJECTS_METADATA.map((sub) => {
                  const stat = subjectStats.find((s) => s.normalizedName === sub.key);
                  const Icon = sub.icon;
                  return (
                    <div
                      key={sub.key}
                      onClick={() => handleSubjectSelect(sub.key as any)}
                      className={`rounded-3xl border ${sub.border} ${sub.bg} p-6 cursor-pointer transition-all hover:scale-[1.02] shadow-sm flex flex-col justify-between space-y-4`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs ${sub.iconColor}`}>
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-base font-black text-slate-900">{sub.name}</h4>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${sub.badge}`}>
                              {sub.key}
                            </span>
                          </div>
                        </div>
                        <ChevronRight size={18} className="text-slate-400" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-center">
                        <div className="bg-white/80 rounded-xl p-2">
                          <span className="text-[10px] font-bold text-slate-400 block">Chapters</span>
                          <span className="text-xs font-black text-slate-800">
                            {stat?.chapterCount || 0}
                          </span>
                        </div>
                        <div className="bg-white/80 rounded-xl p-2">
                          <span className="text-[10px] font-bold text-slate-400 block">Bank Questions</span>
                          <span className="text-xs font-black text-slate-800">
                            {stat?.questionCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Configure & Upload Question Paper */}
          {step === 'UPLOAD_CONFIG' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold border border-indigo-100 text-xs">
                    Subject: {selectedSubject}
                  </span>
                  <button
                    onClick={() => setStep('SELECT_SUBJECT')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold underline"
                  >
                    Change Subject
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => downloadSubjectTemplate(selectedSubject, 'xlsx')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                >
                  <Download size={13} />
                  Download {selectedSubject} Template (.xlsx)
                </button>
              </div>

              {/* Basic Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="font-extrabold text-slate-700">
                    Mock Test Title <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Physics Mechanics Chapter Mock 01"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700">Duration (Minutes)</label>
                  <input
                    type="number"
                    min={10}
                    max={240}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-semibold focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-extrabold text-slate-700">Positive Marks (+)</label>
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
                    placeholder="e.g. Kinematics, Laws of Motion & Work Energy"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-xs font-medium focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
                  />
                </div>
              </div>

              {/* Upload Box */}
              <div className="space-y-2">
                <label className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <FileSpreadsheet size={15} className="text-indigo-600" />
                  {selectedSubject} Question File (CSV / XLSX) <span className="text-rose-500">*</span>
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
                          {(questionFile.size / 1024).toFixed(1)} KB — Click to change
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <UploadCloud size={30} className="mx-auto text-slate-400" />
                      <p className="font-bold text-slate-700">
                        Click or drag & drop {selectedSubject} question paper
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Strict validation: Chemistry or Physics questions in wrong subject will be rejected.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Preview & Validation Table */}
          {step === 'PREVIEW' && validationResult && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Rows</span>
                  <span className="text-xl font-black text-slate-900">{validationResult.totalRows}</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase block">Valid Rows</span>
                  <span className="text-xl font-black text-emerald-700">{validationResult.validRows}</span>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-center">
                  <span className="text-[10px] font-bold text-rose-700 uppercase block">Invalid Rows</span>
                  <span className="text-xl font-black text-rose-700">{validationResult.invalidRows}</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase block">Duplicates</span>
                  <span className="text-xl font-black text-amber-700">{validationResult.duplicateRows}</span>
                </div>
              </div>

              {/* Difficulty breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Sliders size={14} className="text-indigo-600" /> Difficulty Pool:
                </span>
                <div className="flex gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Easy: {validationResult.difficultyCounts?.EASY || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                    Med: {validationResult.difficultyCounts?.MEDIUM || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                    Hard: {validationResult.difficultyCounts?.HARD || 0}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                    V.Hard: {validationResult.difficultyCounts?.VERY_HARD || 0}
                  </span>
                </div>
              </div>

              {/* Question Preview List */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800">Question Preview ({validationResult.previewRows?.length} sample questions):</h4>
                <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-2xl p-2 bg-slate-50/50">
                  {validationResult.previewRows?.map((row, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl bg-white border text-xs space-y-1 ${
                        row.status === 'VALID' ? 'border-slate-200' : 'border-rose-300 bg-rose-50/20'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">
                          #{row.rowNumber} [{row.chapter || 'Chapter'}]
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
                          Error: {row.errors.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Success Generated */}
          {step === 'GENERATED' && generatedExam && (
            <div className="py-8 text-center space-y-4">
              <div className="h-14 w-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  {selectedSubject} Mock Test Generated!
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  "{generatedExam.title}" has been created with immutable ExamVersion snapshot and is ready in <b>DRAFT</b> status.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left max-w-md mx-auto space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subject:</span>
                  <span className="font-bold text-indigo-600">{generatedExam.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Questions:</span>
                  <span className="font-bold text-slate-800">{generatedExam.totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Marks:</span>
                  <span className="font-bold text-slate-800">{generatedExam.totalMarks}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-bold text-slate-800">{generatedExam.durationMinutes}m</span>
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
          ) : step === 'PREVIEW' ? (
            <>
              <Button variant="outline" onClick={() => setStep('UPLOAD_CONFIG')} disabled={isGenerating}>
                &larr; Back to Upload
              </Button>
              <Button
                variant="primary"
                onClick={handleGenerateExam}
                disabled={isGenerating || (validationResult?.validRows || 0) === 0}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {isGenerating ? 'Generating Subject Mock...' : `Generate ${selectedSubject} Mock Test`}
              </Button>
            </>
          ) : step === 'UPLOAD_CONFIG' ? (
            <>
              <Button variant="outline" onClick={() => setStep('SELECT_SUBJECT')} disabled={isValidating}>
                &larr; Select Subject
              </Button>
              <Button
                variant="primary"
                onClick={handleValidateFile}
                disabled={isValidating || !questionFile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {isValidating ? 'Validating Questions...' : 'Validate & Preview Questions'}
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSubjectMockModal;
