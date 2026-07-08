/**
 * FormField barrel — import every field from here (repo convention:
 * `import { InputField, PasswordField } from '@/components/FormField'`).
 * Add new field components under components/common and export them here.
 */
export { default as InputField } from './components/common/InputField';
export { default as PasswordField } from './components/common/PasswordField';
export { default as Label } from './components/common/Label';
export { default as HelperText } from './components/common/HelperText';

export type { BaseFieldProps, InputFieldProps, PasswordFieldProps } from './types/formField.types';
