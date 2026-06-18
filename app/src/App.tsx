import { useEffect, useMemo, useState } from "react";
import agentsJson from "./data/agents.json";
import artifactsJson from "./data/artifacts.json";
import layerCardsJson from "./data/layerCards.json";
import roomsJson from "./data/rooms.json";
import rulesJson from "./data/rules.json";
import storyBouldersJson from "./data/storyBoulders.json";
import {
  archiveDocumentById,
  archiveDocumentBySourceFile,
  archiveDocuments,
  nextArchiveDocument,
} from "./data/archiveDocuments";
import { buildStorySpaces } from "./data/boardSpaces";
import { ActiveInspectionSummary } from "./components/ActiveInspectionSummary";
import { AgentPanel } from "./components/AgentPanel";
import { ArchiveView } from "./components/ArchiveView";
import { ArtifactPanel } from "./components/ArtifactPanel";
import { BoardScaleToggle } from "./components/BoardScaleToggle";
import { BoardGameControls } from "./components/BoardGameControls";
import { CharacterTargetPanel } from "./components/CharacterTargetPanel";
import { CurrentObjectivePanel } from "./components/CurrentObjectivePanel";
import { EventLog } from "./components/EventLog";
import { ExportRunButton } from "./components/ExportRunButton";
import { HowToPlayPanel } from "./components/HowToPlayPanel";
import { InspectorPanel } from "./components/InspectorPanel";
import { LanguagePanel } from "./components/LanguagePanel";
import { ModeSelect } from "./components/ModeSelect";
import { MoodSummary } from "./components/MoodSummary";
import { ObserverInputPanel } from "./components/ObserverInputPanel";
import { RealityLayerPanel } from "./components/RealityLayerPanel";
import { RealityMeters } from "./components/RealityMeters";
import { RoomPanel } from "./components/RoomPanel";
import { RoomBoardView } from "./components/RoomBoardView";
import { SocietyBoardView } from "./components/SocietyBoardView";
import { StoryObjectPanel } from "./components/StoryObjectPanel";
import { TurnFeedbackPanel } from "./components/TurnFeedbackPanel";
import { TurnControls } from "./components/TurnControls";
import { advanceTurn } from "./engine/ruleEngine";
import { createInitialBoardTurnState, normalizeBoardTurnState, resolveBoardTurn } from "./engine/boardTurnEngine";
import { introduceStoryBoulder } from "./engine/storyTurnEngine";
import { createRunState } from "./engine/runState";
import { defaultHelpItem, explainMeter } from "./engine/explanations";
import { explainStoryBoulder, storyBoulderById } from "./engine/storyObjects";
import type {
  AgentData,
  ArtifactData,
  BoardScaleView,
  BoulderAction,
  InspectorItem,
  LayerCard,
  MeterKey,
  Mode,
  RoomData,
  RulesData,
  RunState,
  SeedKey,
  SetupSelection,
  StoryBoulder,
} from "./engine/types";

const agents = agentsJson as AgentData[];
const rooms = roomsJson as RoomData[];
const artifacts = artifactsJson as ArtifactData[];
const storyBoulders = storyBouldersJson as StoryBoulder[];
const layerCards = layerCardsJson as LayerCard[];
const rules = rulesJson as RulesData;
const savedRunKey = "ripple-boulder-build-run-v0.8.1";
const previousV08SavedRunKey = "ripple-boulder-build-run-v0.8";
const previousV07SavedRunKey = "ripple-boulder-build-run-v0.7";
const previousSavedRunKey = "ripple-boulder-build-run-v0.6";

const initialSeeds = agents.reduce<Record<string, SeedKey>>((acc, agent) => {
  acc[agent.id] = "A";
  return acc;
}, {});

function loadSavedRun(): RunState | null {
  try {
    const saved =
      window.localStorage.getItem(savedRunKey) ??
      window.localStorage.getItem(previousV08SavedRunKey) ??
      window.localStorage.getItem(previousV07SavedRunKey) ??
      window.localStorage.getItem(previousSavedRunKey);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as RunState;
    return parsed?.mode && Array.isArray(parsed.events)
      ? {
          ...parsed,
          storyObjectUses: parsed.storyObjectUses ?? [],
          observerInputs: parsed.observerInputs ?? [],
          interpretationHistory: parsed.interpretationHistory ?? [],
          meterHistory: parsed.meterHistory ?? [],
          boardTurn: parsed.boardTurn ?? createInitialBoardTurnState(parsed.agents),
          exportedRun: parsed.exportedRun ?? false,
        }
      : null;
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
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | undefined>();
  const [selectedStoryBoulderId, setSelectedStoryBoulderId] = useState(storyBoulders[0]?.id ?? "");
  const [inspectorItem, setInspectorItem] = useState<InspectorItem>(() => defaultHelpItem());
  const [selectedMeterKey, setSelectedMeterKey] = useState<MeterKey | undefined>();
  const [selectedArchiveDocumentId, setSelectedArchiveDocumentId] = useState(
    archiveDocumentBySourceFile(storyBoulders[0]?.sourceFile)?.id ?? archiveDocuments[0]?.id ?? "",
  );
  const [highlightedArchiveStoryWeightId, setHighlightedArchiveStoryWeightId] = useState<string | undefined>();
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
  const selectedStoryBoulder = storyBoulderById(storyBoulders, selectedStoryBoulderId) ?? storyBoulders[0];
  const selectedAgent = runState?.agents.find((agent) => agent.id === selectedCharacterId);
  const latestObserverInput = runState?.observerInputs.slice(-1)[0];
  const latestMetrics = runState?.meterHistory.slice(-1)[0];
  const storySpaces = useMemo(() => buildStorySpaces(storyBoulders, layerCards), []);
  const sourceDocument = archiveDocumentBySourceFile(inspectorItem.sourceFile);
  const selectedArchiveDocument = archiveDocumentById(selectedArchiveDocumentId) ?? archiveDocuments[0];
  const selectedTargetName = selectedAgent?.name ?? "Room";

  function updateSeed(agentId: string, seed: SeedKey) {
    setSelectedSeeds((current) => ({ ...current, [agentId]: seed }));
  }

  function startRun(selection: SetupSelection) {
    setRunState(createRunState(agents, selection));
  }

  function resetRun() {
    window.localStorage.removeItem(savedRunKey);
    window.localStorage.removeItem(previousV08SavedRunKey);
    window.localStorage.removeItem(previousSavedRunKey);
    setRunState(null);
    setSelectedAction("observe");
    setBoulderNameInput("");
    setSelectedCharacterId(undefined);
    setSelectedStoryBoulderId(storyBoulders[0]?.id ?? "");
    setInspectorItem(defaultHelpItem());
    setSelectedMeterKey(undefined);
  }

  function inspectItem(item: InspectorItem) {
    setInspectorItem(item);
    setSelectedMeterKey(item.kind === "meter" ? (item.id.replace("meter-", "") as MeterKey) : undefined);
  }

  function inspectMeter(key: MeterKey) {
    if (!runState) return;
    setSelectedMeterKey(key);
    setInspectorItem(explainMeter(key, runState.meterHistory, runState.lastTurnFeedback?.interpretation.roomInterpretation));
  }

  function readInspectorSource() {
    if (!sourceDocument) return;
    setSelectedArchiveDocumentId(sourceDocument.id);
    setHighlightedArchiveStoryWeightId(
      inspectorItem.kind === "story-boulder" ? inspectorItem.id.replace("story-boulder-", "") : undefined,
    );
    setBoardScale("archive");
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

  function handleIntroduceStoryBoulder() {
    const storyBoulder = storyBoulderById(storyBoulders, selectedStoryBoulderId);
    if (!storyBoulder) return;

    setRunState((current) => {
      if (!current) return current;
      return introduceStoryBoulder(current, storyBoulder, layerCards, rules, selectedCharacterId);
    });
    inspectItem(explainStoryBoulder(storyBoulder, selectedAgent));
  }

  function handleBoardRoll() {
    setRunState((current) => {
      if (!current) return current;
      const normalized = { ...current, boardTurn: normalizeBoardTurnState(current) };
      return resolveBoardTurn(normalized, storySpaces, rules);
    });
  }

  function handleExportLogged() {
    setRunState((current) => (current ? { ...current, exportedRun: true } : current));
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
          <p className="eyebrow">Ripple v0.8.1</p>
          <h1>The Living Board</h1>
        </div>
        <div className="topbar-actions">
          <ExportRunButton onExport={handleExportLogged} state={runState} />
          <button className="ghost-action" onClick={resetRun} type="button">
            New Run
          </button>
        </div>
      </header>

      <section className="main-grid">
        <div className="left-column">
          <CurrentObjectivePanel />
          <BoardScaleToggle value={boardScale} onChange={setBoardScale} />
          <ActiveInspectionSummary
            compactByDefault={boardScale === "archive"}
            canReadSource={Boolean(sourceDocument)}
            item={inspectorItem}
            onReadSource={sourceDocument ? readInspectorSource : undefined}
            selectedTargetName={selectedTargetName}
            selectedWeightName={selectedStoryBoulder?.name}
          />
          {boardScale === "archive" && selectedArchiveDocument ? (
            <ArchiveView
              agents={agents}
              documents={archiveDocuments}
              highlightedStoryWeightId={highlightedArchiveStoryWeightId}
              layerCards={layerCards}
              onNext={() => setSelectedArchiveDocumentId(nextArchiveDocument(selectedArchiveDocument.id, 1).id)}
              onPrevious={() => setSelectedArchiveDocumentId(nextArchiveDocument(selectedArchiveDocument.id, -1).id)}
              onReturnToRoom={() => setBoardScale("room")}
              onSelectDocument={setSelectedArchiveDocumentId}
              selectedDocument={selectedArchiveDocument}
              storyBoulders={storyBoulders}
            />
          ) : boardScale === "room" ? (
            <>
              <BoardGameControls
                state={runState}
                storySpaces={storySpaces}
                onInspect={inspectItem}
                onRoll={handleBoardRoll}
                onSelectCharacter={setSelectedCharacterId}
              />
              <RoomBoardView
                state={runState}
                room={currentRoom}
                artifact={boulder}
                onInspect={inspectItem}
                onSelectCharacter={setSelectedCharacterId}
                selectedAgent={selectedAgent}
                selectedCharacterId={selectedCharacterId}
                selectedStoryBoulder={selectedStoryBoulder}
                rules={rules}
              />
            </>
          ) : (
            <SocietyBoardView onInspect={inspectItem} state={runState} />
          )}
          {boardScale !== "archive" && (
            <>
              <RealityMeters history={runState.meterHistory} onSelectMeter={inspectMeter} selectedMeterKey={selectedMeterKey} />
              <RealityLayerPanel layers={runState.layers} />
            </>
          )}
        </div>

        <aside className="right-column">
          <HowToPlayPanel />
          <LanguagePanel />
          <CharacterTargetPanel
            agents={runState.agents}
            mode={runState.mode}
            selectedCharacterId={selectedCharacterId}
            selectedBoulder={selectedStoryBoulder}
            storyBoulders={storyBoulders}
            onSelectCharacter={setSelectedCharacterId}
            onInspect={inspectItem}
          />
          <StoryObjectPanel
            agents={runState.agents}
            selectedCharacterId={selectedCharacterId}
            selectedBoulderId={selectedStoryBoulderId}
            storyBoulders={storyBoulders}
            layerCards={layerCards}
            onSelectBoulder={setSelectedStoryBoulderId}
            onInspect={inspectItem}
            onIntroduce={handleIntroduceStoryBoulder}
          />
          <TurnControls
            rules={rules}
            selectedAction={selectedAction}
            boulderNameInput={boulderNameInput}
            onActionChange={setSelectedAction}
            onBoulderNameChange={setBoulderNameInput}
            onAdvance={handleAdvance}
          />
          <TurnFeedbackPanel feedback={runState.lastTurnFeedback} />
          <InspectorPanel
            canReadSource={Boolean(sourceDocument)}
            item={inspectorItem}
            onHelp={() => inspectItem(defaultHelpItem())}
            onReadSource={sourceDocument ? readInspectorSource : undefined}
          />
          <MoodSummary metrics={latestMetrics} onSelectMeter={inspectMeter} selectedMeterKey={selectedMeterKey} />
          <ObserverInputPanel input={latestObserverInput} />
          <RoomPanel room={currentRoom} />
          <ArtifactPanel artifact={boulder} state={runState} />
        </aside>
      </section>

      <section className="lower-grid">
        <AgentPanel
          agents={runState.agents}
          mode={runState.mode}
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={setSelectedCharacterId}
          onInspect={inspectItem}
        />
        <EventLog events={runState.events} />
      </section>
    </main>
  );
}
