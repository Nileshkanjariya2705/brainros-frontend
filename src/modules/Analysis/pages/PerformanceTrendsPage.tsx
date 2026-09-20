import React, { useState, useEffect } from 'react';
import { TrendingUp, RotateCw } from 'lucide-react';
import { useGetPerformanceTrendsAPI, useCompareMocksAPI } from '@/modules/Exams/services';
import type { PerformanceTrendsResponse, DirectComparisonResponse } from '@/types/exam.types';
import PerformanceTrendsView from '../components/PerformanceTrendsView';
import Loader from '@/components/feedback/Loader';
import Button from '@/components/ui/Button';

export const PerformanceTrendsPage: React.FC = () => {
  const { getPerformanceTrendsAPI, isLoading } = useGetPerformanceTrendsAPI();
  const { compareMocksAPI, isLoading: isLoadingComparison } = useCompareMocksAPI();

  const [trendsData, setTrendsData] = useState<PerformanceTrendsResponse | null>(null);
  const [comparisonData, setComparisonData] = useState<DirectComparisonResponse | null>(null);

  const loadTrends = async () => {
    const res = await getPerformanceTrendsAPI({
      limit: 10,
    });
    if (res.data) {
      setTrendsData(res.data);
      setComparisonData(null);
    }
  };

  useEffect(() => {
    loadTrends();
  }, []);

  const handleCompareMocks = async (attemptA: string, attemptB: string) => {
    const res = await compareMocksAPI(attemptA, attemptB);
    if (res.data) {
      setComparisonData(res.data);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-800">
              Mock Comparison Engine
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
              Trend Analytics
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Performance Trends & Trajectory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your score growth, accuracy gains, and ranking trajectory across mock exams.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={loadTrends} className="gap-1.5" size="sm">
            <RotateCw size={14} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>


      {/* ── Content View ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="py-20">
          <Loader label="Aggregating performance trends..." />
        </div>
      ) : trendsData ? (
        <PerformanceTrendsView
          data={trendsData}
          comparisonData={comparisonData}
          onCompareMocks={handleCompareMocks}
          isLoadingComparison={isLoadingComparison}
        />
      ) : (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <TrendingUp className="mx-auto text-slate-300 mb-3" size={40} />
          <h3 className="text-base font-bold text-slate-800">No Performance Data</h3>
          <p className="text-xs text-slate-500 mt-1">
            Complete mock exams to generate comprehensive trend analytics.
          </p>
        </div>
      )}
    </div>
  );
};

export default PerformanceTrendsPage;
