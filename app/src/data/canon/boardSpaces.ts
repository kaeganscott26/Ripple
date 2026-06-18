import type { Mode, PressureValues, StorySpace, StorySpaceType } from "../../engine/types";
import { canonAlternates } from "./alternates";

const characterIds = ["mara", "jamal", "maren", "dev", "teodor-scott"];

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function pressureFromLayers(layers: string[], index: number): PressureValues {
  const text = layers.join(" ").toLowerCase();

  return {
    witness: 1 + (text.includes("media") || text.includes("community") || text.includes("theory") ? 1 : 0),
    namedWeight: 1 + (text.includes("cultural") || text.includes("software") || index >= 9 ? 1 : 0),
    institution: text.includes("power") || text.includes("governance") || text.includes("software") ? 1 : 0,
    concern: 1 + (text.includes("clinical") || text.includes("boundaries") || text.includes("unexplained") ? 1 : 0),
  };
}

function typeFromLayers(layers: string[], index: number): StorySpaceType {
  const text = layers.join(" ").toLowerCase();

  if (index >= 11) return "simulation";
  if (text.includes("boundaries") || text.includes("clinical")) return "boundary";
  if (text.includes("power") || text.includes("governance")) return "law";
  if (text.includes("media") || text.includes("community") || text.includes("cultural")) return "spectacle";
  if (text.includes("theory") || text.includes("geometry")) return "layer";
  if (text.includes("software")) return "artifact";
  return "story";
}

function visibilityFor(mode: Mode): "hidden" | "hint" | "full" {
  if (mode === "mystery") return "hidden";
  if (mode === "vague") return "hint";
  return "full";
}

function compactMeaning(text: string, fallback: string): string {
  const first = text
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 24);

  return first?.slice(0, 220) ?? fallback;
}

function characterReadings(title: string, plainMeaning: string): Record<string, string> {
  return {
    mara: `Mara reads ${title} as witness work: the room has to leave enough space for truth.`,
    jamal: `Jamal reads ${title} as form pressure: the record should not harden before the room is counted.`,
    maren: `Maren reads ${title} as safety weather: the pause matters as much as the result.`,
    dev: `Dev reads ${title} as access: the path is only real if someone can actually use it.`,
    "teodor-scott": `Teodor / Scott reads ${title} as design: ${plainMeaning}`,
  };
}

export const canonBoardSpaces: StorySpace[] = canonAlternates.flatMap((alternate) =>
  alternate.boardSpaces.map((title, index): StorySpace => {
    const spaceIndex = index + 1;
    const id = `${alternate.id}-space-${String(spaceIndex).padStart(2, "0")}-${slug(title)}`;
    const plainMeaning = compactMeaning(alternate.gameMeaning, `${title} changes the path through ${alternate.title}.`);
    const shortMeaning = `${alternate.title} / Space ${spaceIndex}`;

    return {
      id,
      title,
      alternateId: alternate.id,
      alternateTitle: alternate.title,
      mirrorsChapter: alternate.mirrorsChapter,
      chapterTitle: alternate.chapterTitle,
      sourceFile: alternate.sourceFile,
      sourceTitle: `${alternate.mirrorsChapter} - ${alternate.chapterTitle}`,
      sourceLinks: [alternate.sourceFile, `INTERVENTION ARG/${alternate.mirrorsChapter}.md`],
      layers: alternate.layers,
      artifactEchoes: alternate.artifactEchoes,
      spaceIndex,
      type: typeFromLayers(alternate.layers, spaceIndex),
      shortMeaning,
      plainMeaning,
      interventionText: alternate.interventionPoint,
      missedText: alternate.missedInterventionPoint,
      rippleText: alternate.rippleEvent,
      artifactHooks: alternate.artifactPulls,
      possibleEndStateImpact: alternate.endStates,
      relatedStoryWeightIds: [alternate.id],
      relatedLayerIds: alternate.layers.map(slug),
      relatedCharacters: characterIds,
      baseMeterEffects: pressureFromLayers(alternate.layers, spaceIndex),
      modeVisibility: { mystery: "hidden", vague: "hint", experimental: "full" },
      mysteryText: "The board keeps this space behind the glass until a piece lands here.",
      vagueText: plainMeaning,
      experimentalText: [
        `${alternate.title}, space ${spaceIndex}.`,
        `Intervention: ${compactMeaning(alternate.interventionPoint, "Intervention point available.")}`,
        `Ripple: ${compactMeaning(alternate.rippleEvent, "Ripple event available.")}`,
        `Missed: ${compactMeaning(alternate.missedInterventionPoint, "Missed intervention possible.")}`,
      ].join(" "),
      triggerPattern: alternate.layers.join(", "),
      characterReadings: characterReadings(title, plainMeaning),
    };
  }),
);

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
