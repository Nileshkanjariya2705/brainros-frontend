// ** Packages **
import cn from 'classnames';

// ** Types **
interface LabelProps {
  htmlFor?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Field label with a required-asterisk affordance. */
const Label = ({ htmlFor, required, className, children }: LabelProps) => {
  return (
    <label
      htmlFor={htmlFor}
      className={cn('mb-1 block text-sm font-medium text-gray-700', className)}
    >
      {children}
      {required && <span className="ml-0.5 text-red-500">*</span>}
    </label>
  );
};

export default Label;
