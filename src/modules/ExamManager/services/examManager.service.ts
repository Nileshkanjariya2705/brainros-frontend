import { useCallback, useState } from 'react';
import type { AxiosRequestConfig } from 'axios';
import { Axios } from '@/base-axios';
import type {
  ExamImportSession,
  ExamImportFilterParams,
  BlueprintItem,
  ComprehensiveExamValidationResult,
  CreateExamFromUploadPayload,
  ExamManagerFilterParams,
  ExamListResponse,
  QuestionPaperPreviewResult,
  ExamQuestionPaperDetail,
} from '../types/examManager.types';

const EXAM_MANAGER_BASE_PATH = '/admin/exam-manager';

// ─── 1. Get Predefined / Active Blueprints ───────────────────────
export const useGetBlueprintsAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getBlueprintsAPI = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await Axios.get(`${EXAM_MANAGER_BASE_PATH}/blueprints`);
      setIsLoading(false);
      const data = response?.data?.data !== undefined ? response.data.data : response?.data;
      return { data: data as BlueprintItem[], error: null };
    } catch (err: any) {
      setIsLoading(false);
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Failed to fetch blueprints.';
      setError(errorMsg);
      return { data: null, error: errorMsg };
    }
  }, []);

  return { getBlueprintsAPI, isLoading, error };
};

// ─── 2. Validate Question Paper + Multiple Simultaneous Translations ─
export const useValidateExamUploadAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateExamUploadAPI = useCallback(
    async (
      questionFile: File,
      blueprintId: string,
      translationFiles: Array<{ file: File; languageId: string }> = [],
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('questionFile', questionFile);
        formData.append('blueprintId', blueprintId);

        translationFiles.forEach((tf) => {
          formData.append(`translation_${tf.languageId}`, tf.file);
        });

        const response = await Axios.post(
          `${EXAM_MANAGER_BASE_PATH}/validate`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          },
        );

        setIsLoading(false);
        const data = response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data: data as ComprehensiveExamValidationResult, error: null };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to validate uploaded files.';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }
    },
    [],
  );

  return { validateExamUploadAPI, isLoading, error };
};

// ─── 3. Create Exam From Upload ──────────────────────────────────
export const useCreateExamFromUploadAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExamFromUploadAPI = useCallback(
    async (
      payload: CreateExamFromUploadPayload,
      questionFile: File,
      translationFiles: Array<{ file: File; languageId: string }> = [],
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('title', payload.title);
        formData.append('blueprintId', payload.blueprintId);
        if (payload.description) formData.append('description', payload.description);
        if (payload.durationMinutes)
          formData.append('durationMinutes', String(payload.durationMinutes));
        if (payload.defaultMarksPerQuestion)
          formData.append(
            'defaultMarksPerQuestion',
            String(payload.defaultMarksPerQuestion),
          );
        if (payload.defaultNegativeMarks)
          formData.append(
            'defaultNegativeMarks',
            String(payload.defaultNegativeMarks),
          );
        if (payload.instructions)
          formData.append('instructions', payload.instructions);

        formData.append('questionFile', questionFile);

        translationFiles.forEach((tf) => {
          formData.append(`translation_${tf.languageId}`, tf.file);
        });

        const response = await Axios.post(
          `${EXAM_MANAGER_BASE_PATH}/create-from-upload`,
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          },
        );

        setIsLoading(false);
        const data = response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data, error: null };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to create exam from upload.';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }
    },
    [],
  );

  return { createExamFromUploadAPI, isLoading, error };
};

// ─── 4. Get All Exams List With Filters & Pagination ─────────────
export const useGetExamsListAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExamsListAPI = useCallback(
    async (params: ExamManagerFilterParams = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const queryParts: string[] = [];
        if (params.search && params.search.trim())
          queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
        if (params.type && params.type !== 'ALL') queryParts.push(`type=${params.type}`);
        if (params.status && params.status !== 'ALL')
          queryParts.push(`status=${params.status}`);
        if (params.page) queryParts.push(`page=${params.page}`);
        if (params.limit) queryParts.push(`limit=${params.limit}`);
        if (params.sortBy) queryParts.push(`sortBy=${params.sortBy}`);
        if (params.sortOrder) queryParts.push(`sortOrder=${params.sortOrder}`);

        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const response = await Axios.get(`${EXAM_MANAGER_BASE_PATH}/exams${queryString}`);
        setIsLoading(false);
        const data = response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data: data as ExamListResponse, error: null };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to fetch exams list.';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }
    },
    [],
  );

  return { getExamsListAPI, isLoading, error };
};

// ─── 5. Download Question Paper Template ─────────────────────────
export const downloadQuestionPaperTemplate = async (
  format: 'xlsx' | 'csv' = 'xlsx',
) => {
  const response = await Axios.get(
    `${EXAM_MANAGER_BASE_PATH}/template?format=${format}`,
    { responseType: 'blob' },
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `question_paper_template.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─── 6. Download Error Report ───────────────────────────────────
export const downloadQuestionPaperErrorReport = async (
  importId: string,
  format: 'xlsx' | 'csv' = 'xlsx',
) => {
  const response = await Axios.get(
    `${EXAM_MANAGER_BASE_PATH}/import/${importId}/errors/export?format=${format}`,
    { responseType: 'blob' },
  );
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `question_paper_errors_${importId.slice(0, 8)}.${format}`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// ─── 7. Legacy Single-file Upload (retained for backward compatibility) ─
export const useUploadQuestionPaperAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadQuestionPaperAPI = useCallback(
    async (file: File, config: AxiosRequestConfig = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await Axios.post(
          `${EXAM_MANAGER_BASE_PATH}/import`,
          formData,
          config,
        );
        setIsLoading(false);
        const data = response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data, error: null };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to upload question paper.';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }
    },
    [],
  );

  return { uploadQuestionPaperAPI, isLoading, error };
};

export const useGetExamImportSessionAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExamImportSessionAPI = useCallback(
    async (importId: string, config: AxiosRequestConfig = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.get(
          `${EXAM_MANAGER_BASE_PATH}/import/${importId}`,
          config,
        );
        setIsLoading(false);
        const data = response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data: data as ExamImportSession, error: null };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to fetch import session.';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }
    },
    [],
  );

  return { getExamImportSessionAPI, isLoading, error };
};

export const useGetExamImportRowsAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExamImportRowsAPI = useCallback(
    async (importId: string, params?: ExamImportFilterParams, config: AxiosRequestConfig = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.get(
          `${EXAM_MANAGER_BASE_PATH}/import/${importId}/rows`,
          { ...config, params },
        );
        setIsLoading(false);
        const data = response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data, error: null };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to fetch import rows.';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }
    },
    [],
  );

  return { getExamImportRowsAPI, isLoading, error };
};

export const useGetExamImportHistoryAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExamImportHistoryAPI = useCallback(
    async (params?: ExamImportFilterParams, config: AxiosRequestConfig = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.get(
          `${EXAM_MANAGER_BASE_PATH}/import-history`,
          { ...config, params },
        );
        setIsLoading(false);
        const data = response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data, error: null };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to fetch import history.';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }
    },
    [],
  );

  return { getExamImportHistoryAPI, isLoading, error };
};

// ─── 8. Preview Question Paper Upload (CSV/Excel) ───────────────
export const usePreviewQuestionPaperUploadAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewQuestionPaperUploadAPI = useCallback(
    async (examId: string, file: File) => {
      setIsLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await Axios.post(
          `${EXAM_MANAGER_BASE_PATH}/exams/${examId}/preview-upload`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        setIsLoading(false);
        const data = response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data: data as QuestionPaperPreviewResult, error: null };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to preview question paper.';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }
    },
    [],
  );

  return { previewQuestionPaperUploadAPI, isLoading, error };
};

// ─── 9. Submit Question Paper For Background Processing ──────────
export const useSubmitQuestionPaperUploadAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitQuestionPaperUploadAPI = useCallback(
    async (examId: string, file: File) => {
      setIsLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await Axios.post(
          `${EXAM_MANAGER_BASE_PATH}/exams/${examId}/submit-upload`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } },
        );
        setIsLoading(false);
        const data = response?.data?.data !== undefined ? response.data.data : response?.data;
        return {
          data: data as { importId: string; jobId: string; message: string },
          error: null,
        };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to submit question paper.';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }
    },
    [],
  );

  return { submitQuestionPaperUploadAPI, isLoading, error };
};

// ─── 10. Get Complete Question Paper For Admin View ─────────────
export const useGetExamQuestionPaperAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExamQuestionPaperAPI = useCallback(
    async (examId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.get(
          `${EXAM_MANAGER_BASE_PATH}/exams/${examId}/question-paper`,
        );
        setIsLoading(false);
        const data = response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data: data as ExamQuestionPaperDetail, error: null };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to load question paper.';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }
    },
    [],
  );

  return { getExamQuestionPaperAPI, isLoading, error };
};

// ─── 11. Retry Failed Question Paper Upload ───────────────────────
export const useRetryQuestionPaperUploadAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const retryQuestionPaperUploadAPI = useCallback(
    async (examId: string) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.post(
          `${EXAM_MANAGER_BASE_PATH}/exams/${examId}/retry-upload`,
        );
        setIsLoading(false);
        const data = response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data, error: null };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to retry question paper upload.';
        setError(errorMsg);
        return { data: null, error: errorMsg };
      }
    },
    [],
  );

  return { retryQuestionPaperUploadAPI, isLoading, error };
};

