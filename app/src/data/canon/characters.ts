import type { CharacterPathState } from "../../engine/types";

export interface CanonCharacter {
  id: string;
  name: string;
  pathName: string;
  startingBranch: string;
  boardRole: string;
}

export const canonCharacters: CanonCharacter[] = [
  {
    id: "mara",
    name: "Mara",
    pathName: "Witness Path",
    startingBranch: "careful witness",
    boardRole: "Reads whether the room tells the truth before it decides.",
  },
  {
    id: "jamal",
    name: "Jamal",
    pathName: "Form Path",
    startingBranch: "record before verdict",
    boardRole: "Reads when language, forms, and labels start becoming structure.",
  },
  {
    id: "maren",
    name: "Maren",
    pathName: "Safety Path",
    startingBranch: "steady room",
    boardRole: "Reads pressure, mood, and whether the room can pause safely.",
  },
  {
    id: "dev",
    name: "Dev",
    pathName: "Access Path",
    startingBranch: "visible door",
    boardRole: "Reads whether a path is actually open or only drawn on the wall.",
  },
  {
    id: "teodor-scott",
    name: "Teodor / Scott",
    pathName: "Return Path",
    startingBranch: "design witness",
    boardRole: "Reads the board as a system that must stay playable and accountable.",
  },
];

export function initialCharacterPath(characterId: string, position: number): CharacterPathState {
  const character = canonCharacters.find((entry) => entry.id === characterId);

  return {
    characterId,
    currentPosition: position,
    currentBranch: character?.startingBranch ?? "unopened path",
    carriedArtifacts: [],
    pressureState: "steady",
    interventionCount: 0,
    missedInterventionCount: 0,
    rippleCount: 0,
    currentEndingTendency: "unformed",
    sourceContactCount: 0,
  };
}
