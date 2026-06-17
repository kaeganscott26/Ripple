import type { CSSProperties } from "react";
import type { ActiveAgent, Mode } from "../engine/types";
import { agentPresentation } from "../engine/agentPresentation";
import { seedDisplay } from "../engine/memorySystem";
import { StateHalo } from "./StateHalo";

interface AgentPieceProps {
  agent: ActiveAgent;
  mode: Mode;
  slot: number;
}

const boardPositions = [
  { x: 18, y: 26 },
  { x: 76, y: 28 },
  { x: 24, y: 72 },
  { x: 74, y: 70 },
  { x: 50, y: 18 },
];

export function AgentPiece({ agent, mode, slot }: AgentPieceProps) {
  const presentation = agentPresentation(agent);
  const position = boardPositions[slot % boardPositions.length];

  return (
    <article
      className={`agent-piece ${presentation.tokenShape} ${presentation.haloState}`}
      style={{ "--piece-x": `${position.x}%`, "--piece-y": `${position.y}%` } as CSSProperties}
      title={`${agent.name}: ${presentation.haloLabel}`}
    >
      <StateHalo state={presentation.haloState} />
      <span className="agent-token-mark">{presentation.tokenMark}</span>
      <span className="agent-piece-label">{agent.name}</span>
      <span className="agent-piece-seed">
        {mode === "mystery" && !agent.lastReaction ? "Hidden" : seedDisplay(agent, mode)}
      </span>
    </article>
  );
}
