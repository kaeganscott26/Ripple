# Ripple: Canonical Board Loop

Ripple is a local, fictional symbolic board game. The current game selects one of five characters, rolls three dice, moves across a finite board, and asks the player to collect or ignore a short artifact offered by the center glass.

## Game loop

1. Select Mystery, Vague, or Experimental / Master mode.
2. Select Mara, Jamal, Maren, Dev, or Teodor / Scott.
3. Roll three dice. The first two move; the third influences the glass output. Doubles earn an extra turn.
4. Crossed spaces enter the missed ledger. The landing offers one artifact.
5. Collect the artifact, or ignore it and move back one space to receive that space's forced artifact and consequence.
6. Reach the final space and collect its offer to generate a complete fictional story from the run.

Missed, collected, ignored, and forced artifacts are separate state collections.

## Source boundary

The playable board does not load INTERVENTION chapters or use chapter scenes as game events. Existing archive, story-reference, artifact, glossary, and component files remain in the repository. The new board uses source vocabulary, reality-layer concepts, and safety boundaries only. Optional glossary material is available outside Mystery mode and expands in Experimental / Master mode.

## AI glass

`src/engine/aiGlass.ts` builds constrained prompt envelopes for in-turn Ripple Riddles and the ending story. In-turn outputs must be one fragment of two to eight words. Ending prompts require a full fiction rather than a mechanics recap. The checked-in build uses a deterministic local output so the board remains playable without a service; the prompt envelope is the integration seam for a model provider.

## Data and state

- `src/data/liveBoard.ts`: versioned, revisioned board dataset with stable remote keys for optional live updates.
- `src/data/gameConfig.ts`: mode and five-character configurations.
- `src/engine/gameTypes.ts`: canonical data contracts.
- `src/engine/rippleGame.ts`: dice, movement, choice, rollback, ledgers, and completion.
- `src/engine/aiGlass.ts`: riddle and final-story prompt contracts plus local outputs.

Runs persist in browser `localStorage` under `ripple-canonical-run-v1`.

## Local use

```bash
npm install
npm run dev
```

Validate with:

```bash
npm run test:run
npm run build
```
