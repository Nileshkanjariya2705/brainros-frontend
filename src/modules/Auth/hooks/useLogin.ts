// ** Packages **
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ** Redux **
import { useAppDispatch } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';

// ** Services **
import { useLoginAPI } from '../services';

// ** Constants **
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

// ** Types **
import type { LoginCredentials } from '../types/auth.types';

/**
 * HOOK layer = bridges the service hook to React + Redux + navigation.
 * The component consumes `{ login, isLoading, error }` and stays unaware of
 * axios, the store, and routing.
 */
export const useLogin = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loginAPI, isLoading } = useLoginAPI();
  const [error, setError] = useState<string | null>(null);

  const login = async (credentials: LoginCredentials) => {
    setError(null);

    // Standard consumption: destructure data + error from the ExtendedResponse.
    const { data, error: apiError } = await loginAPI(credentials);

    if (!apiError && data) {
      dispatch(setCredentials(data));
      navigate(PRIVATE_NAVIGATION.dashboard, { replace: true });
    } else {
      setError(apiError ?? 'Login failed. Please try again.');
    }
  };

  return { login, isLoading, error };
};
