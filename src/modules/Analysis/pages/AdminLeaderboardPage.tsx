import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Trophy,
  Search,
  Users,
  MapPin,
  Building2,
  GraduationCap,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ArrowLeft,
  Calendar,
  ArrowRight,
} from 'lucide-react';
import cn from 'classnames';
import {
  useGetAdminLeaderboardAPI,
  useGenerateRanksAPI,
  useGetRankStatusAPI,
  useGetAvailableExamsAPI,
  useGetPublicationDashboardAPI,
} from '@/modules/Exams/services';
import { completedExamReportsService } from '@/modules/Admin/services/completedExamReports.service';
import type {
  AdminLeaderboardResponse,
  LeaderboardEntry,
  RankTypeEnum,
  SnapshotStatusResponse,
  PublicationDashboardItem,
} from '@/types/exam.types';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';
import { useAuth } from '@/hooks/useAuth';
import { ROLES } from '@/modules/Auth/auth-access/roles.constants';

const SCOPES: { label: string; value: RankTypeEnum; icon: any }[] = [
  { label: 'Overall National', value: 'OVERALL', icon: Trophy },
  { label: 'State Leaderboard', value: 'STATE', icon: MapPin },
  { label: 'District Leaderboard', value: 'DISTRICT', icon: Building2 },
  { label: 'School / College', value: 'SCHOOL', icon: GraduationCap },
  { label: 'Category', value: 'CATEGORY', icon: Users },
];

export const AdminLeaderboardPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes(ROLES.ADMIN) || user?.roles?.includes(ROLES.SUPER_ADMIN);

  const examIdParam = searchParams.get('examId') || '';

  const { getAdminLeaderboardAPI, isLoading: isLeaderboardLoading } = useGetAdminLeaderboardAPI();
  const { generateRanksAPI, isLoading: isGenerating } = useGenerateRanksAPI();
  const { getRankStatusAPI } = useGetRankStatusAPI();
  const { getAvailableExamsAPI } = useGetAvailableExamsAPI();
  const { getPublicationDashboardAPI, isLoading: isDashboardLoading } = useGetPublicationDashboardAPI();

  // Directory State
  const [directoryExams, setDirectoryExams] = useState<PublicationDashboardItem[]>([]);
  const [dirSearchInput, setDirSearchInput] = useState('');
  const [dirStatus, setDirStatus] = useState<'ALL' | 'COMPLETED' | 'READY_TO_PUBLISH' | 'PUBLISHED' | 'LIVE'>('COMPLETED');
  const [dirPage, setDirPage] = useState(1);
  const [totalDirectoryExams, setTotalDirectoryExams] = useState(0);
  const dirPageSize = 9;

  // Selected Exam for Detailed View
  const [selectedExamId, setSelectedExamId] = useState<string>(examIdParam);
  const [selectedRankType, setSelectedRankType] = useState<RankTypeEnum>('OVERALL');
  const [scopeFilter, setScopeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [leaderboardData, setLeaderboardData] = useState<AdminLeaderboardResponse | null>(null);
  const [snapshotStatus, setSnapshotStatus] = useState<SnapshotStatusResponse | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Sync selectedExamId when URL search param changes
  useEffect(() => {
    setSelectedExamId(examIdParam);
  }, [examIdParam]);

  // Load Exam Directory List
  const loadDirectoryExams = useCallback(async () => {
    try {
      const res = await getPublicationDashboardAPI({
        page: dirPage,
        limit: dirPageSize,
        status: dirStatus !== 'ALL' ? dirStatus : undefined,
        search: dirSearchInput.trim() || undefined,
      });

      let rawList: PublicationDashboardItem[] = [];
      const payload = res.data;
      if (payload && (payload as any).items) {
        rawList = (payload as any).items;
        setTotalDirectoryExams((payload as any).pagination?.total || rawList.length);
      } else if (Array.isArray(res.data)) {
        rawList = res.data as any;
        setTotalDirectoryExams(rawList.length);
      }

      // Fallback 1: completedExamReportsService
      if (rawList.length === 0) {
        try {
          const completed = await completedExamReportsService.getCompletedLiveExams();
          if (Array.isArray(completed) && completed.length > 0) {
            rawList = completed.map((c: any) => ({
              examId: c.id,
              examTitle: c.title,
              examTarget: 'LIVE',
              examStatus: 'COMPLETED',
              examType: 'LIVE',
              totalCandidates: 0,
              finalizedAttempts: 0,
              evaluatedAttempts: 0,
              analyticsCompletedAttempts: 0,
              rankingCompleted: false,
              securityReviewCompleted: false,
              publicationStatus: 'NOT_READY',
              isReadyToPublish: false,
              notReadyReason: null,
              publishedAt: null,
              publishedBy: null,
              publicationVersion: 1,
              lastSchedule: c.scheduleEnd ? { startTime: '', endTime: c.scheduleEnd, status: 'ENDED' } : null,
            }));
          }
        } catch {}
      }

      // Fallback 2: getAvailableExamsAPI
      if (rawList.length === 0) {
        try {
          const available = await getAvailableExamsAPI('all');
          if (available.data && available.data.length > 0) {
            rawList = available.data.map((e: any) => ({
              examId: e.id,
              examTitle: e.title,
              examTarget: e.examTarget?.name || 'LIVE',
              examStatus: e.status?.name || 'COMPLETED',
              examType: 'LIVE',
              totalCandidates: 0,
              finalizedAttempts: 0,
              evaluatedAttempts: 0,
              analyticsCompletedAttempts: 0,
              rankingCompleted: false,
              securityReviewCompleted: false,
              publicationStatus: 'NOT_READY',
              isReadyToPublish: false,
              notReadyReason: null,
              publishedAt: null,
              publishedBy: null,
              publicationVersion: 1,
            }));
          }
        } catch {}
      }

      setDirectoryExams(rawList);
    } catch (err) {
      console.error('Failed loading leaderboard exam directory:', err);
    }
  }, [getPublicationDashboardAPI, getAvailableExamsAPI, dirStatus, dirPage, dirPageSize, dirSearchInput]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadDirectoryExams();
    }, 300);
    return () => clearTimeout(handler);
  }, [loadDirectoryExams]);

  // Sort exams by latest completed date descending
  const sortedDirectoryExams = useMemo(() => {
    let list = [...directoryExams];
    // Filtering by search is now done server-side, but we keep sorting here for the current page
    return list.sort((a, b) => {
      const timeA = a.lastSchedule?.endTime
        ? new Date(a.lastSchedule.endTime).getTime()
        : a.publishedAt
        ? new Date(a.publishedAt).getTime()
        : 0;
      const timeB = b.lastSchedule?.endTime
        ? new Date(b.lastSchedule.endTime).getTime()
        : b.publishedAt
        ? new Date(b.publishedAt).getTime()
        : 0;
      if (timeA !== timeB) return timeB - timeA;
      return (b.evaluatedAttempts || 0) - (a.evaluatedAttempts || 0);
    });
  }, [directoryExams]);

  // Handle Exam Selection Change
  const handleSelectExam = (id: string) => {
    if (!id) {
      setSearchParams({});
      setSelectedExamId('');
    } else {
      setSearchParams({ examId: id });
      setSelectedExamId(id);
    }
    setPage(1);
    setSearchQuery('');
  };

  // Fetch detailed leaderboard data when selectedExamId changes
  const loadLeaderboard = useCallback(async () => {
    if (!selectedExamId) return;

    const [lbRes, statusRes] = await Promise.all([
      getAdminLeaderboardAPI(selectedExamId, {
        rankType: selectedRankType,
        scopeId: scopeFilter || undefined,
        search: searchQuery || undefined,
        page,
        limit,
      }),
      getRankStatusAPI(selectedExamId),
    ]);

    if (lbRes.data) {
      setLeaderboardData(lbRes.data);
    }
    if (statusRes.data) {
      setSnapshotStatus(statusRes.data);
    }
  }, [selectedExamId, selectedRankType, scopeFilter, searchQuery, page, limit, getAdminLeaderboardAPI, getRankStatusAPI]);

  useEffect(() => {
    if (selectedExamId) {
      loadLeaderboard();
    }
  }, [selectedExamId, selectedRankType, scopeFilter, page, loadLeaderboard]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadLeaderboard();
  };

  const handleTriggerBatchGeneration = async () => {
    if (!selectedExamId) return;
    setActionMessage('Generating batch rankings across candidate population...');
    const res = await generateRanksAPI(selectedExamId, { forceRegenerate: true });
    if (res.data || res.isSuccess) {
      setActionMessage('Batch rankings successfully generated and verified!');
      setTimeout(() => setActionMessage(null), 5000);
      loadLeaderboard();
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const topThree = leaderboardData?.items?.slice(0, 3) || [];

  // ═════════════════════════════════════════════════════════════════════
  // VIEW 1: EXAM DIRECTORY LIST (WHEN NO EXAM IS SELECTED)
  // ═════════════════════════════════════════════════════════════════════
  if (!selectedExamId) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1">
                <Trophy size={13} className="text-amber-600" />
                Exam Leaderboards Directory
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                Sorted by Latest Completed
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">
              Select an Exam to View Rankings
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Browse all completed and active examination leaderboards below. Click on any exam to inspect official population rankings, top score benchmarks, and regional standings.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDirectoryExams()}
            className="self-start md:self-auto border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
          >
            <RotateCw className={cn('w-4 h-4 mr-1.5', isDashboardLoading && 'animate-spin')} />
            Refresh Directory
          </Button>
        </div>

        {/* Directory Search & Filter Controls */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search exam title..."
              value={dirSearchInput}
              onChange={(e) => {
                setDirSearchInput(e.target.value);
                setDirPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['ALL', 'COMPLETED', 'READY_TO_PUBLISH', 'PUBLISHED', 'LIVE'] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  setDirStatus(st);
                  setDirPage(1);
                }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap',
                  dirStatus === st
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50',
                )}
              >
                {st === 'ALL' ? 'All Exams' : st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Exam Cards Grid (Sorted by latest completed) */}
        {isDashboardLoading ? (
          <div className="py-20 text-center">
            <RotateCw className="w-8 h-8 mx-auto animate-spin text-indigo-500 mb-3" />
            <p className="text-sm font-semibold text-slate-500">Loading exams directory...</p>
          </div>
        ) : sortedDirectoryExams.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-12 text-center shadow-xs">
            <Trophy className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No exams found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {dirSearchInput ? 'Try adjusting your search terms.' : 'No completed or published exams match the selected filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedDirectoryExams.map((exam) => {
                const compDate = formatDate(exam.lastSchedule?.endTime || exam.publishedAt);
                const isPublished = exam.publicationStatus === 'PUBLISHED';
                const isReady = exam.publicationStatus === 'READY_TO_PUBLISH';

                return (
                  <div
                    key={exam.examId}
                    onClick={() => handleSelectExam(exam.examId)}
                    className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          {exam.examTarget || 'EXAM'}
                        </span>

                        <span
                          className={cn(
                            'px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase',
                            isPublished
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isReady
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200',
                          )}
                        >
                          {isPublished ? 'Published' : isReady ? 'Ready' : exam.examStatus || 'Completed'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                        {exam.examTitle}
                      </h3>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400" />
                          {compDate ? `Ended ${compDate}` : 'Recent Exam'}
                        </span>

                        <span className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                          <Users size={13} className="text-indigo-500" />
                          {exam.evaluatedAttempts || exam.totalCandidates || 0} Evaluated
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          Inspect Leaderboard <ArrowRight size={13} />
                        </span>
                        <Trophy size={16} className="text-amber-500 opacity-80" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Directory Pagination Controls */}
            {Math.ceil(totalDirectoryExams / dirPageSize) > 0 && (
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Showing <strong className="text-slate-900 dark:text-white">{(dirPage - 1) * dirPageSize + 1}</strong> to{' '}
                  <strong className="text-slate-900 dark:text-white">{Math.min(dirPage * dirPageSize, totalDirectoryExams)}</strong> of{' '}
                  <strong className="text-slate-900 dark:text-white">{totalDirectoryExams}</strong> exams
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={dirPage === 1}
                    onClick={() => setDirPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-2">
                    Page {dirPage} of {Math.ceil(totalDirectoryExams / dirPageSize) || 1}
                  </span>
                  <button
                    disabled={dirPage >= Math.ceil(totalDirectoryExams / dirPageSize)}
                    onClick={() => setDirPage((p) => p + 1)}
                    className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // VIEW 2: DETAILED LEADERBOARD VIEW (WHEN EXAM IS SELECTED)
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* ── Back Navigation to Directory ────────────────────────────── */}
      <button
        onClick={() => handleSelectExam('')}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors bg-white dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs"
      >
        <ArrowLeft size={14} />
        <span>Back to Exams Directory</span>
      </button>

      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-1">
              <Trophy size={12} className="text-amber-600" />
              Leaderboard & Rankings
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
              Live Verified Snapshot
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Exam Leaderboard & Population Rankings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Official rank benchmarks and candidate standings across National, State, District, and School scopes.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <Button
              onClick={handleTriggerBatchGeneration}
              disabled={isGenerating || !selectedExamId}
              className="gap-2 shadow-sm"
            >
              <RotateCw size={16} className={cn(isGenerating && 'animate-spin')} />
              <span>{isGenerating ? 'Generating...' : 'Recalculate Batch Rankings'}</span>
            </Button>
          </div>
        )}
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ── Exam Selector Dropdown & Aggregate Summary Strip ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 block">
            Select Target Exam / Test
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => handleSelectExam(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
          >
            <option value="">← Browse All Exams Directory</option>
            {sortedDirectoryExams.map((ex) => (
              <option key={ex.examId} value={ex.examId}>
                {ex.examTitle}
              </option>
            ))}
          </select>
        </div>

        {/* Snapshot Summary KPIs */}
        <div className="lg:col-span-3 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3.5 min-[360px]:p-4 sm:p-5 shadow-sm grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 items-center">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ranked Candidates
            </span>
            <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {snapshotStatus?.totalCandidates?.toLocaleString() || leaderboardData?.totalCandidates?.toLocaleString() || '0'}
            </div>
            <span className="text-[10px] text-emerald-600 font-bold">
              Snapshot v{snapshotStatus?.snapshotVersion || 1}
            </span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Top Score
            </span>
            <div className="text-xl md:text-2xl font-black text-emerald-600 mt-0.5">
              {snapshotStatus?.highestScore ?? topThree[0]?.score ?? '—'}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Rank 1 Benchmark</span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Average Score
            </span>
            <div className="text-xl md:text-2xl font-black text-indigo-600 mt-0.5">
              {snapshotStatus?.averageScore ?? '—'}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Mean Population</span>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Median Score
            </span>
            <div className="text-xl md:text-2xl font-black text-purple-600 mt-0.5">
              {snapshotStatus?.medianScore ?? '—'}
            </div>
            <span className="text-[10px] text-slate-400 font-medium">50th Percentile</span>
          </div>
        </div>
      </div>

      {/* ── Top 3 Podium Cards (Rendered when on Page 1) ─────────── */}
      {page === 1 && topThree.length > 0 && !searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topThree.map((candidate, idx) => {
            const isRank1 = candidate.rank === 1;
            const isRank2 = candidate.rank === 2;

            return (
              <div
                key={candidate.studentId || idx}
                className={cn(
                  'rounded-3xl p-5 border shadow-sm relative overflow-hidden transition-all flex flex-col justify-between',
                  isRank1
                    ? 'bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-white dark:to-slate-800 border-amber-300 ring-2 ring-amber-400/30 md:-translate-y-1'
                    : isRank2
                    ? 'bg-gradient-to-b from-slate-300/20 via-slate-100/10 to-white dark:to-slate-800 border-slate-300'
                    : 'bg-gradient-to-b from-amber-700/10 via-orange-50/10 to-white dark:to-slate-800 border-amber-200',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm',
                        isRank1
                          ? 'bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 shadow-amber-200'
                          : isRank2
                          ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 shadow-slate-200'
                          : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-orange-200',
                      )}
                    >
                      {isRank1 ? '🥇' : isRank2 ? '🥈' : '🥉'}
                    </div>

                    <div>
                      <span
                        className={cn(
                          'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full',
                          isRank1
                            ? 'bg-amber-100 text-amber-800'
                            : isRank2
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-orange-100 text-orange-800',
                        )}
                      >
                        Rank #{candidate.rank}
                      </span>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white mt-1 truncate max-w-[150px]">
                        {candidate.studentName}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">{candidate.studentCode}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-lg font-black text-slate-900 dark:text-white">{candidate.score}</div>
                    <span className="text-[10px] font-bold text-slate-400">Score</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                    <span className="text-[10px] text-slate-400 block font-semibold">Percentile</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-[11px]">
                      {candidate.percentile.toFixed(1)}%
                    </span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                    <span className="text-[10px] text-slate-400 block font-semibold">Accuracy</span>
                    <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-[11px]">
                      {candidate.accuracy.toFixed(0)}%
                    </span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                    <span className="text-[10px] text-slate-400 block font-semibold">Time</span>
                    <span className="font-extrabold text-slate-700 dark:text-slate-300 text-[11px]">
                      {formatTime(candidate.timeUsedSeconds)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Scope Tabs & Search Bar ─────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Scope Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {SCOPES.map((sc) => {
              const Icon = sc.icon;
              const isSelected = selectedRankType === sc.value;
              return (
                <button
                  key={sc.value}
                  onClick={() => {
                    setSelectedRankType(sc.value);
                    setScopeFilter('');
                    setPage(1);
                  }}
                  className={cn(
                    'px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap',
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50',
                  )}
                >
                  <Icon size={14} />
                  <span>{sc.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search candidate or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>
        </div>
      </div>

      {/* ── Leaderboard Table ───────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        {isLeaderboardLoading ? (
          <div className="py-20">
            <Loader label="Loading official leaderboard rankings..." />
          </div>
        ) : !leaderboardData || leaderboardData.items.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="mx-auto text-slate-300 dark:text-slate-600 mb-3" size={40} />
            <h3 className="text-base font-bold text-slate-800 dark:text-white">No Ranked Candidates Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
              Rankings have not been generated yet for this exam or no attempts match the search filter.
            </p>
            {isAdmin && (
              <Button onClick={handleTriggerBatchGeneration} size="sm">
                Generate Rankings Now
              </Button>
            )}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 text-center w-20">Rank</th>
                    <th className="py-3.5 px-4">Candidate</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Accuracy</th>
                    <th className="py-3.5 px-4">Time Used</th>
                    <th className="py-3.5 px-4">Percentile</th>
                    <th className="py-3.5 px-4">Affiliation / Region</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
                  {leaderboardData.items.map((row: LeaderboardEntry) => {
                    const isMe =
                      (user?.id && (row.studentId === user.id || (row as any).userId === user.id)) ||
                      (user?.email && (row.studentCode === user.email || row.studentName === (user?.studentProfile?.name || (user as any)?.name)));

                    return (
                      <tr
                        key={row.studentId}
                        className={cn(
                          'hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors',
                          isMe && 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-4 border-indigo-600 font-bold',
                          !isMe && row.rank === 1 && 'bg-amber-50/40 dark:bg-amber-950/20',
                          !isMe && row.rank === 2 && 'bg-slate-50/50 dark:bg-slate-900/30',
                          !isMe && row.rank === 3 && 'bg-amber-50/20 dark:bg-amber-950/10',
                        )}
                      >
                        {/* Rank with Medal */}
                        <td className="py-3 px-4 text-center">
                          {row.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-sm">
                              🥇 1
                            </span>
                          ) : row.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-sm">
                              🥈 2
                            </span>
                          ) : row.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white font-black text-xs shadow-sm">
                              🥉 3
                            </span>
                          ) : (
                            <span className="font-black text-slate-700 dark:text-slate-300">#{row.rank}</span>
                          )}
                        </td>

                        {/* Candidate Name & ID */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white">{row.studentName}</span>
                            {isMe && (
                              <span className="text-[10px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {row.studentCode}
                          </div>
                        </td>

                        {/* Score */}
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-900 dark:text-white">{row.score}</span>
                          <span className="text-[11px] text-slate-400 block font-normal">
                            {row.percentage}%
                          </span>
                        </td>

                        {/* Accuracy */}
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'font-bold',
                              row.accuracy >= 90
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : row.accuracy >= 75
                                  ? 'text-indigo-600 dark:text-indigo-400'
                                  : 'text-slate-700 dark:text-slate-300',
                            )}
                          >
                            {row.accuracy.toFixed(1)}%
                          </span>
                        </td>

                        {/* Time Used */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {formatTime(row.timeUsedSeconds)}
                        </td>

                        {/* Percentile */}
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            {row.percentile.toFixed(2)}%tile
                          </span>
                        </td>

                        {/* Affiliation / Region */}
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                          <div className="truncate max-w-[180px] font-semibold text-slate-700 dark:text-slate-200">
                            {row.schoolCollege || '—'}
                          </div>
                          <div className="truncate max-w-[180px] text-[10px]">
                            {row.district ? `${row.district}, ` : ''}
                            {row.state || 'National'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div>
                Showing page <strong className="text-slate-800 dark:text-white">{page}</strong> of{' '}
                <strong className="text-slate-800 dark:text-white">{leaderboardData.totalPages || 1}</strong> (
                {leaderboardData.totalCandidates} total candidates)
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page >= leaderboardData.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLeaderboardPage;
