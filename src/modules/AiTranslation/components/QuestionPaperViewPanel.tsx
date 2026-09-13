import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Globe2,
  Search,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Check,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { aiTranslationApi } from '../services/ai-translation.service';
import type { QuestionPaperDetails } from '../types/ai-translation.types';

interface QuestionPaperViewPanelProps {
  jobId: string;
  initialLanguageId?: string;
  onBack: () => void;
}

export const QuestionPaperViewPanel: React.FC<QuestionPaperViewPanelProps> = ({
  jobId,
  initialLanguageId = 'en',
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialLanguageId);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  const {
    data: paperData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<QuestionPaperDetails>({
    queryKey: ['ai-translation-questions', jobId],
    queryFn: () => aiTranslationApi.getJobQuestions(jobId),
    staleTime: 5000,
  });

  // Keep activeTab in sync with initialLanguageId prop
  useEffect(() => {
    if (initialLanguageId) {
      setActiveTab(initialLanguageId);
    }
  }, [initialLanguageId]);

  // Reset page when tab, search term, or page size changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, pageSize]);

  // Collect all available language tabs from paperData across all questions
  const languageTabs = useMemo(() => {
    const tabs: { id: string; name: string; code: string }[] = [
      { id: 'en', name: 'English (Master)', code: 'en' },
    ];

    if (paperData?.questions) {
      for (const q of paperData.questions) {
        if (q.translations) {
          for (const tr of q.translations) {
            if (!tabs.some((t) => t.id === tr.languageId || t.code?.toLowerCase() === tr.languageCode?.toLowerCase())) {
              tabs.push({
                id: tr.languageId,
                name: tr.languageName,
                code: tr.languageCode,
              });
            }
          }
        }
      }
    }

    return tabs;
  }, [paperData]);

  // Active language info
  const currentLanguageTab = useMemo(() => {
    return (
      languageTabs.find(
        (t) =>
          t.id === activeTab ||
          t.code?.toLowerCase() === activeTab.toLowerCase() ||
          t.name?.toLowerCase() === activeTab.toLowerCase()
      ) || languageTabs[0]
    );
  }, [languageTabs, activeTab]);

  // Filtered questions based on search & tab
  const filteredQuestions = useMemo(() => {
    if (!paperData?.questions) return [];
    return paperData.questions.filter((q) => {
      const isEn =
        activeTab === 'en' ||
        activeTab.toLowerCase() === 'en' ||
        currentLanguageTab.code.toLowerCase() === 'en';

      const tr = !isEn
        ? q.translations?.find(
            (t) =>
              t.languageId === activeTab ||
              t.languageCode?.toLowerCase() === activeTab.toLowerCase() ||
              t.languageName?.toLowerCase() === activeTab.toLowerCase()
          )
        : null;

      const text = isEn ? q.questionText : tr?.questionText || q.questionText;

      return (
        text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(q.sequenceNumber).includes(searchTerm)
      );
    });
  }, [paperData, activeTab, currentLanguageTab, searchTerm]);

  // Pagination calculation
  const totalQuestions = filteredQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalQuestions);
  const paginatedQuestions = useMemo(() => {
    return filteredQuestions.slice(startIndex, endIndex);
  }, [filteredQuestions, startIndex, endIndex]);

  // Loading state with rich skeleton loader
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-pulse">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Fetching Question Paper & Translations from Database...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Retrieving multi-language questions and option translations for Job ID: {jobId}
            </p>
          </div>
        </div>

        {/* Pulse Skeleton Slices */}
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-slate-200 dark:bg-slate-700 rounded-lg shrink-0" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-3/4" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-10 pt-2">
                {[1, 2, 3, 4].map((j) => (
                  <div
                    key={j}
                    className="h-10 bg-slate-200/70 dark:bg-slate-700/60 rounded-xl"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error || !paperData) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Failed to load question paper & translations
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Could not retrieve questions from the database for this translation job.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Go Back
          </button>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
          >
            Retry Fetch
          </button>
        </div>
      </div>
    );
  }

  // Generate page numbers to show in pagination controls
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            title="Back to translation dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Question Paper & Translations
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {currentLanguageTab.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Showing questions in <strong className="font-semibold text-slate-700 dark:text-slate-300">{currentLanguageTab.name}</strong> • Total {paperData.totalQuestions} questions across {languageTabs.length} languages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFetching && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Syncing...
            </span>
          )}
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Print / Export
          </button>
        </div>
      </div>

      {/* Language Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
        {languageTabs.map((tab) => {
          const isSelected =
            activeTab === tab.id ||
            activeTab.toLowerCase() === tab.code.toLowerCase() ||
            activeTab.toLowerCase() === tab.name.toLowerCase();

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Globe2 className="w-3.5 h-3.5" />
              {tab.name}
              {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            </button>
          );
        })}
      </div>

      {/* Controls: Search & Page Size */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={`Search ${currentLanguageTab.name} question statement or number...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <span>Questions per page:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {paginatedQuestions.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              No questions match your search criteria.
            </p>
          </div>
        ) : (
          paginatedQuestions.map((q) => {
            const isEn =
              activeTab === 'en' ||
              activeTab.toLowerCase() === 'en' ||
              currentLanguageTab.code.toLowerCase() === 'en';

            const tr = !isEn
              ? q.translations?.find(
                  (t) =>
                    t.languageId === activeTab ||
                    t.languageCode?.toLowerCase() === activeTab.toLowerCase() ||
                    t.languageId === currentLanguageTab.id ||
                    t.languageCode?.toLowerCase() === currentLanguageTab.code.toLowerCase()
                )
              : null;

            const qText = isEn ? q.questionText : tr?.questionText || q.questionText;
            const options = isEn
              ? q.options
              : {
                  A: tr?.options?.A || q.options.A,
                  B: tr?.options?.B || q.options.B,
                  C: tr?.options?.C || q.options.C,
                  D: tr?.options?.D || q.options.D,
                };

            return (
              <div
                key={q.id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 space-y-3.5 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="flex items-start gap-3">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {q.sequenceNumber}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 pt-0.5 leading-relaxed">
                      {qText}
                    </p>
                    {!isEn && !tr && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-3 h-3" />
                        Translation pending for this question — showing master English
                      </span>
                    )}
                  </div>
                </div>

                {/* Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-10">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => (
                    <div
                      key={key}
                      className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/80 text-xs flex items-center gap-2.5"
                    >
                      <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                        {key}
                      </span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium">
                        {options[key]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {totalQuestions > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing <span className="font-bold text-slate-800 dark:text-slate-200">{startIndex + 1}</span> to{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{endIndex}</span> of{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{totalQuestions}</span> questions
          </p>

          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Prev Page */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Page Number Buttons */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) => {
                if (typeof page === 'string') {
                  return (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-2 py-1 text-xs text-slate-400 font-bold"
                    >
                      ...
                    </span>
                  );
                }

                const isCurrent = page === currentPage;
                return (
                  <button
                    key={`page-${page}`}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            {/* Next Page */}
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page */}
            <button
              type="button"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionPaperViewPanel;
