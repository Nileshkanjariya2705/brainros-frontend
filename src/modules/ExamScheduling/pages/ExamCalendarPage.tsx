import React, { useEffect, useState } from 'react';
import {
  Clock,
  Globe,
  Plus,
  AlertTriangle,
  RefreshCw,
  Edit2,
  CalendarDays,
  FolderPlus,
} from 'lucide-react';
import { Axios } from '@/base-axios';
import { ExamCycleItem, ExamCalendarEvent } from '@/types/exam.types';

export const ExamCalendarPage: React.FC = () => {
  const [cycles, setCycles] = useState<ExamCycleItem[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>('');
  const [events, setEvents] = useState<ExamCalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Create Cycle Modal State
  const [showCreateCycleModal, setShowCreateCycleModal] = useState<boolean>(false);
  const [cycleData, setCycleData] = useState({
    name: '',
    academicYear: '2026-2027',
    startDate: '2026-04-01',
    endDate: '2027-03-31',
  });

  // Reschedule Modal State
  const [reschedulingEvent, setReschedulingEvent] = useState<ExamCalendarEvent | null>(null);
  const [rescheduleData, setRescheduleData] = useState({
    plannedDate: '',
    plannedStartTime: '',
    plannedEndTime: '',
    reason: '',
  });

  // Create Event Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createData, setCreateData] = useState({
    examId: '',
    plannedDate: '',
    plannedStartTime: '',
    plannedEndTime: '',
    timezone: 'Asia/Kolkata',
    notes: '',
  });

  const [availableExams, setAvailableExams] = useState<Array<{ id: string; title: string }>>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchCycles();
    fetchExams();
  }, []);

  useEffect(() => {
    if (selectedCycleId) {
      fetchEvents(selectedCycleId);
    } else {
      setEvents([]);
    }
  }, [selectedCycleId]);

  const getArrayData = (response: any): any[] => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    return [];
  };

  const fetchCycles = async () => {
    try {
      setLoading(true);
      const res = await Axios.get('/exam-cycles');
      const data = getArrayData(res);
      setCycles(data);
      if (data.length > 0) {
        setSelectedCycleId((prev) => (prev ? prev : data[0].id));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load exam cycles');
      setCycles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    try {
      const res = await Axios.get('/exams');
      setAvailableExams(getArrayData(res));
    } catch {
      setAvailableExams([]);
    }
  };

  const fetchEvents = async (cycleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await Axios.get('/exam-calendar', { params: { cycleId } });
      setEvents(getArrayData(res));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load calendar events');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCycle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);
      const res = await Axios.post('/exam-cycles', {
        name: cycleData.name,
        academicYear: cycleData.academicYear,
        startDate: new Date(cycleData.startDate).toISOString(),
        endDate: new Date(cycleData.endDate).toISOString(),
      });
      setShowCreateCycleModal(false);
      setCycleData({
        name: '',
        academicYear: '2026-2027',
        startDate: '2026-04-01',
        endDate: '2027-03-31',
      });
      await fetchCycles();
      if (res.data?.id) {
        setSelectedCycleId(res.data.id);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create academic cycle');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCycleId || !createData.examId) return;

    try {
      setSubmitting(true);
      setError(null);
      await Axios.post('/exam-calendar', {
        cycleId: selectedCycleId,
        examId: createData.examId,
        plannedDate: new Date(createData.plannedDate).toISOString(),
        plannedStartTime: new Date(createData.plannedStartTime).toISOString(),
        plannedEndTime: new Date(createData.plannedEndTime).toISOString(),
        timezone: createData.timezone || 'Asia/Kolkata',
        notes: createData.notes || undefined,
      });
      setShowCreateModal(false);
      setCreateData({
        examId: '',
        plannedDate: '',
        plannedStartTime: '',
        plannedEndTime: '',
        timezone: 'Asia/Kolkata',
        notes: '',
      });
      await fetchEvents(selectedCycleId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to schedule calendar event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingEvent || !rescheduleData.reason.trim()) return;

    try {
      setSubmitting(true);
      setError(null);
      await Axios.patch(`/exam-calendar/${reschedulingEvent.id}/reschedule`, {
        plannedDate: new Date(rescheduleData.plannedDate).toISOString(),
        plannedStartTime: new Date(rescheduleData.plannedStartTime).toISOString(),
        plannedEndTime: new Date(rescheduleData.plannedEndTime).toISOString(),
        reason: rescheduleData.reason,
      });
      setReschedulingEvent(null);
      setRescheduleData({
        plannedDate: '',
        plannedStartTime: '',
        plannedEndTime: '',
        reason: '',
      });
      await fetchEvents(selectedCycleId);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Rescheduling failed');
    } finally {
      setSubmitting(false);
    }
  };

  const safeCycles = Array.isArray(cycles) ? cycles : [];
  const safeEvents = Array.isArray(events) ? events : [];
  const activeCycle = safeCycles.find((c) => c.id === selectedCycleId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Academic Exam Calendar & Roadmap</h1>
          <p className="text-sm text-slate-500">
            Authoritative UTC timeline planning with IANA timezone governance and versioned
            automated reminder synchronization.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateCycleModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <FolderPlus className="h-4 w-4 text-slate-600" /> New Academic Cycle
          </button>
          <button
            disabled={!selectedCycleId}
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" /> Plan Exam Event
          </button>
          <button
            onClick={() => {
              fetchCycles();
              if (selectedCycleId) fetchEvents(selectedCycleId);
            }}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
          {error}
        </div>
      )}

      {/* Cycle Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-5 w-5 text-indigo-600" />
          <span className="text-xs font-bold uppercase text-slate-400">Academic Cycle:</span>
          {safeCycles.length > 0 ? (
            <select
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-sm font-bold text-slate-900 focus:border-indigo-600 focus:outline-none"
            >
              {safeCycles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.academicYear})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-medium text-slate-500">No cycle available</span>
          )}
        </div>

        {activeCycle ? (
          <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
            <span>
              Window: {new Date(activeCycle.startDate).toLocaleDateString()} –{' '}
              {new Date(activeCycle.endDate).toLocaleDateString()}
            </span>
            <span className="rounded-md bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">
              {activeCycle.status}
            </span>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateCycleModal(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            + Create Academic Year Cycle
          </button>
        )}
      </div>

      {/* Events Timeline */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base font-bold text-slate-900">Planned Mock Examinations</h2>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Globe className="h-3.5 w-3.5 text-indigo-600" /> Default Timezone:{' '}
            <span className="font-bold">Asia/Kolkata (IST)</span>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Loading academic calendar...
          </div>
        ) : safeCycles.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 space-y-3">
            <p>No academic year cycle exists yet.</p>
            <button
              onClick={() => setShowCreateCycleModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500"
            >
              <FolderPlus className="h-4 w-4" /> Create Academic Cycle
            </button>
          </div>
        ) : safeEvents.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-400 space-y-3">
            <p>No planned events in this academic cycle.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" /> Plan First Exam
            </button>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {safeEvents.map((event) => (
              <div
                key={event.id}
                className="flex flex-wrap items-center justify-between gap-4 py-4 hover:bg-slate-50/60 rounded-xl px-2"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-2xl bg-indigo-50 font-black text-indigo-700">
                    <span className="text-xs uppercase leading-none">
                      {new Date(event.plannedDate).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-lg leading-tight">
                      {new Date(event.plannedDate).getDate()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {event.exam?.title || 'National Mock Exam'}
                    </h3>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {new Date(event.plannedStartTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        –{' '}
                        {new Date(event.plannedEndTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span>• {event.timezone}</span>
                      {event.scheduleVersion > 1 && (
                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 font-bold text-amber-700">
                          v{event.scheduleVersion} Rescheduled
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      event.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : event.status === 'RESCHEDULED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {event.status}
                  </span>
                  <button
                    onClick={() => {
                      setReschedulingEvent(event);
                      setRescheduleData({
                        plannedDate: event.plannedDate.substring(0, 10),
                        plannedStartTime: event.plannedStartTime.substring(0, 16),
                        plannedEndTime: event.plannedEndTime.substring(0, 16),
                        reason: '',
                      });
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-slate-500" /> Reschedule
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Cycle Modal */}
      {showCreateCycleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Create Academic Year Cycle</h3>
            <p className="text-xs text-slate-500">
              Defines the academic boundary and lifecycle for planning national and institutional
              mock examinations.
            </p>

            <form onSubmit={handleCreateCycle} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Cycle Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-2027 NEET Mock Exam Cycle"
                  value={cycleData.name}
                  onChange={(e) => setCycleData({ ...cycleData, name: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Academic Year</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-2027"
                  value={cycleData.academicYear}
                  onChange={(e) => setCycleData({ ...cycleData, academicYear: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Start Date</label>
                  <input
                    type="date"
                    required
                    value={cycleData.startDate}
                    onChange={(e) => setCycleData({ ...cycleData, startDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">End Date</label>
                  <input
                    type="date"
                    required
                    value={cycleData.endDate}
                    onChange={(e) => setCycleData({ ...cycleData, endDate: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCycleModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Cycle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Plan Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Plan Calendar Exam Event</h3>
            <p className="text-xs text-slate-500">
              Schedules a planned exam timeline in UTC. Authoritative live student access requires
              Super Admin activation.
            </p>

            <form onSubmit={handleCreateEvent} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Exam</label>
                <select
                  required
                  value={createData.examId}
                  onChange={(e) => setCreateData({ ...createData, examId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                >
                  <option value="">Select an exam...</option>
                  {availableExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Planned Date</label>
                <input
                  type="date"
                  required
                  value={createData.plannedDate}
                  onChange={(e) => setCreateData({ ...createData, plannedDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={createData.plannedStartTime}
                    onChange={(e) =>
                      setCreateData({ ...createData, plannedStartTime: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={createData.plannedEndTime}
                    onChange={(e) =>
                      setCreateData({ ...createData, plannedEndTime: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submitting ? 'Scheduling...' : 'Confirm Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {reschedulingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Reschedule Event: {reschedulingEvent.exam?.title}
            </h3>
            <p className="text-xs text-slate-500">
              Rescheduling invalidates prior automated reminder jobs and registers a new schedule
              version.
            </p>

            <form onSubmit={handleReschedule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  New Planned Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleData.plannedDate}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, plannedDate: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">
                    New Start Time
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={rescheduleData.plannedStartTime}
                    onChange={(e) =>
                      setRescheduleData({ ...rescheduleData, plannedStartTime: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">New End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={rescheduleData.plannedEndTime}
                    onChange={(e) =>
                      setRescheduleData({ ...rescheduleData, plannedEndTime: e.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Mandatory Reason
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Explain why this exam was rescheduled..."
                  value={rescheduleData.reason}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, reason: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 p-2.5 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReschedulingEvent(null)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !rescheduleData.reason.trim()}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-50"
                >
                  {submitting ? 'Rescheduling...' : 'Apply Reschedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamCalendarPage;
