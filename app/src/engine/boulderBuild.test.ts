import { describe, expect, it, vi } from "vitest";
import agentsJson from "../data/agents.json";
import rulesJson from "../data/rules.json";
import { buildActiveAgents } from "./memorySystem";
import { advanceTurn } from "./ruleEngine";
import { createRunState } from "./runState";
import { buildMarkdownRunLog } from "./runLog";
import { pressureBuildMessages } from "./lawProgress";
import type { AgentData, RulesData, SeedKey } from "./types";

const agents = agentsJson as AgentData[];
const rules = rulesJson as RulesData;
const seedKeys: SeedKey[] = ["A", "B", "C"];

function selectedSeeds(seed: SeedKey = "A"): Record<string, SeedKey> {
  return agents.reduce<Record<string, SeedKey>>((acc, agent) => {
    acc[agent.id] = seed;
    return acc;
  }, {});
}

function newRun(seed: SeedKey = "A") {
  return createRunState(agents, { mode: "experimental", selectedSeeds: selectedSeeds(seed) });
}

describe("Boulder Build v0.3", () => {
  it("Mystery mode assigns valid A/B/C seeds", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const activeAgents = buildActiveAgents(agents, "mystery", selectedSeeds("A"));

    expect(activeAgents).toHaveLength(agents.length);
    expect(activeAgents.every((agent) => seedKeys.includes(agent.activeSeed))).toBe(true);
    expect(activeAgents.every((agent) => !agent.revealed)).toBe(true);

    vi.restoreAllMocks();
  });

  it("Vague mode uses selected seeds", () => {
    const activeAgents = buildActiveAgents(agents, "vague", selectedSeeds("B"));

    expect(activeAgents.every((agent) => agent.activeSeed === "B")).toBe(true);
    expect(activeAgents.every((agent) => agent.revealed)).toBe(true);
  });

  it("Experimental mode uses selected seeds", () => {
    const activeAgents = buildActiveAgents(agents, "experimental", selectedSeeds("C"));

    expect(activeAgents.every((agent) => agent.activeSeed === "C")).toBe(true);
    expect(activeAgents.every((agent) => agent.revealed)).toBe(true);
  });

  it("Observing the Boulder increases witness pressure", () => {
    const state = newRun();
    const next = advanceTurn(state, "observe", rules);

    expect(next.pressures.witness).toBeGreaterThan(state.pressures.witness);
  });

  it("records clear turn feedback after advancing a ripple", () => {
    const state = newRun();
    const next = advanceTurn(state, "observe", rules);

    expect(next.lastTurnFeedback?.processedAction).toBe("Observe the Boulder");
    expect(next.lastTurnFeedback?.pressureChanges.some((change) => change.key === "witness")).toBe(true);
    expect(next.lastTurnFeedback?.agentReactionCount).toBe(agents.length);
    expect(next.lastTurnFeedback?.lawProgress.length).toBeGreaterThan(0);
  });

  it("Naming the Boulder increases named weight pressure", () => {
    const state = newRun();
    const next = advanceTurn(state, "name", rules, { boulderName: "Burden" });

    expect(next.pressures.namedWeight).toBeGreaterThan(state.pressures.namedWeight);
    expect(next.boulderName).toBe("Burden");
    expect(next.events.some((event) => event.text.includes('"Burden"'))).toBe(true);
  });

  it("Moving the Boulder changes Boulder position", () => {
    const state = newRun();
    const next = advanceTurn(state, "move", rules);

    expect(next.boulderPosition).toBe("shifted");
  });

  it("Named Weight Law can form", () => {
    const firstName = advanceTurn(newRun("B"), "name", rules, { boulderName: "Consequence" });
    const next = advanceTurn(firstName, "name", rules, { boulderName: "Consequence" });

    expect(next.laws.some((law) => law.id === "named-weight-law")).toBe(true);
  });

  it("Witness Law can form", () => {
    const firstObservation = advanceTurn(newRun("C"), "observe", rules);
    const next = advanceTurn(firstObservation, "observe", rules);

    expect(next.laws.some((law) => law.id === "witness-law")).toBe(true);
  });

  it("reports pressure building before a law exists", () => {
    const messages = pressureBuildMessages(newRun());

    expect(messages).toEqual([
      "Witness pressure: 0",
      "Named Weight pressure: 0",
      "Institutional pressure: 0",
      "Concern pressure: 0",
    ]);
  });

  it("Markdown export includes mode, memory seeds, event log, meters, reality layers, laws, and Boulder state", () => {
    const named = advanceTurn(newRun(), "name", rules, { boulderName: "Anchor" });
    const markdown = buildMarkdownRunLog(named);

    expect(markdown).toContain("Run Mode: experimental");
    expect(markdown).toContain("Turn Count: 1");
    expect(markdown).toContain("Boulder Name: Anchor");
    expect(markdown).toContain("Boulder Position: center");
    expect(markdown).toContain("## Active Memory Seeds");
    expect(markdown).toContain("Mara: Life A - Scarcity");
    expect(markdown).toContain("## Event Log");
    expect(markdown).toContain("## Final Meters");
    expect(markdown).toContain("Named Weight:");
    expect(markdown).toContain("## Final Reality Layers");
    expect(markdown).toContain("## Laws Formed");
    expect(markdown).toContain("[Base]");
  });
});
