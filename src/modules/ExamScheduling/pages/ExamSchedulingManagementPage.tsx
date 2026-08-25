import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock,
  Send,
  ShieldCheck,
  Zap,
  RotateCcw,
  History,
  XCircle,
  Clock,
  Layers,
  Server,
} from 'lucide-react';
import { useGetAllExamsAPI } from '@/modules/ExamGenerator/services/examGenerator.service';
import {
  useSubmitExamAPI,
  useApproveExamAPI,
  useActivateExamAPI,
  useCancelExamAPI,
} from '../services/examScheduling.service';
import { ScheduleExamModal } from '../components/ScheduleExamModal';
import { RescheduleExamModal } from '../components/RescheduleExamModal';
import { ExamLifecycleTimelineModal } from '../components/ExamLifecycleTimelineModal';
import { ExamAccessCheckModal } from '../components/ExamAccessCheckModal';
import type { ExamScheduleItem } from '../types/examScheduling.types';
import Button from '@/components/ui/Button';

const LIFECYCLE_STEPS = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'SCHEDULED',
  'ACTIVE',
  'ENDED',
  'COMPLETED',
];

const ExamSchedulingManagementPage: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isAccessCheckOpen, setIsAccessCheckOpen] = useState(false);

  const [activeExam, setActiveExam] = useState<any | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<ExamScheduleItem | null>(null);

  // APIs
  const { getAllExamsAPI, isLoading: isLoadingExams } = useGetAllExamsAPI();
  const { submitExamAPI } = useSubmitExamAPI();
  const { approveExamAPI } = useApproveExamAPI();
  const { activateExamAPI } = useActivateExamAPI();
  const { cancelExamAPI } = useCancelExamAPI();

  const loadExams = useCallback(async () => {
    const { data } = await getAllExamsAPI();
    if (data) setExams(data);
  }, [getAllExamsAPI]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // Actions
  const handleSubmitForApproval = async (examId: string) => {
    if (!window.confirm('Submit this exam for Super Admin review and approval?')) return;
    const { error } = await submitExamAPI(examId, { comment: 'Submitted by admin for review.' });
    if (error) {
      alert(typeof error === 'string' ? error : 'Failed to submit exam');
      return;
    }
    loadExams();
  };

  const handleApproveExam = async (examId: string) => {
    if (!window.confirm('Approve this exam? This certifies questions and enables scheduling.'))
      return;
    const { error } = await approveExamAPI(examId, { comment: 'Exam certified by Super Admin.' });
    if (error) {
      alert(typeof error === 'string' ? error : 'Failed to approve exam');
      return;
    }
    loadExams();
  };

  const handleActivateExam = async (scheduleId: string) => {
    if (
      !window.confirm(
        'Super Admin Activation: Students will be granted live access during the configured window. Proceed?',
      )
    )
      return;

    const { error } = await activateExamAPI(scheduleId);
    if (error) {
      alert(typeof error === 'string' ? error : 'Failed to activate exam schedule');
      return;
    }
    loadExams();
  };

  const handleCancelExam = async (examId: string) => {
    const reason = window.prompt('Enter cancellation reason (Audit log):');
    if (reason === null) return;

    const { error } = await cancelExamAPI(examId, reason || undefined);
    if (error) {
      alert(typeof error === 'string' ? error : 'Failed to cancel exam');
      return;
    }
    loadExams();
  };

  const filteredExams = exams.filter((exam) => {
    const stName = exam.status?.name || 'DRAFT';
    if (statusFilter === 'ALL') return true;
    return stName === statusFilter;
  });

  const getStatusBadge = (statusName: string) => {
    switch (statusName) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-4 ring-emerald-500/20';
      case 'SCHEDULED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'APPROVED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ENDED':
      case 'COMPLETED':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-500/20 mb-2">
            <CalendarClock size={13} />
            <span>State Machine & Access Policy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Exam Scheduling & Activation
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Enforce strict approval, timezone-aware scheduling, and Super Admin live window
            activation
          </p>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Examinations
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{exams.length}</span>
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">
            Approved (Ready to Schedule)
          </span>
          <span className="text-2xl font-black text-indigo-900 mt-1 block">
            {exams.filter((e) => e.status?.name === 'APPROVED').length}
          </span>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">
            Scheduled Windows
          </span>
          <span className="text-2xl font-black text-purple-900 mt-1 block">
            {exams.filter((e) => e.status?.name === 'SCHEDULED').length}
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Active Live Tests
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            {exams.filter((e) => e.status?.name === 'ACTIVE').length}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'SCHEDULED', 'ACTIVE', 'ENDED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl border transition-all shrink-0 ${
              statusFilter === st
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            {st} ({st === 'ALL' ? exams.length : exams.filter((e) => e.status?.name === st).length})
          </button>
        ))}
      </div>

      {/* Exams Grid */}
      {isLoadingExams ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-44 rounded-3xl bg-slate-200" />
          ))}
        </div>
      ) : filteredExams.length > 0 ? (
        <div className="space-y-4">
          {filteredExams.map((exam) => {
            const stName = exam.status?.name || 'DRAFT';
            const schedule = exam.schedules?.[0] as ExamScheduleItem | undefined;
            const currentStepIdx = LIFECYCLE_STEPS.indexOf(stName);

            return (
              <div
                key={exam.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-200 transition-all space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-extrabold text-slate-900">{exam.title}</h3>
                      <span
                        className={`rounded-lg px-2.5 py-0.5 text-xs font-black border ${getStatusBadge(
                          stName,
                        )}`}
                      >
                        {stName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-2">
                      <span>{exam.totalQuestions} Questions</span>
                      <span>•</span>
                      <span>{exam.durationMinutes} mins</span>
                      <span>•</span>
                      <span>Target: {exam.examTarget?.name || 'General'}</span>
                    </p>
                  </div>

                  {/* Top Right Quick Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveExam(exam);
                        setIsTimelineOpen(true);
                      }}
                      className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200"
                    >
                      <History size={13} />
                      <span>Audit Trail</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setActiveExam(exam);
                        setIsAccessCheckOpen(true);
                      }}
                      className="flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 border-indigo-200"
                    >
                      <Server size={13} />
                      <span>Test Student Access</span>
                    </Button>

                    {stName !== 'CANCELLED' && stName !== 'COMPLETED' && (
                      <button
                        onClick={() => handleCancelExam(exam.id)}
                        className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                        title="Cancel Exam"
                      >
                        <XCircle size={15} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stepper Progress Bar */}
                <div className="hidden sm:flex items-center justify-between gap-1 py-1">
                  {LIFECYCLE_STEPS.map((step, sIdx) => {
                    const isCompleted = currentStepIdx >= sIdx && stName !== 'CANCELLED';
                    const isCurrent = stName === step;

                    return (
                      <div key={step} className="flex-1 flex items-center gap-1.5">
                        <div
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black shrink-0 ${
                            isCurrent
                              ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                              : isCompleted
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {sIdx + 1}
                        </div>
                        <span
                          className={`text-[10px] font-bold truncate ${
                            isCurrent
                              ? 'text-indigo-900'
                              : isCompleted
                                ? 'text-emerald-800'
                                : 'text-slate-400'
                          }`}
                        >
                          {step}
                        </span>
                        {sIdx < LIFECYCLE_STEPS.length - 1 && (
                          <div
                            className={`flex-1 h-0.5 mx-1 rounded ${
                              isCompleted ? 'bg-emerald-400' : 'bg-slate-100'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Schedule Live Window Snapshot (if exists) */}
                {schedule && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-xs font-mono">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                        <Clock size={13} className="text-indigo-600" />
                        Live Window ({schedule.timezone})
                      </span>
                      <p className="text-slate-900 font-bold">
                        {new Date(schedule.startTime).toLocaleString()} —{' '}
                        {new Date(schedule.endTime).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2 py-1 text-indigo-700 font-bold border border-indigo-100">
                        <Layers size={12} />
                        Version #{schedule.examVersion?.versionNumber || 1}
                      </span>

                      {stName === 'SCHEDULED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveSchedule(schedule);
                            setIsRescheduleOpen(true);
                          }}
                          className="flex items-center gap-1 text-xs border-amber-200 text-amber-800 bg-amber-50 hover:bg-amber-100"
                        >
                          <RotateCcw size={12} />
                          <span>Reschedule</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Contextual Action CTAs */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  {stName === 'DRAFT' && (
                    <Button
                      size="sm"
                      onClick={() => handleSubmitForApproval(exam.id)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                    >
                      <Send size={13} />
                      <span>Submit for Super Admin Approval</span>
                    </Button>
                  )}

                  {stName === 'SUBMITTED' && (
                    <Button
                      size="sm"
                      onClick={() => handleApproveExam(exam.id)}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      <ShieldCheck size={14} />
                      <span>Super Admin Approve Exam</span>
                    </Button>
                  )}

                  {stName === 'APPROVED' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setActiveExam(exam);
                        setIsScheduleOpen(true);
                      }}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
                    >
                      <CalendarClock size={14} />
                      <span>Schedule Live Window</span>
                    </Button>
                  )}

                  {stName === 'SCHEDULED' && schedule && (
                    <Button
                      size="sm"
                      onClick={() => handleActivateExam(schedule.id)}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-200 animate-pulse"
                    >
                      <Zap size={14} />
                      <span>Super Admin Explicit Activation</span>
                    </Button>
                  )}

                  {stName === 'ACTIVE' && (
                    <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>LIVE EXAM ACTIVE FOR STUDENTS</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-slate-300 bg-white text-center space-y-3">
          <CalendarClock size={32} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800">No Examinations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Create an exam to begin the lifecycle authoring, approval, and scheduling workflow.
          </p>
        </div>
      )}

      {/* Modals */}
      {activeExam && (
        <ScheduleExamModal
          examId={activeExam.id}
          examTitle={activeExam.title}
          isOpen={isScheduleOpen}
          onClose={() => setIsScheduleOpen(false)}
          onScheduled={loadExams}
        />
      )}

      <RescheduleExamModal
        schedule={activeSchedule}
        isOpen={isRescheduleOpen}
        onClose={() => setIsRescheduleOpen(false)}
        onRescheduled={loadExams}
      />

      {activeExam && (
        <ExamLifecycleTimelineModal
          examId={activeExam.id}
          examTitle={activeExam.title}
          isOpen={isTimelineOpen}
          onClose={() => setIsTimelineOpen(false)}
        />
      )}

      {activeExam && (
        <ExamAccessCheckModal
          examId={activeExam.id}
          examTitle={activeExam.title}
          isOpen={isAccessCheckOpen}
          onClose={() => setIsAccessCheckOpen(false)}
        />
      )}
    </div>
  );
};

export default ExamSchedulingManagementPage;
