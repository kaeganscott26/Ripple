import { buildActiveAgents } from "./memorySystem";
import { createInitialLayers } from "./realityLayers";
import type { AgentData, RunState, SetupSelection } from "./types";

export function createRunState(agents: AgentData[], selection: SetupSelection): RunState {
  const activeAgents = buildActiveAgents(agents, selection.mode, selection.selectedSeeds);

  return {
    mode: selection.mode,
    turn: 0,
    currentRoomId: "boulder-room",
    agents: activeAgents,
    pressures: { witness: 0, namedWeight: 0, institution: 0, concern: 0 },
    layers: createInitialLayers(),
    laws: [],
    events: [],
    actionsTaken: [],
    observerInputs: [],
    boulderPosition: "center",
  };
}
