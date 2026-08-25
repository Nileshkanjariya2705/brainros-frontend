import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import cn from 'classnames';
import {
  Smartphone,
  KeyRound,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

// ** Components **
import { InputField, PhoneInputField } from '@/components/FormField';
import Button from '@/components/ui/Button';

// ** Hooks **
import { useSendOtp } from '../hooks/useSendOtp';
import { useVerifyOtp } from '../hooks/useVerifyOtp';

// ** Validation **
import {
  sendOtpSchema,
  verifyOtpSchema,
  type SendOtpFormValues,
  type VerifyOtpFormValues,
} from '../validation-schema/login.schema';

const LoginForm = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [cooldownTime, setCooldownTime] = useState<number>(0);

  const { sendOtp, isLoading: isSending, error: sendError } = useSendOtp();
  const { verifyOtp, isLoading: isVerifying, error: verifyError } = useVerifyOtp();

  // Step 1 Form (Mobile Input)
  const {
    register: registerSend,
    handleSubmit: handleSubmitSend,
    setValue: setSendValue,
    watch: watchSend,
    formState: { errors: errorsSend },
  } = useForm<SendOtpFormValues>({
    resolver: yupResolver(sendOtpSchema),
    defaultValues: { mobileNumber: '' },
  });

  // Step 2 Form (OTP Verification)
  const {
    register: registerVerify,
    handleSubmit: handleSubmitVerify,
    formState: { errors: errorsVerify },
    setValue: setVerifyValue,
  } = useForm<VerifyOtpFormValues>({
    resolver: yupResolver(verifyOtpSchema),
    defaultValues: { mobileNumber: '', otp: '' },
  });

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => setCooldownTime((t) => t - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownTime]);

  const handleSendOtp = async (values: SendOtpFormValues) => {
    const success = await sendOtp(values.mobileNumber);
    if (success) {
      setMobileNumber(values.mobileNumber);
      setVerifyValue('mobileNumber', values.mobileNumber);
      setStep(2);
      setCooldownTime(60); // 60 seconds cooldown resend limit
    }
  };

  const handleVerifyOtp = async (values: VerifyOtpFormValues) => {
    await verifyOtp(values.mobileNumber, values.otp);
  };

  const handleResend = async () => {
    if (cooldownTime > 0) return;
    const success = await sendOtp(mobileNumber);
    if (success) {
      setCooldownTime(60);
    }
  };

  const handleGoBack = () => {
    setStep(1);
    setVerifyValue('otp', '');
  };

  if (step === 1) {
    return (
      <form onSubmit={handleSubmitSend(handleSendOtp)} className="space-y-5">
        <PhoneInputField<SendOtpFormValues>
          name="mobileNumber"
          label="Mobile Number"
          placeholder="98765 43210"
          required
          register={registerSend}
          setValue={setSendValue}
          watch={watchSend}
          errors={errorsSend}
          helperText="Select country code and enter your 10-digit mobile number"
        />

        {sendError && (
          <div className="flex items-start space-x-2 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-rose-800">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="text-xs font-medium leading-relaxed">{sendError}</p>
          </div>
        )}

        <Button
          type="submit"
          isLoading={isSending}
          className="w-full py-2.5 text-sm font-semibold shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 transition-all"
        >
          <Smartphone className="h-4 w-4 mr-2" />
          Get OTP Verification Code
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmitVerify(handleVerifyOtp)} className="space-y-5">
      {/* Mobile number review card */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 transition-all">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                OTP Sent To
              </p>
              <p className="text-sm font-bold text-slate-800">{mobileNumber}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGoBack}
            className="inline-flex items-center space-x-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-600 hover:bg-brand-50 hover:text-brand-700 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Change</span>
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <InputField<VerifyOtpFormValues>
          name="otp"
          label="Enter 6-Digit OTP Code"
          type="text"
          maxLength={6}
          placeholder="e.g. 123456"
          required
          register={registerVerify}
          errors={errorsVerify}
          className="tracking-widest font-mono text-center text-lg font-bold"
          inputProps={{
            inputMode: 'numeric',
            pattern: '[0-9]*',
          }}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-200/60 text-xs">
        <span className="text-slate-500">Didn't receive the OTP?</span>
        <button
          type="button"
          disabled={cooldownTime > 0}
          onClick={handleResend}
          className={cn(
            'inline-flex items-center space-x-1 font-semibold transition outline-none rounded px-2 py-1',
            cooldownTime > 0
              ? 'text-slate-400 cursor-not-allowed bg-slate-100'
              : 'text-brand-600 hover:text-brand-700 hover:bg-brand-50',
          )}
        >
          <RefreshCw className={cn('h-3.5 w-3.5 mr-1', cooldownTime > 0 && 'animate-spin')} />
          {cooldownTime > 0 ? `Resend in ${cooldownTime}s` : 'Resend OTP'}
        </button>
      </div>

      {verifyError && (
        <div className="flex items-start space-x-2 rounded-xl bg-rose-50 p-3.5 border border-rose-200 text-rose-800">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">{verifyError}</p>
        </div>
      )}

      <Button
        type="submit"
        isLoading={isVerifying}
        className="w-full py-2.5 text-sm font-semibold shadow-md shadow-brand-500/20 hover:shadow-brand-500/30 transition-all"
      >
        <KeyRound className="h-4 w-4 mr-2" />
        Verify & Sign In
      </Button>
    </form>
  );
};

export default LoginForm;
