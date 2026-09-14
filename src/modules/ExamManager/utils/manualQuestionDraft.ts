export interface QuestionDraft {
  id: string;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
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
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
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
      version: 1,
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

    // Validate structural integrity and schema version
    if (
      parsed &&
      parsed.version === 1 &&
      parsed.examId === examId &&
      Array.isArray(parsed.questions) &&
      parsed.questions.length > 0
    ) {
      const sanitizedQuestions: QuestionDraft[] = parsed.questions.map((q, idx) => ({
        id: q.id || `q-${idx + 1}`,
        questionNumber: q.questionNumber || idx + 1,
        questionText: typeof q.questionText === 'string' ? q.questionText : '',
        optionA: typeof q.optionA === 'string' ? q.optionA : '',
        optionB: typeof q.optionB === 'string' ? q.optionB : '',
        optionC: typeof q.optionC === 'string' ? q.optionC : '',
        optionD: typeof q.optionD === 'string' ? q.optionD : '',
        correctAnswer: (['A', 'B', 'C', 'D'].includes(q.correctAnswer)
          ? q.correctAnswer
          : 'A') as 'A' | 'B' | 'C' | 'D',
        explanation: typeof q.explanation === 'string' ? q.explanation : '',
      }));

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
