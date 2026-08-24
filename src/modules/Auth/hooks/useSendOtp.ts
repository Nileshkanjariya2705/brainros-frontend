import { useState } from 'react';
import { useSendOtpAPI } from '../services';

export const useSendOtp = () => {
  const { sendOtpAPI, isLoading, isSuccess } = useSendOtpAPI();
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async (mobileNumber: string) => {
    setError(null);
    const { data, error: apiError } = await sendOtpAPI({ mobileNumber });

    if (apiError || !data?.success) {
      setError(apiError ?? 'Failed to send OTP. Please try again.');
      return false;
    }
    return true;
  };

  return { sendOtp, isLoading, isSuccess, error };
};
