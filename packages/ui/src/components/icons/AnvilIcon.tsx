import type { SVGProps } from 'react';

export interface AnvilIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function AnvilIcon({ size = 24, ...props }: AnvilIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Anvil top surface (horn and face) */}
      <path d="M3 10h3c1 0 2-1 3-1h6c1 0 2 1 3 1h3" />
      {/* Anvil body */}
      <path d="M6 10v4h12v-4" />
      {/* Anvil base/waist */}
      <path d="M4 14h16v2H4z" />
      {/* Anvil foot */}
      <path d="M6 16v3h12v-3" />
      {/* Base */}
      <path d="M5 19h14" />
    </svg>
  );
}
