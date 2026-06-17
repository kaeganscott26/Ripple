import type { ArtifactData, LawState, RoomData, RunState } from "../engine/types";

interface BoardViewProps {
  state: RunState;
  room: RoomData;
  artifact: ArtifactData;
}

export function BoardView({ state, room, artifact }: BoardViewProps) {
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
