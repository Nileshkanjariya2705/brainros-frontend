import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootStateType } from '@/redux/store';
import type {
  QuestionDraft,
  ManualQuestionPaperDraft,
} from '@/modules/ExamManager/utils/manualQuestionDraft';

export interface ManualQuestionDraftState {
  drafts: Record<string, ManualQuestionPaperDraft>;
  lastSavedAt?: string;
}

const initialState: ManualQuestionDraftState = {
  drafts: {},
};

/**
 * Generates an isolated draft key per exam and exam version
 */
export const getDraftKey = (examId: string, examVersionId?: string): string => {
  if (!examId) return 'default';
  return `${examId}${examVersionId ? `:${examVersionId}` : ''}`;
};

export interface SaveDraftPayload {
  examId: string;
  examVersionId?: string;
  currentIndex: number;
  questions: QuestionDraft[];
}

export interface ClearDraftPayload {
  examId: string;
  examVersionId?: string;
}

const manualQuestionDraftSlice = createSlice({
  name: 'questionDraft',
  initialState,
  reducers: {
    saveManualDraft: (state, action: PayloadAction<SaveDraftPayload>) => {
      const { examId, examVersionId, currentIndex, questions } = action.payload;
      if (!examId || !Array.isArray(questions) || questions.length === 0) {
        return;
      }

      const key = getDraftKey(examId, examVersionId);
      const now = new Date().toISOString();

      state.drafts[key] = {
        version: 2,
        examId,
        examVersionId,
        updatedAt: now,
        currentIndex: Math.max(0, Math.min(currentIndex, questions.length - 1)),
        questions,
      };
      state.lastSavedAt = now;
    },

    clearManualDraft: (state, action: PayloadAction<ClearDraftPayload>) => {
      const { examId, examVersionId } = action.payload;
      if (!examId) return;

      const key = getDraftKey(examId, examVersionId);
      delete state.drafts[key];
    },

    clearAllManualDrafts: (state) => {
      state.drafts = {};
      state.lastSavedAt = undefined;
    },
  },
});

export const { saveManualDraft, clearManualDraft, clearAllManualDrafts } =
  manualQuestionDraftSlice.actions;

// ─── Selectors ─────────────────────────────────────────────────────────────
export const selectManualQuestionDraft =
  (examId: string, examVersionId?: string) =>
  (state: RootStateType): ManualQuestionPaperDraft | undefined => {
    if (!state.questionDraft?.drafts) return undefined;
    const key = getDraftKey(examId, examVersionId);
    return state.questionDraft.drafts[key];
  };

export const selectAllManualQuestionDrafts = (
  state: RootStateType,
): Record<string, ManualQuestionPaperDraft> => {
  return state.questionDraft?.drafts || {};
};

export const selectManualQuestionDraftLastSavedAt = (
  state: RootStateType,
): string | undefined => {
  return state.questionDraft?.lastSavedAt;
};

export const { reducer } = manualQuestionDraftSlice;
export default manualQuestionDraftSlice.reducer;
