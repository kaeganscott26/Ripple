import type { RunState } from "./types";
import { seedDisplay } from "./memorySystem";
import { eventTypeLabel } from "./eventLabels";

function linesForList(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ["- None"];
}

export function buildMarkdownRunLog(state: RunState): string {
  const lines: string[] = [
    "# Ripple: The Boulder Build Run Log",
    "",
    `Mode: ${state.mode}`,
    `Turns: ${state.turn}`,
    `Boulder Name: ${state.boulderName ?? "Boulder"}`,
    "",
    "## Active Agents",
    "",
  ];

  state.agents.forEach((agent) => {
    lines.push(`- ${agent.name}: ${seedDisplay(agent, state.mode)}`);
  });

  lines.push("", "## Actions Taken", "");
  state.actionsTaken.forEach((entry) => {
    lines.push(`- Turn ${entry.turn}: ${entry.label}`);
  });
  if (state.actionsTaken.length === 0) lines.push("- None");

  lines.push("", "## Event Log", "");
  state.events.forEach((event) => {
    lines.push(`- Turn ${event.turn} [${eventTypeLabel(event.type)}]: ${event.text}`);
  });
  if (state.events.length === 0) lines.push("- No turns advanced.");

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
