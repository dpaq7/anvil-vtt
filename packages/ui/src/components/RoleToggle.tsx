import { cn } from '../lib/utils.js';

export type UserRole = 'director' | 'player';

export interface RoleToggleProps {
  value: UserRole;
  onValueChange: (role: UserRole) => void;
  className?: string;
}

export function RoleToggle({ value, onValueChange, className }: RoleToggleProps) {
  return (
    <div
      className={cn(
        'inline-flex rounded-lg border border-zinc-700 bg-zinc-900 p-1',
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onValueChange('director')}
        className={cn(
          'rounded-md px-4 py-2 text-sm font-medium transition-colors',
          value === 'director'
            ? 'bg-zinc-100 text-zinc-900'
            : 'text-zinc-400 hover:text-zinc-100',
        )}
      >
        Director
      </button>
      <button
        type="button"
        onClick={() => onValueChange('player')}
        className={cn(
          'rounded-md px-4 py-2 text-sm font-medium transition-colors',
          value === 'player'
            ? 'bg-zinc-100 text-zinc-900'
            : 'text-zinc-400 hover:text-zinc-100',
        )}
      >
        Player
      </button>
    </div>
  );
}
