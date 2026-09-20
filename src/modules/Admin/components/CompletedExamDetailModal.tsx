import React from 'react';
import {
  X,
  Calendar,
  Clock,
  HelpCircle,
  Award,
  AlertTriangle,
  Layers,
  BookOpen,
  Users,
  ShieldCheck,
  BarChart2,
  FileSpreadsheet,
} from 'lucide-react';
import { useCompletedExamHistoryDetailsQuery } from '../services/examHistory.service';
import Loader from '@/components/feedback/Loader';
import { useNavigate } from 'react-router-dom';
import { useRole } from '@/modules/Auth/auth-access';

interface CompletedExamDetailModalProps {
  examId: string | null;
  onClose: () => void;
}

export const CompletedExamDetailModal: React.FC<CompletedExamDetailModalProps> = ({
  examId,
  onClose,
}) => {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin } = useRole();
  const { data: details, isLoading, error: queryError } = useCompletedExamHistoryDetailsQuery(examId);
  const error = queryError ? ((queryError as any)?.response?.data?.message || queryError.message || 'Failed to load exam details') : null;

  const rolePrefix = isSuperAdmin ? '/super-admin' : isAdmin ? '/admin' : '/general-manager';

  if (!examId) return null;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PUBLISHED') {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'READY_TO_PUBLISH' || s === 'EVALUATED') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (s === 'ENDED' || s === 'COMPLETED') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 my-8 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-xl">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 line-clamp-1">
                {details?.exam.title || 'Exam Detailed Overview'}
              </h2>
              <p className="text-xs text-slate-500">
                Full examination blueprint, scheduling timings, subject breakdown, and participant metrics.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6">
          {isLoading && (
            <div className="py-16 text-center">
              <Loader label="Loading detailed examination history & analytics..." />
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              {error}
            </div>
          )}

          {details && !isLoading && (
            <>
              {/* Top Highlights Strip */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-indigo-600 text-white shadow-xs">
                    {details.exam.examTarget?.name || 'General'}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(
                      details.publication.status,
                    )}`}
                  >
                    Publication: {details.publication.status.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(
                      details.exam.status,
                    )}`}
                  >
                    Exam: {details.exam.status}
                  </span>
                </div>

                <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                  <span>Exam ID:</span>
                  <code className="bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-800 font-mono text-[11px]">
                    {details.exam.id}
                  </code>
                </div>
              </div>

              {/* Blueprint Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center">
                  <Clock size={18} className="mx-auto text-indigo-600 mb-1" />
                  <span className="text-base font-black text-slate-900 block">
                    {details.exam.durationMinutes} mins
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Duration
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center">
                  <HelpCircle size={18} className="mx-auto text-indigo-600 mb-1" />
                  <span className="text-base font-black text-slate-900 block">
                    {details.exam.totalQuestions}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Total Questions
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center">
                  <Award size={18} className="mx-auto text-indigo-600 mb-1" />
                  <span className="text-base font-black text-slate-900 block">
                    {details.exam.totalMarks} Marks
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Max Marks
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center">
                  <AlertTriangle size={18} className="mx-auto text-rose-500 mb-1" />
                  <span className="text-base font-black text-rose-600 block">
                    +{details.exam.defaultMarksPerQuestion} / −{details.exam.defaultNegativeMarks}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Marking Scheme
                  </span>
                </div>
              </div>

              {/* Schedule & Timing Box */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-600" />
                  Exam Schedule & Concluded Timings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block mb-0.5">Start Time:</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {formatDate(details.exam.startTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">End Time:</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {formatDate(details.exam.endTime)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-0.5">Timezone / Format:</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {details.exam.timezone || 'Asia/Kolkata (IST)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Student Attendance & Participation KPIs */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/80 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Users size={14} className="text-indigo-600" />
                    Student Participation & Submission Statistics
                  </h3>
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-100/70 px-2.5 py-0.5 rounded-full">
                    {details.participation.attended} Students Attended
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                  <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                    <span className="text-lg font-black text-slate-900 block">
                      {details.participation.registered}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Registered
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                    <span className="text-lg font-black text-indigo-600 block">
                      {details.participation.attended}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Attended / Started
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                    <span className="text-lg font-black text-emerald-600 block">
                      {details.participation.submitted + details.participation.autoSubmitted}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Submitted
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                    <span className="text-lg font-black text-blue-600 block">
                      {details.participation.evaluated}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Evaluated
                    </span>
                  </div>
                  <div className="p-3 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
                    <span className="text-lg font-black text-amber-600 block">
                      {details.participation.inProgress}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      In Progress
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance & Score Insights */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <BarChart2 size={14} className="text-indigo-600" />
                  Score & Performance Aggregate Analytics
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-base font-black text-slate-900 block">
                      {details.performance.averageScore} / {details.exam.totalMarks}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Average Score
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-base font-black text-emerald-600 block">
                      {details.performance.highestScore} Marks
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Highest Score
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-base font-black text-indigo-600 block">
                      {details.performance.averageAccuracy}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Average Accuracy
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-base font-black text-blue-600 block">
                      {details.performance.averagePercentage}%
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Avg Percentage
                    </span>
                  </div>
                </div>
              </div>

              {/* Subjects & Chapter Syllabus Breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <BookOpen size={14} className="text-indigo-600" />
                    Subjects & Syllabus Chapters Included ({details.exam.sections.length} Sections)
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {details.exam.sections.map((sec, idx) => (
                    <div
                      key={sec.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-xs font-black">
                          {sec.subject?.name || `Subject ${idx + 1}`}
                        </span>
                        <span className="text-xs font-bold text-slate-500">
                          {sec.totalQuestions} Questions
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900">
                        {sec.name || (sec as any).subject?.name || `Section ${idx + 1}`}
                      </h4>

                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Chapters Covered:
                        </span>
                        {sec.chapters && sec.chapters.length > 0 ? (
                          <ul className="space-y-1">
                            {sec.chapters.map((ch, cIdx) => (
                              <li
                                key={cIdx}
                                className="flex items-center gap-1.5 text-xs text-slate-700 font-medium bg-white border border-slate-200/80 rounded-md px-2 py-1 shadow-2xs"
                              >
                                <span className="h-3.5 w-3.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                                  {cIdx + 1}
                                </span>
                                <span className="line-clamp-1">{ch}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-xs text-slate-500 italic bg-white p-2 rounded-md border border-slate-100">
                            Complete {sec.subject?.name || 'Subject'} syllabus
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Publication & Audit Information */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-indigo-600" />
                  <span>
                    <strong>Created by:</strong> {details.exam.createdBy?.name || details.exam.createdBy?.email || 'Administrator'}
                  </span>
                </div>
                {details.publication.publishedAt && (
                  <div>
                    <strong>Published at:</strong> {formatDate(details.publication.publishedAt)}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                navigate(`${rolePrefix}/completed-exams`);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors"
            >
              <FileSpreadsheet size={14} />
              View Student Attendee Reports
            </button>
            <button
              onClick={() => {
                onClose();
                navigate(`${rolePrefix}/exams/results`);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              <Award size={14} />
              Publication Center
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
