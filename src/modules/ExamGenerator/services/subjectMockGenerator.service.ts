import { useCallback } from 'react';
import { useAxiosGet, useAxiosPost } from '@/hooks/useAxios';
import Axios from '@/base-axios';
import { toast } from '@/utils/toast';

export interface SubjectMockStatItem {
  id: string;
  name: string;
  normalizedName: 'PHYSICS' | 'CHEMISTRY' | 'MATHEMATICS' | 'BIOLOGY';
  code: string | null;
  chapterCount: number;
  questionCount: number;
  isActive: boolean;
}

export interface PreviewOptionItem {
  optionKey: string;
  optionLabel: string;
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface PreviewRowItem {
  rowNumber: number;
  subject: string;
  chapter: string;
  topic?: string;
  subTopic?: string;
  questionType: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  questionText: string;
  options: PreviewOptionItem[];
  correctAnswer: string;
  explanation?: string;
  status: 'VALID' | 'INVALID' | 'DUPLICATE';
  errors: string[];
}

export interface SubjectMockUploadResponse {
  importId: string;
  fileName: string;
  fileSize: number;
  subject: string;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  difficultyCounts: {
    EASY: number;
    MEDIUM: number;
    HARD: number;
    VERY_HARD: number;
  };
  previewRows: PreviewRowItem[];
  allRowsCount: number;
}

export interface DifficultyDistributionPayload {
  easyPercentage?: number;
  mediumPercentage?: number;
  hardPercentage?: number;
  veryHardPercentage?: number;
}

export interface GenerateSubjectMockPayload {
  importId: string;
  subject: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  totalQuestions?: number;
  defaultMarksPerQuestion?: number;
  defaultNegativeMarks?: number;
  difficultyDistribution?: DifficultyDistributionPayload;
  publishImmediately?: boolean;
}

export interface GeneratedSubjectMockResponse {
  examId: string;
  examVersionId: string;
  title: string;
  subject: string;
  status: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  createdAt: string;
}

/**
 * 1. Hook to fetch question & chapter counts for the 4 subjects
 */
export const useGetSubjectMockStatsAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getSubjectMockStatsAPI = useCallback(async () => {
    return getReq<SubjectMockStatItem[]>('/admin/exams/subject-wise/stats');
  }, [getReq]);

  return { getSubjectMockStatsAPI, ...state };
};

/**
 * 2. Helper to download subject-specific template
 */
export const downloadSubjectTemplate = async (
  subject: string,
  format: 'xlsx' | 'csv' = 'xlsx',
) => {
  try {
    const response = await Axios.get(
      `/admin/exams/subject-wise/template?subject=${encodeURIComponent(subject)}&format=${format}`,
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `${subject.toLowerCase()}_mock_template.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success(`${subject} template downloaded successfully.`);
  } catch (err: any) {
    toast.error('Failed to download template. Please try again.');
  }
};

/**
 * 3. Hook to upload and validate CSV/XLSX file against a specific subject
 */
export const useUploadAndValidateSubjectMockAPI = () => {
  const [postReq, state] = useAxiosPost();

  const uploadAndValidateSubjectMockAPI = useCallback(
    async (file: File, subject: string) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('subject', subject);

      return postReq<SubjectMockUploadResponse>(
        '/admin/exams/subject-wise/upload',
        formData,
      );
    },
    [postReq],
  );

  return { uploadAndValidateSubjectMockAPI, ...state };
};

/**
 * 4. Hook to finalize and generate Subject Mock Exam
 */
export const useGenerateSubjectMockAPI = () => {
  const [postReq, state] = useAxiosPost();

  const generateSubjectMockAPI = useCallback(
    async (payload: GenerateSubjectMockPayload) => {
      return postReq<GeneratedSubjectMockResponse>(
        '/admin/exams/subject-wise/generate',
        payload,
      );
    },
    [postReq],
  );

  return { generateSubjectMockAPI, ...state };
};
