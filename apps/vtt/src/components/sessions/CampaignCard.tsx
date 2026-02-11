import { Card, CardHeader, CardTitle, CardContent, Badge, Button } from '@anvil/ui';
import type { CampaignData, LiveSession } from './types.js';

export interface CampaignCardProps {
  campaign: CampaignData;
  /** The live (lobby or active) session for this campaign, if any. */
  liveSession: LiveSession | null;
  /** Whether the current user is the director of this campaign. */
  isDirector: boolean;
  /** Callback when the user clicks "Join Session" (player) or "Rejoin" (director). */
  onJoinSession?: (sessionId: string) => void;
  /** Callback when the director clicks "End Session". */
  onEndSession?: (sessionId: string) => void;
}

export function CampaignCard({ campaign, liveSession, isDirector, onJoinSession, onEndSession }: CampaignCardProps) {
  const playerCount = campaign.members.filter((m) => m.role === 'player').length;

  const lastPlayedLabel = campaign.last_played
    ? new Date(campaign.last_played).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  return (
    <Card className="border-zinc-800 bg-zinc-900/60">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{campaign.name}</CardTitle>
            <p className="mt-1 text-xs text-zinc-500">
              {isDirector ? 'You are the Director' : `Director: ${campaign.director?.username ?? 'Unknown'}`}
              {' · '}
              {playerCount} player{playerCount !== 1 ? 's' : ''}
              {lastPlayedLabel && (
                <>
                  {' · '}
                  Last played {lastPlayedLabel}
                </>
              )}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 pt-0">
        {/* Member avatars */}
        <div className="flex items-center gap-1.5">
          {campaign.members
            .filter((m) => m.role === 'player')
            .slice(0, 8)
            .map((member) => (
              <div
                key={member.user_id}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 text-[10px] font-medium text-zinc-300"
                title={`${member.username}${member.hero_name ? ` — ${member.hero_name}` : ''}`}
              >
                {member.username[0]?.toUpperCase() ?? '?'}
              </div>
            ))}
          {campaign.members.filter((m) => m.role === 'player').length > 8 && (
            <span className="text-xs text-zinc-500">
              +{campaign.members.filter((m) => m.role === 'player').length - 8}
            </span>
          )}
        </div>

        {/* Player's hero */}
        {!isDirector && campaign.my_hero && (
          <div className="rounded bg-zinc-800/50 px-3 py-2">
            <p className="text-xs text-zinc-500">Your Hero</p>
            <p className="text-sm text-zinc-200">
              {campaign.my_hero.name}
              {campaign.my_hero.heroClass && (
                <span className="text-zinc-400">
                  {' '}
                  · {campaign.my_hero.heroClass} Lv{campaign.my_hero.level}
                </span>
              )}
            </p>
          </div>
        )}

        {/* Live session indicator */}
        {liveSession ? (
          <div className="flex items-center justify-between rounded bg-zinc-800/50 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
              </span>
              <span className="text-sm font-medium text-green-400">LIVE</span>
              <span className="text-sm text-zinc-400">— &ldquo;{liveSession.name}&rdquo;</span>
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {liveSession.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {onJoinSession && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onJoinSession(liveSession.id)}
                >
                  {isDirector ? 'Rejoin' : 'Join Session'}
                </Button>
              )}
              {isDirector && onEndSession && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                  onClick={() => onEndSession(liveSession.id)}
                >
                  End
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-1">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-zinc-600" />
            <span className="text-sm text-zinc-500">No active session</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
