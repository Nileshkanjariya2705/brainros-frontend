export enum QuestionStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum QuestionDifficultyEnum {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
  VERY_HARD = 'VERY_HARD',
}

export enum QuestionTypeEnum {
  SINGLE_CORRECT = 'SINGLE_CORRECT',
  MULTIPLE_CORRECT = 'MULTIPLE_CORRECT',
  NUMERICAL = 'NUMERICAL',
  ASSERTION_REASON = 'ASSERTION_REASON',
  MATCH_FOLLOWING = 'MATCH_FOLLOWING',
  CASE_BASED = 'CASE_BASED',
}

export interface NamedEntity {
  id: string;
  name: string;
  code?: string;
}

export interface SubjectWithExamTarget extends NamedEntity {
  examTarget?: NamedEntity;
}

export interface OptionTranslation {
  id?: string;
  languageId: string;
  optionText: string;
  language?: NamedEntity;
}

export interface QuestionOption {
  id: string;
  questionId: string;
  optionKey: string;
  optionLabel?: string | null;
  optionText?: string | null;
  matchColumn?: string | null;
  matchPairKey?: string | null;
  isCorrect: boolean;
  displayOrder: number;
  translations?: OptionTranslation[];
}

export interface QuestionTranslation {
  id?: string;
  questionId?: string;
  languageId: string;
  questionText: string;
  passageText?: string | null;
  assertionText?: string | null;
  reasonText?: string | null;
  explanation?: string | null;
  language?: NamedEntity;
}

export interface QuestionAnswer {
  id?: string;
  questionId?: string;
  answerType: QuestionTypeEnum;
  correctOptionIds?: string[] | null;
  numericalAnswer?: number | null;
  numericalTolerance?: number | null;
  numericalRangeStart?: number | null;
  numericalRangeEnd?: number | null;
  matchPairs?:
    | Array<{ leftOptionKey: string; rightOptionKey: string }>
    | Record<string, string>
    | any;
}

export interface QuestionExplanation {
  id?: string;
  questionId?: string;
  explanation: string;
  mediaUrl?: string | null;
}

export interface QuestionReviewHistory {
  id: string;
  questionId: string;
  action: string;
  fromStatus?: QuestionStatus | null;
  toStatus: QuestionStatus;
  performedById: string;
  comment?: string | null;
  createdAt: string;
  performedBy?: {
    id: string;
    email: string;
    phone?: string | null;
    mobileNumber?: string | null;
  };
}

export interface QuestionItem {
  id: string;
  subjectId: string;
  chapterId: string;
  topicId?: string | null;
  subTopicId?: string | null;
  difficultyId?: string | null;
  difficultyLevel: QuestionDifficultyEnum;
  questionTypeId?: string | null;
  type: QuestionTypeEnum;
  status: QuestionStatus;
  version: number;
  parentQuestionId?: string | null;
  defaultLanguageId: string;
  marks: number;
  negativeMarks: number;
  passage?: string | null;
  assertion?: string | null;
  reason?: string | null;
  correctAnswer?: any;
  isActive: boolean;
  createdById: string;
  submittedById?: string | null;
  submittedAt?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  approvedById?: string | null;
  approvedAt?: string | null;
  rejectedById?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;

  subject: SubjectWithExamTarget;
  chapter: NamedEntity;
  topic?: NamedEntity | null;
  subTopic?: NamedEntity | null;
  difficulty?: NamedEntity | null;
  questionType?: NamedEntity | null;
  defaultLanguage: NamedEntity;
  createdBy?: { id: string; email: string; phone?: string | null };
  submittedBy?: { id: string; email: string } | null;
  reviewedBy?: { id: string; email: string } | null;
  approvedBy?: { id: string; email: string } | null;
  rejectedBy?: { id: string; email: string } | null;
  parentQuestion?: { id: string; version: number; status: QuestionStatus } | null;
  childVersions?: Array<{ id: string; version: number; status: QuestionStatus; createdAt: string }>;

  translations: QuestionTranslation[];
  options: QuestionOption[];
  answer?: QuestionAnswer | null;
  explanation?: QuestionExplanation | null;
  reviewHistory?: QuestionReviewHistory[];
  _count?: { examQuestions: number; childVersions: number };
}

export interface QuestionFilterParams {
  examTargetId?: string;
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  subTopicId?: string;
  difficultyLevel?: QuestionDifficultyEnum;
  type?: QuestionTypeEnum;
  status?: QuestionStatus | 'ALL';
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface QuestionListResponse {
  data: QuestionItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface QuestionStatsResponse {
  totalQuestions: number;
  byStatus: Record<string, number>;
  byDifficulty: Record<string, number>;
  byType: Record<string, number>;
  bySubject: Array<{
    subjectId: string;
    subjectName: string;
    count: number;
  }>;
}

export interface CreateQuestionPayload {
  subjectId: string;
  chapterId: string;
  topicId?: string;
  topicName?: string;
  subTopicId?: string;
  subTopicName?: string;
  difficultyLevel?: QuestionDifficultyEnum;
  type?: QuestionTypeEnum;
  defaultLanguageId: string;
  marks?: number;
  negativeMarks?: number;
  passage?: string;
  assertion?: string;
  reason?: string;
  translations: Array<{
    languageId: string;
    questionText: string;
    passageText?: string;
    assertionText?: string;
    reasonText?: string;
    explanation?: string;
  }>;
  options?: Array<{
    optionKey?: string;
    optionLabel?: string;
    optionText?: string;
    matchColumn?: string;
    matchPairKey?: string;
    isCorrect?: boolean;
    displayOrder?: number;
    translations?: Array<{
      languageId: string;
      optionText: string;
    }>;
  }>;
  answer?: {
    answerType?: QuestionTypeEnum;
    correctOptionIds?: string[];
    numericalAnswer?: number;
    numericalTolerance?: number;
    numericalRangeStart?: number;
    numericalRangeEnd?: number;
    matchPairs?: any;
  };
  explanation?: {
    explanation: string;
    mediaUrl?: string;
  };
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

