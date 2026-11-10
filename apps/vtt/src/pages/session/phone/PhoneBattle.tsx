import type { ReactNode } from 'react';
import { Check, EyeOff, Minus, Plus } from 'lucide-react';
import { HeroRow, Meter } from '../../../components/session/battle/HeroRow.js';
import { TokenFace } from '../../../components/session/battle/TokenFace.js';
import { buildUnitRows } from '../../../components/session/battle/unit-rows.js';
import { cleanName, conditionLine, firstName, heroClassName, staminaOf, staminaState } from '../../../lib/faces.js';
import type { CombatState, EntityData } from '../../../types/protocol.js';

/*
 * Battle on the phone (demos phone-player, phone-director). Danger first: dying, then winded,
 * then whoever is acting, then the rest by stamina, done last.
 */

const ratio = (e: EntityData) => {
  const { cur, max } = staminaOf(e);
  return max > 0 ? cur / max : 1;
};

function dangerFirst(heroes: EntityData[], combat: CombatState | null): EntityData[] {
  const rank = (h: EntityData) => {
    const state = staminaState(h, 'hero');
    if (state === 'dying') return 0;
    if (state === 'winded') return 1;
    if (combat?.activeEntityId === h.id) return 2;
    if (combat?.actedThisRound.includes(h.id)) return 4;
    return 3;
  };
  return [...heroes].sort((a, b) => rank(a) - rank(b) || ratio(a) - ratio(b));
}

/** The Player's own hero at the top of the sheet (`ph-me`). */
export function PhoneMe({ hero }: { hero: EntityData }) {
  const { cur, max } = staminaOf(hero);
  const num = (key: string, fallback = 0) => (typeof hero[key] === 'number' ? (hero[key] as number) : fallback);
  const resource = typeof hero['heroicResourceName'] === 'string' ? (hero['heroicResourceName'] as string) : 'Resource';
  return (
    <section className="ph-sec ph-me">
      <div className="ph-h"><b>{cleanName(hero.name)}</b><span>Level {num('level', 1)} {heroClassName(hero)}</span></div>
      <div className="sb-vital"><span>Stamina</span><b>{cur}/{max}</b><Meter cur={cur} max={max} winded={staminaState(hero, 'hero') === 'winded'} /></div>
      <div className="sb-stats">
        <span>{resource} <b>{num('heroicResource')}</b></span>
        <span>Recoveries <b>{num('recoveriesCurrent')}/{num('recoveriesMax')}</b></span>
        <span>Speed <b>{num('speed', 5)}</b></span>
      </div>
    </section>
  );
}

/** The party as heads: the dying hero still shouts without taking the screen (`ph-party`). */
export function PhoneParty({ heroes, combat }: { heroes: EntityData[]; combat: CombatState | null }) {
  const dying = heroes.find((h) => staminaState(h, 'hero') === 'dying');
  const acted = combat ? heroes.filter((h) => combat.actedThisRound.includes(h.id)).length : 0;
  return (
    <section className="ph-sec ph-party">
      <div className="ph-h">
        <b>Heroes</b>
        <span>{combat ? `${acted} of ${heroes.length} acted` : `${heroes.length} at the table`}</span>
        {dying && <p className="ph-shout">{firstName(dying.name)} is dying</p>}
      </div>
      <ol>
        {heroes.map((h) => {
          const st = combat?.activeEntityId === h.id ? 'active' : combat?.actedThisRound.includes(h.id) ? 'done' : staminaState(h, 'hero') === 'dying' ? 'dying' : undefined;
          return (
            <li key={h.id} data-s={st} aria-label={`${cleanName(h.name)}${st ? `, ${st}` : ''}`}>
              <i>
                <TokenFace entity={h} size={34} out={staminaState(h, 'hero') === 'dying'} />
                {st === 'done' && <em className="sb-badge" data-on><Check size={10} strokeWidth={4} aria-hidden="true" /></em>}
              </i>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** The Director's Live list in Battle: tracker strip, the party, the Director's side with Malice. */
export function PhoneDirectorBattle({
  combat,
  entities,
  hiddenIds,
  canMutate,
  onMalice,
  top,
  children,
}: {
  /** Above the list: the drop strip. Below it: the scene list, so a scene change stays in reach. */
  top?: ReactNode;
  children?: ReactNode;
  combat: CombatState;
  entities: EntityData[];
  hiddenIds: Set<string>;
  canMutate: boolean;
  onMalice: (delta: number) => void;
}) {
  const map = new Map(entities.map((e) => [e.id, e]));
  const heroes = dangerFirst(combat.heroEntities.flatMap((id) => map.get(id) ?? []), combat);
  const units = buildUnitRows(combat, map, false).sort((a, b) => ratio(a.members[0]!) - ratio(b.members[0]!));
  const villainIds = combat.villainEntities;
  const villainsActed = villainIds.filter((id) => combat.actedThisRound.includes(id)).length;
  const heroesActed = combat.heroEntities.filter((id) => combat.actedThisRound.includes(id)).length;
  return (
    <div className="ph-body ph-body--list">
      {top}
      <div className="ph-track">
        <span><b>Round {combat.round}</b></span>
        <span data-on={combat.activeSide === 'heroes' || undefined}><b>Heroes</b> {heroesActed}/{combat.heroEntities.length}</span>
        <span data-on={combat.activeSide === 'villains' || undefined}><b>Director</b> {villainsActed}/{villainIds.length}</span>
      </div>
      <div className="ph-h ph-h--side"><b>Heroes</b><span>Danger first</span></div>
      {heroes.map((h) => (
        <HeroRow key={h.id} hero={h} active={combat.activeEntityId === h.id} done={combat.actedThisRound.includes(h.id)} />
      ))}
      <div className="ph-h ph-h--side ph-h--dir">
        <b>Director’s side</b>
        <span className="ph-malice">
          Malice
          <button type="button" aria-label="Lower Malice" disabled={!canMutate || combat.malice <= 0} onClick={() => onMalice(-1)}><Minus size={16} strokeWidth={3} aria-hidden="true" /></button>
          <strong>{combat.malice}</strong>
          <button type="button" aria-label="Raise Malice" disabled={!canMutate} onClick={() => onMalice(1)}><Plus size={16} strokeWidth={3} aria-hidden="true" /></button>
        </span>
      </div>
      {units.map((unit) => {
        const first = unit.members[0]!;
        const cur = unit.members.reduce((n, m) => n + staminaOf(m).cur, 0);
        const max = unit.members.reduce((n, m) => n + staminaOf(m).max, 0);
        const hidden = unit.members.some((m) => hiddenIds.has(m.id));
        const sub = [unit.members.length > 1 ? `${unit.members.length} in the squad` : null, ...conditionLine(first)].filter(Boolean).join(', ');
        return (
          <div key={unit.id} className="ph-foe" data-active={unit.members.some((m) => m.id === combat.activeEntityId) || undefined}>
            <TokenFace entity={first} size={30} />
            <div className="sb-who"><strong><span>{unit.name}</span></strong>{sub && <small>{sub}</small>}</div>
            {hidden ? <em className="ph-hid" aria-label="Hidden from players"><EyeOff size={14} strokeWidth={2.6} aria-hidden="true" /></em> : <span />}
            <div className="sb-st"><b>{cur}/{max}</b><Meter cur={cur} max={max} /></div>
          </div>
        );
      })}
      {children}
    </div>
  );
}

const TRAITS = [
  ['might', 'MIG', 'Might'],
  ['agility', 'AGI', 'Agility'],
  ['reason', 'REA', 'Reason'],
  ['intuition', 'INT', 'Intuition'],
  ['presence', 'PRE', 'Presence'],
] as const;

/** Characteristic rolls at thumb size (`ph-traits`). */
export function PhoneTraits({ hero, disabled, onRoll }: { hero: EntityData; disabled: boolean; onRoll: (label: string, modifier: number) => void }) {
  return (
    <section className="ph-sec ph-traits">
      <div className="sb-traits">
        {TRAITS.map(([key, short, label]) => {
          const n = typeof hero[key] === 'number' ? (hero[key] as number) : 0;
          return (
            <button key={key} type="button" disabled={disabled} aria-label={`Roll ${label}`} onClick={() => onRoll(label, n)}>
              <small>{short}</small>
              <b>{n >= 0 ? `+${n}` : `−${Math.abs(n)}`}</b>
            </button>
          );
        })}
      </div>
    </section>
  );
}
