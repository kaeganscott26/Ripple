# TEODOR BOARD ARCHITECTURE — PHASE 01

_Status: Architecture Notes | Character Board Planning | Codex Context | RIPPLE Game Engine Source_

---

## Purpose

This document captures the first board-mapping pass for the Teodor / Scott character board in **Ripple: The Living Board**.

The purpose is to give Codex and future implementation passes clear architectural context before building the actual interface, board data, and story engine.

This is not final board content yet.

This is the skeleton: zones, fixed anchors, branch pairs, and board logic.

The next phase will turn this structure into full space cards.

---

## Core Direction

The Teodor / Scott board is not a generic board with character flavor applied on top.

It is a life-board.

The player is not moving through random symbolic spaces. The player is moving through fragments of Teodor / Scott’s base story.

Each landed space changes what version of the base story becomes possible.

The final generated story should not be vague or disconnected. It should feel like one altered version of Teodor / Scott’s life, shaped by what the player collected, ignored, missed, or was forced to receive.

---

## Board Size

The first real Teodor / Scott board should use **72 spaces**.

The earlier prototype board was too small. With dice movement, a 24-space board ends too quickly and does not gather enough story material.

A 72-space board gives the life enough room to breathe while still remaining playable.

---

## Teodor / Scott Board Shape

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

Each zone should have its own tone, artifact family, story function, and dominant reality layers.

---

## Zone Functions

### 01–08: Origin

This zone establishes adoption, naming, early identity, and the first split between Teodor and Scott.

This is where the board begins.

The first space should be **Adoption**.

The player does not choose whether adoption happened. It is a fixed anchor.

The player chooses, misses, or refuses how the character relates to it.

---

### 09–16: Childhood Rooms

This zone covers early home life, warmth, loneliness, belonging, watching from outside himself, and the first feeling that ordinary rooms may contain hidden pressure.

This is where happy childhood and lonely childhood branch against each other.

The board should not force childhood into only one emotion. The story can hold both warmth and sadness if the player collects both.

---

### 17–24: Music and Fear

This zone covers the haunted-room layer, attention, pattern recognition, piano, sound, imagination, and music as shelter.

Music is not decoration. Music becomes a room the character can survive inside.

Fear is not only fear. Fear becomes attention. Attention becomes mapping.

---

### 25–32: Father Layer

This zone covers father as anchor, father as presence, father as absence, the empty chair, grief named, grief disguised, and the change in the whole board after death.

This zone should be emotionally grounded and concrete.

The father should not be reduced to a symbol. He should feel like a real person: funny, stubborn, practical, flawed, present, and deeply missed.

---

### 33–40: Collapse and Survival

This zone covers rebellion, damage, survival, bad choices, repair attempts, consequences, and the period where grief moves through behavior.

The board must not flatter the character here.

Some wounds become wisdom.

Some choices simply cost people.

Both must remain true.

---

### 41–48: Kaegan / Future Layer

This zone covers fatherhood, love, distance, future responsibility, missed calls, attempts to repair, and the realization that a son is not a side path.

Kaegan is a future space.

The board should treat fatherhood as a change in what consequence means.

After Kaegan, Scott’s choices have another address.

---

### 49–56: Work / Systems Layer

This zone covers kitchens, pressure, timing, ticket flow, handoffs, stations, room energy, and systems learned through work rather than theory.

This is where the character starts noticing cause and effect inside rooms.

A kitchen rush becomes a practical model for Ripple Theory.

---

### 57–64: AIFRED / INTERVENTION

This zone covers AIFRED as an audio analyzer, the diagnostic mirror, the desire to compare a current state to a target state, INTERVENTION as archive, and the act of arranging wounds into structure.

AIFRED begins as a practical tool.

INTERVENTION begins as a place to put what could not be carried loose.

---

### 65–72: Ripple / Last Glass

This zone covers the naming of the pattern, accountability, monuments built from wounds, the Last Glass, and the question that ends the run.

Ripple should not be treated as victory.

Ripple should become responsibility.

The final space is **Last Glass**.

---

## Fixed Anchors

Fixed anchors are spaces the board must preserve no matter what.

The player may collect, ignore, miss, or be forced into the meaning of an anchor, but the final story cannot pretend the event never existed.

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

These are the spine of the Teodor / Scott board.

---

## Fixed Anchor Rule

A fixed anchor is always part of the character’s base reality.

The player’s relationship to that anchor can change.

Example:

```text
Adoption always happened.

If collected:
    Teodor keeps the origin visible.

If ignored:
    Scott moves forward with a name that aches underneath.

If missed:
    origin becomes unnamed pressure in the final story.

If forced:
    identity returns later as a consequence rather than a memory.
```

---

## Branch Pair Logic

Branch pairs are what-if forks.

They determine which version of the base story becomes dominant in the final generated fiction.

A branch pair can represent competing truths, alternate interpretations, or different emotional outcomes.

Some branch pairs should behave as either/or.

Other branch pairs may allow both branches to be true at once.

Teodor / Scott should often allow contradiction, because the base story contains warmth and sadness, love and damage, survival and failure.

---

## Proposed Branch Pairs

```text
02 Happy Childhood
03 Lonely Childhood

06 Kept Teodor
07 Buried Teodor

10 Safe House
11 Listening House

14 Belonging
15 Watching From Behind His Eyes

20 Music as Shelter
21 Music as Escape

26 Father as Anchor
27 Father as Absence

30 Grief Named
31 Grief Disguised

34 Rebellion
35 Survival

38 Damage Done
39 Repair Attempted

42 Present Father
43 Distant Father

46 Future Date
47 Missed Call

50 Pressure Flow
51 Broken Station

54 Room Changed
55 Room Ignored

58 Diagnostic Mirror
59 Unused Tool

62 Archive Opened
63 Archive Avoided

66 Pattern Named
67 Pattern Denied

70 Accountability
71 Monument
```

---

## Branch Pair Behavior

A branch pair should behave like this:

```text
If one branch is collected:
    That branch becomes dominant.

If both branches are missed:
    The board chooses one, blends both, or marks the branch unresolved.

If one branch is ignored:
    Its opposite may gain weight, but the ignored branch returns as consequence.

If both branches are collected:
    The final story treats the character as contradictory, carrying both truths.
```

---

## Missed Branch Rule

Missed spaces must still matter.

If the player skips a branch pair completely, the final story should not behave as if that part of life disappeared.

Instead, the branch becomes unresolved.

Depending on mode, unresolved branches may be handled differently.

### Mystery Mode

The board may choose the missed branch outcome without telling the player until the final story.

### Vague Mode

The board may hint that an unresolved branch affected the story.

### Experimental / Master Mode

The run summary may show the unresolved branch group and how it was resolved.

---

## Collected / Ignored / Missed / Forced Meaning

The Teodor / Scott board should preserve the current inventory state system.

```text
Collected = accepted, carried, remembered, used, named
Ignored = refused, delayed, denied, avoided, distorted
Missed = unseen, unnamed, absent, unresolved, ghosted
Forced = returned consequence, unavoidable event, delayed truth
```

The final story generator should use these meanings when transforming board movement into fiction.

---

## Core Board Rule

The board should not retell the base story exactly.

The board should ask:

```text
Which version of the base story did this run create?
```

The board is not autobiography.

The board is alternate-life generation based on a fictionalized base reality.

---

## Final Story Rule

The final story should use:

- selected character
- selected mode
- active character board
- fixed anchors
- collected spaces
- ignored spaces
- missed spaces
- forced consequences
- resolved branch pairs
- unresolved branch pairs
- dominant zones
- dominant reality layers
- dice history
- turn count

The final story should feel like a complete fiction with:

- a beginning
- a rising consequence
- a turning point
- a final realization, repair, failure, or unresolved echo

It should not read like a mechanical report.

It should not say: “Because the player collected X...”

It should turn the run data into story.

---

## Codex Implementation Note

When this architecture is implemented, board data should support character-specific boards.

Recommended future structure:

```text
RIPPLE_CANON/
  CHARACTERS/
    TEODOR_SCOTT_BASE_STORY.md
  BOARDS/
    TEODOR_SCOTT_BOARD_MAP.md
  ARCHITECTURE_NOTES/
    TEODOR_BOARD_ARCHITECTURE_PHASE_01.md

app/src/data/boards/
  teodor.json
  mara.json
  jamal.json
  maren.json
  dev.json

app/src/data/characters/
  teodor.json
  mara.json
  jamal.json
  maren.json
  dev.json
```

Each character should eventually have:

- a base story
- a board map
- fixed anchors
- branch pairs
- full space cards
- invariants
- boolean logic
- final story generation constraints

---

## Next Phase

The next phase is to create:

```text
TEODOR_SCOTT_BOARD_MAP.md
```

That file should include:

- purpose
- zone map
- fixed anchors
- branch pair rules
- full 72-space skeleton
- boolean notes
- next step: full space cards

After that, the board spaces can be written in groups of 8 or 12.
