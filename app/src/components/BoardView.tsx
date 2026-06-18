import type { ArtifactData, LawState, RoomData, RunState } from "../engine/types";
import type { RulesData } from "../engine/types";
import { formatMetricValue } from "../engine/formatting";
import { getLawProgress, pressureBuildMessages } from "../engine/lawProgress";

interface BoardViewProps {
  state: RunState;
  room: RoomData;
  artifact: ArtifactData;
  rules: RulesData;
}

export function BoardView({ state, room, artifact, rules }: BoardViewProps) {
  const boulderLabel = state.boulderName ?? artifact.name;

  return (
    <section className="board-shell" aria-label="2D board">
      <div className="board-header">
        <div>
          <p className="eyebrow">Current Room</p>
          <h2>{room.name}</h2>
        </div>
        <span>Turn {state.turn}</span>
      </div>

      <div className="board-grid">
        <div className="room-node muted">Doorway Room</div>
        <div className="room-node active">
          <span className={`boulder-token ${state.boulderPosition}`}>{boulderLabel}</span>
        </div>
        <div className="room-node muted">Archive Room</div>
      </div>

      <div className="pressure-strip">
        <Pressure label="Witness" value={state.pressures.witness} />
        <Pressure label="Named Weight" value={state.pressures.namedWeight} />
        <Pressure label="Institution" value={state.pressures.institution} />
        <Pressure label="Concern" value={state.pressures.concern} />
      </div>

      <LawBadges laws={state.laws} />
      <LawProgress state={state} rules={rules} />
    </section>
  );
}

function Pressure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
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
                .map((threshold) => `${threshold.label} ${formatMetricValue(threshold.current)}/${formatMetricValue(threshold.target)}`)
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
                  .map((threshold) => `${threshold.label} ${formatMetricValue(threshold.current)}/${formatMetricValue(threshold.target)}`)
                  .join(", ")}`}
          </li>
        ))}
      </ul>
    </div>
  );
}
