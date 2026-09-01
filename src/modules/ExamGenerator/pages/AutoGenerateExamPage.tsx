import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Layers,
  Clock,
  Award,
  BookOpen,
  Check,
  Shuffle,
  FileCheck,
  Atom,
  FlaskConical,
  Binary,
  Dna,
  FileSpreadsheet,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import {
  useValidateGenerationFiltersAPI,
  usePreviewGenerationAPI,
  useGenerateExamFromFiltersAPI,
  useGetAcademicSubjectsAPI,
  type ExamSectionFilterPayload,
  type ValidationReportResponse,
  type ExamGenerationPreviewResponse,
  type CreatedExamResponse,
} from '../services/autoExamGenerator.service';
import { useGetAllExamsAPI } from '../services/examGenerator.service';
import {
  useGetSubjectMockStatsAPI,
  type SubjectMockStatItem,
} from '../services/subjectMockGenerator.service';
import { SubjectMockGenerator } from '../components/SubjectMockGenerator';

export const AutoGenerateExamPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const routePrefix = location.pathname.startsWith('/super-admin')
    ? '/super-admin'
    : '/admin';

  // ─── Generator Mode: 'EXISTING_GENERATOR' vs 'SUBJECT_MOCK' ───────────────
  const [generatorMode, setGeneratorMode] = useState<
    'EXISTING_GENERATOR' | 'SUBJECT_MOCK'
  >('EXISTING_GENERATOR');
  const [selectedSubject, setSelectedSubject] = useState<
    'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS' | 'BIOLOGY' | null
  >(null);
  const [subjectStats, setSubjectStats] = useState<SubjectMockStatItem[]>([]);

  // ─── Step State: 1: Configure, 2: Inventory Check, 3: Preview, 4: Created ─
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);


  // ─── Form State ──────────────────────────────────────────────────────────
  const [examTargets, setExamTargets] = useState<any[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [examTitle, setExamTitle] = useState<string>('');
  const [examDescription, setExamDescription] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(180);
  const [defaultMarks, setDefaultMarks] = useState<number>(4);
  const [defaultNegativeMarks, setDefaultNegativeMarks] = useState<number>(1);
  const [onlyApproved, setOnlyApproved] = useState<boolean>(true);
  const [publishImmediately, setPublishImmediately] = useState<boolean>(true);

  // Academic data
  const [availableSubjects, setAvailableSubjects] = useState<any[]>([]);

  // Sections
  const [sections, setSections] = useState<ExamSectionFilterPayload[]>([
    {
      name: 'Physics',
      subjectId: '',
      totalQuestions: 15,
      marksPerQuestion: 4,
      negativeMarks: 1,
      difficultyDistribution: {
        easyPercentage: 30,
        mediumPercentage: 50,
        hardPercentage: 20,
        veryHardPercentage: 0,
      },
    },
    {
      name: 'Chemistry',
      subjectId: '',
      totalQuestions: 15,
      marksPerQuestion: 4,
      negativeMarks: 1,
      difficultyDistribution: {
        easyPercentage: 30,
        mediumPercentage: 50,
        hardPercentage: 20,
        veryHardPercentage: 0,
      },
    },
  ]);

  // Validation report state
  const [validationReport, setValidationReport] =
    useState<ValidationReportResponse | null>(null);

  // Preview state
  const [previewData, setPreviewData] =
    useState<ExamGenerationPreviewResponse | null>(null);
  const [activePreviewSectionIdx, setActivePreviewSectionIdx] =
    useState<number>(0);
  const [generationSeed, setGenerationSeed] = useState<string>('');

  // Created Result
  const [createdExam, setCreatedExam] = useState<CreatedExamResponse | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  // ─── API Hooks ───────────────────────────────────────────────────────────
  const { validateGenerationFiltersAPI, isLoading: isValidating } =
    useValidateGenerationFiltersAPI();
  const { previewGenerationAPI, isLoading: isPreviewing } =
    usePreviewGenerationAPI();
  const { generateExamFromFiltersAPI, isLoading: isGenerating } =
    useGenerateExamFromFiltersAPI();
  const { getAcademicSubjectsAPI } = useGetAcademicSubjectsAPI();
  const { getAllExamsAPI } = useGetAllExamsAPI();
  const { getSubjectMockStatsAPI } = useGetSubjectMockStatsAPI();

  // 1. Initial Load: Fetch Exam Targets, Subjects & Subject Mock Stats
  useEffect(() => {
    getSubjectMockStatsAPI().then(({ data }) => {
      if (data && data.length > 0) {
        setSubjectStats(data);
      }
    });

    getAllExamsAPI().then(({ data }: any) => {
      if (data && data.length > 0) {
        // Extract unique targets from exams if present
        const targetsMap = new Map<string, any>();
        data.forEach((e: any) => {
          if (e.examTarget) targetsMap.set(e.examTarget.id, e.examTarget);
        });
        const targetsList = Array.from(targetsMap.values());
        if (targetsList.length > 0) {
          setExamTargets(targetsList);
          setSelectedTargetId(targetsList[0].id);
        }
      }
    });

    getAcademicSubjectsAPI().then(({ data }: any) => {
      if (data && data.length > 0) {
        setAvailableSubjects(data);
        // Link initial sections to first subjects
        setSections((prev) =>
          prev.map((s, idx) => ({
            ...s,
            subjectId: data[idx % data.length]?.id || '',
            name: data[idx % data.length]?.name || s.name,
          })),
        );
      }
    });
  }, [getAllExamsAPI, getAcademicSubjectsAPI, getSubjectMockStatsAPI]);

  // Helper function to find stats for a given subject
  const getStatsForSubject = (sup: 'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS' | 'BIOLOGY') => {
    return (
      subjectStats.find((s) => s.normalizedName === sup) || {
        chapterCount: sup === 'BIOLOGY' ? 10 : 20,
        questionCount: 0,
      }
    );
  };

  // 2. Load subjects when target changes
  useEffect(() => {
    if (selectedTargetId) {
      getAcademicSubjectsAPI(selectedTargetId).then(({ data }: any) => {
        if (data && data.length > 0) {
          setAvailableSubjects(data);
        }
      });
    }
  }, [selectedTargetId, getAcademicSubjectsAPI]);

  // Set default title when target/subject changes
  useEffect(() => {
    if (!examTitle && selectedTargetId) {
      const target = examTargets.find((t) => t.id === selectedTargetId);
      const targetName = target?.name || 'Mock';
      const today = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      setExamTitle(`${targetName} Full Mock Test - ${today}`);
    }
  }, [selectedTargetId, examTargets, examTitle]);

  // Total questions & marks computation
  const totalQuestionsSum = sections.reduce(
    (sum, s) => sum + Number(s.totalQuestions || 0),
    0,
  );
  const totalMarksSum = sections.reduce(
    (sum, s) =>
      sum +
      Number(s.totalQuestions || 0) *
        Number(s.marksPerQuestion || defaultMarks || 4),
    0,
  );

  // ─── Section Handlers ────────────────────────────────────────────────────
  const handleAddSection = () => {
    const nextSubject =
      availableSubjects[sections.length % availableSubjects.length];
    setSections([
      ...sections,
      {
        name: nextSubject?.name || `Section ${sections.length + 1}`,
        subjectId: nextSubject?.id || '',
        totalQuestions: 15,
        marksPerQuestion: defaultMarks,
        negativeMarks: defaultNegativeMarks,
        difficultyDistribution: {
          easyPercentage: 30,
          mediumPercentage: 50,
          hardPercentage: 20,
          veryHardPercentage: 0,
        },
      },
    ]);
  };

  const handleRemoveSection = (index: number) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, idx) => idx !== index));
  };

  const handleUpdateSection = (
    index: number,
    updates: Partial<ExamSectionFilterPayload>,
  ) => {
    setSections(
      sections.map((s, idx) => (idx === index ? { ...s, ...updates } : s)),
    );
  };

  // ─── Step 1 -> Step 2: Validate Inventory ────────────────────────────────
  const handleProceedToValidation = async () => {
    setActionError(null);
    if (!examTitle.trim()) {
      setActionError('Please provide an exam title.');
      return;
    }
    if (!selectedTargetId) {
      setActionError('Please select a target exam curriculum.');
      return;
    }
    if (sections.some((s) => !s.subjectId)) {
      setActionError('Please select a subject for all sections.');
      return;
    }
    if (totalQuestionsSum <= 0) {
      setActionError('Total questions must be greater than 0.');
      return;
    }

    const { data: report, error } = await validateGenerationFiltersAPI({
      examTargetId: selectedTargetId,
      sections,
      onlyApprovedQuestions: onlyApproved,
    });

    if (error) {
      setActionError(
        typeof error === 'string'
          ? error
          : (error as any).message || 'Validation failed',
      );
      return;
    }

    if (report) {
      setValidationReport(report);
      setCurrentStep(2);
    }
  };

  // ─── Step 2 -> Step 3: Interactive Preview ───────────────────────────────
  const handleGeneratePreview = async (customSeed?: string) => {
    setActionError(null);
    const { data: preview, error } = await previewGenerationAPI({
      examTargetId: selectedTargetId,
      title: examTitle.trim(),
      description: examDescription.trim(),
      durationMinutes,
      defaultMarksPerQuestion: defaultMarks,
      defaultNegativeMarks,
      sections,
      onlyApprovedQuestions: onlyApproved,
      generationSeed: customSeed || generationSeed || undefined,
    });

    if (error) {
      setActionError(
        typeof error === 'string'
          ? error
          : (error as any).message || 'Failed to generate preview',
      );
      return;
    }

    if (preview) {
      setPreviewData(preview);
      setGenerationSeed(preview.generationSeed);
      setActivePreviewSectionIdx(0);
      setCurrentStep(3);
    }
  };

  // ─── Step 3 -> Step 4: Finalize Exam Creation ────────────────────────────
  const handleFinalizeExam = async () => {
    setActionError(null);
    const { data: created, error } = await generateExamFromFiltersAPI({
      examTargetId: selectedTargetId,
      title: examTitle.trim(),
      description: examDescription.trim(),
      durationMinutes,
      defaultMarksPerQuestion: defaultMarks,
      defaultNegativeMarks,
      sections,
      onlyApprovedQuestions: onlyApproved,
      generationSeed,
      publishImmediately,
    });

    if (error) {
      setActionError(
        typeof error === 'string'
          ? error
          : (error as any).message || 'Failed to create exam in production',
      );
      return;
    }

    if (created) {
      setCreatedExam(created);
      setCurrentStep(4);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* ─── Breadcrumb & Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
            <button
              onClick={() => navigate(`${routePrefix}/mock-tests`)}
              className="hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              <BookOpen size={14} /> Mock Test Studio
            </button>
            <span>/</span>
            <span className="text-slate-900 font-extrabold">
              {generatorMode === 'SUBJECT_MOCK'
                ? 'Subject-wise Mock Generator'
                : 'Auto-Generate Exam Paper'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="text-indigo-600" size={28} />
            Smart Exam Paper Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Compile production-grade examination papers from your question bank or generate targeted subject-wise mock tests via CSV/Excel upload.
          </p>
        </div>

        {/* Action Links */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`${routePrefix}/question-bank/import`)}
            className="text-xs font-bold"
          >
            Import More Questions
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`${routePrefix}/mock-tests`)}
            className="text-xs font-bold"
          >
            &larr; Back to Exams
          </Button>
        </div>
      </div>

      {/* ─── Module Mode Navigation Tabs ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
        <div className="grid grid-cols-2 gap-1.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              setGeneratorMode('EXISTING_GENERATOR');
              setSelectedSubject(null);
            }}
            className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
              generatorMode === 'EXISTING_GENERATOR'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="h-4 w-4 text-indigo-600" />
            <span>Existing Filter Generator</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setGeneratorMode('SUBJECT_MOCK');
            }}
            className={`flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
              generatorMode === 'SUBJECT_MOCK'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            <span>Subject-wise Mock Generator</span>
          </button>
        </div>

        {/* Quick Launch Buttons */}
        {generatorMode === 'EXISTING_GENERATOR' && (
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 px-2 overflow-x-auto">
            <span className="font-semibold text-slate-400 whitespace-nowrap text-[11px]">
              Subject Mocks:
            </span>
            {(['PHYSICS', 'CHEMISTRY', 'MATHEMATICS', 'BIOLOGY'] as const).map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  setGeneratorMode('SUBJECT_MOCK');
                  setSelectedSubject(sub);
                }}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 shadow-2xs transition hover:border-indigo-300 text-[11px]"
              >
                {sub.charAt(0) + sub.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* SUBJECT-WISE MOCK TEST GENERATOR VIEW                               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {generatorMode === 'SUBJECT_MOCK' && (
        <>
          {selectedSubject ? (
            <SubjectMockGenerator
              subject={selectedSubject}
              onBack={() => setSelectedSubject(null)}
            />
          ) : (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-slate-900">
                    Generate Subject-wise Mock Test
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Select a subject to upload question files (.csv, .xlsx, .xls), validate row hierarchy, and create a targeted subject mock test.
                  </p>
                </div>

                {/* 4 Supported Subject Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-2">
                  {/* 1. Physics Card */}
                  <div className="rounded-2xl border border-indigo-200 bg-gradient-to-b from-indigo-50/70 via-white to-white p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition space-y-5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 shadow-xs">
                          <Atom className="h-6 w-6" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                          Subject 01
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Physics</h3>
                        <p className="text-xs text-slate-500">
                          Mechanics, Electromagnetism, Optics, Modern Physics
                        </p>
                      </div>
                      <div className="rounded-xl bg-indigo-50/60 p-3 border border-indigo-100 text-xs text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Chapters in syllabus:</span>
                          <strong className="text-slate-900">
                            {getStatsForSubject('PHYSICS').chapterCount}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Bank questions:</span>
                          <strong className="text-slate-900">
                            {getStatsForSubject('PHYSICS').questionCount}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => setSelectedSubject('PHYSICS')}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm"
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      <span>Generate Physics Mock</span>
                    </Button>
                  </div>

                  {/* 2. Chemistry Card */}
                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/70 via-white to-white p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition space-y-5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs">
                          <FlaskConical className="h-6 w-6" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase tracking-wider">
                          Subject 02
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Chemistry</h3>
                        <p className="text-xs text-slate-500">
                          Physical, Organic, and Inorganic Chemistry
                        </p>
                      </div>
                      <div className="rounded-xl bg-emerald-50/60 p-3 border border-emerald-100 text-xs text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Chapters in syllabus:</span>
                          <strong className="text-slate-900">
                            {getStatsForSubject('CHEMISTRY').chapterCount}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Bank questions:</span>
                          <strong className="text-slate-900">
                            {getStatsForSubject('CHEMISTRY').questionCount}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => setSelectedSubject('CHEMISTRY')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      <span>Generate Chemistry Mock</span>
                    </Button>
                  </div>

                  {/* 3. Mathematics Card */}
                  <div className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50/70 via-white to-white p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition space-y-5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 shadow-xs">
                          <Binary className="h-6 w-6" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 uppercase tracking-wider">
                          Subject 03
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Mathematics</h3>
                        <p className="text-xs text-slate-500">
                          Calculus, Algebra, Coordinate Geometry, Vectors
                        </p>
                      </div>
                      <div className="rounded-xl bg-amber-50/60 p-3 border border-amber-100 text-xs text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Chapters in syllabus:</span>
                          <strong className="text-slate-900">
                            {getStatsForSubject('MATHEMATICS').chapterCount}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Bank questions:</span>
                          <strong className="text-slate-900">
                            {getStatsForSubject('MATHEMATICS').questionCount}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => setSelectedSubject('MATHEMATICS')}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm"
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      <span>Generate Mathematics Mock</span>
                    </Button>
                  </div>

                  {/* 4. Biology Card */}
                  <div className="rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50/70 via-white to-white p-6 shadow-sm hover:shadow-md hover:border-rose-300 transition space-y-5 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-xs">
                          <Dna className="h-6 w-6" />
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 uppercase tracking-wider">
                          Subject 04
                        </span>
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900">Biology</h3>
                        <p className="text-xs text-slate-500">
                          Botany, Zoology, Genetics, Human Physiology
                        </p>
                      </div>
                      <div className="rounded-xl bg-rose-50/60 p-3 border border-rose-100 text-xs text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Chapters in syllabus:</span>
                          <strong className="text-slate-900">
                            {getStatsForSubject('BIOLOGY').chapterCount}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span>Bank questions:</span>
                          <strong className="text-slate-900">
                            {getStatsForSubject('BIOLOGY').questionCount}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={() => setSelectedSubject('BIOLOGY')}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm"
                    >
                      <Sparkles className="h-4 w-4 mr-1.5" />
                      <span>Generate Biology Mock</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* EXISTING EXAM GENERATOR (PRESERVED & 100% UNCHANGED)               */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {generatorMode === 'EXISTING_GENERATOR' && (
        <>
          {/* ─── Step Indicator Bar ───────────────────────────────────────── */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {[
                {
                  step: 1,
                  title: '1. Filter Configuration',
                  desc: 'Subjects, sections & difficulty',
                },
                {
                  step: 2,
                  title: '2. Inventory Check',
                  desc: 'Question bank pool validation',
                },
                {
                  step: 3,
                  title: '3. Interactive Preview',
                  desc: 'Inspect questions & shuffle seed',
                },
                {
                  step: 4,
                  title: '4. Production Created',
                  desc: 'Immutable snapshot saved',
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    currentStep === item.step
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                      : currentStep > item.step
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                      currentStep === item.step
                        ? 'bg-white/20 text-white'
                        : currentStep > item.step
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {currentStep > item.step ? <Check size={14} /> : item.step}
                  </div>
                  <div className="truncate">
                    <span className="block text-xs font-black truncate">
                      {item.title}
                    </span>
                    <span
                      className={`block text-[10px] truncate ${
                        currentStep === item.step ? 'text-indigo-100' : 'text-slate-500'
                      }`}
                    >
                      {item.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>



      {/* Global Error Banner */}
      {actionError && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700 shadow-sm animate-in fade-in">
          <AlertTriangle size={18} className="shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <span className="block font-black text-rose-900">
              Action Required
            </span>
            <span className="block font-normal whitespace-pre-line">
              {actionError}
            </span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 1: CONFIGURE EXAM & SECTION RULES                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Top Exam Info Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Sliders size={18} className="text-indigo-600" />
              <h2 className="text-base font-extrabold text-slate-900">
                Exam Basic Details & Target Curriculum
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Target Curriculum */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Target Curriculum / Standard *
                </label>
                <select
                  value={selectedTargetId}
                  onChange={(e) => setSelectedTargetId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  {examTargets.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} {t.description ? `(${t.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Duration */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Clock size={13} className="text-indigo-600" /> Duration (Mins) *
                </label>
                <input
                  type="number"
                  min={1}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                />
              </div>

              {/* Default Marks */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                  <Award size={13} className="text-emerald-600" /> Marks / Negative
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={0}
                    placeholder="+4"
                    value={defaultMarks}
                    onChange={(e) => setDefaultMarks(Number(e.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono text-center"
                    title="Default marks per question"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="-1"
                    value={defaultNegativeMarks}
                    onChange={(e) =>
                      setDefaultNegativeMarks(Number(e.target.value))
                    }
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono text-center"
                    title="Default negative marks"
                  />
                </div>
              </div>

              {/* Exam Title */}
              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Exam Title / Test Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. NEET Grand Mock Test 2026 - Phase 1"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Question Pool Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  Question Bank Pool
                </label>
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={onlyApproved}
                    onChange={(e) => setOnlyApproved(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Approved Only</span>
                </label>
              </div>

              {/* Description */}
              <div className="space-y-1.5 sm:col-span-3">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  Description / Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Standard 3-hour comprehensive full length mock test covering Physics and Chemistry."
                  value={examDescription}
                  onChange={(e) => setExamDescription(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Publish Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                  Initial Status
                </label>
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Publish On Save</span>
                </label>
              </div>
            </div>
          </div>

          {/* Section Distribution Builder */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Layers size={18} className="text-indigo-600" />
                  Exam Sections & Subject Filters ({sections.length})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure question count, subject, and difficulty distribution for each paper section.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-50 px-3.5 py-1.5 text-xs font-black text-indigo-800 border border-indigo-100 font-mono">
                  {totalQuestionsSum} Qs • {totalMarksSum} Marks
                </div>
                <Button
                  onClick={handleAddSection}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1.5 text-xs font-bold"
                >
                  <Plus size={14} /> Add Section
                </Button>
              </div>
            </div>

            {/* Sections List */}
            <div className="space-y-4">
              {sections.map((section, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-4 hover:border-indigo-200 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-[11px]">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={section.name}
                        onChange={(e) =>
                          handleUpdateSection(idx, { name: e.target.value })
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-900 focus:border-indigo-500 focus:outline-none"
                        placeholder="Section Name"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRemoveSection(idx)}
                        disabled={sections.length <= 1}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-30"
                        title="Remove section"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Subject */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Subject *
                      </label>
                      <select
                        value={section.subjectId}
                        onChange={(e) => {
                          const subj = availableSubjects.find(
                            (s) => s.id === e.target.value,
                          );
                          handleUpdateSection(idx, {
                            subjectId: e.target.value,
                            name: subj?.name || section.name,
                          });
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="">Select Subject</option>
                        {availableSubjects.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Question Count */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Questions Count *
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={section.totalQuestions}
                        onChange={(e) =>
                          handleUpdateSection(idx, {
                            totalQuestions: Math.max(
                              1,
                              Number(e.target.value),
                            ),
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    {/* Marks Per Question */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Marks Per Q
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={section.marksPerQuestion ?? defaultMarks}
                        onChange={(e) =>
                          handleUpdateSection(idx, {
                            marksPerQuestion: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>

                    {/* Negative Marks */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600 uppercase">
                        Negative Marks
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={section.negativeMarks ?? defaultNegativeMarks}
                        onChange={(e) =>
                          handleUpdateSection(idx, {
                            negativeMarks: Number(e.target.value),
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 font-mono"
                      />
                    </div>
                  </div>

                  {/* Difficulty Distribution Sliders */}
                  <div className="rounded-xl border border-slate-200/80 bg-white p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Sliders size={13} className="text-indigo-600" />
                        Difficulty Target Allocation (%)
                      </span>
                      <span className="text-[11px] font-mono font-bold text-slate-500">
                        Sum:{' '}
                        <strong
                          className={
                            (section.difficultyDistribution?.easyPercentage ||
                              0) +
                              (section.difficultyDistribution
                                ?.mediumPercentage || 0) +
                              (section.difficultyDistribution
                                ?.hardPercentage || 0) +
                              (section.difficultyDistribution
                                ?.veryHardPercentage || 0) ===
                            100
                              ? 'text-emerald-600 font-bold'
                              : 'text-amber-600 font-bold'
                          }
                        >
                          {(section.difficultyDistribution?.easyPercentage ||
                            0) +
                            (section.difficultyDistribution?.mediumPercentage ||
                              0) +
                            (section.difficultyDistribution?.hardPercentage ||
                              0) +
                            (section.difficultyDistribution
                              ?.veryHardPercentage || 0)}
                          %
                        </strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Easy */}
                      <div className="rounded-lg bg-emerald-50/70 p-2.5 border border-emerald-200/60 space-y-1">
                        <span className="text-[10px] font-black text-emerald-800 uppercase block">
                          Easy
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              section.difficultyDistribution?.easyPercentage ?? 30
                            }
                            onChange={(e) =>
                              handleUpdateSection(idx, {
                                difficultyDistribution: {
                                  ...section.difficultyDistribution,
                                  easyPercentage: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full rounded-md border border-emerald-300 bg-white px-2 py-1 text-xs font-bold text-emerald-900 font-mono text-center"
                          />
                          <span className="text-xs font-bold text-emerald-700">
                            %
                          </span>
                        </div>
                      </div>

                      {/* Medium */}
                      <div className="rounded-lg bg-amber-50/70 p-2.5 border border-amber-200/60 space-y-1">
                        <span className="text-[10px] font-black text-amber-800 uppercase block">
                          Medium
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              section.difficultyDistribution
                                ?.mediumPercentage ?? 50
                            }
                            onChange={(e) =>
                              handleUpdateSection(idx, {
                                difficultyDistribution: {
                                  ...section.difficultyDistribution,
                                  mediumPercentage: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full rounded-md border border-amber-300 bg-white px-2 py-1 text-xs font-bold text-amber-900 font-mono text-center"
                          />
                          <span className="text-xs font-bold text-amber-700">
                            %
                          </span>
                        </div>
                      </div>

                      {/* Hard */}
                      <div className="rounded-lg bg-rose-50/70 p-2.5 border border-rose-200/60 space-y-1">
                        <span className="text-[10px] font-black text-rose-800 uppercase block">
                          Hard
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              section.difficultyDistribution?.hardPercentage ?? 20
                            }
                            onChange={(e) =>
                              handleUpdateSection(idx, {
                                difficultyDistribution: {
                                  ...section.difficultyDistribution,
                                  hardPercentage: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full rounded-md border border-rose-300 bg-white px-2 py-1 text-xs font-bold text-rose-900 font-mono text-center"
                          />
                          <span className="text-xs font-bold text-rose-700">
                            %
                          </span>
                        </div>
                      </div>

                      {/* Very Hard */}
                      <div className="rounded-lg bg-purple-50/70 p-2.5 border border-purple-200/60 space-y-1">
                        <span className="text-[10px] font-black text-purple-800 uppercase block">
                          Very Hard
                        </span>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={
                              section.difficultyDistribution
                                ?.veryHardPercentage ?? 0
                            }
                            onChange={(e) =>
                              handleUpdateSection(idx, {
                                difficultyDistribution: {
                                  ...section.difficultyDistribution,
                                  veryHardPercentage: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full rounded-md border border-purple-300 bg-white px-2 py-1 text-xs font-bold text-purple-900 font-mono text-center"
                          />
                          <span className="text-xs font-bold text-purple-700">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Step 1 of 4 • Ready to test Question Bank inventory
              </span>

              <Button
                onClick={handleProceedToValidation}
                isLoading={isValidating}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-2.5 shadow-md shadow-indigo-100"
              >
                <span>Check Pool Inventory</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 2: INVENTORY & POOL VERIFICATION                             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {currentStep === 2 && validationReport && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            {/* Status Header */}
            <div
              className={`flex items-center justify-between rounded-2xl border p-5 ${
                validationReport.isValid
                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
                  : 'border-amber-200 bg-amber-50/70 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {validationReport.isValid ? (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200">
                    <CheckCircle2 size={26} />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-600 text-white shadow-md shadow-amber-200">
                    <AlertTriangle size={26} />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-black tracking-tight">
                    {validationReport.isValid
                      ? 'Question Bank Inventory Satisfied (100% Eligible)'
                      : 'Insufficient Question Pool Inventory'}
                  </h3>
                  <p className="text-xs opacity-85 mt-0.5">
                    {validationReport.isValid
                      ? `All ${validationReport.totalQuestions} required questions are available and can be selected with deterministic randomization.`
                      : 'The question bank does not have enough questions matching the configured rules. Please adjust requirements or import more questions.'}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleProceedToValidation}
                isLoading={isValidating}
                className="bg-white/80 shrink-0 text-xs font-bold"
              >
                <RefreshCw size={13} className="mr-1.5" /> Re-Check
              </Button>
            </div>

            {/* Error Deficits List if Invalid */}
            {!validationReport.isValid &&
              validationReport.errorMessages?.length > 0 && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-4 space-y-2">
                  <span className="text-xs font-black text-rose-900 uppercase tracking-wider block">
                    Deficit Diagnostics
                  </span>
                  <ul className="space-y-1 text-xs font-semibold text-rose-800 list-disc list-inside">
                    {validationReport.errorMessages.map((msg, mIdx) => (
                      <li key={mIdx}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

            {/* Section-by-Section Inventory Breakdown */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Section Inventory Status
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {validationReport.sectionReports?.map((sec, sIdx) => (
                  <div
                    key={sIdx}
                    className={`rounded-2xl border p-4 space-y-3 ${
                      sec.isSatisfied
                        ? 'border-slate-200 bg-slate-50/60'
                        : 'border-rose-200 bg-rose-50/40'
                    }`}
                  >
                    <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
                      <div>
                        <h5 className="text-sm font-extrabold text-slate-900">
                          {sec.sectionName}
                        </h5>
                        <span className="text-[11px] font-bold text-slate-500">
                          {sec.subjectName}
                        </span>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${
                            sec.isSatisfied
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {sec.isSatisfied ? 'Satisfied' : 'Deficit'}
                        </span>
                        <span className="block text-[11px] font-mono text-slate-600 mt-0.5">
                          Req: {sec.totalQuestions} | Avail:{' '}
                          <strong className="font-bold">
                            {sec.availableTotal}
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Difficulty breakdown */}
                    {Object.keys(sec.difficultyBreakdown || {}).length > 0 && (
                      <div className="grid grid-cols-3 gap-2 text-[11px]">
                        {Object.entries(sec.difficultyBreakdown).map(
                          ([diffKey, diffStat]: any) => (
                            <div
                              key={diffKey}
                              className={`rounded-xl border p-2 text-center ${
                                diffStat.isSatisfied
                                  ? 'border-slate-200 bg-white'
                                  : 'border-rose-300 bg-rose-100/50'
                              }`}
                            >
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                                {diffKey}
                              </span>
                              <span className="font-mono font-extrabold text-xs text-slate-900 block mt-0.5">
                                {diffStat.available} / {diffStat.required}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(1)}
                className="flex items-center gap-1.5 text-xs font-bold"
              >
                <ArrowLeft size={14} /> Back to Configuration
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handleGeneratePreview()}
                  disabled={!validationReport.isValid}
                  isLoading={isPreviewing}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-6 py-2.5 shadow-md shadow-indigo-100 disabled:opacity-40"
                >
                  <Eye size={16} />
                  <span>Preview Exam Paper</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 3: INTERACTIVE EXAM PAPER PREVIEW & RANDOMIZATION             */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {currentStep === 3 && previewData && (
        <div className="space-y-6">
          {/* Preview Header Summary Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-indigo-100 px-2.5 py-0.5 text-xs font-extrabold text-indigo-800">
                    Deterministic Preview
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Seed: {previewData.generationSeed}
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight mt-1">
                  {previewData.examTitle}
                </h2>
                <p className="text-xs text-slate-500">
                  {previewData.sections.length} Sections • {previewData.totalQuestions} Total Questions • {previewData.totalMarks} Total Marks • {previewData.durationMinutes} Minutes
                </p>
              </div>

              {/* Shuffle Action */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleGeneratePreview()}
                  isLoading={isPreviewing}
                  className="flex items-center gap-1.5 text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  title="Reshuffle question selection with a new random seed"
                >
                  <Shuffle size={14} />
                  <span>Shuffle / Regenerate</span>
                </Button>

                <Button
                  onClick={handleFinalizeExam}
                  isLoading={isGenerating}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 shadow-md shadow-emerald-100"
                >
                  <FileCheck size={16} />
                  <span>Finalize & Create Exam</span>
                </Button>
              </div>
            </div>

            {/* Section Selector Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
              {previewData.sections.map((sec, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => setActivePreviewSectionIdx(sIdx)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all shrink-0 ${
                    activePreviewSectionIdx === sIdx
                      ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-xl'
                      : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <span>{sec.name}</span>
                  <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-mono text-slate-700">
                    {sec.questions.length} Qs
                  </span>
                </button>
              ))}
            </div>

            {/* Questions List for Active Section */}
            {previewData.sections[activePreviewSectionIdx] && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>
                    Showing {previewData.sections[activePreviewSectionIdx].questions.length} questions in section "{previewData.sections[activePreviewSectionIdx].name}"
                  </span>
                  <span>
                    +{previewData.sections[activePreviewSectionIdx].marksPerQuestion} Marks / -{previewData.sections[activePreviewSectionIdx].negativeMarks} Negative
                  </span>
                </div>

                <div className="space-y-4">
                  {previewData.sections[activePreviewSectionIdx].questions.map(
                    (q, qIdx) => (
                      <div
                        key={q.id || qIdx}
                        className="rounded-2xl border border-slate-200 bg-slate-50/40 p-5 space-y-3 hover:border-indigo-200 transition-all"
                      >
                        {/* Question Badges Bar */}
                        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-xs font-mono">
                              {q.sequenceNumber}
                            </span>
                            <span className="font-extrabold text-slate-800">
                              {q.subjectName}
                            </span>
                            {q.chapterName && (
                              <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                                {q.chapterName}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                                q.difficultyLevel === 'EASY'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : q.difficultyLevel === 'MEDIUM'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {q.difficultyLevel}
                            </span>
                            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                              {q.type}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                              +{q.marks}/-{q.negativeMarks}
                            </span>
                          </div>
                        </div>

                        {/* Passage / Assertion / Reason if present */}
                        {q.passage && (
                          <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-700 italic">
                            <span className="font-bold not-italic text-slate-900 block mb-1">
                              Passage:
                            </span>
                            {q.passage}
                          </div>
                        )}

                        {q.assertion && (
                          <div className="space-y-1 text-xs text-slate-800 bg-white p-3 rounded-xl border border-slate-200">
                            <p>
                              <strong>Assertion (A):</strong> {q.assertion}
                            </p>
                            {q.reason && (
                              <p>
                                <strong>Reason (R):</strong> {q.reason}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Question Text */}
                        <p className="text-sm font-bold text-slate-900 leading-relaxed">
                          {q.questionText}
                        </p>

                        {/* Options Grid */}
                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                            {q.options.map((opt) => (
                              <div
                                key={opt.key}
                                className={`flex items-start gap-2.5 rounded-xl border p-2.5 text-xs transition-all ${
                                  opt.isCorrect
                                    ? 'border-emerald-400 bg-emerald-50 text-emerald-950 font-bold'
                                    : 'border-slate-200 bg-white text-slate-700'
                                }`}
                              >
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-bold text-[11px] ${
                                    opt.isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {opt.key}
                                </span>
                                <span className="flex-1 mt-0.5">{opt.text}</span>
                                {opt.isCorrect && (
                                  <span className="rounded-md bg-emerald-200 px-1.5 py-0.5 text-[9px] font-black text-emerald-900 uppercase shrink-0">
                                    Correct
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Explanation */}
                        {q.explanation && (
                          <div className="rounded-xl bg-slate-100/80 p-2.5 text-[11px] text-slate-600">
                            <strong className="text-slate-800">
                              Explanation:{' '}
                            </strong>
                            {q.explanation}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(2)}
                className="flex items-center gap-1.5 text-xs font-bold"
              >
                <ArrowLeft size={14} /> Back to Inventory Check
              </Button>

              <Button
                onClick={handleFinalizeExam}
                isLoading={isGenerating}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-6 py-2.5 shadow-md shadow-emerald-100"
              >
                <FileCheck size={16} />
                <span>Confirm & Create Exam Paper</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* STEP 4: PRODUCTION EXAM CREATED SUCCESS SCREEN                     */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {currentStep === 4 && createdExam && (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm text-center max-w-2xl mx-auto space-y-6 animate-in fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600 mx-auto shadow-lg shadow-emerald-100">
            <CheckCircle2 size={42} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Exam Paper Successfully Generated!
            </h2>
            <p className="text-xs text-slate-500">
              The exam paper has been finalized and transactionally stored into the production database with deterministic sequence locking.
            </p>
          </div>

          {/* Exam Summary KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left font-mono">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Questions
              </span>
              <span className="block text-base font-black text-slate-900 mt-0.5">
                {createdExam.totalQuestions}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Total Marks
              </span>
              <span className="block text-base font-black text-slate-900 mt-0.5">
                {createdExam.totalMarks}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Duration
              </span>
              <span className="block text-base font-black text-slate-900 mt-0.5">
                {createdExam.durationMinutes}m
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">
                Status
              </span>
              <span className="block text-base font-black text-emerald-600 mt-0.5">
                {createdExam.status}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => navigate(`${routePrefix}/mock-tests`)}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-6 py-2.5"
            >
              View in Exam Studio
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCreatedExam(null);
                setPreviewData(null);
                setValidationReport(null);
                setExamTitle('');
                setCurrentStep(1);
              }}
              className="w-full sm:w-auto text-xs font-bold"
            >
              Generate Another Exam
            </Button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default AutoGenerateExamPage;
