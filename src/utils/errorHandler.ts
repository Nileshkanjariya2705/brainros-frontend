/**
 * Centralized User-Friendly Error Normalizer and Sanitizer
 *
 * Guarantees that:
 * 1. No Prisma error codes (P2002, P2025, etc.), SQL errors, or stack traces leak to users.
 * 2. No UUIDs, internal database IDs, or raw JSON objects appear in user-facing toasts.
 * 3. Semantic error codes and common HTTP/network errors map to clear, actionable messages.
 * 4. Safe contextual fallbacks are provided when an unexpected error occurs.
 */

// Regex patterns to detect and clean technical / internal identifiers
const UUID_REGEX = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/gi;
const HEX_ID_REGEX = /\b[0-9a-fA-F]{24,32}\b/gi;
const PRISMA_CODE_REGEX = /\bP\d{4}\b/gi;
const STACK_OR_OBJECT_REGEX = /(\[object Object\]|at\s+[\w\d_.]+\s+\(.*?\)|Cannot read propert(y|ies) of|Request failed with status code \d{3})/i;

// Mapping of known semantic error codes / keywords to user-friendly messages
const SEMANTIC_ERROR_MAP: Record<string, string> = {
  // Authentication & Session
  INVALID_CREDENTIALS: 'Invalid email or password.',
  UNAUTHORIZED: 'Your session has expired. Please log in again.',
  FORBIDDEN: 'You do not have access.',
  FORBIDDEN_RESOURCE: 'You do not have access.',
  FORBIDDEN_EXCEPTION: 'You do not have access.',
  ACCESS_DENIED: 'You do not have access.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  USER_INACTIVE: 'Your account has been deactivated. Please contact support.',
  ACCOUNT_DEACTIVATED: 'Your account has been deactivated. Please contact support.',
  STUDENT_INACTIVE: 'This student account is currently inactive.',
  OTP_INVALID: 'Invalid OTP. Please check the code and try again.',
  OTP_EXPIRED: 'OTP has expired. Please request a new one.',
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment and try again.',

  // Conflicts & Duplicates
  EMAIL_ALREADY_EXISTS: 'Email address already exists.',
  STUDENT_MOBILE_EXISTS: 'Mobile number already exists.',
  MOBILE_ALREADY_EXISTS: 'Mobile number already exists.',
  STUDENT_ID_EXISTS: 'Student ID already exists.',
  ROLL_NUMBER_EXISTS: 'Roll number already exists for this batch.',
  INVOICE_ALREADY_EXISTS: 'An invoice for this billing period already exists.',
  ATTEMPT_ALREADY_EXISTS: 'You have already started or submitted this exam.',
  DUPLICATE_RESOURCE_CONFLICT: 'A record with this information already exists.',
  DUPLICATE_QUESTION_NUMBER: 'A question with this number already exists.',
  CODE_ALREADY_EXISTS: 'A record with this code already exists.',
  USERNAME_ALREADY_EXISTS: 'This username is already taken.',

  // Not Found
  RESOURCE_NOT_FOUND: 'The requested item could not be found.',
  USER_NOT_FOUND: 'User could not be found.',
  STUDENT_NOT_FOUND: 'Student could not be found.',
  EXAM_NOT_FOUND: 'Exam could not be found.',
  INVOICE_NOT_FOUND: 'Invoice could not be found.',
  QUESTION_PAPER_NOT_FOUND: 'Question paper could not be found.',

  // Constraints & Relations
  FOREIGN_KEY_CONSTRAINT_VIOLATION: 'The referenced record (such as selected school or subject) is no longer available.',
  RELATION_CONSTRAINT_VIOLATION: 'This item cannot be modified or deleted because it is linked to other records.',
  INPUT_VALUE_TOO_LONG: 'One or more fields exceed the allowed character limit.',
  DATA_VALIDATION_ERROR: 'Please review and correct the invalid form fields.',
  VALIDATION_ERROR: 'Please review and correct the invalid form fields.',

  // Exam & Question Paper Flows
  EXAM_NOT_AVAILABLE: 'This exam is currently not available.',
  EXAM_ALREADY_STARTED: 'This exam has already started and schedule cannot be changed.',
  EXAM_ALREADY_ENDED: 'This exam has already ended.',
  EXAM_NOT_STARTED: 'This exam has not started yet.',
  QUESTION_PAPER_MISSING: 'Please upload the question paper first.',
  TRANSLATION_IN_PROGRESS: 'Question translation is still in progress.',
  RESULT_NOT_PUBLISHED: 'Results have not been published yet.',
  RESULT_PROCESSING_NOT_COMPLETE: 'Please wait for result processing to complete before publishing.',

  // System & Infrastructure
  DATABASE_UNAVAILABLE: 'Service is temporarily unavailable. Please retry in a few moments.',
  DATABASE_CONNECTION_LOST: 'Connection was interrupted. Please try again shortly.',
  DATABASE_TRANSACTION_TIMEOUT: 'The operation timed out. Please try again.',
  INFRASTRUCTURE_UNAVAILABLE: 'Background processing is temporarily unavailable. Please try again.',
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
};

/**
 * Strips technical IDs, Prisma codes, SQL fragments, and stack traces from raw strings.
 */
export function sanitizeUserFacingMessage(
  rawMessage: string,
  fallbackMessage = 'Something went wrong. Please try again.',
): string {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return fallbackMessage;
  }

  let cleaned = rawMessage.trim();

  // If message contains raw stack trace or object strings, fallback immediately
  if (STACK_OR_OBJECT_REGEX.test(cleaned)) {
    return fallbackMessage;
  }

  // Check known semantic error codes directly
  const upperCode = cleaned.toUpperCase().replace(/[\s-]+/g, '_');
  if (SEMANTIC_ERROR_MAP[upperCode]) {
    return SEMANTIC_ERROR_MAP[upperCode];
  }

  if (/^forbidden(\s+resource|\s+exception)?$/i.test(cleaned) || /^access\s+denied$/i.test(cleaned)) {
    return 'You do not have access.';
  }

  // Prisma unique constraint error pattern
  if (/Unique constraint failed on the fields/i.test(cleaned) || /P2002/i.test(cleaned)) {
    const lower = cleaned.toLowerCase();
    if (lower.includes('email')) return 'Email address already exists.';
    if (lower.includes('mobile') || lower.includes('phone')) return 'Mobile number already exists.';
    if (lower.includes('rollnumber') || lower.includes('roll_no')) return 'Roll number already exists.';
    if (lower.includes('code')) return 'A record with this code already exists.';
    if (lower.includes('billnumber') || lower.includes('billingmonth')) return 'An invoice for this billing period already exists.';
    return 'A record with this information already exists.';
  }

  // Prisma foreign key / relation error patterns
  if (/Foreign key constraint failed/i.test(cleaned) || /P2003/i.test(cleaned)) {
    return 'The selected related item is no longer available.';
  }

  if (/Record to update not found/i.test(cleaned) || /Record to delete does not exist/i.test(cleaned) || /P2025/i.test(cleaned)) {
    return 'The requested record could not be found or has already been removed.';
  }

  // Remove raw UUIDs from strings
  if (UUID_REGEX.test(cleaned)) {
    cleaned = cleaned.replace(UUID_REGEX, '').replace(/\s{2,}/g, ' ').trim();
  }

  // Remove raw Hex IDs (24+ chars)
  if (HEX_ID_REGEX.test(cleaned)) {
    cleaned = cleaned.replace(HEX_ID_REGEX, '').replace(/\s{2,}/g, ' ').trim();
  }

  // Remove Prisma codes like P2002, P2022
  if (PRISMA_CODE_REGEX.test(cleaned)) {
    cleaned = cleaned.replace(PRISMA_CODE_REGEX, '').replace(/\s{2,}/g, ' ').trim();
  }

  // Clean trailing punctuation or empty remnants
  cleaned = cleaned.replace(/^[\s,:.-]+|[\s,:.-]+$/g, '').trim();

  if (cleaned.length === 0 || cleaned.toLowerCase() === 'error' || cleaned.toLowerCase() === 'internal server error') {
    return fallbackMessage;
  }

  // Ensure message ends with a period if it's a complete sentence
  if (!/[.!?]$/.test(cleaned) && cleaned.length > 5) {
    cleaned += '.';
  }

  return cleaned;
}

/**
 * Normalizes any error object, Axios error, string, or exception into a safe,
 * user-friendly message with contextual fallback support.
 */
export function getUserFriendlyErrorMessage(
  error: unknown,
  fallbackActionMessage = 'Something went wrong. Please try again.',
): string {
  if (!error) {
    return fallbackActionMessage;
  }

  // 1. Direct string
  if (typeof error === 'string') {
    return sanitizeUserFacingMessage(error, fallbackActionMessage);
  }

  // 2. Axios or API Error Object
  if (typeof error === 'object' && error !== null) {
    const errObj = error as any;

    // Check offline / network error
    if (errObj.code === 'ERR_NETWORK' || (typeof navigator !== 'undefined' && navigator.onLine === false)) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }

    if (errObj.code === 'ECONNABORTED' || (typeof errObj.message === 'string' && errObj.message.includes('timeout'))) {
      return 'The request took too long to complete. Please try again.';
    }

    const response = errObj.response;
    const status = response?.status;

    // Semantic code from API response body
    const apiCode = response?.data?.code || errObj.code;
    if (typeof apiCode === 'string' && SEMANTIC_ERROR_MAP[apiCode.toUpperCase()]) {
      return SEMANTIC_ERROR_MAP[apiCode.toUpperCase()];
    }

    // 403 Forbidden status handling
    if (status === 403) {
      const rawApiMessage = response?.data?.message || response?.data?.error;
      if (typeof rawApiMessage === 'string' && rawApiMessage.trim().length > 0) {
        const cleaned = rawApiMessage.trim();
        if (/^forbidden(\s+resource|\s+exception)?$/i.test(cleaned) || /^access\s+denied$/i.test(cleaned)) {
          return 'You do not have access.';
        }
        return sanitizeUserFacingMessage(cleaned, 'You do not have access.');
      }
      return 'You do not have access.';
    }

    // Message field from response body
    const rawApiMessage = response?.data?.message || response?.data?.error;
    if (Array.isArray(rawApiMessage)) {
      const joined = rawApiMessage.filter(Boolean).map(String).join('. ');
      if (joined.trim().length > 0) {
        return sanitizeUserFacingMessage(joined, fallbackActionMessage);
      }
    } else if (typeof rawApiMessage === 'string' && rawApiMessage.trim().length > 0) {
      return sanitizeUserFacingMessage(rawApiMessage, fallbackActionMessage);
    }

    // HTTP Status Fallbacks
    if (status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    if (status === 404) {
      return 'The requested item could not be found.';
    }
    if (status === 409) {
      return 'A conflict occurred with an existing record.';
    }
    if (status === 429) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (status && status >= 500) {
      return fallbackActionMessage || 'An unexpected server error occurred. Please try again later.';
    }

    // Generic JS Error message
    if (typeof errObj.message === 'string' && errObj.message.trim().length > 0 && errObj.message !== 'canceled') {
      return sanitizeUserFacingMessage(errObj.message, fallbackActionMessage);
    }
  }

  return fallbackActionMessage;
}
