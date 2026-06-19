import type { CharacterConfig, GameModeConfig } from "../engine/gameTypes";

export const gameModes: GameModeConfig[] = [
  {
    id: "mystery",
    name: "Mystery",
    summary: "The glass withholds layer names and speaks only in symbols.",
    glassTone: "oblique, spare, uncanny but grounded",
    revealsLayer: false,
    referenceAccess: "hidden",
  },
  {
    id: "vague",
    name: "Vague",
    summary: "The board names spaces while the glass leaves room for interpretation.",
    glassTone: "poetic, readable, unresolved",
    revealsLayer: true,
    referenceAccess: "optional",
  },
  {
    id: "experimental",
    name: "Experimental / Master",
    summary: "Layer labels, prompt anatomy, and optional reference material remain inspectable.",
    glassTone: "symbolic, precise, structurally self-aware",
    revealsLayer: true,
    referenceAccess: "expanded",
  },
];

export const characterConfigs: CharacterConfig[] = [
  {
    id: "mara",
    name: "Mara",
    role: "Threshold Witness",
    lens: "notices pressure before it becomes command",
    question: "Who controls the threshold?",
  },
  {
    id: "jamal",
    name: "Jamal",
    role: "Room Mapper",
    lens: "notices the architecture hidden by official records",
    question: "What did the room contribute?",
  },
  {
    id: "maren",
    name: "Maren",
    role: "Boundary Keeper",
    lens: "notices when elegant language becomes unsafe",
    question: "What keeps this interpretation safe?",
  },
  {
    id: "dev",
    name: "Dev",
    role: "Door Reader",
    lens: "notices whether visible access is actually reachable",
    question: "Is this door meant to open?",
  },
  {
    id: "teodor-scott",
    name: "Teodor / Scott",
    role: "Origin Builder",
    lens: "notices how one room becomes the ancestor of another",
    question: "What does this consequence build next?",
  },
];

export function modeConfig(id: GameModeConfig["id"]): GameModeConfig {
  return gameModes.find((mode) => mode.id === id) ?? gameModes[1];
}

export function characterConfig(id: string): CharacterConfig {
  return characterConfigs.find((character) => character.id === id) ?? characterConfigs[0];
}

