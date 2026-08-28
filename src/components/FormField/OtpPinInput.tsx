// ** Packages **
import React, { useRef, useEffect } from 'react';

export interface OtpPinInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  error?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const OtpPinInput: React.FC<OtpPinInputProps> = ({
  length = 6,
  value = '',
  onChange,
  error,
  autoFocus = true,
  disabled = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  // Convert incoming string into array of single characters
  const digits = Array.from({ length }, (_, i) => value[i] || '');

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (!rawVal) return;

    // Grab the last typed character
    const char = rawVal.slice(-1);
    if (!/^\d+$/.test(char)) return; // Digits only

    const newDigits = [...digits];
    newDigits[index] = char;
    const newOtp = newDigits.join('');
    onChange(newOtp);

    // Auto-advance to next box if available
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        // Clear current box
        const newDigits = [...digits];
        newDigits[index] = '';
        onChange(newDigits.join(''));
      } else if (index > 0) {
        // Jump back to previous box and clear it
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        onChange(newDigits.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    const cleanNumbers = pastedData.replace(/\D/g, '').slice(0, length);

    if (!cleanNumbers) return;

    onChange(cleanNumbers);

    // Focus on the next empty box or the last box
    const nextIndex = Math.min(cleanNumbers.length, length - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {Array.from({ length }, (_, index) => {
          const isFilled = Boolean(digits[index]);
          return (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={1}
              disabled={disabled}
              value={digits[index]}
              onChange={(e) => handleChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className={`h-12 w-10 sm:h-14 sm:w-12 text-center text-xl sm:text-2xl font-black font-mono rounded-xl border transition-all duration-150 outline-none select-none ${
                error
                  ? 'border-red-500/80 bg-red-500/10 text-red-300 ring-1 ring-red-500/30'
                  : isFilled
                    ? 'border-indigo-500/80 bg-indigo-500/15 text-white shadow-lg shadow-indigo-500/20'
                    : 'border-white/15 bg-white/5 text-slate-200 hover:border-white/25 hover:bg-white/10'
              } focus:border-indigo-400 focus:bg-indigo-600/20 focus:text-white focus:ring-2 focus:ring-indigo-500/40 focus:scale-105`}
            />
          );
        })}
      </div>

      {error && (
        <p className="text-center text-xs font-semibold text-red-400 animate-in fade-in">{error}</p>
      )}
    </div>
  );
};

export default OtpPinInput;
