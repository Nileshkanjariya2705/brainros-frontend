import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import { useVerifyOtpAPI } from '../services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

export const useVerifyOtp = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { verifyOtpAPI, isLoading } = useVerifyOtpAPI();
  const [error, setError] = useState<string | null>(null);

  const verifyOtp = async (mobileNumber: string, otp: string) => {
    setError(null);
    const { data, error: apiError } = await verifyOtpAPI({ mobileNumber, otp });

    if (!apiError && data) {
      dispatch(setCredentials(data));
      navigate(PRIVATE_NAVIGATION.dashboard, { replace: true });
      return true;
    } else {
      setError(apiError ?? 'Verification failed. Please try again.');
      return false;
    }
  };

  return { verifyOtp, isLoading, error };
};
