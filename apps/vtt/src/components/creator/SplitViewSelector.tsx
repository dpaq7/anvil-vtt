import type { ReactNode } from 'react';
import { ScrollArea, cn } from '@anvil/ui';

interface Props<T> {
  items: T[];
  selectedId: string | null;
  onPreview: (item: T) => void;
  onSelect: (item: T) => void;
  renderCard: (item: T, isSelected: boolean, isPreviewed: boolean) => ReactNode;
  renderDetail: (item: T) => ReactNode;
  previewedItem: T | null;
  emptyMessage?: string;
  gridCols?: 1 | 2 | 3;
  listClassName?: string;
  detailClassName?: string;
}

const GRID_COLS_CLASS = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

export function SplitViewSelector<T>({
  items,
  selectedId,
  onPreview,
  onSelect,
  renderCard,
  renderDetail,
  previewedItem,
  emptyMessage = 'No items available',
  gridCols = 2,
  listClassName,
  detailClassName,
}: Props<T>) {
  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-creator-text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 md:flex-row">
      {/* Card Grid - top on phones, left otherwise */}
      <div className={cn("min-h-0 w-full min-w-0 flex-1 md:h-full md:w-1/2 md:flex-none", listClassName)}>
        <ScrollArea className="h-full">
          <div className={`grid ${GRID_COLS_CLASS[gridCols]} gap-3 p-1`}>
            {items.map((item, index) => {
              const itemId = (item as { id?: string }).id ?? String(index);
              const isSelected = itemId === selectedId;
              const isPreviewed = item === previewedItem;
              return (
                <div
                  key={itemId}
                  onClick={() => onPreview(item)}
                  onDoubleClick={() => onSelect(item)}
                >
                  {renderCard(item, isSelected, isPreviewed)}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Detail Panel - bottom on phones, right otherwise */}
      <div className={cn("min-h-0 w-full min-w-0 flex-1 md:h-full md:w-1/2 md:flex-none", detailClassName)}>
        {previewedItem ? (
          renderDetail(previewedItem)
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg border border-creator-border bg-creator-bg text-creator-text-muted">
            Select an item to view details
          </div>
        )}
      </div>
    </div>
  );
}
