import React, { useState } from 'react';
import { Search, RotateCcw, X, Filter } from 'lucide-react';
import type { QuestionFilterParams } from '../types/questionBank.types';
import { QuestionDifficultyEnum, QuestionTypeEnum } from '../types/questionBank.types';
import Button from '@/components/ui/Button';

interface QuestionFiltersProps {
  filters: QuestionFilterParams;
  onFilterChange: (updated: Partial<QuestionFilterParams>) => void;
  onReset: () => void;
}

type FilterCategory = 'subject' | 'question' | 'difficulty';

export const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('subject');

  const hasActiveFilters = Boolean(
    filters.subjectId ||
    filters.difficultyLevel ||
    filters.type ||
    (filters.status && filters.status !== 'ALL') ||
    filters.search,
  );

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-3">
      {/* All in one single flex row */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
        {/* 1. Search Bar */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Search questions..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-9 py-2 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 2. Combined Single Row Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 shrink-0">
            <Filter size={14} className="text-indigo-600" />
            <span>Filter By:</span>
          </div>

          {/* First Select Box: Category (Subject, Question Type, Difficulty) */}
          <select
            value={activeCategory}
            onChange={(e) => setActiveCategory(e.target.value as FilterCategory)}
            className="rounded-xl border border-slate-200 bg-slate-100/80 px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
          >
            <option value="subject">Subject</option>
            <option value="question">Question Type</option>
            <option value="difficulty">Difficulty Level</option>
          </select>

          {/* Second Select Box: Dynamic according to first selected */}
          {activeCategory === 'subject' && (
            <select
              value={filters.subjectId || ''}
              onChange={(e) =>
                onFilterChange({
                  subjectId: e.target.value || undefined,
                  page: 1,
                })
              }
              className="rounded-xl border border-slate-200 bg-indigo-50/40 px-3 py-2 text-xs font-bold text-indigo-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all min-w-[160px]"
            >
              <option value="">All Subjects</option>
              <option value="JEET">JEET</option>
              <option value="NEET">NEET</option>
              <option value="CAT">CAT</option>
            </select>
          )}

          {activeCategory === 'question' && (
            <select
              value={filters.type || ''}
              onChange={(e) =>
                onFilterChange({
                  type: (e.target.value as QuestionTypeEnum) || undefined,
                  page: 1,
                })
              }
              className="rounded-xl border border-slate-200 bg-indigo-50/40 px-3 py-2 text-xs font-bold text-indigo-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all min-w-[180px]"
            >
              <option value="">All Question Types</option>
              <option value={QuestionTypeEnum.SINGLE_CORRECT}>Single Correct MCQ</option>
              <option value={QuestionTypeEnum.MULTIPLE_CORRECT}>Multiple Correct MCQ</option>
              <option value={QuestionTypeEnum.NUMERICAL}>Numerical</option>
              <option value={QuestionTypeEnum.ASSERTION_REASON}>Assertion & Reasoning</option>
              <option value={QuestionTypeEnum.MATCH_FOLLOWING}>Match the Following</option>
              <option value={QuestionTypeEnum.CASE_BASED}>Case / Passage Based</option>
            </select>
          )}

          {activeCategory === 'difficulty' && (
            <select
              value={filters.difficultyLevel || ''}
              onChange={(e) =>
                onFilterChange({
                  difficultyLevel: (e.target.value as QuestionDifficultyEnum) || undefined,
                  page: 1,
                })
              }
              className="rounded-xl border border-slate-200 bg-indigo-50/40 px-3 py-2 text-xs font-bold text-indigo-900 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all min-w-[160px]"
            >
              <option value="">All Difficulties</option>
              <option value={QuestionDifficultyEnum.EASY}>Easy</option>
              <option value={QuestionDifficultyEnum.MEDIUM}>Medium</option>
              <option value={QuestionDifficultyEnum.HARD}>Hard</option>
              <option value={QuestionDifficultyEnum.VERY_HARD}>Very Hard</option>
            </select>
          )}

          {/* Reset Action */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-1 font-bold ml-auto sm:ml-0"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
            Active Filters:
          </span>
          {filters.subjectId && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-200">
              Subject: {filters.subjectId}
              <button
                onClick={() => onFilterChange({ subjectId: undefined, page: 1 })}
                className="hover:text-indigo-900"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.type && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 border border-purple-200">
              Type: {filters.type}
              <button
                onClick={() => onFilterChange({ type: undefined, page: 1 })}
                className="hover:text-purple-900"
              >
                <X size={12} />
              </button>
            </span>
          )}
          {filters.difficultyLevel && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">
              Difficulty: {filters.difficultyLevel}
              <button
                onClick={() => onFilterChange({ difficultyLevel: undefined, page: 1 })}
                className="hover:text-amber-950"
              >
                <X size={12} />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
