import { useEffect, useMemo, useState } from "react";
import agentsJson from "./data/agents.json";
import layerCardsJson from "./data/layerCards.json";
import rulesJson from "./data/rules.json";
import {
  archiveDocumentById,
  archiveDocumentBySourceFile,
  archiveDocuments,
  nextArchiveDocument,
} from "./data/archiveDocuments";
import { buildStorySpaces } from "./data/boardSpaces";
import { canonAlternates } from "./data/canon/alternates";
import { canonArtifacts } from "./data/canon/artifacts";
import { canonCharacters } from "./data/canon/characters";
import { diceRuleSummary } from "./data/canon/dice";
import { ArchiveView } from "./components/ArchiveView";
import { ExportRunButton } from "./components/ExportRunButton";
import { ModeSelect } from "./components/ModeSelect";
import { RealityMeters } from "./components/RealityMeters";
import { resolveBoardTurn, normalizeBoardTurnState, possibleLandingSpaces, nestedSimulationProgress } from "./engine/boardTurnEngine";
import { createRunState } from "./engine/runState";
import type { AgentData, BoardLanding, LayerCard, Mode, RulesData, RunState, SeedKey, SetupSelection, StorySpace } from "./engine/types";

const agents = agentsJson as AgentData[];
const layerCards = layerCardsJson as LayerCard[];
const rules = rulesJson as RulesData;
const storySpaces = buildStorySpaces();
const savedRunKey = "ripple-living-board-run-v0.9";

type SecondaryView = "board" | "archive" | "glossary" | "meters" | "society" | "experimental";

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

function spaceByLanding(landing?: BoardLanding): StorySpace | undefined {
  if (!landing) return undefined;
  return storySpaces.find((space) => space.id === landing.spaceId);
}

export default function App() {
  const [selectedMode, setSelectedMode] = useState<Mode>("vague");
  const [selectedSeeds, setSelectedSeeds] = useState<Record<string, SeedKey>>(initialSeeds);
  const [runState, setRunState] = useState<RunState | null>(() => loadSavedRun());
  const [activeView, setActiveView] = useState<SecondaryView>("board");
  const [selectedArchiveDocumentId, setSelectedArchiveDocumentId] = useState(archiveDocuments[0]?.id ?? "");

  useEffect(() => {
    if (runState) window.localStorage.setItem(savedRunKey, JSON.stringify(runState));
  }, [runState]);

  const boardTurn = runState ? normalizeBoardTurnState(runState) : undefined;
  const currentAgent = runState && boardTurn ? runState.agents[boardTurn.currentAgentIndex] ?? runState.agents[0] : undefined;
  const lastLanding = boardTurn?.landings.slice(-1)[0];
  const lastSpace = spaceByLanding(lastLanding);
  const selectedArchiveDocument = archiveDocumentById(selectedArchiveDocumentId) ?? archiveDocuments[0];
  const progress = runState ? nestedSimulationProgress(runState) : undefined;

  function updateSeed(agentId: string, seed: SeedKey) {
    setSelectedSeeds((current) => ({ ...current, [agentId]: seed }));
  }

  function startRun(selection: SetupSelection) {
    setRunState(createRunState(agents, selection));
    setActiveView("board");
  }

  function resetRun() {
    window.localStorage.removeItem(savedRunKey);
    setRunState(null);
    setActiveView("board");
  }

  function rollTurn() {
    setRunState((current) => (current ? resolveBoardTurn(current, storySpaces, rules) : current));
    setActiveView("board");
  }

  function readSource(sourceFile?: string) {
    const document = archiveDocumentBySourceFile(sourceFile);
    if (!document) return;
    setSelectedArchiveDocumentId(document.id);
    setActiveView("archive");
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
    <main className="app living-board-app">
      <header className="board-topbar">
        <div>
          <p className="eyebrow">Ripple Living Board</p>
          <h1>Roll. Move. Reveal. Remember.</h1>
          <p className="safety-line">
            Fictional, symbolic board game. Not proof of simulation, not diagnosis, not command, not replacement care.
          </p>
        </div>
        <div className="topbar-actions">
          <ExportRunButton state={runState} onExport={() => setRunState((current) => (current ? { ...current, exportedRun: true } : current))} />
          <button className="ghost-action" onClick={resetRun} type="button">
            New Run
          </button>
        </div>
      </header>

      <nav className="secondary-nav" aria-label="Ripple views">
        {(["board", "archive", "glossary", "meters", "society"] as SecondaryView[]).map((view) => (
          <button className={activeView === view ? "selected" : ""} key={view} onClick={() => setActiveView(view)} type="button">
            {view}
          </button>
        ))}
        {runState.mode === "experimental" && (
          <button className={activeView === "experimental" ? "selected" : ""} onClick={() => setActiveView("experimental")} type="button">
            experimental
          </button>
        )}
      </nav>

      {activeView === "board" && boardTurn && currentAgent && (
        <section className={`board-main mode-${runState.mode}`}>
          <div className="board-status-strip">
            <span>Mode: {runState.mode}</span>
            <span>Round: {boardTurn.currentRound}</span>
            <span>Turn: {runState.turn}</span>
            <span>Current: {currentAgent.name}</span>
          </div>

          <LivingBoard state={runState} spaces={storySpaces} onReadSource={readSource} />

          <aside className="turn-console">
            <CurrentTurnCard currentAgentName={currentAgent.name} round={boardTurn.currentRound} />
            <DicePanel landing={lastLanding} />
            <button className="primary-action roll-action" onClick={rollTurn} type="button">
              {lastLanding ? `Next Turn: Roll for ${currentAgent.name}` : `Roll for ${currentAgent.name}`}
            </button>
            <RevealCard landing={lastLanding} space={lastSpace} onReadSource={readSource} />
            {progress && <NestedGoal progressRemaining={progress.remaining} unlocked={progress.unlocked} />}
          </aside>
        </section>
      )}

      {activeView === "archive" && selectedArchiveDocument && (
        <ArchiveView
          agents={agents}
          documents={archiveDocuments}
          layerCards={layerCards}
          onNext={() => setSelectedArchiveDocumentId(nextArchiveDocument(selectedArchiveDocument.id, 1).id)}
          onPrevious={() => setSelectedArchiveDocumentId(nextArchiveDocument(selectedArchiveDocument.id, -1).id)}
          onReturnToRoom={() => setActiveView("board")}
          onSelectDocument={setSelectedArchiveDocumentId}
          selectedDocument={selectedArchiveDocument}
          storyBoulders={[]}
        />
      )}

      {activeView === "glossary" && <GlossaryView />}
      {activeView === "meters" && <MetersView state={runState} />}
      {activeView === "society" && boardTurn && <SocietyView roomState={boardTurn.roomState} societyState={boardTurn.societyState} />}
      {activeView === "experimental" && <ExperimentalView state={runState} spaces={storySpaces} onReadSource={readSource} />}
    </main>
  );
}

function LivingBoard({ onReadSource, spaces, state }: { onReadSource: (sourceFile?: string) => void; spaces: StorySpace[]; state: RunState }) {
  const boardTurn = normalizeBoardTurnState(state);
  const currentAgentId = boardTurn.currentAgentId;
  const visibleStart = Math.max(0, (boardTurn.boardPositions[currentAgentId] ?? 0) - 12);
  const visibleSpaces = spaces.slice(visibleStart, visibleStart + 36);

  return (
    <section className="board-table" aria-label="Living board">
      <div className="outer-track" aria-label="Character path spaces">
        {visibleSpaces.map((space, localIndex) => {
          const absoluteIndex = visibleStart + localIndex;
          const agentsHere = state.agents.filter((agent) => boardTurn.boardPositions[agent.id] === absoluteIndex);
          const landed = boardTurn.lastLandingSpaceId === space.id;
          const hidden = state.mode === "mystery" && !landed;

          return (
            <button
              className={`board-space-tile ${landed ? "landed" : ""}`}
              key={space.id}
              onClick={() => onReadSource(space.sourceFile)}
              type="button"
            >
              <span>{absoluteIndex + 1}</span>
              <strong>{hidden ? "Hidden Space" : space.title}</strong>
              <small>{state.mode === "experimental" ? `${space.alternateTitle} / ${space.spaceIndex}` : space.mirrorsChapter}</small>
              <div className="token-row">
                {agentsHere.map((agent) => (
                  <i className={agent.id === currentAgentId ? "current" : ""} key={agent.id}>
                    {agent.name.slice(0, 1)}
                  </i>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="center-glass">
        <p className="eyebrow">Center Glass</p>
        <h2>{boardTurn.landings.slice(-1)[0]?.spaceTitle ?? "The glass is waiting."}</h2>
        <p>{boardTurn.landings.slice(-1)[0]?.resultText ?? "Roll the dice. The board will render the next reality."}</p>
      </div>

      <div className="character-paths" aria-label="Character paths">
        {state.agents.map((agent) => {
          const path = boardTurn.characterPaths[agent.id];
          const canon = canonCharacters.find((entry) => entry.id === agent.id);

          return (
            <article className={agent.id === currentAgentId ? "current" : ""} key={agent.id}>
              <strong>{agent.name}</strong>
              <span>{canon?.pathName}</span>
              <small>{path?.currentBranch ?? canon?.startingBranch}</small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function CurrentTurnCard({ currentAgentName, round }: { currentAgentName: string; round: number }) {
  return (
    <section className="console-card">
      <p className="eyebrow">Current Turn</p>
      <h2>{currentAgentName}</h2>
      <p>Round {round}. Roll movement, render reality, check artifact, reveal the landing.</p>
    </section>
  );
}

function DicePanel({ landing }: { landing?: BoardLanding }) {
  return (
    <section className="console-card dice-panel">
      <p className="eyebrow">Four Dice</p>
      <div className="dice-grid">
        <Die label="Move 1" value={landing?.dice.dieA} />
        <Die label="Move 2" value={landing?.dice.dieB} />
        <Die label="Reality" value={landing?.dice.realityDie} detail={landing?.dice.realityOutcome} />
        <Die label="Artifact" value={landing?.dice.artifactDie} detail={landing?.artifactName} />
      </div>
      <p>{landing ? `Movement: ${landing.movementText}` : diceRuleSummary.join(" ")}</p>
    </section>
  );
}

function Die({ detail, label, value }: { detail?: string; label: string; value?: number }) {
  return (
    <div className="die-face">
      <span>{label}</span>
      <strong>{value ?? "-"}</strong>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function RevealCard({
  landing,
  onReadSource,
  space,
}: {
  landing?: BoardLanding;
  onReadSource: (sourceFile?: string) => void;
  space?: StorySpace;
}) {
  if (!landing) {
    return (
      <section className="console-card reveal-card empty">
        <p className="eyebrow">Landing Reveal</p>
        <h2>Roll to reveal the first space.</h2>
        <p>The same board space can become an intervention, ripple, or missed intervention depending on the reality die.</p>
      </section>
    );
  }

  return (
    <section className="console-card reveal-card">
      <p className="eyebrow">Landing Reveal</p>
      <h2>{landing.agentName} lands on {landing.spaceTitle}</h2>
      <dl>
        <dt>Movement</dt>
        <dd>{landing.movementText}</dd>
        <dt>Mirrors</dt>
        <dd>{landing.mirrorsChapter} - {space?.chapterTitle}</dd>
        <dt>Reality die</dt>
        <dd>{landing.revealedOutcome}</dd>
        <dt>What the board reveals</dt>
        <dd>{landing.plainMeaning}</dd>
        <dt>{landing.agentName}'s reading</dt>
        <dd>{landing.characterReading}</dd>
        <dt>Artifact effect</dt>
        <dd>{landing.artifactEffect}</dd>
        <dt>Result</dt>
        <dd>{landing.resultText}</dd>
      </dl>
      <div className="reveal-actions">
        <button className="secondary-action compact-action" onClick={() => onReadSource(landing.sourceFile)} type="button">
          Read Source
        </button>
        <button className="ghost-action compact-action" onClick={() => onReadSource(space?.sourceLinks?.[1])} type="button">
          Read Chapter
        </button>
      </div>
    </section>
  );
}

function NestedGoal({ progressRemaining, unlocked }: { progressRemaining: string[]; unlocked: boolean }) {
  return (
    <section className="console-card nested-goal">
      <p className="eyebrow">Locked Goal</p>
      <h2>Create the room that creates the next room.</h2>
      <p>{unlocked ? "Nested Simulation is ready to open." : `Locked: ${progressRemaining.slice(0, 3).join("; ")}`}</p>
    </section>
  );
}

function GlossaryView() {
  return (
    <section className="secondary-view">
      <div className="view-header">
        <p className="eyebrow">Glossary</p>
        <h2>Plain Terms</h2>
      </div>
      <div className="glossary-grid">
        {layerCards.map((card) => (
          <article className="panel" key={card.id}>
            <h3>{card.name}</h3>
            <p>{card.plainLanguageMeaning}</p>
            <small>{card.sourceFile}</small>
          </article>
        ))}
      </div>
      <BoundaryPanel />
    </section>
  );
}

function MetersView({ state }: { state: RunState }) {
  return (
    <section className="secondary-view">
      <div className="view-header">
        <p className="eyebrow">Diagnostics</p>
        <h2>Meters</h2>
      </div>
      <RealityMeters history={state.meterHistory} onSelectMeter={() => undefined} />
    </section>
  );
}

function SocietyView({ roomState, societyState }: { roomState: string; societyState: string }) {
  return (
    <section className="secondary-view society-view">
      <div className="view-header">
        <p className="eyebrow">Society</p>
        <h2>Shared Reality State</h2>
      </div>
      <article className="panel">
        <h3>Room State</h3>
        <p>{roomState}</p>
      </article>
      <article className="panel">
        <h3>Society State</h3>
        <p>{societyState}</p>
      </article>
    </section>
  );
}

function ExperimentalView({
  onReadSource,
  spaces,
  state,
}: {
  onReadSource: (sourceFile?: string) => void;
  spaces: StorySpace[];
  state: RunState;
}) {
  const previews = useMemo(() => possibleLandingSpaces(state, spaces), [spaces, state]);

  return (
    <section className="secondary-view experimental-view">
      <div className="view-header">
        <p className="eyebrow">Experimental</p>
        <h2>Engine Room</h2>
      </div>
      <div className="experimental-grid">
        <article className="panel">
          <h3>Possible Landings</h3>
          <div className="preview-list">
            {previews.map((preview) => (
              <button key={`${preview.rollTotal}-${preview.space.id}`} onClick={() => onReadSource(preview.space.sourceFile)} type="button">
                <span>Roll {preview.rollTotal}</span>
                <strong>{preview.label}</strong>
                <small>{preview.detail}</small>
              </button>
            ))}
          </div>
        </article>
        <article className="panel">
          <h3>Artifact Logic</h3>
          <ul className="compact-list">
            {canonArtifacts.map((artifact) => (
              <li key={artifact.id}>
                <strong>{artifact.name}:</strong> {artifact.effectText}
              </li>
            ))}
          </ul>
        </article>
        <article className="panel">
          <h3>Alternate Route</h3>
          <ul className="compact-list">
            {canonAlternates.map((alternate) => (
              <li key={alternate.id}>
                {alternate.order}. {alternate.title} / {alternate.mirrorsChapter}
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

function BoundaryPanel() {
  return (
    <article className="panel boundary-panel">
      <h3>Boundary</h3>
      <p>
        Ripple is fictional and symbolic. It is not proof that fiction is secretly real, not a diagnosis tool, not a command
        system, and not a replacement for treatment, community, rest, food, medication, therapy, sleep, sobriety, or
        emergency help.
      </p>
    </article>
  );
}
