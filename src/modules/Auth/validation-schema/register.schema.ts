import * as yup from 'yup';

// Step 1: Personal Identification
export const step1Schema = yup.object({
  name: yup
    .string()
    .trim()
    .required('Full Name is required')
    .min(2, 'Name must be at least 2 characters'),
  phone: yup
    .string()
    .trim()
    .required('Mobile number is required')
    .matches(/^\+?[1-9]\d{1,14}$/, 'Mobile number must be in E.164 format (e.g. +919876543210)'),
  email: yup
    .string()
    .trim()
    .transform((val) => (val === '' ? undefined : val))
    .email('Please enter a valid email address')
    .optional(),
});

// Step 2: Location & Institution
export const step2Schema = yup.object({
  state: yup.string().trim().required('State is required'),
  district: yup.string().trim().required('District is required'),
  schoolCollege: yup.string().trim().required('School/PUC/College name is required'),
});

// Step 3: Academic Profile & Preferences
export const step3Schema = yup.object({
  classId: yup.string().trim().required('Please select your Class'),
  preferredLanguageId: yup.string().trim().required('Please select your Preferred Language'),
  examTargetId: yup.string().trim().required('Please select your Exam Target'),
});

// Full Combined Schema for Final Submit
export const registerSchema = step1Schema.concat(step2Schema).concat(step3Schema);

export type RegisterFormValues = yup.InferType<typeof registerSchema>;
export type Step1Values = yup.InferType<typeof step1Schema>;
export type Step2Values = yup.InferType<typeof step2Schema>;
export type Step3Values = yup.InferType<typeof step3Schema>;

export const STEP_FIELDS = {
  1: ['name', 'phone', 'email'] as const,
  2: ['state', 'district', 'schoolCollege'] as const,
  3: ['classId', 'preferredLanguageId', 'examTargetId'] as const,
};
