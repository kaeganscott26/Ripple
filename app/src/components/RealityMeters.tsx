import type { CSSProperties } from "react";
import type { RealityMetricSnapshot } from "../engine/types";
import { pressureKeys, pressureLabels } from "../engine/pressure";

export function RealityMeters({ history }: { history: RealityMetricSnapshot[] }) {
  const latest = history.slice(-1)[0];

  return (
    <section className="panel meter-panel">
      <div>
        <p className="eyebrow">Reality Meters</p>
        <h2>Pressure Trend</h2>
      </div>
      <div className="meter-grid">
        {pressureKeys.map((key) => (
          <TrendMeter
            key={key}
            label={pressureLabels[key]}
            values={history.map((snapshot) => snapshot.pressures[key])}
            value={latest?.pressures[key] ?? 0}
          />
        ))}
        <TrendMeter
          label="RUFS"
          note="how loudly the room treats this event as real"
          values={history.map((snapshot) => snapshot.rufs)}
          value={latest?.rufs ?? 0}
        />
      </div>
    </section>
  );
}

function TrendMeter({ label, note, value, values }: { label: string; note?: string; value: number; values: number[] }) {
  const max = Math.max(...values, 1);
  const previous = values.length > 1 ? values[values.length - 2] : value;
  const delta = value - previous;

  return (
    <article className="trend-meter">
      <div className="trend-meter-header">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="trend-bars" aria-hidden="true">
        {values.map((entry, index) => (
          <span
            key={`${label}-${index}`}
            style={{ "--bar-level": `${Math.max((entry / max) * 100, entry > 0 ? 12 : 4)}%` } as CSSProperties}
          />
        ))}
      </div>
      <p>{delta === 0 ? "steady" : delta > 0 ? `+${delta} this turn` : `${delta} this turn`}</p>
      {note && <p className="meter-note">{note}</p>}
    </article>
  );
}
