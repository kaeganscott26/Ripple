import { buildActiveAgents } from "./memorySystem";
import { calculateRealityMetrics } from "./realityMetrics";
import { createInitialLayers } from "./realityLayers";
import type { AgentData, RunState, SetupSelection } from "./types";

export function createRunState(agents: AgentData[], selection: SetupSelection): RunState {
  const activeAgents = buildActiveAgents(agents, selection.mode, selection.selectedSeeds);
  const state: RunState = {
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
    interpretationHistory: [],
    meterHistory: [],
    boulderPosition: "center",
  };
  const initialMetrics = calculateRealityMetrics(state);

  return {
    ...state,
    meterHistory: [initialMetrics],
  };
}
