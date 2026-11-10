import { Check, Clock } from 'lucide-react';
import type { EntityData, RespiteActivityState } from '../../types/protocol.js';
import { cleanName } from '../../lib/faces.js';
import { Side } from '../session/modes/parts.js';
import { TokenFace } from '../session/battle/TokenFace.js';
import { useSessionConnection } from '../session/shell/connection-context.js';
import { activityState, kindIcon, respiteTickets, type PreparedActivity, type RespiteFilter } from './mode-helpers.js';

interface RespiteStageProps {
  location: string;
  /** Activities from scene data, used before the table hydrates live ones (and in the Builder). */
  activities: PreparedActivity[];
  liveActivities?: RespiteActivityState[];
  projects: { id: string; name: string; currentPoints: number; goalPoints: number }[];
  completed: boolean;
  isDirector: boolean;
  currentUserId?: string;
  onClaimActivity?: (activityId: string) => void;
  onCompleteActivity?: (activityId: string) => void;
  filter?: RespiteFilter;
  /** The hero a claiming player plays, for the face on the ticket. */
  heroFor?: (userId: string) => EntityData | undefined;
  bare?: boolean;
}


function Ticket({ a, isDirector, mine, hero, onClaim, onComplete }: {
  a: RespiteActivityState;
  isDirector: boolean;
  mine: boolean;
  hero?: EntityData;
  onClaim?: () => void;
  onComplete?: () => void;
}) {
  const { paused } = useSessionConnection();
  const Icon = kindIcon(a.name);
  const state = activityState(a);
  const action = isDirector
    ? state === 'working' && onComplete ? { label: 'Complete', run: onComplete } : null
    : mine && state === 'working' && onComplete ? { label: 'Complete', run: onComplete }
      : state === 'open' && onClaim ? { label: 'Claim', run: onClaim } : null;
  const who = a.claimedByName ?? (hero ? cleanName(hero.name) : null);
  return (
    <section className="md-tk" data-state={state} data-mine={mine || undefined}>
      <div className="md-tk__h">
        <Icon size={16} strokeWidth={2.6} aria-hidden="true" />
        <b>{a.name}</b>
        {action ? (
          <button type="button" className="md-tk__do" data-primary={mine || undefined} data-wait={paused || undefined} disabled={paused} onClick={action.run}>
            {paused ? `${action.label}, when back` : action.label}
          </button>
        ) : (
          <em>
            {state === 'done' ? <><Check size={13} strokeWidth={3.5} aria-hidden="true" />Done</> : state === 'working' ? <><Clock size={13} strokeWidth={2.8} aria-hidden="true" />Working</> : 'Open'}
          </em>
        )}
      </div>
      {a.description && <p>{a.description}</p>}
      <div className="md-tk__who">
        {who ? (
          <>
            {hero && <TokenFace entity={hero} size={28} />}
            <span>{who}{mine && <small>you</small>}</span>
          </>
        ) : (
          <span className="md-tk__none">Nobody yet</span>
        )}
      </div>
    </section>
  );
}

/** Respite's screen: the camp band with its place plate, and a ticket per activity. */
export function RespiteStage({
  location,
  activities,
  liveActivities,
  completed,
  isDirector,
  currentUserId,
  onClaimActivity,
  onCompleteActivity,
  filter = 'all',
  heroFor,
  bare = false,
}: RespiteStageProps) {
  const tickets = respiteTickets(liveActivities, activities);
  const live = Boolean(liveActivities && liveActivities.length > 0);
  const done = tickets.filter((a) => a.completed).length;
  const open = tickets.filter((a) => activityState(a) === 'open').length;
  const shown = tickets.filter((a) => filter === 'all' || (filter === 'done' ? a.completed : activityState(a) === 'open'));

  return (
    <>
      <div className="md-plate md-place">
        <small>Respite at</small>
        <strong>{location || 'Somewhere quiet'}</strong>
      </div>
      {!bare && (
        <Side items={[{ label: 'Done', value: `${done} of ${tickets.length}`, on: !completed }, { label: 'Open', value: `${open}` }]} />
      )}
      {shown.length === 0 ? (
        <div className="md-tks md-tks--empty">
          <b className="font-display text-[22px]">{tickets.length === 0 ? 'No activities yet' : `No ${filter} activities`}</b>
          <p className="m-0">{tickets.length === 0 ? 'The Director adds activities in the Builder.' : 'Pick All in the bar to see every ticket.'}</p>
        </div>
      ) : (
        <div className="md-tks">
          {shown.map((a, index) => {
            const mine = !isDirector && Boolean(currentUserId) && a.claimedBy === currentUserId;
            return (
              <Ticket
                key={`${a.activityId}-${index}`}
                a={a}
                isDirector={isDirector}
                mine={mine}
                hero={a.claimedBy ? heroFor?.(a.claimedBy) : undefined}
                onClaim={live && onClaimActivity ? () => onClaimActivity(a.activityId) : undefined}
                onComplete={live && onCompleteActivity ? () => onCompleteActivity(a.activityId) : undefined}
              />
            );
          })}
        </div>
      )}
    </>
  );
}
