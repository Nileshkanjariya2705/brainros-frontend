import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Key,
  Award,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Check,
  Calendar,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  useAnswerKeyAPI,
  type AnswerKeyTemplateData,
  type AnswerKeyQuestionItem,
} from '../services/answerKey.service';

export const ViewAnswerKeyPage: React.FC = () => {
  const { scheduleId } = useParams<{ scheduleId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const routePrefix = location.pathname.startsWith('/super-admin')
    ? '/super-admin'
    : '/admin';

  const { getQuestions, isLoading, error } = useAnswerKeyAPI();
  const [data, setData] = useState<AnswerKeyTemplateData | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');

  useEffect(() => {
    if (scheduleId) {
      getQuestions(scheduleId).then((res) => {
        if (res.data) {
          setData(res.data);
        }
      });
    }
  }, [scheduleId, getQuestions]);

  // Unique subjects list for filtering
  const subjects = useMemo(() => {
    if (!data?.questions) return [];
    const set = new Set<string>();
    data.questions.forEach((q) => {
      if (q.subject) set.add(q.subject);
    });
    return Array.from(set);
  }, [data]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    if (!data?.questions) return [];
    if (selectedSubject === 'ALL') return data.questions;
    return data.questions.filter((q) => q.subject === selectedSubject);
  }, [data, selectedSubject]);

  // Count configured answers
  const configuredCount = useMemo(() => {
    if (!data?.questions) return 0;
    return data.questions.filter((q) => Boolean(q.correctOption && q.correctOption.trim())).length;
  }, [data]);

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
              onClick={() => navigate(`${routePrefix}/exam-manager/answer-key`)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition shadow-2xs"
              title="Back to Completed Exams"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  {data?.examTitle || 'Answer Key View'}
                </h1>
                {data?.examTarget && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {typeof data.examTarget === 'object'
                      ? (data.examTarget as any)?.name
                      : data.examTarget}
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 size={12} /> Key Ready
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Official Answer Key & Explanations in persisted question sequence • Read-only view
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <Button
              variant="primary"
              onClick={() =>
                navigate(`${routePrefix}/exam-manager/answer-key/${scheduleId}`)
              }
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs"
            >
              <Key size={14} /> Replace / Edit Answer Key
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate(`${routePrefix}/exam-manager/answer-key`)}
              className="flex items-center gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold px-3.5 py-2 rounded-xl"
            >
              Back to List
            </Button>
          </div>
        </div>

        {/* ── Loading State ── */}
        {isLoading && (
          <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center text-slate-500 shadow-xs">
            <RefreshCw size={32} className="animate-spin text-emerald-600 mb-3" />
            <span className="text-sm font-bold text-slate-800">
              Loading official answer key...
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Fetching questions, correct options, and explanations
            </span>
          </div>
        )}

        {/* ── Error State ── */}
        {!isLoading && error && (
          <div className="bg-white rounded-3xl border border-rose-200 p-12 text-center shadow-xs">
            <AlertCircle size={36} className="mx-auto text-rose-500 mb-3" />
            <h3 className="text-base font-bold text-slate-900">Failed to Load Answer Key</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
            <Button
              onClick={() => scheduleId && getQuestions(scheduleId)}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* ── Answer Key Details & Questions List ── */}
        {!isLoading && data && (
          <>
            {/* Answer Key Metrics Strip */}
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
                    {data.totalQuestions} Questions
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Configured Keys
                  </div>
                  <div className="text-sm font-extrabold text-emerald-700">
                    {configuredCount} / {data.totalQuestions} Ready
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Award size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Marks
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {data.totalMarks || data.questions.reduce((sum, q) => sum + (q.marks || 0), 0)} Marks
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                  <Calendar size={18} />
                </div>
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Last Uploaded
                  </div>
                  <div className="text-sm font-extrabold text-slate-900">
                    {data.answerKeyUploadedAt
                      ? new Date(data.answerKeyUploadedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Recently'}
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Filter Tabs */}
            {subjects.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedSubject('ALL')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    selectedSubject === 'ALL'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All Subjects ({data.totalQuestions})
                </button>
                {subjects.map((subj) => {
                  const count = data.questions.filter((q) => q.subject === subj).length;
                  return (
                    <button
                      key={subj}
                      onClick={() => setSelectedSubject(subj)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                        selectedSubject === subj
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {subj} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {filteredQuestions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center shadow-xs">
                <AlertCircle size={36} className="mx-auto text-slate-400 mb-3" />
                <h3 className="text-base font-bold text-slate-900">
                  No Questions Found for this Subject
                </h3>
              </div>
            ) : (
              /* Questions Feed */
              <div className="space-y-4">
                {filteredQuestions.map((q: AnswerKeyQuestionItem, qIdx: number) => {
                  const correctKeys = (q.correctOption || '')
                    .split(/[\s,;/]+/)
                    .map((k) => k.trim().toUpperCase())
                    .filter(Boolean);

                  return (
                    <div
                      key={q.questionId || q.questionNumber || qIdx}
                      className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 transition hover:border-emerald-100"
                    >
                      {/* Question Header Pill Info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="flex items-center justify-center h-6 px-2.5 rounded-lg bg-emerald-600 text-white text-xs font-black">
                            Q{q.questionNumber || qIdx + 1}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {formatQuestionType(q.questionType)}
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
                          {q.section && q.section !== 'Main' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                              Section: {q.section}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                            <span className="text-emerald-700 font-extrabold">+{q.marks}</span>
                            <span className="text-slate-300">/</span>
                            <span className="text-rose-600 font-extrabold">-{q.negativeMarks}</span>
                          </div>

                          <div className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold text-xs flex items-center gap-1.5">
                            <CheckCircle2 size={13} className="text-emerald-600" />
                            <span>Correct Answer: {q.correctOption || 'Not Set'}</span>
                          </div>
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
                      {q.questionText && (
                        <div className="text-sm font-semibold text-slate-900 leading-relaxed">
                          {q.questionText}
                        </div>
                      )}

                      {/* Options Grid (when question options are available) */}
                      {q.options && q.options.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                          {q.options.map((opt) => {
                            const isCorrect =
                              opt.isCorrect ||
                              correctKeys.includes(opt.optionKey.toUpperCase());

                            return (
                              <div
                                key={opt.id || opt.optionKey}
                                className={`flex items-start gap-3 p-3 rounded-2xl border text-xs transition ${
                                  isCorrect
                                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold shadow-2xs'
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
                                  {opt.optionText || `Option ${opt.optionKey}`}
                                </div>
                                {isCorrect && (
                                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 shrink-0 self-center bg-emerald-100/70 px-2 py-0.5 rounded-md">
                                    <Check size={12} strokeWidth={3} /> Correct Answer
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : q.questionType === 'NUMERICAL' ? (
                        /* Numerical Answer Card */
                        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                            #
                          </div>
                          <div>
                            <div className="text-[10px] uppercase font-bold text-emerald-800">
                              Accepted Numerical Value
                            </div>
                            <div className="text-base font-black text-emerald-950">
                              {q.correctOption || 'None configured'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Option Pills fallback if option text wasn't populated */
                        <div className="flex flex-wrap gap-2 pt-1">
                          {(q.availableOptions || 'A/B/C/D')
                            .split('/')
                            .map((optKey) => {
                              const isCorrect = correctKeys.includes(optKey.trim().toUpperCase());
                              return (
                                <div
                                  key={optKey}
                                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                      : 'bg-slate-100 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  <span>Option {optKey.trim()}</span>
                                  {isCorrect && <Check size={12} strokeWidth={3} />}
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* Explanation Card */}
                      {q.explanation && (
                        <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 text-xs text-indigo-950 leading-relaxed">
                          <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                            <HelpCircle size={13} className="text-indigo-600" />
                            <span>Detailed Explanation</span>
                          </div>
                          <div className="pl-4 border-l-2 border-indigo-300">
                            {q.explanation}
                          </div>
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
export default ViewAnswerKeyPage;
