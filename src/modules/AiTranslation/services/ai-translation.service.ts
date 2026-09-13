import { useCallback, useState } from 'react';
import type { AxiosRequestConfig } from 'axios';
import { Axios } from '@/base-axios';
import type {
  ScheduledExam,
  UploadValidationResponse,
  AiTranslationJobDetails,
  QuestionPaperDetails,
} from '../types/ai-translation.types';

const BASE_URL = '/ai-translations';

// ── Direct API Methods ──────────────────────────────────────────

export const aiTranslationApi = {
  async getScheduledExams(config: AxiosRequestConfig = {}): Promise<ScheduledExam[]> {
    const res = await Axios.get(`${BASE_URL}/scheduled-exams`, config);
    return (res?.data?.data !== undefined ? res.data.data : res?.data) || [];
  },

  async uploadAndValidate(
    file: File,
    examScheduleId: string,
    config: AxiosRequestConfig = {},
  ): Promise<UploadValidationResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('examScheduleId', examScheduleId);

    const res = await Axios.post(`${BASE_URL}/upload`, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers,
      },
    });
    return (res?.data?.data !== undefined ? res.data.data : res?.data) as UploadValidationResponse;
  },

  async submitTranslation(
    payload: {
      examScheduleId: string;
      questions: Array<{
        questionNumber: number;
        question: string;
        optionA: string;
        optionB: string;
        optionC: string;
        optionD: string;
      }>;
    },
    config: AxiosRequestConfig = {},
  ): Promise<{ jobId: string; message: string; totalQuestions: number; totalLanguages: number }> {
    const res = await Axios.post(`${BASE_URL}/submit`, payload, config);
    return res?.data?.data !== undefined ? res.data.data : res?.data;
  },

  async getJobStatus(jobId: string, config: AxiosRequestConfig = {}): Promise<AiTranslationJobDetails> {
    const res = await Axios.get(`${BASE_URL}/jobs/${jobId}`, config);
    return res?.data?.data !== undefined ? res.data.data : res?.data;
  },

  async getJobQuestions(jobId: string, config: AxiosRequestConfig = {}): Promise<QuestionPaperDetails> {
    const res = await Axios.get(`${BASE_URL}/jobs/${jobId}/questions`, config);
    return res?.data?.data !== undefined ? res.data.data : res?.data;
  },

  async retryJob(jobId: string, config: AxiosRequestConfig = {}): Promise<{ message: string }> {
    const res = await Axios.post(`${BASE_URL}/jobs/${jobId}/retry`, {}, config);
    return res?.data?.data !== undefined ? res.data.data : res?.data;
  },

  async retryLanguage(
    jobId: string,
    languageId: string,
    config: AxiosRequestConfig = {},
  ): Promise<{ message: string }> {
    const res = await Axios.post(`${BASE_URL}/jobs/${jobId}/languages/${languageId}/retry`, {}, config);
    return res?.data?.data !== undefined ? res.data.data : res?.data;
  },

  async downloadSampleTemplate(format: 'csv' | 'xlsx'): Promise<void> {
    const res = await Axios.get(`${BASE_URL}/sample/${format}`, {
      responseType: 'blob',
    });
    const blob = new Blob([res.data], {
      type:
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sample_question_paper_template.${format}`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

// ── React Hooks ───────────────────────────────────────────────

export const useGetScheduledExamsAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getScheduledExamsAPI = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiTranslationApi.getScheduledExams();
      setIsLoading(false);
      return { data, error: null };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch scheduled exams';
      setError(msg);
      setIsLoading(false);
      return { data: null, error: msg };
    }
  }, []);

  return { getScheduledExamsAPI, isLoading, error };
};

export const useUploadAndValidateAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadAndValidateAPI = useCallback(async (file: File, examScheduleId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiTranslationApi.uploadAndValidate(file, examScheduleId);
      setIsLoading(false);
      return { data, error: null };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to validate question paper';
      setError(msg);
      setIsLoading(false);
      return { data: null, error: msg };
    }
  }, []);

  return { uploadAndValidateAPI, isLoading, error };
};

export const useSubmitAiTranslationAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitTranslationAPI = useCallback(
    async (payload: {
      examScheduleId: string;
      questions: Array<{
        questionNumber: number;
        question: string;
        optionA: string;
        optionB: string;
        optionC: string;
        optionD: string;
      }>;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await aiTranslationApi.submitTranslation(payload);
        setIsLoading(false);
        return { data, error: null };
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to submit AI translation';
        setError(msg);
        setIsLoading(false);
        return { data: null, error: msg };
      }
    },
    [],
  );

  return { submitTranslationAPI, isLoading, error };
};
