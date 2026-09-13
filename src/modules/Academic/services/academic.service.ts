/**
 * Shared Academic hierarchy API hooks.
 * Formerly in QuestionBank/services/questionBank.service.ts — moved here so
 * that academic management pages (ChapterManagement, BlueprintBuilder, etc.)
 * no longer depend on the removed Question Bank module.
 */
import { useCallback } from 'react';
import type { AxiosRequestConfig } from 'axios';
import { useAxiosGet, useAxiosPost, useAxiosPatch, useAxiosDelete } from '@/hooks/useAxios';
import type { NamedEntity } from '../types/academic.types';

const ACADEMIC_BASE_PATH = '/academic';

// ═══════════════════════════════════════════════════════════════════
// SUBJECTS
// ═══════════════════════════════════════════════════════════════════

export const useGetSubjectsAPI = () => {
  const [get, state] = useAxiosGet();
  const getSubjectsAPI = useCallback(
    async (examTargetId?: string, config: AxiosRequestConfig = {}) => {
      return get<NamedEntity[]>(`${ACADEMIC_BASE_PATH}/subjects`, {
        params: examTargetId ? { examTargetId } : {},
        ...config,
      });
    },
    [get],
  );
  return { getSubjectsAPI, ...state };
};

export const useCreateSubjectAPI = () => {
  const [post, state] = useAxiosPost();
  const createSubjectAPI = useCallback(
    async (payload: any, config: AxiosRequestConfig = {}) => {
      return post<any>(`${ACADEMIC_BASE_PATH}/subjects`, payload, config);
    },
    [post],
  );
  return { createSubjectAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// EXAM TARGETS
// ═══════════════════════════════════════════════════════════════════

export const useGetExamTargetsAPI = () => {
  const [get, state] = useAxiosGet();
  const getExamTargetsAPI = useCallback(
    async (config: AxiosRequestConfig = {}) => {
      return get<NamedEntity[]>(`${ACADEMIC_BASE_PATH}/exam-targets`, config);
    },
    [get],
  );
  return { getExamTargetsAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// CHAPTERS
// ═══════════════════════════════════════════════════════════════════

export const useGetChaptersAPI = () => {
  const [get, state] = useAxiosGet();
  const getChaptersAPI = useCallback(
    async (
      subjectId: string,
      includeInactive: boolean = false,
      config: AxiosRequestConfig = {},
    ) => {
      return get<NamedEntity[]>(`${ACADEMIC_BASE_PATH}/subjects/${subjectId}/chapters`, {
        params: includeInactive ? { includeInactive: true } : {},
        ...config,
      });
    },
    [get],
  );
  return { getChaptersAPI, ...state };
};

export const useGetAllChaptersAPI = () => {
  const [get, state] = useAxiosGet();
  const getAllChaptersAPI = useCallback(
    async (params?: any, config: AxiosRequestConfig = {}) => {
      return get<any>(`${ACADEMIC_BASE_PATH}/chapters`, {
        params,
        ...config,
      });
    },
    [get],
  );
  return { getAllChaptersAPI, ...state };
};

export const useGetChapterByIdAPI = () => {
  const [get, state] = useAxiosGet();
  const getChapterByIdAPI = useCallback(
    async (id: string, config: AxiosRequestConfig = {}) => {
      return get<any>(`${ACADEMIC_BASE_PATH}/chapters/${id}`, config);
    },
    [get],
  );
  return { getChapterByIdAPI, ...state };
};

export const useCreateChapterAPI = () => {
  const [post, state] = useAxiosPost();
  const createChapterAPI = useCallback(
    async (payload: any, config: AxiosRequestConfig = {}) => {
      return post<any>(`${ACADEMIC_BASE_PATH}/chapters`, payload, config);
    },
    [post],
  );
  return { createChapterAPI, ...state };
};

export const useUpdateChapterAPI = () => {
  const [patch, state] = useAxiosPatch();
  const updateChapterAPI = useCallback(
    async (id: string, payload: any, config: AxiosRequestConfig = {}) => {
      return patch<any>(`${ACADEMIC_BASE_PATH}/chapters/${id}`, payload, config);
    },
    [patch],
  );
  return { updateChapterAPI, ...state };
};

export const useDeleteChapterAPI = () => {
  const [del, state] = useAxiosDelete();
  const deleteChapterAPI = useCallback(
    async (id: string, config: AxiosRequestConfig = {}) => {
      return del<any>(`${ACADEMIC_BASE_PATH}/chapters/${id}`, config);
    },
    [del],
  );
  return { deleteChapterAPI, ...state };
};

export const useReorderChaptersAPI = () => {
  const [patch, state] = useAxiosPatch();
  const reorderChaptersAPI = useCallback(
    async (subjectId: string, chapterIds: string[], config: AxiosRequestConfig = {}) => {
      return patch<any>(
        `${ACADEMIC_BASE_PATH}/subjects/${subjectId}/chapters/reorder`,
        { chapterIds },
        config,
      );
    },
    [patch],
  );
  return { reorderChaptersAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// TOPICS & SUBTOPICS
// ═══════════════════════════════════════════════════════════════════

export const useGetTopicsAPI = () => {
  const [get, state] = useAxiosGet();
  const getTopicsAPI = useCallback(
    async (chapterId: string, config: AxiosRequestConfig = {}) => {
      return get<NamedEntity[]>(`${ACADEMIC_BASE_PATH}/chapters/${chapterId}/topics`, config);
    },
    [get],
  );
  return { getTopicsAPI, ...state };
};

export const useGetSubTopicsAPI = () => {
  const [get, state] = useAxiosGet();
  const getSubTopicsAPI = useCallback(
    async (topicId: string, config: AxiosRequestConfig = {}) => {
      return get<NamedEntity[]>(`${ACADEMIC_BASE_PATH}/topics/${topicId}/sub-topics`, config);
    },
    [get],
  );
  return { getSubTopicsAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// LOOKUP DATA
// ═══════════════════════════════════════════════════════════════════

export const useGetDifficultyLevelsAPI = () => {
  const [get, state] = useAxiosGet();
  const getDifficultyLevelsAPI = useCallback(
    async (config: AxiosRequestConfig = {}) => {
      return get<NamedEntity[]>(`${ACADEMIC_BASE_PATH}/difficulty-levels`, config);
    },
    [get],
  );
  return { getDifficultyLevelsAPI, ...state };
};

export const useGetQuestionTypesAPI = () => {
  const [get, state] = useAxiosGet();
  const getQuestionTypesAPI = useCallback(
    async (config: AxiosRequestConfig = {}) => {
      return get<NamedEntity[]>(`${ACADEMIC_BASE_PATH}/question-types`, config);
    },
    [get],
  );
  return { getQuestionTypesAPI, ...state };
};
