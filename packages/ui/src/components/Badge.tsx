import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../lib/utils.js';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border border-zinc-700 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-zinc-100 text-zinc-900',
        secondary: 'border-transparent bg-zinc-800 text-zinc-100',
        destructive: 'border-transparent bg-red-600 text-zinc-100',
        outline: 'text-zinc-100',
        battle: 'border-transparent bg-red-600/20 text-red-400',
        story: 'border-transparent bg-purple-600/20 text-purple-400',
        montage: 'border-transparent bg-amber-600/20 text-amber-400',
        negotiation: 'border-transparent bg-blue-600/20 text-blue-400',
        respite: 'border-transparent bg-green-600/20 text-green-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
