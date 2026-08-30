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

export interface ExamItem {
  id: string;
  title: string;
  description?: string;
  totalQuestions: number;
  totalMarks: number;
  durationMinutes: number;
  defaultMarksPerQuestion: number;
  defaultNegativeMarks: number;
  status?: { id: string; name: string };
  examTarget?: { id: string; name: string };
  sections?: Array<{
    id: string;
    name: string;
    totalQuestions: number;
    subject?: { id: string; name: string };
  }>;
  languages?: Array<{
    id: string;
    language?: { id: string; name: string; code: string };
  }>;
  createdAt: string;
  updatedAt: string;
}
