# BOARDS

_Status: Character Board Workspace | Base Stories | Board Maps | AI Ending Fuel_

---

## Purpose

This folder contains the character-specific board material for **Ripple: The Living Board**.

Each playable character has their own subfolder.

Each subfolder will eventually contain:

- the character base story
- the character board map
- full board space cards
- branch pairs
- fixed anchors
- invariants
- boolean logic
- AI ending fuel
- final story generation constraints

---

## Character Board Rule

Ripple does not use one shared board with cosmetic character flavor.

Each playable character has a different board, different spaces, different choices, different riddles, different artifacts, and different story possibility fragments.

The board is the character's life-path engine.

---

## Current Character Folders

```text
BOARDS/
  MARA/
  JAMAL/
  MAREN/
  DEV/
  TEODOR_SCOTT/
```

---

## Character Folder Shape

Each character folder should follow this eventual structure:

```text
BASE_STORY.md
BOARD_MAP.md
SPACE_CARDS.md
INVARIANTS.md
BOOLEAN_LOGIC.md
AI_ENDING_FUEL.md
README.md
```

The README in each folder is the local guide for that character's board.

---

## Build Rule

The writing comes first.

Codex should use these files as source context when implementing character boards, board loading, run state, and final story generation.

The app should never invent the soul of a character board from nothing.

The app should implement the authored board material stored here.
