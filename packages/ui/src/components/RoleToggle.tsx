import { cn } from '../lib/utils.js';

export type UserRole = 'director' | 'player';

export interface RoleToggleProps {
  value: UserRole;
  onValueChange: (role: UserRole) => void;
  className?: string;
}

const ROLES: { role: UserRole; label: string }[] = [
  { role: 'director', label: 'Director' },
  { role: 'player', label: 'Player' },
];

/* Director / Player switch (DESIGN.md section 4, `ap-flow`): the chosen side is filled with text. */
export function RoleToggle({ value, onValueChange, className }: RoleToggleProps) {
  return (
    <div
      className={cn(
        'inline-grid h-9 grid-cols-2 shadow-[inset_0_0_0_1.5px_var(--color-line)]',
        className,
      )}
    >
      {ROLES.map(({ role, label }) => (
        <button
          key={role}
          type="button"
          onClick={() => onValueChange(role)}
          className={cn(
            'px-4 text-sm font-bold transition-colors',
            value === role ? 'bg-text text-surface' : 'text-text hover:bg-well',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
