import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDraftStorageKey,
  createInitialDrafts,
  saveManualQuestionDraft,
  loadManualQuestionDraft,
  clearManualQuestionDraft,
  QuestionDraft,
} from './manualQuestionDraft';

describe('Manual Question Paper Draft Local Storage Architecture', () => {
  const mockExamId = 'exam-12345';
  const mockExamVersionId = 'v1';

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. Generates isolated storage keys per exam and version', () => {
    const key1 = getDraftStorageKey('exam-A');
    const key2 = getDraftStorageKey('exam-B');
    const keyWithVersion = getDraftStorageKey('exam-A', 'version-2');

    expect(key1).toBe('brainros:question-paper-draft:exam-A');
    expect(key2).toBe('brainros:question-paper-draft:exam-B');
    expect(keyWithVersion).toBe('brainros:question-paper-draft:exam-A:version-2');
    expect(key1).not.toBe(key2);
  });

  it('2. Creates initial draft placeholders accurately', () => {
    const drafts = createInitialDrafts(5);
    expect(drafts).toHaveLength(5);
    expect(drafts[0].questionNumber).toBe(1);
    expect(drafts[0].correctAnswer).toBe('A');
    expect(drafts[4].questionNumber).toBe(5);
  });

  it('3. Persists draft to localStorage and restores it accurately', () => {
    const questions: QuestionDraft[] = [
      {
        id: 'q-1',
        questionNumber: 1,
        difficulty: 'EASY',
        type: 'SINGLE_CORRECT',
        questionText: 'What is the SI unit of Force?',
        optionA: 'Joule',
        optionB: 'Newton',
        optionC: 'Watt',
        optionD: 'Pascal',
        correctAnswer: 'B',
        correctAnswers: ['B'],
        numericalAnswer: '',
        assertion: '',
        reason: '',
        columnA: [],
        columnB: [],
        matchPairs: [],
        explanation: 'Force is measured in Newtons (N).',
      },
      {
        id: 'q-2',
        questionNumber: 2,
        difficulty: 'HARD',
        type: 'MULTIPLE_CORRECT',
        questionText: 'Which are noble gases?',
        optionA: 'Helium',
        optionB: 'Neon',
        optionC: 'Oxygen',
        optionD: 'Argon',
        correctAnswer: 'A',
        correctAnswers: ['A', 'B', 'D'],
        numericalAnswer: '',
        assertion: '',
        reason: '',
        columnA: [],
        columnB: [],
        matchPairs: [],
      },
    ];

    const saved = saveManualQuestionDraft(mockExamId, 1, questions, mockExamVersionId);
    expect(saved).toBe(true);

    const loaded = loadManualQuestionDraft(mockExamId, mockExamVersionId);
    expect(loaded).not.toBeNull();
    expect(loaded?.currentIndex).toBe(1);
    expect(loaded?.questions).toHaveLength(2);
    expect(loaded?.questions[0].difficulty).toBe('EASY');
    expect(loaded?.questions[0].type).toBe('SINGLE_CORRECT');
    expect(loaded?.questions[0].questionText).toBe('What is the SI unit of Force?');
    expect(loaded?.questions[0].correctAnswer).toBe('B');
    expect(loaded?.questions[1].difficulty).toBe('HARD');
    expect(loaded?.questions[1].type).toBe('MULTIPLE_CORRECT');
    expect(loaded?.questions[1].correctAnswers).toEqual(['A', 'B', 'D']);
  });

  it('4. Preserves incomplete drafts locally without rejection', () => {
    const incompleteQuestions: QuestionDraft[] = [
      {
        id: 'q-1',
        questionNumber: 1,
        difficulty: 'MEDIUM',
        type: 'SINGLE_CORRECT',
        questionText: 'Incomplete question statement...',
        optionA: 'Option A filled',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        correctAnswers: ['A'],
        numericalAnswer: '',
        assertion: '',
        reason: '',
        columnA: [],
        columnB: [],
        matchPairs: [],
      },
    ];

    saveManualQuestionDraft(mockExamId, 0, incompleteQuestions);
    const restored = loadManualQuestionDraft(mockExamId);

    expect(restored).not.toBeNull();
    expect(restored?.questions[0].questionText).toBe('Incomplete question statement...');
    expect(restored?.questions[0].optionA).toBe('Option A filled');
    expect(restored?.questions[0].optionB).toBe('');
  });

  it('5. Handles corrupted localStorage content safely without throwing', () => {
    const key = getDraftStorageKey(mockExamId);
    localStorage.setItem(key, '{ invalid-json }');

    const result = loadManualQuestionDraft(mockExamId);
    expect(result).toBeNull();
  });

  it('6. Does not mix drafts between two distinct exams', () => {
    const examA = 'exam-alpha';
    const examB = 'exam-beta';

    const draftA: QuestionDraft[] = [
      {
        id: 'q-1',
        questionNumber: 1,
        difficulty: 'EASY',
        type: 'SINGLE_CORRECT',
        questionText: 'Exam Alpha Question',
        optionA: 'A1',
        optionB: 'A2',
        optionC: 'A3',
        optionD: 'A4',
        correctAnswer: 'A',
        correctAnswers: ['A'],
        numericalAnswer: '',
        assertion: '',
        reason: '',
        columnA: [],
        columnB: [],
        matchPairs: [],
      },
    ];

    const draftB: QuestionDraft[] = [
      {
        id: 'q-1',
        questionNumber: 1,
        difficulty: 'VERY_HARD',
        type: 'NUMERICAL',
        questionText: 'Exam Beta Question',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        correctAnswers: [],
        numericalAnswer: '42.5',
        assertion: '',
        reason: '',
        columnA: [],
        columnB: [],
        matchPairs: [],
      },
    ];

    saveManualQuestionDraft(examA, 0, draftA);
    saveManualQuestionDraft(examB, 0, draftB);

    const loadedA = loadManualQuestionDraft(examA);
    const loadedB = loadManualQuestionDraft(examB);

    expect(loadedA?.questions[0].questionText).toBe('Exam Alpha Question');
    expect(loadedB?.questions[0].questionText).toBe('Exam Beta Question');
    expect(loadedB?.questions[0].numericalAnswer).toBe('42.5');
  });

  it('7. Clears draft on request after successful server persistence', () => {
    const questions = createInitialDrafts(3);
    saveManualQuestionDraft(mockExamId, 2, questions, mockExamVersionId);

    expect(loadManualQuestionDraft(mockExamId, mockExamVersionId)).not.toBeNull();

    clearManualQuestionDraft(mockExamId, mockExamVersionId);

    expect(loadManualQuestionDraft(mockExamId, mockExamVersionId)).toBeNull();
  });

  it('8. Handles localStorage storage quota errors gracefully', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const questions = createInitialDrafts(2);
    const result = saveManualQuestionDraft(mockExamId, 0, questions);
    expect(result).toBe(false);
  });
});
