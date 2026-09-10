import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BookOpen,
  RefreshCw,
  UploadCloud,
  Check,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useGetExamQuestionPaperAPI } from '../services/examManager.service';
import type { ExamQuestionPaperDetail, QuestionPaperQuestion } from '../types/examManager.types';

export const ViewQuestionPaperPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const routePrefix = location.pathname.startsWith('/super-admin')
    ? '/super-admin'
    : '/admin';

  const { getExamQuestionPaperAPI, isLoading, error } = useGetExamQuestionPaperAPI();
  const [paper, setPaper] = useState<ExamQuestionPaperDetail | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('ALL');

  useEffect(() => {
    if (examId) {
      getExamQuestionPaperAPI(examId).then((res) => {
        if (res.data) {
          setPaper(res.data);
        }
      });
    }
  }, [examId, getExamQuestionPaperAPI]);

  // Filter questions by section if selected
  const filteredQuestions = useMemo(() => {
    if (!paper) return [];
    if (selectedSection === 'ALL') return paper.questions;
    return paper.questions.filter((q) => q.section === selectedSection);
  }, [paper, selectedSection]);

  const formatQuestionType = (type: string) => {
    switch (type) {
      case 'SINGLE_CORRECT':
        return 'Single Choice';
      case 'MULTIPLE_CORRECT':
        return 'Multiple Choice';
      case 'NUMERICAL':
        return 'Numerical Value';
      case 'ASSERTION_REASON':
        return 'Assertion & Reason';
      case 'MATCH_FOLLOWING':
        return 'Match the Following';
      case 'CASE_BASED':
        return 'Case / Passage Based';
      default:
        return type.replace(/_/g, ' ');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* ── Top Header Navigation Bar (White / Light Theme) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 bg-white p-6 rounded-3xl shadow-xs">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(`${routePrefix}/exam-manager/upload`)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition shadow-2xs"
              title="Back to Question Paper List"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {paper?.title || 'Question Paper View'}
                </h1>
                {paper?.examTarget && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {paper.examTarget.name}
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Full uploaded question paper in persisted sequence • Read-only view
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="primary"
              onClick={() =>
                navigate(`${routePrefix}/exams/${examId}/question-paper/upload`)
              }
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
            >
              <UploadCloud size={14} /> Replace Question Paper
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`${routePrefix}/exam-manager/upload`)}
              className="flex items-center gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold px-3.5 py-2 rounded-xl"
            >
              Back to List
            </Button>
          </div>
        </div>

        {/* ── Loading State ── */}
        {isLoading && (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center text-slate-500 shadow-xs">
            <RefreshCw size={32} className="animate-spin text-indigo-600 mb-3" />
            <span className="text-sm font-bold text-slate-800">
              Loading full question paper...
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Fetching questions, stored options, and explanations
            </span>
          </div>
        )}

        {/* ── Error State ── */}
        {!isLoading && error && (
          <div className="bg-white rounded-3xl border border-rose-200 p-12 text-center shadow-xs">
            <AlertCircle size={36} className="mx-auto text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-slate-900">Failed to Load Question Paper</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
            <Button
              onClick={() => examId && getExamQuestionPaperAPI(examId)}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* ── Paper Details & Question List ── */}
        {!isLoading && paper && (
          <>
            {/* Exam Metrics Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <Layers size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Questions
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {paper.totalQuestions} Questions
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <Award size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Marks
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {paper.totalMarks} Marks
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Clock size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Duration
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {paper.durationMinutes} Minutes
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <BookOpen size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Sections
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {paper.sections.length} Section(s)
                  </div>
                </div>
              </div>
            </div>

            {/* Section Filter Tabs */}
            {paper.sections.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedSection('ALL')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    selectedSection === 'ALL'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All Questions ({paper.totalQuestions})
                </button>
                {paper.sections.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSection(sec.name)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedSection === sec.name
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {sec.name} ({sec.totalQuestions})
                  </button>
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
                <FileText size={36} className="mx-auto text-slate-400 mb-3" />
                <h3 className="text-base font-bold text-slate-900">
                  No Questions in this Section
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Upload or replace question paper to add questions.
                </p>
              </div>
            ) : (
              /* Questions Feed */
              <div className="space-y-4">
                {filteredQuestions.map((q: QuestionPaperQuestion, qIdx: number) => {
                  return (
                    <div
                      key={q.id || qIdx}
                      className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 transition hover:border-indigo-100"
                    >
                      {/* Question Header Pill Info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center justify-center h-6 px-2.5 rounded-lg bg-indigo-600 text-white text-xs font-black">
                            Q{q.questionNumber || qIdx + 1}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {formatQuestionType(q.type)}
                          </span>
                          {q.subject && (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {q.subject}
                            </span>
                          )}
                          {q.chapter && (
                            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                              {q.chapter}
                            </span>
                          )}
                          {q.section && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                              Section: {q.section}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                          <span className="text-emerald-700 font-extrabold">+{q.marks}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-rose-600 font-extrabold">-{q.negativeMarks}</span>
                        </div>
                      </div>

                      {/* Passage / Context (if available) */}
                      {q.passageText && (
                        <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/70 text-xs text-slate-800 leading-relaxed font-serif">
                          <span className="block font-bold text-amber-900 uppercase tracking-wider text-[10px] mb-1">
                            Passage / Context
                          </span>
                          {q.passageText}
                        </div>
                      )}

                      {/* Assertion & Reason (if applicable) */}
                      {q.assertionText && (
                        <div className="space-y-1.5 text-xs text-slate-800">
                          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                            <span className="font-bold text-indigo-900">Assertion (A): </span>
                            {q.assertionText}
                          </div>
                          {q.reasonText && (
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                              <span className="font-bold text-indigo-900">Reason (R): </span>
                              {q.reasonText}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Question Text */}
                      <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                        {q.questionText}
                      </div>

                      {/* Options Grid */}
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {q.options.map((opt) => {
                            const isCorrect = opt.isCorrect;
                            return (
                              <div
                                key={opt.id || opt.optionKey}
                                className={`flex items-start gap-3 p-3 rounded-2xl border text-xs transition ${
                                  isCorrect
                                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold shadow-2xs'
                                    : 'bg-slate-50/60 border-slate-200 text-slate-800 hover:bg-slate-50'
                                }`}
                              >
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white shadow-2xs'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {opt.optionKey}
                                </span>
                                <div className="flex-1 pt-0.5 leading-relaxed">
                                  {opt.optionText}
                                </div>
                                {isCorrect && (
                                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 shrink-0 self-center">
                                    <Check size={14} className="stroke-[3]" />
                                    <span>Correct</span>
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Numerical Answer Display */}
                      {q.type === 'NUMERICAL' && q.correctAnswer !== undefined && (
                        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <span>Numerical Answer: {String(q.correctAnswer)}</span>
                        </div>
                      )}

                      {/* Explanation Card */}
                      {q.explanation && (
                        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs text-slate-800 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-950">
                            <HelpCircle size={14} className="text-indigo-600" />
                            <span>Explanation & Solution</span>
                          </div>
                          <p className="text-slate-600 leading-relaxed font-medium pl-5">
                            {q.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ViewQuestionPaperPage;
