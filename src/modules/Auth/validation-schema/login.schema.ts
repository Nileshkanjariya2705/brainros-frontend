import * as yup from 'yup';

// ─── 1. Mobile Number (OTP) Login Schema ────────────────────────────────────
export const mobileLoginSchema = yup
  .object({
    mobileNumber: yup
      .string()
      .trim()
      .required('Mobile number is required')
      .matches(
        /^\+?[1-9]\d{1,14}$/,
        'Enter a valid mobile number with country code (e.g. +919876543210)',
      ),
  })
  .required();

// ─── 2. Email Address (OTP) Login Schema ────────────────────────────────────
export const emailLoginSchema = yup
  .object({
    email: yup
      .string()
      .trim()
      .required('Email address is required')
      .email('Enter a valid email address'),
  })
  .required();

// ─── 3. Student ID (OTP) Login Schema ───────────────────────────────────────
export const studentIdLoginSchema = yup
  .object({
    studentId: yup
      .string()
      .trim()
      .required('Student ID or Student Code is required')
      .min(3, 'Enter a valid Student ID (e.g. BRN-2026-000001 or STU001001)'),
  })
  .required();

// ─── 4. OTP Verification Schema ─────────────────────────────────────────────
export const verifyOtpSchema = yup
  .object({
    otp: yup
      .string()
      .required('Verification code is required')
      .min(4, 'Code must be at least 4 digits')
      .max(8, 'Code cannot exceed 8 digits')
      .matches(/^\d+$/, 'Code must contain only numbers'),
  })
  .required();

// Legacy alias exports for backward compatibility
export const sendOtpSchema = mobileLoginSchema;
export const passwordlessLoginSchema = yup.object({
  identifier: yup.string().trim().required('Identifier is required'),
});
export const verifyPasswordlessLoginSchema = yup.object({
  loginRequestId: yup.string().required(),
  otp: yup.string().required('OTP is required'),
});

export type MobileLoginFormValues = yup.InferType<typeof mobileLoginSchema>;
export type EmailLoginFormValues = yup.InferType<typeof emailLoginSchema>;
export type StudentIdLoginFormValues = yup.InferType<typeof studentIdLoginSchema>;
export type VerifyOtpFormValues = yup.InferType<typeof verifyOtpSchema>;
export type SendOtpFormValues = MobileLoginFormValues;
export type PasswordlessLoginFormValues = yup.InferType<typeof passwordlessLoginSchema>;
export type VerifyPasswordlessLoginFormValues = yup.InferType<typeof verifyPasswordlessLoginSchema>;
