import React, { useEffect, useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  Send,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Axios } from '@/base-axios';
import {
  BatchItem,
  BulkUploadItem,
  BulkUploadPreview,
  BulkUploadErrorItem,
} from '@/types/exam.types';

export const BulkUploadPage: React.FC = () => {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Staged Upload details
  const [activeUpload, setActiveUpload] = useState<BulkUploadItem | null>(null);
  const [preview, setPreview] = useState<BulkUploadPreview | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);

  // Previous uploads history
  const [uploadHistory, setUploadHistory] = useState<BulkUploadItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    fetchBatches();
    fetchHistory();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await Axios.get('/institutions/me/batches');
      setBatches(res.data);
      if (res.data.length > 0) setSelectedBatchId(res.data[0].id);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await Axios.get('/institutions/me/bulk-uploads');
      setUploadHistory(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setUploadError(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setUploadError('Please choose a valid .xlsx or .csv spreadsheet.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);
      const formData = new FormData();
      formData.append('file', file);
      if (selectedBatchId) formData.append('batchId', selectedBatchId);

      const res = await Axios.post('/institutions/me/bulk-uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setActiveUpload(res.data);
      await fetchPreview(res.data.id);
      await fetchHistory();
      setFile(null);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Bulk upload failed');
    } finally {
      setUploading(false);
    }
  };

  const fetchPreview = async (uploadId: string) => {
    try {
      const res = await Axios.get(`/institutions/me/bulk-uploads/${uploadId}/preview`);
      setPreview(res.data);
    } catch (err) {
      console.error('Failed to load preview', err);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!activeUpload) return;
    try {
      setSubmitting(true);
      await Axios.post(`/institutions/me/bulk-uploads/${activeUpload.id}/submit`, {
        notes: 'Submitted via B2B Institution Portal for Super Admin review.',
      });
      setSubmitSuccess(true);
      await fetchHistory();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to submit upload for approval.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Bulk Student Onboarding Pipeline</h1>
        <p className="text-sm text-slate-500">
          Upload large student rosters via CSV/XLSX with automated deduplication, validation
          staging, and Super Admin approval.
        </p>
      </div>

      {/* Upload Box & Guidelines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Upload Form */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">1. Select Batch & Upload Roster</h2>
            <p className="text-xs text-slate-500">
              Files are staged in an isolated verification sandbox.
            </p>

            {uploadError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-medium text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                {uploadError}
              </div>
            )}

            <form onSubmit={handleUpload} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Assign To Batch
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
                >
                  <option value="">No Batch (Unassigned Intake)</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.academicYear || '2026-27'})
                    </option>
                  ))}
                </select>
              </div>

              {/* File Drop Area */}
              <div className="rounded-xl border-2 border-dashed border-slate-300 p-8 text-center transition hover:border-indigo-500">
                <UploadCloud className="mx-auto h-12 w-12 text-slate-400" />
                <div className="mt-3">
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    <span>Click to upload a spreadsheet</span>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".xlsx,.csv"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="text-xs text-slate-500">
                    Supports .xlsx and .csv formats up to 10MB
                  </p>
                </div>
                {file && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                    <FileSpreadsheet className="h-4 w-4" /> {file.name} (
                    {(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={uploading || !file}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" /> Staging & Validating...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-4 w-4" /> Stage File For Review
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Column Specs Card */}
        <div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-6">
            <h3 className="font-bold text-slate-900">Spreadsheet Schema</h3>
            <p className="mt-1 text-xs text-slate-600">
              Standard columns recognized by the parser:
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="rounded-lg bg-white p-2.5 font-mono text-slate-800 shadow-sm">
                <span className="font-bold text-indigo-600">name</span> (Required) - Full student
                name
              </div>
              <div className="rounded-lg bg-white p-2.5 font-mono text-slate-800 shadow-sm">
                <span className="font-bold text-indigo-600">mobile</span> (Required) - 10-digit
                number
              </div>
              <div className="rounded-lg bg-white p-2.5 font-mono text-slate-800 shadow-sm">
                <span className="font-bold text-slate-600">email</span> - Optional email address
              </div>
              <div className="rounded-lg bg-white p-2.5 font-mono text-slate-800 shadow-sm">
                <span className="font-bold text-slate-600">class</span> - e.g. Class 12 / Dropper
              </div>
              <div className="rounded-lg bg-white p-2.5 font-mono text-slate-800 shadow-sm">
                <span className="font-bold text-slate-600">examTarget</span> - NEET / JEE / CET
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staged Upload Preview & Submission */}
      {preview && (
        <div className="rounded-2xl border border-indigo-200 bg-white p-6 shadow-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                2. Staged Validation Summary: {preview.fileName}
              </h2>
              <p className="text-xs text-slate-500">
                Audited pre-flight check. No active students will be created without Super Admin
                approval.
              </p>
            </div>
            <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              Status: {preview.status}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <div className="text-xs text-slate-500">Total Rows</div>
              <div className="mt-1 text-2xl font-bold text-slate-900">
                {preview.summary.totalRows}
              </div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 text-center">
              <div className="text-xs font-semibold text-emerald-700">Valid Rows</div>
              <div className="mt-1 text-2xl font-bold text-emerald-700">
                {preview.summary.validRows}
              </div>
            </div>
            <div className="rounded-xl bg-red-50 p-4 text-center">
              <div className="text-xs font-semibold text-red-700">Invalid Rows</div>
              <div className="mt-1 text-2xl font-bold text-red-700">
                {preview.summary.invalidRows}
              </div>
            </div>
            <div className="rounded-xl bg-amber-50 p-4 text-center">
              <div className="text-xs font-semibold text-amber-700">Duplicates</div>
              <div className="mt-1 text-2xl font-bold text-amber-700">
                {preview.summary.duplicateRows}
              </div>
            </div>
            <div className="rounded-xl bg-blue-50 p-4 text-center">
              <div className="text-xs font-semibold text-blue-700">Existing Users</div>
              <div className="mt-1 text-2xl font-bold text-blue-700">
                {preview.summary.existingStudents}
              </div>
            </div>
            <div className="rounded-xl bg-purple-50 p-4 text-center">
              <div className="text-xs font-semibold text-purple-700">New Students</div>
              <div className="mt-1 text-2xl font-bold text-purple-700">
                {preview.summary.newStudents}
              </div>
            </div>
          </div>

          {/* Sample Errors if any */}
          {preview.sampleErrors.length > 0 && (
            <div className="mt-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-600">
                Sample Row Errors Detected
              </h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400">
                      <th className="pb-2">Row</th>
                      <th className="pb-2">Field</th>
                      <th className="pb-2">Error Code</th>
                      <th className="pb-2">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {preview.sampleErrors.map((err: BulkUploadErrorItem, idx: number) => (
                      <tr key={idx}>
                        <td className="py-2 font-mono font-bold text-slate-800">
                          #{err.rowNumber}
                        </td>
                        <td className="py-2 text-slate-600">{err.field}</td>
                        <td className="py-2 font-mono text-red-600">{err.errorCode}</td>
                        <td className="py-2 text-slate-700">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Submit for Super Admin Approval Action */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">
              Only valid rows ({preview.summary.validRows}) will be queued for activation upon Super
              Admin approval.
            </p>
            {submitSuccess ? (
              <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="h-4 w-4" /> Submitted to Super Admin for approval!
              </div>
            ) : (
              <button
                onClick={handleSubmitForApproval}
                disabled={submitting || preview.summary.validRows === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />{' '}
                {submitting ? 'Submitting...' : 'Submit for Super Admin Approval'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upload History Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Upload History & Audits</h2>
        <div className="mt-4 overflow-x-auto">
          {loadingHistory ? (
            <div className="py-8 text-center text-sm text-slate-400">Loading audit history...</div>
          ) : uploadHistory.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-400">
              No previous uploads found.
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
                  <th className="pb-3 font-semibold">File Name</th>
                  <th className="pb-3 font-semibold">Target Batch</th>
                  <th className="pb-3 font-semibold">Total Rows</th>
                  <th className="pb-3 font-semibold">Valid / Invalid</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {uploadHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-900">{item.fileName}</td>
                    <td className="py-3 text-slate-600">{item.batch?.name || 'Unassigned'}</td>
                    <td className="py-3 font-mono">{item.rowCount}</td>
                    <td className="py-3">
                      <span className="text-emerald-600">{item.validRowCount}</span> /{' '}
                      <span className="text-red-600">{item.invalidRowCount}</span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === 'ACTIVATED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : item.status === 'APPROVED'
                              ? 'bg-blue-100 text-blue-800'
                              : item.status === 'SUBMITTED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUploadPage;
