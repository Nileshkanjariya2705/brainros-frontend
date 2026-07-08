import { describe, it, expect, beforeEach } from 'vitest';
import { reducer, setCredentials, logout } from './authSlice';
import type { AuthState } from '@/modules/Auth/types/auth.types';

const initial: AuthState = { user: null, token: null, isAuthenticated: false };

describe('authSlice', () => {
  beforeEach(() => localStorage.clear());

  it('sets credentials on login and marks the user authenticated', () => {
    const next = reducer(
      initial,
      setCredentials({
        token: 'jwt-123',
        user: { id: '1', name: 'Vivek', email: 'v@x.com', role: 'admin' },
      }),
    );

    expect(next.isAuthenticated).toBe(true);
    expect(next.token).toBe('jwt-123');
    expect(next.user?.email).toBe('v@x.com');
    expect(localStorage.getItem('access_token')).toBe('jwt-123');
  });

  it('clears everything on logout', () => {
    const loggedIn: AuthState = {
      user: { id: '1', name: 'Vivek', email: 'v@x.com', role: 'admin' },
      token: 'jwt-123',
      isAuthenticated: true,
    };

    const next = reducer(loggedIn, logout());

    expect(next.isAuthenticated).toBe(false);
    expect(next.token).toBeNull();
    expect(next.user).toBeNull();
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
