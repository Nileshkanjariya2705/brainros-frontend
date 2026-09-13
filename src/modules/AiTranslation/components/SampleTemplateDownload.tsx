import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { aiTranslationApi } from '../services/ai-translation.service';

export const SampleTemplateDownload: React.FC = () => {
  const [downloading, setDownloading] = useState<'csv' | 'xlsx' | null>(null);

  const handleDownload = async (format: 'csv' | 'xlsx') => {
    try {
      setDownloading(format);
      await aiTranslationApi.downloadSampleTemplate(format);
    } catch (err) {
      console.error('Failed to download template:', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        Sample Templates:
      </span>
      <button
        type="button"
        onClick={() => handleDownload('csv')}
        disabled={downloading !== null}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 shadow-sm"
      >
        {downloading === 'csv' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-emerald-600" />
        )}
        Download Sample CSV
      </button>

      <button
        type="button"
        onClick={() => handleDownload('xlsx')}
        disabled={downloading !== null}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors disabled:opacity-50 shadow-sm"
      >
        {downloading === 'xlsx' ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
        )}
        Download Sample Excel (.xlsx)
      </button>
    </div>
  );
};
