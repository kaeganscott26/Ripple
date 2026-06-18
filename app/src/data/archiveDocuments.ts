import agentsJson from "./agents.json";
import layerCardsJson from "./layerCards.json";
import storyBouldersJson from "./storyBoulders.json";
import type { AgentData, LayerCard, StoryBoulder } from "../engine/types";

export type ArchiveSourceType = "order" | "prologue" | "chapter" | "epilogue" | "artifact" | "note" | "alternate";

export interface ArchiveDocument {
  id: string;
  title: string;
  sourceType: ArchiveSourceType;
  sourceFile: string;
  order: number;
  content: string;
  excerpt: string;
  plainLanguageSummary: string;
  relatedStoryWeights: string[];
  relatedLayers: string[];
  relatedCharacters: string[];
}

const interventionSources = import.meta.glob("../../../INTERVENTION ARG/{ORDER.md,PROLOGUE.md,Chapter *.md,EPILOGUE.md,ARTIFACTS/*}", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const noteSources = import.meta.glob("../../../NOTES/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const alternateSources = import.meta.glob("../../../RIPPLE_CANON/ALTERNATES/*.md", {
  eager: true,
  import: "default",
  query: "?raw",
}) as Record<string, string>;

const storyBoulders = storyBouldersJson as StoryBoulder[];
const layerCards = layerCardsJson as LayerCard[];
const agents = agentsJson as AgentData[];

const chapterTitles: Record<string, string> = {
  "INTERVENTION ARG/PROLOGUE.md": "Prologue - The Game Begins After You Close the Book",
  "INTERVENTION ARG/Chapter 01.md": "Chapter 01 - The First Ripple",
  "INTERVENTION ARG/Chapter 02.md": "Chapter 02 - Trigger",
  "INTERVENTION ARG/Chapter 03.md": "Chapter 03 - The Room",
  "INTERVENTION ARG/Chapter 04.md": "Chapter 04 - The Missed Layer",
  "INTERVENTION ARG/Chapter 05.md": "Chapter 05 - Shared Reality",
  "INTERVENTION ARG/Chapter 06.md": "Chapter 06 - The False World",
  "INTERVENTION ARG/Chapter 07.md": "Chapter 07 - Observer",
  "INTERVENTION ARG/Chapter 08.md": "Chapter 08 - 0826",
  "INTERVENTION ARG/Chapter 09.md": "Chapter 09 - The Kitchen",
  "INTERVENTION ARG/Chapter 10.md": "Chapter 10 - The Signal",
  "INTERVENTION ARG/Chapter 11.md": "Chapter 11 - The Loop",
  "INTERVENTION ARG/Chapter 12.md": "Chapter 12 - The Door",
  "INTERVENTION ARG/Chapter 13.md": "Chapter 13 - The Echo",
  "INTERVENTION ARG/Chapter 14.md": "Chapter 14 - The Cosmic Room",
  "INTERVENTION ARG/Chapter 15.md": "Chapter 15 - Boulder",
  "INTERVENTION ARG/Chapter 16.md": "Chapter 16 - The Morning After the Signal",
  "INTERVENTION ARG/Chapter 17.md": "Chapter 17 - Teodor",
  "INTERVENTION ARG/EPILOGUE.md": "Epilogue - Fine",
  "INTERVENTION ARG/ORDER.md": "Reading Order",
};

function normalizeSourceFile(path: string): string {
  return path.replace("../../../", "");
}

function documentId(sourceFile: string): string {
  return sourceFile
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sourceTypeFor(sourceFile: string): ArchiveSourceType {
  if (sourceFile.endsWith("ORDER.md")) return "order";
  if (sourceFile.endsWith("PROLOGUE.md")) return "prologue";
  if (sourceFile.endsWith("EPILOGUE.md")) return "epilogue";
  if (sourceFile.includes("/ARTIFACTS/")) return "artifact";
  if (sourceFile.startsWith("RIPPLE_CANON/ALTERNATES/")) return "alternate";
  if (sourceFile.startsWith("NOTES/")) return "note";
  return "chapter";
}

function orderFor(sourceFile: string): number {
  if (sourceFile.endsWith("ORDER.md")) return -1;
  if (sourceFile.endsWith("PROLOGUE.md")) return 0;
  const chapter = sourceFile.match(/Chapter (\d+)/)?.[1];
  if (chapter) return Number(chapter);
  if (sourceFile.endsWith("EPILOGUE.md")) return 18;
  const alternate = sourceFile.match(/ALTERNATE_(\d+)/)?.[1];
  if (alternate) return 50 + Number(alternate);
  if (sourceFile.includes("/ARTIFACTS/")) return 100 + sourceFile.localeCompare("");
  return 200 + sourceFile.localeCompare("");
}

function titleFor(sourceFile: string, content: string): string {
  const heading = content.match(/^#{1,2}\s+(.+)$/m)?.[1]?.trim();
  return chapterTitles[sourceFile] ?? heading ?? sourceFile.split("/").pop()?.replace(/\.(md|txt)$/i, "") ?? sourceFile;
}

function excerptFor(content: string): string {
  return content
    .replace(/^#.*$/gm, "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find((block) => block.length > 80)
    ?.slice(0, 420) ?? content.slice(0, 420);
}

function summaryFor(sourceFile: string, title: string): string {
  const related = storyBoulders.find((boulder) => boulder.sourceFile === sourceFile);
  if (related) return related.plainLanguageMeaning;
  const layer = layerCards.find((card) => card.sourceFile === sourceFile);
  if (layer) return layer.plainLanguageMeaning;
  if (sourceFile.endsWith("ORDER.md")) return "The canonical route through the INTERVENTION archive.";
  if (sourceFile.startsWith("RIPPLE_CANON/ALTERNATES/")) {
    return `${title} is alternate canon for the board route. It supplies spaces, intervention points, missed interventions, ripple events, artifact pulls, and end-state language.`;
  }
  if (sourceFile.endsWith("PROLOGUE.md")) return "The archive explains how a story can become a tool without becoming proof or command.";
  if (sourceFile.endsWith("EPILOGUE.md")) return "Ripple Theory is returned to the reader as consequence, responsibility, and choice.";
  return `${title} is source material that can feed Ripple's board objects without becoming a fixed level.`;
}

function relatedStoryWeights(sourceFile: string): string[] {
  return storyBoulders.filter((boulder) => boulder.sourceFile === sourceFile).map((boulder) => boulder.id);
}

function relatedLayers(sourceFile: string): string[] {
  const directLayer = layerCards.filter((card) => card.sourceFile === sourceFile).map((card) => card.id);
  const boulderLayers = storyBoulders
    .filter((boulder) => boulder.sourceFile === sourceFile)
    .flatMap((boulder) => boulder.relatedLayers);

  return Array.from(new Set([...directLayer, ...boulderLayers]));
}

function relatedCharacters(sourceFile: string): string[] {
  const fromBoulders = storyBoulders
    .filter((boulder) => boulder.sourceFile === sourceFile)
    .flatMap((boulder) => boulder.relatedCharacters);
  const fromAgents = agents
    .filter((agent) => agent.associatedBoulders.some((id) => storyBoulders.find((boulder) => boulder.id === id)?.sourceFile === sourceFile))
    .map((agent) => agent.id);

  return Array.from(new Set([...fromBoulders, ...fromAgents]));
}

function buildDocuments(sources: Record<string, string>): ArchiveDocument[] {
  return Object.entries(sources).map(([path, content]) => {
    const sourceFile = normalizeSourceFile(path);
    const title = titleFor(sourceFile, content);

    return {
      id: documentId(sourceFile),
      title,
      sourceType: sourceTypeFor(sourceFile),
      sourceFile,
      order: orderFor(sourceFile),
      content,
      excerpt: excerptFor(content),
      plainLanguageSummary: summaryFor(sourceFile, title),
      relatedStoryWeights: relatedStoryWeights(sourceFile),
      relatedLayers: relatedLayers(sourceFile),
      relatedCharacters: relatedCharacters(sourceFile),
    };
  });
}

export const archiveDocuments: ArchiveDocument[] = [
  ...buildDocuments(interventionSources),
  ...buildDocuments(alternateSources),
  ...buildDocuments(noteSources),
].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

export function archiveDocumentById(id?: string): ArchiveDocument | undefined {
  return archiveDocuments.find((document) => document.id === id);
}

export function archiveDocumentBySourceFile(sourceFile?: string): ArchiveDocument | undefined {
  return archiveDocuments.find((document) => document.sourceFile === sourceFile);
}

export function nextArchiveDocument(currentId: string, direction: -1 | 1): ArchiveDocument {
  const index = Math.max(
    0,
    archiveDocuments.findIndex((document) => document.id === currentId),
  );
  const nextIndex = (index + direction + archiveDocuments.length) % archiveDocuments.length;

  return archiveDocuments[nextIndex];
}
