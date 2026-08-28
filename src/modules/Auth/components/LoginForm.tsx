import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import cn from 'classnames';
import {
  Smartphone,
  Mail,
  GraduationCap,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// ** Components **
import { InputField, PhoneInputField, OtpPinInput } from '@/components/FormField';
import Button from '@/components/ui/Button';

// ** Hooks **
import { usePasswordlessLogin } from '../hooks/usePasswordlessLogin';
import { useLoginGoogle } from '../hooks/useLoginGoogle';

// ** Validation **
import {
  mobileLoginSchema,
  emailLoginSchema,
  studentIdLoginSchema,
  verifyOtpSchema,
  type MobileLoginFormValues,
  type EmailLoginFormValues,
  type StudentIdLoginFormValues,
  type VerifyOtpFormValues,
} from '../validation-schema/login.schema';

type AuthMethod = 'PHONE' | 'EMAIL' | 'STUDENT_ID';

const LoginForm = () => {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('PHONE');
  const [cooldownTime, setCooldownTime] = useState<number>(0);

  // Passwordless Login Hook (handles OTP request, verify, and resend across phone, email, studentId)
  const {
    requestOtp,
    verifyOtp,
    resendOtp,
    reset: resetLogin,
    pendingLogin,
    error: loginError,
    setError: setLoginError,
    isRequestingOtp,
    isVerifyingOtp,
    isResendingOtp,
  } = usePasswordlessLogin();

  const {
    loginWithGoogle,
    isLoading: isLoggingInGoogle,
    error: googleError,
    setError: setGoogleError,
  } = useLoginGoogle();

  // ─── 1. Phone Form ────────────────────────────────────────────────────────
  const {
    register: registerPhone,
    handleSubmit: handleSubmitPhone,
    setValue: setPhoneValue,
    watch: watchPhone,
    formState: { errors: errorsPhone },
  } = useForm<MobileLoginFormValues>({
    resolver: yupResolver(mobileLoginSchema),
    defaultValues: { mobileNumber: '' },
  });

  // ─── 2. Email Form ────────────────────────────────────────────────────────
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: errorsEmail },
  } = useForm<EmailLoginFormValues>({
    resolver: yupResolver(emailLoginSchema),
    defaultValues: { email: '' },
  });

  // ─── 3. Student ID Form ───────────────────────────────────────────────────
  const {
    register: registerStudentId,
    handleSubmit: handleSubmitStudentId,
    formState: { errors: errorsStudentId },
  } = useForm<StudentIdLoginFormValues>({
    resolver: yupResolver(studentIdLoginSchema),
    defaultValues: { studentId: '' },
  });

  // ─── 4. OTP Verification Form ─────────────────────────────────────────────
  const {
    handleSubmit: handleSubmitVerify,
    setValue: setValueVerify,
    watch: watchVerify,
    formState: { errors: errorsVerify },
    reset: resetVerifyForm,
  } = useForm<VerifyOtpFormValues>({
    resolver: yupResolver(verifyOtpSchema),
    defaultValues: { otp: '' },
  });

  const currentOtp = watchVerify('otp') || '';

  // Sync cooldown timer when OTP is sent
  useEffect(() => {
    if (pendingLogin) {
      setCooldownTime(pendingLogin.resendAvailableIn || 60);
      resetVerifyForm({ otp: '' });
    }
  }, [pendingLogin, resetVerifyForm]);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  const handleTabChange = (method: AuthMethod) => {
    setAuthMethod(method);
    setLoginError(null);
    setGoogleError(null);
    resetLogin();
  };

  // Form submit handlers
  const handlePhoneSubmit = async (values: MobileLoginFormValues) => {
    await requestOtp(values.mobileNumber);
  };

  const handleEmailSubmit = async (values: EmailLoginFormValues) => {
    await requestOtp(values.email);
  };

  const handleStudentIdSubmit = async (values: StudentIdLoginFormValues) => {
    await requestOtp(values.studentId);
  };

  const handleVerifySubmit = async (values: VerifyOtpFormValues) => {
    await verifyOtp(values.otp);
  };

  const handleResend = async () => {
    if (cooldownTime > 0) return;
    const ok = await resendOtp();
    if (ok) {
      setCooldownTime(60);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── 3 Classic Identifier Tabs ────────────────────────────────── */}
      {!pendingLogin && (
        <div className="flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => handleTabChange('PHONE')}
            className={cn(
              'flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all',
              authMethod === 'PHONE'
                ? 'bg-white text-brand-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <Smartphone className="h-4 w-4" />
            <span>Mobile OTP</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('EMAIL')}
            className={cn(
              'flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all',
              authMethod === 'EMAIL'
                ? 'bg-white text-brand-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('STUDENT_ID')}
            className={cn(
              'flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-lg text-xs sm:text-sm font-semibold transition-all',
              authMethod === 'STUDENT_ID'
                ? 'bg-white text-brand-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <GraduationCap className="h-4 w-4" />
            <span>Student ID</span>
          </button>
        </div>
      )}

      {/* Error Banner */}
      {loginError && (
        <div className="rounded-xl bg-red-50 p-3.5 border border-red-200 flex items-start space-x-3 animate-in fade-in">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs font-semibold text-red-700">{loginError}</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* STEP 1: ENTER IDENTIFIER (PHONE / EMAIL / STUDENT ID)          */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {!pendingLogin ? (
        <div className="space-y-4">
          {/* TAB 1: Mobile Phone Number */}
          {authMethod === 'PHONE' && (
            <form onSubmit={handleSubmitPhone(handlePhoneSubmit)} className="space-y-4">
              <PhoneInputField
                name="mobileNumber"
                register={registerPhone}
                setValue={setPhoneValue}
                watch={watchPhone}
                errors={errorsPhone}
                label="Mobile Number"
                placeholder="+919876543210"
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isRequestingOtp}
                className="w-full"
              >
                <span>Send Login OTP</span>
              </Button>
            </form>
          )}

          {/* TAB 2: Email Address */}
          {authMethod === 'EMAIL' && (
            <form onSubmit={handleSubmitEmail(handleEmailSubmit)} className="space-y-4">
              <InputField
                name="email"
                register={registerEmail}
                errors={errorsEmail}
                label="Email Address"
                type="email"
                placeholder="name@example.com"
                helperText="We will send an OTP to the mobile number registered with this email account."
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isRequestingOtp}
                className="w-full"
              >
                <span>Send Login OTP</span>
              </Button>
            </form>
          )}

          {/* TAB 3: Student ID */}
          {authMethod === 'STUDENT_ID' && (
            <form onSubmit={handleSubmitStudentId(handleStudentIdSubmit)} className="space-y-4">
              <InputField
                name="studentId"
                register={registerStudentId}
                errors={errorsStudentId}
                label="Student ID or Code"
                placeholder="e.g. BRN-2026-000001 or STU001001"
                helperText="We will send an OTP to the mobile number registered with this Student ID."
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isRequestingOtp}
                className="w-full"
              >
                <span>Send Login OTP</span>
              </Button>
            </form>
          )}
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════ */
        /* STEP 2: VERIFY OTP SCREEN                                      */
        /* ═══════════════════════════════════════════════════════════════ */
        <form
          onSubmit={handleSubmitVerify(handleVerifySubmit)}
          className="space-y-5 animate-in fade-in zoom-in-95"
        >
          <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/20 space-y-1.5">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>OTP Dispatched Successfully</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              We sent a 6-digit verification code to your verified mobile ending in{' '}
              <strong className="font-mono text-white font-bold">
                {pendingLogin.mobileMasked}
              </strong>
              .
            </p>
          </div>

          <div className="space-y-3 py-1">
            <label className="block text-xs font-bold text-slate-300 text-center uppercase tracking-wider">
              Enter 6-Digit OTP Code
            </label>
            <OtpPinInput
              length={6}
              value={currentOtp}
              onChange={(newOtp) => setValueVerify('otp', newOtp, { shouldValidate: true })}
              error={errorsVerify.otp?.message}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isVerifyingOtp}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-indigo-500/25"
          >
            <span>Verify & Sign In</span>
          </Button>

          <div className="flex items-center justify-between pt-2 text-xs border-t border-slate-100">
            <button
              type="button"
              onClick={resetLogin}
              className="inline-flex items-center text-slate-500 hover:text-slate-800 font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span>
                Change{' '}
                {authMethod === 'PHONE'
                  ? 'Mobile'
                  : authMethod === 'EMAIL'
                    ? 'Email'
                    : 'Student ID'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldownTime > 0 || isResendingOtp}
              className={cn(
                'inline-flex items-center font-bold transition-colors',
                cooldownTime > 0
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-brand-600 hover:text-brand-700 hover:underline',
              )}
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1', isResendingOtp && 'animate-spin')} />
              <span>{cooldownTime > 0 ? `Resend in ${cooldownTime}s` : 'Resend OTP'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Google OAuth alternative */}
      <div className="relative pt-2">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/80" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-400 font-semibold">Or continue with</span>
        </div>
      </div>

      {googleError && (
        <div className="rounded-xl bg-red-50 p-3 border border-red-200 text-xs font-semibold text-red-700">
          {googleError}
        </div>
      )}

      <button
        type="button"
        disabled={isLoggingInGoogle}
        onClick={() => loginWithGoogle('mock-google-id-token')}
        className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-bold shadow-sm transition-all hover:border-slate-300 disabled:opacity-60"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>Google Single Sign-On</span>
      </button>
    </div>
  );
};

export default LoginForm;
