import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileQuestion, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import {
  useGetQuestionsAPI,
  useGetQuestionStatsAPI,
  useSubmitQuestionAPI,
  useStartReviewAPI,
  useApproveQuestionAPI,
  useRejectQuestionAPI,
  useArchiveQuestionAPI,
  useDeleteQuestionAPI,
} from '../services/questionBank.service';
import type {
  QuestionItem,
  QuestionFilterParams,
  QuestionStatsResponse,
} from '../types/questionBank.types';
import { QuestionStatsHeader } from '../components/QuestionStatsHeader';
import { QuestionFilters } from '../components/QuestionFilters';
import { QuestionCard } from '../components/QuestionCard';
import { QuestionDetailsModal } from '../components/QuestionDetailsModal';
import { ReviewActionModal } from '../components/ReviewActionModal';
import { VersionHistoryModal } from '../components/VersionHistoryModal';
import { QuestionTranslationsModal } from '../components/QuestionTranslationsModal';
import Button from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

const QuestionBankPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN') ?? false;

  // ─── Filter & Query State ──────────────────────────────────────
  const [filters, setFilters] = useState<QuestionFilterParams>({
    status: 'ALL',
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  // ─── Data State ────────────────────────────────────────────────
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [paginationMeta, setPaginationMeta] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [stats, setStats] = useState<QuestionStatsResponse | null>(null);

  // ─── Modal State ───────────────────────────────────────────────
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionItem | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isTranslationsModalOpen, setIsTranslationsModalOpen] = useState(false);
  const [versionTargetId, setVersionTargetId] = useState<string | null>(null);

  // ─── API Hooks ─────────────────────────────────────────────────
  const { getQuestionsAPI, isLoading: isLoadingQuestions } = useGetQuestionsAPI();
  const { getQuestionStatsAPI, isLoading: isLoadingStats } = useGetQuestionStatsAPI();
  const { submitQuestionAPI } = useSubmitQuestionAPI();
  const { startReviewAPI } = useStartReviewAPI();
  const { approveQuestionAPI } = useApproveQuestionAPI();
  const { rejectQuestionAPI } = useRejectQuestionAPI();
  const { archiveQuestionAPI } = useArchiveQuestionAPI();
  const { deleteQuestionAPI } = useDeleteQuestionAPI();

  // ─── Fetch Questions Function ──────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    const apiParams = {
      ...filters,
      status: filters.status === 'ALL' ? undefined : (filters.status as any),
    };
    const { data } = await getQuestionsAPI(apiParams);
    if (data) {
      setQuestions(data.data || []);
      setPaginationMeta(data.meta || { total: 0, page: 1, limit: 10, totalPages: 1 });
    }
  }, [filters, getQuestionsAPI]);

  // ─── Fetch Stats Function ──────────────────────────────────────
  const fetchStats = useCallback(async () => {
    const { data } = await getQuestionStatsAPI(filters.examTargetId);
    if (data) setStats(data);
  }, [filters.examTargetId, getQuestionStatsAPI]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleFilterChange = (updated: Partial<QuestionFilterParams>) => {
    setFilters((prev) => ({ ...prev, ...updated, page: updated.page ?? 1 }));
  };

  const handleResetFilters = () => {
    setFilters({
      status: 'ALL',
      page: 1,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const handleStatusCardClick = (status: string) => {
    handleFilterChange({ status: status as any, page: 1 });
  };

  const handleInspect = (q: QuestionItem) => {
    setSelectedQuestion(q);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (q: QuestionItem) => {
    navigate(`/question-bank/${q.id}/edit`);
  };

  const handleSubmitQuestion = async (q: QuestionItem) => {
    if (window.confirm(`Submit question '${q.id.slice(0, 8)}' for Super Admin review?`)) {
      const { error } = await submitQuestionAPI(q.id);
      if (!error) {
        fetchQuestions();
        fetchStats();
      }
    }
  };

  const handleOpenReviewModal = (q: QuestionItem) => {
    setSelectedQuestion(q);
    setIsReviewModalOpen(true);
  };

  const handleOpenVersionsModal = (q: QuestionItem) => {
    setVersionTargetId(q.id);
    setIsVersionsModalOpen(true);
  };

  const handleOpenTranslationsModal = (q: QuestionItem) => {
    setSelectedQuestion(q);
    setIsTranslationsModalOpen(true);
  };

  const handleDelete = async (q: QuestionItem) => {
    const isApproved = q.status === 'APPROVED';
    const msg = isApproved
      ? 'This question is Approved. Deleting will move it to Archived status. Proceed?'
      : 'Are you sure you want to delete this question?';

    if (window.confirm(msg)) {
      const { error } = await deleteQuestionAPI(q.id);
      if (!error) {
        fetchQuestions();
        fetchStats();
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Title & CTA Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-500/20 mb-2">
            <Database size={13} />
            <span>Curriculum Question Repository</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Question Bank Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Author, review, version, and curate examination questions across academic hierarchies
          </p>
        </div>

        {/* Create Question CTA */}
        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => navigate('/question-bank/create')}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md shadow-indigo-200"
          >
            <Plus size={16} />
            <span>Create New Question</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Header */}
      <QuestionStatsHeader
        stats={stats}
        isLoading={isLoadingStats}
        selectedStatus={filters.status}
        onStatusClick={handleStatusCardClick}
      />

      {/* Cascading Filter Controls */}
      <QuestionFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* Question List Section */}
      <div className="space-y-4">
        {/* Results Count & Sort Header */}
        <div className="flex items-center justify-between text-xs font-medium text-slate-500 px-1">
          <span>
            Showing <strong>{questions.length}</strong> of <strong>{paginationMeta.total}</strong>{' '}
            questions
          </span>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sort by:</span>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                handleFilterChange({ sortBy, sortOrder: sortOrder as any });
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="version-desc">Version (High to Low)</option>
              <option value="marks-desc">Marks (High to Low)</option>
              <option value="status-asc">Status</option>
            </select>
          </div>
        </div>

        {/* Question Cards Grid */}
        {isLoadingQuestions ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-44 rounded-2xl bg-slate-200/70" />
            ))}
          </div>
        ) : questions.length > 0 ? (
          <div className="space-y-3.5">
            {questions.map((q) => (
              <QuestionCard
                key={q.id}
                question={q}
                onView={handleInspect}
                onEdit={handleEdit}
                onSubmit={handleSubmitQuestion}
                onReviewAction={handleOpenReviewModal}
                onHistory={handleInspect}
                onVersions={handleOpenVersionsModal}
                onTranslations={handleOpenTranslationsModal}
                onDelete={handleDelete}
                isSuperAdmin={isSuperAdmin}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 rounded-3xl border border-dashed border-slate-300 bg-white text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <FileQuestion size={24} />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No questions found</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              No questions matched your current filter criteria. Try adjusting filters or author a
              new question.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-2">
              Reset Filters
            </Button>
          </div>
        )}

        {/* Pagination Controls */}
        {paginationMeta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200/80 bg-white p-4 rounded-2xl shadow-sm text-xs font-medium">
            <span className="text-slate-500">
              Page <strong>{paginationMeta.page}</strong> of{' '}
              <strong>{paginationMeta.totalPages}</strong>
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={paginationMeta.page <= 1}
                onClick={() => handleFilterChange({ page: paginationMeta.page - 1 })}
                className="p-2"
              >
                <ChevronLeft size={16} />
              </Button>

              {[...Array(Math.min(5, paginationMeta.totalPages))].map((_, i) => {
                const pageNum = i + 1;
                const isActive = pageNum === paginationMeta.page;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handleFilterChange({ page: pageNum })}
                    className={`h-8 w-8 rounded-xl font-bold transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                disabled={paginationMeta.page >= paginationMeta.totalPages}
                onClick={() => handleFilterChange({ page: paginationMeta.page + 1 })}
                className="p-2"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <QuestionDetailsModal
        question={selectedQuestion}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={handleEdit}
      />

      <QuestionTranslationsModal
        question={selectedQuestion}
        isOpen={isTranslationsModalOpen}
        onClose={() => setIsTranslationsModalOpen(false)}
        onUpdated={() => {
          fetchQuestions();
          fetchStats();
        }}
      />

      <ReviewActionModal
        question={selectedQuestion}
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          fetchQuestions();
          fetchStats();
        }}
        onStartReview={async (id, comment) => {
          const { error } = await startReviewAPI(id, comment);
          return !error;
        }}
        onApprove={async (id, comment) => {
          const { error } = await approveQuestionAPI(id, comment);
          return !error;
        }}
        onReject={async (id, reason) => {
          const { error } = await rejectQuestionAPI(id, reason);
          return !error;
        }}
        onArchive={async (id, reason) => {
          const { error } = await archiveQuestionAPI(id, reason);
          return !error;
        }}
      />

      <VersionHistoryModal
        questionId={versionTargetId}
        isOpen={isVersionsModalOpen}
        onClose={() => setIsVersionsModalOpen(false)}
        onSelectVersion={(verId) => {
          const found = questions.find((q) => q.id === verId);
          if (found) handleInspect(found);
        }}
      />
    </div>
  );
};

export default QuestionBankPage;
