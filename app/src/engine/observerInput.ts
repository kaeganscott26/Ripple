import type { ObserverInputClassification, ObserverInputType } from "./types";

interface ClassificationRule {
  type: ObserverInputType;
  explanation: string;
  interpretationNote: string;
  matches: (input: string) => boolean;
}

function hasAny(input: string, words: string[]): boolean {
  return words.some((word) => input.includes(word));
}

function startsWithAny(input: string, words: string[]): boolean {
  const trimmed = input.trimStart();
  return words.some((word) => trimmed.startsWith(word));
}

const rules: ClassificationRule[] = [
  {
    type: "Myth Seed",
    explanation: "It frames a past event as an origin story the room can repeat.",
    interpretationNote: "The Observer is giving the room a story about where the pattern began.",
    matches: (input) =>
      hasAny(input, [" first ", " origin ", " created ", " became ", " gave rise ", " was born ", " myth ", " legend "]),
  },
  {
    type: "Policy Proposal",
    explanation: "It uses action language that tries to add, prevent, require, or organize behavior.",
    interpretationNote: "The Observer is no longer only naming the artifact. The Observer is trying to govern the room.",
    matches: (input) =>
      startsWithAny(input, [
        "add ",
        "assign ",
        "build ",
        "create ",
        "deploy ",
        "establish ",
        "install ",
        "make ",
        "protect ",
        "put ",
        "require ",
        "send ",
        "station ",
      ]) || hasAny(input, [" prevent ", " to prevent ", " in order to ", " so that "]),
  },
  {
    type: "Era Marker",
    explanation: "It names a broad age, breakthrough, movement, or historical phase.",
    interpretationNote: "The Observer is marking the room as entering a new period of meaning.",
    matches: (input) =>
      hasAny(input, [
        " age ",
        " era ",
        " epoch ",
        " period ",
        " breakthrough ",
        " revolution ",
        " renaissance ",
        " scientific ",
        " technology ",
        " technological ",
      ]),
  },
  {
    type: "Doctrine",
    explanation: "It states a durable belief or rule using must, shall, always, never, or required language.",
    interpretationNote: "The Observer is turning interpretation into a principle the room may repeat.",
    matches: (input) => hasAny(input, [" must ", " shall ", " always ", " never ", " required ", " forbidden "]),
  },
  {
    type: "Crisis Label",
    explanation: "It names scarcity, harm, danger, theft, collapse, or another pressure event.",
    interpretationNote: "The Observer is labeling pressure so the room can organize around the threat.",
    matches: (input) =>
      hasAny(input, [
        " crisis ",
        " drought ",
        " famine ",
        " shortage ",
        " scarcity ",
        " thief ",
        " theft ",
        " attack ",
        " danger ",
        " panic ",
        " collapse ",
        " plague ",
        " blight ",
        " flood ",
        " fire ",
        " war ",
      ]),
  },
];

function normalizeForMatching(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim()} `;
}

export function classifyObserverInput(text: string, turn: number): ObserverInputClassification {
  const trimmed = text.trim() || "Consequence";
  const normalized = normalizeForMatching(trimmed);
  const matchedRule = rules.find((rule) => rule.matches(normalized));

  if (matchedRule) {
    return {
      turn,
      text: trimmed,
      classification: matchedRule.type,
      explanation: matchedRule.explanation,
      interpretationNote: matchedRule.interpretationNote,
    };
  }

  return {
    turn,
    text: trimmed,
    classification: "Artifact Name",
    explanation: "It reads as a compact label for the visible Boulder rather than a rule, era, crisis, or origin story.",
    interpretationNote: "The Observer is giving the artifact a repeatable handle.",
  };
}
