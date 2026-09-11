// ** Packages **
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  History,
  RotateCcw,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  Loader2,
  PlayCircle,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';

// ** Services & Types **
import {
  type MockTestAttemptItem,
  type MockTestAttemptsSummary,
} from '../services';
import { useMockTestAttemptsQuery } from '../services/exams.queries';

interface MockAttemptsModalProps {
  isOpen: boolean;
  mockTestId: string;
  mockTestTitle?: string;
  onClose: () => void;
  onRetakeTest: (testId: string) => void;
  onResumeTest?: (testId: string, attemptId: string) => void;
}

export const MockAttemptsModal: React.FC<MockAttemptsModalProps> = ({
  isOpen,
  mockTestId,
  mockTestTitle,
  onClose,
  onRetakeTest,
  onResumeTest,
}) => {
  const navigate = useNavigate();
  const { data: attemptsData, isLoading, error: queryError, refetch } = useMockTestAttemptsQuery(isOpen ? mockTestId : undefined);

  const attempts: MockTestAttemptItem[] = Array.isArray((attemptsData as any)?.data)
    ? (attemptsData as any).data
    : Array.isArray(attemptsData)
      ? attemptsData
      : [];
  const summary: MockTestAttemptsSummary | null = (attemptsData as any)?.summary || null;
  const fetchError = queryError ? (queryError as any)?.response?.data?.message || (queryError as any)?.message || 'Failed to load attempt history.' : null;

  if (!isOpen) return null;

  const formatSeconds = (sec: number | null | undefined) => {
    if (sec === null || sec === undefined || sec <= 0) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s > 0 ? `${s}s` : ''}`;
  };

  const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const activeAttempt = summary?.activeAttempt;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient */}
        <div className="h-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-500 w-full" />

        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
              <History size={15} />
              <span>Mock Test Attempt History</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {summary?.title || mockTestTitle || 'Mock Examination'}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-semibold pt-1">
              <span>{summary?.totalQuestions ?? '—'} Questions</span>
              <span>•</span>
              <span>{summary?.totalMarks ?? '—'} Marks</span>
              <span>•</span>
              <span>{summary?.durationMinutes ?? '—'} Minutes</span>
              {summary?.examTarget && (
                <>
                  <span>•</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    {typeof summary.examTarget === 'object'
                      ? (summary.examTarget as any)?.name
                      : summary.examTarget}
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Performance Highlights Bar */}
        {summary && (
          <div className="grid grid-cols-3 gap-2 bg-purple-50/50 dark:bg-purple-950/20 px-6 py-3 border-b border-purple-100/60 dark:border-purple-900/40 text-center text-xs">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Total Attempts
              </p>
              <p className="text-sm font-black text-purple-700 dark:text-purple-300">
                {summary.totalAttempts}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Best Score
              </p>
              <p className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                {summary.bestScore !== null ? `${summary.bestScore} / ${summary.totalMarks}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                Latest Score
              </p>
              <p className="text-sm font-black text-indigo-700 dark:text-indigo-400">
                {summary.latestScore !== null ? `${summary.latestScore} / ${summary.totalMarks}` : '—'}
              </p>
            </div>
          </div>
        )}

        {/* Modal Body: Attempts List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <Loader2 className="h-7 w-7 animate-spin text-purple-600" />
              <p className="text-xs font-semibold">Loading attempt history...</p>
            </div>
          ) : fetchError ? (
            <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-4 border border-rose-200 dark:border-rose-800 text-center space-y-2">
              <AlertCircle className="h-6 w-6 text-rose-600 dark:text-rose-400 mx-auto" />
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">{fetchError}</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl text-xs">
                Retry
              </Button>
            </div>
          ) : attempts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500">
              <Award className="h-10 w-10 text-purple-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No attempts recorded yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Take this mock test to start tracking your performance.
              </p>
            </div>
          ) : (
            attempts.map((att) => {
              const isInProg = att.isInProgress;
              return (
                <div
                  key={att.attemptId}
                  className={`rounded-2xl border p-4 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isInProg
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 shadow-sm'
                      : att.isBest
                        ? 'border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Badge Row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-lg bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-black text-slate-800 dark:text-slate-200">
                        Attempt #{att.attemptNumber}
                      </span>

                      {att.isLatest && (
                        <span className="rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 text-[10px] font-extrabold">
                          Latest
                        </span>
                      )}

                      {att.isBest && att.score !== null && (
                        <span className="rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-extrabold flex items-center gap-1">
                          <CheckCircle2 size={10} /> Best
                        </span>
                      )}

                      {isInProg ? (
                        <span className="rounded-md bg-amber-200/80 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 px-2 py-0.5 text-[10px] font-extrabold animate-pulse">
                          In Progress
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 text-[10px] font-semibold">
                          {att.status}
                        </span>
                      )}
                    </div>

                    {/* Date and Time Details */}
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <Clock size={12} className="text-slate-400" />
                      <span>{formatDate(att.submittedAt || att.startedAt)}</span>
                      {att.timeUsedSeconds && (
                        <>
                          <span>•</span>
                          <span>Time: {formatSeconds(att.timeUsedSeconds)}</span>
                        </>
                      )}
                    </p>

                    {/* Metrics Grid */}
                    {!isInProg && att.score !== null && (
                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold pt-1">
                        <span className="text-slate-900 dark:text-white">
                          Score: <span className="text-purple-600 dark:text-purple-400">{att.score}</span> / {att.maxScore}
                        </span>
                        {att.percentage !== null && (
                          <span className="text-slate-600 dark:text-slate-300">
                            {att.percentage.toFixed(2)}%
                          </span>
                        )}
                        {att.accuracy !== null && (
                          <span className="text-slate-600 dark:text-slate-300">
                            Accuracy: <span className="text-emerald-600 dark:text-emerald-400">{att.accuracy.toFixed(2)}%</span>
                          </span>
                        )}
                        {att.rank !== null && (
                          <span className="text-indigo-600 dark:text-indigo-400">
                            Rank: #{att.rank}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions for this Attempt */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {isInProg ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onClose();
                          if (onResumeTest) {
                            onResumeTest(mockTestId, att.attemptId);
                          } else {
                            navigate(`/exam/${mockTestId}/attempt/${att.attemptId}`);
                          }
                        }}
                        className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1.5"
                      >
                        <RotateCcw size={13} />
                        Resume Test
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onClose();
                          navigate(`/exam/result/${att.attemptId}`);
                        }}
                        className="rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 flex items-center gap-1"
                      >
                        <span>View Result</span>
                        <ArrowRight size={12} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs font-bold">
            Close
          </Button>

          {activeAttempt ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                if (onResumeTest) {
                  onResumeTest(mockTestId, activeAttempt.attemptId);
                } else {
                  navigate(`/exam/${mockTestId}/attempt/${activeAttempt.attemptId}`);
                }
              }}
              className="rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-200 dark:shadow-none flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              Resume In-Progress Attempt
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                onClose();
                onRetakeTest(mockTestId);
              }}
              className="rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200 dark:shadow-none flex items-center gap-1.5"
            >
              <PlayCircle size={14} />
              Give Test Again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
