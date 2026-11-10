import { findSkillByName, skills } from '@anvil/data';
import { heroClassName } from '../../../lib/faces.js';
import type { EntityData, ParticipantInfo, SessionState } from '../../../types/protocol.js';

/*
 * The line under each hero's name, and the heading note, in each mode's terms (DESIGN.md
 * section 6). Everything here comes from state both roles already receive.
 */

export type NonBattleMode = 'story' | 'montage' | 'negotiation' | 'respite';

export const skillName = (id: string) =>
  skills.find((skill) => skill.id === id)?.name ?? findSkillByName(id)?.name ?? id;

/** The user who plays a hero, so log entries keyed by player can be read per hero. */
export function playerOf(hero: EntityData, participants: ParticipantInfo[]): string | null {
  const joined = participants.find((p) => p.heroId === hero.id);
  if (joined) return joined.userId;
  return typeof hero['ownerUserId'] === 'string' ? (hero['ownerUserId'] as string) : null;
}

const capitalise = (text: string) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : text);

export interface ModeLines {
  note: string;
  subFor: (hero: EntityData) => string;
}

/**
 * `marked`: heroes the Director ticked as tested by hand (a test rolled at the table and recorded
 * with the steppers). Client-side only, on the Director's view, as the old Tracking list was.
 */
export function modeLines(mode: NonBattleMode, heroes: EntityData[], state: SessionState, marked?: ReadonlySet<string>): ModeLines {
  const { participants } = state;
  const userOf = (hero: EntityData) => playerOf(hero, participants);
  switch (mode) {
    case 'story':
      return {
        note: `${heroes.length} at the table`,
        subFor: (hero) => {
          const ancestry = typeof hero['ancestry'] === 'string' ? capitalise(hero['ancestry'] as string) : '';
          return [ancestry, heroClassName(hero)].filter(Boolean).join(' ');
        },
      };
    case 'montage': {
      const log = state.montage?.testLog ?? [];
      const lastFor = (hero: EntityData) => {
        const user = userOf(hero);
        return [...log].reverse().find((entry) => entry.playerId === user || entry.playerName === hero.name);
      };
      const tested = heroes.filter((hero) => lastFor(hero) || marked?.has(hero.id)).length;
      return {
        note: `${tested} of ${heroes.length} tested`,
        subFor: (hero) => {
          const entry = lastFor(hero);
          if (entry) return `${skillName(entry.skillId)} ${entry.roll}, ${entry.outcome}`;
          return marked?.has(hero.id) ? 'Marked tested' : 'Not tested yet';
        },
      };
    }
    case 'negotiation': {
      const log = state.negotiation?.argumentLog ?? [];
      const lastFor = (hero: EntityData) => {
        const user = userOf(hero);
        return [...log].reverse().find((entry) => entry.playerId === user || entry.playerName === hero.name);
      };
      const argued = heroes.filter((hero) => lastFor(hero)).length;
      return {
        note: `${argued} ${argued === 1 ? 'has' : 'have'} argued`,
        subFor: (hero) => {
          const entry = lastFor(hero);
          if (!entry) return 'Has not argued';
          const delta = entry.interestDelta > 0 ? `+${entry.interestDelta}` : entry.interestDelta < 0 ? `−${Math.abs(entry.interestDelta)}` : '0';
          return `${skillName(entry.skillId)}, ${delta}`;
        },
      };
    }
    case 'respite': {
      const activities = state.respite?.activities ?? [];
      const mineFor = (hero: EntityData) => {
        const user = userOf(hero);
        return user ? activities.find((activity) => activity.claimedBy === user) : undefined;
      };
      const done = heroes.filter((hero) => mineFor(hero)?.completed).length;
      return {
        note: `${done} of ${heroes.length} done`,
        subFor: (hero) => {
          const activity = mineFor(hero);
          return activity ? `${activity.name}, ${activity.completed ? 'done' : 'working'}` : 'No activity';
        },
      };
    }
  }
}

/** The Player's mode band: a goal at 22 px and one line of what the table is doing (section 6). */
export function modeBand(mode: NonBattleMode, sceneName: string, data: Record<string, unknown>, state: SessionState, directorName: string | null): { goal: string; line: string } {
  const director = directorName ?? 'The Director';
  switch (mode) {
    case 'story':
      return { goal: sceneName, line: `${director} is reading aloud. Listen.` };
    case 'montage': {
      const goal = typeof data['goal'] === 'string' && data['goal'] ? (data['goal'] as string) : sceneName;
      const rounds = typeof data['roundLimit'] === 'number' ? (data['roundLimit'] as number) : 2;
      const ended = state.montage?.outcome && state.montage.outcome !== 'pending';
      return { goal, line: ended ? 'The montage is over.' : `${rounds} rounds. Each hero makes one test.` };
    }
    case 'negotiation': {
      const template = data['template'] as { npc?: { name?: string }; startingAttitude?: string } | undefined;
      const name = template?.npc?.name ?? (data['npcName'] as string | undefined) ?? 'The other side';
      const attitude = template?.startingAttitude ?? (data['npcAttitude'] as string | undefined) ?? 'wary';
      const live = state.negotiation;
      if (live && live.phase !== 'active') return { goal: sceneName, line: live.phase === 'success' ? 'A deal was reached.' : 'The talk ended with no deal.' };
      const first = name.split(/[\s,]+/)[0] ?? name;
      return { goal: sceneName, line: `${first} is ${attitude}. Interest ${live?.interest ?? '?'}, patience ${live?.patience ?? '?'}.` };
    }
    case 'respite': {
      const place = (data['location'] as string | undefined) ?? (data['locationDescription'] as string | undefined);
      return { goal: place ? `Rest at ${place}` : sceneName, line: 'Pick one activity each. Done when you say so.' };
    }
  }
}
