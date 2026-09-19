import { useState, useCallback } from 'react';
import { Axios } from '@/base-axios';

export interface CompletedExamItem {
  id: string;
  title: string;
  description?: string | null;
  examTarget: string;
  examTargetId: string;
  examDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  defaultMarksPerQuestion: number;
  defaultNegativeMarks: number;
  status: string;
  publicationStatus: string;
  publishedAt?: string | null;
  subjects: string[];
  sections: Array<{
    id: string;
    name: string;
    displayOrder: number;
    totalQuestions: number;
    subject?: { id: string; name: string };
    chapters: string[];
  }>;
  totalAttempts: number;
  totalEvaluated: number;
  averageScore: string;
  averagePercentage: string;
  averageAccuracy: string;
  highestScore: number;
  lowestScore: number;
}

export interface ExamHistoryResponse {
  statusCode: number;
  message: string;
  data: {
    exams: CompletedExamItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasMore: boolean;
    };
  };
}

export interface ExamFullDetailsResponse {
  statusCode: number;
  message: string;
  data: {
    exam: {
      id: string;
      title: string;
      description?: string | null;
      examTarget?: { id: string; name: string; description?: string };
      status: string;
      durationMinutes: number;
      totalQuestions: number;
      totalMarks: number;
      defaultMarksPerQuestion: number;
      defaultNegativeMarks: number;
      examDate?: string | null;
      startTime?: string | null;
      endTime?: string | null;
      timezone: string;
      createdAt: string;
      createdBy?: { id: string; name?: string; email: string };
      languages: Array<{ id: string; name: string; code?: string }>;
      schedule?: {
        id: string;
        startTime: string;
        endTime: string;
        timezone: string;
        status: string;
        hasAnswerKey: boolean;
      } | null;
      sections: Array<{
        id: string;
        name: string;
        displayOrder: number;
        totalQuestions: number;
        marksPerQuestion: number;
        negativeMarks: number;
        subject?: { id: string; name: string };
        chapters: string[];
      }>;
    };
    participation: {
      registered: number;
      attended: number;
      submitted: number;
      autoSubmitted: number;
      inProgress: number;
      evaluated: number;
    };
    performance: {
      averageScore: string;
      averageAccuracy: string;
      averagePercentage: string;
      highestScore: number;
      lowestScore: number;
    };
    publication: {
      status: string;
      publishedAt?: string | null;
      publishedBy?: { name?: string; email: string } | null;
    };
  };
}

export const examHistoryService = {
  async getExamHistory(params?: {
    page?: number;
    limit?: number;
    search?: string;
    examTargetId?: string;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<ExamHistoryResponse> {
    const res = await Axios.get('/admin/exam-history', { params });
    return res.data;
  },

  async getExamDetails(examId: string): Promise<ExamFullDetailsResponse> {
    const res = await Axios.get(`/admin/exam-history/${examId}/details`);
    return res.data;
  },
};

export const useGetExamHistoryAPI = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getExamHistoryAPI = useCallback(
    async (params?: {
      page?: number;
      limit?: number;
      search?: string;
      examTargetId?: string;
      startDate?: string;
      endDate?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await examHistoryService.getExamHistory(params);
        return response;
      } catch (err: any) {
        const msg = err.response?.data?.message || err.message || 'Failed to load exam history';
        setError(msg);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { getExamHistoryAPI, isLoading, error };
};

export const useGetExamHistoryDetailsAPI = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getExamDetailsAPI = useCallback(async (examId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await examHistoryService.getExamDetails(examId);
      return response;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to load exam details';
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { getExamDetailsAPI, isLoading, error };
};
