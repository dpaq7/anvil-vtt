/**
 * Encounter Objectives Data for Draw Steel
 *
 * Ported from Forgesteel (https://github.com/andyaiken/forgesteel)
 * Original work Copyright (c) Andy Aiken, Licensed under GPL-3.0
 *
 * Combat encounter objectives define victory conditions beyond simple defeat.
 */

import type { EncounterObjective } from '@anvil/types';

export const ENCOUNTER_OBJECTIVES: EncounterObjective[] = [
  {
    id: 'diminish-numbers',
    name: 'Diminish Numbers',
    description:
      "The simplest combat encounter objective is \"defeat them before they defeat us.\" While the heroes don't have to kill every last enemy in a Diminish Numbers encounter, they do need to remove their opponents to win the day and get their opponents to a point where they flee or surrender.",
    difficultyModifier: "This objective doesn't modify the encounter's difficulty.",
    successCondition: `Choose one of the following success conditions:
• An encounter that includes at least two groups of minions ends when the heroes have no nonminion enemies remaining.
• An encounter with mostly band creatures ends when the heroes outnumber their foes.
• An encounter with mostly platoon creatures ends when the heroes outnumber their foes two to one.
• The encounter ends when the number of the heroes' remaining foes is half or fewer what it was at the start.
• In a battle against a solo creature, the creature flees or surrenders when reduced to a quarter of their Stamina or less and after using all their villain actions.`,
    failureCondition: 'The heroes gain no Victories if they are killed, captured, flee, or otherwise fail to defeat their foes.',
    victories: 'If the heroes achieve success, they gain 1 Victory for an easy or standard encounter, or 2 Victories for a hard or extreme encounter.',
  },
  {
    id: 'defeat-foe',
    name: 'Defeat a Specific Foe',
    description:
      "A Defeat a Specific Foe encounter includes one or more of the heroes' enemies commanding the rest, such as a hobgoblin bloodlord leading a group of mercenaries, or one or more particularly powerful foes among a group of weaker ones, such as a pair of tusker demons in a gnoll war band. Because these enemies are the stars of the encounter, if only weak foes are left once the stars are gone, the battle loses its challenge and it's time to wrap it up.",

    difficultyModifier:
      "If the creature or creatures who need to be taken down for the encounter to end makes up one third or less of the opposing side's total EV, then the encounter is one step of difficulty easier (e.g. from hard to standard).",
    successCondition: 'The heroes win when the designated creature or creatures are reduced to 0 Stamina.',
    failureCondition:
      "The heroes gain no Victories if they don't defeat all the designated creatures. Note that designated creatures could choose to flee if all their allies start dying.",
    victories:
      "The heroes gain Victories according to the encounter's difficulty after being adjusted for this objective. They earn 1 Victory for an easy or standard encounter or 2 for a hard encounter.",
  },
  {
    id: 'get-thing',
    name: 'Get the Thing!',
    description:
      "Classic heroic fantasy is full of important objects that the heroes must protect from the forces of evil: magic rings, royal birth certificates, dragon eggs, and the like. Heroes often find themselves at violent odds with their enemies as they race to collect a valuable or important item from a guarded temple or castle, or when they need to steal the item from a group of enemies already in possession of it.\n\nThe thing the heroes need to get is typically a 1T object. Most or all approach routes to the thing are guarded by enemies, and often a trap or a particularly powerful monster stands guard over the object.\n\nThe thing can have extra defenses: Hidden (requires tests to find), or Held (possessed by an enemy).",

    difficultyModifier:
      "If there is no powerful monster (at least one-third or more of the encounter's total EV) or trap directly guarding the thing, the encounter is one step easier. If the thing is hidden or held, the encounter is one stage harder.",
    successCondition: 'The heroes win when all the heroes leave the encounter map with the thing.',
    failureCondition: "The heroes gain no Victories if the thing is destroyed or remains in the enemies' hands.",
    victories:
      "The heroes gain 1 Victory if they leave the map with the thing and the encounter was easy, standard, or hard after being adjusted for this objective. They instead earn 2 Victories if the success condition is met and the encounter's difficulty is Extreme or none of the heroes take damage during the encounter.",
  },
  {
    id: 'destroy-thing',
    name: 'Destroy the Thing!',
    description:
      "Combat doesn't always have to be about destroying your enemies. Sometimes it's about destroying their stuff! Burning a pirate captain's vessel, closing a portal to the Abyssal Wasteland before it lets in an army of demons, or shutting down a massive kobold trap made of spinning blades could so hamper the heroes' foes that the battle is no longer worth fighting once the damage is done.\n\nA typical thing is an object with Stamina equal to the heroes' level times 20. Most objects have poison and psychic immunity.\n\nExtra defenses: Hidden, Held, Sturdy (double Stamina), Multiple (divide Stamina between objects).",

    difficultyModifier:
      "If the thing doesn't have any extra defenses, the encounter is one step easier. If the thing has at least two extra defenses, the encounter is one stage harder.",
    successCondition: 'The heroes win when they destroy the thing.',
    failureCondition: "The heroes gain no Victories if the thing is not destroyed and remains in the enemies' hands.",
    victories:
      "The heroes gain Victories according to the encounter's difficulty after being adjusted for this objective. They earn 1 Victory for an easy or standard encounter or 2 for a hard encounter.",
  },
  {
    id: 'save-another',
    name: 'Save Another',
    description:
      "No one earns the mantle of hero without saving a few lives. Sometimes the point of an encounter isn't to kill, but to save as many folks as you can.\n\nSome Save Another encounters feature willing allies (creatures able and willing to fight alongside the heroes), and some feature potential allies (creatures that can't or won't join the heroes right away—but might later).\n\nPotential allies must be won over and freed from captivity before they become allies. This requires success on a hard Presence test made as a maneuver. Potential allies otherwise flee for the nearest exit on their turns.",

    difficultyModifier:
      'For each willing ally the heroes can save who is of their level or higher, add one hero to the party for the purposes of building your encounter.',
    successCondition:
      'Once all allies are freed and have either joined the fight or retreated off the encounter map, and at least half of the allies lived through the encounter, the heroes win.',
    failureCondition: 'The heroes gain no Victories if half or more of the allies are dead or captured.',
    victories:
      "The heroes gain 1 Victory if the success condition was met and encounter was easy or standard after being adjusted by the objective's difficulty modifier. The heroes gain 2 Victories if the success condition is met and the combat encounter was hard or extreme or all of the allies were saved and survived.",
  },
  {
    id: 'escort',
    name: 'Escort',
    description:
      "Sometimes the fate of the mission doesn't rest on the heroes' shoulders at all! Sometimes it rests on the shoulders of someone standing next to the heroes. The heroes' job is to keep this important person safe as they travel to a specific destination.\n\nThe creature or object to be protected is called the ward. At the start of each round, choose a hero. The ward moves on that hero's turn.\n\nA sturdy ward has Stamina equal to 10 times the heroes' level. A delicate ward has Stamina equal to 5 times the heroes' level.\n\nAt the start of each round, any minion killed during the last round is replaced by a reinforcement.",

    difficultyModifier: "A combat encounter's difficulty is one stage harder with a delicate ward.",
    successCondition: 'The heroes win when the ward reaches their destination.',
    failureCondition: 'If the ward is reduced to 0 Stamina or is prevented from reaching their destination, the heroes gain no Victories.',
    victories:
      "The heroes gain 1 Victory if the success condition is met. They earn 2 Victories if the success condition is met and the combat encounter's difficulty is extreme after being adjusted for this objective or the ward and all heroes reach their destination in fewer than 3 rounds.",
  },
  {
    id: 'hold-position',
    name: 'Hold Them Off',
    description:
      'Sometimes the heroes just need to buy time. They might need to battle a conquering tyrant\'s army to allow innocent villagers time to escape. They might need to hold off wave after wave of zombies while a group of priests completes a ritual.\n\nThe Director (or the heroes) choose a defensive position, an area that must be held and controlled by the heroes. The fewer of the heroes\' enemies that get passed the defensive position, the better.\n\nThe encounter duration is typically 3 rounds. At the end of each round, the Director adds more enemies with EV equal to killed enemies plus one hero\'s EV.',

    difficultyModifier:
      "A Hold Them Off encounter's difficulty is determined by the creatures present at the start. Don't count reinforcements. The encounter difficulty is one step harder if the encounter duration is 5 rounds or greater.",
    successCondition:
      'The heroes win if they survive for the encounter duration and let fewer creatures through the defensive position than there are heroes.',
    failureCondition: 'The heroes earn no Victories if a number of creatures equal to or greater than their number get passed the defensive position.',
    victories:
      "The heroes gain 1 Victory if the success condition is met. They earn 2 Victories if the success condition is met and the combat encounter's difficulty is extreme or the heroes hold off the enemy for an encounter duration of 5 rounds or more.",
  },
  {
    id: 'survive',
    name: 'Assault the Defenses',
    description:
      "The enemy holds a strategically important position and the heroes want it. In a reverse of the Hold Them Off encounter, the heroes seize the enemy's defensive position.\n\nThe Director chooses a defensive position, an area that must be captured by the heroes. Not all enemies are in this position, as some are outside attempting to stop heroes before they get close.\n\nOften, a defensive position grants bonuses to its defenders: narrow approach, difficult terrain, climbing required, or higher ground.",

    difficultyModifier: "An Assault the Defenses encounter's difficulty is one stage harder if the defensive position grants two or more bonuses to its defenders.",
    successCondition: 'The heroes win when at least one hero and none of their enemies have been in the defensive position for four consecutive turns.',
    failureCondition: 'The heroes only fail if they are unable to achieve the success condition.',
    victories:
      "The heroes gain 1 Victory if the success condition is met, or 2 Victories if the success condition is met and encounter's difficulty is hard or extreme after being adjusted by the objective.",
  },
  {
    id: 'escape',
    name: 'Stop the Action',
    description:
      "Sometimes combat is complicated by the fact that the heroes need to stop the villainous actions of their foes. It's not enough to simply defeat the warriors in a cult. The heroes must also stop the zealots' archdevil-summoning ritual!\n\nThe Director determines the encounter duration (typically 3 rounds) before the villains complete their plans. The villain's evil plan has certain requirements, and if those requirements aren't met, the action is stopped.\n\nIf the villains' plan succeeds, there may be additional consequences within the encounter (extra enemies, changed conditions, etc.).",

    difficultyModifier:
      'A Stop the Action encounter\'s difficulty is one step harder if the encounter duration is 2 or less, and one step easier if the action can be stopped by killing or removing any single creature.',
    successCondition: 'The heroes win if they stop the action before the encounter duration is up.',
    failureCondition:
      'The heroes gain no Victories if they fail to stop the action before the end of the encounter duration. The heroes may earn Victories from any new encounters that occur because of a failure consequence.',
    victories:
      "The heroes gain 1 Victory if the success condition is met, or 2 Victories if the success condition is met and the combat encounter's difficulty is extreme or the heroes stop the action before the last round of the encounter duration.",
  },
  {
    id: 'custom',
    name: 'Complete the Action',
    description:
      'The opposite of a Stop the Action encounter, this objective sees the characters charged with initiating an event, performing a ritual, and so forth. For instance, heroes attempting to launch an airship while repelling a time raider boarding party.\n\nDuring each round, at least half the heroes must spend a maneuver performing a task that advances their plans. The Director decides what tasks are available.\n\nIf at the end of a round the heroes have failed to perform the required number of tasks, the party accumulates one failure.',

    difficultyModifier:
      "A Complete the Action encounter's difficulty is one step harder if the encounter duration is 5 or more, or if completing tasks requires a successful test. It is one step easier if the encounter duration is 2 or less.",
    successCondition: 'The heroes win if they reach the end of the encounter duration with 1 or 0 failures.',
    failureCondition: "The heroes gain no Victories and can't complete the action if they accumulate 2 or more failures during the encounter duration.",
    victories:
      "The heroes gain 1 Victory if the success condition is met or 2 Victories if the success condition is met and the combat encounter's difficulty is extreme after being modified by this objective or the heroes reach the end of the encounter duration with zero failures.",
  },
];

/**
 * Get encounter objective by ID
 */
export function getEncounterObjectiveById(id: string): EncounterObjective | undefined {
  return ENCOUNTER_OBJECTIVES.find(o => o.id === id);
}

/**
 * Get all encounter objectives
 */
export function getAllEncounterObjectives(): EncounterObjective[] {
  return ENCOUNTER_OBJECTIVES;
}
