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
  optionKey?: string;
  translations?: Record<string, { optionText: string }>;
  isCorrect?: boolean;
}

export interface ExamQuestion {
  examQuestionId: string;
  questionId?: string;
  displayOrder: number;
  marks: number;
  negativeMarks: number;
  section: { id: string; name: string; subjectId: string };
  questionType: QuestionType;
  type?: string;
  questionText: string;
  passage?: string | null;
  assertion?: string | null;
  reason?: string | null;
  translations?: Record<
    string,
    {
      questionText: string;
      passageText?: string | null;
      assertionText?: string | null;
      reasonText?: string | null;
    }
  >;
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
  serverStartTime?: string;
  serverEndTime?: string;
  result?: {
    id?: string;
    totalScore: number;
    maxScore: number;
    percentage: number;
    accuracy?: number;
    correctAnswers: number;
    wrongAnswers: number;
    unattempted: number;
    timeUsedSeconds?: number;
    averageTimePerQuestion?: number;
    resultStatus?: string;
    subjectResults?: Array<{
      id: string;
      subjectId: string;
      subject: { id: string; name: string };
      score: number;
      maxScore: number;
      accuracy?: number;
      correctAnswers?: number;
      wrongAnswers?: number;
      unattempted?: number;
    }>;
  };
  candidateRanks?: Array<{
    rank: number;
    totalCandidates: number;
    percentile: number;
    rankType?: string;
  }>;
  timeAnalyses?: Array<{
    averageTimePerQuestionSeconds: number;
    timeUtilizationPercentage: number;
    totalTimeUsedSeconds: number;
  }>;
  strategyAnalyses?: Array<{
    primaryClassification: string;
    avoidableNegativeMarks: number;
    projectedScore: number;
  }>;
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

// ═══════════════════════════════════════════════════════════════════
// BRAINROS ANALYSIS ENGINE TYPES
// ═══════════════════════════════════════════════════════════════════

export type PerformanceStatus =
  | 'EXCELLENT'
  | 'STRONG'
  | 'GOOD'
  | 'WEAK'
  | 'CRITICAL'
  | 'NOT_ATTEMPTED';

export interface PerformanceThresholds {
  excellent: number;
  strong: number;
  good: number;
  weak: number;
}

export interface OverallPerformanceMetrics {
  totalMarks: number;
  obtainedMarks: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  totalQuestions: number;
  timeUsedSeconds: number;
  formattedTimeUsed: string;
  averageTimePerQuestionSeconds: number;
  negativeMarksLost: number;
  potentialMarks: number;
  overallStatus: PerformanceStatus;
  speedAccuracyQuadrant:
    | 'FAST_AND_ACCURATE'
    | 'SLOW_AND_ACCURATE'
    | 'RUSHED_AND_INACCURATE'
    | 'SLOW_AND_STRUGGLING';
}

export interface SubjectAnalyticsItem {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unattempted: number;
  score: number;
  maxScore: number;
  accuracy: number;
  percentage: number;
  timeSpentSeconds: number;
  avgTimePerQuestionSeconds: number;
  status: PerformanceStatus;
  isStrongest: boolean;
  isWeakest: boolean;
}

export interface ChapterAnalyticsItem {
  chapterId: string;
  chapterName: string;
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  correct: number;
  wrong: number;
  unattempted: number;
  score: number;
  maxScore: number;
  accuracy: number;
  percentage: number;
  timeSpentSeconds: number;
  avgTimePerQuestionSeconds: number;
  status: PerformanceStatus;
}

export interface QuestionTimeExtreme {
  questionId: string;
  examQuestionId: string;
  displayOrder: number;
  timeSeconds: number;
  sectionName: string;
  isCorrect: boolean;
}

export interface SubjectBenchmarkComparison {
  subjectName: string;
  actualSeconds: number;
  recommendedSeconds: number;
  deltaPercent: number;
  observation: string;
}

export interface TimeAnalyticsReport {
  totalExamDurationMinutes: number;
  totalTimeUsedSeconds: number;
  timeRemainingSeconds: number;
  averageTimePerQuestionSeconds: number;
  timeOnCorrectQuestionsSeconds: number;
  avgTimeOnCorrectSeconds: number;
  timeOnWrongQuestionsSeconds: number;
  avgTimeOnWrongSeconds: number;
  timeOnUnattemptedQuestionsSeconds: number;
  avgTimeOnUnattemptedSeconds: number;
  timeWastedSeconds: number;
  fastestQuestion: QuestionTimeExtreme | null;
  slowestQuestion: QuestionTimeExtreme | null;
  pacingMetrics: {
    rushedCount: number;
    optimalPaceCount: number;
    overthoughtCount: number;
  };
  subjectTimeDistribution: {
    subjectName: string;
    timeSpentSeconds: number;
    percentageOfTotalTime: number;
  }[];
  subjectBenchmarkComparisons: SubjectBenchmarkComparison[];
}

export interface AttemptStrategyReport {
  negativeMarkingPenalty: number;
  marksLostToGuessing: number;
  scoreWithoutNegativeMarking: number;
  reviewBehavior: {
    markedForReviewCount: number;
    markedAndAnsweredCount: number;
    markedAndCorrectCount: number;
    markedAndWrongCount: number;
  };
  attemptRatio: number;
  accuracyVsSpeedProfile: string;
  strategicTakeaways: string[];
  overAttemptingWarning: string | null;
  underAttemptingWarning: string | null;
  potentialScoreGainMessage: string;
}

export interface ActionableRecommendation {
  id: string;
  category: 'CHAPTER_REVISION' | 'TIME_MANAGEMENT' | 'NEGATIVE_MARKING' | 'ATTEMPT_STRATEGY';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  impactScore: number;
  actionStep: string;
}

export type StrategyCategory =
  | 'ATTEMPT_COVERAGE'
  | 'RISK'
  | 'NEGATIVE_MARKING'
  | 'TIME_MANAGEMENT'
  | 'QUESTION_SELECTION'
  | 'REVIEW_BEHAVIOR'
  | 'SCORE_IMPROVEMENT';

export type StrategySeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type StrategyClassificationCode =
  | 'BALANCED'
  | 'OVER_ATTEMPTING'
  | 'UNDER_ATTEMPTING'
  | 'HIGH_RISK_ATTEMPTING'
  | 'TIME_HEAVY'
  | 'NEGATIVE_MARKING_HEAVY';

export interface StrategyRecommendationItem {
  id: string;
  ruleCode: string;
  category: StrategyCategory;
  title: string;
  message: string;
  severity: StrategySeverity;
  priority: number;
  targetType?: 'EXAM' | 'SUBJECT' | 'CHAPTER';
  targetId?: string;
  evidence: Record<string, any>;
  estimatedImpactMarks: number;
}

export interface StrategySummaryMetrics {
  totalQuestions: number;
  attemptedCount: number;
  attemptedPercentage: number;
  unattemptedCount: number;
  unattemptedPercentage: number;
  correctCount: number;
  wrongCount: number;
  accuracy: number;
  highRiskAttemptCount: number;
  highRiskWrongCount: number;
  highRiskAccuracy: number;
  negativeMarksLost: number;
  avoidableNegativeMarks: number;
  negativeMarkingImpactPercentage: number;
  timeHeavyWrongCount: number;
  timeHeavyAttemptCount: number;
  reviewedQuestionCount: number;
  reviewedCorrectCount: number;
  reviewedWrongCount: number;
  projectedImprovementMarks: number;
  projectedScore: number;
  actualObtainedMarks: number;
  maxScore: number;
}

export interface DetailedStrategyAnalysis {
  attemptId: string;
  examId: string;
  examTitle: string;
  strategyVersion: number;
  algorithmVersion: string;
  generatedAt: string;
  primaryClassification: StrategyClassificationCode;
  classifications: StrategyClassificationCode[];
  metrics: StrategySummaryMetrics;
  recommendations: StrategyRecommendationItem[];
  projectedImprovement: {
    estimatedAvoidableLossMarks: number;
    projectedScore: number;
    actualScore: number;
    disclaimer: string;
  };
}

export interface StrategyRuleEntity {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: StrategyCategory;
  metric: string;
  operator: string;
  threshold: number;
  comparisonValue?: number;
  severity: StrategySeverity;
  priority: number;
  recommendationTemplate: string;
  titleTemplate: string;
  isActive: boolean;
  configVersion: number;
  examTargetId?: string;
  examId?: string;
}

export interface FullAnalysisReport {
  attemptId: string;
  examId: string;
  examTitle: string;
  examTargetName: string;
  calculatedAt: string;
  thresholdsUsed: PerformanceThresholds;
  overall: OverallPerformanceMetrics;
  subjects: {
    items: SubjectAnalyticsItem[];
    strongestSubject: SubjectAnalyticsItem | null;
    weakestSubject: SubjectAnalyticsItem | null;
  };
  chapters: {
    items: ChapterAnalyticsItem[];
    mastered: ChapterAnalyticsItem[];
    revisionNeeded: ChapterAnalyticsItem[];
    criticalFocus: ChapterAnalyticsItem[];
  };
  timeAnalysis: TimeAnalyticsReport;
  attemptStrategy: AttemptStrategyReport;
  recommendations: ActionableRecommendation[];
}

export type RankTypeEnum =
  | 'OVERALL'
  | 'STATE'
  | 'DISTRICT'
  | 'SCHOOL'
  | 'COLLEGE'
  | 'INSTITUTION'
  | 'CATEGORY';

export interface ScopedRankSummary {
  type: RankTypeEnum;
  scopeName?: string;
  rank: number;
  totalCandidates: number;
  percentile: number;
  score: number;
  accuracy: number;
}

export interface MyRanksResponse {
  attemptId: string;
  examId: string;
  examTitle: string;
  status: 'RANK_READY' | 'RANK_PENDING' | 'RANK_PROCESSING';
  snapshotVersion: number;
  generatedAt?: string;
  overall: ScopedRankSummary;
  state?: ScopedRankSummary;
  district?: ScopedRankSummary;
  school?: ScopedRankSummary;
  college?: ScopedRankSummary;
  category?: ScopedRankSummary;
  predictedRank?: {
    predictedRankMin: number;
    predictedRankMax: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    modelVersion: string;
    disclaimer: string;
  } | null;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: string;
  studentName: string;
  studentCode: string;
  score: number;
  percentage: number;
  accuracy: number;
  timeUsedSeconds: number;
  percentile: number;
  state?: string;
  district?: string;
  schoolCollege?: string;
}

export interface AdminLeaderboardResponse {
  examId: string;
  examTitle: string;
  rankType: RankTypeEnum;
  scopeName?: string;
  snapshotVersion: number;
  totalCandidates: number;
  page: number;
  limit: number;
  totalPages: number;
  items: LeaderboardEntry[];
}

export interface SnapshotStatusResponse {
  examId: string;
  snapshotId?: string;
  snapshotVersion?: number;
  status: string;
  totalCandidates?: number;
  highestScore?: number;
  lowestScore?: number;
  averageScore?: number;
  medianScore?: number;
  integrityChecksPassed?: boolean;
  generatedAt?: string;
  completedAt?: string;
}

export type DataQualityStatusEnum =
  | 'PENDING_VALIDATION'
  | 'VALID'
  | 'INVALID'
  | 'PARTIALLY_VALID'
  | 'ARCHIVED';

export interface HistoricalScoreRangeEntity {
  id: string;
  historicalExamId: string;
  minScore: number;
  maxScore: number;
  representativeScore: number;
  minRank: number;
  maxRank: number;
  candidateCount: number;
  totalCandidates: number;
  percentileMin?: number | null;
  percentileMax?: number | null;
  datasetVersion: number;
  createdAt: string;
}

export interface HistoricalExamEntity {
  id: string;
  examName: string;
  examType: string;
  examDate?: string | null;
  durationMinutes: number;
  totalMarks: number;
  totalCandidates: number;
  source: string;
  dataQualityStatus: DataQualityStatusEnum;
  datasetVersion: number;
  qualityScore?: number | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  scoreRanges?: HistoricalScoreRangeEntity[];
  _count?: {
    datasets: number;
    scoreRanges: number;
  };
}

export interface DatasetQualityReport {
  historicalExamId: string;
  status: DataQualityStatusEnum;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  duplicateRecords: number;
  minScore: number;
  maxScore: number;
  isMonotonic: boolean;
  scoreCoveragePercentage: number;
  qualityScore: number;
  issues: string[];
}

export interface ModelAccuracySummary {
  modelCode: string;
  modelVersion: string;
  totalEvaluations: number;
  meanAbsoluteError: number;
  medianAbsoluteError: number;
  meanRelativeError: number;
  rangeCoveragePercentage: number;
  withinRangeCount: number;
}

// ═══════════════════════════════════════════════════════════════════
// MOCK COMPARISON & PERFORMANCE TREND TYPES
// ═══════════════════════════════════════════════════════════════════

export type TrendDirection = 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';

export interface MockDataPoint {
  attemptId: string;
  examId: string;
  examTitle: string;
  examType: string;
  mockNumber: number;
  label: string; // e.g. "Mock 1"
  date: string;
  score: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  rank: number | null;
  totalCandidates: number | null;
  percentile: number | null;
  timeUsedSeconds: number | null;
  timeUtilizationPercentage: number | null;
}

export interface ScoreTrendPoint {
  attemptId: string;
  label: string;
  date: string;
  score: number;
  maximumScore: number;
  percentage: number;
}

export interface AccuracyTrendPoint {
  attemptId: string;
  label: string;
  date: string;
  accuracy: number;
}

export interface RankTrendPoint {
  attemptId: string;
  label: string;
  date: string;
  rank: number | null;
  totalCandidates: number | null;
  percentile: number | null;
}

export interface PercentileTrendPoint {
  attemptId: string;
  label: string;
  date: string;
  percentile: number | null;
}

export interface TimeTrendPoint {
  attemptId: string;
  label: string;
  date: string;
  timeUsedSeconds: number | null;
  timeUtilizationPercentage: number | null;
  averageTimePerQuestion: number | null;
}

export interface SubjectTrendPoint {
  attemptId: string;
  label: string;
  date: string;
  accuracy: number;
  percentage: number;
  score: number;
  maxScore: number;
}

export interface SubjectTrendSeries {
  subjectId: string;
  subjectName: string;
  points: SubjectTrendPoint[];
}

export interface TrendInsight {
  type: 'POSITIVE' | 'WARNING' | 'NEUTRAL';
  metric: string;
  message: string;
}

export interface TrendSummary {
  totalMocks: number;
  firstMock: MockDataPoint | null;
  latestMock: MockDataPoint | null;
  bestMock: MockDataPoint | null;
  worstMock: MockDataPoint | null;
  scoreDelta: number;
  percentageDelta: number;
  accuracyDelta: number;
  rankDelta: number | null;
  rankImprovement: number | null;
  percentileDelta: number | null;
  timeUsedDeltaSeconds: number | null;
  trendDirections: {
    scoreTrend: TrendDirection;
    accuracyTrend: TrendDirection;
    rankTrend: TrendDirection;
    percentileTrend: TrendDirection;
  };
  mostImprovedSubject?: {
    subjectId: string;
    subjectName: string;
    accuracyDelta: number;
  } | null;
  strongestCurrentSubject?: {
    subjectId: string;
    subjectName: string;
    latestAccuracy: number;
  } | null;
  weakestCurrentSubject?: {
    subjectId: string;
    subjectName: string;
    latestAccuracy: number;
  } | null;
}

export interface PerformanceTrendsResponse {
  summary: TrendSummary;
  mocks: MockDataPoint[];
  scoreTrend: ScoreTrendPoint[];
  accuracyTrend: AccuracyTrendPoint[];
  rankTrend: RankTrendPoint[];
  percentileTrend: PercentileTrendPoint[];
  timeTrend: TimeTrendPoint[];
  subjectTrends: SubjectTrendSeries[];
  trendInsights: TrendInsight[];
}

export interface DirectComparisonResponse {
  mockA: MockDataPoint;
  mockB: MockDataPoint;
  scoreDelta: number;
  accuracyDelta: number;
  percentageDelta: number;
  rankDelta: number | null;
  rankImprovement: number | null;
  percentileDelta: number | null;
  timeDeltaSeconds: number | null;
  subjectDeltas: {
    subjectId: string;
    subjectName: string;
    scoreDelta: number;
    accuracyDelta: number;
  }[];
}

// ═══════════════════════════════════════════════════════════════════
// PARENT DASHBOARD TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ParentStudentInfo {
  studentId: string;
  name: string;
  studentCode: string;
  grade?: string;
  schoolCollege?: string;
  examTarget?: string;
  state?: string;
  district?: string;
}

export interface ParentStudentOverviewItem {
  studentId: string;
  name: string;
  studentCode: string;
  examTarget?: string;
  latestScore: number;
  latestPercentage: number;
  latestAccuracy: number;
  latestRank: number | null;
  latestPercentile: number | null;
  testsAttempted: number;
  attendancePercentage: number;
  lastTestDate?: string | null;
}

export interface ParentDashboardSummary {
  testsAttempted: number;
  averageScore: number;
  latestScore: number;
  bestScore: number;
  scoreImprovement: number;
  averageAccuracy: number;
  latestAccuracy: number;
  latestRank: number | null;
  latestPercentile: number | null;
  attendancePercentage: number;
}

export interface ParentSubjectSummaryItem {
  subjectId: string;
  name: string;
  score: number;
  maxScore: number;
  accuracy: number;
  percentage: number;
  status: string; // EXCELLENT, STRONG, GOOD, WEAK, CRITICAL
}

export interface ParentSubjectPerformance {
  strongest: {
    subjectId: string;
    name: string;
    accuracy: number;
  } | null;
  weakest: {
    subjectId: string;
    name: string;
    accuracy: number;
  } | null;
  all: ParentSubjectSummaryItem[];
}

export interface ParentAttendanceReport {
  scheduledCount: number;
  attendedCount: number;
  missedCount: number;
  attendancePercentage: number;
}

export interface ParentTimeManagementReport {
  averageTimePerQuestionSeconds: number;
  timeUtilizationPercentage: number;
  highTimeWrongCount: number;
  status: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT';
  observation: string;
}

export interface ParentRankSummary {
  official: {
    rank: number | null;
    totalCandidates: number | null;
    percentile: number | null;
    stateRank?: number | null;
    categoryRank?: number | null;
  };
  predicted?: {
    rankMin: number;
    rankMax: number;
    confidence: string;
    modelVersion: string;
    disclaimer: string;
  } | null;
}

export interface ParentRecommendationItem {
  category: 'SUBJECT' | 'TIME_MANAGEMENT' | 'ACCURACY' | 'CONSISTENCY';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  message: string;
}

export interface ParentRecentTestItem {
  attemptId: string;
  examName: string;
  examType: string;
  date: string;
  score: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  rank: number | null;
  percentile: number | null;
}

export interface RecommendedRevisionItem {
  subjectName: string;
  topicName: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  recommendedActions: string[];
  estimatedHours: number;
}

export interface ParentTrendPoint {
  attemptId: string;
  examName: string;
  date: string;
  score: number;
  maxScore: number;
  percentage: number;
  accuracy: number;
  rank: number | null;
  percentile: number | null;
}

export interface ParentDashboardResponse {
  student: ParentStudentInfo;
  summary: ParentDashboardSummary;
  subjects: ParentSubjectPerformance;
  attendance: ParentAttendanceReport;
  timeManagement: ParentTimeManagementReport;
  rank: ParentRankSummary;
  recommendations: ParentRecommendationItem[];
  recommendedRevisions?: RecommendedRevisionItem[];
  trendHistory?: ParentTrendPoint[];
  recentTests: ParentRecentTestItem[];
}

// ═══════════════════════════════════════════════════════════════════
// B2B & INSTITUTION MANAGEMENT TYPES
// ═══════════════════════════════════════════════════════════════════

export interface InstitutionInfo {
  institutionId: string;
  name: string;
  code: string;
  type: string;
  status: string;
}

export interface InstitutionDashboardSummary {
  totalStudents: number;
  activeStudents: number;
  testsConducted: number;
  averagePercentage: number;
  averageAccuracy: number;
  attendancePercentage: number;
}

export interface BatchSummaryItem {
  batchId: string;
  batchName: string;
  studentCount: number;
  activeStudents: number;
  averagePercentage: number;
  averageAccuracy: number;
  attendancePercentage: number;
  topStudent: {
    studentId: string;
    name: string;
    percentage: number;
  } | null;
}

export interface InstitutionDashboardResponse {
  institution: InstitutionInfo;
  summary: InstitutionDashboardSummary;
  topStudent: {
    studentId: string;
    name: string;
    percentage: number;
  } | null;
  weakestSubject: {
    subjectId: string;
    name: string;
    accuracy: number;
  } | null;
  batches: BatchSummaryItem[];
}

export interface BatchStudentItem {
  id: string;
  studentId: string;
  status: 'ACTIVE' | 'LEFT' | 'SUSPENDED' | 'REMOVED';
  joinedAt: string;
  student: {
    id: string;
    studentId: string;
    name: string;
    examTarget?: { id: string; name: string };
    studentClass?: { id: string; name: string };
  };
}

export interface BatchItem {
  id: string;
  institutionId: string;
  name: string;
  academicYear?: string;
  classLevel?: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | 'CANCELLED';
  startDate?: string;
  endDate?: string;
  examTarget?: { id: string; name: string };
  _count?: { students: number };
}

export interface BulkUploadSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  existingStudents: number;
  newStudents: number;
}

export interface BulkUploadErrorItem {
  rowNumber: number;
  field: string;
  errorCode: string;
  message: string;
}

export interface BulkUploadPreview {
  uploadId: string;
  fileName: string;
  status: string;
  summary: BulkUploadSummary;
  sampleErrors: BulkUploadErrorItem[];
}

export interface BulkUploadItem {
  id: string;
  institutionId: string;
  batchId?: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  rowCount: number;
  validRowCount: number;
  invalidRowCount: number;
  duplicateRowCount: number;
  existingStudentCount: number;
  newStudentCount: number;
  activatedCount: number;
  failedCount: number;
  status:
    | 'UPLOADED'
    | 'PARSING'
    | 'VALIDATING'
    | 'READY_FOR_REVIEW'
    | 'SUBMITTED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'ACTIVATING'
    | 'ACTIVATED'
    | 'PARTIALLY_ACTIVATED'
    | 'FAILED';
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  batch?: { id: string; name: string };
}

export interface ReportJobItem {
  id: string;
  institutionId: string;
  reportType: 'STUDENT_WISE' | 'BATCH_WISE' | 'SUBJECT_ANALYSIS' | 'CHAPTER_ANALYSIS' | 'RANK_LIST';
  format: 'XLSX' | 'PDF';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
  progress: number;
  fileName?: string;
  fileSize?: number;
  downloadUrl?: string;
  error?: string;
  createdAt: string;
  completedAt?: string;
  expiresAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// SUPER ADMIN & CONTROL CENTER TYPES
// ═══════════════════════════════════════════════════════════════════

export interface AdminDashboardOverview {
  users: {
    total: number;
    students: number;
    parents: number;
    admins: number;
    institutionAdmins: number;
    active: number;
    newThisMonth: number;
  };
  questions: {
    total: number;
    draft: number;
    submitted: number;
    underReview: number;
    approved: number;
    rejected: number;
    archived: number;
    translationCoveragePercentage: number;
  };
  translations: {
    supportedLanguagesCount: number;
    totalTranslatedQuestions: number;
    languages: Array<{
      code: string;
      name: string;
      translatedCount: number;
      completionRate: number;
    }>;
  };
  exams: {
    total: number;
    draft: number;
    submitted: number;
    approved: number;
    scheduled: number;
    active: number;
    ended: number;
    completed: number;
    cancelled: number;
  };
  attempts: {
    total: number;
    inProgress: number;
    submitted: number;
    autoSubmitted: number;
    completed: number;
  };
  evaluation: {
    totalEvaluated: number;
    averageScore: number;
    averagePercentage: number;
    averageAccuracy: number;
  };
  institutions: {
    total: number;
    active: number;
    pendingApproval: number;
    suspended: number;
    totalBatches: number;
    totalStudentsManaged: number;
  };
  sales: {
    available: boolean;
    totalRevenue?: number;
    revenueThisMonth?: number;
    activeSubscriptions?: number;
    newInstitutionsThisMonth?: number;
    message?: string;
  };
  notifications: {
    queued: number;
    sentToday: number;
    failedToday: number;
  };
  reports: {
    queued: number;
    processing: number;
    completed: number;
    failed: number;
  };
  approvals: {
    pendingTotal: number;
    byEntityType: Record<string, number>;
  };
  timestamp: string;
}

export interface ApprovalRequestItem {
  id: string;
  resourceType: string;
  resourceId: string;
  requestedById: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewedById?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  reviewComment?: string | null;
  metadata?: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
  entityPreview?: any;
}

export interface AuditLogItem {
  id: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, any> | null;
  afterState?: Record<string, any> | null;
  reason?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  correlationId?: string | null;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════
// ACADEMIC CALENDAR & NOTIFICATIONS TYPES
// ═══════════════════════════════════════════════════════════════════

export interface ExamCycleItem {
  id: string;
  name: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  _count?: { events: number };
}

export interface ExamCalendarEvent {
  id: string;
  cycleId: string;
  examId: string;
  plannedDate: string;
  plannedStartTime: string;
  plannedEndTime: string;
  timezone: string;
  status: 'PLANNED' | 'CONFIRMED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED';
  notes?: string | null;
  scheduleVersion: number;
  createdAt: string;
  exam?: {
    id: string;
    title: string;
    durationMinutes: number;
    totalQuestions: number;
  };
  cycle?: {
    id: string;
    name: string;
    academicYear: string;
  };
}

export interface FeatureActivationItem {
  id: string;
  featureCode:
    | 'EXAM_ACCESS'
    | 'RESULT_ACCESS'
    | 'RANKING'
    | 'PREDICTED_RANK'
    | 'PARENT_ACCESS'
    | 'INSTITUTION_REPORTS';
  targetType: string;
  targetId: string;
  isActive: boolean;
  activatedById?: string | null;
  activatedAt?: string | null;
  reason?: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  recipientAddress: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
  type: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  status:
    | 'PENDING'
    | 'QUEUED'
    | 'PROCESSING'
    | 'SENT'
    | 'DELIVERED'
    | 'FAILED'
    | 'RETRYING'
    | 'CANCELLED';
  sentAt?: string | null;
  lastError?: string | null;
  scheduleVersion: number;
  createdAt: string;
  logs?: Array<{
    id: string;
    provider: string;
    status: string;
    errorCode?: string;
    errorMessage?: string;
    requestTime: string;
  }>;
}

export interface NotificationTemplateItem {
  id: string;
  notificationType: string;
  channel: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
  languageCode: string;
  subject?: string | null;
  body: string;
  version: number;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════
// IN-APP NOTIFICATION & EXAM DETAILS TYPES
// ═══════════════════════════════════════════════════════════════════

export type NotificationType =
  | 'EXAM_SCHEDULED'
  | 'EXAM_RESCHEDULED'
  | 'EXAM_CANCELLED'
  | 'EXAM_STARTING_SOON'
  | 'EXAM_ACTIVATED'
  | 'EXAM_RESULT_PUBLISHED'
  | 'RESULT_AVAILABLE'
  | 'REPORT_READY'
  | 'SECURITY_ALERT'
  | string;

export interface NotificationData {
  entityType?: 'EXAM' | 'RESULT' | 'ATTEMPT' | 'REPORT' | string;
  entityId?: string;
  action?: 'VIEW' | 'ATTEMPT' | 'DOWNLOAD' | string;
  examTitle?: string;
  examTarget?: string;
  startTime?: string | null;
  durationMinutes?: number;
  totalQuestions?: number;
  totalMarks?: number;
  [key: string]: any;
}

export interface InAppNotification {
  id: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data: NotificationData | null;
  isRead: boolean;
  readAt: string | null;
  priority?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface NotificationListResponse {
  data: InAppNotification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UnreadCountResponse {
  count: number;
}

export interface ExamDetailsResponse {
  exam: Exam & {
    languages?: Array<{ id: string; name: string; code?: string; nativeName?: string }>;
    schedule?: {
      id: string;
      startTime: string;
      endTime: string;
      timezone: string;
      status: string;
    } | null;
  };
  accessDetails: {
    accessStatus:
      | 'AVAILABLE'
      | 'NOT_YET_STARTED'
      | 'ENDED'
      | 'ALREADY_ATTEMPTED'
      | 'IN_PROGRESS'
      | 'CANCELLED';
    canStart: boolean;
    message: string;
    serverTime: string;
    startTime: string | null;
    endTime: string | null;
    waitSeconds: number;
    existingAttempt?: {
      id: string;
      status: string;
      createdAt: string;
      submittedAt: string | null;
      resultId: string | null;
    } | null;
  };
}

// ═══════════════════════════════════════════════════════════════════
// STUDENT DASHBOARD & COMPARISON TYPES
// ═══════════════════════════════════════════════════════════════════

export interface StudentDashboardResponse {
  student: {
    studentId: string;
    studentCode?: string | null;
    name: string;
    class: string;
    examTarget: string;
    preferredLanguage: string;
    email?: string;
    avatar?: string | null;
  };
  nextExam: {
    examId: string;
    title: string;
    examTarget: string;
    durationMinutes: number;
    totalQuestions: number;
    totalMarks: number;
    startTime: string | null;
    endTime: string | null;
    status: string;
    canStart: boolean;
    waitSeconds: number;
    accessStatus: string;
    message: string;
  } | null;
  upcomingExams?: Array<{
    examId: string;
    title: string;
    examTarget: string;
    durationMinutes: number;
    totalQuestions: number;
    totalMarks: number;
    startTime: string | null;
    endTime: string | null;
    status: string;
    canStart: boolean;
    waitSeconds: number;
    accessStatus: string;
    message: string;
  }>;
  activeAttempt: {
    attemptId: string;
    examId: string;
    examTitle: string;
    startedAt: string;
    serverEndTime: string | null;
    timeRemainingSeconds: number;
    currentQuestionNumber: number;
    totalQuestions: number;
    answeredCount: number;
  } | null;
  latestPerformance: {
    latestScore: number;
    maxScore: number;
    percentage: number;
    accuracy: number;
    totalAttempts: number;
    timeSpentSeconds: number;
    correctCount: number;
    incorrectCount: number;
    unattemptedCount: number;
  } | null;
  rank: {
    rank: number | null;
    totalCandidates: number | null;
    percentile: number | null;
    stateRank?: number | null;
    categoryRank?: number | null;
  } | null;
  predictedRank: {
    predictedRankMin: number | null;
    predictedRankMax: number | null;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW' | null;
    modelVersion?: string | null;
    isEstimated: boolean;
  } | null;
  subjects: Array<{
    subjectId: string;
    subjectName: string;
    score: number;
    maxScore: number;
    accuracy: number;
    status: 'EXCELLENT' | 'GOOD' | 'WEAK';
    trendDelta?: number | null;
  }>;
  trendSummary: {
    scoreTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
    accuracyTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
    rankTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
    percentileTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
    recentScores: Array<{
      mockLabel: string;
      score: number;
      accuracy: number;
      rank: number | null;
      percentile: number | null;
    }>;
  };
  weakAreas: Array<{
    subjectName: string;
    chapterName: string;
    accuracy: number;
    totalQuestions: number;
    status: 'WEAK' | 'NEEDS_FOCUS';
  }>;
  recommendations: Array<{
    id: string;
    type: 'WARNING' | 'OPPORTUNITY' | 'STRENGTH' | 'TIP';
    message: string;
    actionLabel?: string | null;
    actionType?: 'PRACTICE' | 'PRACTICE_MOCK' | 'VIEW_STRATEGY' | 'VIEW_ANALYSIS' | 'VIEW_EXAMS';
    targetUrl?: string | null;
    subjectId?: string | null;
    subjectName?: string | null;
    mockTestId?: string | null;
    mockTestName?: string | null;
    fallbackMessage?: string | null;
  }>;
  timeManagement: {
    averageTimePerQuestionSeconds: number;
    timeUtilizationPercentage: number;
    totalTimeUsedSeconds: number;
    status: 'OPTIMAL' | 'NEEDS_IMPROVEMENT' | 'SLOW';
  } | null;
  attemptStrategy: {
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
    highRiskAttemptsCount: number;
    avoidableNegativeMarks: number;
    scoreGainOpportunity: number;
  } | null;
  recentResults: Array<{
    attemptId: string;
    examId: string;
    examTitle: string;
    examType: string;
    date: string;
    score: number;
    maxScore: number;
    percentage: number;
    accuracy: number;
    rank: number | null;
    totalCandidates: number | null;
    percentile: number | null;
  }>;
  unreadNotificationCount: number;
}

export interface ComparisonAttemptItem {
  attemptId: string;
  examId: string;
  examName: string;
  examType: string;
  date: string;
  score: number;
  maximumScore: number;
  percentage: number;
  accuracy: number;
  rank: number | null;
  totalCandidates: number | null;
  percentile: number | null;
  timeUsedSeconds: number | null;
  averageTimePerQuestionSeconds: number | null;
  correctCount: number;
  wrongCount: number;
  unattemptedCount: number;
  status: string;
}

export interface DetailedComparisonResponse {
  summary: {
    totalAttempts: number;
    first: {
      attemptId: string;
      label: string;
      date: string;
      score: number;
      maximumScore: number;
      percentage: number;
      accuracy: number;
      rank: number | null;
      percentile: number | null;
      timeUsedSeconds: number | null;
    } | null;
    latest: {
      attemptId: string;
      label: string;
      date: string;
      score: number;
      maximumScore: number;
      percentage: number;
      accuracy: number;
      rank: number | null;
      percentile: number | null;
      timeUsedSeconds: number | null;
    } | null;
    best: {
      attemptId: string;
      label: string;
      score: number;
      percentage: number;
      accuracy: number;
      rank: number | null;
      percentile: number | null;
    } | null;
    scoreDelta: number;
    percentageDelta: number;
    accuracyDelta: number;
    rankDelta: number | null;
    rankImprovement: number | null;
    percentileDelta: number | null;
    timeUsedDeltaSeconds: number | null;
    trendDirections: {
      scoreTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
      accuracyTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
      rankTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
      percentileTrend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'INSUFFICIENT_DATA';
    };
  };
  attempts: ComparisonAttemptItem[];
  scoreTrend: Array<{
    attemptId: string;
    label: string;
    date: string;
    score: number;
    maxScore: number;
    percentage: number;
  }>;
  accuracyTrend: Array<{
    attemptId: string;
    label: string;
    date: string;
    accuracy: number;
  }>;
  rankTrend: Array<{
    attemptId: string;
    label: string;
    date: string;
    rank: number | null;
    totalCandidates: number | null;
    percentile: number | null;
  }>;
  percentileTrend: Array<{
    attemptId: string;
    label: string;
    date: string;
    percentile: number | null;
  }>;
  timeTrend: Array<{
    attemptId: string;
    label: string;
    date: string;
    timeUsedMinutes: number | null;
    averageTimePerQuestionSeconds: number | null;
  }>;
  subjectComparison: Array<{
    subjectId: string;
    subjectName: string;
    mockAccuracies: Record<string, number>;
    mockScores: Record<string, number>;
    trendDelta?: number;
  }>;
  subjectTrends: Array<{
    subjectId: string;
    subjectName: string;
    data: Array<{
      mockLabel: string;
      accuracy: number;
      score: number;
    }>;
  }>;
  insights: string[];
}

// ═══════════════════════════════════════════════════════════════════
// RESULT PUBLICATION & LIFECYCLE TYPES
// ═══════════════════════════════════════════════════════════════════

export interface PublicationDashboardItem {
  examId: string;
  examTitle: string;
  examTarget: string;
  examStatus: string;
  examType: 'MOCK' | 'LIVE';
  totalCandidates: number;
  finalizedAttempts: number;
  evaluatedAttempts: number;
  analyticsCompletedAttempts: number;
  rankingCompleted: boolean;
  securityReviewCompleted: boolean;
  publicationStatus: 'NOT_READY' | 'PROCESSING' | 'READY_TO_PUBLISH' | 'PUBLISHED' | 'WITHHELD';
  isReadyToPublish: boolean;
  notReadyReason: string | null;
  publishedAt: string | null;
  publishedBy: string | null;
  publicationVersion: number;
  lastSchedule?: {
    startTime: string;
    endTime: string;
    status: string;
  } | null;
}

export interface PublicationPreviewResponse {
  examId: string;
  examTitle: string;
  examTarget: string;
  examStatus: string;
  examType: 'MOCK' | 'LIVE';
  publicationStatus: string;
  isReadyToPublish: boolean;
  notReadyReason: string | null;
  totalCandidates: number;
  finalizedAttempts: number;
  evaluatedAttempts: number;
  analyticsCompleted: number;
  rankingStatus: string;
  securityStatus: string;
  flaggedAttempts: number;
  disqualifiedAttempts: number;
  currentPublicationVersion: number;
  publishedAt: string | null;
  publishedBy: string | null;
}

export interface ResultStatusResponse {
  availability: 'PROCESSING' | 'RESULT_PENDING' | 'RESULT_READY' | 'PUBLISHED' | 'WITHHELD' | 'DISQUALIFIED' | 'FAILED';
  resultStatus: string;
  examType: 'MOCK' | 'LIVE';
  message: string;
  attemptId: string;
  examTitle: string;
  submittedAt: string | null;
  publishedAt?: string | null;
  processingStatus?: string;
  publicationStatus?: string;
  resultAvailable?: boolean;
  reportAvailable?: boolean;
  onlineReportAvailable?: boolean;
  pdfReportStatus?: string;
}


