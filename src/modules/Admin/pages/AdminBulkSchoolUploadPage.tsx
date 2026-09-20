import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Building2,
  RefreshCw,
  ShieldCheck,
  Check,
  X,
  History,
  ArrowRight,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Search,
} from 'lucide-react';
import {
  adminSchoolsService,
  BulkUploadPreviewResponse,
} from '../services/admin-schools.service';
import { WorkflowStepIndicator, type WorkflowStep } from '@/components/ui/WorkflowStepIndicator';
import { Pagination } from '@/components/ui/Pagination';
import Skeleton from '@/components/ui/Skeleton';
import { useJobProgress, type JobProgressEvent } from '@/hooks/useJobProgress';

interface HistoryItem {
  id: string;
  fileName: string;
  fileSize?: number;
  status: string;
  rowCount: number;
  validRowCount: number;
  invalidRowCount: number;
  duplicateRowCount: number;
  activatedCount?: number;
  createdAt: string;
  activatedAt?: string;
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export const AdminBulkSchoolUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const firstSegment = location.pathname.split('/')[1];
  const routePrefix = [
    'super-admin',
    'admin',
    'general-manager',
    'manager',
    'operator',
    'staff',
  ].includes(firstSegment)
    ? `/${firstSegment}`
    : '/admin';

  const workflowSteps: WorkflowStep[] = [
    {
      id: 'bulk-school',
      stepNumber: 1,
      title: 'Bulk School Onboarding',
      subtitle: 'Onboard institutions & auto-create login accounts',
      status: 'current',
      to: `${routePrefix}/schools/bulk-upload`,
    },
    {
      id: 'bulk-student',
      stepNumber: 2,
      title: 'Bulk Student Registration',
      subtitle: 'Import candidate rosters with OTP login',
      status: 'pending',
      to: `${routePrefix}/students/bulk-register`,
    },
  ];

  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');

  // Upload & Stepper State
  const [currentStep, setCurrentStep] = useState<'SELECT' | 'PREVIEW' | 'ONBOARDING' | 'COMPLETED'>('SELECT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Preview State
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<BulkUploadPreviewResponse | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'INVALID'>('ALL');
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [previewLimit] = useState<number>(10);
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Activation & Completion State
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [activationResult, setActivationResult] = useState<{
    uploadId: string;
    createdCount: number;
    failedCount: number;
    status: string;
    errors?: string[];
  } | null>(null);

  // History State
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyLimit] = useState<number>(10);
  const [historyTotal, setHistoryTotal] = useState<number>(0);
  const [historyTotalPages, setHistoryTotalPages] = useState<number>(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inline WebSocket Job Progress Hook
  const {
    percentage: wsPercentage,
    stage: wsStage,
    message: wsMessage,
    current: wsCurrent,
    total: wsTotal,
  } = useJobProgress({
    queue: 'schools-bulk-upload',
    jobId: activeUploadId || undefined,
    enabled: currentStep === 'ONBOARDING' && Boolean(activeUploadId),
    onComplete: (event: JobProgressEvent) => {
      setIsConfirming(false);
      const summary = event.resultSummary;
      setActivationResult({
        uploadId: activeUploadId || '',
        createdCount: summary?.createdCount ?? (previewData?.upload.validRows || 0),
        failedCount: summary?.failedCount ?? 0,
        status: 'ACTIVATED',
      });
      setCurrentStep('COMPLETED');
    },
    onFailed: (event: JobProgressEvent) => {
      setIsConfirming(false);
      setUploadError(event.message || 'School onboarding failed.');
    },
  });

  // Load History on tab switch
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory(historyPage, historyLimit);
    }
  }, [activeTab, historyPage, historyLimit]);

  // Load Preview when uploadId or filter changes
  useEffect(() => {
    if (activeUploadId && currentStep === 'PREVIEW') {
      loadPreview(activeUploadId, previewPage, previewLimit, previewFilter);
    }
  }, [activeUploadId, previewPage, previewLimit, previewFilter, currentStep]);

  const loadHistory = async (page: number, limit: number) => {
    setIsLoadingHistory(true);
    try {
      const res = await adminSchoolsService.getUploadHistory({ page, limit });
      setHistoryList(res.uploads || []);
      setHistoryTotal(res.pagination?.total || 0);
      setHistoryTotalPages(res.pagination?.totalPages || 1);
    } catch (err: any) {
      console.error('Failed to load upload history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadPreview = async (
    uploadId: string,
    page: number,
    limit: number,
    filter: 'ALL' | 'VALID' | 'INVALID',
  ) => {
    setIsLoadingPreview(true);
    try {
      const res = await adminSchoolsService.getUploadPreview(uploadId, page, limit, filter);
      setPreviewData(res);
    } catch (err: any) {
      console.error('Failed to load upload preview:', err);
      setUploadError(err?.response?.data?.message || err.message || 'Failed to load preview');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const validExts = ['.csv', '.xlsx', '.xls'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExts.includes(ext)) {
      setUploadError('Invalid file type. Please upload a .csv or .xlsx Excel file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds 10MB limit.');
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndValidate = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await adminSchoolsService.uploadSchools(selectedFile);
      const uploadId = res.uploadId || res.id;
      setActiveUploadId(uploadId);
      setCurrentStep('PREVIEW');
      setPreviewPage(1);
      setPreviewFilter('ALL');
    } catch (err: any) {
      setUploadError(
        err?.response?.data?.message || err.message || 'Failed to parse and validate spreadsheet.',
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmOnboarding = async () => {
    if (!activeUploadId) return;
    setIsConfirming(true);
    setUploadError(null);
    setCurrentStep('ONBOARDING');

    try {
      const res = await adminSchoolsService.confirmUpload(activeUploadId);
      if (res.status === 'ACTIVATED' || res.status === 'PENDING_APPROVAL') {
        setActivationResult({
          uploadId: activeUploadId,
          createdCount: res.createdCount ?? previewData?.upload.validRows ?? 0,
          failedCount: res.failedCount ?? 0,
          status: res.status,
          errors: res.errors,
        });
        setCurrentStep('COMPLETED');
      }
    } catch (err: any) {
      setUploadError(
        err?.response?.data?.message || err.message || 'Failed to activate schools batch.',
      );
      setCurrentStep('PREVIEW');
      setIsConfirming(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setActiveUploadId(null);
    setPreviewData(null);
    setUploadError(null);
    setActivationResult(null);
    setCurrentStep('SELECT');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredRows = (previewData?.rows || []).filter((r) => {
    if (!previewSearch) return true;
    const searchLower = previewSearch.toLowerCase();
    const data = (r.data || {}) as any;
    return (
      (data.name && data.name.toLowerCase().includes(searchLower)) ||
      (data.code && data.code.toLowerCase().includes(searchLower)) ||
      (data.phone && String(data.phone).toLowerCase().includes(searchLower)) ||
      (data.city && data.city.toLowerCase().includes(searchLower)) ||
      (data.state && data.state.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Top Header & Workflow ────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              RBAC Authorized
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
              <Building2 className="h-3.5 w-3.5" />
              Step 1 of 2
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Bulk School Onboarding
          </h1>
          <p className="mt-1 text-xs text-slate-500 max-w-2xl">
            Import partner schools, coaching centers, and examination venues via Excel or CSV.
            School administrator accounts are automatically created and assigned login credentials.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => adminSchoolsService.downloadTemplate('xlsx')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Download Excel Template (.xlsx)
          </button>
          <button
            onClick={() => adminSchoolsService.downloadTemplate('csv')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition-colors"
          >
            <Download className="h-4 w-4 text-slate-500" />
            CSV (.csv)
          </button>
          <button
            onClick={() => navigate(`${routePrefix}/schools`)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <Building2 className="h-4 w-4" />
            View Schools Directory
          </button>
        </div>
      </div>

      {/* ─── Workflow Step Indicator ──────────────────────────────────────── */}
      <WorkflowStepIndicator
        steps={workflowSteps}
        workflowTitle="Bulk Onboarding & Student Registration Pipeline"
      />

      {/* ─── Tabs Switcher ────────────────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-200 bg-white px-4 rounded-2xl shadow-2xs">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'upload'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UploadCloud className="h-4 w-4" />
          Upload & Onboard Schools
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 py-3.5 px-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="h-4 w-4" />
          Upload Batch History
        </button>
      </div>

      {/* ─── TAB 1: UPLOAD & ONBOARD ──────────────────────────────────────── */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* STEP 1: SELECT FILE */}
          {currentStep === 'SELECT' && (
            <div className="space-y-6">
              {/* Dropzone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="group relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center shadow-2xs hover:border-indigo-500 hover:bg-indigo-50/20 transition-all cursor-pointer"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 group-hover:scale-105 transition-transform shadow-xs">
                  <UploadCloud className="h-8 w-8" />
                </div>

                <h3 className="mt-4 text-base font-black text-slate-800">
                  {selectedFile ? selectedFile.name : 'Drop your schools spreadsheet here, or browse'}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Supported formats: .xlsx, .xls, .csv (Max file size: 10MB)
                </p>

                {selectedFile && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-2">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-slate-700">{selectedFile.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReset();
                      }}
                      className="ml-2 text-slate-400 hover:text-rose-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/50 p-4 text-xs font-semibold text-rose-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Action Bar */}
              <div className="flex items-center justify-end gap-3">
                {selectedFile && (
                  <button
                    onClick={handleReset}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Clear File
                  </button>
                )}
                <button
                  onClick={handleUploadAndValidate}
                  disabled={!selectedFile || isUploading}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Parsing & Validating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Validate & Preview Roster
                    </>
                  )}
                </button>
              </div>

              {/* Format Guide Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 mb-3">
                  Spreadsheet Column Specification
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <p className="font-bold text-slate-800">1. School Name *</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Required. Full official school title.</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <p className="font-bold text-slate-800">2. School Code *</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Unique center ID or UDISE (e.g. MIS-DEL-201).</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <p className="font-bold text-emerald-700">3. Phone Number (Login) *</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">10-digit mobile used for OTP administrator login.</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                    <p className="font-bold text-slate-800">4. Email & Location</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Email address, State, City, Address, Status.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & STAGED VALIDATION */}
          {currentStep === 'PREVIEW' && (
            <div className="space-y-6">
              {/* Stats Summary Bar */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Total Rows
                  </span>
                  <p className="mt-1 text-2xl font-black text-slate-900">
                    {previewData?.upload.totalRows || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    Valid Schools
                  </span>
                  <p className="mt-1 text-2xl font-black text-emerald-600">
                    {previewData?.upload.validRows || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                    Invalid Rows
                  </span>
                  <p className="mt-1 text-2xl font-black text-rose-600">
                    {previewData?.upload.invalidRows || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-2xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">
                    Duplicates
                  </span>
                  <p className="mt-1 text-2xl font-black text-amber-600">
                    {previewData?.upload.duplicateRows || 0}
                  </p>
                </div>
              </div>

              {/* Toolbar & Filters */}
              <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={previewSearch}
                    onChange={(e) => setPreviewSearch(e.target.value)}
                    placeholder="Search in uploaded batch..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex rounded-xl bg-slate-100 p-1">
                    {(['ALL', 'VALID', 'INVALID'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setPreviewFilter(filter);
                          setPreviewPage(1);
                        }}
                        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                          previewFilter === filter
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {filter === 'ALL'
                          ? `All (${previewData?.upload.totalRows || 0})`
                          : filter === 'VALID'
                          ? `Valid (${previewData?.upload.validRows || 0})`
                          : `Invalid (${previewData?.upload.invalidRows || 0})`}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleReset}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleConfirmOnboarding}
                    disabled={isConfirming || (previewData?.upload.validRows || 0) === 0}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Check className="h-4 w-4" />
                    Confirm & Onboard ({previewData?.upload.validRows || 0}) Schools
                  </button>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">Row</th>
                        <th className="py-3 px-4">School Details</th>
                        <th className="py-3 px-4">Code</th>
                        <th className="py-3 px-4">Admin Phone (Login)</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Location</th>
                        <th className="py-3 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isLoadingPreview ? (
                        Array.from({ length: 5 }).map((_, idx) => (
                          <tr key={idx}>
                            <td colSpan={7} className="p-4">
                              <Skeleton className="h-6 w-full" />
                            </td>
                          </tr>
                        ))
                      ) : filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No school records match your preview filter.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row) => {
                          const data = (row.data || {}) as any;
                          const isValid = row.validationStatus === 'VALID';
                          return (
                            <tr
                              key={row.id}
                              className={`transition-colors hover:bg-slate-50/80 ${
                                !isValid ? 'bg-rose-50/30' : ''
                              }`}
                            >
                              <td className="py-3 px-4 text-center font-mono text-slate-400">
                                {row.rowNumber}
                              </td>
                              <td className="py-3 px-4">
                                <p className="font-bold text-slate-900">{data.name || '—'}</p>
                                {data.address && (
                                  <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                    {data.address}
                                  </p>
                                )}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                                {data.code || '—'}
                              </td>
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 font-mono font-semibold text-slate-700">
                                  <Phone className="h-3 w-3 text-slate-400" />
                                  {data.phone || data.phoneNumber || '—'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {data.email ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-slate-400" />
                                    {data.email}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-3 px-4 text-slate-600">
                                {data.state || data.city ? (
                                  <span className="inline-flex items-center gap-1">
                                    <MapPin className="h-3 w-3 text-slate-400" />
                                    {[data.city, data.state].filter(Boolean).join(', ')}
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>
                              <td className="py-3 px-4 text-center">
                                {isValid ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Valid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700">
                                    <AlertCircle className="h-3 w-3" />
                                    Invalid
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {previewData?.meta && previewData.meta.totalPages > 1 && (
                  <div className="border-t border-slate-100 p-4">
                    <Pagination
                      page={previewPage}
                      totalPages={previewData.meta.totalPages}
                      total={previewData.meta.total}
                      limit={previewLimit}
                      onPageChange={setPreviewPage}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: INLINE WEBSOCKET PROGRESS */}
          {currentStep === 'ONBOARDING' && (
            <div className="rounded-3xl border border-indigo-100 bg-white p-8 shadow-sm text-center max-w-2xl mx-auto space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mx-auto shadow-inner">
                <RefreshCw className="h-8 w-8 animate-spin" />
              </div>

              <div>
                <h3 className="text-xl font-black text-slate-900">
                  Onboarding Schools & Generating Admin Accounts...
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {wsMessage || 'Processing school records in real-time over WebSocket...'}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <span>{wsStage || 'CREATING_SCHOOLS'}</span>
                  <span>{wsPercentage || (wsCurrent && wsTotal ? Math.round((wsCurrent / wsTotal) * 100) : 0)}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 rounded-full"
                    style={{
                      width: `${Math.max(
                        5,
                        wsPercentage || (wsCurrent && wsTotal ? (wsCurrent / wsTotal) * 100 : 15),
                      )}%`,
                    }}
                  />
                </div>
                {wsTotal > 0 && (
                  <p className="text-[11px] font-semibold text-slate-400 text-right">
                    Processed {wsCurrent || 0} of {wsTotal} schools
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: COMPLETED SUMMARY */}
          {currentStep === 'COMPLETED' && activationResult && (
            <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-sm text-center max-w-2xl mx-auto space-y-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">
                  {activationResult.status === 'PENDING_APPROVAL'
                    ? 'Submitted for Super Admin Approval'
                    : 'Schools Successfully Onboarded!'}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500">
                  {activationResult.status === 'PENDING_APPROVAL'
                    ? 'Your upload has been staged for approval. Schools will be created once reviewed.'
                    : `Successfully onboarded ${activationResult.createdCount} schools. All school administrator user accounts are active and ready for phone/OTP login.`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                <div className="rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                    Created & Active
                  </span>
                  <p className="mt-1 text-2xl font-black text-emerald-700">
                    {activationResult.createdCount}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Failed Records
                  </span>
                  <p className="mt-1 text-2xl font-black text-slate-800">
                    {activationResult.failedCount}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  onClick={() => navigate(`${routePrefix}/schools`)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
                >
                  <Building2 className="h-4 w-4" />
                  View Schools Directory
                </button>
                <button
                  onClick={() => navigate(`${routePrefix}/students/bulk-register`)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
                >
                  Proceed to Step 2: Bulk Students
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto text-xs font-semibold text-slate-400 hover:text-slate-600 py-2"
                >
                  Upload Another Batch
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: UPLOAD BATCH HISTORY ──────────────────────────────────── */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="py-3 px-4">File Name</th>
                    <th className="py-3 px-4 text-center">Total Rows</th>
                    <th className="py-3 px-4 text-center">Valid</th>
                    <th className="py-3 px-4 text-center">Invalid</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Uploaded By</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingHistory ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={idx}>
                        <td colSpan={7} className="p-4">
                          <Skeleton className="h-6 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : historyList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No previous school upload history found.
                      </td>
                    </tr>
                  ) : (
                    historyList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                            <span>{item.fileName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {item.rowCount}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-emerald-600">
                          {item.validRowCount}
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-rose-600">
                          {item.invalidRowCount}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                              item.status === 'ACTIVATED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : item.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {item.uploadedBy?.name || item.uploadedBy?.email || 'System'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {historyTotalPages > 1 && (
              <div className="border-t border-slate-100 p-4">
                <Pagination
                  page={historyPage}
                  totalPages={historyTotalPages}
                  total={historyTotal}
                  limit={historyLimit}
                  onPageChange={setHistoryPage}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBulkSchoolUploadPage;
