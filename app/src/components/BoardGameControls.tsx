import type { BoardLanding, BoardSpacePreview, InspectorItem, RunState, StorySpace } from "../engine/types";
import { formatMetricDelta, formatMetricValue } from "../engine/formatting";
import { normalizeBoardTurnState, possibleLandingSpaces, nestedSimulationProgress } from "../engine/boardTurnEngine";

interface BoardGameControlsProps {
  state: RunState;
  storySpaces: StorySpace[];
  onInspect: (item: InspectorItem) => void;
  onRoll: () => void;
  onSelectCharacter: (agentId: string) => void;
}

const pressureLabels = {
  witness: "Witness",
  namedWeight: "Named Weight",
  institution: "Institutional Pressure",
  concern: "Concern",
};

export function BoardGameControls({ onInspect, onRoll, onSelectCharacter, state, storySpaces }: BoardGameControlsProps) {
  const boardTurn = normalizeBoardTurnState(state);
  const currentAgent = state.agents[boardTurn.currentAgentIndex] ?? state.agents[0];
  const previews = possibleLandingSpaces(state, storySpaces);
  const lastLanding = boardTurn.landings.slice(-1)[0];
  const latestRoundSummary = boardTurn.roundSummaries.slice(-1)[0];
  const progress = nestedSimulationProgress(state);

  return (
    <section className="board-shell living-board-shell" aria-label="Living board loop">
      <div className="board-header">
        <div>
          <p className="eyebrow">Living Board</p>
          <h2>Roll. Move. Reveal.</h2>
        </div>
        <span>Round {boardTurn.currentRound}</span>
      </div>

      <TurnOrderPanel
        completedTurns={boardTurn.completedTurns}
        currentAgentId={currentAgent.id}
        onSelectCharacter={onSelectCharacter}
        state={state}
      />

      <div className="dice-row">
        <div>
          <span>Current character</span>
          <strong>{currentAgent.name}</strong>
          <p>{boardTurn.lastDiceRoll ? `Last roll: ${boardTurn.lastDiceRoll.dieA} + ${boardTurn.lastDiceRoll.dieB} = ${boardTurn.lastDiceRoll.total}` : "No dice rolled yet."}</p>
        </div>
        <button className="primary-action" onClick={onRoll} type="button">
          Roll Dice
        </button>
      </div>

      <BoardTrack currentAgentId={currentAgent.id} state={state} storySpaces={storySpaces} onInspect={onInspect} />

      <BoardSpacePreviewPanel previews={previews} state={state} onInspect={onInspect} />

      {lastLanding && <LandingReveal landing={lastLanding} onInspect={onInspect} state={state} storySpaces={storySpaces} />}

      {latestRoundSummary && (
        <RoundSummaryPanel
          round={latestRoundSummary.round}
          spaces={latestRoundSummary.landedSpaces}
          characters={latestRoundSummary.charactersMoved}
          strongestMeterChange={latestRoundSummary.strongestMeterChange}
          laws={latestRoundSummary.lawsFormed.map((law) => law.name)}
          societyEffect={latestRoundSummary.societyEffect}
        />
      )}

      <NestedSimulationPanel progress={progress} />
    </section>
  );
}

function TurnOrderPanel({
  completedTurns,
  currentAgentId,
  onSelectCharacter,
  state,
}: {
  completedTurns: string[];
  currentAgentId: string;
  onSelectCharacter: (agentId: string) => void;
  state: RunState;
}) {
  return (
    <div className="turn-order-panel">
      {state.agents.map((agent) => (
        <button
          className={`${agent.id === currentAgentId ? "current" : ""} ${completedTurns.includes(agent.id) ? "done" : ""}`}
          key={agent.id}
          onClick={() => onSelectCharacter(agent.id)}
          type="button"
        >
          <strong>{agent.name}</strong>
          <span>{agent.id === currentAgentId ? "Taking turn" : completedTurns.includes(agent.id) ? "Moved" : "Waiting"}</span>
        </button>
      ))}
    </div>
  );
}

function BoardTrack({
  currentAgentId,
  onInspect,
  state,
  storySpaces,
}: {
  currentAgentId: string;
  onInspect: (item: InspectorItem) => void;
  state: RunState;
  storySpaces: StorySpace[];
}) {
  const boardTurn = normalizeBoardTurnState(state);

  return (
    <div className="story-track" aria-label="Story Space track">
      {storySpaces.map((space, index) => {
        const agentsHere = state.agents.filter((agent) => boardTurn.boardPositions[agent.id] === index);
        return (
          <button
            className={`story-space ${boardTurn.lastLandingSpaceId === space.id ? "landed" : ""}`}
            key={space.id}
            onClick={() => onInspect(spaceInspector(space))}
            type="button"
          >
            <span>{index + 1}</span>
            <strong>{state.mode === "mystery" && boardTurn.lastLandingSpaceId !== space.id ? "Hidden Space" : space.title}</strong>
            <small>{state.mode === "experimental" ? space.sourceTitle : space.type}</small>
            <div className="space-pieces">
              {agentsHere.map((agent) => (
                <i className={agent.id === currentAgentId ? "active" : ""} key={agent.id}>
                  {agent.name.charAt(0)}
                </i>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function BoardSpacePreviewPanel({
  onInspect,
  previews,
  state,
}: {
  onInspect: (item: InspectorItem) => void;
  previews: BoardSpacePreview[];
  state: RunState;
}) {
  const intro =
    state.mode === "experimental"
      ? "Here are the possible futures. Roll to see which one becomes real."
      : state.mode === "vague"
        ? "Possible landings are visible as short hints."
        : "The board keeps possible landings mostly hidden until the dice decide.";

  return (
    <div className={`preview-panel mode-${state.mode}`}>
      <div>
        <h3>Possible Spaces</h3>
        <p>{intro}</p>
      </div>
      <div className="preview-grid">
        {previews.map((preview) => (
          <button
            disabled={preview.visibility === "hidden"}
            key={`${preview.rollTotal}-${preview.space.id}`}
            onClick={() => onInspect(spaceInspector(preview.space))}
            type="button"
          >
            <span>Roll {preview.rollTotal}</span>
            <strong>{preview.label}</strong>
            <small>{preview.detail}</small>
          </button>
        ))}
      </div>
    </div>
  );
}

function LandingReveal({
  landing,
  onInspect,
  state,
  storySpaces,
}: {
  landing: BoardLanding;
  onInspect: (item: InspectorItem) => void;
  state: RunState;
  storySpaces: StorySpace[];
}) {
  const space = storySpaces.find((entry) => entry.id === landing.spaceId);

  return (
    <div className="landing-reveal">
      <p className="eyebrow">Landing Reveal</p>
      <h3>
        {landing.agentName} rolled {landing.dice.dieA} + {landing.dice.dieB} = {landing.dice.total}
      </h3>
      <h2>{landing.spaceTitle}</h2>
      <dl>
        <dt>Source</dt>
        <dd>{landing.sourceTitle} · {landing.sourceFile}</dd>
        <dt>What this means</dt>
        <dd>{landing.plainMeaning}</dd>
        <dt>{landing.agentName}'s reading</dt>
        <dd>{landing.characterReading}</dd>
        <dt>Room response</dt>
        <dd>{landing.roomResponse}</dd>
      </dl>
      <div className="meter-change-grid">
        {Object.entries(landing.meterEffects).map(([key, value]) => (
          <div key={key}>
            <span>{pressureLabels[key as keyof typeof pressureLabels]}</span>
            <strong>{formatMetricDelta(value)}</strong>
          </div>
        ))}
      </div>
      <div className="reveal-actions">
        {space && (
          <button className="secondary-action compact-action" onClick={() => onInspect(spaceInspector(space))} type="button">
            Inspect Space
          </button>
        )}
        <span>{state.boardTurn.currentAgentId === landing.agentId ? "Round complete" : "Next character is ready."}</span>
      </div>
    </div>
  );
}

function RoundSummaryPanel({
  characters,
  laws,
  round,
  societyEffect,
  spaces,
  strongestMeterChange,
}: {
  characters: string[];
  laws: string[];
  round: number;
  societyEffect: string;
  spaces: string[];
  strongestMeterChange: string;
}) {
  return (
    <div className="round-summary">
      <h3>Round {round} Summary</h3>
      <p>{societyEffect}</p>
      <ul className="compact-list">
        <li>Characters moved: {characters.join(", ") || "None"}</li>
        <li>Spaces landed on: {spaces.join(", ") || "None"}</li>
        <li>{strongestMeterChange}</li>
        <li>Laws formed: {laws.join(", ") || "None"}</li>
      </ul>
    </div>
  );
}

function NestedSimulationPanel({ progress }: { progress: ReturnType<typeof nestedSimulationProgress> }) {
  const completed = [
    `${formatMetricValue(progress.completedRounds)}/${progress.roundGoal} rounds`,
    `${formatMetricValue(progress.charactersLanded)}/${progress.characterGoal} characters landed`,
    `${formatMetricValue(progress.lawsFormed)}/${progress.lawGoal} laws`,
    `${formatMetricValue(progress.sourceDocumentsUsed)}/${progress.sourceGoal} sources`,
  ];

  return (
    <div className="nested-progress">
      <h3>{progress.unlocked ? "Nested Simulation Ready" : "Nested Simulation Locked"}</h3>
      <p>The room unlocks the next simulation by remembering enough to build another room.</p>
      <div className="nested-progress-grid">
        {completed.map((entry) => (
          <span key={entry}>{entry}</span>
        ))}
        <span>{progress.exportedRun ? "export logged" : "export needed"}</span>
        <span>{progress.simulationSeedGenerated ? "seed generated" : "seed needed"}</span>
      </div>
      {!progress.unlocked && <p className="quiet-line">Remaining: {progress.remaining.join("; ")}.</p>}
    </div>
  );
}

function spaceInspector(space: StorySpace): InspectorItem {
  return {
    id: space.id,
    kind: "story-boulder",
    title: space.title,
    summary: space.shortMeaning,
    details: [
      `Type: ${space.type}`,
      `Layer Pull: ${space.relatedLayerIds.join(", ") || "active room pressure"}`,
      `Trigger Pattern: ${space.triggerPattern}`,
      `Related Story Weights: ${space.relatedStoryWeightIds.join(", ") || "none"}`,
      space.experimentalText,
    ],
    typeLabel: "Board Space",
    sourceFile: space.sourceFile,
    plainLanguageMeaning: space.plainMeaning,
    whyItMatters: space.vagueText,
    affects: Object.entries(space.baseMeterEffects).map(([key, value]) => `${pressureLabels[key as keyof typeof pressureLabels]} ${formatMetricDelta(value)}`),
    suggestedNextAction: "Roll dice to see whether this possible space becomes real.",
  };
}
