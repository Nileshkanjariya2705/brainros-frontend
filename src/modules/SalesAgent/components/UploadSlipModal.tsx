import React, { useState, useRef } from 'react';
import {
  X,
  Receipt,
  UploadCloud,
  CheckCircle2,
  Building2,
  Calendar,
  MapPin,
  Trash2,
  Loader2,
  Camera,
  Maximize2,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import { SalesVisitService, type SalesVisit } from '@/services/salesVisit.service';
import { salesAgentKeys } from '@/services/queryKeys';
import { toast } from '@/utils/toast';

interface UploadSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  visit: SalesVisit | null;
  onSuccess?: () => void;
}

export const UploadSlipModal: React.FC<UploadSlipModalProps> = ({
  isOpen,
  onClose,
  visit,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewEnlarged, setPreviewEnlarged] = useState(false);

  if (!isOpen || !visit) return null;

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Slip photo size must be less than 10MB.');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) {
      toast.error('Please select or capture a slip photo first.');
      return;
    }

    setIsUploading(true);
    try {
      if (selectedFile) {
        try {
          await SalesVisitService.uploadSlip(visit.id, selectedFile);
        } catch (uploadDirectErr) {
          // Fallback: upload photo first then attach
          const photoRes = await SalesVisitService.uploadPhoto(selectedFile);
          await SalesVisitService.attachSlip(visit.id, photoRes.url || previewUrl!);
        }
      } else if (previewUrl) {
        await SalesVisitService.attachSlip(visit.id, previewUrl);
      }

      toast.success(`Slip uploaded successfully for ${visit.institutionName}!`);

      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: salesAgentKeys.all });
      await queryClient.invalidateQueries({ queryKey: ['super-admin-sales-agents'] });
      await queryClient.invalidateQueries({ queryKey: ['super-admin-sales-agent-activities'] });

      onSuccess?.();
      handleClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to upload slip proof.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPreviewEnlarged(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
        data-testid="upload-slip-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Upload Activity Slip</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-extrabold uppercase tracking-wider">
                  Pending Slip
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Attach signed meeting slip, acknowledgment, or receipt
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visit Context Card */}
        <div className="p-5 mx-6 mt-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Target Institution
              </span>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{visit.institutionName}</span>
              </h4>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
              <Calendar className="w-3 h-3 text-emerald-500" />
              <span>{new Date(visit.scheduledAt || visit.createdAt).toLocaleDateString()}</span>
            </span>
          </div>

          {(visit.contactPerson || visit.contactPhone || visit.locationAddress) && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
              {visit.contactPerson && (
                <span>
                  Contact: <strong className="text-slate-800 dark:text-slate-200">{visit.contactPerson}</strong>
                </span>
              )}
              {visit.contactPhone && (
                <span>
                  • Phone: <strong className="text-slate-800 dark:text-slate-200">{visit.contactPhone}</strong>
                </span>
              )}
              {visit.locationAddress && (
                <span className="flex items-center gap-1 truncate max-w-xs">
                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="truncate">{visit.locationAddress}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* File Upload / Capture Area */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Select Slip Photo
            </label>

            {previewUrl ? (
              /* Photo Preview Card */
              <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-900 group shadow-md">
                <div className="relative flex items-center justify-center min-h-[220px] max-h-[320px] bg-black/40 p-2">
                  <img
                    src={previewUrl}
                    alt="Slip Preview"
                    className="max-h-[300px] w-auto max-w-full object-contain mx-auto rounded-lg"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/95 text-white text-xs font-extrabold shadow-md backdrop-blur">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ready to Upload
                    </span>
                  </div>

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewEnlarged(true)}
                      className="p-2 rounded-xl bg-black/60 text-white hover:bg-black/80 backdrop-blur transition-all"
                      title="Enlarge Photo"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white backdrop-blur transition-all"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-900/90 backdrop-blur border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                  <span className="font-semibold text-emerald-400 truncate max-w-xs">
                    {selectedFile?.name || 'Slip Photo Attached'}
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Change File</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Drag & Drop Upload Drop-Zone */
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-8 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-3 cursor-pointer ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-slate-50/60 dark:bg-slate-800/20 hover:bg-emerald-50/30'
                }`}
              >
                <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-none group-hover:scale-105 transition-transform">
                  <Receipt className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
                    <span>Click to Upload or Drag & Drop</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Supports JPG, PNG, WebP up to 10MB. On mobile phones, you can use your camera to take a clear photo of the physical slip.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 shadow-xs">
                    <Camera className="w-3.5 h-3.5" />
                    Camera Supported
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 shadow-xs">
                    <UploadCloud className="w-3.5 h-3.5" />
                    Choose File
                  </span>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className="px-4 text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isUploading || !previewUrl}
              className="px-6 py-2.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 shadow-md shadow-emerald-200 dark:shadow-none"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Slip...</span>
                </>
              ) : (
                <>
                  <Receipt className="w-4 h-4" />
                  <span>Upload & Attach Slip</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Enlarged Lightbox */}
      {previewEnlarged && previewUrl && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/95 p-4 animate-in fade-in"
          onClick={() => setPreviewEnlarged(false)}
        >
          <button
            type="button"
            onClick={() => setPreviewEnlarged(false)}
            className="absolute top-5 right-5 p-2.5 rounded-full bg-white/20 text-white hover:bg-white/30 backdrop-blur transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={previewUrl}
            alt="Full Slip Preview"
            className="max-h-[90vh] max-w-[95vw] object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
export default UploadSlipModal;
