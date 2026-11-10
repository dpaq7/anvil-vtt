import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookOpen, Gauge, Swords, User } from 'lucide-react';
import { AbilityPanel } from '../../../components/session/AbilityPanel.js';
import { TargetSelector } from '../../../components/session/TargetSelector.js';
import { TurnActionBar } from '../../../components/session/TurnActionBar.js';
import { PlayerHeroSheetPanel } from '../../../components/session/PlayerHeroLiveSheet.js';
import { useTargetingResolution } from '../../../hooks/useTargetingResolution.js';
import { conditionNames } from '../../../lib/conditions.js';
import type { CharacterInventoryItem } from '../../../lib/inventory.js';
import type {
  ClientMessage,
  EntityData,
  HeroTrackerOperation,
  SessionState,
} from '../../../types/protocol.js';
import type { AbilityInfo } from '../../../components/session/AbilityCard.js';
import { PhoneTrackers } from './PhoneTrackers.js';
import { num, str } from './phone-utils.js';
import { PhoneNotes } from './PhoneNotes.js';
import { PhoneApp, PhoneDock, PhoneDropStrip, PhoneTabBar, PhoneTop } from './PhoneFrame.js';
import { PhoneMe, PhoneParty, PhoneTraits } from './PhoneBattle.js';
import { PhoneArgument, PhoneInterest, PhoneNpc, PhoneWhatYouKnow } from './PhoneModes.js';
import { TokenFace } from '../../../components/session/battle/TokenFace.js';
import { canClaimTurn } from '../../../lib/turn.js';
import { firstName } from '../../../lib/faces.js';
import { filterVisibleEntities } from '../../../lib/fog-visibility.js';
import { parseBattleData, parseNegotiationData } from '../../../lib/scene-data.js';
import { modeBand, type NonBattleMode } from '../../../components/session/modes/mode-lines.js';

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
  waiting,
}: {
  state: SessionState;
  hero: EntityData | null;
  send: (msg: ClientMessage) => void;
  canMutate: boolean;
  /** A drop: the sheet stays readable, actions wait. */
  waiting: boolean;
}) {
  const [tab, setTab] = useState<PlayerTab>('actions');
  const [argSkill, setArgSkill] = useState('');
  const [argText, setArgText] = useState('');
  const scene = state.scenes.find((s) => s.id === state.activeSceneId) ?? null;
  const mode = scene?.type ?? null;
  // A Player's phone draws through the same fog helper as the laptop: hidden creatures are absent.
  const visible = useMemo(
    () => filterVisibleEntities(state.entities, mode === 'battle' && scene ? parseBattleData(scene.data ?? {}).fogZones : []),
    [mode, scene, state.entities],
  );
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
  const heroConditions = conditionNames(hero) as string[];
  const heroSpeed = num(hero, 'speed', 5);
  const heroicResource = num(hero, 'heroicResource', 0);
  const resourceName = str(hero, 'heroicResourceName', 'Resource');

  const enemies = useMemo(
    () => visible.filter((entity) => entity.type === 'monster' || entity.type === 'npc'),
    [visible],
  );
  const party = useMemo(() => visible.filter((entity) => entity.type === 'hero'), [visible]);

  const targeting = useTargetingResolution({
    sourceEntity: hero ?? null,
    entities: visible,
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


  const battle = mode === 'battle';
  const mayTake = battle ? canClaimTurn(combat, heroEntityId) : false;
  const turnBand = battle && combat && hero && (mayTake || isMyTurn);
  const negotiation = mode === 'negotiation' && scene ? parseNegotiationData(scene.data ?? {}) : null;
  const liveNeg = state.negotiation;
  const negActive = negotiation ? (liveNeg?.phase ?? negotiation.phase) === 'active' : false;
  const directorName = state.participants.find((p) => p.role === 'director')?.username ?? null;
  const band = scene && mode !== 'battle' ? modeBand(mode as NonBattleMode, scene.name, scene.data ?? {}, state, directorName) : null;
  const last = combat?.actedThisRound.length ? state.entities.find((e) => e.id === combat.actedThisRound[combat.actedThisRound.length - 1] && e.type === 'hero') : undefined;

  const dock = (() => {
    if (tab !== 'actions' || !hero) return null;
    if (battle && mayTake && heroEntityId) {
      return <PhoneDock take label="Take my turn" waiting={waiting} disabled={!canMutate} onClick={() => send({ type: 'combat_action', action: { type: 'CLAIM_TURN', entityId: heroEntityId } })} />;
    }
    if (negotiation && negActive) {
      return (
        <PhoneDock
          label="Make argument"
          waiting={waiting}
          disabled={!canMutate || !argSkill || !argText.trim()}
          onClick={() => {
            send({ type: 'negotiation_argument', skillId: argSkill, approachText: argText });
            setArgText('');
          }}
        />
      );
    }
    return null;
  })();

  return (
    <PhoneApp role="player" scene={scene}>
      <PhoneTop scene={scene} right={battle && combat ? <span className="ph-round">Round {combat.round}</span> : undefined} />
      {turnBand ? (
        <section className="ph-turn" aria-live="polite">
          <i><TokenFace entity={hero} size={40} /></i>
          <div>
            <strong>Your turn, {firstName(hero.name)}</strong>
            <small>{isMyTurn ? 'You are acting now' : last ? `${firstName(last.name)} has finished` : `Round ${combat.round}`}</small>
          </div>
        </section>
      ) : band ? (
        <section className="md-band ph-band" data-mode={mode ?? undefined}>
          <strong>{band.goal}</strong>
          <small>{band.line}</small>
        </section>
      ) : null}
      <div className="ph-body">
        {waiting && <PhoneDropStrip />}
        {!hero && <p className="ph-sec ph-text">No hero is assigned to this session.</p>}
        {hero && tab === 'actions' && (
          <>
            {negotiation ? (
              <>
                <PhoneNpc name={negotiation.npcName} attitude={negotiation.npcAttitude} portrait={negotiation.npcPortrait} />
                <PhoneInterest interest={liveNeg?.interest ?? negotiation.interest} />
                <PhoneWhatYouKnow neg={negotiation} live={liveNeg} />
                {negActive && (
                  <PhoneArgument
                    patience={liveNeg?.patience ?? negotiation.patience}
                    maxPatience={liveNeg?.maxPatience ?? negotiation.maxPatience}
                    skillId={argSkill}
                    text={argText}
                    onSkill={setArgSkill}
                    onText={setArgText}
                  />
                )}
              </>
            ) : (
              <PhoneMe hero={hero} />
            )}
            {battle && combat && (
              <section className="ph-sec ph-acts">
                <div className="ph-h"><b>This turn</b><span>{isMyTurn ? 'You are acting' : 'Ready when you take it'}</span></div>
                <TurnActionBar
                  turnActions={turnActions}
                  isMyTurn={isMyTurn}
                  baseSpeed={heroSpeed}
                  heroicResource={heroicResource}
                  resourceName={resourceName}
                  conditions={heroConditions}
                  onCatchBreath={() => sendSelfAction('catch-breath', 'Catch Breath')}
                  onDefend={() => sendSelfAction('defend', 'Defend')}
                  onEndTurn={() => canMutate && send({ type: 'combat_action', action: { type: 'END_TURN' } })}
                />
              </section>
            )}
            {pendingAbility && (
              <div className="ph-sec">
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
              </div>
            )}
            {battle && <PhoneTraits hero={hero} disabled={!canMutate} onRoll={handleRollCharacteristic} />}
            {battle && <PhoneParty heroes={party} combat={combat} />}
            {heroAbilities.length > 0 ? (
              <div className="ph-sec ph-legacy">
                <AbilityPanel abilities={heroAbilities} usedActionTypes={usedActionTypes} onUseAbility={handleUseAbility} />
              </div>
            ) : (
              <p className="ph-sec ph-text">No abilities available.</p>
            )}
          </>
        )}
        {hero && tab === 'sheet' && (
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
        {hero && tab === 'trackers' && (
          <PhoneTrackers hero={hero} canMutate={canMutate} resourceName={resourceName} onTracker={sendTracker} onCatchBreath={() => sendSelfAction('catch-breath', 'Catch Breath')} />
        )}
        {tab === 'notes' && <PhoneNotes campaignId={state.campaignId} disabled={!canMutate} />}
      </div>
      {dock}
      <PhoneTabBar tabs={PLAYER_TABS} active={tab} onSelect={setTab} />
    </PhoneApp>
  );
}
