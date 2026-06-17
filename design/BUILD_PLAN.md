# BUILD PLAN

_Status: Practical Build Route | Local-First | Board Prototype_

Ripple should be built in stages.

Do not start with the final game.

Start with the smallest playable loop that proves consequence.

---

## Phase 0 — Repo Separation

Goal: make Ripple its own project.

Complete when:

- Ripple exists as a separate GitHub repository.
- README explains Ripple as a standalone game.
- INTERVENTION is described only as source-code ARG material.
- Design context exists before code generation begins.

---

## Phase 1 — Source Extraction

Goal: turn copied source material into game-readable structure.

Create indexes for:

- rooms
- characters
- artifacts
- layers
- ripple functions
- safety boundaries

Output files should be readable by humans first.

Machine data can come later.

---

## Phase 2 — Memory Seed System

Goal: give agents replayable, non-fixed histories.

Each agent gets:

- identity core
- Life A
- Life B
- Life C
- optional fragments

The opening game mode determines how these lives are selected or revealed.

---

## Phase 3 — Board Skeleton

Goal: create a 2D board prototype with no AI required.

Minimum features:

- board map
- room cards
- agent cards
- artifact cards
- turn button
- event feed
- memory seed selection
- reality layer display

No complex graphics required.

---

## Phase 4 — Rules-Based Simulation

Goal: prove the loop with deterministic logic.

The first loop:

1. Player selects mode.
2. Board selects or reveals memory seeds.
3. Player enters the Boulder Room.
4. Player injects or selects a ripple.
5. Agents react using rules and memory variants.
6. Reality layers update.
7. A run log is generated.

---

## Phase 5 — Ripple: The Boulder Build

Goal: first polished demo.

Include:

- Boulder Room
- 3 to 5 connected symbolic rooms
- 5 to 8 active agents
- Boulder artifact
- basic law emergence
- event log
- exported markdown artifact

The demo succeeds if the player can see a small event become shared meaning or institutional consequence.

---

## Phase 6 — Local AI Optional Layer

Goal: add meaning generation after the skeleton works.

Add optional local AI through a backend such as Ollama.

Rules:

- AI must be optional.
- Game must run without AI.
- AI output must be structured.
- Invalid AI output falls back to rules.
- AI should interpret, not control mechanics.

---

## Phase 7 — Nested Simulation

Goal: let agents create a simulation inside the simulation.

Agents pass down only what they know.

Their inner world inherits:

- active memory variants
- remembered artifacts
- current laws
- distortions
- myths
- unresolved ripples

Core law:

No layer can transmit what it cannot observe.

---

## Phase 8 — Expansion

Add more rooms, artifacts, factions, and agents after the core loop works.

The game should grow from stability, not sprawl.

Build consequence first.

Let civilization emerge.
