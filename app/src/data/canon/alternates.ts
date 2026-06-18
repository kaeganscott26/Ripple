export interface CanonAlternate {
  id: string;
  order: number;
  title: string;
  sourceFile: string;
  mirrorsChapter: string;
  chapterTitle: string;
  layers: string[];
  artifactEchoes: string[];
  coreMirror: string;
  alternateStory: string;
  interventionPoint: string;
  missedInterventionPoint: string;
  rippleEvent: string;
  artifactPulls: string[];
  boardSpaces: string[];
  endStates: {
    intervention: string;
    ripple: string;
    missed: string;
  };
  gameMeaning: string;
}

const alternateSources = import.meta.glob("../../../../RIPPLE_CANON/ALTERNATES/ALTERNATE_*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

function normalizeSourceFile(path: string): string {
  return path.replace("../../../../", "");
}

function normalizeWikiLink(value: string): string {
  return value.replace(/\[\[([^\]|]+)\|?([^\]]+)?\]\]/g, (_, target: string, label?: string) => label ?? target);
}

function cleanMarkdown(value: string): string {
  return normalizeWikiLink(value)
    .replace(/```text\n?/g, "")
    .replace(/```/g, "")
    .replace(/^>\s?/gm, "")
    .replace(/\*\*/g, "")
    .replace(/_/g, "")
    .trim();
}

function firstLineMatch(content: string, pattern: RegExp): string {
  return content.match(pattern)?.[1]?.trim() ?? "";
}

function extractSection(content: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = content.match(new RegExp(`^## .*${escaped}\\n([\\s\\S]*?)(?=^## |$(?![\\s\\S]))`, "m"));

  return cleanMarkdown(match?.[1] ?? "");
}

function listFromInlineLinks(line: string): string[] {
  return Array.from(line.matchAll(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)).map((match) => match[2] ?? match[1]);
}

function parseBoardSpaces(section: string): string[] {
  return section
    .split("\n")
    .map((line) => line.match(/^\s*\d+\.\s+(.+)$/)?.[1]?.trim())
    .filter((line): line is string => Boolean(line));
}

function parseArtifactPulls(section: string): string[] {
  return section
    .split("\n")
    .map((line) => line.match(/^\s*-\s+(.+)$/)?.[1]?.trim())
    .filter((line): line is string => Boolean(line))
    .map(cleanMarkdown);
}

function parseEndState(section: string, label: string): string {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = section.match(new RegExp(`^### .*${escaped}\\n([\\s\\S]*?)(?=^### |$(?![\\s\\S]))`, "m"));

  return cleanMarkdown(match?.[1] ?? "");
}

function parseAlternate(path: string, content: string): CanonAlternate {
  const sourceFile = normalizeSourceFile(path);
  const heading = firstLineMatch(content, /^#\s+(.+)$/m);
  const titleMatch = heading.match(/ALTERNATE\s+(\d+)\s+[—-]\s+(.+)$/);
  const order = Number(titleMatch?.[1] ?? sourceFile.match(/ALTERNATE_(\d+)/)?.[1] ?? 0);
  const title = titleMatch?.[2]?.replace(/\s+/g, " ").trim() ?? heading;
  const mirrorLine = firstLineMatch(content, /^_Mirrors:\s+(.+)_$/m);
  const mirrorMatch = mirrorLine.match(/\[\[(Chapter \d+)\]\]\s+[—-]\s+(.+)$/);
  const layerLine = firstLineMatch(content, /^Layer links:\s+(.+)$/m);
  const echoLine = firstLineMatch(content, /^(?:Artifact echoes|Echoes):\s+(.+)$/m);
  const endStatesSection = content.match(/^## .*End States\n([\s\S]*?)(?=^## |$(?![\s\S]))/m)?.[1] ?? "";
  const boardSpaces = parseBoardSpaces(extractSection(content, "Board Spaces"));

  return {
    id: `alternate-${String(order).padStart(2, "0")}`,
    order,
    title,
    sourceFile,
    mirrorsChapter: mirrorMatch?.[1] ?? `Chapter ${String(order).padStart(2, "0")}`,
    chapterTitle: mirrorMatch?.[2] ?? title,
    layers: listFromInlineLinks(layerLine),
    artifactEchoes: listFromInlineLinks(echoLine),
    coreMirror: extractSection(content, "Core Mirror"),
    alternateStory: extractSection(content, "Alternate Story"),
    interventionPoint: extractSection(content, "Intervention Point"),
    missedInterventionPoint: extractSection(content, "Missed Intervention Point"),
    rippleEvent: extractSection(content, "Ripple Event"),
    artifactPulls: parseArtifactPulls(extractSection(content, "Artifact Pulls")),
    boardSpaces,
    endStates: {
      intervention: parseEndState(endStatesSection, "Intervention Ending"),
      ripple: parseEndState(endStatesSection, "Ripple Ending"),
      missed: parseEndState(endStatesSection, "Missed Ending"),
    },
    gameMeaning: extractSection(content, "Game Meaning"),
  };
}

export const canonAlternates: CanonAlternate[] = Object.entries(alternateSources)
  .map(([path, content]) => parseAlternate(path, content))
  .sort((a, b) => a.order - b.order);

export function canonAlternateById(id?: string): CanonAlternate | undefined {
  return canonAlternates.find((alternate) => alternate.id === id);
}
