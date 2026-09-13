/**
 * Centralized Feature Flag Keys for Brainros Frontend.
 * Use these constants everywhere rather than string literals.
 */
export const FEATURES = {
  GOOGLE_LOGIN: 'GOOGLE_LOGIN',
  PUBLIC_REGISTRATION: 'PUBLIC_REGISTRATION',
} as const;

export type FeatureKey = (typeof FEATURES)[keyof typeof FEATURES];

/**
 * Safe default values when flags are uninitialized or missing.
 * All future / environment-controlled features default to false.
 */
export const DEFAULT_FEATURES: Record<FeatureKey, boolean> = {
  [FEATURES.GOOGLE_LOGIN]: false,
  [FEATURES.PUBLIC_REGISTRATION]: false,
};
