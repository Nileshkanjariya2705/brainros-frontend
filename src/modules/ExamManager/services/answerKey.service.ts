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
  isCompleted?: boolean;
  isLive?: boolean;
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
   * 4. Download Generic Sample CSV Template
   */
  const downloadSampleCsv = useCallback(async (scheduleId?: string) => {
    try {
      if (scheduleId) {
        const response = await Axios.get(
          `/admin/schedules/${scheduleId}/answer-key/sample-csv`,
          { responseType: 'blob' },
        );
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sample-answer-key.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return { success: true, error: null };
      }
    } catch {
      // Fallback to client-generated template
    }

    const csvContent = [
      'question_number,correct_answer',
      '1,A',
      '2,B',
      '3,D',
      '4,C',
      '5,A',
      '6,B',
      '7,C',
      '8,D',
      '9,A',
      '10,B',
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample-answer-key.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { success: true, error: null };
  }, []);

  /**
   * 5. Download Generic Sample Excel Template
   */
  const downloadSampleExcel = useCallback(async (scheduleId?: string) => {
    try {
      const targetUrl = scheduleId
        ? `/admin/schedules/${scheduleId}/answer-key/sample-excel`
        : `/admin/schedules/sample-excel`;
      const response = await Axios.get(targetUrl, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample-answer-key.xlsx');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, error: null };
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to download sample Excel';
      return { success: false, error: msg };
    }
  }, []);

  /**
   * 6. Upload Answer Key (CSV/Excel File or JSON rows)
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
          if (payload.rows) {
            formData.append('rows', JSON.stringify(payload.rows));
          }
          response = await Axios.post(`/admin/schedules/${scheduleId}/answer-key`, formData);
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
    downloadSampleCsv,
    downloadSampleExcel,
    uploadAnswerKey,
    isLoading,
    error,
  };
};
