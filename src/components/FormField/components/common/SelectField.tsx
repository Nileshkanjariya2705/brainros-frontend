import cn from 'classnames';
import type { FieldValues } from 'react-hook-form';

// ** Components **
import Label from './Label';
import HelperText from './HelperText';

// ** Types **
import type { BaseFieldProps, FieldSize } from '../../types/formField.types';

export interface SelectFieldProps<T extends FieldValues> extends BaseFieldProps<T> {
  options: { label: string; value: string }[];
  size?: FieldSize;
  helperText?: string;
  selectProps?: React.SelectHTMLAttributes<HTMLSelectElement>;
}

const sizeBase: Record<FieldSize, string> = {
  sm: 'py-1.5 text-xs',
  md: 'py-2 text-sm',
  lg: 'py-2.5 text-base',
};

const SelectField = <T extends FieldValues>({
  name,
  register,
  errors,
  label,
  options,
  placeholder = 'Select an option',
  size = 'md',
  required = false,
  disabled = false,
  helperText,
  id,
  className = '',
  wrapperClass = '',
  selectProps,
}: SelectFieldProps<T>) => {
  const error = errors?.[name]?.message as string | undefined;

  const selectId = id ?? name;
  const errorId = `${selectId}-error`;
  const helperId = `${selectId}-helper`;
  const describedBy = error ? errorId : helperText ? helperId : undefined;

  return (
    <div className={cn('w-full', wrapperClass)}>
      {label && (
        <Label htmlFor={selectId} required={required}>
          {label}
        </Label>
      )}

      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-required={required || undefined}
          aria-describedby={describedBy}
          className={cn(
            'block w-full rounded-md border shadow-sm outline-none transition bg-white',
            'focus:ring-1',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            sizeBase[size],
            'px-3 pr-10', // add padding for custom dropdown arrow
            error
              ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
              : 'border-gray-300 focus:border-brand-500 focus:ring-brand-500',
            className,
          )}
          {...selectProps}
          {...register(name)}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <HelperText error={error} helperText={helperText} errorId={errorId} helperId={helperId} />
    </div>
  );
};

export default SelectField;
