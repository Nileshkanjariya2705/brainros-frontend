import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/redux/store';
import { setCredentials } from '@/redux/slices/authSlice';
import { useRegisterStudentAPI } from '../services';
import { PRIVATE_NAVIGATION } from '@/constants/navigation.constant';

export const useRegisterStudent = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { registerStudentAPI, isLoading } = useRegisterStudentAPI();
  const [error, setError] = useState<string | null>(null);

  const registerStudent = async (payload: object) => {
    setError(null);
    const { data, error: apiError } = await registerStudentAPI(payload);

    if (!apiError && data) {
      // Map RegisterStudentResponse to setCredentials (matching accessToken, refreshToken, user)
      dispatch(
        setCredentials({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        }),
      );
      navigate(PRIVATE_NAVIGATION.dashboard, { replace: true });
      return true;
    } else {
      setError(apiError ?? 'Registration failed. Please check fields and try again.');
      return false;
    }
  };

  return { registerStudent, isLoading, error };
};
