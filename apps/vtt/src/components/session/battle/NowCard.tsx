import { conditionLine, cleanName, heroClassName } from '../../../lib/faces.js';
import type { CombatState, EntityData } from '../../../types/protocol.js';
import { turnSlots } from './turn-slots.js';
import { TokenFace } from './TokenFace.js';

const num = (entity: EntityData, key: string, fallback: number) =>
  typeof entity[key] === 'number' ? (entity[key] as number) : fallback;

/** The Director's Now card (`sb-now`): who is acting, what they have left. */
export function NowCard({ combat, entities }: { combat: CombatState | null; entities: EntityData[] }) {
  const active = combat?.activeEntityId ? entities.find((e) => e.id === combat.activeEntityId) : undefined;
  if (!combat || !active) {
    const line = !combat
      ? 'Combat has not started.'
      : combat.activeSide === 'heroes'
        ? 'The heroes choose who goes next.'
        : combat.activeSide === 'villains'
          ? 'Pick a creature in the left rail.'
          : 'Waiting for initiative.';
    return (
      <section className="sb-sec sb-now">
        <div className="sb-now__h" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <div><strong>No one is acting</strong><small>{line}</small></div>
        </div>
      </section>
    );
  }
  const hero = active.type === 'hero';
  const sub = [hero ? heroClassName(active) : null, ...conditionLine(active)].filter(Boolean).join(', ');
  const speed = num(active, 'speed', 5);
  const slots = turnSlots(combat.turnActions?.[active.id] ?? null, speed, conditionLine(active).map((c) => c.toLowerCase()));
  return (
    <section className="sb-sec sb-now">
      <div className="sb-now__h">
        <div className="sb-now__f" key={active.id}><TokenFace entity={active} size={46} /></div>
        <div><strong>{cleanName(active.name)}</strong>{sub && <small>{sub}</small>}</div>
      </div>
      <div className="sb-acts">
        {slots.map(({ label, Icon, state, used }) => (
          <div key={label} data-used={used || undefined}>
            <Icon size={17} strokeWidth={2.6} aria-hidden="true" />
            <b>{label}</b>
            {(label === 'Move' || used) && <span>{label === 'Move' ? state : 'Used'}</span>}
          </div>
        ))}
      </div>
      <div className="sb-stats">
        {hero && <span>{typeof active['heroicResourceName'] === 'string' ? active['heroicResourceName'] : 'Resource'} <b>{num(active, 'heroicResource', 0)}</b></span>}
        {hero && <span>Recoveries <b>{num(active, 'recoveriesCurrent', 0)}/{num(active, 'recoveriesMax', 0)}</b></span>}
        <span>Speed <b>{speed}</b></span>
      </div>
    </section>
  );
}
