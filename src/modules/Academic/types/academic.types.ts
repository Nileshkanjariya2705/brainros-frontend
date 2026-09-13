/**
 * Shared Academic hierarchy types.
 * Formerly in QuestionBank/types/questionBank.types.ts — moved here so that
 * academic management pages (ChapterManagement, BlueprintBuilder, etc.) no
 * longer depend on the removed Question Bank module.
 */

export interface NamedEntity {
  id: string;
  name: string;
  code?: string;
}

export interface SubjectWithExamTarget extends NamedEntity {
  examTarget?: NamedEntity;
}

export interface ChapterItem {
  id: string;
  subjectId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    name: string;
    code?: string | null;
    examTarget?: { id: string; name: string };
  };
  _count?: {
    topics: number;
    questions: number;
  };
}

export interface ChapterFilterParams {
  subjectId?: string;
  search?: string;
  status?: string;
  includeInactive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreateChapterPayload {
  subjectId: string;
  name: string;
  code?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateChapterPayload {
  subjectId?: string;
  name?: string;
  code?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
}
