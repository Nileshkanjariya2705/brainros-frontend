// ** Packages **
import { forwardRef, type InputHTMLAttributes } from 'react';
import cn from 'classnames';

// ** Types **
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Standalone text input primitive (NOT react-hook-form bound). For RHF forms
 * use the field components in `@/components/FormField` instead.
 * forwardRef so it still works with `register()` if needed.
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className, ...rest }, ref) => {
    const inputId = id ?? rest.name;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-md border px-3 py-2 text-sm shadow-sm outline-none transition',
            'focus:border-brand-500 focus:ring-1 focus:ring-brand-500',
            error ? 'border-red-400' : 'border-gray-300',
            className,
          )}
          {...rest}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
