import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Globe,
  Layers,
  Clock,
  Send,
  Trash2,
  Sparkles,
  Atom,
  Languages,
  BookOpen,
} from 'lucide-react';
import { useGetTranslationTargetsAPI, type TranslationTargetItem } from '@/modules/RegionalLanguage/services/examTranslation.service';
import { useDeleteExamAPI } from '@/modules/ExamGenerator/services/examGenerator.service';
import { useSubmitExamAPI } from '../services/examScheduling.service';
import { useAxiosGet } from '@/hooks/useAxios';
import Button from '@/components/ui/Button';
import ExamTranslationManager from '@/modules/RegionalLanguage/components/ExamTranslationManager';
import { CreateMockTestModal } from '../components/CreateMockTestModal';
import { CreateSubjectMockModal } from '../components/CreateSubjectMockModal';
import { MockTestDetailsModal } from '../components/MockTestDetailsModal';
import { toast } from '@/utils/toast';

export const ExamManagementPage: React.FC = () => {
  const [items, setItems] = useState<TranslationTargetItem[]>([]);

  // Filters & State
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [examTargets, setExamTargets] = useState<any[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<any[]>([]);

  // Modals
  const [isCreateMockOpen, setIsCreateMockOpen] = useState(false);
  const [isCreateSubjectMockOpen, setIsCreateSubjectMockOpen] = useState(false);
  const [selectedMockForDetails, setSelectedMockForDetails] = useState<any | null>(null);
  const [detailsInitialTab, setDetailsInitialTab] = useState<'OVERVIEW' | 'QUESTIONS' | 'TRANSLATIONS' | 'APPROVAL'>('OVERVIEW');
  const [drilldownTranslationExam, setDrilldownTranslationExam] = useState<any | null>(null);

  // APIs
  const { getTranslationTargetsAPI, isLoading } = useGetTranslationTargetsAPI();
  const { deleteExamAPI } = useDeleteExamAPI();
  const { submitExamAPI } = useSubmitExamAPI();
  const [getReq] = useAxiosGet();

  // Load Target Curriculums & Languages
  useEffect(() => {
    getReq<any>('/auth/options').then(({ data }) => {
      const opts = data?.examTargets ? data : (data as any)?.data || {};
      if (opts.examTargets) setExamTargets(opts.examTargets);
      if (opts.languages) setAvailableLanguages(opts.languages);
    });
  }, [getReq]);

  // Load Mock Tests
  const loadMockTests = useCallback(async () => {
    const { data } = await getTranslationTargetsAPI({
      type: selectedType === 'ALL' ? undefined : (selectedType as any),
      search: search.trim() || undefined,
      status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      limit: 100,
    });

    if (data) {
      // Exclude live exams if type is ALL, show MOCK and SUBJECT_MOCK
      const allItems = data.items || [];
      const mockList = selectedType === 'ALL'
        ? allItems.filter((i) => i.type !== 'LIVE_EXAM')
        : allItems;
      setItems(mockList);
    }
  }, [getTranslationTargetsAPI, selectedType, search, selectedStatus]);

  useEffect(() => {
    loadMockTests();
  }, [loadMockTests]);

  const handleSubmitForApproval = async (examId: string, title: string) => {
    if (!window.confirm(`Submit mock test "${title}" for Super Admin review and approval?`)) {
      return;
    }
    const { error } = await submitExamAPI(examId, {
      comment: 'Mock test created and submitted by Admin.',
    });
    if (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to submit mock test');
      return;
    }
    toast.success('Submitted for approval!');
    loadMockTests();
  };

  const handleDeleteMock = async (examId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) {
      return;
    }
    const { error } = await deleteExamAPI(examId);
    if (error) {
      toast.error(typeof error === 'string' ? error : 'Failed to delete mock test');
      return;
    }
    toast.success('Mock test deleted successfully');
    loadMockTests();
  };

  // Filter items by subject locally if selected
  const filteredItems = items.filter((item) => {
    if (selectedSubject === 'ALL') return true;
    const subName = (item.subjectsSummary || item.subject?.name || '').toUpperCase();
    return subName.includes(selectedSubject.toUpperCase());
  });

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'ACTIVE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
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

  // Drilldown to full translation manager view
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
            <Sparkles size={13} className="text-indigo-600 animate-pulse" />
            <span>Mock Test Workspace & Translation Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Mock Test Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Create full and subject-wise mock tests via Question CSV/Excel upload with multi-language translations.
          </p>
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="primary"
            onClick={() => setIsCreateMockOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200 font-bold"
          >
            <Plus size={16} />
            <span>Create Mock Test</span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsCreateSubjectMockOpen(true)}
            className="flex items-center gap-2 border-indigo-300 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 font-bold"
          >
            <Atom size={16} className="text-indigo-600" />
            <span>Create Subject-wise Mock Test</span>
          </Button>
        </div>
      </div>

      {/* ── KPI Summary Cards ────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Total Mock Tests
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {items.length}
          </span>
        </div>

        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/30 p-5 shadow-xs">
          <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider block">
            Subject-wise Mocks
          </span>
          <span className="text-2xl font-black text-indigo-900 mt-1 block">
            {items.filter((i) => i.type === 'SUBJECT_MOCK').length}
          </span>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-purple-50/30 p-5 shadow-xs">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider block">
            Full Mock Tests
          </span>
          <span className="text-2xl font-black text-purple-900 mt-1 block">
            {items.filter((i) => i.type === 'MOCK').length}
          </span>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-5 shadow-xs">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
            Approved / Live
          </span>
          <span className="text-2xl font-black text-emerald-900 mt-1 block">
            {items.filter((i) => ['APPROVED', 'ACTIVE'].includes(i.status)).length}
          </span>
        </div>
      </div>

      {/* ── Filters & Search Toolbar ────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={15}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mock tests by name, subject..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold shrink-0">Subject:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Subjects</option>
              <option value="PHYSICS">Physics</option>
              <option value="CHEMISTRY">Chemistry</option>
              <option value="MATHEMATICS">Mathematics</option>
              <option value="BIOLOGY">Biology</option>
            </select>
          </div>

          {/* Mock Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold shrink-0">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Mock Types</option>
              <option value="MOCK">Full Mock Tests</option>
              <option value="SUBJECT_MOCK">Subject-wise Mocks</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold shrink-0">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted (Pending Review)</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Mock Tests List Table & Responsive Cards ─────────────── */}
      {isLoading && items.length === 0 ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-3xl bg-slate-100 animate-pulse border border-slate-200"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white py-16 px-4 text-center space-y-3">
          <FileSpreadsheet size={40} className="text-slate-300 mx-auto" />
          <h3 className="text-base font-extrabold text-slate-800">No Mock Tests Found</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            No mock tests match your current filter criteria. Create your first Mock Test or Subject-wise Mock above.
          </p>
          <div className="pt-2 flex gap-3">
            <Button size="sm" onClick={() => setIsCreateMockOpen(true)}>
              Create Mock Test
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsCreateSubjectMockOpen(true)}>
              Create Subject Mock
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((mock) => {
            const isSubMock = mock.type === 'SUBJECT_MOCK';
            const formattedDate = mock.createdAt
              ? new Date(mock.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : 'N/A';

            return (
              <div
                key={mock.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                {/* Left Metadata */}
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        isSubMock
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}
                    >
                      {isSubMock ? 'Subject Mock' : 'Mock Test'}
                    </span>

                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {mock.subjectsSummary || mock.subject?.name || 'All Subjects'}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                        mock.status,
                      )}`}
                    >
                      {mock.status}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-slate-900 leading-snug">
                    {mock.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Layers size={13} className="text-indigo-600" />
                      <b>{mock.totalQuestions || 50}</b> Questions
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={13} className="text-indigo-600" />
                      <b>{mock.durationMinutes || 60}m</b> Duration
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
                    {mock.translationCoverage && Object.keys(mock.translationCoverage).length > 0 ? (
                      Object.entries(mock.translationCoverage).map(([code, pct]) => (
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
                    onClick={() => {
                      setSelectedMockForDetails(mock);
                      setDetailsInitialTab('OVERVIEW');
                    }}
                    className="flex items-center gap-1.5 text-xs font-bold border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    <BookOpen size={13} />
                    <span>Manage</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDrilldownTranslationExam(mock)}
                    className="flex items-center gap-1.5 text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100"
                  >
                    <Languages size={13} />
                    <span>Translations</span>
                  </Button>

                  {mock.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      onClick={() => handleSubmitForApproval(mock.id, mock.title)}
                      className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                    >
                      <Send size={13} />
                      <span>Submit</span>
                    </Button>
                  )}

                  {mock.status === 'DRAFT' && (
                    <button
                      onClick={() => handleDeleteMock(mock.id, mock.title)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 transition"
                      title="Delete Mock Test"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Full Mock Test Modal ─────────────────────────── */}
      <CreateMockTestModal
        isOpen={isCreateMockOpen}
        onClose={() => setIsCreateMockOpen(false)}
        onSuccess={() => {
          loadMockTests();
          setIsCreateMockOpen(false);
        }}
        examTargets={examTargets}
        availableLanguages={availableLanguages}
      />

      {/* ── Create Subject-wise Mock Test Modal ─────────────────── */}
      <CreateSubjectMockModal
        isOpen={isCreateSubjectMockOpen}
        onClose={() => setIsCreateSubjectMockOpen(false)}
        onSuccess={() => {
          loadMockTests();
          setIsCreateSubjectMockOpen(false);
        }}
        availableLanguages={availableLanguages}
      />

      {/* ── Mock Details Modal (with Embedded Translation Tab) ──── */}
      <MockTestDetailsModal
        isOpen={Boolean(selectedMockForDetails)}
        onClose={() => setSelectedMockForDetails(null)}
        exam={selectedMockForDetails}
        initialTab={detailsInitialTab}
        onUpdate={loadMockTests}
      />
    </div>
  );
};

export default ExamManagementPage;
