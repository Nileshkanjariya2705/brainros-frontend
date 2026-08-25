export type ExamVersionStatus =
  | 'DRAFT'
  | 'GENERATING'
  | 'GENERATED'
  | 'PUBLISHED'
  | 'ARCHIVED'
  | 'FAILED';

export type QuestionDifficultyEnum = 'EASY' | 'MEDIUM' | 'HARD' | 'VERY_HARD';

export type QuestionTypeEnum =
  | 'SINGLE_CORRECT'
  | 'MULTIPLE_CORRECT'
  | 'NUMERICAL'
  | 'ASSERTION_REASON'
  | 'MATCH_FOLLOWING'
  | 'CASE_BASED';

export interface BlueprintRuleItem {
  id: string;
  blueprintId: string;
  subjectId?: string | null;
  chapterId?: string | null;
  topicId?: string | null;
  subTopicId?: string | null;
  difficultyLevel?: QuestionDifficultyEnum | null;
  type?: QuestionTypeEnum | null;
  selectionCount?: number | null;
  selectionPercentage?: number | null;
  priority: number;
  subject?: { id: string; name: string };
  chapter?: { id: string; name: string };
  topic?: { id: string; name: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamBlueprintItem {
  id: string;
  examId: string;
  name: string;
  totalQuestions: number;
  version: number;
  isActive: boolean;
  rules: BlueprintRuleItem[];
  createdBy?: { id: string; email: string };
  _count?: { generatedVersions: number };
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlueprintRulePayload {
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  subTopicId?: string;
  difficultyLevel?: QuestionDifficultyEnum;
  type?: QuestionTypeEnum;
  selectionCount?: number;
  selectionPercentage?: number;
  priority?: number;
}

export interface CreateBlueprintPayload {
  name: string;
  totalQuestions: number;
  rules?: CreateBlueprintRulePayload[];
}

export interface UpdateBlueprintPayload {
  name?: string;
  totalQuestions?: number;
}

export interface PoolCheckReportItem {
  ruleIndex: number;
  subjectId?: string | null;
  chapterId?: string | null;
  difficultyLevel?: string | null;
  type?: string | null;
  required: number;
  available: number;
  isSatisfied: boolean;
}

export interface BlueprintValidationResponse {
  valid: boolean;
  totalQuestions: number;
  subjectDistribution: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  questionPool: {
    eligibleTotal: number;
    requiredTotal: number;
  };
  ruleBreakdown: PoolCheckReportItem[];
}

export interface GenerateExamPayload {
  generationSeed?: string;
  idempotencyKey?: string;
}

export interface GeneratedVersionResponse {
  examId: string;
  examVersionId: string;
  versionNumber: number;
  status: ExamVersionStatus;
  generationSeed?: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  generatedAt: string;
}

export interface ExamVersionItem {
  id: string;
  examId: string;
  blueprintId?: string | null;
  versionNumber: number;
  status: ExamVersionStatus;
  generationSeed?: string;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  markingSchemeSnapshot?: any;
  metadata?: any;
  generatedById: string;
  generatedAt: string;
  publishedAt?: string | null;
  blueprint?: { id: string; name: string; version: number };
  generatedBy?: { id: string; email: string };
  _count?: { questions: number };
}

export interface ExamVersionOptionSnapshot {
  id: string;
  sourceOptionId: string;
  displayOrder: number;
  optionKey: string;
  optionLabel?: string;
  optionText: string;
  isCorrect: boolean;
}

export interface ExamVersionQuestionSnapshot {
  id: string;
  examVersionId: string;
  sourceQuestionId: string;
  sourceQuestionVersion: number;
  sequenceNumber: number;
  subjectName?: string;
  type: QuestionTypeEnum;
  difficultyLevel: QuestionDifficultyEnum;
  marks: number;
  negativeMarks: number;
  passage?: string;
  assertion?: string;
  reason?: string;
  questionText: string;
  explanation?: string;
  options: ExamVersionOptionSnapshot[];
}
