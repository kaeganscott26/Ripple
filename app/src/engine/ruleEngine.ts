import type {
  ActiveAgent,
  BoulderAction,
  EventEntry,
  EventType,
  LawState,
  PressureValues,
  RulesData,
  RunState,
} from "./types";
import { lawProgressMessages } from "./lawProgress";
import { pressureChanges } from "./pressure";
import { summarizeLayerShift } from "./realityLayers";

const emptyPressure: PressureValues = { witness: 0, namedWeight: 0, institution: 0, concern: 0 };

function addPressure(a: PressureValues, b: PressureValues): PressureValues {
  return {
    witness: a.witness + b.witness,
    namedWeight: a.namedWeight + b.namedWeight,
    institution: a.institution + b.institution,
    concern: a.concern + b.concern,
  };
}

function scalePressure(values: PressureValues, amount = 1): PressureValues {
  return {
    witness: values.witness * amount,
    namedWeight: values.namedWeight * amount,
    institution: values.institution * amount,
    concern: values.concern * amount,
  };
}

function actionTag(action: BoulderAction): string {
  if (action === "observe") return "observed";
  if (action === "name") return "named";
  if (action === "move") return "moved";
  return "ignored";
}

function createEvent(turn: number, type: EventType, text: string, index: number): EventEntry {
  return {
    id: `${turn}-${type}-${index}-${text.slice(0, 12)}`,
    turn,
    type,
    text,
  };
}

function reactionForAgent(
  agent: ActiveAgent,
  action: BoulderAction,
): { text: string; pressure: PressureValues; triggered: boolean } {
  const seed = agent.seeds[agent.activeSeed];
  const tag = actionTag(action);
  const triggered = seed.triggerTags.includes(tag);
  const pressure = triggered ? seed.reactionWeights : scalePressure(seed.reactionWeights, 0.5);

  const actionText: Record<BoulderAction, string> = {
    observe: "treats the attention as evidence that the weight matters",
    name: "tests the new name against what the room is becoming",
    move: "reads the changed path as consequence entering architecture",
    ignore: "notices the silence around the object",
  };

  return {
    pressure,
    triggered,
    text: `${agent.name} (${seed.label}) ${actionText[action]}.`,
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

export function advanceTurn(
  state: RunState,
  action: BoulderAction,
  rules: RulesData,
  options: { boulderName?: string } = {},
): RunState {
  const nextTurn = state.turn + 1;
  const actionRule = rules.actions[action];
  const proposedName = options.boulderName?.trim() || "Consequence";
  const boulderName = action === "name" ? proposedName : state.boulderName;
  const boulderPosition = action === "move" ? "shifted" : state.boulderPosition;

  let pressureDelta = addPressure(emptyPressure, actionRule.pressure);
  const agentEvents: string[] = [];
  let agentReactionCount = 0;

  const agents = state.agents.map((agent) => {
    const reaction = reactionForAgent(agent, action);
    pressureDelta = addPressure(pressureDelta, reaction.pressure);
    agentEvents.push(reaction.text);
    agentReactionCount += 1;

    return {
      ...agent,
      pressure: addPressure(agent.pressure, reaction.pressure),
      lastReaction: reaction.text,
    };
  });

  const actionAmplifier =
    action === "name" && state.actionsTaken.some((entry) => entry.action === "name")
      ? { witness: 0, namedWeight: 2, institution: 1, concern: 0 }
      : action === "observe" && state.actionsTaken.filter((entry) => entry.action === "observe").length >= 1
        ? { witness: 2, namedWeight: 0, institution: 0, concern: 1 }
        : action === "move" && state.pressures.concern >= 6
          ? { witness: 1, namedWeight: 0, institution: 2, concern: 1 }
          : emptyPressure;

  pressureDelta = addPressure(pressureDelta, actionAmplifier);

  const partialState: RunState = {
    ...state,
    turn: nextTurn,
    agents,
    pressures: addPressure(state.pressures, pressureDelta),
    actionsTaken: [...state.actionsTaken, { turn: nextTurn, action, label: actionRule.label }],
    boulderName,
    boulderPosition,
  };

  const newLaws = checkLaws(partialState, rules, nextTurn);
  const laws = [...state.laws, ...newLaws];
  const withLaws = { ...partialState, laws };
  const layers = summarizeLayerShift(withLaws, action);

  const baseEvent =
    action === "name" && boulderName
      ? `The Observer names the Boulder "${boulderName}".`
      : actionRule.baseEvent;

  const eventTexts = [
    { type: "base" as const, text: baseEvent },
    { type: "social" as const, text: actionRule.socialSignal },
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
    ...withLaws,
    layers,
    events,
    lastTurnFeedback: {
      turn: nextTurn,
      processedAction: actionRule.label,
      pressureChanges: pressureChanges(state.pressures, partialState.pressures),
      agentReactionCount,
      agentReactions: agentEvents,
      lawProgress: lawProgressMessages(withLaws, rules),
      formedLaws: newLaws,
    },
  };
}
