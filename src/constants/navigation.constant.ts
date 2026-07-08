/**
 * Route path registry (repo convention: PUBLIC_NAVIGATION / PRIVATE_NAVIGATION
 * objects, never inline path strings).
 */

// ** Unauthenticated paths **
export const PUBLIC_NAVIGATION = Object.freeze({
  login: '/login',
});

// ** Authenticated paths **
export const PRIVATE_NAVIGATION = Object.freeze({
  dashboard: '/',
});

// ** Misc **
export const NOT_FOUND_PATH = '*';
