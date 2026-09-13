export interface TargetLanguage {
  id: string;
  name: string;
  code: string;
}

export interface ScheduledExam {
  scheduleId: string;
  examId: string;
  examTitle: string;
  examCode: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalQuestionsConfigured: number;
  currentQuestionsCount: number;
  targetLanguages: TargetLanguage[];
  latestVersionId: string | null;
  translationJob: {
    id: string;
    status: 'QUEUED' | 'PROCESSING' | 'PARTIALLY_COMPLETED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    overallProgress: number;
    createdAt: string;
    completedAt: string | null;
    languageStatuses: LanguageTranslationProgress[];
  } | null;
}

export interface ParsedQuestionRow {
  rowNumber: number;
  questionNumber: number;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  isValid: boolean;
  errors: string[];
}

export interface UploadValidationResponse {
  isValid: boolean;
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  expectedQuestionsCount: number;
  examTitle: string;
  examCode: string;
  examScheduleId: string;
  examId: string;
  examVersionId: string;
  targetLanguages: TargetLanguage[];
  rows: ParsedQuestionRow[];
  globalErrors: string[];
}

export interface LanguageTranslationProgress {
  languageId: string;
  languageName: string;
  languageCode: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  completedQuestions: number;
  totalQuestions: number;
  failedBatches: number;
  errorMessage?: string;
}

export interface AiTranslationJobDetails {
  id: string;
  examId: string;
  examVersionId: string;
  examTitle?: string;
  examCode?: string;
  totalQuestions: number;
  totalLanguages: number;
  batchSize: number;
  status: 'QUEUED' | 'PROCESSING' | 'PARTIALLY_COMPLETED' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  overallProgress: number;
  languageStatuses: LanguageTranslationProgress[];
  startedAt?: string | null;
  completedAt?: string | null;
  failedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionPaperTranslationOption {
  A: string;
  B: string;
  C: string;
  D: string;
}

export interface QuestionPaperLanguageTranslation {
  languageId: string;
  languageName: string;
  languageCode: string;
  questionText: string;
  options: QuestionPaperTranslationOption;
}

export interface QuestionPaperItem {
  id: string;
  sequenceNumber: number;
  questionText: string;
  options: QuestionPaperTranslationOption;
  translations: QuestionPaperLanguageTranslation[];
}

export interface QuestionPaperDetails {
  jobId: string;
  examId: string;
  examVersionId: string;
  totalQuestions: number;
  questions: QuestionPaperItem[];
}
