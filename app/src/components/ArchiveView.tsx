import type { ArchiveDocument } from "../data/archiveDocuments";
import type { AgentData, LayerCard, StoryBoulder } from "../engine/types";

interface ArchiveViewProps {
  documents: ArchiveDocument[];
  selectedDocument: ArchiveDocument;
  storyBoulders: StoryBoulder[];
  layerCards: LayerCard[];
  agents: AgentData[];
  highlightedStoryWeightId?: string;
  onSelectDocument: (documentId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onReturnToRoom: () => void;
}

export function ArchiveView({
  agents,
  documents,
  highlightedStoryWeightId,
  layerCards,
  onNext,
  onPrevious,
  onReturnToRoom,
  onSelectDocument,
  selectedDocument,
  storyBoulders,
}: ArchiveViewProps) {
  const relatedWeights = selectedDocument.relatedStoryWeights
    .map((id) => storyBoulders.find((boulder) => boulder.id === id))
    .filter(Boolean) as StoryBoulder[];
  const relatedLayers = selectedDocument.relatedLayers
    .map((id) => layerCards.find((card) => card.id === id))
    .filter(Boolean) as LayerCard[];
  const relatedCharacters = selectedDocument.relatedCharacters
    .map((id) => agents.find((agent) => agent.id === id))
    .filter(Boolean) as AgentData[];

  return (
    <section className="archive-view">
      <aside className="archive-browser panel">
        <p className="eyebrow">Archive View</p>
        <h2>INTERVENTION Source</h2>
        <p className="quiet-line">
          Story Weights are pieces of the INTERVENTION archive that can enter the room. When you introduce one, the
          room interprets it and the meters change.
        </p>
        <div className="archive-document-list" aria-label="Archive documents">
          {documents.map((document) => (
            <button
              className={document.id === selectedDocument.id ? "selected" : ""}
              key={document.id}
              onClick={() => onSelectDocument(document.id)}
              type="button"
            >
              <span>{document.sourceType}</span>
              <strong>{document.title}</strong>
            </button>
          ))}
        </div>
      </aside>

      <article className="archive-reader panel">
        <div className="archive-reader-header">
          <div>
            <p className="eyebrow">{selectedDocument.sourceType}</p>
            <h2>{selectedDocument.title}</h2>
            <span>{selectedDocument.sourceFile}</span>
          </div>
          <button className="secondary-action compact-action" onClick={onReturnToRoom} type="button">
            Return to Room View
          </button>
        </div>

        <p className="archive-summary">{selectedDocument.plainLanguageSummary}</p>

        <div className="archive-nav">
          <button className="ghost-action compact-action" onClick={onPrevious} type="button">
            Previous
          </button>
          <button className="ghost-action compact-action" onClick={onNext} type="button">
            Next
          </button>
        </div>

        <section className="related-game-objects">
          <h3>Related Game Objects</h3>
          {relatedWeights.length === 0 && relatedLayers.length === 0 && relatedCharacters.length === 0 && (
            <p className="quiet-line">No linked board objects have been curated for this document yet.</p>
          )}
          {relatedWeights.length > 0 && (
            <div>
              <span>Story Weights</span>
              <ul className="compact-list">
                {relatedWeights.map((weight) => (
                  <li className={weight.id === highlightedStoryWeightId ? "highlighted-related-object" : ""} key={weight.id}>
                    {weight.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {relatedLayers.length > 0 && (
            <div>
              <span>Layer Cards</span>
              <ul className="compact-list">
                {relatedLayers.map((layer) => (
                  <li key={layer.id}>{layer.name}</li>
                ))}
              </ul>
            </div>
          )}
          {relatedCharacters.length > 0 && (
            <div>
              <span>Characters</span>
              <ul className="compact-list">
                {relatedCharacters.map((agent) => (
                  <li key={agent.id}>{agent.name}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <pre className="archive-content">{selectedDocument.content}</pre>
      </article>
    </section>
  );
}
