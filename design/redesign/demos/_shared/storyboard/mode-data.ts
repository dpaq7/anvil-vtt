// What the four non-Battle modes carry, in the shapes the app already sends:
// Story `readAloudText` and `directorNotes`, Montage `successes`/`failures` against
// limits and a test log, Negotiation `interest`/`patience` with motivations and pitfalls,
// Respite `activities` with who claimed them. Every word of scene text, every NPC and
// every motivation is invented here as placeholder. Heroes are the dense fixture's seven.
import { hero } from '../battle';

export type ModeLog = { time: string; text: string }[];

// ---- Story ------------------------------------------------------------------
export const story = {
  slug: 'Exterior. The drowned chapel. Night.',
  readAloud: [
    'Rain needles the black water. The chapel ahead has sunk to its windowsills, and its bell tower leans like a tired drunk.',
    'A lantern burns in the belfry. Someone lit it tonight.',
    'Below the lantern a rope hangs into the water. It is still swinging.',
  ],
  directorNotes: [
    'The bell-ringer lit the lantern. He is hiding in the tower, and if the heroes shout, he cuts the rope.',
    'Odile knows the chapel was flooded on purpose. She says so only if asked twice.',
  ],
  npcs: [
    { name: 'Sister Odile Marchbank', note: 'Rows the boat', hidden: false },
    { name: 'Gaspard Lowe, the ferryman', note: 'Waits on the bank', hidden: false },
    { name: 'The bell-ringer', note: 'In the tower', hidden: true },
  ],
  log: [
    { time: '12:06 PM', text: 'Dev Director changed the read-aloud' },
    { time: '12:05 PM', text: 'Scene changed to Smoke Story Beat' },
    { time: '12:02 PM', text: 'Pip Underbough joined the table' },
    { time: '12:02 PM', text: 'Ysolde Fennimore joined the table' },
    { time: '12:01 PM', text: 'Torvald Brightmantle joined the table' },
    { time: '12:01 PM', text: 'Wren Halloway joined the table' },
    { time: '12:01 PM', text: 'Dovrin Ashgrove joined the table' },
    { time: '12:00 PM', text: 'Ilsabet Corvane joined the table' },
    { time: '12:00 PM', text: 'Smoke Beastheart joined the table' },
    { time: '12:00 PM', text: 'Session started' },
    { time: '11:58 AM', text: 'Dev Director opened the table' },
    { time: '11:58 AM', text: 'Dev Director added 5 scenes' },
    { time: '11:57 AM', text: 'Dev Director chose Smoke Story Beat first' },
  ] as ModeLog,
  sound: { name: 'Rain on black water', kind: 'Ambience, looping' },
};

// ---- Montage ------------------------------------------------------------------
export type Test = { skill: string; trait: string; roll: number; ok: boolean };
export const montage = {
  goal: 'Reach the ferry before the tollmen cut the rope',
  successes: 3, successLimit: 6, failures: 1, failureLimit: 3, round: 1, rounds: 2,
  tests: {
    [hero('Dovrin').id]: { skill: 'Climb', trait: 'MIG', roll: 14, ok: true },
    [hero('Ilsabet').id]: { skill: 'Swim', trait: 'MIG', roll: 13, ok: true },
    [hero('Wren').id]: { skill: 'Sneak', trait: 'AGI', roll: 8, ok: false },
    [hero('Torvald').id]: { skill: 'Lift', trait: 'MIG', roll: 17, ok: true },
  } as Record<string, Test>,
  challenges: [
    { name: 'The sunken boardwalk', text: 'Half the planks are gone. The rest are soft as bread.', skills: ['Jump', 'Climb'], state: 'cleared' as const },
    { name: 'The biting fog', text: 'A cloud of stinging flies hangs over the only dry path.', skills: ['Sneak', 'Navigate'], state: 'now' as const },
    { name: 'The ferry rope', text: 'Tollmen saw at the rope. Someone has to reach it first.', skills: ['Swim', 'Lift'], state: 'ahead' as const },
  ],
  outcomes: [
    { label: 'Total success', text: 'You cross before the rope is cut.' },
    { label: 'Partial success', text: 'You cross, but the tollmen follow.' },
    { label: 'Total failure', text: 'The rope is cut. Find another way.' },
  ],
  hazards: [
    'A sinkhole waits under the third plank. Whoever fails there loses their boots.',
    'After a second failure the tollmen spot the heroes and saw faster.',
  ],
  skills: ['Swim', 'Climb', 'Jump', 'Sneak', 'Navigate', 'Lift'],
  log: [
    { time: '12:41 PM', text: 'Torvald Brightmantle rolled Lift, 17. Success' },
    { time: '12:40 PM', text: 'Wren Halloway rolled Sneak, 8. Failure' },
    { time: '12:39 PM', text: 'Ilsabet Corvane rolled Swim, 13. Success' },
    { time: '12:38 PM', text: 'Dovrin Ashgrove rolled Climb, 14. Success' },
    { time: '12:37 PM', text: 'Round 1 began' },
    { time: '12:36 PM', text: 'Scene changed to A Chase Through a Trap Riddled Swamp' },
    { time: '12:30 PM', text: 'Dev Director changed the read-aloud' },
    { time: '12:05 PM', text: 'Scene changed to Smoke Story Beat' },
    { time: '12:00 PM', text: 'Session started' },
  ] as ModeLog,
};

// ---- Negotiation --------------------------------------------------------------
export const steps = ['No, and…', 'No.', 'No, but…', 'Yes, but…', 'Yes.', 'Yes, and…'];
export const negotiation = {
  npc: 'Maudrey Thistlewhite, Fence of the Lantern Market',
  npcFirst: 'Maudrey',
  attitude: 'Wary',
  goal: 'Talk Maudrey into selling the bell key',
  interest: 2, patience: 3, maxPatience: 5,
  motivations: [
    { id: 'm1', type: 'Greed', text: 'She wants enough coin to leave the city before winter.', revealed: true },
    { id: 'm2', type: 'Legacy', text: 'Her mother forged the bell key. She will not see it melted down.', revealed: false },
  ],
  pitfalls: [
    { id: 'p1', type: 'Higher authority', text: 'Mention the Watch and she ends the talk.', revealed: false },
    { id: 'p2', type: 'Power', text: 'Threaten her and the price doubles.', revealed: false },
  ],
  // Director only: what each Interest gets the heroes when the talk ends.
  outcomes: [
    'She calls her bodyguard and has you thrown out.',
    'She will not sell the key.',
    'She will not sell, but names who wants it.',
    'She sells for 300 gold and a favour owed.',
    'She sells for 150 gold.',
    'She gives the key and a map of the crypt.',
  ],
  argued: {
    [hero('Ysolde').id]: 'Persuade, +1',
    [hero('Wren').id]: 'Lie, −1',
    [hero('Dovrin').id]: 'Read Person, found Greed',
  } as Record<string, string>,
  across: [
    { name: 'Maudrey Thistlewhite', note: 'Wary' },
    { name: 'Tobin Ashcraft', note: 'Her bodyguard, silent' },
  ],
  skills: ['Persuade', 'Lie', 'Read Person', 'Flirt', 'Interrogate'],
  approach: 'We pay in silver tonight, and nobody melts the key.',
  log: [
    { time: '1:12 PM', text: 'Dovrin Ashgrove read her. Greed revealed' },
    { time: '1:10 PM', text: 'Wren Halloway tried Lie, 7. Interest −1' },
    { time: '1:08 PM', text: 'Ysolde Fennimore tried Persuade, 15. Interest +1' },
    { time: '1:06 PM', text: 'Scene changed to Negotiation with a Thief' },
    { time: '12:58 PM', text: 'Montage ended. Partial success' },
    { time: '12:41 PM', text: 'Torvald Brightmantle rolled Lift, 17. Success' },
    { time: '12:40 PM', text: 'Wren Halloway rolled Sneak, 8. Failure' },
    { time: '12:39 PM', text: 'Ilsabet Corvane rolled Swim, 13. Success' },
    { time: '12:38 PM', text: 'Dovrin Ashgrove rolled Climb, 14. Success' },
  ] as ModeLog,
};

// ---- Respite ------------------------------------------------------------------
export type Activity = { id: string; kind: 'Recover' | 'Craft' | 'Research' | 'Socialize' | 'Change kit'; text: string; by?: string; done?: boolean; project?: [number, number] };
export const respite = {
  place: 'the Hollow Oak waystation',
  goal: 'Rest at the Hollow Oak waystation',
  activities: [
    { id: 'a1', kind: 'Recover', text: 'Sleep by the fire', by: hero('Pip').id },
    { id: 'a2', kind: 'Recover', text: 'Bind your wounds', by: hero('Wren').id, done: true },
    { id: 'a3', kind: 'Recover', text: 'Sleep by the fire', by: hero('Torvald').id },
    { id: 'a4', kind: 'Craft', text: 'Carve a bone whistle', by: hero('Dovrin').id, project: [4, 12] },
    { id: 'a5', kind: 'Research', text: 'Read the chapel ledger', by: hero('Ilsabet').id, done: true },
    { id: 'a6', kind: 'Socialize', text: 'Drink with the drovers', by: hero('Ysolde').id, done: true },
    { id: 'a7', kind: 'Change kit', text: 'Swap your gear', by: hero('Smoke').id },
    { id: 'a8', kind: 'Research', text: 'Ask who lit the belfry lantern' },
    { id: 'a9', kind: 'Socialize', text: 'Win over the innkeeper' },
  ] as Activity[],
  projects: [
    { name: 'Bone whistle', who: 'Dovrin Ashgrove', cur: 4, goal: 12 },
    { name: 'The chapel ledger', who: 'Ilsabet Corvane', cur: 6, goal: 6 },
  ],
  kinds: [
    { kind: 'Recover', text: 'Rest and regain stamina' },
    { kind: 'Craft', text: 'Work on an item over time' },
    { kind: 'Research', text: 'Dig into a question' },
    { kind: 'Socialize', text: 'Spend time with people here' },
    { kind: 'Change kit', text: 'Swap weapons or armour' },
  ],
  log: [
    { time: '2:31 PM', text: 'Ysolde Fennimore finished Socialize' },
    { time: '2:30 PM', text: 'Ilsabet Corvane finished Research' },
    { time: '2:28 PM', text: 'Wren Halloway finished Recover' },
    { time: '2:24 PM', text: 'Smoke Beastheart claimed Change kit' },
    { time: '2:23 PM', text: 'Dovrin Ashgrove claimed Craft' },
    { time: '2:23 PM', text: 'Pip Underbough claimed Recover' },
    { time: '2:22 PM', text: 'Torvald Brightmantle claimed Recover' },
    { time: '2:20 PM', text: 'Scene changed to Smoke Respite' },
    { time: '2:18 PM', text: 'Combat ended. Heroes won' },
    { time: '2:02 PM', text: 'Cicero took 8 damage' },
  ] as ModeLog,
};
