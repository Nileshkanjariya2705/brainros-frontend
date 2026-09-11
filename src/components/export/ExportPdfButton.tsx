import React, { useState, useRef, useEffect } from 'react';
import {
  Printer,
  Download,
  FileDown,
  Loader2,
  ChevronDown,
  FileText,
} from 'lucide-react';
import { exportToPdf, downloadExportFile } from '@/services/export.service';
import { useJobProgress } from '@/hooks/useJobProgress';
import { toast } from '@/utils/toast';

export interface ExportPdfButtonProps {
  /** The registered resource name on backend (e.g. 'students', 'schools', 'staff', 'invoices', etc.) */
  resource: string;
  /** Active filter state */
  filters?: Record<string, any>;
  /** Search query string */
  search?: string;
  /** Sort parameters */
  sort?: { field: string; direction: 'asc' | 'desc' };
  /** Current page index (1-based) */
  page?: number;
  /** Current page size */
  pageSize?: number;
  /** Custom label for button */
  label?: string;
  /** Custom filename prefix */
  filename?: string;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
  /** Optional callback before export */
  onExportStart?: () => void;
  /** Hide print option if not applicable */
  hidePrint?: boolean;
}

export const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({
  resource,
  filters = {},
  search,
  sort,
  page,
  pageSize,
  label = 'Print / PDF',
  filename,
  size = 'sm',
  className = '',
  onExportStart,
  hidePrint = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [asyncJobId, setAsyncJobId] = useState<string | null>(null);
  const [asyncExportId, setAsyncExportId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Background Job Progress Tracker (for large exports)
  const { percentage, stage, isCompleted, isFailed } = useJobProgress({
    queue: 'pdf-export',
    jobId: asyncJobId || undefined,
  });

  // When async job completes, trigger automatic file download
  useEffect(() => {
    if (isCompleted && asyncExportId) {
      downloadExportFile(asyncExportId, filename);
      setAsyncJobId(null);
      setAsyncExportId(null);
      setIsExporting(false);
    } else if (isFailed) {
      setAsyncJobId(null);
      setAsyncExportId(null);
      setIsExporting(false);
      toast.error('Background PDF export failed. Please try again.');
    }
  }, [isCompleted, isFailed, asyncExportId, filename]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (mode: 'all' | 'current') => {
    setIsOpen(false);
    setIsExporting(true);
    if (onExportStart) onExportStart();

    // Sanitize filters: strip undefined, null, empty string, and 'ALL' values
    const sanitizedFilters = Object.entries(filters || {}).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'ALL') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);

    try {
      const res = await exportToPdf({
        resource,
        filters: sanitizedFilters,
        search,
        sort,
        mode,
        page,
        pageSize,
        filename,
      });

      if (res?.isAsync && res.jobId) {
        setAsyncJobId(res.jobId);
        setAsyncExportId(res.exportId || null);
        toast.info(res.message || 'Export job queued in background. You will be notified when ready.');
      } else {
        setIsExporting(false);
        toast.success('PDF downloaded successfully.');
      }
    } catch {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    setIsOpen(false);
    window.print();
  };

  const sizeClasses =
    size === 'sm'
      ? 'text-xs px-3 py-1.5 rounded-xl gap-1.5'
      : 'text-sm px-4 py-2 rounded-2xl gap-2';

  return (
    <div className={`relative inline-block text-left print:hidden ${className}`} ref={dropdownRef}>
      {/* Main Action Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={`inline-flex items-center justify-center font-bold transition shadow-2xs border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed ${sizeClasses}`}
        title="Print or Download PDF Report"
      >
        {isExporting ? (
          <>
            <Loader2 size={size === 'sm' ? 13 : 16} className="animate-spin text-indigo-600" />
            <span>{asyncJobId ? `${percentage}%` : 'Exporting...'}</span>
          </>
        ) : (
          <>
            <FileDown size={size === 'sm' ? 14 : 16} className="text-indigo-600" />
            <span>{label}</span>
            <ChevronDown size={size === 'sm' ? 12 : 14} className="text-slate-400" />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-60 rounded-2xl bg-white p-1.5 shadow-xl border border-slate-100 z-50 animate-in fade-in duration-150">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Export / Print Data
            </span>
            <span className="text-xs font-semibold text-slate-800 truncate block capitalize">
              {resource.replace(/_/g, ' ')}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleExport('all')}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition text-left"
          >
            <Download size={14} className="text-indigo-600" />
            <div>
              <div className="font-bold">Download Full PDF</div>
              <div className="text-[10px] text-slate-400 font-normal">
                All records matching current filters
              </div>
            </div>
          </button>

          {page && (
            <button
              type="button"
              onClick={() => handleExport('current')}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition text-left"
            >
              <FileText size={14} className="text-slate-500" />
              <div>
                <div className="font-bold">Download Current Page</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  Only rows currently shown on page {page}
                </div>
              </div>
            </button>
          )}

          {!hidePrint && (
            <button
              type="button"
              onClick={handlePrint}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition text-left border-t border-slate-50 mt-1"
            >
              <Printer size={14} className="text-emerald-600" />
              <div>
                <div className="font-bold">Print View</div>
                <div className="text-[10px] text-slate-400 font-normal">
                  Print-ready table layout
                </div>
              </div>
            </button>
          )}
        </div>
      )}

      {/* Async Progress Pill (non-blocking) */}
      {asyncJobId && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white p-2.5 rounded-2xl shadow-lg border border-indigo-100 z-40 text-xs">
          <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Loader2 size={12} className="animate-spin text-indigo-600" />
              Generating PDF
            </span>
            <span className="font-mono text-indigo-600 text-[11px]">{percentage}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          {stage && <p className="text-[10px] text-slate-400 mt-1 truncate">{stage}</p>}
        </div>
      )}
    </div>
  );
};

export default ExportPdfButton;
