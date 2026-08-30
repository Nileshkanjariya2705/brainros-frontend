/**
 * Token Storage Helper.
 * Notice: Authentication now uses secure HTTP-only cookies managed by the browser.
 * This helper provides safe cleanup routines to purge any legacy storage entries.
 */

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenStorage = {
  get(): string | null {
    return null;
  },

  set(_token: string): void {
    // No-op: Tokens are stored exclusively in HttpOnly cookies
  },

  getRefreshToken(): string | null {
    return null;
  },

  setRefreshToken(_token: string): void {
    // No-op: Tokens are stored exclusively in HttpOnly cookies
  },

  clear(): void {
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
    } catch {
      // Ignore storage errors in restricted contexts
    }
  },
};
