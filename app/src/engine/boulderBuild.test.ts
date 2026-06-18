import { describe, expect, it, vi } from "vitest";
import agentsJson from "../data/agents.json";
import layerCardsJson from "../data/layerCards.json";
import rulesJson from "../data/rules.json";
import storyBouldersJson from "../data/storyBoulders.json";
import { archiveDocumentBySourceFile, archiveDocuments, nextArchiveDocument } from "../data/archiveDocuments";
import { buildStorySpaces } from "../data/boardSpaces";
import { branchForSourceFile, branchesForChapter, chapterBranches } from "../data/canon/chapterBranches";
import { createInitialBranchRunState } from "../data/canon/characterStates";
import { kaeganAvailabilityFor } from "../data/canon/kaegan";
import { revealSectionsForMode } from "../data/canon/moveResolution";
import { ActiveInspectionSummary } from "../components/ActiveInspectionSummary";
import { howToPlaySteps } from "../components/HowToPlayPanel";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { formatMetricDelta, formatMetricValue, formatPercent } from "./formatting";
import { buildActiveAgents } from "./memorySystem";
import {
  landingPosition,
  possibleLandingSpaces,
  resolveBoardTurn,
  rollDice,
} from "./boardTurnEngine";
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
import type { AgentData, DiceRoll, LayerCard, RealityMetricSnapshot, RulesData, SeedKey, StoryBoulder } from "./types";

const agents = agentsJson as AgentData[];
const layerCards = layerCardsJson as LayerCard[];
const rules = rulesJson as RulesData;
const storyBoulders = storyBouldersJson as StoryBoulder[];
const storySpaces = buildStorySpaces(storyBoulders, layerCards);
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

function newRunForMode(mode: "mystery" | "vague" | "experimental") {
  return createRunState(agents, { mode, selectedSeeds: selectedSeeds("A") });
}

function testRoll(dieA: number, dieB: number, realityDie = 1, artifactDie = 1): DiceRoll {
  return {
    dieA,
    dieB,
    total: dieA + dieB,
    realityDie,
    artifactDie,
    realityOutcome: realityDie <= 2 ? "Intervention Point" : realityDie <= 4 ? "Ripple Event" : "Missed Intervention Point",
    artifact: {
      die: artifactDie,
      artifactName: "No Artifact",
      effectType: "none",
      effectText: "No artifact enters this turn.",
    },
  };
}

function landOnSource(sourceFile: string, realityDie = 1, artifactDie = 1, mode: "mystery" | "vague" | "experimental" = "experimental") {
  const targetIndex = storySpaces.findIndex((space) => space.sourceFile === sourceFile);
  expect(targetIndex).toBeGreaterThanOrEqual(0);
  const fromPosition = (targetIndex - 2 + storySpaces.length) % storySpaces.length;
  const state = newRunForMode(mode);

  return resolveBoardTurn(
    {
      ...state,
      boardTurn: {
        ...state.boardTurn,
        boardPositions: { ...state.boardTurn.boardPositions, mara: fromPosition },
        characterPaths: {
          ...state.boardTurn.characterPaths,
          mara: { ...state.boardTurn.characterPaths.mara, currentPosition: fromPosition },
        },
      },
    },
    storySpaces,
    rules,
    testRoll(1, 1, realityDie, artifactDie),
  );
}

describe("Boulder Build v0.8.1", () => {
  it("loads branch causality data for chapters 1-8", () => {
    expect(chapterBranches).toHaveLength(24);

    for (let chapterId = 1; chapterId <= 8; chapterId += 1) {
      const branches = branchesForChapter(chapterId);

      expect(branches).toHaveLength(3);
      expect(branches.map((branch) => branch.branchLabel).sort()).toEqual(["alternate-a", "alternate-b", "canon"]);
      expect(branches.every((branch) => branch.moveLogicRules.length === 3)).toBe(true);
      expect(branches.every((branch) => branch.sourceFile.length > 0)).toBe(true);
    }
  });

  it("Chapter 1 branch 01A locks Kaegan", () => {
    const state = landOnSource("RIPPLE_CANON/ALTERNATES/ALTERNATE_01_THE_UNADOPTED_ROOM.md");

    expect(state.boardTurn.branchState.originBranchId).toBe("chapter-01-a");
    expect(state.boardTurn.branchState.kaeganAvailability.status).toBe("locked");
    expect(state.boardTurn.branchState.kaeganAvailability.reason).toContain("lineage path");
  });

  it("Chapter 1 canon allows Kaegan", () => {
    const state = createInitialBranchRunState();

    expect(state.originBranchId).toBe("chapter-01-canon");
    expect(state.kaeganAvailability.status).toBe("unlocked");
    expect(kaeganAvailabilityFor("chapter-01-canon", true).label).toContain("Player 0826");
  });

  it("Chapter 1 branch 01B conditionally allows Kaegan if Builder Path remains open", () => {
    const state = landOnSource("RIPPLE_CANON/ALTERNATES/ALTERNATE_01B_THE_BROADCAST_THAT_NEVER_REACHED.md");

    expect(state.boardTurn.branchState.originBranchId).toBe("chapter-01-b");
    expect(state.boardTurn.branchState.builderPathOpen).toBe(true);
    expect(state.boardTurn.branchState.kaeganAvailability.status).toBe("conditional");
    expect(kaeganAvailabilityFor("chapter-01-b", true).rule).toContain("never as the father's cure");
  });

  it("Chapter 8 branch 08A activates Love As Load and Boundary State", () => {
    const state = landOnSource("RIPPLE_CANON/ALTERNATES/ALTERNATE_08_THE_DATE_THAT_ANSWERED.md", 3, 2);
    const landing = state.boardTurn.landings[0];

    expect(landing.activeBranchId).toBe("chapter-08-a");
    expect(landing.branchMechanicsTriggered).toEqual(expect.arrayContaining(["Love As Load", "Boundary State"]));
    expect(state.boardTurn.branchState.characterStates.kaegan).toEqual(expect.arrayContaining(["Boundary State", "Love As Load"]));
    expect(landing.sceneConsequence).toContain("love and load");
  });

  it("Chapter 8 branch 08B unlocks Player 0826 and Safe Invitation", () => {
    const state = landOnSource("RIPPLE_CANON/ALTERNATES/ALTERNATE_08B_THE_GAME_THAT_REACHED_HIM.md", 3, 2);
    const landing = state.boardTurn.landings[0];

    expect(landing.activeBranchId).toBe("chapter-08-b");
    expect(landing.branchMechanicsTriggered).toEqual(expect.arrayContaining(["Player 0826", "Safe Invitation"]));
    expect(state.boardTurn.branchState.kaeganAvailability.status).toBe("unlocked");
    expect(state.agents.some((agent) => agent.id === "kaegan")).toBe(true);
    expect(landing.sceneConsequence).toContain("lets Kaegan leave");
  });

  it("does not use generic reveal text when branch-specific move lore exists", () => {
    const state = landOnSource("RIPPLE_CANON/ALTERNATES/ALTERNATE_03B_THE_STUDENT_WHO_MAPPED_THE_ROOM.md");
    const landing = state.boardTurn.landings[0];
    const revealText = [landing.sceneConsequence, landing.characterEffect, landing.resultText].join(" ");

    expect(branchForSourceFile(landing.sourceFile)?.id).toBe("chapter-03-b");
    expect(revealText).not.toContain("This alternate teaches the board");
    expect(revealText).not.toContain("reads as form pressure");
    expect(revealText).toContain("Jamal");
    expect(revealText).toContain("records the gap");
  });

  it("run log includes branch id and source file", () => {
    const state = landOnSource("RIPPLE_CANON/ALTERNATES/ALTERNATE_08B_THE_GAME_THAT_REACHED_HIM.md", 1, 3);
    const markdown = buildMarkdownRunLog(state);

    expect(markdown).toContain("chapter-08-b - 08B - The Game That Reached Him");
    expect(markdown).toContain("RIPPLE_CANON/ALTERNATES/ALTERNATE_08B_THE_GAME_THAT_REACHED_HIM.md");
    expect(markdown).toContain("Branch mechanics triggered:");
    expect(markdown).toContain("Safe Invitation");
  });

  it("Mystery, Vague, and Experimental modes expose the right amount of branch info", () => {
    const state = landOnSource("RIPPLE_CANON/ALTERNATES/ALTERNATE_08B_THE_GAME_THAT_REACHED_HIM.md", 1, 3);
    const landing = state.boardTurn.landings[0];
    const mysteryLabels = revealSectionsForMode("mystery", landing).map((section) => section.label);
    const vagueLabels = revealSectionsForMode("vague", landing).map((section) => section.label);
    const experimentalLabels = revealSectionsForMode("experimental", landing).map((section) => section.label);

    expect(mysteryLabels).toEqual(["Turn Summary", "Landing Space", "Scene Consequence", "Result", "Read Source"]);
    expect(vagueLabels).toContain("Branch Context");
    expect(vagueLabels).not.toContain("Hidden Checks");
    expect(experimentalLabels).toContain("Hidden Checks");
    expect(experimentalLabels).toContain("Kaegan Availability");
  });

  it("rollDice returns valid four-dice data", () => {
    const values = [0, 0.999, 0.34, 0.84];
    const dice = rollDice(() => values.shift() ?? 0.5);

    expect(dice.dieA).toBe(1);
    expect(dice.dieB).toBe(6);
    expect(dice.total).toBe(7);
    expect(dice.realityDie).toBe(3);
    expect(dice.realityOutcome).toBe("Ripple Event");
    expect(dice.artifactDie).toBe(6);
    expect(dice.artifact.artifactName).toBeDefined();
  });

  it("board movement resolves a valid landing space", () => {
    expect(storySpaces.length).toBeGreaterThanOrEqual(204);
    expect(storySpaces.some((space) => space.sourceFile === "RIPPLE_CANON/ALTERNATES/ALTERNATE_08B_THE_GAME_THAT_REACHED_HIM.md")).toBe(true);
    expect(landingPosition(0, 7, storySpaces)).toBe(7);

    const next = resolveBoardTurn(newRun(), storySpaces, rules, testRoll(3, 4));
    const landing = next.boardTurn.landings[0];

    expect(landing.agentName).toBe("Mara");
    expect(landing.dice.total).toBe(7);
    expect(landing.spaceTitle).toBe(storySpaces[7].title);
    expect(landing.sourceFile).toBe(storySpaces[7].sourceFile);
    expect(landing.plainMeaning).toBe(storySpaces[7].plainMeaning);
    expect(landing.characterReading).toContain("Mara");
    expect(landing.meterEffects.witness).toBeGreaterThanOrEqual(0);
  });

  it("current agent turn order advances and round increments after all agents act", () => {
    const first = resolveBoardTurn(newRun(), storySpaces, rules, testRoll(1, 1));

    expect(first.boardTurn.currentAgentId).toBe("jamal");
    expect(first.boardTurn.currentRound).toBe(1);

    const afterRound = first.agents.slice(1).reduce(
      (state) => resolveBoardTurn(state, storySpaces, rules, testRoll(1, 1)),
      first,
    );

    expect(afterRound.boardTurn.currentRound).toBe(2);
    expect(afterRound.boardTurn.currentAgentId).toBe("mara");
    expect(afterRound.boardTurn.completedTurns).toEqual([]);
    expect(afterRound.boardTurn.roundSummaries[0].charactersMoved).toEqual(["Mara", "Jamal", "Maren", "Dev", "Teodor / Scott"]);
  });

  it("Experimental Mode preview exposes possible landing spaces", () => {
    const previews = possibleLandingSpaces(newRun(), storySpaces);

    expect(previews).toHaveLength(11);
    expect(previews[0].rollTotal).toBe(2);
    expect(previews[0].visibility).toBe("full");
    expect(previews[0].label).toBe(storySpaces[2].title);
    expect(previews[0].detail).toContain("Intervention:");
  });

  it("Mystery and Vague modes change possible landing space info", () => {
    const mystery = createRunState(agents, { mode: "mystery", selectedSeeds: selectedSeeds() });
    const vague = createRunState(agents, { mode: "vague", selectedSeeds: selectedSeeds() });

    expect(possibleLandingSpaces(mystery, storySpaces)[0].label).toBe("Unknown space");
    expect(possibleLandingSpaces(mystery, storySpaces)[0].visibility).toBe("hidden");
    expect(possibleLandingSpaces(vague, storySpaces)[0].label).toBe(storySpaces[2].title);
    expect(possibleLandingSpaces(vague, storySpaces)[0].detail).toBe(storySpaces[2].shortMeaning);
  });

  it("Story Weight and Board Space event logs do not use new-name language", () => {
    const boulder = storyBoulderById(storyBoulders, "complete-consequence");
    const storyTurn = introduceStoryBoulder(newRun(), boulder!, layerCards, rules, "jamal");
    const boardTurn = resolveBoardTurn(newRun(), storySpaces, rules, testRoll(3, 4));

    expect(storyTurn.events.map((event) => event.text).join(" ")).not.toContain("new name");
    expect(boardTurn.events.map((event) => event.text).join(" ")).not.toContain("new name");
  });

  it("legacy Name the Boulder action can still use name language", () => {
    const named = advanceTurn(newRun(), "name", rules, { boulderName: "Anchor" });

    expect(named.events.map((event) => event.text).join(" ")).toContain("new name");
  });

  it("character reactions are not identical for shared Story Weight events", () => {
    const boulder = storyBoulderById(storyBoulders, "closed-door-saved-life");
    const next = introduceStoryBoulder(newRun(), boulder!, layerCards, rules);
    const reactions = next.lastTurnFeedback?.agentReactions ?? [];

    expect(new Set(reactions).size).toBeGreaterThan(1);
  });

  it("compact Active Inspection Summary renders selected item, weight, target, and source", () => {
    const html = renderToStaticMarkup(
      createElement(ActiveInspectionSummary, {
        compactByDefault: true,
        canReadSource: true,
        item: {
          id: "space-test",
          kind: "story-boulder",
          title: "The Closed Door",
          summary: "A blocked path can change meaning.",
          details: [],
          sourceFile: "INTERVENTION ARG/Chapter 07.md",
        },
        selectedTargetName: "Mara",
        selectedWeightName: "The Closed Door",
      }),
    );

    expect(html).toContain("Inspecting");
    expect(html).toContain("The Closed Door");
    expect(html).toContain("Mara");
    expect(html).toContain("INTERVENTION ARG/Chapter 07.md");
  });

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

  it("How to Play copy includes the Living Board loop and manual Story Weight tool", () => {
    expect(howToPlaySteps.join(" ")).toContain("rolls dice");
    expect(howToPlaySteps.join(" ")).toContain("landing Story Space");
    expect(howToPlaySteps.join(" ")).toContain("Manual Story Weight tools");
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

  it("Markdown export includes board summary, meters, reality layers, and boundary language", () => {
    const state = resolveBoardTurn(newRun(), storySpaces, rules, testRoll(3, 4, 1, 2));
    const markdown = buildMarkdownRunLog(state);

    expect(markdown).toContain("Mode: experimental");
    expect(markdown).toContain("Turn Count: 1");
    expect(markdown).toContain("The board is the story.");
    expect(markdown).toContain("## Turn Records");
    expect(markdown).toContain("Reality die:");
    expect(markdown).toContain("Artifact die:");
    expect(markdown).toContain("## Character Branch State");
    expect(markdown).toContain("## Final Meters");
    expect(markdown).toContain("RUFS:");
    expect(markdown).toContain("Mood Output:");
    expect(markdown).toContain("## Reality Layers");
    expect(markdown).toContain("## Boundary");
  });

  it("Markdown export includes Story Objects through turn records", () => {
    const boulder = storyBoulderById(storyBoulders, "trigger-is-not-instruction");
    expect(boulder).toBeDefined();
    const state = resolveBoardTurn(newRun(), storySpaces, rules, testRoll(3, 4, 3, 4));
    const markdown = buildMarkdownRunLog(state);

    expect(markdown).toContain("### Turn 1 - Mara");
    expect(markdown).toContain(`Source: ${storySpaces[7].sourceFile}`);
    expect(markdown).toContain("Mara's branch:");
    expect(markdown).toContain("Artifact effect:");
    expect(markdown).toContain("## Alternate Reality Counts");
    expect(markdown).toContain("Sources Contacted:");
  });

  it("Markdown export includes dice rolls, board spaces, story sources, and Nested Simulation progress", () => {
    const state = resolveBoardTurn(newRun(), storySpaces, rules, testRoll(3, 4, 1, 2));
    const markdown = buildMarkdownRunLog({ ...state, exportedRun: true });

    expect(markdown).toContain("Movement dice:");
    expect(markdown).toContain("3 + 4 = 7");
    expect(markdown).toContain("Landed on:");
    expect(markdown).toContain(storySpaces[7].title);
    expect(markdown).toContain(`Source: ${storySpaces[7].sourceFile}`);
    expect(markdown).toContain("## Nested Simulation Progress");
    expect(markdown).toContain("Run Exported: Yes");
  });
});
