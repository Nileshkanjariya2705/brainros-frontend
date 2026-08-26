/**
 * Centralized Token Storage with memory cache & persistent dual fallback.
 * Manages Access Token and Refresh Token across page reloads and cross-origin sessions.
 */

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

let memoryAccessToken: string | null = null;
let memoryRefreshToken: string | null = null;

export const tokenStorage = {
  get(): string | null {
    if (memoryAccessToken) return memoryAccessToken;
    try {
      const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (stored) {
        memoryAccessToken = stored;
        return stored;
      }
    } catch (_error) {
      return null;
    }
    return null;
  },

  set(token: string): void {
    memoryAccessToken = token;
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } catch (_error) {
      // Ignore storage errors in restricted contexts
    }
  },

  getRefreshToken(): string | null {
    if (memoryRefreshToken) return memoryRefreshToken;
    try {
      const stored = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (stored) {
        memoryRefreshToken = stored;
        return stored;
      }
    } catch (_error) {
      return null;
    }
    return null;
  },

  setRefreshToken(token: string): void {
    memoryRefreshToken = token;
    try {
      if (token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, token);
      }
    } catch (_error) {
      // Ignore storage errors in restricted contexts
    }
  },

  clear(): void {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
      sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (_error) {
      // Ignore storage errors in restricted contexts
    }
  },
};
