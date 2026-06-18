import type { LayerCard, Mode, PressureValues, StoryBoulder, StorySpace, StorySpaceType } from "../engine/types";

const boardOrder = [
  "trigger-is-not-instruction",
  "complete-consequence",
  "missed-layer",
  "false-world",
  "closed-door-saved-life",
  "signal-released-no-receipt",
  "loop-breakpoint",
  "decorative-door",
  "echo-faster-than-context",
  "boulder-protocol",
  "storm-not-proof",
];

const typeByStoryWeight: Record<string, StorySpaceType> = {
  "trigger-is-not-instruction": "story",
  "complete-consequence": "story",
  "missed-layer": "layer",
  "false-world": "law",
  "closed-door-saved-life": "boundary",
  "signal-released-no-receipt": "boundary",
  "loop-breakpoint": "story",
  "decorative-door": "artifact",
  "echo-faster-than-context": "spectacle",
  "boulder-protocol": "artifact",
  "storm-not-proof": "layer",
};

const defaultEffects: PressureValues = { witness: 1, namedWeight: 1, institution: 0, concern: 1 };

function effectFor(boulder: StoryBoulder): PressureValues {
  return boulder.pressureProfile ?? defaultEffects;
}

function characterReadingsFor(boulder: StoryBoulder): Record<string, string> {
  const readings: Record<string, string> = {};
  boulder.relatedCharacters.forEach((agentId) => {
    const direct = boulder.targetFit[agentId];
    if (direct) readings[agentId] = direct;
  });
  return readings;
}

function layerTitle(id: string, layerCards: LayerCard[]): string {
  return layerCards.find((card) => card.id === id)?.name ?? id;
}

function visibilityFor(mode: Mode): "hidden" | "hint" | "full" {
  if (mode === "mystery") return "hidden";
  if (mode === "vague") return "hint";
  return "full";
}

export function buildStorySpaces(storyBoulders: StoryBoulder[], layerCards: LayerCard[]): StorySpace[] {
  const spaces = boardOrder
    .map((id) => storyBoulders.find((boulder) => boulder.id === id))
    .filter((boulder): boulder is StoryBoulder => Boolean(boulder))
    .map((boulder): StorySpace => {
      const layers = boulder.relatedLayers.map((id) => layerTitle(id, layerCards));

      return {
        id: `space-${boulder.id}`,
        title: boulder.name,
        sourceFile: boulder.sourceFile,
        sourceTitle: boulder.sourceChapter ?? boulder.sourceType,
        type: typeByStoryWeight[boulder.id] ?? "story",
        shortMeaning: boulder.shortDescription,
        plainMeaning: boulder.plainLanguageMeaning,
        relatedStoryWeightIds: [boulder.id],
        relatedLayerIds: boulder.relatedLayers,
        relatedCharacters: boulder.relatedCharacters,
        baseMeterEffects: effectFor(boulder),
        modeVisibility: { mystery: "hidden", vague: "hint", experimental: "full" },
        mysteryText: "The board keeps this space quiet until a piece lands here.",
        vagueText: boulder.shortDescription,
        experimentalText: `${boulder.symbolicFunction} Layer pull: ${layers.join(", ") || "active room pressure"}.`,
        triggerPattern: boulder.triggerTags.join(", "),
        characterReadings: characterReadingsFor(boulder),
      };
    });

  spaces.push({
    id: "space-nested-simulation-gate",
    title: "Nested Simulation Gate",
    sourceFile: "INTERVENTION ARG/Chapter 17.md",
    sourceTitle: "Chapter 17 - Teodor",
    type: "simulation",
    shortMeaning: "The next room remains locked until the current room remembers enough.",
    plainMeaning:
      "The room does not unlock the next simulation by winning. It unlocks it by remembering enough to build another room.",
    relatedStoryWeightIds: ["boulder-protocol"],
    relatedLayerIds: ["software-systems", "theory", "self-awareness"],
    relatedCharacters: ["teodor-scott", "mara", "jamal", "maren", "dev"],
    baseMeterEffects: { witness: 2, namedWeight: 2, institution: 2, concern: 1 },
    modeVisibility: { mystery: "hidden", vague: "hint", experimental: "full" },
    mysteryText: "A locked inner board hums under the table.",
    vagueText: "A locked goal checks whether the room has enough memory, law, and source trace.",
    experimentalText:
      "Win condition pressure. It checks rounds, character landings, laws, source reading, export, and Simulation Seed progress.",
    triggerPattern: "simulation, memory, law, export, source",
    characterReadings: {
      mara: "Mara reads the gate as a threshold: the next room should not open until the first room can account for its pressure.",
      jamal: "Jamal reads the gate as a record problem: the next room needs context before it becomes rule.",
      maren: "Maren reads the gate as a safety boundary. A room that cannot pause should not reproduce itself.",
      dev: "Dev reads the gate as a door with requirements instead of mystery alone.",
      "teodor-scott": "Teodor / Scott reads the gate as the design problem: create the room that creates the next room.",
    },
  });

  return spaces;
}

export function boardPreviewText(space: StorySpace, mode: Mode): { visibility: "hidden" | "hint" | "full"; label: string; detail: string } {
  const visibility = space.modeVisibility[mode] ?? visibilityFor(mode);

  if (visibility === "hidden") {
    return { visibility, label: "Unknown space", detail: space.mysteryText };
  }

  if (visibility === "hint") {
    return { visibility, label: space.title, detail: space.vagueText };
  }

  return { visibility, label: space.title, detail: space.experimentalText };
}
