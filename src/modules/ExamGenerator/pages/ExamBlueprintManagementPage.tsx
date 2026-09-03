import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Play, Trash2, Eye, Lock, Sliders, Pencil } from 'lucide-react';
import {
  useGetAllExamsAPI,
  useGetExamBlueprintsAPI,
  useDeleteBlueprintAPI,
} from '../services/examGenerator.service';
import type { ExamBlueprintItem } from '../types/examGenerator.types';
import type { Exam } from '@/types/exam.types';
import { BlueprintBuilderModal } from '../components/BlueprintBuilderModal';
import { BlueprintValidationModal } from '../components/BlueprintValidationModal';
import { BlueprintDetailsModal } from '../components/BlueprintDetailsModal';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';

const ExamBlueprintManagementPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [blueprints, setBlueprints] = useState<ExamBlueprintItem[]>([]);

  // Modals
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderMode, setBuilderMode] = useState<'create' | 'edit'>('create');
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeBlueprint, setActiveBlueprint] = useState<ExamBlueprintItem | null>(null);

  // APIs
  const { getAllExamsAPI } = useGetAllExamsAPI();
  const { getExamBlueprintsAPI, isLoading: isLoadingBlueprints } = useGetExamBlueprintsAPI();
  const { deleteBlueprintAPI } = useDeleteBlueprintAPI();

  // 1. Fetch available exams list
  useEffect(() => {
    getAllExamsAPI().then(({ data }) => {
      if (data && data.length > 0) {
        setExams(data);
        if (!selectedExamId) {
          setSelectedExamId(data[0].id);
        }
      }
    });
  }, [getAllExamsAPI, selectedExamId]);

  // 2. Fetch blueprints when selectedExamId changes
  const loadExamData = useCallback(async () => {
    if (!selectedExamId) return;

    const bpRes = await getExamBlueprintsAPI(selectedExamId);
    if (bpRes.data) setBlueprints(bpRes.data);
  }, [selectedExamId, getExamBlueprintsAPI]);

  useEffect(() => {
    loadExamData();
  }, [loadExamData]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  const handleCreateBlueprint = () => {
    setBuilderMode('create');
    setActiveBlueprint(null);
    setIsBuilderOpen(true);
  };

  const handleEditBlueprint = (bp: ExamBlueprintItem) => {
    setBuilderMode('edit');
    setActiveBlueprint(bp);
    setIsBuilderOpen(true);
  };

  const handleDeleteBlueprint = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blueprint?')) return;
    const { error } = await deleteBlueprintAPI(id);
    if (error) {
      toast.error(typeof error === 'string' ? error : 'Cannot delete blueprint');
      return;
    }
    toast.success('Blueprint deleted successfully.');
    loadExamData();
  };

  const handleInspectBlueprint = (bp: ExamBlueprintItem) => {
    setActiveBlueprint(bp);
    setIsDetailsOpen(true);
  };

  const handleValidateAndGenerate = (bp: ExamBlueprintItem) => {
    setActiveBlueprint(bp);
    setIsValidationOpen(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-500/20 mb-2">
            <Sliders size={13} />
            <span>Curriculum Blueprint Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Exam Blueprints
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure, inspect, and manage automated question allocation blueprints
          </p>
        </div>

        {/* Create Blueprint Action */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={handleCreateBlueprint}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
          >
            <Plus size={16} />
            <span>Create New Blueprint</span>
          </Button>
        </div>
      </div>

      {/* Target Exam Filter Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-extrabold text-slate-600 uppercase tracking-wider shrink-0">
            Target Exam:
          </span>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
          >
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.totalQuestions} Questions | {exam.durationMinutes} mins)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
          <Layers size={15} className="text-indigo-600" />
          <span>Showing {blueprints.length} Configured Blueprint(s)</span>
        </div>
      </div>

      {/* Blueprints Grid List */}
      <div className="space-y-4">
        {isLoadingBlueprints ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-3xl bg-slate-200/70" />
            ))}
          </div>
        ) : blueprints.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {blueprints.map((bp) => (
              <div
                key={bp.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-200 transition-all space-y-4"
              >
                {/* Card Title Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white font-extrabold text-sm shadow-md shadow-indigo-200">
                      v{bp.version}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-extrabold text-slate-900">{bp.name}</h3>
                        {bp.isSystem && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                            <Lock size={10} />
                            Locked Template
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Target:{' '}
                        <strong className="text-slate-800 font-bold">
                          {bp.totalQuestions} Questions
                        </strong>{' '}
                        • {bp.rules?.length || 0} Distribution Rules
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* View Blueprint Details */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInspectBlueprint(bp)}
                      className="flex items-center gap-1.5 text-xs border-slate-200 text-slate-700 bg-slate-50/70 hover:bg-slate-100"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </Button>

                    {/* Edit Blueprint */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditBlueprint(bp)}
                      className="flex items-center gap-1.5 text-xs border-indigo-200 text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 font-bold"
                    >
                      <Pencil size={13} />
                      <span>Edit</span>
                    </Button>

                    {/* Validate & Generate Exam */}
                    <Button
                      size="sm"
                      onClick={() => handleValidateAndGenerate(bp)}
                      className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Validate & Generate</span>
                    </Button>

                    {/* Delete Blueprint Template */}
                    <button
                      onClick={() => handleDeleteBlueprint(bp.id)}
                      className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                      title="Delete Blueprint Template"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Rules Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {bp.rules?.map((rule, rIdx) => (
                    <div
                      key={rule.id || rIdx}
                      className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-slate-900 truncate">
                          {rule.subject?.name || 'Any Subject'}
                        </span>
                        {rule.difficultyLevel && (
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                              rule.difficultyLevel === 'EASY'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rule.difficultyLevel === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {rule.difficultyLevel}
                          </span>
                        )}
                      </div>

                      <span className="font-mono font-extrabold text-indigo-700 shrink-0">
                        {rule.selectionCount
                          ? `${rule.selectionCount} Qs`
                          : `${rule.selectionPercentage}%`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-slate-300 bg-white text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <Layers size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Blueprints Configured</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              Create a blueprint rule specification for {selectedExam?.title || 'this exam'} to
              start generating automated tests.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateBlueprint}
              className="mt-2"
            >
              <Plus size={14} className="mr-1" /> Create Blueprint
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <BlueprintBuilderModal
        examId={selectedExamId}
        examTitle={selectedExam?.title}
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSaved={loadExamData}
        blueprint={activeBlueprint}
        mode={builderMode}
      />

      <BlueprintDetailsModal
        blueprint={activeBlueprint}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onValidateAndGenerate={handleValidateAndGenerate}
      />

      {activeBlueprint && (
        <BlueprintValidationModal
          blueprintId={activeBlueprint.id}
          blueprintName={activeBlueprint.name}
          isOpen={isValidationOpen}
          onClose={() => setIsValidationOpen(false)}
          onGenerateSuccess={loadExamData}
        />
      )}
    </div>
  );
};

export default ExamBlueprintManagementPage;
