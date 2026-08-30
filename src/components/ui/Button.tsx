import { forwardRef, type ButtonHTMLAttributes } from 'react';
import cn from 'classnames';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'success' | 'brand';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-200/50 focus:ring-indigo-500 border border-transparent',
  brand:
    'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-200 focus:ring-indigo-500 border border-transparent',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 focus:ring-slate-400 border border-slate-200',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100/80 active:bg-slate-200/60 focus:ring-slate-300 border border-transparent',
  danger:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm shadow-rose-200/50 focus:ring-rose-500 border border-transparent',
  success:
    'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-200/50 focus:ring-emerald-500 border border-transparent',
  outline:
    'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus:ring-indigo-400 shadow-sm',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs font-bold rounded-xl min-h-[36px]',
  md: 'px-4 py-2 text-xs sm:text-sm font-bold rounded-xl min-h-[40px]',
  lg: 'px-5 py-2.5 text-sm sm:text-base font-extrabold rounded-2xl min-h-[44px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', isLoading, disabled, children, className, ...rest },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 select-none',
          'transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...rest}
      >
        {isLoading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
