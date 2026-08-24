import * as yup from 'yup';

export const sendOtpSchema = yup
  .object({
    mobileNumber: yup
      .string()
      .trim()
      .required('Mobile number is required')
      .matches(/^\+?[1-9]\d{1,14}$/, 'Mobile number must be in E.164 format (e.g. +919876543210)'),
  })
  .required();

export const verifyOtpSchema = yup
  .object({
    mobileNumber: yup
      .string()
      .trim()
      .required('Mobile number is required')
      .matches(/^\+?[1-9]\d{1,14}$/, 'Mobile number must be in E.164 format'),
    otp: yup
      .string()
      .required('OTP is required')
      .length(6, 'OTP must be exactly 6 characters')
      .matches(/^\d+$/, 'OTP must be a numeric code'),
  })
  .required();

export type SendOtpFormValues = yup.InferType<typeof sendOtpSchema>;
export type VerifyOtpFormValues = yup.InferType<typeof verifyOtpSchema>;
