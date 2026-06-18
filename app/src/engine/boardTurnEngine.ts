import type {
  ActiveAgent,
  BoardLanding,
  BoardSpacePreview,
  BoardTurnState,
  CharacterPathState,
  DiceRoll,
  EventEntry,
  EventType,
  LawState,
  NestedSimulationProgress,
  PressureValues,
  RealityOutcome,
  RoundSummary,
  RulesData,
  RunState,
  StoryObjectUse,
  StorySpace,
} from "./types";
import { lawProgressMessages } from "./lawProgress";
import { pressureChanges } from "./pressure";
import { appendMetricSnapshot, calculateRealityMetrics } from "./realityMetrics";
import { artifactDieResult } from "../data/canon/artifacts";
import { initialCharacterPath } from "../data/canon/characters";
import { realityOutcomeForDie, rollCanonDice } from "../data/canon/dice";
import { branchTextFor, updateCharacterPath } from "../data/canon/pathBranches";

const emptyPressure: PressureValues = { witness: 0, namedWeight: 0, institution: 0, concern: 0 };

function addPressure(a: PressureValues, b: PressureValues): PressureValues {
  return {
    witness: Math.max(0, a.witness + b.witness),
    namedWeight: Math.max(0, a.namedWeight + b.namedWeight),
    institution: Math.max(0, a.institution + b.institution),
    concern: Math.max(0, a.concern + b.concern),
  };
}

function scalePressure(values: PressureValues, amount: number): PressureValues {
  return {
    witness: values.witness * amount,
    namedWeight: values.namedWeight * amount,
    institution: values.institution * amount,
    concern: values.concern * amount,
  };
}

function createEvent(turn: number, type: EventType, text: string, index: number): EventEntry {
  return {
    id: `${turn}-${type}-${index}-${text.slice(0, 12)}`,
    turn,
    type,
    text,
  };
}

function checkLaws(state: RunState, rules: RulesData, turn: number): LawState[] {
  const existingIds = new Set(state.laws.map((law) => law.id));
  const newLaws: LawState[] = [];

  Object.entries(rules.laws).forEach(([id, law]) => {
    if (existingIds.has(id)) return;

    const passes = Object.entries(law.thresholds).every(([key, threshold]) => {
      const pressureKey = key as keyof PressureValues;
      return state.pressures[pressureKey] >= Number(threshold);
    });

    if (passes) {
      newLaws.push({
        id,
        name: law.name,
        description: law.description,
        formedTurn: turn,
      });
    }
  });

  return newLaws;
}

function dominantPressure(values: PressureValues): keyof PressureValues {
  return (Object.entries(values) as Array<[keyof PressureValues, number]>).sort((a, b) => b[1] - a[1])[0][0];
}

function pressureLabel(key: keyof PressureValues): string {
  const labels: Record<keyof PressureValues, string> = {
    witness: "Witness",
    namedWeight: "Named Weight",
    institution: "Institutional Pressure",
    concern: "Concern",
  };
  return labels[key];
}

function readingFor(agent: ActiveAgent, space: StorySpace, outcome: RealityOutcome): string {
  const base =
    space.characterReadings[agent.id] ??
    `${agent.name} reads ${space.title} as a playable path through ${space.alternateTitle ?? space.sourceTitle}.`;

  if (outcome === "Intervention Point") return `${base} The path opens instead of closing around pressure.`;
  if (outcome === "Ripple Event") return `${base} The effect moves outward and may change another turn later.`;
  return `${base} The cost is recorded so the room cannot erase it.`;
}

function textForOutcome(space: StorySpace, outcome: RealityOutcome): string {
  if (outcome === "Intervention Point") return space.interventionText ?? space.plainMeaning;
  if (outcome === "Ripple Event") return space.rippleText ?? space.plainMeaning;
  return space.missedText ?? space.plainMeaning;
}

function resultTextFor(outcome: RealityOutcome, agentName: string): string {
  if (outcome === "Intervention Point") return `${outcome} gained. ${agentName}'s path opens. Room pressure steadies.`;
  if (outcome === "Ripple Event") return `${outcome} recorded. The effect may bend another character's path later.`;
  return `${outcome} recorded. The run log keeps the cost visible.`;
}

function roomResponseFor(space: StorySpace, outcome: RealityOutcome): string {
  if (outcome === "Intervention Point") return "Room pressure steadies because the board caught the moment in time.";
  if (outcome === "Ripple Event") return "Room state changes indirectly; the landing becomes a future path modifier.";
  return "Room pressure rises because the board records what the room failed to hold.";
}

function societyResponseFor(space: StorySpace, outcome: RealityOutcome, artifactName: string): string {
  const chapter = space.mirrorsChapter ?? space.sourceTitle;
  if (outcome === "Intervention Point") return `${chapter} becomes a usable care pattern for society state.`;
  if (outcome === "Ripple Event") return `${chapter} sends a ripple through shared reality; ${artifactName} colors the record.`;
  return `${chapter} adds a missed-intervention warning to society state.`;
}

function effectsForOutcome(space: StorySpace, outcome: RealityOutcome): PressureValues {
  const base = space.baseMeterEffects;
  if (outcome === "Intervention Point") {
    return addPressure(scalePressure(base, 0.8), { witness: 2, namedWeight: 1, institution: 0, concern: 0 });
  }
  if (outcome === "Ripple Event") {
    return addPressure(scalePressure(base, 1), { witness: 1, namedWeight: 2, institution: 0, concern: 1 });
  }
  return addPressure(scalePressure(base, 1.15), { witness: 0, namedWeight: 1, institution: 1, concern: 3 });
}

function affectedLayers(space: StorySpace): string[] {
  return space.layers?.length ? space.layers : space.relatedLayerIds.length > 0 ? space.relatedLayerIds : [space.type];
}

function normalizeSuppliedRoll(roll: DiceRoll | undefined, space: StorySpace): DiceRoll | undefined {
  if (!roll) return undefined;
  const realityDie = roll.realityDie ?? 1;
  const artifactDie = roll.artifactDie ?? 1;
  const realityOutcome = roll.realityOutcome ?? realityOutcomeForDie(realityDie);
  const artifact = roll.artifact ?? artifactDieResult(artifactDie, space.artifactHooks ?? [], realityOutcome);

  return {
    ...roll,
    realityDie,
    artifactDie,
    realityOutcome,
    artifact,
  };
}

export function rollDice(random: () => number = Math.random, artifactHooks: string[] = []): DiceRoll {
  return rollCanonDice(random, artifactHooks);
}

export function createInitialBoardTurnState(agents: ActiveAgent[], boardLength = 204): BoardTurnState {
  const boardPositions = agents.reduce<Record<string, number>>((acc, agent, index) => {
    acc[agent.id] = (index * 3) % boardLength;
    return acc;
  }, {});
  const characterPaths = agents.reduce<Record<string, CharacterPathState>>((acc, agent) => {
    acc[agent.id] = initialCharacterPath(agent.id, boardPositions[agent.id] ?? 0);
    return acc;
  }, {});

  return {
    currentRound: 1,
    currentTurn: 0,
    currentAgentId: agents[0]?.id ?? "",
    currentAgentIndex: 0,
    hasRolledThisTurn: false,
    boardPositions,
    characterPaths,
    roomState: "The room is waiting for the first roll.",
    societyState: "Society state is quiet until a landing becomes shared reality.",
    sourceContact: [],
    artifactsUsed: [],
    completedTurns: [],
    landings: [],
    roundSummaries: [],
  };
}

export function normalizeBoardTurnState(state: RunState): BoardTurnState {
  const fallback = createInitialBoardTurnState(state.agents);
  const existing = state.boardTurn;
  if (!existing) return fallback;

  return {
    ...fallback,
    ...existing,
    characterPaths: state.agents.reduce<Record<string, CharacterPathState>>((acc, agent) => {
      acc[agent.id] =
        existing.characterPaths?.[agent.id] ??
        initialCharacterPath(agent.id, existing.boardPositions?.[agent.id] ?? fallback.boardPositions[agent.id] ?? 0);
      return acc;
    }, {}),
    roomState: existing.roomState ?? fallback.roomState,
    societyState: existing.societyState ?? fallback.societyState,
    sourceContact: existing.sourceContact ?? [],
    artifactsUsed: existing.artifactsUsed ?? [],
  };
}

export function landingPosition(fromPosition: number, rollTotal: number, spaces: StorySpace[]): number {
  return (fromPosition + rollTotal) % spaces.length;
}

export function possibleLandingSpaces(state: RunState, spaces: StorySpace[]): BoardSpacePreview[] {
  const boardTurn = normalizeBoardTurnState(state);
  const currentPosition = boardTurn.boardPositions[boardTurn.currentAgentId] ?? 0;

  return Array.from({ length: 11 }, (_, index) => {
    const rollTotal = index + 2;
    const position = landingPosition(currentPosition, rollTotal, spaces);
    const space = spaces[position];
    const visibility = space?.modeVisibility[state.mode] ?? "hint";
    const label = visibility === "hidden" ? "Unknown space" : space?.title;
    const detail =
      visibility === "hidden"
        ? space?.mysteryText
        : visibility === "hint"
          ? space?.shortMeaning
          : space?.experimentalText;

    return space
      ? {
          rollTotal,
          landingPosition: position,
          space,
          visibility,
          label,
          detail,
        }
      : undefined;
  }).filter((preview): preview is BoardSpacePreview => Boolean(preview));
}

export function nestedSimulationProgress(state: RunState): NestedSimulationProgress {
  const boardTurn = normalizeBoardTurnState(state);
  const landedAgentIds = new Set(boardTurn.landings.map((landing) => landing.agentId));
  const sourceDocuments = new Set([
    ...boardTurn.landings.map((landing) => landing.sourceFile),
    ...(state.storyObjectUses ?? []).map((use) => use.sourceFile),
    ...boardTurn.sourceContact,
  ]);
  const interventionPoints = boardTurn.landings.filter((landing) => landing.revealedOutcome === "Intervention Point").length;
  const rippleEvents = boardTurn.landings.filter((landing) => landing.revealedOutcome === "Ripple Event").length;
  const artifactsUsed = boardTurn.artifactsUsed.length;
  const branchProgress = Object.values(boardTurn.characterPaths).filter(
    (path) => path.interventionCount + path.rippleCount + path.missedInterventionCount >= 2,
  ).length;
  const simulationSeedGenerated = interventionPoints >= 3 && rippleEvents >= 3 && artifactsUsed >= 2 && branchProgress >= 3;

  const remaining: string[] = [];
  if (boardTurn.currentRound - 1 < 2) remaining.push("complete 2 rounds");
  if (landedAgentIds.size < state.agents.length) remaining.push("each character lands on a Story Space");
  if (interventionPoints < 3) remaining.push("record 3 intervention points");
  if (rippleEvents < 3) remaining.push("record 3 ripple events");
  if (artifactsUsed < 2) remaining.push("use 2 artifacts");
  if (sourceDocuments.size < 3) remaining.push("touch 3 source documents");
  if (branchProgress < 3) remaining.push("advance 3 character branches");
  if (!state.exportedRun) remaining.push("export the run log");
  if (!simulationSeedGenerated) remaining.push("generate coherent nested-simulation progress");

  return {
    completedRounds: Math.max(0, boardTurn.currentRound - 1),
    roundGoal: 2,
    charactersLanded: landedAgentIds.size,
    characterGoal: state.agents.length,
    lawsFormed: state.laws.length,
    lawGoal: 2,
    sourceDocumentsUsed: sourceDocuments.size,
    sourceGoal: 3,
    exportedRun: Boolean(state.exportedRun),
    simulationSeedGenerated,
    unlocked: remaining.length === 0,
    remaining,
  };
}

function createRoundSummary(state: RunState, completedRound: number, newLaws: LawState[]): RoundSummary {
  const boardTurn = normalizeBoardTurnState(state);
  const roundLandings = boardTurn.landings.filter((landing) => landing.round === completedRound);
  const combinedEffects = roundLandings.reduce<PressureValues>(
    (acc, landing) => addPressure(acc, landing.meterEffects),
    emptyPressure,
  );
  const strongest = dominantPressure(combinedEffects);

  return {
    round: completedRound,
    landedSpaces: roundLandings.map((landing) => landing.spaceTitle),
    charactersMoved: roundLandings.map((landing) => landing.agentName),
    strongestMeterChange: `${pressureLabel(strongest)} carried the strongest round pressure.`,
    lawsFormed: newLaws,
    societyEffect:
      roundLandings.length > 0
        ? `Round ${completedRound} turned alternate landings into ${pressureLabel(strongest).toLowerCase()} pressure.`
        : `Round ${completedRound} ended without board landings.`,
    nestedSimulationProgress: nestedSimulationProgress(state),
  };
}

export function resolveBoardTurn(
  state: RunState,
  spaces: StorySpace[],
  rules: RulesData,
  suppliedRoll?: DiceRoll,
): RunState {
  const boardTurn = normalizeBoardTurnState(state);
  const agent = state.agents[boardTurn.currentAgentIndex] ?? state.agents[0];
  const fromPosition = boardTurn.boardPositions[agent.id] ?? 0;
  const firstRoll = suppliedRoll ?? rollDice();
  const roughPosition = landingPosition(fromPosition, firstRoll.total, spaces);
  const space = spaces[roughPosition];
  const dice = normalizeSuppliedRoll(suppliedRoll, space) ?? rollDice(undefined, space.artifactHooks ?? []);
  const toPosition = landingPosition(fromPosition, dice.total, spaces);
  const landingSpace = spaces[toPosition];
  const nextTurn = state.turn + 1;
  const revealedOutcome = dice.artifact.modifiedRealityOutcome ?? dice.realityOutcome;
  const reading = readingFor(agent, landingSpace, revealedOutcome);
  const roomResponse = roomResponseFor(landingSpace, revealedOutcome);
  const societyResponse = societyResponseFor(landingSpace, revealedOutcome, dice.artifact.artifactName);
  const meterEffects = effectsForOutcome(landingSpace, revealedOutcome);
  const agentPressure = scalePressure(meterEffects, revealedOutcome === "Missed Intervention Point" ? 0.75 : 0.55);
  const pressureDelta = addPressure(meterEffects, agentPressure);
  const previousPath = boardTurn.characterPaths[agent.id] ?? initialCharacterPath(agent.id, fromPosition);
  const characterPath = updateCharacterPath(previousPath, toPosition, landingSpace, revealedOutcome, dice.artifact.artifactName);
  const branchText = branchTextFor(agent.name, landingSpace, revealedOutcome);

  const agents = state.agents.map((entry) =>
    entry.id === agent.id
      ? {
          ...entry,
          pressure: addPressure(entry.pressure, agentPressure),
          lastReaction: reading,
        }
      : entry,
  );

  const partialState: RunState = {
    ...state,
    turn: nextTurn,
    agents,
    pressures: addPressure(state.pressures, pressureDelta),
    actionsTaken: [
      ...state.actionsTaken,
      { turn: nextTurn, action: "dice-space", label: `${revealedOutcome}: ${landingSpace.title}` },
    ],
  };
  const newLaws = checkLaws(partialState, rules, nextTurn);
  const withLaws: RunState = { ...partialState, laws: [...state.laws, ...newLaws] };
  const interpretation = {
    turn: nextTurn,
    action: "dice-space" as const,
    stage: "opens" as const,
    roomInterpretation: `${agent.name} landed on ${landingSpace.title}. ${textForOutcome(landingSpace, revealedOutcome)}`,
    storyObjectId: landingSpace.id,
    targetCharacterId: agent.id,
  };
  const use: StoryObjectUse = {
    turn: nextTurn,
    objectId: landingSpace.id,
    objectName: landingSpace.title,
    objectType: "board-space",
    sourceFile: landingSpace.sourceFile,
    target: "character",
    targetCharacterId: agent.id,
    targetName: agent.name,
    plainLanguageMeaning: landingSpace.plainMeaning,
    resultingInterpretation: reading,
  };
  const landing: BoardLanding = {
    turn: nextTurn,
    round: boardTurn.currentRound,
    agentId: agent.id,
    agentName: agent.name,
    fromPosition,
    toPosition,
    dice,
    movementText: `${dice.dieA} + ${dice.dieB} = ${dice.total}`,
    spaceId: landingSpace.id,
    spaceTitle: landingSpace.title,
    alternateId: landingSpace.alternateId,
    alternateTitle: landingSpace.alternateTitle,
    mirrorsChapter: landingSpace.mirrorsChapter,
    spaceIndex: landingSpace.spaceIndex,
    sourceFile: landingSpace.sourceFile,
    sourceTitle: landingSpace.sourceTitle,
    sourceLinks: landingSpace.sourceLinks,
    plainMeaning: landingSpace.plainMeaning,
    realityOutcome: dice.realityOutcome,
    revealedOutcome,
    interventionText: landingSpace.interventionText ?? landingSpace.plainMeaning,
    missedText: landingSpace.missedText ?? landingSpace.plainMeaning,
    rippleText: landingSpace.rippleText ?? landingSpace.plainMeaning,
    characterReading: reading,
    roomResponse,
    societyResponse,
    resultText: resultTextFor(revealedOutcome, agent.name),
    artifactName: dice.artifact.artifactName,
    artifactEffect: dice.artifact.effectText,
    branchText,
    characterPath,
    meterEffects,
    affectedLayers: affectedLayers(landingSpace),
    lawsFormed: newLaws,
  };
  const completedTurns = [...boardTurn.completedTurns, agent.id];
  const roundComplete = completedTurns.length >= state.agents.length;
  const nextAgentIndex = roundComplete ? 0 : (boardTurn.currentAgentIndex + 1) % state.agents.length;
  const sourceContact = Array.from(new Set([...boardTurn.sourceContact, landingSpace.sourceFile]));
  const artifactsUsed =
    dice.artifact.artifactName === "No Artifact"
      ? boardTurn.artifactsUsed
      : Array.from(new Set([...boardTurn.artifactsUsed, dice.artifact.artifactName]));
  const boardWithLanding: BoardTurnState = {
    ...boardTurn,
    currentTurn: boardTurn.currentTurn + 1,
    currentRound: roundComplete ? boardTurn.currentRound + 1 : boardTurn.currentRound,
    currentAgentId: state.agents[nextAgentIndex]?.id ?? agent.id,
    currentAgentIndex: nextAgentIndex,
    hasRolledThisTurn: false,
    lastDiceRoll: dice,
    lastLandingSpaceId: landingSpace.id,
    boardPositions: { ...boardTurn.boardPositions, [agent.id]: toPosition },
    characterPaths: { ...boardTurn.characterPaths, [agent.id]: characterPath },
    roomState: roomResponse,
    societyState: societyResponse,
    sourceContact,
    artifactsUsed,
    completedTurns: roundComplete ? [] : completedTurns,
    landings: [...boardTurn.landings, landing],
  };

  const withInterpretation: RunState = {
    ...withLaws,
    interpretationHistory: [...(state.interpretationHistory ?? []), interpretation],
    storyObjectUses: [...(state.storyObjectUses ?? []), use],
    boardTurn: boardWithLanding,
  };
  const metrics = calculateRealityMetrics(withInterpretation);
  const meterHistory = appendMetricSnapshot(state.meterHistory ?? [], metrics);
  const layers = {
    base: [
      ...state.layers.base.slice(-4),
      `Turn ${nextTurn}: ${agent.name} rolled ${landing.movementText} and landed on ${landingSpace.title}.`,
    ],
    perceived: [...state.layers.perceived.slice(-4), reading],
    social: [...state.layers.social.slice(-4), societyResponse],
    institutional: [
      ...state.layers.institutional.filter((entry) => entry !== "No law has formed.").slice(-3),
      `${revealedOutcome}: ${landingSpace.title} changed the board record.`,
      ...withInterpretation.laws.map((law) => `${law.name}: ${law.description}`),
    ].slice(-5),
  };
  let nextState: RunState = {
    ...withInterpretation,
    meterHistory,
    layers,
  };

  if (roundComplete) {
    const summary = createRoundSummary(nextState, boardTurn.currentRound, newLaws);
    nextState = {
      ...nextState,
      boardTurn: {
        ...nextState.boardTurn,
        roundSummaries: [...nextState.boardTurn.roundSummaries, summary],
      },
    };
  }

  const roundSummary = roundComplete ? nextState.boardTurn.roundSummaries.slice(-1)[0] : undefined;
  const eventTexts = [
    {
      type: "base" as const,
      text: `${agent.name} rolled ${landing.movementText}; reality die ${dice.realityDie} rendered ${dice.realityOutcome}; artifact die ${dice.artifactDie} rendered ${dice.artifact.artifactName}.`,
    },
    { type: "social" as const, text: `${agent.name} lands on ${landingSpace.title}: ${textForOutcome(landingSpace, revealedOutcome)}` },
    { type: "agent" as const, text: branchText },
    { type: "institutional" as const, text: societyResponse },
    ...(roundSummary ? [{ type: "social" as const, text: `Round ${roundSummary.round} ended. ${roundSummary.societyEffect}` }] : []),
    ...newLaws.map((law) => ({
      type: "law" as const,
      text: `${law.name} formed: ${law.description}`,
    })),
  ];
  const events = [
    ...state.events,
    ...eventTexts.map((entry, index) => createEvent(nextTurn, entry.type, entry.text, state.events.length + index)),
  ];

  return {
    ...nextState,
    events,
    lastTurnFeedback: {
      turn: nextTurn,
      processedAction: `${revealedOutcome}: ${landingSpace.title}`,
      pressureChanges: pressureChanges(state.pressures, nextState.pressures),
      agentReactionCount: 1,
      agentReactions: [reading],
      baseEvent: `${agent.name} rolled ${landing.movementText}.`,
      perceivedReality: reading,
      socialReality: societyResponse,
      institutionalPressure: roomResponse,
      lawProgress: lawProgressMessages(nextState, rules),
      formedLaws: newLaws,
      metrics,
      interpretation,
      storyObjectUse: use,
    },
  };
}
