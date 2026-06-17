export type Mode = "mystery" | "vague" | "experimental";
export type SeedKey = "A" | "B" | "C";
export type BoulderAction = "observe" | "name" | "move" | "ignore";

export interface PressureValues {
  witness: number;
  namedWeight: number;
  institution: number;
  concern: number;
}

export interface SeedData {
  label: string;
  compactMemory: string;
  fear: string;
  desire: string;
  distortion: string;
  triggerTags: string[];
  reactionWeights: PressureValues;
}

export interface AgentData {
  id: string;
  name: string;
  role: string;
  identityCore: string;
  seeds: Record<SeedKey, SeedData>;
}

export interface ActiveAgent extends AgentData {
  activeSeed: SeedKey;
  revealed: boolean;
  pressure: PressureValues;
  lastReaction?: string;
}

export interface RoomData {
  id: string;
  name: string;
  function: string;
  pressure: string;
  artifactIds: string[];
  adjacentRoomIds: string[];
}

export interface ArtifactData {
  id: string;
  name: string;
  role: string;
  description: string;
  state: string;
  availableActions: BoulderAction[];
}

export interface ActionRule {
  label: string;
  baseEvent: string;
  pressure: PressureValues;
  socialSignal: string;
}

export interface LawRule {
  name: string;
  description: string;
  thresholds: Partial<PressureValues>;
}

export interface RulesData {
  actions: Record<BoulderAction, ActionRule>;
  laws: Record<string, LawRule>;
}

export interface RealityLayers {
  base: string[];
  perceived: string[];
  social: string[];
  institutional: string[];
}

export interface EventEntry {
  id: string;
  turn: number;
  layer: keyof RealityLayers | "agent" | "law";
  text: string;
}

export interface LawState {
  id: string;
  name: string;
  description: string;
  formedTurn: number;
}

export interface RunState {
  mode: Mode;
  turn: number;
  currentRoomId: string;
  agents: ActiveAgent[];
  pressures: PressureValues;
  layers: RealityLayers;
  laws: LawState[];
  events: EventEntry[];
  actionsTaken: Array<{ turn: number; action: BoulderAction; label: string }>;
  boulderName?: string;
  boulderPosition: "center" | "shifted";
}

export interface SetupSelection {
  mode: Mode;
  selectedSeeds: Record<string, SeedKey>;
}
