import { characterConfig, modeConfig } from "../data/gameConfig";
import { boardSpaces, realityLayerLabels } from "../data/liveBoard";
import type {
  ArtifactRecord,
  BoardSpaceConfig,
  FinalStoryResult,
  GlassPrompt,
  RippleGameState,
  ThreeDiceRoll,
} from "./gameTypes";

const rippleInfluences: Record<number, string> = {
  1: "echo",
  2: "fracture",
  3: "warning",
  4: "inversion",
  5: "date",
  6: "threshold",
};

export function influenceFor(die: number): string {
  return rippleInfluences[die] ?? "echo";
}

function hashText(value: string): number {
  return Array.from(value).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 2166136261);
}

export function buildRippleRiddlePrompt(
  state: Pick<RippleGameState, "characterId" | "modeId" | "turn">,
  space: BoardSpaceConfig,
  roll: ThreeDiceRoll,
): GlassPrompt {
  const character = characterConfig(state.characterId);
  const mode = modeConfig(state.modeId);
  const seedKey = `${character.id}:${mode.id}:${space.id}:${roll.movement.join("-")}:${roll.ripple}:${state.turn}`;
  const output = space.glassSeeds[hashText(seedKey) % space.glassSeeds.length];

  return {
    system:
      "You are the center glass in a fictional symbolic board game. Offer atmosphere, never diagnosis, prophecy, proof, or instruction.",
    user: [
      `Character: ${character.name} (${character.lens}; asks: ${character.question})`,
      `Mode tone: ${mode.glassTone}`,
      `Space: ${space.name}; symbol: ${space.symbol}; vocabulary: ${space.artifactVocabulary.join(", ")}`,
      `Dice: movement ${roll.movement[0]} + ${roll.movement[1]}; ripple die ${roll.ripple} (${roll.influence})`,
      `Reality layer: ${realityLayerLabels[space.realityLayer]}`,
    ].join("\n"),
    constraints: [
      "Return exactly one fragment.",
      "Use two to eight words.",
      "A riddle, symbol, date, warning, or artifact phrase is allowed.",
      "No chapter references, mechanics recap, commands, diagnosis, prophecy, or claim of hidden truth.",
    ],
    output,
  };
}

function names(records: ArtifactRecord[], fallback: string): string[] {
  const unique = Array.from(new Set(records.map((record) => record.artifactName)));
  return unique.length > 0 ? unique : [fallback];
}

export function buildFinalStory(state: RippleGameState): FinalStoryResult {
  const character = characterConfig(state.characterId);
  const mode = modeConfig(state.modeId);
  const collected = names(state.inventory.collected, "an unopened key");
  const forced = names(state.inventory.forced, "a borrowed warning");
  const ignored = names(state.inventory.ignored, "a darkened window");
  const missed = names(state.inventory.missed, "a distant signal");
  const lastSpace = boardSpaces[state.position] ?? boardSpaces[boardSpaces.length - 1];
  const title = `The ${collected[0]} Beyond the Glass`;

  const story = [
    `${character.name} arrived at the edge of the city carrying ${collected[0].toLowerCase()}, though no one could remember who had placed it in ${character.name === "Teodor / Scott" ? "their" : "the traveler's"} hand. Beyond the final pane, the streets were quiet and every window reflected a different hour. ${character.name} followed the reflection that showed an open door instead of a face.`,
    `Inside was a room built around ${forced[0].toLowerCase()}. It had been waiting without anger. When ${character.name} touched it, the walls released the sound of ${missed[0].toLowerCase()} moving far away through rain. The sound did not ask to be followed; it only proved that distance could have a shape.`,
    `At the center table sat ${ignored[0].toLowerCase()}, exactly where it had been left. ${character.name} understood then that refusal had not erased it. Refusal had given it another room, another witness, and enough time to change its name. So ${character.name} spoke the question that had survived the journey: “${character.question}”`,
    `The answer came from the ordinary things. A chair shifted toward the doorway. A blank line opened on an old form. Somewhere below the floor, water changed direction around a stone. None of it was a sign, but together the small movements made passage possible. ${character.name} placed ${collected[collected.length - 1].toLowerCase()} beside the window and left the rest unclaimed.`,
    `By morning, ${lastSpace.name} was no longer a destination. It was a house with two exits and a light left on for whoever arrived next. ${character.name} crossed the threshold without becoming the keeper of it, while behind the glass the city continued inventing rooms that no single story could contain.`,
  ].join("\n\n");

  const runTrace = state.turns.map((turn) => ({
    space: turn.spaceId,
    fragment: turn.glassFragment,
    influence: turn.roll.influence,
    decision: turn.decision,
    forcedSpace: turn.forcedSpaceId,
  }));

  return {
    title,
    story,
    prompt: {
      system:
        "Write a complete, grounded work of fiction from a symbolic game run. Transform the run into scenes, causality, character choice, and an ending.",
      user: [
        `Protagonist: ${character.name}; role: ${character.role}; lens: ${character.lens}`,
        `Tone: ${mode.glassTone}`,
        `Collected artifacts: ${collected.join(", ")}`,
        `Ignored artifacts: ${ignored.join(", ")}`,
        `Forced artifacts: ${forced.join(", ")}`,
        `Missed artifacts: ${missed.join(", ")}`,
        `Run trace: ${JSON.stringify(runTrace)}`,
      ].join("\n"),
      constraints: [
        "Write a complete fictional story with a beginning, change, climax, and ending.",
        "Transform mechanics into story events; never recap dice, turns, inventory, or UI actions.",
        "Do not mention INTERVENTION chapters or imply that fiction is proof, prophecy, diagnosis, or command.",
        "Let collected, ignored, missed, and forced artifacts affect the fiction differently.",
      ],
      output: story,
    },
  };
}

