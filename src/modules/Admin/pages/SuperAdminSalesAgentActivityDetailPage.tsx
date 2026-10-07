import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Clock,
  Phone,
  ExternalLink,
  ShieldCheck,
  Camera,
  FileText,
  X,
  Maximize2,
  RefreshCw,
  AlertCircle,
  Users,
  Receipt,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { SalesVisitService, type SalesVisit } from '@/services/salesVisit.service';
import { toast } from '@/utils/toast';

export const SuperAdminSalesAgentActivityDetailPage: React.FC = () => {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('Evidence Preview');
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

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
  const slipPhotoUrl = act?.slipUrl || act?.slipPhoto;

  const photosList: string[] = Array.from(
    new Set([
      ...(act?.photos || []),
      ...(act?.checkInPhotos || []),
      ...(act?.checkOutPhotos || []),
    ].filter((p): p is string => typeof p === 'string' && p.trim().length > 0))
  );

  const copyRecordId = () => {
    if (act?.id) {
      navigator.clipboard.writeText(act.id);
      setCopiedId(true);
      toast.success('Record ID copied to clipboard');
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const copyCoordinates = () => {
    if (lat != null && lng != null) {
      navigator.clipboard.writeText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setCopiedCoords(true);
      toast.success('Coordinates copied');
      setTimeout(() => setCopiedCoords(false), 2000);
    }
  };

  const openLightbox = (url: string, title: string) => {
    setSelectedPhoto(url);
    setLightboxTitle(title);
  };

  return (
    <div
      className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 pb-20"
      data-testid="super-admin-activity-detail-page"
    >
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/super-admin/sales-agent-activities')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Activities</span>
          </button>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Field Activities</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 dark:text-slate-300 font-bold max-w-[200px] truncate">
              {act?.institutionName || 'Activity Detail'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {lat != null && lng != null && (
            <a
              href={`https://maps.google.com/?q=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors shadow-sm"
              title="Open Location in Google Maps"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Google Maps</span>
            </a>
          )}

          {act?.salesAgentId && (
            <button
              type="button"
              onClick={() => navigate(`/super-admin/sales-agents/${act.salesAgentId}`)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Agent Profile</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <Skeleton className="h-48 w-full rounded-3xl" />
              <Skeleton className="h-48 w-full rounded-3xl" />
            </div>
            <div className="lg:col-span-5 space-y-6">
              <Skeleton className="h-64 w-full rounded-3xl" />
              <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
          </div>
        </div>
      ) : isError || !act ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-rose-950/50 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Field Activity Record Not Found
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              This field activity could not be found or may have been updated.
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
          {/* Executive Header Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-xl p-6 sm:p-8">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 flex-1 min-w-0">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-400/30 backdrop-blur">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Activity Completed
                  </span>
                  {slipPhotoUrl && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-black border border-amber-300/30 backdrop-blur">
                      <Receipt className="w-3.5 h-3.5 text-amber-300" />
                      Slip Verified
                    </span>
                  )}
                  {lat != null && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-bold border border-indigo-400/30 backdrop-blur">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-300" />
                      GPS Geo-Verified
                    </span>
                  )}
                </div>

                {/* Institution Title */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight truncate">
                  {act.institutionName}
                </h1>

                {/* Date & Location summary */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>
                      {new Date(act.scheduledAt || act.createdAt).toLocaleString(undefined, {
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
                      <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="truncate max-w-md">{act.locationAddress}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Agent Quick Profile Pill */}
              {act.salesAgentId && (
                <div className="flex items-center gap-3.5 bg-white/10 hover:bg-white/15 backdrop-blur border border-white/15 p-3.5 sm:p-4 rounded-2xl shrink-0 self-start md:self-center transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white font-black flex items-center justify-center text-base shadow-md">
                    {agentName.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left text-xs space-y-0.5">
                    <span className="text-indigo-300 block text-[10px] uppercase font-extrabold tracking-wider">
                      Sales Agent
                    </span>
                    <span className="font-extrabold text-white text-sm block">
                      {agentName}
                    </span>
                    {agentPhone && (
                      <span className="text-slate-300 text-[11px] block">{agentPhone}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Subtle Gradient Glows */}
            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -top-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* Main 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (Primary Details - 7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Institution & Contact Details Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        School & Contact Details
                      </h3>
                      <p className="text-xs text-slate-400">Representative & Institution contact profile</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                  {/* School Contact Person */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      School Contact Person
                    </span>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {act.contactPerson || 'Not specified'}
                    </p>
                    {act.contactPhone ? (
                      <a
                        href={`tel:${act.contactPhone}`}
                        className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-bold hover:underline pt-0.5"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{act.contactPhone}</span>
                      </a>
                    ) : (
                      <p className="text-slate-400 italic">No phone provided</p>
                    )}
                  </div>

                  {/* Region / Location */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Assigned Region
                    </span>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                      {act.district || act.state ? `${act.district || ''}${act.district && act.state ? ', ' : ''}${act.state || ''}` : 'Region On-Record'}
                    </p>
                  </div>

                  {/* Field Sales Agent */}
                  <div className="sm:col-span-2 p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider block">
                        Field Agent Assigned
                      </span>
                      <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {agentName}
                      </p>
                      {agentEmail && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{agentEmail}</p>
                      )}
                    </div>
                    {agentPhone && (
                      <a
                        href={`tel:${agentPhone}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-bold text-xs shadow-sm hover:bg-indigo-50"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>{agentPhone}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Verified GPS Location & Map Details Card */}
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
                      <p className="text-xs text-slate-400">On-field satellite geo-verification timestamp</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="font-bold text-slate-800 dark:text-slate-200 flex items-start gap-2 leading-relaxed">
                      <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{act.locationAddress || 'Field Location Captured'}</span>
                    </p>

                    {lat != null && lng != null && (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-extrabold text-slate-400 uppercase">
                            Coordinates:
                          </span>
                          <button
                            type="button"
                            onClick={copyCoordinates}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-mono font-bold text-xs border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 hover:bg-emerald-100 transition-colors"
                            title="Click to copy coordinates"
                          >
                            <span>{lat.toFixed(6)}°, {lng.toFixed(6)}°</span>
                            {copiedCoords ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-emerald-500 opacity-70" />
                            )}
                          </button>
                        </div>

                        <a
                          href={`https://maps.google.com/?q=${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow transition-all hover:shadow-md"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          <span>Open in Maps</span>
                          <ExternalLink className="w-3 h-3 opacity-80" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Discussion Notes & Summary Card */}
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
                      <p className="text-xs text-slate-400">Meeting outcome and requirements recorded by agent</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {act.purpose && (
                    <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs">
                      <span className="font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
                        Meeting Purpose / Objective
                      </span>
                      <p className="font-extrabold text-slate-900 dark:text-white">{act.purpose}</p>
                    </div>
                  )}

                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">
                      Agent Notes
                    </span>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-medium">
                      {act.notes || act.summary || 'No discussion notes provided for this activity.'}
                    </div>
                  </div>

                  {act.keyDiscussionPoints && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 text-xs">
                      <span className="font-black text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-1">
                        Key Discussion Points / Requirements
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 font-medium">
                        {act.keyDiscussionPoints}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (Verification Media & Execution Hub - 5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Activity Slip / Document Proof Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Activity Slip Proof
                      </h3>
                      <p className="text-xs text-slate-400">Signed slip, receipt, or document</p>
                    </div>
                  </div>

                  {slipPhotoUrl ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-200 dark:border-emerald-800">
                      Attached
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] font-bold">
                      Not Attached
                    </span>
                  )}
                </div>

                {!slipPhotoUrl ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                    <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      No slip attached
                    </p>
                    <p className="text-[11px] text-slate-400">
                      No physical activity slip was uploaded during submission.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Natural document preview container */}
                    <div
                      className="group relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-2 shadow-inner hover:border-emerald-500/50 transition-all cursor-pointer"
                      onClick={() => openLightbox(slipPhotoUrl, 'Activity Slip / Document Proof')}
                    >
                      <div className="relative rounded-xl overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center min-h-[220px] max-h-[340px]">
                        <img
                          src={slipPhotoUrl}
                          alt="Activity Slip Proof"
                          className="max-h-[320px] w-auto max-w-full object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.02]"
                        />

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white p-4 text-center backdrop-blur-xs">
                          <div className="p-3 rounded-full bg-white/20 text-white shadow-lg">
                            <Maximize2 className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-black tracking-wide">Click to Enlarge Slip</span>
                          <span className="text-[10px] text-slate-300">View full resolution document</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Slip File</span>
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openLightbox(slipPhotoUrl, 'Activity Slip / Document Proof')}
                          className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-bold inline-flex items-center gap-1"
                        >
                          <Maximize2 className="w-3 h-3" />
                          <span>Expand</span>
                        </button>
                        <a
                          href={slipPhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 font-semibold inline-flex items-center gap-1"
                        >
                          <span>Open Full</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* GPS Map Camera Proof Gallery Card */}
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
                      No camera photos attached
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Check-in photo evidence was not captured for this visit.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {photosList.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-2 shadow-inner hover:border-indigo-500/50 transition-all cursor-pointer"
                        onClick={() => openLightbox(photoUrl, `GPS Map Camera Proof #${idx + 1}`)}
                      >
                        <div className="relative rounded-xl overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center min-h-[200px] max-h-[300px]">
                          <img
                            src={photoUrl}
                            alt={`GPS Proof ${idx + 1}`}
                            className="max-h-[280px] w-auto max-w-full object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white p-4 text-center backdrop-blur-xs">
                            <div className="p-3 rounded-full bg-white/20 text-white shadow-lg">
                              <Maximize2 className="w-5 h-5" />
                            </div>
                            <span className="text-xs font-black">View Watermarked Photo</span>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/75 text-white text-[10px] font-black backdrop-blur flex items-center gap-1 shadow">
                            <Camera className="w-3 h-3 text-amber-400" />
                            <span>GPS Proof #{idx + 1}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Execution Timestamps & Audit Trail Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="font-black text-slate-400 uppercase tracking-wider text-[11px]">
                    Execution Timestamps & Audit
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">LIVE RECORD</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">Submission Date:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {new Date(act.scheduledAt || act.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500 font-medium">Submission Time:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {new Date(act.scheduledAt || act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {act.status && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500 font-medium">Activity Status:</span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 uppercase">
                        {act.status}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 mt-2">
                    <span className="font-medium">Record ID:</span>
                    <button
                      type="button"
                      onClick={copyRecordId}
                      className="font-mono text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors group"
                      title="Click to copy Record ID"
                    >
                      <span className="truncate max-w-[170px]">{act.id}</span>
                      {copiedId ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Lightbox / Fullscreen Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="relative max-w-5xl max-h-[92vh] w-full flex flex-col items-center bg-slate-950/80 rounded-3xl p-4 border border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="w-full flex justify-between items-center text-white pb-3 border-b border-white/10 px-2">
              <span className="text-sm font-black flex items-center gap-2">
                {selectedPhoto === slipPhotoUrl ? (
                  <>
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Activity Slip / Document Proof</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-amber-400" />
                    <span>{lightboxTitle}</span>
                  </>
                )}
              </span>

              <div className="flex items-center gap-3">
                <a
                  href={selectedPhoto}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-indigo-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <span>Open Full Size</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedPhoto(null)}
                  className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Viewport */}
            <div className="w-full flex-1 overflow-auto flex items-center justify-center p-2 min-h-[300px]">
              <img
                src={selectedPhoto}
                alt="Expanded Evidence"
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl bg-slate-900"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminSalesAgentActivityDetailPage;
