import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserCog,
  Plus,
  Search,
  Eye,
  Edit2,
  Power,
  Building2,
  Phone,
  Mail,
  X,
  RefreshCw,
} from 'lucide-react';
import {
  AdminStaffApi,
  type StaffUserItem,
  type CreateStaffPayload,
  type UpdateStaffPayload,
} from '../services/admin-staff.service';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';
import { toast } from '@/utils/toast';
import { ExportPdfButton } from '@/components/export/ExportPdfButton';

const ROLE_BADGES: Record<string, { label: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  ADMIN: { label: 'Admin', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  GENERAL_MANAGER: {
    label: 'General Manager',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  MANAGER: { label: 'Manager', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  OPERATOR: { label: 'Operator', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  ACCOUNTANT: { label: 'Accountant', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

export const StaffManagementPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewingStaff, setViewingStaff] = useState<StaffUserItem | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffUserItem | null>(null);

  // Form states for Create
  const [createForm, setCreateForm] = useState<CreateStaffPayload>({
    name: '',
    mobileNumber: '',
    email: '',
    role: 'OPERATOR',
  });

  // Form states for Edit
  const [editForm, setEditForm] = useState<UpdateStaffPayload>({
    name: '',
    email: '',
    role: 'OPERATOR',
  });

  // Fetch Staff List
  const {
    data: staffData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-staff', page, search, roleFilter, statusFilter],
    queryFn: () =>
      AdminStaffApi.getStaffList({
        page,
        limit: 50,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const staffList: StaffUserItem[] = useMemo(() => {
    if (Array.isArray(staffData)) return staffData;
    if (Array.isArray((staffData as any)?.data)) return (staffData as any).data;
    if (Array.isArray((staffData as any)?.data?.items)) return (staffData as any).data.items;
    if (Array.isArray((staffData as any)?.items)) return (staffData as any).items;
    return [];
  }, [staffData]);

  const pagination = useMemo(() => {
    const p =
      (staffData as any)?.meta ||
      (staffData as any)?.pagination ||
      (staffData as any)?.data?.pagination ||
      (staffData as any)?.data?.meta;
    return {
      total: p?.total ?? staffList.length,
      totalPages: p?.totalPages || p?.pages || 1,
    };
  }, [staffData, staffList]);

  // Create Staff Mutation
  const createMutation = useMutation({
    mutationFn: (payload: CreateStaffPayload) => AdminStaffApi.createStaff(payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Staff member created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
      setIsCreateModalOpen(false);
      setCreateForm({
        name: '',
        mobileNumber: '',
        email: '',
        role: 'OPERATOR',
      });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to create staff member.';
      toast.error(msg);
    },
  });

  // Update Staff Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStaffPayload }) =>
      AdminStaffApi.updateStaff(id, payload),
    onSuccess: (res) => {
      toast.success(res.message || 'Staff member updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
      setEditingStaff(null);
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update staff member.';
      toast.error(msg);
    },
  });

  // Toggle Status Mutation
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' }) =>
      AdminStaffApi.updateStaffStatus(id, status),
    onSuccess: (res) => {
      toast.success(res.message || 'Staff status updated!');
      queryClient.invalidateQueries({ queryKey: ['admin-staff'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || 'Failed to update status.';
      toast.error(msg);
    },
  });

  const handleOpenEdit = (staff: StaffUserItem) => {
    setEditingStaff(staff);
    setEditForm({
      name: staff.name || '',
      email: staff.email || '',
      role: ((staff.roles && staff.roles[0]) as any) || (staff as any).role || 'OPERATOR',
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <UserCog size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Management</h1>
            <p className="text-sm text-slate-500">
              Manage operational staff accounts, roles, institution scopes and status
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2"
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </Button>

          <ExportPdfButton
            resource="staff"
            filters={{ role: roleFilter, status: statusFilter }}
            search={search}
            page={page}
            pageSize={50}
            filename="staff-register.pdf"
          />

          <Button
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus size={16} />
            Create Staff
          </Button>
        </div>
      </div>

      {/* ── Filter & Search Toolbar ── */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, mobile, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="GENERAL_MANAGER">General Manager</option>
            <option value="MANAGER">Manager</option>
            <option value="OPERATOR">Operator</option>
            <option value="ACCOUNTANT">Accountant</option>
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* ── Staff Table (Section-level loader) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader label="Loading staff records..." />
          </div>
        ) : staffList.length === 0 ? (
          <div className="py-16 text-center">
            <UserCog size={44} className="mx-auto text-slate-300 mb-3" />
            <p className="text-base font-medium text-slate-700">No staff members found</p>
            <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
              Adjust your search filters or click "Create Staff" to add operational team members.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Staff Member</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Institution Scope</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created At</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {staffList.map((staff) => {
                  const rawRole = (staff.roles && staff.roles[0]) || (staff as any).role || 'OPERATOR';
                  const primaryRole =
                    typeof rawRole === 'object'
                      ? (rawRole as any)?.name || 'OPERATOR'
                      : String(rawRole);
                  const roleMeta = ROLE_BADGES[primaryRole] || {
                    label: primaryRole,
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                  };
                  const isActive = staff.status === 'ACTIVE';

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900">
                          {staff.name || 'Unnamed Staff'}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">ID: {staff.id.slice(0, 8)}...</div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Phone size={13} className="text-slate-400" />
                          <span className="font-mono text-xs">{staff.mobileNumber}</span>
                        </div>
                        {staff.email && (
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-0.5">
                            <Mail size={13} className="text-slate-400" />
                            <span>{staff.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${roleMeta.color}`}
                        >
                          {roleMeta.label}
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {staff.institutionName ? (
                          <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium">
                            <Building2 size={13} className="text-indigo-500" />
                            <span>{staff.institutionName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Platform-wide</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          {staff.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-xs text-slate-500">
                        {new Date(staff.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingStaff(staff)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title="View Staff Details"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(staff)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Staff Member"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              statusMutation.mutate({
                                id: staff.id,
                                status: isActive ? 'INACTIVE' : 'ACTIVE',
                              })
                            }
                            className={`p-1.5 rounded-lg transition ${
                              isActive
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isActive ? 'Deactivate Staff' : 'Activate Staff'}
                          >
                            <Power size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
            <span>
              Showing page {page} of {pagination.totalPages} ({pagination.total} total staff)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE STAFF MODAL ── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Plus size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Create Staff Account</h2>
                <p className="text-xs text-slate-500">Staff will log in via Mobile OTP</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!createForm.name.trim()) {
                  toast.error('Staff name is required.');
                  return;
                }
                const cleanedPhone = (createForm.mobileNumber || '').replace(/\D/g, '');
                if (cleanedPhone.length !== 10) {
                  toast.error('Mobile/phone number must be exactly 10 digits.');
                  return;
                }
                createMutation.mutate({
                  ...createForm,
                  mobileNumber: cleanedPhone,
                  phoneNumber: cleanedPhone,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Phone / Mobile Number * <span className="text-indigo-600 font-bold">(Must be unique)</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  value={createForm.mobileNumber}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      mobileNumber: e.target.value.replace(/\D/g, ''),
                    })
                  }
                  placeholder="9876543210"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter 10-digit number. Phone number must be unique across all system accounts.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="staff@example.com"
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Staff Role *
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      role: e.target.value as any,
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="OPERATOR">Operator (Operational tasks, questions, exams)</option>
                  <option value="MANAGER">Manager (Operational + management tasks)</option>
                  <option value="GENERAL_MANAGER">General Manager (Broad management oversight)</option>
                  <option value="ACCOUNTANT">Accountant (Billing & institutional invoices)</option>
                  <option value="ADMIN">Admin (Academic & system administration)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Staff Member'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT STAFF MODAL ── */}
      {editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setEditingStaff(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Edit2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Staff Account</h2>
                <p className="text-xs text-slate-500">Mobile: {editingStaff.mobileNumber}</p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({ id: editingStaff.id, payload: editForm });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Staff Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      role: e.target.value as any,
                    })
                  }
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white"
                >
                  <option value="OPERATOR">Operator</option>
                  <option value="MANAGER">Manager</option>
                  <option value="GENERAL_MANAGER">General Manager</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingStaff(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={updateMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIEW STAFF DETAILS MODAL ── */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setViewingStaff(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                {(viewingStaff.name || 'S').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">{viewingStaff.name || 'Staff User'}</h3>
                <p className="text-xs text-slate-400 font-mono">User ID: {viewingStaff.id}</p>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Mobile:</span>
                <span className="font-semibold text-slate-800 font-mono">{viewingStaff.mobileNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">{viewingStaff.email || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Role:</span>
                <span className="font-semibold text-indigo-600">{viewingStaff.roles.join(', ')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Institution:</span>
                <span className="font-medium text-slate-800">{viewingStaff.institutionName || 'Platform-wide'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Account Status:</span>
                <span className="font-semibold text-emerald-600">{viewingStaff.status}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Joined On:</span>
                <span className="text-slate-700">
                  {new Date(viewingStaff.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setViewingStaff(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementPage;
