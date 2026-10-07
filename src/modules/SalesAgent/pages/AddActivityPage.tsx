import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { salesAgentKeys } from '@/services/queryKeys';
import {
  Building2,
  FileText,
  Loader2,
  Phone,
  User,
  CheckCircle2,
  Navigation,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Lock,
  Camera,
  Trash2,
  Sparkles,
  Maximize2,
  X,
  Receipt,
  UploadCloud,
} from 'lucide-react';
import { SalesVisitService, type CreateSalesVisitPayload } from '@/services/salesVisit.service';
import { GpsCameraCaptureModal } from '../components/GpsCameraCaptureModal';
import { type GpsWatermarkData } from '../utils/gpsWatermark';
import { toast } from '@/utils/toast';

export const AddActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);
  const [institutionName, setInstitutionName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [notes, setNotes] = useState('');

  // GPS Coordinates & Geocoded details
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsCity, setGpsCity] = useState('');
  const [gpsState, setGpsState] = useState('');
  const [gpsCountry, setGpsCountry] = useState('India');
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // GPS Map Camera state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<{ file: File; dataUrl: string } | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Activity Slip Photo state
  const [slipPhoto, setSlipPhoto] = useState<{ file?: File; dataUrl: string; name?: string } | null>(null);
  const [isSlipLightboxOpen, setIsSlipLightboxOpen] = useState(false);

  // Auto-detect GPS location immediately on mount
  const detectLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      setLocationAddress('GPS not supported');
      return;
    }

    setDetectingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setGpsLocation({ lat, lng });

        // Attempt reverse geocoding via OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } },
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.display_name) {
              setLocationAddress(data.display_name);
            }
            if (data?.address) {
              setGpsCity(data.address.city || data.address.town || data.address.village || data.address.suburb || data.address.county || '');
              setGpsState(data.address.state || '');
              setGpsCountry(data.address.country || 'India');
            }
            setDetectingGps(false);
            return;
          }
        } catch {
          // Fallback to coordinates
        }

        setLocationAddress(`Verified Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
        setDetectingGps(false);
      },
      (err) => {
        setDetectingGps(false);
        setGpsError(err.message || 'Unable to retrieve your current location. Please allow location permissions.');
        setLocationAddress('Location permission required');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  useEffect(() => {
    detectLocation();
  }, []);

  const getWatermarkData = (): GpsWatermarkData => {
    const lat = gpsLocation?.lat || 28.6139; // fallback New Delhi if GPS pending
    const lng = gpsLocation?.lng || 77.2090;
    return {
      latitude: lat,
      longitude: lng,
      locationAddress: locationAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
      city: gpsCity,
      state: gpsState,
      country: gpsCountry,
      timestamp: new Date(),
    };
  };

  const handleSlipFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Slip photo size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSlipPhoto({
        file,
        dataUrl: reader.result as string,
        name: file.name,
      });
      toast.success('Slip photo attached successfully.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institutionName.trim()) {
      toast.error('School / Institution Name is required.');
      return;
    }

    setLoading(true);
    try {
      let photoUrls: string[] = [];
      let uploadedSlipUrl: string | undefined = undefined;

      // 1. If GPS photo proof was captured, upload it to storage
      if (capturedPhoto?.file) {
        try {
          const uploadRes = await SalesVisitService.uploadPhoto(capturedPhoto.file);
          if (uploadRes?.url) {
            photoUrls.push(uploadRes.url);
          } else {
            photoUrls.push(capturedPhoto.dataUrl);
          }
        } catch (uploadErr) {
          console.warn('Storage upload error, falling back to data URL:', uploadErr);
          photoUrls.push(capturedPhoto.dataUrl);
        }
      }

      // 2. If Slip photo was attached, upload it to storage
      if (slipPhoto?.file) {
        try {
          const slipRes = await SalesVisitService.uploadPhoto(slipPhoto.file);
          if (slipRes?.url) {
            uploadedSlipUrl = slipRes.url;
          } else {
            uploadedSlipUrl = slipPhoto.dataUrl;
          }
        } catch (slipErr) {
          console.warn('Slip upload error, falling back to data URL:', slipErr);
          uploadedSlipUrl = slipPhoto.dataUrl;
        }
      } else if (slipPhoto?.dataUrl) {
        uploadedSlipUrl = slipPhoto.dataUrl;
      }

      const payload: CreateSalesVisitPayload = {
        institutionName: institutionName.trim(),
        contactPerson: contactPerson.trim() || undefined,
        contactPhone: contactPhone.trim() || undefined,
        locationAddress: locationAddress || undefined,
        state: gpsState || undefined,
        district: gpsCity || undefined,
        notes: notes.trim() || undefined,
        latitude: gpsLocation?.lat,
        longitude: gpsLocation?.lng,
        photos: photoUrls.length > 0 ? photoUrls : undefined,
        slipPhoto: uploadedSlipUrl,
        slipUrl: uploadedSlipUrl,
      };

      await SalesVisitService.scheduleVisit(payload);

      toast.success('Activity logged and Super Admin notified successfully!');
      await queryClient.invalidateQueries({ queryKey: salesAgentKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['super-admin-sales-agents'] });
      await queryClient.refetchQueries({ queryKey: salesAgentKeys.all });
      navigate('/sales-agent/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to log activity.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-16 animate-in fade-in duration-300" data-testid="add-activity-page">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real-time GPS Verified Logging</span>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Header Banner */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Log Today's Activity
            </h1>
            <p className="text-xs sm:text-sm text-blue-100">
              Record on-site school visit discussions with automatic GPS location and Map Camera photo verification.
            </p>
          </div>
          <div className="p-3 bg-white/20 backdrop-blur rounded-2xl shrink-0 hidden sm:block">
            <Navigation className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {/* Automatic Geolocation (Read-only) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Current Location (Auto-Detected GPS)
              </label>

              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingGps}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                {detectingGps ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>Refresh GPS</span>
              </button>
            </div>

            <div className="relative">
              <input
                type="text"
                readOnly
                value={detectingGps ? 'Detecting current GPS location...' : locationAddress}
                placeholder="Detecting current GPS location..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 text-sm font-semibold cursor-not-allowed select-none"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {detectingGps ? (
                  <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                ) : gpsLocation ? (
                  <span className="p-1 bg-emerald-100 text-emerald-700 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                )}
              </div>
            </div>

            {gpsLocation ? (
              <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                GPS Coordinates Verified: Latitude {gpsLocation.lat.toFixed(5)}, Longitude {gpsLocation.lng.toFixed(5)}
              </p>
            ) : gpsError ? (
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {gpsError}
              </p>
            ) : null}
          </div>

          {/* School / Institution Name */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              School / Institution Name *
            </label>
            <input
              type="text"
              required
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              placeholder="e.g. St. Xavier's Senior Secondary School"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
          </div>

          {/* Contact Details (2 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                Contact Person Name
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="e.g. Dr. R. K. Sharma (Principal)"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                Contact Phone / Mobile Number
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            </div>
          </div>

          {/* Discussion Notes / Summary */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Activity Notes & Discussion Points
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Met with Principal and IT coordinator. Demonstrated online exam software and mock test series. They showed strong interest for 400 Class 10 & 12 students."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
            />
          </div>

          {/* Add Slip / Activity Slip Photo Section */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Add Slip / Activity Slip Photo</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                    Slip Proof
                  </span>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Upload a photo of the meeting slip, quotation acknowledgment, or visit confirmation slip.
                </p>
              </div>

              {slipPhoto && (
                <button
                  type="button"
                  onClick={() => setSlipPhoto(null)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Slip</span>
                </button>
              )}
            </div>

            {slipPhoto ? (
              /* Slip Photo Preview Card */
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40 bg-slate-900 group shadow-lg">
                <img
                  src={slipPhoto.dataUrl}
                  alt="Activity Slip Preview"
                  className="w-full max-h-[320px] object-contain mx-auto bg-black/40"
                />

                {/* Badge Overlay */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-extrabold shadow-md backdrop-blur">
                    <Receipt className="w-3.5 h-3.5 text-yellow-300" />
                    Activity Slip Attached
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSlipLightboxOpen(true)}
                    className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur transition-all"
                    title="View Full Resolution Slip"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5 truncate max-w-[220px] sm:max-w-md">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{slipPhoto.name || 'Slip Photo Attached'}</span>
                  </span>
                  <label className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Change Slip</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSlipFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            ) : (
              /* Slip Upload Drop-Zone */
              <label className="w-full p-6 rounded-2xl border-2 border-dashed border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all flex flex-col items-center justify-center text-center gap-2.5 group cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSlipFileChange}
                  className="hidden"
                />
                <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none group-hover:scale-110 transition-transform">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                    <span>Upload Activity Slip Photo</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      Add Slip
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Click to select from device or take photo of the physical slip (JPG, PNG, WebP)
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* GPS Map Camera Photo Proof Section (LAST OPTION) */}
          <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Field Visit Photo Proof (GPS Map Camera)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold">
                    GPS Watermark
                  </span>
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Click live photo with GPS Map Camera. Exact GPS coordinates, address, map tile, and timestamp are watermarked automatically in real-time.
                </p>
              </div>

              {capturedPhoto && (
                <button
                  type="button"
                  onClick={() => setCapturedPhoto(null)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              )}
            </div>

            {capturedPhoto ? (
              /* Photo Preview with GPS Stamp Overlay */
              <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-500/40 bg-slate-900 group shadow-lg">
                <img
                  src={capturedPhoto.dataUrl}
                  alt="GPS Map Camera Proof"
                  className="w-full max-h-[380px] object-contain mx-auto bg-black/40"
                />

                {/* Stamped Badge & Actions Bar */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-extrabold shadow-md backdrop-blur">
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    GPS Watermarked Photo Ready
                  </span>
                </div>

                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur transition-all"
                    title="View Full Resolution"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3.5 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    Stamped with current location & timestamp
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsCameraModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Retake Photo</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Photo Action Trigger Card */
              <button
                type="button"
                onClick={() => setIsCameraModalOpen(true)}
                className="w-full p-6 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 dark:hover:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-all flex flex-col items-center justify-center text-center gap-2.5 group cursor-pointer"
              >
                <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-none group-hover:scale-110 transition-transform">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                    <span>Click Photo with GPS Camera</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">
                      Live Verification
                    </span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Opens live camera viewfinder with real-time GPS coordinates, address, map tile, and timestamp watermark
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Form Actions Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-sm transition-colors text-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Submit & Log Activity</span>
            </button>
          </div>
        </form>
      </div>

      {/* Live GPS Camera Capture Modal */}
      {isCameraModalOpen && (
        <GpsCameraCaptureModal
          isOpen={isCameraModalOpen}
          onClose={() => setIsCameraModalOpen(false)}
          onCapture={(captured) => {
            setCapturedPhoto(captured);
          }}
          gpsData={getWatermarkData()}
        />
      )}

      {/* Fullscreen Lightbox Preview for GPS Photo */}
      {isLightboxOpen && capturedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={capturedPhoto.dataUrl}
            alt="Full GPS Watermarked Photo"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* Fullscreen Lightbox Preview for Slip Photo */}
      {isSlipLightboxOpen && slipPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4 animate-in fade-in">
          <div className="absolute top-5 left-5 text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">{slipPhoto.name || 'Activity Slip Photo'}</span>
          </div>
          <button
            onClick={() => setIsSlipLightboxOpen(false)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={slipPhoto.dataUrl}
            alt="Full Slip Photo"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
export default AddActivityPage;
