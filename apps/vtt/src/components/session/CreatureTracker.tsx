import { useMemo, useState } from 'react';
import { Skull, Minus, Plus } from 'lucide-react';
import { Badge, ScrollArea, Button } from '@anvil/ui';
import type { EntityData, CombatState, ClientMessage } from '../../types/protocol.js';
import { CreatureCard } from './CreatureCard.js';
import { TokenFace } from './battle/TokenFace.js';
import { useSessionConnection } from './shell/connection-context.js';

export interface CreatureTrackerProps {
  entities: EntityData[];
  combat: CombatState | null;
  selectedEntityIds?: string[];
  onSelectEntities?: (entityIds: string[]) => void;
  send: (msg: ClientMessage) => void;
}

/** Group of minions sharing a squadId */
interface MinionSquad {
  squadId: string;
  members: EntityData[];
  totalStamina: number;
  totalMaxStamina: number;
  perMinionMax: number;
}

/**
 * Left-rail panel showing all active monsters/NPCs during a live session.
 * Provides quick HP tracking, condition toggles, and removal.
 * Minions with the same squadId are grouped into squads.
 */
export function CreatureTracker({ entities, combat, selectedEntityIds = [], onSelectEntities, send }: CreatureTrackerProps) {
  // Separate minion squads from solo creatures
  const { soloCreatures, squads } = useMemo(() => {
    const monsters = entities.filter((e) => e.type === 'monster' || e.type === 'npc');
    const squadMap = new Map<string, EntityData[]>();
    const solo: EntityData[] = [];

    for (const m of monsters) {
      const squadId = m['squadId'] as string | undefined;
      if (squadId) {
        const existing = squadMap.get(squadId);
        if (existing) existing.push(m);
        else squadMap.set(squadId, [m]);
      } else {
        solo.push(m);
      }
    }

    const groupedSquads: MinionSquad[] = [];
    for (const [squadId, members] of squadMap) {
      const perMinionMax = typeof members[0]?.['maxStamina'] === 'number' ? (members[0]['maxStamina'] as number) : 0;
      const totalStamina = members.reduce(
        (sum, m) => sum + (typeof m['currentStamina'] === 'number' ? (m['currentStamina'] as number) : perMinionMax),
        0,
      );
      const totalMaxStamina = members.reduce(
        (sum, m) => sum + (typeof m['maxStamina'] === 'number' ? (m['maxStamina'] as number) : 0),
        0,
      );
      groupedSquads.push({ squadId, members, totalStamina, totalMaxStamina, perMinionMax });
    }

    return { soloCreatures: solo, squads: groupedSquads };
  }, [entities]);

  const totalCount = soloCreatures.length + squads.reduce((n, s) => n + s.members.length, 0);

  const currentTurnEntityId = combat?.activeEntityId ?? null;
  const selectedSet = new Set(selectedEntityIds);

  const selectIds = (ids: string[], additive: boolean) => {
    if (!onSelectEntities) return;
    if (!additive) {
      onSelectEntities(ids);
      return;
    }
    const next = new Set(selectedSet);
    for (const id of ids) {
      if (next.has(id)) next.delete(id);
      else next.add(id);
    }
    onSelectEntities([...next]);
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <Skull className="size-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Creatures
        </span>
        {totalCount > 0 && (
          <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-[13px]">
            {totalCount}
          </Badge>
        )}
      </div>

      {/* Monster list */}
      <ScrollArea className="flex-1">
        {totalCount === 0 ? (
          <p className="p-4 text-center text-xs text-zinc-600">
            No creatures in scene.
            <br />
            <span className="text-[13px] text-zinc-700">
              Add via Bestiary or Assets panel.
            </span>
          </p>
        ) : (
          <div className="flex flex-col">
            {/* Minion squads */}
            {squads.map((squad) => (
              <SquadCard
                key={squad.squadId}
                squad={squad}
                currentTurnEntityId={currentTurnEntityId}
                selectedEntityIds={selectedEntityIds}
                onSelect={(ids, additive) => selectIds(ids, additive)}
                send={send}
              />
            ))}
            {/* Solo creatures */}
            {soloCreatures.map((entity) => (
              <CreatureCard
                key={entity.id}
                entity={entity}
                isActive={entity.id === currentTurnEntityId}
                selected={selectedSet.has(entity.id)}
                onSelect={(event) => selectIds([entity.id], event.ctrlKey || event.metaKey || event.shiftKey)}
                send={send}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ── Squad card sub-component ──

interface SquadCardProps {
  squad: MinionSquad;
  currentTurnEntityId: string | null;
  selectedEntityIds: string[];
  onSelect?: (entityIds: string[], additive: boolean) => void;
  send: (msg: ClientMessage) => void;
}

function SquadCard({ squad, currentTurnEntityId, selectedEntityIds, onSelect, send }: SquadCardProps) {
  const { members, totalStamina, totalMaxStamina, perMinionMax } = squad;
  const alive = members.length;
  const baseName = members[0]?.['monsterName'] as string ?? members[0]?.name ?? 'Minion';
  const isActive = members.some((m) => m.id === currentTurnEntityId);
  const isSelected = members.some((m) => selectedEntityIds.includes(m.id));

  const handleSquadDamage = (amount: number) => {
    if (amount <= 0 || perMinionMax <= 0) return;
    // Kill minions whose worth of stamina is exceeded, apply leftover to remaining
    let remaining = amount;
    for (const member of members) {
      if (remaining <= 0) break;
      const current = typeof member['currentStamina'] === 'number' ? (member['currentStamina'] as number) : perMinionMax;
      if (remaining >= current) {
        // This minion dies
        remaining -= current;
        send({ type: 'delete_entity', entityId: member.id });
      } else {
        // Partial damage to this minion
        send({
          type: 'combat_action',
          action: { type: 'APPLY_DAMAGE', entityId: member.id, amount: remaining },
        });
        remaining = 0;
      }
    }
  };

  const handleSquadHeal = (amount: number) => {
    if (amount <= 0) return;
    // Distribute healing across squad members
    let remaining = amount;
    for (const member of members) {
      if (remaining <= 0) break;
      const current = typeof member['currentStamina'] === 'number' ? (member['currentStamina'] as number) : perMinionMax;
      const max = typeof member['maxStamina'] === 'number' ? (member['maxStamina'] as number) : perMinionMax;
      const healable = max - current;
      if (healable > 0) {
        const heal = Math.min(remaining, healable);
        send({
          type: 'combat_action',
          action: { type: 'APPLY_HEALING', entityId: member.id, amount: heal },
        });
        remaining -= heal;
      }
    }
  };

  return (
    <div className={`border-b border-zinc-800/50 ${isActive ? 'bg-active-soft' : ''}`}>
      {/* Header */}
      <button
        type="button"
        className={`flex w-full items-center gap-2 px-3 py-1.5 text-left transition hover:bg-zinc-800/50 ${isSelected ? 'outline outline-2 -outline-offset-2 outline-text' : ''}`}
        onClick={(event) => onSelect?.(
          members.map((member) => member.id),
          event.ctrlKey || event.metaKey || event.shiftKey,
        )}
      >
        {members[0] && <TokenFace entity={members[0]} size={28} />}
        <div className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-zinc-200">
            {baseName} Squad
          </span>
          <span className="text-[13px] text-zinc-500">
            {alive} minion{alive !== 1 ? 's' : ''} alive
          </span>
        </div>
        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[13px]">
          Minion
        </Badge>
      </button>

      {/* Collective stamina bar */}
      {totalMaxStamina > 0 && (
        <div className="px-3 pb-1">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="text-zinc-500">Squad HP</span>
            <span className="text-zinc-400">{totalStamina} / {totalMaxStamina}</span>
          </div>
          <div className="mt-0.5 h-2 overflow-hidden bg-well">
            <div
              className="h-full rounded-full bg-text transition-all"
              style={{ width: `${totalMaxStamina > 0 ? (totalStamina / totalMaxStamina) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Quick squad damage/heal row */}
      <SquadDamageRow onDamage={handleSquadDamage} onHeal={handleSquadHeal} />
    </div>
  );
}

// ── Quick damage/heal input for squads ──

function SquadDamageRow({ onDamage, onHeal }: { onDamage: (n: number) => void; onHeal: (n: number) => void }) {
  const { paused } = useSessionConnection();
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    const val = parseInt(input, 10);
    if (!val || val === 0 || paused) return;
    if (val > 0) onDamage(val);
    else onHeal(Math.abs(val));
    setInput('');
  };

  return (
    <div className="flex items-center gap-1 px-3 py-1.5">
      {/* size-9 keeps these frequent combat controls tappable on tablets */}
      <Button variant="ghost" size="icon" className="size-9" disabled={paused} onClick={() => onDamage(1)} title="1 damage" aria-label="1 damage">
        <Minus className="size-3.5" />
      </Button>
      <input
        type="number"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        aria-label="Squad damage or healing"
        disabled={paused}
        placeholder={paused ? 'Back' : '+/-'}
        className="h-9 w-12 rounded border border-zinc-700 bg-zinc-800 px-1 text-center text-xs text-zinc-200 placeholder:text-zinc-600"
      />
      <Button variant="ghost" size="icon" className="size-9" disabled={paused} onClick={() => onHeal(1)} title="1 heal" aria-label="1 heal">
        <Plus className="size-3.5" />
      </Button>
    </div>
  );
}
