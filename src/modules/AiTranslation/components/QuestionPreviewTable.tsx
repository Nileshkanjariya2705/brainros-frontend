import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Search,
  ArrowRight,
  Loader2,
  Globe2,
  FileQuestion,
} from 'lucide-react';
import type { UploadValidationResponse } from '../types/ai-translation.types';

interface QuestionPreviewTableProps {
  validationData: UploadValidationResponse;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const QuestionPreviewTable: React.FC<QuestionPreviewTableProps> = ({
  validationData,
  onSubmit,
  isSubmitting = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'VALID' | 'INVALID'>('ALL');

  const filteredRows = validationData.rows.filter((row) => {
    const matchesSearch =
      row.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.optionA.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.optionB.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.optionC.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.optionD.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(row.questionNumber).includes(searchTerm);

    if (filterType === 'VALID') return matchesSearch && row.isValid;
    if (filterType === 'INVALID') return matchesSearch && !row.isValid;
    return matchesSearch;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
      {/* Header & Stats Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileQuestion className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            3. Preview & Validate Questions
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Review parsed questions from English paper. Once confirmed, AI will automatically generate translations.
          </p>
        </div>

        <button
          type="button"
          onClick={onSubmit}
          disabled={!validationData.isValid || isSubmitting}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving & Queueing AI Translation...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Save & Start AI Translation
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Validation Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Questions</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            {validationData.totalRows}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Valid Rows
          </span>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
            {validationData.validRowsCount}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
          <span className="text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Invalid Rows
          </span>
          <p className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">
            {validationData.invalidRowsCount}
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60">
          <span className="text-xs text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
            <Globe2 className="w-3.5 h-3.5 text-purple-500" />
            Target Languages
          </span>
          <p className="text-lg font-bold text-purple-700 dark:text-purple-300 mt-0.5">
            {validationData.targetLanguages.length}
          </p>
        </div>
      </div>

      {/* Global Errors if any */}
      {validationData.globalErrors && validationData.globalErrors.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
          <div className="flex items-center gap-2 text-rose-800 dark:text-rose-200 font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            File Validation Issues
          </div>
          <ul className="list-disc list-inside text-xs text-rose-700 dark:text-rose-300 space-y-0.5 font-medium">
            {validationData.globalErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search questions or options..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          {(['ALL', 'VALID', 'INVALID'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterType === type
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="max-h-[460px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3 px-3.5 font-bold text-slate-600 dark:text-slate-300 w-16 text-center">
                  Q#
                </th>
                <th className="py-3 px-3.5 font-bold text-slate-600 dark:text-slate-300 min-w-[280px]">
                  Question Text
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300 min-w-[140px]">
                  Option A
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300 min-w-[140px]">
                  Option B
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300 min-w-[140px]">
                  Option C
                </th>
                <th className="py-3 px-3 font-bold text-slate-600 dark:text-slate-300 min-w-[140px]">
                  Option D
                </th>
                <th className="py-3 px-3.5 font-bold text-slate-600 dark:text-slate-300 w-28 text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No matching questions found.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={`transition-colors ${
                      !row.isValid
                        ? 'bg-rose-50/40 dark:bg-rose-950/20'
                        : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-3.5 font-bold text-center text-slate-700 dark:text-slate-300">
                      {row.questionNumber}
                    </td>
                    <td className="py-3 px-3.5 text-slate-900 dark:text-slate-100 font-medium">
                      {row.question}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-400 mr-1">A:</span>
                      {row.optionA}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-400 mr-1">B:</span>
                      {row.optionB}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-400 mr-1">C:</span>
                      {row.optionC}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                      <span className="font-semibold text-slate-400 mr-1">D:</span>
                      {row.optionD}
                    </td>
                    <td className="py-3 px-3.5 text-center">
                      {row.isValid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          Valid
                        </span>
                      ) : (
                        <div className="group relative inline-block">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 cursor-help">
                            <AlertTriangle className="w-3 h-3" />
                            Error
                          </span>
                          <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block z-20 w-48 p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg">
                            {row.errors.join(', ')}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
