import React, { useRef, useState, useCallback } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileCheck,
  AlertCircle,
  X,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { SampleTemplateDownload } from './SampleTemplateDownload';

interface FileUploadZoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  selectedFile: File | null;
  onClearFile: () => void;
  onValidate: () => void;
  canValidate: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelected,
  isLoading = false,
  selectedFile,
  onClearFile,
  onValidate,
  canValidate,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const validateAndSelectFile = useCallback(
    (file: File) => {
      setFileError(null);
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!['.csv', '.xlsx', '.xls'].includes(ext)) {
        setFileError('Invalid file type. Please upload a .csv or .xlsx file.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setFileError('File size exceeds 10MB limit.');
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            2. Upload Question Paper (English)
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Upload the master English question paper. Headers required: <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">question_number, question, option_a, option_b, option_c, option_d</code>
          </p>
        </div>

        <SampleTemplateDownload />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
              : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-slate-50/50 dark:bg-slate-800/30'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3.5 shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">
            Click to upload or drag & drop question paper
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Supported formats: <strong className="font-semibold text-slate-700 dark:text-slate-300">CSV, XLSX, XLS</strong> (Max 10 MB)
          </p>
        </div>
      ) : (
        <div className="border border-slate-200 dark:border-slate-700/80 rounded-2xl p-5 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(selectedFile.size / 1024).toFixed(1)} KB • Ready for validation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClearFile}
                disabled={isLoading}
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onValidate}
                disabled={!canValidate || isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating Paper...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    Validate & Preview Questions
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {fileError && (
        <div className="mt-3.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          {fileError}
        </div>
      )}
    </div>
  );
};
