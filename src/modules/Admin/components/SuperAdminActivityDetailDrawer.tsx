import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Skeleton from '@/components/ui/Skeleton';
import {
  SuperAdminSalesAgentApi,
  type SalesAgentActivityDetail,
} from '../services/superAdminSalesAgent.service';
import { superAdminSalesAgentKeys } from '@/services/queryKeys';
import {
  Building2,
  MapPin,
  Calendar,
  FileText,
  Camera,
  AlertCircle,
  ExternalLink,
  Target,
} from 'lucide-react';

interface SuperAdminActivityDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  salesAgentId: string;
  activityId: string | null;
}

export const SuperAdminActivityDetailDrawer: React.FC<SuperAdminActivityDetailDrawerProps> = ({
  isOpen,
  onClose,
  salesAgentId,
  activityId,
}) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: superAdminSalesAgentKeys.activityDetail(salesAgentId, activityId || ''),
    queryFn: () => SuperAdminSalesAgentApi.getActivityDetail(salesAgentId, activityId!),
    enabled: isOpen && !!salesAgentId && !!activityId,
  });

  const detail: SalesAgentActivityDetail | undefined = data?.data;
  const visit = detail?.visit;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-slate-900">Activity Details</span>
          {detail && (
            <Badge
              variant={
                detail.status === 'COMPLETED' || detail.status === 'CONVERTED'
                  ? 'success'
                  : detail.status === 'CANCELLED'
                  ? 'danger'
                  : 'primary'
              }
              size="md"
            >
              {detail.status}
            </Badge>
          )}
        </div>
      }
      description={
        detail ? `${detail.title} • ${new Date(detail.timestamp).toLocaleString()}` : undefined
      }
      maxWidth="4xl"
    >
      {isLoading ? (
        <div className="space-y-4 py-4">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-44 w-full rounded-2xl" />
          </div>
        </div>
      ) : isError || !detail ? (
        <div className="text-center py-12 text-slate-500">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <p className="font-semibold text-slate-800">Unable to load activity details</p>
          <p className="text-xs text-slate-400 mt-1">
            Please check your network or try again later.
          </p>
        </div>
      ) : (
        <div className="space-y-6 py-2 max-h-[75vh] overflow-y-auto pr-1">
          {/* Institute / School Information */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-indigo-600" />
              <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                Institute & Contact Details
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Institute Name</p>
                <p className="font-bold text-slate-900 mt-0.5">
                  {visit?.institutionName || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Contact Person</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {visit?.contactPerson || 'N/A'}
                  {visit?.contactRole && (
                    <span className="text-xs text-slate-500 ml-1">
                      ({visit.contactRole})
                    </span>
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Phone / Mobile</p>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {visit?.contactPhone || 'N/A'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Email</p>
                <p className="font-medium text-slate-700 mt-0.5">
                  {visit?.contactEmail || 'N/A'}
                </p>
              </div>

              <div className="sm:col-span-2">
                <p className="text-xs text-slate-400 font-semibold uppercase">Location Address</p>
                <p className="font-medium text-slate-700 mt-0.5">
                  {[
                    visit?.address || visit?.checkInAddress,
                    visit?.city,
                    visit?.district,
                    visit?.state,
                    visit?.pincode,
                  ]
                    .filter(Boolean)
                    .join(', ') || 'No address registered'}
                </p>
              </div>

              {visit?.estimatedStudentCount && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Student Strength</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {visit.estimatedStudentCount.toLocaleString()} Students
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Visit Interaction Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Interaction Info
                </h4>
              </div>

              {visit?.visitType && (
                <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Visit Type:</span>
                  <span className="font-bold text-slate-800">{visit.visitType}</span>
                </div>
              )}

              {visit?.interestLevel && (
                <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Interest Level:</span>
                  <Badge
                    variant={
                      visit.interestLevel === 'HOT'
                        ? 'success'
                        : visit.interestLevel === 'WARM'
                        ? 'primary'
                        : 'secondary'
                    }
                  >
                    {visit.interestLevel}
                  </Badge>
                </div>
              )}

              {visit?.scheduledAt && (
                <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Scheduled At:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(visit.scheduledAt).toLocaleString()}
                  </span>
                </div>
              )}

              {visit?.completedAt && (
                <div className="flex justify-between items-center text-sm py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Completed At:</span>
                  <span className="font-semibold text-emerald-700">
                    {new Date(visit.completedAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Discussion Notes & Requirements */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Notes & Discussion
                </h4>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Discussion Notes</p>
                <div className="p-3 bg-slate-50 rounded-xl text-xs font-medium text-slate-800 border border-slate-100 min-h-[70px]">
                  {visit?.notes || 'No discussion notes provided.'}
                </div>
              </div>

              {visit?.requirements && (
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase mb-1">Requirements</p>
                  <div className="p-3 bg-indigo-50/50 rounded-xl text-xs font-medium text-indigo-900 border border-indigo-100">
                    {visit.requirements}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* GPS Location Proof */}
          {(visit?.checkInLatitude || visit?.checkInAddress) && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-600" />
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    GPS Check-in Location Proof
                  </h4>
                </div>
                {visit.checkInLatitude && visit.checkInLongitude && (
                  <a
                    href={`https://www.google.com/maps?q=${visit.checkInLatitude},${visit.checkInLongitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    View in Google Maps <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-semibold uppercase block">Coordinates</span>
                  <span className="font-mono font-bold text-slate-800 text-xs mt-1 block">
                    {visit.checkInLatitude?.toFixed(6)}, {visit.checkInLongitude?.toFixed(6)}
                  </span>
                </div>
                {visit.checkInAccuracy && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase block">GPS Accuracy</span>
                    <span className="font-bold text-slate-800 text-xs mt-1 block">
                      ± {visit.checkInAccuracy.toFixed(1)} meters
                    </span>
                  </div>
                )}
                {visit.checkInTime && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 font-semibold uppercase block">Check-in Time</span>
                    <span className="font-bold text-slate-800 text-xs mt-1 block">
                      {new Date(visit.checkInTime).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>

              {visit.checkInAddress && (
                <p className="text-xs text-slate-600 mt-3 font-medium">
                  <span className="font-bold text-slate-700">Resolved Location:</span>{' '}
                  {visit.checkInAddress}
                </p>
              )}
            </div>
          )}

          {/* Photo Gallery Proof */}
          {visit?.photos && Array.isArray(visit.photos) && visit.photos.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Visit Photo Evidence ({visit.photos.length})
                </h4>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {visit.photos.map((photoUrl, idx) => (
                  <a
                    key={idx}
                    href={photoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 hover:shadow-md transition-all"
                  >
                    <img
                      src={photoUrl}
                      alt={`Visit Photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                      <ExternalLink className="w-4 h-4" /> View Full
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up Details */}
          {(visit?.followUpDate || visit?.followUpNotes) && (
            <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-black text-indigo-950 uppercase tracking-wider">
                  Follow-Up Information
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-indigo-500 font-semibold uppercase block">Next Follow-Up Date</span>
                  <span className="font-bold text-indigo-900 text-sm mt-0.5 block">
                    {visit.followUpDate ? new Date(visit.followUpDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {visit.followUpStatus && (
                  <div>
                    <span className="text-indigo-500 font-semibold uppercase block">Follow-Up Status</span>
                    <Badge variant="primary" size="sm" className="mt-1">
                      {visit.followUpStatus}
                    </Badge>
                  </div>
                )}
                {visit.followUpNotes && (
                  <div className="sm:col-span-2">
                    <span className="text-indigo-500 font-semibold uppercase block mb-1">Follow-Up Notes</span>
                    <p className="p-3 bg-white rounded-xl text-slate-800 font-medium border border-indigo-100/80">
                      {visit.followUpNotes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
