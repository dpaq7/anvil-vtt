import { useState, type MouseEvent } from 'react';
import { Check, ChevronDown, ChevronRight, EyeOff } from 'lucide-react';
import { firstName, conditionLine, staminaOf } from '../../lib/faces.js';
import type { CombatState, EntityData } from '../../types/protocol.js';
import { HeroRow } from './battle/HeroRow.js';
import { TokenFace } from './battle/TokenFace.js';
import { SMALL_SESSION, useHitFlash, useMediaQuery, useRollingNumber } from './battle/hooks.js';
import { buildUnitRows, type UnitRowData } from './battle/unit-rows.js';
import { EndCombatButton } from './battle/EndCombatButton.js';
import { MalicePanel } from './MalicePanel.js';
import { useSessionConnection } from './shell/connection-context.js';
import './battle/battle.css';

interface CombatTrackerProps {
  combat: CombatState;
  /** What this viewer may see. A Player's list comes through the fog helper. */
  entities: EntityData[];
  selectedEntityIds?: string[];
  isDirector: boolean;
  currentHeroEntityId: string | null;
  /** Director's view: creatures under fog, marked with the shut eye. */
  hiddenIds?: Set<string>;
  onSelectEntities?: (entityIds: string[]) => void;
  onSelectTurn: (entityId: string) => void;
  onFocusEntity?: (entityId: string) => void;
  onEndTurn: () => void;
  onEndCombat: () => void;
  onAdjustMalice: (delta: number) => void;
  onRollInitiative?: () => void;
}

/** Left rail in Battle: the party, then the Director's side (demos `battle-director`, `battle-player`). */
export function CombatTracker({
  combat,
  entities,
  selectedEntityIds = [],
  isDirector,
  currentHeroEntityId,
  hiddenIds,
  onSelectEntities,
  onSelectTurn,
  onFocusEntity,
  onEndTurn,
  onEndCombat,
  onAdjustMalice,
  onRollInitiative,
}: CombatTrackerProps) {
  // During a drop the table stays readable; actions that need the server wait.
  const { paused } = useSessionConnection();
  const small = useMediaQuery(SMALL_SESSION);
  const entityMap = new Map(entities.map((e) => [e.id, e]));
  const selectedSet = new Set(selectedEntityIds);
  const initiativePending = combat.initiativeRoll === null || combat.firstSide === null || combat.activeSide === null;
  const heroes = combat.heroEntities.flatMap((id) => entityMap.get(id) ?? []);
  const acted = heroes.filter((h) => combat.actedThisRound.includes(h.id)).length;
  const active = combat.activeEntityId ? entityMap.get(combat.activeEntityId) : undefined;

  const selectIds = (event: MouseEvent, ids: string[]) => {
    if (!(event.ctrlKey || event.metaKey || event.shiftKey)) {
      onSelectEntities?.(ids);
      return;
    }
    const next = new Set(selectedSet);
    for (const id of ids) {
      if (next.has(id)) next.delete(id);
      else next.add(id);
    }
    onSelectEntities?.([...next]);
  };

  const pickVillainTurn = (ids: string[]) => {
    if (!isDirector || combat.activeSide !== 'villains' || combat.activeEntityId || paused) return;
    const next = ids.find((id) => !combat.actedThisRound.includes(id));
    if (next) onSelectTurn(next);
  };

  // Squads fold on the Director's view and on the Player's at the small size.
  const rows = buildUnitRows(combat, entityMap, isDirector || small);

  return (
    <div className="sb-tracker">
      {initiativePending && onRollInitiative && (
        <section className="sb-sec">
          <p className="m-0 text-[13px]">Initiative d10. 6 or higher, heroes act first.</p>
          <button type="button" className={`sb-end ${paused ? 'sb-wait-btn' : ''}`} disabled={paused} onClick={onRollInitiative}>
            {paused ? 'Roll d10, when back' : 'Roll d10'}
          </button>
        </section>
      )}
      <div className="sb-sub"><b>Heroes</b><span>{acted} of {heroes.length} acted</span></div>
      <div className="sb-heroes">
        {heroes.map((hero) => (
          <HeroRow
            key={hero.id}
            hero={hero}
            active={combat.activeEntityId === hero.id}
            done={combat.actedThisRound.includes(hero.id)}
            own={hero.id === currentHeroEntityId}
            selected={selectedSet.has(hero.id)}
            onClick={(event) => selectIds(event, [hero.id])}
            onDoubleClick={() => onFocusEntity?.(hero.id)}
          />
        ))}
      </div>
      <div className="sb-sub sb-sub--dir">
        <b>Director</b>
        <MalicePanel malice={combat.malice} isDirector={isDirector} onAdjust={onAdjustMalice} />
      </div>
      <div className="sb-units">
        {rows.map((row) => (
          <UnitRow
            key={row.id}
            row={row}
            combat={combat}
            isDirector={isDirector}
            hiddenIds={hiddenIds}
            selectedSet={selectedSet}
            onClick={(event, ids) => {
              selectIds(event, ids);
              if (!(event.ctrlKey || event.metaKey || event.shiftKey)) pickVillainTurn(ids);
            }}
            onFocus={onFocusEntity}
          />
        ))}
      </div>
      {isDirector && (
        <div className="sb-foot">
          <button
            type="button"
            className="sb-end"
            data-wait={paused || undefined}
            disabled={paused || !combat.activeEntityId}
            onClick={onEndTurn}
          >
            {paused ? 'End turn, when back' : active ? `End ${firstName(active.name)}’s turn` : 'End turn'}
          </button>
          <EndCombatButton onEnd={onEndCombat} />
        </div>
      )}
    </div>
  );
}

function UnitRow({
  row,
  combat,
  isDirector,
  hiddenIds,
  selectedSet,
  onClick,
  onFocus,
}: {
  row: UnitRowData;
  combat: CombatState;
  isDirector: boolean;
  hiddenIds?: Set<string>;
  selectedSet: Set<string>;
  onClick: (event: MouseEvent, ids: string[]) => void;
  onFocus?: (entityId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const cur = row.members.reduce((sum, m) => sum + staminaOf(m).cur, 0);
  const max = row.members.reduce((sum, m) => sum + staminaOf(m).max, 0);
  const shown = useRollingNumber(cur);
  const hit = useHitFlash(cur);
  const ids = row.members.map((m) => m.id);
  const active = Boolean(combat.activeEntityId && ids.includes(combat.activeEntityId));
  const done = ids.every((id) => combat.actedThisRound.includes(id));
  const hidden = isDirector && ids.some((id) => hiddenIds?.has(id));
  const first = row.members[0];
  if (!first) return null;
  const words = row.members.flatMap((m) => conditionLine(m));
  const folded = row.members.length > 1;

  return (
    <>
      <div className="relative">
        <button
          type="button"
          className="sb-unit"
          data-active={active || undefined}
          data-done={done || undefined}
          data-sel={ids.some((id) => selectedSet.has(id)) || undefined}
          data-hit={(isDirector && hit) || undefined}
          onClick={(event) => onClick(event, ids)}
          onDoubleClick={() => onFocus?.(first.id)}
        >
          <TokenFace entity={first} size={22} />
          <span>
            <em title={isDirector ? first.name : undefined}>{row.name}</em>
            {done && <Check size={13} strokeWidth={3.5} aria-label="Done" className="flex-none" />}
            {hidden && <EyeOff size={13} strokeWidth={2.6} aria-label="Hidden from players" className="flex-none" />}
          </span>
          {isDirector ? (
            <b className={folded ? 'pr-5' : undefined}>{shown}/{max}</b>
          ) : words.length === 1 ? (
            <small className={folded ? 'pr-5' : undefined}>{words[0]}</small>
          ) : <i className={folded ? 'pr-5' : undefined} />}
        </button>
        {folded && (
          <button
            type="button"
            className="absolute right-1 top-1/2 grid size-5 -translate-y-1/2 place-items-center text-inherit"
            aria-expanded={open}
            aria-label={`${open ? 'Fold' : 'Show each of'} ${row.name}`}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <ChevronDown size={15} strokeWidth={3} aria-hidden="true" /> : <ChevronRight size={15} strokeWidth={3} aria-hidden="true" />}
          </button>
        )}
      </div>
      {folded && open && row.members.map((member) => (
        <MemberRow
          key={member.id}
          member={member}
          combat={combat}
          isDirector={isDirector}
          hidden={isDirector && Boolean(hiddenIds?.has(member.id))}
          selected={selectedSet.has(member.id)}
          onClick={(event) => onClick(event, [member.id])}
          onDoubleClick={() => onFocus?.(member.id)}
        />
      ))}
    </>
  );
}

function MemberRow({ member, combat, isDirector, hidden, selected, onClick, onDoubleClick }: {
  member: EntityData;
  combat: CombatState;
  isDirector: boolean;
  hidden: boolean;
  selected: boolean;
  onClick: (event: MouseEvent) => void;
  onDoubleClick: () => void;
}) {
  const { cur, max } = staminaOf(member);
  const done = combat.actedThisRound.includes(member.id);
  const words = conditionLine(member);
  return (
    <button
      type="button"
      className="sb-unit sb-unit--sub"
      data-active={combat.activeEntityId === member.id || undefined}
      data-done={done || undefined}
      data-sel={selected || undefined}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      <TokenFace entity={member} size={22} />
      <span>
        <em>{member.name}</em>
        {done && <Check size={13} strokeWidth={3.5} aria-label="Done" className="flex-none" />}
        {hidden && <EyeOff size={13} strokeWidth={2.6} aria-label="Hidden from players" className="flex-none" />}
      </span>
      {isDirector ? <b>{cur}/{max}</b> : words.length === 1 ? <small>{words[0]}</small> : <i />}
    </button>
  );
}
