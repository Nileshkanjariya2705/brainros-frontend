import { describe, it, expect } from 'vitest';
import reducer, {
  saveManualDraft,
  clearManualDraft,
  clearAllManualDrafts,
  selectManualQuestionDraft,
  selectAllManualQuestionDrafts,
  selectManualQuestionDraftLastSavedAt,
  getDraftKey,
  type ManualQuestionDraftState,
} from './manualQuestionDraftSlice';
import type { QuestionDraft } from '@/modules/ExamManager/utils/manualQuestionDraft';

describe('manualQuestionDraftSlice (Redux Persist Integration)', () => {
  const initialEmptyState: ManualQuestionDraftState = {
    drafts: {},
  };

  const sampleQuestions: QuestionDraft[] = [
    {
      id: 'q-1',
      questionNumber: 1,
      difficulty: 'MEDIUM',
      type: 'SINGLE_CORRECT',
      questionText: 'What is the speed of light in vacuum?',
      optionA: '3 x 10^8 m/s',
      optionB: '3 x 10^6 m/s',
      optionC: '1.5 x 10^8 m/s',
      optionD: 'Zero',
      correctAnswer: 'A',
      correctAnswers: ['A'],
      numericalAnswer: '',
      assertion: '',
      reason: '',
      columnA: [],
      columnB: [],
      matchPairs: [],
      explanation: 'Constant c in vacuum.',
    },
    {
      id: 'q-2',
      questionNumber: 2,
      difficulty: 'HARD',
      type: 'NUMERICAL',
      questionText: 'Calculate Planck constant order of magnitude in J*s (-34).',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      correctAnswers: ['A'],
      numericalAnswer: '-34',
      assertion: '',
      reason: '',
      columnA: [],
      columnB: [],
      matchPairs: [],
    },
  ];

  it('1. Generates isolated draft keys with and without examVersionId', () => {
    expect(getDraftKey('exam-101')).toBe('exam-101');
    expect(getDraftKey('exam-101', 'v2')).toBe('exam-101:v2');
    expect(getDraftKey('exam-102')).toBe('exam-102');
    expect(getDraftKey('')).toBe('default');
  });

  it('2. Saves manual question paper draft with metadata and questions', () => {
    const action = saveManualDraft({
      examId: 'exam-101',
      examVersionId: 'v1',
      currentIndex: 1,
      questions: sampleQuestions,
    });

    const nextState = reducer(initialEmptyState, action);
    const key = getDraftKey('exam-101', 'v1');

    expect(nextState.drafts[key]).toBeDefined();
    expect(nextState.drafts[key].version).toBe(2);
    expect(nextState.drafts[key].examId).toBe('exam-101');
    expect(nextState.drafts[key].examVersionId).toBe('v1');
    expect(nextState.drafts[key].currentIndex).toBe(1);
    expect(nextState.drafts[key].questions).toHaveLength(2);
    expect(nextState.drafts[key].questions[0].questionText).toBe(
      'What is the speed of light in vacuum?',
    );
    expect(nextState.lastSavedAt).toBeDefined();
  });

  it('3. Selects the correct draft via selectManualQuestionDraft', () => {
    const key = getDraftKey('exam-101');
    const mockRootState = {
      questionDraft: {
        drafts: {
          [key]: {
            version: 2,
            examId: 'exam-101',
            updatedAt: '2026-10-29T10:00:00.000Z',
            currentIndex: 0,
            questions: sampleQuestions,
          },
        },
        lastSavedAt: '2026-10-29T10:00:00.000Z',
      },
    } as any;

    const draft = selectManualQuestionDraft('exam-101')(mockRootState);
    expect(draft).toBeDefined();
    expect(draft?.questions).toHaveLength(2);
    expect(selectManualQuestionDraftLastSavedAt(mockRootState)).toBe(
      '2026-10-29T10:00:00.000Z',
    );
    expect(selectAllManualQuestionDrafts(mockRootState)).toHaveProperty(key);

    // Non-existent exam returns undefined
    const missingDraft = selectManualQuestionDraft('exam-999')(mockRootState);
    expect(missingDraft).toBeUndefined();
  });

  it('4. Keeps drafts for multiple exams isolated without collisions', () => {
    let state = reducer(
      initialEmptyState,
      saveManualDraft({
        examId: 'exam-math',
        currentIndex: 0,
        questions: sampleQuestions,
      }),
    );

    state = reducer(
      state,
      saveManualDraft({
        examId: 'exam-physics',
        currentIndex: 1,
        questions: [sampleQuestions[0]],
      }),
    );

    expect(Object.keys(state.drafts)).toHaveLength(2);
    expect(state.drafts['exam-math'].questions).toHaveLength(2);
    expect(state.drafts['exam-physics'].questions).toHaveLength(1);
  });

  it('5. Clears specific exam draft while preserving other exam drafts', () => {
    let state = reducer(
      initialEmptyState,
      saveManualDraft({
        examId: 'exam-math',
        currentIndex: 0,
        questions: sampleQuestions,
      }),
    );

    state = reducer(
      state,
      saveManualDraft({
        examId: 'exam-physics',
        currentIndex: 0,
        questions: sampleQuestions,
      }),
    );

    expect(Object.keys(state.drafts)).toHaveLength(2);

    // Clear only math exam draft
    state = reducer(state, clearManualDraft({ examId: 'exam-math' }));
    expect(state.drafts['exam-math']).toBeUndefined();
    expect(state.drafts['exam-physics']).toBeDefined();
  });

  it('6. Clears all manual drafts cleanly', () => {
    let state = reducer(
      initialEmptyState,
      saveManualDraft({
        examId: 'exam-1',
        currentIndex: 0,
        questions: sampleQuestions,
      }),
    );

    state = reducer(state, clearAllManualDrafts());
    expect(Object.keys(state.drafts)).toHaveLength(0);
    expect(state.lastSavedAt).toBeUndefined();
  });

  it('7. Handles empty or invalid questions gracefully without crashing', () => {
    const state = reducer(
      initialEmptyState,
      saveManualDraft({
        examId: 'exam-empty',
        currentIndex: 0,
        questions: [],
      }),
    );

    expect(state.drafts['exam-empty']).toBeUndefined();
  });
});
