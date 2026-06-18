import type {
  ActiveAgent,
  EventEntry,
  EventType,
  LawState,
  LayerCard,
  PressureValues,
  RulesData,
  RunState,
  StoryBoulder,
  StoryObjectUse,
} from "./types";
import { lawProgressMessages } from "./lawProgress";
import { pressureChanges } from "./pressure";
import { appendMetricSnapshot, calculateRealityMetrics } from "./realityMetrics";

const emptyPressure: PressureValues = { witness: 0, namedWeight: 0, institution: 0, concern: 0 };

function clampPressure(value: number): number {
  return Math.max(0, value);
}

function addDelta(a: PressureValues, b: PressureValues): PressureValues {
  return {
    witness: a.witness + b.witness,
    namedWeight: a.namedWeight + b.namedWeight,
    institution: a.institution + b.institution,
    concern: a.concern + b.concern,
  };
}

function applyPressure(a: PressureValues, b: PressureValues): PressureValues {
  return {
    witness: clampPressure(a.witness + b.witness),
    namedWeight: clampPressure(a.namedWeight + b.namedWeight),
    institution: clampPressure(a.institution + b.institution),
    concern: clampPressure(a.concern + b.concern),
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

function relatedLayerNames(boulder: StoryBoulder, cards: LayerCard[]): string {
  const names = boulder.relatedLayers
    .map((id) => cards.find((card) => card.id === id)?.name ?? id)
    .slice(0, 3);

  return names.length > 0 ? names.join(", ") : "the active reality layers";
}

function reactionForAgent(
  agent: ActiveAgent,
  boulder: StoryBoulder,
  targetAgent?: ActiveAgent,
): { text: string; pressure: PressureValues; targeted: boolean } {
  const seed = agent.seeds[agent.activeSeed];
  const isTarget = targetAgent?.id === agent.id;
  const directStoryFit = boulder.relatedCharacters.includes(agent.id);
  const tagMatch = boulder.triggerTags.some((tag) => seed.triggerTags.includes(tag));
  const multiplier = isTarget ? (directStoryFit ? 1.35 : 1.05) : directStoryFit || tagMatch ? 0.55 : 0.25;
  const pressure = addDelta(emptyPressure, scalePressure(boulder.pressureProfile, multiplier));
  const directCopy = boulder.targetFit[agent.id];

  if (isTarget && directCopy) {
    return {
      pressure,
      targeted: true,
      text: `${agent.name} (${seed.label}) receives ${boulder.name}. ${directCopy}`,
    };
  }

  if (isTarget) {
    return {
      pressure,
      targeted: true,
      text: `${agent.name} (${seed.label}) receives ${boulder.name} as a mismatched weight and tests it against ${seed.compactMemory}`,
    };
  }

  if (directStoryFit || tagMatch) {
    return {
      pressure,
      targeted: false,
      text: `${agent.name} (${seed.label}) reacts from the edge because ${boulder.name} touches ${seed.distortion.toLowerCase()}`,
    };
  }

  return {
    pressure,
    targeted: false,
    text: `${agent.name} (${seed.label}) notices ${boulder.name} but does not treat it as their main weight yet.`,
  };
}

function layerShift(
  state: RunState,
  boulder: StoryBoulder,
  cards: LayerCard[],
  use: StoryObjectUse,
  perceived: string,
  social: string,
  institutional: string,
) {
  const targetText = use.targetName ? ` to ${use.targetName}` : " to the room";
  const base = `Turn ${state.turn}: ${boulder.name} was introduced${targetText}.`;

  return {
    base: [...state.layers.base.slice(-4), base],
    perceived: [...state.layers.perceived.slice(-4), perceived],
    social: [...state.layers.social.slice(-4), social],
    institutional: [
      ...state.layers.institutional.filter((entry) => entry !== "No law has formed.").slice(-3),
      institutional,
      ...state.laws.map((law) => `${law.name}: ${law.description}`),
    ].slice(-5),
  };
}

export function introduceStoryBoulder(
  state: RunState,
  boulder: StoryBoulder,
  cards: LayerCard[],
  rules: RulesData,
  targetAgentId?: string,
): RunState {
  const nextTurn = state.turn + 1;
  const targetAgent = state.agents.find((agent) => agent.id === targetAgentId);
  const targetName = targetAgent?.name;
  let pressureDelta = addDelta(emptyPressure, boulder.pressureProfile);
  const agentEvents: string[] = [];

  const agents = state.agents.map((agent) => {
    const reaction = reactionForAgent(agent, boulder, targetAgent);
    pressureDelta = addDelta(pressureDelta, reaction.pressure);
    agentEvents.push(reaction.text);

    return {
      ...agent,
      pressure: applyPressure(agent.pressure, reaction.pressure),
      lastReaction: reaction.text,
    };
  });

  const partialState: RunState = {
    ...state,
    turn: nextTurn,
    agents,
    pressures: applyPressure(state.pressures, pressureDelta),
    actionsTaken: [
      ...state.actionsTaken,
      { turn: nextTurn, action: "introduce-story-boulder", label: `Introduce ${boulder.name}` },
    ],
  };
  const newLaws = checkLaws(partialState, rules, nextTurn);
  const withLaws = { ...partialState, laws: [...state.laws, ...newLaws] };
  const selectedInterpretation = boulder.possibleInterpretations[(nextTurn - 1) % boulder.possibleInterpretations.length];
  const targetPhrase = targetName ? `${targetName}'s room` : "the room";
  const perceived = targetAgent
    ? `${targetName} reads ${boulder.name} through ${targetAgent.seeds[targetAgent.activeSeed].label}: ${boulder.plainLanguageMeaning}`
    : `The room reads ${boulder.name} as shared weight: ${boulder.plainLanguageMeaning}`;
  const social = `${selectedInterpretation} Related layer cards: ${relatedLayerNames(boulder, cards)}.`;
  const institutional =
    boulder.pressureProfile.institution > 0
      ? `${boulder.name} starts pushing ${targetPhrase} toward rule, record, or procedure.`
      : `${boulder.name} stays mostly interpretive for now; no new institution is required to understand it.`;
  const interpretation = {
    turn: nextTurn,
    action: "introduce-story-boulder" as const,
    stage: "opens" as const,
    roomInterpretation: social,
    storyObjectId: boulder.id,
    targetCharacterId: targetAgent?.id,
  };
  const use: StoryObjectUse = {
    turn: nextTurn,
    objectId: boulder.id,
    objectName: boulder.name,
    objectType: "story-boulder",
    sourceFile: boulder.sourceFile,
    target: targetAgent ? "character" : "room",
    targetCharacterId: targetAgent?.id,
    targetName,
    plainLanguageMeaning: boulder.plainLanguageMeaning,
    resultingInterpretation: social,
  };
  const withInterpretation: RunState = {
    ...withLaws,
    interpretationHistory: [...state.interpretationHistory, interpretation],
    storyObjectUses: [...(state.storyObjectUses ?? []), use],
  };
  const metrics = calculateRealityMetrics(withInterpretation);
  const meterHistory = appendMetricSnapshot(state.meterHistory ?? [], metrics);
  const layers = layerShift(withInterpretation, boulder, cards, use, perceived, social, institutional);
  const baseEvent = targetName
    ? `The Observer introduces ${boulder.name} to ${targetName}.`
    : `The Observer introduces ${boulder.name} to the room.`;

  const eventTexts = [
    { type: "base" as const, text: baseEvent },
    { type: "social" as const, text: social },
    { type: "institutional" as const, text: institutional },
    ...agentEvents.map((text) => ({ type: "agent" as const, text })),
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
    ...withInterpretation,
    meterHistory,
    layers,
    events,
    lastTurnFeedback: {
      turn: nextTurn,
      processedAction: `Introduce ${boulder.name}`,
      pressureChanges: pressureChanges(state.pressures, withInterpretation.pressures),
      agentReactionCount: agentEvents.length,
      agentReactions: agentEvents,
      baseEvent,
      perceivedReality: perceived,
      socialReality: social,
      institutionalPressure: institutional,
      lawProgress: lawProgressMessages(withInterpretation, rules),
      formedLaws: newLaws,
      metrics,
      interpretation,
      storyObjectUse: use,
    },
  };
}
