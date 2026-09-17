import { useCallback, useState } from 'react';
import type { AxiosRequestConfig } from 'axios';
import { Axios } from '@/base-axios';
import type {
  TranslationImportSession,
  TranslationImportRow,
  TranslationImportFilterParams,
} from '../types/translationImport.types';

const TRANSLATION_IMPORT_BASE_PATH = '/translations/import';

export const useUploadTranslationImportFileAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadTranslationImportFileAPI = useCallback(
    async (file: File, config: AxiosRequestConfig = {}) => {
      setIsLoading(true);
      setIsError(false);
      setIsSuccess(false);
      setError(null);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await Axios.post(TRANSLATION_IMPORT_BASE_PATH, formData, {
          ...config,
        });

        setIsLoading(false);
        setIsSuccess(true);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data: data as TranslationImportSession, error: null, isSuccess: true };
      } catch (err: any) {
        setIsLoading(false);
        setIsError(true);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to upload translation file.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
      }
    },
    [],
  );

  return { uploadTranslationImportFileAPI, isLoading, isError, isSuccess, error };
};

export const useGetTranslationImportSessionAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTranslationImportSessionAPI = useCallback(
    async (importId: string, config: AxiosRequestConfig = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.get(
          `${TRANSLATION_IMPORT_BASE_PATH}/${importId}`,
          config,
        );
        setIsLoading(false);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data: data as TranslationImportSession, error: null, isSuccess: true };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to fetch translation session.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
      }
    },
    [],
  );

  return { getTranslationImportSessionAPI, isLoading, error };
};

export const useGetTranslationImportRowsAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTranslationImportRowsAPI = useCallback(
    async (
      importId: string,
      params?: TranslationImportFilterParams,
      config: AxiosRequestConfig = {},
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.get(
          `${TRANSLATION_IMPORT_BASE_PATH}/${importId}/rows`,
          {
            params,
            ...config,
          },
        );
        setIsLoading(false);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data, error: null, isSuccess: true };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to fetch translation rows.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
      }
    },
    [],
  );

  return { getTranslationImportRowsAPI, isLoading, error };
};

export const useUpdateTranslationImportRowAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateTranslationImportRowAPI = useCallback(
    async (
      importId: string,
      rowId: string,
      payload: {
        rawData?: Record<string, any>;
        action?: 'CREATE' | 'UPDATE' | 'NONE';
        targetQuestionId?: string;
        targetLanguageId?: string;
      },
      config: AxiosRequestConfig = {},
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.patch(
          `${TRANSLATION_IMPORT_BASE_PATH}/${importId}/rows/${rowId}`,
          payload,
          config,
        );
        setIsLoading(false);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data: data as TranslationImportRow, error: null, isSuccess: true };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to update translation row.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
      }
    },
    [],
  );

  return { updateTranslationImportRowAPI, isLoading, error };
};

export const useConfirmTranslationImportAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmTranslationImportAPI = useCallback(
    async (importId: string, config: AxiosRequestConfig = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.post(
          `${TRANSLATION_IMPORT_BASE_PATH}/${importId}/confirm`,
          {},
          config,
        );
        setIsLoading(false);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data, error: null, isSuccess: true };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to confirm translation import.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
      }
    },
    [],
  );

  return { confirmTranslationImportAPI, isLoading, error };
};

export const useCancelTranslationImportAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelTranslationImportAPI = useCallback(
    async (importId: string, config: AxiosRequestConfig = {}) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await Axios.post(
          `${TRANSLATION_IMPORT_BASE_PATH}/${importId}/cancel`,
          {},
          config,
        );
        setIsLoading(false);
        const data =
          response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data: data as TranslationImportSession, error: null, isSuccess: true };
      } catch (err: any) {
        setIsLoading(false);
        const errorMsg =
          err?.response?.data?.message || err?.message || 'Failed to cancel translation import.';
        setError(errorMsg);
        return { data: null, error: errorMsg, isSuccess: false };
      }
    },
    [],
  );

  return { cancelTranslationImportAPI, isLoading, error };
};

/**
 * Direct file download helper for translation template
 */
export const downloadTranslationTemplate = async (format: 'xlsx' | 'csv' = 'xlsx') => {
  const response = await Axios.get(`${TRANSLATION_IMPORT_BASE_PATH}/template`, {
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
  link.download = `question_translation_template.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};

/**
 * Direct file download helper for translation import error report
 */
export const downloadTranslationErrorReport = async (
  importId: string,
  format: 'xlsx' | 'csv' = 'xlsx',
) => {
  const response = await Axios.get(
    `${TRANSLATION_IMPORT_BASE_PATH}/${importId}/errors/export`,
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
  link.download = `translation_import_errors_${importId.slice(0, 8)}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
};
