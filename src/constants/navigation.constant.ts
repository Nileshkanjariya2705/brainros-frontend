/**
 * Route path registry (repo convention: PUBLIC_NAVIGATION / PRIVATE_NAVIGATION
 * objects, never inline path strings).
 */

// ** Unauthenticated paths **
export const PUBLIC_NAVIGATION = Object.freeze({
  login: '/login',
  register: '/register',
});

// ** Authenticated paths **
export const PRIVATE_NAVIGATION = Object.freeze({
  dashboard: '/',
  availableExams: '/exams',
  examInterface: '/exam/:examId/attempt/:attemptId',
  examResult: '/exam/result/:attemptId',
  myHistory: '/history',
});

// ** Misc **
export const NOT_FOUND_PATH = '*';
