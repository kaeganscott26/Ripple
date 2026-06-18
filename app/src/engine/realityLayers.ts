import type { BoulderAction, RealityLayers, RunState } from "./types";
import { calculateRealityMetrics } from "./realityMetrics";

export function createInitialLayers(): RealityLayers {
  return {
    base: ["The Boulder rests in the center of the room."],
    perceived: ["The agents notice the room has a weight before it has an explanation."],
    social: ["No shared account has stabilized."],
    institutional: ["No law has formed."],
  };
}

export function summarizeLayerShift(state: RunState, action: BoulderAction): RealityLayers {
  const named = state.boulderName ?? "the Boulder";
  const metrics = calculateRealityMetrics(state);
  const latestInterpretation = state.interpretationHistory.slice(-1)[0];
  const baseByAction: Record<BoulderAction, string> = {
    observe: `Turn ${state.turn}: The Boulder was observed in place.`,
    name: `Turn ${state.turn}: The Boulder was named "${named}".`,
    move: `Turn ${state.turn}: ${named} was moved from the center path.`,
    ignore: `Turn ${state.turn}: ${named} was left unaddressed.`,
  };

  const perceivedByAction: Record<BoulderAction, string> = {
    observe: `Attention makes the object harder to treat as background. Mood: ${metrics.label}.`,
    name: `The name gives agents a handle they can repeat, resist, or formalize. Meaning ${metrics.meaning}/100.`,
    move: `The changed path makes consequence visible. Agency ${metrics.agency}/100.`,
    ignore: `The ignored weight becomes pressure some agents read as avoidance. Safety ${metrics.safety}/100.`,
  };

  const socialByAction: Record<BoulderAction, string> = {
    observe: latestInterpretation?.roomInterpretation ?? "Agents begin comparing what they saw.",
    name: latestInterpretation?.roomInterpretation ?? "The name starts circulating as shared shorthand.",
    move: latestInterpretation?.roomInterpretation ?? "The room debates what the changed path proves.",
    ignore: latestInterpretation?.roomInterpretation ?? "Silence around the object becomes part of the room's behavior.",
  };

  const institutional =
    state.laws.length > 0
      ? state.laws.map((law) => `${law.name}: ${law.description}`)
      : ["No law has formed."];

  return {
    base: [...state.layers.base.slice(-4), baseByAction[action]],
    perceived: [...state.layers.perceived.slice(-4), perceivedByAction[action]],
    social: [...state.layers.social.slice(-4), socialByAction[action]],
    institutional,
  };
}
