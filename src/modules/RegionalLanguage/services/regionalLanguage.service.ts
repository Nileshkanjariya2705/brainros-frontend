import { useCallback } from 'react';
import {
  useAxiosGet,
  useAxiosPost,
  useAxiosPut,
  useAxiosPatch,
  useAxiosDelete,
} from '@/hooks/useAxios';
import type {
  SupportedLanguage,
  QuestionTranslationItem,
  TranslationCompletenessResponse,
  ExamLanguageConfig,
  UpsertFullTranslationPayload,
} from '../types/regionalLanguage.types';

// ─── 1. Languages Master API Hooks ─────────────────────────────

export const useGetLanguagesAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getLanguagesAPI = useCallback(
    async (includeInactive = false) => {
      const query = includeInactive ? '?includeInactive=true' : '';
      return getReq<SupportedLanguage[]>(`/languages${query}`);
    },
    [getReq],
  );

  return { getLanguagesAPI, ...state };
};

export const useCreateLanguageAPI = () => {
  const [postReq, state] = useAxiosPost();

  const createLanguageAPI = useCallback(
    async (payload: Partial<SupportedLanguage>) => {
      return postReq<SupportedLanguage>('/languages', payload);
    },
    [postReq],
  );

  return { createLanguageAPI, ...state };
};

export const useUpdateLanguageAPI = () => {
  const [patchReq, state] = useAxiosPatch();

  const updateLanguageAPI = useCallback(
    async (id: string, payload: Partial<SupportedLanguage>) => {
      return patchReq<SupportedLanguage>(`/languages/${id}`, payload);
    },
    [patchReq],
  );

  return { updateLanguageAPI, ...state };
};

export const useDeleteLanguageAPI = () => {
  const [delReq, state] = useAxiosDelete();

  const deleteLanguageAPI = useCallback(
    async (id: string) => {
      return delReq<{ message: string }>(`/languages/${id}`);
    },
    [delReq],
  );

  return { deleteLanguageAPI, ...state };
};

// ─── 2. Translation Management API Hooks ───────────────────────

export const useGetTranslationCompletenessAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getTranslationCompletenessAPI = useCallback(
    async (questionId: string) => {
      return getReq<TranslationCompletenessResponse>(`/translations/completeness/${questionId}`);
    },
    [getReq],
  );

  return { getTranslationCompletenessAPI, ...state };
};

export const useGetQuestionTranslationsAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getQuestionTranslationsAPI = useCallback(
    async (questionId: string) => {
      return getReq<QuestionTranslationItem[]>(`/translations/question/${questionId}`);
    },
    [getReq],
  );

  return { getQuestionTranslationsAPI, ...state };
};

export const useUpsertFullQuestionTranslationAPI = () => {
  const [postReq, state] = useAxiosPost();

  const upsertFullQuestionTranslationAPI = useCallback(
    async (questionId: string, payload: UpsertFullTranslationPayload) => {
      return postReq<{
        questionTranslation: QuestionTranslationItem;
        optionTranslations: any[];
      }>(`/translations/question/${questionId}/full`, payload);
    },
    [postReq],
  );

  return { upsertFullQuestionTranslationAPI, ...state };
};

export const useDeleteQuestionTranslationAPI = () => {
  const [delReq, state] = useAxiosDelete();

  const deleteQuestionTranslationAPI = useCallback(
    async (questionId: string, languageId: string) => {
      return delReq<{ message: string }>(`/translations/question/${questionId}/${languageId}`);
    },
    [delReq],
  );

  return { deleteQuestionTranslationAPI, ...state };
};

// ─── 3. Exam Languages Configuration Hooks ─────────────────────

export const useGetExamLanguagesAPI = () => {
  const [getReq, state] = useAxiosGet();

  const getExamLanguagesAPI = useCallback(
    async (examId: string) => {
      return getReq<ExamLanguageConfig[]>(`/exams/${examId}/languages`);
    },
    [getReq],
  );

  return { getExamLanguagesAPI, ...state };
};

export const useSetExamLanguagesAPI = () => {
  const [putReq, state] = useAxiosPut();

  const setExamLanguagesAPI = useCallback(
    async (
      examId: string,
      languages: { languageId: string; isDefault?: boolean; displayOrder?: number }[],
    ) => {
      return putReq<ExamLanguageConfig[]>(`/exams/${examId}/languages`, {
        languages,
      });
    },
    [putReq],
  );

  return { setExamLanguagesAPI, ...state };
};

// ─── 4. In-Flight Exam Language Switch API Hook ────────────────

export const useSwitchAttemptLanguageAPI = () => {
  const [patchReq, state] = useAxiosPatch();

  const switchAttemptLanguageAPI = useCallback(
    async (attemptId: string, languageId: string) => {
      return patchReq<{
        attemptId: string;
        language: {
          id: string;
          code: string;
          name: string;
          nativeName: string;
        };
      }>(`/attempts/${attemptId}/language`, { languageId });
    },
    [patchReq],
  );

  return { switchAttemptLanguageAPI, ...state };
};
