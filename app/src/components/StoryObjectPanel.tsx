import {
  buildStoryActionPreview,
  bouldersForAgent,
  explainLayerCard,
  explainStoryBoulder,
  isLayerCardLocked,
  whyBoulderMattersToAgent,
} from "../engine/storyObjects";
import type { ActiveAgent, InspectorItem, LayerCard, StoryBoulder } from "../engine/types";

interface StoryObjectPanelProps {
  agents: ActiveAgent[];
  selectedCharacterId?: string;
  selectedBoulderId?: string;
  storyBoulders: StoryBoulder[];
  layerCards: LayerCard[];
  onSelectBoulder: (boulderId: string) => void;
  onInspect: (item: InspectorItem) => void;
  onIntroduce: () => void;
}

export function StoryObjectPanel({
  agents,
  selectedCharacterId,
  selectedBoulderId,
  storyBoulders,
  layerCards,
  onSelectBoulder,
  onInspect,
  onIntroduce,
}: StoryObjectPanelProps) {
  const selectedAgent = agents.find((agent) => agent.id === selectedCharacterId);
  const orderedBoulders = bouldersForAgent(storyBoulders, selectedCharacterId);
  const selectedBoulder = storyBoulders.find((boulder) => boulder.id === selectedBoulderId) ?? storyBoulders[0];
  const actionPreview = buildStoryActionPreview(selectedBoulder, selectedAgent);

  return (
    <section className="panel story-object-panel">
      <p className="eyebrow">Cards / Artifacts</p>
      <h2>Story Weights</h2>
      <div className="selected-action-summary">
        <span>Selected Weight</span>
        <strong>{selectedBoulder?.name ?? "None"}</strong>
        <p>{selectedBoulder?.plainLanguageMeaning ?? "Choose a story object before advancing."}</p>
      </div>
      <div className="action-preview" aria-live="polite">
        <span>Action Preview</span>
        <p>{actionPreview}</p>
      </div>
      <button className="primary-action" disabled={!selectedBoulder} onClick={onIntroduce} type="button">
        Introduce Selected Boulder
      </button>

      <div className="story-card-list" aria-label="Available story Boulders">
        {orderedBoulders.map((boulder) => {
          const isSelected = selectedBoulderId === boulder.id;
          const isDirect = selectedCharacterId ? boulder.relatedCharacters.includes(selectedCharacterId) : true;

          return (
            <article className={`story-card ${isSelected ? "selected" : ""}`} key={boulder.id}>
              <button onClick={() => onSelectBoulder(boulder.id)} type="button">
                <span>{isDirect ? "Connected" : "Mismatched"}</span>
                <strong>{boulder.name}</strong>
                <small>{boulder.shortDescription}</small>
                <small>{whyBoulderMattersToAgent(boulder, selectedAgent)}</small>
                {isSelected && <small className="selected-card-label">Selected Weight</small>}
              </button>
          <button
            className="inspect-link"
            onClick={() => {
              onSelectBoulder(boulder.id);
              onInspect(explainStoryBoulder(boulder, selectedAgent));
            }}
            type="button"
          >
            Inspect
              </button>
            </article>
          );
        })}
      </div>

      <h3>Layer / Artifact Cards</h3>
      <div className="layer-object-list" aria-label="Available layer cards">
        {layerCards.map((card) => {
          const locked = isLayerCardLocked(card);

          return (
            <button
              className={`layer-object-card ${locked ? "locked" : ""}`}
              key={card.id}
              onClick={() => onInspect(explainLayerCard(card))}
              type="button"
            >
              <span>{locked ? "Locked" : card.cardType}</span>
              <strong>{card.name}</strong>
              <small>{card.plainLanguageMeaning}</small>
              <small className="selected-card-label">Inspect</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
