import { useCallback, useState } from 'react';
import type { AxiosRequestConfig } from 'axios';
import { Axios } from '@/base-axios';
import type {
  ExamImportSession,
  ExamImportFilterParams,
  ExamItem,
} from '../types/examManager.types';

const EXAM_MANAGER_BASE_PATH = '/admin/exam-manager';

export const useUploadQuestionPaperAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadQuestionPaperAPI = useCallback(
    async (file: File, config: AxiosRequestConfig = {}) => {
      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);
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
        setIsSuccess(true);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data, error: null, isSuccess: true };
      } catch (err: any) {
        setIsLoading(false);
        setIsError(true);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to upload question paper.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
      }
    },
    [],
  );

  return { uploadQuestionPaperAPI, isLoading, isError, isSuccess, error };
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
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data: data as ExamImportSession, error: null, isSuccess: true };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to fetch import session.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
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
    async (
      importId: string,
      params?: ExamImportFilterParams,
      config: AxiosRequestConfig = {},
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.get(
          `${EXAM_MANAGER_BASE_PATH}/import/${importId}/rows`,
          { params, ...config },
        );
        setIsLoading(false);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data, error: null, isSuccess: true };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to fetch import rows.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
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
          { params, ...config },
        );
        setIsLoading(false);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data, error: null, isSuccess: true };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to fetch import history.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
      }
    },
    [],
  );

  return { getExamImportHistoryAPI, isLoading, error };
};

export const useGetExamsListAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExamsListAPI = useCallback(
    async (params?: any, config: AxiosRequestConfig = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.get(`${EXAM_MANAGER_BASE_PATH}/exams`, {
          params,
          ...config,
        });
        setIsLoading(false);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data: data as ExamItem[], error: null, isSuccess: true };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to fetch exams list.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
      }
    },
    [],
  );

  return { getExamsListAPI, isLoading, error };
};

export const useGetExamDetailsAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getExamDetailsAPI = useCallback(
    async (examId: string, config: AxiosRequestConfig = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.get(
          `${EXAM_MANAGER_BASE_PATH}/exams/${examId}`,
          config,
        );
        setIsLoading(false);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data: data as ExamItem, error: null, isSuccess: true };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to fetch exam details.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
      }
    },
    [],
  );

  return { getExamDetailsAPI, isLoading, error };
};

/**
 * Direct file download helper for Question Paper Template
 */
export const downloadQuestionPaperTemplate = async (format: 'xlsx' | 'csv' = 'xlsx') => {
  const response = await Axios.get(`${EXAM_MANAGER_BASE_PATH}/template`, {
    params: { format },
    responseType: 'blob',
  });

  const blob = new Blob([response.data], {
    type:
      format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv',
  });

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `question_paper_import_template.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

/**
 * Direct file download helper for Question Paper Import Error Report
 */
export const downloadQuestionPaperErrorReport = async (
  importId: string,
  format: 'xlsx' | 'csv' = 'xlsx',
) => {
  const response = await Axios.get(
    `${EXAM_MANAGER_BASE_PATH}/import/${importId}/errors/export`,
    {
      params: { format },
      responseType: 'blob',
    },
  );

  const blob = new Blob([response.data], {
    type:
      format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv',
  });

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `question_paper_errors_${importId.slice(0, 8)}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};
