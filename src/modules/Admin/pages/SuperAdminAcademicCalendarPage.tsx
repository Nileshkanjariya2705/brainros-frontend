/**
 * SuperAdminAcademicCalendarPage
 *
 * Full CRUD Academic Calendar management for Super Admin.
 * - Year-based filtering (default: current year)
 * - Month-grouped chronological list
 * - Create / Edit / Delete calendar entries
 * - End-time auto-calculated from durationMinutes (read-only)
 * - React Query for data management
 * - Light/white theme
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Plus,
  ChevronDown,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  Clock,
  BookOpen,
  X,
  CheckCircle2,
  CalendarClock,
  Search,
} from 'lucide-react';
import { Axios } from '@/base-axios';
import Button from '@/components/ui/Button';
import { ScheduleExamModal } from '@/modules/ExamScheduling/components/ScheduleExamModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  totalQuestions: number;
}

interface CalendarEvent {
  id: string;
  examId: string;
  cycleId: string;
  plannedDate: string;
  plannedStartTime: string;
  plannedEndTime: string;
  timezone: string;
  status: string;
  scheduleVersion: number;
  notes?: string;
  exam: {
    id: string;
    title: string;
    durationMinutes: number;
    totalQuestions: number;
  };
  cycle?: { id: string; name: string; academicYear?: string };
}

interface CalendarListResponse {
  data: CalendarEvent[];
  meta: { total: number; page: number; limit: number; pages: number };
}

interface FormState {
  examId: string;
  plannedDate: string;
  startTime: string; // HH:mm
  durationMinutes: number;
}

// ─── API helpers ──────────────────────────────────────────────────────────────

const QUERY_KEYS = {
  years: ['academic-calendar', 'years'] as const,
  events: (params: { year: number; page: number; limit: number; search?: string }) =>
    ['academic-calendar', params] as const,
  exams: ['exams-list-for-calendar'] as const,
};

async function fetchYears(): Promise<number[]> {
  const res = await Axios.get('/exam-calendar/years');
  const raw = res.data;
  // Guard: return a plain array regardless of wrapping
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

async function fetchEvents(params: {
  year: number;
  page: number;
  limit: number;
  search?: string;
}): Promise<CalendarListResponse> {
  const res = await Axios.get('/exam-calendar', {
    params: {
      year: params.year,
      page: params.page,
      limit: params.limit,
      search: params.search || undefined,
    },
  });
  const raw = res.data;
  // Normalize to expected shape
  if (Array.isArray(raw)) {
    return { data: raw, meta: { total: raw.length, page: params.page, limit: params.limit, pages: 1 } };
  }
  if (raw && Array.isArray(raw.data)) return raw;
  return { data: [], meta: { total: 0, page: params.page, limit: params.limit, pages: 0 } };
}

async function fetchExams(): Promise<Exam[]> {
  const res = await Axios.get('/exams', { params: { limit: 200 } });
  const raw = res.data;
  const list = Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : [];
  return list;
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getMonthLabel(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

function buildISODateTime(date: string, time: string): string {
  // date: YYYY-MM-DD, time: HH:mm → combine into ISO string (treated as IST)
  return `${date}T${time}:00.000+05:30`;
}

function calcEndTimeDisplay(startDate: string, startTime: string, durationMinutes: number): string {
  if (!startDate || !startTime || !durationMinutes) return '—';
  try {
    const start = new Date(buildISODateTime(startDate, startTime));
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    return end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return '—';
  }
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: 'bg-blue-50 text-blue-700 border-blue-200',
  PLANNED: 'bg-amber-50 text-amber-700 border-amber-200',
  RESCHEDULED: 'bg-purple-50 text-purple-700 border-purple-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

// ─── Confirmation Modal ───────────────────────────────────────────────────────

function ConfirmDeleteModal({
  event,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  event: CalendarEvent;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <Trash2 size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Delete Calendar Entry</h3>
            <p className="text-xs text-slate-500">This action cannot be undone</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-200 space-y-1.5">
          <p className="text-sm font-semibold text-slate-800">{event.exam?.title}</p>
          <p className="text-xs text-slate-500">
            {formatDate(event.plannedDate)} · {formatTime(event.plannedStartTime)} – {formatTime(event.plannedEndTime)}
          </p>
          <p className="text-xs text-slate-500">Status: {event.status}</p>
        </div>

        <p className="text-sm text-slate-700 mb-5">
          Are you sure you want to delete this academic calendar entry?{' '}
          <strong>The exam itself will NOT be deleted</strong> — only this scheduling entry.
        </p>

        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isDeleting}
            className="text-xs font-bold px-4 py-2 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isDeleting}
            className="text-xs font-bold px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <span className="flex items-center gap-1.5">
                <RefreshCw size={13} className="animate-spin" /> Deleting...
              </span>
            ) : (
              'Yes, Delete Entry'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Create / Edit Modal ──────────────────────────────────────────────────────

function CalendarEntryModal({
  mode,
  editEvent,
  exams,
  examsLoading,
  onSave,
  onClose,
  isSaving,
  saveError,
}: {
  mode: 'create' | 'edit';
  editEvent?: CalendarEvent;
  exams: Exam[];
  examsLoading: boolean;
  onSave: (form: FormState) => void;
  onClose: () => void;
  isSaving: boolean;
  saveError: string | null;
}) {
  const getDefaultForm = useCallback((): FormState => {
    if (mode === 'edit' && editEvent) {
      const startDt = new Date(editEvent.plannedStartTime);
      const endDt = new Date(editEvent.plannedEndTime);
      const durationMs = endDt.getTime() - startDt.getTime();
      const durationMin = Math.round(durationMs / 60_000);
      return {
        examId: editEvent.examId,
        plannedDate: editEvent.plannedDate.substring(0, 10),
        startTime: startDt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        durationMinutes: durationMin > 0 ? durationMin : (editEvent.exam?.durationMinutes || 60),
      };
    }
    return { examId: '', plannedDate: '', startTime: '', durationMinutes: 60 };
  }, [mode, editEvent]);

  const [form, setForm] = useState<FormState>(getDefaultForm);

  const endTimeDisplay = useMemo(
    () => calcEndTimeDisplay(form.plannedDate, form.startTime, form.durationMinutes),
    [form.plannedDate, form.startTime, form.durationMinutes],
  );

  const selectedExam = exams.find((e) => e.id === form.examId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              {mode === 'create' ? <Plus size={18} /> : <Pencil size={18} />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {mode === 'create' ? 'Create Calendar Entry' : 'Edit Calendar Entry'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {mode === 'create'
                  ? 'Schedule an exam in the academic calendar'
                  : 'Update the scheduled exam details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition"
          >
            <X size={16} />
          </button>
        </div>

        {saveError && (
          <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{saveError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Exam */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Exam <span className="text-red-500">*</span>
            </label>
            {examsLoading ? (
              <div className="h-10 bg-slate-50 rounded-xl border border-slate-200 flex items-center px-3 text-xs text-slate-400">
                <RefreshCw size={12} className="animate-spin mr-2" /> Loading exams...
              </div>
            ) : (
              <select
                required
                value={form.examId}
                onChange={(e) => setForm((f) => ({ ...f, examId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500 transition text-slate-800"
              >
                <option value="">Select an exam...</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title}
                  </option>
                ))}
              </select>
            )}
            {selectedExam && (
              <p className="text-[11px] text-slate-400 mt-1 pl-1">
                Duration: {selectedExam.durationMinutes} min · {selectedExam.totalQuestions} questions
              </p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Start Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              required
              value={form.plannedDate}
              onChange={(e) => setForm((f) => ({ ...f, plannedDate: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500 transition text-slate-800"
            />
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              required
              value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500 transition text-slate-800"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Duration (minutes) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                required
                min={1}
                max={600}
                value={form.durationMinutes}
                onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl text-xs font-medium bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500 transition text-slate-800"
              />
              <div className="flex gap-1">
                {[60, 90, 120, 180].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, durationMinutes: d }))}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold transition ${
                      form.durationMinutes === d
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {d}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* End Time (read-only, auto-calculated) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              End Time{' '}
              <span className="text-[10px] font-normal text-slate-400 ml-1">
                (calculated automatically)
              </span>
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700">
              <Clock size={13} />
              <span>{endTimeDisplay}</span>
              {form.plannedDate && form.startTime && form.durationMinutes > 0 && (
                <span className="ml-auto text-[10px] font-normal text-indigo-500">
                  = Start + {form.durationMinutes} min
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 pl-1">
              End time cannot be edited manually — it is derived from Start Time + Duration.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
              className="text-xs font-bold px-4 py-2 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving || !form.examId || !form.plannedDate || !form.startTime}
              className="text-xs font-bold px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {isSaving ? (
                <span className="flex items-center gap-1.5">
                  <RefreshCw size={13} className="animate-spin" />
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </span>
              ) : mode === 'create' ? (
                <span className="flex items-center gap-1.5">
                  <Plus size={13} /> Create Entry
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Update Entry
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

const SuperAdminAcademicCalendarPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  // ── State ───────────────────────────────────────────────────────────────────
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [page, setPage] = useState<number>(1);
  const limit = 20;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<CalendarEvent | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // Debounce search
  const handleSearchChange = (val: string) => {
    setSearch(val);
    clearTimeout((window as any)._calSearchTimer);
    (window as any)._calSearchTimer = setTimeout(() => {
      setDebouncedSearch(val);
      setPage(1);
    }, 400);
  };

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: availableYears = [] } = useQuery<number[]>({
    queryKey: QUERY_KEYS.years,
    queryFn: fetchYears,
    staleTime: 60_000,
  });

  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsError,
    refetch: refetchEvents,
  } = useQuery<CalendarListResponse>({
    queryKey: QUERY_KEYS.events({ year: selectedYear, page, limit, search: debouncedSearch }),
    queryFn: () => fetchEvents({ year: selectedYear, page, limit, search: debouncedSearch }),
    staleTime: 30_000,
  });

  const { data: exams = [], isLoading: examsLoading } = useQuery<Exam[]>({
    queryKey: QUERY_KEYS.exams,
    queryFn: fetchExams,
    staleTime: 120_000,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────
  const invalidateCalendar = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['academic-calendar'] });
  }, [queryClient]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: FormState }) => {
      const plannedStartTime = buildISODateTime(form.plannedDate, form.startTime);
      const res = await Axios.put(`/exam-calendar/${id}`, {
        examId: form.examId,
        plannedDate: form.plannedDate,
        plannedStartTime,
        durationMinutes: form.durationMinutes,
      });
      return res.data;
    },
    onSuccess: () => {
      invalidateCalendar();
      setEditEvent(null);
      setModalError(null);
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Unable to update calendar entry. Please try again.';
      setModalError(Array.isArray(msg) ? msg.join('; ') : msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await Axios.delete(`/exam-calendar/${id}`);
      return res.data;
    },
    onSuccess: () => {
      invalidateCalendar();
      setDeleteEvent(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Unable to delete entry.';
      alert(msg);
    },
  });

  // ── Data Processing ──────────────────────────────────────────────────────────
  const rawEventsData = eventsData?.data;
  const events: CalendarEvent[] = Array.isArray(rawEventsData) ? rawEventsData : [];

  // Group events by month
  const grouped = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((ev) => {
      const monthKey = getMonthLabel(ev.plannedDate);
      if (!map.has(monthKey)) map.set(monthKey, []);
      map.get(monthKey)!.push(ev);
    });
    return Array.from(map.entries()); // already sorted by date asc from server
  }, [events]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleUpdate = (form: FormState) => {
    if (!editEvent) return;
    setModalError(null);
    updateMutation.mutate({ id: editEvent.id, form });
  };

  const handleDelete = () => {
    if (!deleteEvent) return;
    deleteMutation.mutate(deleteEvent.id);
  };

  const openEdit = (event: CalendarEvent) => {
    setModalError(null);
    setEditEvent(event);
  };

  // Build year options: union of available years + current ± 2
  const yearOptions = useMemo(() => {
    const safeYears = Array.isArray(availableYears) ? availableYears : [];
    const set = new Set<number>(safeYears);
    set.add(currentYear - 1);
    set.add(currentYear);
    set.add(currentYear + 1);
    set.add(currentYear + 2);
    return Array.from(set).sort((a, b) => b - a);
  }, [availableYears, currentYear]);

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto px-2 sm:px-4">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Academic Calendar
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Plan and schedule all exams for the academic year — grouped by month
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {/* Year Selector */}
          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setPage(1);
              }}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-xs hover:bg-slate-50 transition"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>

          <Button
            variant="outline"
            onClick={() => refetchEvents()}
            disabled={eventsLoading}
            className="flex items-center gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs"
          >
            <RefreshCw size={13} className={eventsLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>

          <Button
            onClick={() => {
              setModalError(null);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Plus size={14} />
            Create Calendar Entry
          </Button>
        </div>
      </div>

      {/* ── Year Title + Search ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <h2 className="text-lg font-black text-slate-800">
          Academic Calendar — {selectedYear}
          {selectedYear === currentYear && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold align-middle">
              Current Year
            </span>
          )}
          {selectedYear > currentYear && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold align-middle">
              Future
            </span>
          )}
          {selectedYear < currentYear && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold align-middle">
              Past
            </span>
          )}
        </h2>

        {/* Search */}
        <div className="relative max-w-xs w-full sm:w-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by exam name..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-8 pr-8 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500 transition"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {eventsError && (
        <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200">
          <AlertCircle size={14} />
          <span>Unable to load academic calendar. Please refresh and try again.</span>
          <button
            onClick={() => refetchEvents()}
            className="ml-auto text-xs font-bold underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading ── */}
      {eventsLoading && (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center text-slate-400 shadow-xs">
          <RefreshCw size={32} className="animate-spin text-indigo-600 mb-3" />
          <span className="text-sm font-bold text-slate-700">Loading calendar...</span>
          <span className="text-xs text-slate-400 mt-1">Fetching {selectedYear} academic schedule</span>
        </div>
      )}

      {/* ── Empty State ── */}
      {!eventsLoading && !eventsError && events.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center shadow-xs">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto mb-4">
            <CalendarClock size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-2">
            {debouncedSearch
              ? `No results for "${debouncedSearch}" in ${selectedYear}`
              : `No academic calendar entries found for ${selectedYear}`}
          </h3>
          <p className="text-xs text-slate-500 mb-5 max-w-sm mx-auto">
            {debouncedSearch
              ? 'Try a different search term or clear the search filter.'
              : 'Start scheduling exams for this academic year by creating calendar entries.'}
          </p>
          {!debouncedSearch && (
            <Button
              onClick={() => {
                setModalError(null);
                setShowCreateModal(true);
              }}
              className="text-xs font-bold px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              <Plus size={13} className="mr-1.5 inline" />
              Create Calendar Entry
            </Button>
          )}
        </div>
      )}

      {/* ── Month-grouped Calendar List ── */}
      {!eventsLoading && !eventsError && grouped.length > 0 && (
        <div className="space-y-5">
          {grouped.map(([monthLabel, monthEvents]) => (
            <div key={monthLabel} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Month Header */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-indigo-50 to-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <CalendarDays size={16} className="text-indigo-600" />
                  <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">
                    {monthLabel}
                  </h3>
                </div>
                <span className="text-[11px] font-bold text-slate-400 bg-white px-2.5 py-0.5 rounded-full border border-slate-200">
                  {monthEvents.length} {monthEvents.length === 1 ? 'exam' : 'exams'}
                </span>
              </div>

              {/* Entries */}
              <div className="divide-y divide-slate-100">
                {monthEvents.map((ev) => {
                  const canEdit = !['COMPLETED', 'CANCELLED'].includes(ev.status);
                  return (
                    <div
                      key={ev.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50/60 transition group"
                    >
                      {/* Left: Date + info */}
                      <div className="flex items-center gap-4">
                        {/* Date block */}
                        <div className="flex flex-col items-center justify-center shrink-0 w-12 h-14 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-800 text-center">
                          <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
                            {new Date(ev.plannedDate).toLocaleString('en-IN', { month: 'short' })}
                          </span>
                          <span className="text-xl font-black leading-tight">
                            {new Date(ev.plannedDate).getDate()}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {ev.exam?.title}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                STATUS_COLORS[ev.status] || 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {ev.status}
                            </span>
                            {ev.scheduleVersion > 1 && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                v{ev.scheduleVersion}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                              <Clock size={12} className="text-indigo-500" />
                              {formatTime(ev.plannedStartTime)} – {formatTime(ev.plannedEndTime)}
                            </span>
                            <span>·</span>
                            <span className="inline-flex items-center gap-1">
                              <BookOpen size={12} className="text-slate-400" />
                              {ev.exam?.durationMinutes} min
                            </span>
                            {ev.exam?.totalQuestions > 0 && (
                              <>
                                <span>·</span>
                                <span>{ev.exam.totalQuestions} questions</span>
                              </>
                            )}
                            {ev.cycle?.academicYear && (
                              <>
                                <span>·</span>
                                <span className="text-slate-400">{ev.cycle.academicYear}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto opacity-80 group-hover:opacity-100 transition">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(ev)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition shadow-2xs"
                          >
                            <Pencil size={12} />
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteEvent(ev)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-200 text-slate-700 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition shadow-2xs"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Summary footer */}
          <div className="text-xs text-slate-400 text-center pb-2">
            {eventsData?.meta?.total ?? events.length} calendar {(eventsData?.meta?.total ?? events.length) === 1 ? 'entry' : 'entries'} in {selectedYear} ·
            Ordered chronologically
          </div>

          {/* Server-Side Pagination Controls */}
          {eventsData?.meta && eventsData.meta.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 rounded-2xl shadow-xs">
              <p className="text-xs font-semibold text-slate-500">
                Showing {(eventsData.meta.page - 1) * eventsData.meta.limit + 1} to{' '}
                {Math.min(eventsData.meta.page * eventsData.meta.limit, eventsData.meta.total)} of{' '}
                {eventsData.meta.total} entries
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={eventsData.meta.page <= 1}
                  className="rounded-xl text-xs font-bold"
                >
                  Previous
                </Button>
                <span className="text-xs font-bold text-slate-700 px-2">
                  Page {eventsData.meta.page} of {eventsData.meta.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(eventsData.meta.pages, p + 1))}
                  disabled={eventsData.meta.page >= eventsData.meta.pages}
                  className="rounded-xl text-xs font-bold"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create / Schedule Exam Modal (Shared with Schedule Exam) ── */}
      {showCreateModal && (
        <ScheduleExamModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setModalError(null);
          }}
          onScheduled={() => {
            invalidateCalendar();
            setShowCreateModal(false);
            setModalError(null);
          }}
        />
      )}

      {/* ── Edit Modal ── */}
      {editEvent && (
        <CalendarEntryModal
          mode="edit"
          editEvent={editEvent}
          exams={exams}
          examsLoading={examsLoading}
          onSave={handleUpdate}
          onClose={() => {
            setEditEvent(null);
            setModalError(null);
          }}
          isSaving={updateMutation.isPending}
          saveError={modalError}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteEvent && (
        <ConfirmDeleteModal
          event={deleteEvent}
          onConfirm={handleDelete}
          onCancel={() => setDeleteEvent(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
};

export default SuperAdminAcademicCalendarPage;
