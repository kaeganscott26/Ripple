import type { ActiveAgent, ArtifactData, HaloState, InspectorItem, LawState, RoomData, RunState } from "../engine/types";
import type { RulesData } from "../engine/types";
import { explainAgent, explainBoulder, explainHalo, explainLaw } from "../engine/explanations";
import { getLawProgress, pressureBuildMessages } from "../engine/lawProgress";
import { AgentPiece } from "./AgentPiece";

interface RoomBoardViewProps {
  state: RunState;
  room: RoomData;
  artifact: ArtifactData;
  onInspect: (item: InspectorItem) => void;
  rules: RulesData;
}

export function RoomBoardView({ state, room, artifact, onInspect, rules }: RoomBoardViewProps) {
  const boulderLabel = state.boulderName ?? artifact.name;
  const latestLayer = state.layers.perceived.slice(-1)[0];
  const inspectAgent = (agent: ActiveAgent) => onInspect(explainAgent(agent, state.mode));
  const inspectHalo = (haloState: HaloState) => onInspect(explainHalo(haloState));

  return (
    <section className="board-shell room-board-shell" aria-label="Boulder Room board">
      <div className="board-header">
        <div>
          <p className="eyebrow">Room View</p>
          <h2>{room.name}</h2>
        </div>
        <span>Turn {state.turn}</span>
      </div>

      <div className="room-board">
        <div className="board-lane lane-door">Doorway pressure</div>
        <div className="board-lane lane-archive">Archive pull</div>
        <div className="board-center-line" />
        <div className="room-state-chip">{state.boulderPosition === "shifted" ? "Path altered" : "Center weight"}</div>
        <button
          className={`boulder-piece ${state.boulderPosition}`}
          onClick={() => onInspect(explainBoulder(state, artifact))}
          type="button"
        >
          <span>{boulderLabel}</span>
        </button>
        {state.agents.map((agent, index) => (
          <AgentPiece
            agent={agent}
            key={agent.id}
            mode={state.mode}
            onSelect={inspectAgent}
            onSelectHalo={inspectHalo}
            slot={index}
          />
        ))}
      </div>

      <p className="board-state-line">{latestLayer}</p>
      <LawBadges laws={state.laws} onInspect={onInspect} />
      <LawProgress state={state} rules={rules} />
    </section>
  );
}

function LawBadges({ laws, onInspect }: { laws: LawState[]; onInspect: (item: InspectorItem) => void }) {
  if (laws.length === 0) {
    return <p className="quiet-line">No institutional law has formed.</p>;
  }

  return (
    <div className="law-badges">
      {laws.map((law) => (
        <button key={law.id} onClick={() => onInspect(explainLaw(law))} type="button">
          {law.name}
        </button>
      ))}
    </div>
  );
}

function LawProgress({ state, rules }: { state: RunState; rules: RulesData }) {
  const progress = getLawProgress(state, rules);

  if (state.laws.length === 0) {
    return (
      <div className="law-progress">
        <h3>Pressure Building</h3>
        <ul className="compact-list">
          {pressureBuildMessages(state).map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
        <h3>Law Thresholds</h3>
        <ul className="compact-list">
          {progress.map((entry) => (
            <li key={entry.id}>
              {entry.name}:{" "}
              {entry.thresholdStatus
                .map((threshold) => `${threshold.label} ${threshold.current}/${threshold.target}`)
                .join(", ")}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="law-progress">
      <h3>Law Status</h3>
      <ul className="compact-list">
        {progress.map((entry) => (
          <li key={entry.id}>
            {entry.formed
              ? `${entry.name} formed on turn ${entry.formedTurn}.`
              : `${entry.name}: ${entry.thresholdStatus
                  .map((threshold) => `${threshold.label} ${threshold.current}/${threshold.target}`)
                  .join(", ")}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
