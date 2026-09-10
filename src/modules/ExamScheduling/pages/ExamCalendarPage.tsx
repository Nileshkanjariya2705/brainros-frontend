import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Calendar,
  Clock,
  Search,
  RefreshCw,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  ArrowDownWideNarrow,
  X,
  Layers,
  Award,
  BookOpen,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Axios } from '@/base-axios';
import Button from '@/components/ui/Button';

export interface CalendarExamItem {
  id: string;
  examId: string;
  title: string;
  description?: string;
  examTarget?: string;
  subjects?: string[];
  plannedDate: string; // ISO date or string
  plannedStartTime: string; // ISO string
  plannedEndTime: string; // ISO string
  timezone: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  status: 'LIVE' | 'UPCOMING' | 'COMPLETED';
  rawStatus?: string;
  canStart: boolean;
  activeAttemptId?: string | null;
  attempt?: {
    id: string;
    status: string;
    result?: {
      id: string;
      totalScore: number;
      maxScore: number;
      percentage: number;
    } | null;
  } | null;
  cycleName?: string;
  academicYear?: string;
  createdAt: string;
}

export const ExamCalendarPage: React.FC = () => {
  const navigate = useNavigate();

  const [exams, setExams] = useState<CalendarExamItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Filters State ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilterPreset, setDateFilterPreset] = useState<
    'ALL' | 'TODAY' | 'UPCOMING' | 'THIS_WEEK' | 'THIS_MONTH' | 'COMPLETED'
  >('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // ─── Fetch All Exams for Student ──────────────────────────────────────────
  const fetchAllExams = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch student enrolled / accessible exams
      const [studentExamsRes, calendarRes] = await Promise.allSettled([
        Axios.get('/students/me/exams', { params: { limit: 100 } }),
        Axios.get('/exam-calendar', { params: { limit: 100 } }),
      ]);

      const itemsMap = new Map<string, CalendarExamItem>();

      // Process /students/me/exams
      if (studentExamsRes.status === 'fulfilled') {
        const raw = studentExamsRes.value?.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.data?.data)
              ? raw.data.data
              : [];

        list.forEach((item: any) => {
          const startTime = item.startTime || item.plannedStartTime || item.createdAt || new Date().toISOString();
          const endTime = item.endTime || item.plannedEndTime || new Date(new Date(startTime).getTime() + (item.durationMinutes || 180) * 60000).toISOString();
          const plannedDate = item.plannedDate || startTime.substring(0, 10);

          let status: 'LIVE' | 'UPCOMING' | 'COMPLETED' = 'UPCOMING';
          const now = new Date();
          const start = new Date(startTime);
          const end = new Date(endTime);

          if (item.status === 'COMPLETED' || item.rawStatus === 'COMPLETED' || (item.attempt && item.attempt.status === 'SUBMITTED')) {
            status = 'COMPLETED';
          } else if (now >= start && now <= end) {
            status = 'LIVE';
          } else if (now < start) {
            status = 'UPCOMING';
          } else {
            status = 'COMPLETED';
          }

          itemsMap.set(item.id, {
            id: item.id,
            examId: item.examId || item.id,
            title: item.title || 'Examination',
            description: item.description || '',
            examTarget: item.examTarget || item.examTarget?.name || 'General',
            subjects: Array.isArray(item.subjects) ? item.subjects : [],
            plannedDate,
            plannedStartTime: startTime,
            plannedEndTime: endTime,
            timezone: item.timezone || 'Asia/Kolkata',
            durationMinutes: item.durationMinutes || 180,
            totalQuestions: item.totalQuestions || 0,
            totalMarks: item.totalMarks || 0,
            status,
            rawStatus: item.status || item.rawStatus,
            canStart: Boolean(item.canStart),
            activeAttemptId: item.activeAttemptId || null,
            attempt: item.attempt || null,
            createdAt: item.createdAt || startTime,
          });
        });
      }

      // Process /exam-calendar events if present
      if (calendarRes.status === 'fulfilled') {
        const rawCal = calendarRes.value?.data;
        const calList = Array.isArray(rawCal)
          ? rawCal
          : Array.isArray(rawCal?.data)
            ? rawCal.data
            : [];

        calList.forEach((ev: any) => {
          const examId = ev.exam?.id || ev.examId;
          const startTime = ev.plannedStartTime || ev.plannedDate;
          const endTime = ev.plannedEndTime || startTime;
          const plannedDate = ev.plannedDate || startTime.substring(0, 10);

          // If not already present from student exams, add it
          if (!itemsMap.has(examId) && !itemsMap.has(ev.id)) {
            let status: 'LIVE' | 'UPCOMING' | 'COMPLETED' = 'UPCOMING';
            const now = new Date();
            const start = new Date(startTime);
            const end = new Date(endTime);

            if (ev.status === 'COMPLETED' || now > end) {
              status = 'COMPLETED';
            } else if (now >= start && now <= end) {
              status = 'LIVE';
            } else {
              status = 'UPCOMING';
            }

            itemsMap.set(ev.id, {
              id: ev.id,
              examId,
              title: ev.exam?.title || 'Academic Mock Exam',
              description: ev.notes || '',
              examTarget: 'Academic Mock',
              subjects: [],
              plannedDate,
              plannedStartTime: startTime,
              plannedEndTime: endTime,
              timezone: ev.timezone || 'Asia/Kolkata',
              durationMinutes: ev.exam?.durationMinutes || 180,
              totalQuestions: ev.exam?.totalQuestions || 0,
              totalMarks: ev.exam?.totalMarks || 0,
              status,
              rawStatus: ev.status,
              canStart: status === 'LIVE',
              cycleName: ev.cycle?.name,
              academicYear: ev.cycle?.academicYear,
              createdAt: ev.createdAt || startTime,
            });
          }
        });
      }

      // If both were empty, fallback to /exams
      if (itemsMap.size === 0) {
        try {
          const fallbackRes = await Axios.get('/exams');
          const fallbackList = Array.isArray(fallbackRes.data)
            ? fallbackRes.data
            : Array.isArray(fallbackRes.data?.data)
              ? fallbackRes.data.data
              : [];

          fallbackList.forEach((item: any) => {
            const startTime = item.createdAt || new Date().toISOString();
            itemsMap.set(item.id, {
              id: item.id,
              examId: item.id,
              title: item.title,
              description: item.description || '',
              examTarget: item.examTarget?.name || 'General',
              subjects: [],
              plannedDate: startTime.substring(0, 10),
              plannedStartTime: startTime,
              plannedEndTime: new Date(new Date(startTime).getTime() + (item.durationMinutes || 180) * 60000).toISOString(),
              timezone: 'Asia/Kolkata',
              durationMinutes: item.durationMinutes || 180,
              totalQuestions: item.totalQuestions || 0,
              totalMarks: item.totalMarks || 0,
              status: 'UPCOMING',
              canStart: false,
              createdAt: startTime,
            });
          });
        } catch {
          // ignore
        }
      }

      const allList = Array.from(itemsMap.values());

      // ─── Sort strictly by latest (newest / most recent first) ───────────────
      allList.sort((a, b) => {
        const timeA = new Date(a.plannedStartTime || a.plannedDate || a.createdAt).getTime();
        const timeB = new Date(b.plannedStartTime || b.plannedDate || b.createdAt).getTime();
        return timeB - timeA;
      });

      setExams(allList);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load examination calendar.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllExams();
  }, [fetchAllExams]);

  // ─── Filter Logic: Date-wise & Search Filtered Exams ───────────────────────
  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      // 1. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = exam.title.toLowerCase().includes(query);
        const matchesTarget = (exam.examTarget || '').toLowerCase().includes(query);
        const matchesSubject = (exam.subjects || []).some((s) => s.toLowerCase().includes(query));
        if (!matchesTitle && !matchesTarget && !matchesSubject) {
          return false;
        }
      }

      const examDate = new Date(exam.plannedStartTime || exam.plannedDate);
      const examDateStr = examDate.toISOString().substring(0, 10);

      // 2. Specific Date Picker Filter
      if (selectedDate) {
        if (examDateStr !== selectedDate) {
          return false;
        }
      }

      // 3. Date Range Filter
      if (startDate) {
        if (examDateStr < startDate) return false;
      }
      if (endDate) {
        if (examDateStr > endDate) return false;
      }

      // 4. Quick Date Presets
      if (dateFilterPreset !== 'ALL') {
        const todayStr = new Date().toISOString().substring(0, 10);
        const now = new Date();

        if (dateFilterPreset === 'TODAY') {
          if (examDateStr !== todayStr) return false;
        } else if (dateFilterPreset === 'UPCOMING') {
          if (exam.status === 'COMPLETED' || examDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
            return false;
          }
        } else if (dateFilterPreset === 'THIS_WEEK') {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);

          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);

          if (examDate < startOfWeek || examDate > endOfWeek) return false;
        } else if (dateFilterPreset === 'THIS_MONTH') {
          if (examDate.getFullYear() !== now.getFullYear() || examDate.getMonth() !== now.getMonth()) {
            return false;
          }
        } else if (dateFilterPreset === 'COMPLETED') {
          if (exam.status !== 'COMPLETED') return false;
        }
      }

      return true;
    });
  }, [exams, searchQuery, selectedDate, startDate, endDate, dateFilterPreset]);

  // Metric counts
  const metrics = useMemo(() => {
    const total = exams.length;
    const live = exams.filter((e) => e.status === 'LIVE').length;
    const upcoming = exams.filter((e) => e.status === 'UPCOMING').length;
    const completed = exams.filter((e) => e.status === 'COMPLETED').length;
    return { total, live, upcoming, completed };
  }, [exams]);

  const clearAllDateFilters = () => {
    setSelectedDate('');
    setStartDate('');
    setEndDate('');
    setDateFilterPreset('ALL');
  };

  const hasActiveDateFilter = Boolean(selectedDate || startDate || endDate || dateFilterPreset !== 'ALL');

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 bg-white p-6 rounded-3xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-xs">
            <CalendarDays size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                Academic Exam Calendar
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <ArrowDownWideNarrow size={12} /> Sorted by Latest
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              All scheduled examinations, test dates, and timings sorted by latest • Filter date-wise
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            variant="outline"
            onClick={fetchAllExams}
            disabled={loading}
            className="flex items-center gap-1.5 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Calendar</span>
          </Button>
        </div>
      </div>

      {/* ── Metric Summary Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Exams
            </div>
            <div className="text-base font-extrabold text-slate-900">
              {metrics.total} Examinations
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <PlayCircle size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Active / Live
            </div>
            <div className="text-base font-extrabold text-emerald-700">
              {metrics.live} Live Now
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Upcoming
            </div>
            <div className="text-base font-extrabold text-blue-700">
              {metrics.upcoming} Scheduled
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 bg-slate-50/80 rounded-2xl">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Completed
            </div>
            <div className="text-base font-extrabold text-purple-700">
              {metrics.completed} Finished
            </div>
          </div>
        </div>
      </div>

      {/* ── Date-Wise Filtering & Search Controls ── */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        {/* Quick Date Preset Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter size={12} /> Filter:
            </span>
            {(
              [
                { key: 'ALL', label: 'All Dates' },
                { key: 'TODAY', label: 'Today' },
                { key: 'UPCOMING', label: 'Upcoming' },
                { key: 'THIS_WEEK', label: 'This Week' },
                { key: 'THIS_MONTH', label: 'This Month' },
                { key: 'COMPLETED', label: 'Concluded' },
              ] as const
            ).map((preset) => {
              const isActive = dateFilterPreset === preset.key && !selectedDate && !startDate;
              return (
                <button
                  key={preset.key}
                  onClick={() => {
                    setDateFilterPreset(preset.key);
                    setSelectedDate('');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {hasActiveDateFilter && (
            <button
              onClick={clearAllDateFilters}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 transition"
            >
              <X size={13} /> Clear Date Filters
            </button>
          )}
        </div>

        {/* Date Inputs & Search Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search by exam title or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Specific Date Picker */}
          <div className="md:col-span-4 flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
              Pick Date:
            </span>
            <div className="relative flex-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full px-3 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500 transition text-slate-800"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title="Clear date"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Date Range: From / To */}
          <div className="md:col-span-4 flex items-center gap-2">
            <div className="flex-1">
              <input
                type="date"
                placeholder="From"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSelectedDate('');
                }}
                className="w-full px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500 transition text-slate-800"
              />
            </div>
            <span className="text-slate-400 text-xs font-bold">to</span>
            <div className="flex-1">
              <input
                type="date"
                placeholder="To"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSelectedDate('');
                }}
                className="w-full px-2.5 py-2 rounded-xl text-xs font-semibold bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:border-indigo-500 transition text-slate-800"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 p-4 text-xs font-semibold text-rose-700 border border-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
          <button
            onClick={fetchAllExams}
            className="ml-auto text-xs font-bold underline hover:text-rose-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Loading State ── */}
      {loading && (
        <div className="bg-white rounded-3xl border border-slate-200 p-16 flex flex-col items-center justify-center text-slate-500 shadow-xs">
          <RefreshCw size={32} className="animate-spin text-indigo-600 mb-3" />
          <span className="text-sm font-bold text-slate-800">
            Loading scheduled exams...
          </span>
          <span className="text-xs text-slate-400 mt-1">
            Fetching latest examination dates, test windows, and subjects
          </span>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && filteredExams.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-16 text-center shadow-xs space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mx-auto">
            <Calendar size={28} />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            {hasActiveDateFilter
              ? 'No Examinations Found for Selected Date / Filter'
              : 'No Scheduled Examinations Found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {hasActiveDateFilter
              ? 'Try adjusting your date range or clearing the active filters to see all scheduled examinations.'
              : 'There are currently no academic examinations scheduled. Please check back later.'}
          </p>
          {hasActiveDateFilter && (
            <Button
              onClick={clearAllDateFilters}
              className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl"
            >
              Clear All Date Filters
            </Button>
          )}
        </div>
      )}

      {/* ── All List of Exams (Sorted by Latest) ── */}
      {!loading && filteredExams.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500">
              Showing {filteredExams.length} of {exams.length} examinations • Latest First
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Timezone: Asia/Kolkata (IST)
            </span>
          </div>

          <div className="space-y-3">
            {filteredExams.map((exam) => {
              const startDateObj = new Date(exam.plannedStartTime || exam.plannedDate);
              const endDateObj = new Date(exam.plannedEndTime || exam.plannedStartTime);

              const monthStr = startDateObj.toLocaleString('en-IN', { month: 'short' }).toUpperCase();
              const dayStr = startDateObj.getDate();
              const yearStr = startDateObj.getFullYear();
              const weekdayStr = startDateObj.toLocaleString('en-IN', { weekday: 'short' });

              const isLive = exam.status === 'LIVE';
              const isCompleted = exam.status === 'COMPLETED';

              return (
                <div
                  key={exam.id}
                  className={`bg-white rounded-3xl border p-5 shadow-xs transition hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5 ${
                    isLive
                      ? 'border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-indigo-100'
                  }`}
                >
                  {/* Left Block: Date Badge & Title Info */}
                  <div className="flex items-start sm:items-center gap-4">
                    {/* Date Block */}
                    <div
                      className={`flex flex-col items-center justify-center shrink-0 w-14 h-16 sm:w-16 sm:h-18 rounded-2xl border text-center shadow-2xs ${
                        isLive
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : isCompleted
                            ? 'bg-slate-100 text-slate-700 border-slate-200'
                            : 'bg-indigo-50 text-indigo-900 border-indigo-100'
                      }`}
                    >
                      <span className="text-[10px] font-black tracking-wider uppercase opacity-90">
                        {monthStr}
                      </span>
                      <span className="text-xl sm:text-2xl font-black leading-tight">
                        {dayStr}
                      </span>
                      <span className="text-[9px] font-semibold opacity-75">
                        {yearStr} • {weekdayStr}
                      </span>
                    </div>

                    {/* Examination Details */}
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-extrabold text-slate-900 leading-snug">
                          {exam.title}
                        </h2>
                        {exam.examTarget && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {exam.examTarget}
                          </span>
                        )}
                        {isLive ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> LIVE NOW
                          </span>
                        ) : isCompleted ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                            <CheckCircle2 size={11} /> Concluded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2.5 py-0.5 text-[10px] font-bold text-blue-700">
                            <Clock size={11} /> Upcoming
                          </span>
                        )}
                      </div>

                      {/* Time Window & Duration Strip */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
                        <span className="inline-flex items-center gap-1.5 font-bold text-slate-700">
                          <Clock size={13} className="text-indigo-600" />
                          {startDateObj.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}{' '}
                          –{' '}
                          {endDateObj.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                        <span>•</span>
                        <span className="inline-flex items-center gap-1">
                          <BookOpen size={13} className="text-slate-400" />
                          {exam.durationMinutes} Mins
                        </span>
                        {exam.totalQuestions > 0 && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1">
                              <Layers size={13} className="text-slate-400" />
                              {exam.totalQuestions} Questions
                            </span>
                          </>
                        )}
                        {exam.totalMarks > 0 && (
                          <>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                              <Award size={13} className="text-amber-500" />
                              {exam.totalMarks} Marks
                            </span>
                          </>
                        )}
                      </div>

                      {/* Subjects Pills */}
                      {exam.subjects && exam.subjects.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                          {exam.subjects.map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Action Block */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                    {isLive ? (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/student/exams/${exam.examId || exam.id}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                      >
                        <PlayCircle size={14} />
                        <span>Start Examination</span>
                        <ChevronRight size={13} />
                      </Button>
                    ) : isCompleted ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/student/history`)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition"
                      >
                        <CheckCircle2 size={13} className="text-purple-600" />
                        <span>View Result</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => navigate(`/student/exams/${exam.examId || exam.id}`)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-2xs"
                      >
                        <span>View Details</span>
                        <ChevronRight size={13} />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamCalendarPage;
