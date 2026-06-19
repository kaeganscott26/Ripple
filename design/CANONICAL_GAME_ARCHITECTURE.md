# Canonical Game Architecture

## Boundary

INTERVENTION is not a gameplay content feed. Chapters, chapter scenes, and chapter order do not determine spaces, consequences, or riddles. Existing source files stay preserved as lore and archive material. The playable layer may use only:

- reality-layer structure;
- artifact and symbolic vocabulary;
- theory and safety guardrails;
- optional glossary/index references.

The player never needs to open source material to understand or finish a run.

## Runtime flow

`setup -> playing -> awaiting-choice -> playing -> complete`

- Setup stores one mode and one of five characters.
- A roll contains two movement dice and one ripple die.
- Movement clamps at the final board space. Crossed spaces become missed artifacts.
- Landing creates a constrained glass prompt and one pending artifact.
- Collect moves the pending artifact to `inventory.collected`.
- Ignore moves it to `inventory.ignored`, moves the player back one space, and adds that space's artifact to `inventory.forced` with its consequence.
- Doubles set `extraTurnPending` and increment `extraTurnsEarned`.
- Collecting at the final space closes the run and creates the final story prompt and output. Ignoring there moves the player back, so the run remains open.

## Data contracts

The runtime uses `RippleGameState` from `app/src/engine/gameTypes.ts`. Artifact ledgers are separate arrays rather than a single list filtered by labels, making saved-state and UI behavior explicit.

`LiveBoardDataset` has a schema version, dataset revision, update timestamp, source type, and stable per-space `remoteKey` plus revision. A future live loader can validate remote data into this contract and fall back to the bundled dataset without changing the turn engine.

## Glass contracts

Gameplay prompt inputs include character, mode, space, both movement dice, ripple die/influence, artifact vocabulary, and reality layer. Output constraints require one two-to-eight-word fragment and reject chapter references, mechanics recap, diagnosis, prophecy, commands, and hidden-truth claims.

The final prompt receives the complete run trace and all four artifact ledgers. Its constraints require scenes, causality, character change, and an ending. Mechanics must be transformed into fiction and must not appear as a run recap.

The local generator is deterministic for offline play. A model integration should replace only prompt execution, preserve the prompt envelopes and output constraints, validate the short-output word count, and retain the local generator as failure fallback.

