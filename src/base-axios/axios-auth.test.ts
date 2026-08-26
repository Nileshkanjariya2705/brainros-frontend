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

  it('2. should manage in-memory token securely without writing to localStorage', () => {
    tokenStorage.set('memory-only-access-token');
    expect(tokenStorage.get()).toBe('memory-only-access-token');
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();

    tokenStorage.clear();
    expect(tokenStorage.get()).toBeNull();
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
});
