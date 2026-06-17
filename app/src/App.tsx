import { useEffect, useMemo, useState } from "react";
import agentsJson from "./data/agents.json";
import artifactsJson from "./data/artifacts.json";
import roomsJson from "./data/rooms.json";
import rulesJson from "./data/rules.json";
import { AgentPanel } from "./components/AgentPanel";
import { ArtifactPanel } from "./components/ArtifactPanel";
import { BoardScaleToggle } from "./components/BoardScaleToggle";
import { CurrentObjectivePanel } from "./components/CurrentObjectivePanel";
import { EventLog } from "./components/EventLog";
import { ExportRunButton } from "./components/ExportRunButton";
import { HowToPlayPanel } from "./components/HowToPlayPanel";
import { ModeSelect } from "./components/ModeSelect";
import { MoodSummary } from "./components/MoodSummary";
import { ObserverInputPanel } from "./components/ObserverInputPanel";
import { RealityLayerPanel } from "./components/RealityLayerPanel";
import { RealityMeters } from "./components/RealityMeters";
import { RoomPanel } from "./components/RoomPanel";
import { RoomBoardView } from "./components/RoomBoardView";
import { SocietyBoardView } from "./components/SocietyBoardView";
import { TurnFeedbackPanel } from "./components/TurnFeedbackPanel";
import { TurnControls } from "./components/TurnControls";
import { advanceTurn } from "./engine/ruleEngine";
import { createRunState } from "./engine/runState";
import type {
  AgentData,
  ArtifactData,
  BoardScaleView,
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
const savedRunKey = "ripple-boulder-build-run-v0.5";

const initialSeeds = agents.reduce<Record<string, SeedKey>>((acc, agent) => {
  acc[agent.id] = "A";
  return acc;
}, {});

function loadSavedRun(): RunState | null {
  try {
    const saved = window.localStorage.getItem(savedRunKey);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as RunState;
    return parsed?.mode && Array.isArray(parsed.events) ? parsed : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [selectedMode, setSelectedMode] = useState<Mode>("mystery");
  const [selectedSeeds, setSelectedSeeds] = useState<Record<string, SeedKey>>(initialSeeds);
  const [selectedAction, setSelectedAction] = useState<BoulderAction>("observe");
  const [boulderNameInput, setBoulderNameInput] = useState("");
  const [boardScale, setBoardScale] = useState<BoardScaleView>("room");
  const [runState, setRunState] = useState<RunState | null>(() => loadSavedRun());

  useEffect(() => {
    if (runState) {
      window.localStorage.setItem(savedRunKey, JSON.stringify(runState));
    }
  }, [runState]);

  const currentRoom = useMemo(
    () => rooms.find((room) => room.id === (runState?.currentRoomId ?? "boulder-room")) ?? rooms[1],
    [runState],
  );
  const boulder = artifacts.find((artifact) => artifact.id === "boulder") ?? artifacts[0];
  const latestObserverInput = runState?.observerInputs.slice(-1)[0];
  const latestMetrics = runState?.meterHistory.slice(-1)[0];

  function updateSeed(agentId: string, seed: SeedKey) {
    setSelectedSeeds((current) => ({ ...current, [agentId]: seed }));
  }

  function startRun(selection: SetupSelection) {
    setRunState(createRunState(agents, selection));
  }

  function resetRun() {
    window.localStorage.removeItem(savedRunKey);
    setRunState(null);
    setSelectedAction("observe");
    setBoulderNameInput("");
  }

  function handleAdvance() {
    setRunState((current) => {
      if (!current) return current;
      return advanceTurn(current, selectedAction, rules, { boulderName: boulderNameInput });
    });
    if (selectedAction === "name") {
      setBoulderNameInput("");
    }
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
          <p className="eyebrow">Ripple v0.5</p>
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
          <CurrentObjectivePanel />
          <BoardScaleToggle value={boardScale} onChange={setBoardScale} />
          {boardScale === "room" ? (
            <RoomBoardView state={runState} room={currentRoom} artifact={boulder} rules={rules} />
          ) : (
            <SocietyBoardView state={runState} />
          )}
          <RealityMeters history={runState.meterHistory} />
          <RealityLayerPanel layers={runState.layers} />
        </div>

        <aside className="right-column">
          <HowToPlayPanel />
          <TurnControls
            rules={rules}
            selectedAction={selectedAction}
            boulderNameInput={boulderNameInput}
            onActionChange={setSelectedAction}
            onBoulderNameChange={setBoulderNameInput}
            onAdvance={handleAdvance}
          />
          <TurnFeedbackPanel feedback={runState.lastTurnFeedback} />
          <MoodSummary metrics={latestMetrics} />
          <ObserverInputPanel input={latestObserverInput} />
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
