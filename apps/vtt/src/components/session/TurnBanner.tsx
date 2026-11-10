import type { SceneType } from '@anvil/ui';
import type { CombatState, EntityData } from '../../types/protocol.js';
import { useSessionConnection } from './shell/connection-context.js';
import { canClaimTurn } from '../../lib/turn.js';
import { firstName } from '../../lib/faces.js';
import { TokenFace } from './battle/TokenFace.js';

/*
 * The Player's top row beside the live board (DESIGN.md sections 4 and 6).
 * - Turn band (`battle-player`, `sb-turn`): blue, "Your turn, <name>", who just finished,
 *   and "Take my turn" (the existing CLAIM_TURN) when the Player may take a turn.
 * - Mode band (`story-player`, `md-band`): what the table is doing, in every other case.
 *   It never names a creature: who acts on the Director's side stays the Director's.
 */
interface PlayerTopBandProps {
  mode: SceneType | null;
  sceneName: string;
  combat: CombatState | null;
  hero: EntityData | null;
  entities: EntityData[];
  directorName: string | null;
  onTakeTurn: (heroEntityId: string) => void;
  /** Another mode's own goal and line (`modeBand`), in place of the defaults below. */
  band?: { goal: string; line: string } | null;
}


export function PlayerTopBand({ mode, sceneName, combat, hero, entities, directorName, onTakeTurn, band }: PlayerTopBandProps) {
  const { paused } = useSessionConnection();
  const heroId = hero?.id ?? null;
  const battle = mode === 'battle' && combat;
  const mayTake = battle ? canClaimTurn(combat, heroId) : false;
  const acting = battle ? combat.activeEntityId === heroId && heroId !== null : false;

  if (battle && hero && (mayTake || acting)) {
    const lastId = combat.actedThisRound[combat.actedThisRound.length - 1];
    const last = lastId ? entities.find((e) => e.id === lastId && e.type === 'hero') : undefined;
    return (
      <div className="sb-turn" role="status">
        <div className="sb-turn__f" aria-hidden="true">
          <TokenFace entity={hero} size={38} />
        </div>
        <strong>Your turn, {firstName(hero.name)}</strong>
        <small>
          {acting ? 'You are acting now' : last ? `${firstName(last.name)} has finished` : `Round ${combat.round}`}
        </small>
        {mayTake && (
          <button
            type="button"
            className="sb-take"
            data-wait={paused || undefined}
            disabled={paused}
            onClick={() => heroId && onTakeTurn(heroId)}
          >
            {paused ? 'Take my turn, when back' : 'Take my turn'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="md-band" data-mode={mode ?? undefined} role="status">
      <strong>{band?.goal ?? (mode ? (mode === 'battle' ? 'Battle' : sceneName) : 'Waiting for the Director')}</strong>
      <small>{band?.line ?? bandLine(mode, combat, entities, directorName)}</small>
    </div>
  );
}

function bandLine(
  mode: SceneType | null,
  combat: CombatState | null,
  entities: EntityData[],
  directorName: string | null,
): string {
  const director = directorName ?? 'The Director';
  switch (mode) {
    case null:
      return 'The scene will appear here.';
    case 'story':
      return `${director} is reading aloud. Listen.`;
    case 'montage':
      return 'Each hero makes one test.';
    case 'negotiation':
      return 'Make your case, one argument at a time.';
    case 'respite':
      return 'Pick one activity each. Done when you say so.';
    case 'battle': {
      if (!combat) return 'The fight has not started yet.';
      if (combat.initiativeRoll === null || combat.activeSide === null) return 'Roll initiative to start.';
      const active = combat.activeEntityId ? entities.find((e) => e.id === combat.activeEntityId) : undefined;
      if (active?.type === 'hero') return `${firstName(active.name)} is acting.`;
      if (combat.activeSide === 'villains') return `${director}'s side is acting.`;
      return `Round ${combat.round}. Heroes choose who goes next.`;
    }
  }
}
