export type Mode = "mystery" | "vague" | "experimental";
export type SeedKey = "A" | "B" | "C";
export type BoulderAction = "observe" | "name" | "move" | "ignore";
export type TurnAction =
  | BoulderAction
  | "introduce-story-boulder"
  | "ask-room"
  | "archive-weight"
  | "refuse-weight"
  | "dice-space";
export type BoardScaleView = "room" | "society" | "archive";
export type HaloState = "dim" | "bright" | "pulsing" | "double" | "clipped";
export type MeterKey =
  | keyof PressureValues
  | "rufs"
  | "mood"
  | "safety"
  | "agency"
  | "trust"
  | "meaning";
export type InspectorKind =
  | "help"
  | "meter"
  | "agent"
  | "boulder"
  | "halo"
  | "law"
  | "society"
  | "story-boulder"
  | "layer-card";
export type SocietyNodeKey =
  | "boulder-room"
  | "social-reality"
  | "institutional-reality"
  | "laws"
  | "observer-inputs"
  | "rufs-mood"
  | "nested-simulation";
export type ObserverInputType =
  | "Artifact Name"
  | "Crisis Label"
  | "Policy Proposal"
  | "Doctrine"
  | "Era Marker"
  | "Myth Seed";

export interface PressureValues {
  witness: number;
  namedWeight: number;
  institution: number;
  concern: number;
}

export interface StoryBoulder {
  id: string;
  name: string;
  sourceType: "chapter" | "artifact" | "note" | "layer" | "fieldnote";
  sourceFile: string;
  sourceChapter?: string;
  sourceNote?: string;
  shortDescription: string;
  plainLanguageMeaning: string;
  symbolicFunction: string;
  relatedCharacters: string[];
  relatedLayers: string[];
  pressureProfile: PressureValues;
  possibleInterpretations: string[];
  unlockCondition?: string;
  inspectorCopy: string[];
  triggerTags: string[];
  targetFit: Record<string, string>;
}

export type StorySpaceType =
  | "story"
  | "layer"
  | "artifact"
  | "law"
  | "mask"
  | "spectacle"
  | "boundary"
  | "simulation";

export interface StorySpace {
  id: string;
  title: string;
  alternateId?: string;
  alternateTitle?: string;
  mirrorsChapter?: string;
  chapterTitle?: string;
  sourceLinks?: string[];
  layers?: string[];
  artifactEchoes?: string[];
  spaceIndex?: number;
  sourceFile: string;
  sourceTitle: string;
  type: StorySpaceType;
  shortMeaning: string;
  plainMeaning: string;
  interventionText?: string;
  missedText?: string;
  rippleText?: string;
  artifactHooks?: string[];
  possibleEndStateImpact?: {
    intervention: string;
    ripple: string;
    missed: string;
  };
  relatedStoryWeightIds: string[];
  relatedLayerIds: string[];
  relatedCharacters: string[];
  baseMeterEffects: PressureValues;
  modeVisibility: Record<Mode, "hidden" | "hint" | "full">;
  mysteryText: string;
  vagueText: string;
  experimentalText: string;
  triggerPattern: string;
  characterReadings: Record<string, string>;
}

export interface LayerCard {
  id: string;
  name: string;
  cardType: string;
  sourceFile: string;
  plainLanguageMeaning: string;
  whatItChanges: string;
  relatedMeters: MeterKey[];
  relatedCharacters: string[];
  relatedBoulders: string[];
  unlockCondition?: string;
  inspectorExplanation: string;
}

export interface PressureChange {
  key: keyof PressureValues;
  label: string;
  before: number;
  after: number;
  delta: number;
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
  associatedBoulders: string[];
  emotionalTriggers: string[];
  preferredLayers: string[];
  fearedLayers: string[];
  interpretationTendencies: string[];
  boulderReactions: Partial<Record<string, string>>;
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

export type EventType = "base" | "observer" | "agent" | "social" | "institutional" | "law";

export interface EventEntry {
  id: string;
  turn: number;
  type: EventType;
  text: string;
}

export interface LawState {
  id: string;
  name: string;
  description: string;
  formedTurn: number;
}

export interface RealityMetricSnapshot {
  turn: number;
  pressures: PressureValues;
  rufs: number;
  mood: number;
  happiness: number;
  safety: number;
  agency: number;
  trust: number;
  meaning: number;
  pressureLoad: number;
  label: string;
}

export interface ObserverInputClassification {
  turn: number;
  text: string;
  classification: ObserverInputType;
  explanation: string;
  interpretationNote: string;
}

export interface InterpretationEntry {
  turn: number;
  action: TurnAction;
  observerText?: string;
  observerClassification?: ObserverInputType;
  stage: "opens" | "narrows" | "stabilizes" | "enters-memory";
  roomInterpretation: string;
  storyObjectId?: string;
  targetCharacterId?: string;
}

export interface InspectorItem {
  id: string;
  kind: InspectorKind;
  title: string;
  summary: string;
  details: string[];
  typeLabel?: string;
  sourceFile?: string;
  plainLanguageMeaning?: string;
  whyItMatters?: string;
  affects?: string[];
  currentContext?: string;
  suggestedNextAction?: string;
  relatedSource?: string;
  currentValue?: string;
  previousValue?: string;
  delta?: string;
}

export interface TurnFeedback {
  turn: number;
  processedAction: string;
  pressureChanges: PressureChange[];
  agentReactionCount: number;
  agentReactions: string[];
  baseEvent?: string;
  perceivedReality?: string;
  socialReality?: string;
  institutionalPressure?: string;
  lawProgress: string[];
  formedLaws: LawState[];
  observerInput?: ObserverInputClassification;
  metrics: RealityMetricSnapshot;
  interpretation: InterpretationEntry;
  storyObjectUse?: StoryObjectUse;
}

export interface StoryObjectUse {
  turn: number;
  objectId: string;
  objectName: string;
  objectType: "story-boulder" | "layer-card" | "board-space";
  sourceFile: string;
  target: "room" | "character";
  targetCharacterId?: string;
  targetName?: string;
  plainLanguageMeaning: string;
  resultingInterpretation: string;
}

export type RealityOutcome = "Intervention Point" | "Ripple Event" | "Missed Intervention Point";

export type ArtifactEffectType =
  | "none"
  | "protect"
  | "convert-missed"
  | "redirect"
  | "reveal-hidden"
  | "affect-other"
  | "delay"
  | "room-state"
  | "society-state"
  | "log-language";

export interface CanonArtifact {
  id: string;
  name: string;
  sourceFile: string;
  plainMeaning: string;
  effectType: ArtifactEffectType;
  effectText: string;
  relatedLayers: string[];
}

export interface ArtifactDieResult {
  die: number;
  artifactId?: string;
  artifactName: string;
  effectType: ArtifactEffectType;
  effectText: string;
  modifiedRealityOutcome?: RealityOutcome;
}

export interface DiceRoll {
  dieA: number;
  dieB: number;
  total: number;
  realityDie: number;
  artifactDie: number;
  realityOutcome: RealityOutcome;
  artifact: ArtifactDieResult;
}

export interface CharacterPathState {
  characterId: string;
  currentPosition: number;
  currentBranch: string;
  carriedArtifacts: string[];
  pressureState: "steady" | "watchful" | "strained";
  interventionCount: number;
  missedInterventionCount: number;
  rippleCount: number;
  currentEndingTendency: "unformed" | "intervention" | "ripple" | "missed";
  sourceContactCount: number;
}

export interface BoardLanding {
  turn: number;
  round: number;
  agentId: string;
  agentName: string;
  fromPosition: number;
  toPosition: number;
  dice: DiceRoll;
  movementText: string;
  spaceId: string;
  spaceTitle: string;
  alternateId?: string;
  alternateTitle?: string;
  mirrorsChapter?: string;
  spaceIndex?: number;
  sourceFile: string;
  sourceTitle: string;
  sourceLinks?: string[];
  plainMeaning: string;
  realityOutcome: RealityOutcome;
  revealedOutcome: RealityOutcome;
  interventionText: string;
  missedText: string;
  rippleText: string;
  characterReading: string;
  roomResponse: string;
  societyResponse: string;
  resultText: string;
  artifactName: string;
  artifactEffect: string;
  branchText: string;
  characterPath: CharacterPathState;
  meterEffects: PressureValues;
  affectedLayers: string[];
  lawsFormed: LawState[];
}

export interface BoardTurnState {
  currentRound: number;
  currentTurn: number;
  currentAgentId: string;
  currentAgentIndex: number;
  hasRolledThisTurn: boolean;
  lastDiceRoll?: DiceRoll;
  lastLandingSpaceId?: string;
  boardPositions: Record<string, number>;
  characterPaths: Record<string, CharacterPathState>;
  roomState: string;
  societyState: string;
  sourceContact: string[];
  artifactsUsed: string[];
  completedTurns: string[];
  landings: BoardLanding[];
  roundSummaries: RoundSummary[];
}

export interface BoardSpacePreview {
  rollTotal: number;
  landingPosition: number;
  space: StorySpace;
  visibility: "hidden" | "hint" | "full";
  label: string;
  detail: string;
}

export interface RoundSummary {
  round: number;
  landedSpaces: string[];
  charactersMoved: string[];
  strongestMeterChange: string;
  lawsFormed: LawState[];
  societyEffect: string;
  nestedSimulationProgress: NestedSimulationProgress;
}

export interface NestedSimulationProgress {
  completedRounds: number;
  roundGoal: number;
  charactersLanded: number;
  characterGoal: number;
  lawsFormed: number;
  lawGoal: number;
  sourceDocumentsUsed: number;
  sourceGoal: number;
  exportedRun: boolean;
  simulationSeedGenerated: boolean;
  unlocked: boolean;
  remaining: string[];
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
  actionsTaken: Array<{ turn: number; action: TurnAction; label: string }>;
  observerInputs: ObserverInputClassification[];
  interpretationHistory: InterpretationEntry[];
  meterHistory: RealityMetricSnapshot[];
  lastTurnFeedback?: TurnFeedback;
  boulderName?: string;
  boulderPosition: "center" | "shifted";
  storyObjectUses: StoryObjectUse[];
  boardTurn: BoardTurnState;
  exportedRun?: boolean;
}

export interface SetupSelection {
  mode: Mode;
  selectedSeeds: Record<string, SeedKey>;
}
