import type { LucideIcon } from 'lucide-react';
import { Clapperboard, FolderKanban, NotebookText, Plus, Users } from 'lucide-react';
import type { DashboardState } from '../dashboard/types.js';

export interface FirstStepTask {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  to: string;
  cta: string;
  icon: LucideIcon;
}

/**
 * The first-steps checklist is derived entirely from live data — no separate
 * completion flags to drift out of sync (store source, derive computed).
 */
export function buildFirstSteps(data: DashboardState, isDirector: boolean): FirstStepTask[] {
  if (isDirector) {
    const hasCampaign = data.campaigns.length > 0;
    const hasScene = data.campaigns.some((campaign) => campaign.scenes.length > 0);
    const hasPlayer = data.campaigns.some((campaign) =>
      campaign.members.some((member) => member.role === 'player'),
    );
    const hasSession = data.campaigns.some((campaign) => campaign.sessions.length > 0);
    return [
      {
        id: 'campaign',
        label: 'Forge your first campaign',
        detail: 'Name it, pick a vibe — the rest can change later.',
        done: hasCampaign,
        to: '/app/campaigns',
        cta: 'Open Campaigns',
        icon: FolderKanban,
      },
      {
        id: 'scene',
        label: 'Add a scene to the film strip',
        detail: 'Battle, story, montage, negotiation, or respite.',
        done: hasScene,
        to: '/app/campaigns',
        cta: 'Open Campaigns',
        icon: Clapperboard,
      },
      {
        id: 'invite',
        label: 'Invite a player',
        detail: 'Share an invite link or room code with your party.',
        done: hasPlayer,
        to: '/app/campaigns',
        cta: 'Open Campaigns',
        icon: Users,
      },
      {
        id: 'live',
        label: 'Go live once',
        detail: 'Start a session — even a solo test run counts.',
        done: hasSession,
        to: '/app/live',
        cta: 'Open Live',
        icon: Clapperboard,
      },
    ];
  }

  return [
    {
      id: 'hero',
      label: 'Roll up your first hero',
      detail: 'The wizard walks you through it one choice at a time.',
      done: data.heroes.length > 0,
      to: '/app/heroes/new',
      cta: 'Create Hero',
      icon: Plus,
    },
    {
      id: 'join',
      label: 'Join a campaign',
      detail: 'Use the invite link or room code from your Director.',
      done: data.campaigns.length > 0,
      to: '/app/join',
      cta: 'Join by Code',
      icon: Users,
    },
    {
      id: 'note',
      label: 'Write your first note',
      detail: 'Session recaps, schemes, shopping lists — anything.',
      done: data.notes.length > 0,
      to: '/app/notes',
      cta: 'Open Notes',
      icon: NotebookText,
    },
  ];
}
