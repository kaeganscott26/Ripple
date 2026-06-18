# Ripple: The Boulder Build

This is the first local playable prototype for Ripple. It is a small 2D turn loop centered on the Boulder Room, memory-seeded agents, pressure changes, reality layers, law formation, and Markdown run export.

It is not an AI system, backend service, Minecraft build, Docker app, or direct rewrite of the source archive. v0.6 keeps the Boulder Build loop local and deterministic while adding clickable explanations and context-aware interpretation history.

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
- The prototype covers the Boulder Build loop only.
