export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';
export type QuestionType =
  | 'SINGLE_CORRECT'
  | 'MULTIPLE_CORRECT'
  | 'NUMERICAL'
  | 'ASSERTION_REASON'
  | 'MATCH_FOLLOWING';

export interface ColumnItem {
  id: string;
  key: string;
  text: string;
}

export interface MatchPair {
  leftKey: string;
  rightKey: string;
}

export interface QuestionDraft {
  id: string;
  questionNumber: number;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  questionText: string;
  // Options for Single Correct, Multiple Correct, Assertion & Reason, and Match the Following
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  // Single choice answer
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  // Multiple choice answers
  correctAnswers: ('A' | 'B' | 'C' | 'D')[];
  // Numerical answer
  numericalAnswer: string;
  // Assertion & Reason
  assertion: string;
  reason: string;
  // Match the Following
  columnA: ColumnItem[];
  columnB: ColumnItem[];
  matchPairs: MatchPair[];
  explanation?: string;
}

export interface ManualQuestionPaperDraft {
  version: number;
  examId: string;
  examVersionId?: string;
  updatedAt: string;
  currentIndex: number;
  questions: QuestionDraft[];
}

/**
 * Generates an isolated, exam-specific draft key to prevent collisions between different exams
 */
export const getDraftStorageKey = (examId: string, examVersionId?: string): string => {
  if (!examId) return 'brainros:question-paper-draft';
  return `brainros:question-paper-draft:${examId}${examVersionId ? `:${examVersionId}` : ''}`;
};

export const getDefaultColumnA = (): ColumnItem[] => [
  { id: 'ca-1', key: '1', text: '' },
  { id: 'ca-2', key: '2', text: '' },
  { id: 'ca-3', key: '3', text: '' },
  { id: 'ca-4', key: '4', text: '' },
];

export const getDefaultColumnB = (): ColumnItem[] => [
  { id: 'cb-1', key: 'A', text: '' },
  { id: 'cb-2', key: 'B', text: '' },
  { id: 'cb-3', key: 'C', text: '' },
  { id: 'cb-4', key: 'D', text: '' },
];

export const getDefaultMatchPairs = (): MatchPair[] => [
  { leftKey: '1', rightKey: 'A' },
  { leftKey: '2', rightKey: 'B' },
  { leftKey: '3', rightKey: 'C' },
  { leftKey: '4', rightKey: 'D' },
];

/**
 * Creates empty initial question draft placeholders for a given question count
 */
export const createInitialDrafts = (count: number): QuestionDraft[] => {
  const targetCount = Math.max(1, count || 1);
  const list: QuestionDraft[] = [];
  for (let i = 1; i <= targetCount; i++) {
    list.push({
      id: `q-${i}`,
      questionNumber: i,
      difficulty: 'MEDIUM',
      type: 'SINGLE_CORRECT',
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      correctAnswers: ['A'],
      numericalAnswer: '',
      assertion: '',
      reason: '',
      columnA: getDefaultColumnA(),
      columnB: getDefaultColumnB(),
      matchPairs: getDefaultMatchPairs(),
      explanation: '',
    });
  }
  return list;
};

/**
 * Persists the manual Question Paper draft to browser localStorage safely.
 */
export const saveManualQuestionDraft = (
  examId: string,
  currentIndex: number,
  questions: QuestionDraft[],
  examVersionId?: string,
): boolean => {
  if (!examId || !Array.isArray(questions) || questions.length === 0) {
    return false;
  }
  try {
    const key = getDraftStorageKey(examId, examVersionId);
    const payload: ManualQuestionPaperDraft = {
      version: 2,
      examId,
      examVersionId,
      updatedAt: new Date().toISOString(),
      currentIndex: Math.max(0, Math.min(currentIndex, questions.length - 1)),
      questions,
    };
    localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch (err) {
    console.warn('[ManualQuestionDraft] Failed to save draft to localStorage:', err);
    return false;
  }
};

/**
 * Restores a manual Question Paper draft from browser localStorage if available and valid.
 */
export const loadManualQuestionDraft = (
  examId: string,
  examVersionId?: string,
): { currentIndex: number; questions: QuestionDraft[]; updatedAt: string } | null => {
  if (!examId) return null;
  try {
    const key = getDraftStorageKey(examId, examVersionId);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed: ManualQuestionPaperDraft = JSON.parse(raw);

    // Validate structural integrity and schema version (supports version 1 & 2)
    if (
      parsed &&
      (parsed.version === 1 || parsed.version === 2) &&
      parsed.examId === examId &&
      Array.isArray(parsed.questions) &&
      parsed.questions.length > 0
    ) {
      const validDifficulties: QuestionDifficulty[] = ['EASY', 'MEDIUM', 'HARD', 'VERY_HARD'];
      const validTypes: QuestionType[] = [
        'SINGLE_CORRECT',
        'MULTIPLE_CORRECT',
        'NUMERICAL',
        'ASSERTION_REASON',
        'MATCH_FOLLOWING',
      ];

      const sanitizedQuestions: QuestionDraft[] = parsed.questions.map((q, idx) => {
        const difficulty: QuestionDifficulty = validDifficulties.includes((q as any).difficulty)
          ? (q as any).difficulty
          : 'MEDIUM';
        const type: QuestionType = validTypes.includes((q as any).type)
          ? (q as any).type
          : 'SINGLE_CORRECT';

        const correctAnswers = Array.isArray(q.correctAnswers) && q.correctAnswers.length > 0
          ? q.correctAnswers.filter((a) => ['A', 'B', 'C', 'D'].includes(a))
          : (['A', 'B', 'C', 'D'].includes(q.correctAnswer) ? [q.correctAnswer] : ['A']);

        return {
          id: q.id || `q-${idx + 1}`,
          questionNumber: q.questionNumber || idx + 1,
          difficulty,
          type,
          questionText: typeof q.questionText === 'string' ? q.questionText : '',
          optionA: typeof q.optionA === 'string' ? q.optionA : '',
          optionB: typeof q.optionB === 'string' ? q.optionB : '',
          optionC: typeof q.optionC === 'string' ? q.optionC : '',
          optionD: typeof q.optionD === 'string' ? q.optionD : '',
          correctAnswer: (['A', 'B', 'C', 'D'].includes(q.correctAnswer)
            ? q.correctAnswer
            : 'A') as 'A' | 'B' | 'C' | 'D',
          correctAnswers: correctAnswers as ('A' | 'B' | 'C' | 'D')[],
          numericalAnswer: typeof (q as any).numericalAnswer === 'string' || typeof (q as any).numericalAnswer === 'number'
            ? String((q as any).numericalAnswer)
            : '',
          assertion: typeof (q as any).assertion === 'string' ? (q as any).assertion : '',
          reason: typeof (q as any).reason === 'string' ? (q as any).reason : '',
          columnA: Array.isArray((q as any).columnA) && (q as any).columnA.length > 0
            ? (q as any).columnA
            : getDefaultColumnA(),
          columnB: Array.isArray((q as any).columnB) && (q as any).columnB.length > 0
            ? (q as any).columnB
            : getDefaultColumnB(),
          matchPairs: Array.isArray((q as any).matchPairs) && (q as any).matchPairs.length > 0
            ? (q as any).matchPairs
            : getDefaultMatchPairs(),
          explanation: typeof q.explanation === 'string' ? q.explanation : '',
        };
      });

      const validIndex = Math.max(
        0,
        Math.min(parsed.currentIndex || 0, sanitizedQuestions.length - 1),
      );

      return {
        currentIndex: validIndex,
        questions: sanitizedQuestions,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }

    // Corrupted or incompatible draft
    localStorage.removeItem(key);
    return null;
  } catch (err) {
    console.warn('[ManualQuestionDraft] Failed to parse draft from localStorage:', err);
    try {
      const key = getDraftStorageKey(examId, examVersionId);
      localStorage.removeItem(key);
    } catch {}
    return null;
  }
};

/**
 * Removes the manual Question Paper draft from localStorage after successful server persistence.
 */
export const clearManualQuestionDraft = (examId: string, examVersionId?: string): void => {
  if (!examId) return;
  try {
    const key = getDraftStorageKey(examId, examVersionId);
    localStorage.removeItem(key);
  } catch (err) {
    console.warn('[ManualQuestionDraft] Failed to clear draft from localStorage:', err);
  }
};
