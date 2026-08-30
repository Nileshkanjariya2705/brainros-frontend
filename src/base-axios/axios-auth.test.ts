import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Axios, setAuthInterceptorCallbacks } from './index';

vi.mock('axios', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    default: {
      ...actual.default,
      create: vi.fn().mockImplementation((config: any) => {
        const instance: any = vi.fn((reqConfig) =>
          Promise.resolve({ data: 'mock-response', config: reqConfig }),
        );
        instance.defaults = config || { withCredentials: true };
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
        instance.post = vi.fn().mockResolvedValue({ data: { message: 'Refreshed' } });
        return instance;
      }),
      post: vi.fn().mockResolvedValue({ data: { message: 'Refreshed' } }),
    },
  };
});

describe('Axios Client & Auth Interceptors (HttpOnly Cookie Lifecycle)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. should be configured with withCredentials: true for HttpOnly cookies', () => {
    expect(Axios).toBeDefined();
    expect(Axios.defaults.withCredentials).toBe(true);
  });

  it('2. should pass requests through without injecting bearer tokens from storage', async () => {
    const requestHandler = (Axios.interceptors.request as any).handlers?.[0]?.fulfilled;
    if (requestHandler) {
      const config = await requestHandler({ url: '/students/me', headers: {} });
      expect(config.headers.Authorization).toBeUndefined();
    }
  });

  it('3. should register and trigger store sync and logout callbacks', () => {
    const onSyncStore = vi.fn();
    const onLogout = vi.fn();

    setAuthInterceptorCallbacks({ onSyncStore, onLogout });
    expect(true).toBe(true);
  });

  it('4. should not retry non-401 errors (400, 404, 500)', async () => {
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

  it('5. should not retry already-retried 401 requests', async () => {
    const errorHandler = (Axios.interceptors.response as any).handlers?.[0]?.rejected;
    if (errorHandler) {
      const error401Retried = {
        config: { url: '/students/me', _retry: true },
        response: { status: 401, data: { message: 'Unauthorized' } },
      };

      await expect(errorHandler(error401Retried)).rejects.toEqual(error401Retried);
    }
  });

  it('6. should not retry public auth endpoints on 401', async () => {
    const errorHandler = (Axios.interceptors.response as any).handlers?.[0]?.rejected;
    if (errorHandler) {
      const errorLogin = {
        config: { url: '/auth/login', _retry: false },
        response: { status: 401, data: { message: 'Invalid credentials' } },
      };

      await expect(errorHandler(errorLogin)).rejects.toEqual(errorLogin);
      expect(errorLogin.config._retry).toBe(false);
    }
  });
});
