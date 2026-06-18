import type { LayerCard, Mode, StoryBoulder, StorySpace } from "../engine/types";
import { boardPreviewText as canonBoardPreviewText, canonBoardSpaces } from "./canon/boardSpaces";

export function buildStorySpaces(_storyBoulders?: StoryBoulder[], _layerCards?: LayerCard[]): StorySpace[] {
  return canonBoardSpaces;
}

export function boardPreviewText(space: StorySpace, mode: Mode): { visibility: "hidden" | "hint" | "full"; label: string; detail: string } {
  return canonBoardPreviewText(space, mode);
}
