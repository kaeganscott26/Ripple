import { agentPresentation } from "../engine/agentPresentation";
import { seedDisplay } from "../engine/memorySystem";
import { bouldersForAgent, explainStoryBoulder, whyBoulderMattersToAgent } from "../engine/storyObjects";
import type { ActiveAgent, InspectorItem, Mode, StoryBoulder } from "../engine/types";

interface CharacterTargetPanelProps {
  agents: ActiveAgent[];
  mode: Mode;
  selectedCharacterId?: string;
  selectedBoulder?: StoryBoulder;
  storyBoulders: StoryBoulder[];
  onSelectCharacter: (agentId?: string) => void;
  onInspect: (item: InspectorItem) => void;
}

export function CharacterTargetPanel({
  agents,
  mode,
  selectedCharacterId,
  selectedBoulder,
  storyBoulders,
  onSelectCharacter,
  onInspect,
}: CharacterTargetPanelProps) {
  const selectedAgent = agents.find((agent) => agent.id === selectedCharacterId);
  const connectedBoulders = selectedCharacterId
    ? bouldersForAgent(storyBoulders, selectedCharacterId).filter((boulder) =>
        selectedAgent?.associatedBoulders.includes(boulder.id),
      )
    : storyBoulders;

  return (
    <section className="panel target-panel">
      <p className="eyebrow">Target</p>
      <h2>{selectedAgent ? selectedAgent.name : "Room"}</h2>

      <div className="target-button-row">
        <button
          className={!selectedCharacterId ? "selected" : ""}
          onClick={() => onSelectCharacter(undefined)}
          type="button"
        >
          Room
        </button>
        {agents.map((agent) => (
          <button
            className={selectedCharacterId === agent.id ? "selected" : ""}
            key={agent.id}
            onClick={() => onSelectCharacter(agent.id)}
            type="button"
          >
            {agent.name}
          </button>
        ))}
      </div>

      {selectedAgent ? (
        <dl>
          <dt>Memory Seed</dt>
          <dd>{seedDisplay(selectedAgent, mode)}</dd>
          <dt>Halo</dt>
          <dd>{agentPresentation(selectedAgent).haloLabel}</dd>
          <dt>Feeling Pressure</dt>
          <dd>
            Witness {selectedAgent.pressure.witness}, Named {selectedAgent.pressure.namedWeight}, Institution{" "}
            {selectedAgent.pressure.institution}, Concern {selectedAgent.pressure.concern}
          </dd>
          <dt>Connected Boulders</dt>
          <dd>{connectedBoulders.length} source-linked weights</dd>
          <dt>Layer Pull</dt>
          <dd>
            Prefers {selectedAgent.preferredLayers.join(", ")}. Fears {selectedAgent.fearedLayers.join(", ")}.
          </dd>
          <dt>Trigger Pattern</dt>
          <dd>{selectedAgent.emotionalTriggers.join(", ")}</dd>
        </dl>
      ) : (
        <p>The selected weight will enter the room itself instead of one character's reality.</p>
      )}

      {selectedBoulder && (
        <p className="selected-fit">
          {whyBoulderMattersToAgent(selectedBoulder, selectedAgent)}
        </p>
      )}

      <div className="target-boulder-list">
        {connectedBoulders.slice(0, 4).map((boulder) => (
          <button
            key={boulder.id}
            onClick={() => onInspect(explainStoryBoulder(boulder, selectedAgent))}
            type="button"
          >
            <strong>{boulder.name}</strong>
            <span>{whyBoulderMattersToAgent(boulder, selectedAgent)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
