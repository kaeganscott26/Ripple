import type { CharacterPathState, RealityOutcome, StorySpace } from "../../engine/types";

const outcomeBranch: Record<RealityOutcome, string> = {
  "Intervention Point": "path opens",
  "Ripple Event": "path bends",
  "Missed Intervention Point": "path carries the cost",
};

export function branchTextFor(characterName: string, space: StorySpace, outcome: RealityOutcome): string {
  const verb = outcomeBranch[outcome];
  const chapter = space.mirrorsChapter ?? space.sourceTitle;

  return `${characterName}'s ${verb} through ${chapter}: ${space.title}.`;
}

export function updateCharacterPath(
  current: CharacterPathState,
  position: number,
  space: StorySpace,
  outcome: RealityOutcome,
  artifactName?: string,
): CharacterPathState {
  const carriedArtifacts =
    artifactName && artifactName !== "No Artifact"
      ? Array.from(new Set([...current.carriedArtifacts, artifactName])).slice(-4)
      : current.carriedArtifacts;
  const interventionCount = current.interventionCount + (outcome === "Intervention Point" ? 1 : 0);
  const rippleCount = current.rippleCount + (outcome === "Ripple Event" ? 1 : 0);
  const missedInterventionCount = current.missedInterventionCount + (outcome === "Missed Intervention Point" ? 1 : 0);
  const pressureScore = missedInterventionCount * 2 + rippleCount - interventionCount;

  return {
    ...current,
    currentPosition: position,
    currentBranch: `${outcomeBranch[outcome]}: ${space.title}`,
    carriedArtifacts,
    pressureState: pressureScore >= 5 ? "strained" : pressureScore >= 2 ? "watchful" : "steady",
    interventionCount,
    rippleCount,
    missedInterventionCount,
    currentEndingTendency:
      interventionCount >= rippleCount && interventionCount >= missedInterventionCount
        ? "intervention"
        : rippleCount >= missedInterventionCount
          ? "ripple"
          : "missed",
    sourceContactCount: current.sourceContactCount + 1,
  };
}
