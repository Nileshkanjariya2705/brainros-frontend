import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import { useLoginEmailAPI } from '../services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import type { LoginEmailDto } from '../types/auth.types';

export const useLoginEmail = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loginEmailAPI, isLoading } = useLoginEmailAPI();
  const [error, setError] = useState<string | null>(null);

  const loginWithEmail = async (credentials: LoginEmailDto) => {
    setError(null);
    const { data, error: apiError } = await loginEmailAPI(credentials);

    if (!apiError && data) {
      dispatch(setCredentials(data));
      navigate(PRIVATE_NAVIGATION.dashboard, { replace: true });
      return true;
    } else {
      setError(apiError ?? 'Invalid email or password. Please try again.');
      return false;
    }
  };

  return { loginWithEmail, isLoading, error, setError };
};
