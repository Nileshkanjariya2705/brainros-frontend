import React, { useState } from 'react';
import {
  Users,
  Search,
  Download,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
} from 'lucide-react';
import {
  useInstitutionStudentsQuery,
  useInstitutionAdmissionYearsQuery,
  useInstitutionBatchesQuery,
  downloadInstituteStudentsExcel,
  InstituteStudentItem,
} from '../services/institutionDashboard.service';
import { SectionError } from '@/components/feedback/SectionError';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDebounce } from '@/hooks/useDebounce';

export const InstitutionStudentsPage: React.FC = () => {
  // ── Global Filter State for Student Directory ──
  const [studentSearch, setStudentSearch] = useState('');
  const debouncedStudentSearch = useDebounce(studentSearch, 350);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('');
  const [selectedAdmissionYear, setSelectedAdmissionYear] = useState<number | ''>('');
  const [studentPage, setStudentPage] = useState(1);
  const [studentLimit, setStudentLimit] = useState(10);
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // ── Queries ──
  const { data: batchesData = [] } = useInstitutionBatchesQuery();
  const { data: admissionYearsData = [] } = useInstitutionAdmissionYearsQuery();

  const {
    data: studentsData,
    isLoading: isStudentsLoading,
    isFetching: isStudentsFetching,
    error: studentsError,
    refetch: refetchStudents,
  } = useInstitutionStudentsQuery({
    page: studentPage,
    limit: studentLimit,
    search: debouncedStudentSearch,
    batchId: selectedBatchId || undefined,
    admissionYear: selectedAdmissionYear || undefined,
    sortBy,
    sortOrder,
  });

  // ── Handlers ──
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setStudentPage(1);
  };

  const handleClearFilters = () => {
    setStudentSearch('');
    setSelectedBatchId('');
    setSelectedAdmissionYear('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setStudentPage(1);
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      setExportError(null);
      await downloadInstituteStudentsExcel({
        search: studentSearch,
        batchId: selectedBatchId || undefined,
        admissionYear: selectedAdmissionYear || undefined,
      });
    } catch (err: any) {
      setExportError('Unable to generate Excel report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const hasActiveFilters = Boolean(
    studentSearch.trim() || selectedBatchId || selectedAdmissionYear !== '',
  );

  const studentList = Array.isArray(studentsData?.data) ? studentsData.data : [];
  const studentMeta = studentsData?.meta || {
    total: studentList.length,
    page: studentPage,
    limit: studentLimit,
    totalPages: Math.ceil(studentList.length / studentLimit) || 1,
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 backdrop-blur border border-indigo-400/30">
            <Users className="h-6 w-6 text-indigo-300" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Student Directory</h1>
            <p className="text-xs sm:text-sm text-indigo-200">
              Manage and inspect all enrolled institute students with real-time filters & export options
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetchStudents()}
            disabled={isStudentsFetching}
            title="Refresh student records"
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isStudentsFetching ? 'animate-spin' : ''}`} /> Refresh
          </button>

          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 active:scale-95 disabled:opacity-50 transition"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" /> Export Excel
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="border-b border-slate-200 bg-slate-50/50 p-5">
          {exportError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              {exportError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, ID, mobile, email..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setStudentPage(1);
                }}
                className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-10 pr-4 text-xs sm:text-sm placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
              />
            </div>

            {/* Batch Filter */}
            <div className="relative">
              <select
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  setStudentPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-3.5 pr-8 text-xs sm:text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
              >
                <option value="">All Batches</option>
                {batchesData.map((b) => (
                  <option key={b.id} value={b.id}>
                    Batch: {b.name}
                  </option>
                ))}
              </select>
              <Filter className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>

            {/* Admission Year Filter */}
            <div className="relative">
              <select
                value={selectedAdmissionYear}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : '';
                  setSelectedAdmissionYear(val);
                  setStudentPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2 pl-3.5 pr-8 text-xs sm:text-sm text-slate-700 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600 transition"
              >
                <option value="">All Admission Years</option>
                {admissionYearsData.map((yr) => (
                  <option key={yr} value={yr}>
                    Admission Year: {yr}
                  </option>
                ))}
              </select>
              <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-50 transition active:scale-95"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto relative">
          {isStudentsFetching && (
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-600 animate-pulse" />
          )}

          {studentsError && studentList.length === 0 ? (
            <div className="p-6">
              <SectionError
                title="Failed to load students"
                description="Unable to retrieve the student directory. Please try again or adjust your filters."
                onRetry={() => refetchStudents()}
              />
            </div>
          ) : isStudentsLoading && studentList.length === 0 ? (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Exam Target</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th className="py-3.5 px-4 text-center">Admission Year</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Enrolled On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><Skeleton className="h-4 w-32 rounded" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20 rounded" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-28 rounded" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-16 rounded" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20 rounded" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-24 rounded" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-4 w-12 rounded mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></td>
                    <td className="py-4 px-4"><Skeleton className="h-4 w-20 rounded" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : studentList.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">No students found</h3>
              <p className="mt-1 text-xs text-slate-500">
                {hasActiveFilters
                  ? 'No students match your active filter criteria.'
                  : 'No students have been enrolled in this institute yet.'}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
                >
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-semibold">
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none transition"
                  >
                    <div className="flex items-center gap-1.5">
                      Student Name
                      {sortBy === 'name' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-600" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('studentId')}
                    className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none transition"
                  >
                    <div className="flex items-center gap-1.5">
                      Student ID
                      {sortBy === 'studentId' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-600" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4">Exam Target</th>
                  <th className="py-3.5 px-4">Batch</th>
                  <th
                    onClick={() => handleSort('admissionYear')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:text-indigo-600 select-none transition"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      Admission Year
                      {sortBy === 'admissionYear' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-600" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:text-indigo-600 select-none transition"
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      Status
                      {sortBy === 'status' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-600" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('createdAt')}
                    className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none transition"
                  >
                    <div className="flex items-center gap-1.5">
                      Enrolled On
                      {sortBy === 'createdAt' ? (
                        sortOrder === 'asc' ? <ArrowUp className="h-3.5 w-3.5 text-indigo-600" /> : <ArrowDown className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentList.map((student: InstituteStudentItem) => (
                  <tr key={student.id} className="hover:bg-indigo-50/30 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{student.name}</div>
                      {student.email && (
                        <div className="text-xs text-slate-500 truncate max-w-[180px]">
                          {student.email}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-700">
                      {student.studentCode || student.studentId}
                    </td>
                    <td className="py-3 px-4 text-slate-700">{student.mobile}</td>
                    <td className="py-3 px-4 text-slate-700">{student.className}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                        {student.examTargetName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                        {student.batchName}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-medium text-slate-700">
                      {student.admissionYear || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          student.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : student.status === 'SUSPENDED'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(student.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {studentMeta.totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50/50 px-5 py-3.5 gap-4">
            <div className="text-xs text-slate-500">
              Showing{' '}
              <span className="font-bold text-slate-800">
                {(studentPage - 1) * studentLimit + (studentList.length > 0 ? 1 : 0)}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-800">
                {Math.min(studentPage * studentLimit, studentMeta.total)}
              </span>{' '}
              of <span className="font-bold text-slate-800">{studentMeta.total}</span> students
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <span>Rows:</span>
                <select
                  value={studentLimit}
                  onChange={(e) => {
                    setStudentLimit(Number(e.target.value));
                    setStudentPage(1);
                  }}
                  className="rounded-lg border border-slate-300 bg-white py-1 px-2 text-xs focus:border-indigo-600 focus:outline-none"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                  disabled={studentPage === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-xs font-semibold text-slate-700">
                  {studentPage} / {studentMeta.totalPages}
                </span>
                <button
                  onClick={() => setStudentPage((p) => Math.min(studentMeta.totalPages, p + 1))}
                  disabled={studentPage >= studentMeta.totalPages}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstitutionStudentsPage;
