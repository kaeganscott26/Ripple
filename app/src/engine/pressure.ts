import type { PressureChange, PressureValues } from "./types";

export const pressureKeys: Array<keyof PressureValues> = ["witness", "namedWeight", "institution", "concern"];

export const pressureLabels: Record<keyof PressureValues, string> = {
  witness: "Witness",
  namedWeight: "Named Weight",
  institution: "Institutional",
  concern: "Concern",
};

export function pressureChanges(before: PressureValues, after: PressureValues): PressureChange[] {
  return pressureKeys
    .map((key) => ({
      key,
      label: pressureLabels[key],
      before: before[key],
      after: after[key],
      delta: after[key] - before[key],
    }))
    .filter((change) => change.delta !== 0);
}
