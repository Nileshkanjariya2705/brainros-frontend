/**
 * Number input sanitization and key-press filters.
 * Ensures input fields only allow digits (or positive decimal numbers) without using type="number".
 */

/**
 * Filter onKeyDown event to only allow digit keys, navigation/editing keys, and optionally a single decimal point.
 */
export const handleNumberKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement>,
  allowDecimal = false,
) => {
  // Allow navigation, deletion, clipboard shortcuts
  const allowedKeys = [
    'Backspace',
    'Delete',
    'Tab',
    'Escape',
    'Enter',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ];

  if (allowedKeys.includes(e.key) || e.ctrlKey || e.metaKey) {
    return;
  }

  // Allow single decimal point if enabled
  if (allowDecimal && e.key === '.') {
    const target = e.currentTarget;
    if (!target.value.includes('.')) {
      return;
    }
  }

  // Block any non-digit character
  if (!/^[0-9]$/.test(e.key)) {
    e.preventDefault();
  }
};

/**
 * Sanitize string to keep only digits (integer).
 */
export const sanitizeInteger = (val: string): string => {
  return val.replace(/\D/g, '');
};

/**
 * Sanitize string to keep only valid positive decimal number (single decimal point).
 */
export const sanitizeDecimal = (val: string): string => {
  const sanitized = val.replace(/[^0-9.]/g, '');
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    return `${parts[0]}.${parts.slice(1).join('')}`;
  }
  return sanitized;
};
