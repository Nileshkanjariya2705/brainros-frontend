import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link, Navigate } from 'react-router-dom';
import cn from 'classnames';
import {
  ChevronRight,
  ChevronLeft,
  User,
  MapPin,
  GraduationCap,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

// ** Components **
import { InputField, SelectField, PhoneInputField, OtpPinInput } from '@/components/FormField';
import Button from '@/components/ui/Button';
import RegisterStepper from '../components/RegisterStepper';
import PageLoader from '@/components/feedback/PageLoader';

// ** Hooks & Services **
import { useRegisterStudent } from '../hooks/useRegisterStudent';
import {
  useGetRegisterOptionsAPI,
  fetchAllStatesAPI,
  fetchDistrictsByStateSlugAPI,
  getStateSlug,
  formatLocationName,
  type ApiStateItem,
  type ApiDistrictItem,
} from '../services';
import { useAuth } from '@/hooks/useAuth';

// ** Validation **
import {
  registerSchema,
  STEP_FIELDS,
  type RegisterFormValues,
} from '../validation-schema/register.schema';
import type { OptionItem } from '../types/auth.types';

const RegisterPage = () => {
  const { isAuthenticated, isInitializing } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [otpCode, setOtpCode] = useState<string>('');
  const [cooldownTime, setCooldownTime] = useState<number>(0);

  const {
    initiateRegistration,
    verifyRegistrationOtp,
    resendOtp,
    reset: resetRegistration,
    pendingRegistration,
    error: registerError,
    setError: setRegisterError,
    isInitiating,
    isVerifying,
    isResending,
  } = useRegisterStudent();

  const { getRegisterOptionsAPI, isLoading: isLoadingOptions } = useGetRegisterOptionsAPI();

  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [languages, setLanguages] = useState<OptionItem[]>([]);
  const [examTargets, setExamTargets] = useState<OptionItem[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  // Dynamic Location API states
  const [statesList, setStatesList] = useState<ApiStateItem[]>([]);
  const [districtsList, setDistrictsList] = useState<ApiDistrictItem[]>([]);
  const [isLoadingStates, setIsLoadingStates] = useState<boolean>(true);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState<boolean>(false);
  const [statesError, setStatesError] = useState<string | null>(null);
  const [districtsError, setDistrictsError] = useState<string | null>(null);

  // Form setup
  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: yupResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      phone: '',
      name: '',
      email: '',
      state: '',
      district: '',
      stateId: '',
      districtId: '',
      schoolCollege: '',
      classId: '',
      preferredLanguageId: '',
      examTargetId: '',
    },
  });

  const watchedValues = watch();

  // 1. Fetch registration options (classes, targets, languages)
  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
      const { data, error } = await getRegisterOptionsAPI();
      if (!isMounted) return;
      if (!error && data) {
        setClasses(data.classes || []);
        setLanguages(data.languages || []);
        setExamTargets(data.examTargets || []);
      } else {
        setOptionsError(error ?? 'Failed to load academic options.');
      }
    };
    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, [getRegisterOptionsAPI]);

  // 2. Fetch States list from India Pincode API on mount
  const loadStates = async () => {
    setIsLoadingStates(true);
    setStatesError(null);
    const { data, error } = await fetchAllStatesAPI();
    setIsLoadingStates(false);
    if (data && data.length > 0) {
      setStatesList(data);
    }
    if (error) {
      setStatesError(error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const initStates = async () => {
      setIsLoadingStates(true);
      setStatesError(null);
      const { data, error } = await fetchAllStatesAPI();
      if (!isMounted) return;
      setIsLoadingStates(false);
      if (data && data.length > 0) {
        setStatesList(data);
      }
      if (error) {
        setStatesError(error);
      }
    };
    initStates();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync cooldown timer on pending registration
  useEffect(() => {
    if (pendingRegistration) {
      setCooldownTime(pendingRegistration.resendAvailableIn || 60);
    }
  }, [pendingRegistration]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  if (isInitializing) {
    return <PageLoader label="Checking session..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Handle State Selection -> convert to slug & fetch cities/districts dynamically
  const handleStateChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedStateName = e.target.value;
    setValue('state', selectedStateName, { shouldValidate: true });
    setValue('district', '', { shouldValidate: true });
    setValue('stateId', '', { shouldValidate: false });
    setValue('districtId', '', { shouldValidate: false });
    setDistrictsList([]);
    setDistrictsError(null);

    if (!selectedStateName) {
      return;
    }

    const stateSlug = getStateSlug(selectedStateName);
    setIsLoadingDistricts(true);
    const { data, error } = await fetchDistrictsByStateSlugAPI(stateSlug);
    setIsLoadingDistricts(false);

    if (!error && data) {
      setDistrictsList(data);
    } else {
      setDistrictsError(error ?? 'Failed to load districts for the selected state.');
    }
  };

  // Retry loading districts for currently selected state
  const handleRetryDistricts = async () => {
    if (!watchedValues.state) return;
    const stateSlug = getStateSlug(watchedValues.state);
    setIsLoadingDistricts(true);
    setDistrictsError(null);
    const { data, error } = await fetchDistrictsByStateSlugAPI(stateSlug);
    setIsLoadingDistricts(false);
    if (!error && data) {
      setDistrictsList(data);
    } else {
      setDistrictsError(error ?? 'Failed to load districts for the selected state.');
    }
  };

  // Handle District Selection
  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedDistrict = e.target.value;
    setValue('district', selectedDistrict, { shouldValidate: true });
    setValue('districtId', '', { shouldValidate: false });
  };

  // Step Navigation Validation Handler
  const handleNextStep = async () => {
    setRegisterError(null);
    const fieldsToValidate = STEP_FIELDS[step];
    const isStepValid = await trigger(fieldsToValidate as unknown as (keyof RegisterFormValues)[]);

    if (isStepValid) {
      setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
    }
  };

  const handlePrevStep = () => {
    setRegisterError(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  // Step 3 Submit -> initiate registration & trigger OTP
  const onSubmit = async (values: RegisterFormValues) => {
    await initiateRegistration({
      phone: values.phone,
      name: values.name,
      email: values.email || undefined,
      state: values.state,
      district: values.district,
      stateId: values.stateId || undefined,
      districtId: values.districtId || undefined,
      schoolCollege: values.schoolCollege,
      classId: values.classId,
      preferredLanguageId: values.preferredLanguageId,
      examTargetId: values.examTargetId,
    });
  };

  // OTP Verification Submit
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setRegisterError('Please enter a valid OTP verification code.');
      return;
    }
    await verifyRegistrationOtp(otpCode.trim());
  };

  const handleResend = async () => {
    if (cooldownTime > 0) return;
    const ok = await resendOtp();
    if (ok) {
      setCooldownTime(60);
    }
  };

  const classOptions = (classes || [])
    .filter(
      (c) =>
        !c.name?.toLowerCase().includes('foundation') &&
        !c.code?.toLowerCase().includes('foundation'),
    )
    .map((c) => ({ label: c.name, value: c.id }));
  const languageOptions = (languages || []).map((l) => ({ label: l.name, value: l.id }));
  const examTargetOptions = (examTargets || []).map((e) => ({ label: e.name, value: e.id }));

  const stateOptions = statesList.map((s) => {
    const formatted = formatLocationName(s.name);
    return { label: formatted, value: formatted };
  });

  const districtOptions = districtsList.map((d) => {
    const formatted = formatLocationName(d.name);
    return { label: formatted, value: formatted };
  });

  // Helper labels for summary view
  const selectedClassName = (classes || []).find((c) => c.id === watchedValues.classId)?.name;
  const selectedLanguageName = (languages || []).find(
    (l) => l.id === watchedValues.preferredLanguageId,
  )?.name;
  const selectedExamTargetName = (examTargets || []).find(
    (e) => e.id === watchedValues.examTargetId,
  )?.name;


  return (
    <div className="w-full max-w-2xl space-y-6 animate-in fade-in zoom-in-95 duration-300 text-slate-900">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Student Onboarding Wizard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Create Student Profile
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Complete the quick steps to register and generate your official Student ID via OTP
          verification
        </p>
      </div>

      {/* Main Form Card */}
      <div className="bg-white p-6 sm:p-8 shadow-2xl shadow-black/60 rounded-2xl border border-slate-200 space-y-6 relative overflow-hidden text-slate-900">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* OTP VERIFICATION STEP                                          */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {pendingRegistration ? (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm mx-auto">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Verify Mobile Number</h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We have sent an OTP verification code to{' '}
                <strong className="text-slate-800 font-mono">
                  {pendingRegistration.mobileMasked}
                </strong>
                . Enter it below to activate your account and generate your official Student ID.
              </p>
            </div>

            {registerError && (
              <div className="rounded-xl bg-red-50 p-3.5 border border-red-200 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold text-red-700">{registerError}</p>
              </div>
            )}

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-5">
              <div className="space-y-3 py-1">
                <label className="block text-xs font-bold text-slate-600 text-center uppercase tracking-wider">
                  6-Digit Verification Code
                </label>
                <OtpPinInput length={6} value={otpCode} onChange={setOtpCode} />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isVerifying}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-slate-900 font-bold shadow-lg shadow-indigo-500/25"
              >
                <span>Verify & Complete Registration</span>
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetRegistration}
                  className="inline-flex items-center text-slate-500 hover:text-slate-800 font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                  <span>Edit Registration Details</span>
                </button>

                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldownTime > 0 || isResending}
                  className={cn(
                    'inline-flex items-center font-bold transition-colors',
                    cooldownTime > 0
                      ? 'text-slate-500 cursor-not-allowed'
                      : 'text-brand-600 hover:text-brand-700 hover:underline',
                  )}
                >
                  <RefreshCw className={cn('h-3.5 w-3.5 mr-1', isResending && 'animate-spin')} />
                  <span>{cooldownTime > 0 ? `Resend in ${cooldownTime}s` : 'Resend Code'}</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ═══════════════════════════════════════════════════════════════ */
          /* 3-STEP REGISTRATION WIZARD                                      */
          /* ═══════════════════════════════════════════════════════════════ */
          <>
            {/* Stepper Progress Bar */}
            <RegisterStepper currentStep={step} totalSteps={3} />

            {isLoadingOptions ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                <p className="text-xs font-semibold">Loading registration options...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {optionsError && (
                  <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-200 flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-amber-700">{optionsError}</p>
                  </div>
                )}

                {registerError && (
                  <div className="rounded-xl bg-red-50 p-3.5 border border-red-200 flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-red-700">{registerError}</p>
                  </div>
                )}

                {/* ─── STEP 1: Personal Identification ─────────────────── */}
                {step === 1 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-800">Student Identity</h2>
                        <p className="text-xs text-slate-500">
                          Provide your full legal name and mobile contact
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <InputField
                        name="name"
                        register={register}
                        errors={errors}
                        label="Full Legal Name"
                        placeholder="e.g. Aarav Sharma"
                      />

                      <PhoneInputField
                        name="phone"
                        register={register}
                        setValue={setValue}
                        watch={watch}
                        errors={errors}
                        label="Mobile Number (for OTP verification)"
                        placeholder="+919876543210"
                      />

                      <InputField
                        name="email"
                        register={register}
                        errors={errors}
                        label="Email Address (Optional)"
                        type="email"
                        placeholder="e.g. aarav.sharma@example.com"
                      />
                    </div>
                  </div>
                )}

                {/* ─── STEP 2: Location & Institution ──────────────────── */}
                {step === 2 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-800">Location & School</h2>
                        <p className="text-xs text-slate-500">
                          Select your state, city/district, and current educational institute
                        </p>
                      </div>
                    </div>

                    {statesError && (
                      <div className="rounded-xl bg-amber-50 p-3 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
                        <span>{statesError}</span>
                        <button
                          type="button"
                          onClick={loadStates}
                          className="font-bold underline text-amber-900 hover:text-amber-700 ml-2"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <SelectField
                        name="state"
                        register={register}
                        errors={errors}
                        label="State"
                        options={stateOptions}
                        isLoading={isLoadingStates}
                        placeholder={isLoadingStates ? 'Loading states...' : 'Select State'}
                        selectProps={{
                          value: watchedValues.state,
                          onChange: handleStateChange,
                        }}
                      />

                      <div className="space-y-1">
                        <SelectField
                          name="district"
                          register={register}
                          errors={errors}
                          label="City / District"
                          options={districtOptions}
                          disabled={!watchedValues.state || isLoadingDistricts}
                          isLoading={isLoadingDistricts}
                          placeholder={
                            !watchedValues.state
                              ? 'Select State first'
                              : isLoadingDistricts
                                ? 'Loading cities...'
                                : 'Select City / District'
                          }
                          selectProps={{
                            value: watchedValues.district,
                            onChange: handleDistrictChange,
                          }}
                        />
                        {districtsError && (
                          <div className="flex items-center justify-between text-[11px] text-red-600 pt-0.5 px-0.5">
                            <span>{districtsError}</span>
                            <button
                              type="button"
                              onClick={handleRetryDistricts}
                              className="font-bold underline text-red-700 hover:text-red-800 ml-1"
                            >
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <InputField
                      name="schoolCollege"
                      register={register}
                      errors={errors}
                      label="School / College / Institute Name"
                      placeholder="e.g. Delhi Public School or National PU College"
                    />
                  </div>
                )}

                {/* ─── STEP 3: Academic Profile & Preferences ───────────── */}
                {step === 3 && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-slate-800">
                          Academic & Target Goals
                        </h2>
                        <p className="text-xs text-slate-500">
                          Configure your target exam and question language
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <SelectField
                        name="classId"
                        register={register}
                        errors={errors}
                        label="Class / Grade"
                        options={classOptions}
                        placeholder="Select your Class"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <SelectField
                          name="examTargetId"
                          register={register}
                          errors={errors}
                          label="Target Exam Goal"
                          options={examTargetOptions}
                          placeholder="Select Target"
                        />

                        <SelectField
                          name="preferredLanguageId"
                          register={register}
                          errors={errors}
                          label="Medium / Preferred Language"
                          options={languageOptions}
                          placeholder="Select Language"
                        />
                      </div>
                    </div>

                    {/* Summary Preview Box */}
                    <div className="mt-2 rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs space-y-1.5">
                      <p className="font-bold text-slate-700">Registration Summary</p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-slate-600">
                        <div>
                          Name:{' '}
                          <span className="font-semibold text-slate-900">
                            {watchedValues.name || '—'}
                          </span>
                        </div>
                        <div>
                          Mobile:{' '}
                          <span className="font-semibold text-slate-900">
                            {watchedValues.phone || '—'}
                          </span>
                        </div>
                        <div>
                          State:{' '}
                          <span className="font-semibold text-slate-900">
                            {watchedValues.state || '—'}
                          </span>
                        </div>
                        <div>
                          City / District:{' '}
                          <span className="font-semibold text-slate-900">
                            {watchedValues.district || '—'}
                          </span>
                        </div>
                        <div>
                          Class:{' '}
                          <span className="font-semibold text-slate-900">
                            {selectedClassName || '—'}
                          </span>
                        </div>
                        <div>
                          Target:{' '}
                          <span className="font-semibold text-slate-900">
                            {selectedExamTargetName || '—'}
                          </span>
                        </div>
                        <div>
                          Medium:{' '}
                          <span className="font-semibold text-slate-900">
                            {selectedLanguageName || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Step Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  {step > 1 ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      onClick={handlePrevStep}
                      className="inline-flex items-center space-x-1.5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Back</span>
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={handleNextStep}
                      className="inline-flex items-center space-x-1.5"
                    >
                      <span>Continue</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isInitiating}
                      className="inline-flex items-center space-x-1.5"
                    >
                      <span>Proceed to OTP Verification</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            )}
          </>
        )}
      </div>

      {/* Footer Link to Login */}
      <div className="text-center text-sm text-slate-500 pt-1">
        <span>Already have an account? </span>
        <Link
          to="/login"
          className="inline-flex items-center font-bold text-indigo-400 hover:text-indigo-300 hover:underline transition-all"
        >
          <span>Sign In Passwordless</span>
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
