import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import {
  useRequestPasswordlessLoginOtpAPI,
  useVerifyPasswordlessLoginOtpAPI,
  useVerifyMsg91TokenAPI,
  useResendOtpAPI,
  useGetOtpConfigAPI,
} from '../services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { createTabSession } from '@/utils/tabSession';

export interface PendingLoginState {
  loginRequestId: string;
  mobileMasked: string;
  expiresIn: number;
  resendAvailableIn: number;
  identifier: string;
  otpLength?: number;
  bypassOtp?: boolean;
  devBypassOtp?: string;
}

export const usePasswordlessLogin = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const { requestPasswordlessLoginOtpAPI, isLoading: isRequestingBackendOtp } =
    useRequestPasswordlessLoginOtpAPI();

  const { verifyPasswordlessLoginOtpAPI, isLoading: isVerifyingBackendOtp } =
    useVerifyPasswordlessLoginOtpAPI();

  const { verifyMsg91TokenAPI, isLoading: isVerifyingToken } =
    useVerifyMsg91TokenAPI();

  const { resendOtpAPI, isLoading: isResendingBackendOtp } = useResendOtpAPI();
  const { getOtpConfigAPI } = useGetOtpConfigAPI();

  const [pendingLogin, setPendingLogin] = useState<PendingLoginState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);

  const maskPhone = (phone: string): string => {
    const digits = phone.replace(/[^\d]/g, '');
    if (digits.length < 4) return '******';
    return '******' + digits.slice(-4);
  };

  /**
   * Helper to wait for hCaptcha initialization before triggering MSG91 headless sendOtp
   */
  const waitForCaptchaReady = async (maxMs = 2000): Promise<void> => {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if (typeof (window as any).hcaptcha === 'object') {
        return;
      }
      await new Promise((r) => setTimeout(r, 100));
    }
  };

  /**
   * Executes MSG91 sendOtp with captcha pre-check and silent-exit watchdog retry
   */
  const executeMsg91SendOtp = async (
    phone: string,
    retryCount = 1,
  ): Promise<{ success: boolean; data?: any; error?: string }> => {
    await waitForCaptchaReady(1500);

    return new Promise((resolve) => {
      let settled = false;

      // Watchdog: detect MSG91 silent return when captcha was pending on first request
      const watchdog = setTimeout(async () => {
        if (!settled) {
          if (retryCount > 0) {
            console.warn(
              '[MSG91] No callback received within 1800ms (captcha warming), auto-retrying sendOtp...',
            );
            await new Promise((r) => setTimeout(r, 600));
            const retryRes = await executeMsg91SendOtp(phone, retryCount - 1);
            if (!settled) {
              settled = true;
              clearTimeout(timeout);
              resolve(retryRes);
            }
          }
        }
      }, 1800);

      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          clearTimeout(watchdog);
          resolve({
            success: false,
            error: 'OTP request timed out. Please try again.',
          });
        }
      }, 15000);

      try {
        (window as any).sendOtp(
          phone,
          (res: any) => {
            if (!settled) {
              settled = true;
              clearTimeout(watchdog);
              clearTimeout(timeout);
              resolve({ success: true, data: res });
            }
          },
          (err: any) => {
            if (!settled) {
              settled = true;
              clearTimeout(watchdog);
              clearTimeout(timeout);
              const msg =
                typeof err === 'string'
                  ? err
                  : err?.message || err?.detail || 'Failed to send OTP via MSG91.';
              resolve({ success: false, error: msg });
            }
          },
        );
      } catch (err: any) {
        if (!settled) {
          settled = true;
          clearTimeout(watchdog);
          clearTimeout(timeout);
          resolve({ success: false, error: err?.message || 'Error executing MSG91 sendOtp' });
        }
      }
    });
  };

  /**
   * 1. Request login OTP with mobile number
   * - If BYPASS_OTP is true: skip MSG91, call backend dev challenge with OTP '1234'
   * - If BYPASS_OTP is false: call MSG91 headless sendOtp with pre-warmed hCaptcha
   */
  const requestOtp = async (identifier: string): Promise<boolean> => {
    setError(null);
    setIsRequestingOtp(true);

    const cleanDigits = identifier.replace(/[^\d]/g, '');
    const formattedPhone =
      cleanDigits.startsWith('91') && cleanDigits.length === 12
        ? cleanDigits
        : cleanDigits.length === 10
          ? `91${cleanDigits}`
          : cleanDigits;

    const maskedPhone = maskPhone(formattedPhone);

    // Determine whether bypass mode is active (controlled strictly by backend)
    let isBypass = false;
    try {
      const { data: configData } = await getOtpConfigAPI();
      if (configData && typeof configData.bypassOtp === 'boolean') {
        isBypass = configData.bypassOtp;
      }
    } catch (err) {
      console.warn('[Auth] Failed to fetch OTP config from backend, defaulting to false:', err);
    }

    // ─── A. BYPASS OTP MODE: Handled purely by backend (do NOT call MSG91) ──
    if (isBypass) {
      console.log('[Auth] Backend BYPASS_OTP is true: Skipping MSG91 API call');
      const { data, error: apiError } = await requestPasswordlessLoginOtpAPI({
        identifier,
      });

      setIsRequestingOtp(false);
      if (!apiError && data) {
        setPendingLogin({
          loginRequestId: data.loginRequestId,
          mobileMasked: data.mobileMasked || maskedPhone,
          expiresIn: data.expiresIn || 300,
          resendAvailableIn: data.resendAvailableIn || 60,
          identifier,
          otpLength: data.otpLength || 4,
          bypassOtp: true,
          devBypassOtp: data.devBypassOtp || '1234',
        });
        return true;
      } else {
        setError(
          apiError ?? 'Failed to initiate login. Please verify your mobile number.',
        );
        return false;
      }
    }

    // ─── B. REAL OTP MODE: Send via MSG91 Headless SDK ───────────────────────
    if (typeof (window as any).sendOtp === 'function') {
      try {
        const sendResult = await executeMsg91SendOtp(formattedPhone);

        if (sendResult.success) {
          setPendingLogin({
            loginRequestId:
              sendResult.data?.message ||
              sendResult.data?.request_id ||
              `msg91-${Date.now()}`,
            mobileMasked: maskedPhone,
            expiresIn: 300,
            resendAvailableIn: 60,
            identifier: formattedPhone,
            otpLength: 4, // MSG91 OTP Widget sends 4 digits
            bypassOtp: false,
          });
          setIsRequestingOtp(false);
          return true;
        } else {
          setError(sendResult.error || 'Failed to send OTP. Please try again.');
          setIsRequestingOtp(false);
          return false;
        }
      } catch (err: any) {
        console.warn('[MSG91 Headless] sendOtp failed, attempting backend fallback:', err);
      }
    }

    // Fallback to server-side passwordless login API
    const { data, error: apiError } = await requestPasswordlessLoginOtpAPI({
      identifier,
    });

    setIsRequestingOtp(false);
    if (!apiError && data) {
      setPendingLogin({
        loginRequestId: data.loginRequestId,
        mobileMasked: data.mobileMasked || maskedPhone,
        expiresIn: data.expiresIn || 300,
        resendAvailableIn: data.resendAvailableIn || 60,
        identifier,
        otpLength: data.otpLength || 4,
        bypassOtp: data.bypassOtp || false,
        devBypassOtp: data.devBypassOtp,
      });
      return true;
    } else {
      setError(
        apiError ?? 'Failed to send OTP. Please verify your mobile number and try again.',
      );
      return false;
    }
  };

  /**
   * 2. Verify login OTP and complete authentication
   */
  const verifyOtp = async (otp: string): Promise<boolean> => {
    if (!pendingLogin) {
      setError('Login session expired. Please request a new OTP.');
      return false;
    }

    setError(null);
    setIsVerifyingOtp(true);

    const cleanOtp = otp.trim();

    // ─── A. BYPASS OTP MODE: Direct verify against backend dev challenge ─────
    if (pendingLogin.bypassOtp) {
      const { data, error: apiError } = await verifyPasswordlessLoginOtpAPI({
        loginRequestId: pendingLogin.loginRequestId,
        otp: cleanOtp,
      });

      setIsVerifyingOtp(false);
      if (!apiError && data) {
        createTabSession();
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
    }

    // ─── B. REAL OTP MODE: Verify via MSG91 Headless SDK ─────────────────────
    if (typeof (window as any).verifyOtp === 'function') {
      try {
        const verifyResult = await new Promise<{
          success: boolean;
          token?: string;
          error?: string;
        }>((resolve) => {
          const timeout = setTimeout(() => {
            resolve({
              success: false,
              error: 'Verification timed out. Please try again.',
            });
          }, 15000);

          (window as any).verifyOtp(
            cleanOtp,
            (res: any) => {
              clearTimeout(timeout);
              const token =
                typeof res === 'string'
                  ? res
                  : res?.message || res?.token || res?.['access-token'] || res?.data;
              resolve({ success: true, token });
            },
            (err: any) => {
              clearTimeout(timeout);
              const msg =
                typeof err === 'string'
                  ? err
                  : err?.message || 'Invalid or expired OTP code.';
              resolve({ success: false, error: msg });
            },
          );
        });

        if (verifyResult.success && verifyResult.token) {
          const { data: res, error: apiError } = await verifyMsg91TokenAPI(
            verifyResult.token,
          );

          if (!apiError && res) {
            createTabSession();
            dispatch(
              setCredentials({
                accessToken: res.accessToken,
                refreshToken: res.refreshToken,
                user: res.user,
                student: res.student,
              }),
            );
            navigate(PRIVATE_NAVIGATION.dashboard, { replace: true });
            setIsVerifyingOtp(false);
            return true;
          } else {
            setError(apiError || 'Failed to complete login with verified token.');
            setIsVerifyingOtp(false);
            return false;
          }
        } else if (verifyResult.error) {
          setError(verifyResult.error);
          setIsVerifyingOtp(false);
          return false;
        }
      } catch (err: any) {
        console.warn('[MSG91 Headless] verifyOtp error, falling back:', err);
      }
    }

    // Server-side fallback verify
    const { data, error: apiError } = await verifyPasswordlessLoginOtpAPI({
      loginRequestId: pendingLogin.loginRequestId,
      otp: cleanOtp,
    });

    setIsVerifyingOtp(false);
    if (!apiError && data) {
      createTabSession();
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
  const resendOtp = async (): Promise<boolean> => {
    if (!pendingLogin) return false;
    setError(null);
    setIsResendingOtp(true);

    // Bypass mode resend: re-arms dev challenge on backend
    if (pendingLogin.bypassOtp) {
      const { error: apiError } = await resendOtpAPI({
        loginRequestId: pendingLogin.loginRequestId,
      });

      setIsResendingOtp(false);
      if (!apiError) {
        return true;
      } else {
        setError(apiError ?? 'Failed to resend OTP. Please wait before retrying.');
        return false;
      }
    }

    // Real mode resend: try MSG91 retryOtp first
    if (typeof (window as any).retryOtp === 'function') {
      try {
        const retryResult = await new Promise<boolean>((resolve) => {
          (window as any).retryOtp(
            null,
            () => resolve(true),
            (err: any) => {
              const msg =
                typeof err === 'string'
                  ? err
                  : err?.message || 'Failed to resend OTP via MSG91.';
              setError(msg);
              resolve(false);
            },
          );
        });

        if (retryResult) {
          setIsResendingOtp(false);
          return true;
        }
      } catch (err: any) {
        console.warn('[MSG91 Headless] retryOtp error, falling back:', err);
      }
    }

    const { error: apiError } = await resendOtpAPI({
      loginRequestId: pendingLogin.loginRequestId,
    });

    setIsResendingOtp(false);
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
    isLoading:
      isRequestingOtp ||
      isVerifyingOtp ||
      isResendingOtp ||
      isRequestingBackendOtp ||
      isVerifyingBackendOtp ||
      isVerifyingToken ||
      isResendingBackendOtp,
    isRequestingOtp: isRequestingOtp || isRequestingBackendOtp,
    isVerifyingOtp: isVerifyingOtp || isVerifyingBackendOtp || isVerifyingToken,
    isResendingOtp: isResendingOtp || isResendingBackendOtp,
  };
};
