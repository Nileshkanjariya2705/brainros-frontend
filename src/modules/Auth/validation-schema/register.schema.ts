import * as yup from 'yup';

export const registerSchema = yup
  .object({
    phone: yup
      .string()
      .trim()
      .required('Mobile number is required')
      .matches(/^\+?[1-9]\d{1,14}$/, 'Mobile number must be in E.164 format (e.g. +919876543210)'),
    name: yup
      .string()
      .trim()
      .required('Name is required')
      .min(2, 'Name must be at least 2 characters'),
    email: yup
      .string()
      .trim()
      .transform((val) => (val === '' ? undefined : val))
      .email('Please enter a valid email address')
      .optional(),
    state: yup.string().trim().required('State is required'),
    district: yup.string().trim().required('District is required'),
    schoolCollege: yup.string().trim().required('School/PUC/College is required'),
    classId: yup.string().trim().required('Please select your Class'),
    preferredLanguageId: yup.string().trim().required('Please select your Preferred Language'),
    examTargetId: yup.string().trim().required('Please select your Exam Target'),
  })
  .required();

export type RegisterFormValues = yup.InferType<typeof registerSchema>;
