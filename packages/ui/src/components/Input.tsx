import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../lib/utils.js';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full bg-raised px-3 py-2 text-sm text-text shadow-[inset_0_0_0_1.5px_var(--color-line)] placeholder:text-text-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-active focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:bg-well disabled:text-text-soft disabled:shadow-[inset_0_0_0_1.5px_var(--color-line-quiet)]',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
