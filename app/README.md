# Ripple: The Boulder Build

This is the first local playable prototype for Ripple. It is a small 2D turn loop centered on the Boulder Room, memory-seeded agents, source-derived story Boulders, pressure changes, reality layers, law formation, and Markdown run export.

It is not an AI system, backend service, Minecraft build, Docker app, or direct rewrite of the source archive. v0.8 keeps the Boulder Build loop local and deterministic while making the board self-explaining and the INTERVENTION archive readable inside the game.

## v0.8 Loop

1. Choose a mode.
2. Select a character or leave the target as Room.
3. Choose a Story Weight.
4. Tap Inspect to update the Inspector and the visible inspection strip.
5. Read the Action Preview beside Introduce Selected Boulder.
6. Introduce the selected weight.
7. Watch meters, halos, reality layers, Society View, and Turn Feedback change.
8. Use Read Source or Archive View to read the chapter, artifact, or note that produced the game object.
9. Export the run when it becomes worth archiving.

Story Weights are pieces of the INTERVENTION archive that can enter the room. When one is introduced, Ripple records the source file, target, plain-language meaning, and resulting interpretation in Turn Feedback and the Markdown export.

## v0.8 Interaction Notes

- Inspecting Story Weights, layer cards, agent pieces, halos, meters, law badges, the Boulder, and Society View nodes updates the Inspector with plain-language meaning, source context, mechanical effects, current run context, and a suggested next action.
- The selected Story Weight and selected target remain visible while the inspected object can change independently.
- Metric values are formatted for play, so long floating-point artifacts are hidden.
- Mobile layouts use larger card actions and a sticky inspection strip so taps produce visible feedback near the board.
- Archive View statically bundles the INTERVENTION chapters, artifacts, and notes through Vite raw imports. It does not read the filesystem at runtime and it does not mutate original source files.

## Install

```bash
npm install
```

## Run

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm run test
npm run test:run
```

## Current Limitations

- The board is intentionally small and local-only.
- Runs persist in browser localStorage, not a backend.
- Agent behavior is deterministic rule logic, not AI.
- The prototype covers the Boulder Build loop plus a supporting Archive Reader.
- Nested Simulation is visible as a locked future layer, not an active simulation.
- Full markdown ingestion/generation is not built yet; archive documents are curated static app data for this pass.
