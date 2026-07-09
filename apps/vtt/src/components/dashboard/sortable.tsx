import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { GripVertical } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@anvil/ui';
import type { DashboardSectionConfig, DashboardSectionId } from './types.js';
import { mergeOrder, readStoredOrder, writeStoredOrder } from './format.js';
import { SectionHeader } from './SectionChrome.js';

const DASHBOARD_SECTION_GRID_STYLE: CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 30rem), 1fr))',
};
const DASHBOARD_CARD_GRID_STYLE: CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 15.5rem), 1fr))',
};

function useSortableOrder(storageKey: string, defaultIds: string[]) {
  const defaultSignature = defaultIds.join('|');
  const [storedOrder, setStoredOrder] = useState<string[]>(() => readStoredOrder(storageKey));

  useEffect(() => {
    setStoredOrder(readStoredOrder(storageKey));
  }, [storageKey]);

  const orderedIds = useMemo(
    () => mergeOrder(storedOrder, defaultIds),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storedOrder, defaultSignature],
  );

  useEffect(() => {
    writeStoredOrder(storageKey, orderedIds);
  }, [storageKey, orderedIds]);

  const move = useCallback((activeId: string, overId: string) => {
    if (activeId === overId) return;
    setStoredOrder((current) => {
      const merged = mergeOrder(current, defaultIds);
      const oldIndex = merged.indexOf(activeId);
      const newIndex = merged.indexOf(overId);
      if (oldIndex === -1 || newIndex === -1) return current;
      const next = arrayMove(merged, oldIndex, newIndex);
      writeStoredOrder(storageKey, next);
      return next;
    });
  }, [defaultIds, storageKey]);

  return { orderedIds, move };
}

function DragHandle({ label, className, attributes, listeners }: {
  label: string;
  className?: string;
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'flex size-6 shrink-0 cursor-grab items-center justify-center rounded-md border border-zinc-700/70 bg-zinc-950/80 text-zinc-500 opacity-70 shadow-sm shadow-black/20 transition-colors hover:border-zinc-500 hover:text-zinc-200 active:cursor-grabbing',
        className,
      )}
      {...attributes}
      {...listeners}
    >
      <GripVertical size={14} />
    </button>
  );
}

function SortableCard({ id, children }: { id: string; children: ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex min-w-0 gap-1.5', isDragging && 'relative z-20 opacity-70')}
    >
      <DragHandle label="Move card" attributes={attributes} listeners={listeners} className="mt-2.5" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function SortableSection({ section }: { section: DashboardSectionConfig }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-onboarding={`dashboard-section-${section.id}`}
      className={cn(section.className, isDragging && 'relative z-20 opacity-70')}
    >
      <SectionHeader
        eyebrow={section.eyebrow}
        title={section.title}
        to={section.to}
        dragHandle={<DragHandle label={`Move ${section.title} section`} attributes={attributes} listeners={listeners} />}
      />
      {section.body}
    </section>
  );
}

export function SortableGrid<T extends { id: string }>({
  storageKey,
  items,
  className,
  emptyState,
  renderItem,
}: {
  storageKey: string;
  items: T[];
  className?: string;
  emptyState: ReactNode;
  renderItem: (item: T) => ReactNode;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const defaultIds = useMemo(() => items.map((item) => item.id), [items]);
  const { orderedIds, move } = useSortableOrder(storageKey, defaultIds);
  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const orderedItems = orderedIds
    .map((id) => itemMap.get(id))
    .filter((item): item is T => Boolean(item));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    move(String(active.id), String(over.id));
  }, [move]);

  if (items.length === 0) return <>{emptyState}</>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
        <div className={cn('grid gap-2', className)} style={DASHBOARD_CARD_GRID_STYLE}>
          {orderedItems.map((item) => (
            <SortableCard key={item.id} id={item.id}>
              {renderItem(item)}
            </SortableCard>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

export function SortableSections({ storageKey, sections }: { storageKey: string; sections: DashboardSectionConfig[] }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const defaultIds = useMemo(() => sections.map((section) => section.id), [sections]);
  const { orderedIds, move } = useSortableOrder(storageKey, defaultIds);
  const sectionMap = useMemo(() => new Map(sections.map((section) => [section.id, section])), [sections]);
  const orderedSections = orderedIds
    .map((id) => sectionMap.get(id as DashboardSectionId))
    .filter((section): section is DashboardSectionConfig => Boolean(section));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    move(String(active.id), String(over.id));
  }, [move]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={orderedIds} strategy={rectSortingStrategy}>
        <div className="grid gap-5" style={DASHBOARD_SECTION_GRID_STYLE}>
          {orderedSections.map((section) => (
            <SortableSection key={section.id} section={section} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
