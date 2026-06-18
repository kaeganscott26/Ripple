import type { InspectorItem, RunState, SocietyNodeKey } from "../engine/types";
import { explainSocietyNode } from "../engine/explanations";
import { buildSocietySummary } from "../engine/realityMetrics";

export function SocietyBoardView({ onInspect, state }: { onInspect: (item: InspectorItem) => void; state: RunState }) {
  const summary = buildSocietySummary(state);
  const metrics = state.meterHistory.slice(-1)[0];
  const inspectNode = (key: SocietyNodeKey) => onInspect(explainSocietyNode(key, state));

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
        <Node className="node-room" label="Boulder Room" onSelect={() => inspectNode("boulder-room")} value={summary.dominantPressureLabel} />
        <Node className="node-social" label="Social Reality" onSelect={() => inspectNode("social-reality")} value={summary.socialEffect} />
        <Node
          className="node-institutional"
          label="Institutional Reality"
          onSelect={() => inspectNode("institutional-reality")}
          value={summary.institutionalEffect}
        />
        <Node className="node-laws" label="Laws" onSelect={() => inspectNode("laws")} value={`${state.laws.length} formed`} />
        <Node
          className="node-observer"
          label="Observer Inputs"
          onSelect={() => inspectNode("observer-inputs")}
          value={summary.observerEffect}
        />
        <Node
          className="node-rufs"
          label="RUFS / Mood"
          onSelect={() => inspectNode("rufs-mood")}
          value={`RUFS ${metrics?.rufs ?? 0} | ${metrics?.label ?? "Stable"}`}
        />
        <button className="inner-board-lock" onClick={() => inspectNode("nested-simulation")} type="button">
          {summary.nestedStatus}
        </button>
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

function Node({
  className,
  label,
  onSelect,
  value,
}: {
  className: string;
  label: string;
  onSelect: () => void;
  value: string;
}) {
  return (
    <button className={`society-node ${className}`} onClick={onSelect} type="button">
      <strong>{label}</strong>
      <span>{value}</span>
    </button>
  );
}
