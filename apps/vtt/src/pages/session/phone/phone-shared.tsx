import type { ReactNode } from 'react';
import { cn } from '@anvil/ui';

/* Phone parts shared by both roles, at thumb size (44 px targets, `ph-*`). */

export function PhoneButton({
  children,
  onClick,
  disabled,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'min-h-11 bg-raised px-3 text-[15px] font-bold text-text shadow-[inset_0_0_0_1.5px_var(--color-line)] active:translate-x-px active:translate-y-px disabled:cursor-default disabled:bg-well disabled:text-text-soft disabled:shadow-[inset_0_0_0_1.5px_var(--color-line-quiet)]',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function MetricPanel({
  label,
  value,
  max,
  children,
}: {
  label: string;
  value: number;
  max?: number;
  children?: ReactNode;
}) {
  return (
    <section className="ph-sec">
      <div className="ph-h">
        <b>{label}</b>
        <span className="font-display text-[26px] font-extrabold text-text">
          {value}
          {max !== undefined && <span className="text-[16px] text-text-soft">/{max}</span>}
        </span>
      </div>
      {max !== undefined && (
        <i className="sb-meter" style={{ height: 9 }}>
          <u style={{ width: `${max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0}%` }} />
        </i>
      )}
      {children}
    </section>
  );
}
