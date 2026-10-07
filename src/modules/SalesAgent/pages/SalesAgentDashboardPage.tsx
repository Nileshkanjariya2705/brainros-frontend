import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Target,
  DollarSign,
  MapPin,
  Clock,
  Plus,
  Sparkles,
  Award,
  Activity,
  X,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SalesAgentService } from '@/services/salesAgent.service';
import { SalesVisitService, type SalesVisit } from '@/services/salesVisit.service';
import { salesAgentKeys } from '@/services/queryKeys';

export const SalesAgentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string | null>(null);

  // Queries
  const { data: dashboard } = useQuery({
    queryKey: salesAgentKeys.dashboard(),
    queryFn: () => SalesAgentService.getDashboard(),
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: visitsData } = useQuery({
    queryKey: salesAgentKeys.visits({ limit: 10 }),
    queryFn: () => SalesVisitService.listVisits({ limit: 10 }),
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const kpis = dashboard?.kpis || {
    totalVisits: 0,
    monthVisits: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    conversionRate: 0,
    totalInstitutions: 0,
    todayVisitsCount: 0,
    monthlyVisitsTarget: 30,
    monthlyVisitsCompleted: 0,
  };

  const rawVisitsData = visitsData as any;
  const allVisits: SalesVisit[] = Array.isArray(rawVisitsData?.items)
    ? rawVisitsData.items
    : Array.isArray(rawVisitsData?.data?.items)
    ? rawVisitsData.data.items
    : Array.isArray(rawVisitsData?.data)
    ? rawVisitsData.data
    : Array.isArray(rawVisitsData)
    ? rawVisitsData
    : [];

  const displayVisits = allVisits.slice(0, 10);
  const completedVisitsCount = allVisits.filter((v) => v.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner / Today's Command Center */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold uppercase tracking-wider text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
              Field Sales Command Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Today's Field Activity
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed">
              Log client visits, record discussions, and track on-the-ground sales operations in real-time.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/sales-agent/add-activity')}
              className="px-5 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-blue-50 font-black text-sm shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-5 h-5 text-indigo-600" />
              <span>Add Activity</span>
            </button>
            <button
              onClick={() => navigate('/sales-agent/visits')}
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur transition-transform hover:-translate-y-0.5 flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Activity History
            </button>
          </div>
        </div>

        {/* Decorative Background Circles */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-48 h-48 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Visits */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Field Visits</span>
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpis.totalVisits || allVisits.length}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
              +{kpis.monthVisits || completedVisitsCount} completed
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {kpis.todayVisitsCount || 0} visits logged today
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion Rate</span>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {kpis.conversionRate}%
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              {kpis.totalInstitutions} institutions
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across schools & colleges
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month Revenue</span>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              ₹{(kpis.monthRevenue || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Total closed: ₹{(kpis.totalRevenue || 0).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Target Progress */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Visits Target</span>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {completedVisitsCount} / {kpis.monthlyVisitsTarget}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    (completedVisitsCount /
                      kpis.monthlyVisitsTarget) *
                      100,
                  ),
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content: Today's Activities & Quick Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Field Visits Schedule (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                <span>Today's Activities & Field Timeline</span>
              </h2>
              <p className="text-xs text-slate-500">Record on-site demos, client meetings, and track outcomes</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/sales-agent/add-activity')}
                className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                + Add Activity
              </button>
              <button
                onClick={() => navigate('/sales-agent/visits')}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 ml-2"
              >
                View History →
              </button>
            </div>
          </div>

          {displayVisits.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm space-y-3">
              <p>No activities recorded yet for today.</p>
              <button
                onClick={() => navigate('/sales-agent/add-activity')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition-all"
              >
                + Add First Activity Today
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {displayVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {visit.institutionName}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(visit.scheduledAt).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {visit.locationAddress && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {visit.locationAddress}
                        </span>
                      )}
                      {visit.contactPerson && <span>Contact: {visit.contactPerson}</span>}
                    </div>
                    {/* GPS Map Camera Photo Proof Thumbnail */}
                    {(visit.photos && visit.photos.length > 0) || (visit.checkInPhotos && visit.checkInPhotos.length > 0) ? (
                      <div className="pt-1 flex items-center gap-2">
                        {((visit.photos || visit.checkInPhotos) as string[]).map((photoUrl, pIdx) => (
                          <div
                            key={pIdx}
                            onClick={() => setSelectedPhotoUrl(photoUrl)}
                            className="relative group w-16 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-sm hover:shadow transition-all"
                          >
                            <img
                              src={photoUrl}
                              alt="GPS Map Camera Proof"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                              View
                            </div>
                            <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-black/60 text-white text-[7px] font-bold">
                              📷 GPS
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {visit.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        {visit.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Field Operations & Quick Links (1 col) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <span>Operations Hub</span>
            </h2>
            <p className="text-xs text-slate-500">Quick field actions and target progress</p>
          </div>

          <div className="space-y-3">
            <div
              onClick={() => navigate('/sales-agent/add-activity')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-slate-50/70 dark:bg-slate-800/40 cursor-pointer transition-all hover:shadow-md flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Record Visit Activity</h4>
                  <p className="text-xs text-slate-500">Log on-site meeting & photo</p>
                </div>
              </div>
              <Plus className="w-4 h-4 text-indigo-600" />
            </div>

            <div
              onClick={() => navigate('/sales-agent/visits')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 bg-slate-50/70 dark:bg-slate-800/40 cursor-pointer transition-all hover:shadow-md flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Activity History</h4>
                  <p className="text-xs text-slate-500">View logged field visits & reports</p>
                </div>
              </div>
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal for Photo Proof */}
      {selectedPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in">
          <button
            onClick={() => setSelectedPhotoUrl(null)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedPhotoUrl}
            alt="GPS Map Camera Field Proof"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
export default SalesAgentDashboardPage;
