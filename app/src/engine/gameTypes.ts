export type GameModeId = "mystery" | "vague" | "experimental";
export type GamePhase = "playing" | "awaiting-choice" | "complete";
export type ArtifactState = "missed" | "collected" | "ignored" | "forced";
export type RealityLayerId =
  | "natural"
  | "clinical"
  | "dream"
  | "cultural"
  | "media"
  | "power"
  | "software"
  | "self-awareness";

export interface GameModeConfig {
  id: GameModeId;
  name: string;
  summary: string;
  glassTone: string;
  revealsLayer: boolean;
  referenceAccess: "hidden" | "optional" | "expanded";
}

export interface CharacterConfig {
  id: string;
  name: string;
  role: string;
  lens: string;
  question: string;
}

export interface BoardSpaceConfig {
  id: string;
  order: number;
  name: string;
  kind: "threshold" | "room" | "signal" | "weather" | "archive" | "return";
  realityLayer: RealityLayerId;
  symbol: string;
  artifactName: string;
  artifactVocabulary: string[];
  glassSeeds: string[];
  forcedConsequence: string;
  referenceIds: string[];
  live: {
    enabled: boolean;
    revision: number;
    remoteKey: string;
  };
}

export interface LiveBoardDataset {
  id: string;
  schemaVersion: number;
  revision: string;
  updatedAt: string;
  source: "bundled" | "live";
  spaces: BoardSpaceConfig[];
}

export interface ThreeDiceRoll {
  movement: [number, number];
  ripple: number;
  total: number;
  doubles: boolean;
  influence: string;
}

export interface GlassPrompt {
  system: string;
  user: string;
  constraints: string[];
  output: string;
}

export interface ArtifactRecord {
  id: string;
  turn: number;
  state: ArtifactState;
  spaceId: string;
  spaceName: string;
  artifactName: string;
  realityLayer: RealityLayerId;
  glassFragment: string;
  consequence?: string;
}

export interface TurnRecord {
  turn: number;
  from: number;
  to: number;
  roll: ThreeDiceRoll;
  spaceId: string;
  glassFragment: string;
  decision?: "collect" | "ignore";
  forcedSpaceId?: string;
}

export interface PendingChoice {
  artifact: ArtifactRecord;
  glassPrompt: GlassPrompt;
}

export interface FinalStoryResult {
  prompt: GlassPrompt;
  title: string;
  story: string;
}

export interface RippleGameState {
  version: 1;
  phase: GamePhase;
  modeId: GameModeId;
  characterId: string;
  position: number;
  turn: number;
  extraTurnsEarned: number;
  extraTurnPending: boolean;
  lastRoll?: ThreeDiceRoll;
  pendingChoice?: PendingChoice;
  inventory: Record<ArtifactState, ArtifactRecord[]>;
  turns: TurnRecord[];
  finalStory?: FinalStoryResult;
}

export interface RippleGameSetup {
  modeId: GameModeId;
  characterId: string;
}

