// ** Packages **
import * as yup from 'yup';

// ** Constants **
import { EmailError, PasswordError } from '@/constants/formErrorMessage.constant';

/**
 * Yup schema for the login form (repo convention: schemas live in a module's
 * `validation-schema/` folder, named `*.schema.ts`, messages from constants).
 */
export const loginSchema = yup
  .object({
    email: yup.string().trim().required(EmailError.required).email(EmailError.valid),
    password: yup.string().required(PasswordError.required).min(6, PasswordError.minLengthReq),
  })
  .required();

export type LoginFormValues = yup.InferType<typeof loginSchema>;
