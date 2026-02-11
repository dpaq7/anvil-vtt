import { useMemo, useState } from 'react';
import { Skull, Minus, Plus } from 'lucide-react';
import { Badge, ScrollArea, Button } from '@anvil/ui';
import type { EntityData, CombatState, ClientMessage } from '../../types/protocol.js';
import { CreatureCard } from './CreatureCard.js';

export interface CreatureTrackerProps {
  entities: EntityData[];
  combat: CombatState | null;
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
export function CreatureTracker({ entities, combat, send }: CreatureTrackerProps) {
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

  const currentTurnEntityId =
    combat && combat.turnOrder.length > 0
      ? combat.turnOrder[combat.currentTurnIndex] ?? null
      : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-zinc-800 px-3 py-2">
        <Skull className="size-3.5 text-red-400" />
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Creatures
        </span>
        {totalCount > 0 && (
          <Badge variant="secondary" className="ml-auto px-1.5 py-0 text-[10px]">
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
            <span className="text-[10px] text-zinc-700">
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
                send={send}
              />
            ))}
            {/* Solo creatures */}
            {soloCreatures.map((entity) => (
              <CreatureCard
                key={entity.id}
                entity={entity}
                isActive={entity.id === currentTurnEntityId}
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
  send: (msg: ClientMessage) => void;
}

function SquadCard({ squad, currentTurnEntityId, send }: SquadCardProps) {
  const { members, totalStamina, totalMaxStamina, perMinionMax } = squad;
  const alive = members.length;
  const baseName = members[0]?.['monsterName'] as string ?? members[0]?.name ?? 'Minion';
  const isActive = members.some((m) => m.id === currentTurnEntityId);

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
    <div className={`border-b border-zinc-800/50 ${isActive ? 'bg-red-950/20' : ''}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-950/40 ring-2 ring-red-500/70">
          <span className="text-[10px] font-bold text-red-300">{alive}</span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-xs font-medium text-zinc-200">
            {baseName} Squad
          </span>
          <span className="text-[10px] text-zinc-500">
            {alive} minion{alive !== 1 ? 's' : ''} alive
          </span>
        </div>
        <Badge variant="secondary" className="shrink-0 px-1.5 py-0 text-[10px]">
          Minion
        </Badge>
      </div>

      {/* Collective stamina bar */}
      {totalMaxStamina > 0 && (
        <div className="px-3 pb-1">
          <div className="flex items-baseline justify-between text-[10px]">
            <span className="text-zinc-500">Squad HP</span>
            <span className="text-zinc-400">{totalStamina} / {totalMaxStamina}</span>
          </div>
          <div className="mt-0.5 h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 transition-all"
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
  const [input, setInput] = useState('');

  const handleSubmit = () => {
    const val = parseInt(input, 10);
    if (!val || val === 0) return;
    if (val > 0) onDamage(val);
    else onHeal(Math.abs(val));
    setInput('');
  };

  return (
    <div className="flex items-center gap-1 px-3 py-1.5">
      <Button variant="ghost" size="icon" className="size-5" onClick={() => onDamage(1)} title="1 damage">
        <Minus className="size-3 text-red-400" />
      </Button>
      <input
        type="number"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
        placeholder="+/-"
        className="h-5 w-12 rounded border border-zinc-700 bg-zinc-800 px-1 text-center text-[10px] text-zinc-200 placeholder:text-zinc-600"
      />
      <Button variant="ghost" size="icon" className="size-5" onClick={() => onHeal(1)} title="1 heal">
        <Plus className="size-3 text-emerald-400" />
      </Button>
    </div>
  );
}
