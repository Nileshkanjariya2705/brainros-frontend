/**
 * Token storage helpers.
 *
 * The axios interceptor reads the token from here (synchronously, no React/Redux
 * import) to avoid circular dependencies between the store and the http layer.
 * Redux mirrors this value for UI/state purposes — these helpers are the source
 * of truth that survives a page refresh.
 */
const ACCESS_TOKEN_KEY = 'access_token';

export const tokenStorage = {
  get(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  },
};
