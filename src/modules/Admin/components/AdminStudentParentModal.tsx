import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Shield,
  Phone,
  Mail,
  User,
  HeartHandshake,
} from 'lucide-react';
import {
  type ParentLinkItem,
} from '../services/admin-students.service';
import {
  useAdminStudentParentsQuery,
  useAddStudentParentMutation,
  useDeleteStudentParentMutation,
} from '../services/admin.queries';
import Button from '@/components/ui/Button';
import Loader from '@/components/feedback/Loader';

interface AdminStudentParentModalProps {
  studentId: string;
  studentName?: string;
  studentCode?: string;
  isOpen: boolean;
  onClose: () => void;
  onParentUpdated?: () => void;
}

export const AdminStudentParentModal: React.FC<AdminStudentParentModalProps> = ({
  studentId,
  studentName,
  studentCode,
  isOpen,
  onClose,
  onParentUpdated,
}) => {
  const {
    data: parentData,
    isLoading: isLoadingParents,
  } = useAdminStudentParentsQuery(isOpen ? studentId : undefined);

  const {
    mutateAsync: addParentMutate,
    isPending: isAddingParent,
  } = useAddStudentParentMutation();

  const {
    mutateAsync: revokeParentMutate,
    isPending: isRevokingParent,
  } = useDeleteStudentParentMutation();

  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [relationship, setRelationship] = useState<'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER'>('FATHER');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && studentId) {
      setShowAddForm(false);
      setFormError(null);
      setFormSuccess(null);
      setName('');
      setMobile('');
      setEmail('');
      setRelationship('FATHER');
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const handleAddParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!name.trim()) {
      setFormError('Parent full name is required.');
      return;
    }
    const cleanMobile = mobile.replace(/\D/g, '');
    if (cleanMobile.length < 10) {
      setFormError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    try {
      await addParentMutate({
        studentId,
        payload: {
          name: name.trim(),
          mobile: cleanMobile,
          email: email.trim().toLowerCase(),
          relationship,
        },
      });

      setFormSuccess('Parent linked successfully!');
      setName('');
      setMobile('');
      setEmail('');
      setShowAddForm(false);
      if (onParentUpdated) onParentUpdated();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || err?.message || 'Failed to link parent.');
    }
  };

  const handleRevoke = async (linkId: string) => {
    if (!window.confirm('Are you sure you want to unlink/revoke this parent relationship?')) {
      return;
    }
    try {
      await revokeParentMutate({ studentId, linkId });
      if (onParentUpdated) onParentUpdated();
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to revoke parent link.');
    }
  };

  const activeParents = parentData?.parents?.filter((p) => p.status === 'ACTIVE') || [];
  const displayStudentName = parentData?.student?.name || studentName || 'Student';
  const displayStudentCode = parentData?.student?.studentCode || studentCode || '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Parent & Guardian Relationships</h3>
              <p className="text-xs text-slate-500">
                Student:{' '}
                <span className="font-semibold text-slate-800">{displayStudentName}</span> (
                <span className="font-mono text-teal-700">{displayStudentCode}</span>)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="max-h-[75vh] overflow-y-auto p-6 space-y-5">
          {/* Feedback alerts */}
          {formSuccess && (
            <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-semibold text-emerald-800 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-800 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          {isLoadingParents ? (
            <div className="py-12">
              <Loader label="Loading linked parent records..." />
            </div>
          ) : (
            <>
              {/* Linked Parents List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Linked Parents ({activeParents.length})
                  </h4>
                  {!showAddForm && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setShowAddForm(true)}
                      className="gap-1.5 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Parent</span>
                    </Button>
                  )}
                </div>

                {activeParents.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center space-y-2">
                    <User className="mx-auto h-8 w-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">
                      No parent is currently linked to this student.
                    </p>
                    <p className="text-xs text-slate-400">
                      Adding a parent creates a verified parent account allowing passwordless
                      guardian login.
                    </p>
                    {!showAddForm && (
                      <Button
                        size="sm"
                        onClick={() => setShowAddForm(true)}
                        className="mt-2 gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Link First Parent</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {activeParents.map((parent: ParentLinkItem) => (
                      <div
                        key={parent.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-teal-50 font-bold text-teal-800 text-sm">
                            {parent.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900">{parent.name}</span>
                              <span className="inline-flex rounded-full bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                                {parent.relationship}
                              </span>
                              <span className="inline-flex rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                                ACTIVE
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {parent.mobile}
                              </span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3 text-slate-400" />
                                {parent.email}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Linked: {new Date(parent.linkedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleRevoke(parent.id)}
                            disabled={isRevokingParent}
                            className="gap-1 text-xs"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Unlink</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Parent Form */}
              {showAddForm && (
                <div className="rounded-3xl border border-teal-200 bg-teal-50/40 p-5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-teal-100 pb-3">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-teal-700" />
                      <h4 className="text-sm font-bold text-slate-900">Add & Link Parent</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>

                  <form onSubmit={handleAddParent} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Parent Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Rajesh Patel"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Relationship <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={relationship}
                          onChange={(e) => setRelationship(e.target.value as any)}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
                        >
                          <option value="FATHER">Father</option>
                          <option value="MOTHER">Mother</option>
                          <option value="GUARDIAN">Guardian</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Mobile Number <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="parent@example.com"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-teal-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-teal-100">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isAddingParent}
                        className="gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
                      >
                        {isAddingParent ? (
                          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        ) : (
                          <Plus className="h-3.5 w-3.5" />
                        )}
                        <span>Save & Link Parent</span>
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-3.5 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-teal-600" />
            RBAC Governed Parental Access
          </span>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminStudentParentModal;
