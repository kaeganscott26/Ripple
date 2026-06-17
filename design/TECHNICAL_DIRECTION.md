# TECHNICAL DIRECTION

_Status: Local-First | 2D Board | Rules Before AI_

Ripple should be built for realistic consumer hardware.

The first prototype must not depend on cloud infrastructure, paid API calls, high-end GPUs, or a complex 3D engine.

---

## Initial Stack Direction

The first prototype can be built with:

- lightweight web UI or simple desktop UI
- local JSON/Markdown data
- turn-based simulation loop
- deterministic rule engine
- optional local AI later

Recommended first shape:

- frontend: simple 2D board, cards, panels, event feed
- backend: Python or Node
- data: JSON generated from Markdown source
- persistence: local files first, SQLite later
- AI: off by default, local optional later

---

## Hardware Assumption

Build for laptops with limited RAM.

Do not assume:

- large local models
- constant real-time agent thinking
- 100+ active agents
- heavy 3D rendering

Do assume:

- turn-based processing
- short prompts if AI is used
- small active cast per room
- supporting agents handled by rules
- symbolic agents handled by system logic

---

## Core Rule

Code handles mechanics.

AI handles meaning.

Mechanics include:

- turn order
- board movement
- resource/meter updates
- event log creation
- memory seed selection
- room unlocks
- artifact state
- law creation triggers
- relationship values

Meaning includes:

- agent interpretation
- short dialogue
- belief mutation
- reflection
- rumor phrasing
- memory summary

---

## AI Modes

### AI Off

Default early prototype.

All agent behavior is rules-based.

### Local AI

Optional later mode using local model backend.

The game must still run if local AI is unavailable.

### External API

Future optional mode only.

Never required for core play.

---

## Data Direction

Keep design data human-readable first.

Recommended folders later:

- `game_data/agents/`
- `game_data/rooms/`
- `game_data/artifacts/`
- `game_data/rules/`
- `game_data/runs/`

Codex should eventually convert Markdown context into structured JSON.

Do not remove Markdown design context.

---

## First Prototype Requirements

The first prototype should load:

- a small room list
- a small agent list
- memory variants
- a ripple input
- a deterministic reaction system

It should display:

- current room
- active agents
- active artifact
- event log
- base reality
- perceived reality
- social reality
- institutional reality

It should export:

- markdown run summary

---

## Do Not Optimize Early

Do not build vector memory first.

Do not Dockerize before the local loop runs.

Do not add Ollama before deterministic behavior works.

Do not create a giant asset pipeline.

Do not integrate Minecraft.

Do not build nested simulation before the outer board works.

---

## Best First Win

A player chooses a memory mode, enters the Boulder Room, disturbs or names the Boulder, advances turns, and sees agent beliefs create a new rule.

That is enough for the first real prototype.
