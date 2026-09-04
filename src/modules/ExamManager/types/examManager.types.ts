export type ExamImportStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'READY_TO_IMPORT'
  | 'IMPORTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface ExamImportSession {
  id: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  status: ExamImportStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  examCount: number;
  questionsCreated: number;
  sectionsCreated: number;
  createdExamId?: string;
  createdExamCode?: string;
  createdExamTitle?: string;
  errorSummary?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    email: string;
    mobileNumber?: string;
  };
}

export interface ExamImportRow {
  id: string;
  importId: string;
  rowNumber: number;
  status: 'PENDING' | 'VALID' | 'INVALID';
  examCode?: string;
  examTitle?: string;
  subjectName?: string;
  sectionName?: string;
  questionNumber?: number;
  rawData: Record<string, any>;
  normalizedData?: Record<string, any>;
  dtoData?: Record<string, any>;
  errors?: string[];
  warnings?: string[];
  importStatus?: string;
  importError?: string;
  resultQuestionId?: string;
  resultExamId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExamImportFilterParams {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export interface BlueprintSubjectRule {
  subject: string;
  questionCount: number;
  marks?: number;
}

export interface BlueprintItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  totalQuestions: number;
  durationMinutes: number;
  status: 'ACTIVE' | 'INACTIVE';
  subjectDistribution: BlueprintSubjectRule[];
  examTargetId?: string;
  version?: number;
  examTarget?: { id?: string; name?: string };
  rules?: any[];
}

export interface TranslationValidationSummary {
  languageId: string;
  languageCode: string;
  languageName: string;
  fileName: string;
  totalQuestions: number;
  translatedQuestions: number;
  coveragePercentage: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
}

export interface ComprehensiveExamValidationResult {
  isValid: boolean;
  blueprint: {
    id: string;
    name: string;
    totalQuestions: number;
    isMatched: boolean;
    subjectChecks: Array<{
      subject: string;
      expectedCount: number;
      actualCount: number;
      isMatched: boolean;
    }>;
  };
  questionsSummary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    totalQuestions: number;
    totalMarks: number;
    durationMinutes: number;
    subjectCounts: Record<string, number>;
  };
  translationsSummary: TranslationValidationSummary[];
  previewRows: Array<{
    rowNumber: number;
    questionNumber?: number;
    subject: string;
    chapter?: string;
    questionText: string;
    questionType: string;
    options: Array<{ key: string; text: string; isCorrect: boolean }>;
    correctAnswer: string;
    difficulty?: string;
    status: 'VALID' | 'INVALID';
    errors: string[];
  }>;
  errors: Array<{ row: number; column?: string; message: string }>;
  warnings: string[];
}

export interface CreateExamFromUploadPayload {
  title: string;
  blueprintId: string;
  description?: string;
  durationMinutes?: number;
  defaultMarksPerQuestion?: number;
  defaultNegativeMarks?: number;
  instructions?: string;
}

export interface ExamManagerFilterParams {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ExamItem {
  id: string;
  title: string;
  description?: string;
  type: string;
  typeLabel?: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  defaultMarksPerQuestion?: number;
  defaultNegativeMarks?: number;
  status: string;
  examTarget?: { id: string; name: string };
  subjectsSummary?: string;
  sections?: Array<{
    id: string;
    name: string;
    totalQuestions: number;
    subject?: { id: string; name: string };
  }>;
  languages?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  translationCoverage?: Record<string, number>;
  createdBy?: {
    id: string;
    email: string;
    name?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExamListResponse {
  items: ExamItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
