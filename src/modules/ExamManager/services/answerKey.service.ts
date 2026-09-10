import { useCallback, useState } from 'react';
import { Axios } from '@/base-axios';

export interface AnswerKeyStatus {
  scheduleId: string;
  examId: string;
  examTitle: string;
  scheduleStatus: string;
  startTime: string;
  endTime: string;
  timezone: string;
  hasAnswerKey: boolean;
  answerKeyUploadedAt: string | null;
  answerKeyUploadedBy: { id: string; name: string } | null;
  totalQuestions: number;
  configuredKeysCount: number;
  isFullyConfigured: boolean;
}

export interface AnswerKeyOptionItem {
  id?: string;
  optionKey: string;
  optionLabel?: string;
  optionText: string;
  isCorrect: boolean;
  displayOrder?: number;
}

export interface AnswerKeyQuestionItem {
  questionId?: string;
  questionNumber: number;
  subject: string;
  chapter?: string | null;
  section: string;
  questionType: string;
  questionText?: string;
  passageText?: string | null;
  assertionText?: string | null;
  reasonText?: string | null;
  marks: number;
  negativeMarks: number;
  availableOptions: string;
  correctOption: string;
  explanation: string;
  options?: AnswerKeyOptionItem[];
}

export interface AnswerKeyTemplateData {
  scheduleId: string;
  examId: string;
  examTitle: string;
  examTarget?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes?: number;
  totalMarks?: number;
  hasAnswerKey?: boolean;
  answerKeyUploadedAt?: string | null;
  totalQuestions: number;
  csvContent?: string;
  questions: AnswerKeyQuestionItem[];
}

export const useAnswerKeyAPI = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * 1. Get Answer Key Status for Schedule
   */
  const getStatus = useCallback(async (scheduleId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await Axios.get(`/admin/schedules/${scheduleId}/answer-key/status`);
      setIsLoading(false);
      const data = response?.data?.data !== undefined ? response.data.data : response?.data;
      return { data: data as AnswerKeyStatus, error: null };
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch status';
      setError(msg);
      return { data: null, error: msg };
    }
  }, []);

  /**
   * 2. Get Questions for Inline Answer Entry & View
   */
  const getQuestions = useCallback(async (scheduleId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await Axios.get(`/admin/schedules/${scheduleId}/answer-key/questions`);
      setIsLoading(false);
      const data = response?.data?.data !== undefined ? response.data.data : response?.data;
      return {
        data: data as AnswerKeyTemplateData,
        error: null,
      };
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.response?.data?.message || err?.message || 'Failed to fetch questions';
      setError(msg);
      return { data: null, error: msg };
    }
  }, []);

  /**
   * 3. Download CSV Template
   */
  const downloadTemplate = useCallback(async (scheduleId: string, examTitle: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await Axios.get(`/admin/schedules/${scheduleId}/answer-key/template`, {
        responseType: 'blob',
      });
      setIsLoading(false);

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `AnswerKey_${examTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${scheduleId.slice(0, 8)}.csv`,
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, error: null };
    } catch (err: any) {
      setIsLoading(false);
      const msg = err?.response?.data?.message || err?.message || 'Failed to download template';
      setError(msg);
      return { success: false, error: msg };
    }
  }, []);

  /**
   * 4. Upload Answer Key (CSV File or JSON rows)
   */
  const uploadAnswerKey = useCallback(
    async (
      scheduleId: string,
      payload: { file?: File; rows?: Array<{ questionNumber: number; correctOption: string; explanation?: string }> },
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        let response;
        if (payload.file) {
          const formData = new FormData();
          formData.append('file', payload.file);
          response = await Axios.post(`/admin/schedules/${scheduleId}/answer-key`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
        } else {
          response = await Axios.post(`/admin/schedules/${scheduleId}/answer-key`, {
            rows: payload.rows,
          });
        }
        setIsLoading(false);
        const data = response?.data?.data !== undefined ? response.data.data : response?.data;
        return { data, error: null };
      } catch (err: any) {
        setIsLoading(false);
        const msg = err?.response?.data?.message || err?.message || 'Failed to upload answer key';
        setError(msg);
        return { data: null, error: msg };
      }
    },
    [],
  );

  return {
    getStatus,
    getQuestions,
    downloadTemplate,
    uploadAnswerKey,
    isLoading,
    error,
  };
};
