import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
  type HeaderGroup,
  type Header,
  type Row,
  type Cell,
  flexRender,
} from '@tanstack/react-table';
import {
  Search,
  RotateCw,
  X,
  User,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ShieldCheck,
  AlertCircle,
  Eye,
  Users,
  Pencil,
} from 'lucide-react';
import {
  type AdminStudentItem,
  type AdminStudentFilterOptions,
} from '../services/admin-students.service';
import {
  useAdminStudentsQuery,
  useAdminStudentFilterOptionsQuery,
} from '../services/admin.queries';
import { useStatesQuery } from '@/services/location.queries';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { ExportPdfButton } from '@/components/export/ExportPdfButton';
import { EditStudentModal } from '../components/EditStudentModal';

/* ── Main Admin Students Page ───────────────────────────────────────────── */
export const AdminStudentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Master Data Filter Options from backend cached query
  const { data: filterOptionsData } = useAdminStudentFilterOptionsQuery();
  const filterOptions: AdminStudentFilterOptions = filterOptionsData || {
    states: [],
    districts: [],
    classes: [],
    examTargets: [],
    institutions: [],
    statuses: [],
  };

  // Search Debounce State
  const urlSearch = searchParams.get('search') || '';
  const [searchInput, setSearchInput] = useState<string>(urlSearch);

  // Modal States
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<AdminStudentItem | null>(null);
  const [editingStudent, setEditingStudent] = useState<AdminStudentItem | null>(null);

  // Synchronize URL query params
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize')) || 10));
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc';
  const statusFilter = searchParams.get('status') || '';
  const classFilter = searchParams.get('classId') || '';
  const examTargetFilter = searchParams.get('examTargetId') || '';
  const institutionFilter = searchParams.get('institutionId') || '';

  // Public Location API State list cached via TanStack Query for modal editing
  const { data: publicStatesData } = useStatesQuery();
  const publicStates = (publicStatesData as any) || [];

  // Server-side cached table query with keepPreviousData to prevent blank loading flash
  const queryParams = useMemo(
    () => ({
      page,
      pageSize,
      search: urlSearch,
      sortBy,
      sortOrder,
      status: statusFilter || undefined,
      classId: classFilter || undefined,
      examTargetId: examTargetFilter || undefined,
      institutionId: institutionFilter || undefined,
    }),
    [
      page,
      pageSize,
      urlSearch,
      sortBy,
      sortOrder,
      statusFilter,
      classFilter,
      examTargetFilter,
      institutionFilter,
    ],
  );

  const {
    data: studentsData,
    isLoading: isLoadingStudents,
    isFetching: isFetchingStudents,
    isError: isLoadError,
    refetch: fetchStudents,
  } = useAdminStudentsQuery(queryParams);

  const isStudentsLoadingState = isLoadingStudents || isFetchingStudents;

  const students = studentsData?.items || [];
  const totalCount = studentsData?.pagination?.total || 0;
  const totalPages = studentsData?.pagination?.totalPages || 1;

  // Update URL search params helper
  const updateQueryParams = useCallback(
    (updates: Record<string, string | number | undefined | null>, resetPage = false) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, val]) => {
          if (val === undefined || val === null || val === '') {
            next.delete(key);
          } else {
            next.set(key, String(val));
          }
        });
        if (resetPage) {
          next.set('page', '1');
        }
        return next;
      });
    },
    [setSearchParams],
  );

  // Debounce search input changes (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== urlSearch) {
        updateQueryParams({ search: searchInput.trim() }, true);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput, urlSearch, updateQueryParams]);

  // Keep search input in sync if URL changes externally
  useEffect(() => {
    setSearchInput(urlSearch);
  }, [urlSearch]);

  // Reset Filters
  const handleClearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams({ page: '1', pageSize: String(pageSize) }));
  };

  const hasActiveFilters = Boolean(
    urlSearch ||
      statusFilter ||
      classFilter ||
      examTargetFilter ||
      institutionFilter,
  );

  // TanStack Table Column Definitions
  const columns = useMemo<ColumnDef<AdminStudentItem, any>[]>(
    () => [
      {
        accessorKey: 'studentCode',
        header: 'Student ID',
        enableSorting: true,
        cell: (info) => (
          <div className="font-mono text-xs font-bold text-teal-800">
            {info.row.original.studentCode}
          </div>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Student Name',
        enableSorting: true,
        cell: (info) => (
          <div className="space-y-0.5">
            <div className="font-bold text-slate-900 text-xs sm:text-sm">{info.row.original.name}</div>
            <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
              {info.row.original.schoolCollege}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'email',
        header: 'Contact Info',
        enableSorting: true,
        cell: (info) => (
          <div className="space-y-0.5 text-xs text-slate-600">
            <div className="font-medium truncate max-w-[180px]">{info.row.original.email}</div>
            <div className="font-mono text-[11px] text-slate-400">{info.row.original.mobile}</div>
          </div>
        ),
      },
      {
        id: 'classAndTarget',
        header: 'Class & Target',
        enableSorting: false,
        cell: (info) => {
          const s = info.row.original;
          const hasFlags = s.jee || s.cet || s.neet;
          return (
            <div className="space-y-1">
              <div className="inline-flex rounded-md bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                {s.class?.name || 'Class —'}
              </div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {hasFlags ? (
                  <>
                    {s.jee && (
                      <span className="inline-flex rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                        JEE
                      </span>
                    )}
                    {s.cet && (
                      <span className="inline-flex rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                        CET
                      </span>
                    )}
                    {s.neet && (
                      <span className="inline-flex rounded-md bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                        NEET
                      </span>
                    )}
                  </>
                ) : (
                  <div className="inline-flex rounded-md bg-purple-50 border border-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                    {s.examTarget?.name || 'Exam —'}
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: 'location',
        header: 'Location',
        enableSorting: false,
        cell: (info) => (
          <div className="text-xs text-slate-600 space-y-0.5">
            <div className="font-semibold text-slate-800">{info.row.original.district?.name || '—'}</div>
            <div className="text-[11px] text-slate-400">{info.row.original.state?.name || '—'}</div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        enableSorting: true,
        cell: (info) => {
          const status = info.row.original.status;
          const statusStyles: Record<string, string> = {
            ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
            SUSPENDED: 'bg-rose-50 text-rose-700 border-rose-200',
            INACTIVE: 'bg-slate-100 text-slate-600 border-slate-200',
            ARCHIVED: 'bg-zinc-100 text-zinc-600 border-zinc-200',
          };
          return (
            <span
              className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-black ${
                statusStyles[status] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {status}
            </span>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Registered',
        enableSorting: true,
        cell: (info) => (
          <div className="text-xs text-slate-500 font-medium">
            {new Date(info.row.original.createdAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </div>
        ),
      },
      {
        id: 'actions',
        header: () => <div className="text-right">Actions</div>,
        enableSorting: false,
        cell: (info) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => setSelectedStudentDetails(info.row.original)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              title="View Details"
            >
              <Eye className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden sm:inline">View</span>
            </button>
            <button
              onClick={() => setEditingStudent(info.row.original)}
              className="inline-flex items-center gap-1 rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-1.5 text-xs font-bold text-teal-700 shadow-xs hover:bg-teal-100 transition"
              title="Edit Student"
            >
              <Pencil className="h-3.5 w-3.5 text-teal-600" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          </div>
        ),
      },
    ],
    [],
  );

  // TanStack Table Instance
  const table = useReactTable({
    data: students,
    columns,
    pageCount: totalPages,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    state: {
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
      sorting: [
        {
          id: sortBy,
          desc: sortOrder === 'desc',
        },
      ],
    },
    onPaginationChange: (updater: any) => {
      const nextPagination =
        typeof updater === 'function'
          ? updater({ pageIndex: page - 1, pageSize })
          : updater;
      updateQueryParams({
        page: nextPagination.pageIndex + 1,
        pageSize: nextPagination.pageSize,
      });
    },
    onSortingChange: (updater: any) => {
      const nextSorting =
        typeof updater === 'function'
          ? updater([{ id: sortBy, desc: sortOrder === 'desc' }])
          : updater;
      if (nextSorting.length > 0) {
        updateQueryParams({
          sortBy: nextSorting[0].id,
          sortOrder: nextSorting[0].desc ? 'desc' : 'asc',
        });
      }
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-50 border border-teal-200 text-teal-800 flex items-center gap-1">
              <ShieldCheck size={13} className="text-teal-600" />
              RBAC Authorized
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 border border-indigo-200 text-indigo-700">
              Student Directory
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 mt-1">
            Student Management
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            High-performance directory for viewing, editing, and managing registered students.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="secondary"
            onClick={() => fetchStudents()}
            className="gap-1.5"
            size="sm"
          >
            <RotateCw size={14} className={isLoadingStudents ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </Button>

          <ExportPdfButton
            resource="students"
            filters={{
              status: statusFilter,
              classId: classFilter,
              examTargetId: examTargetFilter,
              institutionId: institutionFilter,
            }}
            search={searchInput}
            page={page}
            pageSize={pageSize}
            filename="students-directory.pdf"
          />
        </div>
      </div>

      {/* ── Search & Filter Panel ─────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Debounced Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by student name, ID, email, mobile, school..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-10 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:border-teal-600 focus:bg-white focus:outline-none transition"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('');
                  updateQueryParams({ search: undefined }, true);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleClearFilters}
              className="gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear Filters</span>
            </Button>
          )}
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1 border-t border-slate-100">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => updateQueryParams({ status: e.target.value }, true)}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-teal-600 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {filterOptions.statuses.map((st) => (
                <option key={st.value} value={st.value}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Class
            </label>
            <select
              value={classFilter}
              onChange={(e) => updateQueryParams({ classId: e.target.value }, true)}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-teal-600 focus:outline-none"
            >
              <option value="">All Classes</option>
              {filterOptions.classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Target Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Exam Target
            </label>
            <select
              value={examTargetFilter}
              onChange={(e) => updateQueryParams({ examTargetId: e.target.value }, true)}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-teal-600 focus:outline-none"
            >
              <option value="">All Exam Targets</option>
              {filterOptions.examTargets.map((tgt) => (
                <option key={tgt.id} value={tgt.id}>
                  {tgt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Institution Filter (Loaded from Database Bulk Import) */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
              Institution (DB)
            </label>
            <select
              value={institutionFilter}
              onChange={(e) => updateQueryParams({ institutionId: e.target.value }, true)}
              className="w-full rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:border-teal-600 focus:outline-none"
            >
              <option value="">All Institutions</option>
              {filterOptions.institutions.map((inst) => (
                <option key={inst.id} value={inst.id}>
                  {inst.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Table Container ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {isLoadError && (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-500" />
            <h3 className="text-base font-bold text-slate-800">Unable to load students</h3>
            <p className="text-xs text-slate-500">
              An unexpected error occurred while communicating with the student directory service.
            </p>
            <Button size="sm" onClick={() => fetchStudents()}>
              Retry
            </Button>
          </div>
        )}

        {!isLoadError && (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  {table.getHeaderGroups().map((headerGroup: HeaderGroup<AdminStudentItem>) => (
                    <tr
                      key={headerGroup.id}
                      className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-400 font-bold"
                    >
                      {headerGroup.headers.map((header: Header<AdminStudentItem, unknown>) => {
                        const isSortable = header.column.getCanSort();
                        const sortState = header.column.getIsSorted();
                        return (
                          <th
                            key={header.id}
                            className={`px-5 py-3.5 ${
                              isSortable ? 'cursor-pointer select-none hover:text-slate-700' : ''
                            }`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            <div className="flex items-center gap-1.5">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {isSortable && (
                                <span className="text-slate-400">
                                  {sortState === 'asc' ? (
                                    <ArrowUp className="h-3.5 w-3.5 text-teal-700" />
                                  ) : sortState === 'desc' ? (
                                    <ArrowDown className="h-3.5 w-3.5 text-teal-700" />
                                  ) : (
                                    <ArrowUpDown className="h-3.5 w-3.5 opacity-40 hover:opacity-100" />
                                  )}
                                </span>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  ))}
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {isStudentsLoadingState ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <tr key={`skeleton-${idx}`} className="animate-pulse">
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-32 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-28 mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-5 w-24" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </td>
                        <td className="px-5 py-4">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Skeleton className="h-7 w-20 rounded-xl ml-auto" />
                        </td>
                      </tr>
                    ))
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-16 text-center space-y-2">
                        <Users className="mx-auto h-10 w-10 text-slate-300" />
                        <h4 className="text-base font-bold text-slate-800">
                          {hasActiveFilters
                            ? 'No students match your current filters.'
                            : 'No students found.'}
                        </h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          {hasActiveFilters
                            ? 'Try clearing some search terms or filter dropdowns to see more student records.'
                            : 'New registered students will automatically appear in this directory.'}
                        </p>
                        {hasActiveFilters && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleClearFilters}
                            className="mt-2 text-xs"
                          >
                            Clear Filters
                          </Button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row: Row<AdminStudentItem>) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 transition">
                        {row.getVisibleCells().map((cell: Cell<AdminStudentItem, unknown>) => (
                          <td key={cell.id} className="px-5 py-3.5">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-slate-100">
              {isStudentsLoadingState ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="p-4 space-y-3 animate-pulse">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-2xl">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : students.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <Users className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">No students match criteria.</p>
                  {hasActiveFilters && (
                    <Button size="sm" variant="secondary" onClick={handleClearFilters}>
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                students.map((student) => (
                  <div key={student.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-[11px] font-bold text-teal-800">
                          {student.studentCode}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{student.name}</h4>
                        <div className="text-xs text-slate-400">{student.schoolCollege}</div>
                      </div>
                      <span className="inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black bg-emerald-50 text-emerald-700 border-emerald-200">
                        {student.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-2xl">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Class</span>
                        <span className="font-semibold text-slate-800">
                          {student.class?.name || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block">Target</span>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {student.jee && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">JEE</span>
                          )}
                          {student.cet && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">CET</span>
                          )}
                          {student.neet && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">NEET</span>
                          )}
                          {!student.jee && !student.cet && !student.neet && (
                            <span className="font-semibold text-slate-800">{student.examTarget?.name || '—'}</span>
                          )}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-400 uppercase block">City</span>
                        <span className="font-semibold text-slate-800">
                          {student.district?.name || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-[11px] text-slate-400 font-mono">
                        {student.mobile !== '—' ? student.mobile : student.email}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedStudentDetails(student)}
                          className="gap-1 text-xs"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => setEditingStudent(student)}
                          className="gap-1 text-xs bg-teal-600 hover:bg-teal-700 text-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ── Pagination Bar ─────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-slate-50/50 px-5 py-3.5 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-4">
                <span>
                  Showing <strong className="text-slate-800">{startItem}</strong>–
                  <strong className="text-slate-800">{endItem}</strong> of{' '}
                  <strong className="text-slate-800">{totalCount.toLocaleString()}</strong> students
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => updateQueryParams({ pageSize: Number(e.target.value) }, true)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 focus:border-teal-600 focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => table.setPageIndex(0)}
                  disabled={page <= 1 || isLoadingStudents}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="First Page"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => table.previousPage()}
                  disabled={page <= 1 || isLoadingStudents}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-3 py-1 font-semibold text-slate-700">
                  Page {page} of {totalPages}
                </span>

                <button
                  onClick={() => table.nextPage()}
                  disabled={page >= totalPages || isLoadingStudents}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => table.setPageIndex(totalPages - 1)}
                  disabled={page >= totalPages || isLoadingStudents}
                  className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Last Page"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Student Details Modal ──────────────────────────────────── */}
      {selectedStudentDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedStudentDetails.name}</h3>
                  <p className="font-mono text-xs text-teal-700">{selectedStudentDetails.studentCode}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentDetails(null)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Email</span>
                  <span className="font-medium text-slate-800 break-all">{selectedStudentDetails.email}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Mobile</span>
                  <span className="font-mono font-medium text-slate-800">{selectedStudentDetails.mobile}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Class & Target</span>
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    <span className="font-semibold text-slate-800 mr-1">
                      {selectedStudentDetails.class?.name || '—'}
                    </span>
                    {selectedStudentDetails.jee && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">JEE</span>
                    )}
                    {selectedStudentDetails.cet && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">CET</span>
                    )}
                    {selectedStudentDetails.neet && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">NEET</span>
                    )}
                    {!selectedStudentDetails.jee && !selectedStudentDetails.cet && !selectedStudentDetails.neet && (
                      <span className="font-semibold text-slate-800">{selectedStudentDetails.examTarget?.name || '—'}</span>
                    )}
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">Location</span>
                  <span className="font-semibold text-slate-800">
                    {selectedStudentDetails.district?.name}, {selectedStudentDetails.state?.name}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] uppercase text-slate-400 font-bold block">School / College</span>
                <span className="font-semibold text-slate-800">{selectedStudentDetails.schoolCollege}</span>
              </div>

              {selectedStudentDetails.institutions.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-[10px] uppercase text-slate-400 font-bold block">
                    Associated Institutions & Batches
                  </span>
                  {selectedStudentDetails.institutions.map((inst) => (
                    <div key={inst.id} className="flex items-center justify-between text-xs font-semibold text-slate-700">
                      <span>{inst.name} ({inst.code})</span>
                      {inst.batchName && <span className="text-teal-700">{inst.batchName}</span>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                <span>Created: {new Date(selectedStudentDetails.createdAt).toLocaleString()}</span>
                <span className="font-bold text-emerald-700">{selectedStudentDetails.status}</span>
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-6 py-3 flex justify-end gap-2">
              <Button
                size="sm"
                variant="primary"
                onClick={() => {
                  setEditingStudent(selectedStudentDetails);
                  setSelectedStudentDetails(null);
                }}
                className="bg-teal-600 hover:bg-teal-700 text-white gap-1"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit Student
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setSelectedStudentDetails(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Student Modal ────────────────────────────────────── */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          filterOptions={filterOptions}
          publicStates={publicStates}
          onClose={() => setEditingStudent(null)}
          onSuccess={() => fetchStudents()}
        />
      )}
    </div>
  );
};

export default AdminStudentsPage;
