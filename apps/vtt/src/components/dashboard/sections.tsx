import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@anvil/ui';
import type { DashboardSectionConfig } from './types.js';
import { SectionHeader } from './SectionChrome.js';

const DASHBOARD_CARD_GRID_STYLE: CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 15.5rem), 1fr))',
};

export function DashboardGrid<T extends { id: string }>({
  items,
  className,
  emptyState,
  renderItem,
}: {
  items: T[];
  className?: string;
  emptyState: ReactNode;
  renderItem: (item: T) => ReactNode;
}) {
  if (items.length === 0) return <>{emptyState}</>;

  return (
    <div className={cn('grid gap-2', className)} style={DASHBOARD_CARD_GRID_STYLE}>
      {items.map((item) => (
        <div key={item.id} className="min-w-0">
          {renderItem(item)}
        </div>
      ))}
    </div>
  );
}

export function DashboardSections({ sections }: { sections: DashboardSectionConfig[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {sections.map((section) => (
        <section
          key={section.id}
          data-onboarding={`dashboard-section-${section.id}`}
          className={section.className}
        >
          <SectionHeader eyebrow={section.eyebrow} title={section.title} to={section.to} />
          {section.body}
        </section>
      ))}
    </div>
  );
}
