import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileEdit,
  Archive,
  Sparkles,
  Edit3,
  Eye,
  Send,
  Trash2,
  History,
  GitBranch,
  Check,
  Languages,
} from 'lucide-react';
import type { QuestionItem } from '../types/questionBank.types';
import {
  QuestionStatus,
  QuestionTypeEnum,
  QuestionDifficultyEnum,
} from '../types/questionBank.types';
import Button from '@/components/ui/Button';

interface QuestionCardProps {
  question: QuestionItem;
  onView: (question: QuestionItem) => void;
  onEdit: (question: QuestionItem) => void;
  onSubmit: (question: QuestionItem) => void;
  onReviewAction: (question: QuestionItem) => void;
  onHistory: (question: QuestionItem) => void;
  onVersions: (question: QuestionItem) => void;
  onTranslations?: (question: QuestionItem) => void;
  onDelete: (question: QuestionItem) => void;
  isSuperAdmin?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  onView,
  onEdit,
  onSubmit,
  onReviewAction,
  onHistory,
  onVersions,
  onTranslations,
  onDelete,
  isSuperAdmin = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Primary text from default translation
  const primaryTranslation =
    question.translations?.find((t) => t.languageId === question.defaultLanguageId) ||
    question.translations?.[0];
  const questionText = primaryTranslation?.questionText || 'No question text provided';

  // Question Type display formatting
  const getTypeBadge = (type: QuestionTypeEnum) => {
    switch (type) {
      case QuestionTypeEnum.SINGLE_CORRECT:
        return { label: 'Single Choice', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case QuestionTypeEnum.MULTIPLE_CORRECT:
        return { label: 'Multiple Choice', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case QuestionTypeEnum.NUMERICAL:
        return { label: 'Numerical', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case QuestionTypeEnum.ASSERTION_REASON:
        return { label: 'Assertion & Reason', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case QuestionTypeEnum.MATCH_FOLLOWING:
        return { label: 'Match Following', bg: 'bg-teal-50 text-teal-700 border-teal-200' };
      case QuestionTypeEnum.CASE_BASED:
        return { label: 'Case Study', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: type, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Difficulty badge formatting
  const getDifficultyBadge = (diff: QuestionDifficultyEnum) => {
    switch (diff) {
      case QuestionDifficultyEnum.EASY:
        return { label: 'Easy', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case QuestionDifficultyEnum.MEDIUM:
        return { label: 'Medium', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case QuestionDifficultyEnum.HARD:
        return { label: 'Hard', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
      case QuestionDifficultyEnum.VERY_HARD:
        return { label: 'Very Hard', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: diff, bg: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Status badge formatting
  const getStatusBadge = (status: QuestionStatus) => {
    switch (status) {
      case QuestionStatus.APPROVED:
        return {
          label: 'Approved',
          icon: CheckCircle2,
          badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        };
      case QuestionStatus.UNDER_REVIEW:
        return {
          label: 'In Review',
          icon: Clock,
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
        };
      case QuestionStatus.SUBMITTED:
        return {
          label: 'Submitted',
          icon: Clock,
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        };
      case QuestionStatus.DRAFT:
        return {
          label: 'Draft',
          icon: FileEdit,
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
      case QuestionStatus.REJECTED:
        return {
          label: 'Rejected',
          icon: AlertCircle,
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
        };
      case QuestionStatus.ARCHIVED:
        return {
          label: 'Archived',
          icon: Archive,
          badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
        };
      default:
        return {
          label: status,
          icon: Clock,
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const typeBadge = getTypeBadge(question.type);
  const diffBadge = getDifficultyBadge(question.difficultyLevel);
  const statusBadge = getStatusBadge(question.status);
  const StatusIcon = statusBadge.icon;

  return (
    <div
      className={`group rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
        question.status === QuestionStatus.APPROVED
          ? 'border-slate-200/90 hover:border-emerald-300'
          : question.status === QuestionStatus.REJECTED
            ? 'border-rose-200 bg-rose-50/20'
            : 'border-slate-200/80 hover:border-indigo-300'
      }`}
    >
      <div className="p-5 space-y-3.5">
        {/* Top Header: Academic Breadcrumbs & Status Tag */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          {/* Hierarchy Breadcrumbs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-600">
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 font-bold text-indigo-700 border border-indigo-100">
              {question.subject?.name || 'Subject'}
            </span>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="text-slate-700">{question.chapter?.name || 'Chapter'}</span>
            {question.topic && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <span className="text-slate-500">{question.topic.name}</span>
              </>
            )}
            {question.subTopic && (
              <>
                <ChevronRight size={13} className="text-slate-400" />
                <span className="text-slate-400">{question.subTopic.name}</span>
              </>
            )}
          </div>

          {/* Right Status & Version Pill */}
          <div className="flex items-center gap-2">
            {/* Version Badge */}
            <button
              type="button"
              onClick={() => onVersions(question)}
              className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-slate-200 px-2.5 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200 transition-colors"
            >
              <GitBranch size={11} /> v{question.version}
            </button>

            {/* Status Pill */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${statusBadge.badgeClass}`}
            >
              <StatusIcon size={12} />
              <span>{statusBadge.label}</span>
            </span>
          </div>
        </div>

        {/* Question Text & Passage (if case-based) */}
        <div className="space-y-2">
          {question.type === QuestionTypeEnum.CASE_BASED && question.passage && (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200/80 font-serif leading-relaxed line-clamp-2">
              <strong className="font-sans font-bold text-slate-800 uppercase text-[10px] tracking-wider block mb-1">
                Passage Context:
              </strong>
              {question.passage}
            </div>
          )}

          {question.type === QuestionTypeEnum.ASSERTION_REASON && (
            <div className="space-y-1 rounded-xl bg-amber-50/50 p-3 text-xs border border-amber-100">
              <p>
                <strong className="text-amber-900 font-bold">Assertion (A): </strong>
                <span className="text-slate-700">
                  {question.assertion || primaryTranslation?.assertionText || '—'}
                </span>
              </p>
              <p>
                <strong className="text-amber-900 font-bold">Reason (R): </strong>
                <span className="text-slate-700">
                  {question.reason || primaryTranslation?.reasonText || '—'}
                </span>
              </p>
            </div>
          )}

          <h3 className="text-sm font-semibold text-slate-900 leading-relaxed line-clamp-3">
            {questionText}
          </h3>
        </div>

        {/* Metadata Badges Bar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Question Type */}
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-bold border ${typeBadge.bg}`}
          >
            <Sparkles size={12} />
            {typeBadge.label}
          </span>

          {/* Difficulty */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold border ${diffBadge.bg}`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {diffBadge.label}
          </span>

          {/* Marks */}
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 border border-slate-200">
            +{question.marks} / -{question.negativeMarks} marks
          </span>

          {/* Translation count badge */}
          {question.translations?.length > 1 && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 font-semibold text-indigo-700 border border-indigo-100">
              <Languages size={12} />
              {question.translations.length} languages
            </span>
          )}

          {/* Usage counter */}
          {question._count?.examQuestions ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 font-semibold text-emerald-700 border border-emerald-100 ml-auto">
              Used in {question._count.examQuestions} exams
            </span>
          ) : null}
        </div>

        {/* Expandable Options Preview */}
        {isExpanded && question.options?.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-200">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Options Preview:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {question.options.map((opt) => (
                <div
                  key={opt.id}
                  className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-xs transition-colors ${
                    opt.isCorrect
                      ? 'border-emerald-300 bg-emerald-50/70 font-semibold text-emerald-900'
                      : 'border-slate-200 bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-md font-bold text-[11px] ${
                      opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {opt.optionKey}
                  </span>
                  <span className="flex-1 truncate">
                    {opt.optionLabel || opt.optionText || `Option ${opt.optionKey}`}
                  </span>
                  {opt.isCorrect && <Check size={14} className="text-emerald-600 shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejection notice banner if rejected */}
        {question.status === QuestionStatus.REJECTED && question.rejectionReason && (
          <div className="flex items-start gap-2 rounded-xl bg-rose-50 p-3 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
            <div>
              <strong className="font-bold">Rejection Reason: </strong>
              <span>{question.rejectionReason}</span>
            </div>
          </div>
        )}

        {/* Action Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
          {/* Quick toggle preview */}
          {question.options?.length > 0 ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              />
              <span>{isExpanded ? 'Hide Options' : 'Preview Options'}</span>
            </button>
          ) : (
            <div />
          )}

          {/* Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            {/* Translations Hub */}
            {onTranslations && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTranslations(question)}
                className="flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100/80 border-indigo-200"
                title="Manage 9 regional translations"
              >
                <Languages size={13} />
                <span>Translations</span>
              </Button>
            )}

            {/* View Full Modal */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(question)}
              className="flex items-center gap-1 text-xs"
            >
              <Eye size={13} />
              <span>Inspect</span>
            </Button>

            {/* Submit for Review (if Draft or Rejected) */}
            {(question.status === QuestionStatus.DRAFT ||
              question.status === QuestionStatus.REJECTED) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSubmit(question)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 border-blue-200"
              >
                <Send size={13} />
                <span>Submit</span>
              </Button>
            )}

            {/* Review Action (Super Admin) */}
            {isSuperAdmin &&
              (question.status === QuestionStatus.SUBMITTED ||
                question.status === QuestionStatus.UNDER_REVIEW) && (
                <Button
                  size="sm"
                  onClick={() => onReviewAction(question)}
                  className="flex items-center gap-1 text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-sm"
                >
                  <Sparkles size={13} />
                  <span>Review Actions</span>
                </Button>
              )}

            {/* Edit / Branch Version */}
            <Button
              variant={question.status === QuestionStatus.APPROVED ? 'outline' : 'secondary'}
              size="sm"
              onClick={() => onEdit(question)}
              className={`flex items-center gap-1 text-xs ${
                question.status === QuestionStatus.APPROVED
                  ? 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                  : ''
              }`}
            >
              <Edit3 size={13} />
              <span>{question.status === QuestionStatus.APPROVED ? 'New Version' : 'Edit'}</span>
            </Button>

            {/* Audit History */}
            <button
              onClick={() => onHistory(question)}
              title="View Audit Trail"
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <History size={16} />
            </button>

            {/* Delete button (if not approved) */}
            {question.status !== QuestionStatus.ARCHIVED && (
              <button
                onClick={() => onDelete(question)}
                title="Delete/Archive Question"
                className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
