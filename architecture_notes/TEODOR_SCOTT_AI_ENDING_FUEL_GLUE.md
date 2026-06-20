# TEODOR / SCOTT AI ENDING FUEL GLUE

_Status: Architecture Notes | AI Ending Generator Context | Codex Implementation Glue | Teodor / Scott Board_

---

## Purpose

This file gives Codex the compact implementation context needed to convert the Teodor / Scott board writing into playable game logic and final story generation.

The full board content lives in the Teodor / Scott board files.

This file is the glue.

It explains how the app should interpret:

- collected spaces
- ignored spaces
- missed spaces
- forced consequences
- fixed anchors
- branch pairs
- unresolved branches
- final story generation

Codex should use this file as a high-level implementation guide before touching the interface, board data model, or ending generator.

---

## Core Design Rule

The Teodor / Scott board is not a generic board with character flavor.

It is a life-board.

The player moves through fragments of Teodor / Scott's fictionalized base life.

The board does not generate a random story from scratch.

The board asks:

```text
Which version of Teodor / Scott did this run create?
```

The final story should feel like one possible fictional variation of the base story, shaped by the player's movement.

---

## Board Size

The Teodor / Scott board contains 72 spaces.

```text
01–08   Origin
09–16   Childhood Rooms
17–24   Music and Fear
25–32   Father Layer
33–40   Collapse and Survival
41–48   Kaegan / Future Layer
49–56   Work / Systems Layer
57–64   AIFRED / INTERVENTION
65–72   Ripple / Last Glass
```

Each zone contains 8 spaces.

Each zone provides the ending generator with a different kind of story fuel.

---

## Required Run State

The game should track at least the following state during a Teodor / Scott run:

```text
selected_mode
selected_character
current_position
turn_count
dice_history
spaces_landed
spaces_collected
spaces_ignored
spaces_missed
spaces_forced
fixed_anchor_states
branch_pair_states
resolved_branch_pairs
unresolved_branch_pairs
dominant_zones
dominant_reality_layers
ending_pressure
final_response
last_glass_reached
```

The ending generator should receive this run state when Space 72, Last Glass, is reached.

---

## Space State Meanings

Every landed space can become one of several story states.

### Collected

Collected means the player accepted, carried, remembered, named, or used that space.

In the ending, collected spaces become carried truths.

```text
collected = accepted truth / carried memory / usable artifact / named pattern
```

### Ignored

Ignored means the player refused, delayed, denied, minimized, avoided, or distorted the space.

In the ending, ignored spaces become pressure.

```text
ignored = denial / delay / avoidance / distortion / pressure
```

### Missed

Missed means the player moved past the space without landing on it.

In the ending, missed spaces become absence, hidden influence, unresolved branches, or late echoes.

```text
missed = absence / unseen influence / hidden driver / unresolved branch / late echo
```

### Forced

Forced means the player ignored a space, moved backward, or was otherwise made to receive a consequence.

In the ending, forced spaces become unavoidable plot turns.

```text
forced = delayed truth / unavoidable consequence / returned pressure / event that must be dealt with
```

---

## Fixed Anchors

Fixed anchors are events or forces that must remain true in every standard Teodor / Scott ending.

The player's relationship to the anchor may change, but the ending cannot pretend the anchor does not exist.

```text
01 Adoption
04 The Name Scott
18 The Piano
25 Father
29 The Empty Chair
41 Kaegan
49 The Kitchen Rush
57 AIFRED
61 INTERVENTION
65 Ripple
72 Last Glass
```

### Fixed Anchor Rule

A fixed anchor always exists.

But each anchor should still respond to player state.

Example:

```text
Adoption collected:
    adoption becomes visible origin

Adoption ignored:
    adoption becomes buried pressure

Adoption missed:
    adoption becomes unnamed identity pressure

Adoption forced:
    adoption returns as a question of origin later
```

---

## Standard Fixed Truths

The final story must preserve these truths unless a future special mode explicitly permits deep distortion:

```text
Teodor was adopted.
Scott was the name given by his father.
The name Scott did not erase Teodor.
His father mattered.
His father died.
Music mattered.
Kaegan mattered.
AIFRED began as an audio tool.
INTERVENTION became the archive.
Ripple became the name for the movement he noticed.
The Last Glass generates a fictional variation, not a direct autobiography.
```

---

## Branch Pairs

Branch pairs create alternate-life logic.

Each branch group contains two spaces that represent competing, parallel, or contradictory truths.

The final story should resolve each branch group based on player interaction.

---

## Branch Pair Behavior

```text
If one branch is collected:
    That branch becomes dominant.

If both branches are collected:
    The ending carries contradiction.

If one branch is ignored:
    That ignored truth becomes pressure, denial, or delayed consequence.

If both branches are missed:
    The branch group becomes unresolved and must be resolved by mode behavior.
```

Teodor / Scott's story often allows contradiction.

The ending should not force false either/or logic when both sides can be true.

Example:

```text
Happy Childhood collected + Lonely Childhood collected
= childhood_tone: warm_and_lonely
```

---

## Branch Groups

```text
childhood_tone:
  02 Happy Childhood
  03 Lonely Childhood

name_relation:
  06 Kept Teodor
  07 Buried Teodor

house_relation:
  10 Safe House
  11 Listening House

belonging_relation:
  14 Belonging
  15 Watching From Behind His Eyes

music_relation:
  20 Music as Shelter
  21 Music as Escape

father_relation:
  26 Father as Anchor
  27 Father as Absence

grief_relation:
  30 Grief Named
  31 Grief Disguised

collapse_response:
  34 Rebellion
  35 Survival

consequence_response:
  38 Damage Done
  39 Repair Attempted

fatherhood_relation:
  42 Present Father
  43 Distant Father

future_contact:
  46 Future Date
  47 Missed Call

work_systems:
  50 Pressure Flow
  51 Broken Station

room_influence:
  54 Room Changed
  55 Room Ignored

aifred_relation:
  58 Diagnostic Mirror
  59 Unused Tool

archive_relation:
  62 Archive Opened
  63 Archive Avoided

ripple_relation:
  66 Pattern Named
  67 Pattern Denied

final_response:
  70 Accountability
  71 Monument
```

---

## Mode Behavior for Missed Branches

The board currently supports multiple modes. Missed branch resolution should respect the selected mode.

### Mystery Mode

The board resolves missed branches silently.

The player discovers the effect only in the final story.

```text
missed_branch_resolution = hidden
```

### Vague Mode

The board hints that an unresolved branch affected the story, but does not expose full mechanical detail.

```text
missed_branch_resolution = hinted
```

### Experimental / Master Mode

The run summary may show which branch group was missed and how the board resolved it.

```text
missed_branch_resolution = visible
```

---

## Suggested Resolution Values

Codex may encode branch groups using string outcomes.

Examples:

```text
childhood_tone:
  warm_fragile
  loved_but_lonely
  warm_and_lonely
  unresolved_childhood_tone

name_relation:
  integrated_dual_name
  buried_origin_seen
  kept_and_buried
  unresolved_name_pressure

music_relation:
  shelter
  escape
  shelter_and_escape
  unresolved_music_function

father_relation:
  anchor
  absence_shadow
  anchor_and_absence
  unresolved_father_pressure

grief_relation:
  named_grief
  disguised_grief
  named_and_disguised
  unresolved_grief

fatherhood_relation:
  present_father
  distant_father
  present_and_distant
  unresolved_fatherhood_presence

final_response:
  accountability
  monument
  accountability_and_monument
  unresolved_final_response
```

---

## Zone Fuel Summary

Each zone contributes different story fuel.

### 01–08: Origin

```text
adoption
Teodor
Scott
given name
birth name
translation
origin pressure
happy childhood
lonely childhood
```

### 09–16: Childhood Rooms

```text
television light
ordinary warmth
safe house
listening house
body memory
room watches back
belonging
inner distance
child with an echo
```

### 17–24: Music and Fear

```text
night hallway
fear becoming attention
piano
first pattern
music as shelter
music as escape
closed door
room mapping
sound as room
```

### 25–32: Father Layer

```text
father as real person
father as anchor
father as absence
office smell
Stetson
Drakkar Noir
empty chair
grief named
grief disguised
board tilts
```

### 33–40: Collapse and Survival

```text
inner weather
rebellion
survival
smart was not safe
old self
damage done
repair attempted
kept moving
```

### 41–48: Kaegan / Future Layer

```text
Kaegan as future space
present father
distant father
another address
inherited absence
future date
missed call
child mirror
```

### 49–56: Work / Systems Layer

```text
kitchen rush
pressure flow
broken station
ticket line
one calm voice
room changed
room ignored
practical theory
```

### 57–64: AIFRED / INTERVENTION

```text
AIFRED
mix compared to target
diagnostic mirror
unused tool
current state versus target state
INTERVENTION
archive opened
archive avoided
filing cabinet inside the computer
```

### 65–72: Ripple / Last Glass

```text
Ripple
pattern named
pattern denied
water moving
wound as blueprint
accountability
monument
Last Glass
```

---

## Ending Generator Rule

When the player reaches Space 72, the game should generate a fictional story.

It should not generate a report.

Do not write:

```text
Because the player collected Space 25, Teodor understood his father.
```

Instead, turn the run data into fiction:

```text
When Teodor found the old office again, the chair had not moved, but the smell arrived first. Paper. Coffee. Stetson. A room can wait for a man longer than a man can wait for himself.
```

The ending should feel authored, human, and specific.

---

## Required Ending Inputs

The ending generator should use:

```text
selected_mode
selected_character
base_story_summary
fixed_truths
collected_spaces
ignored_spaces
missed_spaces
forced_spaces
resolved_branch_pairs
unresolved_branch_pairs
dominant_zones
dominant_layers
turn_count
dice_history
final_response
```

---

## Ending Structure

A good Teodor / Scott generated ending should usually include:

```text
1. Opening image tied to one of the strongest collected or forced spaces.
2. A short return to origin, name, father, or childhood pressure.
3. A middle section showing how the player's branch choices changed the life.
4. A consequence section showing ignored, missed, or forced spaces returning.
5. A final turn at the Last Glass.
6. A closing question or image connected to: What does this consequence build next?
```

---

## State-to-Story Translation

### Collected Spaces

Collected spaces should become explicit story material.

```text
collected Adoption -> visible origin
collected Piano -> music as survival room
collected Father -> father as real person
collected Kaegan -> future responsibility
collected AIFRED -> diagnostic mirror
collected Ripple -> named movement
```

### Ignored Spaces

Ignored spaces should become pressure, denial, distortion, or delayed consequence.

```text
ignored Happy Childhood -> warmth distrusted
ignored Father -> grief harder to name
ignored Damage Done -> explanation without repair
ignored Archive Opened -> public structure hiding private avoidance
ignored Accountability -> accountability language without changed behavior
```

### Missed Spaces

Missed spaces should become absence, hidden influence, unresolved memory, or late echo.

```text
missed Lonely Childhood -> hidden identity distance
missed Listening House -> room alertness without known origin
missed First Pattern -> systems built without remembering music's origin
missed Second Address -> consequences reaching Kaegan late
missed Pattern Named -> movement without language
```

### Forced Spaces

Forced spaces should become unavoidable plot turns.

```text
forced Empty Chair -> grief returns through another room
forced Missed Call -> future calls twice at once
forced Wound Blueprint -> loved one refuses the monument
forced Last Glass -> all unresolved branches resolve into story
```

---

## Guardrails

The ending must remain fictionalized.

Do not write a direct autobiography.

Do not claim supernatural proof.

Do not treat Ripple as fate, prophecy, or cosmic certainty.

Do not make Kaegan responsible for saving Teodor / Scott.

Do not reduce Kaegan to a symbol.

Do not reduce the father to a symbol.

Do not make grief instantly wise.

Do not make accountability automatic.

Do not make the theory automatically correct.

Do not make the ending a score screen.

---

## Tone Rules

The Teodor / Scott ending should sound like:

```text
fictional
human
specific
concrete
emotionally honest
slightly haunted
accountable
```

It should avoid sounding like:

```text
therapy worksheet
generic AI parable
quest log
mechanical summary
motivational speech
lore dump
```

---

## Character-Specific Ending Identity

Every Teodor / Scott ending should understand these tensions:

```text
Teodor and Scott are layered, not mutually exclusive.
Adoption is origin, not erasure.
The father is presence before he is absence.
Music is structure before it is product.
Grief explains pressure but does not erase consequence.
Kaegan is a person and future witness, not a cure.
Work teaches systems before theory names them.
AIFRED starts practical before becoming a mirror.
INTERVENTION is an archive, not instant healing.
Ripple is responsibility, not victory.
```

---

## Last Glass Final Question

Every ending does not need to literally end with this exact sentence, but it should answer or echo this question:

```text
What does this consequence build next?
```

The Last Glass should feel like an opening into the next responsibility, not a simple ending.

---

## Codex Implementation Notes

Recommended app-side data model:

```text
CharacterBoard
  id
  characterId
  name
  totalSpaces
  zones
  fixedAnchors
  branchGroups
  spaces

BoardSpace
  number
  name
  zone
  type
  realityLayer
  branchGroup
  oppositeSpace
  glassRiddle
  artifact
  storySeed
  collectMeaning
  ignoreMeaning
  missedMeaning
  forcedConsequence
  booleanTags
  endingInfluence

RunState
  characterId
  mode
  currentPosition
  turnCount
  diceHistory
  collectedSpaces
  ignoredSpaces
  missedSpaces
  forcedSpaces
  branchResolutions
  fixedAnchorStates
  dominantZones
  dominantLayers
```

Recommended generation pipeline:

```text
1. Load selected character board.
2. Track movement and space states during play.
3. On Last Glass, resolve all branch groups.
4. Apply mode-specific hidden/visible branch resolution.
5. Build ending fuel object.
6. Generate fictional story from ending fuel.
7. Display story and run summary separately.
```

The story and the run summary should not be the same thing.

The story is fiction.

The run summary is mechanics.

---

## Final Implementation Principle

The board should hold the story before the code tries to generate the story.

Codex should implement the authored structure.

Codex should not invent Teodor / Scott's life-board from scratch.
