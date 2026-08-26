import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import { useLoginStudentIdAPI } from '../services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';
import type { LoginStudentIdDto } from '../types/auth.types';

export const useLoginStudentId = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loginStudentIdAPI, isLoading } = useLoginStudentIdAPI();
  const [error, setError] = useState<string | null>(null);

  const loginWithStudentId = async (credentials: LoginStudentIdDto) => {
    setError(null);
    const { data, error: apiError } = await loginStudentIdAPI(credentials);

    if (!apiError && data) {
      dispatch(setCredentials(data));
      navigate(PRIVATE_NAVIGATION.dashboard, { replace: true });
      return true;
    } else {
      setError(apiError ?? 'Invalid Student ID or password. Please verify and try again.');
      return false;
    }
  };

  return { loginWithStudentId, isLoading, error, setError };
};
