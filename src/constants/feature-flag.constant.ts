/**
 * Centralized Feature Flag Keys for Brainros Frontend.
 * Use these constants everywhere rather than string literals.
 */
export const FEATURES = {
  ADD_QUESTION: 'ADD_QUESTION',
  BULK_IMPORT_QUESTION: 'BULK_IMPORT_QUESTION',
  QUESTION_BANK: 'QUESTION_BANK',
  BULK_IMPORT_TRANSLATION: 'BULK_IMPORT_TRANSLATION',
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

/**
 * Safe default values when flags are uninitialized or missing.
 * All future / environment-controlled features default to false.
 */
export const DEFAULT_FEATURES: Record<FeatureKey, boolean> = {
  [FEATURES.ADD_QUESTION]: false,
  [FEATURES.BULK_IMPORT_QUESTION]: false,
  [FEATURES.QUESTION_BANK]: false,
  [FEATURES.BULK_IMPORT_TRANSLATION]: false,
};
