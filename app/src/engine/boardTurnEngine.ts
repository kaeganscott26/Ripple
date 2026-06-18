import type {
  ActiveAgent,
  BoardLanding,
  BoardSpacePreview,
  BoardTurnState,
  DiceRoll,
  EventEntry,
  EventType,
  LawState,
  NestedSimulationProgress,
  PressureValues,
  RoundSummary,
  RulesData,
  RunState,
  StoryObjectUse,
  StorySpace,
} from "./types";
import { lawProgressMessages } from "./lawProgress";
import { pressureChanges } from "./pressure";
import { appendMetricSnapshot, calculateRealityMetrics } from "./realityMetrics";

const boardLength = 12;
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

function fallbackReading(agent: ActiveAgent, space: StorySpace): string {
  const seed = agent.seeds[agent.activeSeed];
  const lens = seed.label.toLowerCase();

  if (agent.id === "mara") return `Mara reads ${space.title} as witness pressure: silence can start to look like agreement.`;
  if (agent.id === "jamal") return `Jamal reads ${space.title} as form taking shape before the room has finished telling the truth.`;
  if (agent.id === "maren") return `Maren reads ${space.title} as mood pressure and asks whether the room is staying calm by hiding what changed.`;
  if (agent.id === "dev") return `Dev reads ${space.title} as access pressure: the path may be visible while the choice is still unavailable.`;
  if (agent.id === "teodor-scott") return `Teodor / Scott reads ${space.title} as a design problem the room has to make visible.`;

  return `${agent.name} reads ${space.title} through ${lens}: ${space.shortMeaning}`;
}

function readingFor(agent: ActiveAgent, space: StorySpace): string {
  return space.characterReadings[agent.id] ?? fallbackReading(agent, space);
}

function roomResponseFor(space: StorySpace, agent: ActiveAgent): string {
  if (space.type === "simulation") {
    return "The room checks whether memory, source, law, and export are strong enough to build the next room.";
  }
  if (space.type === "boundary") {
    return `The room asks whether ${agent.name}'s boundary is protection, rejection, or intervention.`;
  }
  if (space.type === "law") {
    return "The room watches language for the moment it starts becoming rule, record, or procedure.";
  }
  if (space.type === "spectacle") {
    return "The room checks whether the loudest version is hiding the truest one.";
  }
  return `The room lets ${space.title} enter as source pressure and watches what changes.`;
}

function affectedLayers(space: StorySpace): string[] {
  return space.relatedLayerIds.length > 0 ? space.relatedLayerIds : [space.type];
}

export function rollDice(random: () => number = Math.random): DiceRoll {
  const dieA = Math.floor(random() * 6) + 1;
  const dieB = Math.floor(random() * 6) + 1;

  return { dieA, dieB, total: dieA + dieB };
}

export function createInitialBoardTurnState(agents: ActiveAgent[]): BoardTurnState {
  const boardPositions = agents.reduce<Record<string, number>>((acc, agent, index) => {
    acc[agent.id] = index % boardLength;
    return acc;
  }, {});

  return {
    currentRound: 1,
    currentTurn: 0,
    currentAgentId: agents[0]?.id ?? "",
    currentAgentIndex: 0,
    hasRolledThisTurn: false,
    boardPositions,
    completedTurns: [],
    landings: [],
    roundSummaries: [],
  };
}

export function normalizeBoardTurnState(state: RunState): BoardTurnState {
  if (state.boardTurn) return state.boardTurn;
  return createInitialBoardTurnState(state.agents);
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
    const preview = space
      ? {
          rollTotal,
          landingPosition: position,
          space,
          visibility,
          label,
          detail,
        }
      : undefined;

    return preview as BoardSpacePreview;
  }).filter(Boolean);
}

export function nestedSimulationProgress(state: RunState): NestedSimulationProgress {
  const boardTurn = normalizeBoardTurnState(state);
  const landedAgentIds = new Set(boardTurn.landings.map((landing) => landing.agentId));
  const sourceDocuments = new Set([
    ...boardTurn.landings.map((landing) => landing.sourceFile),
    ...(state.storyObjectUses ?? []).map((use) => use.sourceFile),
  ]);
  const simulationSeedGenerated =
    boardTurn.landings.some((landing) => landing.spaceId === "space-nested-simulation-gate") ||
    state.laws.length >= 2;

  const remaining: string[] = [];
  if (boardTurn.currentRound - 1 < 2) remaining.push("complete 2 rounds");
  if (landedAgentIds.size < state.agents.length) remaining.push("each character lands on a Story Space");
  if (state.laws.length < 2) remaining.push("form 2 laws");
  if (sourceDocuments.size < 3) remaining.push("use or read 3 source documents");
  if (!state.exportedRun) remaining.push("export the run log");
  if (!simulationSeedGenerated) remaining.push("generate a Simulation Seed");

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
        ? `Round ${completedRound} turned local landings into ${pressureLabel(strongest).toLowerCase()} pressure.`
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
  const dice = suppliedRoll ?? rollDice();
  const fromPosition = boardTurn.boardPositions[agent.id] ?? 0;
  const toPosition = landingPosition(fromPosition, dice.total, spaces);
  const space = spaces[toPosition];
  const nextTurn = state.turn + 1;
  const reading = readingFor(agent, space);
  const roomResponse = roomResponseFor(space, agent);
  const agentPressure = scalePressure(space.baseMeterEffects, 0.65);
  const pressureDelta = addPressure(space.baseMeterEffects, agentPressure);

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
    actionsTaken: [...state.actionsTaken, { turn: nextTurn, action: "dice-space", label: `Dice Space: ${space.title}` }],
  };
  const newLaws = checkLaws(partialState, rules, nextTurn);
  const withLaws: RunState = { ...partialState, laws: [...state.laws, ...newLaws] };
  const interpretation = {
    turn: nextTurn,
    action: "dice-space" as const,
    stage: "opens" as const,
    roomInterpretation: `${agent.name} landed on ${space.title}. ${roomResponse}`,
    storyObjectId: space.id,
    targetCharacterId: agent.id,
  };
  const use: StoryObjectUse = {
    turn: nextTurn,
    objectId: space.id,
    objectName: space.title,
    objectType: "board-space",
    sourceFile: space.sourceFile,
    target: "character",
    targetCharacterId: agent.id,
    targetName: agent.name,
    plainLanguageMeaning: space.plainMeaning,
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
    spaceId: space.id,
    spaceTitle: space.title,
    sourceFile: space.sourceFile,
    sourceTitle: space.sourceTitle,
    plainMeaning: space.plainMeaning,
    characterReading: reading,
    roomResponse,
    meterEffects: space.baseMeterEffects,
    affectedLayers: affectedLayers(space),
    lawsFormed: newLaws,
  };
  const completedTurns = [...boardTurn.completedTurns, agent.id];
  const roundComplete = completedTurns.length >= state.agents.length;
  const nextAgentIndex = roundComplete ? 0 : (boardTurn.currentAgentIndex + 1) % state.agents.length;
  const boardWithLanding: BoardTurnState = {
    ...boardTurn,
    currentTurn: boardTurn.currentTurn + 1,
    currentRound: roundComplete ? boardTurn.currentRound + 1 : boardTurn.currentRound,
    currentAgentId: state.agents[nextAgentIndex]?.id ?? agent.id,
    currentAgentIndex: nextAgentIndex,
    hasRolledThisTurn: false,
    lastDiceRoll: dice,
    lastLandingSpaceId: space.id,
    boardPositions: { ...boardTurn.boardPositions, [agent.id]: toPosition },
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
    base: [...state.layers.base.slice(-4), `Turn ${nextTurn}: ${agent.name} rolled ${dice.total} and landed on ${space.title}.`],
    perceived: [...state.layers.perceived.slice(-4), reading],
    social: [...state.layers.social.slice(-4), roomResponse],
    institutional: [
      ...state.layers.institutional.filter((entry) => entry !== "No law has formed.").slice(-3),
      space.baseMeterEffects.institution > 0
        ? `${space.title} pushed the room toward rule, record, or procedure.`
        : `${space.title} stayed interpretive for now.`,
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
    { type: "base" as const, text: `${agent.name} rolled ${dice.dieA} + ${dice.dieB} = ${dice.total} and landed on ${space.title}.` },
    { type: "social" as const, text: reading },
    { type: "institutional" as const, text: roomResponse },
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
      processedAction: `Dice Space: ${space.title}`,
      pressureChanges: pressureChanges(state.pressures, nextState.pressures),
      agentReactionCount: 1,
      agentReactions: [reading],
      baseEvent: `${agent.name} rolled ${dice.dieA} + ${dice.dieB} = ${dice.total}.`,
      perceivedReality: reading,
      socialReality: roomResponse,
      institutionalPressure:
        space.baseMeterEffects.institution > 0
          ? `${space.title} moved closer to rule, record, or procedure.`
          : `${space.title} changed interpretation before law.`,
      lawProgress: lawProgressMessages(nextState, rules),
      formedLaws: newLaws,
      metrics,
      interpretation,
      storyObjectUse: use,
    },
  };
}
