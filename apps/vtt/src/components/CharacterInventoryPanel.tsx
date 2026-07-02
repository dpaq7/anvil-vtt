import { useMemo, useState } from 'react';
import {
  CheckCircle2,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Badge, Button, Input, cn } from '@anvil/ui';
import {
  addCatalogItemToInventory,
  canEquipInventoryItem,
  INVENTORY_CATEGORIES,
  INVENTORY_CATEGORY_LABELS,
  inventoryMetaLine,
  MCDM_INVENTORY_CATALOG,
} from '../lib/inventory.js';
import type { CharacterInventoryItem } from '../lib/inventory.js';

interface CharacterInventoryPanelProps {
  inventory: CharacterInventoryItem[];
  onInventoryChange?: (inventory: CharacterInventoryItem[]) => void;
  compact?: boolean;
}

type CategoryFilter = 'all' | CharacterInventoryItem['category'];

export function CharacterInventoryPanel({
  inventory,
  onInventoryChange,
  compact = false,
}: CharacterInventoryPanelProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('');
  const canEdit = Boolean(onInventoryChange);

  const filteredCatalog = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return MCDM_INVENTORY_CATALOG.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!normalizedQuery) return true;
      return item.searchText.includes(normalizedQuery);
    });
  }, [category, query]);

  const selectedCatalogItem =
    MCDM_INVENTORY_CATALOG.find((item) => item.id === selectedCatalogId) ??
    filteredCatalog[0] ??
    null;

  const addSelectedItem = () => {
    if (!selectedCatalogItem || !onInventoryChange) return;
    onInventoryChange(addCatalogItemToInventory(inventory, selectedCatalogItem));
    setSelectedCatalogId(selectedCatalogItem.id);
  };

  const updateItem = (itemId: string, changes: Partial<CharacterInventoryItem>) => {
    if (!onInventoryChange) return;
    onInventoryChange(inventory.map((item) => (item.id === itemId ? { ...item, ...changes } : item)));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const item = inventory.find((candidate) => candidate.id === itemId);
    if (!item) return;
    updateItem(itemId, { quantity: Math.max(1, item.quantity + delta) });
  };

  const removeItem = (itemId: string) => {
    if (!onInventoryChange) return;
    onInventoryChange(inventory.filter((item) => item.id !== itemId));
  };

  const equippedCount = inventory.filter((item) => item.equipped).length;
  const totalCount = inventory.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={cn('grid gap-3', compact ? 'text-xs' : 'text-sm')}>
      <div className={cn('grid gap-2', compact ? '' : 'md:grid-cols-[minmax(0,1fr)_180px]')}>
        <label className="relative min-w-0">
          <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-zinc-500" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search MCDM items"
            className="h-8 pl-7 text-xs"
          />
        </label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as CategoryFilter)}
          className="h-8 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-200 outline-none focus:border-cyan-600"
        >
          <option value="all">All items</option>
          {INVENTORY_CATEGORIES.map((itemCategory) => (
            <option key={itemCategory} value={itemCategory}>
              {INVENTORY_CATEGORY_LABELS[itemCategory]}
            </option>
          ))}
        </select>
      </div>

      {canEdit && (
        <div className={cn('grid gap-2', compact ? '' : 'lg:grid-cols-[minmax(0,1fr)_auto]')}>
          <select
            value={selectedCatalogItem?.id ?? ''}
            onChange={(event) => setSelectedCatalogId(event.target.value)}
            className="h-9 min-w-0 rounded-md border border-zinc-800 bg-zinc-950 px-2 text-xs text-zinc-200 outline-none focus:border-cyan-600"
          >
            {filteredCatalog.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} - {INVENTORY_CATEGORY_LABELS[item.category]}
                {item.echelon ? ` E${item.echelon}` : item.level ? ` L${item.level}` : ''}
              </option>
            ))}
          </select>
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5"
            onClick={addSelectedItem}
            disabled={!selectedCatalogItem}
            title="Add item"
          >
            <Plus className="size-3.5" />
            Add
          </Button>
        </div>
      )}

      {selectedCatalogItem && !compact && (
        <div className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-zinc-100">{selectedCatalogItem.name}</p>
            <Badge variant="secondary" className="text-[10px]">
              {INVENTORY_CATEGORY_LABELS[selectedCatalogItem.category]}
            </Badge>
            {selectedCatalogItem.echelon && (
              <Badge variant="outline" className="text-[10px]">E{selectedCatalogItem.echelon}</Badge>
            )}
            {selectedCatalogItem.level && (
              <Badge variant="outline" className="text-[10px]">L{selectedCatalogItem.level}</Badge>
            )}
          </div>
          <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-400">
            {selectedCatalogItem.effect ?? selectedCatalogItem.description}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-wide text-zinc-500">
        <span>{inventory.length} entries</span>
        <span>{totalCount} carried</span>
        <span>{equippedCount} equipped</span>
        <span>{MCDM_INVENTORY_CATALOG.length} MCDM options</span>
      </div>

      {inventory.length === 0 ? (
        <div className="rounded border border-dashed border-zinc-800 bg-zinc-950/30 p-3 text-xs text-zinc-600">
          No inventory recorded.
        </div>
      ) : (
        <div className="grid gap-2">
          {inventory.map((item) => (
            <InventoryRow
              key={item.id}
              item={item}
              compact={compact}
              canEdit={canEdit}
              onQuantityChange={updateQuantity}
              onRemove={removeItem}
              onUpdate={updateItem}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InventoryRow({
  item,
  compact,
  canEdit,
  onQuantityChange,
  onRemove,
  onUpdate,
}: {
  item: CharacterInventoryItem;
  compact: boolean;
  canEdit: boolean;
  onQuantityChange: (itemId: string, delta: number) => void;
  onRemove: (itemId: string) => void;
  onUpdate: (itemId: string, changes: Partial<CharacterInventoryItem>) => void;
}) {
  const equippable = canEquipInventoryItem(item);
  const primaryText = item.effect ?? item.description;

  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-950/45 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Package className="size-3.5 shrink-0 text-cyan-300" />
            <p className="font-semibold text-zinc-100">{item.name}</p>
            <Badge variant="secondary" className="text-[10px]">
              {INVENTORY_CATEGORY_LABELS[item.category]}
            </Badge>
            {item.equipped && (
              <Badge className="gap-1 text-[10px]">
                <CheckCircle2 className="size-3" />
                Equipped
              </Badge>
            )}
          </div>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-zinc-500">
            {inventoryMetaLine(item)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {canEdit && (
            <>
              <IconButton title="Decrease quantity" onClick={() => onQuantityChange(item.id, -1)} disabled={item.quantity <= 1}>
                <Minus className="size-3.5" />
              </IconButton>
              <span className="min-w-7 rounded border border-zinc-800 bg-zinc-900 px-1.5 py-1 text-center font-mono text-xs text-zinc-100">
                {item.quantity}
              </span>
              <IconButton title="Increase quantity" onClick={() => onQuantityChange(item.id, 1)}>
                <Plus className="size-3.5" />
              </IconButton>
              {equippable && (
                <IconButton title={item.equipped ? 'Unequip' : 'Equip'} onClick={() => onUpdate(item.id, { equipped: !item.equipped })}>
                  <ShieldCheck className={cn('size-3.5', item.equipped && 'text-cyan-200')} />
                </IconButton>
              )}
              <IconButton title="Remove item" onClick={() => onRemove(item.id)}>
                <Trash2 className="size-3.5 text-red-300" />
              </IconButton>
            </>
          )}
          {!canEdit && (
            <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-1 text-center font-mono text-xs text-zinc-100">
              x{item.quantity}
            </span>
          )}
        </div>
      </div>

      {primaryText && (
        <p className={cn('mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-400', compact && 'line-clamp-4')}>
          {primaryText}
        </p>
      )}

      {item.enhancements && item.enhancements.length > 0 && !compact && (
        <div className="mt-2 grid gap-1.5">
          {item.enhancements.map((enhancement) => (
            <div key={`${item.id}-${enhancement.level}`} className="rounded border border-zinc-800/80 bg-zinc-900/40 p-2">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-cyan-200/70">
                {enhancement.name ?? `Level ${enhancement.level}`}
              </div>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{enhancement.description}</p>
            </div>
          ))}
        </div>
      )}

      {canEdit && !compact && (
        <Input
          value={item.notes ?? ''}
          onChange={(event) => onUpdate(item.id, { notes: event.target.value })}
          placeholder="Notes"
          className="mt-2 h-8 text-xs"
        />
      )}
      {!canEdit && item.notes && (
        <p className="mt-2 rounded border border-zinc-800 bg-zinc-900/45 p-2 text-xs text-zinc-400">
          {item.notes}
        </p>
      )}
    </div>
  );
}

function IconButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="inline-flex size-7 items-center justify-center rounded border border-zinc-800 bg-zinc-900 text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-40"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
    >
      {children}
    </button>
  );
}
