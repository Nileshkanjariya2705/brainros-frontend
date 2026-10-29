import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import { useVerifyMsg91TokenAPI } from '../services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import { createTabSession } from '@/utils/tabSession';

declare global {
  interface Window {
    initSendOTP?: (config: any) => void;
  }
}

export const useMsg91Widget = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { verifyMsg91TokenAPI, isLoading: isVerifying } = useVerifyMsg91TokenAPI();

  const loadScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window.initSendOTP === 'function') {
        resolve();
        return;
      }

      const scriptUrls = [
        'https://verify.msg91.com/otp-provider.js',
        'https://verify.phone91.com/otp-provider.js',
      ];

      let i = 0;
      const attempt = () => {
        const s = document.createElement('script');
        s.src = scriptUrls[i];
        s.async = true;
        s.onload = () => resolve();
        s.onerror = () => {
          i++;
          if (i < scriptUrls.length) {
            attempt();
          } else {
            reject(new Error('Failed to load MSG91 OTP widget script'));
          }
        };
        document.head.appendChild(s);
      };

      attempt();
    });
  };

  const openMsg91Widget = useCallback(
    async (identifier?: string) => {
      setError(null);
      setIsLoading(true);

      try {
        await loadScript();

        const widgetId =
          import.meta.env.VITE_MSG91_WIDGET_ID || '366967647843373437303130';
        const tokenAuth =
          import.meta.env.VITE_MSG91_TOKEN_AUTH || '567446TwYGGZ8O6a9ab826P1';

        const config: any = {
          widgetId,
          tokenAuth,
          success: async (data: any) => {
            setIsLoading(true);
            const token =
              typeof data === 'string'
                ? data
                : data?.message || data?.token || data?.data;
            if (!token) {
              setError('Failed to extract verification token from MSG91.');
              setIsLoading(false);
              return;
            }

            const { data: res, error: apiError } = await verifyMsg91TokenAPI(token);
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
            } else {
              setError(
                apiError || 'Failed to complete login with verified token.',
              );
            }
            setIsLoading(false);
          },
          failure: (err: any) => {
            const msg =
              typeof err === 'string'
                ? err
                : err?.message || 'MSG91 OTP verification cancelled or failed.';
            setError(msg);
            setIsLoading(false);
          },
        };

        if (identifier && identifier.trim()) {
          const clean = identifier.replace(/[^\d]/g, '');
          config.identifier =
            clean.startsWith('91') && clean.length === 12
              ? clean
              : `91${clean}`;
        }

        if (typeof window.initSendOTP === 'function') {
          window.initSendOTP(config);
        } else {
          setError('MSG91 Widget initialization failed.');
        }
      } catch (err: any) {
        setError(err?.message || 'Could not load MSG91 OTP widget.');
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, navigate, verifyMsg91TokenAPI],
  );

  return {
    openMsg91Widget,
    isLoading: isLoading || isVerifying,
    error,
    setError,
  };
};
