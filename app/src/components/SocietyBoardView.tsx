import type { RunState } from "../engine/types";
import { buildSocietySummary } from "../engine/realityMetrics";

export function SocietyBoardView({ state }: { state: RunState }) {
  const summary = buildSocietySummary(state);
  const metrics = state.meterHistory.slice(-1)[0];

  return (
    <section className="board-shell society-board-shell" aria-label="Society board">
      <div className="board-header">
        <div>
          <p className="eyebrow">Society View</p>
          <h2>Wider Frame</h2>
        </div>
        <span>Turn {state.turn}</span>
      </div>

      <div className="society-board">
        <div className="society-link link-social" />
        <div className="society-link link-institutional" />
        <div className="society-link link-laws" />
        <div className="society-link link-observer" />
        <Node className="node-room" label="Boulder Room" value={summary.dominantPressureLabel} />
        <Node className="node-social" label="Social Reality" value={summary.socialEffect} />
        <Node className="node-institutional" label="Institutional Reality" value={summary.institutionalEffect} />
        <Node className="node-laws" label="Laws" value={`${state.laws.length} formed`} />
        <Node className="node-observer" label="Observer Inputs" value={summary.observerEffect} />
        <Node className="node-rufs" label="RUFS / Mood" value={`RUFS ${metrics?.rufs ?? 0} | ${metrics?.label ?? "Stable"}`} />
        <div className="inner-board-lock">{summary.nestedStatus}</div>
      </div>

      <dl className="society-summary">
        <dt>Frame Question</dt>
        <dd>{summary.frameQuestion}</dd>
        <dt>Local Effect</dt>
        <dd>{summary.localEffect}</dd>
      </dl>
    </section>
  );
}

function Node({ className, label, value }: { className: string; label: string; value: string }) {
  return (
    <article className={`society-node ${className}`}>
      <strong>{label}</strong>
      <span>{value}</span>
    </article>
  );
}
