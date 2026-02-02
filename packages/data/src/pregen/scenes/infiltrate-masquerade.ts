/**
 * Infiltrate the Animal Masquerade - Montage Scene
 *
 * Pre-generated montage encounter from Draw Steel Encounters.
 * A social/stealth montage test to unmask the corrupt Ringmaster.
 *
 * Attribution:
 * DRAW STEEL Encounters is an independent product published under the
 * DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC.
 */

import type { PregenMontageScene } from '../types.js';

export const INFILTRATE_MASQUERADE: PregenMontageScene = {
  id: 'pregen-infiltrate-masquerade',
  type: 'montage',
  name: 'Infiltrate the Animal Masquerade',
  description: 'Infiltrate an illegal exotic animal market disguised as a masquerade party in Capital. Unmask the corrupt Ringmaster Phinneas Glurch and capture evidence with the Arcane Oculus.',
  source: 'Draw Steel Encounters',
  category: 'official',
  partySize: 4,
  partyLevel: 1,
  difficulty: 'moderate',
  tags: ['stealth', 'social', 'investigation', 'urban', 'masquerade'],

  template: {
    title: 'Infiltrate the Animal Masquerade',
    goal: 'Infiltrate the Animal Masquerade, identify and unmask the Ringmaster, and photograph evidence of illegal activity.',
    description: 'The heroes must navigate a dangerous underworld event while maintaining their cover. The masquerade is hosted by criminal elements dealing in exotic and magical creatures.',

    difficulty: 'moderate',
    rounds: undefined, // No round limit

    baseSuccessLimit: 6,
    baseFailureLimit: 3,
    heroCountAdjustment: true,

    challenges: [
      {
        id: 'ch-password',
        name: 'Getting Past the Door',
        description: 'The entrance is guarded by a bouncer who requires a password. Heroes must either learn the password, bluff their way in, or find an alternate entrance.',
        category: 'restricted',
        suggestedSkills: ['Lie', 'Persuade', 'Sneak', 'Criminal Underworld'],
        specialNote: 'Edge if hero has criminal contacts. Bane if recognized as law enforcement.',
        unlockType: 'none',
        order: 0,
      },
      {
        id: 'ch-crowd',
        name: 'Navigate the Crowd',
        description: 'The main hall is packed with masked revelers, criminals, and merchants. Moving through without drawing attention requires careful navigation.',
        category: 'hazard',
        suggestedSkills: ['Navigate', 'Society', 'Read Person', 'Perform'],
        specialNote: 'Edge if wearing elaborate costume. Bane if not wearing a mask.',
        unlockType: 'none',
        order: 1,
      },
      {
        id: 'ch-restricted',
        name: 'Access the Restricted Area',
        description: 'The back rooms where the exotic animals are kept are off-limits to regular guests. Guards patrol the entrances.',
        category: 'restricted',
        suggestedSkills: ['Sneak', 'Lie', 'Criminal Underworld', 'Bribe'],
        specialNote: 'Edge if acquired VIP token or uniform. Bane if guards alerted.',
        unlockType: 'any_of',
        unlockChallengeIds: ['ch-password', 'ch-crowd'],
        order: 2,
      },
      {
        id: 'ch-identify',
        name: 'Identify the Ringmaster',
        description: 'Phinneas Glurch changes his mask frequently and moves through the crowd. Heroes must identify him through observation, questioning, or investigation.',
        category: 'general',
        suggestedSkills: ['Read Person', 'Alertness', 'Interrogate', 'Society'],
        specialNote: 'Edge if hero has seen Glurch before. Bane if Glurch warned.',
        unlockType: 'none',
        order: 3,
      },
      {
        id: 'ch-evidence',
        name: 'Capture Evidence',
        description: 'Use the Arcane Oculus to photograph illegal activities. Must get close enough without being caught.',
        category: 'hazard',
        suggestedSkills: ['Sneak', 'Timing', 'Magic Device', 'Distraction'],
        specialNote: 'Edge if distraction created. Bane if security increased.',
        unlockType: 'all_of',
        unlockChallengeIds: ['ch-identify'],
        order: 4,
      },
      {
        id: 'ch-escape',
        name: 'Extract Without Incident',
        description: 'Once the mission is complete, heroes must leave without raising the alarm.',
        category: 'general',
        suggestedSkills: ['Sneak', 'Lie', 'Navigate', 'Perform'],
        specialNote: 'Edge if not identified. Bane if alarm raised.',
        unlockType: 'none',
        order: 5,
      },
    ],

    hazards: [
      'Roaming guards on patrol',
      'Rival criminal groups may interfere',
      'The Arcane Oculus makes a faint clicking sound',
      'Creatures may escape causing chaos',
    ],

    outcomes: {
      totalSuccess: 'The heroes gather irrefutable evidence. The Arcane Oculus captures clear images of Phinneas Glurch. The authorities can now act. Heroes gain 2 Victories each.',
      partialSuccess: 'Some evidence gathered but circumstantial. The operation continues cautiously. Heroes may have been partially identified. Further investigation needed. Heroes gain 1 Victory each.',
      totalFailure: 'The heroes are exposed and must flee. Their identities may be known. The operation continues undisturbed with criminals on high alert.',
    },

    directorNotes: `DIRECTOR NOTES:

Key NPCs:
- Phinneas Glurch (Ringmaster): Charismatic, paranoid, wears animal masks
- Madame Velvet: Glurch's second-in-command, handles security
- "Whiskers": An informant willing to share information for coin

Environmental Details:
- The main hall features a central stage for "entertainment" (creature displays)
- Private alcoves allow discrete conversations
- The basement contains cages of exotic creatures
- Multiple exits: front door, service entrance, rooftop access

Potential Complications:
- A rival criminal group is also investigating Glurch
- One of the guards recognizes a hero from a past encounter
- A creature escapes, causing chaos
- A hero is invited to a private auction

The Arcane Oculus:
- Magical camera device provided by the client
- Takes 1 action to capture an image
- Makes a faint clicking sound (Alertness DC 15 to notice)
- Can store up to 12 images`,
  },
};
