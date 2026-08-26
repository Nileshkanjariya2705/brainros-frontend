import { useState, useCallback, useEffect } from 'react';
import { useStudentProfileAPI } from '../services';
import { useAppDispatch } from '@/redux/store';
import { setUserData } from '@/redux/slices/authSlice';
import type { StudentProfile } from '../types/auth.types';

export const useStudentProfile = () => {
  const dispatch = useAppDispatch();
  const { getStudentProfile, updateStudentProfile, isLoading } = useStudentProfileAPI();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setError(null);
    const { data, error: apiError } = await getStudentProfile();
    if (!apiError && data) {
      // Unpack response envelope if needed
      const studentData = (data as any).data || data;
      setProfile(studentData);
      // Synchronize in Redux
      dispatch(
        setUserData({
          id: studentData.userId || studentData.user?.id || '',
          email: studentData.user?.email || null,
          mobileNumber: studentData.user?.mobileNumber || studentData.user?.phone || null,
          phone: studentData.user?.phone || studentData.user?.mobileNumber || null,
          isActive: studentData.user?.isActive ?? true,
          isVerified: studentData.user?.isVerified ?? true,
          roles: studentData.user?.roles || ['STUDENT'],
          studentProfile: studentData,
          student: studentData,
        }),
      );
    } else {
      setError(apiError ?? 'Failed to load student profile.');
    }
  }, [getStudentProfile, dispatch]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (data: Partial<StudentProfile>) => {
    setError(null);
    setSuccessMessage(null);
    const { data: updated, error: apiError } = await updateStudentProfile(data);
    if (!apiError && updated) {
      const studentData = (updated as any).data || updated;
      setProfile(studentData);
      setSuccessMessage('Profile updated successfully!');
      dispatch(
        setUserData({
          id: studentData.userId || studentData.user?.id || '',
          email: studentData.user?.email || null,
          mobileNumber: studentData.user?.mobileNumber || studentData.user?.phone || null,
          phone: studentData.user?.phone || studentData.user?.mobileNumber || null,
          isActive: studentData.user?.isActive ?? true,
          isVerified: studentData.user?.isVerified ?? true,
          roles: studentData.user?.roles || ['STUDENT'],
          studentProfile: studentData,
          student: studentData,
        }),
      );
      return true;
    } else {
      setError(apiError ?? 'Failed to update profile.');
      return false;
    }
  };

  return {
    profile,
    isLoading,
    error,
    successMessage,
    fetchProfile,
    updateProfile,
    setError,
    setSuccessMessage,
  };
};
