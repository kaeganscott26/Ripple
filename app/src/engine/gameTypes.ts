export type GameModeId = "mystery" | "vague" | "experimental";
export type GamePhase = "playing" | "awaiting-choice" | "complete";
export type ArtifactState = "missed" | "collected" | "ignored" | "forced";
export type RippleLens = "Memory" | "Pressure" | "Echo" | "Fork" | "Intervention" | "Ripple";
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

export interface LifeBoardSpace extends BoardSpaceConfig {
  number: number;
  zone: string;
  type: string;
  realityLayer: RealityLayerId;
  realityLayers: string[];
  branchGroup?: string;
  oppositeSpace?: number;
  glassRiddle: string;
  artifact: string;
  storySeed: string;
  collectMeaning: string;
  ignoreMeaning: string;
  missedMeaning: string;
  booleanTags: string[];
  endingInfluence: string;
  sourceFile: string;
}

export interface BoardZone {
  id: string;
  name: string;
  start: number;
  end: number;
}

export interface BranchGroupConfig {
  id: string;
  spaces: [number, number];
}

export interface CharacterBoard {
  id: string;
  characterId: string;
  name: string;
  totalSpaces: number;
  zones: BoardZone[];
  fixedAnchors: number[];
  branchGroups: BranchGroupConfig[];
  baseStorySummary: string;
  fixedTruths: string[];
  spaces: LifeBoardSpace[];
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
  lens: RippleLens;
}

export interface RippleLensEffect {
  turn: number;
  lens: RippleLens;
  space: number;
  note: string;
  relatedSpace?: number;
  branchGroup?: string;
}

export interface EchoLink {
  turn: number;
  fromSpace: number;
  toSpace: number;
  note: string;
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
  storySeed?: string;
  meaning?: string;
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

export type BranchResolutionKind = "dominant" | "contradiction" | "pressure" | "mode-resolved";

export interface BranchPairResolution {
  group: string;
  spaces: [number, number];
  kind: BranchResolutionKind;
  resolution: string;
  dominantSpaces: number[];
  hidden: boolean;
}

export interface BranchPairState {
  group: string;
  spaces: [number, number];
  collected: number[];
  ignored: number[];
  missed: number[];
  forced: number[];
  status: "pending" | "dominant" | "contradiction" | "pressure" | "unresolved";
}

export interface LifeBoardRunState {
  selected_mode: GameModeId;
  selected_character: string;
  current_position: number;
  turn_count: number;
  dice_history: ThreeDiceRoll[];
  ripple_lens_history: RippleLens[];
  active_lens: RippleLens | null;
  lens_effects: RippleLensEffect[];
  emphasized_spaces: number[];
  echo_links: EchoLink[];
  amplified_spaces: number[];
  intervention_turns_used: number;
  spaces_landed: number[];
  spaces_collected: number[];
  spaces_ignored: number[];
  spaces_missed: number[];
  spaces_forced: number[];
  fixed_anchor_states: Record<number, ArtifactState | "landed" | "unseen">;
  branch_pair_states: Record<string, BranchPairState>;
  resolved_branch_pairs: BranchPairResolution[];
  unresolved_branch_pairs: string[];
  dominant_zones: string[];
  dominant_reality_layers: string[];
  ending_pressure: string[];
  final_response: string;
  last_glass_reached: boolean;
}

export interface RippleGameState {
  version: 3;
  boardId: string;
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
  boardRun: LifeBoardRunState;
  finalStory?: FinalStoryResult;
}

export interface RippleGameSetup {
  modeId: GameModeId;
  characterId: string;
}
