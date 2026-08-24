export interface ExamTarget {
  id: string;
  name: string;
  description?: string;
}

export interface ExamStatus {
  id: string;
  name: string;
}

export interface ExamSection {
  id: string;
  name: string;
  totalQuestions: number;
  displayOrder: number;
  subject?: { id: string; name: string };
  _count?: { examQuestions: number };
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  defaultMarksPerQuestion: number;
  defaultNegativeMarks: number;
  status: ExamStatus;
  examTarget: ExamTarget;
  examDate?: string;
  startTime?: string;
  endTime?: string;
  sections?: ExamSection[];
  _count?: { examQuestions: number; attempts: number };
}

export interface QuestionType {
  id: string;
  name: string;
  code: 'SCQ' | 'MCQ' | 'NUM' | 'TF' | 'AR';
}

export interface QuestionOption {
  id: string;
  optionLabel: string;
  optionText: string;
  isCorrect?: boolean;
}

export interface ExamQuestion {
  examQuestionId: string;
  displayOrder: number;
  marks: number;
  negativeMarks: number;
  section: { id: string; name: string; subjectId: string };
  questionType: QuestionType;
  questionText: string;
  options: QuestionOption[];
}

export interface AttemptAnswer {
  examQuestionId: string;
  selectedOptionId?: string | null;
  numericalAnswer?: number | null;
  selectedOptions?: string[] | null;
  isMarkedForReview?: boolean;
  answeredAt?: string | null;
}

export interface AttemptStatus {
  attemptId: string;
  examId: string;
  status:
    | 'NOT_STARTED'
    | 'IN_PROGRESS'
    | 'SUBMITTED'
    | 'AUTO_SUBMITTED'
    | 'EXPIRED'
    | 'INTERRUPTED';
  startedAt: string;
  serverEndTime: string;
  answers: AttemptAnswer[];
}

export interface AttemptSummary {
  id: string;
  exam: Exam;
  status: ExamStatus;
  startedAt: string;
  submittedAt?: string;
  result?: {
    totalScore: number;
    maxScore: number;
    percentage: number;
    correctAnswers: number;
    wrongAnswers: number;
    unattempted: number;
  };
}

export interface ExamResult {
  id: string;
  attemptId: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  calculatedAt: string;
  attempt: {
    id: string;
    examId: string;
    startedAt: string;
    submittedAt: string;
    exam: Exam;
  };
}

export interface SubjectResult {
  id: string;
  resultId: string;
  subjectId: string;
  subject: { id: string; name: string };
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  score: number;
  maxScore: number;
  accuracy: number;
}

export interface ChapterResult {
  id: string;
  resultId: string;
  chapterId: string;
  chapter: {
    id: string;
    name: string;
    subject: { id: string; name: string };
  };
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  score: number;
  accuracy: number;
  performanceStatus: 'STRONG' | 'MODERATE' | 'WEAK' | 'NOT_ATTEMPTED';
}

export interface QuestionReviewItem {
  displayOrder: number;
  sectionName: string;
  questionType: QuestionType;
  questionText: string;
  explanation: string;
  options: {
    id: string;
    optionLabel: string;
    optionText: string;
    isCorrect: boolean;
  }[];
  studentAnswer: {
    selectedOptionId?: string;
    numericalAnswer?: number;
    isMarkedForReview?: boolean;
  } | null;
  isCorrect: boolean;
  isAttempted: boolean;
}
