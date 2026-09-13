/**
 * Per-Tab Authentication Session Manager
 * Uses browser `sessionStorage` to isolate authentication state to individual browser tabs.
 */

export const AUTH_TAB_SESSION_KEY = 'auth_tab_session';

/**
 * Returns the unique per-tab session ID or null if none exists.
 */
export const getTabSession = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return sessionStorage.getItem(AUTH_TAB_SESSION_KEY);
  } catch {
    return null;
  }
};

/**
 * Checks if the current browser tab has an active session marker.
 */
export const hasTabSession = (): boolean => {
  return Boolean(getTabSession());
};

/**
 * Initializes a new cryptographically unique per-tab session marker upon login.
 */
export const createTabSession = (): string => {
  if (typeof window === 'undefined') return '';
  const newSessionId =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `tab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  try {
    sessionStorage.setItem(AUTH_TAB_SESSION_KEY, newSessionId);
  } catch {}
  return newSessionId;
};

/**
 * Clears the per-tab session marker on explicit logout or session invalidation.
 */
export const clearTabSession = (): void => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(AUTH_TAB_SESSION_KEY);
  } catch {}
};
