import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
  CalendarClock,
  Clock,
  HelpCircle,
  Globe2,
  UploadCloud,
} from 'lucide-react';
import { aiTranslationApi } from '../services/ai-translation.service';
import { useAiTranslationProgress, SCHEDULED_EXAMS_QUERY_KEY } from '../hooks/useAiTranslationProgress';
import { ScheduledExamsList } from '../components/ScheduledExamsList';
import { FileUploadZone } from '../components/FileUploadZone';
import { QuestionPreviewTable } from '../components/QuestionPreviewTable';
import { TranslationProgressPanel } from '../components/TranslationProgressPanel';
import { LanguageQuestionPapersList } from '../components/LanguageQuestionPapersList';
import { QuestionPaperViewPanel } from '../components/QuestionPaperViewPanel';
import type { ScheduledExam, UploadValidationResponse } from '../types/ai-translation.types';

export const AiQuestionPaperTranslationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedExam, setSelectedExam] = useState<ScheduledExam | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'translations'>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationData, setValidationData] = useState<UploadValidationResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [viewingPaper, setViewingPaper] = useState(false);
  const [selectedLanguageForView, setSelectedLanguageForView] = useState<string>('en');
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch Scheduled Exams
  const {
    data: scheduledExams = [],
    isLoading: isLoadingExams,
    refetch: refetchExams,
  } = useQuery({
    queryKey: SCHEDULED_EXAMS_QUERY_KEY,
    queryFn: () => aiTranslationApi.getScheduledExams(),
    staleTime: 10000,
  });

  // 2. Real-time translation progress tracking
  const {
    jobDetails,
    progressPercentage,
    currentStage,
    status: jobStatus,
    isTerminal,
    refetchJob,
  } = useAiTranslationProgress({
    jobId: activeJobId,
    enabled: !!activeJobId,
    onComplete: () => {
      setActionMessage({
        type: 'success',
        text: 'All regional language translations have completed successfully!',
      });
      refetchExams();
    },
    onFailed: () => {
      setActionMessage({
        type: 'error',
        text: 'Some language translations failed. You can retry individual languages.',
      });
    },
  });

  // Direct Job / Exam activation from URL query parameters (supports redirect after save & notifications)
  useEffect(() => {
    const targetJobId = searchParams.get('jobId') || searchParams.get('translationJobId');
    const targetScheduleId = searchParams.get('scheduleId');
    const targetExamId = searchParams.get('examId');

    if (targetJobId && targetJobId !== activeJobId) {
      setActiveJobId(targetJobId);
      setActiveTab('translations');
    }

    if ((targetScheduleId || targetExamId) && scheduledExams.length > 0 && !selectedExam) {
      const match = scheduledExams.find(
        (e) =>
          (targetScheduleId && e.scheduleId === targetScheduleId) ||
          (targetExamId && e.examId === targetExamId),
      );
      if (match) {
        setSelectedExam(match);
        if (match.translationJob?.id && !targetJobId) {
          setActiveJobId(match.translationJob.id);
          setActiveTab('translations');
        }
      }
    }
  }, [searchParams, scheduledExams, selectedExam, activeJobId]);

  // Keep selected exam reference updated when scheduledExams changes
  useEffect(() => {
    if (selectedExam) {
      const updated = scheduledExams.find(
        (e) => e.scheduleId === selectedExam.scheduleId || e.examId === selectedExam.examId,
      );
      if (updated) {
        setSelectedExam(updated);
        if (updated.translationJob?.id && !activeJobId) {
          setActiveJobId(updated.translationJob.id);
        }
      }
    }
  }, [scheduledExams]);

  // Automatically link selectedExam from jobDetails if user landed directly with ?jobId=...
  useEffect(() => {
    if (jobDetails && !selectedExam) {
      const match = scheduledExams.find((e) => e.examId === jobDetails.examId);
      if (match) {
        setSelectedExam(match);
      } else {
        // Synthesize minimal selectedExam from jobDetails so UI can render workspace seamlessly
        setSelectedExam({
          scheduleId: jobDetails.examId,
          examId: jobDetails.examId,
          examTitle: jobDetails.examTitle || 'Examination Question Paper',
          examCode: jobDetails.examCode || 'EXAM',
          startTime: new Date().toISOString(),
          endTime: new Date().toISOString(),
          durationMinutes: 0,
          totalQuestionsConfigured: jobDetails.totalQuestions,
          currentQuestionsCount: jobDetails.totalQuestions,
          targetLanguages: (jobDetails.languageStatuses || []).map((ls) => ({
            id: ls.languageId,
            name: ls.languageName,
            code: ls.languageCode,
          })),
          latestVersionId: jobDetails.examVersionId,
          translationJob: {
            id: jobDetails.id,
            status: jobDetails.status,
            overallProgress: jobDetails.overallProgress,
            createdAt: jobDetails.createdAt,
            completedAt: jobDetails.completedAt || null,
            languageStatuses: jobDetails.languageStatuses,
          },
        });
      }
      setActiveTab('translations');
    }
  }, [jobDetails, scheduledExams, selectedExam]);

  // 3. Handlers
  const handleSelectExam = (exam: ScheduledExam, mode: 'upload' | 'view' = 'upload') => {
    setSelectedExam(exam);
    setSelectedFile(null);
    setValidationData(null);
    setViewingPaper(false);
    setSelectedLanguageForView('en');
    setActionMessage(null);

    if (exam.translationJob?.id) {
      setActiveJobId(exam.translationJob.id);
      setActiveTab(mode === 'upload' ? 'upload' : 'translations');
    } else {
      setActiveJobId(null);
      setActiveTab('upload');
    }
  };

  const handleBackToList = () => {
    setSelectedExam(null);
    setSelectedFile(null);
    setValidationData(null);
    setViewingPaper(false);
    setActiveJobId(null);
    setActionMessage(null);
    refetchExams();
  };

  const handleValidateFile = async () => {
    if (!selectedFile || !selectedExam) return;
    setIsValidating(true);
    setActionMessage(null);
    try {
      const res = await aiTranslationApi.uploadAndValidate(selectedFile, selectedExam.scheduleId);
      setValidationData(res);
      if (!res.isValid) {
        setActionMessage({
          type: 'error',
          text: `Question paper has validation issues (${res.invalidRowsCount} invalid rows). Please fix before submitting.`,
        });
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to validate question paper.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (!validationData || !selectedExam) return;
    setIsSubmitting(true);
    setActionMessage(null);
    try {
      const payload = {
        examScheduleId: selectedExam.scheduleId,
        questions: validationData.rows.map((r) => ({
          questionNumber: r.questionNumber,
          question: r.question,
          optionA: r.optionA,
          optionB: r.optionB,
          optionC: r.optionC,
          optionD: r.optionD,
        })),
      };

      const result = await aiTranslationApi.submitTranslation(payload);
      setActiveJobId(result.jobId);
      setValidationData(null);
      setSelectedFile(null);
      setActiveTab('translations');
      setActionMessage({
        type: 'success',
        text: result.message || 'Questions saved! AI translation is now running.',
      });
      refetchExams();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || 'Failed to submit AI translation.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenLanguagePaper = (langId: string) => {
    setSelectedLanguageForView(langId);
    setViewingPaper(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  AI Question Paper Translation
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/80 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Super Admin
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedExam
                  ? `Managing question papers and multi-language AI translation for ${selectedExam.examTitle}.`
                  : 'Select any scheduled exam to upload question papers and generate multi-language translations.'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedExam && (
            <button
              type="button"
              onClick={handleBackToList}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Scheduled Exams
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              refetchExams();
              if (activeJobId) refetchJob();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between border ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-4 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* VIEW 1: Scheduled Exams List (Default View) */}
      {!selectedExam ? (
        <ScheduledExamsList
          exams={scheduledExams}
          isLoading={isLoadingExams}
          onSelectExam={handleSelectExam}
        />
      ) : (
        /* VIEW 2: Selected Exam Translation Workspace */
        <div className="space-y-6">
          {/* Selected Exam Information Header Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Selected Exam Schedule
                  </span>
                  {selectedExam.examCode && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {selectedExam.examCode}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  {selectedExam.examTitle}
                </h2>
              </div>

              {/* View/Upload Tabs if a job exists */}
              {activeJobId && !viewingPaper && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                  <button
                    type="button"
                    onClick={() => setActiveTab('translations')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'translations'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Globe2 className="w-3.5 h-3.5" />
                    Translation Papers ({jobDetails?.totalLanguages ? jobDetails.totalLanguages + 1 : selectedExam.targetLanguages.length + 1})
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'upload'
                        ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    Upload / Replace Paper
                  </button>
                </div>
              )}
            </div>

            {/* Quick Metadata Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <CalendarClock className="w-4 h-4 text-indigo-500" />
                  Scheduled Date & Time
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1 truncate">
                  {new Date(selectedExam.startTime).toLocaleDateString()} at{' '}
                  {new Date(selectedExam.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Duration
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {selectedExam.durationMinutes} Minutes
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <HelpCircle className="w-4 h-4 text-emerald-500" />
                  Questions Configured
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {selectedExam.totalQuestionsConfigured || 0} Questions
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <Globe2 className="w-4 h-4 text-sky-500" />
                  Target Languages ({selectedExam.targetLanguages?.length || 0})
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5 max-h-12 overflow-y-auto">
                  {selectedExam.targetLanguages && selectedExam.targetLanguages.length > 0 ? (
                    selectedExam.targetLanguages.map((l) => (
                      <span
                        key={l.id}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300"
                      >
                        {l.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400">English only</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Flow Level 3: View Full Question Paper Mode */}
          {viewingPaper && activeJobId ? (
            <QuestionPaperViewPanel
              jobId={activeJobId}
              initialLanguageId={selectedLanguageForView}
              onBack={() => setViewingPaper(false)}
            />
          ) : (
            <>
              {/* Flow Level 2A: Translations View (Progress + Regional Papers) */}
              {activeJobId && activeTab === 'translations' && (
                <div className="space-y-6">
                  {/* Real-time Progress Tracking Panel */}
                  <TranslationProgressPanel
                    jobDetails={jobDetails || null}
                    progressPercentage={progressPercentage}
                    currentStage={currentStage}
                    status={jobStatus}
                    isTerminal={isTerminal}
                    onViewQuestions={() => handleOpenLanguagePaper('en')}
                    onJobUpdated={() => {
                      refetchJob();
                      refetchExams();
                    }}
                  />

                  {/* Regional Languages Question Papers List */}
                  {jobDetails && (
                    <LanguageQuestionPapersList
                      jobDetails={jobDetails}
                      onViewLanguagePaper={handleOpenLanguagePaper}
                      onJobUpdated={() => {
                        refetchJob();
                        refetchExams();
                      }}
                    />
                  )}
                </div>
              )}

              {/* Flow Level 2B: Upload Flow (FileUploadZone + Validation & Preview Table) */}
              {(!activeJobId || activeTab === 'upload') && (
                <div className="space-y-6">
                  <FileUploadZone
                    selectedFile={selectedFile}
                    onFileSelected={(file) => {
                      setSelectedFile(file);
                      setValidationData(null);
                    }}
                    onClearFile={() => {
                      setSelectedFile(null);
                      setValidationData(null);
                    }}
                    onValidate={handleValidateFile}
                    isLoading={isValidating}
                    canValidate={!!selectedFile && !!selectedExam}
                  />

                  {/* Question Preview Table */}
                  {validationData && (
                    <QuestionPreviewTable
                      validationData={validationData}
                      onSubmit={handleSubmit}
                      isSubmitting={isSubmitting}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AiQuestionPaperTranslationPage;
