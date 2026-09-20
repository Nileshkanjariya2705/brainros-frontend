import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CalendarClock,
  Send,
  ShieldCheck,
  Zap,
  XCircle,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useExamManagerExamsQuery } from '@/modules/ExamManager/services/examManager.queries';
import {
  useSubmitExamMutation,
  useApproveExamMutation,
  useActivateExamMutation,
  useCancelExamMutation,
} from '../services/examScheduling.queries';
import { toast } from '@/utils/toast';
import { ScheduleExamModal } from '../components/ScheduleExamModal';
import { ExamLifecycleTimelineModal } from '../components/ExamLifecycleTimelineModal';
import { ExamAccessCheckModal } from '../components/ExamAccessCheckModal';
import type { ExamScheduleItem } from '../types/examScheduling.types';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import { WorkflowStepIndicator, type WorkflowStep } from '@/components/ui/WorkflowStepIndicator';

const LIFECYCLE_STEPS = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'SCHEDULED',
  'ACTIVE',
  'ENDED',
];

export const ExamSchedulingManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine dynamic dashboard route prefix based on active URL
  const pathname = location.pathname;
  const firstSegment = pathname.split('/')[1] || 'admin';
  const routePrefix = [
    'admin',
    'general-manager',
    'manager',
    'operator',
    'staff',
  ].includes(firstSegment)
    ? `/${firstSegment}`
    : '/admin';

  // State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(5);

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'schedule-exam',
      stepNumber: 1,
      title: 'Schedule Official Exam',
      subtitle: 'Date, shift, time & eligibility',
      status: 'current',
      to: `${routePrefix}/exams/schedule`,
    },
    {
      id: 'upload-paper',
      stepNumber: 2,
      title: 'Question Paper Upload',
      subtitle: 'Upload questions or manual entry',
      status: 'pending',
      to: `${routePrefix}/exam-manager/upload`,
    },
    // {
    //   id: 'exam-results',
    //   stepNumber: 3,
    //   title: 'Automated Evaluation & Results',
    //   subtitle: 'Automatic evaluation & Super Admin publication',
    //   status: 'pending',
    //   to: `${routePrefix}/reports`,
    // },
  ];

  // Modals
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [isAccessCheckOpen, setIsAccessCheckOpen] = useState(false);

  const [activeExam, setActiveExam] = useState<any | null>(null);

  // TanStack Query & Mutations
  const {
    data: examData,
    isLoading: isLoadingExams,
    isFetching: isFetchingExams,
    refetch: refetchExams,
  } = useExamManagerExamsQuery({
    page,
    limit,
    status: statusFilter !== 'ALL' ? statusFilter : undefined,
    search: search.trim() || undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const exams = examData?.items || [];
  const pagination = examData?.pagination || {
    total: 0,
    page: 1,
    limit: 5,
    totalPages: 1,
  };

  const submitMutation = useSubmitExamMutation();
  const approveMutation = useApproveExamMutation();
  const activateMutation = useActivateExamMutation();
  const cancelMutation = useCancelExamMutation();

  // Actions
  const handleSubmitForApproval = async (examId: string) => {
    if (!window.confirm('Submit this exam for Super Admin review and approval?')) return;
    try {
      await submitMutation.mutateAsync({ examId, payload: { comment: 'Submitted by admin for review.' } });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to submit exam');
    }
  };

  const handleApproveExam = async (examId: string) => {
    if (!window.confirm('Approve this exam? This certifies questions and enables scheduling.'))
      return;
    try {
      await approveMutation.mutateAsync({ examId, payload: { comment: 'Exam certified by Super Admin.' } });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to approve exam');
    }
  };

  const handleActivateExam = async (scheduleId: string, questionCount: number = 0) => {
    if (questionCount === 0) {
      alert(
        'Cannot activate exam: No question paper has been uploaded for this exam yet.\n\nPlease upload the question paper via Question Paper Manager before activating.',
      );
      return;
    }

    if (
      !window.confirm(
        'Super Admin Activation: Students will be granted live access during the configured window. Proceed?',
      )
    )
      return;

    try {
      await activateMutation.mutateAsync(scheduleId);
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to activate exam schedule');
    }
  };

  const handleCancelExam = async (examId: string, examTitle?: string) => {
    const reason = window.prompt(
      `Cancel "${examTitle || 'this exam'}"?\n\nThis will cancel all live schedules and immediately notify all students.\n\nPlease enter the cancellation reason:`,
    );
    if (reason === null) return;

    try {
      await cancelMutation.mutateAsync({ examId, reason: reason || undefined });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to cancel exam');
    }
  };

  const filteredExams = exams;

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
      {/* Workflow Step Indicator */}
      <WorkflowStepIndicator
        steps={workflowSteps}
        workflowTitle="Admin Examination Lifecycle & Setup"
      />

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

        <Button
          onClick={() => navigate(`${routePrefix}/exams/schedule`)}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200 shrink-0"
        >
          <CalendarClock size={16} />
          <span>Schedule Exam</span>
        </Button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Examinations
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{pagination.total || exams.length}</span>
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">
            Approved (Ready to Schedule)
          </span>
          <span className="text-2xl font-black text-indigo-900 mt-1 block">
            {exams.filter((e: any) => (typeof e.status === 'string' ? e.status : e.status?.name) === 'APPROVED').length}
          </span>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">
            Scheduled Windows
          </span>
          <span className="text-2xl font-black text-purple-900 mt-1 block">
            {exams.filter((e: any) => (typeof e.status === 'string' ? e.status : e.status?.name) === 'SCHEDULED').length}
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Active Live Tests
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            {exams.filter((e: any) => (typeof e.status === 'string' ? e.status : e.status?.name) === 'ACTIVE').length}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
          {['ALL', 'DRAFT', 'SUBMITTED', 'APPROVED', 'SCHEDULED', 'ACTIVE', 'ENDED'].map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl border transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search exams by title..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500 transition"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Exams Grid */}
      {(isLoadingExams || isFetchingExams) ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 animate-pulse">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-6 w-48 rounded-lg" />
                    <Skeleton className="h-5 w-20 rounded-lg" />
                    <Skeleton className="h-5 w-24 rounded-lg" />
                  </div>
                  <Skeleton className="h-4 w-72 rounded" />
                </div>
                <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
              </div>
              <Skeleton className="h-14 w-full rounded-2xl" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-9 w-32 rounded-xl" />
                <Skeleton className="h-9 w-28 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredExams.length > 0 ? (
        <div className="space-y-4">
          {filteredExams.map((exam: any) => {
            const stName = typeof exam.status === 'string' ? exam.status : exam.status?.name || 'DRAFT';
            const schedule = (exam.schedules?.[0] || exam.schedule) as ExamScheduleItem | undefined;
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
                      <button
                        onClick={() => navigate(`/admin/exams/${exam.id}/manage`)}
                        className="text-base font-extrabold text-slate-900 hover:text-indigo-600 transition-colors text-left"
                      >
                        {exam.title}
                      </button>
                      <span
                        className={`rounded-lg px-2.5 py-0.5 text-xs font-black border ${getStatusBadge(
                          stName,
                        )}`}
                      >
                        {stName}
                      </span>
                      <span className="rounded-lg px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        Type: {exam.examType || exam.type || 'Standard'}
                      </span>
                      {(exam._count?.examQuestions || exam.totalQuestions || 0) > 0 ? (
                        <span className="rounded-lg px-2 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 size={11} /> Paper: Uploaded ({exam._count?.examQuestions || exam.totalQuestions} Qs)
                        </span>
                      ) : (
                        <span className="rounded-lg px-2 py-0.5 text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                          <AlertCircle size={11} /> Paper: Not Uploaded
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-2 flex-wrap">
                      <span>Subject: {exam.subject?.name || exam.subjectName || 'All Subjects'}</span>
                      {exam.chapter?.name && (
                        <>
                          <span>•</span>
                          <span>Chapter: {exam.chapter.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{exam.totalQuestions || 0} Questions</span>
                      <span>•</span>
                      <span>{exam.durationMinutes} mins</span>
                      <span>•</span>
                      <span>Target: {exam.examTarget?.name || 'General'}</span>
                    </p>
                  </div>

                  {/* Top Right Quick Actions */}
                  {stName !== 'CANCELLED' && stName !== 'COMPLETED' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleCancelExam(exam.id, exam.title)}
                        className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                        title="Cancel Exam"
                      >
                        <XCircle size={15} />
                      </button>
                    </div>
                  )}
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
                      onClick={() =>
                        handleActivateExam(schedule.id, exam._count?.examQuestions || 0)
                      }
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

          {/* Pagination Controls */}
          {pagination.total > 0 && (
            <div className="mt-4">
              <Pagination
                page={page}
                totalPages={pagination.totalPages}
                total={pagination.total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(newLimit) => {
                  setLimit(newLimit);
                  setPage(1);
                }}
                limitOptions={[5, 10, 20, 50]}
                isFetching={isFetchingExams}
                itemName="examinations"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-slate-300 bg-white text-center space-y-3">
          <CalendarClock size={32} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-800">No Examinations Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {search || statusFilter !== 'ALL'
              ? 'No examinations matched your search criteria or status filter. Try clearing filters.'
              : 'Create an exam to begin the lifecycle authoring, approval, and scheduling workflow.'}
          </p>
        </div>
      )}

      {/* Modals */}
      {isScheduleOpen && (
        <ScheduleExamModal
          examId={activeExam?.id}
          examTitle={activeExam?.title}
          examDuration={activeExam?.durationMinutes}
          examsList={exams}
          onSelectExam={setActiveExam}
          isOpen={isScheduleOpen}
          onClose={() => {
            setIsScheduleOpen(false);
            setActiveExam(null);
          }}
          onScheduled={refetchExams}
        />
      )}

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
