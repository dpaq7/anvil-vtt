import type { ReactNode } from 'react';
import { Card, cn } from '@anvil/ui';

interface Props {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function SelectionCard({ selected, onClick, children, className }: Props) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-150 bg-creator-card',
        selected
          ? 'border-creator-highlight ring-1 ring-creator-highlight/50'
          : 'border-creator-border hover:border-creator-text-muted hover:bg-creator-card-hover',
        className
      )}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}
