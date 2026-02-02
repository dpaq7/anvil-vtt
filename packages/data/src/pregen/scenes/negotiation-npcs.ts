/**
 * Negotiation NPC Archetypes for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * These are archetypal NPCs for negotiation encounters, ranging from
 * local-level (Bandit Chief, Knight) to world-level (Lich, Deity).
 */

import type { PregenNegotiationScene } from '../types.js';
import type { MotivationType } from '@anvil/types';

/**
 * Helper to convert forgesteel NegotiationTrait to Anvil MotivationType
 */
function toMotivationType(trait: string): MotivationType {
  const mapping: Record<string, MotivationType> = {
    'Freedom': 'freedom',
    'Greed': 'greed',
    'Power': 'power',
    'Revelry': 'revelry',
    'HigherAuthority': 'higher_authority',
    'Justice': 'justice',
    'Legacy': 'legacy',
    'Peace': 'peace',
    'Benevolence': 'benevolence',
    'Discovery': 'discovery',
    'Protection': 'protection',
    'Vengeance': 'vengeance',
  };
  return mapping[trait] || 'benevolence';
}

// ---------------------------------------------------------------------------
// Local-Level NPCs (Impression 1-6)
// ---------------------------------------------------------------------------

export const BANDIT_CHIEF: PregenNegotiationScene = {
  id: 'negotiation-bandit-chief',
  type: 'negotiation',
  name: 'Bandit Chief',
  description: 'The bandit chief is a bully and a braggart, and most negotiate using intimidation and bluster before softening. Can also be used for any local big shot, such as the privileged child of a local lord, an arrogant tavern darts champion, or any bully.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partyLevel: 1,
  difficulty: 'easy',
  tags: ['local', 'criminal', 'intimidation', 'bandit'],

  template: {
    npc: {
      name: 'Bandit Chief',
      description: 'The bandit chief is a bully and a braggart, and most negotiate using intimidation and bluster before softening.',
    },

    startingAttitude: 'neutral',
    startingInterest: 2,
    startingPatience: 3,
    impression: 1,

    impressionModifiers: [],

    motivations: [
      {
        id: 'mot-freedom',
        type: 'freedom',
        description: 'No one tells me what to do—not if they want to keep their head on their shoulders. And no one tells my toughs what to do, except ME!',
        revealed: false,
      },
      {
        id: 'mot-greed',
        type: 'greed',
        description: 'Gold! I love the feel of shining, clinking coins running between my fingers. I never found something to spend it on that I like as much as just *having* gold.',
        revealed: false,
      },
      {
        id: 'mot-power',
        type: 'power',
        description: "I want a stronger hideout, more toughs, and a bigger share of the loot. Get me that, and I'll do your dirty work for you.",
        revealed: false,
      },
      {
        id: 'mot-revelry',
        type: 'revelry',
        description: "If you don't get drunk after a raid, then why have a raid?",
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-higher-authority',
        type: 'higher_authority',
        description: 'By order of the baron? You can keep your fancy titles and lands. I give the orders around here!',
        revealed: false,
      },
      {
        id: 'pit-justice',
        type: 'justice',
        description: 'Only the weak whine for justice. The strong make their own rules.',
        revealed: false,
      },
      {
        id: 'pit-legacy',
        type: 'legacy',
        description: "Listen, I don't care what happens when I'm gone. I want my followers shouting my name now, not in a hundred years.",
        revealed: false,
      },
      {
        id: 'pit-peace',
        type: 'peace',
        description: "In times of peace, if you pick up a silver coin that's not yours, the sheriff comes knocking on your door. In war, whole caravans disappear and nobody blinks. Give me war.",
        revealed: false,
      },
    ],

    characteristics: { might: 2, agility: 1, reason: 0, intuition: 1, presence: 1 },
    skills: ['Intimidate', 'Criminal Underworld', 'Lead'],
    languages: [],

    responses: {
      interest0: { label: 'No, and...', text: "Get out before I have my boys teach you a lesson you won't forget!" },
      interest1: { label: 'No.', text: "Not interested. Now scram before I change my mind about letting you leave." },
      interest2: { label: 'No, but...', text: "That's not enough. Come back with more gold or a better offer." },
      interest3: { label: 'Yes, but...', text: "Maybe we can work something out... if the price is right." },
      interest4: { label: 'Yes.', text: "Ha! Now you're speaking my language. We have a deal." },
      interest5: { label: 'Yes, and...', text: "I like you! Not only will I help, but I'll throw in some of my best fighters too." },
    },
  },
};

export const KNIGHT: PregenNegotiationScene = {
  id: 'negotiation-knight',
  type: 'negotiation',
  name: 'Knight',
  description: 'Although not always an idealist, the knight is a loyal servant of their liege and a stickler for duty. Can also be used for a village elder, town guard officer, or academic professor.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partyLevel: 1,
  difficulty: 'easy',
  tags: ['local', 'authority', 'military', 'noble'],

  template: {
    npc: {
      name: 'Knight',
      description: 'Although not always an idealist, the knight is a loyal servant of their liege and a stickler for duty. A knight knows their place in a regimented society, and believes that everyone else should keep to their own place.',
    },

    startingAttitude: 'neutral',
    startingInterest: 2,
    startingPatience: 3,
    impression: 2,

    impressionModifiers: [],

    motivations: [
      {
        id: 'mot-higher-authority',
        type: 'higher_authority',
        description: "That's above my pay grade. If my superiors sign off on it, then so do I.",
        revealed: false,
      },
      {
        id: 'mot-justice',
        type: 'justice',
        description: 'Thank you for bringing this to my attention. I agree, this must be put right. The only question is how.',
        revealed: false,
      },
      {
        id: 'mot-peace',
        type: 'peace',
        description: "People like us, we fight so that the common folk don't have to. If I must, I'll draw the sword again to keep the peace.",
        revealed: false,
      },
      {
        id: 'mot-revelry',
        type: 'revelry',
        description: 'Every agreement should be sealed with a toast. Huzzah!',
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-benevolence',
        type: 'benevolence',
        description: "These people don't need charity, they need order. Let them go to the town hall and they'll get a full belly in exchange for an honest day's work.",
        revealed: false,
      },
      {
        id: 'pit-freedom',
        type: 'freedom',
        description: 'None of us are free, from the lowliest servant on up. Even a monarch has a duty to their people.',
        revealed: false,
      },
      {
        id: 'pit-power',
        type: 'power',
        description: 'My power comes to me through my lawful oath, not by some dirty deal made in secret.',
        revealed: false,
      },
      {
        id: 'pit-vengeance',
        type: 'vengeance',
        description: "I believe in law, not vengeance, and law is decided by higher courts. I'm just a functionary.",
        revealed: false,
      },
    ],

    characteristics: { might: 2, agility: 1, reason: 1, intuition: 1, presence: 1 },
    skills: ['History', 'Lead', 'Society'],
    languages: [],

    responses: {
      interest0: { label: 'No, and...', text: "This is an insult to my honor. Guards! Remove these people from my sight!" },
      interest1: { label: 'No.', text: "I cannot help you. This matter is outside my authority." },
      interest2: { label: 'No, but...', text: "I cannot act without proper authorization, but perhaps if you spoke to my superiors..." },
      interest3: { label: 'Yes, but...', text: "I can assist, but everything must be done by the book. There will be paperwork." },
      interest4: { label: 'Yes.', text: "Very well. Your cause is just, and I will lend my aid." },
      interest5: { label: 'Yes, and...', text: "You have my sword and my word. I will also speak to my fellows—this cause deserves more support." },
    },
  },
};

export const GUILDMASTER: PregenNegotiationScene = {
  id: 'negotiation-guildmaster',
  type: 'negotiation',
  name: 'Guildmaster',
  description: 'The guildmaster knows the value of a coin, but understands that knowledge—inside information and trade secrets alike—is the most valuable currency. Can also be used for a cult leader, hag, or spy.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partyLevel: 2,
  difficulty: 'easy',
  tags: ['local', 'merchant', 'information', 'guild'],

  template: {
    npc: {
      name: 'Guildmaster',
      description: 'The guildmaster knows the value of a coin, but understands that knowledge—inside information and trade secrets alike—is the most valuable currency. They bargain accordingly.',
    },

    startingAttitude: 'neutral',
    startingInterest: 2,
    startingPatience: 3,
    impression: 3,

    impressionModifiers: [],

    motivations: [
      {
        id: 'mot-benevolence',
        type: 'benevolence',
        description: "The people can't take care of themselves. Somebody's got to look after them, the poor lambs.",
        revealed: false,
      },
      {
        id: 'mot-discovery',
        type: 'discovery',
        description: "It would be highly unethical for you to show me those schematics you obtained from a rival guild. Likewise, it would be highly unethical for me to slide you this bag of gold.",
        revealed: false,
      },
      {
        id: 'mot-power',
        type: 'power',
        description: "Who do you think will be in charge in the next age? The nobles? Pah! They still count their wealth in cows. Whoever controls the information will rule the world—and I intend for it to be us.",
        revealed: false,
      },
      {
        id: 'mot-protection',
        type: 'protection',
        description: "We have rivals—hungry opportunists who will stop at nothing. If I want to protect my guild, I've got to do unto them before they do unto us.",
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-higher-authority',
        type: 'higher_authority',
        description: "My loyalty is to the guild—not the burgomaster, not the king, not Ajax himself. But don't tell them I said that.",
        revealed: false,
      },
      {
        id: 'pit-justice',
        type: 'justice',
        description: "We're reshaping the world here. Of course, some people who can't adapt are going to find themselves on the bottom. But why should anyone blame us for that.",
        revealed: false,
      },
      {
        id: 'pit-peace',
        type: 'peace',
        description: "Conflict isn't bad in and of itself. It drives innovation. The key is not to be on the losing side.",
        revealed: false,
      },
      {
        id: 'pit-revelry',
        type: 'revelry',
        description: "I don't have time for this foolishness. Come talk to me again when you have something of value to show me.",
        revealed: false,
      },
    ],

    characteristics: { might: 0, agility: 1, reason: 2, intuition: 2, presence: 1 },
    skills: ['Eavesdrop', 'Forgery', 'Read Person', 'Society'],
    languages: [],

    responses: {
      interest0: { label: 'No, and...', text: "You've wasted my time and revealed yourselves as fools. I'll make sure every merchant in the city knows not to deal with you." },
      interest1: { label: 'No.', text: "There's nothing here for the guild. Good day." },
      interest2: { label: 'No, but...', text: "Not enough value in this for us... but if you brought something more interesting to trade..." },
      interest3: { label: 'Yes, but...', text: "The guild can help—for a price. And I'll need certain... assurances." },
      interest4: { label: 'Yes.', text: "A fair deal for both sides. The guild's resources are at your disposal." },
      interest5: { label: 'Yes, and...', text: "You've proven yourself a valuable contact. Not only will we help, but I have some information that might interest you—on the house." },
    },
  },
};

export const WARLORD: PregenNegotiationScene = {
  id: 'negotiation-warlord',
  type: 'negotiation',
  name: 'Warlord',
  description: 'The warlord has raised their banner and troops flock to their cause. Some say a warlord never negotiates, but that\'s not true. They\'re happy to listen to terms of surrender. Can also be used for a vampire, hobgoblin bloodlord, or rebellious noble.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partyLevel: 3,
  difficulty: 'moderate',
  tags: ['local', 'military', 'threat', 'conqueror'],

  template: {
    npc: {
      name: 'Warlord',
      description: "The warlord has raised their banner and troops flock to their cause. Some say a warlord never negotiates, but that's not true. They're happy to listen to terms of surrender.",
    },

    startingAttitude: 'neutral',
    startingInterest: 2,
    startingPatience: 3,
    impression: 4,

    impressionModifiers: [],

    motivations: [
      {
        id: 'mot-freedom',
        type: 'freedom',
        description: "I'm not paying a coin to some weakling liege lord for the privilege of being told what to do. I've raised my banner. I defy anyone to pull it down.",
        revealed: false,
      },
      {
        id: 'mot-legacy',
        type: 'legacy',
        description: "Did you see that young captain out there putting the fear of the gods into her troops? That's my kid, but she earned her title. Someday this will all be hers.",
        revealed: false,
      },
      {
        id: 'mot-peace',
        type: 'peace',
        description: "Look around you. Everywhere you look — weakness, corruption, waste. Peace is a noble goal, but we won't have peace until the current regime is swept away.",
        revealed: false,
      },
      {
        id: 'mot-vengeance',
        type: 'vengeance',
        description: "Have you suffered like I have at the hands of that accursed villain? If so, then I'll gladly call you friend.",
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-benevolence',
        type: 'benevolence',
        description: "Go back to your street corner and beg for alms if that's what you're after. You'll get nothing from me.",
        revealed: false,
      },
      {
        id: 'pit-discovery',
        type: 'discovery',
        description: "What does that have to do with me? I'm a soldier, not a scholar.",
        revealed: false,
      },
      {
        id: 'pit-justice',
        type: 'justice',
        description: 'You dare call me unjust? I make the laws here. Justice is mine to give or take away!',
        revealed: false,
      },
      {
        id: 'pit-protection',
        type: 'protection',
        description: "I'm not some sniveling coward who begs for protection, and neither are my troops. Anyone who asks for safety doesn't deserve it.",
        revealed: false,
      },
    ],

    characteristics: { might: 2, agility: 1, reason: 1, intuition: 1, presence: 2 },
    skills: ['Intimidate', 'Lead', 'Strategy'],
    languages: [],

    responses: {
      interest0: { label: 'No, and...', text: "Seize them! They'll make fine examples of what happens to those who waste my time." },
      interest1: { label: 'No.', text: "I don't negotiate with the weak. Leave before I change my mind." },
      interest2: { label: 'No, but...', text: "Not enough. But prove your worth on the battlefield and we'll talk again." },
      interest3: { label: 'Yes, but...', text: "Perhaps there's room for an alliance... if you prove your loyalty first." },
      interest4: { label: 'Yes.', text: "You speak sense. Together, we'll crush our enemies." },
      interest5: { label: 'Yes, and...', text: "Ha! I knew you had spine! You'll ride at my side, and together we'll forge a new order!" },
    },
  },
};

export const BURGOMASTER: PregenNegotiationScene = {
  id: 'negotiation-burgomaster',
  type: 'negotiation',
  name: 'Burgomaster',
  description: 'The burgomaster\'s power comes from their constituents, and for the most part, they aim to serve their people. Most burgomasters are experienced negotiators. Can also be used for a baron, governor, or watch captain in a metropolis.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partyLevel: 3,
  difficulty: 'moderate',
  tags: ['local', 'political', 'authority', 'civic'],

  template: {
    npc: {
      name: 'Burgomaster',
      description: "The burgomaster's power comes from their constituents, and for the most part, they aim to serve their people. Most burgomasters are experienced negotiators, never giving up any more than they mean to.",
    },

    startingAttitude: 'neutral',
    startingInterest: 2,
    startingPatience: 3,
    impression: 5,

    impressionModifiers: [],

    motivations: [
      {
        id: 'mot-greed',
        type: 'greed',
        description: "Keep talking. I'm sure we can come to an agreement that benefits all parties. A rising tide and all that.",
        revealed: false,
      },
      {
        id: 'mot-higher-authority',
        type: 'higher_authority',
        description: "No one can accuse me of being disloyal. What my duty demands, I do—but let's determine the most sensible way to go about it.",
        revealed: false,
      },
      {
        id: 'mot-justice',
        type: 'justice',
        description: 'The rule of law must be preserved. If you have evidence of crimes, those responsible must be punished.',
        revealed: false,
      },
      {
        id: 'mot-protection',
        type: 'protection',
        description: "The weak, the helpless—they depend upon me. And, to a lesser extent, civic-minded heroes like yourselves. Together, we'll make sure the people come to no harm.",
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-discovery',
        type: 'discovery',
        description: 'Trust me. No good is going to come from poking that particular beehive.',
        revealed: false,
      },
      {
        id: 'pit-freedom',
        type: 'freedom',
        description: "Freedom, eh? What's next, freedom from taxes? No one is born free except the gods, and only fools believe otherwise.",
        revealed: false,
      },
      {
        id: 'pit-revelry',
        type: 'revelry',
        description: "Put that bottle away. I'm a public figure! I can't be seen carousing and gallivanting and who knows what else.",
        revealed: false,
      },
      {
        id: 'pit-vengeance',
        type: 'vengeance',
        description: "In politics, you have to have a short memory. Your enemy today may be your ally tomorrow. There's no need to make things personal.",
        revealed: false,
      },
    ],

    characteristics: { might: 0, agility: 1, reason: 2, intuition: 2, presence: 2 },
    skills: ['Law', 'Lead', 'Persuade', 'Read Person', 'Society'],
    languages: [],

    responses: {
      interest0: { label: 'No, and...', text: "This meeting is over. Guards, escort them out—and make sure the gate guards know their faces." },
      interest1: { label: 'No.', text: "I'm afraid I can't help you with this matter. Good day." },
      interest2: { label: 'No, but...', text: "This isn't something I can do right now... but perhaps if circumstances changed..." },
      interest3: { label: 'Yes, but...', text: "The town can assist, but there will need to be certain... accommodations on your end." },
      interest4: { label: 'Yes.', text: "You make a compelling case. The resources of this office are at your disposal." },
      interest5: { label: 'Yes, and...', text: "Not only will I help, but I'll write letters of introduction to my counterparts in neighboring towns. Your cause deserves wider support." },
    },
  },
};

export const VIRTUOSO: PregenNegotiationScene = {
  id: 'negotiation-virtuoso',
  type: 'negotiation',
  name: 'Virtuoso',
  description: 'The virtuoso is the preeminent musician in the land—perhaps a celebrated opera singer or composer. If you need a cause popularized or an enemy\'s name tarnished, you come to them. Can also be used for a master crafter, inspired artist, famous gladiator, or world champion.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partyLevel: 3,
  difficulty: 'moderate',
  tags: ['local', 'celebrity', 'artist', 'influence'],

  template: {
    npc: {
      name: 'Virtuoso',
      description: "The virtuoso is the preeminent musician in the land—perhaps a celebrated opera singer or composer. If you need a cause popularized or an enemy's name tarnished, you come to them.",
    },

    startingAttitude: 'neutral',
    startingInterest: 2,
    startingPatience: 3,
    impression: 6,

    impressionModifiers: [],

    motivations: [
      {
        id: 'mot-freedom',
        type: 'freedom',
        description: 'I follow my muse, my only master. Who would dare put handcuffs on art?',
        revealed: false,
      },
      {
        id: 'mot-legacy',
        type: 'legacy',
        description: 'Castles will crumble. Empires will fall. But if I can only produce a work worthy of my talents, my name will live forever.',
        revealed: false,
      },
      {
        id: 'mot-peace',
        type: 'peace',
        description: 'In war, bronze statues are melted down for armor. Money is wasted on ballistae instead of ballads. War is a crime against the god of art.',
        revealed: false,
      },
      {
        id: 'mot-revelry',
        type: 'revelry',
        description: 'Yes, tonight let us celebrate! Inspiration looks down kindly on those who drink life to the dregs.',
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-greed',
        type: 'greed',
        description: 'You offer me money? Money comes to geniuses—it is our due. I can get it from a thousand admirers.',
        revealed: false,
      },
      {
        id: 'pit-power',
        type: 'power',
        description: "I have no ambitions beyond this opera house. For me to leave this place, even for a palace or a throne … it would be an exile for me.",
        revealed: false,
      },
      {
        id: 'pit-protection',
        type: 'protection',
        description: "I'm not afraid. The god of music will look after her own.",
        revealed: false,
      },
      {
        id: 'pit-vengeance',
        type: 'vengeance',
        description: 'Perhaps there are some who hate me—those who think I stand in their way, or whose accomplishments I have eclipsed. But I hate no one and am jealous of no one.',
        revealed: false,
      },
    ],

    characteristics: { might: 0, agility: 2, reason: 1, intuition: 2, presence: 3 },
    skills: ['Music', 'Perform', 'Flirt', 'Society'],
    languages: [],

    responses: {
      interest0: { label: 'No, and...', text: "How dare you! I shall compose a ballad about your boorishness that will follow you to your grave!" },
      interest1: { label: 'No.', text: "I'm afraid my art cannot be bought. Please leave me to my work." },
      interest2: { label: 'No, but...', text: "I cannot help you now... but your story intrigues me. Perhaps we could discuss it further over wine?" },
      interest3: { label: 'Yes, but...', text: "I might be persuaded to lend my voice to your cause... if you can offer proper patronage." },
      interest4: { label: 'Yes.', text: "Your tale has moved me! I shall compose something magnificent in your honor." },
      interest5: { label: 'Yes, and...', text: "Magnificent! Not only shall I sing your praises, but I shall introduce you to all the nobility of the realm at my next performance!" },
    },
  },
};

// ---------------------------------------------------------------------------
// National-Level NPCs (Impression 7-9)
// ---------------------------------------------------------------------------

export const HIGH_PRIEST: PregenNegotiationScene = {
  id: 'negotiation-high-priest',
  type: 'negotiation',
  name: 'High Priest',
  description: 'The high priest might be a high-ranking member of their faith, but as they are quick to tell you, that doesn\'t make them free to act as they wish. Can also be used for a count, judge, or general.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partyLevel: 5,
  difficulty: 'moderate',
  tags: ['national', 'religious', 'authority', 'temple'],

  template: {
    npc: {
      name: 'High Priest',
      description: "The high priest might be a high-ranking member of their faith, but as they are quick to tell you, that doesn't make them free to act as they wish. The commands of their deity must be paramount.",
    },

    startingAttitude: 'neutral',
    startingInterest: 2,
    startingPatience: 3,
    impression: 7,

    impressionModifiers: [],

    motivations: [
      {
        id: 'mot-benevolence',
        type: 'benevolence',
        description: 'We are agreed on this matter. If this threat puts people in danger, we must come to their rescue.',
        revealed: false,
      },
      {
        id: 'mot-discovery',
        type: 'discovery',
        description: 'Why, yes ... I would be interested in looking at that document further. Surely no harm can come from being aware of the snares and dangers in the world.',
        revealed: false,
      },
      {
        id: 'mot-higher-authority',
        type: 'higher_authority',
        description: 'Indeed, my appointed duty is to serve all folk—whether it be my deity, my liege, or the poorest person crying out in need.',
        revealed: false,
      },
      {
        id: 'mot-justice',
        type: 'justice',
        description: 'Rest assured, the good will receive their just reward, and the evil will be punished. I will see to it.',
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-greed',
        type: 'greed',
        description: "Don't offer that to me. Donate it to the faith if you have no need of it.",
        revealed: false,
      },
      {
        id: 'pit-legacy',
        type: 'legacy',
        description: "Me? I am no one. My good deeds I might have accomplished are to my deity's credit, not my own.",
        revealed: false,
      },
      {
        id: 'pit-power',
        type: 'power',
        description: 'My current responsibilities are quite enough. I have no desire for more.',
        revealed: false,
      },
      {
        id: 'pit-revelry',
        type: 'revelry',
        description: 'For shame! Do you boast of doing evil and expect me to join you in it?',
        revealed: false,
      },
    ],

    characteristics: { might: 0, agility: 0, reason: 2, intuition: 3, presence: 2 },
    skills: ['Religion', 'Persuade', 'Read Person', 'History'],
    languages: [],

    responses: {
      interest0: { label: 'No, and...', text: "You seek to corrupt the faithful? Begone! And know that the temple doors are forever closed to you!" },
      interest1: { label: 'No.', text: "I cannot help you. This does not align with the teachings of my faith." },
      interest2: { label: 'No, but...', text: "I cannot act now... but perhaps if you demonstrate your devotion to righteous causes..." },
      interest3: { label: 'Yes, but...', text: "The temple can assist, but you must understand our resources are dedicated to the faithful first." },
      interest4: { label: 'Yes.', text: "Your cause is righteous. The blessings of the temple are with you." },
      interest5: { label: 'Yes, and...', text: "Truly, you are doing the work of the divine! Take this holy relic—it will aid you in your quest." },
    },
  },
};

export const DUKE: PregenNegotiationScene = {
  id: 'negotiation-duke',
  type: 'negotiation',
  name: 'Duke',
  description: 'As the duke gestures you to join them at their card table, spies whisper in their ear. The duke never plays a game or enters a negotiation unless they think they can gain the high card. Can also be used for an archmage, spymaster, vizier, or even a beloved jester.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partyLevel: 5,
  difficulty: 'hard',
  tags: ['national', 'political', 'intrigue', 'nobility'],

  template: {
    npc: {
      name: 'Duke',
      description: "As the duke gestures you to join them at their card table, spies whisper in their ear. The duke never plays a game or enters a negotiation unless they think they can gain the high card.",
    },

    startingAttitude: 'neutral',
    startingInterest: 2,
    startingPatience: 3,
    impression: 8,

    impressionModifiers: [],

    motivations: [
      {
        id: 'mot-discovery',
        type: 'discovery',
        description: 'My agents have brought me many whispers, but this is news to me. Who else knows of this?',
        revealed: false,
      },
      {
        id: 'mot-higher-authority',
        type: 'higher_authority',
        description: 'I must do as my liege commands. So tell me how you seek to serve them as well.',
        revealed: false,
      },
      {
        id: 'mot-peace',
        type: 'peace',
        description: 'We must have stability. I will sacrifice anything—and anyone—for this.',
        revealed: false,
      },
      {
        id: 'mot-vengeance',
        type: 'vengeance',
        description: 'There is one—I will not speak their name—who thinks I have forgotten what they did to me. Someday they will discover that I have a long memory.',
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-benevolence',
        type: 'benevolence',
        description: "Do you think I act because I love my fellow people? Half of them are worthless, and the other half are villains. But without them, I'd be the Duke of Nothing, so I must preserve them.",
        revealed: false,
      },
      {
        id: 'pit-greed',
        type: 'greed',
        description: "Put away your gold. I'm far too busy to spend it.",
        revealed: false,
      },
      {
        id: 'pit-justice',
        type: 'justice',
        description: 'Right and wrong? There is no right, except what strengthens the kingdom, and there is no wrong except what hurts it.',
        revealed: false,
      },
      {
        id: 'pit-protection',
        type: 'protection',
        description: "I don't care about saving lives. We're all doomed to die. The question is, what will live on after us?",
        revealed: false,
      },
    ],

    characteristics: { might: 0, agility: 1, reason: 3, intuition: 2, presence: 2 },
    skills: ['Eavesdrop', 'Read Person', 'Society', 'Strategy'],
    languages: [],

    responses: {
      interest0: { label: 'No, and...', text: "You've revealed your hand too soon. My agents will be watching you—and everyone you care about." },
      interest1: { label: 'No.', text: "I see no advantage in this arrangement. Good day." },
      interest2: { label: 'No, but...', text: "Not yet... but bring me something of value—information, perhaps—and we may speak again." },
      interest3: { label: 'Yes, but...', text: "Perhaps we can help each other... but first, you must do something for me." },
      interest4: { label: 'Yes.', text: "You play the game well. Consider yourself under my protection." },
      interest5: { label: 'Yes, and...', text: "Magnificent! You've earned a seat at my table. Let me share what my spies have learned—you'll find this most interesting." },
    },
  },
};

export const DRAGON: PregenNegotiationScene = {
  id: 'negotiation-dragon',
  type: 'negotiation',
  name: 'Dragon',
  description: 'The dragon\'s tremendous might is overshadowed only by their boundless ambition and pride. Can also be used for a fire giant chief, a contender for a throne, or the dread synliroi Lord Syuul.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partyLevel: 7,
  difficulty: 'hard',
  tags: ['national', 'threat', 'monster', 'powerful'],

  template: {
    npc: {
      name: 'Dragon',
      description: "The dragon's tremendous might is overshadowed only by their boundless ambition and pride.",
    },

    startingAttitude: 'neutral',
    startingInterest: 2,
    startingPatience: 3,
    impression: 9,

    impressionModifiers: [],

    motivations: [
      {
        id: 'mot-freedom',
        type: 'freedom',
        description: "Yes, my ambitions have been bound to the earth far too long. It's time I took flight.",
        revealed: false,
      },
      {
        id: 'mot-greed',
        type: 'greed',
        description: 'Bring me tribute now, and when I rule, I will not forget you.',
        revealed: false,
      },
      {
        id: 'mot-protection',
        type: 'protection',
        description: 'My people have been mistreated for centuries. It ends now!',
        revealed: false,
      },
      {
        id: 'mot-vengeance',
        type: 'vengeance',
        description: 'This land, these people, their treasures, rightfully mine. Stolen from me!',
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-legacy',
        type: 'legacy',
        description: 'No heir will outlive me, no legend will remember my past glory ... for I shall never die!',
        revealed: false,
      },
      {
        id: 'pit-peace',
        type: 'peace',
        description: 'You want to make peace? When there are still things in the world that are not yet mine?',
        revealed: false,
      },
      {
        id: 'pit-power',
        type: 'power',
        description: 'How can *you* possibly offer *me* power?',
        revealed: false,
      },
      {
        id: 'pit-revelry',
        type: 'revelry',
        description: 'My pleasures are as far beyond your comprehension as yours are to a worm.',
        revealed: false,
      },
    ],

    characteristics: { might: 4, agility: 2, reason: 3, intuition: 2, presence: 3 },
    skills: ['Intimidate', 'History', 'Read Person'],
    languages: ['Caelian (Draconic)'],

    responses: {
      interest0: { label: 'No, and...', text: "You DARE waste my time? I shall burn everything you love to ash!" },
      interest1: { label: 'No.', text: "Begone, mortal. You have nothing I want." },
      interest2: { label: 'No, but...', text: "Insufficient... but bring me a worthy tribute and I may reconsider." },
      interest3: { label: 'Yes, but...', text: "Perhaps you are not entirely useless. Serve me, and I shall let you live." },
      interest4: { label: 'Yes.', text: "You have wisdom beyond your kind. Very well—we have an accord." },
      interest5: { label: 'Yes, and...', text: "HA! You amuse me, little one! Not only shall I aid you, but you shall fly under my protection. None shall dare touch you!" },
    },
  },
};

// ---------------------------------------------------------------------------
// Kingdom-Level NPCs (Impression 10-11)
// ---------------------------------------------------------------------------

export const MONARCH: PregenNegotiationScene = {
  id: 'negotiation-monarch',
  type: 'negotiation',
  name: 'Monarch',
  description: 'Whether they\'re good or evil, a monarch is accustomed to authority—and wants to keep it. They respond better to pleas than to demands. Can also be used for a tyrant, a theocracy\'s archpriest, or a republic\'s consul.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partyLevel: 7,
  difficulty: 'hard',
  tags: ['kingdom', 'royalty', 'authority', 'ruler'],

  template: {
    npc: {
      name: 'Monarch',
      description: "Whether they're good or evil, a monarch is accustomed to authority—and wants to keep it. They respond better to pleas than to demands.",
    },

    startingAttitude: 'neutral',
    startingInterest: 2,
    startingPatience: 3,
    impression: 10,

    impressionModifiers: [],

    motivations: [
      {
        id: 'mot-benevolence',
        type: 'benevolence',
        description: 'It\'s not for nothing I\'m called "the Good."',
        revealed: false,
      },
      {
        id: 'mot-greed',
        type: 'greed',
        description: 'Your offer intrigues me. In truth, our coffers are not as full as I should like.',
        revealed: false,
      },
      {
        id: 'mot-justice',
        type: 'justice',
        description: 'Ah, do the villains ignore my laws? They must be punished!',
        revealed: false,
      },
      {
        id: 'mot-legacy',
        type: 'legacy',
        description: 'If I should die, promise me this: you will serve my heir as loyally as you have served me.',
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-discovery',
        type: 'discovery',
        description: "Keep your secrets to yourself. I'm a monarch, not a spymaster.",
        revealed: false,
      },
      {
        id: 'pit-freedom',
        type: 'freedom',
        description: "Freedom? Some of my disloyal subjects speak that word a little too often for my liking. I hope you're not one of them.",
        revealed: false,
      },
      {
        id: 'pit-higher-authority',
        type: 'higher_authority',
        description: 'You dare give orders to me? Never forget, no matter who sent you, I rule here!',
        revealed: false,
      },
      {
        id: 'pit-vengeance',
        type: 'vengeance',
        description: "Revenge is an exciting sport. Sadly, it's one I've had to give up. It's policy, not revenge, that rules here.",
        revealed: false,
      },
    ],

    characteristics: { might: 1, agility: 1, reason: 2, intuition: 2, presence: 3 },
    skills: ['Lead', 'Society', 'Strategy', 'History'],
    languages: [],

    responses: {
      interest0: { label: 'No, and...', text: "GUARDS! Take them to the dungeons. We shall discuss their insolence at length." },
      interest1: { label: 'No.', text: "The crown has no interest in this matter. You are dismissed." },
      interest2: { label: 'No, but...', text: "Not at this time... but we are not unsympathetic. Return when circumstances favor your cause." },
      interest3: { label: 'Yes, but...', text: "The crown may assist... but you must understand that royal favor comes with expectations." },
      interest4: { label: 'Yes.', text: "You have pleased us. The resources of the realm shall support your endeavor." },
      interest5: { label: 'Yes, and...', text: "Magnificent! Not only shall we support you, but we shall knight you for your service to the crown!" },
    },
  },
};

export const LICH: PregenNegotiationScene = {
  id: 'negotiation-lich',
  type: 'negotiation',
  name: 'Lich',
  description: 'The lich spent centuries alone, studying and building their power … but now the time for studying is over. They\'re willing to negotiate with strong heroes who might make loyal lieutenants—or powerful undead servants. Can also be used for a would-be emperor or Count Rhodar von Glauer.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partyLevel: 9,
  difficulty: 'hard',
  tags: ['kingdom', 'undead', 'threat', 'powerful'],

  template: {
    npc: {
      name: 'Lich',
      description: "The lich spent centuries alone, studying and building their power … but now the time for studying is over. They're willing to negotiate with strong heroes who might make loyal lieutenants—or powerful undead servants if the talks don't go well.",
    },

    startingAttitude: 'neutral',
    startingInterest: 2,
    startingPatience: 3,
    impression: 11,

    impressionModifiers: [],

    motivations: [
      {
        id: 'mot-discovery',
        type: 'discovery',
        description: 'Give me that book at once! Your very touch corrupts it.',
        revealed: false,
      },
      {
        id: 'mot-power',
        type: 'power',
        description: 'Yes … yes … power! Ahahahaha! Bring me this power and you will be rewarded.',
        revealed: false,
      },
      {
        id: 'mot-revelry',
        type: 'revelry',
        description: 'Join my court for the coming feast! We shall know such entertainments as were never seen in this world before.',
        revealed: false,
      },
      {
        id: 'mot-vengeance',
        type: 'vengeance',
        description: 'The world despised me … banished me … forgot me. The world shall regret it.',
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-benevolence',
        type: 'benevolence',
        description: "Do you ask the farmer to pity the wheat before it's harvested?",
        revealed: false,
      },
      {
        id: 'pit-legacy',
        type: 'legacy',
        description: "I don't care what the common people think of me. The less they think of me, the better—as long as they obey my commands.",
        revealed: false,
      },
      {
        id: 'pit-peace',
        type: 'peace',
        description: 'Yes, yes, peace will come … but not now.',
        revealed: false,
      },
      {
        id: 'pit-protection',
        type: 'protection',
        description: "If you're so intent on saving lives, then save your own by bowing down before me! No harm will come to my servants.",
        revealed: false,
      },
    ],

    characteristics: { might: 1, agility: 1, reason: 4, intuition: 3, presence: 2 },
    skills: ['Arcana', 'History', 'Intimidate', 'Read Person'],
    languages: [],

    responses: {
      interest0: { label: 'No, and...', text: "You have wasted my ETERNAL time! RISE, my servants! Teach these fools the meaning of TRUE death!" },
      interest1: { label: 'No.', text: "Begone. You are beneath my notice." },
      interest2: { label: 'No, but...', text: "Not yet worthy... but perhaps if you brought me an artifact of power..." },
      interest3: { label: 'Yes, but...', text: "Interesting... I may have use for you. But first, you must prove your loyalty." },
      interest4: { label: 'Yes.', text: "You have potential. Serve me well, and I shall grant you powers beyond mortal ken." },
      interest5: { label: 'Yes, and...', text: "EXCELLENT! You shall be my champions! I bestow upon you a fragment of my immortal power—use it wisely!" },
    },
  },
};

// ---------------------------------------------------------------------------
// World-Level NPC (Impression 12)
// ---------------------------------------------------------------------------

export const DEITY: PregenNegotiationScene = {
  id: 'negotiation-deity',
  type: 'negotiation',
  name: 'Deity',
  description: 'The deity will listen to your prayers—and might perhaps answer them as well, if the mood strikes them. Can also be used for the legendary time dragon Cthrion Uroniziir, or the dread pharaoh Khorsekef the Infinite.',
  source: 'Forgesteel (GPL-3.0)',
  category: 'official',
  partyLevel: 10,
  difficulty: 'hard',
  tags: ['world', 'divine', 'cosmic', 'all-powerful'],

  template: {
    npc: {
      name: 'Deity',
      description: 'The deity will listen to your prayers—and might perhaps answer them as well, if the mood strikes them.',
    },

    startingAttitude: 'neutral',
    startingInterest: 2,
    startingPatience: 3,
    impression: 12,

    impressionModifiers: [],

    motivations: [
      {
        id: 'mot-benevolence',
        type: 'benevolence',
        description: 'Worry not, for I have sent champions to save the world. Perhaps these champions … are closer than you think.',
        revealed: false,
      },
      {
        id: 'mot-legacy',
        type: 'legacy',
        description: 'When that blessed day arrives, all shall come before me to pray, and I shall offer my blessings to the world!',
        revealed: false,
      },
      {
        id: 'mot-power',
        type: 'power',
        description: 'Although I am all-powerful on the spiritual realm, my hands are bound in such worldly matters. But if you act for me, I can offer a little assistance.',
        revealed: false,
      },
      {
        id: 'mot-protection',
        type: 'protection',
        description: 'Have faith, little one … none will be forgotten or left behind.',
        revealed: false,
      },
    ],

    pitfalls: [
      {
        id: 'pit-discovery',
        type: 'discovery',
        description: 'Mortal, what can you tell me that I do not know?',
        revealed: false,
      },
      {
        id: 'pit-freedom',
        type: 'freedom',
        description: 'True freedom lies in service to me. Surrender your freedom and I shall raise you up high.',
        revealed: false,
      },
      {
        id: 'pit-greed',
        type: 'greed',
        description: 'Fool! Do you seek to offer me what is mine?',
        revealed: false,
      },
      {
        id: 'pit-higher-authority',
        type: 'higher_authority',
        description: 'Who do you speak of? Who is beyond me, who is above me? Who will live to see me die, and who drew breath before I gave it? Let them come forth and say their name!',
        revealed: false,
      },
    ],

    characteristics: { might: 5, agility: 5, reason: 5, intuition: 5, presence: 5 },
    skills: ['All'],
    languages: ['All'],

    responses: {
      interest0: { label: 'No, and...', text: "YOU DARE?! Your very existence offends me! BEGONE from my sight, and count yourself fortunate I do not unmake you!" },
      interest1: { label: 'No.', text: "Your prayers are heard. But I choose not to answer." },
      interest2: { label: 'No, but...', text: "Not yet... but continue to prove your devotion, and perhaps in time..." },
      interest3: { label: 'Yes, but...', text: "I shall grant this boon... but know that all gifts from the divine come with expectations." },
      interest4: { label: 'Yes.', text: "Your faith has moved me. My blessing shall guide you on your path." },
      interest5: { label: 'Yes, and...', text: "REJOICE! You are chosen! I bestow upon you a portion of my divine essence. Go forth as my herald!" },
    },
  },
};

// ---------------------------------------------------------------------------
// All Negotiation NPCs
// ---------------------------------------------------------------------------

export const NEGOTIATION_NPCS: PregenNegotiationScene[] = [
  // Local-Level (Impression 1-6)
  BANDIT_CHIEF,
  KNIGHT,
  GUILDMASTER,
  WARLORD,
  BURGOMASTER,
  VIRTUOSO,
  // National-Level (Impression 7-9)
  HIGH_PRIEST,
  DUKE,
  DRAGON,
  // Kingdom-Level (Impression 10-11)
  MONARCH,
  LICH,
  // World-Level (Impression 12)
  DEITY,
];

/**
 * Get negotiation NPC by ID
 */
export function getNegotiationNPCById(id: string): PregenNegotiationScene | undefined {
  return NEGOTIATION_NPCS.find(n => n.id === id);
}

/**
 * Get all negotiation NPCs
 */
export function getAllNegotiationNPCs(): PregenNegotiationScene[] {
  return NEGOTIATION_NPCS;
}

/**
 * Get negotiation NPCs by impression range
 * @param minImpression Minimum impression value (inclusive)
 * @param maxImpression Maximum impression value (inclusive)
 */
export function getNegotiationNPCsByImpression(
  minImpression: number,
  maxImpression: number
): PregenNegotiationScene[] {
  return NEGOTIATION_NPCS.filter(
    n => n.template.impression >= minImpression && n.template.impression <= maxImpression
  );
}

/**
 * Get negotiation NPCs by level tier
 */
export function getNegotiationNPCsByTier(tier: 'local' | 'national' | 'kingdom' | 'world'): PregenNegotiationScene[] {
  const ranges: Record<string, [number, number]> = {
    'local': [1, 6],
    'national': [7, 9],
    'kingdom': [10, 11],
    'world': [12, 12],
  };
  const [min, max] = ranges[tier];
  return getNegotiationNPCsByImpression(min, max);
}
