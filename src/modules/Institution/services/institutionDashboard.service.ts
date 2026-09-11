import { useQuery } from '@tanstack/react-query';
import { Axios } from '@/base-axios';

export interface InstitutionSummary {
  totalStudents: number;
  activeStudents: number;
  testsConducted: number;
  averagePercentage: number;
  averageAccuracy: number;
  attendancePercentage: number;
}

export interface InstitutionBatchSummary {
  batchId: string;
  batchName: string;
  studentCount: number;
  activeStudents: number;
  averagePercentage: number;
  averageAccuracy: number;
  attendancePercentage: number;
  topStudent: {
    studentId: string;
    name: string;
    percentage: number;
  } | null;
}

export interface InstitutionDashboardData {
  institution: {
    institutionId: string;
    name: string;
    code: string;
    type: string;
    status: string;
  };
  summary: InstitutionSummary;
  topStudent: {
    studentId: string;
    name: string;
    percentage: number;
  } | null;
  weakestSubject: {
    subjectId: string;
    name: string;
    accuracy: number;
  } | null;
  batches: InstitutionBatchSummary[];
}

export interface InstituteStudentItem {
  id: string;
  studentId: string;
  studentCode: string;
  name: string;
  mobile: string;
  email: string | null;
  className: string;
  examTargetName: string;
  batchId: string | null;
  batchName: string;
  admissionYear: number | null;
  state: string;
  district: string;
  status: string;
  createdAt: string;
}

export interface InstituteStudentsResponse {
  data: InstituteStudentItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InstituteRankItem {
  rank: number;
  studentName: string;
  studentId: string;
  score: number;
  percentage: number;
  accuracy: number;
  batchName?: string;
}

export interface InstituteRankingsResponse {
  data: InstituteRankItem[];
  exam: {
    id: string;
    title: string;
    totalMarks?: number;
  } | null;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InstituteRankExamItem {
  id: string;
  title: string;
  targetName: string;
  createdAt: string;
}

export interface InstituteBatchItem {
  id: string;
  name: string;
  academicYear?: string;
  classLevel?: string;
  status?: string;
}

// ── Query Keys (Centralized) ──
import { institutionKeys } from '@/services/queryKeys';
export { institutionKeys };

// ── Hooks ──

export function useInstitutionDashboardSummaryQuery(batchId?: string) {
  return useQuery<InstitutionDashboardData>({
    queryKey: institutionKeys.dashboard({ batchId }),
    queryFn: async () => {
      const res = await Axios.get('/institutions/me/dashboard', {
        params: batchId ? { batchId } : undefined,
      });
      const raw = res.data?.data ?? res.data;
      return raw || {};
    },
    staleTime: 60 * 1000,
  });
}

export function useInstitutionStudentsQuery(params: {
  page: number;
  limit: number;
  search?: string;
  batchId?: string;
  admissionYear?: number | '';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  return useQuery<InstituteStudentsResponse>({
    queryKey: institutionKeys.students(params),
    queryFn: async () => {
      const cleanParams: Record<string, any> = {
        page: params.page,
        limit: params.limit,
      };
      if (params.search?.trim()) cleanParams.search = params.search.trim();
      if (params.batchId) cleanParams.batchId = params.batchId;
      if (params.admissionYear) cleanParams.admissionYear = params.admissionYear;
      if (params.sortBy) cleanParams.sortBy = params.sortBy;
      if (params.sortOrder) cleanParams.sortOrder = params.sortOrder;

      const res = await Axios.get('/institutions/me/students', { params: cleanParams });
      const raw = res.data;

      let items: InstituteStudentItem[] = [];
      if (Array.isArray(raw?.data)) {
        items = raw.data;
      } else if (Array.isArray(raw?.data?.data)) {
        items = raw.data.data;
      } else if (Array.isArray(raw)) {
        items = raw;
      }

      const meta = raw?.meta || raw?.data?.meta || {
        total: items.length,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(items.length / params.limit) || 1,
      };

      return {
        data: items,
        meta,
      };
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

export function useInstitutionAdmissionYearsQuery() {
  return useQuery<number[]>({
    queryKey: institutionKeys.admissionYears(),
    queryFn: async () => {
      const res = await Axios.get('/institutions/me/admission-years');
      const raw = res.data?.data ?? res.data;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw?.data)) return raw.data;
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useInstitutionBatchesQuery() {
  return useQuery<InstituteBatchItem[]>({
    queryKey: institutionKeys.batches(),
    queryFn: async () => {
      const res = await Axios.get('/institutions/me/batches');
      const raw = res.data?.data ?? res.data;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw?.data)) return raw.data;
      return [];
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useInstitutionRankExamsQuery() {
  return useQuery<InstituteRankExamItem[]>({
    queryKey: institutionKeys.rankExams(),
    queryFn: async () => {
      const res = await Axios.get('/institutions/me/rankings/exams');
      const raw = res.data?.data ?? res.data;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw?.data)) return raw.data;
      return [];
    },
    staleTime: 60 * 1000,
  });
}

export function useInstitutionRankingsQuery(params: {
  examId?: string;
  batchId?: string;
  page: number;
  limit: number;
}) {
  return useQuery<InstituteRankingsResponse>({
    queryKey: institutionKeys.rankings(params),
    queryFn: async () => {
      const cleanParams: Record<string, any> = {
        page: params.page,
        limit: params.limit,
      };
      if (params.examId) cleanParams.examId = params.examId;
      if (params.batchId) cleanParams.batchId = params.batchId;

      const res = await Axios.get('/institutions/me/rankings', { params: cleanParams });
      const raw = res.data;

      let items: InstituteRankItem[] = [];
      if (Array.isArray(raw?.data)) {
        items = raw.data;
      } else if (Array.isArray(raw?.data?.data)) {
        items = raw.data.data;
      } else if (Array.isArray(raw)) {
        items = raw;
      }

      const meta = raw?.meta || raw?.data?.meta || {
        total: items.length,
        page: params.page,
        limit: params.limit,
        totalPages: Math.ceil(items.length / params.limit) || 1,
      };

      const exam = raw?.exam || raw?.data?.exam || null;

      return {
        data: items,
        exam,
        meta,
      };
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30 * 1000,
  });
}

/**
 * Trigger download of institute student directory Excel matching filters
 */
export async function downloadInstituteStudentsExcel(params: {
  search?: string;
  batchId?: string;
  admissionYear?: number | '';
}): Promise<void> {
  const cleanParams: Record<string, any> = {};
  if (params.search?.trim()) cleanParams.search = params.search.trim();
  if (params.batchId) cleanParams.batchId = params.batchId;
  if (params.admissionYear) cleanParams.admissionYear = params.admissionYear;

  const response = await Axios.get('/institutions/me/students/export', {
    params: cleanParams,
    responseType: 'blob',
  });

  // Extract filename from header if present
  let fileName = 'Students_Export.xlsx';
  const disposition = response.headers?.['content-disposition'];
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^";]+)"?/);
    if (match && match[1]) {
      fileName = match[1];
    }
  }

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
