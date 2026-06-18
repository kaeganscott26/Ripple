# Ripple: The Living Board

Ripple v0.8.1 is the Living Board refactor. It keeps the v0.8 archive, Story Weight, layer card, meter, inspector, Society View, and Markdown export systems, but reorganizes play around a turn-based board loop.

Ripple is local, offline once served or bundled, deterministic, and source-backed. It is not an AI system, backend service, Cloudflare deployment, R2 storage layer, source ingestion pipeline, diagnosis tool, or proof system.

## v0.8.1 Board Loop

1. Choose Mystery, Vague, or Experimental mode.
2. The current character takes a turn.
3. Roll 2d6.
4. Move the character piece around the 12-space Room Board.
5. Land on a Story Space built from the INTERVENTION archive.
6. Read the landing reveal, source, plain meaning, character reading, meter changes, and room response.
7. Move to the next character.
8. After every character acts, read the round summary and Society View.
9. Keep playing until the room forms enough memory, source trace, and law to approach Nested Simulation.
10. Export the run as a Markdown artifact.

## Dice And Turn Order

- Dice use 2d6, stored as individual dice plus total.
- Each active character gets one board turn per round: Mara, Jamal, Maren, Dev, and Teodor / Scott.
- Board positions are tracked per character.
- The first board is a readable 12-space loop using curated v0.8 Story Weights plus a locked Nested Simulation Gate.

## Mode Behavior

- Mystery: possible spaces stay hidden before the roll. The board reveals meaning after landing.
- Vague: possible spaces show names and short meanings. This is the default public feel.
- Experimental: possible landings are inspectable before rolling, including source, layer pull, trigger pattern, likely effects, and related Story Weights.

## Archive View

Archive View remains the source layer. It still includes the document list, reader, Read Source behavior, related Story Weights, related Layer Cards, related characters, and return-to-board flow. Story Spaces and landing reveals link back to source documents through the Inspector and Read Source path.

## Manual Story Weight Mode

The v0.8 manual Story Weight loop remains available as a secondary/experimental tool. It is useful for direct archive play, testing a specific Story Weight against a target character, and inspecting source-linked behavior without waiting for dice.

## Nested Simulation Goal

Nested Simulation is still locked, but now has visible progress:

- complete rounds
- land characters on Story Spaces
- form laws
- use source documents
- export a run log
- generate a Simulation Seed

The direction is: create the room that creates the next room.

## Language And Inspection

Player-facing copy now favors plain language first and Ripple terms second. Board turns use Story Space language. The legacy Name the Boulder action can still use naming language.

The Active Inspection Summary is compact and collapsible. It defaults collapsed in Archive View so it does not dominate the reader.

## Local Use

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
CI=1 npm run test
npm run test:run
```

## Current Limits

- Nested Simulation progress exists, but full nested simulation mechanics are not built yet.
- Real-world evidence cards are intentionally not added yet.
- Source ingestion remains curated static app data for this pass.
- Runs persist in browser localStorage, not a backend.
