import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookOpen, Gauge, Swords, User } from 'lucide-react';
import { AbilityPanel } from '../../../components/session/AbilityPanel.js';
import { TargetSelector } from '../../../components/session/TargetSelector.js';
import { TurnActionBar } from '../../../components/session/TurnActionBar.js';
import { PlayerHeroSheetPanel } from '../../../components/session/PlayerHeroLiveSheet.js';
import { useTargetingResolution } from '../../../hooks/useTargetingResolution.js';
import type { CharacterInventoryItem } from '../../../lib/inventory.js';
import type {
  ClientMessage,
  EntityData,
  HeroTrackerOperation,
  SessionState,
} from '../../../types/protocol.js';
import type { AbilityInfo } from '../../../components/session/AbilityCard.js';
import { MetricPanel, PhoneButton, PhoneTabBar, num, str } from './phone-shared.js';
import { PhoneNotes } from './PhoneNotes.js';

type PlayerTab = 'sheet' | 'actions' | 'trackers' | 'notes';

const PLAYER_TABS = [
  { id: 'sheet', Icon: User, label: 'Sheet' },
  { id: 'actions', Icon: Swords, label: 'Actions' },
  { id: 'trackers', Icon: Gauge, label: 'Trackers' },
  { id: 'notes', Icon: BookOpen, label: 'Notes' },
] as const satisfies ReadonlyArray<{ id: PlayerTab; Icon: typeof User; label: string }>;

export function PhonePlayerView({
  state,
  hero,
  send,
  canMutate,
}: {
  state: SessionState;
  hero: EntityData | null;
  send: (msg: ClientMessage) => void;
  canMutate: boolean;
}) {
  const [tab, setTab] = useState<PlayerTab>('sheet');
  const [pendingAbility, setPendingAbility] = useState<AbilityInfo | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  const combat = state.combat;
  const heroEntityId = hero?.id ?? null;
  const isMyTurn = combat?.activeEntityId === heroEntityId;
  const turnActions = heroEntityId ? (combat?.turnActions?.[heroEntityId] ?? null) : null;

  const heroAbilities = useMemo(
    () => ((hero?.['abilities'] as AbilityInfo[] | undefined) ?? []),
    [hero],
  );
  const heroConditions = Array.isArray(hero?.['conditions'])
    ? (hero['conditions'] as string[])
    : [];
  const heroSpeed = num(hero, 'speed', 5);
  const heroicResource = num(hero, 'heroicResource', 0);
  const resourceName = str(hero, 'heroicResourceName', 'Resource');

  const enemies = useMemo(
    () => state.entities.filter((entity) => entity.type === 'monster' || entity.type === 'npc'),
    [state.entities],
  );

  const targeting = useTargetingResolution({
    sourceEntity: hero ?? null,
    entities: state.entities,
    distance: pendingAbility?.distance,
  });

  const usedActionTypes = useMemo(() => {
    if (!turnActions) return [];
    const used: string[] = [];
    if (turnActions.mainActionUsed || turnActions.mainConvertedTo !== null) used.push('action', 'main');
    if (turnActions.maneuverUsed) used.push('maneuver');
    if (turnActions.triggeredUsedThisRound) used.push('triggered');
    return used;
  }, [turnActions]);

  const sendTracker = useCallback(
    (op: HeroTrackerOperation) => {
      if (!hero || !canMutate) return;
      send({ type: 'hero_tracker_update', heroId: hero.id, op });
    },
    [canMutate, hero, send],
  );

  const sendSelfAction = useCallback(
    (kind: 'catch-breath' | 'defend' | 'stand-up' | 'escape-grab', label: string) => {
      if (!hero || !canMutate) return;
      if (!combat || !isMyTurn) {
        toast.info(`${label} is available on your turn.`);
        return;
      }
      send({ type: 'token_action', action: { kind, sourceId: hero.id, targetId: hero.id } });
      toast.info(`${label}...`);
    },
    [canMutate, combat, hero, isMyTurn, send],
  );

  const handleRollCharacteristic = useCallback(
    (label: string, modifier: number) => {
      if (!hero || !canMutate) return;
      send({
        type: 'draw_steel_roll',
        roll: { kind: 'power', label, modifier, sourceId: hero.id },
      });
      toast.info(`Rolling ${label}...`);
    },
    [canMutate, hero, send],
  );

  const handleRollResource = useCallback(() => {
    if (!hero || !canMutate) return;
    send({
      type: 'draw_steel_roll',
      roll: { kind: 'heroic-resource', label: resourceName, sourceId: hero.id },
    });
    toast.info(`Rolling ${resourceName}...`);
  }, [canMutate, hero, resourceName, send]);

  const handleInventoryChange = useCallback(
    (inventory: CharacterInventoryItem[]) => {
      if (!hero || !canMutate) return;
      send({ type: 'update_inventory', heroId: hero.id, inventory });
    },
    [canMutate, hero, send],
  );

  const handleUseAbility = useCallback(
    (abilityId: string) => {
      if (!hero || !canMutate) return;
      if (!combat || !isMyTurn) {
        toast.error('Wait until you take your turn.');
        return;
      }
      const ability = heroAbilities.find((item) => item.id === abilityId);
      if (!ability) return;
      if (enemies.length === 0) {
        toast.error('No enemy targets available.');
        return;
      }
      setPendingAbility(ability);
      setSelectedTargetId(enemies[0]?.id ?? null);
    },
    [canMutate, combat, enemies, hero, heroAbilities, isMyTurn],
  );

  const handleConfirmTarget = useCallback(() => {
    if (!hero || !pendingAbility || !selectedTargetId) return;
    const target = enemies.find((entity) => entity.id === selectedTargetId);
    if (!target) return;
    send({
      type: 'token_action',
      action: {
        kind: 'ability',
        sourceId: hero.id,
        targetId: target.id,
        abilityId: pendingAbility.id,
      },
    });
    toast.info(`Using ${pendingAbility.name} on ${target.name}...`);
    setPendingAbility(null);
    setSelectedTargetId(null);
  }, [enemies, hero, pendingAbility, selectedTargetId, send]);

  const handleCancelTarget = useCallback(() => {
    setPendingAbility(null);
    setSelectedTargetId(null);
  }, []);

  const currentStamina = num(hero, 'currentStamina', 0);
  const maxStamina = num(hero, 'maxStamina', 0);
  const recoveriesCurrent = num(hero, 'recoveriesCurrent', 0);
  const recoveriesMax = num(hero, 'recoveriesMax', 0);
  const victories = num(hero, 'victories', 0);

  if (!hero) {
    return <div className="p-6 text-center text-sm text-zinc-500">No hero is assigned to this session.</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-zinc-800 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Player Companion</p>
        <h1 className="mt-1 truncate text-xl font-semibold text-zinc-50">{hero.name}</h1>
        {combat && (
          <p className="mt-1 text-xs text-zinc-500">
            Round {combat.round}
            {isMyTurn ? ' — your turn' : combat.activeSide ? ` — ${combat.activeSide} acting` : ''}
          </p>
        )}
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'sheet' && (
          <PlayerHeroSheetPanel
            hero={hero}
            combatActive={Boolean(combat)}
            isMyTurn={isMyTurn}
            abilityCount={heroAbilities.length}
            onRollCharacteristic={handleRollCharacteristic}
            onRollResource={handleRollResource}
            onCatchBreath={() => sendSelfAction('catch-breath', 'Catch Breath')}
            onDefend={() => sendSelfAction('defend', 'Defend')}
            onStandUp={() => sendSelfAction('stand-up', 'Stand Up')}
            onEscapeGrab={() => sendSelfAction('escape-grab', 'Escape Grab')}
            onOpenAbilities={() => setTab('actions')}
            onInventoryChange={handleInventoryChange}
          />
        )}
        {tab === 'actions' && (
          <div className="flex flex-col gap-3 p-3">
            {combat && (
              <TurnActionBar
                turnActions={turnActions}
                isMyTurn={isMyTurn}
                baseSpeed={heroSpeed}
                heroicResource={heroicResource}
                resourceName={resourceName}
                conditions={heroConditions}
                onCatchBreath={() => sendSelfAction('catch-breath', 'Catch Breath')}
                onDefend={() => sendSelfAction('defend', 'Defend')}
                onEndTurn={() => send({ type: 'combat_action', action: { type: 'END_TURN' } })}
              />
            )}
            {pendingAbility && (
              <TargetSelector
                entities={enemies}
                selectedTargetId={selectedTargetId}
                onSelect={setSelectedTargetId}
                onConfirm={handleConfirmTarget}
                onCancel={handleCancelTarget}
                abilityName={pendingAbility.name}
                inRangeById={targeting.inRangeById}
                flankingByTargetId={targeting.flankingByTargetId}
                highGroundByTargetId={targeting.highGroundByTargetId}
              />
            )}
            {heroAbilities.length > 0 ? (
              <AbilityPanel
                abilities={heroAbilities}
                usedActionTypes={usedActionTypes}
                onUseAbility={handleUseAbility}
              />
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">No abilities available.</p>
            )}
          </div>
        )}
        {tab === 'trackers' && (
          <div className="flex flex-col divide-y divide-zinc-800">
            <MetricPanel label="Stamina" value={currentStamina} max={maxStamina}>
              <div className="grid grid-cols-4 gap-2">
                {[-5, -1, 1, 5].map((delta) => (
                  <PhoneButton
                    key={delta}
                    disabled={!canMutate}
                    onClick={() => sendTracker({ kind: 'adjust_stamina', delta })}
                  >
                    {delta > 0 ? `+${delta}` : delta}
                  </PhoneButton>
                ))}
              </div>
            </MetricPanel>
            <MetricPanel label={resourceName} value={heroicResource}>
              <div className="grid grid-cols-2 gap-2">
                <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_heroic_resource', delta: -1 })}>
                  -1
                </PhoneButton>
                <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_heroic_resource', delta: 1 })}>
                  +1
                </PhoneButton>
              </div>
            </MetricPanel>
            <MetricPanel label="Recoveries" value={recoveriesCurrent} max={recoveriesMax}>
              <div className="grid grid-cols-2 gap-2">
                <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_recoveries', delta: -1 })}>
                  Spend
                </PhoneButton>
                <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_recoveries', delta: 1 })}>
                  Restore
                </PhoneButton>
              </div>
              <PhoneButton
                disabled={!canMutate}
                onClick={() => sendSelfAction('catch-breath', 'Catch Breath')}
                className="w-full"
              >
                Catch Breath
              </PhoneButton>
            </MetricPanel>
            <MetricPanel label="Victories" value={victories}>
              <div className="grid grid-cols-2 gap-2">
                <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_victories', delta: -1 })}>
                  -1
                </PhoneButton>
                <PhoneButton disabled={!canMutate} onClick={() => sendTracker({ kind: 'adjust_victories', delta: 1 })}>
                  +1
                </PhoneButton>
              </div>
            </MetricPanel>
          </div>
        )}
        {tab === 'notes' && <PhoneNotes campaignId={state.campaignId} disabled={!canMutate} />}
      </div>
      <PhoneTabBar tabs={PLAYER_TABS} active={tab} onSelect={setTab} />
    </div>
  );
}
