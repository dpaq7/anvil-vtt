import { UserCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';
import type { Npc } from '@anvil/types';

export interface NpcGridProps {
  npcs: Npc[];
  onSelect: (npcId: string) => void;
  selectedId?: string | null;
  compact?: boolean;
}

export function NpcGrid({ npcs, onSelect, selectedId, compact }: NpcGridProps) {
  if (npcs.length === 0) {
    return <p className="p-8 text-center text-zinc-500">No NPCs yet.</p>;
  }

  return (
    <div
      className={
        compact
          ? 'grid grid-cols-1 gap-3 p-3 sm:grid-cols-2'
          : 'grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      }
    >
      {npcs.map((npc) => (
        <Card
          key={npc.id}
          className={`cursor-pointer transition hover:border-zinc-600 ${
            selectedId === npc.id ? 'ring-2 ring-zinc-400' : ''
          }`}
          onClick={() => onSelect(npc.id)}
        >
          <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-4">
            {/* Portrait placeholder */}
            <div className="flex size-12 shrink-0 items-center justify-center rounded-md bg-zinc-800">
              {npc.portraitUrl ? (
                <img
                  src={npc.portraitUrl}
                  alt={npc.name}
                  className="size-12 rounded-md object-cover"
                />
              ) : (
                <UserCircle className="size-6 text-zinc-500" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="truncate text-sm font-bold">{npc.name}</CardTitle>
              {npc.location && (
                <p className="mt-0.5 truncate text-xs text-zinc-400">{npc.location}</p>
              )}
            </div>
          </CardHeader>

          {!compact && npc.notes && (
            <CardContent className="px-4 pb-4 pt-0">
              <p className="line-clamp-2 text-xs text-zinc-500">{npc.notes}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
