import React, { useState, useCallback } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Search,
  Activity,
} from 'lucide-react';
import cn from 'classnames';
import {
  useGetExamSecuritySummaryAPI,
  useGetAttemptSecurityDetailsAPI,
  useReviewSecurityAttemptAPI,
  useTerminateAttemptAPI,
} from '@/modules/Exams/services/security.service';
import Button from '@/components/ui/Button';

export const AdminExamSecurityDashboardPage: React.FC = () => {
  const { getExamSecuritySummaryAPI, isLoading: isLoadingSummary } =
    useGetExamSecuritySummaryAPI();
  const { getAttemptSecurityDetailsAPI } =
    useGetAttemptSecurityDetailsAPI();
  const { reviewSecurityAttemptAPI, isLoading: isReviewing } =
    useReviewSecurityAttemptAPI();
  const { terminateAttemptAPI, isLoading: isTerminating } =
    useTerminateAttemptAPI();

  const [examId, setExamId] = useState<string>('');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
  const [attemptDetails, setAttemptDetails] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reviewReason, setReviewReason] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  const loadSummary = useCallback(async (idToFetch: string) => {
    if (!idToFetch) return;
    const res = await getExamSecuritySummaryAPI(idToFetch);
    if (res.data) {
      setSummaryData(res.data);
    }
  }, [getExamSecuritySummaryAPI]);

  const loadAttemptDetails = useCallback(
    async (attId: string) => {
      setSelectedAttemptId(attId);
      const res = await getAttemptSecurityDetailsAPI(attId);
      if (res.data) {
        setAttemptDetails(res.data);
      }
    },
    [getAttemptSecurityDetailsAPI],
  );

  const handleReview = async (status: 'CLEARED' | 'CONFIRMED' | 'DISQUALIFIED') => {
    if (!selectedAttemptId) return;
    await reviewSecurityAttemptAPI(selectedAttemptId, {
      status,
      reason: reviewReason || undefined,
      notes: reviewNotes || undefined,
    });
    setReviewReason('');
    setReviewNotes('');
    if (examId) loadSummary(examId);
    if (selectedAttemptId) loadAttemptDetails(selectedAttemptId);
  };

  const handleTerminate = async () => {
    if (!selectedAttemptId) return;
    const reason = reviewReason || 'Immediate admin security termination';
    await terminateAttemptAPI(selectedAttemptId, reason);
    if (examId) loadSummary(examId);
    if (selectedAttemptId) loadAttemptDetails(selectedAttemptId);
  };

  const filteredAttempts = (summaryData?.flaggedAttempts || []).filter(
    (fa: any) =>
      !searchQuery ||
      fa.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fa.studentCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fa.attemptId?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Page Title & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShieldAlert className="text-indigo-600" size={28} />
            Exam Security & Anti-Cheating Control
          </h1>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Real-time multi-layered security event monitoring, risk scoring, and integrity auditing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              placeholder="Enter Exam ID..."
              className="rounded-2xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-xs font-bold text-slate-900 shadow-xs focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <Button
            size="sm"
            onClick={() => loadSummary(examId)}
            isLoading={isLoadingSummary}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
          >
            Load Exam
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summaryData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Attempts</span>
            <span className="text-2xl font-black text-slate-900 block mt-1">{summaryData.totalAttempts}</span>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Low Risk</span>
            <span className="text-2xl font-black text-emerald-950 block mt-1">{summaryData.riskDistribution?.low || 0}</span>
          </div>

          <div className="rounded-3xl border border-amber-100 bg-amber-50/70 p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Medium Risk</span>
            <span className="text-2xl font-black text-amber-950 block mt-1">{summaryData.riskDistribution?.medium || 0}</span>
          </div>

          <div className="rounded-3xl border border-orange-100 bg-orange-50/70 p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-800">High Risk</span>
            <span className="text-2xl font-black text-orange-950 block mt-1">{summaryData.riskDistribution?.high || 0}</span>
          </div>

          <div className="rounded-3xl border border-rose-100 bg-rose-50/70 p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-800">Critical Risk</span>
            <span className="text-2xl font-black text-rose-950 block mt-1">{summaryData.riskDistribution?.critical || 0}</span>
          </div>

          <div className="rounded-3xl border border-purple-100 bg-purple-50/70 p-4 shadow-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-800">Flagged / Audit</span>
            <span className="text-2xl font-black text-purple-950 block mt-1">{summaryData.flaggedCount || 0}</span>
          </div>
        </div>
      )}

      {/* Flagged Attempts Table & Drilldown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flagged Attempts List */}
        <div className="lg:col-span-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={16} />
              Flagged & Elevated Risk Attempts
            </h2>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate..."
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 focus:outline-none"
            />
          </div>

          {filteredAttempts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-semibold">
              No flagged or suspicious attempts detected for this exam.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
              {filteredAttempts.map((fa: any) => (
                <div
                  key={fa.attemptId}
                  onClick={() => loadAttemptDetails(fa.attemptId)}
                  className={cn(
                    'p-3.5 flex items-center justify-between cursor-pointer rounded-2xl transition-colors',
                    selectedAttemptId === fa.attemptId
                      ? 'bg-indigo-50/80 border border-indigo-200'
                      : 'hover:bg-slate-50',
                  )}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-slate-900">
                        {fa.studentName || 'Student'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        ({fa.studentCode || fa.attemptId.slice(0, 8)})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold">
                      <span>Status: {fa.status}</span>
                      <span>•</span>
                      <span>Events: {fa.eventsCount}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded-full text-[10px] font-black',
                        fa.riskLevel === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : fa.riskLevel === 'HIGH'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-amber-100 text-amber-800',
                      )}
                    >
                      {fa.riskLevel} ({Math.round(fa.riskScore)})
                    </span>

                    <Button size="sm" variant="outline" className="text-[10px] py-1 px-2.5">
                      View Timeline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Attempt Audit Drawer */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Activity className="text-indigo-600" size={16} />
            Security Event Timeline
          </h2>

          {!attemptDetails ? (
            <div className="py-12 text-center text-slate-400 text-xs font-medium">
              Select an attempt from the list to audit its real-time event log.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs space-y-1">
                <div className="font-extrabold text-slate-900">
                  {attemptDetails.student?.name}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  ID: {attemptDetails.id}
                </div>
                <div className="text-[10px] text-slate-600 font-bold">
                  Risk Score: {attemptDetails.riskScore} • Level: {attemptDetails.riskLevel}
                </div>
              </div>

              {/* Event Stream */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {(attemptDetails.attemptEvents || []).map((ev: any) => (
                  <div
                    key={ev.id || ev.eventId}
                    className="rounded-xl border border-slate-100 p-2.5 text-[11px] space-y-0.5"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span className="font-mono text-indigo-700">{ev.eventType}</span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(ev.serverTimestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    {ev.duration > 0 && (
                      <div className="text-[10px] text-slate-500">
                        Duration: {ev.duration}s
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Review & Decision Controls */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <input
                  type="text"
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Decision reason / notes..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview('CLEARED')}
                    isLoading={isReviewing}
                    className="text-[10px] font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 py-1"
                  >
                    Clear Flag
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleReview('DISQUALIFIED')}
                    isLoading={isReviewing}
                    className="text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white py-1"
                  >
                    Disqualify
                  </Button>
                </div>

                <Button
                  size="sm"
                  onClick={handleTerminate}
                  isLoading={isTerminating}
                  className="w-full text-[10px] font-black bg-slate-900 hover:bg-black text-white py-1.5"
                >
                  Force Terminate Session
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExamSecurityDashboardPage;
