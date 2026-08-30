export type ImportSessionStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'VALIDATED'
  | 'READY_TO_IMPORT'
  | 'IMPORTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type ImportRowStatus = 'PENDING' | 'VALID' | 'INVALID' | 'DUPLICATE' | 'UPDATE_AVAILABLE';

export type ImportRowAction = 'CREATE' | 'UPDATE' | 'NONE';

export interface QuestionImportSession {
  id: string;
  fileName: string;
  fileType: string;
  storageKey?: string;
  fileSize?: number;
  status: ImportSessionStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  updateRows: number;
  createRows: number;
  processedRows: number;
  createdCount: number;
  updatedCount: number;
  failedCount: number;
  errorSummary?: string;
  createdById: string;
  createdBy?: {
    id: string;
    email?: string;
    phone?: string;
  };
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionImportRow {
  id: string;
  importId: string;
  rowNumber: number;
  status: ImportRowStatus;
  action: ImportRowAction;
  targetQuestionId?: string | null;
  rawData: Record<string, any>;
  normalizedData?: Record<string, any>;
  dtoData?: Record<string, any>;
  errors?: string[];
  warnings?: string[];
  importStatus?: string;
  importError?: string;
  resultQuestionId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionImportFilterParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}
