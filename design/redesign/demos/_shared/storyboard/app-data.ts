// Content for the app pages outside a live session. Hero names, classes and stamina come
// from the dense fixture. Campaigns, notes, assets and the room code are invented here
// as placeholder, in the shapes the app already loads (CampaignSummary, NoteSummary,
// asset rows). Scene names are the session's own five, so the Film Strip matches Gate 2.
import type { ModeKey } from './shell';

export type Campaign = {
  id: string; name: string; blurb: string; scenes: ModeKey[]; names?: string[]; sessions: number; last: string;
  live?: boolean; director?: string;
};

export const campaigns: Campaign[] = [
  { id: 'bells', name: 'The Sunken Bells of Marrowmere', blurb: 'A drowned town, a missing bell-ringer and a thief who knows too much.', scenes: ['story', 'montage', 'negotiation', 'battle', 'respite'], names: ['Smoke Story Beat', 'A Chase Through a Trap Riddled Swamp', 'Negotiation with a Thief', 'Get the Sword!', 'Smoke Respite'], sessions: 3, last: 'Played today', live: true },
  { id: 'ashfall', name: 'Ashfall Road', blurb: 'Guard a caravan of glassblowers on a road that keeps catching fire.', scenes: ['story', 'battle', 'montage', 'battle'], names: ['The road at dawn', 'Glass wagons ambushed', 'Outrun the firestorm', 'The burning toll gate'], sessions: 1, last: 'Played Oct 24' },
  { id: 'lantern', name: 'The Lantern Fair', blurb: 'A one-shot at a night market where every stall sells a secret.', scenes: ['story', 'negotiation', 'respite'], names: ['Opening night', 'Haggle with the mask seller', 'A quiet stall after close'], sessions: 0, last: 'Not played yet' },
];

export const joined: Campaign[] = [
  { id: 'brine', name: 'Brinehollow Nights', blurb: 'Smugglers, a lighthouse and a storm that will not end.', scenes: ['story', 'negotiation', 'battle', 'respite'], names: ['Lights on the water', 'The harbourmaster’s price', 'Raid on the lamp room', 'Dry clothes at the inn'], sessions: 5, last: 'Played Oct 30', director: 'Mara Quill' },
];

export const live = { name: 'Session 3: The ferry', campaign: 'The Sunken Bells of Marrowmere', code: 'ZB7URGBU82', started: 'Started 11:58 AM', scene: 'Get the Sword!' };

export type Note = { id: string; title: string; folder: string; when: string; words: number };
export const notes: Note[] = [
  { id: 'prep3', title: 'Session 3 prep: the ferry', folder: 'Sunken Bells', when: 'Edited 11:40 AM', words: 412 },
  { id: 'lantern', title: 'Who lit the belfry lantern?', folder: 'Sunken Bells', when: 'Edited yesterday', words: 186 },
  { id: 'toll', title: 'Tollmen and their prices', folder: 'Sunken Bells', when: 'Edited Nov 5', words: 240 },
  { id: 'recap2', title: 'Recap: session 2', folder: 'Sunken Bells', when: 'Edited Nov 1', words: 530 },
  { id: 'ideas', title: 'Villain ideas', folder: 'Personal', when: 'Edited Oct 28', words: 95 },
  { id: 'house', title: 'House rules to try', folder: 'Personal', when: 'Edited Oct 20', words: 140 },
];

export const user = { director: { name: 'Dev Director', initials: 'DD' }, player: { name: 'Dev Player', initials: 'DP' } };
