import type { HaloState, PressureValues, RealityMetricSnapshot, RunState } from "./types";

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function pressureTotal(pressures: PressureValues): number {
  return pressures.witness + pressures.namedWeight + pressures.institution + pressures.concern;
}

export function calculateRealityMetrics(state: Pick<RunState, "turn" | "pressures" | "laws" | "observerInputs">): RealityMetricSnapshot {
  const { witness, namedWeight, institution, concern } = state.pressures;
  const lawCount = state.laws.length;
  const observerInputCount = state.observerInputs.length;
  const total = pressureTotal(state.pressures);

  const safety = clamp(78 - concern * 5 - institution * 2 + lawCount * 8);
  const agency = clamp(62 + witness * 2 - institution * 3 - concern * 2);
  const trust = clamp(54 + lawCount * 9 + witness - concern * 4);
  const meaning = clamp(36 + namedWeight * 4 + witness * 2 + observerInputCount * 5);
  const pressureLoad = clamp(total * 4 + institution * 2 + concern * 2);
  const rufs = clamp(witness * 5 + namedWeight * 6 + institution * 7 + concern * 5 + lawCount * 9 + observerInputCount * 4);
  const mood = clamp((safety + agency + trust + meaning) / 4 - pressureLoad * 0.18 + lawCount * 5);

  return {
    turn: state.turn,
    pressures: state.pressures,
    rufs,
    mood,
    happiness: mood,
    safety,
    agency,
    trust,
    meaning,
    pressureLoad,
    label: labelMood(mood),
  };
}

export function appendMetricSnapshot(history: RealityMetricSnapshot[], snapshot: RealityMetricSnapshot): RealityMetricSnapshot[] {
  return [...history, snapshot].slice(-8);
}

export function deriveHaloState(agentPressure: PressureValues): HaloState {
  const total = pressureTotal(agentPressure);
  const socialInfluence = agentPressure.namedWeight + agentPressure.institution;

  if (agentPressure.concern >= 6 && total >= 8) return "clipped";
  if (socialInfluence >= 6 && total >= 8) return "double";
  if (total >= 8) return "pulsing";
  if (total > 0) return "bright";
  return "dim";
}

export function haloLabel(state: HaloState): string {
  const labels: Record<HaloState, string> = {
    dim: "Low signal",
    bright: "Activated",
    pulsing: "Pressure rising",
    double: "Shaping social reality",
    clipped: "Perception overload",
  };

  return labels[state];
}

export function labelMood(mood: number): string {
  if (mood >= 70) return "Stable";
  if (mood >= 52) return "Charged";
  if (mood >= 36) return "Strained";
  return "Unsteady";
}

export interface SocietySummary {
  frameQuestion: string;
  dominantPressure: keyof PressureValues;
  dominantPressureLabel: string;
  localEffect: string;
  socialEffect: string;
  institutionalEffect: string;
  observerEffect: string;
  nestedStatus: string;
}

export function buildSocietySummary(state: RunState): SocietySummary {
  const pressureEntries: Array<[keyof PressureValues, number, string]> = [
    ["witness", state.pressures.witness, "Witness"],
    ["namedWeight", state.pressures.namedWeight, "Named Weight"],
    ["institution", state.pressures.institution, "Institutional"],
    ["concern", state.pressures.concern, "Concern"],
  ];
  const [dominantPressure, dominantValue, dominantPressureLabel] = pressureEntries.reduce((highest, entry) =>
    entry[1] > highest[1] ? entry : highest,
  );
  const latestObserver = state.observerInputs.slice(-1)[0];
  const metrics = state.meterHistory.slice(-1)[0] ?? calculateRealityMetrics(state);

  return {
    frameQuestion: "What is this room doing to the larger frame?",
    dominantPressure,
    dominantPressureLabel,
    localEffect: dominantValue > 0 ? `${dominantPressureLabel} is carrying the room outward.` : "The room has not pushed outward yet.",
    socialEffect:
      state.layers.social.slice(-1)[0] ??
      "No shared account has stabilized.",
    institutionalEffect:
      state.laws.length > 0
        ? `${state.laws.length} law signal is active.`
        : "Institutional reality is watching pressure thresholds.",
    observerEffect: latestObserver
      ? `${latestObserver.classification} entered the society frame.`
      : "No Observer Input has entered the wider frame yet.",
    nestedStatus: metrics.rufs >= 70 ? "Inner Board: pressure visible, mechanics locked" : "Inner Board: not yet rendered",
  };
}
