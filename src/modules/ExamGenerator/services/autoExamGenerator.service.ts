import { useCallback } from 'react';
import { useAxiosPost, useAxiosGet } from '@/hooks/useAxios';

export interface DifficultyDistributionPayload {
  easyCount?: number;
  easyPercentage?: number;
  mediumCount?: number;
  mediumPercentage?: number;
  hardCount?: number;
  hardPercentage?: number;
  veryHardCount?: number;
  veryHardPercentage?: number;
}

export interface QuestionTypeCountPayload {
  type: string;
  count: number;
}

export interface ExamSectionFilterPayload {
  name: string;
  subjectId: string;
  chapterIds?: string[];
  topicIds?: string[];
  totalQuestions: number;
  marksPerQuestion?: number;
  negativeMarks?: number;
  difficultyDistribution?: DifficultyDistributionPayload;
  questionTypes?: QuestionTypeCountPayload[];
}

export interface ValidateExamGenerationPayload {
  examTargetId: string;
  sections: ExamSectionFilterPayload[];
  requiredLanguageIds?: string[];
  onlyApprovedQuestions?: boolean;
}

export interface PreviewExamGenerationPayload extends ValidateExamGenerationPayload {
  title: string;
  description?: string;
  durationMinutes: number;
  defaultMarksPerQuestion?: number;
  defaultNegativeMarks?: number;
  generationSeed?: string;
}

export interface FinalizeExamGenerationPayload extends PreviewExamGenerationPayload {
  publishImmediately?: boolean;
}

export interface SectionReportItem {
  sectionIndex: number;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  availableTotal: number;
  isSatisfied: boolean;
  difficultyBreakdown: Record<
    string,
    { required: number; available: number; isSatisfied: boolean }
  >;
  deficits: string[];
}

export interface ValidationReportResponse {
  isValid: boolean;
  totalQuestions: number;
  sectionsCount: number;
  sectionReports: SectionReportItem[];
  errorMessages: string[];
}

export interface PreviewOptionItem {
  id: string;
  key: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface PreviewQuestionItem {
  id: string;
  sequenceNumber: number;
  subjectId: string;
  subjectName: string;
  chapterName: string;
  topicName?: string;
  difficultyLevel: string;
  type: string;
  marks: number;
  negativeMarks: number;
  questionText: string;
  passage?: string | null;
  assertion?: string | null;
  reason?: string | null;
  options: PreviewOptionItem[];
  correctAnswer?: any;
  explanation?: string | null;
}

export interface PreviewSectionItem {
  name: string;
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  marksPerQuestion: number;
  negativeMarks: number;
  questions: PreviewQuestionItem[];
}

export interface ExamGenerationPreviewResponse {
  examTitle: string;
  examTargetId: string;
  description: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  generationSeed: string;
  sections: PreviewSectionItem[];
}

export interface CreatedExamResponse {
  examId: string;
  examVersionId: string;
  title: string;
  status: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  generationSeed: string;
  createdAt: string;
}

// ─── API Hooks ─────────────────────────────────────────────────────────────

export const useValidateGenerationFiltersAPI = () => {
  const [postReq, state] = useAxiosPost();

  const validateGenerationFiltersAPI = useCallback(
    async (payload: ValidateExamGenerationPayload) => {
      return postReq<ValidationReportResponse>(
        '/exams/validate-generation-filters',
        payload,
      );
    },
    [postReq],
  );

  return { validateGenerationFiltersAPI, ...state };
};

export const usePreviewGenerationAPI = () => {
  const [postReq, state] = useAxiosPost();

  const previewGenerationAPI = useCallback(
    async (payload: PreviewExamGenerationPayload) => {
      return postReq<ExamGenerationPreviewResponse>(
        '/exams/preview-generation',
        payload,
      );
    },
    [postReq],
  );

  return { previewGenerationAPI, ...state };
};

export interface CreateExamFromImportPayload {
  title: string;
  description?: string;
  examTargetId?: string;
  durationMinutes?: number;
  defaultMarksPerQuestion?: number;
  defaultNegativeMarks?: number;
  publishImmediately?: boolean;
}

export const useGenerateExamFromImportAPI = () => {
  const [postReq, state] = useAxiosPost();

  const generateExamFromImportAPI = useCallback(
    async (importId: string, payload: CreateExamFromImportPayload) => {
      return postReq<CreatedExamResponse>(
        `/exams/generate-from-import/${importId}`,
        payload,
      );
    },
    [postReq],
  );

  return { generateExamFromImportAPI, ...state };
};

export const useGenerateExamFromFiltersAPI = () => {
  const [postReq, state] = useAxiosPost();

  const generateExamFromFiltersAPI = useCallback(
    async (payload: FinalizeExamGenerationPayload) => {
      return postReq<CreatedExamResponse>(
        '/exams/generate-from-filters',
        payload,
      );
    },
    [postReq],
  );

  return { generateExamFromFiltersAPI, ...state };
};

export const useGetAcademicHierarchyAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getAcademicHierarchyAPI = useCallback(
    async (examTargetId: string) => {
      return getReq<any>(`/academic/hierarchy/${examTargetId}`);
    },
    [getReq],
  );

  return { getAcademicHierarchyAPI, ...state };
};

export const useGetAcademicSubjectsAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getAcademicSubjectsAPI = useCallback(
    async (examTargetId?: string) => {
      const url = examTargetId
        ? `/academic/subjects?examTargetId=${examTargetId}`
        : '/academic/subjects';
      return getReq<any[]>(url);
    },
    [getReq],
  );

  return { getAcademicSubjectsAPI, ...state };
};

export const useGetQuestionBankStatsAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getQuestionBankStatsAPI = useCallback(
    async (examTargetId?: string) => {
      const url = examTargetId
        ? `/questions/stats/${examTargetId}`
        : '/questions/stats';
      return getReq<any>(url);
    },
    [getReq],
  );

  return { getQuestionBankStatsAPI, ...state };
};
