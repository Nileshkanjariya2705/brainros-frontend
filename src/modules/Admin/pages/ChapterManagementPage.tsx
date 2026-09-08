import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Layers,
  X,
  FileQuestion,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import {
  useGetAllChaptersAPI,
  useGetSubjectsAPI,
  useCreateChapterAPI,
  useUpdateChapterAPI,
  useDeleteChapterAPI,
  useReorderChaptersAPI,
} from '@/modules/QuestionBank/services/questionBank.service';
import type { ChapterItem, CreateChapterPayload, UpdateChapterPayload } from '@/modules/QuestionBank/types/questionBank.types';
import Button from '@/components/ui/Button';
import { formatSubjectDisplayName, isAllowedSubject } from '@/constants/subjects.constant';

export const ChapterManagementPage: React.FC = () => {
  // ─── State ───────────────────────────────────────────────────
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ChapterItem | null>(null);
  const [deletingChapter, setDeletingChapter] = useState<ChapterItem | null>(null);

  // Chapter Form State
  const [formData, setFormData] = useState<{
    subjectId: string;
    name: string;
    code: string;
    description: string;
    displayOrder: number;
    isActive: boolean;
  }>({
    subjectId: '',
    name: '',
    code: '',
    description: '',
    displayOrder: 1,
    isActive: true,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ─── API Hooks ────────────────────────────────────────────────
  const { getAllChaptersAPI, isLoading: isFetchingChapters } = useGetAllChaptersAPI();
  const { getSubjectsAPI } = useGetSubjectsAPI();
  const { createChapterAPI, isLoading: isCreating } = useCreateChapterAPI();
  const { updateChapterAPI, isLoading: isUpdating } = useUpdateChapterAPI();
  const { deleteChapterAPI, isLoading: isDeleting } = useDeleteChapterAPI();
  const { reorderChaptersAPI } = useReorderChaptersAPI();

  // ─── Load Initial Data ───────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [subjectsRes, chaptersRes] = await Promise.all([
        getSubjectsAPI(),
        getAllChaptersAPI({ includeInactive: true }),
      ]);

      const rawSubList = Array.isArray(subjectsRes?.data)
        ? subjectsRes.data
        : (subjectsRes?.data as any)?.data || [];
      const subList = rawSubList.filter((s: any) => isAllowedSubject(s.name));
      setSubjects(subList);

      const chList = Array.isArray(chaptersRes?.data)
        ? chaptersRes.data
        : (chaptersRes?.data as any)?.data || [];
      setChapters(chList);
    } catch (err: any) {
      setFeedbackMsg({
        type: 'error',
        text: err?.message || 'Failed to load master data.',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [getSubjectsAPI, getAllChaptersAPI]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss alert messages
  useEffect(() => {
    if (feedbackMsg) {
      const timer = setTimeout(() => setFeedbackMsg(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMsg]);

  // ─── Filtered Chapters List ──────────────────────────────────
  const filteredChapters = useMemo(() => {
    return chapters.filter((c) => {
      // Subject Filter
      if (selectedSubjectFilter !== 'ALL' && c.subjectId !== selectedSubjectFilter) {
        return false;
      }

      // Status Filter
      if (selectedStatusFilter === 'ACTIVE' && !c.isActive) return false;
      if (selectedStatusFilter === 'INACTIVE' && c.isActive) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = c.name.toLowerCase().includes(query);
        const matchesCode = c.code ? c.code.toLowerCase().includes(query) : false;
        const matchesSubject = c.subject?.name ? c.subject.name.toLowerCase().includes(query) : false;
        if (!matchesName && !matchesCode && !matchesSubject) return false;
      }

      return true;
    });
  }, [chapters, selectedSubjectFilter, selectedStatusFilter, searchQuery]);

  // ─── Stats / Counts ──────────────────────────────────────────
  const stats = useMemo(() => {
    const total = chapters.length;
    const active = chapters.filter((c) => c.isActive).length;
    const inactive = total - active;
    const totalQuestions = chapters.reduce((acc, c) => acc + (c._count?.questions || 0), 0);
    return { total, active, inactive, totalQuestions };
  }, [chapters]);

  // ─── Duplicate Check Helper ──────────────────────────────────
  const checkDuplicateName = (subjectId: string, name: string, excludeId?: string) => {
    const trimmed = name.trim().toLowerCase();
    return chapters.some(
      (c) =>
        c.subjectId === subjectId &&
        c.name.trim().toLowerCase() === trimmed &&
        c.id !== excludeId,
    );
  };



  // ─── Open Add Chapter Modal ──────────────────────────────────
  const handleOpenAddModal = () => {
    const defaultSubjectId = selectedSubjectFilter !== 'ALL' ? selectedSubjectFilter : (subjects[0]?.id || '');
    const subjectChapters = chapters.filter((c) => c.subjectId === defaultSubjectId);
    const nextOrder = subjectChapters.length > 0
      ? Math.max(...subjectChapters.map((c) => c.displayOrder || 0)) + 1
      : 1;

    setFormData({
      subjectId: defaultSubjectId,
      name: '',
      code: '',
      description: '',
      displayOrder: nextOrder,
      isActive: true,
    });
    setFormErrors({});
    setIsAddModalOpen(true);
  };

  // ─── Open Edit Modal ─────────────────────────────────────────
  const handleOpenEditModal = (chapter: ChapterItem) => {
    setEditingChapter(chapter);
    setFormData({
      subjectId: chapter.subjectId,
      name: chapter.name,
      code: chapter.code || '',
      description: chapter.description || '',
      displayOrder: chapter.displayOrder,
      isActive: chapter.isActive,
    });
    setFormErrors({});
  };

  // ─── Handle Subject Change in Modal ──────────────────────────
  const handleSubjectChange = (newSubjectId: string) => {
    const subjectChapters = chapters.filter((c) => c.subjectId === newSubjectId);
    const nextOrder = subjectChapters.length > 0
      ? Math.max(...subjectChapters.map((c) => c.displayOrder || 0)) + 1
      : 1;

    setFormData((prev) => ({
      ...prev,
      subjectId: newSubjectId,
      displayOrder: prev.displayOrder === 1 ? nextOrder : prev.displayOrder,
    }));

    if (formData.name) {
      if (checkDuplicateName(newSubjectId, formData.name, editingChapter?.id)) {
        setFormErrors((prev) => ({
          ...prev,
          name: 'A chapter with this name already exists under the selected Subject.',
        }));
      } else {
        setFormErrors((prev) => {
          const updated = { ...prev };
          delete updated.name;
          return updated;
        });
      }
    }
  };

  // ─── Handle Name Change with Live Duplicate Validation ───────
  const handleNameChange = (name: string) => {
    setFormData((prev) => ({ ...prev, name }));
    if (!name.trim()) {
      setFormErrors((prev) => ({ ...prev, name: 'Chapter name is required.' }));
    } else if (checkDuplicateName(formData.subjectId, name, editingChapter?.id)) {
      setFormErrors((prev) => ({
        ...prev,
        name: 'A chapter with this name already exists under the selected Subject.',
      }));
    } else {
      setFormErrors((prev) => {
        const updated = { ...prev };
        delete updated.name;
        return updated;
      });
    }
  };

  // ─── Submit Add Chapter ──────────────────────────────────────
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subjectId) {
      setFormErrors((prev) => ({ ...prev, subjectId: 'Please select a Subject.' }));
      return;
    }
    if (!formData.name.trim()) {
      setFormErrors((prev) => ({ ...prev, name: 'Chapter name is required.' }));
      return;
    }
    if (checkDuplicateName(formData.subjectId, formData.name)) {
      setFormErrors((prev) => ({
        ...prev,
        name: 'A chapter with this name already exists under the selected Subject.',
      }));
      return;
    }

    const payload: CreateChapterPayload = {
      subjectId: formData.subjectId,
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      description: formData.description.trim() || undefined,
      displayOrder: Number(formData.displayOrder) || 1,
      isActive: formData.isActive,
    };

    const res = await createChapterAPI(payload);
    if (res?.error) {
      setFeedbackMsg({
        type: 'error',
        text: typeof res.error === 'string' ? res.error : (res.error as any).message || 'Failed to create chapter.',
      });
      return;
    }

    setFeedbackMsg({
      type: 'success',
      text: `Chapter "${payload.name}" was created successfully.`,
    });
    setIsAddModalOpen(false);
    loadData();
  };

  // ─── Submit Edit Chapter ─────────────────────────────────────
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChapter) return;

    if (!formData.name.trim()) {
      setFormErrors((prev) => ({ ...prev, name: 'Chapter name is required.' }));
      return;
    }

    if (checkDuplicateName(formData.subjectId, formData.name, editingChapter.id)) {
      setFormErrors((prev) => ({
        ...prev,
        name: 'A chapter with this name already exists under this Subject.',
      }));
      return;
    }

    const payload: UpdateChapterPayload = {
      subjectId: formData.subjectId !== editingChapter.subjectId ? formData.subjectId : undefined,
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      description: formData.description.trim() || undefined,
      displayOrder: Number(formData.displayOrder) || 1,
      isActive: formData.isActive,
    };

    const res = await updateChapterAPI(editingChapter.id, payload);
    if (res?.error) {
      setFeedbackMsg({
        type: 'error',
        text: typeof res.error === 'string' ? res.error : (res.error as any).message || 'Failed to update chapter.',
      });
      return;
    }

    setFeedbackMsg({
      type: 'success',
      text: `Chapter "${formData.name}" was updated successfully.`,
    });
    setEditingChapter(null);
    loadData();
  };

  // ─── Toggle Quick Status (Active / Inactive) ─────────────────
  const handleToggleStatus = async (chapter: ChapterItem) => {
    const newStatus = !chapter.isActive;
    const res = await updateChapterAPI(chapter.id, { isActive: newStatus });
    if (res?.error) {
      setFeedbackMsg({
        type: 'error',
        text: typeof res.error === 'string' ? res.error : (res.error as any).message || 'Status update failed.',
      });
      return;
    }

    setChapters((prev) =>
      prev.map((c) => (c.id === chapter.id ? { ...c, isActive: newStatus } : c)),
    );

    setFeedbackMsg({
      type: 'success',
      text: `Chapter "${chapter.name}" is now ${newStatus ? 'ACTIVE' : 'INACTIVE/ARCHIVED'}.`,
    });
  };

  // ─── Confirm Delete / Deactivate ─────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deletingChapter) return;

    const res = await deleteChapterAPI(deletingChapter.id);
    if (res?.error) {
      setFeedbackMsg({
        type: 'error',
        text: typeof res.error === 'string' ? res.error : (res.error as any).message || 'Operation failed.',
      });
      setDeletingChapter(null);
      return;
    }

    const resData = (res?.data as any) || {};
    if (resData.deactivated) {
      setFeedbackMsg({
        type: 'success',
        text: resData.message || `Chapter "${deletingChapter.name}" has been deactivated to preserve references.`,
      });
    } else {
      setFeedbackMsg({
        type: 'success',
        text: resData.message || `Chapter "${deletingChapter.name}" was deleted successfully.`,
      });
    }

    setDeletingChapter(null);
    loadData();
  };

  // ─── Move Chapter Order (Up / Down) ──────────────────────────
  const handleMoveOrder = async (chapter: ChapterItem, direction: 'UP' | 'DOWN') => {
    const subjectChapters = chapters
      .filter((c) => c.subjectId === chapter.subjectId)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

    const currentIndex = subjectChapters.findIndex((c) => c.id === chapter.id);
    if (currentIndex === -1) return;
    if (direction === 'UP' && currentIndex === 0) return;
    if (direction === 'DOWN' && currentIndex === subjectChapters.length - 1) return;

    const targetIndex = direction === 'UP' ? currentIndex - 1 : currentIndex + 1;
    const reorderedList = [...subjectChapters];
    const [moved] = reorderedList.splice(currentIndex, 1);
    reorderedList.splice(targetIndex, 0, moved);

    const chapterIds = reorderedList.map((c) => c.id);

    const res = await reorderChaptersAPI(chapter.subjectId, chapterIds);
    if (res?.error) {
      setFeedbackMsg({
        type: 'error',
        text: 'Failed to reorder chapters.',
      });
      return;
    }

    loadData();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TOP HEADER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-100">
              <BookOpen size={20} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Subject-wise Chapter Master Data
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Manage normalized master chapters, display ordering, and lifecycle statuses across examination subjects.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-indigo-600' : ''} />
            <span>Refresh</span>
          </button>

          <Button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all"
          >
            <Plus size={16} />
            <span>Add Chapter</span>
          </Button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FEEDBACK TOAST / BANNER */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {feedbackMsg && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-sm border transition-all animate-in fade-in ${
            feedbackMsg.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* STATS METRIC CARDS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Master Chapters</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Active Chapters</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.active}</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Inactive / Archived</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{stats.inactive}</p>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Total Questions Linked</p>
          <p className="text-2xl font-black text-indigo-700 mt-1">{stats.totalQuestions}</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* FILTER & SEARCH CONTROLS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search chapters by name, code, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-4 py-2.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Subject:</label>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {formatSubjectDisplayName(sub.name)} {sub.examTarget?.name ? `(${sub.examTarget.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-600 whitespace-nowrap">Status:</label>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold text-slate-800 focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive / Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* CHAPTERS TABLE & RESPONSIVE CARDS */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isFetchingChapters && chapters.length === 0 ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500 flex flex-col items-center gap-3">
            <RefreshCw size={24} className="animate-spin text-indigo-600" />
            <span>Loading chapters master data...</span>
          </div>
        ) : filteredChapters.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto">
              <BookOpen size={24} />
            </div>
            <p className="text-sm font-bold text-slate-800">No chapters found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery || selectedSubjectFilter !== 'ALL' || selectedStatusFilter !== 'ALL'
                ? 'Try adjusting your search filters or subject selection.'
                : 'Get started by creating your first subject-wise chapter.'}
            </p>
            <Button
              onClick={handleOpenAddModal}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all"
            >
              <Plus size={14} className="mr-1 inline" /> Add Chapter
            </Button>
          </div>
        ) : (
          <div>
            {/* Desktop Table View (Hidden on mobile/small tablets) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                    <th className="py-3.5 pl-6 pr-3">Order</th>
                    <th className="py-3.5 px-4">Subject</th>
                    <th className="py-3.5 px-4">Chapter Name & Code</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4 text-center">Dependencies</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {filteredChapters.map((chapter, index) => {
                    const subjectName = chapter.subject?.name ? formatSubjectDisplayName(chapter.subject.name) : '—';
                    const hasQuestions = (chapter._count?.questions || 0) > 0;
                    const hasTopics = (chapter._count?.topics || 0) > 0;

                    return (
                      <tr key={chapter.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* Order & Reorder Controls */}
                        <td className="py-3.5 pl-6 pr-3">
                          <div className="flex items-center gap-1.5">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 font-extrabold text-[11px] text-slate-700">
                              {chapter.displayOrder || index + 1}
                            </span>
                            <div className="flex flex-col">
                              <button
                                onClick={() => handleMoveOrder(chapter, 'UP')}
                                title="Move up"
                                className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                              >
                                <ArrowUp size={11} />
                              </button>
                              <button
                                onClick={() => handleMoveOrder(chapter, 'DOWN')}
                                title="Move down"
                                className="p-0.5 text-slate-400 hover:text-indigo-600 transition-colors"
                              >
                                <ArrowDown size={11} />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Subject */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-800">
                            {subjectName}
                          </span>
                        </td>

                        {/* Chapter Name & Code */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-900">{chapter.name}</p>
                            {chapter.code && (
                              <span className="inline-block font-mono text-[10px] font-semibold text-slate-500">
                                Code: {chapter.code}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Description */}
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-500">
                          {chapter.description || <span className="italic text-slate-400">No description</span>}
                        </td>

                        {/* Dependencies */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                hasQuestions ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              <FileQuestion size={11} />
                              {chapter._count?.questions || 0} Qs
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                                hasTopics ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              <Layers size={11} />
                              {chapter._count?.topics || 0} Topics
                            </span>
                          </div>
                        </td>

                        {/* Status Toggle Badge */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(chapter)}
                            title="Click to toggle status"
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition-all ${
                              chapter.isActive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${chapter.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span>{chapter.isActive ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 pl-4 pr-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenEditModal(chapter)}
                              className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                              title="Edit Chapter"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => setDeletingChapter(chapter)}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              title="Delete / Archive Chapter"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Responsive Cards */}
            <div className="block lg:hidden divide-y divide-slate-100 p-3 space-y-3">
              {filteredChapters.map((chapter, index) => {
                const subjectName = chapter.subject?.name ? formatSubjectDisplayName(chapter.subject.name) : '—';
                const hasQuestions = (chapter._count?.questions || 0) > 0;
                const hasTopics = (chapter._count?.topics || 0) > 0;

                return (
                  <div
                    key={chapter.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm hover:border-indigo-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 font-extrabold text-[10px] text-slate-700">
                            #{chapter.displayOrder || index + 1}
                          </span>
                          <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-800">
                            {subjectName}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900">{chapter.name}</h3>
                        {chapter.code && (
                          <p className="font-mono text-[10px] font-semibold text-slate-500">Code: {chapter.code}</p>
                        )}
                      </div>

                      {/* Status Toggle */}
                      <button
                        onClick={() => handleToggleStatus(chapter)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          chapter.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${chapter.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span>{chapter.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </div>

                    {chapter.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{chapter.description}</p>
                    )}

                    {/* Bottom Metadata & Actions */}
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            hasQuestions ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <FileQuestion size={11} /> {chapter._count?.questions || 0} Qs
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            hasTopics ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Layers size={11} /> {chapter._count?.topics || 0} Topics
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(chapter)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => setDeletingChapter(chapter)}
                          className="flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* ADD CHAPTER MODAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Plus size={16} />
                </div>
                <h2 className="text-base font-extrabold text-slate-900">Add New Master Chapter</h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="space-y-4 text-xs">
              {/* Step 1: Subject Select */}
              <div className="space-y-1.5 border-b border-slate-100 pb-3">
                <label className="font-bold text-slate-800 block text-xs">
                  Step 1: Select Subject <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-slate-500 mb-1">
                  Choose from fixed subjects (Physics, Chemistry, Biology, Mathematics)
                </p>
                <select
                  value={formData.subjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className={`w-full rounded-xl border p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 ${
                    formErrors.subjectId
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-100'
                      : 'border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                >
                  <option value="">-- Select Subject --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatSubjectDisplayName(s.name)} {s.examTarget?.name ? `(${s.examTarget.name})` : ''}
                    </option>
                  ))}
                </select>
                {formErrors.subjectId && (
                  <p className="text-[11px] font-semibold text-rose-600">{formErrors.subjectId}</p>
                )}
              </div>

              {/* Step 2: Chapter Name */}
              <div className="space-y-1.5 pt-1">
                <label className="font-bold text-slate-800 block text-xs">
                  Step 2: Enter Chapter Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Physics and Measurement, Kinematics..."
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full rounded-xl border p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-100'
                      : 'border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] font-semibold text-rose-600">{formErrors.name}</p>
                )}
              </div>

              {/* Chapter Code & Display Order (2 cols) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Chapter Code</label>
                  <input
                    type="text"
                    placeholder="e.g. PHY_01"
                    value={formData.code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Description (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Provide syllabus overview, unit details, or scope..."
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Status</label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={formData.isActive === true}
                      onChange={() => setFormData((prev) => ({ ...prev, isActive: true }))}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800">Active (Visible in Question Form)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isActive"
                      checked={formData.isActive === false}
                      onChange={() => setFormData((prev) => ({ ...prev, isActive: false }))}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-600">Inactive</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={isCreating || !!formErrors.name || !!formErrors.subjectId}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isCreating ? 'Saving...' : 'Save Chapter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* EDIT CHAPTER MODAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {editingChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Edit2 size={16} />
                </div>
                <h2 className="text-base font-extrabold text-slate-900">Edit Chapter Master</h2>
              </div>
              <button
                onClick={() => setEditingChapter(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              {/* Subject Select */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Subject <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.subjectId}
                  disabled={(editingChapter._count?.questions || 0) > 0}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatSubjectDisplayName(s.name)} {s.examTarget?.name ? `(${s.examTarget.name})` : ''}
                    </option>
                  ))}
                </select>
                {(editingChapter._count?.questions || 0) > 0 && (
                  <p className="text-[11px] font-semibold text-amber-600">
                    Subject reassignment is locked because {editingChapter._count?.questions} questions reference this chapter.
                  </p>
                )}
              </div>

              {/* Chapter Name */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">
                  Chapter Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full rounded-xl border p-3 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? 'border-rose-300 bg-rose-50/50 focus:ring-rose-100'
                      : 'border-slate-200 bg-slate-50/50 focus:border-indigo-500 focus:ring-indigo-100'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[11px] font-semibold text-rose-600">{formErrors.name}</p>
                )}
              </div>

              {/* Chapter Code & Display Order */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Chapter Code</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-slate-700 block">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData((prev) => ({ ...prev, displayOrder: parseInt(e.target.value) || 1 }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
                />
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Status</label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editIsActive"
                      checked={formData.isActive === true}
                      onChange={() => setFormData((prev) => ({ ...prev, isActive: true }))}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-800">Active</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="editIsActive"
                      checked={formData.isActive === false}
                      onChange={() => setFormData((prev) => ({ ...prev, isActive: false }))}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="font-semibold text-slate-600">Inactive / Archived</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingChapter(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                  disabled={isUpdating || !!formErrors.name}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isUpdating ? 'Updating...' : 'Update Chapter'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* SAFE DELETE / DEACTIVATE CONFIRMATION MODAL */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {deletingChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                  (deletingChapter._count?.questions || 0) > 0 || (deletingChapter._count?.topics || 0) > 0
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {(deletingChapter._count?.questions || 0) > 0 || (deletingChapter._count?.topics || 0) > 0
                    ? 'Deactivate / Archive Chapter?'
                    : 'Permanently Remove Chapter?'}
                </h3>
                <p className="text-xs font-semibold text-slate-500">{deletingChapter.name}</p>
              </div>
            </div>

            {(deletingChapter._count?.questions || 0) > 0 || (deletingChapter._count?.topics || 0) > 0 ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-2 text-xs text-amber-900">
                <p className="font-bold">
                  "{deletingChapter.name}" is currently referenced by {deletingChapter._count?.questions || 0} questions and {deletingChapter._count?.topics || 0} topics.
                </p>
                <p className="text-[11px] leading-relaxed">
                  This chapter cannot be permanently deleted to prevent corrupting historical exams and test attempts. Deactivating it will safely archive the record and hide it from future question authoring forms.
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                This chapter has no attached questions or topics. Are you sure you want to permanently delete this master record? This action cannot be undone.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setDeletingChapter(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={`rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all ${
                  (deletingChapter._count?.questions || 0) > 0
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                }`}
              >
                {isDeleting
                  ? 'Processing...'
                  : (deletingChapter._count?.questions || 0) > 0
                    ? 'Deactivate / Archive'
                    : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default ChapterManagementPage;
