import type { AgentData, BranchId, KaeganAvailability } from "../../engine/types";

export const kaeganAgent: AgentData = {
  id: "kaegan",
  name: "Kaegan",
  role: "Player 0826, voluntary door, safe invitation receiver",
  identityCore: "A player with agency who can play, ignore, delay, laugh, leave, or return without becoming proof.",
  associatedBoulders: ["signal-released-no-receipt", "decorative-door", "boulder-protocol"],
  emotionalTriggers: ["forced reply", "proof-seeking", "surveillance gift", "father pressure"],
  preferredLayers: ["software-systems", "boundary", "dream-layer"],
  fearedLayers: ["father-layer", "attention-collapse"],
  interpretationTendencies: [
    "Checks whether the room lets him leave.",
    "Treats no rush as real only if no one follows up for proof.",
    "Receives play better than confession.",
  ],
  boulderReactions: {
    "signal-released-no-receipt": "Receives the signal only if receipt is not demanded.",
    "decorative-door": "Tests whether the door can close without punishment.",
    "boulder-protocol": "Checks whether the gift protects agency or asks him to carry someone else.",
  },
  seeds: {
    A: {
      label: "Boundary",
      compactMemory: "A loving message can still be too heavy to hold.",
      fear: "Being made responsible for the sender's relief.",
      desire: "A door he can open or close without consequence.",
      distortion: "Hears too much explanation as a hidden demand.",
      triggerTags: ["pressure", "boundary", "ignored", "father"],
      reactionWeights: { witness: 1, namedWeight: 1, institution: 0, concern: 2 },
    },
    B: {
      label: "Player 0826",
      compactMemory: "A game is safer when the player can leave it.",
      fear: "A gift that reports his reaction back as proof.",
      desire: "A playable room with no receipt required.",
      distortion: "Tests invitations by waiting before entering.",
      triggerTags: ["moved", "access", "software", "door"],
      reactionWeights: { witness: 1, namedWeight: 2, institution: 0, concern: 1 },
    },
    C: {
      label: "Come Back Later",
      compactMemory: "Delay can be agency, not rejection.",
      fear: "Being turned into a symbol before he chooses anything.",
      desire: "Permission to laugh, leave, or return.",
      distortion: "Closes doors quickly if the room feels hungry.",
      triggerTags: ["observed", "receipt", "boundary", "signal"],
      reactionWeights: { witness: 2, namedWeight: 1, institution: 0, concern: 1 },
    },
  },
};

export function kaeganAvailabilityFor(originBranchId: BranchId, builderPathOpen: boolean): KaeganAvailability {
  if (originBranchId === "chapter-01-a") {
    return {
      status: "locked",
      label: "Kaegan unavailable in this run.",
      reason:
        "Teodor/Scott was never adopted in the active origin branch, so the lineage path that creates Player 0826 does not exist.",
      rule: "Do not describe Kaegan as dead or missing. He simply never becomes part of this branch reality.",
    };
  }

  if (originBranchId === "chapter-01-b") {
    return {
      status: builderPathOpen ? "conditional" : "locked",
      label: builderPathOpen ? "Kaegan may unlock if Builder Path remains open." : "Kaegan unavailable in this run.",
      reason: builderPathOpen
        ? "The late-adoption origin still allows Teodor/Scott to become the builder, but Player 0826 remains conditional."
        : "The late-adoption Builder Path closed before Player 0826 could become part of this run.",
      rule: "He enters only as a player, never as the father's cure.",
    };
  }

  return {
    status: "unlocked",
    label: "Kaegan available as Player 0826.",
    reason: "The canon adoption origin allows the lineage path that can create Player 0826.",
    rule: "He enters only as a player, never as the father's cure.",
  };
}
