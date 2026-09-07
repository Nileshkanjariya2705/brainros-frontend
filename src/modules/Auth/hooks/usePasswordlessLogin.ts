import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import {
  useRequestPasswordlessLoginOtpAPI,
  useVerifyPasswordlessLoginOtpAPI,
  useResendOtpAPI,
} from '../services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

export interface PendingLoginState {
  loginRequestId: string;
  mobileMasked: string;
  expiresIn: number;
  resendAvailableIn: number;
  identifier: string;
  otpLength?: number;
}

export const usePasswordlessLogin = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { requestPasswordlessLoginOtpAPI, isLoading: isRequestingOtp } =
    useRequestPasswordlessLoginOtpAPI();

  const { verifyPasswordlessLoginOtpAPI, isLoading: isVerifyingOtp } =
    useVerifyPasswordlessLoginOtpAPI();

  const { resendOtpAPI, isLoading: isResendingOtp } = useResendOtpAPI();

  const [pendingLogin, setPendingLogin] = useState<PendingLoginState | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * 1. Request login OTP with Email, Student ID, or Mobile number
   */
  const requestOtp = async (identifier: string) => {
    setError(null);
    const { data, error: apiError } = await requestPasswordlessLoginOtpAPI({ identifier });

    if (!apiError && data) {
      setPendingLogin({
        loginRequestId: data.loginRequestId,
        mobileMasked: data.mobileMasked,
        expiresIn: data.expiresIn || 300,
        resendAvailableIn: data.resendAvailableIn || 60,
        identifier,
        otpLength: data.otpLength || 6,
      });
      return true;
    } else {
      setError(apiError ?? 'Failed to send OTP. Please verify your identifier and try again.');
      return false;
    }
  };

  /**
   * 2. Verify login OTP and complete authentication
   */
  const verifyOtp = async (otp: string) => {
    if (!pendingLogin) {
      setError('Login session expired. Please request a new OTP.');
      return false;
    }

    setError(null);
    const { data, error: apiError } = await verifyPasswordlessLoginOtpAPI({
      loginRequestId: pendingLogin.loginRequestId,
      otp,
    });

    if (!apiError && data) {
      dispatch(
        setCredentials({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
          student: data.student,
        }),
      );
      navigate(PRIVATE_NAVIGATION.dashboard, { replace: true });
      return true;
    } else {
      setError(apiError ?? 'Invalid or expired OTP. Please try again.');
      return false;
    }
  };

  /**
   * 3. Resend OTP
   */
  const resendOtp = async () => {
    if (!pendingLogin) return false;
    setError(null);

    const { error: apiError } = await resendOtpAPI({
      loginRequestId: pendingLogin.loginRequestId,
    });

    if (!apiError) {
      return true;
    } else {
      setError(apiError ?? 'Failed to resend OTP. Please wait before retrying.');
      return false;
    }
  };

  const reset = () => {
    setPendingLogin(null);
    setError(null);
  };

  return {
    requestOtp,
    verifyOtp,
    resendOtp,
    reset,
    pendingLogin,
    error,
    setError,
    isLoading: isRequestingOtp || isVerifyingOtp || isResendingOtp,
    isRequestingOtp,
    isVerifyingOtp,
    isResendingOtp,
  };
};
