import { useState } from 'react';
import {
  useRegisterStudentAPI,
  useVerifyRegistrationOtpAPI,
  useResendOtpAPI,
  useCreateRegistrationPaymentOrderAPI,
  useVerifyRegistrationPaymentAPI,
} from '../services';
import type { RegisterStudentDto } from '../types/auth.types';

export interface PendingRegistrationState {
  registrationId: string;
  mobileMasked: string;
  expiresIn: number;
  resendAvailableIn: number;
}

export interface PendingPaymentState {
  registrationId: string;
  feeAmount: number;
  currency: string;
  razorpayApiKey: string;
}

export interface RegistrationSuccessState {
  requiresApproval: boolean;
  status: string;
  student: {
    id: string;
    studentId: string;
    studentCode: string;
    name: string;
    status: string;
  };
}

export const useRegisterStudent = () => {
  const { registerStudentAPI, isLoading: isInitiating } = useRegisterStudentAPI();
  const { verifyRegistrationOtpAPI, isLoading: isVerifyingOtp } = useVerifyRegistrationOtpAPI();
  const { resendOtpAPI, isLoading: isResending } = useResendOtpAPI();
  const { createRegistrationPaymentOrderAPI, isLoading: isCreatingOrder } =
    useCreateRegistrationPaymentOrderAPI();
  const { verifyRegistrationPaymentAPI, isLoading: isVerifyingPayment } =
    useVerifyRegistrationPaymentAPI();

  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistrationState | null>(
    null,
  );
  const [pendingPayment, setPendingPayment] = useState<PendingPaymentState | null>(null);
  const [registrationSuccess, setRegistrationSuccess] =
    useState<RegistrationSuccessState | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Step 1: Submit Registration Form -> triggers OTP
   */
  const initiateRegistration = async (data: RegisterStudentDto) => {
    setError(null);
    const { data: resData, error: apiError } = await registerStudentAPI(data);

    if (!apiError && resData) {
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
    } else {
      setError(apiError ?? 'Registration failed. Please verify your details and try again.');
      return false;
    }
    return false;
  };

  /**
   * Step 2: Verify Registration OTP -> moves to Razorpay Payment step
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
      if (resPayload.requiresPayment) {
        setPendingPayment({
          registrationId: pendingRegistration.registrationId,
          feeAmount: resPayload.feeAmount || 300,
          currency: resPayload.currency || 'INR',
          razorpayApiKey: resPayload.razorpayApiKey || '',
        });
        setPendingRegistration(null);
        return true;
      }
      return true;
    } else {
      setError(apiError ?? 'Invalid verification code. Please check and try again.');
      return false;
    }
  };

  /**
   * Step 3: Create Razorpay Order
   */
  const createPaymentOrder = async () => {
    if (!pendingPayment) {
      setError('Payment session not found. Please register again.');
      return null;
    }

    setError(null);
    const { data, error: apiError } = await createRegistrationPaymentOrderAPI({
      registrationId: pendingPayment.registrationId,
    });

    if (!apiError && data) {
      return (data as any).data || data;
    } else {
      setError(apiError ?? 'Failed to initialize payment gateway. Please try again.');
      return null;
    }
  };

  /**
   * Step 4: Verify Payment Signature & Finalize Registration
   */
  const verifyPayment = async (payload: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    if (!pendingPayment) {
      setError('Payment session invalid.');
      return false;
    }

    setError(null);
    const { data, error: apiError } = await verifyRegistrationPaymentAPI({
      registrationId: pendingPayment.registrationId,
      ...payload,
    });

    if (!apiError && data) {
      const resPayload = (data as any).data || data;
      setRegistrationSuccess({
        requiresApproval: resPayload.requiresApproval,
        status: resPayload.status,
        student: resPayload.student,
      });
      setPendingPayment(null);
      return true;
    } else {
      setError(
        apiError ??
          'Payment verification failed. If your account was debited, please contact support.',
      );
      return false;
    }
  };

  /**
   * Resend Registration OTP
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
    setPendingPayment(null);
    setRegistrationSuccess(null);
    setError(null);
  };

  return {
    initiateRegistration,
    verifyRegistrationOtp,
    createPaymentOrder,
    verifyPayment,
    resendOtp,
    reset,
    pendingRegistration,
    pendingPayment,
    registrationSuccess,
    error,
    setError,
    isLoading:
      isInitiating || isVerifyingOtp || isResending || isCreatingOrder || isVerifyingPayment,
    isInitiating,
    isVerifyingOtp,
    isResending,
    isCreatingOrder,
    isVerifyingPayment,
  };
};
