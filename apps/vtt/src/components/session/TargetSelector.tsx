import { Button, cn } from '@anvil/ui';
import type { EntityData } from '../../types/protocol.js';

interface TargetSelectorProps {
  entities: EntityData[];
  selectedTargetId: string | null;
  onSelect: (entityId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  abilityName: string;
}

export function TargetSelector({
  entities,
  selectedTargetId,
  onSelect,
  onConfirm,
  onCancel,
  abilityName,
}: TargetSelectorProps) {
  return (
    <div className="flex flex-col gap-3 rounded border border-amber-500/30 bg-amber-500/5 p-3">
      <p className="text-xs font-medium text-amber-400">
        Select target for <span className="font-bold">{abilityName}</span>
      </p>

      <div className="flex flex-col gap-1">
        {entities.map((entity) => (
          <button
            key={entity.id}
            onClick={() => onSelect(entity.id)}
            className={cn(
              'flex items-center gap-2 rounded px-2 py-1.5 text-xs transition',
              selectedTargetId === entity.id
                ? 'bg-amber-500/20 text-amber-200'
                : 'text-zinc-400 hover:bg-zinc-800',
            )}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                entity.type === 'hero' ? 'bg-blue-400' : 'bg-red-400'
              }`}
            />
            <span>{entity.name}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button size="sm" onClick={onConfirm} disabled={!selectedTargetId} className="flex-1">
          Confirm
        </Button>
      </div>
    </div>
  );
}
