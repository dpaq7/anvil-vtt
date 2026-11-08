import type { TurnActionState } from '../../types/protocol.js';
import { useSessionConnection } from './shell/connection-context.js';
import { turnSlots, type AbilityGroup } from './battle/turn-slots.js';
import './battle/battle.css';

interface TurnActionBarProps {
  /** Current turn action state from combat */
  turnActions: TurnActionState | null;
  /** Whether it's this player's active turn */
  isMyTurn: boolean;
  /** The entity's base speed */
  baseSpeed: number;
  /** Heroic resource current value */
  heroicResource: number;
  /** Heroic resource name (e.g., "Ferocity", "Clarity") */
  resourceName: string;
  /** Current conditions on the hero */
  conditions: string[];
  /** Callbacks */
  onCatchBreath: () => void;
  onDefend: () => void;
  onEndTurn: () => void;
  /** Opens the Abilities tab on this kind of action. */
  onOpenAbilities?: (group: AbilityGroup) => void;
}

/** The Player's actions (`sb-acts[data-states]`). Everything that needs the server waits during a drop. */
export function TurnActionBar({
  turnActions,
  isMyTurn,
  baseSpeed,
  heroicResource,
  resourceName,
  conditions,
  onCatchBreath,
  onDefend,
  onEndTurn,
  onOpenAbilities,
}: TurnActionBarProps) {
  const { paused } = useSessionConnection();
  const slots = turnSlots(isMyTurn ? turnActions : null, baseSpeed, conditions);
  const mainAvailable = isMyTurn && Boolean(turnActions) && !turnActions?.mainActionUsed && turnActions?.mainConvertedTo === null;
  const free = mainAvailable && !paused;

  return (
    <>
      <div className="sb-acts" data-states>
        {slots.map(({ label, Icon, state, used, group }) =>
          group && onOpenAbilities ? (
            <button key={label} type="button" data-used={used || undefined} onClick={() => onOpenAbilities(group)}>
              <Icon size={17} strokeWidth={2.6} aria-hidden="true" />
              <b>{label}</b>
              <span>{state}</span>
            </button>
          ) : (
            <div key={label} data-used={used || undefined}>
              <Icon size={17} strokeWidth={2.6} aria-hidden="true" />
              <b>{label}</b>
              <span>{state}</span>
            </div>
          ),
        )}
      </div>
      <div className="sb-free">
        <button type="button" disabled={!free} onClick={onCatchBreath} title="Spend a recovery to regain stamina">
          {paused ? 'Catch Breath, when back' : 'Catch Breath'}
        </button>
        <button type="button" disabled={!free} onClick={onDefend} title="Attacks against you have a bane until your next turn">
          {paused ? 'Defend, when back' : 'Defend'}
        </button>
        {heroicResource > 0 && <span>{resourceName} {heroicResource}</span>}
      </div>
      {isMyTurn && (
        <button type="button" className="sb-end w-full" data-wait={paused || undefined} disabled={paused} onClick={onEndTurn}>
          {paused ? 'End my turn, when back' : 'End my turn'}
        </button>
      )}
    </>
  );
}
