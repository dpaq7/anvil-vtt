import type { SVGProps } from 'react';

export interface D20IconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

/**
 * Line-art d20 (icosahedron) icon — the playful-tabletop motif used in
 * empty states, onboarding, and the auth card. Stroke follows
 * `currentColor` so it tints like a lucide icon.
 */
export function D20Icon({ size = 24, ...props }: D20IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      {/* Outer hexagonal silhouette */}
      <path d="M12 2 20.5 7v10L12 22 3.5 17V7L12 2Z" />
      {/* Central face */}
      <path d="M7.2 9.4h9.6L12 17.2 7.2 9.4Z" />
      {/* Edges from vertices to central face */}
      <path d="M12 2v7.4" />
      <path d="M20.5 7l-3.7 2.4" />
      <path d="M3.5 7l3.7 2.4" />
      <path d="M20.5 17l-8.5.2" />
      <path d="M3.5 17l8.5.2" />
      <path d="M12 22v-4.8" />
    </svg>
  );
}
