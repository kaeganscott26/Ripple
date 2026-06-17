import { useMemo, useState } from "react";
import agentsJson from "./data/agents.json";
import artifactsJson from "./data/artifacts.json";
import roomsJson from "./data/rooms.json";
import rulesJson from "./data/rules.json";
import { AgentPanel } from "./components/AgentPanel";
import { ArtifactPanel } from "./components/ArtifactPanel";
import { BoardView } from "./components/BoardView";
import { EventLog } from "./components/EventLog";
import { ExportRunButton } from "./components/ExportRunButton";
import { ModeSelect } from "./components/ModeSelect";
import { RealityLayerPanel } from "./components/RealityLayerPanel";
import { RoomPanel } from "./components/RoomPanel";
import { TurnControls } from "./components/TurnControls";
import { buildActiveAgents } from "./engine/memorySystem";
import { createInitialLayers } from "./engine/realityLayers";
import { advanceTurn } from "./engine/ruleEngine";
import type {
  AgentData,
  ArtifactData,
  BoulderAction,
  Mode,
  RoomData,
  RulesData,
  RunState,
  SeedKey,
  SetupSelection,
} from "./engine/types";

const agents = agentsJson as AgentData[];
const rooms = roomsJson as RoomData[];
const artifacts = artifactsJson as ArtifactData[];
const rules = rulesJson as RulesData;

const initialSeeds = agents.reduce<Record<string, SeedKey>>((acc, agent) => {
  acc[agent.id] = "A";
  return acc;
}, {});

function createRunState(selection: SetupSelection): RunState {
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
    boulderPosition: "center",
  };
}

export default function App() {
  const [selectedMode, setSelectedMode] = useState<Mode>("mystery");
  const [selectedSeeds, setSelectedSeeds] = useState<Record<string, SeedKey>>(initialSeeds);
  const [selectedAction, setSelectedAction] = useState<BoulderAction>("observe");
  const [runState, setRunState] = useState<RunState | null>(null);

  const currentRoom = useMemo(
    () => rooms.find((room) => room.id === (runState?.currentRoomId ?? "boulder-room")) ?? rooms[1],
    [runState],
  );
  const boulder = artifacts.find((artifact) => artifact.id === "boulder") ?? artifacts[0];

  function updateSeed(agentId: string, seed: SeedKey) {
    setSelectedSeeds((current) => ({ ...current, [agentId]: seed }));
  }

  function startRun(selection: SetupSelection) {
    setRunState(createRunState(selection));
  }

  function resetRun() {
    setRunState(null);
    setSelectedAction("observe");
  }

  function handleAdvance() {
    setRunState((current) => {
      if (!current) return current;
      return advanceTurn(current, selectedAction, rules);
    });
  }

  if (!runState) {
    return (
      <main className="app">
        <ModeSelect
          agents={agents}
          selectedMode={selectedMode}
          selectedSeeds={selectedSeeds}
          onModeChange={setSelectedMode}
          onSeedChange={updateSeed}
          onStart={startRun}
        />
      </main>
    );
  }

  return (
    <main className="app game-layout">
      <header className="topbar">
        <div>
          <p className="eyebrow">Ripple v0.1</p>
          <h1>The Boulder Build</h1>
        </div>
        <div className="topbar-actions">
          <ExportRunButton state={runState} />
          <button className="ghost-action" onClick={resetRun} type="button">
            New Run
          </button>
        </div>
      </header>

      <section className="main-grid">
        <div className="left-column">
          <BoardView state={runState} room={currentRoom} artifact={boulder} />
          <RealityLayerPanel layers={runState.layers} />
        </div>

        <aside className="right-column">
          <TurnControls
            rules={rules}
            selectedAction={selectedAction}
            onActionChange={setSelectedAction}
            onAdvance={handleAdvance}
          />
          <RoomPanel room={currentRoom} />
          <ArtifactPanel artifact={boulder} state={runState} />
        </aside>
      </section>

      <section className="lower-grid">
        <AgentPanel agents={runState.agents} mode={runState.mode} />
        <EventLog events={runState.events} />
      </section>
    </main>
  );
}
