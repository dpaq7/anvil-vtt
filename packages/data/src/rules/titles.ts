/**
 * Titles Data for Draw Steel
 *
 * Data auto-generated from Draw Steel markdown ground truth.
 * Title type system enhanced from Forgesteel patterns
 * (https://github.com/andyaiken/forgesteel)
 * Type enhancements Copyright (c) Andy Aiken, Licensed under GPL-3.0
 */

import type { Title, TitlesByEchelon } from '@anvil/types';

export const TITLES: Title[] = [
  // ============================================================================
  // 1ST ECHELON TITLES (20 titles)
  // ============================================================================
  {
    id: 'ancient-loremaster',
    name: 'Ancient Loremaster',
    echelon: '1st',
    flavorText:
      "It's astonishing what you find in old books. Look at this—nearly complete schematics for a war automaton, gathering dust because nobody here reads Zaliac.",
    prerequisite: 'You find a trove of forgotten books.',
    effects: [],
    choices: [
      {
        name: 'Leverage',
        description:
          "You know a priceless secret. The Director chooses the type of person who would value this secret—usually a member of a particular faction, such as a Higaran noble, or a type of person, such as a fence of stolen goods. When engaged in a negotiation with this type of person, you can offer this secret. If they accept, their interest increases by 3 (to a maximum of 5). You can share this secret only once.",
      },
      {
        name: 'Rare Books',
        description:
          'You add rare, ancient books to your collection. Whenever you undertake a research project, roll 1d6 for each dead language you know and add the total to the project roll.',
      },
      {
        name: 'Susurrus Codex',
        description:
          "You find a sinister book that whispers advice in a voice no one else can hear. As long as you follow the book's advice, you gain an edge on Reason tests and take a bane on Presence tests. You can stop following the book's advice at any time, but the book won't speak to you for the rest of the day.",
      },
    ],
  },
  {
    id: 'battleaxe-diplomat',
    name: 'Battleaxe Diplomat',
    echelon: '1st',
    flavorText:
      'We seem to be equals in might and combat prowess. Perhaps we should bandy words awhile instead.',
    prerequisite:
      'You gain the friendship or alliance of a creature you once battled.',
    effects: [],
    choices: [
      {
        name: 'Iron Hand in Velvet Glove',
        description:
          "The first time during a negotiation that you make a test using the Intimidate skill and don't make an argument that appeals to an NPC's motivation, you don't lower the NPC's patience or interest no matter the outcome of the roll.",
      },
      {
        name: 'Truce!',
        description:
          'You have a double edge on tests made to stop combat and start a negotiation.',
      },
      {
        name: "Warriors' Understanding",
        description:
          'You gain an edge on Presence tests made to interact with creatures you have fought against in combat encounters.',
      },
    ],
  },
  {
    id: 'brawler',
    name: 'Brawler',
    echelon: '1st',
    flavorText: "We won't kill you. But you might wish we had.",
    prerequisite: 'You triumph in battle without killing any of your foes.',
    effects: [],
    choices: [
      {
        name: 'Duck!',
        description:
          "When an enemy strikes you while a second creature is flanking you, you can use a triggered action to redirect the strike against the second creature. Once you use this benefit, you can't use it again until you earn 1 or more Victories.",
      },
      {
        name: 'Furniture Fighter',
        description:
          "When you use a weapon ability with an improvised weapon or a weapon that isn't part of your kit, the ability benefits from your kit's melee weapon damage bonus.",
      },
      {
        name: 'Headbutt',
        description:
          "While you are grabbed or restrained, your free strikes don't take a bane when those conditions would impose one.",
      },
      {
        name: "If I Wanted You Dead, You'd Be Dead",
        description:
          "Whenever you defeat foes without killing any of them (including the foes you defeat to meet the prerequisite for this title), you gain an edge on tests during negotiations with those foes.",
      },
    ],
  },
  {
    id: 'city-rat',
    name: 'City Rat',
    echelon: '1st',
    flavorText:
      "Stay out all night, visit the dives. Get in a fight, run from the cops. That's the real city.",
    prerequisite: 'You have spent at least five respites in a metropolis.',
    effects: [],
    choices: [
      {
        name: 'Discerning Shopper',
        description:
          'When looking for an item prerequisite for a crafting project, you can remember meeting someone who might have the item—or at least information about it.',
      },
      {
        name: 'One with the Crowd',
        description:
          "While you're using one or more creatures as cover, you gain an edge on tests made to hide and sneak.",
      },
      {
        name: 'Street Smart',
        description: "While in a settlement, you can't be surprised.",
      },
    ],
  },
  {
    id: 'doomed',
    name: 'Doomed',
    echelon: '1st',
    flavorText:
      "I don't know what it meant, but when I watched her die, I saw a vision. I watched her die and saw my own death. Am I losing my mind?",
    prerequisite:
      "You aren't a hakaan but have witnessed the death of a hakaan.",
    effects: [
      {
        name: 'Doomed',
        description:
          "You aren't destined for a meaningful death, but you still might achieve one. When you're reduced to 0 Stamina but remain conscious, you can become doomed. If you do, you can't regain Stamina, you automatically obtain a tier 3 outcome on tests and power rolls, and you don't die until your Stamina reaches the negative of your Stamina maximum. At the end of the encounter, you die.",
      },
    ],
  },
  {
    id: 'dwarven-legionnaire',
    name: 'Dwarven Legionnaire',
    echelon: '1st',
    flavorText:
      "I have learned much. It might be your courage that inspires others. Watch your opponent's shield as well as their sword. And above all, stand fast, and do not yield.",
    prerequisite: 'You fight alongside three or more dwarves.',
    effects: [],
    choices: [
      {
        name: 'Close Formation',
        description:
          'While adjacent to two or more allies, you gain a +2 bonus to stability.',
      },
      {
        name: 'Rune of Alarm',
        description:
          'You can spend 10 uninterrupted minutes to inscribe a magic eye-shaped rune on a surface. The rune sheds light for 2 squares. The rune is dispelled 1 minute after it is activated or if you inscribe the rune elsewhere. The rune activates when an enemy comes within 2 squares of it. When the rune is activated, you wake up if you are nonmagically asleep, and you can perceive through the rune for 1 minute as if you were in its square.',
      },
      {
        name: 'Stonemeld',
        description:
          'While adjacent to a stone wall, you can use a maneuver to gain concealment. This concealment lasts until you leave the square or use an ability.',
      },
    ],
  },
  {
    id: 'elemental-dabbler',
    name: 'Elemental Dabbler',
    echelon: '1st',
    flavorText: 'Spirit of fire, I command you!',
    prerequisite:
      'You defeat a creature with the Elemental keyword, such as a crux of fire.',
    effects: [],
    choices: [
      {
        name: 'Elemental Blaster',
        description:
          'You have the Elementalist 1st-level Hurl Element feature, dealing the chosen damage type.',
      },
      {
        name: 'Elemental Immunity',
        description:
          'You have immunity to the chosen damage type equal to your highest characteristic score.',
      },
      {
        name: 'Elemental Weapons',
        description:
          'Whenever you use a damage-dealing weapon ability, that ability can deal damage of the chosen type instead of its usual damage type.',
      },
    ],
  },
  {
    id: 'faction-member',
    name: 'Faction Member',
    echelon: '1st',
    flavorText: "In six months, I'll be running this place.",
    prerequisite:
      'You join an army, guild, or similar organization.',
    effects: [
      {
        name: 'Faction Membership',
        description:
          "You gain membership in a faction. You're regarded as a promising but untested agent, and you're allowed to operate independently. You can be assigned tasks to further your faction's goals, and you can expect rewards and promotion if you succeed. When engaged in a negotiation with any member of your faction, their patience increases by 2 (to a maximum of 5).",
      },
    ],
    choices: [
      {
        name: 'Academic Faction',
        description:
          "You find a sage who can make up to three Reason tests to recall lore or make project rolls for research projects on your behalf. The sage has a +5 bonus to these tests. These project rolls take 10 minutes each and don't need to be made during a respite.",
      },
      {
        name: 'Guild Faction',
        description:
          "You find an expert crafter who can make up to three project rolls for crafting projects on your behalf. The crafter has a +5 bonus to these tests. These project rolls take 10 uninterrupted minutes each and don't need to be made during a respite.",
      },
      {
        name: 'Martial Faction',
        description:
          'You recruit up to three minions with levels no greater than your own, of a type appropriate for the faction (such as human guards). These minions follow your orders for a day.',
      },
      {
        name: 'Spy Faction',
        description:
          "You find an agent who can provide you with three pieces of information about the settlement you're in, such as the location of a hidden person, a secret entrance into a guarded area, or the negotiation motivation or pitfall of an important person.",
      },
    ],
  },
  {
    id: 'local-hero',
    name: 'Local Hero',
    echelon: '1st',
    flavorText:
      "Your coin won't spend here. The Heroes of Gravesford drink for free in this tavern!",
    prerequisite: 'You save a community from certain destruction.',
    effects: [],
    choices: [
      {
        name: 'Easy Marks',
        description:
          'You gain an edge on tests made using skills from the interpersonal and intrigue skill groups when influencing members of a community that you have saved.',
      },
      {
        name: 'Local Fame',
        description: 'You earn 1 Renown.',
      },
      {
        name: 'A New Dawn',
        description:
          "Each time you finish a respite while in a community you have saved, the party gains a hero token. This hero token disappears at the end of your next respite if it hasn't been used.",
      },
    ],
  },
  {
    id: 'mage-hunter',
    name: 'Mage Hunter',
    echelon: '1st',
    flavorText:
      'Their power is dangerous. Unnatural. Someone needs to do something.',
    prerequisite:
      'You defeat three leader or solo creatures who each have at least one ability with the Magic keyword.',
    effects: [],
    choices: [
      {
        name: 'Arcane Dampening',
        description:
          'When resisting potencies from magic abilities, your characteristic scores are considered to be 1 higher than usual.',
      },
      {
        name: "Oh No, You Don't!",
        description:
          'Whenever an adjacent creature uses an ability with the Magic keyword, you can make a free strike against them as a triggered action.',
      },
      {
        name: 'Stink of Magic',
        description:
          "As a maneuver, you open your senses to the residue of magic. Until the end of your next turn, you are aware of whether each creature within 5 squares is a construct, an undead, or a creature from another world, and whether they have used a magic ability in the previous hour. Additionally, you can't be surprised by constructs, undead, or creatures from another world.",
      },
    ],
  },
  {
    id: 'marshal',
    name: 'Marshal',
    echelon: '1st',
    flavorText:
      'I said you had twenty-four hours to leave town. That was... what, about twenty-four hours ago?',
    prerequisite:
      'You join an organization that hunts criminals, such as the Far Mariners, or you are deputized to act for the local authorities.',
    effects: [],
    choices: [
      {
        name: "Guess It's the Hard Way Then",
        description:
          "When combat begins and you aren't surprised, the first time you take damage before taking your turn, you halve that damage.",
      },
      {
        name: 'Heedless Pursuer',
        description:
          "Once on each of your turns, you can use a free maneuver to deal yourself 1d6 damage that can't be reduced in any way. When you do, you ignore difficult terrain and you can increase the distance of any jump you make by 1 square, both until the end of your turn.",
      },
      {
        name: 'Silver Shield',
        description:
          "You have a badge granted to you by your organization. While you wear it, you gain the My Life for Yours feature from the censor class. When you use that ability, you can't spend wrath unless you have the Wrath class feature.",
      },
      {
        name: 'Trained Tracker',
        description: 'You gain an edge on tests made to track criminals.',
      },
    ],
  },
  {
    id: 'monster-bane',
    name: 'Monster Bane',
    echelon: '1st',
    flavorText:
      "You dare mock Blunwin Mousebane? You think my deed trivial? Ah, but you didn't see the size of the mouse!",
    prerequisite:
      'You defeat a leader or solo creature with a Reason score of -2 or lower, such as an arixx.',
    effects: [],
    choices: [
      {
        name: 'Beast Bane',
        description:
          'Creatures with the Animal keyword take a bane on strikes made against you.',
      },
      {
        name: 'Monster Soother',
        description:
          'You gain an edge on tests made to calm or tame nonsapient creatures.',
      },
      {
        name: 'Monster Trophy',
        description:
          'You decorate your equipment with a trophy from a creature you defeated. While the trophy is visible, you gain an edge on tests made to intimidate sapient creatures.',
      },
    ],
  },
  {
    id: 'owed-a-favor',
    name: 'Owed a Favor',
    echelon: '1st',
    flavorText:
      "The Guild's gratitude knows no bounds! We'll repay you in any way we can... short of actually paying you.",
    prerequisite: 'You successfully perform a service for a powerful faction.',
    effects: [
      {
        name: 'Faction Favor',
        description:
          "The faction will perform one favor for the party, provided it doesn't interfere with the faction's goals.",
      },
      {
        name: 'Faction Information',
        description:
          "The faction is a good source of information. The Director chooses a skill from the crafting or lore skill groups appropriate to the faction, such as the Criminal Underworld skill for an outlaw gang, the Blacksmithing skill for a blacksmith's guild, or the Society skill for a noble house. While in a settlement where the faction has a presence, you gain this skill if you don't already have it. If you already have the skill, you instead gain an edge on tests made using the skill.",
      },
    ],
  },
  {
    id: 'presumed-dead',
    name: 'Presumed Dead',
    echelon: '1st',
    flavorText: "But... you're dead. We went to your funeral.",
    prerequisite:
      'You die in a way that prevents your body from being recovered or examined (for instance, by falling off a cliff).',
    effects: [
      {
        name: 'Presumed Dead',
        description:
          'While it might appear that you died, you did not. Instead, you regain 1 Stamina and can spend 1 or more Recoveries. Additionally, you gain a 1st-echelon trinket of the Director\'s choice. At a dramatic moment determined by the Director, you rejoin your party with an explanation for your narrow escape, and how you found your new trinket along the way.',
      },
    ],
  },
  {
    id: 'ratcatcher',
    name: 'Ratcatcher',
    echelon: '1st',
    flavorText:
      "I like fighting these little guys. Means I don't have to waste money on a helmet.",
    prerequisite:
      'You defeat a leader or solo creature who is size 1S or smaller, such as a goblin monarch.',
    effects: [],
    choices: [
      {
        name: 'Come Out to Play',
        description:
          "You have the Come Out to Play ability (1 Heroic Resource). Area, Magic, Maneuver, 5 burst targeting each enemy hidden to you. Each target who has P < AVERAGE is taunted by you until the end of their next turn, and you know the location of each creature taunted in this way.",
      },
      {
        name: 'Deadly and Big',
        description:
          'Your strikes gain a +3 damage bonus against creatures whose size is smaller than yours.',
      },
      {
        name: 'Everybody Move!',
        description:
          'When you use the Knockback maneuver, you can target one additional creature of your size or two additional smaller creatures.',
      },
    ],
  },
  {
    id: 'saved-for-a-worse-fate',
    name: 'Saved for a Worse Fate',
    echelon: '1st',
    flavorText: "Drink this. You'll need all your strength for what lies ahead!",
    prerequisite: 'The entire party is killed or captured by sapient foes.',
    effects: [
      {
        name: 'Saved for a Worse Fate',
        description:
          'After being defeated, each character awakes, alive and with full Stamina and Recoveries. You are all captives of the creatures who defeated you, and a gruesome end awaits you—unless you can escape or overcome the nefarious challenge your captors have planned.',
      },
    ],
    choices: [
      {
        name: 'Gladiators',
        description:
          "You must fight to the death for your captors' amusement. Your intended opponents wield or guard a trinket or leveled treasure, which you can earn if you are victorious.",
      },
      {
        name: 'Prey',
        description:
          "Your captors plan to release you and hunt you down, but it's no fun unless you offer a challenge. Each of you is given a medicinal draught that grants a +1 bonus to speed and increases your Recoveries by 2. This benefit lasts until the end of your next respite.",
      },
      {
        name: 'Sacrifices',
        description:
          'You are to be dropped in a volcano, fed to a sacred monster, abandoned in a desert, or otherwise sacrificed to a higher power. You are bedecked with holy jewelry. Each hero earns 1 Wealth.',
      },
      {
        name: 'Saviors',
        description:
          'Your captors fear an even stronger foe, and they want you to defeat this enemy for them. You can even keep any treasure you find while doing so.',
      },
    ],
  },
  {
    id: 'ship-captain',
    name: 'Ship Captain',
    echelon: '1st',
    flavorText: "Up anchor, shipmates! 'Tisn't gold but glory we seek!",
    prerequisite: 'You acquire a ship, airship, or similar vessel.',
    effects: [],
    choices: [
      {
        name: 'Deep-Sea Diver',
        description:
          'You can automatically swim at full speed while moving.',
      },
      {
        name: 'Ship Speaker',
        description:
          "You magically know the location of any ship controlled by your party even while you aren't aboard. You can telepathically communicate with anyone on board one of your ships who understands a language, and they can respond, no matter your distance from the ship.",
      },
      {
        name: 'Signal Flags',
        description:
          'While aboard a ship, you can communicate with and conduct negotiations with another ship up to 5 miles away, as long as you and creatures on the other ship have line of effect to each other. You gain an edge on Presence tests made while negotiating in this way.',
      },
      {
        name: 'Trained Crewmember',
        description:
          'You gain an edge on tests made to handle air or sea vessels.',
      },
    ],
  },
  {
    id: 'troupe-tactics',
    name: 'Troupe Tactics',
    echelon: '1st',
    flavorText: "We're actors! We're the opposite of people!",
    prerequisite:
      'The party has successfully performed as a troupe of actors, circus performers, or other entertainers.',
    effects: [],
    choices: [
      {
        name: 'Flying Circus',
        description:
          'When you are adjacent to a willing ally on their turn, you can use a triggered action to push them up to 2 squares if their size is the same as yours, or 4 squares if they are smaller. If this push causes the ally to fall, they can use a maneuver before they fall to reduce the height of the fall by 2.',
      },
      {
        name: 'Spotlight',
        description:
          "You magically cause a creature within 10 squares to shed light for 5 squares. This light lasts for 1 minute, until the creature is more than 10 squares away from you, or until you dismiss the effect (no action required). While illuminated, a creature can't sneak or hide, they take a bane on tests made to perform any action secretly, and they gain an edge on tests made using the Lead, Music, or Perform skills.",
      },
      {
        name: 'Supporting Player',
        description:
          'You gain an edge on group tests using Presence and on tests made to assist another creature with a Presence test.',
      },
      {
        name: 'Work the Crowd',
        description:
          'While any of your allies is playing music or performing, you gain an edge on tests made to conceal objects, hide, pick pockets, or sneak.',
      },
    ],
  },
  {
    id: 'wanted-dead-or-alive',
    name: 'Wanted Dead or Alive',
    echelon: '1st',
    flavorText:
      'A hundred silver?! An insult! I turned my father in for fifty golden crowns. And he was innocent!',
    prerequisite:
      'You are declared an outlaw by a governmental authority.',
    effects: [],
    choices: [
      {
        name: 'Honor Among Thieves',
        description:
          'When negotiating with criminals, your Renown score is considered to be 2 higher than usual.',
      },
      {
        name: 'Minion Mower',
        description:
          'When you make a melee strike that targets a minion and at least one more minion is within distance of the strike, the strike gains a +3 damage bonus.',
      },
      {
        name: "No, You're Under Arrest!",
        description:
          'You gain an edge on the Escape Grab maneuver. Additionally, when you succeed on a test to escape bonds or manacles, as part of the same maneuver, you can transfer the bonds or manacles to an adjacent creature of the same size without them immediately noticing.',
      },
    ],
  },
  {
    id: 'zombie-slayer',
    name: 'Zombie Slayer',
    echelon: '1st',
    flavorText:
      "Why won't you die?! You've already done it once, you should be good at it by now!",
    prerequisite:
      'You defeat a leader or solo creature with the Undead keyword, such as a ghost.',
    effects: [],
    choices: [
      {
        name: 'Blessed Weapons',
        description:
          'Whenever you use a damage-dealing weapon ability, that ability can deal holy damage instead of its usual damage type.',
      },
      {
        name: 'Divine Health',
        description:
          "You gain corruption immunity equal to your highest characteristic score. Additionally, you can't be turned into an undead creature.",
      },
      {
        name: 'Holy Terror',
        description:
          'You have the Holy Terror ability (3 Heroic Resource). Area, Magic, Maneuver, 3 burst targeting each undead enemy in the area. Each target takes holy damage equal to your Reason, Intuition, or Presence score (your choice). Additionally, each target who has P < STRONG is frightened (save ends).',
      },
    ],
  },

  // ============================================================================
  // 2ND ECHELON TITLES (16 titles)
  // ============================================================================
  {
    id: 'arena-fighter',
    name: 'Arena Fighter',
    echelon: '2nd',
    flavorText:
      "You've never seen the showstopper? The move so brutal it was banned in the arena? Come closer and I'll show it to you.",
    prerequisite:
      'You are victorious in battle in an arena or some other public contest of combat.',
    effects: [],
    choices: [
      {
        name: 'Dirty Fighting',
        description:
          "While you are standing, your melee strikes gain a +3 damage bonus against prone creatures. Additionally, being prone doesn't impose a bane on your strikes.",
      },
      {
        name: 'Foes as Weapons',
        description:
          'Whenever you have a creature of your size or smaller grabbed, you can use them as a weapon when you make a melee weapon free strike. Both the target and the grabbed enemy take the strike\'s damage.',
      },
      {
        name: 'Instant Celebrity',
        description: 'You earn 1 Renown.',
      },
      {
        name: 'Showstopper',
        description:
          'You have the Showstopper ability (5 Heroic Resource). Melee, Strike, Weapon, Main action, Melee 1, one creature. Power Roll + Might or Agility: 11 or lower: 6 damage, I < WEAK slowed (save ends); 12-16: 10 damage, I < AVERAGE frightened (save ends); 17+: 14 damage, I < STRONG dazed (save ends). If you kill a non-minion opponent using this ability, each enemy within 3 squares of you is frightened (save ends).',
      },
    ],
  },
  {
    id: 'awakened',
    name: 'Awakened',
    echelon: '2nd',
    flavorText:
      'I was grappling with them, and when they died... I felt something happen. To me.',
    prerequisite:
      'You defeat a leader or solo creature who has at least one ability with the Psionic keyword, such as a voiceless talker evolutionist.',
    effects: [],
    choices: [
      {
        name: 'Foresight',
        description:
          "You don't take a bane when using abilities against creatures with concealment.",
      },
      {
        name: 'Rogue Talent',
        description:
          "Choose one triggered action that the talent class has access to at 1st level. You gain that ability regardless of whether your class and subclass allow you to take it. If this ability allows you to gain or spend clarity, you can't do so unless you have the Clarity class feature.",
      },
      {
        name: 'Telepathy',
        description:
          'As a maneuver, you communicate telepathically with a creature within 10 squares who understands a language you know. The creature can respond telepathically as part of the same maneuver.',
      },
    ],
  },
  {
    id: 'battlefield-commander',
    name: 'Battlefield Commander',
    echelon: '2nd',
    flavorText:
      'Spells and shadows have their place, but it takes soldiers to hold the field.',
    prerequisite: 'You lead an army in battle and win.',
    effects: [],
    choices: [
      {
        name: 'Charge!',
        description:
          'You have the Charge! ability (9 Heroic Resource). Area, Main action, 3 burst targeting self and each ally in the area. Each target can use the Charge main action.',
      },
      {
        name: 'Renowned Warrior',
        description: 'You earn 1 Renown.',
      },
      {
        name: 'Student of War',
        description:
          "Choose a 1st-level doctrine feature from the tactician class. You gain that feature even if you don't have the Tactical Doctrine feature.",
      },
    ],
  },
  {
    id: 'blood-magic',
    name: 'Blood Magic',
    echelon: '2nd',
    flavorText:
      "Flow, blood, thou fiend's libation, and catch my foes in conflagration!",
    prerequisite:
      'You participate in a Discover Lore project to learn forbidden knowledge.',
    effects: [],
    choices: [
      {
        name: 'Blood Mage',
        description:
          "When you use an area ability with the Magic or Psionic keyword, you can take damage equal to your level to increase the ability's area by 1 until the end of the encounter. If the area is a line, you increase the size of one dimension, not both. This damage can't be reduced in any way. You can use this benefit only once per use of an ability.",
      },
      {
        name: 'Bloody Murder',
        description:
          "When you deal rolled damage to a creature with a strike, you can take damage equal to your level to deal twice that much corruption damage to the creature. The damage you take from this title can't be reduced in any way. You can use this benefit only once per ability. If the creature is reduced to 0 Stamina by this corruption damage, the creature explodes in a shower of blood and you regain the Stamina you lost. You can't use this benefit on creatures without blood, such as constructs, elementals, or undead.",
      },
      {
        name: 'I Reject This Evil Power!',
        description: 'You gain corruption immunity equal to your level.',
      },
    ],
  },
  {
    id: 'corsair',
    name: 'Corsair',
    echelon: '2nd',
    flavorText: "Haul down your flag or we'll burn you to the waterline!",
    prerequisite:
      'You have the Ship Captain title, and you sink or capture a ship of equal or greater size than your own.',
    effects: [],
    choices: [
      {
        name: 'Artillerist',
        description:
          "You gain a +5 damage bonus when using a ship's weapons.",
      },
      {
        name: 'Black Flag',
        description:
          "You have a recognizable flag that strikes terror on the high seas. While your flag is flying from your ship, crewmembers of other ships who have line of effect to the flag take a bane on strikes made against your ship or its crew.",
      },
      {
        name: 'Fearsome Reputation',
        description: 'You earn 1 Renown.',
      },
      {
        name: 'Scoundrel Tactics',
        description:
          "While aboard a ship, you can use the following skills to make a test to influence another ship up to 5 miles away whose crewmembers have line of effect to you, and you gain an edge when you do so. You can use Disguise to hide your ship's identity or general type, Intimidate to convince another ship's crew to flee or surrender, or Hide or Sneak to let your ship avoid notice.",
      },
    ],
  },
  {
    id: 'faction-officer',
    name: 'Faction Officer',
    echelon: '2nd',
    flavorText:
      'If you want or need something, talk to me. I have a certain... influence in these parts.',
    prerequisite:
      "You have the Faction Member title, and you greatly advance the faction's goals.",
    effects: [
      {
        name: 'Faction Authority',
        description:
          'You are given a position of great authority in your faction.',
      },
      {
        name: 'Requisition',
        description:
          "When you gain this title, you gain a 1st- or 2nd-echelon magic trinket of your choice from your faction. Whenever you gain a level, you can swap the trinket out for another one.",
      },
      {
        name: "You're the Boss",
        description:
          "Lower-ranking members of your faction follow your routine orders. In nonroutine matters, you gain an edge on tests made to influence those characters' behavior.",
      },
    ],
  },
  {
    id: 'fey-friend',
    name: 'Fey Friend',
    echelon: '2nd',
    flavorText:
      "Do you enjoy the vintage? Yes, you can understand my tongue now. One does not drink at my table and leave unchanged.",
    prerequisite: 'You eat and drink with an elf monarch or archfey.',
    effects: [
      {
        name: 'Khelt Language',
        description: 'You know the Khelt language.',
      },
    ],
    choices: [
      {
        name: 'Gift of Charm',
        description:
          'You have a skill of your choice from the interpersonal skill group.',
      },
      {
        name: 'Gift of Foresight',
        description:
          'When resisting potencies, your Intuition score is considered to be 1 higher than usual.',
      },
      {
        name: 'Gift of Knowledge',
        description:
          'You gain an edge on tests you make that use any skill from the lore skill group.',
      },
    ],
  },
  {
    id: 'giant-slayer',
    name: 'Giant Slayer',
    echelon: '2nd',
    flavorText: 'Come back here, puny one, and let me crush you!',
    prerequisite:
      'You defeat a leader or solo creature with the Giant keyword, such as a fire giant chief.',
    effects: [],
    choices: [
      {
        name: 'Smallfolk Dodge',
        description:
          'Any creature of size 2 or larger takes a bane on strikes against you.',
      },
      {
        name: 'The Harder They Fall',
        description:
          "You have The Harder They Fall ability (7 Heroic Resource). Melee, Strike, Weapon, Main action, Melee 1, one creature. Power Roll + Might or Agility: 11 or lower: 7 damage, M < WEAK prone and can't stand (save ends); 12-16: 11 damage, M < AVERAGE prone and can't stand (save ends); 17+: 16 damage, M < STRONG prone and can't stand (save ends). If the target is size 2 or larger, you gain an edge on this ability.",
      },
      {
        name: 'Up the Beanstalk',
        description:
          "You have the Climb skill. If you already have this skill, you instead gain an edge on tests made using the Climb skill. While you're climbing a creature, the creature has a double bane on strikes against you and you have a double edge on tests made to stay on the creature.",
      },
    ],
  },
  {
    id: 'godsworn',
    name: 'Godsworn',
    echelon: '2nd',
    flavorText:
      'He seemed like he needed help! Now the dead speak to me. I think maybe that old man was more than he appeared.',
    prerequisite:
      'You do a favor for an agent of a god or saint, or promise to do so.',
    effects: [],
    choices: [
      {
        name: 'Healing Gift',
        description:
          "You can use the 1st-level Conduit feature Healing Grace as if you had spent 1 piety. Once you use this benefit, you can't use it again until you earn 1 or more Victories.",
      },
      {
        name: 'Last-Ditch Prayer',
        description:
          "As a free maneuver, you recite a prayer for help, gaining a pool of 2d10 of the Heroic Resource granted by your class. This pool disappears at the end of your turn if you haven't used it. Once you use this benefit, you can't use it again until you perform another service for a god or saint, or until you gain a level.",
      },
      {
        name: 'Touched by the Divine',
        description:
          "Choose a god or saint from the Deities and Domains table. From that god or saint's domains, choose a Conduit 1st-level domain feature.",
      },
    ],
  },
  {
    id: 'heist-hero',
    name: 'Heist Hero',
    echelon: '2nd',
    flavorText: "Everybody know their assignments? All right, let's go.",
    prerequisite:
      'You have the Troupe Leading Player title, and you have used planning and teamwork to execute a theft that went (reasonably) according to plan.',
    effects: [],
    choices: [
      {
        name: 'Mother Hen',
        description:
          'You can spend 10 uninterrupted minutes to psionically enhance up to five willing creatures within 10 squares of you who understand a language you know. For the next hour, you and each target can communicate telepathically with each other no matter the distance between you.',
      },
      {
        name: 'Sneakers',
        description:
          'You gain the Sneak skill. If you already have this skill, you instead gain an edge on tests made using the Sneak skill. During group tests, you can both use the Sneak skill and assist another hero using the Sneak skill.',
      },
      {
        name: 'Timely Distraction',
        description:
          "You have the Timely Distraction triggered action. Ranged 10, one creature. Trigger: An ally makes a test to lie to, pick the pocket of, hide from, or sneak by the target and doesn't like the outcome. Effect: You momentarily attract the target's notice to let your ally reroll their test. Once you use this ability, you can't use it again against the same target for 1 hour.",
      },
    ],
  },
  {
    id: 'knight',
    name: 'Knight',
    echelon: '2nd',
    flavorText:
      'Kneel, heroes. Arise, knights of Tor, and may your swords be ever sharp in our service.',
    prerequisite:
      'A noble or monarch grants you knighthood or a similar rank.',
    effects: [],
    choices: [
      {
        name: 'Heraldic Fame',
        description: 'You earn 1 Renown.',
      },
      {
        name: 'Knightly Aegis',
        description: 'Your Stamina maximum increases by 6.',
      },
      {
        name: 'Knightly Challenge',
        description:
          'You have the Knightly Challenge ability (5 Heroic Resource). Melee, Strike, Weapon, Main action, Melee 1, one creature. Power Roll + Might or Agility: 11 or lower: 7 damage, taunted (save ends); 12-16: 11 damage, taunted (save ends); 17+: 16 damage, taunted (save ends). You can end the taunted condition on the target as a free maneuver.',
      },
    ],
  },
  {
    id: 'master-librarian',
    name: 'Master Librarian',
    echelon: '2nd',
    flavorText:
      "You want to know the exact coordinates of the Gem of the Waves shipwreck? I came across that just the other day in an unpublished memoir of its second mate. Let me get that for you.",
    prerequisite:
      'You have the Ancient Loremaster title, and you have completed a Discover Lore project to learn lost knowledge or forbidden knowledge.',
    effects: [],
    choices: [
      {
        name: 'Arcane Improvisation',
        description:
          'When you use a damage-dealing magic signature ability, you can change its damage type to acid, cold, corruption, fire, lightning, poison, or sonic damage.',
      },
      {
        name: 'I Have Just the Book',
        description:
          "If you start a Discover Lore project in your hero's stronghold or other permanent base of operations you immediately gain 60 project points toward the completion of that project. If the project costs 60 or fewer points, you complete it in 10 uninterrupted minutes without needing to use a respite activity.",
      },
      {
        name: 'Picked Up a Few Things',
        description: 'You know a skill from the lore skill group.',
      },
      {
        name: 'Polyglot',
        description:
          'You know two languages. Additionally, the project goal for the Learn New Language project is halved for you.',
      },
    ],
  },
  {
    id: 'special-agent',
    name: 'Special Agent',
    echelon: '2nd',
    flavorText:
      "And this is interesting... if you twist the third button on your overcoat—no, don't do it now!",
    prerequisite: 'A spymaster gives you an important secret mission.',
    effects: [],
    choices: [
      {
        name: 'Boffin',
        description:
          "You gain a small magic spy device called a boffin. Once per encounter, you can activate a boffin property as a maneuver: Make a test that uses the Disguise skill with an edge; One mundane lock you touch is unlocked; Choose a square within 10 squares, even if you don't have line of effect to it, and observe the area around that square as if you were in it; or Throw the boffin up to 10 squares, where it explodes in a 5 cube dealing fire damage equal to 2d10 + your level to each creature in the area (permanently destroying the boffin).",
      },
      {
        name: 'Caustic Alchemy',
        description:
          "You have your choice of the 1st-level shadow college features Coat the Blade or Smoke Bomb. When you use that feature, you can't spend insight unless you have the Insight class feature.",
      },
      {
        name: 'Spy Ring',
        description:
          'You gain a piece of magic jewelry, such as a ring. As a main action while wearing the jewelry, you can take on the illusory appearance of an individual within 10 squares who you have line of effect to. This disguise lets you automatically succeed on tests made using the Disguise skill based solely on visual identification.',
      },
    ],
  },
  {
    id: 'sworn-hunter',
    name: 'Sworn Hunter',
    echelon: '2nd',
    flavorText:
      'I will follow you to the ends of the earth—just so I can kick you off the edge.',
    prerequisite:
      'You have the Marshal title, and you take down an entire criminal organization.',
    effects: [],
    choices: [
      {
        name: "Hunter's Oath",
        description:
          "As a main action, you swear a hunter's oath against a creature within 10 squares who you have line of effect to. This oath lasts until the target dies or until you swear a hunter's oath against a different creature. As long as the hunter's oath lasts, you magically know the direction to the target if they are within 50 miles of you, and your damage-dealing abilities gain a +5 damage bonus against the target.",
      },
      {
        name: 'Particular Set of Skills',
        description: 'You know a skill from the intrigue skill group.',
      },
      {
        name: "We're In This Together",
        description:
          'When you have a creature grabbed and take damage from an ability not used by that creature, the grabbed creature takes the same damage.',
      },
    ],
  },
  {
    id: 'undead-slain',
    name: 'Undead Slain',
    echelon: '2nd',
    flavorText: "No, I didn't get bitten. And yes, I'm fine!",
    prerequisite: 'You are killed by an undead creature.',
    effects: [
      {
        name: 'Undead Return',
        description:
          "You return to life 1 minute after being killed with Stamina equal to your winded value. You gain corruption immunity equal to your level. If you die again, you rise as an undead creature under the Director's control.",
      },
    ],
    choices: [
      {
        name: 'Ghoul or Vampire',
        description:
          "When you make a melee free strike against an adjacent creature, you can bite that creature. If you do so and obtain a tier 3 outcome, you gain temporary Stamina equal to the damage dealt. If not lost beforehand, this temporary Stamina lasts until the end of your next respite.",
      },
      {
        name: 'Incorporeal Undead',
        description:
          "You can move through other creatures and objects. The first time in a combat round that you pass through a creature, that creature takes corruption damage equal to half your level. You don't take damage from being force moved into objects.",
      },
      {
        name: 'Other Corporeal Undead',
        description:
          "When you are reduced to 0 Stamina by damage that isn't fire or holy damage and your body isn't destroyed, you can regain half your Stamina and fall prone. Once you use this benefit, you can't use it again until you earn 10 or more Victories.",
      },
    ],
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    echelon: '2nd',
    flavorText:
      "I seen the goblin king run 'im through with a spear. Then I seen 'im pull 'imself back up, spear still in 'im, and headbutt the goblin king... then he pulls out the spear and throws it on the goblin king's corpse.",
    prerequisite: 'You defeat a foe while at or below 0 Stamina.',
    effects: [],
    choices: [
      {
        name: "From Hell's Heart",
        description:
          'While you are winded, your melee strikes gain a +3 damage bonus.',
      },
      {
        name: 'Furious Attack',
        description:
          "Choose one signature ability from the fury class. You gain that ability regardless of whether your class and subclass allow you to take it. If this ability allows you to gain or spend ferocity, you can't do so unless you have the Ferocity class feature.",
      },
      {
        name: 'Furious Charge',
        description:
          'When you use the Charge action, your strike made as part of that action gains a damage bonus equal to the number of squares you moved as part of the charge.',
      },
    ],
  },

  // ============================================================================
  // 3RD ECHELON TITLES (13 titles)
  // ============================================================================
  {
    id: 'armed-and-dangerous',
    name: 'Armed and Dangerous',
    echelon: '3rd',
    flavorText:
      "I'm not picky. Any tool will suffice. A sword seems a most appropriate tool for this job.",
    prerequisite:
      "You can't use kits, and you defeat five non-minion enemies using weapon abilities that don't have the Magic or Psionic keyword.",
    effects: [
      {
        name: 'Armed and Dangerous',
        description: 'You can use and gain the benefits of kits.',
      },
    ],
  },
  {
    id: 'back-from-the-grave',
    name: 'Back From the Grave',
    echelon: '3rd',
    flavorText: 'Hi! Remember me?',
    prerequisite:
      "You die at the hands of your greatest foe, that foe still lives, and you aren't a revenant.",
    effects: [
      {
        name: 'Back From the Grave',
        description:
          'You are restored to life. You gain the Tough But Withered signature trait from the revenant ancestry.',
      },
    ],
  },
  {
    id: 'demon-slayer',
    name: 'Demon Slayer',
    echelon: '3rd',
    flavorText: "F'lath v'korr en zaratha g'rrack.",
    prerequisite:
      'You defeat a leader or solo creature with the Demon keyword, such as a soulraker hivequeen, or you are possessed by a demon.',
    effects: [],
    choices: [
      {
        name: 'Demonic Lore',
        description:
          'You know the Proto-Ctholl language. Additionally, when you deal damage using a magic ability, you can change the ability\'s damage type to holy.',
      },
      {
        name: 'Lethe',
        description:
          'While you are winded, your strikes gain a +5 damage bonus.',
      },
      {
        name: 'Made of Teeth',
        description:
          'Your body can sprout teeth in unusual places. Whenever a creature makes physical contact with you or starts their turn touching you, you can deal 5 damage to them (no action required).',
      },
      {
        name: 'Soulsight',
        description:
          "Any creature within 2 squares can't be hidden from you.",
      },
    ],
  },
  {
    id: 'diabolist',
    name: 'Diabolist',
    echelon: '3rd',
    flavorText: "If you can't beat 'em, join 'em.",
    prerequisite:
      'You defeat a leader or solo creature with the Devil keyword, such as an archdevil, or you make a deal with a devil.',
    effects: [],
    choices: [
      {
        name: 'Devil Lore',
        description:
          'You know the Anjali language, and your understanding of this language helps you create irresistible supernatural effects. The potencies of your magic or psionic abilities that target Reason, Intuition, or Presence increase by 1.',
      },
      {
        name: 'Infernal Legacy',
        description:
          'You gain 3 ancestry points to spend on purchased devil ancestry traits.',
      },
      {
        name: 'Sly Devil',
        description:
          'You gain the Silver Tongue signature trait from the devil ancestry.',
      },
      {
        name: 'Untouched by Corruption',
        description:
          'Whenever you use a damage-dealing ability, that ability can deal holy damage instead of its usual damage type.',
      },
    ],
  },
  {
    id: 'dragon-blooded',
    name: 'Dragon Blooded',
    echelon: '3rd',
    flavorText:
      'I stabbed the wyrm Axarthan in the heart and their silver blood washed over me, leaving me... as you see.',
    prerequisite:
      'You defeat a leader or solo creature with the Dragon keyword, such as a gloom dragon.',
    effects: [],
    choices: [
      {
        name: 'Dragon Scaled',
        description:
          "Dragon scales grow on your body wherever the heart's blood of the dragon touched you. You gain the Wyrmplate signature trait from the dragon knight ancestry.",
      },
      {
        name: 'Dragon Touched',
        description:
          'You gain 3 ancestry points to spend on purchased dragon knight ancestry traits.',
      },
    ],
  },
  {
    id: 'fleet-admiral',
    name: 'Fleet Admiral',
    echelon: '3rd',
    flavorText: 'All hail the Pirate Queen!',
    prerequisite:
      'You have the Corsair title, and you lead a fleet of at least three ships.',
    effects: [],
    choices: [
      {
        name: 'First Mate',
        description:
          "You have a pirate retainer, such as a human warrior, chosen by the Director. This retainer's level increases to your level.",
      },
      {
        name: 'Swashbuckler',
        description:
          'You can automatically climb at full speed while moving.',
      },
      {
        name: 'Treasure Keeper',
        description: 'You earn 1 Wealth.',
      },
      {
        name: 'Weather Wizard',
        description:
          'Once per day, you can spend 10 uninterrupted minutes to magically alter mundane weather in a 5-mile radius around you. The weather moves with you and persists for 6 hours or until you dismiss it as a free maneuver. Choose from: Calm (wind-powered vessels and technology cease working), Fog (visibility is reduced to 6 squares), High Winds (the speed of wind-powered vessels is doubled), Light Winds (no effects due to weather), or Storm (the crew of an unsheltered wind-powered vessel must make a medium group Reason test; on a failure, the vessel needs repairs and moves at half speed until those repairs are made).',
      },
    ],
  },
  {
    id: 'maestro',
    name: 'Maestro',
    echelon: '3rd',
    flavorText:
      "When I saw the bloodstained manuscript under Fellwander's arm, I knew his quest for the Opera was over—and with it, his chance for redemption.",
    prerequisite:
      'You visit the realms of gods, devils, or other immortal beings and hear a note of the Music of Creation.',
    effects: [],
    choices: [
      {
        name: 'Angelic Chorus',
        description:
          'You can use the lessons of musical improvisation in combat. Choose one class act triggered action from the troubadour class. You gain that ability regardless of whether your class and subclass allow you to take it. If this ability allows you to gain or spend drama, you can gain or spend the Heroic Resource of your class in place of drama.',
      },
      {
        name: "Devil's Opera",
        description:
          "You have The Devil's Chord ability (9 Heroic Resource). Area, Magic, Main action, 5 burst targeting each creature in the area. Power Roll + Presence: 11 or lower: You take 4 sonic damage unless you have the Performance skill; 12-16: 6 sonic damage, M < AVERAGE weakened (save ends); 17+: 10 sonic damage, M < STRONG weakened and bleeding (save ends). The soul of any creature killed by this ability is dragged to Hell.",
      },
      {
        name: 'Music of the Spheres',
        description:
          'As a main action, you sing or play a note as delicate and sharp as glass—and just as easily shattered. Until the start of your next turn, whenever a creature within 10 squares makes a strike, they take 8 sonic damage. Whenever you make a strike during that same period, you also take 8 sonic damage.',
      },
    ],
  },
  {
    id: 'master-crafter',
    name: 'Master Crafter',
    echelon: '3rd',
    flavorText:
      'The sword Vanartha has been remade, mightier now than on the day it was forged.',
    prerequisite:
      'You complete a downtime project to imbue armor, an implement, or a weapon with a 9th-level enhancement.',
    effects: [],
    choices: [
      {
        name: 'Masterpiece',
        description:
          'The armor, implement, or weapon can be imbued a fourth time, with any enhancement the item qualifies for.',
      },
      {
        name: 'Research Dividends',
        description:
          'You gain the item prerequisite for an armor, implement, or weapon enhancement of your choice. Additionally, you learn the project source language for that enhancement.',
      },
      {
        name: 'Skilled Hands',
        description:
          'You have a skill from the crafting skill group that would have been used during the creation of the prerequisite item. If you already have that skill, you instead gain an edge on tests made using the skill. Additionally, you gain a second skill of your choice from the crafting skill group.',
      },
      {
        name: 'Strong Hands Make Light Work',
        description:
          'Whenever you make a project roll, you can use Might as the project roll characteristic.',
      },
    ],
  },
  {
    id: 'noble',
    name: 'Noble',
    echelon: '3rd',
    flavorText:
      "Technically, I'm called Lord Morninghill these days. I did a little favor for Duke Kenway at the Battle of Black Forest.",
    prerequisite: 'A monarch or important noble grants you a noble rank.',
    effects: [],
    choices: [
      {
        name: 'I Know How to Talk to These People',
        description:
          'You gain an edge on Presence tests made to interact with royals, nobles, and their feudal followers, provided they are aware of your noble rank.',
      },
      {
        name: 'Noble Splendor',
        description: 'You earn 1 Renown and 1 Wealth.',
      },
      {
        name: 'Retinue',
        description:
          'The number of followers you can recruit increases by two.',
      },
    ],
  },
  {
    id: 'planar-voyager',
    name: 'Planar Voyager',
    echelon: '3rd',
    flavorText:
      "I've seen skywhales floating above the seas of Primordius. I've seen star freighters dancing around the moons of Axiom. So I guess you're right, I'm not from around these parts.",
    prerequisite: 'You voyage in strange vehicles on different worlds.',
    effects: [],
    choices: [
      {
        name: 'Prismacore Eyes',
        description:
          "Exposure to prismacore has given your eyes a mirrorlike sheen. You have psychic immunity 10, creatures can't use magic or psionic abilities or other effects to determine your location or read your thoughts unless you allow them to, and you gain a +3 bonus to stability against magic or psionic abilities.",
      },
      {
        name: 'Stellar Knowledge',
        description:
          'You gain the Mechanics skill. If you already have this skill, you instead gain an edge on tests made using the skill. Additionally, you gain the item prerequisite and project source for a psionic trinket.',
      },
      {
        name: 'Time Raider Training',
        description:
          'You gain 2 ancestry points to spend on purchased time raider ancestry traits.',
      },
    ],
  },
  {
    id: 'scarred',
    name: 'Scarred',
    echelon: '3rd',
    flavorText:
      'Last time we fought, I gave you a little token to remember me by... now it appears you need another reminder of my power.',
    prerequisite: 'An enemy leader or solo creature reduces you to 0 Stamina.',
    effects: [
      {
        name: 'Scarred',
        description:
          'You gain a visible scar in a location of your choice. Additionally, your Stamina maximum increases by 20, and the creature who scarred you takes a bane on abilities against you.',
      },
    ],
  },
  {
    id: 'siege-breaker',
    name: 'Siege Breaker',
    echelon: '3rd',
    flavorText:
      "Best way to deal with a castle siege? Be on the outside.",
    prerequisite:
      'You have the Battlefield Commander title, and you lead the defense of a settlement or fortification.',
    effects: [],
    choices: [
      {
        name: 'Death From Above',
        description:
          'When you gain an edge on an ability due to high ground, the ability gains a +8 damage bonus.',
      },
      {
        name: 'Hold the Line',
        description:
          "While you're within 5 squares of an ally, you and each ally within 5 squares of you gains a +3 bonus to stability.",
      },
      {
        name: 'Last Defender',
        description:
          "Whenever an ally within 5 squares is reduced to 0 Stamina, you gain temporary Stamina equal to the ally's level (or 1 if they have no level). If you already have temporary Stamina granted by this title, you increase your temporary Stamina by the amount you would have gained.",
      },
    ],
  },
  {
    id: 'teacher',
    name: 'Teacher',
    echelon: '3rd',
    flavorText:
      "Someday, I'll understand how peeling these carrots for dinner relates to my elementalist training.",
    prerequisite:
      'You train or command at least three lower-level members of your class.',
    effects: [
      {
        name: 'Teacher',
        description:
          "You can travel with a student who shares your class. The student has the statistics of a 1st-level member of your class and has the same skills as you, but doesn't engage in combat. They can perform any out-of-combat tasks a 1st-level member of your class can perform. Whenever they make a test to assist you in a task, they can't obtain less than a tier 2 outcome on the test.",
      },
    ],
  },
  {
    id: 'ringleader',
    name: 'Ringleader',
    echelon: '3rd',
    flavorText: "Don't worry. I've got a guy.",
    prerequisite:
      'You complete three downtime projects during the same respite with the help of followers or minions.',
    effects: [
      {
        name: 'Minion Commands',
        description:
          'You no longer need line of effect to give commands to any minions you can summon.',
      },
    ],
    choices: [
      {
        name: 'For the Boss',
        description: 'Your followers gain a +3 bonus to project rolls that they make.',
      },
      {
        name: 'Networker',
        description: 'Your maximum follower count increases by 2.',
      },
      {
        name: 'Stringpuller',
        description:
          'While occupying a civilized area (such as a village, town, district, or city), you always have access to a follower native to the location. If the area is otherwise hostile to you, this follower is a spy in hiding who has any project points they earn halved.',
      },
    ],
  },

  // ============================================================================
  // 4TH ECHELON TITLES (10 titles)
  // ============================================================================
  {
    id: 'champion-competitor',
    name: 'Champion Competitor',
    echelon: '4th',
    flavorText:
      "Marduk uses the Beldoit Gambit! Avanna counters with the Iron Defense and goes on the attack! Marduk's last tower is knocked down! And just like that, we have a new... world... champion!",
    prerequisite: 'You beat the best in the world at a game or sport.',
    effects: [
      {
        name: 'Characteristic Increase',
        description:
          'A characteristic used during the competition increases by 1 (to a maximum of 6).',
      },
    ],
    choices: [
      {
        name: 'Best of the Best',
        description:
          'Choose a skill you used during the competition. You gain a +4 bonus to tests made using that skill instead of a +2 bonus.',
      },
      {
        name: 'Glory and Riches',
        description: 'You earn 2 Renown and 1 Wealth.',
      },
      {
        name: "I'll Just Take the Prize",
        description:
          "You gain a trinket or leveled treasure of the Director's choice.",
      },
    ],
  },
  {
    id: 'demigod',
    name: 'Demigod',
    echelon: '4th',
    flavorText:
      'The ritual is complete. I feel your power flow through me. I am become a god! Ah-ha-ha-ha-ha!',
    prerequisite:
      'You have the Godsworn title, and hundreds of worshipful mortals complete a divine ritual in your name.',
    effects: [
      {
        name: 'Immortal Excellence',
        description:
          'A characteristic of your choice increases by 1 (to a maximum of 6).',
      },
      {
        name: 'Longevity',
        description:
          'Your natural lifespan doubles and you can appear to be any age.',
      },
      {
        name: 'Worshippers',
        description: 'You magically hear prayers directed to you.',
      },
    ],
    choices: [
      {
        name: 'Acolytes',
        description:
          'The number of followers you can recruit increases by two.',
      },
      {
        name: 'Divine Weapons',
        description:
          'Whenever you use a damage-dealing weapon ability, that ability can deal corruption or holy damage instead of its usual damage type.',
      },
      {
        name: 'Missionaries',
        description: 'You earn 2 Renown.',
      },
    ],
  },
  {
    id: 'enlightened',
    name: 'Enlightened',
    echelon: '4th',
    flavorText:
      "Don't you see? This world that seems so real to you is nothing but a game, and all the people merely pieces!",
    prerequisite:
      'You learn a cosmic truth that alters your understanding of reality.',
    effects: [
      {
        name: 'Characteristic Increase',
        description:
          'Your choice of your Reason or Intuition increases by 1 (to a maximum of 6).',
      },
    ],
    choices: [
      {
        name: 'Cosmic Revelation',
        description:
          "When you make a test with a skill from the lore skill group and obtain a tier 1 or tier 2 outcome, you can instead obtain a tier 3 outcome. Once you use this benefit, you can't use it again until you earn 1 or more Victories.",
      },
      {
        name: 'Mind Over Matter',
        description:
          'Whenever you spend a Recovery, you can end one condition on yourself.',
      },
      {
        name: 'Rearrange the Game Pieces',
        description:
          "You can reach behind the curtain and alter reality. At the start of combat, choose yourself or any creature within 5 squares. The chosen target must move up to their speed to a space you choose, but can't enter damaging terrain or terrain that could impose a condition on them. The target doesn't appear to move or teleport to that space—they are simply there. No one but you has any memory of the target's previous position.",
      },
    ],
  },
  {
    id: 'forsaken',
    name: 'Forsaken',
    echelon: '4th',
    flavorText:
      'The quest is done, the enemy is defeated, and the Blade of a Thousand Years has passed from our hands. What do we do with the rest of our lives?',
    prerequisite:
      'Your party loses, destroys, or otherwise parts with an artifact.',
    effects: [
      {
        name: 'Characteristic Increase',
        description:
          'A characteristic of your choice increases by 1 (to a maximum of 6).',
      },
    ],
    choices: [
      {
        name: 'Brief Reunion',
        description:
          "While you're winded, you can use a maneuver to summon the artifact to your hand. It disappears at the end of your next turn. Once you use this benefit, you can't use it again until you earn 1 or more Victories.",
      },
      {
        name: 'Perfect Protection',
        description:
          'The Director chooses a damage type that is dealt by or thematically related to the artifact—for instance, holy for the Blade of a Thousand Years, psychic for the Encepter, or corruption for the Mortal Coil. You have immunity all to the chosen damage type.',
      },
      {
        name: 'Poor Compensation',
        description:
          "Instead of disappearing or otherwise departing, the artifact turns into a trinket or leveled treasure of the Director's choice that has the same approximate shape as the lost item—for instance, any magic sword for the Blade of a Thousand Years, any implement for the Encepter, or a Thief of Joy or any other torque for the Mortal Coil.",
      },
    ],
  },
  {
    id: 'monarch',
    name: 'Monarch',
    echelon: '4th',
    flavorText: 'The tyrant is dead! Long live the new king!',
    prerequisite:
      'You or a member of your party becomes the monarch of a nation.',
    effects: [
      {
        name: 'Royal Authority',
        description:
          'Inhabitants of your nation must obey your lawful orders or suffer the consequences.',
      },
      {
        name: 'Royal Majesty',
        description:
          'Your choice of your Might or Presence increases by 1 (to a maximum of 6).',
      },
    ],
    choices: [
      {
        name: 'Crown Jewels',
        description:
          "You gain one of your nation's treasures—a trinket of the Director's choice.",
      },
      {
        name: 'Royal Fame',
        description: 'You earn 2 Renown.',
      },
      {
        name: 'Royal Retinue',
        description:
          'The number of followers you can recruit increases by 2.',
      },
      {
        name: 'Royal Wealth',
        description: 'You earn 2 Wealth.',
      },
    ],
  },
  {
    id: 'peace-bringer',
    name: 'Peace Bringer',
    echelon: '4th',
    flavorText:
      'There goes Diana, peace bringer. She has won many a victory with her sword, but her greatest deed was convincing two nations to stop fighting.',
    prerequisite:
      'You conduct a successful negotiation on which the fate of a nation or a world stands.',
    effects: [
      {
        name: 'Characteristic Increase',
        description:
          'Your choice of your Reason or Presence increases by 1 (to a maximum of 6).',
      },
    ],
    choices: [
      {
        name: 'Calm Heads Prevail',
        description:
          'When you make a test to stop combat and start a negotiation, you always obtain a tier 3 outcome.',
      },
      {
        name: 'Drop Your Sword',
        description:
          'When you succeed on a test using the Intimidate skill, you can cause affected creatures to drop any items they are holding.',
      },
      {
        name: 'Hear Me Out',
        description:
          "While you are present in a negotiation, an NPC's starting patience increases by 3 (to a maximum of 5).",
      },
      {
        name: 'Many Paths to Peace',
        description:
          'When you make a test with a skill from the interpersonal skill group, you can use any characteristic of your choice for the test.',
      },
    ],
  },
  {
    // NOTE: 'reborn' is an Anvil-custom title, not present in Forgesteel reference.
    // Kept for thematic flavor; verify against official Draw Steel rules if needed.
    id: 'reborn',
    name: 'Reborn',
    echelon: '4th',
    flavorText: 'I remember this world. I suppose my task is not yet complete.',
    prerequisite:
      'You died in glorious battle while on a quest for a higher power.',
    effects: [
      {
        name: 'Reborn',
        description:
          'A god or other powerful being has determined that it is not yet your time to die. Your body fades away, but you reappear alive 24 hours later in a location of your choice. You regain all your Stamina and Recoveries, and your choice of your Intuition or Presence increases by 1 (to a maximum of 6).',
      },
    ],
    choices: [
      {
        name: 'Holy Weapon',
        description:
          "You have a leveled treasure of the Director's choice.",
      },
      {
        name: 'Kill Me Once, Shame On You',
        description:
          'Choose a creature keyword belonging to one of the creatures who defeated you. Any creature with that keyword takes a bane on ability rolls against you.',
      },
      {
        name: 'Memories of the Beyond',
        description: 'You have two skills of your choice.',
      },
    ],
  },
  {
    id: 'theoretical-warrior',
    name: 'Theoretical Warrior',
    echelon: '4th',
    flavorText:
      "I've read about this tactic in books—it looks fairly straightforward.",
    prerequisite:
      'You have the Master Librarian title, and you complete a Learn From a Master project with a project goal of 1,000.',
    effects: [
      {
        name: 'Characteristic Increase',
        description:
          'Your choice of your Reason or Intuition increases by 1 (to a maximum of 6).',
      },
      {
        name: 'Heroic Ability',
        description:
          "Choose a heroic ability belonging to any class. You gain this heroic ability, which can be paid for using the Heroic Resource of your class. You can't use a heroic ability that requires a class feature you don't have.",
      },
    ],
  },
  {
    id: 'tireless',
    name: 'Tireless',
    echelon: '4th',
    flavorText:
      "To reach Giant's Foot by dawn, we'll have to run every step of the way. Let's get moving.",
    prerequisite:
      'You have the Unstoppable title, and you make or assist on a test as part of a montage test that obtains a full success.',
    effects: [
      {
        name: 'Characteristic Increase',
        description:
          'Your choice of your Might or Agility increases by 1 (to a maximum of 6).',
      },
    ],
    choices: [
      {
        name: 'Bounce Back Fast',
        description:
          "Whenever you rest for 8 hours or more, you can gain the benefit of a respite. Once you use this benefit, you can't use it again until you have taken a regular respite.",
      },
      {
        name: 'Reserves of Strength',
        description: 'Your recovery value is half your Stamina.',
      },
      {
        name: 'Undying',
        description:
          "You can't be affected by the bleeding condition.",
      },
    ],
  },
  {
    id: 'unchained',
    name: 'Unchained',
    echelon: '4th',
    flavorText: "I'll never get away with it? My dear, I already have.",
    prerequisite:
      'You have the Heist Hero title, and you have stolen a precious object or escaped from captivity while evading guards of 8th level or higher.',
    effects: [
      {
        name: 'Characteristic Increase',
        description:
          'Your choice of your Might or Agility increases by 1 (to a maximum of 6).',
      },
    ],
    choices: [
      {
        name: 'Bye-Bye',
        description:
          "You can use a maneuver to teleport yourself and each willing ally within 5 squares of you to new positions within 10 squares of your original starting point. Once you use this benefit, you can't use it again until you earn 1 or more Victories.",
      },
      {
        name: 'Laughs at Locks',
        description:
          "Whenever you make a test to open a lock or break a restraint, you don't need any tools and you automatically obtain a tier 3 outcome.",
      },
      {
        name: 'Slippery',
        description: "You can't be grabbed against your will.",
      },
    ],
  },
  // ============================================================================
  // FISHING & SUMMONER TITLES (Added from Forgesteel reference)
  // ============================================================================
  {
    id: 'angler',
    name: 'Angler',
    echelon: '1st',
    flavorText: '',
    prerequisite: '120 project points spent on the Tackle table while Fishing.',
    effects: [
      {
        name: 'Angler',
        description: 'You gain an edge on all Fishing project rolls.',
      },
    ],
  },
  {
    id: 'goldenrod',
    name: 'Goldenrod',
    echelon: '1st',
    flavorText: '',
    prerequisite: '300 project points spent on the Tackle table while Fishing.',
    effects: [
      {
        name: 'Goldenrod',
        description: 'Each time you undertake the Fishing project, you can reroll one project roll.',
      },
    ],
  },
  {
    id: 'master-of-reels',
    name: 'Master of Reels',
    echelon: '1st',
    flavorText: '',
    prerequisite: 'You gain this title by undertaking the Fishing project.',
    effects: [
      {
        name: 'Master of Reels',
        description: 'Whenever you deal damage to a target who is 2 or more squares away from you and that target isn\'t also force moved, you can pull the target a number of squares equal to your Agility, Reason, or Intuition score (your choice).',
      },
    ],
  },
  {
    id: 'safeguarded',
    name: 'Safeguarded',
    echelon: '1st',
    flavorText: 'They risk their lives for me because I risk my life for theirs. This fight belongs to all of us!',
    prerequisite: 'You earn a noble rank or earn the favor of a knight\'s guild.',
    effects: [
      {
        name: 'Effect',
        description: 'You start combat encounters with a squad of three minions from the specific monster band or people you earned this title from. The squad takes their turn as a part of your turn. On the squad\'s turn, they can take a move action and either a main action or a maneuver.\n\n**Special**: If two or more heroes in the party have this title from the same source, the party starts combat encounters with a squad of six minions instead. At the start of each round of combat, the heroes decide who controls the squad as a part of their turn.',
      },
    ],
  },
  {
    id: 'sigilwright',
    name: 'Sigilwright',
    echelon: '2nd',
    flavorText: 'Let\'s find out who\'s on the other side of the circle.',
    prerequisite: 'You complete a ritual to summon a non-minion entity using a summoning circle you drew.',
    effects: [],
    choices: [
      {
        name: 'Quick Gate',
        description: 'As a maneuver, you can etch an arcane circle in an adjacent square on the ground. Until the end of the encounter, you can use magic abilities and treat your Summoner\'s Range as if you were in that space. Each time you etch an arcane circle, your last circle fades and becomes inactive.',
      },
      {
        name: 'Ritual Circle',
        description: 'You can create summoning circles to summon entities as part of a respite.',
      },
      {
        name: 'Sigil Eye',
        description: 'You have an edge on tests made to identify summoning circles and who or where they\'re connected to. You also have an edge on strikes made against creatures not native to the manifold in which you\'re currently located.',
      },
    ],
  },
  {
    id: 'summoner-successor',
    name: 'Summoner Successor',
    echelon: '2nd',
    flavorText: 'When their leader fell, they started listening to me for some reason.',
    prerequisite: 'You can\'t use the Call Forth ability, and you defeat a leader or solo creature with a Summon or Call Forth ability, such as a high elf ordinator.',
    effects: [
      {
        name: 'Effect',
        description: 'Choose a signature minion from a summoner\'s portfolio that shares a keyword with one of the creatures the summoner could summon. You can summon three of that minion into a single squad (up to a maximum of four creatures) at the start of each of your turns in combat. The distance you can command them is equal to your ranged free strike distance. You also gain the Strike for Me triggered ability, which now has the Psionic keyword and loses the Magic keyword.\n\nAdditionally, you can summon up to two of your signature minion while outside of combat to do simple tasks.',
      },
    ],
  },
  {
    id: 'delegator',
    name: 'Delegator',
    echelon: '4th',
    flavorText: 'They\'re all yours, buddy.',
    prerequisite: 'You are a summoner, and you strike a deal with your portfolio\'s champion.',
    effects: [
      {
        name: 'Effect',
        description: 'At the start of a combat encounter, you can choose to translate yourself into your circle\'s source manifold while your champion fights and summons monsters in your place. The champion uses your Stamina, Recoveries, abilities, and features (except for your Summoner Strikes and Summoner\'s Kit). You can dismiss the champion and summon yourself back into the place you left at the end of an encounter.\n\nIf your champion would die while taking your place, you lose access to your Return to the Source feature and can only summon signature minions until you revive your champion as a respite activity.',
      },
    ],
  },
  {
    id: 'high-summoner',
    name: 'High Summoner of the Circle',
    echelon: '4th',
    flavorText: 'As I was taught, so I pass on to you.',
    prerequisite: 'You are a summoner, and you teach someone how to call forth two or more minions from your portfolio.',
    effects: [
      {
        name: 'Effect',
        description: 'You are considered a master that can be learned from using the Learn from a Master downtime project. Anyone that makes a project roll using you as the source gains a bonus to their roll equal to your Reason.',
      },
    ],
    choices: [
      {
        name: 'Essence Mastery',
        description: 'Your minions cost one fewer essence to summon (minimum cost of 1 essence).',
      },
      {
        name: 'Expanded Domain',
        description: 'Your Summoner\'s Range increases by 5. You can use your minions\' senses as your own as long as they\'re on the same manifold as you.',
      },
      {
        name: 'Signature Summoner',
        description: 'Select a 3-Essence minion you can call forth. At the start of each of your turns in combat, you summon the set number of minions listed on the stat block in place of your signature minions at no cost.',
      },
    ],
  },
];

// Sort titles within each echelon alphabetically
const sortedTitles = [...TITLES].sort((a, b) => {
  // First sort by echelon
  const echelonOrder = { '1st': 1, '2nd': 2, '3rd': 3, '4th': 4 };
  const echelonDiff = echelonOrder[a.echelon] - echelonOrder[b.echelon];
  if (echelonDiff !== 0) return echelonDiff;
  // Then sort alphabetically by name within the same echelon
  return a.name.localeCompare(b.name);
});

// Replace TITLES array with sorted version
TITLES.length = 0;
TITLES.push(...sortedTitles);

export const TITLES_BY_ECHELON: TitlesByEchelon = {
  '1st': TITLES.filter((t) => t.echelon === '1st'),
  '2nd': TITLES.filter((t) => t.echelon === '2nd'),
  '3rd': TITLES.filter((t) => t.echelon === '3rd'),
  '4th': TITLES.filter((t) => t.echelon === '4th'),
};
