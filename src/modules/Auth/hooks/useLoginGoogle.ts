import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import { useLoginGoogleAPI } from '../services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

export const useLoginGoogle = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loginGoogleAPI, isLoading } = useLoginGoogleAPI();
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = async (idToken: string) => {
    setError(null);
    const { data, error: apiError } = await loginGoogleAPI({ idToken });

    if (!apiError && data) {
      dispatch(setCredentials(data));
      navigate(PRIVATE_NAVIGATION.dashboard, { replace: true });
      return true;
    } else {
      setError(apiError ?? 'Google Sign-In failed. Please try again or use another login method.');
      return false;
    }
  };

  return { loginWithGoogle, isLoading, error, setError };
};
