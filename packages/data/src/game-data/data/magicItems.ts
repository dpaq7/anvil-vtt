// Magic Items Data from Draw Steel

export type ItemCategory = 'consumable' | 'trinket' | 'leveled' | 'artifact';
export type EquipmentSlot = 'head' | 'neck' | 'arms' | 'hands' | 'waist' | 'feet' | 'ring' | 'held' | 'mount' | 'armor' | 'weapon' | 'implement';

export interface MagicItem {
  id: string;
  name: string;
  category: ItemCategory;
  echelon: number; // 1-4
  slot?: EquipmentSlot;
  projectGoal?: number; // PP to craft
  effect: string;
  flavorText?: string; // Italicized description
  keywords?: string[]; // Magic, Potion, Psionic, etc.
  prerequisite?: string; // Item prerequisite for crafting
  enhancements?: ItemEnhancement[];
}

export interface ItemEnhancement {
  level: number;
  effect: string;
}

export const CONSUMABLE_ITEMS: MagicItem[] = [
  // 1st Echelon Consumables
  {
    id: 'black-ash-dart',
    name: 'Black Ash Dart',
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Weapon'],
    flavorText: 'A dart carved from obsidian and coated in ashen powder.',
    effect: 'Make a ranged strike with this dart. On a hit, deal extra damage and teleport the target: T1: +2 damage, teleport 1 sq. T2: +4 damage, teleport 3 sq. T3: +6 damage, teleport 5 sq.',
  },
  {
    id: 'blood-essence-vial',
    name: 'Blood Essence Vial',
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Potion'],
    flavorText: 'A crystalline vial filled with shimmering crimson liquid.',
    effect: 'As a maneuver, drink to regain Stamina equal to half the damage you dealt since your last turn. Spend 1 Heroic Resource to regain full damage dealt instead.',
  },
  {
    id: 'buzz-balm',
    name: 'Buzz Balm',
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Salve'],
    flavorText: 'A jar of buzzing golden salve that tingles on contact.',
    effect: 'As a maneuver, apply to end Bleeding and Weakened conditions. Gain +2 speed until end of turn.',
  },
  {
    id: 'catapult-dust',
    name: 'Catapult Dust',
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Powder'],
    flavorText: 'Fine silver dust that glitters with kinetic potential.',
    effect: 'As a main action, throw in a 3-cube area. All creatures in area are launched 6+1d6 squares horizontally in direction of your choice.',
  },
  {
    id: 'giants-blood-flame',
    name: "Giant's-Blood Flame",
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Oil'],
    flavorText: 'A flask of volatile orange oil that flickers with inner flame.',
    effect: 'Coat a weapon: strikes deal +2 fire damage (1 hour). OR Throw: creates fire that burns for 1 hour, deals 5 fire damage to creatures ending turn in the area.',
  },
  {
    id: 'growth-potion',
    name: 'Growth Potion',
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Potion'],
    flavorText: 'A bubbling green potion that seems to expand within its bottle.',
    effect: 'Drink to double your maximum Stamina, Stability, and Might score. Your size increases by 1. Lasts 10 minutes.',
  },
  {
    id: 'healing-potion',
    name: 'Healing Potion',
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Potion'],
    flavorText: 'Thick and red, this liquid tastes of sour beer.',
    effect: 'As a maneuver, drink to regain Stamina equal to your Recovery Value without spending a Recovery.',
  },
  {
    id: 'imps-tongue',
    name: "Imp's Tongue",
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Tongue'],
    flavorText: 'A preserved forked tongue that squirms when held.',
    effect: 'As a maneuver, consume to speak and understand any language for 1 hour.',
  },
  {
    id: 'lachomp-tooth',
    name: 'Lachomp Tooth',
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Psionic', 'Tooth'],
    flavorText: 'A razor-sharp fang that pulses with psychic energy.',
    effect: 'As a maneuver, consume. Your next strike deals +3 psychic damage and targets all creatures adjacent to the primary target.',
  },
  {
    id: 'mirror-token',
    name: 'Mirror Token',
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Token'],
    flavorText: 'A small silver disc that reflects more than light.',
    effect: 'As a triggered action when targeted by a ranged strike, ignore all damage and effects. Half the damage is reflected back to the attacker.',
  },
  {
    id: 'pocket-homunculus',
    name: 'Pocket Homunculus',
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Creature'],
    flavorText: 'A tiny clay figurine that twitches with latent life.',
    effect: 'As a maneuver, activate to summon a duplicate of yourself with 15 Stamina. It acts on your turn and can take actions as you direct.',
  },
  {
    id: 'portable-cloud',
    name: 'Portable Cloud',
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Sphere'],
    flavorText: 'A glass sphere filled with swirling mist.',
    effect: 'As a maneuver, throw to create a 4-cube fog cloud (10 min). Variants: Poison (2 poison damage EoT), Fear (Frightened on entry), Sleep (save or fall unconscious).',
  },
  {
    id: 'quaff-n-huff-snuff',
    name: "Professor Veratismo's Quaff 'n Huff Snuff",
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Powder'],
    flavorText: 'A pinch of truth-compelling powder in an ornate tin.',
    effect: 'As a maneuver, blow into a target\'s face. They can only speak the truth for 1 hour.',
  },
  {
    id: 'snapdragon',
    name: 'Snapdragon',
    category: 'consumable',
    echelon: 1,
    projectGoal: 45,
    keywords: ['Magic', 'Plant'],
    flavorText: 'A dried flower that crackles with contained energy.',
    effect: 'As a maneuver, inhale deeply. Your next damaging ability deals +5 damage and any forced movement increases by 2 squares.',
  },
  // 2nd Echelon Consumables
  {
    id: 'breath-of-dawn',
    name: 'Breath of Dawn',
    category: 'consumable',
    echelon: 2,
    projectGoal: 90,
    keywords: ['Magic', 'Incense'],
    flavorText: 'Golden incense that smells of sunrise and hope.',
    effect: 'As a maneuver, inhale to end Frightened, Slowed, and Taunted conditions. Gain +8 Stability until end of encounter.',
  },
  {
    id: 'bull-shot',
    name: 'Bull Shot',
    category: 'consumable',
    echelon: 2,
    projectGoal: 90,
    keywords: ['Magic', 'Potion'],
    flavorText: 'A murky potion that smells of musk and rage.',
    effect: 'As a maneuver, drink to grow horns. Your next Charge strike automatically grabs the target and inflicts Bleeding.',
  },
  {
    id: 'chocolate-of-immovability',
    name: 'Chocolate of Immovability',
    category: 'consumable',
    echelon: 2,
    projectGoal: 90,
    keywords: ['Magic', 'Food'],
    flavorText: 'Dense chocolate that seems impossibly heavy for its size.',
    effect: 'As a maneuver, eat to gain 15 Temporary Stamina and +10 Stability until end of encounter.',
  },
  {
    id: 'concealment-potion',
    name: 'Concealment Potion',
    category: 'consumable',
    echelon: 2,
    projectGoal: 90,
    keywords: ['Magic', 'Potion'],
    flavorText: 'A swirling grey potion that becomes transparent when shaken.',
    effect: 'As a maneuver, drink to gain double edge on Hide and Sneak tests. You can Hide even if observed. Lasts 10 minutes.',
  },
  {
    id: 'float-powder',
    name: 'Float Powder',
    category: 'consumable',
    echelon: 2,
    projectGoal: 90,
    keywords: ['Magic', 'Powder'],
    flavorText: 'Iridescent dust that defies gravity in its container.',
    effect: 'As a maneuver, inhale to gain flight and hover for 1 hour. Your Stability becomes 0 while floating.',
  },
  {
    id: 'purified-jelly',
    name: 'Purified Jelly',
    category: 'consumable',
    echelon: 2,
    projectGoal: 90,
    keywords: ['Magic', 'Gel'],
    flavorText: 'Clear jelly that shimmers like water.',
    effect: 'As a maneuver, consume to breathe underwater and ignore inhaled poisons for 1 hour.',
  },
  {
    id: 'scroll-of-resurrection',
    name: 'Scroll of Resurrection',
    category: 'consumable',
    echelon: 2,
    projectGoal: 90,
    keywords: ['Magic', 'Scroll'],
    flavorText: 'Ancient parchment inscribed with life-giving runes.',
    effect: 'During a respite, read to revive a creature that died within the past year. The creature returns with full Stamina.',
  },
  {
    id: 'telemagnet',
    name: 'Telemagnet',
    category: 'consumable',
    echelon: 2,
    projectGoal: 90,
    keywords: ['Psionic', 'Wand'],
    flavorText: 'A thin wand that hums with gravitational force.',
    effect: 'As a maneuver, snap the wand. One target of size 3 or less within sight is pulled vertically: T1: 6 sq. T2: 3 sq. T3: 1 sq.',
  },
  {
    id: 'vial-of-ethereal-attack',
    name: 'Vial of Ethereal Attack',
    category: 'consumable',
    echelon: 2,
    projectGoal: 90,
    keywords: ['Magic', 'Vial'],
    flavorText: 'A vial containing swirling purple mist that phases through the glass.',
    effect: 'As a maneuver, throw to create a 2-cube ethereal vortex until end of encounter. Creatures in area take 5 damage at end of turn and on entry.',
  },
  // 3rd Echelon Consumables
  {
    id: 'anamorphic-larva',
    name: 'Anamorphic Larva',
    category: 'consumable',
    echelon: 3,
    projectGoal: 180,
    keywords: ['Psionic', 'Creature'],
    flavorText: 'A writhing larva that grows when exposed to psychic energy.',
    effect: 'As a maneuver, release to create a 10-square wall of larval flesh. Creatures adjacent to the wall take 3 psychic damage at end of turn.',
  },
  {
    id: 'bottled-paradox',
    name: 'Bottled Paradox',
    category: 'consumable',
    echelon: 3,
    projectGoal: 180,
    keywords: ['Magic', 'Bottle'],
    flavorText: 'A bottle containing swirling temporal energy.',
    effect: 'Drink: Reroll any failed test from the last minute. OR Throw: All creatures in 3-cube area may alter one action taken in the last round.',
  },
  {
    id: 'gallios-visiting-card',
    name: "G'Allios Visiting Card",
    category: 'consumable',
    echelon: 3,
    projectGoal: 180,
    keywords: ['Magic', 'Card'],
    flavorText: 'An infernal calling card that smells faintly of brimstone.',
    effect: 'As a triggered action when taking damage, ignore all damage and effects. A devil appears and redirects the effect to the attacker.',
  },
  {
    id: 'personal-effigy',
    name: 'Personal Effigy',
    category: 'consumable',
    echelon: 3,
    projectGoal: 120,
    keywords: ['Magic', 'Effigy'],
    flavorText: 'A small wax figurine that must be crafted in the target\'s likeness.',
    effect: 'As a maneuver, burn an effigy of a creature that died within the last hour. The creature is revived with Temporary Stamina equal to their max.',
  },
  {
    id: 'stygian-liquor',
    name: 'Stygian Liquor',
    category: 'consumable',
    echelon: 3,
    projectGoal: 180,
    keywords: ['Magic', 'Potion'],
    flavorText: 'Pitch-black liquid that seems to absorb light.',
    effect: 'Drink to extend dying state to negative maximum Stamina for 24 hours. Dying damage is halved while under this effect.',
  },
  {
    id: 'timesplitter',
    name: 'Timesplitter',
    category: 'consumable',
    echelon: 3,
    projectGoal: 180,
    keywords: ['Psionic', 'Crystal'],
    flavorText: 'A fractured crystal that shows different timelines in each shard.',
    effect: 'As a maneuver, make a ranged free strike dealing +1d6 psychic damage. All creatures in 3-cube area are Slowed (save ends).',
  },
  {
    id: 'ward-token',
    name: 'Ward Token',
    category: 'consumable',
    echelon: 3,
    projectGoal: 180,
    keywords: ['Magic', 'Token'],
    flavorText: 'A protective amulet inscribed with warding runes.',
    effect: 'As a maneuver, shatter the token. Enemy abilities targeting you have double bane until end of encounter.',
  },
  {
    id: 'wellness-tonic',
    name: 'Wellness Tonic',
    category: 'consumable',
    echelon: 3,
    projectGoal: 180,
    keywords: ['Magic', 'Potion'],
    flavorText: 'A vibrant blue tonic that seems to glow with vitality.',
    effect: 'As a maneuver, drink to end up to 3 conditions or negative effects. You ignore all negative effects until end of turn.',
  },
  // 4th Echelon Consumables
  {
    id: 'breath-of-creation',
    name: 'Breath of Creation',
    category: 'consumable',
    echelon: 4,
    projectGoal: 360,
    keywords: ['Magic', 'Essence'],
    flavorText: 'A container holding the breath of a primordial being.',
    effect: 'As a maneuver, inhale to gain +1 Renown. Create a Size 2 portal to a 20-cube demiplane that persists until dismissed.',
  },
  {
    id: 'elixir-of-saint-elspeth',
    name: 'Elixir of Saint Elspeth',
    category: 'consumable',
    echelon: 4,
    projectGoal: 360,
    keywords: ['Magic', 'Potion'],
    flavorText: 'A golden elixir blessed by the legendary healer saint.',
    effect: 'As a maneuver, drink. For a number of rounds equal to your Victories, all enemy abilities targeting you automatically result in Tier 1 outcomes.',
  },
  {
    id: 'page-solaris',
    name: 'Page From the Infinite Library: Solaris',
    category: 'consumable',
    echelon: 4,
    projectGoal: 360,
    keywords: ['Magic', 'Scroll'],
    flavorText: 'A page radiating with the warmth of a captured sun.',
    effect: 'As a maneuver, spend 1 Heroic Resource and destroy the page. Create a 4-cube area of sun energy that deals 10 fire/holy damage to creatures inside until end of encounter.',
  },
  {
    id: 'restorative-bright-court',
    name: 'Restorative of the Bright Court',
    category: 'consumable',
    echelon: 4,
    projectGoal: 360,
    keywords: ['Magic', 'Vial'],
    flavorText: 'A crystal vial containing liquid starlight from the Fey realm.',
    effect: 'As a maneuver, open the vial. You and one ally within 5 squares each regain 1d6 Recoveries.',
  },
];

export const TRINKET_ITEMS: MagicItem[] = [
  // 1st Echelon Trinkets
  {
    id: 'color-cloak',
    name: 'Color Cloak (Any)',
    category: 'trinket',
    echelon: 1,
    slot: 'neck',
    projectGoal: 150,
    keywords: ['Magic', 'Neck'],
    flavorText: 'A rubbery hooded cloak emblazoned with an elemental sigil.',
    effect: 'Grants elemental immunity (Cold/Fire/Lightning) equal to your level. Triggered action when taking that damage: next damaging ability deals extra damage equal to your level, but immunity becomes weakness until end of next round.',
  },
  {
    id: 'deadweight',
    name: 'Deadweight',
    category: 'trinket',
    echelon: 1,
    slot: 'held',
    projectGoal: 150,
    keywords: ['Magic'],
    flavorText: 'Though this humanoid femur is coated in lead, it feels impossibly heavy for its size.',
    effect: 'Fall twice as fast, taking +1 damage per square fallen (max 75 total). If you fall 5+ squares, make a melee free strike as a free maneuver during the fall.',
  },
  {
    id: 'displacing-bracer',
    name: 'Displacing Replacement Bracer',
    category: 'trinket',
    echelon: 1,
    slot: 'arms',
    projectGoal: 150,
    keywords: ['Arms', 'Psionic'],
    flavorText: 'A wooden bangle etched with an ambigram sigil meaning "transfer."',
    effect: 'As a maneuver, swap a held object (Size 1S/1T) with another object of same size within 10 squares. Transfer is instant and silent. If target\'s Intuition < 4, they don\'t notice.',
  },
  {
    id: 'divine-vine',
    name: 'Divine Vine',
    category: 'trinket',
    echelon: 1,
    slot: 'held',
    projectGoal: 150,
    keywords: ['Magic'],
    flavorText: 'A coil of emerald-green vines topped with the jaws of an enormous Venus flytrap.',
    effect: 'As a maneuver, extend up to 5 squares to Grab a creature/object at range. Keep extended, pull target to you, or pull yourself to target. Stays attached until struck, escaped, or released.',
  },
  {
    id: 'flameshade-gloves',
    name: 'Flameshade Gloves',
    category: 'trinket',
    echelon: 1,
    slot: 'hands',
    projectGoal: 150,
    keywords: ['Hands', 'Psionic'],
    flavorText: 'These finely stitched gloves flicker in and out of reality when handled.',
    effect: 'During a move action, place hand on mundane object 1 square thick or less with open space behind it to pass through. If too thick or blocked, hand gets stuck (hard Might test to free).',
  },
  {
    id: 'gecko-gloves',
    name: 'Gecko Gloves',
    category: 'trinket',
    echelon: 1,
    slot: 'hands',
    projectGoal: 150,
    keywords: ['Hands', 'Magic'],
    flavorText: 'These scaled gloves have palms and fingers covered in near-invisible sticky hairs.',
    effect: 'Cannot be disarmed, cannot lose grip while climbing unless force moved. Creatures you grab take a bane on Escape Grab tests.',
  },
  {
    id: 'hellcharger-helm',
    name: 'Hellcharger Helm',
    category: 'trinket',
    echelon: 1,
    slot: 'head',
    projectGoal: 150,
    keywords: ['Head', 'Magic'],
    flavorText: 'A steel helm set with two curved ebony horns, a crackling plume of fire floating between them.',
    effect: 'When you Charge, gain +5 speed until end of turn. After charging, use Knockback as a free maneuver regardless of target\'s size.',
  },
  {
    id: 'mask-of-many',
    name: 'Mask of the Many',
    category: 'trinket',
    echelon: 1,
    slot: 'head',
    projectGoal: 150,
    keywords: ['Head', 'Magic'],
    flavorText: 'A plain white mask lined with soft black velvet that smells faintly of blood.',
    effect: 'As a maneuver, transform into any humanoid of equivalent size you\'ve seen. Includes their clothing/gear. Strike or Disengage ends the illusion and grants 1 surge.',
  },
  {
    id: 'quantum-satchel',
    name: 'Quantum Satchel',
    category: 'trinket',
    echelon: 1,
    slot: 'held',
    projectGoal: 150,
    keywords: ['Magic'],
    flavorText: 'A woven metal drawstring seals this plain-looking leather bag, affixed with an opal brooch.',
    effect: 'Place the brooch in a container/room to entangle that location with the bag. Items placed in the satchel appear near the brooch and can be retrieved by reaching inside.',
  },
  {
    id: 'unbinder-boots',
    name: 'Unbinder Boots',
    category: 'trinket',
    echelon: 1,
    slot: 'feet',
    projectGoal: 150,
    keywords: ['Feet', 'Magic'],
    flavorText: 'A pair of ornately embroidered leather boots covered in images of broken chains.',
    effect: 'Move through the air up to 3 squares above ground during movement. If you end your turn airborne, you fall.',
  },
  // 2nd Echelon Trinkets
  {
    id: 'bastion-belt',
    name: 'Bastion Belt',
    category: 'trinket',
    echelon: 2,
    slot: 'waist',
    projectGoal: 300,
    keywords: ['Waist', 'Magic'],
    flavorText: 'A broad leather belt reinforced with enchanted iron plates.',
    effect: 'While worn, gain +3 Stamina and +1 Stability. This Stamina bonus adds to bonuses from other treasures.',
  },
  {
    id: 'evilest-eye',
    name: 'Evilest Eye',
    category: 'trinket',
    echelon: 2,
    slot: 'neck',
    projectGoal: 300,
    keywords: ['Neck', 'Magic'],
    flavorText: 'A pendant containing a preserved eye that seems to follow enemies.',
    effect: 'As a maneuver, target one enemy within 10 squares. You and each ally within 2 squares of the target each gain 1 surge.',
  },
  {
    id: 'insightful-crown',
    name: 'Insightful Crown',
    category: 'trinket',
    echelon: 2,
    slot: 'head',
    projectGoal: 300,
    keywords: ['Head', 'Magic'],
    flavorText: 'A delicate circlet that pulses with soft blue light near deception.',
    effect: 'Gain edge on Intuition tests to read emotions/honesty. On success reading a creature within 5 squares, ask the Director one question about something the creature knows.',
  },
  {
    id: 'key-of-inquiry',
    name: 'Key of Inquiry',
    category: 'trinket',
    echelon: 2,
    slot: 'held',
    projectGoal: 300,
    keywords: ['Magic'],
    flavorText: 'An ornate key that glows when near secrets.',
    effect: 'As a maneuver, touch an adjacent willing/grabbed/restrained creature. Twist clockwise: they answer 3 questions truthfully. Twist counterclockwise: they forget the last 30 minutes. Single use per target (1 year cooldown).',
  },
  {
    id: 'mediators-charm',
    name: "Mediator's Charm",
    category: 'trinket',
    echelon: 2,
    slot: 'head',
    projectGoal: 300,
    keywords: ['Head', 'Magic'],
    flavorText: 'A charm depicting scales in perfect balance.',
    effect: 'NPC patience +1 in negotiations (max 5). At negotiation start, learn one of the NPC\'s motivations or pitfalls (Director\'s choice).',
  },
  {
    id: 'necklace-of-bayou',
    name: 'Necklace of the Bayou',
    category: 'trinket',
    echelon: 2,
    slot: 'neck',
    projectGoal: 300,
    keywords: ['Neck', 'Magic'],
    flavorText: 'A string of iridescent shells that never fully dry.',
    effect: 'Breathe underwater, swim at full speed automatically, ignore difficult terrain from water/marsh.',
  },
  {
    id: 'scannerstone',
    name: 'Scannerstone',
    category: 'trinket',
    echelon: 2,
    slot: 'held',
    projectGoal: 300,
    keywords: ['Magic'],
    flavorText: 'A smooth stone that projects ghostly images.',
    effect: 'Hold against a surface 1 sq thick or less. Creates a floating image showing the space beyond: floors, walls, barriers, and moving creatures (not still creatures or objects).',
  },
  {
    id: 'stop-n-go-coin',
    name: "Stop-'n-Go Coin",
    category: 'trinket',
    echelon: 2,
    slot: 'held',
    projectGoal: 300,
    keywords: ['Magic'],
    flavorText: 'A two-faced coin that determines fate.',
    effect: 'As a maneuver, flip the coin. Roll d3: 1-Red: 2 sq area is difficult terrain for enemies (EoT). 2-Green: +2 speed (EoT). 3-Edge: Both effects.',
  },
  // 3rd Echelon Trinkets
  {
    id: 'bracers-of-strife',
    name: 'Bracers of Strife',
    category: 'trinket',
    echelon: 3,
    slot: 'arms',
    projectGoal: 450,
    keywords: ['Arms', 'Magic'],
    flavorText: 'Spiked bracers that hunger for conflict.',
    effect: '+2 bonus to rolled damage. +1 bonus to distance of any push effects you inflict.',
  },
  {
    id: 'crystallized-essence',
    name: 'Crystallized Essence',
    category: 'trinket',
    echelon: 3,
    slot: 'held',
    projectGoal: 450,
    keywords: ['Magic'],
    flavorText: 'A crystal pulsing with concentrated magical energy.',
    effect: '+5 Ranged Magic Distance while held. Can destroy the crystal as a free action to immediately gain +5 Essence.',
  },
  {
    id: 'cross-puppeteer',
    name: 'Cross of the Scorned Puppeteer',
    category: 'trinket',
    echelon: 3,
    slot: 'held',
    projectGoal: 450,
    keywords: ['Magic'],
    flavorText: 'A marionette control cross that moves on its own.',
    effect: 'When an enemy minion is destroyed, you can summon and command an illusionary double of it. The illusion fights for you until destroyed.',
  },
  {
    id: 'mask-of-oversight',
    name: 'Mask of Oversight',
    category: 'trinket',
    echelon: 3,
    slot: 'head',
    projectGoal: 450,
    keywords: ['Head', 'Magic'],
    flavorText: 'A mask with multiple eye holes that sprout floating eyeballs.',
    effect: 'As a maneuver, gain 360-degree vision and spawn multiple eyes. Double edge on search/Intrigue tests. As a maneuver, launch 3 eyes at enemies (deal damage).',
  },
  {
    id: 'mirage-band',
    name: 'Mirage Band',
    category: 'trinket',
    echelon: 3,
    slot: 'head',
    projectGoal: 450,
    keywords: ['Head', 'Psionic'],
    flavorText: 'A headband that reveals truth and creates deception.',
    effect: 'Automatically see through illusions, invisibility, and concealment. As a maneuver, create an illusionary disguise aura around yourself.',
  },
  {
    id: 'nullfield-ring',
    name: 'Nullfield Resonator Ring',
    category: 'trinket',
    echelon: 3,
    slot: 'ring',
    projectGoal: 450,
    keywords: ['Ring', 'Psionic'],
    flavorText: 'A ring that resonates with psionic dampening fields.',
    effect: 'Null class only. Null Field area +1. Gain signature ability Nullring Strike: melee strike dealing psychic damage, dazes and slows target.',
  },
  {
    id: 'shifting-ring',
    name: 'Shifting Ring',
    category: 'trinket',
    echelon: 3,
    slot: 'ring',
    projectGoal: 450,
    keywords: ['Ring', 'Psionic'],
    flavorText: 'This silvery metal ring seems to momentarily vanish when observed from certain angles.',
    effect: 'Once per turn, as a maneuver teleport up to 3 squares. When teleporting from any other effect, teleport up to 3 additional squares.',
  },
  {
    id: 'thunder-chariot',
    name: 'Thunder Chariot',
    category: 'trinket',
    echelon: 3,
    slot: 'mount',
    projectGoal: 450,
    keywords: ['Mount', 'Magic'],
    flavorText: 'A chariot crackling with electrical energy.',
    effect: 'Size 2 mount with +3 Speed. While riding, you have lightning immunity 5.',
  },
  {
    id: 'warbanner-pride',
    name: 'Warbanner of Pride',
    category: 'trinket',
    echelon: 3,
    slot: 'held',
    projectGoal: 450,
    keywords: ['Magic'],
    flavorText: 'A banner that inspires allies to resist adversity.',
    effect: '+1 bonus to saving throws and resisting potencies. Allies within 10 squares may make a saving throw at end of each turn.',
  },
  // 4th Echelon Trinkets
  {
    id: 'gravekeepers-lantern',
    name: "Gravekeeper's Lantern",
    category: 'trinket',
    echelon: 4,
    slot: 'held',
    projectGoal: 900,
    keywords: ['Magic'],
    flavorText: 'A lantern that burns with ghostly light and attracts spirits.',
    effect: 'As a maneuver, trap a nonhostile spirit (Intuition test). Make a Presence test to question trapped spirits about what they know.',
  },
  {
    id: 'hagbasket',
    name: 'Hagbasket',
    category: 'trinket',
    echelon: 4,
    slot: 'mount',
    projectGoal: 900,
    keywords: ['Mount', 'Magic'],
    flavorText: 'A flying basket woven from dark wood that cackles when airborne.',
    effect: 'Size 2 mount with fly and hover. Attacks targeting you while riding have double edge (easier to hit but you\'re highly mobile).',
  },
  {
    id: 'psi-blade',
    name: 'Psi Blade',
    category: 'trinket',
    echelon: 4,
    slot: 'arms',
    projectGoal: 900,
    keywords: ['Arms', 'Psionic'],
    flavorText: 'A bracer that projects a blade of pure psychic energy.',
    effect: 'As a maneuver, project a psychic blade. Once per turn as a maneuver, make a free strike dealing +3 psychic damage.',
  },
  {
    id: 'warbanner-wrath',
    name: 'Warbanner of Wrath',
    category: 'trinket',
    echelon: 4,
    slot: 'held',
    projectGoal: 900,
    keywords: ['Magic'],
    flavorText: 'A crimson banner that feeds on your fury.',
    effect: 'Regain 1 Recovery at end of each encounter. Strike damage increases based on Recoveries remaining (fewer Recoveries = more damage).',
  },
];

export const LEVELED_ITEMS: MagicItem[] = [
  // Armor
  {
    id: 'adaptive-second-skin',
    name: 'Adaptive Second Skin of Toxins',
    category: 'leveled',
    echelon: 1,
    slot: 'armor',
    projectGoal: 450,
    keywords: ['Magic', 'Armor'],
    flavorText: 'A living suit of flexible chitin that secretes protective toxins.',
    effect: 'Stamina bonus and acid/poison immunity that scales with level.',
    enhancements: [
      { level: 1, effect: '+6 Stamina. Acid/Poison Immunity equal to your level.' },
      { level: 5, effect: '+12 Stamina. Creatures adjacent to you take 3 acid damage at start of their turn.' },
      { level: 9, effect: '+21 Stamina. As a main action, create a 3-cube poison gas cloud that deals 5 poison damage (EoT).' },
    ],
  },
  {
    id: 'chain-sea-sky',
    name: 'Chain of the Sea and Sky',
    category: 'leveled',
    echelon: 1,
    slot: 'armor',
    projectGoal: 450,
    keywords: ['Magic', 'Armor'],
    flavorText: 'Interlocking scales of blue-grey metal that shimmer like water and clouds.',
    effect: 'Stamina bonus with aquatic and aerial mobility.',
    enhancements: [
      { level: 1, effect: '+6 Stamina. Swim at full speed, breathe underwater.' },
      { level: 5, effect: '+12 Stamina. Glide when falling, Cold Immunity equal to level.' },
      { level: 9, effect: '+21 Stamina. Cold Immunity 10. Strikes from above gain edge, strikes from below take bane.' },
    ],
  },
  {
    id: 'grand-scarab',
    name: 'Grand Scarab',
    category: 'leveled',
    echelon: 1,
    slot: 'armor',
    projectGoal: 450,
    keywords: ['Magic', 'Armor'],
    flavorText: 'Iridescent beetle-shell plates that unfold into gleaming wings.',
    effect: 'Stamina bonus with increasing flight capability.',
    enhancements: [
      { level: 1, effect: '+6 Stamina. Fly speed equal to Speed (fall at end of turn).' },
      { level: 5, effect: '+12 Stamina. Fly speed (no falling, can hover).' },
      { level: 9, effect: '+21 Stamina. Strikes while flying gain edge.' },
    ],
  },
  {
    id: 'kuranzoi-prismscale',
    name: "Kuran'zoi Prismscale",
    category: 'leveled',
    echelon: 1,
    slot: 'armor',
    projectGoal: 450,
    keywords: ['Magic', 'Armor'],
    flavorText: 'Dragon scales that refract light into defensive patterns.',
    effect: 'Stamina bonus with reactive defensive abilities.',
    enhancements: [
      { level: 1, effect: '+6 Stamina. Triggered Action when damaged: Slow the attacker (EoT).' },
      { level: 5, effect: '+12 Stamina. Attacker also takes 5 corruption damage.' },
      { level: 9, effect: '+21 Stamina. Teleport 3 squares and become invisible (EoT) when damaged.' },
    ],
  },
  {
    id: 'kings-roar',
    name: "King's Roar",
    category: 'leveled',
    echelon: 1,
    slot: 'armor',
    projectGoal: 450,
    keywords: ['Magic', 'Shield'],
    flavorText: 'A sunmetal kite shield bearing the face of a lion whose mouth opens wider over the course of battle.',
    effect: 'Stamina bonus with a roaring push attack.',
    enhancements: [
      { level: 1, effect: '+3 Stamina. Maneuver: roar to push an adjacent creature up to 3 squares.' },
      { level: 5, effect: '+6 Stamina. Target within 3 squares, push up to 4 squares.' },
      { level: 9, effect: '+9 Stamina. Target within 6 squares, push up to 5 squares and slow (EoT).' },
    ],
  },
  // Weapons
  {
    id: 'blade-quintessence',
    name: 'Blade of Quintessence',
    category: 'leveled',
    echelon: 1,
    slot: 'weapon',
    projectGoal: 450,
    keywords: ['Magic', 'Medium Weapon'],
    flavorText: 'This crystal blade houses a stormy vortex of fire, ice, and lightning.',
    effect: 'Damage bonus with elemental damage type versatility.',
    enhancements: [
      { level: 1, effect: '+1 damage. Change damage type to cold, fire, lightning, or sonic.' },
      { level: 5, effect: '+2 damage. Can throw (returns). Ranged abilities +3 distance.' },
      { level: 9, effect: '+3 damage. Immunity 10 to cold, fire, lightning, and sonic.' },
    ],
  },
  {
    id: 'displacer-battleaxe',
    name: 'Displacer',
    category: 'leveled',
    echelon: 1,
    slot: 'weapon',
    projectGoal: 450,
    keywords: ['Magic', 'Heavy Weapon'],
    flavorText: 'A massive battleaxe that bends space when it strikes.',
    effect: 'Damage bonus with teleportation on hit.',
    enhancements: [
      { level: 1, effect: '+1 damage. Maneuver: swap places with struck target.' },
      { level: 5, effect: '+2 damage. Can also swap with an ally adjacent to target.' },
      { level: 9, effect: '+3 damage. Swapped target is weakened (EoT).' },
    ],
  },
  {
    id: 'executioners-blade',
    name: "Executioner's Blade",
    category: 'leveled',
    echelon: 1,
    slot: 'weapon',
    projectGoal: 450,
    keywords: ['Magic', 'Heavy Weapon'],
    flavorText: 'A black blade that whispers the names of those it has slain.',
    effect: 'Damage bonus with extra damage against weakened targets.',
    enhancements: [
      { level: 1, effect: '+1 damage. Deals psychic damage. +3 damage vs winded targets.' },
      { level: 5, effect: '+2 damage. Winded targets deal 3 psychic damage to themselves.' },
      { level: 9, effect: '+3 damage. Winded targets are restrained (EoT).' },
    ],
  },
  {
    id: 'icemaker-maul',
    name: 'Icemaker Maul',
    category: 'leveled',
    echelon: 1,
    slot: 'weapon',
    projectGoal: 450,
    keywords: ['Magic', 'Heavy Weapon'],
    flavorText: 'A hammer of frozen iron that trails frost wherever it swings.',
    effect: 'Damage bonus with cold damage and freezing aura.',
    enhancements: [
      { level: 1, effect: '+1 damage. Deals cold damage. Maneuver: 1-cube cold aura deals 2 damage (EoT).' },
      { level: 5, effect: '+2 damage. Aura increases to 2 cubes.' },
      { level: 9, effect: '+3 damage. Aura increases to 3 cubes.' },
    ],
  },
  {
    id: 'thunderhead-bident',
    name: 'Thunderhead Bident',
    category: 'leveled',
    echelon: 1,
    slot: 'weapon',
    projectGoal: 450,
    keywords: ['Magic', 'Medium Weapon'],
    flavorText: 'A two-pronged spear that crackles with sonic energy.',
    effect: 'Damage bonus with sonic damage and push effects.',
    enhancements: [
      { level: 1, effect: '+1 damage. Deals sonic damage. Push struck target 1 square.' },
      { level: 5, effect: '+2 damage. Push 3 squares. Can throw (returns).' },
      { level: 9, effect: '+3 damage. Can push vertically (launch into air).' },
    ],
  },
  // Implements
  {
    id: 'abjurers-bastion',
    name: "Abjurer's Bastion",
    category: 'leveled',
    echelon: 1,
    slot: 'implement',
    projectGoal: 450,
    keywords: ['Magic', 'Implement'],
    flavorText: 'A crystalline orb that projects barriers of hardened light.',
    effect: 'Damage bonus with protective field generation.',
    enhancements: [
      { level: 1, effect: '+1 damage.' },
      { level: 5, effect: '+2 damage. Maneuver: create 1-cube protection field (Damage Immunity 5).' },
      { level: 9, effect: '+3 damage. Field increases to 2 cubes. Damage Immunity 10.' },
    ],
  },
  {
    id: 'brittlebreaker',
    name: 'Brittlebreaker',
    category: 'leveled',
    echelon: 1,
    slot: 'implement',
    projectGoal: 450,
    keywords: ['Psionic', 'Implement'],
    flavorText: 'A jagged crystal wand that amplifies destructive mental energy.',
    effect: 'Psychic damage bonus that multiplies on critical hits.',
    enhancements: [
      { level: 1, effect: '+2 Psychic damage.' },
      { level: 5, effect: '+3 Psychic damage. Damage doubled on critical hit.' },
      { level: 9, effect: '+4 Psychic damage. Damage tripled on critical hit.' },
    ],
  },
  {
    id: 'ether-fueled-vessel',
    name: 'Ether-Fueled Vessel',
    category: 'leveled',
    echelon: 1,
    slot: 'implement',
    projectGoal: 450,
    keywords: ['Magic', 'Implement'],
    flavorText: 'A ghostly lantern that phases in and out of reality.',
    effect: 'Damage bonus with insubstantiality effects.',
    enhancements: [
      { level: 1, effect: '+1 damage. Targets damaged become insubstantial (EoT).' },
      { level: 5, effect: '+2 damage. Insubstantial targets take +3 extra damage from your attacks.' },
      { level: 9, effect: '+3 damage. Insubstantial allies ignore opportunity attacks.' },
    ],
  },
];

export const ARTIFACT_ITEMS: MagicItem[] = [
  {
    id: 'blade-thousand-years',
    name: 'Blade of a Thousand Years',
    category: 'artifact',
    echelon: 4,
    slot: 'weapon',
    keywords: ['Magic', 'Weapon'],
    flavorText: 'This fabled sword features a hilt made of glittering starlight, out of which its gleaming metal blade extends.',
    effect: 'SUITED FOR VICTORY: Takes any weapon form (light/medium/heavy). +5 Holy damage. Frightens and weakens creatures with holy weakness.\n\nRALLY THE RIGHTEOUS: Allies within 1 mile gain edge on weapon/magic abilities, Damage Immunity 5, +15 Stamina/max Stamina.\n\nTURN THE TIDE: Enemy minions within 1 mile are dazed. Leaders/solos take bane on ability rolls.\n\nVICTORY\'S ASSURANCE: Appears before historic battles. Disappears after 24 hours or victory. If you don\'t win, your soul is consumed.\n\nSOUL OF THE MARTYR: If you die holding this blade, your soul enters the hilt. Allies gain double edge, Immunity 10, +30 Stamina for 1 hour.',
  },
  {
    id: 'encepter',
    name: 'Encepter',
    category: 'artifact',
    echelon: 4,
    slot: 'implement',
    keywords: ['Magic', 'Implement'],
    flavorText: 'A scepter of pure light that embodies divine authority.',
    effect: 'SHINING PRESENCE: All Presence tests automatically result in Tier 3.\n\nCHAMPION\'S LASSO: As a maneuver, create a line of light that captures all creatures in its path. Captured creatures cannot move away from you.\n\nOBLITERATION: As a main action, destroy all lassoed targets. They are utterly annihilated, leaving no remains.',
  },
  {
    id: 'mortal-coil',
    name: 'Mortal Coil',
    category: 'artifact',
    echelon: 4,
    slot: 'held',
    keywords: ['Magic'],
    flavorText: 'A serpentine coil of dark metal that whispers promises of mortality to all who touch it.',
    effect: 'HOST BODY: The host gains +1 Main Action per turn but ages 10x faster and cannot regain Stamina or Recoveries by any means.\n\nPENUMBRA: Creates a 10-mile field where no creature can heal or regain Stamina. Within this field, mortals gain the power to permanently kill immortals and deities.\n\nThis artifact hungers for the death of gods.',
  },
];

export const ALL_MAGIC_ITEMS: MagicItem[] = [
  ...CONSUMABLE_ITEMS,
  ...TRINKET_ITEMS,
  ...LEVELED_ITEMS,
  ...ARTIFACT_ITEMS,
];

export const getItemsByCategory = (category: ItemCategory): MagicItem[] => {
  return ALL_MAGIC_ITEMS.filter(item => item.category === category);
};

export const getItemsByEchelon = (echelon: number): MagicItem[] => {
  return ALL_MAGIC_ITEMS.filter(item => item.echelon === echelon);
};

export const getItemById = (id: string): MagicItem | undefined => {
  return ALL_MAGIC_ITEMS.find(item => item.id === id);
};

// Parsed bonus interface
export interface ParsedBonus {
  stat: 'stamina' | 'stability' | 'speed' | 'damage' | 'savingThrow' | 'rangeDistance';
  value: number;
  conditional?: string;
}

/**
 * Parse stat bonuses from item effect text
 * Handles both base item effects and level-appropriate enhancements
 */
export const parseItemBonuses = (item: MagicItem, heroLevel: number = 1): ParsedBonus[] => {
  const bonuses: ParsedBonus[] = [];

  // For leveled items, find the appropriate enhancement based on hero level
  let effectText = item.effect;
  if (item.enhancements && item.category === 'leveled') {
    // Find highest applicable enhancement
    const applicable = item.enhancements.filter(enh => heroLevel >= enh.level);
    if (applicable.length > 0) {
      const best = applicable[applicable.length - 1];
      effectText = best.effect;
    } else {
      effectText = item.enhancements[0].effect;
    }
  }

  // Parse various bonus patterns from effect text
  const effect = effectText.toLowerCase();

  // Stamina bonuses: "+6 Stamina", "+12 Stamina", "+21 Stamina"
  const staminaMatch = effect.match(/\+(\d+)\s*stamina/i);
  if (staminaMatch) {
    bonuses.push({ stat: 'stamina', value: parseInt(staminaMatch[1]) });
  }

  // Stability bonuses: "+1 Stability", "+3 Stability", "+8 Stability"
  const stabilityMatch = effect.match(/\+(\d+)\s*stability/i);
  if (stabilityMatch) {
    bonuses.push({ stat: 'stability', value: parseInt(stabilityMatch[1]) });
  }

  // Speed bonuses: "+2 speed", "+3 speed"
  const speedMatch = effect.match(/\+(\d+)\s*speed/i);
  if (speedMatch) {
    bonuses.push({ stat: 'speed', value: parseInt(speedMatch[1]) });
  }

  // Damage bonuses: "+1 damage", "+2 damage", "+3 damage"
  const damageMatch = effect.match(/\+(\d+)\s*damage/i);
  if (damageMatch) {
    bonuses.push({ stat: 'damage', value: parseInt(damageMatch[1]) });
  }

  // Psychic damage (count as damage): "+2 Psychic damage"
  const psychicMatch = effect.match(/\+(\d+)\s*psychic\s*damage/i);
  if (psychicMatch && !damageMatch) {
    bonuses.push({ stat: 'damage', value: parseInt(psychicMatch[1]) });
  }

  // Saving throw bonuses: "+1 bonus to saving throws"
  const saveMatch = effect.match(/\+(\d+)\s*(?:bonus\s*to\s*)?sav(?:ing|e)/i);
  if (saveMatch) {
    bonuses.push({ stat: 'savingThrow', value: parseInt(saveMatch[1]) });
  }

  // Range/Distance bonuses: "+5 Ranged Magic Distance"
  const rangeMatch = effect.match(/\+(\d+)\s*(?:ranged\s*)?(?:magic\s*)?distance/i);
  if (rangeMatch) {
    bonuses.push({ stat: 'rangeDistance', value: parseInt(rangeMatch[1]) });
  }

  return bonuses;
};

/**
 * Get the current enhancement level for a leveled item based on hero level
 */
export const getEnhancementTier = (item: MagicItem, heroLevel: number): number => {
  if (!item.enhancements || item.category !== 'leveled') return 0;

  if (heroLevel >= 9) return 9;
  if (heroLevel >= 5) return 5;
  return 1;
};
