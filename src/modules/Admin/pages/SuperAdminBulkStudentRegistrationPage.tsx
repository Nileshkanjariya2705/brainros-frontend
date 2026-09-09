import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Users,
  RefreshCw,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Check,
  X,
  History,
  Info,
  ArrowRight,
  Building2,
  Edit2,
  Save,
} from 'lucide-react';
import {
  studentBulkService,
  BulkStudentPreviewResponse,
  BulkStudentHistoryItem,
  BulkStudentRow,
} from '../services/studentBulk.service';
import {
  adminSchoolsService,
  SchoolItem,
} from '../services/admin-schools.service';

export const SuperAdminBulkStudentRegistrationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'history'>('upload');

  // Upload & Stepper State
  const [currentStep, setCurrentStep] = useState<'SELECT' | 'PREVIEW' | 'REGISTERING' | 'COMPLETED'>('SELECT');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // B2B School / Center State
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [isLoadingSchools, setIsLoadingSchools] = useState<boolean>(false);

  // Preview State
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<BulkStudentPreviewResponse | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'VALID' | 'INVALID'>('ALL');
  const [previewPage, setPreviewPage] = useState<number>(1);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Inline Row Edit State
  const [editingRow, setEditingRow] = useState<BulkStudentRow | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});
  const [isSavingRow, setIsSavingRow] = useState<boolean>(false);
  const [rowEditError, setRowEditError] = useState<string | null>(null);

  // Confirmation & Registration State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registrationResult, setRegistrationResult] = useState<{
    uploadId: string;
    totalValid: number;
    activated: number;
    failed: number;
    status: string;
  } | null>(null);

  // History State
  const [historyList, setHistoryList] = useState<BulkStudentHistoryItem[]>([]);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyTotalPages, setHistoryTotalPages] = useState<number>(1);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Active Schools on component mount
  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    setIsLoadingSchools(true);
    try {
      const res = await adminSchoolsService.getSchools({ status: 'ACTIVE', limit: 100 });
      setSchools(res.data || []);
    } catch (err) {
      console.error('Failed to load active schools:', err);
    } finally {
      setIsLoadingSchools(false);
    }
  };

  // Load History on tab switch
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory(historyPage);
    }
  }, [activeTab, historyPage]);

  // Load Preview when uploadId or filter changes
  useEffect(() => {
    if (activeUploadId && currentStep === 'PREVIEW') {
      loadPreview(activeUploadId, previewPage, previewFilter);
    }
  }, [activeUploadId, previewPage, previewFilter, currentStep]);

  const loadHistory = async (page: number) => {
    setIsLoadingHistory(true);
    try {
      const res = await studentBulkService.getUploadHistory({ page, limit: 10 });
      setHistoryList(res.uploads || []);
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
    filter: 'ALL' | 'VALID' | 'INVALID',
  ) => {
    setIsLoadingPreview(true);
    try {
      const res = await studentBulkService.getUploadPreview(uploadId, {
        page,
        limit: 15,
        filterStatus: filter,
      });
      setPreviewData(res);
    } catch (err: any) {
      console.error('Failed to load preview:', err);
      setUploadError(err.response?.data?.message || 'Failed to load preview details.');
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handle Template Download
  const handleDownloadTemplate = async (format: 'csv' | 'xlsx') => {
    try {
      const blob = await studentBulkService.downloadTemplate(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_bulk_registration_template.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to download template. Please try again.');
    }
  };

  // Handle Error Report Download
  const handleDownloadErrorReport = async (uploadId: string, format: 'csv' | 'xlsx' = 'xlsx') => {
    try {
      const blob = await studentBulkService.downloadErrorReport(uploadId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `student_registration_errors_${uploadId.substring(0, 8)}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert('Failed to download error report.');
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validExts = ['.csv', '.xlsx', '.xls'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExts.includes(ext)) {
        setUploadError(`Invalid file format '${ext}'. Please upload a .xlsx or .csv file.`);
        setSelectedFile(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit.');
        setSelectedFile(null);
        return;
      }
      setUploadError(null);
      setSelectedFile(file);
    }
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const validExts = ['.csv', '.xlsx', '.xls'];
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      if (!validExts.includes(ext)) {
        setUploadError(`Invalid file format '${ext}'. Please upload a .xlsx or .csv file.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size exceeds 10MB limit.');
        return;
      }
      setUploadError(null);
      setSelectedFile(file);
    }
  };

  // Handle Upload & Validate with mandatory Target School ID
  const handleUploadAndValidate = async () => {
    if (!selectedSchoolId) {
      setUploadError('Please select a Target School / Examination Center before uploading.');
      return;
    }
    if (!selectedFile) {
      setUploadError('Please select a CSV or Excel file to upload.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await studentBulkService.uploadStudents(
        selectedFile,
        selectedSchoolId,
      );
      setActiveUploadId(res.uploadId);
      setCurrentStep('PREVIEW');
      setPreviewPage(1);
      setPreviewFilter('ALL');
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to upload and validate file.');
    } finally {
      setIsUploading(false);
    }
  };

  // Open Edit Modal for a Staged Row
  const handleOpenEditRow = (row: BulkStudentRow) => {
    setEditingRow(row);
    setRowEditError(null);
    setEditFormData({
      name: row.data.name || '',
      mobile: row.data.rawMobile || row.data.mobile?.replace('+91', '') || '',
      email: row.data.email || '',
      state: row.data.state || '',
      city: row.data.city || '',
      class: row.data.class || '',
      examTarget: row.data.examTarget || '',
      preferredLanguage: row.data.preferredLanguage || '',
      schoolCollege: row.data.schoolCollege || row.data.institutionName || '',
      institutionId: row.data.institutionId || '',
    });
  };

  // Save Row Corrections and Re-run Validation
  const handleSaveRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRow) return;

    setIsSavingRow(true);
    setRowEditError(null);

    try {
      const res = await studentBulkService.updateRow(editingRow.id, editFormData);

      if (previewData) {
        const updatedRows = previewData.rows.map((r) =>
          r.id === editingRow.id ? res.row : r,
        );
        setPreviewData({
          ...previewData,
          upload: {
            ...previewData.upload,
            validRowCount: res.uploadSummary.validRowCount,
            invalidRowCount: res.uploadSummary.invalidRowCount,
            duplicateRowCount: res.uploadSummary.duplicateRowCount,
            status: res.uploadSummary.status,
          },
          rows: updatedRows,
        });
      }
      setEditingRow(null);
    } catch (err: any) {
      setRowEditError(err.response?.data?.message || 'Failed to update student row.');
    } finally {
      setIsSavingRow(false);
    }
  };

  // Handle Confirm Registration
  const handleConfirmRegistration = async () => {
    if (!activeUploadId) return;

    setIsRegistering(true);
    setIsConfirmModalOpen(false);
    setCurrentStep('REGISTERING');

    try {
      const res = await studentBulkService.confirmRegistration(activeUploadId);
      setRegistrationResult(res);
      setCurrentStep('COMPLETED');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Registration failed.');
      setCurrentStep('PREVIEW');
    } finally {
      setIsRegistering(false);
    }
  };

  const resetFlow = () => {
    setCurrentStep('SELECT');
    setSelectedFile(null);
    setActiveUploadId(null);
    setPreviewData(null);
    setUploadError(null);
    setRegistrationResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold tracking-wider uppercase mb-1">
            <Users className="w-4 h-4" />
            <span>Super Admin &bull; Student Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            Bulk Student Registration
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              Passwordless &bull; OTP Ready
            </span>
          </h1>
          <p className="text-slate-600 text-sm mt-1 max-w-3xl">
            Upload CSV or Excel files with student details matching normal registration. Validate state/city relationships,
            exam targets, and grade levels with automated duplicate detection.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-xs self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload & Register
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <History className="w-4 h-4" />
            Upload History
          </button>
        </div>
      </div>

      {/* ── Main Tab Content ── */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* Stepper Wizard Indicator */}
          <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-2 sm:gap-4 max-w-3xl mx-auto">
            <div
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                currentStep === 'SELECT'
                  ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 ring-1 ring-indigo-300'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  currentStep !== 'SELECT'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-indigo-600 text-white'
                }`}
              >
                {currentStep !== 'SELECT' ? <Check className="w-3.5 h-3.5" /> : '1'}
              </div>
              <span className="text-xs sm:text-sm font-semibold truncate">1. Select School & File</span>
            </div>

            <div
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                currentStep === 'PREVIEW'
                  ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 ring-1 ring-indigo-300'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  currentStep === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : currentStep === 'PREVIEW'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {currentStep === 'COMPLETED' ? <Check className="w-3.5 h-3.5" /> : '2'}
              </div>
              <span className="text-xs sm:text-sm font-semibold truncate">2. Validate & Preview</span>
            </div>

            <div
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                currentStep === 'REGISTERING' || currentStep === 'COMPLETED'
                  ? 'bg-indigo-50/80 border-indigo-300 text-indigo-900 ring-1 ring-indigo-300'
                  : 'bg-white border-slate-200 text-slate-500'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  currentStep === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : currentStep === 'REGISTERING'
                      ? 'bg-indigo-600 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                3
              </div>
              <span className="text-xs sm:text-sm font-semibold truncate">3. Confirmation</span>
            </div>
          </div>

          {/* ── STEP 1: SELECT & UPLOAD ── */}
          {currentStep === 'SELECT' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upload Dropzone */}
              <div className="lg:col-span-2 space-y-6">
                {/* B2B Partner School / Examination Center Selector (MANDATORY) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      Select Target School / Examination Center <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                      Mandatory Step
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    You must select a target school before uploading a student file. All candidates in this batch will be assigned to the selected school.
                  </p>
                  <select
                    value={selectedSchoolId}
                    onChange={(e) => {
                      setSelectedSchoolId(e.target.value);
                      if (uploadError) setUploadError(null);
                    }}
                    disabled={isLoadingSchools}
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none transition-all ${
                      !selectedSchoolId
                        ? 'border-amber-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                        : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                    }`}
                  >
                    <option value="">-- Select Target School / Center (Required) --</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name} ({school.code}) {school.city ? `— ${school.city}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
                    !selectedSchoolId
                      ? 'border-slate-200 bg-slate-100/60 opacity-70'
                      : selectedFile
                      ? 'border-indigo-400 bg-indigo-50/50'
                      : 'border-slate-300 hover:border-indigo-400 bg-white hover:bg-slate-50/60'
                  }`}
                  onClick={() => {
                    if (!selectedSchoolId) {
                      setUploadError('Please select a Target School / Examination Center first.');
                      return;
                    }
                    fileInputRef.current?.click();
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                    disabled={!selectedSchoolId}
                    onChange={handleFileChange}
                  />

                  {selectedFile ? (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <FileSpreadsheet className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {(selectedFile.size / 1024).toFixed(1)} KB &bull; Ready to Validate
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove File
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-slate-900">
                          {!selectedSchoolId
                            ? 'Please select a School / Center above first'
                            : 'Click to browse or drag and drop your spreadsheet'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Supported formats: <span className="text-slate-700 font-medium">.xlsx, .csv</span> (Max 10MB, up to 10,000 rows)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-600" />
                    <div>
                      <p className="font-semibold">Upload Validation Alert</p>
                      <p className="text-xs text-rose-700 mt-0.5">{uploadError}</p>
                    </div>
                  </div>
                )}

                {/* Validate Button */}
                <div className="flex justify-end">
                  <button
                    disabled={!selectedSchoolId || !selectedFile || isUploading}
                    onClick={handleUploadAndValidate}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-all shadow-md shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Validating Spreadsheet...
                      </>
                    ) : (
                      <>
                        <span>Validate & Preview Rows</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Template & Guidelines Card */}
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-xs">
                  <div className="flex items-center gap-2.5 text-slate-900 font-semibold text-base">
                    <Download className="w-5 h-5 text-indigo-600" />
                    <h3>Download Sample Templates</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Download the official template pre-configured with the required columns, headers, and validation rules.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleDownloadTemplate('xlsx')}
                      className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 transition-all cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => handleDownloadTemplate('csv')}
                      className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 border border-slate-200 transition-all cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-blue-600" />
                      CSV (.csv)
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
                  <div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
                    <Info className="w-4 h-4" />
                    <h4>Required Field Rules</h4>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-2.5">
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                      <span><strong className="text-slate-900">Full Name:</strong> Min 2 characters.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                      <span><strong className="text-slate-900">Mobile:</strong> 10 digits starting with 6-9 (Duplicates rejected).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                      <span><strong className="text-slate-900">State & City:</strong> City must belong to the specified State.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                      <span><strong className="text-slate-900">Class:</strong> Valid academic class (e.g. 11th, 12th, Dropper).</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                      <span><strong className="text-slate-900">Exam Target:</strong> NEET, JEE_MAIN, etc.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                      <span><strong className="text-slate-900">Language:</strong> ENGLISH, HINDI, GUJARATI, etc.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: PREVIEW & STATS ── */}
          {currentStep === 'PREVIEW' && previewData && (
            <div className="space-y-6">
              {/* Summary Metric Cards */}
              <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="p-3.5 min-[360px]:p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Rows</p>
                  <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                    {previewData.upload.rowCount}
                  </p>
                </div>

                <div className="p-3.5 min-[360px]:p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-xs">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Valid Rows</p>
                  <p className="text-2xl sm:text-3xl font-bold text-emerald-800 mt-1">
                    {previewData.upload.validRowCount}
                  </p>
                </div>

                <div className="p-3.5 min-[360px]:p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 shadow-xs">
                  <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Invalid Rows</p>
                  <p className="text-2xl sm:text-3xl font-bold text-rose-800 mt-1">
                    {previewData.upload.invalidRowCount}
                  </p>
                </div>

                <div className="p-3.5 min-[360px]:p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-xs">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Duplicate Rows</p>
                  <p className="text-2xl sm:text-3xl font-bold text-amber-800 mt-1">
                    {previewData.upload.duplicateRowCount}
                  </p>
                </div>
              </div>

              {/* Table Controls & Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setPreviewFilter('ALL');
                      setPreviewPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      previewFilter === 'ALL'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    All ({previewData.upload.rowCount})
                  </button>
                  <button
                    onClick={() => {
                      setPreviewFilter('VALID');
                      setPreviewPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      previewFilter === 'VALID'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Valid Only ({previewData.upload.validRowCount})
                  </button>
                  <button
                    onClick={() => {
                      setPreviewFilter('INVALID');
                      setPreviewPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      previewFilter === 'INVALID'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Errors & Duplicates ({previewData.upload.invalidRowCount})
                  </button>
                </div>

                {previewData.upload.invalidRowCount > 0 && (
                  <button
                    onClick={() => handleDownloadErrorReport(previewData.upload.id, 'xlsx')}
                    className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Error Report
                  </button>
                )}
              </div>

              {/* Preview Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3.5 w-14 text-center">Row</th>
                        <th className="px-4 py-3.5">Full Name</th>
                        <th className="px-4 py-3.5">Mobile</th>
                        <th className="px-4 py-3.5">School / Center</th>
                        <th className="px-4 py-3.5">Class & Targets</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5">Validation Notes</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {isLoadingPreview ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                            Loading preview rows...
                          </td>
                        </tr>
                      ) : previewData.rows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500">
                            No rows match the selected filter.
                          </td>
                        </tr>
                      ) : (
                        previewData.rows.map((row) => (
                          <tr
                            key={row.id}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              row.validationStatus === 'INVALID' ? 'bg-rose-50/30' : ''
                            }`}
                          >
                            <td className="px-4 py-3 text-center text-slate-400 font-mono">
                              {row.rowNumber}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900">{row.data.name || '—'}</div>
                              {row.data.email && (
                                <div className="text-[11px] text-slate-500 font-normal">{row.data.email}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-700">
                              {row.data.mobile || row.data.phone || '—'}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                                <span className="truncate max-w-[150px]" title={row.data.institutionName || row.data.schoolCollege || 'Not specified'}>
                                  {row.data.institutionName || row.data.schoolCollege || (
                                    <span className="text-slate-400 italic">None</span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap items-center gap-1">
                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200">
                                  {row.data.class || 'N/A'}
                                </span>
                                {((row.data.examTarget || '')
                                  .split(/[,/+]|\band\b/i)
                                  .map((t: string) => t.trim())
                                  .filter(Boolean)).map((target: string, idx: number) => {
                                  const upper = target.toUpperCase();
                                  const badgeStyle = upper.includes('NEET')
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : upper.includes('CET')
                                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                                      : upper.includes('JEE')
                                        ? 'bg-sky-50 text-sky-800 border-sky-200'
                                        : 'bg-indigo-50 text-indigo-800 border-indigo-200';
                                  return (
                                    <span
                                      key={idx}
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeStyle}`}
                                    >
                                      {target}
                                    </span>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {row.validationStatus === 'VALID' ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Check className="w-3 h-3" />
                                  Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                  <X className="w-3 h-3" />
                                  Invalid
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              {row.errors && row.errors.length > 0 ? (
                                <div className="space-y-1">
                                  {row.errors.map((err, i) => (
                                    <div
                                      key={i}
                                      className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-0.5 truncate"
                                      title={err.message}
                                    >
                                      &bull; {err.message}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-emerald-700 text-xs font-medium">Ready for registration</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleOpenEditRow(row)}
                                className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-all inline-flex items-center gap-1 text-xs font-semibold cursor-pointer"
                                title="Edit Row"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Edit</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {previewData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
                    <div>
                      Showing {(previewPage - 1) * previewData.pagination.limit + 1} to{' '}
                      {Math.min(previewPage * previewData.pagination.limit, previewData.pagination.total)} of{' '}
                      {previewData.pagination.total} entries
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={previewPage <= 1}
                        onClick={() => setPreviewPage((p) => Math.max(1, p - 1))}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span>
                        Page {previewPage} of {previewData.pagination.totalPages}
                      </span>
                      <button
                        disabled={previewPage >= previewData.pagination.totalPages}
                        onClick={() => setPreviewPage((p) => Math.min(previewData.pagination.totalPages, p + 1))}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                <button
                  onClick={resetFlow}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer"
                >
                  Cancel / Upload Different File
                </button>

                <div className="flex items-center gap-3">
                  <button
                    disabled={previewData.upload.validRowCount === 0}
                    onClick={() => setIsConfirmModalOpen(true)}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm transition-all shadow-md shadow-emerald-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Register {previewData.upload.validRowCount} Valid Students
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: REGISTERING & COMPLETED ── */}
          {currentStep === 'REGISTERING' && (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl space-y-4 max-w-lg mx-auto shadow-xs">
              <RefreshCw className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
              <h3 className="text-xl font-bold text-slate-900">Registering Students...</h3>
              <p className="text-xs text-slate-500">
                Creating User credentials, assigning Student roles, generating unique Student IDs, and storing profiles.
              </p>
            </div>
          )}

          {currentStep === 'COMPLETED' && registrationResult && (
            <div className="p-8 sm:p-12 bg-white border border-slate-200 rounded-3xl space-y-6 max-w-2xl mx-auto text-center shadow-xs">
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-900">Bulk Registration Completed</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Students have been registered and can now log in immediately via OTP.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 py-4 border-y border-slate-200">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider">Total Valid</p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">{registrationResult.totalValid}</p>
                </div>
                <div>
                  <p className="text-xs text-emerald-600 uppercase tracking-wider">Registered</p>
                  <p className="text-2xl font-bold text-emerald-600 mt-0.5">{registrationResult.activated}</p>
                </div>
                <div>
                  <p className="text-xs text-rose-600 uppercase tracking-wider">Failed</p>
                  <p className="text-2xl font-bold text-rose-600 mt-0.5">{registrationResult.failed}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                {registrationResult.failed > 0 && (
                  <button
                    onClick={() => handleDownloadErrorReport(registrationResult.uploadId, 'xlsx')}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Failed Rows Report
                  </button>
                )}

                <button
                  onClick={resetFlow}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-200 transition-all cursor-pointer"
                >
                  <UploadCloud className="w-4 h-4" />
                  Upload Another Batch
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">File Name</th>
                    <th className="px-4 py-3.5">Uploaded Date</th>
                    <th className="px-4 py-3.5 text-center">Total Rows</th>
                    <th className="px-4 py-3.5 text-center">Valid</th>
                    <th className="px-4 py-3.5 text-center">Registered</th>
                    <th className="px-4 py-3.5 text-center">Errors</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                        Loading upload history...
                      </td>
                    </tr>
                  ) : historyList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No bulk registration uploads found.
                      </td>
                    </tr>
                  ) : (
                    historyList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                          <span className="truncate max-w-xs">{item.fileName}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono">
                          {new Date(item.createdAt).toLocaleString('en-US', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-900">{item.rowCount}</td>
                        <td className="px-4 py-3 text-center font-semibold text-emerald-700">{item.validRowCount}</td>
                        <td className="px-4 py-3 text-center font-semibold text-indigo-700">{item.activatedCount}</td>
                        <td className="px-4 py-3 text-center font-semibold text-rose-700">{item.invalidRowCount + item.failedCount}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              item.status === 'ACTIVATED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === 'READY_FOR_REVIEW'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : item.status === 'FAILED'
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setActiveUploadId(item.id);
                                setCurrentStep('PREVIEW');
                                setActiveTab('upload');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 transition-all cursor-pointer"
                            >
                              Preview
                            </button>
                            {(item.invalidRowCount > 0 || item.failedCount > 0) && (
                              <button
                                onClick={() => handleDownloadErrorReport(item.id, 'xlsx')}
                                className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer"
                                title="Download Error Report"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {historyTotalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-600">
                <div>Page {historyPage} of {historyTotalPages}</div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={historyPage <= 1}
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={historyPage >= historyTotalPages}
                    onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Staged Row Modal ── */}
      {editingRow && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Edit Candidate Data (Row #{editingRow.rowNumber})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fix validation errors or update details prior to confirmation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingRow(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {rowEditError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                <span>{rowEditError}</span>
              </div>
            )}

            <form onSubmit={handleSaveRow} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={editFormData.mobile || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, mobile: e.target.value.replace(/\D/g, '') })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="9876543210"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={editFormData.email || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="rahul@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Class / Grade *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.class || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, class: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. 11th, 12th, Dropper"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.state || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, state: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Gujarat"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    City / District *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Ahmedabad"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Exam Target(s) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.examTarget || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, examTarget: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. NEET, CET"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-[11px] text-slate-500">Quick set:</span>
                    {['NEET', 'CET', 'JEE', 'NEET, CET', 'JEE, CET'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setEditFormData({ ...editFormData, examTarget: t })}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Preferred Language *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.preferredLanguage || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, preferredLanguage: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. ENGLISH, HINDI, GUJARATI"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  School / College / Institution *
                </label>
                <div className="space-y-2">
                  <select
                    value={editFormData.institutionId || ''}
                    onChange={(e) => {
                      const instId = e.target.value;
                      const matched = schools.find((s) => s.id === instId);
                      setEditFormData({
                        ...editFormData,
                        institutionId: instId,
                        schoolCollege: matched ? matched.name : editFormData.schoolCollege,
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select a registered B2B School (or type custom below)</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.id}>
                        {school.name} ({school.code})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={editFormData.schoolCollege || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, schoolCollege: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:border-indigo-500"
                    placeholder="School / College name"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingRow(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRow}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-md shadow-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingRow ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Validating & Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save & Re-validate Row
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {isConfirmModalOpen && previewData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">Confirm Bulk Registration</h3>
              <p className="text-xs text-slate-600 mt-1">
                You are about to register <strong className="text-emerald-700">{previewData.upload.validRowCount} students</strong> into the system.
              </p>
            </div>

            {previewData.upload.invalidRowCount > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>
                  <strong>{previewData.upload.invalidRowCount} invalid rows</strong> will be skipped and can be reviewed in the error report.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 border border-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={isRegistering}
                onClick={handleConfirmRegistration}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold text-white shadow-md shadow-emerald-200 transition-all cursor-pointer"
              >
                {isRegistering ? 'Processing...' : `Confirm & Register (${previewData.upload.validRowCount})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminBulkStudentRegistrationPage;
