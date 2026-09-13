import React from 'react';
import {
  CalendarClock,
  Clock,
  HelpCircle,
  Globe2,
  AlertCircle,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import type { ScheduledExam } from '../types/ai-translation.types';

interface ExamSelectorProps {
  exams: ScheduledExam[];
  selectedScheduleId: string | null;
  onSelectExam: (exam: ScheduledExam) => void;
  isLoading?: boolean;
}

export const ExamSelector: React.FC<ExamSelectorProps> = ({
  exams,
  selectedScheduleId,
  onSelectExam,
  isLoading = false,
}) => {
  const selectedExam = exams.find((e) => e.scheduleId === selectedScheduleId);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            1. Select Scheduled Exam
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Select a scheduled exam to upload its question paper and generate translations.
          </p>
        </div>

        {selectedExam && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            {selectedExam.targetLanguages.length} Target Languages
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl w-full" />
        </div>
      ) : exams.length === 0 ? (
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            No Scheduled Exams Found
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Please schedule an exam first in the Exam Scheduling module.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <select
              value={selectedScheduleId || ''}
              onChange={(e) => {
                const found = exams.find((x) => x.scheduleId === e.target.value);
                if (found) onSelectExam(found);
              }}
              className="w-full appearance-none bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-3.5 pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm cursor-pointer"
            >
              <option value="" disabled>
                -- Choose an Exam Schedule --
              </option>
              {exams.map((exam) => (
                <option key={exam.scheduleId} value={exam.scheduleId}>
                  {exam.examTitle} ({new Date(exam.startTime).toLocaleDateString()}) — {exam.totalQuestionsConfigured || 0} Questions, {exam.targetLanguages.length} Languages
                </option>
              ))}
            </select>
            <ChevronDown className="w-5 h-5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {selectedExam && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  Duration
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {selectedExam.durationMinutes} Minutes
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <HelpCircle className="w-4 h-4 text-emerald-500" />
                  Configured Questions
                </div>
                <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-1">
                  {selectedExam.totalQuestionsConfigured || 0} Questions
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <CalendarClock className="w-4 h-4 text-amber-500" />
                  Schedule Window
                </div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 truncate">
                  {new Date(selectedExam.startTime).toLocaleDateString()} {new Date(selectedExam.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs font-medium">
                  <Globe2 className="w-4 h-4 text-sky-500" />
                  Target Languages ({selectedExam.targetLanguages.length})
                </div>
                <div className="flex flex-wrap gap-1 mt-1.5 max-h-12 overflow-y-auto">
                  {selectedExam.targetLanguages.length > 0 ? (
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
          )}
        </div>
      )}
    </div>
  );
};
