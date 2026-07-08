// ** Packages **
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

/**
 * Drop-in replacement for React.lazy with one retry, to recover from
 * "Failed to fetch dynamically imported module" errors caused by stale chunks
 * after a deploy (simplified version of the repo's `lazyRoute`).
 */
export const lazyRoute = <T extends ComponentType<object>>(
  importFn: () => Promise<{ default: T }>,
): LazyExoticComponent<T> => {
  return lazy(() => importFn().catch(() => importFn()));
};
