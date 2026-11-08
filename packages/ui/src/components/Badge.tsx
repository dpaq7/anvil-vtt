import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../lib/utils.js';

/*
 * Chips and tags (DESIGN.md section 4): square, 13 px bold.
 * default = Neutral tag, secondary = plain well, outline = Skill chip,
 * destructive = hazard tag (the Winded look), scene variants = mode identity.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap border border-transparent px-2 py-0.5 text-xs font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-active focus:ring-offset-2 focus:ring-offset-canvas',
  {
    variants: {
      variant: {
        default: 'bg-well text-text shadow-[inset_0_0_0_1.5px_var(--color-line-quiet)]',
        secondary: 'bg-well text-text',
        destructive: 'bg-danger text-on-danger shadow-[0_0_0_1.5px_var(--art-ink)]',
        outline: 'text-text shadow-[inset_0_0_0_1.5px_var(--color-line)]',
        battle: 'bg-scene-battle text-on-scene-battle shadow-[inset_0_0_0_1.5px_var(--art-ink)]',
        story: 'bg-scene-story text-on-scene-story shadow-[inset_0_0_0_1.5px_var(--art-ink)]',
        montage: 'bg-scene-montage text-on-scene-montage shadow-[inset_0_0_0_1.5px_var(--art-ink)]',
        negotiation:
          'bg-scene-negotiation text-on-scene-negotiation shadow-[inset_0_0_0_1.5px_var(--art-ink)]',
        respite: 'bg-scene-respite text-on-scene-respite shadow-[inset_0_0_0_1.5px_var(--art-ink)]',
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
