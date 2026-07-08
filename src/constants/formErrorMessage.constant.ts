/**
 * Form validation messages as enums (repo convention — see
 * `formErrorMessage.constant.ts`). Yup schemas reference these so wording
 * lives in ONE place.
 */
export enum EmailError {
  required = 'Email is required',
  valid = 'Email is not in a valid format',
}

export enum PasswordError {
  required = 'Password is required',
  minLengthReq = 'Password must be at least 6 characters',
  match = 'Password and confirm password must match',
}

export enum CommonFieldError {
  required = 'This field is required',
}
