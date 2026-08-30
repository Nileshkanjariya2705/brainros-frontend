export type TranslationImportStatus =
  | 'UPLOADED'
  | 'PROCESSING'
  | 'READY_TO_IMPORT'
  | 'IMPORTING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type TranslationImportRowStatus =
  | 'PENDING'
  | 'VALID'
  | 'INVALID'
  | 'DUPLICATE_IN_FILE'
  | 'UPDATE_AVAILABLE'
  | 'CREATED'
  | 'UPDATED'
  | 'FAILED'
  | 'SKIPPED';

export type TranslationImportRowAction = 'CREATE' | 'UPDATE' | 'NONE';

export interface TranslationImportSession {
  id: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  status: TranslationImportStatus;
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

export interface TranslationImportRow {
  id: string;
  importId: string;
  rowNumber: number;
  status: TranslationImportRowStatus;
  action: TranslationImportRowAction;
  targetQuestionId?: string;
  targetLanguageId?: string;
  languageCode?: string;
  rawData: Record<string, any>;
  normalizedData?: Record<string, any>;
  dtoData?: Record<string, any>;
  errors?: string[];
  warnings?: string[];
  importStatus?: string;
  importError?: string;
  resultTranslationId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationImportFilterParams {
  status?: TranslationImportRowStatus | 'ALL';
  page?: number;
  limit?: number;
  languageCode?: string;
  search?: string;
}
