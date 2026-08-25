import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Play, Trash2, Eye, FileCheck2, Sliders, Lock } from 'lucide-react';
import {
  useGetAllExamsAPI,
  useGetExamBlueprintsAPI,
  useDeleteBlueprintAPI,
  useGetExamVersionsAPI,
  usePublishExamVersionAPI,
} from '../services/examGenerator.service';
import type { ExamBlueprintItem, ExamVersionItem } from '../types/examGenerator.types';
import type { Exam } from '@/types/exam.types';
import { BlueprintBuilderModal } from '../components/BlueprintBuilderModal';
import { BlueprintValidationModal } from '../components/BlueprintValidationModal';
import { ExamVersionQuestionsModal } from '../components/ExamVersionQuestionsModal';
import Button from '@/components/ui/Button';

const ExamBlueprintManagementPage: React.FC = () => {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'BLUEPRINTS' | 'VERSIONS'>('BLUEPRINTS');

  // Blueprints & Versions Data
  const [blueprints, setBlueprints] = useState<ExamBlueprintItem[]>([]);
  const [versions, setVersions] = useState<ExamVersionItem[]>([]);

  // Modals
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [isQuestionsOpen, setIsQuestionsOpen] = useState(false);
  const [activeBlueprint, setActiveBlueprint] = useState<ExamBlueprintItem | null>(null);
  const [activeVersion, setActiveVersion] = useState<ExamVersionItem | null>(null);

  // APIs
  const { getAllExamsAPI } = useGetAllExamsAPI();
  const { getExamBlueprintsAPI, isLoading: isLoadingBlueprints } = useGetExamBlueprintsAPI();
  const { deleteBlueprintAPI } = useDeleteBlueprintAPI();
  const { getExamVersionsAPI, isLoading: isLoadingVersions } = useGetExamVersionsAPI();
  const { publishExamVersionAPI } = usePublishExamVersionAPI();

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

  // 2. Fetch blueprints and versions when selectedExamId changes
  const loadExamData = useCallback(async () => {
    if (!selectedExamId) return;

    const [bpRes, verRes] = await Promise.all([
      getExamBlueprintsAPI(selectedExamId),
      getExamVersionsAPI(selectedExamId),
    ]);

    if (bpRes.data) setBlueprints(bpRes.data);
    if (verRes.data) setVersions(verRes.data);
  }, [selectedExamId, getExamBlueprintsAPI, getExamVersionsAPI]);

  useEffect(() => {
    loadExamData();
  }, [loadExamData]);

  const selectedExam = exams.find((e) => e.id === selectedExamId);

  const handleDeleteBlueprint = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this blueprint?')) return;
    const { error } = await deleteBlueprintAPI(id);
    if (error) {
      alert(typeof error === 'string' ? error : 'Cannot delete blueprint');
      return;
    }
    loadExamData();
  };

  const handlePublishVersion = async (versionId: string) => {
    if (
      !window.confirm(
        'Publish this version? Once published, this exam version becomes permanently immutable for student attempts.',
      )
    )
      return;

    const { error } = await publishExamVersionAPI(versionId);
    if (error) {
      alert(typeof error === 'string' ? error : 'Failed to publish version');
      return;
    }
    loadExamData();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-500/20 mb-2">
            <Sliders size={13} />
            <span>Automated Question Generator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Exam Configuration & Blueprints
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build multi-dimensional selection blueprints, validate pools, and generate immutable
            exam versions
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => setIsBuilderOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
          >
            <Plus size={16} />
            <span>Create New Blueprint</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Configured Blueprints
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">{blueprints.length}</span>
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">
            Generated Versions
          </span>
          <span className="text-2xl font-black text-indigo-900 mt-1 block">{versions.length}</span>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Published Active
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            {versions.filter((v) => v.status === 'PUBLISHED').length}
          </span>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-purple-50/40 p-5 shadow-sm">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">
            Zero-Drift Guarantee
          </span>
          <span className="text-xs font-semibold text-purple-900 mt-2 block">
            Normalized Snapshots Active
          </span>
        </div>
      </div>

      {/* Exam Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Target Exam:
          </span>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
          >
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.title} ({exam.totalQuestions} Questions | {exam.durationMinutes} mins)
              </option>
            ))}
          </select>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('BLUEPRINTS')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'BLUEPRINTS'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={14} />
            <span>Blueprints ({blueprints.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('VERSIONS')}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'VERSIONS'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileCheck2 size={14} />
            <span>Generated Versions ({versions.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Blueprints List */}
      {activeTab === 'BLUEPRINTS' && (
        <div className="space-y-4">
          {isLoadingBlueprints ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-32 rounded-3xl bg-slate-200" />
              ))}
            </div>
          ) : blueprints.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {blueprints.map((bp) => (
                <div
                  key={bp.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-200 transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 font-black text-sm">
                        v{bp.version}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900">{bp.name}</h3>
                        <p className="text-xs text-slate-500 font-mono">
                          Target: {bp.totalQuestions} Questions | {bp.rules?.length || 0} Rules
                          configured
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setActiveBlueprint(bp);
                          setIsValidationOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                      >
                        <Play size={13} fill="currentColor" />
                        <span>Validate & Generate</span>
                      </Button>

                      <button
                        onClick={() => handleDeleteBlueprint(bp.id)}
                        className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors"
                        title="Delete Blueprint"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  {/* Rules Grid */}
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
                              className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
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

                        <span className="font-mono font-black text-indigo-700 shrink-0">
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
                Create a blueprint rule specification for {selectedExam?.title} to start generating
                automated exams.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBuilderOpen(true)}
                className="mt-2"
              >
                <Plus size={14} className="mr-1" /> Create Blueprint
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Generated Versions */}
      {activeTab === 'VERSIONS' && (
        <div className="space-y-4">
          {isLoadingVersions ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-28 rounded-3xl bg-slate-200" />
              ))}
            </div>
          ) : versions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {versions.map((ver) => (
                <div
                  key={ver.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-200 transition-all space-y-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white font-mono font-black text-sm">
                        v{ver.versionNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-extrabold text-slate-900">
                            Version #{ver.versionNumber}
                          </h3>
                          <span
                            className={`rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                              ver.status === 'PUBLISHED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {ver.status}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                          <span>{ver.totalQuestions} Questions</span>
                          <span>•</span>
                          <span>{ver.durationMinutes} mins</span>
                          <span>•</span>
                          <span>Seed: {ver.generationSeed || 'N/A'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveVersion(ver);
                          setIsQuestionsOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-xs border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                      >
                        <Eye size={13} />
                        <span>Inspect Frozen Questions</span>
                      </Button>

                      {ver.status !== 'PUBLISHED' && (
                        <Button
                          size="sm"
                          onClick={() => handlePublishVersion(ver.id)}
                          className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                          <Lock size={13} />
                          <span>Publish to Students</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-slate-300 bg-white text-center space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <FileCheck2 size={24} />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Exam Versions Generated</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Validate and generate an exam version from one of your blueprints to produce an
                immutable snapshot.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <BlueprintBuilderModal
        examId={selectedExamId}
        examTitle={selectedExam?.title}
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSaved={loadExamData}
      />

      {activeBlueprint && (
        <BlueprintValidationModal
          blueprintId={activeBlueprint.id}
          blueprintName={activeBlueprint.name}
          isOpen={isValidationOpen}
          onClose={() => setIsValidationOpen(false)}
          onGenerateSuccess={() => {
            loadExamData();
            setActiveTab('VERSIONS');
          }}
        />
      )}

      <ExamVersionQuestionsModal
        version={activeVersion}
        isOpen={isQuestionsOpen}
        onClose={() => setIsQuestionsOpen(false)}
      />
    </div>
  );
};

export default ExamBlueprintManagementPage;
