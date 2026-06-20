import { characterConfig, modeConfig } from "../data/gameConfig";
import { boardForCharacter } from "../data/boards";
import { realityLayerLabels } from "../data/liveBoard";
import type {
  ArtifactRecord,
  BoardSpaceConfig,
  FinalStoryResult,
  GlassPrompt,
  RippleLens,
  RippleGameState,
  DiceRoll,
} from "./gameTypes";

const rippleLenses: Record<number, RippleLens> = {
  1: "Memory",
  2: "Pressure",
  3: "Echo",
  4: "Fork",
  5: "Intervention",
  6: "Ripple",
};

export const rippleLensExplanations: Record<RippleLens, string> = {
  Memory: "The board remembers this space in sharper detail.",
  Pressure: "The board carries this space forward as tension.",
  Echo: "The board connects this space to another room.",
  Fork: "The board emphasizes an alternate possibility.",
  Intervention: "Ignoring this space will not move you back.",
  Ripple: "The board makes this space more consequential.",
};

export function influenceFor(die: number): RippleLens {
  return rippleLenses[die] ?? "Memory";
}

function hashText(value: string): number {
  return Array.from(value).reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 2166136261);
}

export function buildRippleRiddlePrompt(
  state: Pick<RippleGameState, "characterId" | "modeId" | "turn">,
  space: BoardSpaceConfig,
  roll: DiceRoll,
): GlassPrompt {
  const character = characterConfig(state.characterId);
  const mode = modeConfig(state.modeId);
  const seedKey = `${character.id}:${mode.id}:${space.id}:${roll.movementDie}:${roll.rippleDie}:${state.turn}`;
  const output = space.glassSeeds[hashText(seedKey) % space.glassSeeds.length];

  return {
    system:
      "You are the center glass in a fictional symbolic board game. Offer atmosphere, never diagnosis, prophecy, proof, or instruction.",
    user: [
      `Character: ${character.name} (${character.lens}; asks: ${character.question})`,
      `Mode tone: ${mode.glassTone}`,
      `Space: ${space.name}; symbol: ${space.symbol}; vocabulary: ${space.artifactVocabulary.join(", ")}`,
      `Movement Die: ${roll.movementDie}`,
      `Ripple Die: ${roll.rippleDie} — ${roll.lens}`,
      `Move: ${roll.total} spaces`,
      `Lens effect: ${rippleLensExplanations[roll.lens]}`,
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

function dominantLensFor(state: RippleGameState): RippleLens | undefined {
  const counts = state.boardRun.ripple_lens_history.reduce<Partial<Record<RippleLens, number>>>((result, lens) => {
    result[lens] = (result[lens] ?? 0) + 1;
    return result;
  }, {});
  return (Object.entries(counts) as [RippleLens, number][]).sort((a, b) => b[1] - a[1])[0]?.[0];
}

const lensFiction: Record<RippleLens, string> = {
  Memory: "The room returned first as smell and color, then as the exact angle of light across the table.",
  Pressure: "Every truth delayed behind a closed door had gathered weight without raising its voice.",
  Echo: "A phrase from the first room returned in the last, answered by a sound that had seemed unrelated at the time.",
  Fork: "Two opposed versions of the hallway remained possible, and neither could erase what the other had cost.",
  Intervention: "An ordinary kindness bought enough time for a different answer; it was not repair, but it kept repair possible.",
  Ripple: "A small choice in one room changed the timing of the next, then the posture of someone who never saw where it began.",
};

export function buildFinalStory(state: RippleGameState): FinalStoryResult {
  const board = boardForCharacter(state.characterId);
  if (board.authored) return buildTeodorScottFinalStory(state);
  const character = characterConfig(state.characterId);
  const mode = modeConfig(state.modeId);
  const collected = names(state.inventory.collected, "an unopened key");
  const forced = names(state.inventory.forced, "a borrowed warning");
  const ignored = names(state.inventory.ignored, "a darkened window");
  const missed = names(state.inventory.missed, "a distant signal");
  const lastSpace = board.spaces[state.position] ?? board.spaces[board.spaces.length - 1];
  const dominantLens = dominantLensFor(state);
  const title = `The ${collected[0]} Beyond the Glass`;

  const story = [
    `${character.name} arrived at the edge of the city carrying ${collected[0].toLowerCase()}, though no one could remember who had placed it in ${character.name === "Teodor / Scott" ? "their" : "the traveler's"} hand. Beyond the final pane, the streets were quiet and every window reflected a different hour. ${character.name} followed the reflection that showed an open door instead of a face.`,
    `Inside was a room built around ${forced[0].toLowerCase()}. It had been waiting without anger. When ${character.name} touched it, the walls released the sound of ${missed[0].toLowerCase()} moving far away through rain. The sound did not ask to be followed; it only proved that distance could have a shape.`,
    `At the center table sat ${ignored[0].toLowerCase()}, exactly where it had been left. ${character.name} understood then that refusal had not erased it. Refusal had given it another room, another witness, and enough time to change its name. ${dominantLens ? lensFiction[dominantLens] : "The room kept its details without explaining them."} So ${character.name} spoke the question that had survived the journey: “${character.question}”`,
    `The answer came from the ordinary things. A chair shifted toward the doorway. A blank line opened on an old form. Somewhere below the floor, water changed direction around a stone. None of it was a sign, but together the small movements made passage possible. ${character.name} placed ${collected[collected.length - 1].toLowerCase()} beside the window and left the rest unclaimed.`,
    `By morning, ${lastSpace.name} was no longer a destination. It was a house with two exits and a light left on for whoever arrived next. ${character.name} crossed the threshold without becoming the keeper of it, while behind the glass the city continued inventing rooms that no single story could contain.`,
  ].join("\n\n");

  const runTrace = state.turns.map((turn) => ({
    space: turn.spaceId,
    fragment: turn.glassFragment,
    lens: turn.roll.lens,
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
        `Ripple lens history: ${state.boardRun.ripple_lens_history.join(", ")}`,
        `Lens effects: ${JSON.stringify(state.boardRun.lens_effects)}`,
      ].join("\n"),
      constraints: [
        "Write a complete fictional story with a beginning, change, climax, and ending.",
        "Transform mechanics into story events; never recap dice, turns, inventory, or UI actions.",
        "Do not mention INTERVENTION chapters or imply that fiction is proof, prophecy, diagnosis, or command.",
        "Let collected, ignored, missed, and forced artifacts affect the fiction differently.",
        "Translate lens history into sensory recall, pressure, connection, contradiction, mercy, and consequence without naming dice or lenses.",
      ],
      output: story,
    },
  };
}

function buildTeodorScottFinalStory(state: RippleGameState): FinalStoryResult {
  const board = boardForCharacter(state.characterId);
  const authored = board.authored;
  if (!authored) throw new Error("Teodor / Scott ending requires the authored board.");
  const mode = modeConfig(state.modeId);
  const collected = names(state.inventory.collected, "Adoption Paper");
  const ignored = names(state.inventory.ignored, "an unanswered room");
  const artifactNumber = (record: ArtifactRecord) => board.spaces.findIndex((space) => space.id === record.spaceId) + 1;
  const stateWeight: Record<ArtifactRecord["state"], number> = { collected: 4, forced: 3, ignored: 2, missed: 1 };
  const strongestArtifacts = [...state.inventory.collected, ...state.inventory.forced, ...state.inventory.ignored, ...state.inventory.missed]
    .sort((left, right) => {
      const score = (record: ArtifactRecord) => {
        const number = artifactNumber(record);
        return stateWeight[record.state]
          + (state.boardRun.amplified_spaces.includes(number) ? 6 : 0)
          + (authored.fixedAnchors.includes(number) ? 5 : 0);
      };
      return score(right) - score(left) || left.turn - right.turn;
    })
    .filter((record, index, records) => records.findIndex((candidate) => candidate.artifactName === record.artifactName) === index)
    .slice(0, 4);
  const sceneMaterial = strongestArtifacts.map((record) => {
    const artifact = record.artifactName.toLowerCase();
    if (record.state === "collected") {
      return `At ${record.spaceName}, he set the ${artifact} where everyone in the room could see it, then stayed long enough for the conversation it opened.`;
    }
    if (record.state === "ignored") {
      return `The ${artifact} remained at ${record.spaceName}; by evening, his silence around it had become pressure other people had to carry.`;
    }
    if (record.state === "forced") {
      return `At ${record.spaceName}, the ${artifact} blocked the doorway, unavoidable and ordinary, until he named what it required of him.`;
    }
    return `The missing ${artifact} left ${record.spaceName} oddly bare, an absence that followed him as a faint sound in the next room.`;
  });
  const contradiction = state.boardRun.resolved_branch_pairs.some((pair) => pair.kind === "contradiction");
  const accountability = state.boardRun.final_response.includes("accountability");
  const dominantLens = dominantLensFor(state);
  const title = `The ${collected[0]} at Last Glass`;

  const story = [
    `The ${collected[0].toLowerCase()} waited on the kitchen table beneath a water ring. Teodor had been adopted before he could name the first door, and Scott was the name his father later gave him. The new name made a roof, not an erasure. When he signed the note beside the artifact, both names remained visible in the wet ink.`,
    `His father had been funny, stubborn, practical, flawed—human before memory made him larger. At the piano, Scott found that music could hold a room steady without explaining it. After his father died, the empty chair kept its ordinary scratches and the office kept its smell. Grief did not make him wise. It changed the pressure in the house, and some of what he did under that pressure still belonged to him.`,
    `The rooms refused a clean verdict. ${sceneMaterial.length > 0 ? sceneMaterial.join(" ") : "Warmth and distance occupied the same hallway."} ${contradiction ? "Two opposed memories stayed true without cancelling each other." : "One version spoke louder, but the quieter one did not disappear."} ${dominantLens ? lensFiction[dominantLens] : "The rooms kept their details without agreeing on a verdict."}`,
    `Kaegan called with plans and irritation of his own, a son with the right to answer, refuse, leave, and return. He mattered, but he was not assigned the work of saving his father. Scott carried that fact into the kitchen rush, where timing, broken stations, and one calm voice taught him how pressure moved through a room. AIFRED began as an audio tool, a practical comparison between a current sound and a target. INTERVENTION became the archive where loose pages could be arranged without being mistaken for healing. Ripple was only the name Scott gave the movement he noticed—not fate, not proof, and not a theory guaranteed to be right.`,
    accountability
      ? `At Last Glass, he chose accountability before monument. He put ${ignored[0].toLowerCase()} on the table and named the damage without asking the naming to count as repair. Then he made one specific promise small enough to be tested by another person. The glass offered this as a fictional variation, never a direct autobiography, and left him with the harder opening: what would this consequence build next?`
      : `At Last Glass, the monument looked finished until he noticed it had no door for the people named inside it. He set ${ignored[0].toLowerCase()} beside the foundation and refused to call the structure repair. The glass offered this as a fictional variation, never a direct autobiography, and left the ending open to a harder question: what would this consequence build next?`,
  ].join("\n\n");

  return {
    title,
    story,
    prompt: {
      system: "Generate a fictional, concrete, accountable Teodor / Scott variation from authored board fuel. Never produce autobiography, supernatural proof, prophecy, or a mechanics report.",
      user: [
        `selected_mode: ${state.boardRun.selected_mode}`,
        `selected_character: ${state.boardRun.selected_character}`,
        `base_story_summary: ${authored.baseStorySummary}`,
        `fixed_truths: ${JSON.stringify(authored.fixedTruths)}`,
        `fixed_anchor_states: ${JSON.stringify(state.boardRun.fixed_anchor_states)}`,
        `collected_spaces: ${JSON.stringify(state.inventory.collected)}`,
        `ignored_spaces: ${JSON.stringify(state.inventory.ignored)}`,
        `missed_spaces: ${JSON.stringify(state.inventory.missed)}`,
        `forced_spaces: ${JSON.stringify(state.inventory.forced)}`,
        `resolved_branch_pairs: ${JSON.stringify(state.boardRun.resolved_branch_pairs)}`,
        `unresolved_branch_pairs: ${JSON.stringify(state.boardRun.unresolved_branch_pairs)}`,
        `dominant_zones: ${state.boardRun.dominant_zones.join(", ")}`,
        `dominant_layers: ${state.boardRun.dominant_reality_layers.join(", ")}`,
        `ending_pressure: ${state.boardRun.ending_pressure.join(", ")}`,
        `ripple_lens_history: ${state.boardRun.ripple_lens_history.join(", ")}`,
        `lens_effects: ${JSON.stringify(state.boardRun.lens_effects)}`,
        `echo_links: ${JSON.stringify(state.boardRun.echo_links)}`,
        `amplified_spaces: ${state.boardRun.amplified_spaces.join(", ")}`,
        `intervention_turns_used: ${state.boardRun.intervention_turns_used}`,
        `turn_count: ${state.boardRun.turn_count}`,
        `dice_history: ${JSON.stringify(state.boardRun.dice_history)}`,
        `final_response: ${state.boardRun.final_response}`,
        `tone: ${mode.glassTone}`,
      ].join("\n"),
      constraints: [
        "Write fiction, not direct autobiography, a therapy worksheet, a quest log, a score, or a mechanics summary.",
        "Preserve every fixed truth while changing how the protagonist relates to it.",
        "Keep the father and Kaegan human; neither is a symbol, cure, or automatic source of wisdom.",
        "Treat Ripple as accountable observation, never fate, prophecy, cosmic certainty, or automatic proof.",
        "Transform collected, ignored, missed, forced, and branch resolution data into concrete scenes.",
        "Choose two to four of the strongest artifacts as concrete scene material; do not list raw storySeed fragments.",
        "Turn ignored spaces into delayed pressure, forced spaces into unavoidable moments, and missed spaces into atmosphere, absence, or unresolved echo.",
        "Translate lens history into fiction: sensory recall, returning pressure, linked rooms, alternate possibilities, mercy, or amplified consequence. Never name the die or lens mechanic.",
      ],
      output: story,
    },
  };
}
