import { describe, expect, it, vi } from "vitest";
import agentsJson from "../data/agents.json";
import layerCardsJson from "../data/layerCards.json";
import rulesJson from "../data/rules.json";
import storyBouldersJson from "../data/storyBoulders.json";
import { archiveDocumentBySourceFile, archiveDocuments, nextArchiveDocument } from "../data/archiveDocuments";
import { howToPlaySteps } from "../components/HowToPlayPanel";
import { formatMetricDelta, formatMetricValue, formatPercent } from "./formatting";
import { buildActiveAgents } from "./memorySystem";
import { advanceTurn } from "./ruleEngine";
import { createRunState } from "./runState";
import { buildMarkdownRunLog } from "./runLog";
import { introduceStoryBoulder } from "./storyTurnEngine";
import {
  buildStoryActionPreview,
  explainLayerCard,
  explainStoryBoulder,
  storyBoulderById,
  validateAgentStoryProfiles,
  validateLayerCardData,
  validateStoryBoulderData,
} from "./storyObjects";
import { pressureBuildMessages } from "./lawProgress";
import { classifyObserverInput } from "./observerInput";
import { explainAgent, explainHalo, explainMeter } from "./explanations";
import { createTurnInterpretation } from "./interpretationEngine";
import {
  appendMetricSnapshot,
  buildSocietySummary,
  calculateRealityMetrics,
  deriveHaloState,
} from "./realityMetrics";
import type { AgentData, LayerCard, RealityMetricSnapshot, RulesData, SeedKey, StoryBoulder } from "./types";

const agents = agentsJson as AgentData[];
const layerCards = layerCardsJson as LayerCard[];
const rules = rulesJson as RulesData;
const storyBoulders = storyBouldersJson as StoryBoulder[];
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

describe("Boulder Build v0.8", () => {
  it("loads source-derived story Boulder data", () => {
    expect(validateStoryBoulderData(storyBoulders)).toBe(true);
    expect(storyBoulders.length).toBeGreaterThanOrEqual(8);
    expect(storyBoulders.length).toBeLessThanOrEqual(15);
    expect(storyBoulders.some((boulder) => boulder.sourceFile === "INTERVENTION ARG/Chapter 03.md")).toBe(true);
  });

  it("loads source-derived layer card data", () => {
    expect(validateLayerCardData(layerCards)).toBe(true);
    expect(layerCards.some((card) => card.id === "boundary")).toBe(true);
    expect(layerCards.some((card) => card.sourceFile === "NOTES/WEATHER_LAYER.md")).toBe(true);
  });

  it("loads source-linked character story profiles", () => {
    expect(validateAgentStoryProfiles(agents, storyBoulders, layerCards)).toBe(true);
    expect(agents.find((agent) => agent.id === "mara")?.associatedBoulders).toContain(
      "trigger-is-not-instruction",
    );
    expect(agents.find((agent) => agent.id === "dev")?.preferredLayers).toContain("geometry-as-consequence");
  });

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

  it("classifies origin phrases as Myth Seed", () => {
    expect(classifyObserverInput("BIG BANG", 1).classification).toBe("Myth Seed");
    expect(classifyObserverInput("The Beginning", 1).classification).toBe("Myth Seed");
    expect(classifyObserverInput("Origin Event", 1).classification).toBe("Myth Seed");
    expect(classifyObserverInput("First Light", 1).classification).toBe("Myth Seed");
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

  it("selecting a story Boulder changes turn output", () => {
    const state = newRun();
    const boulder = storyBoulderById(storyBoulders, "complete-consequence");
    expect(boulder).toBeDefined();

    const next = introduceStoryBoulder(state, boulder!, layerCards, rules, "jamal");

    expect(next.lastTurnFeedback?.processedAction).toBe("Introduce Complete Consequence");
    expect(next.events.some((event) => event.text.includes("Complete Consequence"))).toBe(true);
    expect(next.lastTurnFeedback?.interpretation.roomInterpretation).toContain("architecture");
  });

  it("selected character affects story reaction text", () => {
    const state = newRun("C");
    const boulder = storyBoulderById(storyBoulders, "decorative-door");
    expect(boulder).toBeDefined();

    const next = introduceStoryBoulder(state, boulder!, layerCards, rules, "dev");

    expect(next.lastTurnFeedback?.agentReactions.some((reaction) => reaction.includes("Dev"))).toBe(true);
    expect(next.lastTurnFeedback?.agentReactions.some((reaction) => reaction.includes("door can exist"))).toBe(true);
    expect(next.interpretationHistory[0].targetCharacterId).toBe("dev");
  });

  it("story-derived Boulder creates meter changes", () => {
    const state = newRun();
    const boulder = storyBoulderById(storyBoulders, "echo-faster-than-context");
    expect(boulder).toBeDefined();

    const next = introduceStoryBoulder(state, boulder!, layerCards, rules, "maren");

    expect(next.pressures.witness).toBeGreaterThan(state.pressures.witness);
    expect(next.pressures.namedWeight).toBeGreaterThan(state.pressures.namedWeight);
    expect(next.meterHistory.slice(-1)[0].rufs).toBeGreaterThan(state.meterHistory.slice(-1)[0].rufs);
  });

  it("records clear turn feedback after advancing a ripple", () => {
    const state = newRun();
    const next = advanceTurn(state, "observe", rules);

    expect(next.lastTurnFeedback?.processedAction).toBe("Observe the Boulder");
    expect(next.lastTurnFeedback?.pressureChanges.some((change) => change.key === "witness")).toBe(true);
    expect(next.lastTurnFeedback?.agentReactionCount).toBe(agents.length);
    expect(next.lastTurnFeedback?.lawProgress.length).toBeGreaterThan(0);
    expect(next.lastTurnFeedback?.metrics.rufs).toBeGreaterThan(0);
    expect(next.lastTurnFeedback?.interpretation.roomInterpretation).toContain("Attention");
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
    expect(next.events.some((event) => event.type === "social" && event.text.includes("safety, control, or enforcement"))).toBe(true);
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

  it("explains meters in plain language with recent change context", () => {
    const state = advanceTurn(newRun(), "move", rules);
    const explanation = explainMeter(
      "concern",
      state.meterHistory,
      state.lastTurnFeedback?.interpretation.roomInterpretation,
    );

    expect(explanation.title).toBe("Concern");
    expect(explanation.summary).toContain("Concern is");
    expect(explanation.details.join(" ")).toContain("risky or unstable");
    expect(explanation.details.join(" ")).toContain("changed path");
    expect(explanation.currentValue).toBeDefined();
    expect(explanation.delta).toMatch(/[+-]?\d/);
  });

  it("formats metric values without long floating point artifacts", () => {
    expect(formatMetricValue(22.200000000000003)).toBe("22.2");
    expect(formatMetricDelta(9.000000000000002)).toBe("+9");
    expect(formatMetricValue(14.75)).toBe("14.8");
    expect(formatMetricValue(100)).toBe("100");
    expect(formatPercent(33.3333333333)).toBe("33.3%");
  });

  it("Story Weight Inspect payload includes title, meaning, source, effects, and next action", () => {
    const boulder = storyBoulderById(storyBoulders, "closed-door-saved-life");
    expect(boulder).toBeDefined();

    const explanation = explainStoryBoulder(boulder!);

    expect(explanation.title).toBe("The Closed Door");
    expect(explanation.plainLanguageMeaning).toContain("closed door");
    expect(explanation.sourceFile).toBe("INTERVENTION ARG/Chapter 07.md");
    expect(explanation.affects?.join(" ")).toContain("Witness");
    expect(explanation.suggestedNextAction).toContain("Read Source");
  });

  it("Layer Card Inspect payload includes plain-language explanation", () => {
    const card = layerCards.find((entry) => entry.id === "masking") ?? layerCards[0];
    const explanation = explainLayerCard(card);

    expect(explanation.title).toBe(card.name);
    expect(explanation.plainLanguageMeaning).toBe(card.plainLanguageMeaning);
    expect(explanation.whyItMatters).toBe(card.inspectorExplanation);
    expect(explanation.affects?.join(" ")).toContain(card.relatedMeters[0]);
  });

  it("character inspect payload includes halo and current state information", () => {
    const state = newRun();
    const explanation = explainAgent(state.agents[0], state.mode);

    expect(explanation.typeLabel).toBe("Character Piece");
    expect(explanation.currentContext).toContain("No last-turn reaction yet");
    expect(explanation.details.join(" ")).toContain("Token identity");
    expect(explanation.details.join(" ")).toContain("Current carried pressure");
  });

  it("action preview updates based on selected Story Weight and target", () => {
    const state = newRun();
    const boulder = storyBoulderById(storyBoulders, "closed-door-saved-life");
    expect(boulder).toBeDefined();

    const roomPreview = buildStoryActionPreview(boulder);
    const targetPreview = buildStoryActionPreview(boulder, state.agents.find((agent) => agent.id === "dev"));

    expect(roomPreview).toContain("room itself");
    expect(targetPreview).toContain("Dev");
    expect(targetPreview).toContain("connected");
    expect(targetPreview).toContain("Source:");
  });

  it("How to Play copy includes the Story Weight loop", () => {
    expect(howToPlaySteps.join(" ")).toContain("Choose a Story Weight");
    expect(howToPlaySteps.join(" ")).toContain("Read the Action Preview");
    expect(howToPlaySteps.join(" ")).toContain("Use Archive View");
  });

  it("archive documents load with chapter ordering", () => {
    expect(archiveDocuments.length).toBeGreaterThan(20);
    expect(archiveDocuments[0].sourceFile).toBe("INTERVENTION ARG/ORDER.md");
    expect(archiveDocuments.find((document) => document.sourceFile === "INTERVENTION ARG/Chapter 01.md")?.order).toBe(1);
    expect(nextArchiveDocument(archiveDocuments[0].id, 1).sourceFile).toBe("INTERVENTION ARG/PROLOGUE.md");
  });

  it("Story Weight sourceFile maps to Archive document and Read Source resolves", () => {
    const boulder = storyBoulderById(storyBoulders, "trigger-is-not-instruction");
    expect(boulder).toBeDefined();
    const document = archiveDocumentBySourceFile(boulder?.sourceFile);

    expect(document?.sourceFile).toBe("INTERVENTION ARG/Chapter 02.md");
    expect(document?.content).toContain("# Trigger");
    expect(document?.relatedStoryWeights).toContain("trigger-is-not-instruction");
  });

  it("explains halo states in plain language", () => {
    const explanation = explainHalo("clipped");

    expect(explanation.title).toContain("Perception overload");
    expect(explanation.summary).toContain("unstable or too loud");
  });

  it("creates contextual interpretation for Artifact Name", () => {
    const observerInput = classifyObserverInput("Stone Anchor", 1);
    const interpretation = createTurnInterpretation(newRun(), "name", 1, observerInput);

    expect(interpretation.roomInterpretation).toContain("label or a handle");
  });

  it("creates contextual interpretation for Crisis Label", () => {
    const observerInput = classifyObserverInput("Crop Thief", 1);
    const interpretation = createTurnInterpretation(newRun(), "name", 1, observerInput);

    expect(interpretation.roomInterpretation).toContain("threat, a warning, or a scapegoat");
  });

  it("creates contextual interpretation for Policy Proposal", () => {
    const observerInput = classifyObserverInput("Add Security agents to crop fields to prevent theft", 1);
    const interpretation = createTurnInterpretation(newRun(), "name", 1, observerInput);

    expect(interpretation.roomInterpretation).toContain("safety, control, or enforcement");
  });

  it("creates contextual interpretation for Myth Seed and Era Marker", () => {
    const mythInput = classifyObserverInput("BIG BANG", 1);
    const eraInput = classifyObserverInput("Scientific Breakthrough in science and technology", 1);

    expect(createTurnInterpretation(newRun(), "name", 1, mythInput).roomInterpretation).toContain("origin");
    expect(createTurnInterpretation(newRun(), "name", 1, eraInput).roomInterpretation).toContain("new period");
  });

  it("progresses interpretation across related turns", () => {
    const first = advanceTurn(newRun(), "name", rules, { boulderName: "BIG BANG" });
    const second = advanceTurn(first, "name", rules, { boulderName: "Origin Event" });
    const third = advanceTurn(second, "name", rules, { boulderName: "Creation Point" });

    expect(first.interpretationHistory[0].stage).toBe("opens");
    expect(second.interpretationHistory[1].stage).toBe("narrows");
    expect(third.interpretationHistory[2].stage).toBe("stabilizes");
    expect(third.interpretationHistory[2].roomInterpretation).toContain("origin story");
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
    expect(markdown).toContain("## Interpretation History");
    expect(markdown).toContain("label or a handle");
    expect(markdown).toContain("## Event Log");
    expect(markdown).toContain("## Final Meters");
    expect(markdown).toContain("Named Weight:");
    expect(markdown).toContain("RUFS:");
    expect(markdown).toContain("Mood Output:");
    expect(markdown).toContain("## Final Reality Layers");
    expect(markdown).toContain("## Laws Formed");
    expect(markdown).toContain("[Base]");
  });

  it("Markdown export includes Story Objects Used", () => {
    const boulder = storyBoulderById(storyBoulders, "trigger-is-not-instruction");
    expect(boulder).toBeDefined();
    const state = introduceStoryBoulder(newRun(), boulder!, layerCards, rules, "mara");
    const markdown = buildMarkdownRunLog(state);

    expect(markdown).toContain("## Story Objects Used");
    expect(markdown).toContain("Turn 1: Trigger Is Not Instruction");
    expect(markdown).toContain("Source: INTERVENTION ARG/Chapter 02.md");
    expect(markdown).toContain("Target: Mara");
    expect(markdown).toContain("Feeling activated is real");
    expect(markdown).toContain("## Story Sources Used");
    expect(markdown).toContain("Source File: INTERVENTION ARG/Chapter 02.md");
    expect(markdown).toContain("Resulting Interpretation:");
  });
});
