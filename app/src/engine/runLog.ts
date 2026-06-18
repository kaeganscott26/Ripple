import type { CharacterPathState, RunState } from "./types";
import { nestedSimulationProgress, normalizeBoardTurnState } from "./boardTurnEngine";
import { formatMetricValue } from "./formatting";
import { pressureKeys, pressureLabels } from "./pressure";

function linesForList(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- None"];
}

function branchLine(path: CharacterPathState, name: string): string {
  return [
    `- ${name}: ${path.currentBranch}`,
    `  - Position: ${path.currentPosition + 1}`,
    `  - Artifacts: ${path.carriedArtifacts.join(", ") || "None"}`,
    `  - Counts: ${path.interventionCount} intervention / ${path.rippleCount} ripple / ${path.missedInterventionCount} missed`,
    `  - Ending Tendency: ${path.currentEndingTendency}`,
  ].join("\n");
}

export function buildMarkdownRunLog(state: RunState): string {
  const boardTurn = normalizeBoardTurnState(state);
  const nestedProgress = nestedSimulationProgress(state);
  const lines: string[] = [
    "# Ripple: Living Board Run Log",
    "",
    "The board is the story.",
    "The dice render the reality.",
    "The artifact bends the path.",
    "The run log records the alternate reality.",
    "",
    "## Run Summary",
    "",
    `- Mode: ${state.mode}`,
    `- Round Count: ${Math.max(0, boardTurn.currentRound - 1)}`,
    `- Turn Count: ${state.turn}`,
    `- Character Turn Order: ${state.agents.map((agent) => agent.name).join(" -> ")}`,
    `- Current Room State: ${boardTurn.roomState}`,
    `- Current Society State: ${boardTurn.societyState}`,
    "",
    "## Turn Records",
    "",
  ];

  boardTurn.landings.forEach((landing) => {
    lines.push(`### Turn ${landing.turn} - ${landing.agentName}`, "");
    lines.push("Branch:");
    lines.push(`${landing.activeBranchId ?? "unmapped"} - ${landing.activeBranchTitle ?? landing.alternateTitle ?? "Existing alternate data"}`, "");
    lines.push("Movement dice:");
    lines.push(`${landing.dice.dieA} + ${landing.dice.dieB} = ${landing.dice.total}`, "");
    lines.push("Reality die:");
    lines.push(`${landing.dice.realityDie} - ${landing.dice.realityOutcome}`, "");
    lines.push("Artifact die:");
    lines.push(`${landing.dice.artifactDie} - ${landing.artifactName}`, "");
    lines.push("Landed on:");
    lines.push(
      `${landing.alternateId?.toUpperCase().replace("-", "_") ?? "ALTERNATE"} / Space ${landing.spaceIndex ?? landing.toPosition + 1} - ${landing.spaceTitle}`,
      "",
    );
    lines.push(`Mirrors: ${landing.mirrorsChapter ?? landing.sourceTitle}`);
    lines.push(`Source: ${landing.sourceFile}`, "");
    lines.push("Scene:");
    lines.push(landing.sceneConsequence ?? landing.plainMeaning, "");
    lines.push("Branch context:");
    lines.push(landing.branchContext ?? landing.branchText, "");
    lines.push(`${landing.agentName}'s branch:`);
    lines.push(landing.branchText, "");
    lines.push("Artifact effect:");
    lines.push(landing.artifactEffect, "");
    lines.push("Result:");
    lines.push(landing.resultText, "");
    lines.push("Opened path:");
    lines.push(landing.openedPath ?? "No branch-specific opened path recorded.", "");
    lines.push("Closed path:");
    lines.push(landing.closedPath ?? "No branch-specific closed path recorded.", "");
    lines.push("Character state changes:");
    lines.push(...linesForList(landing.characterStateChanges ?? []), "");
    lines.push("Branch mechanics triggered:");
    lines.push(...linesForList(landing.branchMechanicsTriggered ?? []), "");
    lines.push("Room effect:");
    lines.push(landing.roomResponse, "");
    lines.push("Society effect:");
    lines.push(landing.societyResponse, "");
  });
  if (boardTurn.landings.length === 0) lines.push("- No turns rolled yet.");

  lines.push("", "## Character Branch State", "");
  state.agents.forEach((agent) => {
    const path = boardTurn.characterPaths[agent.id];
    if (path) lines.push(branchLine(path, agent.name));
  });

  lines.push("", "## Alternate Reality Counts", "");
  lines.push(`- Intervention Points: ${boardTurn.landings.filter((landing) => landing.revealedOutcome === "Intervention Point").length}`);
  lines.push(`- Ripple Events: ${boardTurn.landings.filter((landing) => landing.revealedOutcome === "Ripple Event").length}`);
  lines.push(
    `- Missed Intervention Points: ${boardTurn.landings.filter((landing) => landing.revealedOutcome === "Missed Intervention Point").length}`,
  );
  lines.push(`- Artifacts Used: ${boardTurn.artifactsUsed.join(", ") || "None"}`);
  lines.push(`- Sources Contacted: ${boardTurn.sourceContact.join(", ") || "None"}`);

  lines.push("", "## Round Summaries", "");
  boardTurn.roundSummaries.forEach((summary) => {
    lines.push(`- Round ${summary.round}: ${summary.societyEffect}`);
    lines.push(`  - Characters: ${summary.charactersMoved.join(", ") || "None"}`);
    lines.push(`  - Spaces: ${summary.landedSpaces.join(", ") || "None"}`);
    lines.push(`  - Strongest Meter Change: ${summary.strongestMeterChange}`);
    lines.push(`  - Laws Formed: ${summary.lawsFormed.map((law) => law.name).join(", ") || "None"}`);
  });
  if (boardTurn.roundSummaries.length === 0) lines.push("- None yet.");

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

  lines.push("", "## Final Room State", "");
  lines.push(boardTurn.roomState);
  lines.push("", "## Final Society State", "");
  lines.push(boardTurn.societyState);

  lines.push("", "## Reality Layers", "", "### Base Reality", "");
  lines.push(...linesForList(state.layers.base));
  lines.push("", "### Perceived Reality", "");
  lines.push(...linesForList(state.layers.perceived));
  lines.push("", "### Social Reality", "");
  lines.push(...linesForList(state.layers.social));
  lines.push("", "### Institutional Reality", "");
  lines.push(...linesForList(state.layers.institutional));

  lines.push("", "## Nested Simulation Progress", "");
  lines.push("Goal: Create the room that creates the next room.");
  lines.push(`- Rounds: ${nestedProgress.completedRounds}/${nestedProgress.roundGoal}`);
  lines.push(`- Characters Landed: ${nestedProgress.charactersLanded}/${nestedProgress.characterGoal}`);
  lines.push(`- Laws Formed: ${nestedProgress.lawsFormed}/${nestedProgress.lawGoal}`);
  lines.push(`- Story Sources Used: ${nestedProgress.sourceDocumentsUsed}/${nestedProgress.sourceGoal}`);
  lines.push(`- Run Exported: ${nestedProgress.exportedRun ? "Yes" : "No"}`);
  lines.push(`- Simulation Seed: ${nestedProgress.simulationSeedGenerated ? "Generated" : "Not yet"}`);
  lines.push(
    nestedProgress.unlocked
      ? "- Status: Ready to create the room that creates the next room."
      : `- Locked: ${nestedProgress.remaining.join("; ")}`,
  );

  lines.push("", "## Boundary", "");
  lines.push(
    "Ripple is fictional and symbolic. It is not proof of simulation, a diagnosis tool, a command system, or a replacement for support or care.",
  );

  return `${lines.join("\n")}\n`;
}

export function downloadMarkdownRunLog(state: RunState): void {
  const markdown = buildMarkdownRunLog(state);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ripple-living-board-turn-${state.turn}.md`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
