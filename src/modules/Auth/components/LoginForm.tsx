import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import cn from 'classnames';
import {
  Smartphone,
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

// ** Validation **
import {
  mobileLoginSchema,
  studentIdLoginSchema,
  verifyOtpSchema,
  type MobileLoginFormValues,
  type StudentIdLoginFormValues,
  type VerifyOtpFormValues,
} from '../validation-schema/login.schema';

type AuthMethod = 'PHONE' | 'STUDENT_ID';

const LoginForm = () => {
  const [authMethod, setAuthMethod] = useState<AuthMethod>('PHONE');
  const [cooldownTime, setCooldownTime] = useState<number>(0);

  // Passwordless Login Hook (handles OTP request, verify, and resend across phone and studentId)
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

  // ─── 2. Student ID Form ───────────────────────────────────────────────────
  const {
    register: registerStudentId,
    handleSubmit: handleSubmitStudentId,
    formState: { errors: errorsStudentId },
  } = useForm<StudentIdLoginFormValues>({
    resolver: yupResolver(studentIdLoginSchema),
    defaultValues: { studentId: '' },
  });

  // ─── 3. OTP Verification Form ─────────────────────────────────────────────
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
    resetLogin();
  };

  // Form submit handlers
  const handlePhoneSubmit = async (values: MobileLoginFormValues) => {
    await requestOtp(values.mobileNumber);
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
      {/* ─── 2 B2B Auth Tabs (Mobile OTP or Student ID) ─────────────── */}
      {!pendingLogin && (
        <div className="flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => handleTabChange('PHONE')}
            className={cn(
              'flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all',
              authMethod === 'PHONE'
                ? 'bg-white text-indigo-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <Smartphone className="h-4 w-4" />
            <span>Mobile OTP</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('STUDENT_ID')}
            className={cn(
              'flex-1 flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all',
              authMethod === 'STUDENT_ID'
                ? 'bg-white text-indigo-700 shadow-sm font-bold'
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
      {/* STEP 1: ENTER IDENTIFIER (PHONE / STUDENT ID)                   */}
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
                label="Registered Mobile Number"
                placeholder="+919876543210"
                helperText="We will send an OTP to your school-registered mobile number."
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

          {/* TAB 2: Student ID */}
          {authMethod === 'STUDENT_ID' && (
            <form onSubmit={handleSubmitStudentId(handleStudentIdSubmit)} className="space-y-4">
              <InputField
                name="studentId"
                register={registerStudentId}
                errors={errorsStudentId}
                label="Student ID or Code"
                placeholder="e.g. BRN-2026-000001 or STU001001"
                helperText="We will dispatch an OTP to the mobile number associated with your Student ID."
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
            <div className="flex items-center space-x-2 text-emerald-700 font-bold text-xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>OTP Dispatched Successfully</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter the OTP sent to your registered mobile number ending in{' '}
              <strong className="font-mono text-slate-900 font-bold">
                {pendingLogin.mobileMasked}
              </strong>
              .
            </p>
          </div>

          <div className="space-y-3 py-1">
            <label className="block text-xs font-bold text-slate-600 text-center uppercase tracking-wider">
              Enter OTP Code
            </label>
            <OtpPinInput
              length={pendingLogin.otpLength || 6}
              value={currentOtp}
              onChange={(newOtp) => {
                setValueVerify('otp', newOtp, { shouldValidate: true });
                if (newOtp.length === (pendingLogin.otpLength || 6) && !isVerifyingOtp) {
                  verifyOtp(newOtp);
                }
              }}
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
                Change {authMethod === 'PHONE' ? 'Mobile' : 'Student ID'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={cooldownTime > 0 || isResendingOtp}
              className={cn(
                'inline-flex items-center font-bold transition-colors',
                cooldownTime > 0
                  ? 'text-slate-500 cursor-not-allowed'
                  : 'text-indigo-600 hover:text-indigo-700 hover:underline',
              )}
            >
              <RefreshCw className={cn('h-3.5 w-3.5 mr-1', isResendingOtp && 'animate-spin')} />
              <span>{cooldownTime > 0 ? `Resend in ${cooldownTime}s` : 'Resend OTP'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginForm;
