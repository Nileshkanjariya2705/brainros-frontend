import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Search,
  RefreshCw,
  Building2,
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  Eye,
  Plus,
  X,
  User,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { SalesVisitService, type SalesVisit } from '@/services/salesVisit.service';
import { salesAgentKeys } from '@/services/queryKeys';
import { UploadSlipModal } from '../components/UploadSlipModal';

type SlipTab = 'PENDING' | 'UPLOADED' | 'ALL';

export const UploadSlipPage: React.FC = () => {
  const navigate = useNavigate();

  // Tab & search state
  const [activeTab, setActiveTab] = useState<SlipTab>('PENDING');
  const [search, setSearch] = useState('');

  // Modal & lightbox state
  const [selectedVisitForUpload, setSelectedVisitForUpload] = useState<SalesVisit | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [lightboxSlipUrl, setLightboxSlipUrl] = useState<string | null>(null);

  // Fetch sales visits for the agent
  const {
    data: visitsResponse,
    isLoading,
    isFetching,
    refetch,
    isError,
  } = useQuery({
    queryKey: salesAgentKeys.visits({ limit: 100 }),
    queryFn: () => SalesVisitService.listVisits({ limit: 100 }),
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const rawVisitsData = visitsResponse as any;
  const allVisits: SalesVisit[] = useMemo(() => {
    if (Array.isArray(rawVisitsData?.items)) return rawVisitsData.items;
    if (Array.isArray(rawVisitsData?.data?.items)) return rawVisitsData.data.items;
    if (Array.isArray(rawVisitsData?.data)) return rawVisitsData.data;
    if (Array.isArray(rawVisitsData)) return rawVisitsData;
    return [];
  }, [rawVisitsData]);

  // Derived counts
  const pendingVisits = useMemo(
    () => allVisits.filter((v) => !v.slipPhoto && !v.slipUrl),
    [allVisits]
  );
  const uploadedVisits = useMemo(
    () => allVisits.filter((v) => Boolean(v.slipPhoto || v.slipUrl)),
    [allVisits]
  );

  // Filtered visits based on tab & search
  const filteredVisits = useMemo(() => {
    let list = allVisits;
    if (activeTab === 'PENDING') {
      list = pendingVisits;
    } else if (activeTab === 'UPLOADED') {
      list = uploadedVisits;
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (v) =>
          v.institutionName.toLowerCase().includes(q) ||
          v.contactPerson?.toLowerCase().includes(q) ||
          v.contactPhone?.includes(q) ||
          v.locationAddress?.toLowerCase().includes(q) ||
          v.notes?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allVisits, activeTab, pendingVisits, uploadedVisits, search]);

  const handleOpenUpload = (visit: SalesVisit) => {
    setSelectedVisitForUpload(visit);
    setIsUploadModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300" data-testid="upload-slip-page">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold uppercase tracking-wider text-emerald-100">
              <Receipt className="w-3.5 h-3.5 text-yellow-300" />
              Document Evidence Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Activity Slips Management
            </h1>
            <p className="text-emerald-100 text-sm leading-relaxed">
              Upload and manage physical meeting slips, quotation acknowledgments, and visit receipts for field activities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/sales-agent/add-activity')}
              className="px-5 py-3 rounded-2xl bg-white text-emerald-700 hover:bg-emerald-50 font-black text-sm shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Add New Activity</span>
            </button>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 border border-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur transition-all flex items-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Decorative background blur shapes */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/3 -top-12 w-48 h-48 bg-teal-400/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Slips Card */}
        <div
          onClick={() => setActiveTab('PENDING')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'PENDING'
              ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 shadow-md ring-2 ring-amber-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">
              Slips Pending Upload
            </span>
            <div className="p-2.5 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-800 dark:text-amber-300">
              {pendingVisits.length}
            </span>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
              Action Required
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Activities awaiting physical slip photo proof
          </p>
        </div>

        {/* Uploaded Slips Card */}
        <div
          onClick={() => setActiveTab('UPLOADED')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'UPLOADED'
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-md ring-2 ring-emerald-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Slips Uploaded & Verified
            </span>
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-800 dark:text-emerald-300">
              {uploadedVisits.length}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Completed
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Field visits with verified physical slip proof
          </p>
        </div>

        {/* Total Activities Card */}
        <div
          onClick={() => setActiveTab('ALL')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-indigo-50/80 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700 shadow-md ring-2 ring-indigo-400/30'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:shadow'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              Total Logged Activities
            </span>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {allVisits.length}
            </span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
              Visits
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            All registered visits across target territories
          </p>
        </div>
      </div>

      {/* Filter Toolbar & Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setActiveTab('PENDING')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'PENDING'
                  ? 'bg-amber-500 text-white shadow-sm shadow-amber-200 dark:shadow-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Slips</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white">
                {pendingVisits.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('UPLOADED')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'UPLOADED'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200 dark:shadow-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Uploaded Slips</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white">
                {uploadedVisits.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'ALL'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 dark:shadow-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>All Activities</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-white/25 text-white">
                {allVisits.length}
              </span>
            </button>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search school or contact..."
              className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Activities Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : isError ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-rose-100 dark:border-rose-950/50 space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-sm font-bold text-rose-600">Failed to load sales activities.</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : filteredVisits.length === 0 ? (
        <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
          {activeTab === 'PENDING' ? (
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                All Slips Uploaded!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Great job! There are currently no field activities with pending slips. When you log new visits without slips, they will automatically appear here.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/sales-agent/add-activity')}
                className="mt-2 text-xs font-bold"
              >
                Log New Field Activity
              </Button>
            </div>
          ) : (
            <EmptyState
              title="No Activities Found"
              description="No activity records matched your filter criteria."
              actionLabel="Reset Search"
              onAction={() => setSearch('')}
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredVisits.map((visit) => {
            const hasSlip = Boolean(visit.slipPhoto || visit.slipUrl);
            const slipUrl = visit.slipPhoto || visit.slipUrl;
            const visitDate = new Date(visit.scheduledAt || visit.createdAt);

            return (
              <div
                key={visit.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
              >
                {/* Header Row */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {hasSlip ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Slip Uploaded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Slip Pending
                          </span>
                        )}
                        <span className="text-[11px] font-semibold text-slate-400">
                          {visitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                        <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{visit.institutionName}</span>
                      </h3>
                    </div>

                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-slate-700 shrink-0">
                      {visitDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Contact & Location details */}
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400 pt-1">
                    {(visit.contactPerson || visit.contactPhone) && (
                      <div className="flex items-center gap-2">
                        {visit.contactPerson && (
                          <span className="flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{visit.contactPerson}</span>
                          </span>
                        )}
                        {visit.contactPhone && (
                          <a
                            href={`tel:${visit.contactPhone}`}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{visit.contactPhone}</span>
                          </a>
                        )}
                      </div>
                    )}

                    {visit.locationAddress && (
                      <p className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{visit.locationAddress}</span>
                      </p>
                    )}

                    {visit.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-100 dark:border-slate-800 mt-2 font-medium">
                        {visit.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Row / Slip Card & Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                  {hasSlip && slipUrl ? (
                    <div className="flex items-center gap-3">
                      <div
                        onClick={() => setLightboxSlipUrl(slipUrl)}
                        className="relative w-14 h-10 rounded-lg overflow-hidden border border-emerald-400/50 bg-slate-900 cursor-pointer shadow-xs hover:scale-105 transition-transform shrink-0"
                        title="Click to Enlarge Slip"
                      >
                        <img
                          src={slipUrl}
                          alt="Slip Thumbnail"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-3 h-3" />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setLightboxSlipUrl(slipUrl)}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Slip</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-bold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>Slip Missing</span>
                    </div>
                  )}

                  {/* Primary CTA */}
                  {hasSlip ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenUpload(visit)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-emerald-600 border-slate-200 dark:border-slate-700"
                    >
                      <UploadCloud className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      <span>Change Slip</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleOpenUpload(visit)}
                      className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200 dark:shadow-none flex items-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Upload Slip</span>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Slip Modal */}
      {isUploadModalOpen && (
        <UploadSlipModal
          isOpen={isUploadModalOpen}
          onClose={() => {
            setIsUploadModalOpen(false);
            setSelectedVisitForUpload(null);
          }}
          visit={selectedVisitForUpload}
          onSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* Fullscreen Slip Lightbox Modal */}
      {lightboxSlipUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/95 p-4 animate-in fade-in"
          onClick={() => setLightboxSlipUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxSlipUrl(null)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxSlipUrl}
            alt="Full Slip Document"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
export default UploadSlipPage;
