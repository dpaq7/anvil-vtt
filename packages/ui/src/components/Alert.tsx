import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils.js';

/*
 * Error and notice box (DESIGN.md section 4, Error): a framed surface. The
 * destructive kind carries a hazard bar so it never relies on red text alone.
 */
const alertVariants = cva('relative w-full border-[3px] p-4 text-sm', {
  variants: {
    variant: {
      default: 'border-line bg-surface text-text',
      destructive: 'border-art-ink bg-surface pl-6 text-text shadow-[inset_8px_0_0_var(--art-hazard)]',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export const Alert = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
));
Alert.displayName = 'Alert';
