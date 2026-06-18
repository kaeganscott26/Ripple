import type { CSSProperties } from "react";
import type { MeterKey, RealityMetricSnapshot } from "../engine/types";
import { formatMetricValue, formatPercent } from "../engine/formatting";

interface MoodSummaryProps {
  metrics?: RealityMetricSnapshot;
  onSelectMeter: (key: MeterKey) => void;
  selectedMeterKey?: MeterKey;
}

export function MoodSummary({ metrics, onSelectMeter, selectedMeterKey }: MoodSummaryProps) {
  if (!metrics) {
    return null;
  }

  return (
    <section className="panel mood-panel">
      <p className="eyebrow">Mood Output</p>
      <button className={`mood-heading ${selectedMeterKey === "mood" ? "selected-meter" : ""}`} onClick={() => onSelectMeter("mood")} type="button">
        {metrics.label} <span>{formatMetricValue(metrics.mood)}/100</span>
      </button>
      <div className="driver-grid">
        <Driver label="Safety" meterKey="safety" onSelect={onSelectMeter} selected={selectedMeterKey === "safety"} value={metrics.safety} />
        <Driver label="Agency" meterKey="agency" onSelect={onSelectMeter} selected={selectedMeterKey === "agency"} value={metrics.agency} />
        <Driver label="Trust" meterKey="trust" onSelect={onSelectMeter} selected={selectedMeterKey === "trust"} value={metrics.trust} />
        <Driver label="Meaning" meterKey="meaning" onSelect={onSelectMeter} selected={selectedMeterKey === "meaning"} value={metrics.meaning} />
      </div>
      <p className="quiet-line">Happiness is an output. RUFS is the loudness of perceived reality.</p>
    </section>
  );
}

function Driver({
  label,
  meterKey,
  onSelect,
  selected,
  value,
}: {
  label: string;
  meterKey: MeterKey;
  onSelect: (key: MeterKey) => void;
  selected?: boolean;
  value: number;
}) {
  return (
    <button className={`driver-meter ${selected ? "selected-meter" : ""}`} onClick={() => onSelect(meterKey)} type="button">
      <span>{label}</span>
      <strong>{formatMetricValue(value)}</strong>
      <i style={{ "--driver-level": formatPercent(value) } as CSSProperties} />
    </button>
  );
}
