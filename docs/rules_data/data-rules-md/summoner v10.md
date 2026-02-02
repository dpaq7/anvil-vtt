This document is structured as a **System Reference Document (SRD)** for a software engineer. It extracts every mechanical rule, value, variable, and semantic dependency from the source text, organizing them into data structures suitable for implementation in a game engine.

---

# Class Specification: The Summoner
[cite_start]**Source:** Draw Steel, MCDM [cite: 1, 2, 3]

## 1. Global Class Data

* **Class Name:** Summoner
* [cite_start]**Role:** Master Class (Complex, minion-management focus) [cite: 51]
* [cite_start]**Primary Characteristic:** Reason [cite: 279]
* [cite_start]**Resource:** Essence [cite: 375]
* [cite_start]**Armor/Weapons:** Cloth/None (Light Armor/Weapons only available via *Leader Formation* or Level 3 *Kit*) [cite: 495, 1389]

### [cite_start]Base Stats [cite: 274-283]
* **Starting Reason:** 2
* **Potency Calculations:**
    * Weak: Reason - 2
    * Average: Reason - 1
    * Strong: Reason
* **Stamina:**
    * Level 1: 15
    * Per Level (2+): +6
* **Recoveries:** 8
* **Starting Arrays (Choose one):**
    1.  2, 2, -1, -1
    2.  2, 1, 1, -1
    3.  2, 1, 0, 0
    4.  1, 1, 1, 0
* [cite_start]**Skills:** Magic, Strategy, +2 from (Intrigue, Lore) [cite: 284]

---

## 2. Core Mechanics (Engine Logic)

### 2.1. [cite_start]Minion Management System [cite: 315-361]
* **Global Cap:** Max 8 minions active.
* **Squad Logic:**
    * Minions are grouped into **Squads**.
    * Max 2 Squads total.
    * Max 8 Minions per Squad.
    * Constraint: All minions in a squad must share the same **Name**.
* **Summoner's Range:** $5 + Reason$. (Line of Effect required).
* **Stamina Pool Logic:**
    * Squad shares a single Stamina pool.
    * Damage taken reduces the pool.
    * **Death Threshold:** When pool reduction equals 1 minion's max HP, 1 minion dies (closest to damage source).
    * **Overflow Damage:** If damage exceeds total squad HP, excess deals damage to Summoner ($2 + Level$).
* **Immunity/Weakness:** Applied once to the squad instance, not per minion.
* **AoE Logic:** Damage from an AoE can only kill the specific minions physically located in the area. Excess damage is ignored.
* **Action Economy (Squad Turn):**
    * Squad acts on Summoner's turn.
    * **Option A:** Move + Main Action (No Heal/Defend).
    * **Option B:** Move + Maneuver.
    * **Option C:** Move + Move.
* **Attacking:**
    * **Multi-Unit Strike:** If multiple minions strike one target, sum damage into one "hit".
    * **Signature Abilities:** Only apply effect once per target; additional minions add their Free Strike damage value to the total.
* **Surges:** Minions share Summoner's surge pool. Minion surge gain = Summoner surge gain.
* **Conditions:** Saving throws are resolved as a single instance for the squad.
* **Status:** Minions cannot be Winded, gain Temp Stamina, or Regain Stamina (Champion exception).

### 2.2. [cite_start]Essence System (Resource) [cite: 375-383]
* **Start of Combat:** Essence = Current Victories.
* **Start of Turn:** Gain +2 Essence.
* **Triggered Gain:** Gain +1 Essence the first time *any* minion (ally or enemy) dies unwillingly in range (limit 1/round).
* **Sacrifice Mechanic:** Can kill own minions in range to reduce ability Essence cost by 1 per minion. (Restriction: Minion cannot have acted this turn).

### 2.3. [cite_start]Combat Spawning Rules [cite: 327-328]
* **Start of Combat:** Free summon of 2 Signature Minions (Range: Summoner's Range).
* **Start of Turn:** Free summon of 3 Signature Minions (Range: Summoner's Range).
* **General Summon:** Spawns on ground (unless Fly/Hover). Can join existing squad or form new one.

---

## 3. Class Features (Level 1)

### 3.1. Basic Abilities

[cite_start]**Ability: Summoner Strike** [cite: 391]
* **Type:** Magic, Melee, Ranged, Strike
* **Replaces:** Standard Free Strikes.
* **Range:** Melee 1 OR Ranged 5.
* **Effect:** Deal $R$ damage.
* **Condition:** If $R < \text{WEAK}$, target is **Slowed** (save ends).
* **Tag:** **Charge** (only if used as Melee).

[cite_start]**Ability: Strike For Me** [cite: 400]
* **Type:** Free Triggered Action
* **Trigger:** Summoner uses triggered action to make Free Strike or Signature Ability.
* **Effect:** Minions strike instead.
    * **Roll 11:** Up to 3 targets make a free strike.
    * **Roll 12-16:** Up to 5 targets.
    * **Roll 17+:** Up to 7 targets.
    * **Crit (19-20):** Each target makes a free strike.
* **Bonus:** If original trigger granted a Signature Ability, gain an **Edge**.

[cite_start]**Ability: Call Forth** [cite: 422]
* **Cost:** 1+ Essence.
* **Action:** Main Action.
* **Effect:** Summon minions.
    * *Option A (Signature):* 1 Minion per 1 Essence.
    * *Option B (Portfolio):* Summon set number listed on stat block for the fixed Essence cost.

[cite_start]**Maneuver: Minion Bridge** [cite: 437]
* **Target:** Self.
* **Effect:** Shift to square adjacent to target minion. Can shift *through* minion squares (extends shift distance).
* **Augment (1 Essence):** Adjacent ally shifts with you.

### 3.2. [cite_start]Formations (Passive Stance) [cite: 483]
*Select one. Changeable via Intense Study (Respite).*
1.  **Horde:** Max Minions +4. Start of Turn Summon count increased to 4.
2.  **Platoon:** Squad damage abilities deal $+R$ damage to one target.
3.  **Elite:** All minions get +3 Stamina, +1 Stability.
4.  **Leader:** Summoner ignores overflow damage from squad wipe. Summoner can take damage for minion in range. Allows Light Armor/Weapon usage.

### 3.3. [cite_start]Quick Commands (Triggered Actions) [cite: 504]
*Select one. Changeable via Intense Study (Respite).*
1.  **Focus Fire!**
    * *Trigger:* Ally deals damage.
    * *Effect:* Target gains 1 Surge per adjacent minion (Max 3).
    * *Spend 1 Essence:* Add Edge to the triggering power roll.
2.  **Halt!**
    * *Trigger:* Creature moves/starts turn.
    * *Effect:* Summon Signature Minion adjacent to target OR Shift existing minion to target.
    * *Collision:* If target force-moved into minion, Summoner can negate collision damage.
3.  **Not Yet!** (Cost: 3 Essence)
    * *Trigger:* Ally/Minion (if last in squad) dies.
    * *Effect:* Negate death; target remains at 1 Stamina.
4.  **Shield!**
    * *Trigger:* Ally/Self targeted by strike.
    * *Effect:* Adjacent minion becomes new target.
    * *Spend 1 Essence:* Summon new Signature Minion adjacent to target to take the hit.

---

## [cite_start]4. Summoner Circles (Subclasses) [cite: 294]

### 4.1. Circle of Blight (Demonologist)
* **Portfolio:** Demons (Abyssal).
* **Passive:** Communicate with Abyssal entities.
* **Feature: Death Snap:** When Demon minion dies unwillingly, deals Free Strike damage to adjacent creature.
* **Feature: Soulsense:** See "trails" of creatures with souls (duration $5 \times \text{Level}$ minutes).

### 4.2. Circle of Graves (Necromancer)
* **Portfolio:** Undead (Necropolitan).
* **Passive:** Communicate with Undead entities.
* **Feature: Dead Men Tell All Tales:** Touch corpse ($<1$ week old) to ask questions. Subsequent questions require Reason test.
* **Feature: Rise!:** Triggered Action (1/round). When creature dies in range, summon Signature Undead in its space (free cost). New minion has summoning sickness (act next turn).

### 4.3. Circle of Spring (Feybright)
* **Portfolio:** Fey (Arcadia).
* **Passive:** Communicate with Fey entities.
* **Feature: Fairy Whispers:** Minion tasks return with Rumors (Reason test for validity).
* **Feature: Pixie Dust:** +2 Recoveries. When Fey minion dies, spend Recovery to give Temp HP ($2 \times R$) to adjacent allies.

### 4.4. Circle of Storms (Storm Caster)
* **Portfolio:** Elementals (Quintessence).
* **Passive:** Communicate with Elemental entities.
* **Feature: Elemental Affinity:** When summoning Non-Signature Elemental, get 1 free Signature Elemental (Shared Element type or Mote).
* **Feature: Heart of Nature:** Sense Elementals/Dragons (1 mile). Min Tier 2 outcome on Intuition social tests with them.

---

## 5. Minion Data (The Portfolios)
*Note: S=Small, M=Medium, L=Large, T=Tiny. R=Reason.*

### 5.1. [cite_start]Demon Portfolio [cite: 551, 611, 1197, 1521]

#### Signature (1 Essence)
1.  **Ensnarer** (Brute, 1M)
    * Speed: 5, Stamina: 2, Free Strike: 2 (Pull 1).
    * *Extended Barbed Strike:* Range 3. Pull increases by +1 per extra Ensnarer.
    * *Soulsight:* Anti-hide aura.
2.  **Rasquine** (Ambusher, 1S)
    * Speed: 4 (Teleport), Stamina: 2, Free Strike: 2.
    * *Skulker:* Hide as free maneuver after teleport.
    * *Soulsight.*
3.  **Razor** (Harrier, 1M)
    * Speed: 6, Stamina: 2, Free Strike: 1.
    * *Teeth!:* 1 Dmg to adjacent enemy if they Grab or Melee the Razor.
    * *Soulsight.*

#### 3-Essence (Summon 2)
1.  **Archer Spittlich** (Artillery, 1S)
    * Speed: 5, Stamina: 5, Free Strike: 5 (Poison, Range 10).
    * *Splash Strike:* 2 Poison dmg to enemy adjacent to target. Poisoned targets cannot Shift.
2.  **Twisted Bengrul** (Hexer, 1L)
    * Speed: 5, Stamina: 5, Free Strike: 4 (Psychic).
    * *Mind Twist:* $2d10+R$. Dmg + Twisted (No edges/search).
3.  **Fanged Musilex** (Brute, 1L)
    * Speed: 6, Stamina: 6, Free Strike: 5.
    * *Mawful Strike:* Range $2+R$, Pull 2. Pull increases +2 per extra Musilex. If pulled adjacent: +2 Dmg OR Grab.

#### 5-Essence (Summon 3)
1.  **Gushing Spewler** (Controller, 1M)
    * Speed: 5, Stamina: 4/4/4, Free Strike: 3 (Acid, Range 10).
    * *Gushing Strike:* Slide Target $R+2$.
    * *Spew Slide:* When dmg taken, Shift 2 + leave Slime (Bane on strikes).
2.  **Hulking Chimor** (Defender, 2)
    * Speed: 5, Stamina: 7/7/7, Free Strike: 3.
    * *Mercurial Strike:* Weakened (EoT). Potency = Current Round Number.
    * *Evershifting:* Immune to Opportunity Attacks.
3.  **Violent** (Ambusher, 1M)
    * Speed: 7, Stamina: 5/5/5, Free Strike: 1 (Corruption).
    * *Mimicry:* Start turn Hidden as object.
    * *Transforming Strike:* +2 Dmg if hidden.

#### 7-Essence (Summon 2)
1.  **Faded Blightling** (Support, 1L)
    * Speed: 5 (Fly), Stamina: 17/17, Free Strike: 7 (Corruption).
    * *Blighted Strike:* $2d10+R$ Corruption. Target ally can take Double Bane on next defense instead of damage.
2.  **Gorrre** (Brute, 2)
    * Speed: 5, Stamina: 17/17, Free Strike: 8.
    * *Gorrring Strike:* Knock Prone if charged through object/enemy.
    * *Devastating Charge:* Break size 1 objects, 3 dmg to enemies passed through.
3.  **Vicisittante** (Harrier, 2)
    * Speed: 10, Stamina: 17/17, Free Strike: 7 (Psychic).
    * *Cerebral Flay:* $2d10+R$ Psychic + Weakened. Weakened targets grant Flanking.

---

### 5.2. [cite_start]Elemental Portfolio [cite: 669, 770, 1237, 1610]
*Note: All have "Elemental" tag.*

#### Signature (1 Essence)
* **Elemental Mote** (Hexer, 1T). Fly. *Catalyst:* Transform into other Signature Minion (1/turn). *Dweomer Burst:* Bane on adjacent enemies on death.
* **Brisk Gale** (Harrier, 1S). Fly. Immune to Opportunity Attacks. *Whirlwind:* On death, leave zone enabling allies to Shift.
* **Fire Plume** (Artillery, 1T). Range 10. *Pyre:* On death, leave fire zone (2 Dmg).
* **Walking Boulder** (Defender, 2). Climb. *Obstruct:* Blocks Line of Effect. *Pile Up:* On death (Cost 1 Ess), leave permanent Stone Wall.

#### 3-Essence (Summon 2)
* **Crux of Ash** (Ambusher, 1M). *Soot Strike:* Hides allies from target. *Ashen Cloud:* On death (Cost 1 Ess), create concealment cloud/block LoE.
* **Flow of Magma** (Harrier, 1L). Climb. *Molten Strike:* $2d10+R$. Shift + Leave fire trail. *Eruption:* On death (Cost 1 Ess), create lava zone (Difficult terrain + Fire dmg).
* **Desolation of Sand** (Hexer, 1M). Burrow. *Burying Strike:* Slow/Restrain. *Shifting Sand Pit:* On death (Cost 1 Ess), difficult terrain + allies shift 3.

#### 5-Essence (Summon 3)
* **Dancing Silk** (Artillery, 1T). Fly. *Entangling Strike:* Range 5. Restrain target + Slow adjacent. *Web:* On death (Cost 1 Ess), web zone (Difficult + Slow).
* **Quiet of Snow** (Controller, 1S). Fly. *Freezing Howl:* $2d10+R$ Cold + Slow/Stop. *Cold Surge:* On death, allies in burst gain Surge.
* **Principle of the Swamp** (Brute, 2). Swim. *Encroaching Strike:* Grab (Unlimited targets). *Sludgefoot:* On death (Cost 1 Ess), pull enemies to center.

#### 7-Essence (Summon 2 or 3)
* **Iron Reaver** (Harrier, 1L, Summon 3). Burrow. *Decentralized:* Share move/cover with other Reavers. *Bladed Strike:* Bleed + Shift 2 + Strike again. *Iron Barricade:* On death (Cost 1 Ess), leave iron shards (Cover + Immunity 2).
* **Light of the Sun** (Support, 2, Summon 2). Fly. *Solar Blade:* $2d10+R$. *Radiant Field:* On death (Cost 2 Ess), Fire zone (Dmg enemies, Heal/Buff allies).
* **Knight of Blood** (Controller, 1L, Summon 2). *Scarlet Death:* Severe Bleeding (Min roll 3). *Red River:* On death (Cost 2 Ess), move speed + leave blood trail (Dmg + Pull bleeding enemies).

---

### 5.3. [cite_start]Fey Portfolio [cite: 854, 893, 1307, 1687]

#### Signature (1 Essence)
* **Nixie Soakreed** (Controller, 1T). Swim. *Water Weird:* Teleport to water. *Soaking Bog:* Aura slows enemies.
* **Pixie Bellringer** (Support, 1T). Fly. *Ringing Strike:* Grants Edge to next attacker. *Fairy Chime:* Aura (+1 Save Ally / -1 Save Enemy).
* **Sprite Dandeknight** (Harrier, 1T). Fly. *Magic Strike:* Choose element. *Staccato:* Make 2 strikes.

#### 3-Essence (Summon 2)
* **Pixie Hydrain** (Artillery, 1T). Fly. *Rain:* $2d10+R$ Acid + Weakened. Ally spends Recovery/Cleanses.
* **Sprite Orchiguard** (Defender, 1S). Fly. *Fairy Guard:* Take half dmg for adjacent ally.
* **Pixie Loftlilly** (Controller, 1T). Fly. *Floating Toxins:* Aura floats enemies (No shift, +2 forced move, Bane).

#### 5-Essence (Summon 3)
* **Nixie Hemloche** (Hexer, 1T). Swim. *Whirling Waves:* Difficult terrain aura + Slide 3.
* **Pixie Rosenthall** (Harrier, 2). Fly/Swarm. *Symphony:* $2d10+R$ + Pull + Bleed + No Shift. *Swarm:* Occupy enemy space (2 Dmg/turn).
* **Sprite Foxglow** (Ambusher, 1T). Fly. *Flash Strike:* Daze (if hidden). *Quiet:* Silence aura (Bane on search).

#### 7-Essence (Summon 2)
* **Nixie Corallia** (Support, 1T). Swim. *Seafoam Pool:* Aura purifies terrain + Cleanses allies.
* **Pixie Belladonix** (Artillery, 1T). Fly. *Thorn:* $2d10+R$ Poison + Restrain. Restrained target treats neighbors as enemies.
* **Sprite Olyender** (Brute, 1T). Fly. *Warrior's Toss:* Push 4 + Prone. *Use Their Might:* Counts as larger size for physics.

---

### 5.4. [cite_start]Undead Portfolio [cite: 918, 945, 1361, 1768]

#### Signature (1 Essence)
* **Husk** (Defender, 1M). *Rotting Strike:* Slow. Potency +1 per extra Husk.
* **Skeleton** (Harrier, 1M). *Bonetrops:* On death, leave difficult terrain (2 Dmg to enter).
* **Shrieker** (Artillery, 1M). Range 12. *Shrill Alarm:* Enemies within 2 cannot Hide.

#### 3-Essence (Summon 2)
* **Grave Knight** (Brute, 1M). *Knight Strike:* $2d10+R$ Corruption + Bleed. *To the Grave:* Free strike on death.
* **Stalker Shade** (Ambusher, 1M). Fly/Invis. *Shadow Phasing:* Move through walls/creatures.
* **Zombie Lumberer** (Defender, 2). *Zombie Clutch:* Grab + Dmg. *Death Grasp:* Restrain on death.

#### 5-Essence (Summon 3)
* **Accursed Mummy** (Hexer, 1M). *Fetid Bindings:* $2d10+R$ Poison + Pull + Weaken. *Mummy Dust:* Reflect 2 Poison dmg.
* **Phase Ghoul** (Harrier, 1M). Teleport. *Leaping Strike:* Teleport 5 + Strike + Prone.
* **Ceaseless Mournling** (Controller, 2). Burrow. *Always Crying:* Sonic Dmg aura + No Shift.

#### 7-Essence (Summon 1 or 2)
* **False Vampire** (Brute, 1L, Summon 2). *Proboscis Strike:* Restrain + Dmg. *Bloodthirsty:* Speed 10 near bleeding target.
* **Zombie Titan** (Defender, 4, Summon **1**). HP 40. *Big Stomp:* Knock Prone. *Overwhelming Size:* Crush prone enemies. *Flesh to Mountains:* On death, Restrain/Crush enemies under corpse.
* **Phantom of the Ripper** (Ambusher, 1M, Summon 2). Fly. *Plunge:* $2d10+R$ + Slow. *Ripping Phase:* Pass through creature -> Dmg + Bane.

---

## 6. Level Progression Mechanics

### [cite_start]Level 2 [cite: 1056, 1100]
* **Perk:** Gain 1.
* **Summoner's Dominion (Fixture):**
    * Summon static object (Standard Action). 1/Encounter.
    * **Demon (The Boil):** Taunt Aura, Acid Explosion.
    * **Elemental (Crystal):** Range Buff Aura, Vertical Pull.
    * **Fey (Glade Pond):** Speed Buff Aura, Hides Minions.
    * **Undead (Barrow Gates):** Fear Aura, Immunity Buff.

### [cite_start]Level 3 [cite: 1386]
* **Kit:**
    * Summoner Strike Dmg = $2 \times R$.
    * Strike Distance = Summoner's Range.
    * **Ward (Choose 1):**
        * *Conjured:* +3 HP (+scaling).
        * *Emergency:* React to Dmg -> Shift 1 + Summon Signature Minion.
        * *Howling:* Aura 1 deals R dmg to enemies starting turn there.
        * *Snare:* React to Melee Dmg -> Pull attacker $R$ squares.
* **7-Essence Abilities (Choose 1):**
    * *Blitz Tactics:* Minions knock prone when moving through enemies.
    * *Cavalry Call:* Summon temp squad of 6 Signatures.
    * *Essence Funnel:* Line 10 AoE. Sacrifice minions for +1 Dmg each.
    * *Lead By Example:* $High Dmg + Daze$.

### [cite_start]Level 4 [cite: 1451]
* **Reason:** Set to 3.
* **Minion Cap:** +4 (Total 12).
* **Stat Boost:** +1 to another stat.

### [cite_start]Level 5 [cite: 1457]
* **Circle Feature Upgrade:**
    * *Blight:* **Shaping** (Disguise minions), **Soul Flense** (Minion dmg ally to cleanse condition).
    * *Graves:* **Channel** (Host spirit for skills), **Dread March** (Undead ignore difficult terrain/delay death).
    * *Spring:* **Flash Powder** (Buffs on Pixie Dust), **Pixie Lift** (Gain Fly/Hover).
    * *Storms:* **Nature Watch** (Scout mote), **Split** (Split elemental for HP cost).
* **Essence Salvage:** First minion death yields 2 Essence (instead of 1).
* **Minion Chain:** Minions can grapple/bridge gaps.
* **Minion Stats:**
    * Signature: +1 Stamina.
    * 3-Cost: +3 Stamina.
    * 5-Cost: +2 Stamina.

### [cite_start]Level 6 [cite: 1829]
* **Return to the Source:** Teleport to home plane during Respite.
* **Minion Machinations:** +2 Follower Cap. Recruit Artisan/Sage from Portfolio.
* **9-Essence Abilities (Champion Summons):**
    * *A Champion's Cry:* Burst 3 Fear.
    * *Army's Idol:* Burst 4 Buff (+2 Saves).
    * *The Champion Slams the Earth:* Cube 4 Dmg + Prone.
    * *Their Pall Shrouds All:* Burst 4 Weakened + Half Dmg.

### [cite_start]Level 7 [cite: 1907]
* **Characteristic Increase:** All +1 (Max 4).
* **Minion Improvement:** Start of turn free summon increased by +1.
* **Font of Creation:** Start of turn Essence = 3.
* **Their Life for Mine:** Reaction to death -> Sacrifice all minions/essence -> Revive.

### [cite_start]Level 9 [cite: 2181]
* **Kit Improvement:** Strike Potency $R < \text{STRONG}$. Choose 2nd Ward. Free summon on kill.
* **Steward:** Diplomacy bonus with home plane.
* **11-Essence Abilities (Ultimate):**
    * *10,000 Minions:* Floor becomes damaging hazard.
    * *Bodyguard Tactics:* Allies get Immunity 5.
    * *I Abjure Thee:* Delete enemy minions. Banish leaders.
    * *The Champion's Wrath:* Massive AoE Dmg + Push.

### [cite_start]Level 10 [cite: 2242]
* **Reason:** Set to 5.
* **Minion Improvement:** Start of combat summon scales with Victories. Max Stats.
* **Eidos:** Epic Resource. Spend as Essence + Summon 2 Bonus Minions.
* **No Matter the Cost:** Sacrifice reduces cost by full amount.

---

## [cite_start]7. Champions (Unique Units) [cite: 1947]
*Cost: 9 Essence. Limit 1 per Encounter. Regains HP.*

1.  **Demon Lord's Aspect (Blight):** Size 2. HP=Summoner's Max. Teleport. *Grasping Appendages* (Pull/Grab).
2.  **Dragon's Portent (Storms):** Size 2. Select Element Affinity. *Tail Swing* (Push). *Dragon Heart:* Take 10 Dmg to give Ally resource.
3.  **Celestial Attendant (Spring):** Size 2. *Pixie Swarm* (Slide). *Neurotoxic:* Limits LoE.
4.  **Avatar of Death (Graves):** Size 2. *Culling Scythe* (Bleed + Execute). *Revelation:* Drop winded enemies to 0 HP.