import React, { useEffect, useState } from 'react';
import { Search, RotateCcw, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import type { QuestionFilterParams, NamedEntity } from '../types/questionBank.types';
import { QuestionDifficultyEnum, QuestionTypeEnum } from '../types/questionBank.types';
import {
  useGetSubjectsAPI,
  useGetChaptersAPI,
  useGetTopicsAPI,
  useGetSubTopicsAPI,
} from '../services/questionBank.service';
import Button from '@/components/ui/Button';

interface QuestionFiltersProps {
  filters: QuestionFilterParams;
  onFilterChange: (updated: Partial<QuestionFilterParams>) => void;
  onReset: () => void;
}

export const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [subjects, setSubjects] = useState<NamedEntity[]>([]);
  const [chapters, setChapters] = useState<NamedEntity[]>([]);
  const [topics, setTopics] = useState<NamedEntity[]>([]);
  const [subTopics, setSubTopics] = useState<NamedEntity[]>([]);

  const { getSubjectsAPI } = useGetSubjectsAPI();
  const { getChaptersAPI } = useGetChaptersAPI();
  const { getTopicsAPI } = useGetTopicsAPI();
  const { getSubTopicsAPI } = useGetSubTopicsAPI();

  // 1. Fetch subjects when examTargetId changes
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await getSubjectsAPI(filters.examTargetId);
      setSubjects(data || []);
      if (!data?.some((s) => s.id === filters.subjectId)) {
        onFilterChange({
          subjectId: undefined,
          chapterId: undefined,
          topicId: undefined,
          subTopicId: undefined,
        });
      }
    };
    fetchSubjects();
  }, [filters.examTargetId, getSubjectsAPI]);

  // 2. Fetch chapters when subjectId changes
  useEffect(() => {
    if (!filters.subjectId) {
      setChapters([]);
      return;
    }
    const fetchChapters = async () => {
      const { data } = await getChaptersAPI(filters.subjectId!);
      setChapters(data || []);
      if (!data?.some((c) => c.id === filters.chapterId)) {
        onFilterChange({ chapterId: undefined, topicId: undefined, subTopicId: undefined });
      }
    };
    fetchChapters();
  }, [filters.subjectId, getChaptersAPI]);

  // 3. Fetch topics when chapterId changes
  useEffect(() => {
    if (!filters.chapterId) {
      setTopics([]);
      return;
    }
    const fetchTopics = async () => {
      const { data } = await getTopicsAPI(filters.chapterId!);
      setTopics(data || []);
      if (!data?.some((t) => t.id === filters.topicId)) {
        onFilterChange({ topicId: undefined, subTopicId: undefined });
      }
    };
    fetchTopics();
  }, [filters.chapterId, getTopicsAPI]);

  // 4. Fetch subtopics when topicId changes
  useEffect(() => {
    if (!filters.topicId) {
      setSubTopics([]);
      return;
    }
    const fetchSubTopics = async () => {
      const { data } = await getSubTopicsAPI(filters.topicId!);
      setSubTopics(data || []);
      if (!data?.some((st) => st.id === filters.subTopicId)) {
        onFilterChange({ subTopicId: undefined });
      }
    };
    fetchSubTopics();
  }, [filters.topicId, getSubTopicsAPI]);

  const hasActiveFilters = Boolean(
    filters.examTargetId ||
    filters.subjectId ||
    filters.chapterId ||
    filters.topicId ||
    filters.subTopicId ||
    filters.difficultyLevel ||
    filters.type ||
    (filters.status && filters.status !== 'ALL') ||
    filters.search,
  );

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
      {/* Primary Search & Quick Toggles */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full sm:max-w-md">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Search questions by keywords, concepts, passage..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant={isExpanded ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 text-xs font-semibold"
          >
            <SlidersHorizontal size={14} />
            <span>Academic Filters</span>
            <ChevronDown
              size={14}
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-1"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Collapsible Cascading Hierarchy Selectors */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Subject Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Subject
            </label>
            <select
              value={filters.subjectId || ''}
              onChange={(e) =>
                onFilterChange({
                  subjectId: e.target.value || undefined,
                  chapterId: undefined,
                  topicId: undefined,
                  subTopicId: undefined,
                  page: 1,
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Chapter Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Chapter
            </label>
            <select
              value={filters.chapterId || ''}
              disabled={!filters.subjectId}
              onChange={(e) =>
                onFilterChange({
                  chapterId: e.target.value || undefined,
                  topicId: undefined,
                  subTopicId: undefined,
                  page: 1,
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 disabled:opacity-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Chapters</option>
              {chapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Topic
            </label>
            <select
              value={filters.topicId || ''}
              disabled={!filters.chapterId}
              onChange={(e) =>
                onFilterChange({
                  topicId: e.target.value || undefined,
                  subTopicId: undefined,
                  page: 1,
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 disabled:opacity-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Topics</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* SubTopic Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Sub-Topic
            </label>
            <select
              value={filters.subTopicId || ''}
              disabled={!filters.topicId}
              onChange={(e) =>
                onFilterChange({
                  subTopicId: e.target.value || undefined,
                  page: 1,
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 disabled:opacity-50 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Sub-Topics</option>
              {subTopics.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>

          {/* Question Type Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Question Type
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) =>
                onFilterChange({
                  type: (e.target.value as QuestionTypeEnum) || undefined,
                  page: 1,
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Question Types</option>
              <option value={QuestionTypeEnum.SINGLE_CORRECT}>Single Correct MCQ</option>
              <option value={QuestionTypeEnum.MULTIPLE_CORRECT}>Multiple Correct MCQ</option>
              <option value={QuestionTypeEnum.NUMERICAL}>Numerical</option>
              <option value={QuestionTypeEnum.ASSERTION_REASON}>Assertion & Reasoning</option>
              <option value={QuestionTypeEnum.MATCH_FOLLOWING}>Match the Following</option>
              <option value={QuestionTypeEnum.CASE_BASED}>Case / Passage Based</option>
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              Difficulty
            </label>
            <select
              value={filters.difficultyLevel || ''}
              onChange={(e) =>
                onFilterChange({
                  difficultyLevel: (e.target.value as QuestionDifficultyEnum) || undefined,
                  page: 1,
                })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-medium text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">All Difficulties</option>
              <option value={QuestionDifficultyEnum.EASY}>Easy</option>
              <option value={QuestionDifficultyEnum.MEDIUM}>Medium</option>
              <option value={QuestionDifficultyEnum.HARD}>Hard</option>
              <option value={QuestionDifficultyEnum.VERY_HARD}>Very Hard</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
