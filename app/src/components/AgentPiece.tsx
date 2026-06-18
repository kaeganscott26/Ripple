import type { CSSProperties } from "react";
import type { ActiveAgent, HaloState, Mode } from "../engine/types";
import { agentPresentation } from "../engine/agentPresentation";
import { seedDisplay } from "../engine/memorySystem";
import { StateHalo } from "./StateHalo";

interface AgentPieceProps {
  agent: ActiveAgent;
  mode: Mode;
  onSelect: (agent: ActiveAgent) => void;
  onSelectHalo: (state: HaloState) => void;
  isSelected?: boolean;
  slot: number;
}

const boardPositions = [
  { x: 18, y: 26 },
  { x: 76, y: 28 },
  { x: 24, y: 72 },
  { x: 74, y: 70 },
  { x: 50, y: 18 },
];

export function AgentPiece({ agent, mode, onSelect, onSelectHalo, isSelected, slot }: AgentPieceProps) {
  const presentation = agentPresentation(agent);
  const position = boardPositions[slot % boardPositions.length];

  return (
    <article
      className={`agent-piece ${presentation.tokenShape} ${presentation.haloState} ${isSelected ? "selected-agent-piece" : ""}`}
      style={{ "--piece-x": `${position.x}%`, "--piece-y": `${position.y}%` } as CSSProperties}
      title={`${agent.name}: ${presentation.haloLabel}`}
    >
      <button
        aria-label={`${agent.name} ${presentation.haloLabel} halo`}
        className="halo-button"
        onClick={() => onSelectHalo(presentation.haloState)}
        type="button"
      >
        <StateHalo state={presentation.haloState} title={presentation.haloLabel} />
      </button>
      <button className="agent-token-mark" onClick={() => onSelect(agent)} type="button">
        {presentation.tokenMark}
      </button>
      <span className="agent-piece-label">{agent.name}</span>
      <span className="agent-piece-seed">
        {mode === "mystery" && !agent.lastReaction ? "Hidden" : seedDisplay(agent, mode)}
      </span>
    </article>
  );
}
