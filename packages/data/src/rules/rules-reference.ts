/**
 * Draw Steel Rules Reference
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * 39 core game rules for quick in-app lookup during play.
 */

/**
 * Categories of game rules
 */
export type RulesCategory =
  | 'combat'
  | 'movement'
  | 'terrain'
  | 'tactics'
  | 'conditions';

/**
 * A single game rule with searchable content
 */
export interface RulesItem {
  id: string;
  label: string;
  category: RulesCategory;
  content: string;
  keywords: string[];
}

/**
 * All 39 core game rules
 */
export const RULES_REFERENCE: RulesItem[] = [
  // ============================================
  // COMBAT RULES
  // ============================================
  {
    id: 'ability-distance',
    label: 'Ability Distance',
    category: 'combat',
    keywords: ['melee', 'ranged', 'area', 'self', 'aura', 'burst', 'cube', 'line', 'wall'],
    content: `An ability's "Distance" entry indicates how close you need to be to a creature or object to affect that target with the ability.

**Melee**: Melee abilities have a distance of "Melee X" and require you to make contact with a creature or object with your body, a weapon, or an implement. The number X is the maximum distance in squares at which you can physically make contact with another creature or object targeted by the ability.

**Ranged**: Ranged abilities have a distance of "Ranged X" and can be used to target creatures or objects too far away for you to make contact with. If you make a ranged strike while any enemy is adjacent to you, you have a bane on the strike's power roll.

**Melee or Ranged**: Some abilities have a melee distance and a ranged distance. When you use such an ability, you choose whether to use it as a melee or a ranged ability. An ability never has both the Melee and Ranged keywords at the same time.

**Self**: If an ability has a distance of "Self," that ability originates from you, and often affects only you.

**Area Abilities**: Area abilities cover a number of squares on the battlefield at once. Types include:
- **Aura X**: Originates from you and moves with you. Radius X squares.
- **Burst X**: Originates from you, radius X squares, instantaneous.
- **Cube X**: Cubic area with side length X.
- **Line A × B**: Length A squares, width/height B squares.
- **Wall X**: X connected squares that can be stacked vertically.`,
  },
  {
    id: 'ability-target',
    label: 'Ability Target',
    category: 'combat',
    keywords: ['creature', 'object', 'enemy', 'ally', 'self', 'target'],
    content: `The "Target" entry of an ability notes the number of creatures, objects, or both who can be targeted by that ability.

**Creature**: If an ability targets one or more creatures, it can affect creatures within the ability's distance or area. You aren't an eligible creature target for your own abilities unless those abilities also have "self" as a target.

**Object**: If an ability targets one or more objects, it can affect any object within the ability's distance or area. Unless otherwise noted, objects have poison immunity all and psychic immunity all.

**Enemy**: If an ability targets one or more enemies, it can affect only creatures who are hostile to the creature using the ability.

**Ally**: If an ability targets one or more allies, it can affect only willing creatures who are friendly to the creature using the ability. You aren't an eligible target for your own abilities that target allies unless those abilities also have "self" as a target.

**Self**: If an ability targets "self," it can affect only the creature using the ability.

**Each [Target]**: If an area ability says it applies to each creature, object, enemy, or ally in the area, then all eligible targets are affected.`,
  },
  {
    id: 'critical-hit',
    label: 'Critical Hit',
    category: 'combat',
    keywords: ['natural', '19', '20', 'critical', 'main action'],
    content: `Whenever you make an ability roll as a main action and the roll is a natural 19 or natural 20 — a total of 19 or 20 before adding your characteristic score or other modifiers — you score a critical hit.

A critical hit allows you to immediately take an additional main action after resolving the power roll, whether or not it's your turn and even if you are dazed.

You can't score a critical hit with an ability roll made as a maneuver or any other action type, but you can score a critical hit with a main action you use off your turn. For example, an opportunity attack made as a triggered action or a signature ability used as a free triggered action can be a critical hit.`,
  },
  {
    id: 'damage-and-effect',
    label: 'Damage and Effect',
    category: 'combat',
    keywords: ['damage', 'effect', 'power roll', 'tier'],
    content: `Strikes and area abilities can deal damage and have an additional effect on a target. The damage and the strength of the effect are determined by the ability roll.

Damage and effects are separated with a semicolon in a power roll tier entry:

**Power Roll + Might**:
- **11-**: 3 + M damage; push 1
- **12-16**: 6 + M damage; push 2
- **17+**: 9 + M damage; push 4

Unless otherwise indicated, any effects that are determined by a power roll's tier outcome occur after the power roll's damage has been dealt to all targets.

If an ability roll deals damage to multiple targets but its effect targets the creature using the ability or the Director, then the effect only occurs once, not once per target.`,
  },
  {
    id: 'main-action',
    label: 'Main Action',
    category: 'combat',
    keywords: ['action', 'main', 'ability', 'turn'],
    content: `When you take a main action, you most often do so to use a unique ability granted by your class, kit, or a treasure. These abilities represent the most unique, flavorful, and impactful things you can do with your main action.

You can also use your main action to:
- Help another creature regain Stamina
- Charge into battle
- Defend yourself
- Make a free strike

You can convert your main action into a maneuver or a move action, allowing you to take two maneuvers or move actions on your turn.`,
  },
  {
    id: 'taking-a-turn',
    label: 'Taking a Turn',
    category: 'combat',
    keywords: ['turn', 'action', 'maneuver', 'move'],
    content: `Each creature in combat gets to take a main action, a maneuver, and a move action on their turn.

You can perform your maneuver and main action in any order, and can break up the movement granted by your move action before, after, or between your maneuver and main action however you like.

You can also turn your main action into a move action or a maneuver, so that your turn can alternatively consist of:
- Two move actions and a maneuver
- Two maneuvers and a move action`,
  },
  {
    id: 'natural-roll',
    label: 'Natural Roll',
    category: 'combat',
    keywords: ['natural', 'roll', 'modifier', 'power roll'],
    content: `The total of your power roll before your characteristic or any other modifiers are added is called the natural roll. The rules often refer to this as "rolling a natural X," where X is the total of the roll.

For example, if you get a 20 on a power roll before adding your characteristic, this is called rolling a natural 20.

When you roll a natural 19 or 20 on a power roll, it is always a tier 3 result regardless of any modifiers, and on certain types of power rolls, this is a critical hit.`,
  },
  {
    id: 'roll-vs-multiple-creatures',
    label: 'Roll vs Multiple Creatures',
    category: 'combat',
    keywords: ['multiple', 'targets', 'area', 'strike'],
    content: `When an ability has multiple targets (whether a strike with more than one target or an area effect), you make one power roll and apply the total to all targets.

If you have edges or banes against some but not all of your targets, you might apply a different tier outcome to individual targets.

For example, if you target three creatures with a strike ability and the power roll totals 11, each of the targets should be affected by the tier 1 outcome. However, if you gain an edge on strikes against one of the targets to add 2 to the power roll, your total against that target is 13, and they are affected by the tier 2 outcome.`,
  },
  {
    id: 'opportunity-attack',
    label: 'Opportunity Attack',
    category: 'combat',
    keywords: ['opportunity', 'triggered', 'free strike', 'adjacent'],
    content: `Whenever a creature has an enemy adjacent to them and the enemy willingly moves to a space that isn't adjacent to the creature without shifting, the creature can take advantage of that movement to quickly make a melee free strike against the enemy as a free triggered action. This is called an opportunity attack.

If a creature has a bane or double bane on the power roll against the enemy, they can't make an opportunity attack.`,
  },
  {
    id: 'wielding-treasures',
    label: 'Wielding Treasures',
    category: 'combat',
    keywords: ['weapon', 'implement', 'armor', 'shield', 'treasure'],
    content: `Some treasures are wielded in the form of weapons or implements. A weapon might have the Light Weapon, Medium Weapon, or Heavy Weapon keywords, or might have a keyword denoting a specific category of weapon (Bow, Polearm, and so forth).

An implement might have the Implement keyword or a keyword denoting the type of implement (Orb, Wand, and so forth).

Armor is also considered a wielded treasure, with the Light Armor, Medium Armor, or Heavy Armor keywords, or the Shield keyword.

A hero can wield as many weapons, implements, suits of armor, or shields as they can feasibly hold or wear. However, an ability can benefit only from one weapon or implement at a time.`,
  },

  // ============================================
  // MOVEMENT RULES
  // ============================================
  {
    id: 'movement',
    label: 'Movement',
    category: 'movement',
    keywords: ['speed', 'squares', 'move', 'advance'],
    content: `Your hero starts with a speed granted by their ancestry—usually 5. This represents the maximum number of squares you can move when you take the Advance move action or when another effect allows you to move.

All squares adjacent to your character cost 1 movement to move into. No Pythagorean theorem on the grid.

Your hero can move freely through an ally's space. You can move through an enemy's space, but that space is difficult terrain. You can't stop moving in any other creature's space unless that creature's size is two or more sizes greater or smaller than your own.

**Can't Exceed Speed:** A single move or other effect can never allow a creature to move more squares than their speed, unless the effect states otherwise.

**Can't Cut Corners:** A creature can't move diagonally when doing so would involve passing through the corner of a wall or some other object that completely fills the corner.`,
  },
  {
    id: 'climbing-and-swimming',
    label: 'Climbing / Swimming',
    category: 'movement',
    keywords: ['climb', 'swim', 'vertical', 'water'],
    content: `A creature who has "climb" in their speed entry can climb across vertical and horizontal surfaces at full speed. Likewise, a creature who has "swim" in their speed entry can swim in liquid at full speed.

Creatures without those types of movement can still climb or swim when a rule allows them to move, but each square of climbing or swimming costs 2 squares of movement.

**Climbing other Creatures**: You can attempt to climb a creature whose size is greater than yours. If unwilling, make a Power Roll + Might or Agility:
- **≤11**: You fail and they can make a free strike against you
- **12-16**: You fail to climb
- **17+**: You climb the creature

While climbing a creature, you gain an edge to melee abilities used against them.`,
  },
  {
    id: 'crawling',
    label: 'Crawling',
    category: 'movement',
    keywords: ['prone', 'crawl', 'ground'],
    content: `If you are prone, you can remain prone and crawl on the ground. Doing so costs you 1 additional square of movement for every square you crawl.

If you intentionally want to crawl, you can fall prone as a free maneuver. While voluntarily prone, you can choose to stand as a free maneuver.`,
  },
  {
    id: 'falling',
    label: 'Falling',
    category: 'movement',
    keywords: ['fall', 'damage', 'prone', 'height'],
    content: `When a creature falls 2 or more squares and lands on the ground, they take 2 damage for each square they fall (to a maximum of 50 damage) and land prone.

A creature who falls can reduce the effective height of the fall by a number of squares equal to their Agility score (minimum 0). Falling into liquid 1+ square deep reduces the effective height by 4 squares.

Falling is not forced movement, but being force moved downward is considered falling. Movement from falling doesn't provoke opportunity attacks.

**Falling Onto Another Creature**: Causes that creature to take the same damage from the fall. The falling creature lands prone in the nearest unoccupied space.

**Falling Far**: First round: 100 squares. Each subsequent round: another 100 squares.`,
  },
  {
    id: 'jumping',
    label: 'Jumping',
    category: 'movement',
    keywords: ['jump', 'long jump', 'high jump'],
    content: `Whenever an effect allows you to move, you can automatically long jump a number of squares up to your Might or Agility score (your choice; minimum 1 square) as part of that movement. The height of your jump is automatically 1 square.

If you want to jump even longer or higher than your baseline jump allows, make a Might or Agility test:

| Roll | Effect |
|:-----|:-------|
| ≤11 | You don't jump any farther than your baseline allows |
| 12-16 | You jump 1 square longer and higher than baseline |
| 17+ | You jump 2 squares longer and higher than baseline |

You can't jump farther or higher than the distance of the effect that allows you to move. You can't jump out of difficult terrain or damaging terrain.`,
  },
  {
    id: 'shifting',
    label: 'Shifting',
    category: 'movement',
    keywords: ['shift', 'opportunity', 'safe', 'careful'],
    content: `Shifting is a careful form of movement that allows a creature to move safely past dangerous foes. Certain abilities, features, and other rules allow you to shift a specific number of squares, sometimes up to your speed.

Whenever you shift, creatures can't make opportunity attacks against you triggered by that movement.

You can't shift into or while within difficult terrain or damaging terrain. If a rule allows you to shift, you can choose to instead move up to the number of squares you would have shifted (for example, to get out of difficult terrain). However, you can't combine moving and shifting within that movement.`,
  },
  {
    id: 'teleporting',
    label: 'Teleporting',
    category: 'movement',
    keywords: ['teleport', 'instantaneous', 'line of effect'],
    content: `When a creature teleports, they move from one space to another space instantaneously. The following rules apply:

- Teleporting doesn't provoke opportunity attacks or other effects triggered by movement
- When teleporting, you bypass any obstacles between spaces
- You must have line of effect to your destination space
- Your destination space can't be occupied by another creature or object
- The teleport distance can be greater than your speed
- If you teleport while prone, you can be standing at your destination
- If you teleport while grabbed or restrained, those conditions end
- You must leave the space where you start and enter a new space`,
  },
  {
    id: 'flying',
    label: 'Flying',
    category: 'movement',
    keywords: ['fly', 'air', 'vertical', 'midair'],
    content: `A creature who has "fly" in their speed entry, or who gains the temporary ability to fly, can move through the air vertically or horizontally at full speed and remain in midair.

If a flying creature is knocked prone or has their speed reduced to 0, they fall.`,
  },
  {
    id: 'hover',
    label: 'Hover',
    category: 'movement',
    keywords: ['hover', 'stationary', 'midair'],
    content: `A creature who has "hover" in their speed entry (most commonly alongside "fly" or "teleport"), or who gains the temporary ability to hover, can remain motionless in midair.

They don't fall even if they are knocked prone or their speed is reduced to 0.`,
  },
  {
    id: 'burrowing',
    label: 'Burrowing',
    category: 'movement',
    keywords: ['burrow', 'underground', 'dig', 'dirt'],
    content: `A creature who has "burrow" in their speed entry can move through dirt horizontally, and either has the means to breathe while doing so or doesn't require air. Such creatures can't move through more solid ground (like stone) unless stated otherwise.

**Dig Maneuver**: To move vertically through the ground, a burrowing creature must use the Dig maneuver. They can move vertically up to squares equal to their size.

**Targeting Burrowing Creatures**: If you are on the ground, you have line of effect to a burrowing creature if they occupy terrain that can be burrowed through and that touches the ground. The burrowing creature gains the benefit of cover from you.

**Claw Dirt** (for non-burrowing creatures with speed 2+):
- **≤11**: Move 1 square into ground; slowed and weakened (EoT)
- **12-16**: Use main action to move 1 square; slowed (EoT)
- **17+**: Move 1 square into ground`,
  },
  {
    id: 'forced-movement',
    label: 'Forced Movement',
    category: 'movement',
    keywords: ['push', 'pull', 'slide', 'forced', 'vertical'],
    content: `Some actions allow a creature to push, pull, or slide a target:

- **Push X**: Move target up to X squares away in a straight line
- **Pull X**: Move target up to X squares toward you in a straight line
- **Slide X**: Move target up to X squares in any direction (except vertically)

You can always move that target fewer squares than indicated. Forced movement ignores difficult terrain and never provokes opportunity attacks.

**Vertical**: If specified, forced movement can move a target up or down. If a creature who can't fly is left in midair after vertical forced movement, they fall.

**Big vs Little**: When a larger creature force moves a smaller target with a melee weapon ability, the distance is increased by 1. If smaller force moves larger, no change.

**Forced Into a Fall**: If you can't fly and are force moved across an open space, you continue moving the total distance first. If still in a position to fall when the forced movement ends, you fall.`,
  },
  {
    id: 'during-the-move',
    label: 'During the Move',
    category: 'movement',
    keywords: ['move', 'during', 'effect'],
    content: `Certain ability effects allow you to move and affect other creatures or objects during that move, such as the shadow's One Hundred Throats ability.

For such abilities, the move begins in the space you first leave when you start the move and ends in the last space you move into.`,
  },
  {
    id: 'mounted-combat',
    label: 'Mounted Combat',
    category: 'movement',
    keywords: ['mount', 'ride', 'cavalry'],
    content: `A willing creature with the Mount role can serve as your mount as long as their size is greater than yours. You can climb onto your mount freely. While mounted, you can take the Ride move action, but a mount can only be ridden this way once per round.

Both mount and rider each take a turn during combat.

If a creature riding a mount is force moved, they are knocked off the mount and must make a test to determine how they land. If a mount is force moved, they carry any riders with them. Riders and mounts teleport separately.

If your mount dies, they fall prone, and you fall off them and land prone in the nearest unoccupied space of your choice.`,
  },

  // ============================================
  // TERRAIN RULES
  // ============================================
  {
    id: 'difficult-terrain',
    label: 'Difficult Terrain',
    category: 'terrain',
    keywords: ['difficult', 'terrain', 'movement', 'rubble', 'underbrush'],
    content: `Areas of thick underbrush, rubble, spiderwebs, or other obstacles to movement create difficult terrain.

It costs 1 additional square of movement to enter a square of difficult terrain.`,
  },
  {
    id: 'damaging-terrain',
    label: 'Damaging Terrain',
    category: 'terrain',
    keywords: ['damaging', 'terrain', 'acid', 'fire', 'lava', 'hazard'],
    content: `Areas of acid, fire, sharp rocks, lava, or any other terrain that causes damage to creatures within it is damaging terrain.

The damage dealt by damaging terrain is noted in the terrain's description or in the description of the effect that creates the terrain.`,
  },
  {
    id: 'high-ground',
    label: 'High Ground',
    category: 'terrain',
    keywords: ['high', 'ground', 'elevation', 'edge'],
    content: `Whenever a creature uses an ability to target a creature or object while standing on the ground and occupying a space that is fully above the target's space, they gain an edge on the power roll against that target.

To be fully above a target, the bottom of a creature's space must be higher than or bordering on the top of the target's space.

A creature can gain this benefit while climbing only if they have "climb" in their speed entry or can automatically climb at full speed while moving.`,
  },
  {
    id: 'underwater-combat',
    label: 'Underwater Combat',
    category: 'terrain',
    keywords: ['underwater', 'submerged', 'water', 'swim'],
    content: `If a creature is fully submerged in water, they have fire immunity 5 and lightning weakness 5.

If their speed doesn't have the Swim keyword, all their power rolls take a bane.`,
  },

  // ============================================
  // TACTICS RULES
  // ============================================
  {
    id: 'assist',
    label: 'Assisting a Test',
    category: 'tactics',
    keywords: ['assist', 'help', 'skill', 'test'],
    content: `You can attempt to assist another creature with a test they make, provided:
- You have a skill that applies to the test
- The other creature isn't using that same skill
- You can describe how your character helps to the Director's satisfaction

Make a test using your chosen skill and a characteristic chosen by the Director:

| Roll | Effect |
|:-----|:-------|
| ≤11 | You get in the way. The creature takes a bane on their test |
| 12-16 | Your help grants the other creature an edge on their test |
| 17+ | Your help gives the other creature a double edge on their test |`,
  },
  {
    id: 'concealment',
    label: 'Concealment',
    category: 'tactics',
    keywords: ['concealment', 'hidden', 'obscured', 'invisible', 'darkness'],
    content: `Darkness, fog, invisibility magic, and any other effect that fully obscures a creature or object but doesn't protect their physical form grants that creature or object concealment.

Even if you have line of effect to such a target, a creature or object has concealment from you if you can't see or otherwise observe them.

You can target a creature or object with concealment using a strike, provided they aren't hidden. However, strikes against such targets take a bane.`,
  },
  {
    id: 'cover',
    label: 'Cover',
    category: 'tactics',
    keywords: ['cover', 'blocked', 'tree', 'wall', 'protection'],
    content: `When you have line of effect to a creature or object but that target has at least half their form blocked by a solid object such as a tree, wall, or overturned table, the target has cover.

You take a bane on damage-dealing abilities used against creatures or objects that have cover from you.`,
  },
  {
    id: 'flanking',
    label: 'Flanking',
    category: 'tactics',
    keywords: ['flanking', 'opposite', 'ally', 'adjacent', 'melee'],
    content: `When you and one or more allies are adjacent to the same enemy and on opposite sides of the enemy, you are flanking that enemy.

While flanking an enemy, you gain an edge on melee strikes against them.

If you're unsure whether your hero and an ally are flanking a foe, imagine a line extending from the center of your space to the center of your ally's space. If that line passes through opposite sides or corners of the enemy's space, then you and your ally are flanking the enemy.

You must have line of effect to the enemy and be able to take triggered actions to gain or grant the flanking benefit.`,
  },
  {
    id: 'hiding',
    label: 'Hiding',
    category: 'tactics',
    keywords: ['hide', 'hidden', 'stealth', 'cover', 'concealment'],
    content: `To hide from a creature, you must have cover or concealment from that creature, who can't observe you attempting to hide. A creature is observing you if they're aware of your specific location before you attempt to hide.

When you use the Hide maneuver during combat while you have cover or concealment from a creature who isn't observing you, you are automatically hidden from them unless the Director deems otherwise.

While you are hidden from another creature:
- They can't target you with abilities that don't have the Area keyword
- You gain an edge on ability rolls made against that creature (lasts until end of turn when no longer hidden)

You are no longer hidden from a creature if you don't have cover or concealment from them. If you use an ability, interact with an enemy, or move without sneaking, you are no longer hidden once the activity resolves.`,
  },
  {
    id: 'sneaking',
    label: 'Sneaking',
    category: 'tactics',
    keywords: ['sneak', 'stealth', 'hidden', 'quiet'],
    content: `While you are hidden from another creature and not in combat, you can attempt to sneak—avoiding the senses of other creatures as you move around them in the open—to remain hidden.

While sneaking, your speed is halved.

To sneak, you make an Agility test using the Sneak skill with a difficulty set by the Director. If you succeed, you remain hidden during your movement.

This test can use another characteristic at the Director's discretion, such as using Presence to blend in with a crowd on a packed city street.`,
  },
  {
    id: 'slamming-creatures',
    label: 'Slamming into Creatures',
    category: 'tactics',
    keywords: ['slam', 'collision', 'forced movement', 'damage'],
    content: `When you force move a creature into another creature, the movement ends and both creatures take 1 damage for each square remaining in the first creature's forced movement.

You can also force move an object into a creature. The object's movement ends, and the creature takes 1 damage for each square remaining in the object's forced movement.

It's possible to move a creature or object of a larger size into several creatures of a smaller size at the same time. When this happens, the larger creature in the collision takes damage only once, not once for each smaller creature they slam into.

You can force move another creature into yourself with a pull or a slide.`,
  },
  {
    id: 'slamming-objects',
    label: 'Slamming into Objects',
    category: 'tactics',
    keywords: ['slam', 'object', 'collision', 'break', 'destroy'],
    content: `When a creature force moves a target into a stationary object that is the target's size or larger and the object doesn't break, the movement ends and the target takes 2 damage plus 1 damage for each square remaining in their forced movement.

If you force move a creature downward into an object that doesn't break (including the ground), they also take falling damage.

**Hurling through objects** - Cost in remaining squares and damage:
- **Glass** (1 square): 1 remaining square, 3 damage
- **Wood** (1 square): 3 remaining squares, 5 damage
- **Stone** (1 square): 6 remaining squares, 8 damage
- **Metal** (1 square): 9 remaining squares, 11 damage

If any forced movement remains after the object is destroyed, you can continue to move the creature.`,
  },
  {
    id: 'invisibility',
    label: 'Invisible Creatures',
    category: 'tactics',
    keywords: ['invisible', 'concealment', 'hidden', 'search'],
    content: `Invisible creatures always have concealment from other creatures.

If an invisible creature isn't hidden, they can still be targeted by abilities.

The test made to find a hidden creature who is invisible takes a bane.`,
  },

  // ============================================
  // CONDITIONS RULES
  // ============================================
  {
    id: 'dying-and-death',
    label: 'Dying and Death',
    category: 'conditions',
    keywords: ['dying', 'death', 'stamina', 'bleeding', 'winded'],
    content: `When your Stamina is 0 or lower, you are dying.

While dying:
- You can't take the Catch Breath maneuver in combat
- You are bleeding, and this condition can't be removed until you are no longer dying
- Your allies can help you spend Recoveries in combat
- You can spend Recoveries out of combat as usual

While your Stamina is lower than 0, if it reaches the negative of your winded value, you die.

When you die, you can't be brought back to life without the use of a special powerful item such as a Scroll of Resurrection.`,
  },
  {
    id: 'surprise',
    label: 'Surprise',
    category: 'conditions',
    keywords: ['surprise', 'ambush', 'unready', 'combat start'],
    content: `When battle starts, the Director determines which creatures, if any, are caught off guard.

Any creature who isn't ready for combat at the start of an encounter is surprised until the end of the first combat round.

A surprised creature:
- Can't take triggered actions or free triggered actions
- Ability rolls made against them gain an edge

For example, if the heroes sneak up unnoticed on a camp of marauders and attack, each marauder is surprised. If one of the heroes notices disguised enemies before they attack but has no opportunity to warn their allies, that hero isn't surprised but the rest of the characters are.`,
  },
  {
    id: 'suffocating',
    label: 'Suffocating',
    category: 'conditions',
    keywords: ['suffocate', 'breath', 'air', 'drowning'],
    content: `During combat or under similarly stressful circumstances, you can hold your breath for a number of combat rounds equal to your Might score (minimum 1 round).

At the end of each combat round after that, you take 1d6 damage while holding your breath.

Out of combat, you can hold your breath for a number of minutes equal to your Might score. Being unable to breathe after that time counts as a stressful condition, causing you to run out of air as above.`,
  },
];

/**
 * Get all rules
 */
export function getAllRules(): RulesItem[] {
  return RULES_REFERENCE;
}

/**
 * Get a rule by ID
 */
export function getRuleById(id: string): RulesItem | undefined {
  return RULES_REFERENCE.find(r => r.id === id);
}

/**
 * Get rules by category
 */
export function getRulesByCategory(category: RulesCategory): RulesItem[] {
  return RULES_REFERENCE.filter(r => r.category === category);
}

/**
 * Search rules by query (matches label, content, or keywords)
 */
export function searchRules(query: string): RulesItem[] {
  const lowerQuery = query.toLowerCase();
  return RULES_REFERENCE.filter(r =>
    r.label.toLowerCase().includes(lowerQuery) ||
    r.content.toLowerCase().includes(lowerQuery) ||
    r.keywords.some(k => k.includes(lowerQuery))
  );
}

/**
 * Get rules matching any of the provided keywords
 */
export function getRulesByKeywords(keywords: string[]): RulesItem[] {
  const lowerKeywords = keywords.map(k => k.toLowerCase());
  return RULES_REFERENCE.filter(r =>
    r.keywords.some(k => lowerKeywords.includes(k))
  );
}
