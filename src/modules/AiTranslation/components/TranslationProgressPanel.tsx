import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Loader2,
  BookOpen,
  ArrowRight,
  Globe2,
  Clock,
} from 'lucide-react';
import type { AiTranslationJobDetails } from '../types/ai-translation.types';
import { aiTranslationApi } from '../services/ai-translation.service';

interface TranslationProgressPanelProps {
  jobDetails: AiTranslationJobDetails | null;
  progressPercentage: number;
  currentStage: string;
  status: string;
  isTerminal?: boolean;
  onViewQuestions: () => void;
  onJobUpdated: () => void;
}

export const TranslationProgressPanel: React.FC<TranslationProgressPanelProps> = ({
  jobDetails,
  progressPercentage,
  currentStage,
  status,
  onViewQuestions,
  onJobUpdated,
}) => {
  const [retryingLangId, setRetryingLangId] = useState<string | null>(null);
  const [retryingJob, setRetryingJob] = useState(false);

  if (!jobDetails) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Loading translation job status...
        </p>
      </div>
    );
  }

  const handleRetryLanguage = async (languageId: string) => {
    try {
      setRetryingLangId(languageId);
      await aiTranslationApi.retryLanguage(jobDetails.id, languageId);
      onJobUpdated();
    } catch (err) {
      console.error('Failed to retry language:', err);
    } finally {
      setRetryingLangId(null);
    }
  };

  const handleRetryJob = async () => {
    try {
      setRetryingJob(true);
      await aiTranslationApi.retryJob(jobDetails.id);
      onJobUpdated();
    } catch (err) {
      console.error('Failed to retry job:', err);
    } finally {
      setRetryingJob(false);
    }
  };

  const isComplete = status === 'COMPLETED';
  const isFailed = status === 'FAILED';
  const isPartial = status === 'PARTIALLY_COMPLETED';

  // Language count stats
  const completedLanguagesCount = jobDetails.languageStatuses.filter(
    (l) => l.status === 'COMPLETED',
  ).length;
  const failedLanguagesCount = jobDetails.languageStatuses.filter(
    (l) => l.status === 'FAILED',
  ).length;
  const retryingLanguagesCount = jobDetails.languageStatuses.filter(
    (l) => l.status === 'RETRYING',
  ).length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header & Overall Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              AI Translation Pipeline
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${isComplete
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : isFailed
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : isPartial
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 animate-pulse'
                }`}
            >
              {status}
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Exam: <strong className="text-slate-800 dark:text-slate-200">{jobDetails.examTitle || 'Exam'}</strong> • {jobDetails.totalQuestions} Questions • {completedLanguagesCount}/{jobDetails.totalLanguages} Languages Completed
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isFailed && (
            <button
              type="button"
              onClick={handleRetryJob}
              disabled={retryingJob}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all"
            >
              {retryingJob ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              Retry Entire Job
            </button>
          )}

          {(isComplete || isPartial) && (
            <button
              type="button"
              onClick={onViewQuestions}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-all"
            >
              <BookOpen className="w-4 h-4" />
              View Question Paper & Translations
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Global Error/Warning Banner if any */}
      {jobDetails.errorMessage && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 ${
          jobDetails.errorMessage.toLowerCase().includes('rate limit') ||
          jobDetails.errorMessage.toLowerCase().includes('quota')
            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200'
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-800 dark:text-rose-200'
        }`}>
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold">
              {jobDetails.errorMessage.toLowerCase().includes('rate limit')
                ? 'Rate Limit / Quota Pacing Notice'
                : 'Translation Notice'}
            </p>
            <p className="leading-relaxed">{jobDetails.errorMessage}</p>
          </div>
        </div>
      )}

      {/* ── TWO PROGRESS BARS ── */}
      <div className="space-y-4">

        {/* Progress Bar 1: English Question Paper DB Save */}
        {(() => {
          const dbPct = jobDetails.dbSaveProgress ?? (status === 'QUEUED' ? 0 : 100);
          const dbDone = dbPct >= 100;
          const dbActive = !dbDone && (status === 'QUEUED' || status === 'PROCESSING');
          return (
            <div className={`p-4 rounded-2xl border transition-all duration-300 ${
              dbDone
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                : 'bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/60 dark:to-blue-950/20 border-slate-200/80 dark:border-slate-700/80'
            }`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${
                  dbDone ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {dbDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : dbActive ? (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : (
                    <Loader2 className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {dbDone
                      ? `Step 1: English Paper Saved (${jobDetails.totalQuestions} questions)`
                      : dbActive
                        ? `Step 1: Saving English Questions to Database…`
                        : `Step 1: English Paper Save — Queued`}
                  </span>
                </span>
                <span className={`text-sm font-bold tabular-nums ${
                  dbDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {dbPct}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    dbDone
                      ? 'bg-emerald-500'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  }`}
                  style={{ width: `${Math.max(dbActive ? 4 : 0, dbPct)}%` }}
                />
              </div>
            </div>
          );
        })()}

        {/* Progress Bar 2: AI Translation Progress */}
        {(() => {
          const dbDone = (jobDetails.dbSaveProgress ?? 100) >= 100;
          const isTranslating = (status === 'PROCESSING' || status === 'RETRYING') && dbDone;
          const translationPct = Math.round(progressPercentage);
          return (
            <div className={`p-4 rounded-2xl border transition-all duration-300 ${
              isComplete
                ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50'
                : isFailed
                  ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50'
                  : isPartial
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                    : !dbDone
                      ? 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-700/50 opacity-60'
                      : 'bg-gradient-to-br from-slate-50 to-indigo-50/40 dark:from-slate-800/60 dark:to-indigo-950/20 border-slate-200/80 dark:border-slate-700/80'
            }`}>
              <div className="flex items-center justify-between mb-2.5">
                <span className={`text-xs font-bold flex items-center gap-1.5 ${
                  isComplete ? 'text-emerald-700 dark:text-emerald-300'
                  : isFailed ? 'text-rose-700 dark:text-rose-300'
                  : isPartial ? 'text-amber-700 dark:text-amber-300'
                  : !dbDone ? 'text-slate-500 dark:text-slate-500'
                  : 'text-slate-700 dark:text-slate-300'
                }`}>
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : isFailed ? (
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                  ) : isTranslating ? (
                    <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  ) : (
                    <Globe2 className="w-4 h-4 text-slate-400" />
                  )}
                  <span>
                    {isComplete
                      ? `Step 2: AI Translation Complete — ${completedLanguagesCount}/${jobDetails.totalLanguages} Languages`
                      : isFailed
                        ? `Step 2: AI Translation Failed (${completedLanguagesCount}/${jobDetails.totalLanguages} Completed)`
                        : isPartial
                          ? `Step 2: AI Translation Partially Complete (${completedLanguagesCount}/${jobDetails.totalLanguages} Languages)`
                          : !dbDone
                            ? `Step 2: AI Translation — Waiting for DB Save…`
                            : isTranslating
                              ? currentStage
                              : `Step 2: AI Translation — Queued`}
                  </span>
                </span>
                <span className={`text-sm font-bold tabular-nums ${
                  isComplete ? 'text-emerald-600 dark:text-emerald-400'
                  : isFailed ? 'text-rose-600 dark:text-rose-400'
                  : 'text-indigo-600 dark:text-indigo-400'
                }`}>
                  {dbDone ? `${translationPct}%` : '—'}
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    isComplete ? 'bg-emerald-500'
                    : isFailed ? 'bg-rose-500'
                    : isPartial ? 'bg-amber-500'
                    : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500'
                  }`}
                  style={{ width: dbDone ? `${Math.max(isTranslating ? 4 : 0, translationPct)}%` : '0%' }}
                />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Per-Language Progress Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Globe2 className="w-4 h-4 text-indigo-500" />
            Per-Language Status ({completedLanguagesCount}/{jobDetails.languageStatuses.length} Completed)
          </h3>
          {retryingLanguagesCount > 0 && (
            <span className="text-xs font-medium text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {retryingLanguagesCount} retrying with rate-limit pacing
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {jobDetails.languageStatuses.map((lang) => {
            const langPct =
              lang.totalQuestions > 0
                ? Math.round((lang.completedQuestions / lang.totalQuestions) * 100)
                : 0;

            const isLangDone = lang.status === 'COMPLETED';
            const isLangFail = lang.status === 'FAILED';
            const isLangRunning = lang.status === 'PROCESSING';
            const isLangRetrying = lang.status === 'RETRYING';
            const isLangWaiting = !isLangDone && !isLangFail && !isLangRunning && !isLangRetrying;

            return (
              <div
                key={lang.languageId}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center uppercase">
                      {lang.languageCode}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {lang.languageName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {lang.completedQuestions} / {lang.totalQuestions} questions translated
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isLangDone && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                      </span>
                    )}

                    {isLangRunning && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Translating
                      </span>
                    )}

                    {isLangRetrying && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded-full">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Retrying
                      </span>
                    )}

                    {isLangWaiting && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-200/70 dark:bg-slate-700/60 px-2 py-0.5 rounded-full border border-slate-300/50 dark:border-slate-600/50">
                        <Clock className="w-3 h-3 text-slate-400" />
                        Queued
                      </span>
                    )}

                    {isLangFail && (
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Failed
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRetryLanguage(lang.languageId)}
                          disabled={retryingLangId === lang.languageId}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 transition-colors"
                          title="Retry language translation"
                        >
                          {retryingLangId === lang.languageId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {lang.errorMessage && isLangFail && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 leading-snug line-clamp-2 bg-rose-50 dark:bg-rose-950/30 p-1.5 rounded border border-rose-200/50 dark:border-rose-900/40">
                    {lang.errorMessage}
                  </p>
                )}

                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isLangDone
                        ? 'bg-emerald-500'
                        : isLangFail
                          ? 'bg-rose-500'
                          : isLangRetrying
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                      }`}
                    style={{ width: `${langPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
