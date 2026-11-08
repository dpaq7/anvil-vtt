import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/utils.js';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'flex min-h-[80px] w-full bg-raised px-2.5 py-2 text-sm text-text shadow-[inset_0_0_0_1.5px_var(--color-line)] placeholder:text-text-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-active focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:cursor-not-allowed disabled:bg-well disabled:text-text-soft disabled:shadow-[inset_0_0_0_1.5px_var(--color-line-quiet)]',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
