import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import { useRegisterStudentAPI, useVerifyRegistrationOtpAPI, useResendOtpAPI } from '../services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import type { RegisterStudentDto } from '../types/auth.types';

export interface PendingRegistrationState {
  registrationId: string;
  mobileMasked: string;
  expiresIn: number;
  resendAvailableIn: number;
}

export const useRegisterStudent = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { registerStudentAPI, isLoading: isInitiating } = useRegisterStudentAPI();

  const { verifyRegistrationOtpAPI, isLoading: isVerifying } = useVerifyRegistrationOtpAPI();

  const { resendOtpAPI, isLoading: isResending } = useResendOtpAPI();

  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistrationState | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  /**
   * 1. Submit Registration Form -> triggers OTP
   */
  const initiateRegistration = async (data: RegisterStudentDto) => {
    setError(null);
    const { data: resData, error: apiError } = await registerStudentAPI(data);

    if (!apiError && resData) {
      // Backend returns { requiresOtp: true, registrationId, mobileMasked, expiresIn, resendAvailableIn }
      const resPayload = (resData as any).data || resData;
      if (resPayload.requiresOtp && resPayload.registrationId) {
        setPendingRegistration({
          registrationId: resPayload.registrationId,
          mobileMasked: resPayload.mobileMasked,
          expiresIn: resPayload.expiresIn || 300,
          resendAvailableIn: resPayload.resendAvailableIn || 60,
        });
        return true;
      }

      // Legacy direct response support
      if (resPayload.accessToken) {
        dispatch(
          setCredentials({
            accessToken: resPayload.accessToken,
            refreshToken: resPayload.refreshToken,
            user: resPayload.user,
            student: resPayload.student,
          }),
        );
        navigate(PRIVATE_NAVIGATION.dashboard, { replace: true });
        return true;
      }
    } else {
      setError(apiError ?? 'Registration failed. Please verify your details and try again.');
      return false;
    }
    return false;
  };

  /**
   * 2. Verify Registration OTP -> activates User and assigns Student ID
   */
  const verifyRegistrationOtp = async (otp: string) => {
    if (!pendingRegistration) {
      setError('Registration session expired. Please register again.');
      return false;
    }

    setError(null);
    const { data, error: apiError } = await verifyRegistrationOtpAPI({
      registrationId: pendingRegistration.registrationId,
      otp,
    });

    if (!apiError && data) {
      const resPayload = (data as any).data || data;
      dispatch(
        setCredentials({
          accessToken: resPayload.accessToken,
          refreshToken: resPayload.refreshToken,
          user: resPayload.user,
          student: resPayload.student,
        }),
      );
      navigate(PRIVATE_NAVIGATION.dashboard, { replace: true });
      return true;
    } else {
      setError(apiError ?? 'Invalid verification code. Please check and try again.');
      return false;
    }
  };

  /**
   * 3. Resend Registration OTP
   */
  const resendOtp = async () => {
    if (!pendingRegistration) return false;
    setError(null);

    const { error: apiError } = await resendOtpAPI({
      registrationId: pendingRegistration.registrationId,
    });

    if (!apiError) {
      return true;
    } else {
      setError(apiError ?? 'Failed to resend verification code. Please wait before retrying.');
      return false;
    }
  };

  const reset = () => {
    setPendingRegistration(null);
    setError(null);
  };

  return {
    initiateRegistration,
    verifyRegistrationOtp,
    resendOtp,
    reset,
    pendingRegistration,
    error,
    setError,
    isLoading: isInitiating || isVerifying || isResending,
    isInitiating,
    isVerifying,
    isResending,
  };
};
