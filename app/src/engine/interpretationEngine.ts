import type {
  BoulderAction,
  InterpretationEntry,
  ObserverInputClassification,
  ObserverInputType,
  RunState,
} from "./types";

const classificationFocus: Record<ObserverInputType, string> = {
  "Artifact Name": "handle",
  "Crisis Label": "crisis",
  "Policy Proposal": "policy",
  Doctrine: "doctrine",
  "Era Marker": "era",
  "Myth Seed": "myth",
};

const classificationProgression: Record<ObserverInputType, string[]> = {
  "Artifact Name": [
    "The room tests whether this name is just a label or a handle people will keep using.",
    "The debate narrows around whether the name makes the Boulder easier to repeat.",
    "The room starts treating the name as shared shorthand.",
    "The earlier name becomes part of the room's memory.",
  ],
  "Crisis Label": [
    "The room debates whether the name identifies a threat, a warning, or a scapegoat.",
    "The debate narrows around urgency and response.",
    "The room starts treating the label as a pressure it must answer.",
    "The earlier crisis label becomes part of how the room remembers risk.",
  ],
  "Policy Proposal": [
    "The room debates whether the proposal creates safety, control, or enforcement.",
    "The debate narrows around who has authority to make the proposal real.",
    "The room starts treating the proposal as a possible rule.",
    "The earlier proposal becomes part of the room's institutional memory.",
  ],
  Doctrine: [
    "The room debates belief, obedience, and principle.",
    "The debate narrows around whether the sentence should guide behavior.",
    "The room starts treating the doctrine as a principle people can cite.",
    "The earlier doctrine becomes part of the room's memory of what must be obeyed.",
  ],
  "Era Marker": [
    "The room debates whether the phrase marks a new period.",
    "The debate narrows around what changed before and after this marker.",
    "The room starts treating the marker as a boundary in time.",
    "The earlier era marker becomes part of how the room remembers change.",
  ],
  "Myth Seed": [
    "The room debates whether the name marks an origin, an explanation, or a myth.",
    "The debate narrows around what began here and what caused it.",
    "The room starts treating the origin story as a way to explain later events.",
    "The earlier myth seed becomes part of what the room may pass down.",
  ],
};

const actionProgression: Record<BoulderAction, string[]> = {
  observe: [
    "Attention gathers, and the room begins deciding whether the event matters.",
    "The earlier attention starts to make the Boulder harder to ignore.",
    "The room treats repeated observation as evidence.",
    "The observation becomes part of the room's memory.",
  ],
  name: classificationProgression["Artifact Name"],
  move: [
    "The room debates whether the changed path is repair, risk, or proof.",
    "The debate begins to narrow around what the changed path proves.",
    "The room treats the shift as structure, not just motion.",
    "The earlier shift becomes part of the room's memory.",
  ],
  ignore: [
    "The room notices that the Boulder was left unaddressed.",
    "The silence starts to feel like a choice.",
    "The room treats avoidance as part of the event.",
    "The earlier silence becomes part of the room's memory.",
  ],
};

function stageFor(index: number): InterpretationEntry["stage"] {
  if (index <= 0) return "opens";
  if (index === 1) return "narrows";
  if (index === 2) return "stabilizes";
  return "enters-memory";
}

function progressionIndex(state: RunState, action: BoulderAction, observerInput?: ObserverInputClassification): number {
  if (observerInput) {
    const focus = classificationFocus[observerInput.classification];
    return state.interpretationHistory.filter((entry) =>
      entry.observerClassification ? classificationFocus[entry.observerClassification] === focus : entry.action === action,
    ).length;
  }

  return state.interpretationHistory.filter((entry) => entry.action === action && !entry.observerClassification).length;
}

export function createTurnInterpretation(
  state: RunState,
  action: BoulderAction,
  turn: number,
  observerInput?: ObserverInputClassification,
): InterpretationEntry {
  const index = progressionIndex(state, action, observerInput);
  const lines = observerInput ? classificationProgression[observerInput.classification] : actionProgression[action];
  const roomInterpretation = lines[Math.min(index, lines.length - 1)];

  return {
    turn,
    action,
    observerText: observerInput?.text,
    observerClassification: observerInput?.classification,
    stage: stageFor(index),
    roomInterpretation,
  };
}
