// ** Packages **
import { useState } from 'react';
import cn from 'classnames';
import { Eye, EyeOff } from 'lucide-react';
import type { FieldValues } from 'react-hook-form';

// ** Components **
import Label from './Label';
import HelperText from './HelperText';

// ** Types **
import type { PasswordFieldProps } from '../../types/formField.types';

/** Password input with a show/hide toggle (lucide icons). register-based. */
const PasswordField = <T extends FieldValues>({
  name,
  register,
  errors,
  label,
  placeholder = '••••••••',
  required = false,
  disabled = false,
  autoComplete = 'current-password',
  className = '',
  wrapperClass = '',
}: PasswordFieldProps<T>) => {
  const [visible, setVisible] = useState(false);
  const error = errors?.[name]?.message as string | undefined;

  return (
    <div className={cn('w-full', wrapperClass)}>
      {label && (
        <Label htmlFor={name} required={required}>
          {label}
        </Label>
      )}
      <div className="relative">
        <input
          id={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={cn(
            'w-full rounded-md border px-3 py-2 pr-10 text-sm shadow-sm outline-none transition',
            'focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
            error ? 'border-red-400' : 'border-gray-300',
            className,
          )}
          {...register(name)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <HelperText error={error} />
    </div>
  );
};

export default PasswordField;
