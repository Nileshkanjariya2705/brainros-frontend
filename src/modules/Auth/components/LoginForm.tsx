import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import cn from 'classnames';

// ** Components **
import { InputField } from '@/components/FormField';
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
      <form onSubmit={handleSubmitSend(handleSendOtp)} className="space-y-4">
        <InputField<SendOtpFormValues>
          name="mobileNumber"
          label="Mobile Number"
          type="tel"
          autoComplete="tel"
          placeholder="e.g. +919876543210"
          required
          register={registerSend}
          errors={errorsSend}
          helperText="Enter your mobile number with country code (e.g. +91 for India)"
        />

        {sendError && (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-xs font-medium text-red-700">{sendError}</p>
          </div>
        )}

        <Button type="submit" isLoading={isSending} className="w-full">
          Get OTP Verification Code
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmitVerify(handleVerifyOtp)} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Mobile Number
        </label>
        <div className="mt-1 flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <span>{mobileNumber}</span>
          <button
            type="button"
            onClick={handleGoBack}
            className="text-xs font-semibold text-brand-600 hover:text-brand-500 transition"
          >
            Change Number
          </button>
        </div>
      </div>

      <InputField<VerifyOtpFormValues>
        name="otp"
        label="Enter 6-Digit OTP"
        type="text"
        maxLength={6}
        placeholder="123456"
        required
        register={registerVerify}
        errors={errorsVerify}
        inputProps={{
          inputMode: 'numeric',
          pattern: '[0-9]*',
        }}
      />

      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400">Didn't receive code?</span>
        <button
          type="button"
          disabled={cooldownTime > 0}
          onClick={handleResend}
          className={cn(
            'font-semibold transition outline-none',
            cooldownTime > 0
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-brand-600 hover:text-brand-500',
          )}
        >
          {cooldownTime > 0 ? `Resend OTP in ${cooldownTime}s` : 'Resend OTP'}
        </button>
      </div>

      {verifyError && (
        <div className="rounded-md bg-red-50 p-3">
          <p className="text-xs font-medium text-red-700">{verifyError}</p>
        </div>
      )}

      <Button type="submit" isLoading={isVerifying} className="w-full">
        Verify & Sign In
      </Button>
    </form>
  );
};

export default LoginForm;
