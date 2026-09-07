import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  Plus,
  Upload,
  Download,
  Search,
  RotateCw,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Layers,
  MapPin,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Eye,
  FileSpreadsheet,
} from 'lucide-react';
import {
  AdminSchoolsApi,
  type SchoolItem,
  type SchoolFilterOptions,
  type BulkUploadPreviewResponse,
  type CreateSchoolPayload,
} from '../services/admin-schools.service';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';

export const AdminSchoolsPage: React.FC = () => {
  // State
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(20);
  const [search, setSearch] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [stateFilter, setStateFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterOptions, setFilterOptions] = useState<SchoolFilterOptions>({
    states: [],
    districts: [],
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolItem | null>(null);

  // Add Form State
  const [addForm, setAddForm] = useState<CreateSchoolPayload>({
    name: '',
    code: '',
    email: '',
    phone: '',
    state: '',
    city: '',
    address: '',
  });
  const [isSubmittingAdd, setIsSubmittingAdd] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Bulk Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<BulkUploadPreviewResponse | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  // Load filter options once
  useEffect(() => {
    AdminSchoolsApi.getFilterOptions()
      .then(setFilterOptions)
      .catch((err) => console.error('Failed to load filter options', err));
  }, []);

  // Fetch schools
  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await AdminSchoolsApi.getSchools({
        page,
        limit,
        search: search || undefined,
        stateId: stateFilter || undefined,
        status: statusFilter || undefined,
      });
      setSchools(res.data || []);
      setTotal(res.meta?.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch schools', err);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, stateFilter, statusFilter]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle single school creation
  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.code.trim()) {
      setAddError('School name and unique code are required.');
      return;
    }

    setIsSubmittingAdd(true);
    setAddError(null);
    try {
      await AdminSchoolsApi.createSchool(addForm);
      setIsAddModalOpen(false);
      setAddForm({
        name: '',
        code: '',
        email: '',
        phone: '',
        state: '',
        city: '',
        address: '',
      });
      fetchSchools();
    } catch (err: any) {
      setAddError(err.response?.data?.message || 'Failed to create school');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handle file select & preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const staged = await AdminSchoolsApi.uploadSchools(file);
      const preview = await AdminSchoolsApi.getUploadPreview(staged.uploadId);
      setUploadResult(preview);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to process spreadsheet');
    } finally {
      setIsUploading(false);
    }
  };

  // Confirm bulk upload
  const handleConfirmUpload = async () => {
    if (!uploadResult?.upload?.id) return;
    setIsConfirming(true);
    setUploadError(null);
    try {
      const res = await AdminSchoolsApi.confirmUpload(uploadResult.upload.id);
      setUploadSuccess(`Successfully onboarded ${res.createdCount} schools!`);
      fetchSchools();
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setSelectedFile(null);
        setUploadResult(null);
        setUploadSuccess(null);
      }, 1500);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Failed to confirm school batch');
    } finally {
      setIsConfirming(false);
    }
  };

  // Metric stats
  const totalPages = Math.ceil(total / limit) || 1;
  const activeCount = useMemo(
    () => schools.filter((s) => s.status === 'ACTIVE').length,
    [schools],
  );
  const totalStudents = useMemo(
    () => schools.reduce((acc, curr) => acc + (curr.studentCount || 0), 0),
    [schools],
  );

  return (
    <div className="space-y-6 pb-12">
      {/* ─── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Building2 className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              School & Institution Management
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 font-medium">
            Onboard, configure, and monitor partner schools, examination centers, and candidate rosters
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => AdminSchoolsApi.downloadTemplate('xlsx')}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>Download Template</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedFile(null);
              setUploadResult(null);
              setUploadError(null);
              setIsBulkModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100/60"
          >
            <Upload className="h-3.5 w-3.5 text-indigo-600" />
            <span>Bulk Upload</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setAddError(null);
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add School</span>
          </Button>
        </div>
      </div>

      {/* ─── Metric Overview Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Schools
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{total}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Registered institutions</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Schools
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">{activeCount}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Verified & active on page</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Enrolled Students
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{totalStudents}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Across current schools</p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              State Reach
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <MapPin className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">{filterOptions.states.length || 0}</p>
          <p className="mt-1 text-[11px] font-semibold text-slate-400">Active regional states</p>
        </div>
      </div>

      {/* ─── Search & Filters Toolbar ───────────────────────────────── */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by school name, code, or city..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-xs font-semibold text-slate-800 placeholder-slate-400 transition-all focus:border-indigo-500 focus:bg-white focus:outline-hidden"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* State Filter */}
          <select
            value={stateFilter}
            onChange={(e) => {
              setStateFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="">All States</option>
            {filterOptions.states.map((st) => (
              <option key={st.id} value={st.id}>
                {st.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-all focus:border-indigo-500 focus:outline-hidden"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={fetchSchools}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh schools"
          >
            <RotateCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ─── Schools Data Table ─────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-4">School Name & Code</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4 text-center">Enrolled Students</th>
                <th className="py-3 px-4 text-center">Batches</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader label="Loading schools directory..." />
                  </td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-2">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <p className="font-bold text-slate-700">No schools found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search query or onboard a new school.
                    </p>
                  </td>
                </tr>
              ) : (
                schools.map((school) => (
                  <tr key={school.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold text-xs">
                          {school.code.slice(0, 3)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 leading-snug">{school.name}</p>
                          <p className="font-mono text-[10px] font-semibold text-slate-400">
                            Code: {school.code}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          {school.city || school.districtRef?.name || '—'}
                          {school.state || school.stateRef?.name
                            ? `, ${school.state || school.stateRef?.name}`
                            : ''}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {school.email ? (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3 text-slate-400" />
                          <span>{school.email}</span>
                        </div>
                      ) : null}
                      {school.phone ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-slate-400" />
                          <span>{school.phone}</span>
                        </div>
                      ) : null}
                      {!school.email && !school.phone && <span>—</span>}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700">
                        <Users className="h-3 w-3 text-indigo-500" />
                        <span>{school.studentCount || 0}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                        <Layers className="h-3 w-3 text-slate-500" />
                        <span>{school.batchCount || 0}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          school.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : school.status === 'SUSPENDED'
                              ? 'bg-red-50 text-red-700 border border-red-200/60'
                              : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        <span>{school.status}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedSchool(school)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition-colors"
                      >
                        <Eye className="h-3 w-3" />
                        <span>Details</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Footer ───────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/50 px-4 py-3 text-xs text-slate-500">
          <span>
            Showing <strong>{schools.length}</strong> of <strong>{total}</strong> schools
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: ADD SINGLE SCHOOL                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Building2 className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">Onboard New School</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {addError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddSchool} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    School Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                    placeholder="e.g. St. Xavier High School"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    School Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addForm.code}
                    onChange={(e) => setAddForm({ ...addForm, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. STX-001"
                    className="w-full font-mono uppercase rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={addForm.email || ''}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    placeholder="school@example.com"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={addForm.phone || ''}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    placeholder="+919876543210"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={addForm.state || ''}
                    onChange={(e) => setAddForm({ ...addForm, state: e.target.value })}
                    placeholder="e.g. Maharashtra"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">City / District</label>
                  <input
                    type="text"
                    value={addForm.city || ''}
                    onChange={(e) => setAddForm({ ...addForm, city: e.target.value })}
                    placeholder="e.g. Mumbai"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address</label>
                <textarea
                  rows={2}
                  value={addForm.address || ''}
                  onChange={(e) => setAddForm({ ...addForm, address: e.target.value })}
                  placeholder="Street / Campus address..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  isLoading={isSubmittingAdd}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                >
                  Confirm & Onboard
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: BULK UPLOAD WIZARD                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <FileSpreadsheet className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">Bulk Onboard Schools</h3>
              </div>
              <button
                onClick={() => setIsBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {uploadError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="mt-4 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{uploadSuccess}</span>
              </div>
            )}

            {!uploadResult ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center hover:border-indigo-400 transition-colors">
                  {isUploading ? (
                    <div className="py-6 space-y-3">
                      <Loader label={`Validating ${selectedFile?.name || 'spreadsheet'}...`} />
                      <p className="text-[11px] text-slate-400 font-semibold">
                        Parsing rows, checking duplicate codes, and verifying schema...
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="mx-auto h-10 w-10 text-indigo-500 mb-3" />
                      <p className="text-xs font-bold text-slate-800">
                        Select a CSV or XLSX spreadsheet with school records
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Columns: School Name, School Code, Email, Phone, State, City, Address
                      </p>

                      <label className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 cursor-pointer">
                        <span>Browse Spreadsheet</span>
                        <input
                          type="file"
                          accept=".csv, .xlsx, .xls"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span>Need the standard format?</span>
                  <button
                    type="button"
                    onClick={() => AdminSchoolsApi.downloadTemplate('xlsx')}
                    className="font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download Template</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {/* Validation Stats */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-indigo-50 p-2.5 text-center">
                    <p className="text-xs text-slate-500 font-semibold">Total Rows</p>
                    <p className="text-lg font-black text-indigo-700">
                      {uploadResult.upload.totalRows}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-center">
                    <p className="text-xs text-slate-500 font-semibold">Valid Schools</p>
                    <p className="text-lg font-black text-emerald-700">
                      {uploadResult.upload.validRows}
                    </p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-2.5 text-center">
                    <p className="text-xs text-slate-500 font-semibold">Invalid / Issues</p>
                    <p className="text-lg font-black text-red-700">
                      {uploadResult.upload.invalidRows}
                    </p>
                  </div>
                </div>

                {/* Staged Rows Preview Table */}
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 sticky top-0">
                      <tr>
                        <th className="p-2">Row</th>
                        <th className="p-2">Name</th>
                        <th className="p-2">Code</th>
                        <th className="p-2">State / City</th>
                        <th className="p-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {uploadResult.rows.map((row) => (
                        <tr key={row.id}>
                          <td className="p-2 font-mono text-slate-400">#{row.rowNumber}</td>
                          <td className="p-2 font-bold text-slate-800">{row.data.name}</td>
                          <td className="p-2 font-mono text-slate-600">{row.data.code}</td>
                          <td className="p-2 text-slate-500">
                            {row.data.city}, {row.data.state}
                          </td>
                          <td className="p-2 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                row.validationStatus === 'VALID'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {row.validationStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploadResult(null);
                      setSelectedFile(null);
                    }}
                  >
                    Upload Different File
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    disabled={uploadResult.upload.validRows === 0 || isConfirming}
                    isLoading={isConfirming}
                    onClick={handleConfirmUpload}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                  >
                    Confirm & Onboard ({uploadResult.upload.validRows}) Schools
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: VIEW SCHOOL DETAILS                                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Building2 className="h-4 w-4" />
                </span>
                <h3 className="text-base font-bold text-slate-900">School Profile</h3>
              </div>
              <button
                onClick={() => setSelectedSchool(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  School Name
                </p>
                <p className="text-sm font-black text-slate-900">{selectedSchool.name}</p>
                <p className="font-mono text-xs text-indigo-600 font-bold mt-0.5">
                  Code: {selectedSchool.code}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Students</p>
                  <p className="text-base font-black text-slate-900">
                    {selectedSchool.studentCount || 0}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-2.5">
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">Batches</p>
                  <p className="text-base font-black text-slate-900">
                    {selectedSchool.batchCount || 0}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <p className="flex items-center gap-2 text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {selectedSchool.address ? `${selectedSchool.address}, ` : ''}
                    {selectedSchool.city}, {selectedSchool.state}
                  </span>
                </p>
                {selectedSchool.email && (
                  <p className="flex items-center gap-2 text-slate-600">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedSchool.email}</span>
                  </p>
                )}
                {selectedSchool.phone && (
                  <p className="flex items-center gap-2 text-slate-600">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span>{selectedSchool.phone}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSchool(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchoolsPage;
