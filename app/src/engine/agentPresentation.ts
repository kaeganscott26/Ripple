import type { ActiveAgent, HaloState } from "./types";
import { deriveHaloState, haloLabel } from "./realityMetrics";

export interface AgentPresentation {
  tokenName: string;
  tokenMark: string;
  tokenShape: string;
  haloState: HaloState;
  haloLabel: string;
}

const tokenMap: Record<string, Pick<AgentPresentation, "tokenName" | "tokenMark" | "tokenShape">> = {
  mara: { tokenName: "Threshold Lens", tokenMark: "M", tokenShape: "lens" },
  jamal: { tokenName: "Path Marker", tokenMark: "J", tokenShape: "marker" },
  maren: { tokenName: "Boundary Seal", tokenMark: "R", tokenShape: "seal" },
  dev: { tokenName: "Door Token", tokenMark: "D", tokenShape: "door" },
  "teodor-scott": { tokenName: "Origin Compass", tokenMark: "T", tokenShape: "compass" },
};

export function agentPresentation(agent: ActiveAgent): AgentPresentation {
  const token = tokenMap[agent.id] ?? {
    tokenName: "Witness Token",
    tokenMark: agent.name.slice(0, 1).toUpperCase(),
    tokenShape: "marker",
  };
  const haloState = deriveHaloState(agent.pressure);

  return {
    ...token,
    haloState,
    haloLabel: haloLabel(haloState),
  };
}
