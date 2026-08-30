import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Plus,
  LoaderCircle,
  Clock,
  Layers,
  AlertCircle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  useGetAllExamsAPI,
  useCreateExamFromTemplateAPI,
  useDeleteExamAPI,
} from '@/modules/ExamGenerator/services/examGenerator.service';
import { useAxiosGet } from '@/hooks/useAxios';
import Button from '@/components/ui/Button';

export const ExamManagementPage: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [examTargets, setExamTargets] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Form states
  const [title, setTitle] = useState('');
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // APIs
  const { getAllExamsAPI, isLoading: isLoadingExams } = useGetAllExamsAPI();
  const { createExamFromTemplateAPI, isLoading: isCreating } = useCreateExamFromTemplateAPI();
  const { deleteExamAPI } = useDeleteExamAPI();
  const [getReq] = useAxiosGet();

  const loadExams = useCallback(async () => {
    const { data } = await getAllExamsAPI();
    if (data) setExams(data);
  }, [getAllExamsAPI]);

  // Load options & initial exams list
  useEffect(() => {
    loadExams();

    // Fetch exam targets from options API
    getReq<any>('/auth/options').then(({ data }) => {
      const opts = data?.examTargets ? data : (data as any)?.data || {};
      if (opts.examTargets) {
        setExamTargets(opts.examTargets);
      }
    });
  }, [loadExams, getReq]);

  // Dynamic Polling: if any exam is in GENERATING status, poll every 3 seconds
  useEffect(() => {
    const hasGenerating = exams.some((e) => e.status?.name === 'GENERATING');
    if (!hasGenerating) return;

    const interval = setInterval(() => {
      loadExams();
    }, 3000);

    return () => clearInterval(interval);
  }, [exams, loadExams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please enter an exam title.');
      return;
    }
    if (!selectedTargetId) {
      setFormError('Please select an exam target type.');
      return;
    }

    const { error } = await createExamFromTemplateAPI({
      title: title.trim(),
      examTargetId: selectedTargetId,
      description: description.trim() || undefined,
    });

    if (error) {
      setFormError(typeof error === 'string' ? error : 'Failed to generate exam');
      return;
    }

    // Success! Reset form & close modal
    setTitle('');
    setSelectedTargetId('');
    setDescription('');
    setIsModalOpen(false);
    loadExams();
  };

  const handleDeleteExam = async (examId: string, examTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete exam "${examTitle}"?`)) {
      return;
    }
    const { error } = await deleteExamAPI(examId);
    if (error) {
      alert(typeof error === 'string' ? error : 'Failed to delete exam');
      return;
    }
    loadExams();
  };

  // Status badging styles
  const getStatusBadge = (statusName: string) => {
    switch (statusName) {
      case 'GENERATING':
        return 'bg-amber-100 text-amber-800 border-amber-300 ring-2 ring-amber-400/20';
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20';
      case 'SCHEDULED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'APPROVED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const filteredExams = exams.filter((exam) => {
    const stName = exam.status?.name || 'DRAFT';
    if (statusFilter === 'ALL') return true;
    return stName === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-500/20 mb-2">
            <Sparkles size={13} className="text-indigo-600 animate-pulse" />
            <span>Predefined Blueprints & Background Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mock Test Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Instantly generate and manage multi-subject mock tests from academic blueprints
          </p>
        </div>

        <Button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
        >
          <Plus size={16} />
          <span>Generate Mock Test from Blueprint</span>
        </Button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Generated
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{exams.length}</span>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-amber-50/20 p-5 shadow-sm">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
            Generating In Background
          </span>
          <span className="text-2xl font-black text-amber-900 mt-1 block flex items-center gap-2">
            {exams.filter((e) => e.status?.name === 'GENERATING').length}
            {exams.some((e) => e.status?.name === 'GENERATING') && (
              <LoaderCircle size={18} className="animate-spin text-amber-600" />
            )}
          </span>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Draft Presets
          </span>
          <span className="text-2xl font-black text-slate-700 mt-1 block">
            {exams.filter((e) => e.status?.name === 'DRAFT').length}
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Active Tests
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            {exams.filter((e) => e.status?.name === 'ACTIVE').length}
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
        {['ALL', 'GENERATING', 'DRAFT', 'SUBMITTED', 'APPROVED', 'ACTIVE', 'CANCELLED'].map(
          (st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-2xl px-4 py-2 border transition-all shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 border-slate-900 text-white shadow-sm shadow-slate-950/10'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ),
        )}
      </div>

      {/* Exams Grid */}
      {isLoadingExams && exams.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-3xl bg-slate-100 animate-pulse border border-slate-200"
            />
          ))}
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50/30 py-16 px-4 text-center">
          <FileSpreadsheet size={38} className="text-slate-400 mb-3" />
          <h3 className="text-base font-extrabold text-slate-800">No Exams Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Create a mock exam using the JEE, NEET, or CAT templates above to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredExams.map((exam) => {
            const isGenerating = exam.status?.name === 'GENERATING';
            return (
              <div
                key={exam.id}
                className={`rounded-3xl border bg-white p-6 shadow-sm hover:border-indigo-200 transition-all flex flex-col justify-between gap-4 ${
                  isGenerating ? 'border-amber-200 bg-amber-50/5' : 'border-slate-200/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="rounded-xl bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700 border border-indigo-100">
                      {exam.examTarget?.name || 'TARGET'}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-bold ${getStatusBadge(
                        exam.status?.name,
                      )}`}
                    >
                      {isGenerating && (
                        <LoaderCircle size={12} className="animate-spin text-amber-600" />
                      )}
                      {exam.status?.name || 'DRAFT'}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 tracking-tight mt-3">
                    {exam.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {exam.description || 'No description provided.'}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4 flex flex-wrap justify-between items-center gap-3 text-xs">
                  <div className="flex items-center gap-4 text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Layers size={13} />
                      {exam.totalQuestions} Questions
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} />
                      {exam.durationMinutes} Mins
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isGenerating && (
                      <span className="text-[10px] font-bold text-amber-600 animate-pulse bg-amber-50 border border-amber-100 rounded-lg px-2 py-0.5">
                        BullMQ Queueing...
                      </span>
                    )}

                    <button
                      onClick={() => handleDeleteExam(exam.id, exam.title)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                      title="Delete Exam"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => !isCreating && setIsModalOpen(false)}
          />

          <div className="relative w-full max-w-lg transform overflow-hidden rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100 space-y-4">
            <h2 className="text-xl font-extrabold text-slate-950 flex items-center gap-2">
              <Sparkles size={20} className="text-indigo-600 animate-pulse" />
              <span>Create Mock Exam from Preset</span>
            </h2>
            <p className="text-xs text-slate-500">
              Select one of the default standard templates. The backend worker will automatically
              choose the blueprint, randomize questions, and build the sections in the background.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Exam Title</label>
                <input
                  type="text"
                  placeholder="e.g. NEET-UG 2026 Grand Mock Test 1"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isCreating}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-indigo-500 focus:outline-none disabled:bg-slate-50"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Select Exam Presets / Target
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  disabled={isCreating}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-indigo-500 focus:outline-none disabled:bg-slate-50 bg-white"
                  required
                >
                  <option value="">-- Choose Exam Target --</option>
                  {examTargets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Preset:{' '}
                      {t.name === 'JEE'
                        ? '75 Qs / 3 Hrs'
                        : t.name === 'NEET'
                          ? '180 Qs / 3.3 Hrs'
                          : '68 Qs / 2 Hrs'}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Description (Optional)
                </label>
                <textarea
                  placeholder="Enter brief description or instructions..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isCreating}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold focus:border-indigo-500 focus:outline-none disabled:bg-slate-50 h-20 resize-none"
                />
              </div>

              {formError && (
                <div className="rounded-2xl bg-rose-50 border border-rose-100 p-3.5 flex items-start gap-2.5 text-xs text-rose-700 font-bold">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isCreating}
                  className="rounded-2xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-5 py-2 text-xs font-bold shadow-md shadow-slate-900/10"
                >
                  {isCreating ? (
                    <>
                      <LoaderCircle size={14} className="animate-spin" />
                      <span>Submitting to Queue...</span>
                    </>
                  ) : (
                    <span>Create & Generate</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ExamManagementPage;
