import React, { useState } from 'react';
import {
  CalendarDays,
  Building2,
  MapPin,
  Clock,
  FileText,
  Loader2,
  X,
  Phone,
  User,
  CheckCircle2,
  Calendar,
  Sparkles,
  Navigation,
} from 'lucide-react';
import { SalesVisitService, type CreateSalesVisitPayload } from '@/services/salesVisit.service';
import { toast } from '@/utils/toast';

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultStatus?: 'COMPLETED' | 'SCHEDULED';
}

const ACTIVITY_TYPES = [
  { id: 'School Visit', label: 'School Visit', icon: Building2 },
  { id: 'Management Meeting', label: 'Management Meeting', icon: User },
  { id: 'Software Demo', label: 'Software Demo', icon: Sparkles },
  { id: 'Phone Call / Follow-up', label: 'Phone Call / Follow-up', icon: Phone },
  { id: 'Contract Discussion', label: 'Contract Discussion', icon: FileText },
];

export const AddActivityModal: React.FC<AddActivityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultStatus = 'COMPLETED',
}) => {
  const [loading, setLoading] = useState(false);
  const [activityType, setActivityType] = useState('School Visit');
  const [institutionName, setInstitutionName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().slice(0, 16));
  const [isCompleted, setIsCompleted] = useState(defaultStatus === 'COMPLETED');
  const [notes, setNotes] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [gpsLocation, setGpsLocation] = useState<{ lat?: number; lng?: number } | null>(null);
  const [detectingGps, setDetectingGps] = useState(false);

  if (!isOpen) return null;

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        if (!locationAddress) {
          setLocationAddress(`GPS: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        }
        setDetectingGps(false);
        toast.success('Current location detected successfully!');
      },
      (err) => {
        setDetectingGps(false);
        toast.error(`Could not detect location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionName.trim()) {
      toast.error('Institution / Client Name is required.');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateSalesVisitPayload = {
        institutionName: institutionName.trim(),
        contactPerson: contactPerson.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        locationAddress: locationAddress.trim() || undefined,
        scheduledAt: new Date(activityDate).toISOString(),
        purpose: activityType,
        notes: notes.trim() || undefined,
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
      };

      const visit = await SalesVisitService.scheduleVisit(payload);

      // If marked as completed today, perform check-in and checkout to log full completion
      if (isCompleted && visit?.id) {
        try {
          if (gpsLocation?.lat && gpsLocation?.lng) {
            await SalesVisitService.checkIn(visit.id, {
              latitude: gpsLocation.lat,
              longitude: gpsLocation.lng,
              locationAddress: locationAddress || 'On-site Field Visit',
              notes: notes.trim() || undefined,
            });
            await SalesVisitService.checkOut(visit.id, {
              latitude: gpsLocation.lat,
              longitude: gpsLocation.lng,
              outcome: 'INTERESTED',
              summary: notes.trim() || 'Activity recorded and completed successfully.',
              nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate).toISOString() : undefined,
            });
          }
        } catch (subErr) {
          // If sub-actions fail, base visit is still saved
          console.warn('Completed check-in error:', subErr);
        }
      }

      toast.success('Activity logged successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to log activity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in" data-testid="add-activity-modal">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 backdrop-blur rounded-2xl">
              <CalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg leading-tight">Add Today's Activity</h3>
              <p className="text-xs text-blue-100">Log school visits, client meetings, demos, or calls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Activity Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Activity Type
            </label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TYPES.map((type) => {
                const isSelected = activityType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setActivityType(type.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                    }`}
                  >
                    <type.icon className="w-3.5 h-3.5" />
                    <span>{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* School / Institution Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              School / Institution Name *
            </label>
            <input
              type="text"
              required
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="e.g. Modern Public Senior Secondary School"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Contact Details (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Contact Person
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Principal / Coordinator"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                Phone Number
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          {/* Location / Address + GPS Detect */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" />
                Location / Address
              </label>
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
              >
                {detectingGps ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3" />
                )}
                <span>Detect Current Location</span>
              </button>
            </div>
            <input
              type="text"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              placeholder="e.g. Sector 14, Main Road, City"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {gpsLocation && (
              <span className="inline-block mt-1 text-[11px] font-semibold text-emerald-600">
                ✓ GPS Coordinates Captured ({gpsLocation.lat?.toFixed(4)}, {gpsLocation.lng?.toFixed(4)})
              </span>
            )}
          </div>

          {/* Date & Time + Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Activity Date & Time
              </label>
              <input
                type="datetime-local"
                value={activityDate}
                onChange={(e) => setActivityDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Completion Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsCompleted(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    isCompleted
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-extrabold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Completed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompleted(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    !isCompleted
                      ? 'bg-blue-50 border-blue-300 text-blue-700 font-extrabold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Scheduled</span>
                </button>
              </div>
            </div>
          </div>

          {/* Discussion Notes / Summary */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Activity Notes & Key Discussion Points
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Met with Principal. Demonstrated exam creation and online test module. They requested follow-up proposal for 500 students."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
          </div>

          {/* Next Follow-up Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Next Follow-up Date (Optional)
            </label>
            <input
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-100 hover:shadow-lg transition-all flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Activity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
