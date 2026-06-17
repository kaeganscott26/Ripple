import type { ArtifactData, LawState, RoomData, RunState } from "../engine/types";
import type { RulesData } from "../engine/types";
import { getLawProgress, pressureBuildMessages } from "../engine/lawProgress";
import { AgentPiece } from "./AgentPiece";

interface RoomBoardViewProps {
  state: RunState;
  room: RoomData;
  artifact: ArtifactData;
  rules: RulesData;
}

export function RoomBoardView({ state, room, artifact, rules }: RoomBoardViewProps) {
  const boulderLabel = state.boulderName ?? artifact.name;
  const latestLayer = state.layers.perceived.slice(-1)[0];

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
        <span className={`boulder-piece ${state.boulderPosition}`}>
          <span>{boulderLabel}</span>
        </span>
        {state.agents.map((agent, index) => (
          <AgentPiece agent={agent} key={agent.id} mode={state.mode} slot={index} />
        ))}
      </div>

      <p className="board-state-line">{latestLayer}</p>
      <LawBadges laws={state.laws} />
      <LawProgress state={state} rules={rules} />
    </section>
  );
}

function LawBadges({ laws }: { laws: LawState[] }) {
  if (laws.length === 0) {
    return <p className="quiet-line">No institutional law has formed.</p>;
  }

  return (
    <div className="law-badges">
      {laws.map((law) => (
        <span key={law.id}>{law.name}</span>
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
