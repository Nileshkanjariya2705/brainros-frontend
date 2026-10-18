import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Pencil,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  KeyRound,
  Lock,
  MapPin,
  ShieldCheck,
  User,
  Phone,
  Mail,
} from 'lucide-react';
import {
  type AdminStudentItem,
  type AdminStudentFilterOptions,
  useUpdateAdminStudentAPI,
} from '../services/admin-students.service';
import {
  useAdminStudentFilterOptionsQuery,
  useAdminStudentDetailQuery,
} from '../services/admin.queries';
import {
  fetchDistrictsByStateSlugAPI,
  getStateSlug,
  formatLocationName,
  type StateItem,
  type DistrictItem,
} from '@/modules/Auth/services';
import Button from '@/components/ui/Button';
import { toast } from '@/utils/toast';

export interface EditStudentModalProps {
  student: AdminStudentItem;
  filterOptions?: AdminStudentFilterOptions;
  publicStates?: StateItem[];
  onClose: () => void;
  onSuccess: () => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  filterOptions,
  publicStates,
  onClose,
  onSuccess,
}) => {
  const { updateAdminStudentAPI, isLoading: isUpdating } = useUpdateAdminStudentAPI();

  // Dynamic Master Data & Live Student Profile Queries from Backend
  const { data: backendFilterOptions } = useAdminStudentFilterOptionsQuery();
  const { data: backendStudentDetail } = useAdminStudentDetailQuery(student.id);

  const effectiveFilterOptions: AdminStudentFilterOptions = useMemo(() => {
    return backendFilterOptions || filterOptions || {
      states: [],
      districts: [],
      classes: [],
      examTargets: [],
      institutions: [],
      languages: [],
      admissionYears: [],
      statuses: [],
    };
  }, [backendFilterOptions, filterOptions]);

  // Basic Information
  const [name, setName] = useState(student.name || '');
  const [studentCode, setStudentCode] = useState(student.studentCode || student.studentId || '');
  const [email, setEmail] = useState(student.email === '—' ? '' : student.email || '');
  const [mobile, setMobile] = useState(student.mobile === '—' ? '' : student.mobile || '');

  // Account Security & Password
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Location
  const initialRawState = student.state?.name || '';
  const initialRawDistrict = student.district?.name || '';
  const [selectedState, setSelectedState] = useState(formatLocationName(initialRawState));
  const [selectedDistrict, setSelectedDistrict] = useState(formatLocationName(initialRawDistrict));
  const [modalDistricts, setModalDistricts] = useState<DistrictItem[]>([]);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);

  // Status & Verification
  const [status, setStatus] = useState(student.status || 'ACTIVE');
  const [isVerified, setIsVerified] = useState(student.isVerified ?? true);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Synchronize live student details when backend query finishes
  useEffect(() => {
    if (!backendStudentDetail) return;
    if (backendStudentDetail.name) setName(backendStudentDetail.name);
    if (backendStudentDetail.studentCode) setStudentCode(backendStudentDetail.studentCode);
    if (backendStudentDetail.email && backendStudentDetail.email !== '—') setEmail(backendStudentDetail.email);
    if (backendStudentDetail.mobile && backendStudentDetail.mobile !== '—') setMobile(backendStudentDetail.mobile);
    if (backendStudentDetail.status) setStatus(backendStudentDetail.status);
    if (typeof backendStudentDetail.isVerified === 'boolean') setIsVerified(backendStudentDetail.isVerified);
    if (backendStudentDetail.state?.name) setSelectedState(formatLocationName(backendStudentDetail.state.name));
    if (backendStudentDetail.district?.name) setSelectedDistrict(formatLocationName(backendStudentDetail.district.name));
  }, [backendStudentDetail]);

  // Load districts when state changes
  useEffect(() => {
    if (!selectedState) return;
    let isMounted = true;
    setIsLoadingDistricts(true);
    const slug = getStateSlug(selectedState);
    fetchDistrictsByStateSlugAPI(slug).then(({ data }) => {
      if (!isMounted) return;
      setIsLoadingDistricts(false);
      if (data && data.length > 0) {
        setModalDistricts(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedState]);

  const stateOptions = useMemo(() => {
    const statesSource = (publicStates && publicStates.length > 0) ? publicStates : (effectiveFilterOptions.states || []);
    const opts = statesSource.map((s) => {
      const formatted = formatLocationName(s.name);
      return { label: formatted, value: formatted, id: (s as any).id || (s as any).slug };
    });
    if (selectedState && !opts.some((o) => o.value.toLowerCase() === selectedState.toLowerCase())) {
      opts.unshift({ label: selectedState, value: selectedState, id: undefined });
    }
    return opts;
  }, [publicStates, effectiveFilterOptions.states, selectedState]);

  const districtOptions = useMemo(() => {
    const opts = modalDistricts.map((d) => {
      const formatted = formatLocationName(d.name);
      return { label: formatted, value: formatted, id: (d as any).id || (d as any).slug };
    });
    if (
      selectedDistrict &&
      !opts.some((o) => o.value.toLowerCase() === selectedDistrict.toLowerCase())
    ) {
      opts.unshift({ label: selectedDistrict, value: selectedDistrict, id: undefined });
    }
    return opts;
  }, [modalDistricts, selectedDistrict]);

  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextState = e.target.value;
    setSelectedState(nextState);
    setSelectedDistrict('');
    setModalDistricts([]);
    if (!nextState) return;

    setIsLoadingDistricts(true);
    const slug = getStateSlug(nextState);
    const { data } = await fetchDistrictsByStateSlugAPI(slug);
    setIsLoadingDistricts(false);
    if (data && data.length > 0) {
      setModalDistricts(data);
    }
  };

  const handleCopyCredentials = () => {
    const textToCopy = `Student ID: ${studentCode}\nPassword: ${newPassword || '(Unchanged)'}\nName: ${name}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCredentials(true);
    toast.success('Credentials copied to clipboard!');
    setTimeout(() => setCopiedCredentials(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Student full name is required.');
      return;
    }

    if (newPassword.trim() && newPassword.trim().length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    // Resolve State & District UUIDs
    const isUuid = (val?: string): boolean =>
      Boolean(val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val));

    const matchedStateObj = stateOptions.find(
      (s) => s.value.toLowerCase() === selectedState.trim().toLowerCase(),
    );
    const dbStateMatch = (effectiveFilterOptions.states || []).find(
      (s: any) =>
        s.name?.toLowerCase() === selectedState.trim().toLowerCase() ||
        s.code?.toLowerCase() === selectedState.trim().toLowerCase(),
    );
    const resolvedStateId = isUuid(dbStateMatch?.id)
      ? dbStateMatch?.id
      : isUuid(matchedStateObj?.id)
      ? matchedStateObj?.id
      : undefined;

    const matchedDistrictObj = districtOptions.find(
      (d) => d.value.toLowerCase() === selectedDistrict.trim().toLowerCase(),
    );
    const dbDistrictMatch = (effectiveFilterOptions.districts || []).find(
      (d: any) =>
        d.name?.toLowerCase() === selectedDistrict.trim().toLowerCase() &&
        (!resolvedStateId || !d.stateId || d.stateId === resolvedStateId),
    );
    const resolvedDistrictId = isUuid(dbDistrictMatch?.id)
      ? dbDistrictMatch?.id
      : isUuid(matchedDistrictObj?.id)
      ? matchedDistrictObj?.id
      : undefined;

    const payload: any = {
      name: name.trim(),
      email: email.trim() || undefined,
      mobile: mobile.trim() || undefined,
      state: selectedState.trim() || undefined,
      district: selectedDistrict.trim() || undefined,
      stateId: resolvedStateId,
      districtId: resolvedDistrictId,
      status: status || undefined,
      isVerified,
    };

    if (newPassword.trim()) {
      payload.password = newPassword.trim();
    }

    const { error } = await updateAdminStudentAPI(student.id, payload);
    if (error) {
      setErrorMsg(error);
    } else {
      setSuccessMsg('Student details and credentials updated successfully!');
      toast.success('Student profile updated successfully!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 700);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-white/10">
              <Pencil className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black tracking-tight">{student.name}</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-400/20 text-indigo-200 font-mono text-[11px] font-bold">
                  {studentCode || student.studentId}
                </span>
              </div>
              <p className="text-xs text-slate-300">Super Admin Complete Profile & Password Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white transition"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {errorMsg && (
            <div className="flex items-start space-x-2 rounded-2xl bg-rose-50 p-3.5 border border-rose-200 text-rose-800 font-medium">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-start space-x-2 rounded-2xl bg-emerald-50 p-3.5 border border-emerald-200 text-emerald-800 font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Section 1: Basic & Identity Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
              <User className="w-3.5 h-3.5 text-indigo-600" />
              <span>Student Identity & Contact Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter student full name"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                  required
                />
              </div>

              {/* Student Code / Roll Number (Read-only) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700">
                    Student Code / Roll No
                  </label>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-500 font-bold uppercase tracking-wider border border-slate-200 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Read-only
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={studentCode}
                    readOnly
                    placeholder="e.g. STU2026001"
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 pl-8 pr-3 py-2 text-xs font-mono font-bold text-slate-600 cursor-not-allowed select-all focus:outline-none uppercase"
                    title="Student Code is a permanent identifier and cannot be modified."
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
                <p className="text-[10px] text-slate-400">Permanent system identifier (immutable)</p>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  Mobile Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-2 text-xs font-mono text-slate-800 focus:border-indigo-600 focus:outline-none"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Password & Security (Crucial Requirement) */}
          <div className="space-y-3 rounded-2xl bg-amber-50/70 p-4 border border-amber-200/90 shadow-2xs">
            <div className="flex items-center justify-between pb-1 border-b border-amber-200/60">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-700" />
                <span className="font-extrabold text-amber-900 text-xs uppercase tracking-wide">
                  Student Login Password Management
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                Bcrypt Encrypted
              </span>
            </div>

            <p className="text-[11px] text-amber-800">
              Set or reset the student&apos;s password. The password is automatically hashed with 10 bcrypt salt rounds before database storage. Leave blank to preserve existing password.
            </p>

            <div className="space-y-2 pt-1">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new student password (min 6 characters)"
                    className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 pr-10 text-xs font-mono text-slate-900 focus:border-amber-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {newPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCredentials}
                    className="rounded-xl border-amber-300 text-amber-800 bg-white hover:bg-amber-100 gap-1 text-[11px] font-bold shrink-0"
                    title="Copy Student Code & Password"
                  >
                    {copiedCredentials ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-amber-600" />
                    )}
                    <span>{copiedCredentials ? 'Copied' : 'Copy'}</span>
                  </Button>
                )}
              </div>

              {newPassword && (
                <div className="flex items-center gap-2 text-[10px] text-amber-800">
                  <span className="font-bold">Credential Summary:</span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200">
                    ID: {studentCode}
                  </span>
                  <span className="font-mono bg-white px-2 py-0.5 rounded border border-amber-200">
                    Pass: {newPassword}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Location Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              <span>Location Details</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* State */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">State</label>
                <select
                  value={selectedState}
                  onChange={handleStateChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="">Select State</option>
                  {stateOptions.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* City / District */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">
                  City / District {isLoadingDistricts && '(Loading...)'}
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  disabled={!selectedState || isLoadingDistricts}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-none disabled:bg-slate-100"
                >
                  <option value="">Select City / District</option>
                  {districtOptions.map((dst) => (
                    <option key={dst.value} value={dst.value}>
                      {dst.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Account Status & Verification */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-black text-xs uppercase tracking-wider pb-1 border-b border-slate-100">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Account Lifecycle & Verification</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
              {/* Status */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">Student Account Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-800 focus:border-indigo-600 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Authorized to login and take exams)</option>
                  <option value="INACTIVE">INACTIVE (Temporarily disabled)</option>
                  <option value="SUSPENDED">SUSPENDED (Action blocked)</option>
                  <option value="PENDING">PENDING (Awaiting verification)</option>
                </select>
              </div>

              {/* Verified Toggle */}
              <div className="pt-4">
                <label className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Mark Account as Verified</span>
                    <span className="block text-[10px] text-slate-400">
                      Bypasses mobile/email OTP verification barriers
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isUpdating}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              size="sm"
              disabled={isUpdating}
              className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 px-5"
            >
              {isUpdating ? 'Saving Changes...' : 'Save All Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
