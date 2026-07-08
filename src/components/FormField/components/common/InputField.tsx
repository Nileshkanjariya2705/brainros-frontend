// ** Packages **
import cn from 'classnames';
import type { FieldValues } from 'react-hook-form';

// ** Components **
import Label from './Label';
import HelperText from './HelperText';

// ** Types **
import type { FieldSize, InputFieldProps } from '../../types/formField.types';

// ** Style maps **
const sizeBase: Record<FieldSize, string> = {
  sm: 'py-1.5 text-xs',
  md: 'py-2 text-sm',
  lg: 'py-2.5 text-base',
};

// Horizontal padding when there is NO adornment on that side. With an icon we
// switch to a wider, fixed pad so text never overlaps the icon. Using pl-*/pr-*
// (not the `px-*` shorthand) keeps the two sides independently overridable.
const padXIdle: Record<FieldSize, { left: string; right: string }> = {
  sm: { left: 'pl-2.5', right: 'pr-2.5' },
  md: { left: 'pl-3', right: 'pr-3' },
  lg: { left: 'pl-3.5', right: 'pr-3.5' },
};

/**
 * Text input wired to react-hook-form via `register`. Generic over the form
 * value type so `name` is type-checked. Pass `register` + `errors` from useForm.
 *
 * Supports optional left/right icons, a loading spinner, a neutral helper hint,
 * and size variants — and is fully accessibility-wired (label association,
 * `aria-invalid`, and `aria-describedby` pointing at the error/hint).
 */
const InputField = <T extends FieldValues>({
  name,
  register,
  errors,
  label,
  placeholder,
  type = 'text',
  size = 'md',
  required = false,
  disabled = false,
  readOnly = false,
  autoComplete,
  helperText,
  leftIcon,
  rightIcon,
  isLoading = false,
  id,
  inputMode,
  maxLength,
  autoFocus,
  className = '',
  wrapperClass = '',
  inputProps,
}: InputFieldProps<T>) => {
  const error = errors?.[name]?.message as string | undefined;

  const inputId = id ?? name;
  const errorId = `${inputId}-error`;
  const helperId = `${inputId}-helper`;
  const describedBy = error ? errorId : helperText ? helperId : undefined;

  // The loading spinner occupies the right slot; otherwise the rightIcon does.
  const hasLeft = Boolean(leftIcon);
  const hasRight = isLoading || Boolean(rightIcon);

  return (
    <div className={cn('w-full', wrapperClass)}>
      {label && (
        <Label htmlFor={inputId} required={required}>
          {label}
        </Label>
      )}

      <div className="relative">
        {hasLeft && (
          <span className="pointer-events-none absolute left-2.5 top-1/2 flex -translate-y-1/2 items-center text-gray-400">
            {leftIcon}
          </span>
        )}

        <input
          id={inputId}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          autoFocus={autoFocus}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy}
          className={cn(
            'block w-full rounded-md border shadow-sm outline-none transition',
            'placeholder:text-gray-400',
            'focus:ring-1',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            'read-only:cursor-default read-only:bg-gray-50',
            sizeBase[size],
            hasLeft ? 'pl-9' : padXIdle[size].left,
            hasRight ? 'pr-9' : padXIdle[size].right,
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
              : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500',
            className,
          )}
          {...inputProps}
          {...register(name)}
        />

        {hasRight && (
          <span className="absolute right-2.5 top-1/2 flex -translate-y-1/2 items-center text-gray-400">
            {isLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              rightIcon
            )}
          </span>
        )}
      </div>

      <HelperText error={error} helperText={helperText} errorId={errorId} helperId={helperId} />
    </div>
  );
};

export default InputField;
