// ** Packages **
import { useEffect, useState } from 'react';

// ** Components **
import Loader from '@/components/feedback/Loader';

// ** Hooks **
import { useAuth } from '@/hooks/useAuth';

// ** Services **
import { useGetStatsAPI, type DashboardStats } from '../services';

// ** Types **
interface StatCardProps {
  label: string;
  value: string;
}

const StatCard = ({ label, value }: StatCardProps) => {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
    </div>
  );
};

/**
 * Read pattern with the useAxios service hook: call the service in a guarded
 * useEffect and hold the result in local state.
 */
const DashboardPage = () => {
  const { user } = useAuth();
  const { getStatsAPI, isLoading } = useGetStatsAPI();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await getStatsAPI();
      if (!active) return;
      if (!error && data) setStats(data);
      else setErrorMsg(error);
    })();
    return () => {
      active = false;
    };
  }, [getStatsAPI]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome back, {user?.name ?? 'there'} 👋</p>
      </div>

      {isLoading && <Loader label="Loading stats…" />}

      {errorMsg && (
        <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          Failed to load stats: {errorMsg}
        </p>
      )}

      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="Total Users" value={stats.totalUsers.toLocaleString()} />
          <StatCard label="Revenue" value={`$${stats.revenue.toLocaleString()}`} />
          <StatCard label="Active Sessions" value={stats.activeSessions.toLocaleString()} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
