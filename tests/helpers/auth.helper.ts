import { Page, expect } from '@playwright/test';

export interface UserRoleCredentials {
  mobileNumber: string;
  role: string;
  expectedDashboardUrl: string;
  expectedHeading?: string;
}

export const TEST_USERS: Record<string, UserRoleCredentials> = {
  superAdmin: {
    mobileNumber: '9000000000',
    role: 'SUPER_ADMIN',
    expectedDashboardUrl: '/super-admin/dashboard',
  },
  admin: {
    mobileNumber: '9000000091',
    role: 'ADMIN',
    expectedDashboardUrl: '/admin/dashboard',
  },
  student: {
    mobileNumber: '8320982232',
    role: 'STUDENT',
    expectedDashboardUrl: '/student/dashboard',
  },
  parent: {
    mobileNumber: '9000000601',
    role: 'PARENT',
    expectedDashboardUrl: '/parent/dashboard',
  },
  institutionAdmin: {
    mobileNumber: '9000000081',
    role: 'INSTITUTION_ADMIN',
    expectedDashboardUrl: '/institution/dashboard',
  },
  operator: {
    mobileNumber: '9000000098',
    role: 'OPERATOR',
    expectedDashboardUrl: '/staff/dashboard',
  },
  manager: {
    mobileNumber: '9000000097',
    role: 'MANAGER',
    expectedDashboardUrl: '/staff/dashboard',
  },
  generalManager: {
    mobileNumber: '9000000096',
    role: 'GENERAL_MANAGER',
    expectedDashboardUrl: '/staff/dashboard',
  },
  accountant: {
    mobileNumber: '9000000099',
    role: 'ACCOUNTANT',
    expectedDashboardUrl: '/staff/dashboard',
  },
};

/**
 * Logs in via the real UI using the given mobile number and standard development OTP (123456).
 */
export async function loginViaUI(page: Page, userKey: keyof typeof TEST_USERS | string) {
  const credentials =
    typeof userKey === 'string' && TEST_USERS[userKey]
      ? TEST_USERS[userKey]
      : { mobileNumber: userKey, expectedDashboardUrl: '' };

  await loginViaAPI(page, credentials.mobileNumber);
  if (credentials.expectedDashboardUrl) {
    await page.goto(credentials.expectedDashboardUrl);
    await page.waitForLoadState('domcontentloaded');
  }
}

const AUTH_CACHE: Record<string, { token: string; refreshToken: string; user: any }> = {};

/**
 * Logs in via direct backend API call and injects access/refresh tokens into localStorage/cookies for rapid test setups.
 */
export async function loginViaAPI(page: Page, mobileNumber: string, otp: string = '123456') {
  const backendBase = process.env.VITE_API_URL || 'http://127.0.0.1:3000';
  
  let authData = AUTH_CACHE[mobileNumber];

  if (!authData) {
    // 1. Send OTP
    const sendRes = await page.request.post(`${backendBase}/auth/login/request-otp`, {
      data: { identifier: mobileNumber },
    });
    const sendJson = await sendRes.json();

    if (!sendJson?.data?.loginRequestId) {
      throw new Error(`Failed to request OTP via API for ${mobileNumber}: ${JSON.stringify(sendJson)}`);
    }

    // 2. Verify OTP
    const verifyRes = await page.request.post(`${backendBase}/auth/login/verify-otp`, {
      data: { loginRequestId: sendJson.data.loginRequestId, otp },
    });
    const verifyJson = await verifyRes.json();

    if (!verifyJson?.data?.accessToken) {
      throw new Error(`Failed to login via API for ${mobileNumber}: ${JSON.stringify(verifyJson)}`);
    }

    authData = {
      token: verifyJson.data.accessToken,
      refreshToken: verifyJson.data.refreshToken,
      user: verifyJson.data.user,
    };
    AUTH_CACHE[mobileNumber] = authData;
  }

  const { token, refreshToken, user } = authData;

  // Clear any existing cookies to ensure clean isolation
  await page.context().clearCookies();

  // Add cookies to browser context for API cookie authentication
  await page.context().addCookies([
    { name: 'access_token', value: token, domain: 'localhost', path: '/' },
    { name: 'refresh_token', value: refreshToken, domain: 'localhost', path: '/' },
    { name: 'accessToken', value: token, domain: 'localhost', path: '/' },
    { name: 'refreshToken', value: refreshToken, domain: 'localhost', path: '/' },
  ]);

  // Set auth state into localStorage in page context
  await page.goto('/login');
  await page.evaluate(({ token, refreshToken, user }) => {
    localStorage.setItem('access_token', token);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('accessToken', token);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, refreshToken, user });
  await page.reload({ waitUntil: 'domcontentloaded' });

  return { token, user };
}
