import type { CSSProperties } from "react";
import type { MeterKey, RealityMetricSnapshot } from "../engine/types";
import { formatMetricDelta, formatMetricValue } from "../engine/formatting";
import { pressureKeys, pressureLabels } from "../engine/pressure";

interface RealityMetersProps {
  history: RealityMetricSnapshot[];
  onSelectMeter: (key: MeterKey) => void;
  selectedMeterKey?: MeterKey;
}

export function RealityMeters({ history, onSelectMeter, selectedMeterKey }: RealityMetersProps) {
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
            selected={selectedMeterKey === key}
            values={history.map((snapshot) => snapshot.pressures[key])}
            value={latest?.pressures[key] ?? 0}
          />
        ))}
        <TrendMeter
          meterKey="rufs"
          label="RUFS"
          note="how loudly the room treats this event as real"
          onSelect={onSelectMeter}
          selected={selectedMeterKey === "rufs"}
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
  selected,
  value,
  values,
}: {
  label: string;
  meterKey: MeterKey;
  note?: string;
  onSelect: (key: MeterKey) => void;
  selected?: boolean;
  value: number;
  values: number[];
}) {
  const max = Math.max(...values, 1);
  const previous = values.length > 1 ? values[values.length - 2] : value;
  const delta = value - previous;

  return (
    <button className={`trend-meter ${selected ? "selected-meter" : ""}`} onClick={() => onSelect(meterKey)} type="button">
      <div className="trend-meter-header">
        <span>{label}</span>
        <strong>{formatMetricValue(value)}</strong>
      </div>
      <div className="trend-bars" aria-hidden="true">
        {values.map((entry, index) => (
          <span
            key={`${label}-${index}`}
            style={{ "--bar-level": `${Math.max((entry / max) * 100, entry > 0 ? 12 : 4)}%` } as CSSProperties}
          />
        ))}
      </div>
      <p>{delta === 0 ? "steady" : `${formatMetricDelta(delta)} this turn`}</p>
      {note && <p className="meter-note">{note}</p>}
    </button>
  );
}
