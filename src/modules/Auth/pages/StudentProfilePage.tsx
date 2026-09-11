import { useState, useEffect } from 'react';
import {
  GraduationCap,
  User,
  Globe2,
  ShieldCheck,
  Smartphone,
  Mail,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Clock,
} from 'lucide-react';

// ** Components **
import Button from '@/components/ui/Button';

// ** Hooks & Services **
import { useStudentProfile } from '../hooks/useStudentProfile';
import { useGetRegisterOptionsAPI } from '../services';
import { useRole } from '../auth-access/useRole';
import type { OptionItem } from '../types/auth.types';

const StudentProfilePage = () => {
  const { profile, isLoading, error, successMessage, updateProfile, fetchProfile } =
    useStudentProfile();
  const { getRegisterOptionsAPI } = useGetRegisterOptionsAPI();
  const { isSuperAdmin, isAdmin, isStaff, activeRole } = useRole();
  const isAdministrativeUser = isSuperAdmin || isAdmin || isStaff;

  const [languages, setLanguages] = useState<OptionItem[]>([]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form editable state: ONLY Name and Preferred Language
  const [name, setName] = useState('');
  const [preferredLanguageId, setPreferredLanguageId] = useState('');

  // Read-only state for display
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  // 1. Fetch options (languages)
  useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await getRegisterOptionsAPI();
      if (data?.languages) {
        setLanguages(data.languages || []);
      }
    };
    fetchOptions();
  }, [getRegisterOptionsAPI]);

  // 2. Initialize profile data on load with database values
  useEffect(() => {
    if (profile) {
      setName(profile.name || (profile as any).email?.split('@')[0] || 'User Profile');
      setEmail((profile as any).user?.email || (profile as any).email || '');
      setMobile(
        (profile as any).user?.mobileNumber ||
          (profile as any).user?.phone ||
          (profile as any).mobileNumber ||
          (profile as any).phone ||
          '',
      );
      setPreferredLanguageId(
        profile.preferredLanguageId || (profile as any).preferredLanguage?.id || '',
      );
    }
  }, [profile]);

  const handleCopyCode = () => {
    const code = isAdministrativeUser
      ? (profile as any)?.user?.id || (profile as any)?.userId || profile?.studentCode || ''
      : profile?.studentCode || profile?.studentId || '';
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: name.trim(),
      preferredLanguageId: preferredLanguageId || undefined,
    });
    fetchProfile();
  };

  const pageTitle = isSuperAdmin
    ? 'Super Administrator Profile'
    : isAdmin
    ? 'Administrator Profile'
    : isStaff
    ? 'Staff Member Profile'
    : 'Student Profile';

  const pageSubtitle = isAdministrativeUser
    ? 'Manage your administrative identity, portal preferences, and security credentials'
    : 'Manage your official student identity, academic target goals, and portal preferences';

  const badgeLabel = isSuperAdmin
    ? 'Verified Super Admin'
    : isAdmin
    ? 'Verified Administrator'
    : isStaff
    ? 'Verified Staff'
    : 'Verified Student Profile';

  const accountId = isAdministrativeUser
    ? (profile as any)?.user?.id || (profile as any)?.userId || profile?.studentCode || 'ADMIN-ACCOUNT'
    : profile?.studentCode || profile?.studentId || 'BRN-2026-STUDENT';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            {isAdministrativeUser ? (
              <ShieldCheck className="h-8 w-8 text-brand-600" />
            ) : (
              <GraduationCap className="h-8 w-8 text-brand-600" />
            )}
            <span>{pageTitle}</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {pageSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>{badgeLabel}</span>
          </span>
        </div>
      </div>

      {/* Official ID Badge Card */}
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-indigo-50/70 to-purple-50 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          {isAdministrativeUser ? (
            <ShieldCheck className="w-48 h-48 text-brand-900" />
          ) : (
            <GraduationCap className="w-48 h-48 text-brand-900" />
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-brand-700 uppercase tracking-widest">
              {isAdministrativeUser ? 'Official Account ID' : 'Official Student ID & Code'}
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-wider">
                {accountId}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-600 hover:text-brand-600 border border-slate-200/80 shadow-xs transition"
                title="Copy Identifier"
              >
                {copiedCode ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 max-w-md">
              {isAdministrativeUser
                ? 'Your unique system account ID used across authentication, security audits, and administrative logs.'
                : 'Use this permanent unique ID or your registered mobile number for instant OTP passwordless login across all devices.'}
            </p>
          </div>

          <div className="bg-white/90 backdrop-blur-md rounded-xl p-4 border border-brand-100/80 shadow-xs space-y-1.5 text-xs sm:text-right">
            <div className="text-slate-500">
              Account Status:{' '}
              <strong className="text-emerald-700 font-bold uppercase">
                {profile?.status || 'ACTIVE'}
              </strong>
            </div>
            <div className="text-slate-500 flex sm:justify-end items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {isAdministrativeUser
                  ? activeRole || (isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN')
                  : 'Registered Student Portal'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Academic & Personal Information</h2>
            <p className="text-xs text-slate-500">
              Update your registered academic profile, target exams, and study medium
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start space-x-2.5 rounded-xl bg-rose-50 p-4 border border-rose-200 text-rose-800 text-xs">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start space-x-2.5 rounded-xl bg-emerald-50 p-4 border border-emerald-200 text-emerald-800 text-xs">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Editable Fields */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Editable Information
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-brand-600" />
                    <span>Full Legal Name</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Editable
                  </span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe2 className="h-4 w-4 text-brand-600" />
                    <span>Preferred Language</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Editable
                  </span>
                </label>
                <select
                  value={preferredLanguageId}
                  onChange={(e) => setPreferredLanguageId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
                >
                  <option value="">Select Preferred Language</option>
                  {languages.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Official Registered Details (Read-only) */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-700">
                  {isAdministrativeUser
                    ? 'Official Administrative & Account Details'
                    : 'Official Academic & Registration Details'}
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {isAdministrativeUser
                  ? 'System-level access control locks apply'
                  : 'Institutional registration locks apply'}
              </span>
            </div>

            {isAdministrativeUser ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Account / User ID */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      User ID
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-black text-slate-900 font-mono truncate">
                    {accountId}
                  </p>
                </div>

                {/* Primary Administrative Role */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Assigned Role
                    </span>
                    <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                      Privileged
                    </span>
                  </div>
                  <p className="text-xs font-black text-brand-700 font-mono">
                    {activeRole || (isSuperAdmin ? 'SUPER_ADMIN' : 'ADMIN')}
                  </p>
                </div>

                {/* Mobile Number */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Mobile Number
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-black text-slate-900 font-mono">
                    {mobile || (profile as any)?.user?.mobileNumber || (profile as any)?.user?.phone || '—'}
                  </p>
                </div>

                {/* Email */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Email Address
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {email || (profile as any)?.user?.email || '—'}
                  </p>
                </div>

                {/* Security Verification */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Verification
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Active
                    </span>
                  </div>
                  <p className="text-xs font-bold text-emerald-800">
                    MFA & Security Verified
                  </p>
                </div>

                {/* Governance Level */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Platform Access
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {isSuperAdmin ? 'Full Platform Governance' : 'Institutional Admin'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Student ID */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Student ID
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-black text-slate-900 font-mono">
                    {profile?.studentCode || profile?.studentId || 'BRN-10234'}
                  </p>
                </div>

                {/* Mobile Number */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Mobile Number
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-black text-slate-900 font-mono">
                    {mobile || (profile as any)?.user?.mobileNumber || (profile as any)?.user?.phone || '—'}
                  </p>
                </div>

                {/* Email */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Email
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {email || (profile as any)?.user?.email || '—'}
                  </p>
                </div>

                {/* State */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      State
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {profile?.state || (profile as any)?.stateRef?.name || '—'}
                  </p>
                </div>

                {/* City / District */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      City / District
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {profile?.district || (profile as any)?.districtRef?.name || '—'}
                  </p>
                </div>

                {/* School / College */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      School / College
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {profile?.schoolCollege || '—'}
                  </p>
                </div>

                {/* Exam Target */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Exam Target
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {(profile as any)?.examTarget?.name || (profile as any)?.examTarget || '—'}
                  </p>
                </div>

                {/* Class / Grade */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Class / Grade
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {(profile as any)?.studentClass?.name || (profile as any)?.class || '—'}
                  </p>
                </div>

                {/* Admission Year */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Admission Year
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/70 px-1.5 py-0.5 rounded">
                      Read-only
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {(profile as any)?.admissionYear || (profile as any)?.batch?.admissionYear || '2026'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end pt-4 border-t border-slate-100">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="shadow-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              <span>Save Changes</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Account Security & Contact Information Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span>Verified Contact Information</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Your login and examination communications are bound to these verified credentials
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-brand-600">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Registered Mobile Number
                </p>
                <p className="text-sm font-black text-slate-900 font-mono">
                  {(profile as any)?.user?.mobileNumber || (profile as any)?.user?.phone || '—'}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
              Verified
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-brand-600">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Registered Email Address
                </p>
                <p className="text-sm font-bold text-slate-900 truncate max-w-[180px]">
                  {(profile as any)?.user?.email || 'Not configured'}
                </p>
              </div>
            </div>
            {(profile as any)?.user?.email && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                Active
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfilePage;
