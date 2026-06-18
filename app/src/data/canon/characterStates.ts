import type {
  BoardLanding,
  BranchId,
  BranchMechanic,
  BranchRunState,
  KaeganAvailability,
} from "../../engine/types";
import { branchForId, branchForSourceFile } from "./chapterBranches";
import { kaeganAvailabilityFor } from "./kaegan";

export function createInitialBranchRunState(): BranchRunState {
  const originBranchId: BranchId = "chapter-01-canon";

  return {
    activeBranchesByChapter: { 1: originBranchId },
    originBranchId,
    builderPathOpen: true,
    activeMechanics: ["Origin Branch", "Builder Path"],
    characterStates: {},
    kaeganAvailability: kaeganAvailabilityFor(originBranchId, true),
  };
}

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function nextOriginBranch(current: BranchRunState, branchId: BranchId): { originBranchId: BranchId; builderPathOpen: boolean } {
  if (branchId === "chapter-01-a") return { originBranchId: branchId, builderPathOpen: false };
  if (branchId === "chapter-01-b") return { originBranchId: branchId, builderPathOpen: current.builderPathOpen };
  return { originBranchId: current.originBranchId, builderPathOpen: current.builderPathOpen };
}

export function branchStateAfterLanding(current: BranchRunState, landing: BoardLanding): BranchRunState {
  const branch = branchForSourceFile(landing.sourceFile);
  if (!branch) return current;

  const origin = nextOriginBranch(current, branch.id);
  const activeBranchesByChapter = {
    ...current.activeBranchesByChapter,
    [branch.chapterId]: branch.id,
  };
  const activeMechanics = unique([
    ...current.activeMechanics,
    ...branch.unlockedMechanics,
    ...(landing.branchMechanicsTriggered ?? []),
  ]).slice(-24) as BranchMechanic[];
  const characterStates = { ...current.characterStates };

  (landing.characterStateChanges ?? []).forEach((change) => {
    characterStates[landing.agentId] = unique([...(characterStates[landing.agentId] ?? []), change]).slice(-8);
  });

  if (branch.id === "chapter-08-a") {
    characterStates.kaegan = unique([...(characterStates.kaegan ?? []), "Boundary State", "Love As Load"]);
  }
  if (branch.id === "chapter-08-b" && origin.originBranchId !== "chapter-01-a") {
    characterStates.kaegan = unique([...(characterStates.kaegan ?? []), "Player 0826", "Safe Invitation"]);
  }

  const kaeganAvailability = kaeganAvailabilityAfterBranch(branch.id, origin.originBranchId, origin.builderPathOpen);

  return {
    activeBranchesByChapter,
    originBranchId: origin.originBranchId,
    builderPathOpen: origin.builderPathOpen,
    activeMechanics,
    characterStates,
    kaeganAvailability,
  };
}

export function kaeganAvailabilityAfterBranch(
  branchId: BranchId,
  originBranchId: BranchId,
  builderPathOpen: boolean,
): KaeganAvailability {
  const base = kaeganAvailabilityFor(originBranchId, builderPathOpen);

  if (branchId === "chapter-08-b" && base.status !== "locked") {
    return {
      status: "unlocked",
      label: "Kaegan unlocked as Player 0826.",
      reason: "The gift was offered as a safe invitation, not a demand, and the active origin branch allows Kaegan to exist.",
      rule: "He enters only as a player, never as the father's cure.",
    };
  }

  if (branchId === "chapter-08-a" && base.status !== "locked") {
    return {
      status: "conditional",
      label: "Kaegan remains in Boundary State.",
      reason: "The birthday message carried too much emotional load, so silence, delay, or no reply must remain valid boundary data.",
      rule: "Love cannot unlock Player 0826 while it asks Kaegan to carry proof.",
    };
  }

  return base;
}

export function branchContextLine(state: BranchRunState, chapterId: number): string {
  const activeBranchId = state.activeBranchesByChapter[chapterId] ?? (`chapter-${String(chapterId).padStart(2, "0")}-canon` as BranchId);
  const activeBranch = branchForId(activeBranchId);

  return `${activeBranch.title}. Origin: ${branchForId(state.originBranchId).title}. ${state.kaeganAvailability.label}`;
}
