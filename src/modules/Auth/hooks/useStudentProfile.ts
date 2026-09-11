import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useStudentProfileAPI } from '../services';
import { useAppDispatch } from '@/redux/store';
import { setUserData } from '@/redux/slices/authSlice';
import { studentKeys } from '@/services/queryKeys';
import type { StudentProfile } from '../types/auth.types';

export const useStudentProfile = () => {
  const queryClient = useQueryClient();
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
      // Synchronize in Redux without overwriting active admin/super-admin roles
      const returnedRoles = studentData.user?.roles?.length ? studentData.user.roles : undefined;
      dispatch(
        setUserData({
          id: studentData.userId || studentData.user?.id || '',
          email: studentData.user?.email || null,
          mobileNumber: studentData.user?.mobileNumber || studentData.user?.phone || null,
          phone: studentData.user?.phone || studentData.user?.mobileNumber || null,
          isActive: studentData.user?.isActive ?? true,
          isVerified: studentData.user?.isVerified ?? true,
          ...(returnedRoles ? { roles: returnedRoles } : {}),
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

  const updateProfile = async (data: { name?: string; preferredLanguageId?: string }) => {
    setError(null);
    setSuccessMessage(null);
    // Strictly restrict payload to editable fields: name and preferredLanguageId
    const sanitizedPayload: { name?: string; preferredLanguageId?: string } = {};
    if (data.name !== undefined) sanitizedPayload.name = data.name.trim();
    if (data.preferredLanguageId !== undefined)
      sanitizedPayload.preferredLanguageId = data.preferredLanguageId;

    const { data: updated, error: apiError } = await updateStudentProfile(sanitizedPayload);
    if (!apiError && updated) {
      const studentData = (updated as any).data || updated;
      setProfile(studentData);
      setSuccessMessage('Profile updated successfully!');
      
      // Invalidate only affected profile & dashboard queries in React Query cache
      queryClient.invalidateQueries({ queryKey: studentKeys.profile() });
      queryClient.invalidateQueries({ queryKey: studentKeys.dashboard() });

      const returnedRoles = studentData.user?.roles?.length ? studentData.user.roles : undefined;
      dispatch(
        setUserData({
          id: studentData.userId || studentData.user?.id || '',
          email: studentData.user?.email || null,
          mobileNumber: studentData.user?.mobileNumber || studentData.user?.phone || null,
          phone: studentData.user?.phone || studentData.user?.mobileNumber || null,
          isActive: studentData.user?.isActive ?? true,
          isVerified: studentData.user?.isVerified ?? true,
          ...(returnedRoles ? { roles: returnedRoles } : {}),
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
