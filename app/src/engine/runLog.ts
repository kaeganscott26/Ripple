import type { RunState } from "./types";
import { nestedSimulationProgress, normalizeBoardTurnState } from "./boardTurnEngine";
import { eventTypeLabel } from "./eventLabels";
import { formatMetricValue } from "./formatting";
import { pressureKeys, pressureLabels } from "./pressure";

function linesForList(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- None"];
}

export function buildMarkdownRunLog(state: RunState): string {
  const boardTurn = normalizeBoardTurnState(state);
  const nestedProgress = nestedSimulationProgress(state);
  const lines: string[] = [
    "# Ripple: Living Board Run Log",
    "",
    "## Run Summary",
    "",
    `- Run Mode: ${state.mode}`,
    `- Round Count: ${Math.max(0, boardTurn.currentRound - 1)}`,
    `- Turn Count: ${state.turn}`,
    `- Board Turns: ${boardTurn.currentTurn}`,
    `- Boulder Name: ${state.boulderName ?? "Boulder"}`,
    `- Boulder Position: ${state.boulderPosition}`,
    "",
    "## Active Memory Seeds",
    "",
  ];

  state.agents.forEach((agent) => {
    const seed = agent.seeds[agent.activeSeed];
    lines.push(`- ${agent.name}: Life ${agent.activeSeed} - ${seed.label}. ${seed.compactMemory}`);
  });

  lines.push("", "## Actions Taken", "");
  state.actionsTaken.forEach((entry) => {
    lines.push(`- Turn ${entry.turn}: ${entry.label}`);
  });
  if (state.actionsTaken.length === 0) lines.push("- None");

  lines.push("", "## Dice Rolls", "");
  boardTurn.landings.forEach((landing) => {
    lines.push(`- Turn ${landing.turn}: ${landing.agentName} rolled ${landing.dice.dieA} + ${landing.dice.dieB} = ${landing.dice.total}`);
  });
  if (boardTurn.landings.length === 0) lines.push("- None");

  lines.push("", "## Board Spaces Landed On", "");
  boardTurn.landings.forEach((landing) => {
    lines.push(`- Turn ${landing.turn}: ${landing.agentName} landed on ${landing.spaceTitle}`);
    lines.push(`  - Source: ${landing.sourceFile}`);
    lines.push(`  - Meaning: ${landing.plainMeaning}`);
    lines.push(`  - ${landing.agentName}'s Reading: ${landing.characterReading}`);
    lines.push(`  - Result: ${landing.roomResponse}`);
  });
  if (boardTurn.landings.length === 0) lines.push("- None");

  lines.push("", "## Round Summaries", "");
  boardTurn.roundSummaries.forEach((summary) => {
    lines.push(`- Round ${summary.round}: ${summary.societyEffect}`);
    lines.push(`  - Characters: ${summary.charactersMoved.join(", ") || "None"}`);
    lines.push(`  - Spaces: ${summary.landedSpaces.join(", ") || "None"}`);
    lines.push(`  - Strongest Meter Change: ${summary.strongestMeterChange}`);
    lines.push(`  - Laws Formed: ${summary.lawsFormed.map((law) => law.name).join(", ") || "None"}`);
  });
  if (boardTurn.roundSummaries.length === 0) lines.push("- None");

  lines.push("", "## Observer Inputs", "");
  const observerInputs = state.observerInputs ?? [];
  observerInputs.forEach((input) => {
    lines.push(`- Turn ${input.turn}: "${input.text}"`);
    lines.push(`  - Classification: ${input.classification}`);
    lines.push(`  - Interpretation: ${input.interpretationNote}`);
  });
  if (observerInputs.length === 0) lines.push("- None");

  lines.push("", "## Interpretation History", "");
  const interpretationHistory = state.interpretationHistory ?? [];
  interpretationHistory.forEach((entry) => {
    const classification = entry.observerClassification ? ` / ${entry.observerClassification}` : "";
    const target = entry.targetCharacterId ? ` / target ${entry.targetCharacterId}` : "";
    lines.push(`- Turn ${entry.turn}: ${entry.action}${classification}${target}`);
    lines.push(`  - ${entry.roomInterpretation}`);
  });
  if (interpretationHistory.length === 0) lines.push("- None");

  lines.push("", "## Story Objects Used", "");
  const storyObjectUses = state.storyObjectUses ?? [];
  storyObjectUses.forEach((use) => {
    lines.push(`- Turn ${use.turn}: ${use.objectName}`);
    lines.push(`  - Source: ${use.sourceFile}`);
    lines.push(`  - Target: ${use.targetName ?? "Room"}`);
    lines.push(`  - Meaning: ${use.plainLanguageMeaning}`);
    lines.push(`  - Result: ${use.resultingInterpretation}`);
  });
  if (storyObjectUses.length === 0) lines.push("- None");

  lines.push("", "## Story Sources Used", "");
  const sourceUses = [
    ...storyObjectUses.filter((use) => use.objectType !== "board-space").map((use) => ({
      turn: use.turn,
      name: use.objectName,
      sourceFile: use.sourceFile,
      targetName: use.targetName ?? "Room",
      meaning: use.plainLanguageMeaning,
      result: use.resultingInterpretation,
    })),
    ...boardTurn.landings.map((landing) => ({
      turn: landing.turn,
      name: landing.spaceTitle,
      sourceFile: landing.sourceFile,
      targetName: landing.agentName,
      meaning: landing.plainMeaning,
      result: landing.characterReading,
    })),
  ];
  sourceUses.forEach((use) => {
    lines.push(`- Turn ${use.turn}: ${use.name}`);
    lines.push(`  - Source File: ${use.sourceFile}`);
    lines.push(`  - Target: ${use.targetName}`);
    lines.push(`  - Plain Meaning: ${use.meaning}`);
    lines.push(`  - Resulting Interpretation: ${use.result}`);
  });
  if (sourceUses.length === 0) lines.push("- None");

  lines.push("", "## Event Log", "");
  state.events.forEach((event) => {
    lines.push(`- Turn ${event.turn} [${eventTypeLabel(event.type)}]: ${event.text}`);
  });
  if (state.events.length === 0) lines.push("- No turns advanced.");

  lines.push("", "## Final Meters", "");
  pressureKeys.forEach((key) => {
    lines.push(`- ${pressureLabels[key]}: ${formatMetricValue(state.pressures[key])}`);
  });
  const latestMetrics = state.meterHistory.slice(-1)[0];
  if (latestMetrics) {
    lines.push(`- RUFS: ${formatMetricValue(latestMetrics.rufs)}`);
    lines.push(`- Mood Output: ${formatMetricValue(latestMetrics.mood)} (${latestMetrics.label})`);
    lines.push(
      `- Safety / Agency / Trust / Meaning: ${formatMetricValue(latestMetrics.safety)} / ${formatMetricValue(latestMetrics.agency)} / ${formatMetricValue(latestMetrics.trust)} / ${formatMetricValue(latestMetrics.meaning)}`,
    );
  }

  lines.push("", "## Final Reality Layers", "", "### Base Reality", "");
  lines.push(...linesForList(state.layers.base));
  lines.push("", "### Perceived Reality", "");
  lines.push(...linesForList(state.layers.perceived));
  lines.push("", "### Social Reality", "");
  lines.push(...linesForList(state.layers.social));
  lines.push("", "### Institutional Reality", "");
  lines.push(...linesForList(state.layers.institutional));

  lines.push("", "## Laws Formed", "");
  if (state.laws.length === 0) {
    lines.push("- None");
  } else {
    state.laws.forEach((law) => {
      lines.push(`- Turn ${law.formedTurn}: ${law.name} - ${law.description}`);
    });
  }

  lines.push("", "## Nested Simulation Progress", "");
  lines.push(`- Rounds: ${nestedProgress.completedRounds}/${nestedProgress.roundGoal}`);
  lines.push(`- Characters Landed: ${nestedProgress.charactersLanded}/${nestedProgress.characterGoal}`);
  lines.push(`- Laws Formed: ${nestedProgress.lawsFormed}/${nestedProgress.lawGoal}`);
  lines.push(`- Story Sources Used: ${nestedProgress.sourceDocumentsUsed}/${nestedProgress.sourceGoal}`);
  lines.push(`- Run Exported: ${nestedProgress.exportedRun ? "Yes" : "No"}`);
  lines.push(`- Simulation Seed: ${nestedProgress.simulationSeedGenerated ? "Generated" : "Not yet"}`);
  lines.push(
    nestedProgress.unlocked
      ? "- Status: Ready to create the room that creates the next room."
      : `- Remaining: ${nestedProgress.remaining.join("; ")}`,
  );

  return `${lines.join("\n")}\n`;
}

export function downloadMarkdownRunLog(state: RunState): void {
  const markdown = buildMarkdownRunLog(state);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ripple-boulder-run-turn-${state.turn}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
