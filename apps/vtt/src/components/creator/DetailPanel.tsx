import type { ReactNode } from 'react';
import { Button, ScrollArea } from '@anvil/ui';

interface Props {
  title: string;
  subtitle?: string;
  description?: ReactNode;
  onSelect?: () => void;
  selectLabel?: string;
  children?: ReactNode;
}

export function DetailPanel({
  title,
  subtitle,
  description,
  onSelect,
  selectLabel = 'Select',
  children,
}: Props) {
  return (
    <div className="flex h-full flex-col rounded-lg border border-creator-border bg-creator-bg">
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-creator-text">{title}</h3>
            {subtitle && (
              <p className="mt-1 text-sm text-creator-text-muted">{subtitle}</p>
            )}
            {description && (
              <div className="mt-3 text-sm text-creator-text">{description}</div>
            )}
            {children && <div className="mt-4">{children}</div>}
          </div>
        </ScrollArea>
      </div>
      {onSelect && (
        <div className="border-t border-creator-border p-3">
          <Button onClick={onSelect} className="w-full bg-creator-highlight text-creator-bg hover:bg-creator-highlight/90">
            {selectLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
