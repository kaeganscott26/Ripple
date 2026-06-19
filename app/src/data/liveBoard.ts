import type { BoardSpaceConfig, LiveBoardDataset, RealityLayerId } from "../engine/gameTypes";

type SpaceSeed = Omit<BoardSpaceConfig, "order" | "live">;

const seeds: SpaceSeed[] = [
  ["first-threshold", "First Threshold", "threshold", "natural", "△", "Chalk Key", ["threshold", "key", "weather"], ["the first door remembers rain", "enter without naming the storm"], "The threshold closes behind you.", ["natural", "geometry-as-consequence"]],
  ["weather-room", "Weather Room", "weather", "natural", "☂", "Pressure Map", ["weather", "pressure", "map"], ["carry no command from thunder", "pressure writes on every window"], "The room keeps the pressure you refused.", ["weather", "natural"]],
  ["quiet-form", "Quiet Form", "archive", "power", "□", "Blank Form", ["form", "blank", "record"], ["the blank line has authority", "sign only what stayed visible"], "Your name enters the form without context.", ["power-governance", "clinical-reality"]],
  ["decorative-door", "Decorative Door", "threshold", "power", "⌑", "Unrendered Handle", ["door", "access", "render"], ["a visible door can still refuse", "the handle renders for someone else"], "The painted doorway becomes your only exit.", ["geometry-as-consequence", "power-governance"]],
  ["echo-corridor", "Echo Corridor", "signal", "media", "≈", "Second Voice", ["echo", "signal", "voice"], ["your echo arrives wearing another name", "context walks slower than sound"], "The echo speaks first and keeps your answer.", ["media-communication", "attention-collapse"]],
  ["glass-date", "Glass Date", "archive", "cultural", "0826", "Future Date", ["date", "glass", "future"], ["0826 waits behind the glass", "the date remembers a different room"], "The date attaches itself to your next memory.", ["cultural", "self-awareness"]],
  ["sleeping-server", "Sleeping Server", "room", "software", "▣", "Orphaned Packet", ["server", "packet", "sleep"], ["the server dreams in missing packets", "an error waits without accusation"], "The undelivered message becomes a locked process.", ["software-systems", "dream"]],
  ["masking-station", "Masking Station", "room", "clinical", "◐", "Borrowed Face", ["mask", "face", "station"], ["which face paid for quiet", "the room applauds your borrowed weather"], "The mask hardens before you can set it down.", ["clinical-reality", "self-awareness"]],
  ["rabbit-window", "Rabbit Window", "threshold", "dream", "◇", "White Thread", ["rabbit", "window", "thread"], ["follow nothing that cannot release you", "the white thread refuses prophecy"], "The window repeats until you name it fiction.", ["dream", "boundary"]],
  ["attention-well", "Attention Well", "room", "clinical", "○", "Dropped Name", ["attention", "well", "name"], ["the well keeps only repeated names", "look away before meaning becomes gravity"], "One detail grows heavy enough to hide the room.", ["attention-collapse", "clinical-reality"]],
  ["spectacle-square", "Spectacle Square", "signal", "media", "✦", "Black Frame", ["spectacle", "frame", "crowd"], ["the frame is louder than the event", "applause edits the witness"], "The crowd receives the frame instead of the event.", ["media-communication", "power-governance"]],
  ["ordinary-kitchen", "Ordinary Kitchen", "room", "cultural", "⌂", "Warm Cup", ["kitchen", "cup", "ordinary"], ["the ordinary room holds", "leave one chair outside the theory"], "The empty chair remembers who was not invited.", ["cultural", "clinical-reality"]],
  ["split-layer", "Split Layer", "threshold", "self-awareness", "⋮", "Two-Sided Note", ["split", "note", "observer"], ["both readings cast one shadow", "choose the witness not the verdict"], "The discarded reading becomes the stronger shadow.", ["self-awareness", "theory"]],
  ["unexplained-field", "Unexplained Field", "weather", "natural", "?", "Unfixed Compass", ["unexplained", "field", "compass"], ["uncertainty is not an instruction", "the compass declines to become proof"], "The unanswered signal follows at a safe distance.", ["unexplained", "natural"]],
  ["curators-stair", "Curator's Stair", "archive", "cultural", "⌁", "Index Card", ["curator", "index", "stair"], ["the index points outside itself", "archive the door not the person"], "The catalog files you under an unfinished word.", ["cultural", "theory"]],
  ["power-lift", "Power Lift", "room", "power", "⇧", "Brass Button", ["power", "lift", "button"], ["every floor calls the button choice", "authority travels without climbing"], "The lift chooses a floor you cannot authorize.", ["power-governance", "geometry-as-consequence"]],
  ["dream-bridge", "Dream Bridge", "threshold", "dream", "⌒", "Sleep Token", ["dream", "bridge", "token"], ["cross lightly; waking owns the shore", "the bridge ends before belief"], "The dream leaves weather, never orders.", ["dream", "boundary"]],
  ["boulder-yard", "Boulder Yard", "room", "natural", "●", "Small Boulder", ["boulder", "weight", "yard"], ["move the weight without making law", "the stone remembers no villain"], "The weight remains visible and blocks one path.", ["natural", "geometry-as-consequence"]],
  ["ignored-layer", "Ignored Layer", "archive", "self-awareness", "∅", "Missing Margin", ["ignored", "margin", "layer"], ["what was ignored changed position", "the margin keeps the first warning"], "The missing margin returns as the main text.", ["self-awareness", "attention-collapse"]],
  ["community-antenna", "Community Antenna", "signal", "media", "⌁", "Shared Frequency", ["community", "antenna", "frequency"], ["receive together without becoming one", "the antenna bends toward quiet voices"], "The strongest voice occupies the shared frequency.", ["media-communication", "cultural"]],
  ["clinical-handrail", "Clinical Handrail", "threshold", "clinical", "╱", "Safety Card", ["handrail", "safety", "body"], ["the body outranks the riddle", "hold the rail; release the theory"], "The handrail stops the symbol from becoming command.", ["clinical-reality", "boundary"]],
  ["software-garden", "Software Garden", "room", "software", "{ }", "Mutable Seed", ["software", "seed", "feedback"], ["the output replants its input", "debug the room that grows next"], "The unhandled state becomes tomorrow's default.", ["software-systems", "theory"]],
  ["return-current", "Return Current", "return", "natural", "↶", "River Coin", ["return", "current", "coin"], ["return changed, not corrected", "the current carries no verdict"], "The current returns what you left unnamed.", ["natural", "self-awareness"]],
  ["last-glass", "Last Glass", "return", "self-awareness", "◎", "Open Ending", ["glass", "ending", "story"], ["the ending opens inward", "make a story, not a record"], "The glass keeps the ending open long enough to change.", ["self-awareness", "theory"]],
].map(([id, name, kind, realityLayer, symbol, artifactName, artifactVocabulary, glassSeeds, forcedConsequence, referenceIds]) => ({
  id,
  name,
  kind,
  realityLayer,
  symbol,
  artifactName,
  artifactVocabulary,
  glassSeeds,
  forcedConsequence,
  referenceIds,
})) as SpaceSeed[];

export const liveBoard: LiveBoardDataset = {
  id: "ripple-canonical-board",
  schemaVersion: 1,
  revision: "2026.06.19-pivot",
  updatedAt: "2026-06-19T00:00:00-05:00",
  source: "bundled",
  spaces: seeds.map((space, index) => ({
    ...space,
    order: index,
    live: { enabled: true, revision: 1, remoteKey: `ripple-space-${String(index).padStart(2, "0")}` },
  })),
};

export const boardSpaces = liveBoard.spaces.filter((space) => space.live.enabled);

export const realityLayerLabels: Record<RealityLayerId, string> = {
  natural: "Natural Layer",
  clinical: "Clinical Reality Layer",
  dream: "Dream Layer",
  cultural: "Cultural Layer",
  media: "Media & Communication Layer",
  power: "Power & Governance Layer",
  software: "Software Systems Layer",
  "self-awareness": "Self-Awareness Layer",
};

