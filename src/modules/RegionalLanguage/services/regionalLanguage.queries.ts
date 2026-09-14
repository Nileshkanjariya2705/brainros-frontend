import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Axios } from '@/base-axios';
import { languageKeys } from '@/services/queryKeys';
import type {
  SupportedLanguage,
  QuestionTranslationItem,
  TranslationCompletenessResponse,
  ExamLanguageConfig,
  UpsertFullTranslationPayload,
} from '../types/regionalLanguage.types';

export function useLanguagesQuery(includeInactive = false) {
  return useQuery<SupportedLanguage[]>({
    queryKey: languageKeys.list(includeInactive),
    queryFn: async () => {
      const query = includeInactive ? '?includeInactive=true' : '';
      const res = await Axios.get<any>(`/languages${query}`);
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    staleTime: 5 * 60_000,
  });
}

export const useSupportedLanguagesQuery = useLanguagesQuery;

export function useCreateLanguageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SupportedLanguage>) => {
      const res = await Axios.post<any>('/languages', payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: languageKeys.all });
    },
  });
}

export function useUpdateLanguageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<SupportedLanguage> }) => {
      const res = await Axios.patch<any>(`/languages/${id}`, payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: languageKeys.all });
    },
  });
}

export function useDeleteLanguageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await Axios.delete<any>(`/languages/${id}`);
      return res.data?.data ?? res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: languageKeys.all });
    },
  });
}

export function useTranslationCompletenessQuery(questionId?: string) {
  return useQuery<TranslationCompletenessResponse>({
    queryKey: languageKeys.completeness(questionId || ''),
    queryFn: async () => {
      if (!questionId) throw new Error('Question ID required');
      const res = await Axios.get<any>(`/translations/completeness/${questionId}`);
      return res.data?.data ?? res.data;
    },
    enabled: Boolean(questionId),
    staleTime: 60_000,
  });
}

export function useQuestionTranslationsQuery(questionId?: string) {
  return useQuery<QuestionTranslationItem[]>({
    queryKey: languageKeys.questionTranslations(questionId || ''),
    queryFn: async () => {
      if (!questionId) throw new Error('Question ID required');
      const res = await Axios.get<any>(`/translations/question/${questionId}`);
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(questionId),
    staleTime: 60_000,
  });
}

export function useUpsertFullQuestionTranslationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, payload }: { questionId: string; payload: UpsertFullTranslationPayload }) => {
      const res = await Axios.post<any>(`/translations/question/${questionId}/full`, payload);
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, { questionId }) => {
      qc.invalidateQueries({ queryKey: languageKeys.completeness(questionId) });
      qc.invalidateQueries({ queryKey: languageKeys.questionTranslations(questionId) });
    },
  });
}

export function useDeleteQuestionTranslationMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, languageId }: { questionId: string; languageId: string }) => {
      const res = await Axios.delete<any>(`/translations/question/${questionId}/${languageId}`);
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, { questionId }) => {
      qc.invalidateQueries({ queryKey: languageKeys.completeness(questionId) });
      qc.invalidateQueries({ queryKey: languageKeys.questionTranslations(questionId) });
    },
  });
}

export function useExamLanguagesQuery(examId?: string) {
  return useQuery<ExamLanguageConfig[]>({
    queryKey: languageKeys.examLanguages(examId || ''),
    queryFn: async () => {
      if (!examId) throw new Error('Exam ID required');
      const res = await Axios.get<any>(`/exams/${examId}/languages`);
      const data = res.data?.data ?? res.data;
      return Array.isArray(data) ? data : [];
    },
    enabled: Boolean(examId),
    staleTime: 5 * 60_000,
  });
}

export function useSetExamLanguagesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      examId,
      languages,
    }: {
      examId: string;
      languages: { languageId: string; isDefault?: boolean; displayOrder?: number }[];
    }) => {
      const res = await Axios.put<any>(`/exams/${examId}/languages`, { languages });
      return res.data?.data ?? res.data;
    },
    onSuccess: (_data, { examId }) => {
      qc.invalidateQueries({ queryKey: languageKeys.examLanguages(examId) });
    },
  });
}

export function useSwitchAttemptLanguageMutation() {
  return useMutation({
    mutationFn: async ({ attemptId, languageId }: { attemptId: string; languageId: string }) => {
      const res = await Axios.patch<any>(`/attempts/${attemptId}/language`, { languageId });
      return res.data?.data ?? res.data;
    },
  });
}
