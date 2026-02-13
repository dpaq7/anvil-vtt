import { useCallback } from 'react';
import { CheckCircle2, Hand, Coffee } from 'lucide-react';
import { Button, Card, CardHeader, CardTitle, CardContent } from '@anvil/ui';
import type { RespiteActivityState } from '../../types/protocol.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RespiteActivity {
  heroName: string;
  activityType: string;
  completed: boolean;
}

interface RespiteStageProps {
  location: string;
  /** Legacy activities (from scene data) */
  activities: RespiteActivity[];
  /** Live activities from server */
  liveActivities?: RespiteActivityState[];
  projects: { id: string; name: string; currentPoints: number; goalPoints: number }[];
  completed: boolean;
  isDirector: boolean;
  /** Current player's user ID (for claim highlighting) */
  currentUserId?: string;
  /** Player callback to claim an activity */
  onClaimActivity?: (activityId: string) => void;
  /** Player callback to complete a claimed activity */
  onCompleteActivity?: (activityId: string) => void;
}

const ACTIVITY_LABELS: Record<string, string> = {
  recover: 'Recover',
  craft: 'Craft',
  research: 'Research',
  socialize: 'Socialize',
  change_kit: 'Change Kit',
  project: 'Project',
  custom: 'Custom',
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface LiveActivityCardProps {
  activity: RespiteActivityState;
  isDirector: boolean;
  currentUserId?: string;
  onClaim?: () => void;
  onComplete?: () => void;
}

function LiveActivityCard({
  activity,
  isDirector,
  currentUserId,
  onClaim,
  onComplete,
}: LiveActivityCardProps) {
  const isMine = activity.claimedBy === currentUserId;
  const isClaimed = activity.claimedBy !== null;

  return (
    <div
      className={`flex items-center justify-between rounded border px-4 py-3 ${
        activity.completed
          ? 'border-emerald-500/30 bg-emerald-500/10'
          : isMine
            ? 'border-cyan-500/30 bg-cyan-500/10'
            : isClaimed
              ? 'border-zinc-600 bg-zinc-800/50'
              : 'border-zinc-700 bg-zinc-800'
      }`}
    >
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-200">{activity.name}</p>
        {activity.description && (
          <p className="mt-0.5 text-xs text-zinc-500">{activity.description}</p>
        )}
        {isClaimed && !activity.completed && (
          <p className="mt-0.5 text-xs text-cyan-400">
            Claimed by {isMine ? 'you' : activity.claimedByName ?? 'someone'}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {activity.completed ? (
          <CheckCircle2 className="size-5 text-emerald-400" />
        ) : !isDirector && !isClaimed && onClaim ? (
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={onClaim}>
            <Hand className="size-3" />
            Claim
          </Button>
        ) : !isDirector && isMine && onComplete ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1 text-xs text-emerald-400"
            onClick={onComplete}
          >
            <CheckCircle2 className="size-3" />
            Complete
          </Button>
        ) : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function RespiteStage({
  location,
  activities,
  liveActivities,
  projects,
  completed,
  isDirector,
  currentUserId,
  onClaimActivity,
  onCompleteActivity,
}: RespiteStageProps) {
  const completedCount = liveActivities
    ? liveActivities.filter((a) => a.completed).length
    : activities.filter((a) => a.completed).length;

  const totalCount = liveActivities ? liveActivities.length : activities.length;

  const handleClaim = useCallback(
    (activityId: string) => {
      onClaimActivity?.(activityId);
    },
    [onClaimActivity],
  );

  const handleComplete = useCallback(
    (activityId: string) => {
      onCompleteActivity?.(activityId);
    },
    [onCompleteActivity],
  );

  return (
    <div className="flex h-full flex-col gap-6 overflow-auto p-8">
      {/* Location */}
      <div className="text-center">
        <p className="text-xs uppercase text-zinc-500">Respite at</p>
        <p className="text-lg font-medium text-zinc-100">{location || 'Unknown Location'}</p>
        {completed && (
          <span className="mt-1 inline-block rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
            COMPLETED
          </span>
        )}
      </div>

      {/* Activity cards — prefer live activities from server */}
      <div className="mx-auto w-full max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <Coffee className="size-4 text-cyan-400" />
                Activities
              </span>
              <span className="text-xs font-normal text-zinc-500">
                {completedCount}/{totalCount} done
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {liveActivities && liveActivities.length > 0 ? (
              liveActivities.map((a) => (
                <LiveActivityCard
                  key={a.activityId}
                  activity={a}
                  isDirector={isDirector}
                  currentUserId={currentUserId}
                  onClaim={() => handleClaim(a.activityId)}
                  onComplete={() => handleComplete(a.activityId)}
                />
              ))
            ) : activities.length > 0 ? (
              activities.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between rounded border px-4 py-3 ${
                    a.completed
                      ? 'border-emerald-500/30 bg-emerald-500/10'
                      : 'border-zinc-700 bg-zinc-800'
                  }`}
                >
                  <div>
                    <p className="text-sm text-zinc-200">{a.heroName}</p>
                    <p className="text-xs text-zinc-500">
                      {ACTIVITY_LABELS[a.activityType] ?? a.activityType}
                    </p>
                  </div>
                  {a.completed && <CheckCircle2 className="size-4 text-emerald-400" />}
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500">No activities assigned yet.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div className="mx-auto w-full max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Projects</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {projects.map((p) => {
                const pct = p.goalPoints > 0 ? (p.currentPoints / p.goalPoints) * 100 : 0;
                return (
                  <div key={p.id} className="rounded border border-zinc-700 bg-zinc-800 px-4 py-3">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-zinc-300">{p.name}</span>
                      <span className="text-zinc-500">
                        {p.currentPoints}/{p.goalPoints}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-zinc-700">
                      <div
                        className="h-full rounded-full bg-cyan-500 transition-all"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
