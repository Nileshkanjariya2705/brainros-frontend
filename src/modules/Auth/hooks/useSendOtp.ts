import { useState } from 'react';
import { useSendOtpAPI } from '../services';

export const useSendOtp = () => {
  const { sendOtpAPI, isLoading } = useSendOtpAPI();
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async (phone: string, purpose: 'LOGIN' | 'REGISTER' = 'LOGIN') => {
    setError(null);
    const { error: apiError } = await sendOtpAPI({ phone, purpose });

    if (!apiError) {
      return true;
    } else {
      setError(apiError ?? 'Failed to send verification OTP. Please try again.');
      return false;
    }
  };

  return { sendOtp, isLoading, error, setError };
};
