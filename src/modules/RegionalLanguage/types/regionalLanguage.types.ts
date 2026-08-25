export interface SupportedLanguage {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  description?: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuestionTranslationItem {
  id: string;
  questionId: string;
  languageId: string;
  questionText: string;
  passageText?: string | null;
  assertionText?: string | null;
  reasonText?: string | null;
  explanation?: string | null;
  language?: {
    id: string;
    code: string;
    name: string;
    nativeName: string;
  };
}

export interface OptionTranslationItem {
  id: string;
  optionId: string;
  languageId: string;
  optionText: string;
  language?: {
    id: string;
    code: string;
    name: string;
    nativeName: string;
  };
}

export interface TranslationCompletenessItem {
  languageId: string;
  languageCode: string;
  languageName: string;
  nativeName: string;
  isQuestionTranslated: boolean;
  translatedOptionsCount: number;
  totalOptions: number;
  isComplete: boolean;
  isDefaultLanguage: boolean;
}

export interface TranslationCompletenessResponse {
  questionId: string;
  defaultLanguageId: string;
  completeness: TranslationCompletenessItem[];
  isFullyTranslatedAllLanguages: boolean;
}

export interface ExamLanguageConfig {
  id: string;
  examId: string;
  languageId: string;
  isDefault: boolean;
  displayOrder: number;
  language: SupportedLanguage;
}

export interface UpsertFullTranslationPayload {
  languageId: string;
  questionText: string;
  passageText?: string;
  assertionText?: string;
  reasonText?: string;
  explanation?: string;
  optionTranslations?: {
    optionId: string;
    optionText: string;
  }[];
}
