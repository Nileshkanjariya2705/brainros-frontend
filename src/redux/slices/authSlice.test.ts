import { describe, it, expect, beforeEach } from 'vitest';
import { reducer, setCredentials, logout } from './authSlice';
import type { AuthState } from '@/modules/Auth/types/auth.types';

const initial: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isInitializing: false,
  roles: [],
  permissions: [],
  activeRole: null,
};

describe('authSlice', () => {
  beforeEach(() => localStorage.clear());

  it('sets credentials on login and marks the user authenticated', () => {
    const next = reducer(
      initial,
      setCredentials({
        accessToken: 'jwt-123',
        refreshToken: 'refresh-123',
        user: {
          id: '1',
          phone: '+919876543210',
          mobileNumber: '+919876543210',
          email: 'v@x.com',
          roles: ['STUDENT'],
          isActive: true,
          isVerified: true,
        },
      }),
    );

    expect(next.isAuthenticated).toBe(true);
    expect(next.token).toBe('jwt-123');
    expect(next.user?.email).toBe('v@x.com');
    expect(next.roles).toContain('STUDENT');
    expect(next.activeRole).toBe('STUDENT');
    expect(next.isInitializing).toBe(false);
  });

  it('clears everything on logout', () => {
    const loggedIn: AuthState = {
      user: {
        id: '1',
        phone: '+919876543210',
        mobileNumber: '+919876543210',
        email: 'v@x.com',
        roles: ['STUDENT'],
        isActive: true,
        isVerified: true,
      },
      token: 'jwt-123',
      refreshToken: null,
      isAuthenticated: true,
      isInitializing: false,
      roles: ['STUDENT'],
      permissions: ['exam:attempt'],
      activeRole: 'STUDENT',
    };

    const next = reducer(loggedIn, logout());
    expect(next.isAuthenticated).toBe(false);
    expect(next.token).toBeNull();
    expect(next.user).toBeNull();
    expect(next.roles).toEqual([]);
    expect(next.permissions).toEqual([]);
    expect(next.activeRole).toBeNull();
  });
});
