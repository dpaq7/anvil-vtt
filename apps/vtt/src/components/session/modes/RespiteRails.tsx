import { Check } from 'lucide-react';
import type { RespiteActivityState } from '../../../types/protocol.js';
import { activityState, kindIcon } from '../../stages/mode-helpers.js';
import { Meter } from '../battle/HeroRow.js';
import { useSessionConnection } from '../shell/connection-context.js';
import { Head } from './parts.js';

interface Project {
  id: string;
  name: string;
  currentPoints: number;
  goalPoints: number;
}

/** Projects, then the activities nobody has claimed (`respite-*` left rail). */
export function RespiteLower({ projects, activities }: { projects: Project[]; activities: RespiteActivityState[] }) {
  const open = activities.filter((a) => activityState(a) === 'open');
  return (
    <>
      <Head title="Projects" note={`${projects.length} going`} />
      <div className="md-projects">
        {projects.length === 0 && <span className="text-[13px] text-text-soft">No projects in this respite.</span>}
        {projects.map((p) => (
          <div key={p.id}>
            <div>
              <b>{p.name}</b>
              <span>{p.currentPoints} of {p.goalPoints}</span>
            </div>
            <Meter cur={p.currentPoints} max={p.goalPoints} />
          </div>
        ))}
      </div>
      <Head title="Open activities" note={`${open.length} unclaimed`} />
      <div className="md-outs">
        {open.length === 0 && <span className="text-[13px] text-text-soft">Every activity is taken.</span>}
        {open.map((a, index) => (
          <div key={`${a.activityId}-${index}`}>
            <b>{a.name}</b>
            {a.description && <span>{a.description}</span>}
          </div>
        ))}
      </div>
    </>
  );
}

/** The Player's main action: their own activity and Complete (`respite-player`). */
export function MyActivity({ activity, onComplete }: { activity: RespiteActivityState | undefined; onComplete: (id: string) => void }) {
  const { paused } = useSessionConnection();
  const Icon = kindIcon(activity?.name ?? '');
  return (
    <section className="sb-sec md-act">
      <div className="md-tool__h">
        <b>Your activity</b>
        <span>{!activity ? 'None yet' : activity.completed ? 'Done' : 'Working'}</span>
      </div>
      {activity ? (
        <div className="md-mine">
          <Icon size={20} strokeWidth={2.6} aria-hidden="true" />
          <div>
            <b>{activity.name}</b>
            {activity.description && <small>{activity.description}</small>}
          </div>
        </div>
      ) : (
        <p className="m-0 text-[14px]">Claim an open ticket on the board.</p>
      )}
      <button
        type="button"
        className="md-go"
        data-wait={paused || undefined}
        disabled={paused || !activity || activity.completed}
        onClick={() => activity && onComplete(activity.activityId)}
      >
        <Check size={18} strokeWidth={3} aria-hidden="true" />
        {paused ? 'Complete, when back' : activity?.completed ? 'Completed' : 'Complete'}
      </button>
    </section>
  );
}

/**
 * The Director's activities tool. The protocol has no message to add an activity during play, so
 * this lists the table's activities with Complete, as the Director's view did before
 * (activities are added in the Builder).
 */
export function ActivitiesTool({ activities, onComplete }: { activities: RespiteActivityState[]; onComplete: (id: string) => void }) {
  const { paused } = useSessionConnection();
  const left = activities.filter((a) => !a.completed).length;
  return (
    <section className="sb-sec md-tools md-add">
      <div className="md-tool__h">
        <b>Activities</b>
        <span>{left} still going</span>
      </div>
      {activities.length === 0 && <span className="text-[13px] text-text-soft">Add activities to this scene in the Builder.</span>}
      {activities.map((a, index) => {
        const Icon = kindIcon(a.name);
        const state = activityState(a);
        return (
          <div key={`${a.activityId}-${index}`} className="grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-2.5">
            <Icon size={16} strokeWidth={2.6} aria-hidden="true" />
            <div className="min-w-0">
              <b className="block">{a.name}</b>
              <small className="text-[13px] text-text-soft">
                {state === 'done' ? `Done${a.claimedByName ? `, ${a.claimedByName}` : ''}` : state === 'working' ? `${a.claimedByName ?? 'Someone'}, working` : 'Open'}
              </small>
            </div>
            {!a.completed && (
              <button type="button" className="md-tk__do" data-wait={paused || undefined} disabled={paused} onClick={() => onComplete(a.activityId)}>
                {paused ? 'Complete, when back' : 'Complete'}
              </button>
            )}
          </div>
        );
      })}
    </section>
  );
}
