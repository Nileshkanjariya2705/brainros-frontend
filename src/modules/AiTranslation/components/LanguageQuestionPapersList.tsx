import React, { useState } from 'react';
import {
  Globe2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RotateCcw,
  Eye,
  FileText,
  Sparkles,
  Layers,
} from 'lucide-react';
import type { AiTranslationJobDetails } from '../types/ai-translation.types';
import { aiTranslationApi } from '../services/ai-translation.service';

interface LanguageQuestionPapersListProps {
  jobDetails: AiTranslationJobDetails;
  onViewLanguagePaper: (languageId: string) => void;
  onJobUpdated: () => void;
}

export const LanguageQuestionPapersList: React.FC<LanguageQuestionPapersListProps> = ({
  jobDetails,
  onViewLanguagePaper,
  onJobUpdated,
}) => {
  const [retryingLangId, setRetryingLangId] = useState<string | null>(null);

  const handleRetryLanguage = async (languageId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            Question Papers by Language
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click on any language to view its full question paper and options.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
          <Globe2 className="w-3.5 h-3.5" />
          {jobDetails.totalLanguages + 1} Languages Available
        </span>
      </div>

      {/* Grid of Language Papers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. English Master Paper */}
        <div className="border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-5 bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/30 dark:from-indigo-950/30 dark:via-slate-900 dark:to-purple-950/20 shadow-sm flex flex-col justify-between gap-4 transition-all hover:shadow-md">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-indigo-600 text-white uppercase tracking-wider">
                EN
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Master Paper
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                English (Original Master)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {jobDetails.totalQuestions} Questions • Source Paper
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onViewLanguagePaper('en')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all"
          >
            <Eye className="w-4 h-4" />
            View English Paper
          </button>
        </div>

        {/* 2. Regional Translated Languages */}
        {jobDetails.languageStatuses.map((lang) => {
          const isDone = lang.status === 'COMPLETED';
          const isRunning = lang.status === 'PROCESSING';
          const isFailed = lang.status === 'FAILED';
          const isQueued = lang.status === 'QUEUED';

          const pct =
            lang.totalQuestions > 0
              ? Math.round((lang.completedQuestions / lang.totalQuestions) * 100)
              : 0;

          return (
            <div
              key={lang.languageId}
              className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-800/60 shadow-sm flex flex-col justify-between gap-4 transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md text-[11px] font-black bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                    {lang.languageCode}
                  </span>

                  {isDone && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Translated
                    </span>
                  )}

                  {isRunning && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950/80 px-2.5 py-0.5 rounded-full animate-pulse">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Translating {pct}%
                    </span>
                  )}

                  {isQueued && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                      Queued
                    </span>
                  )}

                  {isFailed && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-2.5 py-0.5 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Failed
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    {lang.languageName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {lang.completedQuestions} / {lang.totalQuestions} Questions Translated
                  </p>
                </div>

                {/* Progress Mini Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDone
                        ? 'bg-emerald-500'
                        : isFailed
                        ? 'bg-rose-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.max(5, pct)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onViewLanguagePaper(lang.languageId)}
                  disabled={!isDone && lang.completedQuestions === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 dark:bg-slate-700 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all"
                >
                  <Eye className="w-4 h-4" />
                  View {lang.languageName} Paper
                </button>

                {isFailed && (
                  <button
                    type="button"
                    onClick={(e) => handleRetryLanguage(lang.languageId, e)}
                    disabled={retryingLangId === lang.languageId}
                    className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors"
                    title={`Retry ${lang.languageName} translation`}
                  >
                    {retryingLangId === lang.languageId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RotateCcw className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
