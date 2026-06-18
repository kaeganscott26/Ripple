import type { ActiveAgent, AgentData, InspectorItem, LayerCard, StoryBoulder } from "./types";

export function storyBoulderById(boulders: StoryBoulder[], id?: string): StoryBoulder | undefined {
  return boulders.find((boulder) => boulder.id === id);
}

export function layerCardById(cards: LayerCard[], id?: string): LayerCard | undefined {
  return cards.find((card) => card.id === id);
}

export function isLayerCardLocked(card: LayerCard): boolean {
  return Boolean(card.unlockCondition?.toLowerCase().startsWith("locked"));
}

export function bouldersForAgent(boulders: StoryBoulder[], agentId?: string): StoryBoulder[] {
  if (!agentId) return boulders;
  const direct = boulders.filter(
    (boulder) => boulder.relatedCharacters.includes(agentId) || Boolean(boulder.targetFit[agentId]),
  );
  const mismatched = boulders.filter((boulder) => !direct.includes(boulder));
  return [...direct, ...mismatched];
}

export function whyBoulderMattersToAgent(boulder: StoryBoulder, agent?: ActiveAgent): string {
  if (!agent) return "No character is selected, so this weight will enter the room itself.";
  return (
    boulder.targetFit[agent.id] ??
    `${agent.name} has no direct source link to this object. Throwing it anyway will test how a mismatched weight changes their room.`
  );
}

export function explainStoryBoulder(boulder: StoryBoulder, agent?: ActiveAgent): InspectorItem {
  return {
    id: `story-boulder-${boulder.id}`,
    kind: "story-boulder",
    title: boulder.name,
    summary: boulder.shortDescription,
    details: [
      boulder.plainLanguageMeaning,
      `Source: ${boulder.sourceFile}${boulder.sourceChapter ? ` (${boulder.sourceChapter})` : ""}.`,
      `Function: ${boulder.symbolicFunction}`,
      `Mechanical pressure: Witness ${boulder.pressureProfile.witness}, Named Weight ${boulder.pressureProfile.namedWeight}, Institutional ${boulder.pressureProfile.institution}, Concern ${boulder.pressureProfile.concern}.`,
      whyBoulderMattersToAgent(boulder, agent),
      ...boulder.inspectorCopy,
    ],
  };
}

export function explainLayerCard(card: LayerCard): InspectorItem {
  return {
    id: `layer-card-${card.id}`,
    kind: "layer-card",
    title: card.name,
    summary: card.plainLanguageMeaning,
    details: [
      `Type: ${card.cardType}.`,
      `Source: ${card.sourceFile}.`,
      `Game effect: ${card.whatItChanges}`,
      `Related meters: ${card.relatedMeters.join(", ")}.`,
      card.unlockCondition ?? "Available at start",
      card.inspectorExplanation,
    ],
  };
}

export function validateStoryBoulderData(boulders: StoryBoulder[]): boolean {
  return boulders.every(
    (boulder) =>
      Boolean(boulder.id) &&
      Boolean(boulder.name) &&
      Boolean(boulder.sourceFile) &&
      Boolean(boulder.plainLanguageMeaning) &&
      Array.isArray(boulder.relatedCharacters) &&
      Array.isArray(boulder.relatedLayers) &&
      typeof boulder.pressureProfile?.witness === "number" &&
      typeof boulder.pressureProfile?.namedWeight === "number" &&
      typeof boulder.pressureProfile?.institution === "number" &&
      typeof boulder.pressureProfile?.concern === "number",
  );
}

export function validateLayerCardData(cards: LayerCard[]): boolean {
  return cards.every(
    (card) =>
      Boolean(card.id) &&
      Boolean(card.name) &&
      Boolean(card.sourceFile) &&
      Boolean(card.plainLanguageMeaning) &&
      Boolean(card.whatItChanges) &&
      Array.isArray(card.relatedMeters) &&
      Array.isArray(card.relatedBoulders),
  );
}

export function validateAgentStoryProfiles(agents: AgentData[], boulders: StoryBoulder[], cards: LayerCard[]): boolean {
  const boulderIds = new Set(boulders.map((boulder) => boulder.id));
  const cardIds = new Set(cards.map((card) => card.id));

  return agents.every(
    (agent) =>
      agent.associatedBoulders.length > 0 &&
      agent.associatedBoulders.every((id) => boulderIds.has(id)) &&
      agent.emotionalTriggers.length > 0 &&
      agent.preferredLayers.length > 0 &&
      agent.preferredLayers.every((id) => cardIds.has(id)) &&
      agent.fearedLayers.length > 0 &&
      agent.interpretationTendencies.length > 0 &&
      Object.keys(agent.boulderReactions).every((id) => boulderIds.has(id)),
  );
}
