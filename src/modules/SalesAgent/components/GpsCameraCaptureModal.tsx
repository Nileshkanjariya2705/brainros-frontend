import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  Check,
  RotateCcw,
  Loader2,
  AlertCircle,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { stampGpsWatermark, type GpsWatermarkData } from '../utils/gpsWatermark';
import { toast } from '@/utils/toast';

interface GpsCameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (captured: { file: File; dataUrl: string }) => void;
  gpsData: GpsWatermarkData;
}

export const GpsCameraCaptureModal: React.FC<GpsCameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  gpsData,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);
  const [stampedFile, setStampedFile] = useState<File | null>(null);

  // Initialize or restart camera stream
  const startCamera = async () => {
    setCameraError(null);
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera device access is not supported by your browser.');
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera stream error:', err);
      setIsCameraActive(false);
      setCameraError(err.message || 'Unable to access camera. Please allow camera permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      setPreviewDataUrl(null);
      setStampedFile(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const toggleCameraFacing = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // Capture frame from video and stamp with GPS metadata
  const handleSnapPhoto = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Draw current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Stamp with GPS Camera overlay
      const result = await stampGpsWatermark(canvas.toDataURL('image/jpeg', 0.95), gpsData);

      setPreviewDataUrl(result.dataUrl);
      setStampedFile(result.file);
      stopCamera();
    } catch (err: any) {
      toast.error(`Photo capture failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAcceptPhoto = () => {
    if (stampedFile && previewDataUrl) {
      onCapture({ file: stampedFile, dataUrl: previewDataUrl });
      toast.success('GPS Map Camera photo attached!');
      onClose();
    }
  };

  const handleRetake = () => {
    setPreviewDataUrl(null);
    setStampedFile(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between p-4 px-5 border-b border-slate-800 bg-slate-900/90 backdrop-blur text-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-1.5">
                <span>GPS Map Camera</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                  Live Watermark
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-500" />
                <span>
                  Lat {gpsData.latitude.toFixed(4)}°, Long {gpsData.longitude.toFixed(4)}°
                </span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewfinder / Preview Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden min-h-[360px] sm:min-h-[440px]">
          {previewDataUrl ? (
            /* Stamped Preview */
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={previewDataUrl}
                alt="GPS Watermarked Preview"
                className="max-h-[65vh] w-auto object-contain rounded-2xl shadow-xl border border-slate-800"
              />
              <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Watermark Applied</span>
              </div>
            </div>
          ) : isCameraActive ? (
            /* Live Camera Stream */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                autoPlay
                muted
                className="w-full h-full object-cover max-h-[68vh]"
              />

              {/* Viewfinder Target Guidelines */}
              <div className="absolute inset-8 border border-white/20 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-white/70" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-white/70" />
                </div>
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-white/70" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-white/70" />
                </div>
              </div>

              {/* Live GPS badge overlay in viewfinder */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-2xl p-3 text-white text-xs space-y-0.5 pointer-events-none">
                <div className="flex items-center justify-between font-bold text-slate-200">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <MapPin className="w-3.5 h-3.5 text-rose-500" />
                    GPS Location Locked
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  {gpsData.locationAddress || 'Current Geo-coordinates'}
                </p>
              </div>
            </div>
          ) : (
            /* Camera Error / Permissions Prompt */
            <div className="p-8 text-center space-y-4 max-w-sm">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Camera Access</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {cameraError || 'Please allow camera permission to capture live on-site visit proof.'}
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors"
                >
                  Retry Camera
                </button>
              </div>
            </div>
          )}

          {/* Processing Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white z-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
              <p className="text-sm font-bold">Applying GPS Map Camera Watermark...</p>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
          {previewDataUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-2 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                onClick={handleAcceptPhoto}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Use This Photo</span>
              </button>
            </>
          ) : (
            <>
              {/* Switch Camera Button */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleCameraFacing}
                  disabled={!isCameraActive}
                  title="Switch Front/Back Camera"
                  className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Shutter Capture Button */}
              <button
                type="button"
                onClick={handleSnapPhoto}
                disabled={!isCameraActive || isProcessing}
                className="w-16 h-16 rounded-full bg-white p-1 shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center border-4 border-slate-700"
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                  <Camera className="w-6 h-6" />
                </div>
              </button>

              <div className="w-20 sm:w-28 text-right">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
