import { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  User,
  MapPin,
  Building2,
  BookOpen,
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
import {
  useGetRegisterOptionsAPI,
  fetchAllStatesAPI,
  fetchDistrictsByStateSlugAPI,
  getStateSlug,
  formatLocationName,
  type StateItem,
  type DistrictItem,
} from '../services';
import type { OptionItem } from '../types/auth.types';

const StudentProfilePage = () => {
  const { profile, isLoading, error, successMessage, updateProfile, fetchProfile } =
    useStudentProfile();
  const { getRegisterOptionsAPI } = useGetRegisterOptionsAPI();

  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [languages, setLanguages] = useState<OptionItem[]>([]);
  const [examTargets, setExamTargets] = useState<OptionItem[]>([]);
  const [statesList, setStatesList] = useState<StateItem[]>([]);
  const [districtsList, setDistrictsList] = useState<DistrictItem[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [statesError, setStatesError] = useState<string | null>(null);
  const [districtsError, setDistrictsError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Form editable state
  const [name, setName] = useState('');
  const [schoolCollege, setSchoolCollege] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [classId, setClassId] = useState('');
  const [examTargetId, setExamTargetId] = useState('');
  const [preferredLanguageId, setPreferredLanguageId] = useState('');

  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  // 1. Fetch States list from India Pincode API on mount
  useEffect(() => {
    let isMounted = true;
    const initStates = async () => {
      setIsLoadingStates(true);
      setStatesError(null);
      const { data, error: sErr } = await fetchAllStatesAPI();
      if (!isMounted) return;
      setIsLoadingStates(false);
      if (data && data.length > 0) {
        setStatesList(data);
      }
      if (sErr) setStatesError(sErr);
    };
    initStates();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch options (classes, targets, languages) - Exclude FOUNDATION, include DROPPER
  useEffect(() => {
    const fetchOptions = async () => {
      const { data } = await getRegisterOptionsAPI();
      if (data) {
        setClasses(
          (data.classes || []).filter(
            (c: any) =>
              !c.name?.toLowerCase().includes('foundation') &&
              !c.code?.toLowerCase().includes('foundation'),
          ),
        );
        setLanguages(data.languages || []);
        setExamTargets(data.examTargets || []);
      }
    };
    fetchOptions();
  }, [getRegisterOptionsAPI]);

  // 3. Initialize profile data on load with database values
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
      setSchoolCollege(profile.schoolCollege || '');

      const rawState = profile.state || (profile as any).stateRef?.name || '';
      const rawDistrict = profile.district || (profile as any).districtRef?.name || '';
      const st = formatLocationName(rawState);
      const dt = formatLocationName(rawDistrict);

      setSelectedState(st);
      setSelectedDistrict(dt);

      // Auto-load districts if state is present
      if (st) {
        const slug = getStateSlug(st);
        setIsLoadingDistricts(true);
        setDistrictsError(null);
        fetchDistrictsByStateSlugAPI(slug).then(({ data, error: dErr }) => {
          setIsLoadingDistricts(false);
          if (data && data.length > 0) {
            setDistrictsList(data);
            const matched = data.find(
              (d) =>
                formatLocationName(d.name).toLowerCase() === dt.toLowerCase() ||
                d.name.toLowerCase() === dt.toLowerCase(),
            );
            if (matched) {
              setSelectedDistrict(formatLocationName(matched.name));
            }
          }
          if (dErr) setDistrictsError(dErr);
        });
      }

      const currentClassId = profile.classId || (profile as any).studentClass?.id || '';
      setClassId(currentClassId);
      setExamTargetId(profile.examTargetId || (profile as any).examTarget?.id || '');
      setPreferredLanguageId(
        profile.preferredLanguageId || (profile as any).preferredLanguage?.id || '',
      );
    }
  }, [profile]);

  // Normalized dropdown options using Title Case matching registration flow
  const stateOptions = useMemo(() => {
    const opts = statesList.map((s) => {
      const formatted = formatLocationName(s.name);
      return { label: formatted, value: formatted };
    });
    // Ensure the state loaded from DB is selectable even before external API completes
    if (
      selectedState &&
      !opts.some((o) => o.value.toLowerCase() === selectedState.toLowerCase())
    ) {
      opts.unshift({ label: selectedState, value: selectedState });
    }
    return opts;
  }, [statesList, selectedState]);

  const districtOptions = useMemo(() => {
    const opts = districtsList.map((d) => {
      const formatted = formatLocationName(d.name);
      return { label: formatted, value: formatted };
    });
    // Ensure the city loaded from DB is selectable immediately without showing blank
    if (
      selectedDistrict &&
      !opts.some((o) => o.value.toLowerCase() === selectedDistrict.toLowerCase())
    ) {
      opts.unshift({ label: selectedDistrict, value: selectedDistrict });
    }
    return opts;
  }, [districtsList, selectedDistrict]);

  const handleCopyCode = () => {
    const code = profile?.studentCode || profile?.studentId || '';
    if (code) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Dynamic State Change -> Clear City & load new cities
  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextState = e.target.value;
    setSelectedState(nextState);
    setSelectedDistrict(''); // Clear previous district immediately
    setDistrictsList([]);
    setDistrictsError(null);

    if (!nextState) return;

    const matchedState = statesList.find(
      (s) =>
        s.name.toLowerCase() === nextState.toLowerCase() ||
        formatLocationName(s.name).toLowerCase() === nextState.toLowerCase(),
    );
    const slug = matchedState?.slug || getStateSlug(nextState);

    setIsLoadingDistricts(true);
    const { data, error: dErr } = await fetchDistrictsByStateSlugAPI(slug);
    setIsLoadingDistricts(false);

    if (data && data.length > 0) {
      setDistrictsList(data);
    }
    if (dErr) {
      setDistrictsError(dErr);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name: name.trim(),
      email: email.trim() || undefined,
      mobileNumber: mobile.trim() || undefined,
      password: password.trim() || undefined,
      schoolCollege: schoolCollege.trim(),
      state: selectedState || undefined,
      district: selectedDistrict || undefined,
      classId: classId || undefined,
      examTargetId: examTargetId || undefined,
      preferredLanguageId: preferredLanguageId || undefined,
    });
    setPassword('');
    fetchProfile();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <GraduationCap className="h-8 w-8 text-brand-600" />
            <span>Student Profile</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your official student identity, academic target goals, and portal preferences
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Verified Student Profile</span>
          </span>
        </div>
      </div>

      {/* Official Student ID Badge Card */}
      <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-indigo-50/70 to-purple-50 p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <GraduationCap className="w-48 h-48 text-brand-900" />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-brand-700 uppercase tracking-widest">
              Official Student ID & Code
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-wider">
                {profile?.studentCode || profile?.studentId || 'BRN-2026-STUDENT'}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-600 hover:text-brand-600 border border-slate-200/80 shadow-xs transition"
                title="Copy Student Code"
              >
                {copiedCode ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 max-w-md">
              Use this permanent unique ID or your registered mobile number for instant OTP
              passwordless login across all devices.
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
              <span>Registered Student Portal</span>
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
          {/* Section 1: Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="h-4 w-4 text-slate-400" />
                <span>Full Legal Name</span>
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
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-slate-400" />
                <span>School / College / Institute</span>
              </label>
              <input
                type="text"
                value={schoolCollege}
                onChange={(e) => setSchoolCollege(e.target.value)}
                placeholder="e.g. Delhi Public School"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
                required
              />
            </div>
          </div>

          {/* Section 2: Location (India Pincode API) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>State</span>
                </span>
                {isLoadingStates && (
                  <span className="text-[11px] text-slate-400 font-normal">Loading states...</span>
                )}
              </label>
              <select
                value={selectedState}
                onChange={handleStateChange}
                disabled={isLoadingStates}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
              >
                <option value="">Select State</option>
                {stateOptions.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              {statesError && (
                <p className="text-[11px] text-red-500 font-medium">{statesError}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-slate-400" />
                  <span>City / District</span>
                </span>
                {isLoadingDistricts && (
                  <span className="text-[11px] text-slate-400 font-normal">Loading cities...</span>
                )}
              </label>
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                disabled={!selectedState || isLoadingDistricts}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">
                  {!selectedState
                    ? 'Select State first'
                    : isLoadingDistricts
                      ? 'Loading cities...'
                      : 'Select City / District'}
                </option>
                {districtOptions.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {districtsError && (
                <p className="text-[11px] text-red-500 font-medium">{districtsError}</p>
              )}
            </div>
          </div>

          {/* Section 3: Academic Targets & Language */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-slate-400" />
                <span>Class / Grade</span>
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-slate-400" />
                <span>Target Examination</span>
              </label>
              <select
                value={examTargetId}
                onChange={(e) => setExamTargetId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
              >
                <option value="">Select Target Exam</option>
                {examTargets.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Globe2 className="h-4 w-4 text-slate-400" />
                <span>Medium / Language</span>
              </label>
              <select
                value={preferredLanguageId}
                onChange={(e) => setPreferredLanguageId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-xs focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 transition"
              >
                <option value="">Select Language</option>
                {languages.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
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
              <span>Save Profile Changes</span>
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
