import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FileSpreadsheet,
  UploadCloud,
  History,
  BookOpen,
  Search,
  Globe,
  Layers,
  Clock,
  Send,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Languages,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useGetExamsListAPI } from '../services/examManager.service';
import { useSubmitExamAPI } from '@/modules/ExamScheduling/services/examScheduling.service';
import { useAxiosGet } from '@/hooks/useAxios';
import type { ExamItem, BlueprintItem } from '../types/examManager.types';
import { BlueprintSelectionModal } from '../components/BlueprintSelectionModal';
import { UploadQuestionPaperWizardModal } from '../components/UploadQuestionPaperWizardModal';
import { MockTestDetailsModal } from '@/modules/ExamScheduling/components/MockTestDetailsModal';
import ExamTranslationManager from '@/modules/RegionalLanguage/components/ExamTranslationManager';
import { toast } from '@/utils/toast';

export const ExamManagerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const routePrefix = location.pathname.startsWith('/super-admin')
    ? '/super-admin'
    : '/admin';

  // Data & State
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [availableLanguages, setAvailableLanguages] = useState<any[]>([]);

  // Modals & Drilldowns
  const [isBlueprintModalOpen, setIsBlueprintModalOpen] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState<BlueprintItem | null>(null);
  const [isUploadWizardOpen, setIsUploadWizardOpen] = useState(false);
  const [selectedExamForDetails, setSelectedExamForDetails] = useState<any | null>(null);
  const [drilldownTranslationExam, setDrilldownTranslationExam] = useState<any | null>(null);

  // APIs
  const { getExamsListAPI, isLoading } = useGetExamsListAPI();
  const { submitExamAPI } = useSubmitExamAPI();
  const [getReq] = useAxiosGet();

  // Load languages master data
  useEffect(() => {
    getReq<any>('/auth/options').then(({ data }) => {
      const opts = data?.languages ? data : (data as any)?.data || {};
      if (opts.languages) setAvailableLanguages(opts.languages);
    });
  }, [getReq]);

  // Load exams with server-side filters & pagination
  const loadExams = useCallback(async () => {
    const res = await getExamsListAPI({
      search: search.trim() || undefined,
      type: selectedType === 'ALL' ? undefined : selectedType,
      status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      page,
      limit,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    if (res.data) {
      const payload = res.data;
      setExams(payload.items || []);
      if (payload.pagination) {
        setTotalCount(payload.pagination.total);
        setTotalPages(payload.pagination.totalPages);
      }
    }
  }, [getExamsListAPI, search, selectedType, selectedStatus, page, limit]);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const handleOpenUpload = () => {
    setIsBlueprintModalOpen(true);
  };

  const handleSelectBlueprint = (blueprint: BlueprintItem) => {
    setSelectedBlueprint(blueprint);
    setIsBlueprintModalOpen(false);
    setIsUploadWizardOpen(true);
  };

  const handleSubmitForApproval = async (examId: string, title: string) => {
    if (!window.confirm(`Submit exam "${title}" for Super Admin review and approval?`)) {
      return;
    }
    const { error } = await submitExamAPI(examId, {
      comment: 'Exam created via Question Paper upload and submitted by Admin.',
    });
    if (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to submit exam');
      return;
    }
    toast.success('Exam submitted for approval!');
    loadExams();
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'SCHEDULED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'APPROVED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'DRAFT':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // If drilling down into dedicated translation view
  if (drilldownTranslationExam) {
    return (
      <div className="max-w-7xl mx-auto pb-16">
        <ExamTranslationManager
          examId={drilldownTranslationExam.id}
          examTitle={drilldownTranslationExam.title}
          onBack={() => setDrilldownTranslationExam(null)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-in fade-in duration-200">
      {/* ── Header Banner ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-500/20 mb-2">
            <Sparkles size={13} className="text-indigo-600" />
            <span>Blueprint-Driven Question Paper Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="text-indigo-600" size={28} />
            Exam Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create, manage, and translate full exams and mock papers using predefined blueprints and multi-language spreadsheets.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => navigate(`${routePrefix}/exam-manager/history`)}
            className="flex items-center gap-1.5 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
          >
            <History size={14} />
            <span>Import History</span>
          </Button>

          <Button
            variant="primary"
            onClick={handleOpenUpload}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200 font-bold"
          >
            <UploadCloud size={16} />
            <span>Upload Question Paper</span>
          </Button>
        </div>
      </div>

      {/* ── KPI Metrics Bar ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Exams
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {totalCount || exams.length}
          </span>
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/30 p-5 shadow-xs">
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">
            Live Exams
          </span>
          <span className="text-2xl font-black text-indigo-900 mt-1 block">
            {exams.filter((e) => e.type === 'LIVE').length}
          </span>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-purple-50/30 p-5 shadow-xs">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">
            Mock Tests
          </span>
          <span className="text-2xl font-black text-purple-900 mt-1 block">
            {exams.filter((e) => e.type === 'MOCK').length}
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Approved & Active
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            {exams.filter((e) => ['APPROVED', 'SCHEDULED', 'ACTIVE'].includes(e.status)).length}
          </span>
        </div>
      </div>

      {/* ── Search & Filter Toolbar ──────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={15}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Exam Name, Exam Code, Subject..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Exam Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold shrink-0">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Types</option>
              <option value="LIVE">Live Exams</option>
              <option value="MOCK">Mock Tests</option>
              <option value="SUBJECT_MOCK">Subject-wise Mocks</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold shrink-0">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted (Pending Review)</option>
              <option value="APPROVED">Approved</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Exam List Table & Responsive Cards ───────────────────── */}
      {isLoading && exams.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-3xl bg-slate-100 animate-pulse border border-slate-200"
            />
          ))}
        </div>
      ) : exams.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center space-y-3">
          <FileSpreadsheet size={40} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">No Exams Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            No exams match your search criteria. Click "Upload Question Paper" above to create an exam based on a predefined blueprint.
          </p>
          <div className="pt-2">
            <Button size="sm" onClick={handleOpenUpload}>
              Upload Question Paper
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {exams.map((exam) => {
              const formattedDate = exam.createdAt
                ? new Date(exam.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A';

              return (
                <div
                  key={exam.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Left Metadata */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          exam.type === 'MOCK'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        {exam.typeLabel || (exam.type === 'MOCK' ? 'Mock Test' : 'Live Exam')}
                      </span>

                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {exam.subjectsSummary || 'All Subjects'}
                      </span>

                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          exam.status,
                        )}`}
                      >
                        {exam.status}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      {exam.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Layers size={13} className="text-indigo-600" />
                        <b>{exam.totalQuestions || 50}</b> Questions
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-indigo-600" />
                        <b>{exam.durationMinutes || 60}m</b> Duration
                      </span>
                      <span className="text-slate-400">
                        Created: <b>{formattedDate}</b>
                      </span>
                    </div>

                    {/* Translation Coverage Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 mr-1">
                        <Globe size={12} className="text-indigo-500" /> Translations:
                      </span>
                      {exam.translationCoverage &&
                      Object.keys(exam.translationCoverage).length > 0 ? (
                        Object.entries(exam.translationCoverage).map(([code, pct]) => (
                          <span
                            key={code}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                              pct >= 100
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : pct > 0
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                          >
                            {code} {pct}%
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">English only (100%)</span>
                      )}
                    </div>
                  </div>

                  {/* Right Action Toolbar */}
                  <div className="flex items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedExamForDetails(exam)}
                      className="flex items-center gap-1.5 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
                    >
                      <BookOpen size={13} />
                      <span>Manage</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDrilldownTranslationExam(exam)}
                      className="flex items-center gap-1.5 text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                    >
                      <Languages size={13} />
                      <span>Translations</span>
                    </Button>

                    {exam.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        onClick={() => handleSubmitForApproval(exam.id, exam.title)}
                        className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                      >
                        <Send size={13} />
                        <span>Submit</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination Controls ──────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-xs font-semibold">
              <span className="text-slate-500">
                Showing <b>{(page - 1) * limit + 1}</b>–<b>{Math.min(page * limit, totalCount)}</b> of{' '}
                <b>{totalCount}</b> exams
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </Button>
                <span className="px-2 text-slate-700 font-bold">
                  Page {page} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 1. Blueprint Selection Modal ──────────────────────────── */}
      <BlueprintSelectionModal
        isOpen={isBlueprintModalOpen}
        onClose={() => setIsBlueprintModalOpen(false)}
        onSelectBlueprint={handleSelectBlueprint}
      />

      {/* ── 2. Upload Question Paper & Multi-Translation Wizard ───── */}
      <UploadQuestionPaperWizardModal
        isOpen={isUploadWizardOpen}
        onClose={() => setIsUploadWizardOpen(false)}
        blueprint={selectedBlueprint}
        onSuccess={() => {
          setIsUploadWizardOpen(false);
          loadExams();
        }}
        availableLanguages={availableLanguages}
      />

      {/* ── 3. Exam Details Modal with Embedded Translation Tab ───── */}
      <MockTestDetailsModal
        isOpen={Boolean(selectedExamForDetails)}
        onClose={() => setSelectedExamForDetails(null)}
        exam={selectedExamForDetails}
        onUpdate={loadExams}
      />
    </div>
  );
};

export default ExamManagerDashboardPage;
