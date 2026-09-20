import { test, expect } from '@playwright/test';
import { sanitizeUserFacingMessage, getUserFriendlyErrorMessage } from '../../src/utils/errorHandler';
import { toast } from '../../src/utils/toast';

test.describe('Toast & User-Facing Error Message UX Verification', () => {
  test('TOAST-001: Centralized Error Sanitizer strips Prisma P2002 and database details', async () => {
    const rawPrismaError = 'Unique constraint failed on the fields: (`email`) (PrismaClientKnownRequestError P2002)';
    const cleanMsg = sanitizeUserFacingMessage(rawPrismaError);
    expect(cleanMsg).toBe('Email address already exists.');
    expect(cleanMsg).not.toContain('P2002');
    expect(cleanMsg).not.toContain('Unique constraint');
    expect(cleanMsg).not.toContain('Prisma');
  });

  test('TOAST-002: Centralized Error Sanitizer strips raw UUIDs and Hex IDs', async () => {
    const rawUuidError = 'Student 8f31a6c2-4912-4c22-b5e1-88f18837e2b1 could not be found.';
    const cleanMsg = sanitizeUserFacingMessage(rawUuidError);
    expect(cleanMsg).not.toMatch(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/);
    expect(cleanMsg).toContain('Student could not be found.');
  });

  test('TOAST-003: Centralized Error Sanitizer maps known semantic codes', async () => {
    expect(getUserFriendlyErrorMessage('EMAIL_ALREADY_EXISTS')).toBe('Email address already exists.');
    expect(getUserFriendlyErrorMessage('STUDENT_MOBILE_EXISTS')).toBe('Mobile number already exists.');
    expect(getUserFriendlyErrorMessage('INVOICE_ALREADY_EXISTS')).toBe('An invoice for this billing period already exists.');
    expect(getUserFriendlyErrorMessage('ATTEMPT_ALREADY_EXISTS')).toBe('You have already started or submitted this exam.');
    expect(getUserFriendlyErrorMessage('UNAUTHORIZED')).toBe('Your session has expired. Please log in again.');
    expect(getUserFriendlyErrorMessage('FORBIDDEN')).toBe('You do not have permission to perform this action.');
    expect(getUserFriendlyErrorMessage('TOO_MANY_REQUESTS')).toBe('Too many requests. Please wait a moment and try again.');
  });

  test('TOAST-004: Network offline and connection abort errors map to helpful action guidance', async () => {
    const networkError = { code: 'ERR_NETWORK', message: 'Network Error' };
    const cleanNetworkMsg = getUserFriendlyErrorMessage(networkError);
    expect(cleanNetworkMsg).toBe('Unable to connect to the server. Please check your internet connection and try again.');

    const timeoutError = { code: 'ECONNABORTED', message: 'timeout of 15000ms exceeded' };
    const cleanTimeoutMsg = getUserFriendlyErrorMessage(timeoutError);
    expect(cleanTimeoutMsg).toBe('The request took too long to complete. Please try again.');
  });

  test('TOAST-005: Unexpected 500 runtime errors use contextual action fallback and hide stack traces', async () => {
    const runtimeCrash = new Error("Cannot read properties of undefined (reading 'userId')");
    const safeMsg = getUserFriendlyErrorMessage(runtimeCrash, 'Unable to save student. Please try again.');
    expect(safeMsg).toBe('Unable to save student. Please try again.');
    expect(safeMsg).not.toContain('undefined');
    expect(safeMsg).not.toContain('Cannot read');
  });

  test('TOAST-006: Toast Manager automatically cleans errors and prevents duplicate toasts', async () => {
    let emittedToasts: any[] = [];
    const unsubscribe = toast.subscribe((toasts) => {
      emittedToasts = toasts;
    });

    toast.clear();
    // Emit technical error
    toast.error('Record with id 8f31a6c2-4912-4c22-b5e1-88f18837e2b1 not found. P2025');

    expect(emittedToasts.length).toBe(1);
    expect(emittedToasts[0].message).not.toContain('8f31a6c2');
    expect(emittedToasts[0].message).not.toContain('P2025');

    // Attempt to emit duplicate toast within 2-second window
    toast.error('Record with id 8f31a6c2-4912-4c22-b5e1-88f18837e2b1 not found. P2025');
    expect(emittedToasts.length).toBe(1); // Deduped!

    toast.clear();
    unsubscribe();
  });
});
