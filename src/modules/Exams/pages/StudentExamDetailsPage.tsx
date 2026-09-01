import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  HelpCircle,
  Award,
  AlertTriangle,
  PlayCircle,
  Calendar,
  Layers,
  ArrowLeft,
  TrendingUp,
} from 'lucide-react';
import cn from 'classnames';
import { useGetExamDetailsAPI, useStartAttemptAPI } from '../services';
import { ExamStartLanguageModal } from '../components/ExamStartLanguageModal';
import Loader from '@/components/feedback/Loader';
import type { Exam } from '@/types/exam.types';

export const StudentExamDetailsPage: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const { getExamDetailsAPI, isLoading: isDetailsLoading } = useGetExamDetailsAPI();
  const { startAttemptAPI, isLoading: isStarting } = useStartAttemptAPI();

  const [examData, setExamData] = useState<{
    exam: Exam & {
      languages?: Array<{ id: string; name: string; code?: string; nativeName?: string }>;
      schedule?: {
        id: string;
        startTime: string;
        endTime: string;
        timezone: string;
        status: string;
      } | null;
    };
    accessDetails: {
      accessStatus:
        | 'AVAILABLE'
        | 'NOT_YET_STARTED'
        | 'ENDED'
        | 'ALREADY_ATTEMPTED'
        | 'IN_PROGRESS'
        | 'CANCELLED';
      canStart: boolean;
      message: string;
      serverTime: string;
      startTime: string | null;
      endTime: string | null;
      waitSeconds: number;
      existingAttempt?: {
        id: string;
        status: string;
        createdAt: string;
        submittedAt: string | null;
        resultId: string | null;
      } | null;
    };
  } | null>(null);

  const [countdown, setCountdown] = useState<number>(0);
  const [showLangModal, setShowLangModal] = useState<boolean>(false);
  const [startError, setStartError] = useState<string | null>(null);

  const fetchExamDetails = useCallback(async () => {
    if (!examId) return;
    const res = await getExamDetailsAPI(examId);
    const data = res.data;
    if (data && data.exam) {
      setExamData(data);
      if (data.accessDetails?.waitSeconds > 0) {
        setCountdown(data.accessDetails.waitSeconds);
      }
    }
  }, [examId, getExamDetailsAPI]);

  useEffect(() => {
    fetchExamDetails();
  }, [fetchExamDetails]);

  // Live countdown timer for upcoming exam windows
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          fetchExamDetails(); // Refresh access state when timer reaches zero
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown, fetchExamDetails]);

  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (isDetailsLoading || !examData) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <Loader label="Loading examination blueprint & access authorization..." />
      </div>
    );
  }

  const { exam, accessDetails } = examData;
  const isAvailable = accessDetails.canStart && accessDetails.accessStatus === 'AVAILABLE';
  const isOngoing = accessDetails.accessStatus === 'IN_PROGRESS';
  const isAlreadyAttempted = accessDetails.accessStatus === 'ALREADY_ATTEMPTED';
  const isUpcoming = accessDetails.accessStatus === 'NOT_YET_STARTED';
  const isEnded = accessDetails.accessStatus === 'ENDED';

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* ── Back Navigation & Category Pill ──────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Back to All Exams</span>
        </button>

        <span className="rounded-xl bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700 border border-indigo-100">
          {exam.examTarget?.name || 'Standard Mock Test'}
        </span>
      </div>

      {/* ── Hero Exam Card ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={cn(
                  'rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-wider border',
                  isAvailable || isOngoing
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : isUpcoming
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : isAlreadyAttempted
                        ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                        : 'bg-slate-100 text-slate-700 border-slate-200',
                )}
              >
                {isAvailable
                  ? '● Live Now'
                  : isOngoing
                    ? '● In Progress'
                    : isUpcoming
                      ? '● Upcoming'
                      : isAlreadyAttempted
                        ? '✓ Attempted'
                        : isEnded
                          ? 'Closed'
                          : exam.status?.name}
              </span>

              {exam.schedule?.startTime && (
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Calendar size={13} className="text-slate-400" />
                  {new Date(exam.schedule.startTime).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                    timeZone: 'Asia/Kolkata',
                  })}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
              {exam.title}
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              {exam.description ||
                'Full length diagnostic mock test designed in accordance with current examination patterns.'}
            </p>
          </div>

          {/* Start / Action Trigger Box */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 shrink-0 flex flex-col items-center md:items-end justify-center gap-3 w-full md:w-auto">
            {isAvailable ? (
              <button
                onClick={() => setShowLangModal(true)}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <PlayCircle size={18} />
                <span>Start Test Now</span>
              </button>
            ) : isOngoing && accessDetails.existingAttempt ? (
              <button
                onClick={() =>
                  navigate(`/exam/${exam.id}/attempt/${accessDetails.existingAttempt?.id}`)
                }
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-95 transition-all"
              >
                <PlayCircle size={18} />
                <span>Resume Test</span>
              </button>
            ) : isAlreadyAttempted && accessDetails.existingAttempt?.resultId ? (
              <button
                onClick={() => navigate(`/exam/result/${accessDetails.existingAttempt?.id}`)}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all"
              >
                <TrendingUp size={18} />
                <span>View Full Analytics</span>
              </button>
            ) : isUpcoming ? (
              <div className="text-center md:text-right">
                <span className="text-xs font-bold text-amber-700 block">Exam Starts In</span>
                <span className="text-2xl font-black text-amber-900 font-mono block">
                  {formatCountdown(countdown)}
                </span>
                <button
                  disabled
                  className="mt-2 rounded-xl bg-slate-200 px-4 py-2 text-xs font-bold text-slate-400 cursor-not-allowed"
                >
                  Locked until start time
                </button>
              </div>
            ) : (
              <div className="text-center md:text-right">
                <span className="text-xs font-bold text-slate-500 block">Status</span>
                <span className="text-sm font-black text-slate-800 block">
                  {accessDetails.message}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Metrics Strip ────────────────────────────────────────── */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-100 pt-6">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
            <Clock size={18} className="mx-auto text-indigo-600 mb-1" />
            <span className="text-lg font-black text-slate-900 block">
              {exam.durationMinutes} mins
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Duration
            </span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
            <HelpCircle size={18} className="mx-auto text-indigo-600 mb-1" />
            <span className="text-lg font-black text-slate-900 block">{exam.totalQuestions}</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Total Questions
            </span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
            <Award size={18} className="mx-auto text-indigo-600 mb-1" />
            <span className="text-lg font-black text-slate-900 block">{exam.totalMarks} Marks</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Max Score
            </span>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
            <AlertTriangle size={18} className="mx-auto text-rose-500 mb-1" />
            <span className="text-lg font-black text-rose-600 block">
              +{exam.defaultMarksPerQuestion} / −{exam.defaultNegativeMarks}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              Marking Scheme
            </span>
          </div>
        </div>
      </div>

      {/* ── Section & Subject Blueprint Breakdown ─────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Layers size={18} className="text-indigo-600" />
          Subject & Section Structure
        </h3>
        <p className="text-xs text-slate-500 mb-6">
          The test contains {exam.sections?.length || 1} section(s) with dedicated timing and
          questions.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {(exam.sections || []).map((sec, idx) => (
            <div
              key={sec.id}
              className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5">
                  Section {idx + 1}
                </span>
                <span className="text-xs font-black text-slate-900">
                  {sec.totalQuestions} Questions
                </span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {sec.name || (sec as any).subject?.name || `Section ${idx + 1}`}
              </h4>
              <p className="text-[11px] text-slate-500">
                {(sec as any).subject?.name
                  ? `Subject: ${(sec as any).subject.name}`
                  : 'Core Exam Section'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Examination Guidelines ─────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText size={18} className="text-indigo-600" />
          Examination Guidelines & Rules
        </h3>

        <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
          <div className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span>
              <strong>Full-Screen Lock:</strong> The test runs in a distraction-free full-screen
              interface. Do not switch tabs or minimize the browser window.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span>
              <strong>Auto-Save:</strong> Your answers and time logs are saved continuously. In case
              of accidental disconnection, you can resume seamlessly.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span>
              <strong>Negative Marking:</strong> Each incorrect answer incurs a penalty of −
              {exam.defaultNegativeMarks} marks. Skip questions when unsure to preserve score.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="h-5 w-5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
              4
            </span>
            <span>
              <strong>Language Switching:</strong> You can switch question language dynamically
              during the test without losing answers or timer progress.
            </span>
          </div>
        </div>
      </div>

      {/* ── Language Selection Modal (Gate before starting attempt) ─ */}
      <ExamStartLanguageModal
        isOpen={showLangModal}
        examId={examId || ''}
        examTitle={exam.title}
        onClose={() => setShowLangModal(false)}
        onConfirmStart={async (chosenLangId) => {
          if (!examId) return;
          setStartError(null);
          const res = await startAttemptAPI(examId, chosenLangId);
          const createdAttemptId =
            res.data?.attemptId || (res.data as any)?.id;
          if (createdAttemptId) {
            setShowLangModal(false);
            navigate(`/exam/${examId}/attempt/${createdAttemptId}`);
          } else {
            const err =
              (res.response?.data as any)?.message ||
              'Failed to start examination.';
            setStartError(err);
          }
        }}
        isStarting={isStarting}
        startError={startError}
      />
    </div>
  );
};

export default StudentExamDetailsPage;
