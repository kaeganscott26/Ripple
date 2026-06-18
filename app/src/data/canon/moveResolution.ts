import type {
  ActiveAgent,
  BoardLanding,
  BranchMechanic,
  BranchRunState,
  DiceRoll,
  Mode,
  RealityOutcome,
  StorySpace,
} from "../../engine/types";
import { branchRuleFor, sourceLinksForBranch } from "./branchCausality";
import type { ChapterBranch, SourceLink } from "./branchCausality";
import { canonArtifacts } from "./artifacts";
import { branchForSourceFile } from "./chapterBranches";
import { branchContextLine, kaeganAvailabilityAfterBranch } from "./characterStates";

export interface BranchMoveResolutionInput {
  agent: ActiveAgent;
  branchState: BranchRunState;
  space: StorySpace;
  dice: DiceRoll;
  revealedOutcome: RealityOutcome;
  activeArtifacts: string[];
  runHistory: BoardLanding[];
}

export interface BranchMoveResolution {
  branch: ChapterBranch;
  turnSummary: string;
  landingSpaceText: string;
  branchContext: string;
  sceneConsequence: string;
  characterEffect: string;
  artifactEffect: string;
  resultText: string;
  roomResponse: string;
  societyResponse: string;
  branchText: string;
  openedPath: string;
  closedPath: string;
  sourceReadLinks: SourceLink[];
  characterStateChanges: string[];
  mechanicsTriggered: BranchMechanic[];
  hiddenChecks: string[];
  futureChapterImpact: string;
}

function chapterLabel(branch: ChapterBranch): string {
  return `Chapter ${String(branch.chapterId).padStart(2, "0")} - ${branch.title}`;
}

function effectForArtifact(branch: ChapterBranch, artifactName: string): string {
  if (artifactName === "No Artifact") {
    return "No artifact modifies this turn. The scene resolves through the landing space and reality die.";
  }

  const authored = branch.artifactEffects[artifactName];
  if (authored) return authored;

  if (artifactName === "Boulder Protocol") {
    return "Before the room turns this into a rule, Boulder Protocol forces the board to check impact, source, safety, and repair.";
  }

  if (artifactName === "Boundary Handrail") {
    return "Boundary Handrail keeps the signal from becoming a command and protects delay, refusal, or pause as real moves.";
  }

  if (artifactName === "Signal Released, No Receipt Required") {
    return "Signal Released lets the move leave the room without demanding proof from the receiver.";
  }

  return `${artifactName} modifies the move by forcing the scene to show what changed in the room, not only what the player meant.`;
}

function characterEffectFor(branch: ChapterBranch, agent: ActiveAgent): string {
  return (
    branch.characterEffects[agent.id] ??
    `${agent.name} carries this branch through ${branch.title}; the landing changes what their next move is allowed to include.`
  );
}

function stateChangesFor(branch: ChapterBranch, agent: ActiveAgent, mechanics: BranchMechanic[]): string[] {
  const changes = mechanics.map((mechanic) => `${mechanic} active`);
  if (branch.id === "chapter-08-a") changes.push("Kaegan Boundary State active", "Love As Load active");
  if (branch.id === "chapter-08-b") changes.push("Player 0826 available", "Safe Invitation active");
  if (branch.characterEffects[agent.id]) changes.push(branch.characterEffects[agent.id]);
  return Array.from(new Set(changes));
}

function echoLinksFor(branch: ChapterBranch, artifactName: string): SourceLink[] {
  const links: SourceLink[] = [];
  if (branch.chapterId === 8 || branch.id === "chapter-01-a" || branch.id === "chapter-01-b") {
    links.push({ label: "Optional Echo - KAEGAN", sourceFile: "RIPPLE_CANON/CHARACTERS/KAEGAN.md" });
  }
  if (artifactName !== "No Artifact") {
    const artifact = canonArtifacts.find((entry) => entry.name === artifactName);
    if (artifact) links.push({ label: `Optional Echo - ${artifactName}`, sourceFile: artifact.sourceFile });
  }
  return links.slice(0, 2);
}

export function resolveBranchMove(input: BranchMoveResolutionInput): BranchMoveResolution | undefined {
  const branch = branchForSourceFile(input.space.sourceFile);
  if (!branch || branch.chapterId > 8) return undefined;

  const rule = branchRuleFor(branch, input.revealedOutcome);
  const originBranchId = branch.id === "chapter-01-a" || branch.id === "chapter-01-b" ? branch.id : input.branchState.originBranchId;
  const builderPathOpen = branch.id === "chapter-01-a" ? false : input.branchState.builderPathOpen;
  const kaeganAvailability = kaeganAvailabilityAfterBranch(branch.id, originBranchId, builderPathOpen);
  const mechanicsTriggered = Array.from(new Set([...branch.unlockedMechanics, ...rule.mechanics])) as BranchMechanic[];
  const characterEffect = characterEffectFor(branch, input.agent);
  const artifactEffect = effectForArtifact(branch, input.dice.artifact.artifactName);
  const previousBranchContacts = input.runHistory.filter((landing) => landing.activeBranchId === branch.id).length;
  const turnSummary = `${input.agent.name} rolls ${input.dice.dieA} + ${input.dice.dieB} = ${input.dice.total}. Reality die ${input.dice.realityDie} renders ${input.revealedOutcome}. Artifact die ${input.dice.artifactDie} renders ${input.dice.artifact.artifactName}.`;
  const landingSpaceText = `Landing space: ${input.space.title}${input.space.spaceIndex ? ` (space ${input.space.spaceIndex})` : ""}. The move resolves inside ${chapterLabel(branch)}.`;
  const branchContext = `${branchContextLine(input.branchState, branch.chapterId)} Active branch now: ${branch.title}. ${previousBranchContacts > 0 ? "This branch has appeared before in the run." : "This is the first recorded contact with this branch in the run."}`;
  const sceneConsequence = `${rule.scene} Landing detail: ${input.agent.name} reaches "${input.space.title}" before the branch can resolve offscreen.`;
  const resultText = `${rule.result} ${rule.openedPath} ${kaeganAvailability.label}`;
  const roomResponse = `${input.space.title} changes the room by making the branch consequence visible as action: ${rule.openedPath}`;
  const societyResponse = `${branch.title} changes shared reality: ${branch.laterChapterImpact}`;
  const branchText = `${input.agent.name} resolves ${input.space.title} through ${branch.title}: ${rule.openedPath}`;
  const sourceReadLinks = sourceLinksForBranch(branch, echoLinksFor(branch, input.dice.artifact.artifactName)).slice(0, 4);

  return {
    branch,
    turnSummary,
    landingSpaceText,
    branchContext,
    sceneConsequence,
    characterEffect,
    artifactEffect,
    resultText,
    roomResponse,
    societyResponse,
    branchText,
    openedPath: rule.openedPath,
    closedPath: rule.closedPath,
    sourceReadLinks,
    characterStateChanges: stateChangesFor(branch, input.agent, mechanicsTriggered),
    mechanicsTriggered,
    hiddenChecks: [...branch.hiddenChecks, `Reality outcome: ${input.revealedOutcome}`, `Artifact: ${input.dice.artifact.artifactName}`],
    futureChapterImpact: branch.laterChapterImpact,
  };
}

export function revealSectionsForMode(
  mode: Mode,
  landing: BoardLanding,
): Array<{ label: string; value: string }> {
  if (mode === "mystery") {
    return [
      { label: "Turn Summary", value: landing.turnSummary ?? landing.movementText },
      { label: "Landing Space", value: landing.landingSpaceText ?? landing.spaceTitle },
      { label: "Scene Consequence", value: landing.sceneConsequence ?? landing.plainMeaning },
      { label: "Result", value: landing.resultText },
      { label: "Read Source", value: landing.sourceReadLinks?.[0]?.label ?? landing.sourceTitle },
    ];
  }

  if (mode === "vague") {
    return [
      { label: "Turn Summary", value: landing.turnSummary ?? landing.movementText },
      { label: "Landing Space", value: landing.landingSpaceText ?? landing.spaceTitle },
      { label: "Branch Context", value: landing.activeBranchTitle ?? landing.branchContext ?? landing.branchText },
      { label: "Scene Consequence", value: landing.sceneConsequence ?? landing.plainMeaning },
      { label: "Character Effect", value: landing.characterEffect ?? landing.characterReading },
      { label: "Artifact Effect", value: landing.artifactEffect },
      { label: "Result", value: landing.resultText },
    ];
  }

  return [
    { label: "Turn Summary", value: landing.turnSummary ?? landing.movementText },
    { label: "Landing Space", value: landing.landingSpaceText ?? landing.spaceTitle },
    { label: "Branch Context", value: landing.branchContext ?? landing.branchText },
    { label: "Scene Consequence", value: landing.sceneConsequence ?? landing.plainMeaning },
    { label: "Character Effect", value: landing.characterEffect ?? landing.characterReading },
    { label: "Artifact Effect", value: landing.artifactEffect },
    { label: "Opened Path", value: landing.openedPath ?? "No opened path recorded." },
    { label: "Closed Path", value: landing.closedPath ?? "No closed path recorded." },
    { label: "Branch Mechanics", value: landing.branchMechanicsTriggered?.join(", ") || "None" },
    { label: "Hidden Checks", value: landing.hiddenChecks?.join("; ") || "None" },
    { label: "Future Chapter Impact", value: landing.futureChapterImpact ?? "No branch impact recorded." },
    { label: "Kaegan Availability", value: landing.kaeganAvailability?.label ?? "No Kaegan state change." },
    { label: "Result", value: landing.resultText },
  ];
}
