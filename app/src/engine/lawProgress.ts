import { pressureKeys, pressureLabels } from "./pressure";
import { formatMetricValue } from "./formatting";
import type { PressureValues, RulesData, RunState } from "./types";

export interface LawProgressEntry {
  id: string;
  name: string;
  description: string;
  formed: boolean;
  formedTurn?: number;
  thresholdStatus: Array<{
    key: keyof PressureValues;
    label: string;
    current: number;
    target: number;
    remaining: number;
  }>;
}

export function getLawProgress(state: RunState, rules: RulesData): LawProgressEntry[] {
  return Object.entries(rules.laws).map(([id, law]) => {
    const formedLaw = state.laws.find((entry) => entry.id === id);
    const thresholdStatus = pressureKeys
      .filter((key) => law.thresholds[key] !== undefined)
      .map((key) => {
        const target = Number(law.thresholds[key]);
        const current = state.pressures[key];
        return {
          key,
          label: pressureLabels[key],
          current,
          target,
          remaining: Math.max(target - current, 0),
        };
      });

    return {
      id,
      name: law.name,
      description: law.description,
      formed: Boolean(formedLaw),
      formedTurn: formedLaw?.formedTurn,
      thresholdStatus,
    };
  });
}

export function pressureBuildMessages(state: RunState): string[] {
  return pressureKeys.map((key) => `${pressureLabels[key]} pressure: ${formatMetricValue(state.pressures[key])}`);
}

export function lawProgressMessages(state: RunState, rules: RulesData): string[] {
  return getLawProgress(state, rules).map((entry) => {
    if (entry.formed) {
      return `${entry.name} formed on turn ${entry.formedTurn}.`;
    }

    const status = entry.thresholdStatus
      .map((threshold) => `${threshold.label} ${formatMetricValue(threshold.current)}/${formatMetricValue(threshold.target)}`)
      .join(", ");
    const remaining = entry.thresholdStatus
      .filter((threshold) => threshold.remaining > 0)
      .map((threshold) => `${formatMetricValue(threshold.remaining)} more ${threshold.label}`)
      .join(" and ");

    return `${entry.name} is building: ${status}${remaining ? `. Needs ${remaining}.` : "."}`;
  });
}
