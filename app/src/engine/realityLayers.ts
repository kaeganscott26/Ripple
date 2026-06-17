import type { BoulderAction, RealityLayers, RunState } from "./types";

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
  const baseByAction: Record<BoulderAction, string> = {
    observe: `Turn ${state.turn}: The Boulder was observed in place.`,
    name: `Turn ${state.turn}: The Boulder was named "${named}".`,
    move: `Turn ${state.turn}: ${named} was moved from the center path.`,
    ignore: `Turn ${state.turn}: ${named} was left unaddressed.`,
  };

  const perceivedByAction: Record<BoulderAction, string> = {
    observe: "Attention makes the object harder for agents to treat as background.",
    name: "The name gives agents a handle they can repeat, resist, or formalize.",
    move: "The changed path makes the object's consequence visible.",
    ignore: "The ignored weight becomes a pressure some agents read as avoidance.",
  };

  const socialByAction: Record<BoulderAction, string> = {
    observe: "Agents begin comparing what they saw.",
    name: "The name starts circulating as shared shorthand.",
    move: "The room debates whether the shift was repair, trespass, or proof.",
    ignore: "Silence around the object becomes part of the room's behavior.",
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
