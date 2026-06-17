import type { ActiveAgent, AgentData, Mode, SeedKey } from "./types";

const seedKeys: SeedKey[] = ["A", "B", "C"];

export function chooseRandomSeed(): SeedKey {
  return seedKeys[Math.floor(Math.random() * seedKeys.length)];
}

export function buildActiveAgents(
  agents: AgentData[],
  mode: Mode,
  selectedSeeds: Record<string, SeedKey>,
): ActiveAgent[] {
  return agents.map((agent) => {
    const activeSeed = mode === "mystery" ? chooseRandomSeed() : selectedSeeds[agent.id] ?? "A";

    return {
      ...agent,
      activeSeed,
      revealed: mode !== "mystery",
      pressure: { witness: 0, namedWeight: 0, institution: 0, concern: 0 },
    };
  });
}

export function seedDisplay(agent: ActiveAgent, mode: Mode): string {
  if (mode === "mystery" && !agent.revealed) {
    return "Hidden by Mystery mode";
  }

  const seed = agent.seeds[agent.activeSeed];
  return `Life ${agent.activeSeed}: ${seed.label}`;
}
