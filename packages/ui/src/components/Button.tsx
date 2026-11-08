import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/utils.js';

/*
 * Storyboard buttons (DESIGN.md section 4, Buttons):
 * default = Primary (the one main action), outline and secondary = Secondary,
 * destructive = Session danger, ghost = frameless, link = Quiet link.
 * Every button moves 1 px when pressed. Disabled is a well fill with soft text.
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-active focus-visible:ring-offset-2 focus-visible:ring-offset-canvas active:translate-x-px active:translate-y-px disabled:pointer-events-none disabled:text-text-soft',
  {
    variants: {
      variant: {
        default:
          'border-[3px] border-art-ink bg-active font-display text-on-active shadow-[3px_3px_0_var(--color-shadow)] hover:bg-active/90 disabled:border-line-quiet disabled:bg-well disabled:shadow-none',
        destructive:
          'border-2 border-dashed border-alert bg-surface text-alert hover:bg-well disabled:border-line-quiet disabled:bg-well',
        outline:
          'bg-raised text-text shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:bg-well disabled:bg-well disabled:shadow-[inset_0_0_0_1.5px_var(--color-line-quiet)]',
        secondary:
          'bg-raised text-text shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:bg-well disabled:bg-well disabled:shadow-[inset_0_0_0_1.5px_var(--color-line-quiet)]',
        ghost: 'text-text hover:bg-well',
        link: 'text-text underline underline-offset-[3px] hover:decoration-2',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-9 px-3',
        lg: 'h-11 px-6 text-[15px]',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';
