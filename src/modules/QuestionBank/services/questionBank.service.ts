import { useCallback } from 'react';
import type { AxiosRequestConfig } from 'axios';
import { useAxiosGet, useAxiosPost, useAxiosPatch, useAxiosDelete } from '@/hooks/useAxios';
import type {
  QuestionItem,
  QuestionListResponse,
  QuestionStatsResponse,
  QuestionReviewHistory,
  QuestionFilterParams,
  CreateQuestionPayload,
  NamedEntity,
} from '../types/questionBank.types';

const QUESTIONS_BASE_PATH = '/questions';
const ACADEMIC_BASE_PATH = '/academic';

// ═══════════════════════════════════════════════════════════════════
// QUESTION BANK CRUD & WORKFLOW HOOKS
// ═══════════════════════════════════════════════════════════════════

export const useGetQuestionsAPI = () => {
  const [get, state] = useAxiosGet();
  const getQuestionsAPI = useCallback(
    async (params?: QuestionFilterParams, config: AxiosRequestConfig = {}) => {
      return get<QuestionListResponse>(QUESTIONS_BASE_PATH, {
        params,
        ...config,
      });
    },
    [get],
  );
  return { getQuestionsAPI, ...state };
};

export const useGetQuestionByIdAPI = () => {
  const [get, state] = useAxiosGet();
  const getQuestionByIdAPI = useCallback(
    async (id: string, config: AxiosRequestConfig = {}) => {
      return get<QuestionItem>(`${QUESTIONS_BASE_PATH}/${id}`, config);
    },
    [get],
  );
  return { getQuestionByIdAPI, ...state };
};

export const useCreateQuestionAPI = () => {
  const [post, state] = useAxiosPost();
  const createQuestionAPI = useCallback(
    async (payload: CreateQuestionPayload, config: AxiosRequestConfig = {}) => {
      return post<QuestionItem>(QUESTIONS_BASE_PATH, payload, config);
    },
    [post],
  );
  return { createQuestionAPI, ...state };
};

export const useUpdateQuestionAPI = () => {
  const [patch, state] = useAxiosPatch();
  const updateQuestionAPI = useCallback(
    async (
      id: string,
      payload: Partial<CreateQuestionPayload>,
      config: AxiosRequestConfig = {},
    ) => {
      return patch<QuestionItem>(`${QUESTIONS_BASE_PATH}/${id}`, payload, config);
    },
    [patch],
  );
  return { updateQuestionAPI, ...state };
};

export const useDeleteQuestionAPI = () => {
  const [del, state] = useAxiosDelete();
  const deleteQuestionAPI = useCallback(
    async (id: string, config: AxiosRequestConfig = {}) => {
      return del<{ message: string }>(`${QUESTIONS_BASE_PATH}/${id}`, config);
    },
    [del],
  );
  return { deleteQuestionAPI, ...state };
};

export const useSubmitQuestionAPI = () => {
  const [post, state] = useAxiosPost();
  const submitQuestionAPI = useCallback(
    async (id: string, comment?: string, config: AxiosRequestConfig = {}) => {
      return post<QuestionItem>(`${QUESTIONS_BASE_PATH}/${id}/submit`, { comment }, config);
    },
    [post],
  );
  return { submitQuestionAPI, ...state };
};

export const useStartReviewAPI = () => {
  const [post, state] = useAxiosPost();
  const startReviewAPI = useCallback(
    async (id: string, comment?: string, config: AxiosRequestConfig = {}) => {
      return post<QuestionItem>(`${QUESTIONS_BASE_PATH}/${id}/start-review`, { comment }, config);
    },
    [post],
  );
  return { startReviewAPI, ...state };
};

export const useApproveQuestionAPI = () => {
  const [post, state] = useAxiosPost();
  const approveQuestionAPI = useCallback(
    async (id: string, comment?: string, config: AxiosRequestConfig = {}) => {
      return post<QuestionItem>(`${QUESTIONS_BASE_PATH}/${id}/approve`, { comment }, config);
    },
    [post],
  );
  return { approveQuestionAPI, ...state };
};

export const useRejectQuestionAPI = () => {
  const [post, state] = useAxiosPost();
  const rejectQuestionAPI = useCallback(
    async (id: string, reason: string, config: AxiosRequestConfig = {}) => {
      return post<QuestionItem>(`${QUESTIONS_BASE_PATH}/${id}/reject`, { reason }, config);
    },
    [post],
  );
  return { rejectQuestionAPI, ...state };
};

export const useArchiveQuestionAPI = () => {
  const [post, state] = useAxiosPost();
  const archiveQuestionAPI = useCallback(
    async (id: string, reason?: string, config: AxiosRequestConfig = {}) => {
      return post<{ message: string }>(`${QUESTIONS_BASE_PATH}/${id}/archive`, { reason }, config);
    },
    [post],
  );
  return { archiveQuestionAPI, ...state };
};

export const useGetQuestionHistoryAPI = () => {
  const [get, state] = useAxiosGet();
  const getQuestionHistoryAPI = useCallback(
    async (id: string, config: AxiosRequestConfig = {}) => {
      return get<QuestionReviewHistory[]>(`${QUESTIONS_BASE_PATH}/${id}/history`, config);
    },
    [get],
  );
  return { getQuestionHistoryAPI, ...state };
};

export const useGetQuestionVersionsAPI = () => {
  const [get, state] = useAxiosGet();
  const getQuestionVersionsAPI = useCallback(
    async (id: string, config: AxiosRequestConfig = {}) => {
      return get<{
        currentQuestionId: string;
        rootQuestion: QuestionItem;
        versions: QuestionItem[];
      }>(`${QUESTIONS_BASE_PATH}/${id}/versions`, config);
    },
    [get],
  );
  return { getQuestionVersionsAPI, ...state };
};

export const useGetQuestionStatsAPI = () => {
  const [get, state] = useAxiosGet();
  const getQuestionStatsAPI = useCallback(
    async (examTargetId?: string, config: AxiosRequestConfig = {}) => {
      const url = examTargetId
        ? `${QUESTIONS_BASE_PATH}/stats/${examTargetId}`
        : `${QUESTIONS_BASE_PATH}/stats`;
      return get<QuestionStatsResponse>(url, config);
    },
    [get],
  );
  return { getQuestionStatsAPI, ...state };
};

// ═══════════════════════════════════════════════════════════════════
// ACADEMIC HIERARCHY DATA HOOKS
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

export const useGetChaptersAPI = () => {
  const [get, state] = useAxiosGet();
  const getChaptersAPI = useCallback(
    async (subjectId: string, config: AxiosRequestConfig = {}) => {
      return get<NamedEntity[]>(`${ACADEMIC_BASE_PATH}/subjects/${subjectId}/chapters`, config);
    },
    [get],
  );
  return { getChaptersAPI, ...state };
};

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
