import type { ReactNode } from 'react';
import { EyeOff, Minus, Plus } from 'lucide-react';
import { cleanName, heroClassName, staminaOf } from '../../../lib/faces.js';
import type { EntityData } from '../../../types/protocol.js';
import { HeroRow, Meter } from '../battle/HeroRow.js';
import { TokenFace } from '../battle/TokenFace.js';
import { useSessionConnection } from '../shell/connection-context.js';
import './modes.css';

/** Director-only things wear the fog preview's mark: ink and a shut eye (`md-only`). */
export function OnlyYou({ children = 'Only you' }: { children?: ReactNode }) {
  return (
    <em className="md-only">
      <EyeOff size={13} strokeWidth={2.6} aria-hidden="true" />
      {children}
    </em>
  );
}

/** A rail section heading with its note on the right (`sb-sub--dir`). */
export function Head({ title, note }: { title: ReactNode; note?: ReactNode }) {
  return (
    <div className="sb-sub sb-sub--dir">
      <b>{title}</b>
      {typeof note === 'string' ? <span>{note}</span> : note}
    </div>
  );
}

/** The corner tracker hanging from the screen's top-right corner, in each mode's terms. */
export function Side({ items }: { items: { label: ReactNode; value?: ReactNode; on?: boolean }[] }) {
  return (
    <div className="sb-side">
      {items.map((item, index) => (
        <div key={index} data-on={item.on || undefined}>
          <b>{item.label}</b>
          {item.value != null && <span>{item.value}</span>}
        </div>
      ))}
    </div>
  );
}

/** − value + for the Director's mode tools. Waits during a drop. */
export function Stepper({
  label,
  value,
  of,
  canLower,
  canRaise,
  onChange,
}: {
  label: string;
  value: ReactNode;
  of?: number;
  canLower: boolean;
  canRaise: boolean;
  onChange: (delta: number) => void;
}) {
  const { paused } = useSessionConnection();
  return (
    <div className="md-step">
      <span>{paused ? `${label}, when back` : label}</span>
      <button type="button" aria-label={`Lower ${label}`} disabled={paused || !canLower} onClick={() => onChange(-1)}>
        <Minus size={14} strokeWidth={3} aria-hidden="true" />
      </button>
      <b>
        {value}
        {of != null && <small>/{of}</small>}
      </b>
      <button type="button" aria-label={`Raise ${label}`} disabled={paused || !canRaise} onClick={() => onChange(1)}>
        <Plus size={14} strokeWidth={3} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * The party down the left rail in every mode. Stamina, winded and dying carry across scenes;
 * the line under each name is the mode's own (section 6). Nobody has a turn outside Battle.
 */
export function ModeHeroList({
  heroes,
  note,
  subFor,
  ownHeroId,
}: {
  heroes: EntityData[];
  note: string;
  subFor: (hero: EntityData) => string;
  ownHeroId?: string | null;
}) {
  return (
    <>
      <div className="sb-sub">
        <b>Heroes</b>
        <span>{note}</span>
      </div>
      <div className="md-party">
        {heroes.length === 0 && <p className="sb-note md-pad">No heroes at the table yet.</p>}
        {heroes.map((hero) => {
          const own = hero.id === ownHeroId;
          const sub = subFor(hero);
          return <HeroRow key={hero.id} hero={hero} active={false} done={false} own={own} sub={own ? `${sub}, you` : sub} />;
        })}
      </div>
    </>
  );
}

/** A Player's own hero in a mode without turns (`md-hero`). */
export function ModeHeroCard({ hero }: { hero: EntityData }) {
  const { cur, max } = staminaOf(hero);
  const num = (key: string, fallback = 0) => (typeof hero[key] === 'number' ? (hero[key] as number) : fallback);
  const level = num('level', 1);
  const resourceName = typeof hero['heroicResourceName'] === 'string' ? (hero['heroicResourceName'] as string) : 'Resource';
  return (
    <section className="sb-sec md-hero">
      <div className="sb-now__h">
        <div className="sb-now__f">
          <TokenFace entity={hero} size={46} />
        </div>
        <div>
          <strong>{cleanName(hero.name)}</strong>
          <small>
            Level {level} {heroClassName(hero)}
          </small>
        </div>
      </div>
      <div className="sb-vital">
        <span>Stamina</span>
        <b>
          {cur}/{max}
        </b>
        <Meter cur={cur} max={max} />
      </div>
      <div className="sb-stats">
        <span>
          {resourceName} <b>{num('heroicResource')}</b>
        </span>
        <span>
          Recoveries <b>{num('recoveriesCurrent')}/{num('recoveriesMax')}</b>
        </span>
        <span>
          Speed <b>{num('speed', 5)}</b>
        </span>
      </div>
    </section>
  );
}
