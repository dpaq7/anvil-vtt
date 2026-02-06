import type { ReactNode } from 'react';
import { ScrollArea } from '@anvil/ui';

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
}: Props<T>) {
  if (items.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-creator-text-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* Card Grid - Left Side */}
      <div className="w-1/2 min-w-0">
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

      {/* Detail Panel - Right Side */}
      <div className="w-1/2 min-w-0">
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
