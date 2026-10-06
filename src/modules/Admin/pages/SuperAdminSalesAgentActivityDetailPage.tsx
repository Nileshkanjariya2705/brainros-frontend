import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Phone,
  Mail,
  User,
  ExternalLink,
  ShieldCheck,
  Camera,
  FileText,
  Calendar,
  X,
  Maximize2,
  RefreshCw,
  AlertCircle,
  Users,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { SalesVisitService, type SalesVisit } from '@/services/salesVisit.service';

export const SuperAdminSalesAgentActivityDetailPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const {
    data: activity,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['sales-activity-detail', activityId],
    queryFn: () => SalesVisitService.getVisitById(activityId!),
    enabled: Boolean(activityId),
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const act: SalesVisit | undefined = activity;

  const agentName = act?.salesAgent?.name || 'Sales Representative';
  const agentPhone = act?.salesAgent?.mobileNumber || act?.salesAgent?.phone || act?.contactPhone || '';
  const agentEmail = act?.salesAgent?.email || '';
  const lat = act?.latitude || act?.checkInLat;
  const lng = act?.longitude || act?.checkInLng;

  const photosList: string[] = Array.from(
    new Set([
      ...(act?.photos || []),
      ...(act?.checkInPhotos || []),
      ...(act?.checkOutPhotos || []),
    ].filter((p): p is string => typeof p === 'string' && p.trim().length > 0))
  );

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300 pb-16"
      data-testid="super-admin-activity-detail-page"
    >
      {/* Top Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/super-admin/sales-agent-activities')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Activities Feed
          </button>
        </div>

        <div className="flex items-center gap-2">
          {act?.salesAgentId && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/super-admin/sales-agents/${act.salesAgentId}`)}
              className="text-xs font-bold text-indigo-700 border-indigo-200 hover:bg-indigo-50 flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>View Agent Profile</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      ) : isError || !act ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-rose-950/50 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Field Activity Not Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              This field activity record could not be found or may have been updated.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/super-admin/sales-agent-activities')}
            >
              ← Back to Today's Activities
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Header Banner */}
          <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-semibold uppercase tracking-wider text-blue-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Field Sales Activity Log</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {act.institutionName}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-blue-100">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-blue-300 shrink-0" />
                    <span>
                      Submitted on {new Date(act.scheduledAt || act.createdAt).toLocaleString(undefined, {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                  {act.locationAddress && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-blue-300 shrink-0" />
                      <span className="truncate max-w-md">{act.locationAddress}</span>
                    </span>
                  )}
                </div>
              </div>

              {act.salesAgentId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/super-admin/sales-agents/${act.salesAgentId}`)}
                  className="bg-white text-indigo-700 hover:bg-blue-50 font-extrabold shadow-lg flex items-center gap-2 shrink-0 self-start md:self-center"
                >
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Agent Profile →</span>
                </Button>
              )}
            </div>

            {/* Background Blur Accents */}
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute right-1/3 -top-10 w-48 h-48 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />
          </div>

          {/* Main Grid: Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Main Information Cards */}
            <div className="lg:col-span-2 space-y-6">
              {/* Agent & School Contact Info Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sales Representative Card */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-indigo-500" />
                    Sales Representative
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <p className="font-extrabold text-base text-slate-900 dark:text-white">
                      {agentName}
                    </p>
                    {agentEmail && (
                      <a
                        href={`mailto:${agentEmail}`}
                        className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{agentEmail}</span>
                      </a>
                    )}
                    {agentPhone && (
                      <a
                        href={`tel:${agentPhone}`}
                        className="text-indigo-600 font-bold flex items-center gap-1.5 hover:underline pt-0.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{agentPhone}</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* School Contact Person Card */}
                <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    School Contact Person
                  </span>
                  <div className="space-y-1.5 text-xs">
                    <p className="font-extrabold text-base text-slate-900 dark:text-white">
                      {act.contactPerson || 'Not specified'}
                    </p>
                    {act.contactPhone ? (
                      <a
                        href={`tel:${act.contactPhone}`}
                        className="text-blue-600 font-bold flex items-center gap-1.5 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{act.contactPhone}</span>
                      </a>
                    ) : (
                      <p className="text-slate-400 italic">No phone recorded</p>
                    )}
                    {act.district && (
                      <p className="text-slate-500 font-medium">
                        Region: {act.district}, {act.state || 'India'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Verified GPS Location & Address Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Verified GPS Location & Coordinates
                      </h3>
                      <p className="text-xs text-slate-400">Geo-verification captured on field</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{act.locationAddress || 'Field Location Captured'}</span>
                  </p>

                  {lat != null && lng != null ? (
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 font-mono font-bold text-xs">
                        Lat: {lat.toFixed(5)}°, Long: {lng.toFixed(5)}°
                      </span>
                      <a
                        href={`https://maps.google.com/?q=${lat},${lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition-colors"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Open in Google Maps</span>
                        <ExternalLink className="w-3 h-3 opacity-80" />
                      </a>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Discussion Notes Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Activity Notes & Discussion Points
                      </h3>
                      <p className="text-xs text-slate-400">Client meeting details recorded by agent</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {act.purpose && (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                      <span className="font-bold text-indigo-500 uppercase tracking-wider block mb-1">
                        Meeting Purpose / Objective
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white">{act.purpose}</p>
                    </div>
                  )}

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {act.notes || act.summary || 'No discussion notes provided for this activity.'}
                  </div>

                  {act.keyDiscussionPoints && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-xs">
                      <span className="font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                        Specific Key Points / Requirements
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        {act.keyDiscussionPoints}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Column 3: GPS Photo Evidence Gallery & Timestamps */}
            <div className="space-y-6">
              {/* Photo Proof Gallery Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        GPS Map Camera Proof ({photosList.length})
                      </h3>
                      <p className="text-xs text-slate-400">Watermarked field photo evidence</p>
                    </div>
                  </div>
                </div>

                {photosList.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                    <Camera className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No photo attached
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {photosList.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer aspect-video"
                        onClick={() => setSelectedPhoto(photoUrl)}
                      >
                        <img
                          src={photoUrl}
                          alt={`Proof ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                          <Maximize2 className="w-4 h-4" />
                          <span>View Full Photo</span>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold backdrop-blur">
                          📷 GPS Proof #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Follow-Up Card (if available) */}
              {act.nextFollowUpDate && (
                <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 shadow-sm space-y-3">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-indigo-50 dark:border-indigo-900/40">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Follow-Up Scheduled
                    </h4>
                  </div>
                  <p className="text-sm font-extrabold text-indigo-900 dark:text-indigo-200">
                    {new Date(act.nextFollowUpDate).toLocaleDateString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {/* Timestamps Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3 text-xs">
                <h4 className="font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  Execution Timestamps
                </h4>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Submission Date:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(act.scheduledAt || act.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">Submission Time:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {new Date(act.scheduledAt || act.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span>Record ID:</span>
                  <span className="font-mono">{act.id}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Lightbox / Fullscreen Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] w-full flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center text-white pb-3 px-2">
              <span className="text-sm font-bold">GPS Map Camera Photo Proof</span>
              <div className="flex items-center gap-3">
                <a
                  href={selectedPhoto}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-300 hover:text-white"
                >
                  Open Original <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <img
              src={selectedPhoto}
              alt="Expanded Proof"
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminSalesAgentActivityDetailPage;
