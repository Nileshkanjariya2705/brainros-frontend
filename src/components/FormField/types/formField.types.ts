// ** Packages **
import type { InputHTMLAttributes, ReactNode } from 'react';
import type { FieldErrors, FieldValues, Path, UseFormRegister } from 'react-hook-form';

/**
 * Base props every register-based FormField shares. Generic over the form's
 * value type `T` so `name` is type-checked against the schema (repo convention:
 * fields receive RHF's `register` + `errors`, not a Controller, for simple inputs).
 */
export interface BaseFieldProps<T extends FieldValues> {
  name: Path<T>;
  register: UseFormRegister<T>;
  errors?: FieldErrors<T>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  autoComplete?: string;
  className?: string;
  wrapperClass?: string;
}

/** Input size scale — mirrors the `Button` primitive's sizes. */
export type FieldSize = 'sm' | 'md' | 'lg';

export interface InputFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  type?: 'text' | 'email' | 'number' | 'tel' | 'url' | 'search' | 'date';
  /** Visual size. Defaults to `md` (matches the rest of the form controls). */
  size?: FieldSize;
  /** Hint shown under the field when there is no error. */
  helperText?: string;
  /** Decorative node rendered inside the field, left edge (e.g. an icon). */
  leftIcon?: ReactNode;
  /** Node rendered inside the field, right edge. May be interactive (a button). */
  rightIcon?: ReactNode;
  /** Show a spinner in the right slot (e.g. async validation in flight). */
  isLoading?: boolean;
  /** Override the input/label id. Defaults to `name`. */
  id?: string;
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  maxLength?: number;
  autoFocus?: boolean;
  /** Escape hatch for any other native <input> attribute not modelled above. */
  inputProps?: Omit<
    InputHTMLAttributes<HTMLInputElement>,
    'size' | 'type' | 'id' | 'name' | 'className'
  >;
}

export type PasswordFieldProps<T extends FieldValues> = BaseFieldProps<T>;
