import type { ArtifactDieResult, CanonArtifact, RealityOutcome } from "../../engine/types";

export const canonArtifacts: CanonArtifact[] = [
  {
    id: "none",
    name: "No Artifact",
    sourceFile: "RIPPLE_CANON/ALTERNATES/README.md",
    plainMeaning: "The turn resolves through movement and the reality die alone.",
    effectType: "none",
    effectText: "No artifact enters this turn.",
    relatedLayers: [],
  },
  {
    id: "boundary-handrail",
    name: "Boundary Handrail",
    sourceFile: "INTERVENTION ARG/MENTAL_HEALTH_DISCLAIMER.md",
    plainMeaning: "A safety boundary keeps a signal from becoming a command.",
    effectType: "convert-missed",
    effectText: "If the turn would become missed, Boundary Handrail converts it into a ripple instead.",
    relatedLayers: ["BOUNDARIES", "CLINICAL_REALITY_LAYER"],
  },
  {
    id: "boulder-protocol",
    name: "Boulder Protocol",
    sourceFile: "INTERVENTION ARG/ARTIFACTS/FIELDNOTE_BOULDER_PROTOCOL.md",
    plainMeaning: "The room checks whether moving weight is responsible or only dramatic.",
    effectType: "room-state",
    effectText: "The room state steadies if the result changes the path instead of only naming the weight.",
    relatedLayers: ["GEOMETRY_AS_CONSEQUENCE", "WEATHER_LAYER"],
  },
  {
    id: "curator-layer",
    name: "Curator Layer",
    sourceFile: "INTERVENTION ARG/ARTIFACTS/ARTIFACT_017_CURATOR'S_LAYER.md",
    plainMeaning: "The archive records the source without turning the record into verdict.",
    effectType: "log-language",
    effectText: "The run log records source contact and keeps the reveal tied to the archive.",
    relatedLayers: ["THEORY_LAYER", "MEDIA_COMMUNICATION_LAYER"],
  },
  {
    id: "masking-layer",
    name: "Masking Layer",
    sourceFile: "NOTES/MASKING_LAYER.md",
    plainMeaning: "The board checks whether competence, comfort, or speed is hiding pressure.",
    effectType: "reveal-hidden",
    effectText: "A hidden layer becomes visible in the landing reveal.",
    relatedLayers: ["CLINICAL_REALITY_LAYER", "CULTURAL_LAYER"],
  },
  {
    id: "geometry-as-consequence",
    name: "Geometry as Consequence",
    sourceFile: "NOTES/GEOMETRY_AS_CONSEQUENCE.md",
    plainMeaning: "The turn reads the shape left by relation, access, delay, and movement.",
    effectType: "redirect",
    effectText: "The path may bend toward the next related canon node.",
    relatedLayers: ["GEOMETRY_AS_CONSEQUENCE", "THEORY_LAYER"],
  },
  {
    id: "signal-released",
    name: "Signal Released, No Receipt Required",
    sourceFile: "RIPPLE_CANON/ALTERNATES/ALTERNATE_10_THE_SIGNAL_THAT_ARRIVED.md",
    plainMeaning: "A signal can be released without demanding control of the receiver.",
    effectType: "protect",
    effectText: "The turn is protected from turning acknowledgement into demand.",
    relatedLayers: ["SOFTWARE_SYSTEMS_LAYER", "THEORY_LAYER"],
  },
  {
    id: "dream-layer",
    name: "Dream Layer",
    sourceFile: "INTERVENTION ARG/DREAM_RIPPLE_MAP.md",
    plainMeaning: "Residue can cross turns without becoming proof or command.",
    effectType: "delay",
    effectText: "Part of the result carries into the next round as aftermath.",
    relatedLayers: ["DREAM_LAYER", "CLINICAL_REALITY_LAYER"],
  },
  {
    id: "software-systems-layer",
    name: "Software Systems Layer",
    sourceFile: "NOTES/SOFTWARE_SYSTEMS_LAYER.md",
    plainMeaning: "The room treats input, output, bottleneck, and state as readable board logic.",
    effectType: "society-state",
    effectText: "Society state updates as a system effect instead of a private feeling.",
    relatedLayers: ["SOFTWARE_SYSTEMS_LAYER", "MEDIA_COMMUNICATION_LAYER"],
  },
  {
    id: "father-layer",
    name: "Father Layer",
    sourceFile: "INTERVENTION ARG/ARTIFACTS/ARTIFACT_032_THE_FATHER_LAYER.md",
    plainMeaning: "Memory changes meaning when the person receiving it changes.",
    effectType: "affect-other",
    effectText: "Another character's path receives a quiet echo from this turn.",
    relatedLayers: ["CULTURAL_LAYER", "CLINICAL_REALITY_LAYER"],
  },
  {
    id: "spectacle-layer",
    name: "Spectacle Layer",
    sourceFile: "INTERVENTION ARG/ARTIFACTS/ARTIFACT_030_THE_SPECTACLE_STATE.md",
    plainMeaning: "The loudest visible frame is checked against what it may be hiding.",
    effectType: "reveal-hidden",
    effectText: "The reveal names the difference between public version and source event.",
    relatedLayers: ["POWER_GOVERNANCE_LAYER", "MEDIA_COMMUNICATION_LAYER"],
  },
];

const artifactDieMap: Record<number, string> = {
  1: "none",
  2: "boundary-handrail",
  3: "boulder-protocol",
  4: "curator-layer",
  5: "geometry-as-consequence",
  6: "masking-layer",
};

function artifactForHook(hooks: string[], die: number): CanonArtifact | undefined {
  if (die !== 4 && die !== 5 && die !== 6) return undefined;
  const hookText = hooks.join(" ").toLowerCase();

  return canonArtifacts.find((artifact) => {
    if (artifact.id === "none") return false;
    return artifact.name
      .toLowerCase()
      .split(/\s+/)
      .some((part) => part.length > 4 && hookText.includes(part));
  });
}

export function artifactDieResult(die: number, hooks: string[], outcome: RealityOutcome): ArtifactDieResult {
  const artifact =
    artifactForHook(hooks, die) ??
    canonArtifacts.find((entry) => entry.id === artifactDieMap[die]) ??
    canonArtifacts[0];
  const modifiedRealityOutcome =
    artifact.effectType === "convert-missed" && outcome === "Missed Intervention Point" ? "Ripple Event" : undefined;

  return {
    die,
    artifactId: artifact.id === "none" ? undefined : artifact.id,
    artifactName: artifact.name,
    effectType: artifact.effectType,
    effectText: artifact.effectText,
    modifiedRealityOutcome,
  };
}
