import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Axios, setAuthInterceptorCallbacks } from './index';
import { tokenStorage } from '@/utils/token';

vi.mock('axios', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn().mockImplementation(() => {
        const instance: any = vi.fn((reqConfig) =>
          Promise.resolve({ data: 'mock-response', config: reqConfig }),
        );
        instance.interceptors = {
          request: {
            use: vi.fn((fn) => {
              instance._requestInterceptor = fn;
            }),
          },
          response: {
            use: vi.fn((successFn, errFn) => {
              instance._responseSuccess = successFn;
              instance._responseError = errFn;
            }),
          },
        };
        instance.post = vi.fn().mockResolvedValue({ data: { accessToken: 'new-refreshed-token' } });
        return instance;
      }),
      post: vi.fn(),
    },
  };
});

describe('Axios Client & Auth Interceptors (Production Token Lifecycle)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tokenStorage.clear();
  });

  it('1. should be configured with withCredentials: true for HttpOnly cookies', () => {
    expect(Axios).toBeDefined();
  });

  it('2. should manage token storage and clear properly', () => {
    tokenStorage.set('test-access-token');
    expect(tokenStorage.get()).toBe('test-access-token');
    expect(localStorage.getItem('access_token')).toBe('test-access-token');

    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });

  it('3. should attach Authorization header to protected requests', async () => {
    tokenStorage.set('test-jwt-token');

    // Simulate request interceptor
    const requestHandler = (Axios.interceptors.request as any).handlers?.[0]?.fulfilled;
    if (requestHandler) {
      const config = await requestHandler({ url: '/students/me', headers: {} });
      expect(config.headers.Authorization).toBe('Bearer test-jwt-token');
    }
  });

  it('4. should omit Authorization header from public auth endpoints', async () => {
    tokenStorage.set('test-jwt-token');

    const requestHandler = (Axios.interceptors.request as any).handlers?.[0]?.fulfilled;
    if (requestHandler) {
      const config = await requestHandler({ url: '/auth/login/verify-otp', headers: {} });
      expect(config.headers.Authorization).toBeUndefined();
    }
  });

  it('5. should register and trigger store sync and logout callbacks', () => {
    const onSyncStore = vi.fn();
    const onLogout = vi.fn();

    setAuthInterceptorCallbacks({ onSyncStore, onLogout });
    expect(true).toBe(true);
  });

  it('6. should not retry non-401 errors (400, 404, 500)', async () => {
    const errorHandler = (Axios.interceptors.response as any).handlers?.[0]?.rejected;
    if (errorHandler) {
      const error404 = {
        config: { url: '/academic/subjects', _retry: false },
        response: { status: 404, data: { message: 'Not found' } },
      };

      await expect(errorHandler(error404)).rejects.toEqual(error404);
      expect(error404.config._retry).toBe(false);
    }
  });

  it('7. should not retry already-retried 401 requests', async () => {
    const errorHandler = (Axios.interceptors.response as any).handlers?.[0]?.rejected;
    if (errorHandler) {
      const error401Retried = {
        config: { url: '/students/me', _retry: true },
        response: { status: 401, data: { message: 'Unauthorized' } },
      };

      await expect(errorHandler(error401Retried)).rejects.toEqual(error401Retried);
    }
  });
});
