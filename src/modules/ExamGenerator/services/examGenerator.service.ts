import { useCallback } from 'react';
import { useAxiosGet, useAxiosPost, useAxiosPatch, useAxiosDelete } from '@/hooks/useAxios';
import type {
  ExamBlueprintItem,
  CreateBlueprintPayload,
  UpdateBlueprintPayload,
  BlueprintRuleItem,
  CreateBlueprintRulePayload,
  BlueprintValidationResponse,
  GenerateExamPayload,
  GeneratedVersionResponse,
  ExamVersionItem,
  ExamVersionQuestionSnapshot,
} from '../types/examGenerator.types';

// ─── 0. Exam List Hook ─────────────────────────────────────────

export const useGetAllExamsAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getAllExamsAPI = useCallback(async () => {
    return getReq<any[]>('/exams');
  }, [getReq]);

  return { getAllExamsAPI, ...state };
};

// ─── 1. Blueprint Hooks ────────────────────────────────────────

export const useCreateBlueprintAPI = () => {
  const [postReq, state] = useAxiosPost();

  const createBlueprintAPI = useCallback(
    async (examId: string, payload: CreateBlueprintPayload) => {
      return postReq<ExamBlueprintItem>(`/exams/${examId}/blueprints`, payload);
    },
    [postReq],
  );

  return { createBlueprintAPI, ...state };
};

export const useGetExamBlueprintsAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getExamBlueprintsAPI = useCallback(
    async (examId: string) => {
      return getReq<ExamBlueprintItem[]>(`/exams/${examId}/blueprints`);
    },
    [getReq],
  );

  return { getExamBlueprintsAPI, ...state };
};

export const useGetBlueprintByIdAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getBlueprintByIdAPI = useCallback(
    async (blueprintId: string) => {
      return getReq<ExamBlueprintItem>(`/blueprints/${blueprintId}`);
    },
    [getReq],
  );

  return { getBlueprintByIdAPI, ...state };
};

export const useUpdateBlueprintAPI = () => {
  const [patchReq, state] = useAxiosPatch();

  const updateBlueprintAPI = useCallback(
    async (blueprintId: string, payload: UpdateBlueprintPayload) => {
      return patchReq<ExamBlueprintItem>(`/blueprints/${blueprintId}`, payload);
    },
    [patchReq],
  );

  return { updateBlueprintAPI, ...state };
};

export const useDeleteBlueprintAPI = () => {
  const [delReq, state] = useAxiosDelete();

  const deleteBlueprintAPI = useCallback(
    async (blueprintId: string) => {
      return delReq<{ message: string }>(`/blueprints/${blueprintId}`);
    },
    [delReq],
  );

  return { deleteBlueprintAPI, ...state };
};

// ─── 2. Blueprint Rules Hooks ──────────────────────────────────

export const useAddBlueprintRuleAPI = () => {
  const [postReq, state] = useAxiosPost();

  const addBlueprintRuleAPI = useCallback(
    async (blueprintId: string, payload: CreateBlueprintRulePayload) => {
      return postReq<BlueprintRuleItem>(`/blueprints/${blueprintId}/rules`, payload);
    },
    [postReq],
  );

  return { addBlueprintRuleAPI, ...state };
};

export const useUpdateBlueprintRuleAPI = () => {
  const [patchReq, state] = useAxiosPatch();

  const updateBlueprintRuleAPI = useCallback(
    async (ruleId: string, payload: Partial<CreateBlueprintRulePayload>) => {
      return patchReq<BlueprintRuleItem>(`/blueprints/rules/${ruleId}`, payload);
    },
    [patchReq],
  );

  return { updateBlueprintRuleAPI, ...state };
};

export const useDeleteBlueprintRuleAPI = () => {
  const [delReq, state] = useAxiosDelete();

  const deleteBlueprintRuleAPI = useCallback(
    async (ruleId: string) => {
      return delReq<{ message: string }>(`/blueprints/rules/${ruleId}`);
    },
    [delReq],
  );

  return { deleteBlueprintRuleAPI, ...state };
};

// ─── 3. Pre-Flight Validation & Generation Hooks ──────────────

export const useValidateBlueprintAPI = () => {
  const [postReq, state] = useAxiosPost();

  const validateBlueprintAPI = useCallback(
    async (blueprintId: string, checkLanguages = true) => {
      return postReq<BlueprintValidationResponse>(`/blueprints/${blueprintId}/validate`, {
        checkLanguages,
      });
    },
    [postReq],
  );

  return { validateBlueprintAPI, ...state };
};

export const useGenerateExamVersionAPI = () => {
  const [postReq, state] = useAxiosPost();

  const generateExamVersionAPI = useCallback(
    async (blueprintId: string, payload: GenerateExamPayload = {}) => {
      return postReq<GeneratedVersionResponse>(`/blueprints/${blueprintId}/generate`, payload);
    },
    [postReq],
  );

  return { generateExamVersionAPI, ...state };
};

// ─── 4. Generated Versions & Snapshot Hooks ───────────────────

export const useGetExamVersionsAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getExamVersionsAPI = useCallback(
    async (examId: string) => {
      return getReq<ExamVersionItem[]>(`/exams/${examId}/versions`);
    },
    [getReq],
  );

  return { getExamVersionsAPI, ...state };
};

export const useGetExamVersionByIdAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getExamVersionByIdAPI = useCallback(
    async (versionId: string) => {
      return getReq<ExamVersionItem>(`/exam-versions/${versionId}`);
    },
    [getReq],
  );

  return { getExamVersionByIdAPI, ...state };
};

export const usePublishExamVersionAPI = () => {
  const [postReq, state] = useAxiosPost();

  const publishExamVersionAPI = useCallback(
    async (versionId: string) => {
      return postReq<ExamVersionItem>(`/exam-versions/${versionId}/publish`, {});
    },
    [postReq],
  );

  return { publishExamVersionAPI, ...state };
};

export const useGetExamVersionQuestionsAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getExamVersionQuestionsAPI = useCallback(
    async (versionId: string, languageId?: string) => {
      const query = languageId ? `?languageId=${languageId}` : '';
      return getReq<ExamVersionQuestionSnapshot[]>(`/exam-versions/${versionId}/questions${query}`);
    },
    [getReq],
  );

  return { getExamVersionQuestionsAPI, ...state };
};

export const useCreateExamFromTemplateAPI = () => {
  const [postReq, state] = useAxiosPost();

  const createExamFromTemplateAPI = useCallback(
    async (payload: { examTargetId: string; title: string; description?: string }) => {
      return postReq<any>('/exams/create-from-template', payload);
    },
    [postReq],
  );

  return { createExamFromTemplateAPI, ...state };
};

export const useDeleteExamAPI = () => {
  const [delReq, state] = useAxiosDelete();

  const deleteExamAPI = useCallback(
    async (examId: string) => {
      return delReq<{ message: string }>(`/exams/${examId}`);
    },
    [delReq],
  );

  return { deleteExamAPI, ...state };
};
