import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import cn from 'classnames';
import {
  useGetAdminLeaderboardAPI,
  useGenerateRanksAPI,
  useGetRankStatusAPI,
  useGetAvailableExamsAPI,
} from '@/modules/Exams/services';
import type {
  AdminLeaderboardResponse,
  LeaderboardEntry,
  RankTypeEnum,
  SnapshotStatusResponse,
} from '@/types/exam.types';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';

const SCOPES: { label: string; value: RankTypeEnum; icon: any }[] = [
  { label: 'Overall National', value: 'OVERALL', icon: Trophy },
  { label: 'State Leaderboard', value: 'STATE', icon: MapPin },
  { label: 'District Leaderboard', value: 'DISTRICT', icon: Building2 },
  { label: 'School / College', value: 'SCHOOL', icon: GraduationCap },
  { label: 'Category', value: 'CATEGORY', icon: Users },
];

export const AdminLeaderboardPage: React.FC = () => {
  const { getAdminLeaderboardAPI, isLoading: isLeaderboardLoading } = useGetAdminLeaderboardAPI();
  const { generateRanksAPI, isLoading: isGenerating } = useGenerateRanksAPI();
  const { getRankStatusAPI } = useGetRankStatusAPI();
  const { getAvailableExamsAPI } = useGetAvailableExamsAPI();

  const [exams, setExams] = useState<{ id: string; title: string }[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedRankType, setSelectedRankType] = useState<RankTypeEnum>('OVERALL');
  const [scopeFilter, setScopeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);

  const [leaderboardData, setLeaderboardData] = useState<AdminLeaderboardResponse | null>(null);
  const [snapshotStatus, setSnapshotStatus] = useState<SnapshotStatusResponse | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load available exams on mount
  useEffect(() => {
    const fetchExams = async () => {
      // Default to general target
      const res = await getAvailableExamsAPI('all');
      if (res.data && res.data.length > 0) {
        setExams(res.data.map((e: any) => ({ id: e.id, title: e.title })));
        setSelectedExamId(res.data[0].id);
      }
    };
    fetchExams();
  }, []);

  // Fetch leaderboard data & snapshot status when filters change
  const loadLeaderboard = async () => {
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
  };

  useEffect(() => {
    loadLeaderboard();
  }, [selectedExamId, selectedRankType, scopeFilter, page]);

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

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800">
              Leaderboard & Rankings
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
              Competition Mode (1, 1, 3)
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Exam Leaderboard & Population Rankings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Official immutable rank snapshots partitioned by National, State, District, and School
            scopes.
          </p>
        </div>

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
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* ── Exam Selector & Aggregate Summary Strip ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-1 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
          <label className="text-xs font-bold text-slate-700 block">Select Target Exam</label>
          <select
            value={selectedExamId}
            onChange={(e) => {
              setSelectedExamId(e.target.value);
              setPage(1);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
        </div>

        {/* Snapshot Summary KPIs */}
        <div className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 items-center">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Ranked Candidates
            </span>
            <div className="text-xl md:text-2xl font-black text-slate-900 mt-0.5">
              {snapshotStatus?.totalCandidates?.toLocaleString() || '0'}
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
              {snapshotStatus?.highestScore ?? '—'}
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

      {/* ── Scope Tabs & Search Bar ─────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
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
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
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
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>
        </div>
      </div>

      {/* ── Leaderboard Table ───────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {isLeaderboardLoading ? (
          <div className="py-20">
            <Loader label="Loading official leaderboard rankings..." />
          </div>
        ) : !leaderboardData || leaderboardData.items.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="mx-auto text-slate-300 mb-3" size={40} />
            <h3 className="text-base font-bold text-slate-800">No Ranked Candidates Found</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Rankings have not been generated yet for this exam or no attempts match the search
              filter.
            </p>
            <Button onClick={handleTriggerBatchGeneration} size="sm">
              Generate Rankings Now
            </Button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 text-center w-20">Rank</th>
                    <th className="py-3.5 px-4">Candidate</th>
                    <th className="py-3.5 px-4">Score</th>
                    <th className="py-3.5 px-4">Accuracy</th>
                    <th className="py-3.5 px-4">Time Used</th>
                    <th className="py-3.5 px-4">Percentile</th>
                    <th className="py-3.5 px-4">Affiliation / Region</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {leaderboardData.items.map((row: LeaderboardEntry) => (
                    <tr
                      key={row.studentId}
                      className={cn(
                        'hover:bg-slate-50/60 transition-colors',
                        row.rank === 1 && 'bg-amber-50/40',
                        row.rank === 2 && 'bg-slate-50/50',
                        row.rank === 3 && 'bg-amber-50/20',
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
                          <span className="font-black text-slate-700">#{row.rank}</span>
                        )}
                      </td>

                      {/* Candidate Name & ID */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{row.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {row.studentCode}
                        </div>
                      </td>

                      {/* Score */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-slate-900">{row.score}</span>
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
                              ? 'text-emerald-600'
                              : row.accuracy >= 75
                                ? 'text-indigo-600'
                                : 'text-slate-700',
                          )}
                        >
                          {row.accuracy.toFixed(1)}%
                        </span>
                      </td>

                      {/* Time Used */}
                      <td className="py-3 px-4 text-slate-600">
                        {formatTime(row.timeUsedSeconds)}
                      </td>

                      {/* Percentile */}
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {row.percentile.toFixed(2)}%tile
                        </span>
                      </td>

                      {/* Affiliation / Region */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        <div className="truncate max-w-[180px] font-semibold text-slate-700">
                          {row.schoolCollege || '—'}
                        </div>
                        <div className="truncate max-w-[180px] text-[10px]">
                          {row.district ? `${row.district}, ` : ''}
                          {row.state || 'National'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing page <strong className="text-slate-800">{page}</strong> of{' '}
                <strong className="text-slate-800">{leaderboardData.totalPages || 1}</strong> (
                {leaderboardData.totalCandidates} total candidates)
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  disabled={page >= leaderboardData.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1.5 rounded-xl border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
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
