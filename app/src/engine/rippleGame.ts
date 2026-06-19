import { boardSpaces } from "../data/liveBoard";
import { buildFinalStory, buildRippleRiddlePrompt, influenceFor } from "./aiGlass";
import type {
  ArtifactRecord,
  ArtifactState,
  RippleGameSetup,
  RippleGameState,
  ThreeDiceRoll,
} from "./gameTypes";

export function rollThreeDice(random: () => number = Math.random): ThreeDiceRoll {
  const dieA = Math.floor(random() * 6) + 1;
  const dieB = Math.floor(random() * 6) + 1;
  const ripple = Math.floor(random() * 6) + 1;

  return {
    movement: [dieA, dieB],
    ripple,
    total: dieA + dieB,
    doubles: dieA === dieB,
    influence: influenceFor(ripple),
  };
}

export function createRippleGame(setup: RippleGameSetup): RippleGameState {
  return {
    version: 1,
    phase: "playing",
    modeId: setup.modeId,
    characterId: setup.characterId,
    position: 0,
    turn: 0,
    extraTurnsEarned: 0,
    extraTurnPending: false,
    inventory: { missed: [], collected: [], ignored: [], forced: [] },
    turns: [],
  };
}

function artifactRecord(
  state: RippleGameState,
  position: number,
  status: ArtifactState,
  fragment: string,
): ArtifactRecord {
  const space = boardSpaces[position];
  return {
    id: `${state.turn}-${space.id}-${status}`,
    turn: state.turn,
    state: status,
    spaceId: space.id,
    spaceName: space.name,
    artifactName: space.artifactName,
    realityLayer: space.realityLayer,
    glassFragment: fragment,
    consequence: status === "forced" ? space.forcedConsequence : undefined,
  };
}

export function advanceWithRoll(state: RippleGameState, suppliedRoll?: ThreeDiceRoll): RippleGameState {
  if (state.phase !== "playing") return state;

  const roll = suppliedRoll ?? rollThreeDice();
  const from = state.position;
  const to = Math.min(from + roll.total, boardSpaces.length - 1);
  const turn = state.turn + 1;
  const prompt = buildRippleRiddlePrompt({ ...state, turn }, boardSpaces[to], roll);
  const crossedPositions = Array.from({ length: Math.max(0, to - from - 1) }, (_, index) => from + index + 1);
  const missed = crossedPositions.map((position) => artifactRecord({ ...state, turn }, position, "missed", "Passed beyond the glass."));
  const offered = artifactRecord({ ...state, turn }, to, "collected", prompt.output);

  return {
    ...state,
    phase: "awaiting-choice",
    position: to,
    turn,
    lastRoll: roll,
    extraTurnsEarned: state.extraTurnsEarned + (roll.doubles ? 1 : 0),
    extraTurnPending: roll.doubles,
    pendingChoice: { artifact: offered, glassPrompt: prompt },
    inventory: { ...state.inventory, missed: [...state.inventory.missed, ...missed] },
    turns: [
      ...state.turns,
      { turn, from, to, roll, spaceId: boardSpaces[to].id, glassFragment: prompt.output },
    ],
  };
}

function completeIfNeeded(state: RippleGameState): RippleGameState {
  if (state.position !== boardSpaces.length - 1) return state;
  const complete = { ...state, phase: "complete" as const, extraTurnPending: false };
  return { ...complete, finalStory: buildFinalStory(complete) };
}

export function collectArtifact(state: RippleGameState): RippleGameState {
  if (state.phase !== "awaiting-choice" || !state.pendingChoice) return state;
  const collected = { ...state.pendingChoice.artifact, state: "collected" as const };
  const next: RippleGameState = {
    ...state,
    phase: "playing",
    pendingChoice: undefined,
    inventory: { ...state.inventory, collected: [...state.inventory.collected, collected] },
    turns: state.turns.map((turn, index) => (index === state.turns.length - 1 ? { ...turn, decision: "collect" } : turn)),
  };
  return completeIfNeeded(next);
}

export function ignoreArtifact(state: RippleGameState): RippleGameState {
  if (state.phase !== "awaiting-choice" || !state.pendingChoice) return state;
  const ignored = { ...state.pendingChoice.artifact, state: "ignored" as const };
  const forcedPosition = Math.max(0, state.position - 1);
  const forcedSpace = boardSpaces[forcedPosition];
  const forced = artifactRecord(state, forcedPosition, "forced", `Forced: ${forcedSpace.symbol} ${forcedSpace.artifactName}`);

  return {
    ...state,
    phase: "playing",
    position: forcedPosition,
    pendingChoice: undefined,
    inventory: {
      ...state.inventory,
      ignored: [...state.inventory.ignored, ignored],
      forced: [...state.inventory.forced, forced],
    },
    turns: state.turns.map((turn, index) =>
      index === state.turns.length - 1 ? { ...turn, decision: "ignore", forcedSpaceId: forcedSpace.id } : turn,
    ),
  };
}
