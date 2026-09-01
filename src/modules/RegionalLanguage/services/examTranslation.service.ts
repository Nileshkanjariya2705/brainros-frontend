import { useCallback, useState } from 'react';
import type { AxiosRequestConfig } from 'axios';
import { Axios } from '@/base-axios';
import { useAxiosGet } from '@/hooks/useAxios';

export interface ExamLanguageCoverageItem {
  languageId: string;
  languageCode: string;
  languageName: string;
  nativeName: string;
  isDefault: boolean;
  totalQuestions: number;
  translatedQuestions: number;
  questionCoveragePercentage: number;
  totalOptions: number;
  translatedOptions: number;
  optionCoveragePercentage: number;
  overallCoveragePercentage: number;
  status: 'COMPLETE' | 'IN_PROGRESS' | 'NOT_STARTED';
  missingQuestionsCount: number;
  missingQuestionIds: string[];
  lastUpdatedAt?: string | null;
}

export interface ExamTranslationCoverageResponse {
  examId: string;
  examTitle: string;
  totalQuestions: number;
  totalOptions: number;
  languages: ExamLanguageCoverageItem[];
  overallCompletenessPercentage: number;
  isAllRequiredComplete: boolean;
}

export interface TranslationTargetItem {
  id: string;
  title: string;
  type: 'LIVE_EXAM' | 'MOCK' | 'SUBJECT_MOCK';
  typeLabel: string;
  subject: {
    id: string;
    name: string;
    code?: string | null;
  } | null;
  subjectsSummary: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  status: string;
  createdAt: string; // Authoritative DB createdAt (ISO 8601)
  updatedAt: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
  translationCoverage: Record<string, number>; // e.g. { EN: 100, HI: 85, GU: 60 }
  languagesCount: number;
  overallCoveragePercentage: number;
  isAllRequiredComplete: boolean;
  isLocked: boolean;
}

export interface TranslationTargetsResponse {
  items: TranslationTargetItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExamTranslationTargetsQueryParams {
  type?: 'ALL' | 'LIVE_EXAM' | 'MOCK' | 'SUBJECT_MOCK';
  search?: string;
  status?: string;
  subjectId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'title' | 'totalQuestions';
  sortOrder?: 'asc' | 'desc';
}

export interface ExamTranslationRowDiff {
  rowNumber: number;
  questionId: string;
  questionText: string;
  action: 'NEW' | 'UPDATE' | 'UNCHANGED' | 'INVALID';
  translatedOptionsCount: number;
  totalOptionsCount: number;
  errors: string[];
}

export interface ExamTranslationValidationResponse {
  examId: string;
  languageId: string;
  languageName: string;
  languageCode: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  newTranslationsCount: number;
  updatedTranslationsCount: number;
  unchangedTranslationsCount: number;
  missingExamQuestionsCount: number;
  coverageAfterImportPercentage: number;
  rowDetails: ExamTranslationRowDiff[];
  errors: string[];
}

export interface ExamTranslationImportResult {
  success: boolean;
  message: string;
  stats: {
    importedQuestions: number;
    importedOptions: number;
  };
  coverage: ExamTranslationCoverageResponse;
}

// ─── 1. Get Translation Targets Listing (Exams, Mocks, Subject-wise Mocks) ─
export const useGetTranslationTargetsAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getTranslationTargetsAPI = useCallback(
    async (params: ExamTranslationTargetsQueryParams = {}) => {
      const queryParts: string[] = [];
      if (params.type && params.type !== 'ALL') queryParts.push(`type=${params.type}`);
      if (params.search && params.search.trim())
        queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
      if (params.status && params.status !== 'ALL')
        queryParts.push(`status=${params.status}`);
      if (params.subjectId && params.subjectId !== 'ALL')
        queryParts.push(`subjectId=${params.subjectId}`);
      if (params.from) queryParts.push(`from=${params.from}`);
      if (params.to) queryParts.push(`to=${params.to}`);
      if (params.page) queryParts.push(`page=${params.page}`);
      if (params.limit) queryParts.push(`limit=${params.limit}`);
      if (params.sortBy) queryParts.push(`sortBy=${params.sortBy}`);
      if (params.sortOrder) queryParts.push(`sortOrder=${params.sortOrder}`);

      const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
      return getReq<TranslationTargetsResponse>(`/translations/targets${queryString}`);
    },
    [getReq],
  );

  return { getTranslationTargetsAPI, ...state };
};

// ─── 2. Get Exam Translation Coverage ─────────────────────────────
export const useGetExamTranslationCoverageAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getExamTranslationCoverageAPI = useCallback(
    async (examId: string) => {
      return getReq<ExamTranslationCoverageResponse>(
        `/exams/${examId}/translations/coverage`,
      );
    },
    [getReq],
  );

  return { getExamTranslationCoverageAPI, ...state };
};

// ─── 3. Download Exam Pre-filled Translation Template ─────────────
export const downloadExamTranslationTemplate = async (
  examId: string,
  languageId: string,
  format: 'xlsx' | 'csv' = 'xlsx',
) => {
  const response = await Axios.get(
    `/exams/${examId}/translations/template?languageId=${languageId}&format=${format}`,
    {
      responseType: 'blob',
    },
  );

  const blob = new Blob([response.data], {
    type:
      format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `exam_translation_template_${languageId}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ─── 4. Export Existing Exam Translations ─────────────────────────
export const exportExamTranslations = async (
  examId: string,
  languageId: string,
  format: 'xlsx' | 'csv' = 'xlsx',
) => {
  const response = await Axios.get(
    `/exams/${examId}/translations/export?languageId=${languageId}&format=${format}`,
    {
      responseType: 'blob',
    },
  );

  const blob = new Blob([response.data], {
    type:
      format === 'csv'
        ? 'text/csv'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `exam_translations_${languageId}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// ─── 5. Validate Uploaded Exam Translation File ───────────────────
export const useValidateExamTranslationFileAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateExamTranslationFileAPI = useCallback(
    async (
      examId: string,
      languageId: string,
      file: File,
      config: AxiosRequestConfig = {},
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('languageId', languageId);

        const response = await Axios.post(
          `/exams/${examId}/translations/validate`,
          formData,
          {
            ...config,
          },
        );

        setIsLoading(false);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return {
          data: data as ExamTranslationValidationResponse,
          error: null,
          isSuccess: true,
        };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to validate translation file.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
      }
    },
    [],
  );

  return { validateExamTranslationFileAPI, isLoading, error };
};

// ─── 6. Import Exam Translations ──────────────────────────────────
export const useImportExamTranslationsAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const importExamTranslationsAPI = useCallback(
    async (
      examId: string,
      languageId: string,
      file: File,
      replaceMode = false,
      config: AxiosRequestConfig = {},
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('languageId', languageId);
        if (replaceMode) {
          formData.append('replaceMode', 'true');
        }

        const response = await Axios.post(
          `/exams/${examId}/translations/import`,
          formData,
          {
            ...config,
          },
        );

        setIsLoading(false);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return {
          data: data as ExamTranslationImportResult,
          error: null,
          isSuccess: true,
        };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to import translation file.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
      }
    },
    [],
  );

  return { importExamTranslationsAPI, isLoading, error };
};
