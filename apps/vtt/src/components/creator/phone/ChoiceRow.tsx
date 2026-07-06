import { Check, Info } from 'lucide-react';
import { cn } from '@anvil/ui';

interface ChoiceRowProps {
  title: string;
  summary?: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onInfo?: () => void;
}

export function ChoiceRow({ title, summary, selected, disabled, onSelect, onInfo }: ChoiceRowProps) {
  return (
    <div
      className={cn(
        'flex min-h-12 w-full items-center gap-2 rounded-lg border transition-colors',
        selected
          ? 'border-creator-highlight bg-creator-highlight/10'
          : 'border-creator-border bg-creator-card',
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={selected}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left',
          disabled && 'opacity-40',
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-creator-text">{title}</span>
          {summary && (
            <span className="block truncate text-xs text-creator-text-muted">{summary}</span>
          )}
        </span>
        {selected && <Check className="h-4 w-4 shrink-0 text-creator-highlight" />}
      </button>
      {onInfo && (
        <button
          type="button"
          onClick={onInfo}
          aria-label={`Details for ${title}`}
          className="flex size-11 shrink-0 items-center justify-center text-creator-text-muted"
        >
          <Info className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
