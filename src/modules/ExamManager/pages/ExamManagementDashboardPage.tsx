import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileSpreadsheet,
  Upload,
  Globe,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Activity,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { JobProgressBar } from '@/components/common/JobProgressBar';
import { useJobProgress } from '@/hooks/useJobProgress';
import { useAxiosGet, useAxiosPost } from '@/hooks/useAxios';
import { toast } from '@/utils/toast';

export const ExamManagementDashboardPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const [getReq] = useAxiosGet();
  const [postReq, { isLoading: isUploadingPaper }] = useAxiosPost();

  // Data states
  const [exam, setExam] = useState<any | null>(null);
  const [schedule, setSchedule] = useState<any | null>(null);
  const [translationCoverage, setTranslationCoverage] = useState<any | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Question paper upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load Exam Details
  const loadExamDetails = useCallback(async () => {
    if (!examId) return;

    // Fetch Exam
    const { data: examData } = await getReq<any>(`/exams/${examId}`);
    if (examData) {
      setExam(examData);
      if (examData.schedules && examData.schedules.length > 0) {
        setSchedule(examData.schedules[0]);
      }
    }

    // Fetch Translation Coverage
    const { data: coverageData } = await getReq<any>(`/exams/${examId}/translations/coverage`);
    if (coverageData) {
      setTranslationCoverage(coverageData);
    }
  }, [examId, getReq]);

  useEffect(() => {
    loadExamDetails();
  }, [loadExamDetails]);

  // WebSocket job progress for active Question Paper / Translation jobs
  const jobProgress = useJobProgress({
    queue: 'exam-import-queue',
    jobId: activeJobId,
    enabled: Boolean(activeJobId),
    onComplete: () => {
      toast.success('Background processing completed successfully!');
      loadExamDetails();
    },
    onFailed: (event) => {
      toast.error(event.message || 'Background processing failed.');
    },
  });

  // Handle Question Paper File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(ext || '')) {
        setErrorMsg('Please select a valid CSV (.csv) or Excel (.xlsx/.xls) file.');
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
    }
  };

  // Submit Question Paper Upload (BullMQ background job)
  const handleUploadQuestionPaper = async () => {
    if (!selectedFile || !examId) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('examId', examId);

    const { data, error } = await postReq<any>(`/admin/exam-manager/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    if (error || !data) {
      const msg = typeof error === 'string' ? error : 'Failed to queue question paper upload.';
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }

    const queuedJobId = data.jobId || data.importId || data.id;
    if (queuedJobId) {
      setActiveJobId(queuedJobId);
    }

    toast.success('Question paper queued for processing in background!');
    setIsUploadModalOpen(false);
    setSelectedFile(null);
    loadExamDetails();
  };

  if (!examId) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <p className="text-slate-500">No examination selected.</p>
        <Button onClick={() => navigate('/admin/exam-scheduling')} className="mt-4">
          Back to Scheduling Management
        </Button>
      </div>
    );
  }

  const statusName = exam?.status?.name || 'SCHEDULED';
  const paperStatus = activeJobId
    ? jobProgress.status === 'COMPLETED'
      ? 'Question Paper Ready'
      : jobProgress.status === 'FAILED'
        ? 'Processing Failed'
        : 'Processing'
    : exam?.totalQuestions > 0
      ? 'Question Paper Ready'
      : 'Waiting for Question Paper';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 bg-white p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/exam-scheduling')}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
            title="Back to Scheduling"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {exam?.title || `Exam Management Dashboard`}
              </h1>
              <span className="rounded-lg px-2.5 py-0.5 text-xs font-black bg-indigo-100 text-indigo-800 border border-indigo-200">
                {statusName}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Exam ID: {examId} • Full Lifecycle & Background Worker Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadExamDetails}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw size={13} />
            <span>Refresh Status</span>
          </Button>

          <Button
            size="sm"
            onClick={() => navigate(`/translation-manager/${examId}`)}
            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
          >
            <Globe size={14} />
            <span>Translation Management</span>
          </Button>
        </div>
      </div>

      {/* Main Grid: Overview + Question Paper + Translations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Exam Overview Card */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-600" />
              Exam Overview
            </h2>
            <span className="text-xs font-bold text-slate-500 font-mono">
              Target: {exam?.examTarget?.name || 'General'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block text-[11px]">Exam Name</span>
              <span className="font-extrabold text-slate-900 mt-0.5 block truncate">
                {exam?.title || 'Loading...'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block text-[11px]">Exam Type</span>
              <span className="font-extrabold text-slate-900 mt-0.5 block">
                {exam?.examType || exam?.type || 'Standard'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block text-[11px]">Subject</span>
              <span className="font-extrabold text-slate-900 mt-0.5 block">
                {exam?.subject?.name || exam?.subjectName || 'All Subjects'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block text-[11px]">Chapter</span>
              <span className="font-extrabold text-slate-900 mt-0.5 block">
                {exam?.chapter?.name || '-'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block text-[11px]">Question Count</span>
              <span className="font-extrabold text-slate-900 mt-0.5 block">
                {exam?.totalQuestions || 0} Questions
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block text-[11px]">Duration</span>
              <span className="font-extrabold text-slate-900 mt-0.5 block">
                {exam?.durationMinutes || 180} mins
              </span>
            </div>

            <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 col-span-2">
              <span className="text-indigo-800 font-bold block text-[11px] flex items-center gap-1">
                <Clock size={12} /> Live Window
              </span>
              <span className="font-extrabold text-slate-900 mt-0.5 block font-mono">
                {schedule?.startTime ? new Date(schedule.startTime).toLocaleString() : 'Not set'}{' '}
                — {schedule?.endTime ? new Date(schedule.endTime).toLocaleString() : 'Not set'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Quick Status Cards */}
        <div className="space-y-4">
          {/* Question Paper Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet size={15} className="text-indigo-600" />
                Question Paper
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                  paperStatus === 'Question Paper Ready'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : paperStatus === 'Processing'
                      ? 'bg-indigo-100 text-indigo-800 border-indigo-300 animate-pulse'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {paperStatus}
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Upload CSV/Excel question paper files processed asynchronously by BullMQ workers.
            </p>

            <Button
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              <Upload size={14} />
              <span>Upload Question Paper</span>
            </Button>
          </div>

          {/* Translation Card */}
          <div className="rounded-3xl border border-purple-200 bg-purple-50/40 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                <Globe size={15} className="text-purple-600" />
                Translations
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                {translationCoverage?.languages?.filter(
                  (l: any) => l.status === 'COMPLETED' || l.status === 'COMPLETE',
                )?.length || 0}{' '}
                Languages Active
              </span>
            </div>

            <p className="text-xs text-purple-700">
              Manage multi-language translation files for English, Hindi, Gujarati, Tamil, etc.
            </p>

            <Button
              size="sm"
              onClick={() => navigate(`/translation-manager/${examId}`)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-sm"
            >
              <Globe size={14} />
              <span>Open Translation Management</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Processing / Activity Section (BullMQ Worker WebSocket Progress) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} className="text-indigo-600" />
            Processing & Background Activity
          </h2>
          <span className="text-xs text-slate-500 font-mono">Real-time WebSocket Monitor</span>
        </div>

        {activeJobId ? (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Question Paper Import Worker</span>
              <span className="font-mono text-indigo-600">{jobProgress.percentage}%</span>
            </div>

            <JobProgressBar
              status={jobProgress.status}
              current={jobProgress.current}
              total={jobProgress.total}
              percentage={jobProgress.percentage}
              stage={jobProgress.stage}
              message={jobProgress.message}
              errorCode={jobProgress.errorCode}
              onRetry={loadExamDetails}
            />

            {jobProgress.isFailed && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
                <span>Processing Failed</span>
                <Button size="sm" variant="outline" onClick={loadExamDetails}>
                  Retry Job
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 bg-slate-50/70 rounded-2xl border border-slate-200 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>No active background processing jobs running for this exam.</span>
            </div>
            <span className="text-[11px] font-bold text-slate-400 font-mono">
              Status: Idle / Ready
            </span>
          </div>
        )}
      </div>

      {/* Question Paper Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Question Paper (CSV / Excel)"
      >
        <div className="space-y-4 p-4">
          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-2 hover:border-indigo-400 transition-colors bg-slate-50/50">
            <Upload size={28} className="mx-auto text-indigo-600" />
            <span className="text-xs font-bold text-slate-700 block">
              {selectedFile ? selectedFile.name : 'Select CSV or Excel Question Paper File'}
            </span>
            <p className="text-[11px] text-slate-500">
              Supports .csv, .xlsx, .xls files containing question text, options, and metadata.
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="question-paper-input"
            />
            <label
              htmlFor="question-paper-input"
              className="inline-block mt-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-extrabold cursor-pointer hover:bg-indigo-100"
            >
              Choose File
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUploadQuestionPaper}
              isLoading={isUploadingPaper}
              disabled={!selectedFile}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              Start Background Processing
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExamManagementDashboardPage;
