import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Drop-in replacement for React.lazy with retry and auto-reload recovery,
 * preventing "Failed to fetch dynamically imported module" errors during Vite HMR / chunk updates.
 */
export const lazyRoute = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
): LazyExoticComponent<T> => {
  return lazy(async () => {
    try {
      return await importFn();
    } catch (err: any) {
      console.warn('[lazyRoute] Dynamic import failed, attempting immediate retry...', err);
      try {
        return await importFn();
      } catch (retryErr: any) {
        // If it is a chunk / dynamic module fetch error, trigger one page reload to fetch fresh Vite module map
        const storageKey = `vite_chunk_reload_${window.location.pathname}`;
        const hasReloaded = sessionStorage.getItem(storageKey);
        if (!hasReloaded) {
          sessionStorage.setItem(storageKey, 'true');
          window.location.reload();
          return new Promise(() => {}); // page is reloading
        }
        sessionStorage.removeItem(storageKey);
        throw retryErr;
      }
    }
  });
};
