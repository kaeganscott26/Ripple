import { describe, expect, it, vi } from "vitest";
import agentsJson from "../data/agents.json";
import rulesJson from "../data/rules.json";
import { buildActiveAgents } from "./memorySystem";
import { advanceTurn } from "./ruleEngine";
import { createRunState } from "./runState";
import { buildMarkdownRunLog } from "./runLog";
import { pressureBuildMessages } from "./lawProgress";
import { classifyObserverInput } from "./observerInput";
import {
  appendMetricSnapshot,
  buildSocietySummary,
  calculateRealityMetrics,
  deriveHaloState,
} from "./realityMetrics";
import type { AgentData, RealityMetricSnapshot, RulesData, SeedKey } from "./types";

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

describe("Boulder Build v0.5", () => {
  it("classifies Artifact Name observer input", () => {
    expect(classifyObserverInput("Stone Anchor", 1).classification).toBe("Artifact Name");
  });

  it("classifies Crisis Label observer input", () => {
    expect(classifyObserverInput("Food Drought", 1).classification).toBe("Crisis Label");
    expect(classifyObserverInput("Crop Thief", 1).classification).toBe("Crisis Label");
  });

  it("classifies Policy Proposal observer input", () => {
    expect(classifyObserverInput("Add Security agents to crop fields to prevent theft", 1).classification).toBe(
      "Policy Proposal",
    );
  });

  it("classifies Doctrine observer input", () => {
    expect(classifyObserverInput("The fields must be protected", 1).classification).toBe("Doctrine");
  });

  it("classifies Era Marker observer input", () => {
    expect(classifyObserverInput("Scientific Breakthrough in science and technology", 1).classification).toBe(
      "Era Marker",
    );
  });

  it("classifies Myth Seed observer input", () => {
    expect(classifyObserverInput("The first theft created the Watchers", 1).classification).toBe("Myth Seed");
  });

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
    expect(next.lastTurnFeedback?.metrics.rufs).toBeGreaterThan(0);
  });

  it("Naming the Boulder increases named weight pressure", () => {
    const state = newRun();
    const next = advanceTurn(state, "name", rules, { boulderName: "Burden" });

    expect(next.pressures.namedWeight).toBeGreaterThan(state.pressures.namedWeight);
    expect(next.boulderName).toBe("Burden");
    expect(next.events.some((event) => event.text.includes('"Burden"'))).toBe(true);
  });

  it("Turn Feedback includes classification after naming", () => {
    const state = newRun();
    const next = advanceTurn(state, "name", rules, {
      boulderName: "Add Security agents to crop fields to prevent theft",
    });

    expect(next.lastTurnFeedback?.observerInput?.classification).toBe("Policy Proposal");
    expect(next.lastTurnFeedback?.observerInput?.interpretationNote).toContain("trying to govern the room");
    expect(next.events.some((event) => event.type === "observer" && event.text.includes("Policy Proposal"))).toBe(true);
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

  it("calculates RUFS as perceived reality pressure rises", () => {
    const state = newRun();
    const named = advanceTurn(state, "name", rules, { boulderName: "Food Drought" });

    expect(named.meterHistory.slice(-1)[0]?.rufs).toBeGreaterThan(state.meterHistory.slice(-1)[0]?.rufs ?? 0);
    expect(named.meterHistory.slice(-1)[0]?.meaning).toBeGreaterThan(state.meterHistory.slice(-1)[0]?.meaning ?? 0);
  });

  it("treats mood as an output of underlying pressure drivers", () => {
    const calm = calculateRealityMetrics(newRun());
    const pressured = calculateRealityMetrics({
      ...newRun(),
      pressures: { witness: 0, namedWeight: 0, institution: 10, concern: 10 },
    });

    expect(pressured.mood).toBeLessThan(calm.mood);
    expect(pressured.safety).toBeLessThan(calm.safety);
  });

  it("derives readable halo states from agent pressure", () => {
    expect(deriveHaloState({ witness: 0, namedWeight: 0, institution: 0, concern: 0 })).toBe("dim");
    expect(deriveHaloState({ witness: 2, namedWeight: 0, institution: 0, concern: 0 })).toBe("bright");
    expect(deriveHaloState({ witness: 8, namedWeight: 0, institution: 0, concern: 0 })).toBe("pulsing");
    expect(deriveHaloState({ witness: 1, namedWeight: 4, institution: 4, concern: 0 })).toBe("double");
    expect(deriveHaloState({ witness: 1, namedWeight: 1, institution: 0, concern: 6 })).toBe("clipped");
  });

  it("keeps compact metric history for trend strips", () => {
    const history = Array.from({ length: 10 }, (_, index): RealityMetricSnapshot => ({
      ...calculateRealityMetrics(newRun()),
      turn: index,
      rufs: index,
    })).reduce<RealityMetricSnapshot[]>((acc, snapshot) => appendMetricSnapshot(acc, snapshot), []);

    expect(history).toHaveLength(8);
    expect(history[0].turn).toBe(2);
    expect(history[7].turn).toBe(9);
  });

  it("summarizes Society View from current Boulder Room state", () => {
    const named = advanceTurn(newRun(), "name", rules, { boulderName: "The first theft created the Watchers" });
    const summary = buildSocietySummary(named);

    expect(summary.frameQuestion).toContain("larger frame");
    expect(summary.observerEffect).toContain("Myth Seed");
    expect(summary.nestedStatus).toContain("Inner Board");
  });

  it("Markdown export includes mode, memory seeds, event log, meters, reality layers, laws, Boulder state, and Observer Inputs", () => {
    const named = advanceTurn(newRun(), "name", rules, { boulderName: "Anchor" });
    const markdown = buildMarkdownRunLog(named);

    expect(markdown).toContain("Run Mode: experimental");
    expect(markdown).toContain("Turn Count: 1");
    expect(markdown).toContain("Boulder Name: Anchor");
    expect(markdown).toContain("Boulder Position: center");
    expect(markdown).toContain("## Active Memory Seeds");
    expect(markdown).toContain("Mara: Life A - Scarcity");
    expect(markdown).toContain("## Observer Inputs");
    expect(markdown).toContain('Turn 1: "Anchor"');
    expect(markdown).toContain("Classification: Artifact Name");
    expect(markdown).toContain("## Event Log");
    expect(markdown).toContain("## Final Meters");
    expect(markdown).toContain("Named Weight:");
    expect(markdown).toContain("RUFS:");
    expect(markdown).toContain("Mood Output:");
    expect(markdown).toContain("## Final Reality Layers");
    expect(markdown).toContain("## Laws Formed");
    expect(markdown).toContain("[Base]");
  });
});
