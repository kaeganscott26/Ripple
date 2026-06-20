import { boardForCharacter, type PlayableBoard } from "../data/boards";
import { buildFinalStory, buildRippleRiddlePrompt, influenceFor } from "./aiGlass";
import type {
  ArtifactRecord,
  ArtifactState,
  BranchPairResolution,
  BranchPairState,
  LifeBoardRunState,
  LifeBoardSpace,
  RippleGameSetup,
  RippleGameState,
  RippleLensEffect,
  DiceRoll,
} from "./gameTypes";

export function rollDice(random: () => number = Math.random): DiceRoll {
  const movementDie = Math.floor(random() * 6) + 1;
  const rippleDie = Math.floor(random() * 6) + 1;
  return {
    movementDie,
    rippleDie,
    total: movementDie,
    lens: influenceFor(rippleDie),
  };
}

function initialBoardRun(setup: RippleGameSetup, board: PlayableBoard): LifeBoardRunState {
  const fixed_anchor_states = Object.fromEntries(
    (board.authored?.fixedAnchors ?? []).map((number) => [number, "unseen"]),
  ) as LifeBoardRunState["fixed_anchor_states"];
  const branch_pair_states = Object.fromEntries(
    (board.authored?.branchGroups ?? []).map(({ id, spaces }) => [
      id,
      { group: id, spaces, collected: [], ignored: [], missed: [], forced: [], status: "pending" },
    ]),
  ) as Record<string, BranchPairState>;

  return {
    selected_mode: setup.modeId,
    selected_character: setup.characterId,
    current_position: 1,
    turn_count: 0,
    dice_history: [],
    ripple_lens_history: [],
    active_lens: null,
    lens_effects: [],
    emphasized_spaces: [],
    echo_links: [],
    amplified_spaces: [],
    intervention_turns_used: 0,
    resonance_count: 0,
    rescued_artifacts: [],
    skipped_resonance_opportunities: 0,
    spaces_landed: [],
    spaces_collected: [],
    spaces_ignored: [],
    spaces_missed: [],
    spaces_forced: [],
    fixed_anchor_states,
    branch_pair_states,
    resolved_branch_pairs: [],
    unresolved_branch_pairs: [],
    dominant_zones: [],
    dominant_reality_layers: [],
    ending_pressure: [],
    final_response: "unresolved_final_response",
    last_glass_reached: false,
  };
}

export function createRippleGame(setup: RippleGameSetup): RippleGameState {
  const board = boardForCharacter(setup.characterId);
  const initial: RippleGameState = {
    version: 5,
    boardId: board.id,
    phase: "playing",
    modeId: setup.modeId,
    characterId: setup.characterId,
    position: 0,
    turn: 0,
    resonanceActive: false,
    inventory: { missed: [], collected: [], ignored: [], forced: [] },
    turns: [],
    boardRun: initialBoardRun(setup, board),
  };
  if (!board.authored) return initial;
  const firstSpace = board.authored.spaces[0];
  const started: RippleGameState = {
    ...initial,
    phase: "awaiting-choice",
    boardRun: updateDerivedRun(board, { ...initial.boardRun, spaces_landed: [1] }),
  };
  return {
    ...started,
    pendingChoice: {
      artifact: artifactRecord(started, board, 0, "collected", firstSpace.glassRiddle),
      glassPrompt: {
        system: "The authored life-board begins at a fixed anchor.",
        user: `Space 01 — ${firstSpace.name}\n${firstSpace.storySeed}`,
        constraints: ["Adoption remains true in every standard ending.", "The player's relationship to the anchor may change."],
        output: firstSpace.glassRiddle,
      },
    },
  };
}

function asLifeSpace(board: PlayableBoard, position: number): LifeBoardSpace | undefined {
  return board.authored?.spaces[position];
}

function artifactRecord(
  state: RippleGameState,
  board: PlayableBoard,
  position: number,
  status: ArtifactState,
  fragment: string,
): ArtifactRecord {
  const space = board.spaces[position];
  const authored = asLifeSpace(board, position);
  const meaning =
    status === "collected"
      ? authored?.collectMeaning
      : status === "ignored"
        ? authored?.ignoreMeaning
        : status === "missed"
          ? authored?.missedMeaning
          : authored?.forcedConsequence;
  return {
    id: `${state.turn}-${space.id}-${status}`,
    turn: state.turn,
    state: status,
    spaceId: space.id,
    spaceName: space.name,
    artifactName: space.artifactName,
    realityLayer: space.realityLayer,
    glassFragment: fragment,
    storySeed: authored?.storySeed,
    meaning,
    consequence: status === "forced" ? space.forcedConsequence : undefined,
  };
}

function unique(numbers: number[]): number[] {
  return Array.from(new Set(numbers)).sort((a, b) => a - b);
}

function weightedDominance(board: PlayableBoard, run: LifeBoardRunState) {
  const weights = new Map<number, number>();
  run.spaces_missed.forEach((number) => weights.set(number, 0.25));
  run.spaces_ignored.forEach((number) => weights.set(number, 1));
  run.spaces_forced.forEach((number) => weights.set(number, 2));
  run.spaces_collected.forEach((number) => weights.set(number, 3));
  const zones = new Map<string, number>();
  const layers = new Map<string, number>();
  weights.forEach((weight, number) => {
    const space = asLifeSpace(board, number - 1);
    if (!space) return;
    const weighted = run.amplified_spaces.includes(number) ? weight * 2 : weight;
    zones.set(space.zone, (zones.get(space.zone) ?? 0) + weighted);
    space.realityLayers.forEach((layer) => layers.set(layer, (layers.get(layer) ?? 0) + weighted));
  });
  const leaders = (values: Map<string, number>) =>
    [...values].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  return { zones: leaders(zones), layers: leaders(layers) };
}

function updateDerivedRun(board: PlayableBoard, run: LifeBoardRunState): LifeBoardRunState {
  if (!board.authored) return run;
  const fixed_anchor_states = { ...run.fixed_anchor_states };
  board.authored.fixedAnchors.forEach((number) => {
    if (run.spaces_collected.includes(number)) fixed_anchor_states[number] = "collected";
    else if (run.spaces_ignored.includes(number)) fixed_anchor_states[number] = "ignored";
    else if (run.spaces_forced.includes(number)) fixed_anchor_states[number] = "forced";
    else if (run.spaces_missed.includes(number)) fixed_anchor_states[number] = "missed";
    else if (run.spaces_landed.includes(number)) fixed_anchor_states[number] = "landed";
    else fixed_anchor_states[number] = "unseen";
  });

  const branch_pair_states = Object.fromEntries(board.authored.branchGroups.map(({ id, spaces }) => {
    const filter = (source: number[]) => spaces.filter((number) => source.includes(number));
    const collected = filter(run.spaces_collected);
    const ignored = filter(run.spaces_ignored);
    const missed = filter(run.spaces_missed);
    const forced = filter(run.spaces_forced);
    const status: BranchPairState["status"] =
      collected.length === 2 ? "contradiction" :
      collected.length === 1 ? "dominant" :
      ignored.length > 0 || forced.length > 0 ? "pressure" :
      missed.length === 2 ? "unresolved" : "pending";
    return [id, { group: id, spaces, collected, ignored, missed, forced, status }];
  })) as Record<string, BranchPairState>;
  const dominance = weightedDominance(board, run);
  const pressureSpaces = run.lens_effects.filter((effect) => effect.lens === "Pressure").map((effect) => effect.space);
  const ending_pressure = unique([...run.spaces_ignored, ...run.spaces_forced, ...pressureSpaces])
    .map((number) => board.spaces[number - 1]?.name)
    .filter((name): name is string => Boolean(name));

  return {
    ...run,
    fixed_anchor_states,
    branch_pair_states,
    unresolved_branch_pairs: Object.values(branch_pair_states).filter((pair) => pair.status === "unresolved").map((pair) => pair.group),
    dominant_zones: dominance.zones,
    dominant_reality_layers: dominance.layers,
    ending_pressure,
  };
}

function normalizedRoll(roll: DiceRoll): DiceRoll {
  const movementDie = Math.min(6, Math.max(1, Math.floor(roll.movementDie)));
  const rippleDie = Math.min(6, Math.max(1, Math.floor(roll.rippleDie)));
  return {
    movementDie,
    rippleDie,
    total: movementDie,
    lens: influenceFor(rippleDie),
  };
}

function applyLens(board: PlayableBoard, run: LifeBoardRunState, roll: DiceRoll, space: number, turn: number): LifeBoardRunState {
  const authoredSpace = asLifeSpace(board, space - 1);
  let emphasizedSpaces = run.emphasized_spaces;
  let amplifiedSpaces = run.amplified_spaces;
  let echoLinks = run.echo_links;
  let relatedSpace: number | undefined;
  let branchGroup: string | undefined;
  let note: string;

  if (roll.lens === "Memory") {
    note = `${board.spaces[space - 1].name} returns as remembered sensory material.`;
  } else if (roll.lens === "Pressure") {
    note = `${board.spaces[space - 1].name} carries tension and delayed pressure into the ending.`;
  } else if (roll.lens === "Echo") {
    const known = unique([
      ...run.spaces_collected,
      ...run.spaces_ignored,
      ...run.spaces_missed,
      ...run.spaces_forced,
      ...run.spaces_landed,
    ]).filter((number) => number !== space);
    relatedSpace = authoredSpace?.oppositeSpace ?? known.sort((a, b) => Math.abs(a - space) - Math.abs(b - space))[0];
    if (relatedSpace) {
      note = `${board.spaces[space - 1].name} echoes ${board.spaces[relatedSpace - 1]?.name ?? `Space ${relatedSpace}`}.`;
      echoLinks = [...echoLinks, { turn, fromSpace: space, toSpace: relatedSpace, note }];
    } else {
      note = `${board.spaces[space - 1].name} waits for a later room to answer it.`;
    }
  } else if (roll.lens === "Fork") {
    const ownGroup = authoredSpace?.branchGroup
      ? board.authored?.branchGroups.find((group) => group.id === authoredSpace.branchGroup)
      : undefined;
    const unresolved = board.authored?.branchGroups
      .filter((group) => ["pending", "unresolved"].includes(run.branch_pair_states[group.id]?.status ?? "pending"))
      .sort((a, b) => {
        const distance = (group: { spaces: [number, number] }) => Math.min(...group.spaces.map((number) => Math.abs(number - space)));
        return distance(a) - distance(b);
      })[0];
    const group = ownGroup ?? unresolved;
    branchGroup = group?.id;
    relatedSpace = ownGroup ? ownGroup.spaces.find((number) => number !== space) : group?.spaces[0];
    const targets = relatedSpace ? [relatedSpace] : group?.spaces ?? [];
    emphasizedSpaces = unique([...emphasizedSpaces, ...targets]);
    note = relatedSpace
      ? `${board.spaces[relatedSpace - 1]?.name ?? `Space ${relatedSpace}`} is emphasized as an alternate possibility.`
      : "No unresolved branch remains to emphasize.";
  } else if (roll.lens === "Intervention") {
    note = `${board.spaces[space - 1].name} may be ignored without moving back.`;
  } else {
    amplifiedSpaces = unique([...amplifiedSpaces, space]);
    note = `${board.spaces[space - 1].name} has heavier influence on the ending.`;
  }

  const effect: RippleLensEffect = { turn, lens: roll.lens, space, note, relatedSpace, branchGroup };
  return {
    ...run,
    ripple_lens_history: [...run.ripple_lens_history, roll.lens],
    active_lens: roll.lens,
    lens_effects: [...run.lens_effects, effect],
    emphasized_spaces: emphasizedSpaces,
    echo_links: echoLinks,
    amplified_spaces: amplifiedSpaces,
  };
}

function modeChoice(group: string, spaces: [number, number], run: LifeBoardRunState): number {
  const seed = [...group].reduce((sum, char) => sum + char.charCodeAt(0), 0)
    + run.dice_history.reduce((sum, roll) => sum + roll.total + roll.rippleDie, 0);
  return spaces[seed % 2];
}

function resolveBranches(board: PlayableBoard, run: LifeBoardRunState): LifeBoardRunState {
  if (!board.authored) return run;
  const derived = updateDerivedRun(board, run);
  const resolved_branch_pairs: BranchPairResolution[] = Object.values(derived.branch_pair_states).map((pair) => {
    const name = (number: number) => board.spaces[number - 1]?.name ?? `Space ${number}`;
    if (pair.collected.length === 2) {
      return { group: pair.group, spaces: pair.spaces, kind: "contradiction", resolution: `${name(pair.spaces[0])} and ${name(pair.spaces[1])}`, dominantSpaces: [...pair.spaces], hidden: false };
    }
    if (pair.collected.length === 1) {
      return { group: pair.group, spaces: pair.spaces, kind: "dominant", resolution: name(pair.collected[0]), dominantSpaces: pair.collected, hidden: false };
    }
    if (pair.ignored.length > 0 || pair.forced.length > 0) {
      const pressure = unique([...pair.ignored, ...pair.forced]);
      const subject = pressure.map(name).join(" and ");
      return { group: pair.group, spaces: pair.spaces, kind: "pressure", resolution: `${subject} ${pressure.length > 1 ? "return" : "returns"} as pressure`, dominantSpaces: pressure, hidden: false };
    }
    const chosen = modeChoice(pair.group, pair.spaces, derived);
    return {
      group: pair.group,
      spaces: pair.spaces,
      kind: "mode-resolved",
      resolution: name(chosen),
      dominantSpaces: [chosen],
      hidden: derived.selected_mode === "mystery",
    };
  });
  const final = resolved_branch_pairs.find((pair) => pair.group === "final_response");
  const responseNames = final?.dominantSpaces.map((number) => board.spaces[number - 1]?.name.toLowerCase()) ?? [];
  const final_response = !final
    ? "unresolved_final_response"
    : final.kind === "pressure" && responseNames.includes("accountability") && responseNames.includes("monument")
      ? "accountability_with_monument_pressure"
      : final.kind === "pressure"
        ? `${responseNames[0] ?? "unresolved_final_response"}_pressure`.replace(/\s+/g, "_")
        : final.resolution.toLowerCase().replace(/\s+/g, "_");
  return { ...derived, resolved_branch_pairs, final_response };
}

export function advanceWithRoll(state: RippleGameState, suppliedRoll?: DiceRoll): RippleGameState {
  if (state.phase !== "playing") return state;
  const board = boardForCharacter(state.characterId);
  const roll = normalizedRoll(suppliedRoll ?? rollDice());
  const from = state.position;
  const to = Math.min(from + roll.total, board.totalSpaces - 1);
  const turn = state.turn + 1;
  const prompt = buildRippleRiddlePrompt({ ...state, turn }, board.spaces[to], roll);
  const known = new Set([
    ...state.boardRun.spaces_landed,
    ...state.boardRun.spaces_collected,
    ...state.boardRun.spaces_ignored,
    ...state.boardRun.spaces_missed,
    ...state.boardRun.spaces_forced,
  ]);
  const crossedPositions = Array.from({ length: Math.max(0, to - from - 1) }, (_, index) => from + index + 1)
    .filter((position) => !known.has(position + 1));
  const missed = crossedPositions.map((position) =>
    artifactRecord({ ...state, turn }, board, position, "missed", asLifeSpace(board, position)?.missedMeaning ?? "Passed beyond the glass."),
  );
  const resonanceActive = roll.movementDie === roll.rippleDie;
  const offered = artifactRecord({ ...state, turn }, board, to, "collected", prompt.output);
  const landedRun = applyLens(board, state.boardRun, roll, to + 1, turn);
  const boardRun = updateDerivedRun(board, {
    ...landedRun,
    current_position: to + 1,
    turn_count: turn,
    dice_history: [...state.boardRun.dice_history, roll],
    spaces_landed: unique([...state.boardRun.spaces_landed, to + 1]),
    spaces_missed: unique([...state.boardRun.spaces_missed, ...crossedPositions.map((position) => position + 1)]),
    resonance_count: state.boardRun.resonance_count + (resonanceActive ? 1 : 0),
    last_glass_reached: to === board.totalSpaces - 1,
  });

  return {
    ...state,
    phase: "awaiting-choice",
    position: to,
    turn,
    lastRoll: roll,
    resonanceActive,
    pendingChoice: { artifact: offered, glassPrompt: prompt },
    pendingResonance: resonanceActive && missed.length > 0 ? { turn, candidates: missed } : undefined,
    inventory: { ...state.inventory, missed: [...state.inventory.missed, ...missed] },
    boardRun,
    turns: [...state.turns, { turn, from, to, roll, spaceId: board.spaces[to].id, glassFragment: prompt.output, resonance: resonanceActive }],
  };
}

export function rescueMissedArtifact(state: RippleGameState, artifactId: string): RippleGameState {
  const opportunity = state.pendingResonance;
  if (state.phase !== "awaiting-choice" || !opportunity || opportunity.turn !== state.turn) return state;
  const candidate = opportunity.candidates.find((artifact) => artifact.id === artifactId);
  if (!candidate) return state;
  const board = boardForCharacter(state.characterId);
  const number = board.spaces.findIndex((space) => space.id === candidate.spaceId) + 1;
  if (number < 1) return state;
  const rescued: ArtifactRecord = {
    ...candidate,
    id: `${candidate.id}-resonance`,
    state: "collected",
    recovery: "resonance",
    recoveryNote: "Rescued by resonance",
    meaning: asLifeSpace(board, number - 1)?.collectMeaning ?? candidate.meaning,
  };
  const boardRun = updateDerivedRun(board, {
    ...state.boardRun,
    spaces_missed: state.boardRun.spaces_missed.filter((space) => space !== number),
    spaces_collected: unique([...state.boardRun.spaces_collected, number]),
    rescued_artifacts: unique([...state.boardRun.rescued_artifacts, number]),
  });
  return {
    ...state,
    pendingResonance: undefined,
    inventory: {
      ...state.inventory,
      missed: state.inventory.missed.filter((artifact) => artifact.id !== candidate.id),
      collected: [...state.inventory.collected, rescued],
    },
    boardRun,
    turns: state.turns.map((turn, index) => index === state.turns.length - 1
      ? { ...turn, rescuedArtifactSpaceId: candidate.spaceId }
      : turn),
  };
}

export function skipResonance(state: RippleGameState): RippleGameState {
  if (state.phase !== "awaiting-choice" || !state.pendingResonance || state.pendingResonance.turn !== state.turn) return state;
  return {
    ...state,
    pendingResonance: undefined,
    boardRun: {
      ...state.boardRun,
      skipped_resonance_opportunities: state.boardRun.skipped_resonance_opportunities + 1,
    },
    turns: state.turns.map((turn, index) => index === state.turns.length - 1
      ? { ...turn, resonanceSkipped: true }
      : turn),
  };
}

function completeIfNeeded(state: RippleGameState): RippleGameState {
  const board = boardForCharacter(state.characterId);
  if (state.position !== board.totalSpaces - 1) return state;
  const boardRun = resolveBranches(board, { ...state.boardRun, last_glass_reached: true });
  const complete = { ...state, boardRun, phase: "complete" as const };
  return { ...complete, finalStory: buildFinalStory(complete) };
}

export function collectArtifact(state: RippleGameState): RippleGameState {
  if (state.phase !== "awaiting-choice" || !state.pendingChoice || state.pendingResonance) return state;
  const board = boardForCharacter(state.characterId);
  const collected = { ...state.pendingChoice.artifact, state: "collected" as const };
  const number = state.position + 1;
  const next: RippleGameState = {
    ...state,
    phase: "playing",
    pendingChoice: undefined,
    inventory: { ...state.inventory, collected: [...state.inventory.collected, collected] },
    boardRun: updateDerivedRun(board, { ...state.boardRun, spaces_collected: unique([...state.boardRun.spaces_collected, number]) }),
    turns: state.turns.map((turn, index) => index === state.turns.length - 1 ? { ...turn, decision: "collect" } : turn),
  };
  return completeIfNeeded(next);
}

export function ignoreArtifact(state: RippleGameState): RippleGameState {
  if (state.phase !== "awaiting-choice" || !state.pendingChoice || state.pendingResonance) return state;
  const board = boardForCharacter(state.characterId);
  if (state.position === board.totalSpaces - 1) return collectArtifact(state);
  const ignored = { ...state.pendingChoice.artifact, state: "ignored" as const, meaning: asLifeSpace(board, state.position)?.ignoreMeaning };
  const intervention = state.lastRoll?.lens === "Intervention";
  if (intervention) {
    const boardRun = updateDerivedRun(board, {
      ...state.boardRun,
      spaces_ignored: unique([...state.boardRun.spaces_ignored, state.position + 1]),
      intervention_turns_used: state.boardRun.intervention_turns_used + 1,
    });
    return {
      ...state,
      phase: "playing",
      pendingChoice: undefined,
      inventory: { ...state.inventory, ignored: [...state.inventory.ignored, ignored] },
      boardRun,
      turns: state.turns.map((turn, index) => index === state.turns.length - 1 ? { ...turn, decision: "ignore" } : turn),
    };
  }
  const forcedPosition = Math.max(0, state.position - 1);
  const forcedSpace = board.spaces[forcedPosition];
  const forced = artifactRecord(state, board, forcedPosition, "forced", asLifeSpace(board, forcedPosition)?.forcedConsequence ?? `Forced: ${forcedSpace.symbol} ${forcedSpace.artifactName}`);
  const boardRun = updateDerivedRun(board, {
    ...state.boardRun,
    current_position: forcedPosition + 1,
    spaces_ignored: unique([...state.boardRun.spaces_ignored, state.position + 1]),
    spaces_forced: unique([...state.boardRun.spaces_forced, forcedPosition + 1]),
  });
  return {
    ...state,
    phase: "playing",
    position: forcedPosition,
    pendingChoice: undefined,
    inventory: { ...state.inventory, ignored: [...state.inventory.ignored, ignored], forced: [...state.inventory.forced, forced] },
    boardRun,
    turns: state.turns.map((turn, index) => index === state.turns.length - 1 ? { ...turn, decision: "ignore", forcedSpaceId: forcedSpace.id } : turn),
  };
}
