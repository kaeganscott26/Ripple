import type { CSSProperties } from "react";
import type { MeterKey, RealityMetricSnapshot } from "../engine/types";
import { pressureKeys, pressureLabels } from "../engine/pressure";

interface RealityMetersProps {
  history: RealityMetricSnapshot[];
  onSelectMeter: (key: MeterKey) => void;
}

export function RealityMeters({ history, onSelectMeter }: RealityMetersProps) {
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
            meterKey={key}
            label={pressureLabels[key]}
            onSelect={onSelectMeter}
            values={history.map((snapshot) => snapshot.pressures[key])}
            value={latest?.pressures[key] ?? 0}
          />
        ))}
        <TrendMeter
          meterKey="rufs"
          label="RUFS"
          note="how loudly the room treats this event as real"
          onSelect={onSelectMeter}
          values={history.map((snapshot) => snapshot.rufs)}
          value={latest?.rufs ?? 0}
        />
      </div>
    </section>
  );
}

function TrendMeter({
  label,
  meterKey,
  note,
  onSelect,
  value,
  values,
}: {
  label: string;
  meterKey: MeterKey;
  note?: string;
  onSelect: (key: MeterKey) => void;
  value: number;
  values: number[];
}) {
  const max = Math.max(...values, 1);
  const previous = values.length > 1 ? values[values.length - 2] : value;
  const delta = value - previous;

  return (
    <button className="trend-meter" onClick={() => onSelect(meterKey)} type="button">
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
    </button>
  );
}
