import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  Calendar,
  FileText,
  Camera,
  AlertCircle,
  ExternalLink,
  Target,
  ArrowLeft,
  Clock,
  Phone,
  Mail,
  Users,
  ChevronRight,
  Maximize2,
  X,
  RefreshCw,
  Receipt,
  FileCheck,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import {
  SuperAdminSalesAgentApi,
  type SalesAgentActivityDetail,
} from '../services/superAdminSalesAgent.service';
import { superAdminSalesAgentKeys } from '@/services/queryKeys';

interface SuperAdminActivityDetailViewProps {
  salesAgentId: string;
  activityId: string;
  onBack: () => void;
  agentName?: string;
}

export const SuperAdminActivityDetailView: React.FC<SuperAdminActivityDetailViewProps> = ({
  salesAgentId,
  activityId,
  onBack,
  agentName,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: superAdminSalesAgentKeys.activityDetail(salesAgentId, activityId),
    queryFn: () => SuperAdminSalesAgentApi.getActivityDetail(salesAgentId, activityId),
    enabled: !!salesAgentId && !!activityId,
    staleTime: 10000,
  });

  const detail: SalesAgentActivityDetail | undefined = data?.data;
  const visit = detail?.visit;

  // Consolidate fields across visit and top-level response
  const instituteName =
    detail?.institute?.name || visit?.institutionName || 'Unnamed Institute';
  const contactPerson =
    detail?.institute?.contactPerson ||
    visit?.contactPerson ||
    'N/A';
  const contactPhone =
    detail?.institute?.contactPhone || visit?.contactPhone || 'N/A';
  const contactEmail =
    detail?.institute?.contactEmail || visit?.contactEmail || 'N/A';
  const contactRole =
    detail?.institute?.contactRole ||
    visit?.contactRole ||
    'Representative';

  const address =
    detail?.institute?.address ||
    visit?.address ||
    visit?.checkInAddress ||
    'N/A';
  const state = detail?.institute?.state || visit?.state;
  const district = detail?.institute?.district || visit?.district;
  const pincode = detail?.institute?.pincode || visit?.pincode;

  const fullAddress = [address !== 'N/A' ? address : null, district, state, pincode]
    .filter(Boolean)
    .join(', ');

  const studentCount =
    detail?.institute?.estimatedStudentCount ||
    visit?.estimatedStudentCount;
  const targetExam = detail?.institute?.targetExam;
  const currentProvider = detail?.institute?.currentProvider;
  const painPoints = detail?.institute?.painPoints;

  const status = detail?.status || visit?.status || 'COMPLETED';
  const outcome = detail?.outcome || visit?.outcome || null;
  const purpose = detail?.purpose || visit?.purpose || 'Field Visit';
  const notes = detail?.notes || visit?.notes;
  const requirements = detail?.requirements || visit?.requirements;

  const checkInLat = detail?.location?.latitude ?? visit?.checkInLatitude;
  const checkInLng = detail?.location?.longitude ?? visit?.checkInLongitude;
  const checkInAccuracy = detail?.location?.accuracy ?? visit?.checkInAccuracy;
  const checkInAddress = detail?.location?.address || visit?.checkInAddress;
  const checkInTime = detail?.visitDetails?.checkInTime || visit?.checkInTime;
  const checkOutTime = detail?.visitDetails?.checkOutTime || visit?.checkOutTime;

  const timestamp =
    detail?.timestamp ||
    visit?.scheduledAt ||
    detail?.visitDetails?.scheduledAt ||
    new Date().toISOString();

  // Consolidate photos
  const photosList: string[] = Array.from(
    new Set([
      ...(detail?.photos || []),
      ...(visit?.photos || []),
    ].filter((p): p is string => typeof p === 'string' && p.trim().length > 0))
  );

  const slipPhotoUrl =
    detail?.slipPhoto ||
    detail?.slipUrl ||
    visit?.slipPhoto ||
    visit?.slipUrl;

  const followUpDate = detail?.followUp?.nextFollowUpDate || visit?.followUpDate;
  const followUpNotes = detail?.followUp?.notes || visit?.followUpNotes;
  const followUpStatus = detail?.followUp?.status || visit?.followUpStatus;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/40 hover:text-indigo-600 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Activities
          </button>
          <div className="hidden sm:flex items-center text-xs font-medium text-slate-400 gap-1.5">
            <span>Sales Agent</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-700 dark:text-slate-300 font-semibold">
              {agentName || 'Profile'}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">
              Activity Details
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs font-semibold gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      ) : isError || !detail ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-rose-100 dark:border-rose-950/50 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Unable to load activity details
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
              This activity record could not be found or has been updated. You can try refreshing or return to the activity history list.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
            >
              ← Back to Activities List
            </button>
            <Button variant="primary" size="sm" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Main Hero Header Banner */}
          <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white shadow-xl">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/15 backdrop-blur border border-white/20 text-white">
                    {detail.type || (visit ? 'FIELD VISIT' : 'LEAD PROSPECT')}
                  </span>
                  <Badge
                    variant={
                      status === 'COMPLETED' || status === 'CONVERTED'
                        ? 'success'
                        : status === 'CANCELLED'
                        ? 'danger'
                        : 'primary'
                    }
                    size="sm"
                    className="font-bold uppercase tracking-wider"
                  >
                    {status}
                  </Badge>
                  {outcome && (
                    <Badge
                      variant={
                        outcome === 'ONBOARDED' || outcome === 'INTERESTED'
                          ? 'success'
                          : outcome === 'NOT_INTERESTED'
                          ? 'danger'
                          : 'secondary'
                      }
                      size="sm"
                      className="font-bold uppercase tracking-wider"
                    >
                      Outcome: {outcome}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {instituteName}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-indigo-100/90">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Clock className="w-4 h-4 text-indigo-300 shrink-0" />
                    {new Date(timestamp).toLocaleString(undefined, {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {fullAddress && fullAddress !== 'N/A' && (
                    <span className="flex items-center gap-1.5 font-medium">
                      <MapPin className="w-4 h-4 text-indigo-300 shrink-0" />
                      <span className="truncate max-w-md">{fullAddress}</span>
                    </span>
                  )}
                </div>
              </div>

              {photosList.length > 0 && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 px-4 py-3 rounded-2xl shrink-0 self-start md:self-center">
                  <Camera className="w-5 h-5 text-amber-300" />
                  <div>
                    <span className="block text-xs font-bold text-white uppercase tracking-wider">
                      Photo Evidence
                    </span>
                    <span className="text-xs text-indigo-200">
                      {photosList.length} photo{photosList.length > 1 ? 's' : ''} captured
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Institute & Contact Information Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Institute & Contact Details
                      </h3>
                      <p className="text-xs text-slate-400">Key institutional contact profile</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Institute Name
                    </p>
                    <p className="font-extrabold text-slate-900 dark:text-white mt-1">
                      {instituteName}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Contact Person
                    </p>
                    <p className="font-bold text-slate-900 dark:text-white mt-1">
                      {contactPerson}
                      {contactRole && (
                        <span className="block text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                          {contactRole}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Phone Number
                    </p>
                    {contactPhone !== 'N/A' ? (
                      <a
                        href={`tel:${contactPhone}`}
                        className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 mt-1 hover:underline"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {contactPhone}
                      </a>
                    ) : (
                      <p className="font-medium text-slate-500 mt-1">N/A</p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Email Address
                    </p>
                    {contactEmail !== 'N/A' ? (
                      <a
                        href={`mailto:${contactEmail}`}
                        className="inline-flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 mt-1 hover:underline truncate max-w-full"
                      >
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{contactEmail}</span>
                      </a>
                    ) : (
                      <p className="font-medium text-slate-500 mt-1">N/A</p>
                    )}
                  </div>

                  {studentCount && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Student Strength
                      </p>
                      <p className="font-extrabold text-slate-900 dark:text-white mt-1 flex items-center gap-1">
                        <Users className="w-4 h-4 text-emerald-600" />
                        {studentCount.toLocaleString()} Students
                      </p>
                    </div>
                  )}

                  {targetExam && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Target Exam
                      </p>
                      <p className="font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                        {targetExam}
                      </p>
                    </div>
                  )}

                  <div className="sm:col-span-2 md:col-span-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Full Registered Location Address
                    </p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">
                      {fullAddress || 'No full address registered'}
                    </p>
                  </div>

                  {currentProvider && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Current System
                      </p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                        {currentProvider}
                      </p>
                    </div>
                  )}

                  {painPoints && (
                    <div className="sm:col-span-2 p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40">
                      <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
                        Institution Pain Points
                      </p>
                      <p className="font-medium text-slate-800 dark:text-slate-200 text-xs mt-1">
                        {painPoints}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Interaction Notes & Discussion Points Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Interaction Notes & Discussion
                      </h3>
                      <p className="text-xs text-slate-400">Field notes logged by sales representative</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {purpose && (
                    <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
                      <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <div>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider block">
                          Activity Objective / Purpose
                        </span>
                        <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                          {purpose}
                        </span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Discussion Notes & Summary
                    </label>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                      {notes || 'No discussion notes logged for this activity.'}
                    </div>
                  </div>

                  {requirements && (
                    <div>
                      <label className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider block mb-1.5">
                        Specific Requirements / Key Discussion Points
                      </label>
                      <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-sm font-medium text-indigo-950 dark:text-indigo-200 leading-relaxed whitespace-pre-line">
                        {requirements}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Activity Slip / Document Proof Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Activity Slip / Document Proof
                      </h3>
                      <p className="text-xs text-slate-400">Physical receipt, signed note, or confirmation slip</p>
                    </div>
                  </div>

                  {slipPhotoUrl && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black border border-emerald-200 dark:border-emerald-800">
                      Attached
                    </span>
                  )}
                </div>

                {!slipPhotoUrl ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                    <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      No slip attached
                    </p>
                    <p className="text-xs text-slate-400">
                      No physical slip or acknowledgment was uploaded for this activity.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      className="group relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-2 shadow-inner hover:border-emerald-500/50 transition-all cursor-pointer"
                      onClick={() => setSelectedPhoto(slipPhotoUrl)}
                    >
                      <div className="relative rounded-xl overflow-hidden bg-white dark:bg-slate-900 flex items-center justify-center min-h-[200px] max-h-[320px]">
                        <img
                          src={slipPhotoUrl}
                          alt="Activity Slip Proof"
                          className="max-h-[300px] w-auto max-w-full object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 text-white p-4 text-center backdrop-blur-xs">
                          <div className="p-3 rounded-full bg-white/20 text-white shadow-lg">
                            <Maximize2 className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-black">Click to Enlarge Slip</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 px-1">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Verified Slip Attached</span>
                      </span>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(slipPhotoUrl)}
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

              {/* Photo Proof Gallery Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Visit Photos & Visual Proof ({photosList.length})
                      </h3>
                      <p className="text-xs text-slate-400">On-site photography uploaded by field agent</p>
                    </div>
                  </div>
                </div>

                {photosList.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                    <Camera className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                      No photos attached
                    </p>
                    <p className="text-xs text-slate-400">
                      The representative did not capture photo evidence for this activity.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {photosList.map((photoUrl, idx) => (
                      <div
                        key={idx}
                        className="group relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all cursor-pointer aspect-video"
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
                          Photo #{idx + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Column 3: GPS Location, Follow-Up & Timestamps */}
            <div className="space-y-6">
              {/* GPS Location Proof Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        GPS Location Proof
                      </h3>
                      <p className="text-xs text-slate-400">Geo-verification & coordinates</p>
                    </div>
                  </div>
                </div>

                {checkInLat && checkInLng ? (
                  <div className="space-y-3">
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-400 uppercase">Coordinates</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {Number(checkInLat).toFixed(6)}, {Number(checkInLng).toFixed(6)}
                        </span>
                      </div>
                      {checkInAccuracy && (
                        <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className="font-bold text-slate-400 uppercase">GPS Accuracy</span>
                          <span className="font-bold text-emerald-600">
                            ± {Number(checkInAccuracy).toFixed(1)} meters
                          </span>
                        </div>
                      )}
                      {checkInAddress && (
                        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                          <span className="font-bold text-slate-400 uppercase block mb-0.5">
                            Geo-Resolved Location
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {checkInAddress}
                          </span>
                        </div>
                      )}
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${checkInLat},${checkInLng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      View in Google Maps
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  </div>
                ) : (
                  <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800">
                    <MapPin className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-1.5" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No GPS Coordinates Logged
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Check-in was completed without active coordinate streaming.
                    </p>
                  </div>
                )}
              </div>

              {/* Follow-Up Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-indigo-50 dark:border-indigo-900/40">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        Follow-Up Plan
                      </h3>
                      <p className="text-xs text-slate-400">Next milestone & commitments</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40">
                    <span className="font-bold text-indigo-500 uppercase tracking-wider block mb-1">
                      Next Follow-Up Date
                    </span>
                    <span className="text-sm font-extrabold text-indigo-950 dark:text-indigo-200">
                      {followUpDate
                        ? new Date(followUpDate).toLocaleDateString(undefined, {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'No follow-up scheduled'}
                    </span>
                  </div>

                  {followUpStatus && (
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <span className="font-bold text-slate-400 uppercase">Status</span>
                      <Badge variant="primary" size="sm">
                        {followUpStatus}
                      </Badge>
                    </div>
                  )}

                  {followUpNotes && (
                    <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Follow-Up Instructions
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {followUpNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Execution Timestamps & Audit */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  Execution Timestamps
                </h4>

                <div className="space-y-2 text-xs">
                  {checkInTime && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Check-In Time:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(checkInTime).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {checkOutTime && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Check-Out Time:</span>
                      <span className="font-semibold text-emerald-600">
                        {new Date(checkOutTime).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Scheduled / Logged:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(timestamp).toLocaleString()}
                    </span>
                  </div>

                  {detail.audit?.createdAt && (
                    <div className="flex justify-between items-center py-1 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                      <span>Record ID:</span>
                      <span className="font-mono">{detail.id}</span>
                    </div>
                  )}
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
              <span className="text-sm font-bold flex items-center gap-2">
                {selectedPhoto === slipPhotoUrl ? (
                  <>
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Activity Slip / Document Proof</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 text-indigo-400" />
                    <span>Visit Photo Proof</span>
                  </>
                )}
              </span>
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
              alt="Expanded Evidence"
              className="max-h-[80vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminActivityDetailView;
