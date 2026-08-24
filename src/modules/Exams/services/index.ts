// ** Hooks **
import { useAxiosGet, useAxiosPost, useAxiosPut } from '@/hooks/useAxios';

// ** Types **
import type {
  Exam,
  ExamQuestion,
  AttemptStatus,
  AttemptSummary,
  ExamResult,
  SubjectResult,
  ChapterResult,
  QuestionReviewItem,
} from '@/types/exam.types';

export const useGetAvailableExamsAPI = () => {
  const [get, state] = useAxiosGet();
  const getAvailableExamsAPI = (examTargetId: string) =>
    get<Exam[]>(`/exams/available/${examTargetId}`);
  return { getAvailableExamsAPI, ...state };
};

export const useStartAttemptAPI = () => {
  const [post, state] = useAxiosPost();
  const startAttemptAPI = (examId: string, languageId: string) =>
    post<AttemptStatus>('/attempts/start', { examId, languageId });
  return { startAttemptAPI, ...state };
};

export const useGetAttemptQuestionsAPI = () => {
  const [get, state] = useAxiosGet();
  const getAttemptQuestionsAPI = (attemptId: string) =>
    get<ExamQuestion[]>(`/attempts/${attemptId}/questions`);
  return { getAttemptQuestionsAPI, ...state };
};

export const useGetAttemptStatusAPI = () => {
  const [get, state] = useAxiosGet();
  const getAttemptStatusAPI = (attemptId: string) =>
    get<AttemptStatus>(`/attempts/${attemptId}/status`);
  return { getAttemptStatusAPI, ...state };
};

export const useSaveAnswerAPI = () => {
  const [put, state] = useAxiosPut();
  const saveAnswerAPI = (
    attemptId: string,
    payload: {
      examQuestionId: string;
      selectedOptionId?: string | null;
      numericalAnswer?: number | null;
      selectedOptions?: string[] | null;
      isMarkedForReview?: boolean;
    },
  ) => put<{ message: string }>(`/attempts/${attemptId}/answer`, payload);
  return { saveAnswerAPI, ...state };
};

export const useSubmitAttemptAPI = () => {
  const [post, state] = useAxiosPost();
  const submitAttemptAPI = (attemptId: string) =>
    post<AttemptStatus>(`/attempts/${attemptId}/submit`, {});
  return { submitAttemptAPI, ...state };
};

export const useCalculateResultAPI = () => {
  const [post, state] = useAxiosPost();
  const calculateResultAPI = (attemptId: string) =>
    post<ExamResult>(`/results/${attemptId}/calculate`, {});
  return { calculateResultAPI, ...state };
};

export const useGetResultAPI = () => {
  const [get, state] = useAxiosGet();
  const getResultAPI = (attemptId: string) => get<ExamResult>(`/results/${attemptId}`);
  return { getResultAPI, ...state };
};

export const useGetSubjectResultsAPI = () => {
  const [get, state] = useAxiosGet();
  const getSubjectResultsAPI = (attemptId: string) =>
    get<SubjectResult[]>(`/results/${attemptId}/subjects`);
  return { getSubjectResultsAPI, ...state };
};

export const useGetChapterResultsAPI = () => {
  const [get, state] = useAxiosGet();
  const getChapterResultsAPI = (attemptId: string) =>
    get<ChapterResult[]>(`/results/${attemptId}/chapters`);
  return { getChapterResultsAPI, ...state };
};

export const useGetAnswerReviewAPI = () => {
  const [get, state] = useAxiosGet();
  const getAnswerReviewAPI = (attemptId: string) =>
    get<QuestionReviewItem[]>(`/results/${attemptId}/review`);
  return { getAnswerReviewAPI, ...state };
};

export const useGetMyAttemptsAPI = () => {
  const [get, state] = useAxiosGet();
  const getMyAttemptsAPI = () => get<AttemptSummary[]>('/attempts/my-history');
  return { getMyAttemptsAPI, ...state };
};
