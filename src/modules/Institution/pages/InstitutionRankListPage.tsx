import React, { useState, useMemo } from 'react';
import {
  Medal,
  BookOpen,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Award,
} from 'lucide-react';
import {
  useInstitutionRankExamsQuery,
  useInstitutionRankingsQuery,
  useInstitutionBatchesQuery,
  InstituteRankItem,
} from '../services/institutionDashboard.service';
import { SectionError } from '@/components/feedback/SectionError';
import { Skeleton } from '@/components/ui/Skeleton';

export const InstitutionRankListPage: React.FC = () => {
  // ── Rank List State ──
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [rankBatchId, setRankBatchId] = useState<string>('');
  const [rankPage, setRankPage] = useState(1);
  const rankLimit = 15;

  // ── Queries ──
  const { data: batchesData = [] } = useInstitutionBatchesQuery();
  const { data: rankExamsData = [], refetch: refetchExams } = useInstitutionRankExamsQuery();
  const safeRankExams = Array.isArray(rankExamsData) ? rankExamsData : [];

  // Default to first exam if not explicitly selected
  const activeExamId = useMemo(() => {
    if (selectedExamId) return selectedExamId;
    if (safeRankExams.length > 0) return safeRankExams[0].id;
    return undefined;
  }, [selectedExamId, safeRankExams]);

  const {
    data: rankingsData,
    isLoading: isRankingsLoading,
    isFetching: isRankingsFetching,
    error: rankingsError,
    refetch: refetchRankings,
  } = useInstitutionRankingsQuery({
    examId: activeExamId,
    batchId: rankBatchId || undefined,
    page: rankPage,
    limit: rankLimit,
  });

  const rankList = Array.isArray(rankingsData?.data) ? rankingsData.data : [];
  const rankMeta = rankingsData?.meta || {
    total: rankList.length,
    page: rankPage,
    limit: rankLimit,
    totalPages: Math.ceil(rankList.length / rankLimit) || 1,
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 backdrop-blur border border-amber-400/30">
            <Award className="h-6 w-6 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Institute Rank List</h1>
            <p className="text-xs sm:text-sm text-amber-200/90">
              Live institution leaderboard and test performance rankings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              refetchExams();
              refetchRankings();
            }}
            disabled={isRankingsFetching}
            title="Refresh rank list"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isRankingsFetching ? 'animate-spin' : ''}`} /> Refresh Rankings
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Controls / Filter Bar */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Medal className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Exam Leaderboard</h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Exam Selector Dropdown */}
              <div className="relative min-w-[260px]">
                <select
                  value={activeExamId || ''}
                  onChange={(e) => {
                    setSelectedExamId(e.target.value);
                    setRankPage(1);
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-3.5 pr-8 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                >
                  {safeRankExams.length === 0 && (
                    <option value="">No completed exams found</option>
                  )}
                  {safeRankExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.targetName})
                    </option>
                  ))}
                </select>
                <BookOpen className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>

              {/* Batch Filter for Rank List */}
              <div className="relative min-w-[180px]">
                <select
                  value={rankBatchId}
                  onChange={(e) => {
                    setRankBatchId(e.target.value);
                    setRankPage(1);
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-3.5 pr-8 text-xs sm:text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
                >
                  <option value="">All Batches</option>
                  {batchesData.map((b) => (
                    <option key={b.id} value={b.id}>
                      Batch: {b.name}
                    </option>
                  ))}
                </select>
                <Filter className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Rank Table Content */}
        <div className="overflow-x-auto relative">
          {isRankingsFetching && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-500 animate-pulse" />
          )}

          {rankingsError && rankList.length === 0 ? (
            <div className="p-6">
              <SectionError
                title="Unable to load rank list"
                description="Failed to retrieve ranking data for this exam. Please check your connection and retry."
                onRetry={() => refetchRankings()}
              />
            </div>
          ) : isRankingsLoading && rankList.length === 0 ? (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4 text-right">Score</th>
                  <th className="py-3.5 px-4 text-right">Percentage</th>
                  <th className="py-3.5 px-4 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4 text-center"><Skeleton className="h-7 w-7 rounded-full mx-auto" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-32 rounded" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-20 rounded" /></td>
                    <td className="py-3.5 px-4"><Skeleton className="h-4 w-24 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-12 rounded ml-auto" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-14 rounded ml-auto" /></td>
                    <td className="py-3.5 px-4 text-right"><Skeleton className="h-4 w-12 rounded ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : rankList.length === 0 ? (
            <div className="p-12 text-center">
              <Medal className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">No rank data available</h3>
              <p className="mt-1 text-xs text-slate-500">
                {activeExamId
                  ? 'No submitted attempts recorded for the selected test.'
                  : 'Complete institutional mock tests to view student rankings.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4 text-right">Score</th>
                  <th className="py-3.5 px-4 text-right">Percentage</th>
                  <th className="py-3.5 px-4 text-right">Accuracy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rankList.map((item: InstituteRankItem) => {
                  const isGold = item.rank === 1;
                  const isSilver = item.rank === 2;
                  const isBronze = item.rank === 3;

                  return (
                    <tr
                      key={item.studentId + item.rank}
                      className={`hover:bg-amber-50/20 transition ${
                        isGold ? 'bg-amber-50/40 font-semibold' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            isGold
                              ? 'bg-amber-400 text-amber-950 shadow-sm'
                              : isSilver
                                ? 'bg-slate-300 text-slate-900 shadow-sm'
                                : isBronze
                                  ? 'bg-amber-700/20 text-amber-900 border border-amber-600/30'
                                  : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          {item.studentName}
                          {isGold && <Sparkles className="h-3.5 w-3.5 text-amber-500" />}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-indigo-700 font-semibold">
                        {item.studentId}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                          {item.batchName || 'Unassigned'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {item.score}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                          {item.percentage}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                          {item.accuracy}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Rank List Pagination */}
        {rankMeta.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3.5 gap-4">
            <div className="text-xs text-slate-500">
              Showing rank{' '}
              <span className="font-bold text-slate-800">
                {(rankPage - 1) * rankLimit + (rankList.length > 0 ? 1 : 0)}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-800">
                {Math.min(rankPage * rankLimit, rankMeta.total)}
              </span>{' '}
              of <span className="font-bold text-slate-800">{rankMeta.total}</span> ranked students
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setRankPage((p) => Math.max(1, p - 1))}
                disabled={rankPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs font-semibold text-slate-700">
                {rankPage} / {rankMeta.totalPages}
              </span>
              <button
                onClick={() => setRankPage((p) => Math.min(rankMeta.totalPages, p + 1))}
                disabled={rankPage >= rankMeta.totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionRankListPage;
