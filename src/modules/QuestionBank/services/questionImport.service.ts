import { useCallback } from 'react';
import type { AxiosRequestConfig } from 'axios';
import { Axios } from '@/base-axios';
import { useAxiosGet, useAxiosPost, useAxiosPatch } from '@/hooks/useAxios';
import type {
  QuestionImportSession,
  QuestionImportRow,
  QuestionImportFilterParams,
} from '../types/questionImport.types';

const IMPORT_BASE_PATH = '/questions/import';

export const useUploadImportFileAPI = () => {
  const [post, state] = useAxiosPost();
  const uploadImportFileAPI = useCallback(
    async (file: File, config: AxiosRequestConfig = {}) => {
      const formData = new FormData();
      formData.append('file', file);
      return post<{
        id: string;
        fileName: string;
        fileType: string;
        status: string;
        message: string;
      }>(IMPORT_BASE_PATH, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        ...config,
      });
    },
    [post],
  );
  return { uploadImportFileAPI, ...state };
};

export const useGetImportSessionAPI = () => {
  const [get, state] = useAxiosGet();
  const getImportSessionAPI = useCallback(
    async (importId: string, config: AxiosRequestConfig = {}) => {
      return get<QuestionImportSession>(`${IMPORT_BASE_PATH}/${importId}`, config);
    },
    [get],
  );
  return { getImportSessionAPI, ...state };
};

export const useGetImportRowsAPI = () => {
  const [get, state] = useAxiosGet();
  const getImportRowsAPI = useCallback(
    async (
      importId: string,
      params?: QuestionImportFilterParams,
      config: AxiosRequestConfig = {},
    ) => {
      return get<{
        data: QuestionImportRow[];
        meta: {
          total: number;
          page: number;
          limit: number;
          totalPages: number;
        };
      }>(`${IMPORT_BASE_PATH}/${importId}/rows`, {
        params,
        ...config,
      });
    },
    [get],
  );
  return { getImportRowsAPI, ...state };
};

export const useUpdateImportRowAPI = () => {
  const [patch, state] = useAxiosPatch();
  const updateImportRowAPI = useCallback(
    async (
      importId: string,
      rowId: string,
      payload: {
        rawData?: Record<string, any>;
        action?: 'CREATE' | 'UPDATE' | 'NONE';
        targetQuestionId?: string;
      },
      config: AxiosRequestConfig = {},
    ) => {
      return patch<QuestionImportRow>(
        `${IMPORT_BASE_PATH}/${importId}/rows/${rowId}`,
        payload,
        config,
      );
    },
    [patch],
  );
  return { updateImportRowAPI, ...state };
};

export const useConfirmImportAPI = () => {
  const [post, state] = useAxiosPost();
  const confirmImportAPI = useCallback(
    async (importId: string, config: AxiosRequestConfig = {}) => {
      return post<{
        importId: string;
        status: string;
        message: string;
      }>(`${IMPORT_BASE_PATH}/${importId}/confirm`, {}, config);
    },
    [post],
  );
  return { confirmImportAPI, ...state };
};

export const useCancelImportAPI = () => {
  const [post, state] = useAxiosPost();
  const cancelImportAPI = useCallback(
    async (importId: string, config: AxiosRequestConfig = {}) => {
      return post<QuestionImportSession>(`${IMPORT_BASE_PATH}/${importId}/cancel`, {}, config);
    },
    [post],
  );
  return { cancelImportAPI, ...state };
};

/**
 * Direct file download helper for template
 */
export const downloadQuestionTemplate = async (format: 'xlsx' | 'csv' = 'xlsx') => {
  const response = await Axios.get(`${IMPORT_BASE_PATH}/template`, {
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
  link.download = `question_import_template.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

/**
 * Direct file download helper for import error report
 */
export const downloadImportErrorReport = async (
  importId: string,
  format: 'xlsx' | 'csv' = 'xlsx',
) => {
  const response = await Axios.get(`${IMPORT_BASE_PATH}/${importId}/errors/export`, {
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
  link.download = `import_errors_${importId.slice(0, 8)}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};
