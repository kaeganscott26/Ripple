import type { BoardSpaceConfig, CharacterBoard } from "../../engine/gameTypes";
import { boardSpaces as genericBoardSpaces } from "../liveBoard";
import { teodorScottBoard } from "./teodorScottBoard";

export interface PlayableBoard {
  id: string;
  characterId: string;
  name: string;
  totalSpaces: number;
  spaces: BoardSpaceConfig[];
  authored?: CharacterBoard;
}

const genericBoard: PlayableBoard = {
  id: "ripple-canonical-board",
  characterId: "generic",
  name: "Ripple Prototype Board",
  totalSpaces: genericBoardSpaces.length,
  spaces: genericBoardSpaces,
};

export function boardForCharacter(characterId: string): PlayableBoard {
  if (characterId === teodorScottBoard.characterId) {
    return {
      id: teodorScottBoard.id,
      characterId,
      name: teodorScottBoard.name,
      totalSpaces: teodorScottBoard.totalSpaces,
      spaces: teodorScottBoard.spaces,
      authored: teodorScottBoard,
    };
  }
  return genericBoard;
}

export { teodorScottBoard };
