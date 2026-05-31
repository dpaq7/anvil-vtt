import type { SceneImportDocument } from '@anvil/types';
import { LORD_RELG_STATBLOCK } from '../lord-relg.js';
import type { MonsterFeature } from '../../types/monster.js';

interface DemoBattleToken {
  id: string;
  name: string;
  type: 'monster' | 'npc';
  x: number;
  y: number;
  size: number;
  color: number;
  monsterName?: string;
  level?: number;
  roles?: string[];
  maxStamina?: number;
  currentStamina?: number;
  squadId?: string;
  squadSize?: number;
  ev?: number | string;
  speed?: number | string;
  stability?: number | string;
  freeStrike?: number | string;
  characteristics?: {
    might?: number;
    agility?: number;
    reason?: number;
    intuition?: number;
    presence?: number;
  };
  ancestry?: string[];
  immunities?: string[];
  weaknesses?: string[];
  movement?: string;
  features?: MonsterFeature[];
  notes?: string;
}

function monster(token: Omit<DemoBattleToken, 'type' | 'color'> & { color?: number }): DemoBattleToken {
  return {
    ...token,
    type: 'monster',
    color: token.color ?? 0xef4444,
  };
}

function npc(token: Omit<DemoBattleToken, 'type' | 'color'> & { color?: number }): DemoBattleToken {
  return {
    ...token,
    type: 'npc',
    color: token.color ?? 0x22c55e,
  };
}

const chaseChallenges = [
  {
    id: 'track-villain',
    name: 'Track the Villain',
    description: "Search for tracks and keep on the villain's trail. This challenge can be completed twice.",
    suggestedCharacteristics: ['Reason', 'Intuition'],
    suggestedSkills: ['Climb', 'Search', 'Track'],
    completed: false,
  },
  {
    id: 'foggy-waters',
    name: 'Navigate the Foggy Waters',
    description: 'Cross leech-filled water, hidden pits, and fog-shrouded paths.',
    suggestedCharacteristics: ['Might', 'Agility', 'Reason'],
    suggestedSkills: ['Alertness', 'Endurance', 'Navigate', 'Swim'],
    completed: false,
  },
  {
    id: 'hungry-fauna',
    name: 'Ward off Hungry Fauna',
    description: 'Drive away gators and oversized insects looking for an easy meal.',
    suggestedCharacteristics: ['Reason', 'Presence'],
    suggestedSkills: ['Handle Animals', 'Intimidate', 'Perform'],
    completed: false,
  },
  {
    id: 'find-traps',
    name: 'Find the Traps',
    description: 'Spot tripwires, buried bear traps, and snares hidden by mud and leaves.',
    suggestedCharacteristics: ['Reason', 'Intuition'],
    suggestedSkills: ['Alertness', 'Search', 'Nature'],
    completed: false,
  },
  {
    id: 'disarm-traps',
    name: 'Disarm Traps',
    description: 'Clear trap triggers. Tests take a bane until Find the Traps is completed.',
    suggestedCharacteristics: ['Agility', 'Reason'],
    suggestedSkills: ['Escape Artist', 'Mechanics', 'Sabotage'],
    completed: false,
  },
  {
    id: 'swamp-wisps',
    name: 'Extinguish Swamp Wisps',
    description: 'Stop rot motes from creating illusions and leading the heroes in circles.',
    suggestedCharacteristics: ['Might', 'Reason', 'Presence'],
    suggestedSkills: ['Endurance', 'Intimidate', 'Magic', 'Nature'],
    completed: false,
  },
  {
    id: 'off-trail',
    name: 'Throw Them off the Trail',
    description: 'Round 2 event: hide in the slough or create distractions while continuing the pursuit.',
    suggestedCharacteristics: ['Reason', 'Intuition'],
    suggestedSkills: ['Disguise', 'Hide', 'Sneak', 'Track'],
    completed: false,
  },
  {
    id: 'repel-reinforcements',
    name: 'Repel the Reinforcements',
    description: 'Round 2 event: enemies glide through the trees and fire poison darts.',
    suggestedCharacteristics: ['Might', 'Agility', 'Presence'],
    suggestedSkills: ['Endurance', 'Intimidate', 'Jump', 'Strategy'],
    completed: false,
  },
];

const masqueradeChallenges = [
  {
    id: 'maneuver-merchants',
    name: 'Maneuver by Merchants',
    description: 'Navigate merchants selling exotic animals, strange meats, and dubious tinctures.',
    suggestedCharacteristics: ['Might', 'Agility', 'Presence'],
    suggestedSkills: ['Endurance', 'Hide', 'Intimidate', 'Sneak'],
    completed: false,
  },
  {
    id: 'acquire-leverage',
    name: 'Acquire Leverage',
    description: 'Capture incidental evidence among unmasked nobles dining on illicit exotic meats.',
    suggestedCharacteristics: ['Agility', 'Intuition', 'Presence'],
    suggestedSkills: ['Conceal Object', 'Hide', 'Perform', 'Search'],
    completed: false,
  },
  {
    id: 'exclusive-masks',
    name: 'Obtain Exclusive Masks',
    description: 'Secure masks that grant access to more private areas.',
    suggestedCharacteristics: ['Agility', 'Might', 'Presence'],
    suggestedSkills: ['Intimidate', 'Disguise', 'Pick Pocket', 'Track'],
    completed: false,
  },
  {
    id: 'secure-egress',
    name: 'Securing Egress',
    description: 'Determine the best way out once the Ringmaster is exposed.',
    suggestedCharacteristics: ['Might', 'Reason', 'Presence'],
    suggestedSkills: ['Endurance', 'Intimidate', 'Strategy', 'Track'],
    completed: false,
  },
  {
    id: 'rage-cage',
    name: 'Unleash the Rage in the Cage',
    description: 'Release fierce animals as a distraction. This alerts the Ringmaster and adds a bane to exposure tests.',
    suggestedCharacteristics: ['Agility', 'Reason', 'Intuition'],
    suggestedSkills: ['Escape Artist', 'Handle Animals', 'Monsters', 'Nature', 'Pick Lock', 'Sabotage'],
    completed: false,
  },
  {
    id: 'find-king',
    name: 'Find the King',
    description: 'Restricted area: identify the correct lion mask among many patrons.',
    suggestedCharacteristics: ['Reason', 'Intuition', 'Presence'],
    suggestedSkills: ['Alertness', 'Interrogate', 'Search', 'Eavesdrop', 'Read Person'],
    completed: false,
  },
  {
    id: 'split-pride',
    name: 'Split the Pride',
    description: 'Restricted area: separate lion-masked patrons to get a clear shot. Completion grants an edge on exposing the Ringmaster.',
    suggestedCharacteristics: ['Might', 'Intuition', 'Presence'],
    suggestedSkills: ['Intimidate', 'Perform', 'Society', 'Strategy', 'Flirt'],
    completed: false,
  },
  {
    id: 'arcane-expose',
    name: 'Arcane Expose',
    description: 'Unmask and capture the Ringmaster with the Arcane Oculus. Tests take a bane until Find the King is completed.',
    suggestedCharacteristics: ['Might', 'Agility', 'Reason'],
    suggestedSkills: ['Endurance', 'Intimidate', 'Pickpocket', 'Strategy'],
    completed: false,
  },
];

const saveTheHostageTokens: DemoBattleToken[] = [
  monster({ id: 'sth-bc-field', name: 'Bugbear Commander', monsterName: 'Bugbear Commander', x: 22, y: 14, size: 1, maxStamina: 80, currentStamina: 80, roles: ['elite', 'support'], level: 2 }),
  monster({ id: 'sth-bc-ritual', name: 'Bugbear Commander', monsterName: 'Bugbear Commander', x: 34, y: 13, size: 1, maxStamina: 80, currentStamina: 80, roles: ['elite', 'support'], level: 2 }),
  monster({ id: 'sth-roughneck', name: 'Bugbear Roughneck', monsterName: 'Bugbear Roughneck', x: 16, y: 29, size: 1, maxStamina: 109, currentStamina: 109, roles: ['elite', 'brute'], level: 2 }),
  monster({ id: 'sth-underboss-1', name: 'Goblin Underboss 1', monsterName: 'Goblin Underboss', x: 13, y: 28, size: 1, maxStamina: 15, currentStamina: 15, roles: ['horde', 'support'], level: 1 }),
  monster({ id: 'sth-underboss-2', name: 'Goblin Underboss 2', monsterName: 'Goblin Underboss', x: 32, y: 28, size: 1, maxStamina: 15, currentStamina: 15, roles: ['horde', 'support'], level: 1 }),
  ...[
    [4, 15], [10, 15], [13, 15], [17, 15], [31, 18], [35, 18], [37, 15], [37, 22],
  ].map(([x, y], index) => monster({
    id: `sth-sniper-${index + 1}`,
    name: `Goblin Sniper ${index + 1}`,
    monsterName: 'Goblin Sniper',
    x,
    y,
    size: 1,
    maxStamina: 3,
    currentStamina: 3,
    squadId: index < 4 ? 'sth-snipers-a' : 'sth-snipers-b',
    squadSize: 4,
    roles: ['minion', 'artillery'],
    level: 1,
  })),
  ...[
    [7, 27], [13, 30], [18, 25], [22, 28], [25, 26], [30, 28], [31, 34], [21, 27],
  ].map(([x, y], index) => monster({
    id: `sth-runner-${index + 1}`,
    name: `Goblin Runner ${index + 1}`,
    monsterName: 'Goblin Runner',
    x,
    y,
    size: 1,
    maxStamina: 4,
    currentStamina: 4,
    squadId: index < 4 ? 'sth-runners-a' : 'sth-runners-b',
    squadSize: 4,
    roles: ['minion', 'harrier'],
    level: 1,
  })),
  ...[
    [25, 8], [29, 10], [37, 12], [28, 15], [35, 16], [32, 18], [37, 18], [28, 11],
  ].map(([x, y], index) => monster({
    id: `sth-spinecleaver-${index + 1}`,
    name: `Goblin Spinecleaver ${index + 1}`,
    monsterName: 'Goblin Spinecleaver',
    x,
    y,
    size: 1,
    maxStamina: 5,
    currentStamina: 5,
    squadId: index < 4 ? 'sth-spinecleavers-a' : 'sth-spinecleavers-b',
    squadSize: 4,
    roles: ['minion', 'brute'],
    level: 1,
  })),
  npc({ id: 'sth-finn', name: 'Finn', x: 33, y: 13, size: 1, maxStamina: 10, currentStamina: 10, notes: 'Hostage. Takes 1 damage at the end of each round until rescued.' }),
];

const raceToTheSwordTokens: DemoBattleToken[] = [
  monster({ id: 'rts-cicero', name: 'Cicero', monsterName: 'Radenwight Piper', x: 15, y: 13, size: 1, maxStamina: 40, currentStamina: 40, roles: ['platoon', 'support'], level: 1 }),
  monster({ id: 'rts-ratcrobat-red', name: 'Radenwight Ratcrobat 1', monsterName: 'Radenwight Ratcrobat', x: 1, y: 16, size: 1, maxStamina: 30, currentStamina: 30, roles: ['platoon', 'harrier'], level: 1 }),
  monster({ id: 'rts-ratcrobat-blue', name: 'Radenwight Ratcrobat 2', monsterName: 'Radenwight Ratcrobat', x: 6, y: 15, size: 1, maxStamina: 30, currentStamina: 30, roles: ['platoon', 'harrier'], level: 1 }),
  monster({ id: 'rts-ratcrobat-yellow', name: 'Radenwight Ratcrobat 3', monsterName: 'Radenwight Ratcrobat', x: 9, y: 18, size: 1, maxStamina: 30, currentStamina: 30, roles: ['platoon', 'harrier'], level: 1 }),
  ...[
    [1, 18], [2, 17], [4, 16], [5, 16],
    [4, 14], [5, 13], [7, 14], [9, 13],
    [8, 16], [10, 16], [9, 20], [11, 19],
  ].map(([x, y], index) => monster({
    id: `rts-scrapper-${index + 1}`,
    name: `Radenwight Scrapper ${index + 1}`,
    monsterName: 'Radenwight Scrapper',
    x,
    y,
    size: 1,
    maxStamina: 5,
    currentStamina: 5,
    squadId: index < 4 ? 'rts-scrappers-red' : index < 8 ? 'rts-scrappers-blue' : 'rts-scrappers-yellow',
    squadSize: 4,
    roles: ['minion', 'defender'],
    level: 1,
  })),
];

const killLordRelgTokens: DemoBattleToken[] = [
  monster({
    id: 'klr-lord-relg',
    name: 'Lord Relg',
    x: 22,
    y: 13,
    size: 6,
    color: 0xdc2626,
    monsterName: LORD_RELG_STATBLOCK.name,
    level: 10,
    roles: [...(LORD_RELG_STATBLOCK.roles ?? ['Solo'])],
    ancestry: LORD_RELG_STATBLOCK.ancestry,
    ev: LORD_RELG_STATBLOCK.ev,
    maxStamina: 650,
    currentStamina: 650,
    speed: LORD_RELG_STATBLOCK.speed,
    stability: LORD_RELG_STATBLOCK.stability,
    freeStrike: LORD_RELG_STATBLOCK.free_strike,
    characteristics: {
      might: LORD_RELG_STATBLOCK.might,
      agility: LORD_RELG_STATBLOCK.agility,
      reason: LORD_RELG_STATBLOCK.reason,
      intuition: LORD_RELG_STATBLOCK.intuition,
      presence: LORD_RELG_STATBLOCK.presence,
    },
    immunities: LORD_RELG_STATBLOCK.immunities,
    weaknesses: LORD_RELG_STATBLOCK.weaknesses,
    movement: LORD_RELG_STATBLOCK.movement,
    features: LORD_RELG_STATBLOCK.features,
    notes: 'Level 10 Solo Abyssal Demon. Aura of Lethe within 3 squares; six intestines can grab size 3 or smaller creatures. Solo turns up to two per round, not consecutive.',
  }),
  ...[
    [3, 8], [4, 6], [5, 10], [6, 7],
    [9, 10], [12, 10], [15, 9], [18, 9],
    [21, 9], [24, 9], [27, 10], [31, 10],
    [39, 8], [40, 10], [42, 10], [43, 8],
  ].map(([x, y], index) => monster({
    id: `klr-optacus-${index + 1}`,
    name: `Optacus ${index + 1}`,
    monsterName: 'Optacus',
    x,
    y,
    size: 1,
    maxStamina: 14,
    currentStamina: 14,
    squadId: index < 4 ? 'klr-optacus-a' : index < 8 ? 'klr-optacus-b' : index < 12 ? 'klr-optacus-c' : 'klr-optacus-d',
    squadSize: 4,
    roles: ['minion', 'artillery'],
    level: 10,
  })),
  npc({ id: 'klr-noncombatant-1', name: 'Prisoner 1', x: 37, y: 19, size: 1, maxStamina: 8, currentStamina: 8 }),
  npc({ id: 'klr-noncombatant-2', name: 'Prisoner 2', x: 37, y: 21, size: 1, maxStamina: 8, currentStamina: 8 }),
  npc({ id: 'klr-noncombatant-3', name: 'Prisoner 3', x: 37, y: 23, size: 1, maxStamina: 8, currentStamina: 8 }),
];

export const MCDM_DRAW_STEEL_DEMO_CAMPAIGN: SceneImportDocument = {
  format: 'anvil.scene-import',
  version: 1,
  campaign: {
    name: 'MCDM Draw Steel Demo Scenes',
    description: 'Seven playable demo encounters imported from the PDFs in docs/MCDM Draw Steel Scenes.',
    settings: {
      source: 'docs/MCDM Draw Steel Scenes',
      ruleset: 'Draw Steel',
    },
  },
  modules: [
    {
      name: 'MCDM Draw Steel Demo Scenes',
      description: 'Montage, negotiation, and battle examples configured for Anvil scene play.',
      sessions: [
        {
          name: 'Demo Scene Pack',
          description: 'Official-style demonstration scenes encoded as Anvil scene data.',
          scenes: [
            {
              title: 'A Chase Through a Trap Riddled Swamp',
              type: 'montage',
              data: {
                sourcePdf: 'A Chase Through a Trap Riddled Swamp.pdf',
                directorSheet: 'A Chase Through a Trap Riddled Swamp Director Sheet.pdf',
                goal: 'Pursue a fleeing villain through a flooded woodland, survive the swamp traps, and catch up before the trail is lost.',
                difficulty: 'moderate',
                roundLimit: 2,
                heroCount: 5,
                successesNeeded: 6,
                failureLimit: 3,
                challenges: chaseChallenges,
                totalSuccess: 'The heroes catch the villain quickly and each earn 2 Victories.',
                partialSuccess: 'The heroes emerge from the swamp a little behind the villain and each earn 1 Victory.',
                totalFailure: 'The heroes lose the trail, scramble out of the bog, and lose half their recoveries.',
                notes: [
                  'While traps remain active, a hero who incurs a consequence causes the next hero to fall victim to a trap and take a bane on their next test unless they spend a recovery.',
                  'Starting in round 2, add Throw Them off the Trail and Repel the Reinforcements. The heroes take a bane on all tests until either round 2 challenge is completed.',
                  'Possible hooks: lizardfolk bandits fleeing with a sapphire crown, a kidnapped child pursued through Bogwolf territory, or a bounty hunter racing across the Darklakes.',
                  'Reward: Bog Buster title for a total success.',
                ].join('\n\n'),
              },
            },
            {
              title: 'Infiltrate the Animal Masquerade',
              type: 'montage',
              data: {
                sourcePdf: 'Infiltrate the Masquerade.pdf',
                directorSheet: 'Infiltrate the Masquerade Director Sheet.pdf',
                goal: 'Enter the exotic animal masquerade, identify Phinneas Glurch as the Ringmaster, capture proof with the Arcane Oculus, and escape.',
                difficulty: 'moderate',
                roundLimit: 2,
                heroCount: 5,
                successesNeeded: 6,
                failureLimit: 4,
                challenges: masqueradeChallenges,
                totalSuccess: 'The heroes expose Phinneas Glurch and escape without exposing themselves. Each hero earns 2 Victories.',
                partialSuccess: 'The heroes expose Phinneas Glurch, but are unmasked during the escape. Each hero earns 1 Victory and gains enemies among Capital nobility.',
                totalFailure: 'The heroes unmask the wrong lion or are discovered before getting proof, forcing them to flee.',
                notes: [
                  'Reaching the success limit does not end the test. The heroes cannot achieve better than partial success unless Arcane Expose is completed.',
                  'Acquire Leverage, Obtain Exclusive Masks, or Unleash the Rage in the Cage unlock access to restricted areas.',
                  'Password: Obsequious. Dougan Mulch provides exotic animal masks and the Arcane Oculus.',
                  'Rewards: Ringbreaker title for total success; Exposed title for total failure.',
                ].join('\n\n'),
              },
            },
            {
              title: 'Negotiation with a Thief',
              type: 'negotiation',
              data: {
                sourcePdf: 'Negotiation with a Thief.pdf',
                directorSheet: 'Negotiation with a Thief Director Sheet.pdf',
                template: {
                  npc: {
                    name: 'Volkir the Swipe',
                    description: "A stubborn young human pickpocket raised by the Q'irin crime family. She knows useful information but needs safety, leverage, and a way to strike back before she risks talking.",
                  },
                  startingAttitude: 'unfriendly',
                  startingInterest: 2,
                  startingPatience: 2,
                  impression: 1,
                  impressionModifiers: [
                    { id: 'native-language-one', condition: "One hero shares Volkir's native language, Zaliac.", modifier: 1, appliesTo: undefined },
                    { id: 'native-language-three', condition: "Three or more heroes share Volkir's native language, Zaliac.", modifier: 2, appliesTo: undefined },
                  ],
                  motivations: [
                    {
                      id: 'volkir-protection',
                      type: 'protection',
                      description: "Volkir needs assurance that she and selected family members will be safe before she betrays the Q'irin.",
                      revealed: false,
                    },
                    {
                      id: 'volkir-vengeance',
                      type: 'vengeance',
                      description: "Volkir wants the Q'irin humiliated, especially the boss who hurt her pride.",
                      revealed: false,
                    },
                  ],
                  pitfalls: [
                    {
                      id: 'volkir-revelry',
                      type: 'revelry',
                      description: 'Volkir acts tough and has no time for games. If the heroes help her realize she was being used, this pitfall can become a motivation.',
                      revealed: false,
                    },
                    {
                      id: 'volkir-greed',
                      type: 'greed',
                      description: 'Offers of coin insult her; she thinks the heroes are treating her like she cannot steal wealth herself.',
                      revealed: false,
                    },
                  ],
                  characteristics: { might: -1, agility: 1, reason: 0, intuition: 0, presence: 1 },
                  skills: ['Hide', 'Pick Lock', 'Pick Pocket'],
                  languages: ['Zaliac (Native)', 'Caelian', 'Szetch'],
                  responses: {
                    interest0: { label: 'No, and...', text: "Volkir calls off the deal and runs. For the next week, Q'irin agents harass the heroes whenever they start a respite." },
                    interest1: { label: 'No.', text: 'Volkir decides not to reveal any critical information.' },
                    interest2: { label: 'No, but...', text: 'Volkir does not feel safe enough to snitch, but the heroes receive an anonymous tip about a lieutenant of the boss.' },
                    interest3: { label: 'Yes, but...', text: "Volkir shares what she knows only after the heroes help her fake her death to fool the Q'irin." },
                    interest4: { label: 'Yes.', text: "Volkir nervously reveals everything she knows about the Q'irin family and leaves the rest to the heroes." },
                    interest5: { label: 'Yes, and...', text: 'Volkir reveals everything, joins the heroes as a retainer, and leads them into the family hideout.' },
                  },
                },
                notes: [
                  'If the heroes get useful information on the Q\'irin, they earn 1 Victory.',
                  'Retainer reward: Volkir the Swipe, if the negotiation ends at Interest 5.',
                  'Volkir curses in Zaliac when she cannot think of a fast response.',
                ].join('\n\n'),
              },
            },
            {
              title: 'Recruiting the Mercs',
              type: 'negotiation',
              data: {
                sourcePdf: 'Recruiting the Mercs.pdf',
                directorSheet: 'Recruiting the Mercs Director Sheet.pdf',
                template: {
                  npc: {
                    name: 'Theophania "Grit" Griffin',
                    description: 'The serious, practical leader of the Band of the Falcon. The Falcons need work, but Grit will only accept a job if the reward justifies the risk to her company.',
                  },
                  startingAttitude: 'neutral',
                  startingInterest: 3,
                  startingPatience: 3,
                  impression: 3,
                  impressionModifiers: [
                    { id: 'falcon-native-language-one', condition: "One hero shares Grit's native language, Vaslorian.", modifier: 1, appliesTo: undefined },
                    { id: 'falcon-native-language-three', condition: "Three or more heroes share Grit's native language, Vaslorian.", modifier: 2, appliesTo: undefined },
                  ],
                  motivations: [
                    {
                      id: 'grit-protection',
                      type: 'protection',
                      description: 'The Falcons are Grit\'s family, and she is responsible for their lives and livelihoods.',
                      revealed: false,
                    },
                    {
                      id: 'grit-legacy',
                      type: 'legacy',
                      description: "Grit wants to restore the Band of the Falcon to the legendary reputation it had under her grandfather, the Old Bird.",
                      revealed: false,
                    },
                  ],
                  pitfalls: [
                    {
                      id: 'grit-peace',
                      type: 'peace',
                      description: 'Peace is bad for mercenary business; Grit does not want a quiet or boring life.',
                      revealed: false,
                    },
                    {
                      id: 'grit-revelry',
                      type: 'revelry',
                      description: 'Grit has no patience for jokes, flattery, banter, or frivolity during business.',
                      revealed: false,
                    },
                  ],
                  characteristics: { might: 3, agility: 2, reason: 2, intuition: 0, presence: 2 },
                  skills: ['Alertness', 'History', 'Interrogate', 'Intimidate', 'Lead', 'Read Person', 'Society', 'Strategy'],
                  languages: ['Vaslorian (Native)', 'Kalliak', 'Khoursirian'],
                  responses: {
                    interest0: { label: 'No, and...', text: 'Grit refuses further dealings and badmouths the heroes to everyone she knows.' },
                    interest1: { label: 'No.', text: 'Grit thanks the heroes for the offer but declines. Nothing personal; just business.' },
                    interest2: { label: 'No, but...', text: 'Grit declines, but refers the heroes to a slightly disreputable gang of ex-bandits who might be interested.' },
                    interest3: { label: 'Yes, but...', text: 'Grit would take the job, but a rival gang is pressuring her grain merchant. The heroes must deal with them before the Falcons sign on.' },
                    interest4: { label: 'Yes.', text: 'Grit agrees to the job with a rare smile and a firm handshake.' },
                    interest5: { label: 'Yes, and...', text: "Grit agrees, and her high opinion of the heroes spreads through local mercenary circles. They are welcome in the Falcon's Camp." },
                  },
                },
                notes: [
                  'If the heroes gain the services of the Band of the Falcon, they earn 1 Victory.',
                  'Grit is honest, focused, and direct. She threatens only when someone cheats her or breaks a contract.',
                ].join('\n\n'),
              },
            },
            {
              title: 'Get the Sword!',
              type: 'battle',
              data: {
                sourcePdf: 'Race to the Sword.pdf',
                directorSheet: 'Race to the Sword Director Sheet.pdf',
                encounterMap: 'Enchanted Forest Map by Nick DeSpain',
                mapUrl: '/demo-scenes/race-to-the-sword-003.jpg',
                gridCols: 17,
                gridRows: 22,
                gridCellSize: 149,
                gridType: 'square',
                gridOpacity: 0,
                gridColor: '#444444',
                difficulty: 'standard',
                expectedEV: { min: 30, max: 36 },
                heroStart: { x: 4, y: 19, width: 3, height: 2 },
                tokens: raceToTheSwordTokens,
                initiativeGroups: [
                  { id: 'rts-initiative-cicero', name: 'Cicero', creatureIds: ['radenwight piper'] },
                  { id: 'rts-initiative-ratcrobats', name: 'Radenwight Ratcrobats', creatureIds: ['radenwight ratcrobat'] },
                  { id: 'rts-initiative-scrappers-red', name: 'Radenwight Scrappers 1-4', creatureIds: ['rts-scrappers-red'] },
                  { id: 'rts-initiative-scrappers-blue', name: 'Radenwight Scrappers 5-8', creatureIds: ['rts-scrappers-blue'] },
                  { id: 'rts-initiative-scrappers-yellow', name: 'Radenwight Scrappers 9-12', creatureIds: ['rts-scrappers-yellow'] },
                ],
                terrain: [
                  { id: 'rts-muddy-water-west', terrainId: 'terrain-difficult', name: 'Muddy Water', x: 4, y: 4, w: 4, h: 5, color: 0x3b82f6 },
                  { id: 'rts-muddy-water-east', terrainId: 'terrain-difficult', name: 'Muddy Water', x: 8, y: 4, w: 5, h: 5, color: 0x3b82f6 },
                  { id: 'rts-sword-rift', terrainId: 'terrain-relic', name: 'Old Sword and Sealed Rift', x: 7, y: 5, w: 2, h: 2, color: 0xa855f7 },
                ],
                notes: [
                  'Objective: leave the map with the sword for 1 Victory each. Destroy the abyssal rift for a second Victory.',
                  'Failure: the radenwights escape with the sword, the heroes are killed, or the heroes flee without the sword while demons are active.',
                  'Muddy water is difficult terrain. Radenwights avoid it if possible.',
                  'If the sword is removed, an abyssal rift opens and demons pour out. Add four Frenzied and three Ruinants along the cliffside. Destroyed demons are replaced at the start of each round until the rift is destroyed.',
                  'Abyssal Rift: size 1M immovable object, 25 Stamina, damage immunity 2, holy weakness 5. Adjacent Magic or Psionics test as a maneuver: tier 1 regains 5 Stamina, tier 2 deals 5 damage, tier 3 deals 13 damage.',
                  'Radenwight malice: Trouser Cut (3), Rally the Rodents (7). Demon malice: Soul Burn (3), Abyssal Evolution (7).',
                ].join('\n\n'),
                successCondition: 'The heroes leave the encounter map with the sword and optionally close the rift.',
                failureCondition: 'The radenwights escape with the sword, the heroes are killed, or the heroes flee without the sword while demons are active.',
                reinforcements: [
                  { name: 'Frenzied', count: 4, trigger: 'Sword removed' },
                  { name: 'Ruinant', count: 3, trigger: 'Sword removed' },
                ],
              },
            },
            {
              title: 'Save the Hostage from the Cult!',
              type: 'battle',
              data: {
                sourcePdf: 'Save the Hostage.pdf',
                directorSheet: 'Save The Hostage Director Sheet.pdf',
                encounterMap: "Helm's Deep from The MAD Cartographer",
                mapUrl: '/demo-scenes/save-the-hostage-001.jpg',
                gridCols: 42,
                gridRows: 35,
                gridCellSize: 70,
                gridType: 'square',
                gridOpacity: 0,
                gridColor: '#444444',
                difficulty: 'hard',
                expectedEV: { min: 61, max: 80 },
                heroStart: { x: 20, y: 31, width: 3, height: 2 },
                tokens: saveTheHostageTokens,
                terrain: [
                  { id: 'sth-river', terrainId: 'terrain-water', name: 'River', x: 17, y: 0, w: 3, h: 24, color: 0x3b82f6 },
                  { id: 'sth-main-gate-pillars', terrainId: 'terrain-mechanism', name: 'Main Gate Pillars', x: 31, y: 18, w: 4, h: 2, color: 0xf59e0b },
                  { id: 'sth-river-gate-pillars', terrainId: 'terrain-mechanism', name: 'River Gate Pillars', x: 15, y: 15, w: 5, h: 2, color: 0xf59e0b },
                ],
                notes: [
                  'Objective: escort Finn alive off the encounter map. The heroes earn 2 Victories each if Finn survives the escape.',
                  'Failure: Finn is killed or each hero is defeated.',
                  'Alarms: goblins are sluggish and do not sound alarms until attacked or a hero comes within 4 squares.',
                  'Castle walls are 4 squares high and slippery. Without Climbing, a hero must spend a maneuver in addition to a move action to ascend.',
                  'Black powder: five barrels can be lit with maneuvers during movement. A lit barrel explodes at the start of the next round, dealing 20 fire damage to adjacent creatures and destroying adjacent objects. Destroyed wall segments become difficult terrain.',
                  'Gates: the river gate has two support pillars and the main fortress gate has three. Destroying all pillars drops that gate. Gate cranks require two heroes to use main actions in the same round.',
                  'Ritual: Finn takes 1 damage at the end of each round. When a hero enters the ritual chamber, the commander kills Finn at the end of the next round unless interrupted. If the commander becomes winded, they focus on the heroes instead.',
                  'Goblin malice: Goblin Mode (3), Grab Iron Ball (3+), Grab Javelin (5+).',
                ].join('\n\n'),
                successCondition: 'The hostage is escorted alive off the encounter map.',
                failureCondition: 'The hostage is killed or the heroes are defeated.',
              },
            },
            {
              title: 'Kill Lord Relg!',
              type: 'battle',
              data: {
                sourcePdf: 'Kill Lord Relg!.pdf',
                directorSheet: 'Kill Lord Relg! Director Sheet.pdf',
                encounterMap: 'Great Wall (City Gate Night) from Czepeku',
                mapUrl: '/demo-scenes/kill-lord-relg-003.jpg',
                gridCols: 46,
                gridRows: 33,
                gridCellSize: 70,
                gridType: 'square',
                gridOpacity: 0,
                gridColor: '#444444',
                difficulty: 'hard',
                expectedEV: { min: 145, max: 192 },
                heroStart: { x: 22, y: 29, width: 6, height: 2 },
                tokens: killLordRelgTokens,
                terrain: [
                  { id: 'klr-rampart-edge', terrainId: 'terrain-fortification', name: 'Rampart Edge', x: 0, y: 11, w: 46, h: 2, color: 0x8b5cf6 },
                  { id: 'klr-gallows', terrainId: 'terrain-marker', name: 'Gallows and Prisoners', x: 36, y: 18, w: 3, h: 6, color: 0x22c55e },
                  { id: 'klr-siege-debris', terrainId: 'terrain-cover', name: 'Siege Debris', x: 7, y: 7, w: 8, h: 4, color: 0x64748b },
                ],
                notes: [
                  'Objective: reduce Lord Relg to 0 Stamina. Each hero earns 2 Victories.',
                  'Failure: each hero is defeated.',
                  'Relg wants to move deeper into Blackbottom and keep the heroes in Aura of Lethe. He uses intestines to punish anyone who keeps distance.',
                  'Prisoners: a hero can free one prisoner as a maneuver or all three as a main action. If at least two prisoners survive and escape, award the heroes a hero token.',
                  'Lord Relg: level 10 solo, size 6, speed 5, Stamina 650, Stability 3, Free Strike 10, weakness holy 2. Solo turns up to two per round, not consecutive.',
                  'Aura of Lethe: enemies starting within 3 squares roll d3 and subtract it from power rolls. New rolls are cumulative until they start outside the aura.',
                  'Writhing Intestines: six 5 x 1 lines within 1 square, each with 50 Stamina and psychic immunity all. Each can grab one size 3 or smaller creature or object.',
                  'Relg malice: Birth (3), Soul Rend (5), Solo Action (5), Lake of Oblivion (10), Siphon Memory (3).',
                ].join('\n\n'),
                successCondition: 'The heroes reduce Lord Relg to 0 Stamina, earning 2 Victories each.',
                failureCondition: 'Each hero is defeated.',
              },
            },
          ],
        },
      ],
    },
  ],
};
