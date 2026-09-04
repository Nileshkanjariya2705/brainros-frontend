import { useCallback } from 'react';
import { useAxiosGet, useAxiosPost, useAxiosDelete } from '@/hooks/useAxios';

export interface AdminStudentItem {
  id: string;
  studentId: string;
  studentCode: string;
  name: string;
  email: string;
  mobile: string;
  schoolCollege: string;
  state: { id?: string; name: string; code?: string };
  district: { id?: string; name: string; code?: string };
  class: { id: string; name: string } | null;
  examTarget: { id: string; name: string } | null;
  institutions: Array<{ id: string; name: string; code: string; batchName?: string }>;
  status: string;
  createdAt: string;
  parentsCount: number;
  hasParent: boolean;
}

export interface AdminStudentsPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminStudentsResponse {
  items: AdminStudentItem[];
  pagination: AdminStudentsPagination;
}

export interface AdminStudentFilterOptions {
  states: Array<{ id: string; name: string; code: string }>;
  districts: Array<{ id: string; name: string; code?: string; stateId: string }>;
  classes: Array<{ id: string; name: string }>;
  examTargets: Array<{ id: string; name: string }>;
  institutions: Array<{ id: string; name: string; code: string }>;
  statuses: Array<{ label: string; value: string }>;
}

export interface ParentLinkItem {
  id: string;
  parentId: string;
  name: string;
  mobile: string;
  email: string;
  relationship: string;
  status: string;
  linkedAt: string;
  revokedAt?: string | null;
}

export interface StudentParentsResponse {
  student: {
    id: string;
    studentId: string;
    studentCode: string;
    name: string;
  };
  parents: ParentLinkItem[];
}

export interface AddStudentParentPayload {
  name: string;
  mobile: string;
  email: string;
  relationship: 'FATHER' | 'MOTHER' | 'GUARDIAN' | 'OTHER';
}

export interface AdminStudentsQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  classId?: string;
  examTargetId?: string;
  stateId?: string;
  districtId?: string;
  institutionId?: string;
  createdFrom?: string;
  createdTo?: string;
}

export const useGetAdminStudentsAPI = () => {
  const [get, state] = useAxiosGet();
  const getAdminStudentsAPI = useCallback(
    (params: AdminStudentsQueryParams = {}) => {
      const searchParams = new URLSearchParams();
      if (params.page) searchParams.append('page', String(params.page));
      if (params.pageSize) searchParams.append('pageSize', String(params.pageSize));
      if (params.search && params.search.trim()) searchParams.append('search', params.search.trim());
      if (params.sortBy) searchParams.append('sortBy', params.sortBy);
      if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
      if (params.status) searchParams.append('status', params.status);
      if (params.classId) searchParams.append('classId', params.classId);
      if (params.examTargetId) searchParams.append('examTargetId', params.examTargetId);
      if (params.stateId) searchParams.append('stateId', params.stateId);
      if (params.districtId) searchParams.append('districtId', params.districtId);
      if (params.institutionId) searchParams.append('institutionId', params.institutionId);
      if (params.createdFrom) searchParams.append('createdFrom', params.createdFrom);
      if (params.createdTo) searchParams.append('createdTo', params.createdTo);

      const qs = searchParams.toString() ? `?${searchParams.toString()}` : '';
      return get<AdminStudentsResponse>(`/admin/students${qs}`);
    },
    [get],
  );
  return { getAdminStudentsAPI, ...state };
};

export const useGetAdminStudentFilterOptionsAPI = () => {
  const [get, state] = useAxiosGet();
  const getAdminStudentFilterOptionsAPI = useCallback(
    () => get<AdminStudentFilterOptions>('/admin/students/filter-options'),
    [get],
  );
  return { getAdminStudentFilterOptionsAPI, ...state };
};

export const useGetStudentParentsAPI = () => {
  const [get, state] = useAxiosGet();
  const getStudentParentsAPI = useCallback(
    (studentId: string) => get<StudentParentsResponse>(`/admin/students/${studentId}/parents`),
    [get],
  );
  return { getStudentParentsAPI, ...state };
};

export const useAddStudentParentAPI = () => {
  const [post, state] = useAxiosPost();
  const addStudentParentAPI = useCallback(
    (studentId: string, payload: AddStudentParentPayload) =>
      post<{ message: string; data: ParentLinkItem }>(
        `/admin/students/${studentId}/parents`,
        payload,
      ),
    [post],
  );
  return { addStudentParentAPI, ...state };
};

export const useRevokeStudentParentAPI = () => {
  const [del, state] = useAxiosDelete();
  const revokeStudentParentAPI = useCallback(
    (studentId: string, linkId: string) =>
      del<{ message: string }>(`/admin/students/${studentId}/parents/${linkId}`),
    [del],
  );
  return { revokeStudentParentAPI, ...state };
};
