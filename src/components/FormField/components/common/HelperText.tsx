// ** Types **
interface HelperTextProps {
  /** Validation error — takes priority over the hint and is announced to AT. */
  error?: string;
  /** Neutral hint shown only when there is no error. */
  helperText?: string;
  /** id for the error node (wire to the input's aria-describedby). */
  errorId?: string;
  /** id for the hint node (wire to the input's aria-describedby). */
  helperId?: string;
}

/**
 * Field-level message under an input. Renders the error if present (announced
 * via role="alert"), otherwise the neutral helper hint, otherwise nothing.
 */
const HelperText = ({ error, helperText, errorId, helperId }: HelperTextProps) => {
  if (error) {
    return (
      <p id={errorId} role="alert" className="mt-1 text-xs text-red-600">
        {error}
      </p>
    );
  }

  if (helperText) {
    return (
      <p id={helperId} className="mt-1 text-xs text-gray-500">
        {helperText}
      </p>
    );
  }

  return null;
};

export default HelperText;
