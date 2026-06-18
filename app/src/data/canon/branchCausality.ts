import type { BranchId, BranchMechanic, RealityOutcome } from "../../engine/types";

export type ChapterBranchLabel = "canon" | "alternate-a" | "alternate-b";

export interface SourceLink {
  label: string;
  sourceFile: string;
}

export interface MoveLogicRule {
  outcome: RealityOutcome;
  scene: string;
  result: string;
  openedPath: string;
  closedPath: string;
  mechanics: BranchMechanic[];
}

export interface ChapterBranch {
  id: BranchId;
  chapterId: number;
  title: string;
  branchLabel: ChapterBranchLabel;
  coreMirror: string;
  unlockedMechanics: BranchMechanic[];
  boardSpaces: string[];
  interventionPointText: string;
  missedInterventionText: string;
  rippleEventText: string;
  characterEffects: Record<string, string>;
  artifactEffects: Record<string, string>;
  laterChapterImpact: string;
  sourceFile: string;
  sourceLinks: SourceLink[];
  moveLogicRules: MoveLogicRule[];
  hiddenChecks: string[];
}

export const realityRuleOrder: RealityOutcome[] = ["Intervention Point", "Ripple Event", "Missed Intervention Point"];

export function branchRuleFor(branch: ChapterBranch, outcome: RealityOutcome): MoveLogicRule {
  return branch.moveLogicRules.find((rule) => rule.outcome === outcome) ?? branch.moveLogicRules[0];
}

export function sourceLinksForBranch(branch: ChapterBranch, echoLinks: SourceLink[] = []): SourceLink[] {
  const seen = new Set<string>();
  return [...branch.sourceLinks, ...echoLinks].filter((link) => {
    if (seen.has(link.sourceFile)) return false;
    seen.add(link.sourceFile);
    return true;
  });
}
