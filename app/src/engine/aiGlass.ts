import { characterConfig, modeConfig } from "../data/gameConfig";
import { boardForCharacter } from "../data/boards";
import { realityLayerLabels } from "../data/liveBoard";
import type {
  ArtifactRecord,
  BoardSpaceConfig,
  FinalStoryResult,
  GlassPrompt,
  LifeBoardSpace,
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
  const rescued = state.inventory.collected.filter((record) => record.recovery === "resonance");
  const lastSpace = board.spaces[state.position] ?? board.spaces[board.spaces.length - 1];
  const dominantLens = dominantLensFor(state);
  const title = `The ${collected[0]} Beyond the Glass`;

  const story = [
    `${character.name} arrived at the edge of the city carrying ${collected[0].toLowerCase()}, though no one could remember who had placed it in ${character.name === "Teodor / Scott" ? "their" : "the traveler's"} hand. Beyond the final pane, the streets were quiet and every window reflected a different hour. ${character.name} followed the reflection that showed an open door instead of a face.`,
    `Inside was a room built around ${forced[0].toLowerCase()}. It had been waiting without anger. When ${character.name} touched it, the walls released the sound of ${missed[0].toLowerCase()} moving far away through rain. The sound did not ask to be followed; it only proved that distance could have a shape.`,
    `At the center table sat ${ignored[0].toLowerCase()}, exactly where it had been left. ${character.name} understood then that refusal had not erased it. Refusal had given it another room, another witness, and enough time to change its name. ${dominantLens ? lensFiction[dominantLens] : "The room kept its details without explaining them."} So ${character.name} spoke the question that had survived the journey: “${character.question}”`,
    `The answer came from the ordinary things. A chair shifted toward the doorway. A blank line opened on an old form. Somewhere below the floor, water changed direction around a stone. None of it was a sign, but together the small movements made passage possible. ${rescued[0] ? `The ${rescued[0].artifactName.toLowerCase()} had nearly passed out of reach, but the glass gave it back. ` : ""}${character.name} placed ${collected[collected.length - 1].toLowerCase()} beside the window and left the rest unclaimed.`,
    `By morning, ${lastSpace.name} was no longer a destination. It was a house with two exits and a light left on for whoever arrived next. ${character.name} crossed the threshold without becoming the keeper of it, while behind the glass the city continued inventing rooms that no single story could contain.`,
  ].join("\n\n");

  const runTrace = state.turns.map((turn) => ({
    space: turn.spaceId,
    fragment: turn.glassFragment,
    lens: turn.roll.lens,
    decision: turn.decision,
    forcedSpace: turn.forcedSpaceId,
    resonanceRecovery: turn.rescuedArtifactSpaceId,
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
        `Resonance-recovered artifacts: ${rescued.map((record) => record.artifactName).join(", ") || "none"}`,
        `Run trace: ${JSON.stringify(runTrace)}`,
        `Ripple lens history: ${state.boardRun.ripple_lens_history.join(", ")}`,
        `Lens effects: ${JSON.stringify(state.boardRun.lens_effects)}`,
      ].join("\n"),
      constraints: [
        "Write a complete fictional story with a beginning, change, climax, and ending.",
        "Transform mechanics into story events; never recap dice, turns, inventory, or UI actions.",
        "Do not mention INTERVENTION chapters or imply that fiction is proof, prophecy, diagnosis, or command.",
        "Let collected, ignored, missed, and forced artifacts affect the fiction differently.",
        "Treat resonance-recovered artifacts as returned memory, second chance, or recovered possibility without naming dice or game mechanics.",
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
  const artifactNumber = (record: ArtifactRecord) => board.spaces.findIndex((space) => space.id === record.spaceId) + 1;
  const artifactSpace = (record: ArtifactRecord): LifeBoardSpace | undefined => authored.spaces[artifactNumber(record) - 1];
  const stateWeight: Record<ArtifactRecord["state"], number> = { collected: 4, forced: 3, ignored: 2, missed: 1 };
  const score = (record: ArtifactRecord) => {
    const number = artifactNumber(record);
    const zone = artifactSpace(record)?.zone;
    return stateWeight[record.state]
      + (state.boardRun.amplified_spaces.includes(number) ? 8 : 0)
      + (authored.fixedAnchors.includes(number) ? 5 : 0)
      + (zone && state.boardRun.dominant_zones.includes(zone) ? 4 : 0)
      + (number >= 65 ? 2 : 0);
  };
  const ranked = (records: ArtifactRecord[]) => [...records]
    .sort((left, right) => score(right) - score(left) || left.turn - right.turn)
    .filter((record, index, all) => all.findIndex((candidate) => candidate.artifactName === record.artifactName) === index);
  const primaryCandidates = [...state.inventory.collected, ...state.inventory.forced]
    .filter((record) => artifactNumber(record) !== authored.totalSpaces);
  const primary = ranked(primaryCandidates)[0]
    ?? ranked([...state.inventory.collected, ...state.inventory.forced])[0]
    ?? ranked([...state.inventory.ignored, ...state.inventory.missed])[0];
  if (!primary) throw new Error("Teodor / Scott ending requires story material from the run.");
  const support = ranked([...state.inventory.collected, ...state.inventory.forced])
    .filter((record) => record.artifactName !== primary.artifactName)
    .slice(0, 3);
  const consequence = ranked(state.inventory.ignored).find((record) => record.artifactName !== primary.artifactName)
    ?? ranked(state.inventory.forced).find((record) => record.artifactName !== primary.artifactName);
  const missedEcho = ranked(state.inventory.missed)[0];
  const rescued = ranked(state.inventory.collected.filter((record) => record.recovery === "resonance"))[0];

  const artifactPhrase = (record: ArtifactRecord) => {
    if (/^(AIFRED|INTERVENTION)\b/.test(record.artifactName)) return record.artifactName;
    return record.artifactName.toLowerCase();
  };
  const zone = artifactSpace(primary)?.zone ?? "Ripple / Last Glass";
  const sceneOpenings: Record<string, string> = {
    Origin: "The kitchen table became the first room he could trust.",
    "Childhood Rooms": "Late light crossed the living-room carpet and stopped at the kitchen table.",
    "Music and Fear": "The piano room held the evening after the final note had gone.",
    "Father Layer": "His father's office had kept its dust, its old coffee smell, and one working lamp.",
    "Collapse and Survival": "By dusk, the apartment kitchen had narrowed to a table, a chair, and the work he could no longer postpone.",
    "Kaegan / Future Layer": "The kitchen table waited between a silent phone and the chair reserved for Kaegan.",
    "Work / Systems Layer": "After service, the kitchen line cooled around one clean table left beneath the lights.",
    "AIFRED / INTERVENTION": "The studio desk glowed after midnight, cables crossing the wood like dark roots.",
    "Ripple / Last Glass": "Near midnight, the kitchen table held the only light still on in the house.",
  };
  const supportSentences = support.map((record, index) => {
    const artifact = artifactPhrase(record);
    if (index === 0) return `The ${artifact} rested beside it, close enough to touch but not arranged for display.`;
    if (index === 1) return `Beyond the half-open door, the ${artifact} changed the shape of the silence without asking to be explained.`;
    return `Across from him, the ${artifact} kept its ordinary weight while the room gathered around it.`;
  });
  const pressureSentence = consequence
    ? consequence.state === "ignored"
      ? `He had tried to leave the ${artifactPhrase(consequence)} outside this room; by nightfall, that refusal had become work someone else would otherwise have to carry.`
      : `The ${artifactPhrase(consequence)} would not stay beyond the doorway, so he gave it a place without pretending that attention alone was repair.`
    : "Nothing accused him, but nothing agreed to disappear for his comfort.";
  const missedSentence = missedEcho
    ? `Somewhere past the hallway, the place where the ${artifactPhrase(missedEcho)} should have been remained open, an absence with its own weather.`
    : "The hallway beyond the room stayed dark, holding what the evening could not settle.";
  const rescuedSentence = rescued
    ? `The ${artifactPhrase(rescued)} had nearly passed out of reach, but the glass gave it back with its ordinary weight intact.`
    : "";
  const branchTheme = state.boardRun.resolved_branch_pairs.some((pair) => pair.kind === "contradiction")
    ? "Opposed memories could share the room; neither excused what happened next."
    : state.boardRun.resolved_branch_pairs.some((pair) => pair.kind === "pressure")
      ? "What had gone unanswered returned as pressure, not prophecy."
      : "The past offered a direction, not a verdict.";
  const contradiction = state.boardRun.resolved_branch_pairs.some((pair) => pair.kind === "contradiction");
  const accountability = state.boardRun.final_response.includes("accountability");
  const dominantLens = dominantLensFor(state);
  const title = `The ${primary.artifactName} at Last Glass`;

  const story = [
    `Teodor was adopted before he could name the first door. Scott was the name given by his father, a name meant to make room rather than close one. The name Scott did not erase Teodor. Years later, when he signed a note at the edge of the table, both names remained visible in the wet ink.`,
    `His father mattered. His father died. The chair kept its scratches and the office kept its smell, refusing the polish that memory tried to give them. Music mattered because it could hold grief in time without turning grief into wisdom. What Scott did under pressure still belonged to him.`,
    `${sceneOpenings[zone]} The ${artifactPhrase(primary)} lay beneath his hand, chosen as the center of the evening rather than evidence in a case. ${supportSentences.join(" ")} ${rescuedSentence} ${pressureSentence} ${missedSentence} ${branchTheme} ${contradiction ? "The room held both versions without letting either cancel the cost." : "The quieter version remained present without demanding the final word."} ${dominantLens ? lensFiction[dominantLens] : "The light shifted across the table and left every object answerable to its own shadow."}`,
    `Kaegan mattered; he was a son with the right to answer, refuse, leave, and return, not the person assigned to save his father. Scott carried that fact into the kitchen rush, where timing and one calm voice showed how pressure moved between people. AIFRED began as an audio tool, a practical comparison between a current sound and a target. INTERVENTION became the archive, a place for loose pages that did not pretend arrangement was healing. Ripple became the name for the movement he noticed—not fate, proof, or ownership.`,
    accountability
      ? `Before morning, he named one harm without asking the naming to count as repair, then made one promise small enough for another person to test. Monument remained in the room as a warning: pain could become architecture and still fail the people asked to live inside it. The Last Glass generates a fictional variation, not a direct autobiography. It left him with the harder opening: what would this consequence build next?`
      : `Before morning, he found that the monument had no door for the people named inside it. He stopped calling the structure repair and left an opening where another person could refuse his design. The Last Glass generates a fictional variation, not a direct autobiography. It left the ending accountable to a harder question: what would this consequence build next?`,
  ].join("\n\n");

  const storyArtifactData = (records: ArtifactRecord[]) => records.map((record) => ({
    state: record.state,
    space: record.spaceName,
    artifact: record.artifactName,
    layer: record.realityLayer,
    recovery: record.recovery,
  }));

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
        `primary_scene_artifact: ${JSON.stringify(storyArtifactData([primary])[0])}`,
        `support_artifacts: ${JSON.stringify(storyArtifactData(support))}`,
        `consequence_pressure: ${JSON.stringify(consequence ? storyArtifactData([consequence])[0] : null)}`,
        `missed_atmosphere: ${JSON.stringify(missedEcho ? storyArtifactData([missedEcho])[0] : null)}`,
        `collected_spaces: ${JSON.stringify(storyArtifactData(state.inventory.collected))}`,
        `resonance_recoveries: ${JSON.stringify(storyArtifactData(state.inventory.collected.filter((record) => record.recovery === "resonance")))}`,
        `ignored_spaces: ${JSON.stringify(storyArtifactData(state.inventory.ignored))}`,
        `missed_spaces: ${JSON.stringify(storyArtifactData(state.inventory.missed))}`,
        `forced_spaces: ${JSON.stringify(storyArtifactData(state.inventory.forced))}`,
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
        "Choose one primary scene anchor and blend no more than three support artifacts into that scene; do not list raw storySeed fragments.",
        "Turn ignored spaces into delayed pressure, forced spaces into unavoidable moments, and missed spaces into atmosphere, absence, or unresolved echo.",
        "Turn resonance recoveries into returned memory, second chance, or recovered possibility without naming dice or mechanics.",
        "Translate lens history into fiction: sensory recall, returning pressure, linked rooms, alternate possibilities, mercy, or amplified consequence. Never name the die or lens mechanic.",
      ],
      output: story,
    },
  };
}
