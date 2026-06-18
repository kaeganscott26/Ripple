import type { DiceRoll, RealityOutcome } from "../../engine/types";
import { artifactDieResult } from "./artifacts";

export function realityOutcomeForDie(die: number): RealityOutcome {
  if (die <= 2) return "Intervention Point";
  if (die <= 4) return "Ripple Event";
  return "Missed Intervention Point";
}

export function rollCanonDice(random: () => number = Math.random, artifactHooks: string[] = []): DiceRoll {
  const dieA = Math.floor(random() * 6) + 1;
  const dieB = Math.floor(random() * 6) + 1;
  const realityDie = Math.floor(random() * 6) + 1;
  const artifactDie = Math.floor(random() * 6) + 1;
  const realityOutcome = realityOutcomeForDie(realityDie);
  const artifact = artifactDieResult(artifactDie, artifactHooks, realityOutcome);

  return {
    dieA,
    dieB,
    total: dieA + dieB,
    realityDie,
    artifactDie,
    realityOutcome,
    artifact,
  };
}

export const diceRuleSummary = [
  "Dice 1 and 2 move the current character.",
  "Dice 3 renders the landing as an Intervention Point, Ripple Event, or Missed Intervention Point.",
  "Dice 4 decides whether an artifact enters and bends the result.",
];
