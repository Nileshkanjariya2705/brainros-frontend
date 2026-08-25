import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Link } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  User,
  MapPin,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Building2,
  BookOpen,
} from 'lucide-react';

// ** Components **
import { InputField, SelectField, PhoneInputField } from '@/components/FormField';
import Button from '@/components/ui/Button';
import RegisterStepper from '../components/RegisterStepper';

// ** Hooks & Services **
import { useRegisterStudent } from '../hooks/useRegisterStudent';
import { useGetRegisterOptionsAPI } from '../services';

// ** Validation **
import {
  registerSchema,
  STEP_FIELDS,
  type RegisterFormValues,
} from '../validation-schema/register.schema';
import type { OptionItem } from '../types/auth.types';

const RegisterPage = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { registerStudent, isLoading: isRegistering, error: registerError } = useRegisterStudent();
  const { getRegisterOptionsAPI, isLoading: isLoadingOptions } = useGetRegisterOptionsAPI();

  const [classes, setClasses] = useState<OptionItem[]>([]);
  const [languages, setLanguages] = useState<OptionItem[]>([]);
  const [examTargets, setExamTargets] = useState<OptionItem[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);

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
      schoolCollege: '',
      classId: '',
      preferredLanguageId: '',
      examTargetId: '',
    },
  });

  // Watch form values for Step 3 summary review
  const watchedValues = watch();

  // Fetch register metadata options on mount
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
        setOptionsError(error ?? 'Failed to load registration options.');
      }
    };
    fetchOptions();
    return () => {
      isMounted = false;
    };
  }, [getRegisterOptionsAPI]);

  // Step Navigation Validation Handler
  const handleNextStep = async () => {
    const fieldsToValidate = STEP_FIELDS[step];
    const isStepValid = await trigger(fieldsToValidate as unknown as (keyof RegisterFormValues)[]);

    if (isStepValid) {
      setStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  const onSubmit = async (values: RegisterFormValues) => {
    await registerStudent({
      phone: values.phone,
      name: values.name,
      email: values.email || undefined,
      state: values.state,
      district: values.district,
      schoolCollege: values.schoolCollege,
      classId: values.classId,
      preferredLanguageId: values.preferredLanguageId,
      examTargetId: values.examTargetId,
    });
  };

  const classOptions = (classes || []).map((c) => ({ label: c.name, value: c.id }));
  const languageOptions = (languages || []).map((l) => ({ label: l.name, value: l.id }));
  const examTargetOptions = (examTargets || []).map((e) => ({ label: e.name, value: e.id }));

  // Helper labels for summary view
  const selectedClassName = (classes || []).find((c) => c.id === watchedValues.classId)?.name;
  const selectedLanguageName = (languages || []).find(
    (l) => l.id === watchedValues.preferredLanguageId,
  )?.name;
  const selectedExamTargetName = (examTargets || []).find(
    (e) => e.id === watchedValues.examTargetId,
  )?.name;

  return (
    <div className="w-full max-w-2xl space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600 ring-1 ring-inset ring-brand-500/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Student Onboarding Wizard</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Create Student Profile
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Complete the 3 simple steps to register and gain instant access to your examination portal
        </p>
      </div>

      {/* Main Multi-Step Form Card */}
      <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 rounded-2xl border border-slate-200/80 space-y-6">
        {/* Stepper Progress Bar */}
        <RegisterStepper currentStep={step} totalSteps={3} />

        {isLoadingOptions ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <span className="h-10 w-10 animate-spin rounded-full border-4 border-brand-600 border-t-transparent shadow-md" />
            <p className="text-sm font-medium text-slate-500">
              Loading registration choices & institutions...
            </p>
          </div>
        ) : optionsError ? (
          <div className="flex flex-col items-center space-y-4 rounded-xl bg-rose-50 p-6 border border-rose-200">
            <div className="flex items-start space-x-3 w-full">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-rose-800">Configuration Error</h3>
                <p className="mt-1 text-xs text-rose-700">{optionsError}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={async () => {
                setOptionsError(null);
                const { data, error } = await getRegisterOptionsAPI();
                if (!error && data) {
                  setClasses(data.classes || []);
                  setLanguages(data.languages || []);
                  setExamTargets(data.examTargets || []);
                } else {
                  setOptionsError(error ?? 'Failed to load registration options.');
                }
              }}
            >
              Retry Loading Options
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* STEP 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Step 1: Personal Details</h2>
                    <p className="text-xs text-slate-500">
                      Your full name and primary contact details
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField<RegisterFormValues>
                    name="name"
                    label="Full Name"
                    placeholder="e.g. Nilesh Kanjariya"
                    required
                    register={register}
                    errors={errors}
                  />

                  <PhoneInputField<RegisterFormValues>
                    name="phone"
                    label="Mobile Number"
                    placeholder="98765 43210"
                    required
                    register={register}
                    setValue={setValue}
                    watch={watch}
                    errors={errors}
                    helperText="Select country code & enter 10-digit mobile number"
                  />
                </div>

                <InputField<RegisterFormValues>
                  name="email"
                  label="Email Address (Optional)"
                  type="email"
                  placeholder="e.g. nilesh@example.com"
                  register={register}
                  errors={errors}
                  helperText="Used for exam reports and score card notifications"
                />
              </div>
            )}

            {/* STEP 2: Location & Institute Details */}
            {step === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Step 2: Location & Institution
                    </h2>
                    <p className="text-xs text-slate-500">
                      Specify your geographic area and school/college
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InputField<RegisterFormValues>
                    name="state"
                    label="State"
                    placeholder="e.g. Gujarat"
                    required
                    register={register}
                    errors={errors}
                  />

                  <InputField<RegisterFormValues>
                    name="district"
                    label="District"
                    placeholder="e.g. Morbi"
                    required
                    register={register}
                    errors={errors}
                  />
                </div>

                <InputField<RegisterFormValues>
                  name="schoolCollege"
                  label="School / College / Institute Name"
                  placeholder="e.g. Model Higher Secondary School"
                  required
                  register={register}
                  errors={errors}
                  helperText="Enter your official school, PUC, or college name"
                />
              </div>
            )}

            {/* STEP 3: Academic Profile & Summary */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                    <GraduationCap className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Step 3: Academic Profile & Preferences
                    </h2>
                    <p className="text-xs text-slate-500">
                      Select your current standard, medium, and exam target
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <SelectField<RegisterFormValues>
                    name="classId"
                    label="Class / Grade"
                    placeholder="Select Class"
                    options={classOptions}
                    required
                    register={register}
                    errors={errors}
                  />

                  <SelectField<RegisterFormValues>
                    name="preferredLanguageId"
                    label="Medium / Language"
                    placeholder="Select Language"
                    options={languageOptions}
                    required
                    register={register}
                    errors={errors}
                  />

                  <SelectField<RegisterFormValues>
                    name="examTargetId"
                    label="Target Exam"
                    placeholder="Select Target"
                    options={examTargetOptions}
                    required
                    register={register}
                    errors={errors}
                  />
                </div>

                {/* Profile Confirmation Preview Box */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Profile Summary Overview</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        Name:{' '}
                        <strong className="text-slate-800">{watchedValues.name || '—'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        Phone:{' '}
                        <strong className="text-slate-800">{watchedValues.phone || '—'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        Location:{' '}
                        <strong className="text-slate-800">
                          {watchedValues.district
                            ? `${watchedValues.district}, ${watchedValues.state}`
                            : '—'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        Class & Medium:{' '}
                        <strong className="text-slate-800">
                          {selectedClassName && selectedLanguageName
                            ? `${selectedClassName} (${selectedLanguageName})`
                            : selectedClassName || '—'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 sm:col-span-2">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        Target Exam:{' '}
                        <strong className="text-slate-800">{selectedExamTargetName || '—'}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Registration Error Notification */}
            {registerError && (
              <div className="flex items-start space-x-3 rounded-xl bg-rose-50 p-4 border border-rose-200 text-rose-800">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs font-medium leading-relaxed">{registerError}</p>
              </div>
            )}

            {/* Wizard Action Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
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
                  onClick={handleNextStep}
                  className="inline-flex items-center space-x-1.5 shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 transition-all ml-auto"
                >
                  <span>Continue</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  isLoading={isRegistering}
                  className="inline-flex items-center space-x-1.5 shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 transition-all ml-auto"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  <span>Complete Registration</span>
                </Button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* Footer Link to Login */}
      <div className="text-center text-sm text-slate-600">
        <span>Already have a student profile? </span>
        <Link
          to="/login"
          className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition"
        >
          Sign In Here
        </Link>
      </div>
    </div>
  );
};

export default RegisterPage;
