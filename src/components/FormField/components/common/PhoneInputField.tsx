import { useState, useEffect } from 'react';
import type {
  FieldErrors,
  FieldValues,
  Path,
  PathValue,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';
import Label from './Label';
import HelperText from './HelperText';
import { Smartphone } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳', name: 'India (+91)' },
  { code: '+1', flag: '🇺🇸', name: 'USA (+1)' },
  { code: '+44', flag: '🇬🇧', name: 'UK (+44)' },
  { code: '+971', flag: '🇦🇪', name: 'UAE (+971)' },
  { code: '+1', flag: '🇨🇦', name: 'Canada (+1)' },
  { code: '+61', flag: '🇦🇺', name: 'Australia (+61)' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore (+65)' },
  { code: '+966', flag: '🇸🇦', name: 'Saudi Arabia (+966)' },
  { code: '+49', flag: '🇩🇪', name: 'Germany (+49)' },
];

export interface PhoneInputFieldProps<T extends FieldValues> {
  name: Path<T>;
  register: UseFormRegister<T>;
  setValue: UseFormSetValue<T>;
  watch?: UseFormWatch<T>;
  errors?: FieldErrors<T>;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  className?: string;
  id?: string;
}

const getFieldError = (
  errors: Record<string, unknown> | undefined,
  path: string,
): { message?: string } | undefined => {
  if (!errors) return undefined;
  return path
    .split('.')
    .reduce(
      (acc: Record<string, unknown> | undefined, part) =>
        acc?.[part] as Record<string, unknown> | undefined,
      errors,
    ) as { message?: string } | undefined;
};

export default function PhoneInputField<T extends FieldValues>({
  name,
  register,
  setValue,
  watch,
  errors,
  label = 'Mobile Number',
  placeholder = '98765 43210',
  required = false,
  disabled = false,
  helperText,
  className = '',
  id,
}: PhoneInputFieldProps<T>) {
  const fieldId = id || (name as string);
  const errorObj = getFieldError(errors as Record<string, unknown> | undefined, name as string);
  const errorMessage = errorObj?.message;

  const rawValue = watch ? (watch(name) as unknown) : undefined;

  const [countryCode, setCountryCode] = useState<string>('+91');
  const [localNumber, setLocalNumber] = useState<string>('');

  // Register RHF field
  useEffect(() => {
    register(name);
  }, [register, name]);

  // Sync initial state if rawValue is present (e.g. +919876543210)
  useEffect(() => {
    if (rawValue && typeof rawValue === 'string') {
      const valStr = rawValue as string;
      const matched = COUNTRY_CODES.find((c) => valStr.startsWith(c.code));
      if (matched) {
        setCountryCode(matched.code);
        setLocalNumber(valStr.slice(matched.code.length));
      } else {
        setLocalNumber(valStr);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCode = e.target.value;
    setCountryCode(newCode);
    const fullE164 = localNumber ? `${newCode}${localNumber}` : '';
    setValue(name, fullE164 as PathValue<T, Path<T>>, { shouldValidate: true, shouldDirty: true });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
    setLocalNumber(digitsOnly);
    const fullE164 = digitsOnly ? `${countryCode}${digitsOnly}` : '';
    setValue(name, fullE164 as PathValue<T, Path<T>>, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}

      <div className="relative flex rounded-xl shadow-sm">
        {/* Left: Country Code Dropdown */}
        <div className="relative flex items-center">
          <select
            aria-label="Country Code"
            value={countryCode}
            onChange={handleCountryChange}
            disabled={disabled}
            className="h-full rounded-l-xl border border-r-0 border-slate-300 bg-slate-100/80 px-2.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200/80 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:cursor-not-allowed transition-colors"
          >
            {COUNTRY_CODES.map((c, idx) => (
              <option key={`${c.code}-${idx}`} value={c.code}>
                {c.flag} {c.code}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Phone Input Field */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Smartphone className="h-4 w-4" />
          </div>
          <input
            id={fieldId}
            name={name as string}
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={localNumber}
            onChange={handleNumberChange}
            placeholder={placeholder}
            disabled={disabled}
            className={`w-full rounded-r-xl border border-l-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-500 transition-colors ${
              errorMessage
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500'
                : 'border-slate-300'
            }`}
          />
        </div>
      </div>

      <HelperText error={errorMessage} helperText={helperText} />
    </div>
  );
}
