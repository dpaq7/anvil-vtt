/**
 * Recruiting the Mercs - Negotiation Scene
 *
 * Pre-generated negotiation encounter from Draw Steel Encounters.
 * Convince Theophania "Grit" Griffin to lend her mercenary company to your cause.
 *
 * Attribution:
 * DRAW STEEL Encounters is an independent product published under the
 * DRAW STEEL Creator License and is not affiliated with MCDM Productions, LLC.
 */

import type { PregenNegotiationScene } from '../types.js';

export const RECRUITING_MERCS: PregenNegotiationScene = {
  id: 'pregen-recruiting-mercs',
  type: 'negotiation',
  name: 'Recruiting the Mercs',
  description: 'Negotiate with Theophania "Grit" Griffin, the serious and pragmatic leader of the Band of the Falcon mercenary company. Convince her to join your cause through appeals to her motivations.',
  source: 'Draw Steel Encounters',
  category: 'official',
  partySize: 4,
  partyLevel: 3,
  difficulty: 'moderate',
  tags: ['negotiation', 'social', 'mercenaries', 'recruitment', 'military'],

  template: {
    npc: {
      name: 'Theophania "Grit" Griffin',
      description: 'A battle-hardened human blackguard and leader of the Band of the Falcon. Grit earned her nickname from years of fighting in the harshest conditions. She took command of the mercenary company from her grandfather and is determined to restore its legendary reputation. She\'s serious, pragmatic, and has no patience for fools or time-wasters.',
      portraitUrl: undefined,
    },

    startingAttitude: 'neutral',
    startingInterest: 3,
    startingPatience: 3,
    impression: 3,

    impressionModifiers: [
      {
        id: 'im-military-background',
        condition: 'Hero has military background or experience leading troops',
        modifier: 2,
        appliesTo: ['Strategy', 'Lead', 'History'],
      },
      {
        id: 'im-noble-title',
        condition: 'Hero has noble title or significant political standing',
        modifier: 1,
        appliesTo: ['Society', 'Persuade'],
      },
      {
        id: 'im-known-reputation',
        condition: 'Hero has a reputation as a capable warrior or leader',
        modifier: 2,
        appliesTo: undefined, // Applies to all
      },
      {
        id: 'im-frivolous',
        condition: 'Hero makes jokes or doesn\'t take the meeting seriously',
        modifier: -2,
        appliesTo: undefined,
      },
      {
        id: 'im-weak-showing',
        condition: 'Hero appears weak, cowardly, or unprepared',
        modifier: -3,
        appliesTo: undefined,
      },
    ],

    motivations: [
      {
        id: 'mot-protection',
        type: 'protection',
        description: 'Keeping the Band of the Falcon safe. They are her family, and she will not throw their lives away for a lost cause or inadequate pay.',
        revealed: false,
      },
      {
        id: 'mot-legacy',
        type: 'legacy',
        description: 'Restoring the legendary reputation of her grandfather\'s mercenary band. The Band of the Falcon was once renowned across the realm, and Grit wants that glory again.',
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-peace',
        type: 'peace',
        description: 'Grit thrives on conflict and military work. Suggesting a peaceful solution, diplomacy over action, or that fighting is unnecessary will bore and frustrate her.',
        revealed: false,
      },
      {
        id: 'pit-revelry',
        type: 'revelry',
        description: 'Grit has no patience for jokes, frivolity, or celebrations. She considers such behavior unprofessional and a waste of time.',
        revealed: false,
      },
    ],

    characteristics: {
      might: 1,
      agility: 2,
      reason: 2,
      intuition: 2,
      presence: 1,
    },

    skills: [
      'Alertness',
      'History',
      'Interrogate',
      'Intimidate',
      'Lead',
      'Read Person',
      'Society',
      'Strategy',
    ],

    languages: [
      'Vaslorian (Native)',
      'Kalliak',
      'Khoursirian',
    ],

    responses: {
      interest0: {
        label: 'No, and...',
        text: '"Get out of my sight. I don\'t do business with fools, and I\'ll make sure every mercenary company in the region knows you\'re not worth their time. The Band of the Falcon has better things to do than listen to this drivel."',
      },
      interest1: {
        label: 'No.',
        text: '"I\'ve heard your pitch. It\'s not good enough. The Band of the Falcon needs work that will build our reputation, not diminish it. Come back when you have something worthy of our skills."',
      },
      interest2: {
        label: 'No, but...',
        text: '"I\'m not convinced this is right for us. But... if you can prove this job will bring glory to the Band of the Falcon, or if the pay significantly improves, we might talk again. For now, my answer is no."',
      },
      interest3: {
        label: 'Yes, but...',
        text: '"You make a fair case. The Band of the Falcon will ride with you... but there are conditions. We need half payment upfront, my soldiers\' safety must be prioritized, and if this goes badly, you bear the responsibility. Agreed?"',
      },
      interest4: {
        label: 'Yes.',
        text: '"You\'ve convinced me. The Band of the Falcon will join your cause. I expect fair pay and fair treatment for my soldiers. We\'ll draw up contracts and be ready to march within the week. Let\'s discuss the details."',
      },
      interest5: {
        label: 'Yes, and...',
        text: '"Not only will the Band of the Falcon fight for you, but you\'ve earned my personal respect. I\'ll lead the charge myself, and I\'ll share some tactical intelligence that might help your campaign. Consider us allies, not just hired swords."',
      },
    },
  },
};
