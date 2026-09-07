import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  X,
  RefreshCw,
  HelpCircle,
  Layers,
  Sparkles,
  Save,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';
import {
  useAnswerKeyAPI,
  type AnswerKeyStatus,
  type AnswerKeyQuestionItem,
} from '../services/answerKey.service';

interface AnswerKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: string;
  examTitle: string;
  onSuccess?: () => void;
}

export const AnswerKeyModal: React.FC<AnswerKeyModalProps> = ({
  isOpen,
  onClose,
  scheduleId,
  examTitle,
  onSuccess,
}) => {
  const {
    getStatus,
    getQuestions,
    downloadTemplate,
    uploadAnswerKey,
    isLoading,
  } = useAnswerKeyAPI();

  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'GRID'>('UPLOAD');
  const [statusData, setStatusData] = useState<AnswerKeyStatus | null>(null);
  const [questions, setQuestions] = useState<AnswerKeyQuestionItem[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedAnswers, setEditedAnswers] = useState<Record<number, string>>({});

  // Load Status & Questions
  const loadData = useCallback(async () => {
    if (!scheduleId) return;

    const [statusRes, questionsRes] = await Promise.all([
      getStatus(scheduleId),
      getQuestions(scheduleId),
    ]);

    if (statusRes.data) {
      setStatusData(statusRes.data);
    }
    if (questionsRes.data && questionsRes.data.questions) {
      setQuestions(questionsRes.data.questions);
      // Pre-fill edited answers
      const initial: Record<number, string> = {};
      questionsRes.data.questions.forEach((q) => {
        if (q.correctOption) initial[q.questionNumber] = q.correctOption;
      });
      setEditedAnswers(initial);
    }
  }, [scheduleId, getStatus, getQuestions]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSelectedFile(null);
    }
  }, [isOpen, loadData]);

  // Handle Download Template
  const handleDownload = async () => {
    const res = await downloadTemplate(scheduleId, examTitle);
    if (res.success) {
      toast.success('Pre-filled Answer Key CSV template downloaded!');
    } else {
      toast.error(res.error || 'Failed to download template');
    }
  };

  // Handle File Upload
  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file to upload.');
      return;
    }

    setIsSubmitting(true);
    const res = await uploadAnswerKey(scheduleId, { file: selectedFile });
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(
      res.data?.message || 'Answer Key uploaded and verified successfully!',
    );
    setSelectedFile(null);
    await loadData();
    if (onSuccess) onSuccess();
  };

  // Handle Grid Save
  const handleSaveGrid = async () => {
    const rows = questions.map((q) => ({
      questionNumber: q.questionNumber,
      correctOption: editedAnswers[q.questionNumber] || '',
      explanation: q.explanation || '',
    }));

    const missing = rows.filter((r) => !r.correctOption);
    if (missing.length > 0) {
      if (
        !window.confirm(
          `${missing.length} questions do not have an answer selected. Save anyway?`,
        )
      ) {
        return;
      }
    }

    setIsSubmitting(true);
    const res = await uploadAnswerKey(scheduleId, { rows });
    setIsSubmitting(false);

    if (res.error) {
      toast.error(res.error);
      return;
    }

    toast.success(
      res.data?.message || 'Answer Key saved successfully!',
    );
    await loadData();
    if (onSuccess) onSuccess();
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="4xl"
      showCloseButton={false}
    >
      {/* ── Modal Header ── */}
      <div className="relative border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/40 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400">
              <Key size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Answer Key Management
                </h2>
                {statusData?.hasAnswerKey ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 size={12} /> Configured
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                    <Clock size={12} /> Pending Upload
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-400 mt-1">
                Exam: <span className="text-slate-200 font-bold">{examTitle}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Metric Snapshot Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Total Questions
            </span>
            <div className="text-lg font-black text-white mt-0.5">
              {statusData?.totalQuestions || questions.length || 0}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Configured Keys
            </span>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {statusData?.configuredKeysCount || Object.keys(editedAnswers).length}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Schedule Status
            </span>
            <div className="text-sm font-bold text-indigo-300 mt-1 uppercase">
              {statusData?.scheduleStatus || 'SCHEDULED'}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Last Updated By
            </span>
            <div className="text-xs font-semibold text-slate-300 mt-1 truncate">
              {statusData?.answerKeyUploadedBy?.name || 'Not yet uploaded'}
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 px-3.5 py-2.5 text-xs text-indigo-300">
          <Sparkles size={16} className="shrink-0 text-indigo-400" />
          <span>
            <b>Evaluation Notice:</b> Answers configured here serve as the ground truth. If the exam window has ended, saving the answer key immediately initiates automated scoring for all submitted student attempts.
          </span>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 border-b border-slate-800 -mb-6 pb-2">
          <button
            onClick={() => setActiveTab('UPLOAD')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'UPLOAD'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Upload size={14} /> Spreadsheet Upload (CSV)
          </button>
          <button
            onClick={() => setActiveTab('GRID')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'GRID'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers size={14} /> Interactive Answer Grid ({questions.length})
          </button>
        </div>
      </div>

      {/* ── Modal Body ── */}
      <div className="p-6 pt-8 max-h-[58vh] overflow-y-auto custom-scrollbar">
        {isLoading && !statusData ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <RefreshCw size={24} className="animate-spin text-indigo-500 mb-2" />
            <span className="text-xs font-bold">Loading exam structure & answer keys...</span>
          </div>
        ) : activeTab === 'UPLOAD' ? (
          /* ── TAB 1: SPREADSHEET UPLOAD ── */
          <div className="space-y-6">
            {/* Download Template Step */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet size={16} className="text-emerald-400" />
                    Step 1: Download Pre-filled Template
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-lg">
                    Generates a customized CSV pre-populated with all {questions.length} questions, subjects, sections, and available option keys.
                  </p>
                </div>
                <Button
                  onClick={handleDownload}
                  disabled={isLoading}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shrink-0 shadow-lg shadow-emerald-600/20"
                >
                  <Download size={14} />
                  Download CSV Template
                </Button>
              </div>
            </div>

            {/* Upload Step */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5">
              <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Upload size={16} className="text-indigo-400" />
                Step 2: Upload Completed Answer Key
              </h4>

              <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 text-center transition bg-slate-900/30">
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="flex flex-col items-center justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3">
                    <Upload size={22} />
                  </div>
                  {selectedFile ? (
                    <div>
                      <p className="text-sm font-black text-emerald-400">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {(selectedFile.size / 1024).toFixed(1)} KB — Click or drag to change file
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-slate-200">
                        Drop your filled Answer Key CSV here, or <span className="text-indigo-400 underline">browse</span>
                      </p>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Requires "Question Number" and "Correct Option" columns
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {selectedFile && (
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={handleFileUpload}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Verifying & Saving...
                      </>
                    ) : (
                      <>
                        <Save size={14} /> Upload & Verify Answer Key
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── TAB 2: INTERACTIVE GRID ── */
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Directly select or update the correct option for each question:
              </span>
              <Button
                onClick={handleSaveGrid}
                disabled={isSubmitting}
                size="sm"
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/30"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={13} /> Save Answers ({Object.keys(editedAnswers).length}/{questions.length})
                  </>
                )}
              </Button>
            </div>

            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider font-bold text-slate-400">
                    <th className="p-3 pl-4">Q#</th>
                    <th className="p-3">Subject / Section</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Options</th>
                    <th className="p-3 pr-4">Correct Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium text-slate-300">
                  {questions.map((q) => {
                    const currentVal = editedAnswers[q.questionNumber] || '';
                    const availableOpts = q.availableOptions
                      ? q.availableOptions.split('/')
                      : ['A', 'B', 'C', 'D'];

                    return (
                      <tr key={q.questionNumber} className="hover:bg-slate-900/40 transition">
                        <td className="p-3 pl-4 font-black text-white">
                          #{q.questionNumber}
                        </td>
                        <td className="p-3">
                          <span className="text-indigo-300 font-semibold">{q.subject}</span>
                          <span className="text-slate-500 ml-1.5">({q.section})</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
                            {q.questionType}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono">
                          {q.availableOptions || 'A/B/C/D'}
                        </td>
                        <td className="p-3 pr-4">
                          {q.questionType === 'NUMERICAL' ? (
                            <input
                              type="text"
                              value={currentVal}
                              onChange={(e) =>
                                setEditedAnswers((prev) => ({
                                  ...prev,
                                  [q.questionNumber]: e.target.value,
                                }))
                              }
                              placeholder="Enter value"
                              className="w-28 rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
                            />
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {availableOpts.map((opt) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    setEditedAnswers((prev) => ({
                                      ...prev,
                                      [q.questionNumber]: opt,
                                    }))
                                  }
                                  className={`h-7 w-7 rounded-lg text-xs font-black transition flex items-center justify-center ${
                                    currentVal.toUpperCase() === opt.toUpperCase()
                                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400/50'
                                      : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950 p-4 px-6">
        <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
          <HelpCircle size={13} />
          Questions with verified keys: <b>{Object.keys(editedAnswers).length} of {questions.length}</b>
        </span>

        <Button
          variant="outline"
          onClick={onClose}
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white text-xs font-bold px-4 py-2 rounded-xl"
        >
          Close
        </Button>
      </div>
    </Modal>
  );
};
