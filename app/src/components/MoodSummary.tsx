import type { CSSProperties } from "react";
import type { MeterKey, RealityMetricSnapshot } from "../engine/types";

interface MoodSummaryProps {
  metrics?: RealityMetricSnapshot;
  onSelectMeter: (key: MeterKey) => void;
}

export function MoodSummary({ metrics, onSelectMeter }: MoodSummaryProps) {
  if (!metrics) {
    return null;
  }

  return (
    <section className="panel mood-panel">
      <p className="eyebrow">Mood Output</p>
      <button className="mood-heading" onClick={() => onSelectMeter("mood")} type="button">
        {metrics.label} <span>{metrics.mood}/100</span>
      </button>
      <div className="driver-grid">
        <Driver label="Safety" meterKey="safety" onSelect={onSelectMeter} value={metrics.safety} />
        <Driver label="Agency" meterKey="agency" onSelect={onSelectMeter} value={metrics.agency} />
        <Driver label="Trust" meterKey="trust" onSelect={onSelectMeter} value={metrics.trust} />
        <Driver label="Meaning" meterKey="meaning" onSelect={onSelectMeter} value={metrics.meaning} />
      </div>
      <p className="quiet-line">Happiness is an output. RUFS is the loudness of perceived reality.</p>
    </section>
  );
}

function Driver({
  label,
  meterKey,
  onSelect,
  value,
}: {
  label: string;
  meterKey: MeterKey;
  onSelect: (key: MeterKey) => void;
  value: number;
}) {
  return (
    <button className="driver-meter" onClick={() => onSelect(meterKey)} type="button">
      <span>{label}</span>
      <strong>{value}</strong>
      <i style={{ "--driver-level": `${value}%` } as CSSProperties} />
    </button>
  );
}
